import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Upload,
  Mic,
  Clock,
  Eye,
  Download,
  MoreVertical,
  AudioWaveform,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  exportNotesAsMIDI,
  exportAnalysisAsPDF,
  type ExportNote,
} from "@/lib/exporters";
import heroBg from "@/assets/hero-gandharva.png";

/* ---------- Types ---------- */
interface Project {
  id: string;
  title: string;
  file_name: string | null;
  duration: number | null;
  instrument: string | null;
  confidence: number | null;
  notes: ExportNote[];
  created_at: string;
  source_type?: "upload" | "live" | null;
}

const PAGE_SIZES = [10, 25, 50];

/* ---------- Decorative SVGs ---------- */
const Filigree = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 14" className={cn("text-gold/70", className)} fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M0 7 H40" strokeLinecap="round" />
    <path d="M80 7 H120" strokeLinecap="round" />
    <path d="M44 7 Q50 1 56 7 Q62 13 68 7 Q74 1 76 7" strokeLinecap="round" />
    <circle cx="60" cy="7" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const RowCorner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("w-5 h-5 text-gold/70", className)} fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M2 10 V4 H10" strokeLinecap="round" />
    <path d="M5 8 V6 H8" strokeLinecap="round" opacity="0.7" />
  </svg>
);

/* ---------- Helpers ---------- */
const fmtDuration = (s?: number | null) => {
  if (!s && s !== 0) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
};

