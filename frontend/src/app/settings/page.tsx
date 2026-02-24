"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, LayoutDashboard, History, Settings, BarChart3, ArrowLeft, Monitor, Headphones, HardDrive, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import NavButton from "@/components/NavButton";

export default function SettingsPage() {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(d => setDevices(d.filter(device => device.kind === "audioinput")))
                .catch(console.error);
        }
    }, []);

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
                        <Link href="/analytics"><NavButton icon={<BarChart3 />} label="Analytics" /></Link>
                        <NavButton icon={<Settings />} label="Settings" active />
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
                        <h2 className="font-display font-semibold tracking-wide text-lg text-zinc-100 uppercase italic">Control Center</h2>
                    </div>
                </header>

                <div className="flex-1 p-6 z-10 overflow-y-auto max-w-3xl mx-auto w-full space-y-8">
                    {/* Preferences Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-neon-cyan" />
                            PREFERENCES
                        </h3>

                        <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white">High-Contrast Analysis</Label>
                                    <p className="text-xs text-zinc-500">Intensify visualizer colors for better visibility</p>
                                </div>
                                <Switch />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white">Default Export Format</Label>
                                    <p className="text-xs text-zinc-500">Auto-select your preferred download type</p>
                                </div>
                                <Select defaultValue="midi">
                                    <SelectTrigger className="w-32 bg-background border-white/10">
                                        <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="midi">MIDI</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="csv">CSV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Hardware Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <Headphones className="w-5 h-5 text-violet-glow" />
                            HARDWARE
                        </h3>

                        <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-white">Input Device</Label>
                                <Select>
                                    <SelectTrigger className="w-full bg-background border-white/10">
                                        <SelectValue placeholder="Select Microphone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {devices.map(d => (
                                            <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "Default Input"}</SelectItem>
                                        ))}
                                        {devices.length === 0 && <SelectItem value="none">No devices found</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Storage Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-red-500" />
                            DANGER ZONE
                        </h3>

                        <div className="glass rounded-2xl p-6 border border-red-500/20 bg-red-500/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-red-400">Clear Audit History</Label>
                                    <p className="text-xs text-zinc-500">Permanently delete all transcribed sessions</p>
                                </div>
                                <Button variant="destructive" size="sm" className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Purge Data
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
