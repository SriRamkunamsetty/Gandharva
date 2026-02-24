"use client";

import { useEffect, useRef } from "react";

interface Note {
    note_name: string;
    confidence: number;
    raw_start: number;
    raw_end: number;
}

interface HistoryPreviewProps {
    notes: Note[];
}

export default function HistoryPreview({ notes }: HistoryPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !notes || notes.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        ctx.clearRect(0, 0, width, height);

        // Filter by confidence and find time range
        const activeNotes = notes.filter(n => n.confidence > 0.3);
        if (activeNotes.length === 0) return;

        const minTime = Math.min(...activeNotes.map(n => n.raw_start));
        const maxTime = Math.max(...activeNotes.map(n => n.raw_end));
        const timeRange = maxTime - minTime || 1;

        activeNotes.forEach(note => {
            const x = ((note.raw_start - minTime) / timeRange) * width;
            const w = Math.max(2, ((note.raw_end - note.raw_start) / timeRange) * width);

            const freq = note.note_name.charCodeAt(0) * 10 + (parseInt(note.note_name.slice(-1)) || 4) * 20;
            const y = height - (Math.min(1, Math.max(0, (freq - 500) / 500)) * (height - 10) + 5);

            ctx.fillStyle = `hsla(var(--neon-cyan) / ${0.3 + note.confidence * 0.7})`;
            ctx.fillRect(x, y, w, 3);

            ctx.shadowBlur = 4;
            ctx.shadowColor = `hsl(var(--neon-cyan))`;
            ctx.fillRect(x, y, w, 1);
            ctx.shadowBlur = 0;
        });

    }, [notes]);

    return (
        <canvas
            ref={canvasRef}
            className="w-[120px] h-12 bg-black/20 rounded border border-white/5"
        />
    );
}
