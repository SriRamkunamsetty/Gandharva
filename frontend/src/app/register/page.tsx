"use client";

import { useState, useEffect, useRef, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Music, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// --- Inline Background Components (from gandharva-sonic-entry) ---

function AuthWaveformBg() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.008;

            const waves = [
                { amplitude: 40, frequency: 0.008, speed: 1, opacity: 0.08, color: "160, 100%, 60%" },
                { amplitude: 30, frequency: 0.012, speed: 1.5, opacity: 0.06, color: "270, 100%, 65%" },
                { amplitude: 50, frequency: 0.006, speed: 0.7, opacity: 0.05, color: "210, 100%, 60%" },
                { amplitude: 25, frequency: 0.015, speed: 2, opacity: 0.04, color: "320, 100%, 60%" },
            ];

            waves.forEach((wave) => {
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${wave.color}, ${wave.opacity})`;
                ctx.lineWidth = 2;
                for (let x = 0; x < canvas.width; x += 2) {
                    const y =
                        canvas.height / 2 +
                        Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
                        Math.sin(x * wave.frequency * 0.5 + time * wave.speed * 0.8) * wave.amplitude * 0.5;
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });

            animationId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.7 }} />;
}

function AuthParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener("resize", resize);

        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.5 + 0.1,
            hue: Math.random() > 0.5 ? 270 : 210,
            pulse: Math.random() * Math.PI * 2,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.speedX; p.y += p.speedY; p.pulse += 0.02;
                if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                const op = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
                const sz = p.size * (0.8 + 0.2 * Math.sin(p.pulse));
                ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${op})`; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, sz * 3, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${op * 0.15})`; ctx.fill();
            });
            animationId = requestAnimationFrame(draw);
        };
        draw();

        return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

function AuthEqualizer({ count = 9, className = "" }: { count?: number; className?: string }) {
    return (
        <div className={`flex items-end gap-1 h-8 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="equalizer-bar w-1"
                    style={{
                        "--min-h": `${4 + Math.random() * 4}px`,
                        "--max-h": `${16 + Math.random() * 16}px`,
                        "--duration": `${0.6 + Math.random() * 0.8}s`,
                        animationDelay: `${i * 0.1}s`,
                        height: `${8 + Math.random() * 12}px`,
                    } as CSSProperties}
                />
            ))}
        </div>
    );
}

// --- Register Page ---

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    const validate = () => {
        const newErrors: { name?: string; email?: string; password?: string } = {};
        if (!name || name.trim().length < 2) newErrors.name = "Artist name required";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Valid email required";
        if (!password || password.length < 6) newErrors.password = "Min 6 characters";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
        setLoading(true);
        setErrors({});

        try {
            // 1. Register User via JSON
            const regResp = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!regResp.ok) {
                const data = await regResp.json().catch(() => ({}));
                setErrors({ general: data.detail || "Registration failed. User might exist." });
                setShake(true); setTimeout(() => setShake(false), 500);
                setLoading(false);
                return;
            }

            // 2. Auto-login after successful registration
            const loginResp = await fetch(`${API_URL}/auth/login/access-token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            });

            if (!loginResp.ok) {
                // Fallback: send to login
                router.push("/login?registered=true");
                return;
            }

            const data = await loginResp.json();
            login(data.access_token, data.user);
            router.push("/dashboard");

        } catch {
            setErrors({ general: "Connection failed. Is the backend running?" });
            setShake(true); setTimeout(() => setShake(false), 500);
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4" style={{ background: "var(--gradient-cosmic)" }}>
            <AuthWaveformBg />
            <AuthParticles />

            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <motion.div
                    className="glass-card p-8 md:p-10"
                    animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <AuthEqualizer count={9} className="mb-4" />
                        <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-foreground neon-glow font-display">
                            Join Gandharva
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 font-body">Create Your Artist Profile</p>
                    </div>

                    {errors.general && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-lg text-sm text-center"
                            style={{ background: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))" }}
                        >
                            {errors.general}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground font-display mb-2 block">Artist Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="neon-input rounded-lg"
                                placeholder="Your stage name"
                                style={{
                                    background: "hsl(var(--input) / 0.5)",
                                    borderBottom: errors.name ? "2px solid hsl(var(--destructive))" : undefined,
                                }}
                            />
                            {errors.name && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                                    {errors.name}
                                </motion.p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground font-display mb-2 block">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="neon-input rounded-lg"
                                placeholder="artist@gandharva.ai"
                                style={{
                                    background: "hsl(var(--input) / 0.5)",
                                    borderBottom: errors.email ? "2px solid hsl(var(--destructive))" : undefined,
                                }}
                            />
                            {errors.email && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                                    {errors.email}
                                </motion.p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground font-display mb-2 block">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="neon-input rounded-lg pr-12"
                                    placeholder="••••••••"
                                    style={{
                                        background: "hsl(var(--input) / 0.5)",
                                        borderBottom: errors.password ? "2px solid hsl(var(--destructive))" : undefined,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>
                                    {errors.password}
                                </motion.p>
                            )}
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="btn-studio w-full text-sm disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Music className="inline-block mr-2" size={16} />
                            {loading ? "Creating..." : "Create Artist Account"}
                        </motion.button>

                        {/* Back to login */}
                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="btn-secondary-studio w-full text-sm flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </div>
    );
}
