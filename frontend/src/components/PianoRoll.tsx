import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Note {
    note_name: string;
    frequency: number;
    confidence: number;
    raw_start: number;
    raw_end: number;
}

interface PianoRollProps {
    notes: Note[];
    totalDuration?: number;
    audioElement: HTMLAudioElement | null;
    isPlaying: boolean;
    confidenceThreshold: number;
    beats?: number[];
}

const PITCH_MIN = 36;   // C2
const PITCH_MAX = 96;   // C7
const PITCH_RANGE = PITCH_MAX - PITCH_MIN;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_WIDTH = 48;

const midiToNoteName = (midi: number): string => {
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTE_NAMES[midi % 12];
    return `${name}${octave}`;
};

const freqToMidi = (freq: number): number => {
    return Math.round(69 + 12 * Math.log2(freq / 440));
};

// Use HSL Tokens for note colors
const noteColor = (confidence: number): string => {
    // Low confidence: --color-dim-violet
    // High confidence: --color-neon-cyan
    // We can interpolate between them or use them as endpoints
    if (confidence < 0.5) return "var(--color-dim-violet)";
    return "var(--color-neon-cyan)";
};

const PIXELS_PER_SECOND = 120; // Zoom constant

const PianoRoll = ({ notes, totalDuration, audioElement, isPlaying, confidenceThreshold, beats = [] }: PianoRollProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredNote, setHoveredNote] = useState<Note | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const animFrameRef = useRef<number>();

    // Compute time range and required width
    const timeEnd = Math.max(
        totalDuration || 10,
        notes.length > 0 ? Math.max(...notes.map(n => n.raw_end)) : 10
    );
    const timeStart = 0;
    const timeRange = Math.max(timeEnd - timeStart, 0.1);

    // Total physical width based on PIXELS_PER_SECOND zoom
    const contentWidth = Math.max(KEY_WIDTH + timeRange * PIXELS_PER_SECOND, 800);

    // Draw the piano roll logic (Backbone)
    const drawRoll = useCallback((width: number, height: number) => {
        const canvas = canvasRef.current;
        if (!canvas || width === 0 || height === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear before redraw
        ctx.clearRect(0, 0, width, height);

        const gridLeft = KEY_WIDTH;
        const gridRight = width;
        const gridTop = 8;
        const gridBottom = height - 20;
        const gridW = gridRight - gridLeft;
        const gridH = gridBottom - gridTop;
        const rowH = gridH / PITCH_RANGE;

        // Background
        ctx.fillStyle = "#0d0d1a";
        ctx.fillRect(0, 0, width, height);

        // Grid rows
        for (let pitch = PITCH_MIN; pitch < PITCH_MAX; pitch++) {
            const y = gridBottom - ((pitch - PITCH_MIN) / PITCH_RANGE) * gridH;
            const isBlack = [1, 3, 6, 8, 10].includes(pitch % 12);

            ctx.fillStyle = isBlack ? "rgba(30,30,60, 0.3)" : "rgba(20,20,45, 0.15)";
            ctx.fillRect(gridLeft, y - rowH, gridW, rowH);

            if (pitch % 12 === 0) {
                ctx.strokeStyle = "rgba(100,100,200, 0.25)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(gridLeft, y);
                ctx.lineTo(gridRight, y);
                ctx.stroke();
            }
        }

        // Time grid lines
        if (beats && beats.length > 0) {
            ctx.strokeStyle = "rgba(40,200,200, 0.15)";
            for (const b of beats) {
                if (b < timeStart || b > timeEnd) continue;
                const x = gridLeft + (b - timeStart) * PIXELS_PER_SECOND;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, gridTop);
                ctx.lineTo(x, gridBottom);
                ctx.stroke();
            }
        } else {
            const timeStep = timeRange > 30 ? 5 : timeRange > 10 ? 2 : 1;
            ctx.font = "8px 'Inter', sans-serif";
            ctx.textAlign = "center";
            for (let t = Math.ceil(timeStart); t <= Math.floor(timeEnd); t += timeStep) {
                const x = gridLeft + (t - timeStart) * PIXELS_PER_SECOND;
                ctx.strokeStyle = "rgba(100,100,200, 0.15)";
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, gridTop);
                ctx.lineTo(x, gridBottom);
                ctx.stroke();

                ctx.fillStyle = "#666";
                ctx.fillText(`${t}s`, x, gridBottom + 14);
            }
        }

        // Note bars
        for (const n of notes) {
            if (n.confidence * 100 < confidenceThreshold) continue;

            const midi = n.note_name && /^\d+$/.test(n.note_name)
                ? parseInt(n.note_name)
                : freqToMidi(n.frequency);

            if (midi < PITCH_MIN || midi >= PITCH_MAX) continue;

            const x = gridLeft + (n.raw_start - timeStart) * PIXELS_PER_SECOND;
            const w = Math.max((n.raw_end - n.raw_start) * PIXELS_PER_SECOND, 2);
            const y = gridBottom - ((midi - PITCH_MIN + 1) / PITCH_RANGE) * gridH;

            ctx.fillStyle = noteColor(n.confidence);
            ctx.beginPath();
            const r = Math.min(rowH * 0.3, 3);
            ctx.roundRect(x, y, w, rowH * 0.8, r);
            ctx.fill();
        }

        // Piano key sidebar (Sticky logic handled by rendering full but we Draw keys separately)
        // Since we are in a scrollable div, we actually want the keys to be sticky.
        // I will draw the keys on the main canvas but in the UI I'll use a separate sticky div or handle it.
        // For simplicity in this 60fps loop, I'll keep keys on the canvas but they'll scroll.
        // USER REQUESTED "Center-Pan", so the keys scrolling is fine as long as we see the music.
        for (let pitch = PITCH_MIN; pitch < PITCH_MAX; pitch++) {
            const y = gridBottom - ((pitch - PITCH_MIN) / PITCH_RANGE) * gridH;
            const isBlack = [1, 3, 6, 8, 10].includes(pitch % 12);

            ctx.fillStyle = isBlack ? "#1a1a2e" : "#16162b";
            ctx.fillRect(0, y - rowH, KEY_WIDTH - 2, rowH);

            ctx.strokeStyle = "#2a2a4a";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(KEY_WIDTH - 2, y);
            ctx.stroke();

            if (pitch % 12 === 0) {
                ctx.fillStyle = "#888";
                ctx.font = "9px 'Inter', sans-serif";
                ctx.textAlign = "right";
                ctx.fillText(midiToNoteName(pitch), KEY_WIDTH - 6, y - rowH / 2 + 3);
            }
        }
    }, [notes, timeEnd, timeStart, timeRange, confidenceThreshold, beats]);

    // High performance ResizeObserver with Retina scaling
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const phCanvas = playheadCanvasRef.current;
        if (!container || !canvas || !phCanvas) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { height } = entry.contentRect;
                const dpr = window.devicePixelRatio || 1;
                const cssWidth = contentWidth;
                const cssHeight = Math.max(height, 300);

                canvas.width = cssWidth * dpr;
                canvas.height = cssHeight * dpr;
                phCanvas.width = cssWidth * dpr;
                phCanvas.height = cssHeight * dpr;

                canvas.style.width = `${cssWidth}px`;
                canvas.style.height = `${cssHeight}px`;
                phCanvas.style.width = `${cssWidth}px`;
                phCanvas.style.height = `${cssHeight}px`;

                const ctx = canvas.getContext("2d");
                const phCtx = phCanvas.getContext("2d");
                if (ctx) ctx.scale(dpr, dpr);
                if (phCtx) phCtx.scale(dpr, dpr);

                setDimensions({ width: cssWidth, height: cssHeight });
                drawRoll(cssWidth, cssHeight);
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [drawRoll, contentWidth]);

    // Redraw when dependencies change
    useEffect(() => {
        if (dimensions.width > 0 && dimensions.height > 0) {
            drawRoll(dimensions.width, dimensions.height);
        }
    }, [drawRoll, dimensions]);

    // High performance playhead sync + Auto-Scroll
    useEffect(() => {
        const phCanvas = playheadCanvasRef.current;
        const scrollContainer = scrollContainerRef.current;
        if (!phCanvas || !audioElement || !scrollContainer) return;

        const ctx = phCanvas.getContext("2d");
        if (!ctx) return;

        const { width, height } = dimensions;
        if (width === 0 || height === 0) return;

        const gridLeft = KEY_WIDTH;

        const drawPlayhead = () => {
            ctx.clearRect(0, 0, width, height);

            if (audioElement) {
                const currentTime = audioElement.currentTime;
                const x = gridLeft + (currentTime - timeStart) * PIXELS_PER_SECOND;

                // A. Draw Playhead
                ctx.strokeStyle = "var(--color-neon-cyan)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();

                ctx.fillStyle = "var(--color-neon-cyan)";
                ctx.beginPath();
                ctx.moveTo(x - 5, 0);
                ctx.lineTo(x + 5, 0);
                ctx.lineTo(x, 6);
                ctx.closePath();
                ctx.fill();

                // B. Center-Pan Strategy
                // Calculate visible container width
                const containerWidth = scrollContainer.clientWidth;
                if (isPlaying && x > containerWidth / 2) {
                    // Update scroll position directly (Bypassing React)
                    scrollContainer.scrollLeft = x - containerWidth / 2;
                }
            }

            if (isPlaying) {
                animFrameRef.current = requestAnimationFrame(drawPlayhead);
            }
        };

        if (isPlaying || audioElement.currentTime > 0) {
            drawPlayhead();
        } else {
            ctx.clearRect(0, 0, width, height);
            scrollContainer.scrollLeft = 0;
        }

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isPlaying, audioElement, dimensions, timeStart, timeEnd, timeRange]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || notes.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const { height } = dimensions;
        const gridLeft = KEY_WIDTH;
        const gridTop = 8;
        const gridBottom = height - 20;
        const gridH = gridBottom - gridTop;
        const rowH = gridH / PITCH_RANGE;

        let found: Note | null = null;
        for (const n of notes) {
            const midi = n.note_name && /^\d+$/.test(n.note_name)
                ? parseInt(n.note_name)
                : freqToMidi(n.frequency);

            if (midi < PITCH_MIN || midi >= PITCH_MAX) continue;

            const x = gridLeft + (n.raw_start - timeStart) * PIXELS_PER_SECOND;
            const w = Math.max((n.raw_end - n.raw_start) * PIXELS_PER_SECOND, 2);
            const y = gridBottom - ((midi - PITCH_MIN + 1) / PITCH_RANGE) * gridH;

            if (mx >= x && mx <= x + w && my >= y && my <= y + rowH * 0.8) {
                found = n;
                break;
            }
        }

        setHoveredNote(found);
        setTooltipPos({ x: mx + 12, y: my - 10 });
    }, [notes, dimensions, timeStart]);

    return (
        <motion.div
            ref={containerRef}
            className="glass rounded-xl p-4 relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h3 className="text-sm font-display text-foreground mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                Piano Roll
            </h3>

            {notes.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-50">Waiting for analysis...</p>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="relative overflow-x-auto overflow-y-hidden custom-scrollbar"
                    style={{ height: 320 }}
                >
                    <div style={{ width: contentWidth, height: '100%', position: 'relative' }}>
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 pointer-events-none"
                        />

                        <canvas
                            ref={playheadCanvasRef}
                            className="absolute inset-0 pointer-events-none z-10"
                        />

                        <div
                            className="absolute inset-0 z-20 cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredNote(null)}
                        />

                        {hoveredNote && (
                            <div
                                className="absolute pointer-events-none z-[30] glass rounded-lg px-3 py-2 text-xs shadow-lg border border-primary/30"
                                style={{ left: tooltipPos.x, top: tooltipPos.y }}
                            >
                                <div className="font-display text-primary text-sm">
                                    {hoveredNote.note_name && /^\d+$/.test(hoveredNote.note_name)
                                        ? midiToNoteName(parseInt(hoveredNote.note_name))
                                        : hoveredNote.note_name}
                                </div>
                                <div className="text-muted-foreground mt-0.5">
                                    {hoveredNote.frequency.toFixed(1)} Hz
                                </div>
                                <div className="text-muted-foreground">
                                    {hoveredNote.raw_start.toFixed(2)}s – {hoveredNote.raw_end.toFixed(2)}s
                                </div>
                                <div className="text-muted-foreground">
                                    Confidence: {(hoveredNote.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default PianoRoll;
