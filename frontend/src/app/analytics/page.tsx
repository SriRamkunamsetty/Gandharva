"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Activity, LayoutDashboard, History, Settings, BarChart3, Clock, Zap, Target, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import NavButton from "@/components/NavButton";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AnalyticsPage() {
    const { user, token } = useAuth();
    const [files, setFiles] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalTime: 0, avgConfidence: 0 });

    useEffect(() => {
        if (!user?.id) return;

        const fetchStats = async () => {
            const q = query(collection(db, "tracks"), where("user_id", "==", user.id));
            const snapshot = await getDocs(q);
            const tracks = snapshot.docs.map(doc => doc.data());

            const total = tracks.reduce((acc: number, f: any) => acc + (f.duration || 0), 0);
            // Example aggregation for confidence if available in firestore
            const confidences = tracks.filter(f => f.confidence).map(f => f.confidence);
            const avg = confidences.length ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) : 85;

            setFiles(tracks);
            setStats({ totalTime: total, avgConfidence: Math.round(avg) });
        };

        fetchStats();
    }, [user]);

    const { totalTime, avgConfidence } = stats;

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
            {/* Sidebar */}
            <aside className="w-20 md:w-64 border-r border-white/10 bg-background/50 backdrop-blur-md flex flex-col justify-between p-4 z-20">
                <div className="flex flex-col gap-4 h-full">
                    <Link href="/" className="flex items-center gap-2 mt-4 mb-8 justify-center md:justify-start">
                        <Activity className="w-6 h-6 text-neon-cyan" />
                        <h1 className="font-display font-bold text-xl tracking-wider text-white hidden md:block uppercase">GANDARVA</h1>
                    </Link>

                    <nav className="flex flex-col gap-2">
                        <Link href="/dashboard"><NavButton icon={<LayoutDashboard />} label="Dashboard" /></Link>
                        <Link href="/history"><NavButton icon={<History />} label="History" /></Link>
                        <NavButton icon={<BarChart3 />} label="Analytics" active />
                        <Link href="/settings"><NavButton icon={<Settings />} label="Settings" /></Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <ArrowLeft className="w-4 h-4 text-zinc-400" />
                            </button>
                        </Link>
                        <h2 className="font-display font-semibold tracking-wide text-lg text-zinc-100 uppercase italic">Intelligence Analytics</h2>
                    </div>
                </header>

                <div className="flex-1 p-6 z-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            icon={<Clock className="text-neon-cyan" />}
                            title="Total Transcribed"
                            value={`${(totalTime / 60).toFixed(1)} min`}
                            subtitle="All-time processing volume"
                        />
                        <StatCard
                            icon={<Zap className="text-violet-glow" />}
                            title="Avg. Processing"
                            value="12.4s"
                            subtitle="Speed per minute of audio"
                        />
                        <StatCard
                            icon={<Target className="text-green-400" />}
                            title="Mean Confidence"
                            value={`${avgConfidence}%`}
                            subtitle="AI validation score"
                        />
                    </div>

                    {/* Chart Mockup */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass rounded-2xl p-8 border border-white/10 flex flex-col h-[400px]">
                            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-neon-cyan" />
                                INSTRUMENT DISTRIBUTION
                            </h3>
                            <div className="flex-1 flex items-center justify-center relative">
                                <div className="relative w-48 h-48 rounded-full border-[12px] border-violet-glow/20 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-[12px] border-t-neon-cyan border-r-neon-cyan border-b-transparent border-l-transparent rotate-45" />
                                    <div className="text-center">
                                        <p className="text-3xl font-display font-bold text-white">42%</p>
                                        <p className="text-[10px] text-zinc-500 uppercase">Piano</p>
                                    </div>
                                </div>
                                <div className="ml-12 space-y-4">
                                    <LegendItem color="bg-neon-cyan" label="Piano (42%)" />
                                    <LegendItem color="bg-violet-glow" label="Strings (28%)" />
                                    <LegendItem color="bg-zinc-700" label="Other (30%)" />
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-8 border border-white/10 flex flex-col h-[400px]">
                            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-violet-glow" />
                                WEEKLY ACTIVITY
                            </h3>
                            <div className="flex-1 flex items-end gap-3 pb-4">
                                {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-gradient-to-t from-violet-glow/20 to-neon-cyan/40 rounded-t-lg transition-all group-hover:to-neon-cyan"
                                            style={{ height: `${h}%` }}
                                        />
                                        <span className="text-[10px] text-zinc-500">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon, title, value, subtitle }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass rounded-2xl p-6 border border-white/10 space-y-4"
        >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">{title}</p>
                <h4 className="text-3xl font-display font-bold text-white mt-1">{value}</h4>
                <p className="text-[10px] text-zinc-600 mt-2">{subtitle}</p>
            </div>
        </motion.div>
    );
}

function LegendItem({ color, label }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-zinc-400">{label}</span>
        </div>
    );
}
