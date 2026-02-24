import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";

interface RealWaveformProps {
    audioId: string | null;
    token: string | null;
    duration: number | null;
}

const API_URL = "http://localhost:8000/api/v1";

const RealWaveform = ({ audioId, token, duration }: RealWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [peaks, setPeaks] = useState<number[] | null>(null);
    const [error, setError] = useState(false);

    // Fetch peaks from backend
    useEffect(() => {
        if (!audioId || !token) {
            setPeaks(null);
            setError(false);
            return;
        }

        fetch(`${API_URL}/audio/waveform/${audioId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Waveform not ready");
                return res.json();
            })
            .then(data => {
                if (data && data.peaks) {
                    setPeaks(data.peaks);
                    setError(false);
                }
            })
            .catch(() => {
                setError(true);
            });
    }, [audioId, token]);

    // Draw peaks to canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !peaks || peaks.length === 0) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const draw = (width: number, height: number) => {
            // Always clear before drawing
            ctx.clearRect(0, 0, width, height);

            // Clear background (since alpha: false, we fill explicitly)
            ctx.fillStyle = "#05050A";
            ctx.fillRect(0, 0, width, height);

            const step = width / peaks.length;
            const midY = height / 2;

            ctx.beginPath();
            ctx.moveTo(0, midY);

            // Draw top half
            for (let i = 0; i < peaks.length; i++) {
                // Peaks are 0-100 mapped from backend
                const val = (peaks[i] / 100) * (height / 2) * 0.9;
                ctx.lineTo(i * step, midY - val);
            }

            // Draw bottom half mirroring
            for (let i = peaks.length - 1; i >= 0; i--) {
                const val = (peaks[i] / 100) * (height / 2) * 0.9;
                ctx.lineTo(i * step, midY + val);
            }

            ctx.closePath();

            // Cyberpunk styling using HSL Token
            ctx.fillStyle = "hsl(var(--color-neon-cyan-h) var(--color-neon-cyan-s) var(--color-neon-cyan-l))";
            ctx.fill();

            // Center spine
            ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, midY);
            ctx.lineTo(width, midY);
            ctx.stroke();
        };

        // Responsive scaling with High-DPI support and immediate redraw
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const dpr = window.devicePixelRatio || 1;

                // A. Set internal physical pixels
                canvas.width = width * dpr;
                canvas.height = height * dpr;

                // B. Set CSS display size
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                // C. Scale context to CSS pixels
                ctx.scale(dpr, dpr);

                // D. Redraw immediately
                draw(width, height);
            }
        });

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [peaks]);

    if (!audioId) {
        return (
            <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px]">
                <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm font-display tracking-widest uppercase">Waveform</p>
            </div>
        );
    }

    if (error || !peaks) {
        return (
            <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px]">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-muted-foreground text-xs animate-pulse">Generating Waveform...</p>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-4 min-h-[160px] flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-display text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--color-neon-cyan)]" />
                    Real Waveform
                </h3>
                {duration && (
                    <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {duration.toFixed(1)}s
                    </span>
                )}
            </div>
            {/* Constraint 3: overflow-hidden on parent wrapper */}
            <div ref={containerRef} className="w-full flex-1 relative rounded-lg overflow-hidden bg-[#05050A]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            </div>
        </div>
    );
};

export default RealWaveform;
