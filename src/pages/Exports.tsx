import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const Exports = () => {
  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-7 w-7 text-gold" />
          <h1 className="font-cinzel text-3xl text-gold tracking-wider">Exports</h1>
        </div>
        <p className="text-cream/70">
          MIDI, MusicXML, PDF, CSV, and sheet image exports — all branded with the Gandharva watermark.
        </p>
      </motion.div>
    </LayoutWrapper>
  );
};

export default Exports;