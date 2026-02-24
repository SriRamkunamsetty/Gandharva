"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Music, BarChart3, History, Settings, ArrowLeft, Key, Activity, AlertCircle, WifiOff, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter, usePathname } from "next/navigation";
import AudioUploader from "@/components/AudioUploader";
import RealWaveform from "@/components/RealWaveform";
import SpectrumAnalyzer from "@/components/SpectrumAnalyzer";
import SpectrogramDisplay from "@/components/SpectrogramDisplay";
import InstrumentDetector from "@/components/InstrumentDetector";
import NotesPanel from "@/components/NotesPanel";
import PianoRoll from "@/components/PianoRoll";
import { useAudioWebSocket } from "@/hooks/useAudioWebSocket";
import { Slider } from "@/components/ui/slider";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Note {
  note: string;
  start: number;
  end: number;
  frequency: number;
}

interface AnalysisInfo {
  key: string | null;
  bpm: number | null;
  notes_count: number;
}

interface BackendNote {
  note_name: string;
  frequency: number;
  confidence: number;
  raw_start: number;
  raw_end: number;
}

import Link from "next/link";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Music, label: "Transcription", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: History, label: "History", href: "/history" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const Dashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [instrument, setInstrument] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [backendNotes, setBackendNotes] = useState<BackendNote[]>([]);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [analysisInfo, setAnalysisInfo] = useState<AnalysisInfo | null>(null);
  const [wsAudioId, setWsAudioId] = useState<string | null>(null);
  const [beats, setBeats] = useState<number[]>([]);
  const [errorStatus, setErrorStatus] = useState<"upload" | "connectivity" | "analysis" | null>(null);

  // Audio Playback State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(50);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Initialize AudioContext on mount (will be suspended)
  useEffect(() => {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
      setAudioCtx(new AudioContextClass());
    }
  }, [audioCtx]);

  // Retrieve auth token
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { status: wsStatus, progress, notes: wsNotes, isConnected } = useAudioWebSocket(wsAudioId, token);

  const resumeAudioContext = useCallback(async () => {
    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
  }, [audioCtx]);

  // Handle WebSocket updates
  useEffect(() => {
    if (wsStatus === "complete" && wsNotes.length > 0) {
      setBackendNotes(wsNotes);
      const displayNotes = wsNotes.map(n => ({
        note: n.note_name,
        start: n.raw_start,
        end: n.raw_end,
        frequency: n.frequency,
      }));
      setNotes(displayNotes);
      setIsAnalyzing(false);
      setInstrument("Piano");
      setConfidence(85);
      setErrorStatus(null);

      if (audioId && token) {
        fetch(`${API_URL}/audio/analysis/${audioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.json())
          .then(data => {
            setAnalysisInfo({
              key: data.key,
              bpm: wsNotes[0]?.frequency ? 120 : data.bpm,
              notes_count: data.notes_count,
            });
          })
          .catch(() => { });

        fetch(`${API_URL}/audio/waveform/${audioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (data && data.beats) setBeats(data.beats);
        }).catch(() => { });
      }
    } else if (wsStatus === "failed") {
      setIsAnalyzing(false);
      setErrorStatus("analysis");
    }

    const dynamicNotes = wsNotes as unknown as { bpm?: number; beats?: number[] };
    if (wsNotes && wsNotes.length > 0 && typeof dynamicNotes.bpm === "number") {
      setAnalysisInfo(prev => prev ? { ...prev, bpm: dynamicNotes.bpm || null } : { key: null, bpm: dynamicNotes.bpm || null, notes_count: 0 });
    }
    if (dynamicNotes.beats) {
      setBeats(dynamicNotes.beats);
    }

  }, [wsStatus, wsNotes, audioId, token]);

  const handleFileSelect = useCallback(async (file: File) => {
    setAudioFile(file);
    setIsAnalyzing(true);
    setInstrument(null);
    setNotes([]);
    setBackendNotes([]);
    setAnalysisInfo(null);
    setErrorStatus(null);

    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      // 1. Upload directly to Firebase Storage as requested
      const storageRef = ref(storage, `uploads/${user?.id || 'anon'}/${file.name}_${Date.now()}`);
      console.log("Uploading to Firebase Storage...");
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Firebase Upload Success:", downloadURL);

      // 2. Send lightweight URL to backend
      console.log("Starting analysis via URL:", `${API_URL}/audio/analyze`);
      const analyzeResp = await fetch(`${API_URL}/audio/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ audio_url: downloadURL }),
      });

      if (!analyzeResp.ok) {
        const errorData = await analyzeResp.json().catch(() => ({}));
        console.error("Analysis failed:", errorData);
        setIsAnalyzing(false);
        setErrorStatus("analysis");
        return;
      }

      const analyzeData = await analyzeResp.json();
      setAudioId(analyzeData.audio_id);
      setWsAudioId(analyzeData.audio_id);
    } catch (err: any) {
      console.error("Cloud pipeline connection error:", err);
      setIsAnalyzing(false);
      setErrorStatus("connectivity");
    }
  }, [token]);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioFile]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    // Autoplay compliance: Resume AudioContext on user gesture
    resumeAudioContext();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleHandleRetry = () => {
    setErrorStatus(null);
    if (audioFile) handleFileSelect(audioFile);
  };

  const handleExport = useCallback(async (type: "midi" | "pdf") => {
    if (!audioId || !token) return;

    const endpoint = type === "midi"
      ? `${API_URL}/audio/export/midi/${audioId}`
      : `${API_URL}/audio/export/pdf/${audioId}`;

    try {
      const resp = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "midi" ? `${audioId}.mid` : `${audioId}_sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
    }
  }, [audioId, token]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-lg text-gradient">Gandharva</h1>
        </div>
        <div className="flex items-center gap-6">
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              /* CRITICAL: crossOrigin="anonymous" to avoid Web Audio CORS errors */
              crossOrigin="anonymous"
              style={{ display: "none" }}
            />
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground mr-1">Confidence Filter</span>
            <Slider
              value={[confidenceThreshold]}
              onValueChange={(val: number[]) => setConfidenceThreshold(val[0])}
              max={100}
              step={1}
              className="w-24"
            />
            <span className="text-xs font-display text-primary w-6">{confidenceThreshold}%</span>
          </div>

          <Button
            variant={isPlaying ? "hero" : "secondary"}
            size="sm"
            onClick={togglePlay}
            disabled={!audioUrl}
            className="min-w-24"
          >
            {isPlaying ? "Pause" : "Play Source"}
          </Button>

          {isConnected && (
            <span className="text-[10px] text-green-400 flex items-center gap-1 border border-green-400/20 px-2 py-1 rounded-md bg-green-400/5 hidden md:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Pipeline
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <motion.aside
          className="w-72 border-r border-border p-4 space-y-4 overflow-y-auto hidden lg:block"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <AudioUploader onFileSelect={handleFileSelect} />
          <InstrumentDetector
            instrument={instrument}
            confidence={confidence}
            isAnalyzing={isAnalyzing}
          />

          {/* Key & BPM Card */}
          <AnimatePresence>
            {analysisInfo && (
              <motion.div
                className="glass rounded-xl p-4 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm font-display text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-violet-400" />
                  Music Analysis
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Key</p>
                    <p className="text-lg font-display text-primary mt-1">
                      {analysisInfo.key ?? "—"}
                    </p>
                  </div>
                  <div className="glass rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">BPM</p>
                    <p className="text-lg font-display text-primary mt-1">
                      {analysisInfo.bpm ? analysisInfo.bpm.toFixed(0) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{analysisInfo.notes_count} notes detected</span>
                  <Activity className="h-3 w-3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>

        {/* Center Panel */}
        <motion.main
          className="flex-1 p-4 space-y-4 overflow-y-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Mobile upload */}
          <div className="lg:hidden">
            <AudioUploader onFileSelect={handleFileSelect} />
          </div>

          {/* Error States UI */}
          <AnimatePresence>
            {errorStatus && (
              <motion.div
                className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="bg-destructive/10 p-2 rounded-lg">
                  {errorStatus === "connectivity" ? <WifiOff className="h-5 w-5 text-destructive" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-display text-destructive">
                    {errorStatus === "upload" ? "Upload Failed" : errorStatus === "connectivity" ? "Network Error" : "Analysis Failed"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {errorStatus === "upload" ? "We couldn't upload your audio file. Check your internet." :
                      errorStatus === "connectivity" ? "Unable to reach the transcription engine." :
                        "An error occurred while analyzing the audio. Please try again."}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleHandleRetry} className="text-xs flex items-center gap-2">
                  <RefreshCcw className="h-3 w-3" />
                  Retry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing progress bar */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                className="glass rounded-xl p-4 space-y-2"
                initial={{ opacity: 0, scaleY: 0.8 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.8 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing audio...</span>
                  <span className="text-primary font-display">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-[10px] text-muted-foreground">
                  Status: {wsStatus} {isConnected ? "(live)" : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Play Component Sync */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RealWaveform
              audioId={audioId}
              token={token}
              duration={audioRef.current?.duration || null}
            />
            <SpectrumAnalyzer
              audioElement={audioRef.current}
              isActive={!!audioUrl}
              audioCtx={audioCtx}
            />
          </div>

          <PianoRoll
            notes={backendNotes}
            audioElement={audioRef.current}
            isPlaying={isPlaying}
            confidenceThreshold={confidenceThreshold}
            beats={beats}
          />

          <SpectrogramDisplay audioId={audioId} token={token} />

          {/* Mobile instrument + notes + analysis */}
          <div className="lg:hidden space-y-4">
            <InstrumentDetector
              instrument={instrument}
              confidence={confidence}
              isAnalyzing={isAnalyzing}
            />
            {analysisInfo && (
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-display text-foreground mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-violet-400" />
                  Music Analysis
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Key</p>
                    <p className="text-lg font-display text-primary">{analysisInfo.key ?? "—"}</p>
                  </div>
                  <div className="glass rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">BPM</p>
                    <p className="text-lg font-display text-primary">{analysisInfo.bpm?.toFixed(0) ?? "—"}</p>
                  </div>
                </div>
              </div>
            )}
            <NotesPanel
              notes={notes}
              isAnalyzing={isAnalyzing}
              onExportMidi={() => handleExport("midi")}
              onExportPdf={() => handleExport("pdf")}
            />
          </div>
        </motion.main>

        {/* Right Panel */}
        <motion.aside
          className="w-72 border-l border-border p-4 overflow-y-auto hidden lg:block"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <NotesPanel
            notes={notes}
            isAnalyzing={isAnalyzing}
            onExportMidi={() => handleExport("midi")}
            onExportPdf={() => handleExport("pdf")}
          />
        </motion.aside>
      </div>

      {/* Bottom nav */}
      <nav className="glass-strong border-t border-border px-2 py-2 flex justify-around z-20">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${pathname === item.href || (item.label === "Transcription" && pathname === "/dashboard")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
