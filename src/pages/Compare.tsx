import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExportNote } from "@/lib/exporters";
import { toast } from "sonner";
import { GitCompare } from "lucide-react";

interface Project {
  id: string;
  title: string;
  instrument: string | null;
  confidence: number | null;
  notes: ExportNote[];
  created_at: string;
}

const COLORS = [
  { line: "hsl(180 100% 60%)", glow: "hsl(180 100% 50% / 0.4)" },
  { line: "hsl(280 90% 70%)", glow: "hsl(280 90% 60% / 0.4)" },
];

const ComparePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id,title,instrument,confidence,notes,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setProjects((data ?? []) as any);
      });
  }, [user]);

  const projA = useMemo(() => projects.find((p) => p.id === a) ?? null, [projects, a]);
  const projB = useMemo(() => projects.find((p) => p.id === b) ?? null, [projects, b]);

  const renderPitchCurve = (p: Project | null, colorIdx: number) => {
    if (!p?.notes?.length) return null;
    const c = COLORS[colorIdx];
    const maxEnd = Math.max(...p.notes.map((n) => n.end), 1);
    const maxF = Math.max(...p.notes.map((n) => n.frequency), 800);
    const minF = Math.min(...p.notes.map((n) => n.frequency), 80);
    const W = 1000, H = 200;
    const points = p.notes
      .map((n) => {
        const x = (n.start / maxEnd) * W;
        const y = H - ((n.frequency - minF) / Math.max(1, maxF - minF)) * (H - 20) - 10;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return (
      <g key={p.id}>
        <polyline
          fill="none"
          stroke={c.line}
          strokeWidth={2}
          points={points}
          style={{ filter: `drop-shadow(0 0 6px ${c.glow})` }}
        />
        {p.notes.map((n, i) => {
          const x = (n.start / maxEnd) * W;
          const y = H - ((n.frequency - minF) / Math.max(1, maxF - minF)) * (H - 20) - 10;
          return <circle key={i} cx={x} cy={y} r={2.5} fill={c.line} />;
        })}
      </g>
    );
  };

  const renderTimeline = (p: Project | null, colorIdx: number) => {
    if (!p?.notes?.length) return null;
    const maxEnd = Math.max(...p.notes.map((n) => n.end), 1);
    return (
      <div className="relative h-10 rounded-lg bg-white/[0.03] border border-white/5 overflow-hidden">
        {p.notes.map((n, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.02 }}
            className="absolute h-2 rounded origin-left"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              left: `${(n.start / maxEnd) * 100}%`,
              width: `${Math.max(((n.end - n.start) / maxEnd) * 100, 0.5)}%`,
              background: COLORS[colorIdx].line,
              boxShadow: `0 0 8px ${COLORS[colorIdx].glow}`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <AppShell title="Compare Analyses" subtitle="Overlay pitch curves and note timelines from any two saved projects.">
      <div className="max-w-6xl mx-auto space-y-6">
        {projects.length < 2 ? (
          <div className="glass-card p-12 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg mb-2">Need at least 2 saved projects</h3>
            <p className="text-sm text-muted-foreground">Run more analyses in the Studio to enable comparison.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { value: a, set: setA, color: 0, label: "Project A" },
                { value: b, set: setB, color: 1, label: "Project B" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[s.color].line, boxShadow: `0 0 8px ${COLORS[s.color].glow}` }} />
                    <h3 className="panel-heading text-sm">{s.label}</h3>
                  </div>
                  <select
                    value={s.value ?? ""}
                    onChange={(e) => s.set(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  >
                    <option value="">Select a project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} — {p.instrument ?? "?"} ({p.notes.length} notes)</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="panel-heading text-sm">Pitch Curves Overlay</h3>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  {projA && <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: COLORS[0].line }} />{projA.title}</span>}
                  {projB && <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: COLORS[1].line }} />{projB.title}</span>}
                </div>
              </div>
              <svg viewBox="0 0 1000 200" className="w-full h-48 rounded-xl bg-black/30 border border-white/5">
                {renderPitchCurve(projA, 0)}
                {renderPitchCurve(projB, 1)}
              </svg>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="glass-card p-5">
                <h3 className="panel-heading text-sm mb-3">Note Timelines</h3>
                <div className="space-y-3">
                  {[{ p: projA, c: 0 }, { p: projB, c: 1 }].map((row, i) =>
                    row.p ? (
                      <div key={i}>
                        <p className="text-[11px] text-muted-foreground mb-1.5">{row.p.title}</p>
                        {renderTimeline(row.p, row.c)}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ComparePage;