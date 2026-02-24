import { motion } from "framer-motion";
import { Upload, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedWaveformBg, MusicParticles, EqualizerBars } from "@/components/AnimatedBackground";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      <AnimatedWaveformBg />
      <MusicParticles />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Equalizer */}
          <div className="flex justify-center mb-8">
            <EqualizerBars />
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">
            <span className="text-foreground">Turn Sound Into</span>
            <br />
            <span className="text-gradient">Sheet Music</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-body">
            AI-powered instrument recognition & note extraction.
            Upload audio or record live — get MIDI, sheet music, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              className="text-base px-8 py-6"
              onClick={() => navigate("/dashboard")}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Audio
            </Button>
            <Button
              variant="heroSecondary"
              size="lg"
              className="text-base px-8 py-6"
              onClick={() => navigate("/dashboard?mode=record")}
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Live Recording
            </Button>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {[
            "Instrument Detection",
            "Pitch Extraction",
            "MIDI Export",
            "Sheet Music",
            "Live Recording",
          ].map((feature) => (
            <span
              key={feature}
              className="glass px-4 py-2 rounded-full text-sm text-muted-foreground font-body"
            >
              {feature}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
