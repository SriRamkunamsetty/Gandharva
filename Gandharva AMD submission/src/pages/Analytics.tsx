import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Music, Activity, TrendingUp, Clock } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExportNote } from "@/lib/exporters";

interface Project {
  id: string;
  instrument: string | null;
  confidence: number | null;
  notes: ExportNote[];
  created_at: string;
}

const PIANO = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const AnalyticsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id,instrument,confidence,notes,created_at").then(({ data }) => {
      setProjects((data ?? []) as any);
      setLoading(false);
    });
  }, [user]);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalNotes = projects.reduce((s, p) => s + p.notes.length, 0);
    const avgConfidence = totalProjects
      ? Math.round(projects.reduce((s, p) => s + (p.confidence ?? 0), 0) / totalProjects)
      : 0;

    const instrumentCounts: Record<string, number> = {};
    projects.forEach((p) => {
      const i = p.instrument ?? "Unknown";
      instrumentCounts[i] = (instrumentCounts[i] ?? 0) + 1;
    });

    const noteCounts: Record<string, number> = {};
    PIANO.forEach((n) => (noteCounts[n] = 0));
    projects.forEach((p) =>
      p.notes.forEach((n) => {
        const pitch = n.note.replace(/[0-9-]/g, "");
        if (noteCounts[pitch] !== undefined) noteCounts[pitch]++;
      })
    );

    const totalDuration = projects.reduce(
      (s, p) => s + p.notes.reduce((ss, n) => ss + (n.end - n.start), 0),
      0
    );

    return { totalProjects, totalNotes, avgConfidence, instrumentCounts, noteCounts, totalDuration };
  }, [projects]);

  const maxNoteCount = Math.max(...Object.values(stats.noteCounts), 1);
  const maxInstrCount = Math.max(...Object.values(stats.instrumentCounts), 1);

  return (
    <AppShell title="Analytics" subtitle="Insights across all your transcriptions.">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Projects", value: stats.totalProjects, icon: Music, color: "primary" },
            { label: "Total Notes", value: stats.totalNotes, icon: Activity, color: "accent" },
            { label: "Avg Confidence", value: `${stats.avgConfidence}%`, icon: TrendingUp, color: "primary" },
            { label: "Total Duration", value: `${stats.totalDuration.toFixed(1)}s`, icon: Clock, color: "accent" },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass-card glass-card-hover p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-${s.color}/15 border border-${s.color}/20`}>
                  <s.icon className={`h-4 w-4 text-${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-display text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="glass-card p-8 h-60 animate-pulse" />
        ) : projects.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground text-sm">
            No data yet — analyze and save a project to see analytics.
          </div>
        ) : (
          <>
            {/* Note distribution */}
            <div className="glass-card p-5">
              <h3 className="panel-heading text-sm mb-1">Note Distribution</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Frequency of each pitch class across all projects</p>
              <div className="flex items-end gap-2 h-40">
                {PIANO.map((n) => {
                  const c = stats.noteCounts[n];
                  const h = (c / maxNoteCount) * 100;
                  return (
                    <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground tabular-nums">{c}</span>
                      <motion.div
                        className="w-full rounded-t-md"
                        style={{ background: "var(--gradient-accent)", boxShadow: "0 -2px 12px hsl(var(--primary) / 0.3)" }}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                      <span className="text-[10px] text-foreground font-medium">{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instrument breakdown */}
            <div className="glass-card p-5">
              <h3 className="panel-heading text-sm mb-1">Instruments Detected</h3>
              <p className="text-[11px] text-muted-foreground mb-4">How often each instrument appears</p>
              <div className="space-y-3">
                {Object.entries(stats.instrumentCounts).map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground font-medium">{name}</span>
                      <span className="text-muted-foreground">{count} {count === 1 ? "project" : "projects"}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "var(--gradient-accent)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxInstrCount) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default AnalyticsPage;
