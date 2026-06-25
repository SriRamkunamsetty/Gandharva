import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mic, Upload, Music, Download, Sparkles, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MusicParticles } from "@/components/AnimatedBackground";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Gandharva",
    description: "AI-powered music transcription that turns any audio into instruments, notes, and exportable scores.",
    accent: "from-primary/40 to-accent/40",
  },
  {
    icon: Upload,
    title: "Upload or Record",
    description: "Drop a WAV, MP3, FLAC, or OGG — or hit Record to capture live audio from your microphone in real time.",
    accent: "from-cyan-400/40 to-blue-500/40",
  },
  {
    icon: Music,
    title: "Instant AI Analysis",
    description: "Our AI detects the instrument, extracts pitch, identifies notes with timing, tempo, key signature, and mood.",
    accent: "from-violet-400/40 to-fuchsia-500/40",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Download as MIDI, MusicXML, CSV, branded PDF report, or a clean PNG sheet. Save projects for later comparison.",
    accent: "from-emerald-400/40 to-teal-500/40",
  },
  {
    icon: Mic,
    title: "Compare & Refine",
    description: "Save analyses to your cloud history, overlay two projects side-by-side, and track patterns across performances.",
    accent: "from-amber-400/40 to-orange-500/40",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("gandharva:onboarded");
    if (seen === "true") navigate("/dashboard", { replace: true });
  }, [navigate]);

  const finish = () => {
    localStorage.setItem("gandharva:onboarded", "true");
    navigate("/dashboard");
  };

  const next = () => (step < STEPS.length - 1 ? setStep((s) => s + 1) : finish());
  const skip = () => finish();

  const Step = STEPS[step];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gradient-hero overflow-hidden px-6">
      <div className="ambient-orb" style={{ width: 600, height: 600, top: -200, left: -200, background: "hsl(var(--violet-glow) / 0.35)" }} />
      <div className="ambient-orb" style={{ width: 700, height: 700, bottom: -250, right: -200, background: "hsl(var(--neon-cyan) / 0.18)" }} />
      <MusicParticles />

      <button
        onClick={skip}
        className="absolute top-6 right-6 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors z-20"
      >
        Skip
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full bg-white/15 overflow-hidden"
            animate={{ width: i === step ? 32 : 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {i < step && <div className="h-full w-full bg-primary" />}
            {i === step && (
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-xl w-full text-center"
        >
          <motion.div
            className={`mx-auto mb-8 h-28 w-28 rounded-3xl flex items-center justify-center bg-gradient-to-br ${Step.accent} border border-white/15 backdrop-blur-xl`}
            animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 60px hsl(var(--primary) / 0.2)" }}
          >
            <Step.icon className="h-12 w-12 text-foreground" />
          </motion.div>

          <motion.h1
            className="font-display text-4xl md:text-5xl tracking-tight text-foreground mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {Step.title}
          </motion.h1>
          <motion.p
            className="text-base md:text-lg text-muted-foreground leading-relaxed mb-12 max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {Step.description}
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {step > 0 && (
              <Button variant="glass" size="lg" onClick={() => setStep((s) => s - 1)} className="rounded-full">
                Back
              </Button>
            )}
            <Button variant="hero" size="lg" onClick={next} className="rounded-full px-8">
              {step === STEPS.length - 1 ? (
                <>
                  Get Started <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;