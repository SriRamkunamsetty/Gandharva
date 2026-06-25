import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Save, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import SpectrogramDisplay from "@/components/SpectrogramDisplay";
import InstrumentDetector from "@/components/InstrumentDetector";
import NotesPanel from "@/components/NotesPanel";
import AppShell from "@/components/layout/AppShell";
import AnalysisProgress, { AnalysisStage } from "@/components/AnalysisProgress";
import InstrumentCandidates, { InstrumentCandidate } from "@/components/InstrumentCandidates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ExportNote } from "@/lib/exporters";
import { fileToBase64, getAudioDuration } from "@/lib/audioUtils";
import { useLiveRecorder } from "@/hooks/useLiveRecorder";

interface AnalyzeResult {
  instrument: string;
  confidence: number;
  notes: ExportNote[];
  candidates?: InstrumentCandidate[];
  tempo_bpm?: number;
  key?: string;
  mood?: string;
  summary?: string;
}

const callAnalyzeAudio = async (
  blob: Blob,
  fileName: string | null,
  onStage: (s: AnalysisStage) => void
): Promise<AnalyzeResult> => {
  onStage("preprocess");
  const { base64, mimeType } = await fileToBase64(blob);
  const duration = await getAudioDuration(blob);
  onStage("features");
  await new Promise((r) => setTimeout(r, 250));
  onStage("classify");
  const { data, error } = await supabase.functions.invoke("analyze-audio", {
    body: { audioBase64: base64, mimeType, fileName, durationHint: duration },
  });
  if (error) throw new Error(error.message ?? "Analysis failed");
  if (data?.error) throw new Error(data.error);
  onStage("pitch");
  await new Promise((r) => setTimeout(r, 200));
  return {
    instrument: data.instrument ?? "Unknown",
    confidence: Math.round(Number(data.confidence ?? 0)),
    notes: Array.isArray(data.notes) ? data.notes : [],
    candidates: Array.isArray(data.candidates) ? data.candidates : undefined,
    tempo_bpm: data.tempo_bpm,
    key: data.key,
    mood: data.mood,
    summary: data.summary,
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [instrument, setInstrument] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [notes, setNotes] = useState<ExportNote[]>([]);
  const [candidates, setCandidates] = useState<InstrumentCandidate[]>([]);
  const [meta, setMeta] = useState<{ tempo?: number; key?: string; mood?: string; summary?: string }>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const liveOffsetRef = useRef(0);

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

  const autoSave = async (data: { instrument: string; confidence: number; notes: ExportNote[]; file: File | { name: string } }) => {
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
      setCandidates([]);
      setMeta({});
      setSavedId(null);
      try {
        const result = await callAnalyzeAudio(file, file.name, setStage);
        setInstrument(result.instrument);
        setConfidence(result.confidence);
        setNotes(result.notes);
        setCandidates(result.candidates ?? [{ name: result.instrument, confidence: result.confidence }]);
        setMeta({ tempo: result.tempo_bpm, key: result.key, mood: result.mood, summary: result.summary });
        setStage("done");
        toast.success(`Detected: ${result.instrument}`);
        autoSave({
          instrument: result.instrument,
          confidence: result.confidence,
          notes: result.notes,
          file,
        });
      } catch (e: any) {
        setStage("error");
        toast.error(e.message ?? "Analysis failed");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [user]
  );

  // Live mic
  const liveRecorder = useLiveRecorder({
    chunkSeconds: 5,
    onChunk: async (blob, index) => {
      try {
        const tmpName = `live-chunk-${index}.webm`;
        const result = await callAnalyzeAudio(blob, tmpName, setStage);
        const offset = liveOffsetRef.current;
        const shifted = result.notes.map((n) => ({
          ...n,
          start: n.start + offset,
          end: n.end + offset,
        }));
        setNotes((prev) => [...prev, ...shifted]);
        if (result.instrument) setInstrument(result.instrument);
        if (result.confidence) setConfidence(result.confidence);
        if (result.candidates?.length) setCandidates(result.candidates);
        liveOffsetRef.current = offset + 5;
        setStage("done");
      } catch (e: any) {
        toast.error(`Live chunk failed: ${e.message ?? e}`);
      }
    },
  });

  const toggleRecording = async () => {
    if (liveRecorder.isRecording) {
      liveRecorder.stop();
      toast.success("Recording stopped");
    } else {
      setNotes([]);
      setCandidates([]);
      setInstrument(null);
      setConfidence(0);
      setFileName("Live Recording");
      liveOffsetRef.current = 0;
      await liveRecorder.start();
      if (!liveRecorder.error) toast.success("Recording — analyzing every 5s");
    }
  };

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
        variant={liveRecorder.isRecording ? "destructive" : "hero"}
        size="sm"
        onClick={toggleRecording}
        className="rounded-full"
      >
        {liveRecorder.isRecording ? <Square className="h-4 w-4 mr-1.5" /> : <Mic className="h-4 w-4 mr-1.5" />}
        {liveRecorder.isRecording ? "Stop" : "Record"}
      </Button>
    </>
  );

  return (
    <AppShell
      title={<>Transcription <span className="text-gradient">Studio</span></>}
      subtitle="Upload audio or record live to extract instruments, notes, and pitch."
      actions={actions}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 max-w-[1600px] mx-auto">
        <motion.aside className="md:col-span-1 lg:col-span-3 space-y-4 sm:space-y-5" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <AudioUploader onFileSelect={handleFileSelect} />
          <AnalysisProgress stage={stage} />
          <InstrumentDetector instrument={instrument} confidence={confidence} isAnalyzing={isAnalyzing} />
          {candidates.length > 0 && (
            <InstrumentCandidates candidates={candidates} isAnalyzing={isAnalyzing} />
          )}
          {(meta.tempo || meta.key || meta.mood) && (
            <div className="glass-card p-5 space-y-2">
              <h3 className="panel-heading text-sm mb-2">Music Insights</h3>
              {meta.tempo && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Tempo</span><span>{Math.round(meta.tempo)} BPM</span></div>}
              {meta.key && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Key</span><span>{meta.key}</span></div>}
              {meta.mood && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Mood</span><span className="capitalize">{meta.mood}</span></div>}
              {meta.summary && <p className="text-[11px] text-muted-foreground pt-2 border-t border-white/5">{meta.summary}</p>}
            </div>
          )}
        </motion.aside>

        <motion.main className="md:col-span-1 lg:col-span-6 space-y-4 sm:space-y-5" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
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

          {/* Notes panel inline below main on mobile + tablet (single/double column) */}
          <div className="lg:hidden space-y-4 sm:space-y-5">
            <NotesPanel notes={notes} isAnalyzing={isAnalyzing} fileName={fileName} instrument={instrument} confidence={confidence} />
          </div>
        </motion.main>

        <motion.aside className="lg:col-span-3 hidden lg:block" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}>
          <NotesPanel notes={notes} isAnalyzing={isAnalyzing} fileName={fileName} instrument={instrument} confidence={confidence} />
        </motion.aside>
      </div>
    </AppShell>
  );
};

export default Dashboard;
