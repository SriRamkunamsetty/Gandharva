"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Activity, LayoutDashboard, History as HistoryIcon, BarChart3, Settings as SettingsIcon, Music4, Download, Loader2, ArrowLeft } from "lucide-react";
import HistoryPreview from "@/components/HistoryPreview";
import NavButton from "@/components/NavButton";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export default function HistoryPage() {
    const { user, token } = useAuth();

    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?.id) return;

        const q = query(
            collection(db, "tracks"),
            where("user_id", "==", user.id),
            orderBy("created_at", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tracksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate()?.toISOString() || new Date().toISOString()
            }));
            setFiles(tracksData);
            setIsLoading(false);
        }, (err: any) => {
            console.error("Firestore error:", err);
            setError(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDownload = (audioId: string, type: "midi" | "pdf") => {
        if (!token) return;

        api.get(`/audio/export/${type}/${audioId}`, { responseType: 'blob' })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${audioId}.${type === "midi" ? "mid" : "pdf"}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch(console.error);
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">

            {/* Sidebar */}
            <aside className="w-20 md:w-64 border-r border-white/10 bg-background/50 backdrop-blur-md flex flex-col justify-between p-4 z-20">
                <div className="flex flex-col gap-4 h-full">
                    <Link href="/" className="flex items-center gap-2 mt-4 mb-8 justify-center md:justify-start">
                        <Activity className="w-6 h-6 text-neon-cyan" />
                        <h1 className="font-display font-bold text-xl tracking-wider text-white hidden md:block">GANDARVA</h1>
                    </Link>

                    <nav className="flex flex-col gap-2">
                        <Link href="/dashboard"><NavButton icon={<LayoutDashboard />} label="Dashboard" /></Link>
                        <NavButton icon={<HistoryIcon />} label="History" active />
                        <Link href="/analytics"><NavButton icon={<BarChart3 />} label="Analytics" /></Link>
                        <Link href="/settings"><NavButton icon={<SettingsIcon />} label="Settings" /></Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
                {/* Dynamic Background */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                </div>

                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <ArrowLeft className="w-4 h-4 text-zinc-400" />
                            </button>
                        </Link>
                        <h2 className="font-display font-semibold tracking-wide text-lg text-zinc-100 uppercase italic">Transcription Archive</h2>
                    </div>
                </header>

                <div className="flex-1 p-6 z-10 overflow-y-auto max-w-7xl mx-auto w-full">

                    <div className="glass rounded-2xl p-6 shadow-xl border border-white/10">
                        <h3 className="font-semibold text-white/90 text-lg mb-6">Your Past Transcriptions</h3>

                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                                Failed to load library. Please try again.
                            </div>
                        )}

                        {!isLoading && !error && files?.length === 0 && (
                            <div className="text-center py-16 text-zinc-500 font-medium bg-background/40 rounded-xl border border-dashed border-white/10">
                                You haven't analyzed any audio files yet.
                                <div className="mt-4">
                                    <Link href="/dashboard" className="text-neon-cyan hover:underline">Go to Dashboard to upload</Link>
                                </div>
                            </div>
                        )}

                        {!isLoading && files && files.length > 0 && (
                            <div className="grid gap-4">
                                {files.map((file: any) => (
                                    <div key={file.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-background/60 hover:bg-background/80 border border-white/5 transition-colors gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg bg-violet-glow/10 flex items-center justify-center flex-shrink-0 border border-violet-glow/20 shadow-[0_0_15px_rgba(124,77,255,0.1)]">
                                                <Music4 className="w-6 h-6 text-violet-glow" />
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <p className="font-medium text-white truncate max-w-[200px] sm:max-w-xs">{file.original_filename}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tighter ${file.status === "complete" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                                        file.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                                            "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                                        }`}>
                                                        {file.status.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                        {new Date(file.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mini Preview Thumbnail */}
                                            <div className="hidden md:block">
                                                <HistoryPreview notes={file.notes || []} />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                                            <button
                                                onClick={() => handleDownload(file.id, "midi")}
                                                disabled={file.status !== "complete"}
                                                className="px-4 py-2 text-sm font-medium text-zinc-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white/5 transition-colors"
                                            >
                                                MIDI
                                            </button>
                                            <button
                                                onClick={() => handleDownload(file.id, "pdf")}
                                                disabled={file.status !== "complete"}
                                                className="px-4 py-2 text-sm font-medium text-zinc-300 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-white/5 transition-colors"
                                            >
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
