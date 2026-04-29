import { motion } from "framer-motion";
import { Music2, AudioWaveform, FileMusic, FileText, Mic } from "lucide-react";

const ITEMS = [
  { Icon: Music2, title: "Instrument", subtitle: "Detection" },
  { Icon: AudioWaveform, title: "Pitch", subtitle: "Extraction" },
  { Icon: FileMusic, title: "MIDI", subtitle: "Export" },
  { Icon: FileText, title: "Sheet", subtitle: "Music" },
  { Icon: Mic, title: "Live", subtitle: "Recording" },
];

/** Ornamental octagonal frame that matches the gold engraved buttons */
const OrnateRing = () => (
  <svg
    viewBox="0 0 64 64"
    className="absolute inset-0 w-full h-full text-gold/70"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
  >
    <polygon points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20" />
    <polygon
      points="22,8 42,8 56,22 56,42 42,56 22,56 8,42 8,22"
      opacity="0.45"
    />
    {/* corner dots */}
    {[
      [12, 12],
      [52, 12],
      [12, 52],
      [52, 52],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="1.1" fill="currentColor" stroke="none" />
    ))}
  </svg>
);

const HeroFeatureIcons = () => {
  return (
    <div className="flex items-end justify-start gap-6 sm:gap-8 md:gap-10">
      {ITEMS.map(({ Icon, title, subtitle }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 * i + 0.2 }}
          className="flex flex-col items-center text-center select-none"
        >
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center group">
            {/* Circular gold engraved frame */}
            <span
              className="absolute inset-0 rounded-full border border-gold/70"
              style={{
                boxShadow:
                  "inset 0 0 8px hsl(var(--gold)/0.25), 0 0 10px hsl(var(--gold)/0.18)",
              }}
            />
            <span className="absolute inset-[3px] rounded-full border border-gold/25" />
            <Icon className="relative h-[18px] w-[18px] sm:h-5 sm:w-5 text-gold-glow drop-shadow-[0_0_5px_hsl(var(--gold-glow)/0.6)] transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span
            className="mt-2.5 font-cinzel text-[11px] sm:text-[12px] tracking-[0.14em] text-gold-glow"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
          >
            {title}
          </span>
          <span
            className="text-[10px] sm:text-[11px] text-cream/70 tracking-wide"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
          >
            {subtitle}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default HeroFeatureIcons;