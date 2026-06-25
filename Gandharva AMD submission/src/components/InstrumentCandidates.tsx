import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export interface InstrumentCandidate {
  name: string;
  confidence: number;
}

interface Props {
  candidates: InstrumentCandidate[];
  isAnalyzing: boolean;
}

const InstrumentCandidates = ({ candidates, isAnalyzing }: Props) => {
  if (!candidates.length && !isAnalyzing) return null;
  return (
    <div className="glass-card glass-card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="panel-heading text-sm">Confidence</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Top {candidates.length}
        </span>
      </div>
      <div className="space-y-3">
        {candidates.map((c, i) => (
          <motion.div
            key={c.name + i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {c.name}
              </span>
              <motion.span
                key={c.confidence}
                initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                transition={{ duration: 0.5 }}
                className="text-[11px] font-medium tabular-nums"
              >
                {Math.round(c.confidence)}%
              </motion.span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    i === 0 ? "var(--gradient-accent)" : "linear-gradient(90deg, hsl(var(--primary)/0.5), hsl(var(--accent)/0.5))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, c.confidence)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InstrumentCandidates;