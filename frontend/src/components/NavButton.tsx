"use client";

import { ReactNode } from "react";

interface NavButtonProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
}

export default function NavButton({ icon, label, active = false }: NavButtonProps) {
    return (
        <div className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-violet-glow/15 text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            <span className="hidden md:block font-medium">{label}</span>
        </div>
    );
}
