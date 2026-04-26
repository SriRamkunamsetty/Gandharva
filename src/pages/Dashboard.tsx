import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Music,
  BarChart3,
  History,
  Settings,
  Mic,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import SpectrogramDisplay from "@/components/SpectrogramDisplay";
import InstrumentDetector from "@/components/InstrumentDetector";
import NotesPanel from "@/components/NotesPanel";
import { MusicParticles } from "@/components/AnimatedBackground";

interface Note {
  note: string;
  start: number;
  end: number;
  frequency: number;
}

const simulateAnalysis = (): Promise<{
  instrument: string;
  confidence: number;
  notes: Note[];
}> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        instrument: "Piano",
        confidence: 87,
        notes: [
          { note: "C4", start: 0.12, end: 0.45, frequency: 261.63 },
          { note: "E4", start: 0.48, end: 0.82, frequency: 329.63 },
          { note: "G4", start: 0.85, end: 1.2, frequency: 392.0 },
          { note: "C5", start: 1.25, end: 1.6, frequency: 523.25 },
          { note: "A4", start: 1.65, end: 2.0, frequency: 440.0 },
          { note: "F4", start: 2.05, end: 2.4, frequency: 349.23 },
          { note: "D4", start: 2.45, end: 2.8, frequency: 293.66 },
          { note: "B3", start: 2.85, end: 3.2, frequency: 246.94 },
        ],
      });
    }, 1800);
  });

const NAV_ITEMS = [
  { icon: Home, label: "Home", route: "/" },
  { icon: Music, label: "Transcription", route: "/dashboard", active: true },
  { icon: BarChart3, label: "Analytics", route: "/dashboard" },
  { icon: History, label: "History", route: "/dashboard" },
  { icon: Settings, label: "Settings", route: "/dashboard" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [instrument, setInstrument] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setAudioFile(file);
    setIsAnalyzing(true);
    setInstrument(null);
    setNotes([]);

    const result = await simulateAnalysis();
    setInstrument(result.instrument);
    setConfidence(result.confidence);
    setNotes(result.notes);
    setIsAnalyzing(false);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col gradient-hero overflow-hidden">
      {/* Ambient background orbs — premium depth */}
      <div
        className="ambient-orb"
        style={{
          width: 520,
          height: 520,
          top: -160,
          left: -120,
          background: "hsl(var(--violet-glow) / 0.35)",
        }}
      />
      <div
        className="ambient-orb"
        style={{
          width: 600,
          height: 600,
          bottom: -200,
          right: -160,
          background: "hsl(var(--neon-cyan) / 0.18)",
        }}
      />
      <div
        className="ambient-orb"
        style={{
          width: 400,
          height: 400,
          top: "40%",
          left: "45%",
          background: "hsl(var(--accent) / 0.12)",
        }}
      />
      <MusicParticles />

      {/* Top bar */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full h-9 w-9 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-lg text-gradient tracking-tight">
                Gandharva
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                Studio
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI Engine Ready
          </div>
          <Button
            variant={isRecording ? "destructive" : "hero"}
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
            className="rounded-full"
          >
            <Mic className="h-4 w-4 mr-1.5" />
            {isRecording ? "Stop" : "Record"}
          </Button>
        </motion.div>
      </header>

      {/* Section title */}
      <motion.div
        className="relative z-10 px-6 pt-2 pb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">
          Transcription <span className="text-gradient">Studio</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
          Upload audio or record live to extract instruments, notes, and pitch in
          real-time.
        </p>
      </motion.div>

      {/* Main grid */}
      <div className="relative z-10 flex-1 px-6 pb-28 lg:pb-8 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] mx-auto">
          {/* Left column */}
          <motion.aside
            className="lg:col-span-3 space-y-5"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <AudioUploader onFileSelect={handleFileSelect} />
            <InstrumentDetector
              instrument={instrument}
              confidence={confidence}
              isAnalyzing={isAnalyzing}
            />
          </motion.aside>

          {/* Center column */}
          <motion.main
            className="lg:col-span-6 space-y-5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <WaveformVisualizer audioFile={audioFile} />
            <SpectrogramDisplay audioFile={audioFile} />

            {/* Pitch graph */}
            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="panel-heading text-sm">Pitch Graph</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Frequency (Hz) over time
                  </p>
                </div>
                {notes.length > 0 && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 rounded-full bg-white/5">
                    {notes.length} notes
                  </span>
                )}
              </div>
              {notes.length > 0 ? (
                <div className="h-36 flex items-end gap-1.5 px-1">
                  {notes.map((n, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-md relative group"
                      style={{
                        background: "var(--gradient-accent)",
                        height: `${(n.frequency / 600) * 100}%`,
                        boxShadow: "0 -2px 12px hsl(var(--primary) / 0.25)",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground bg-card px-1.5 py-0.5 rounded border border-border whitespace-nowrap">
                        {n.note}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Pitch data will appear after analysis
                  </p>
                </div>
              )}
            </div>

            {/* Mobile: instrument + notes */}
            <div className="lg:hidden space-y-5">
              <InstrumentDetector
                instrument={instrument}
                confidence={confidence}
                isAnalyzing={isAnalyzing}
              />
              <NotesPanel notes={notes} isAnalyzing={isAnalyzing} />
            </div>
          </motion.main>

          {/* Right column */}
          <motion.aside
            className="lg:col-span-3 hidden lg:block"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <NotesPanel notes={notes} isAnalyzing={isAnalyzing} />
          </motion.aside>
        </div>
      </div>

      {/* Bottom nav — floating Apple-style dock */}
      <motion.nav
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 glass-strong rounded-full px-2 py-2 flex items-center gap-1 border border-border/60"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all ${
              item.active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
            onClick={() => navigate(item.route)}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}
      </motion.nav>

      {/* Desktop side dock */}
      <motion.nav
        className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 glass-strong rounded-2xl px-2 py-3 flex-col items-center gap-1 border border-border/60"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            title={item.label}
            className={`group relative h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              item.active
                ? "bg-primary/15 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
            onClick={() => navigate(item.route)}
          >
            <item.icon className="h-4 w-4" />
            <span className="absolute left-12 px-2 py-1 rounded-md bg-card border border-border text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </span>
          </button>
        ))}
      </motion.nav>
    </div>
  );
};

export default Dashboard;
