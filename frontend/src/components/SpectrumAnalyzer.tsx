import { useEffect, useRef } from "react";
import { Activity } from "lucide-react";

interface SpectrumAnalyzerProps {
    audioElement: HTMLAudioElement | null;
    isActive: boolean;
    audioCtx: AudioContext | null;
}

const SpectrumAnalyzer = ({ audioElement, isActive, audioCtx }: SpectrumAnalyzerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!audioElement || !isActive || !audioCtx) return;

        // Initialize Analyser if not already done
        if (!analyserRef.current) {
            analyserRef.current = audioCtx.createAnalyser();
            analyserRef.current.fftSize = 2048;

            try {
                sourceRef.current = audioCtx.createMediaElementSource(audioElement);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioCtx.destination);
            } catch (e) {
                console.warn("MediaElementSource already created.");
            }
        }

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !analyserRef.current) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = (width: number, height: number) => {
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#05050A';
            ctx.fillRect(0, 0, width, height);

            const visibleBins = Math.floor(bufferLength * 0.4);
            const barWidth = (width / visibleBins) * 2.5;
            let x = 0;

            for (let i = 0; i < visibleBins; i++) {
                const barHeight = dataArray[i];

                const lightness = 30 + (barHeight / 255) * 40;
                ctx.fillStyle = `hsl(var(--color-neon-cyan-h) var(--color-neon-cyan-s) ${lightness}%)`;

                const y = height - (barHeight / 255) * height;
                ctx.fillRect(x, y, barWidth - 1, height - y);
                x += barWidth;
            }

            animationRef.current = requestAnimationFrame(() => {
                const dpr = window.devicePixelRatio || 1;
                draw(canvas.width / dpr, canvas.height / dpr);
            });
        };

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const dpr = window.devicePixelRatio || 1;

                canvas.width = width * dpr;
                canvas.height = height * dpr;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
                ctx.scale(dpr, dpr);
            }
        });

        observer.observe(container);

        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        const render = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = canvas.width / dpr;
            const cssHeight = canvas.height / dpr;
            draw(cssWidth, cssHeight);
        };
        render();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            observer.disconnect();
        };
    }, [audioElement, isActive, audioCtx]);

    if (!isActive) {
        return (
            <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px]">
                <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm font-display tracking-widest uppercase">Spectrum</p>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-4 min-h-[160px] flex flex-col transition-all duration-300">
            <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--color-neon-cyan)]" />
                Live Spectrum
            </h3>
            <div ref={containerRef} className="w-full flex-1 relative rounded-lg overflow-hidden bg-[#05050A]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            </div>
        </div>
    );
};

export default SpectrumAnalyzer;
