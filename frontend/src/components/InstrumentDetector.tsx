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
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        Instrument Detection
      </h3>

      {isAnalyzing ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <motion.div
            className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-xs text-muted-foreground">Analyzing instrument...</p>
        </div>
      ) : instrument ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="text-primary">
            {INSTRUMENT_ICONS[instrument] || <Mic2 className="h-8 w-8" />}
          </div>
          <p className="font-display text-lg text-foreground">{instrument}</p>
          <div className="w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Confidence</span>
              <span>{confidence}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
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
        <div className="flex flex-col items-center gap-2 py-4">
          <Mic2 className="h-8 w-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Upload audio to detect instrument</p>
        </div>
      )}
    </div>
  );
};

export default InstrumentDetector;
