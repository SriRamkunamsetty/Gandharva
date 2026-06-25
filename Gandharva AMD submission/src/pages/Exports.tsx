import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { motion } from "framer-motion";
import {
  FileText,
  FileMusic,
  FileSpreadsheet,
  FileCode2,
  FileImage,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FORMATS = [
  { Icon: FileMusic, label: "MIDI File", ext: ".mid", desc: "Playable MIDI sequence" },
  { Icon: FileText, label: "PDF Report", ext: ".pdf", desc: "Branded analysis report" },
  { Icon: FileSpreadsheet, label: "CSV Notes", ext: ".csv", desc: "Raw note data table" },
  { Icon: FileCode2, label: "MusicXML", ext: ".musicxml", desc: "Cross-DAW notation" },
  { Icon: FileImage, label: "Sheet PNG", ext: ".png", desc: "Engraved sheet image" },
];

const Exports = () => {
  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-7 w-7 text-gold drop-shadow-[0_0_8px_hsl(var(--gold-glow)/0.7)]" />
          <h1
            className="font-cinzel text-3xl tracking-[0.2em]"
            style={{
              background:
                "linear-gradient(180deg, #F6C453 0%, #D4AF37 55%, #B8902B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            EXPORTS
          </h1>
        </div>
        <p className="text-cream/70 mb-8">
          MIDI, MusicXML, PDF, CSV, and sheet image exports — all branded with
          the Gandharva watermark.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FORMATS.map(({ Icon, label, ext, desc }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className={cn(
                "group relative text-left rounded-xl p-5",
                "border border-gold/40 bg-gradient-to-b from-[#0b1430]/90 to-[#020617]/95",
                "shadow-[inset_0_1px_0_hsl(var(--gold-glow)/0.18),0_0_24px_hsl(var(--gold)/0.18)]",
                "hover:border-gold/70 hover:shadow-[inset_0_1px_0_hsl(var(--gold-glow)/0.3),0_0_36px_hsl(var(--gold)/0.32)]",
                "transition-all overflow-hidden"
              )}
            >
              {/* shimmer */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-lg flex items-center justify-center border border-gold/50 bg-black/40 text-gold-glow shadow-[0_0_14px_hsl(var(--gold)/0.3)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-cinzel text-base tracking-wider text-gold-glow">
                      {label}
                    </span>
                    <span className="text-[10px] tracking-wider text-gold/70">
                      {ext}
                    </span>
                  </div>
                  <p className="text-xs text-cream/60 mt-1">{desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-gold/80 tracking-wider uppercase font-cinzel">
                <Download className="h-3.5 w-3.5" />
                Download
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </LayoutWrapper>
  );
};

export default Exports;