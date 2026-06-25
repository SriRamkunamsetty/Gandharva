import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export type AnalysisStage = "idle" | "preprocess" | "features" | "classify" | "pitch" | "done" | "error";

const STAGES: { id: AnalysisStage; label: string }[] = [
  { id: "preprocess", label: "Preprocess audio" },
  { id: "features", label: "Extract features" },
  { id: "classify", label: "Classify instrument" },
  { id: "pitch", label: "Detect pitch & notes" },
];

interface Props {
  stage: AnalysisStage;
}

const order: AnalysisStage[] = ["idle", "preprocess", "features", "classify", "pitch", "done"];

const AnalysisProgress = ({ stage }: Props) => {
  const idx = order.indexOf(stage);
  return (
    <AnimatePresence>
      {stage !== "idle" && stage !== "done" && stage !== "error" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="panel-heading text-sm">AI Analysis</h3>
            <span className="text-[10px] uppercase tracking-wider text-primary/80">In progress</span>
          </div>
          <div className="space-y-2">
            {STAGES.map((s, i) => {
              const stageIdx = order.indexOf(s.id);
              const isDone = idx > stageIdx;
              const isActive = idx === stageIdx;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                      isDone
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : isActive
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-white/5 border-white/10 text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-3 w-3" />
                    ) : isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="text-[10px]">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs ${isActive ? "text-foreground" : isDone ? "text-foreground/70" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="ml-auto h-1 w-16 rounded-full bg-white/5 overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalysisProgress;