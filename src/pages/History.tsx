import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Music, Trash2, FileAudio, Download, FileText, FileJson } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { exportNotesAsCSV, exportNotesAsMIDI, exportAnalysisAsPDF, ExportNote } from "@/lib/exporters";

interface Project {
  id: string;
  title: string;
  file_name: string | null;
  duration: number | null;
  instrument: string | null;
  confidence: number | null;
  notes: ExportNote[];
  created_at: string;
}

const HistoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProjects((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Project deleted");
      setProjects((p) => p.filter((x) => x.id !== id));
    }
  };

  const reopen = (p: Project) => {
    sessionStorage.setItem("gandharva:reopen", JSON.stringify(p));
    navigate("/dashboard");
  };

  return (
    <AppShell title="Project History" subtitle="Reopen any past analysis with its notes, waveform metadata, and exports.">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 max-w-2xl mx-auto text-center">
          <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg mb-2">No saved projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Analyze audio in the Studio and save it to see it here.</p>
          <Button variant="hero" onClick={() => navigate("/dashboard")}>Open Studio</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              className="glass-card glass-card-hover p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary/15 border border-primary/20 shrink-0">
                    <Music className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{p.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => remove(p.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="rounded-lg bg-white/5 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Instrument</p>
                  <p className="text-xs font-medium text-foreground mt-1 truncate">{p.instrument ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</p>
                  <p className="text-xs font-medium text-foreground mt-1">{p.notes.length}</p>
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
                  <p className="text-xs font-medium text-foreground mt-1">{p.confidence ?? 0}%</p>
                </div>
              </div>

              <div className="flex gap-1.5">
                <Button size="sm" variant="hero" className="flex-1 rounded-lg h-8 text-xs" onClick={() => reopen(p)}>
                  Reopen
                </Button>
                <Button size="icon" variant="glass" className="h-8 w-8 rounded-lg" onClick={() => exportNotesAsMIDI(p.notes, p.title)} title="MIDI">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="glass" className="h-8 w-8 rounded-lg" onClick={() => exportNotesAsCSV(p.notes, p.title)} title="CSV">
                  <FileJson className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="glass" className="h-8 w-8 rounded-lg" onClick={() => exportAnalysisAsPDF({ title: p.title, instrument: p.instrument, confidence: p.confidence ?? 0, fileName: p.file_name }, p.notes, p.title)} title="PDF">
                  <FileText className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default HistoryPage;
