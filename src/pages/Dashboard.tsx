import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Home, Music, BarChart3, History, Settings, Mic, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import SpectrogramDisplay from "@/components/SpectrogramDisplay";
import InstrumentDetector from "@/components/InstrumentDetector";
import NotesPanel from "@/components/NotesPanel";

interface Note {
  note: string;
  start: number;
  end: number;
  frequency: number;
}

// Simulate AI analysis with mock data
const simulateAnalysis = (): Promise<{ instrument: string; confidence: number; notes: Note[] }> => {
  return new Promise((resolve) => {
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
    }, 2000);
  });
};

const NAV_ITEMS = [
  { icon: Home, label: "Home", active: false },
  { icon: Music, label: "Transcription", active: true },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: History, label: "History", active: false },
  { icon: Settings, label: "Settings", active: false },
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-lg text-gradient">Gandharva</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "hero"}
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
          >
            <Mic className="h-4 w-4 mr-1" />
            {isRecording ? "Stop" : "Record"}
          </Button>
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

          <WaveformVisualizer audioFile={audioFile} />
          <SpectrogramDisplay audioFile={audioFile} />

          {/* Pitch graph placeholder */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-display text-foreground mb-2">Pitch Graph (Hz vs Time)</h3>
            {notes.length > 0 ? (
              <div className="h-32 flex items-end gap-1 px-2">
                {notes.map((n, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      background: "var(--gradient-accent)",
                      height: `${(n.frequency / 600) * 100}%`,
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Pitch data will appear after analysis</p>
              </div>
            )}
          </div>

          {/* Mobile instrument + notes */}
          <div className="lg:hidden space-y-4">
            <InstrumentDetector
              instrument={instrument}
              confidence={confidence}
              isAnalyzing={isAnalyzing}
            />
            <NotesPanel notes={notes} isAnalyzing={isAnalyzing} />
          </div>
        </motion.main>

        {/* Right Panel */}
        <motion.aside
          className="w-72 border-l border-border p-4 overflow-y-auto hidden lg:block"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <NotesPanel notes={notes} isAnalyzing={isAnalyzing} />
        </motion.aside>
      </div>

      {/* Bottom nav */}
      <nav className="glass-strong border-t border-border px-2 py-2 flex justify-around z-20">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              item.active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              if (item.label === "Home") navigate("/");
            }}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
