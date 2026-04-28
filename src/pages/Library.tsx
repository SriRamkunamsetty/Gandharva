import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { motion } from "framer-motion";
import { Music2 } from "lucide-react";

const Library = () => {
  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Music2 className="h-7 w-7 text-gold" />
          <h1 className="font-cinzel text-3xl text-gold tracking-wider">Library</h1>
        </div>
        <p className="text-cream/70">
          Your saved sacred recordings and instrument collections will live here.
        </p>
      </motion.div>
    </LayoutWrapper>
  );
};

export default Library;