/* ---------- Page ---------- */
const HistoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "upload" | "live">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
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
    if (user) load();
  }, [user]);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const q = query.trim().toLowerCase();
      if (q && !(p.title?.toLowerCase().includes(q) || p.file_name?.toLowerCase().includes(q))) return false;
      if (typeFilter !== "all") {
        const t = (p.source_type ?? (p.file_name?.toLowerCase().includes("live") ? "live" : "upload")) as string;
        if (t !== typeFilter) return false;
      }
      return true;
    });
    list = list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return list;
  }, [projects, query, typeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const remove = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setProjects((p) => p.filter((x) => x.id !== id));
    }
    setOpenMenuId(null);
  };
  const reopen = (p: Project) => {
    sessionStorage.setItem("gandharva:reopen", JSON.stringify(p));
    navigate("/dashboard");
  };

  return (
    <LayoutWrapper fullscreen>
      {/* Background hero atmosphere */}
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 -z-20"
          style={{ background: "linear-gradient(180deg, #04081c 0%, #02060f 60%, #010308 100%)" }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.55] pointer-events-none"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "top right",
            maskImage: "linear-gradient(180deg, black 0%, black 35%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, black 35%, transparent 75%)",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.7) 100%)" }}
        />
        {/* Floating gold particles */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                background: "hsl(var(--gold-glow))",
                boxShadow: "0 0 8px hsl(var(--gold-glow) / 0.9)",
                opacity: 0.35,
              }}
              animate={{
                transform: ["translateY(0)", "translateY(-18px)", "translateY(0)"],
                opacity: [0.15, 0.7, 0.15],
              }}
              transition={{ duration: 9 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative px-6 lg:px-12 pt-10 lg:pt-12 pb-16">
          {/* ---------- Heading ---------- */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
          >
            <div>
              <h1
                className="font-cinzel text-4xl md:text-5xl tracking-[0.08em]"
                style={{
                  background: "linear-gradient(180deg, #F4D27A 0%, #D4AF37 55%, #9c7a25 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 2px 14px hsl(var(--gold) / 0.35))",
                }}
              >
                <span className="text-gold/70">‖</span> History <span className="text-gold/70">‖</span>
              </h1>
              <p className="mt-3 text-cream/70 text-sm tracking-wide">
                View and manage all your past analyses
              </p>
              <Filigree className="mt-3 h-3 w-32" />
            </div>

            {/* ---------- Top action bar ---------- */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search analyses..."
                  className="w-[260px] h-11 rounded-xl bg-[#050a1f]/90 border border-gold/40 px-4 pr-10 text-sm text-cream placeholder:text-gold/50 font-cinzel tracking-wider outline-none transition-all focus:border-gold-glow focus:shadow-[0_0_18px_hsl(var(--gold)/0.35)]"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/70" />
              </div>

              {/* Type filter */}
              <FancySelect
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v as any); setPage(1); }}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "upload", label: "Upload" },
                  { value: "live", label: "Live" },
                ]}
              />

              {/* Sort */}
              <FancySelect
                value={sort}
                onChange={(v) => setSort(v as any)}
                options={[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                ]}
              />
            </div>
          </motion.div>

          {/* ---------- Table container ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mt-8 rounded-2xl border border-gold/40 bg-[#040a1c]/85 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.55),inset_0_0_30px_hsl(var(--gold)/0.04)]"
          >
            {/* Inner gold rim */}
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-gold/15" />

            {/* Header row */}
            <div className="hidden md:grid grid-cols-[2.4fr_1fr_1fr_1.2fr_1fr] items-center gap-4 px-8 pt-7 pb-4 text-[11px] uppercase tracking-[0.32em] text-gold font-cinzel">
              <div>Title</div>
              <div>Type</div>
              <div>Duration</div>
              <div>Date</div>
              <div className="text-right pr-2">Actions</div>
            </div>

            <div className="px-4 sm:px-6 pb-6 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl border border-gold/15 bg-gold/[0.02] animate-pulse" />
                ))
              ) : slice.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-cinzel text-gold/80 tracking-widest">No analyses found</p>
                  <p className="text-cream/50 text-sm mt-2">Run an analysis from the Studio to see it here.</p>
                </div>
              ) : (
                slice.map((p, i) => {
                  const t = (p.source_type ?? (p.file_name?.toLowerCase().includes("live") ? "live" : "upload")) as
                    | "upload"
                    | "live";
                  const { date, time } = fmtDate(p.created_at);
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      whileHover={{ y: -2 }}
                      className="group relative rounded-xl border border-gold/25 bg-gradient-to-r from-[#06112c]/80 via-[#040a1c]/80 to-[#06112c]/80 px-5 py-4 transition-all duration-500 hover:border-gold/55 hover:shadow-[0_0_28px_hsl(var(--gold)/0.18)]"
                    >
                      {/* Ornament corners */}
                      <RowCorner className="absolute top-1 left-1" />
                      <RowCorner className="absolute top-1 right-1 rotate-90" />
                      <RowCorner className="absolute bottom-1 left-1 -rotate-90" />
                      <RowCorner className="absolute bottom-1 right-1 rotate-180" />

                      {/* Hover shimmer */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-gold/10 to-transparent rounded-xl" />

                      <div className="grid grid-cols-1 md:grid-cols-[2.4fr_1fr_1fr_1.2fr_1fr] items-center gap-4">
                        {/* Title */}
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative shrink-0 h-12 w-12 rounded-full border border-gold/55 flex items-center justify-center bg-[#02060f] shadow-[inset_0_0_10px_hsl(var(--gold)/0.15),0_0_14px_hsl(var(--gold)/0.18)]">
                            <div className="absolute inset-1 rounded-full border border-gold/25" />
                            {t === "live" ? (
                              <Mic className="h-5 w-5 text-gold-glow" />
                            ) : (
                              <AudioWaveform className="h-5 w-5 text-gold-glow" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-cinzel text-[15px] text-cream truncate">{p.title}</p>
                            <p className="text-[12px] text-gold/55 truncate font-mono">{p.file_name ?? "—"}</p>
                          </div>
                        </div>

                        {/* Type badge */}
                        <div>
                          {t === "live" ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/45 bg-[#2a070a]/80 text-[#ff6b76] text-xs font-cinzel tracking-widest uppercase shadow-[0_0_14px_rgba(220,38,38,0.25)]">
                              <Mic className="h-3.5 w-3.5" /> Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/40 bg-[#050a1f]/80 text-gold-glow text-xs font-cinzel tracking-widest uppercase">
                              <Upload className="h-3.5 w-3.5" /> Upload
                            </span>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-2 text-cream/85">
                          <Clock className="h-4 w-4 text-gold/80" />
                          <span className="font-mono text-[14px]">{fmtDuration(p.duration)}</span>
                        </div>

                        {/* Date */}
                        <div className="leading-tight">
                          <p className="text-cream text-[14px]">{date}</p>
                          <p className="text-gold/55 text-[12px] mt-0.5">{time}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pr-1">
                          <ActionIcon title="View" onClick={() => reopen(p)}>
                            <Eye className="h-4 w-4" />
                          </ActionIcon>
                          <ActionIcon
                            title="Download MIDI"
                            onClick={() => exportNotesAsMIDI(p.notes ?? [], p.title)}
                          >
                            <Download className="h-4 w-4" />
                          </ActionIcon>
                          <div className="relative">
                            <ActionIcon
                              title="More"
                              onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </ActionIcon>
                            {openMenuId === p.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 top-10 z-30 w-44 rounded-lg border border-gold/40 bg-[#040a1c] shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden"
                              >
                                <MenuItem onClick={() => { exportAnalysisAsPDF({ title: p.title, instrument: p.instrument, confidence: p.confidence ?? 0, fileName: p.file_name }, p.notes ?? [], p.title); setOpenMenuId(null); }}>
                                  Export PDF
                                </MenuItem>
                                <MenuItem onClick={() => { reopen(p); }}>Open in Studio</MenuItem>
                                <MenuItem destructive onClick={() => remove(p.id)}>
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </MenuItem>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* ---------- Pagination ---------- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 pb-6 pt-2">
              <div className="hidden sm:block w-[140px]" />
              <div className="flex items-center gap-2">
                <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </PageBtn>
                {pageNumbers(safePage, totalPages).map((n, idx) =>
                  n === "…" ? (
                    <span key={idx} className="px-2 text-gold/60">…</span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => setPage(n as number)}
                      className={cn(
                        "min-w-[40px] h-10 rounded-lg border font-cinzel text-sm transition-all",
                        safePage === n
                          ? "border-gold/70 text-gold-glow bg-gold/10 shadow-[0_0_18px_hsl(var(--gold)/0.4)]"
                          : "border-gold/25 text-cream/80 hover:border-gold/55 hover:text-gold-glow"
                      )}
                    >
                      {n}
                    </button>
                  )
                )}
                <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </PageBtn>
              </div>

              <FancySelect
                value={String(pageSize)}
                onChange={(v) => { setPageSize(Number(v)); setPage(1); }}
                options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} per page` }))}
                width={150}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

/* ---------- Subcomponents ---------- */
const ActionIcon = ({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) => (
  <button
    title={title}
    onClick={onClick}
    className="h-9 w-9 rounded-lg border border-gold/35 bg-[#050a1f]/60 text-gold-glow flex items-center justify-center transition-all hover:scale-105 hover:border-gold/70 hover:bg-gold/10 hover:shadow-[0_0_14px_hsl(var(--gold)/0.35)]"
  >
    {children}
  </button>
);

const MenuItem = ({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-cinzel tracking-wider transition-colors",
      destructive
        ? "text-red-400 hover:bg-red-500/10"
        : "text-cream/85 hover:bg-gold/10 hover:text-gold-glow"
    )}
  >
    {children}
  </button>
);

const PageBtn = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="h-10 w-10 rounded-lg border border-gold/30 text-gold-glow flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold/60 hover:bg-gold/10 transition-colors"
  >
    {children}
  </button>
);

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

/* ---------- Fancy Select ---------- */
const FancySelect = ({
  value,
  onChange,
  options,
  width = 170,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: number;
}) => {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) {
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }
  }, [open]);

  return (
    <div className="relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 rounded-xl bg-[#050a1f]/90 border border-gold/40 px-4 pr-9 text-left text-sm font-cinzel tracking-wider text-cream/90 outline-none transition-all hover:border-gold/65 focus:border-gold-glow focus:shadow-[0_0_18px_hsl(var(--gold)/0.35)]"
      >
        {current?.label}
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 top-12 z-30 rounded-xl border border-gold/40 bg-[#040a1c] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-[13px] font-cinzel tracking-wider transition-colors",
                o.value === value
                  ? "bg-gold/15 text-gold-glow"
                  : "text-cream/85 hover:bg-gold/10 hover:text-gold-glow"
              )}
            >
              {o.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default HistoryPage;