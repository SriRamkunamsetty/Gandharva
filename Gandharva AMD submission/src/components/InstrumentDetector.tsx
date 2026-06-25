import { motion } from "framer-motion";
import { Guitar, Piano, Mic2, Activity } from "lucide-react";

interface InstrumentDetectorProps {
  instrument: string | null;
  confidence: number;
  isAnalyzing: boolean;
}

const INSTRUMENT_ICONS: Record<string, React.ReactNode> = {
  Piano: <Piano className="h-8 w-8" />,
  Guitar: <Guitar className="h-8 w-8" />,
  Violin: <Mic2 className="h-8 w-8" />,
};

const InstrumentDetector = ({ instrument, confidence, isAnalyzing }: InstrumentDetectorProps) => {
  return (
    <div className="glass-card glass-card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="panel-heading text-sm">Instrument</h3>
        </div>
        {instrument && !isAnalyzing && (
          <span className="text-[10px] uppercase tracking-wider text-primary/80 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Detected
          </span>
        )}
      </div>

      {isAnalyzing ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <motion.div
            className="h-14 w-14 rounded-full border-2 border-primary/70 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-xs text-muted-foreground">Listening to your audio…</p>
        </div>
      ) : instrument ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/25 to-accent/25 border border-primary/30 text-primary shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
            {INSTRUMENT_ICONS[instrument] || <Mic2 className="h-8 w-8" />}
          </div>
          <p className="font-display text-2xl text-foreground tracking-tight">
            {instrument}
          </p>
          <div className="w-full">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Confidence</span>
              <span className="text-foreground font-medium">{confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--gradient-accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
            <Mic2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground max-w-[180px]">
            Upload audio to identify the instrument
          </p>
        </div>
      )}
    </div>
  );
};

export default InstrumentDetector;
