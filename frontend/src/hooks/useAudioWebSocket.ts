import { useState, useEffect, useCallback, useRef } from "react";

interface WsNote {
    note_name: string;
    frequency: number;
    confidence: number;
    raw_start: number;
    raw_end: number;
}

interface WsMessage {
    status: string;
    poll?: number;
    notes_count?: number;
    processing_time_ms?: number;
    notes?: WsNote[];
    message?: string;
}

interface UseAudioWebSocketReturn {
    status: string;
    progress: number;
    notes: WsNote[];
    notesCount: number;
    processingTimeMs: number | null;
    isConnected: boolean;
    error: string | null;
}

const API_WS_URL = "ws://localhost:8000/api/v1/audio/ws";

export function useAudioWebSocket(
    audioId: string | null,
    token: string | null
): UseAudioWebSocketReturn {
    const [status, setStatus] = useState("idle");
    const [progress, setProgress] = useState(0);
    const [notes, setNotes] = useState<WsNote[]>([]);
    const [notesCount, setNotesCount] = useState(0);
    const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (!audioId || !token) return;

        const ws = new WebSocket(`${API_WS_URL}/${audioId}?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        ws.onmessage = (event) => {
            try {
                const msg: WsMessage = JSON.parse(event.data);
                setStatus(msg.status);

                if (msg.poll) {
                    // Simple progress estimation (0-100)
                    setProgress(Math.min(msg.poll * 2, 95));
                }

                if (msg.status === "complete") {
                    setProgress(100);
                    if (msg.notes) setNotes(msg.notes);
                    if (msg.notes_count !== undefined) setNotesCount(msg.notes_count);
                    if (msg.processing_time_ms !== undefined) setProcessingTimeMs(msg.processing_time_ms);
                } else if (msg.status === "failed") {
                    setError(msg.message ?? "Analysis failed");
                }
            } catch {
                // Ignore parse errors
            }
        };

        ws.onerror = () => {
            setError("WebSocket connection error");
            setIsConnected(false);
        };

        ws.onclose = () => {
            setIsConnected(false);
        };
    }, [audioId, token]);

    // Auto-connect when audioId and token are set
    useEffect(() => {
        if (audioId && token) {
            connect();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [audioId, token, connect]);

    return { status, progress, notes, notesCount, processingTimeMs, isConnected, error };
}
