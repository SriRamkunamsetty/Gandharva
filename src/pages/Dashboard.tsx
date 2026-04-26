import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import SpectrogramDisplay from "@/components/SpectrogramDisplay";
import InstrumentDetector from "@/components/InstrumentDetector";
import NotesPanel from "@/components/NotesPanel";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ExportNote } from "@/lib/exporters";

const simulateAnalysis = (): Promise<{ instrument: string; confidence: number; notes: ExportNote[] }> =>
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [instrument, setInstrument] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [notes, setNotes] = useState<ExportNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reopen from history
  useEffect(() => {
    const raw = sessionStorage.getItem("gandharva:reopen");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setFileName(p.file_name);
        setInstrument(p.instrument);
        setConfidence(p.confidence ?? 0);
        setNotes(p.notes ?? []);
        setSavedId(p.id);
        toast.success(`Reopened "${p.title}"`);
      } catch {}
      sessionStorage.removeItem("gandharva:reopen");
    }
  }, []);

  const autoSave = async (data: { instrument: string; confidence: number; notes: ExportNote[]; file: File }) => {
    if (!user) return;
    const prefs = JSON.parse(localStorage.getItem("gandharva:prefs") || "{}");
    if (prefs.autoSave === false) return;
    const { data: row, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: data.file.name.replace(/\.[^.]+$/, ""),
        file_name: data.file.name,
        duration: 0,
        instrument: data.instrument,
        confidence: data.confidence,
        notes: data.notes as any,
        status: "completed",
      })
      .select()
      .single();
    if (error) toast.error(`Save failed: ${error.message}`);
    else {
      setSavedId(row.id);
      toast.success("Saved to History");
    }
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setAudioFile(file);
      setFileName(file.name);
      setIsAnalyzing(true);
      setInstrument(null);
      setNotes([]);
      setSavedId(null);

      const result = await simulateAnalysis();
      setInstrument(result.instrument);
      setConfidence(result.confidence);
      setNotes(result.notes);
      setIsAnalyzing(false);
      autoSave({ ...result, file });
    },
    [user]
  );

  const manualSave = async () => {
    if (!user) {
      toast.error("Sign in to save projects");
      navigate("/auth");
      return;
    }
    if (!notes.length || !instrument) {
      toast.error("Nothing to save yet");
      return;
    }
    setSaving(true);
    const title = fileName?.replace(/\.[^.]+$/, "") ?? `Analysis ${new Date().toLocaleString()}`;
    const { data: row, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title, file_name: fileName, duration: 0,
        instrument, confidence, notes: notes as any, status: "completed",
      })
      .select().single();
    setSaving(false);
    if (error) toast.error(error.message);
    else { setSavedId(row.id); toast.success("Project saved"); }
  };

  const actions = (
    <>
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        AI Engine Ready
      </div>
      {notes.length > 0 && !savedId && (
        <Button size="sm" variant="glass" className="rounded-full" onClick={manualSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
      )}
      <Button
        variant={isRecording ? "destructive" : "hero"}
        size="sm"
        onClick={() => setIsRecording(!isRecording)}
        className="rounded-full"
      >
        <Mic className="h-4 w-4 mr-1.5" />
        {isRecording ? "Stop" : "Record"}
      </Button>
    </>
  );

  return (
    <AppShell
      title={<>Transcription <span className="text-gradient">Studio</span></>}
      subtitle="Upload audio or record live to extract instruments, notes, and pitch."
      actions={actions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] mx-auto">
        <motion.aside className="lg:col-span-3 space-y-5" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <AudioUploader onFileSelect={handleFileSelect} />
          <InstrumentDetector instrument={instrument} confidence={confidence} isAnalyzing={isAnalyzing} />
        </motion.aside>

        <motion.main className="lg:col-span-6 space-y-5" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <WaveformVisualizer audioFile={audioFile} />
          <SpectrogramDisplay audioFile={audioFile} />

          <div className="glass-card glass-card-hover p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="panel-heading text-sm">Pitch Graph</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Frequency (Hz) over time</p>
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
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
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
                <p className="text-xs text-muted-foreground">Pitch data will appear after analysis</p>
              </div>
            )}
          </div>

          <div className="lg:hidden space-y-5">
            <InstrumentDetector instrument={instrument} confidence={confidence} isAnalyzing={isAnalyzing} />
            <NotesPanel notes={notes} isAnalyzing={isAnalyzing} fileName={fileName} />
          </div>
        </motion.main>

        <motion.aside className="lg:col-span-3 hidden lg:block" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}>
          <NotesPanel notes={notes} isAnalyzing={isAnalyzing} fileName={fileName} />
        </motion.aside>
      </div>
    </AppShell>
  );
};

export default Dashboard;
