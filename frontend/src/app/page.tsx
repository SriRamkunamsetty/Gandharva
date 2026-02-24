"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, Mic, Activity, Download, FileText, Cpu, CheckCircle } from "lucide-react";
import { AnimatedWaveformBg, MusicParticles, EqualizerBars } from "@/components/AnimatedBackground";

// --- Sub-components ---

function FeatureCard({ icon, title, desc, delay }: { icon: ReactNode; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer
        bg-gradient-to-br from-[hsl(250_25%_14%)] to-[hsl(230_50%_10%)]
        border border-white/10 hover:border-primary/40
        shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_hsl(180_100%_50%/0.15),0_0_80px_hsl(270_80%_60%/0.1)]"
    >
      {/* Ambient glow behind card on hover */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/0 to-violet/0 group-hover:from-primary/10 group-hover:to-violet/10 transition-all duration-500 -z-10 blur-xl" />
      <div className="mb-4 w-14 h-14 rounded-xl flex items-center justify-center
        bg-gradient-to-br from-primary/10 to-violet/10
        border border-primary/20 group-hover:border-primary/40
        shadow-[0_0_15px_hsl(180_100%_50%/0.1)] group-hover:shadow-[0_0_25px_hsl(180_100%_50%/0.25)]
        transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StepNode({ number, icon, title, desc }: { number: string; icon: ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.08 }}
      className="flex flex-col items-center text-center flex-1 relative z-10 group cursor-pointer"
    >
      <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-5 relative
        bg-gradient-to-br from-[hsl(250_25%_14%)] to-[hsl(230_50%_12%)]
        border border-white/15 group-hover:border-primary/40
        shadow-[0_0_20px_hsl(180_100%_50%/0.08)] group-hover:shadow-[0_0_35px_hsl(180_100%_50%/0.2),0_0_60px_hsl(270_80%_60%/0.1)]
        transition-all duration-300">
        {icon}
        <span className="absolute -top-2 -right-2 text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center
          bg-gradient-to-r from-accent to-violet text-white
          shadow-[0_0_12px_hsl(270_80%_60%/0.5)]">
          {number}
        </span>
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// --- Main Page ---

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-background font-body text-foreground">
      {/* Auth button — top right */}
      <div className="fixed top-0 right-0 z-50 flex items-center gap-4 px-6 py-4">
        <Link href="/login">
          <Button variant="hero" size="sm" className="font-bold rounded-full px-6">
            Get Started
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
        <AnimatedWaveformBg />
        <MusicParticles />

        {/* Layered radial glow on top of linear gradient-hero */}
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
              <Link href="/dashboard">
                <Button
                  variant="hero"
                  size="lg"
                  className="text-base px-8 py-6 w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Audio
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="heroSecondary"
                  size="lg"
                  className="text-base px-8 py-6 w-full sm:w-auto"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Live Recording
                </Button>
              </Link>
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

      {/* Feature Section */}
      <section className="relative z-10 w-full py-24 px-4 border-t border-border overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(250 30% 6%), hsl(250 25% 10%), hsl(250 30% 6%))' }}>
        {/* Radial glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-violet/5 blur-[120px]" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-gradient">Engine Characteristics</h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">Discover the core capabilities powering Gandarva&apos;s high-fidelity audio transcription.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Mic className="w-8 h-8 text-primary" />}
              title="Instrument Detection"
              desc="Deep-learning identification across a broad spectrum of acoustic and electronic instruments."
              delay={0.1}
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8 text-violet" />}
              title="Pitch Extraction"
              desc="Micro-tonal precision isolating fundamental frequencies, harmonics, and complex chords."
              delay={0.2}
            />
            <FeatureCard
              icon={<Download className="w-8 h-8 text-accent" />}
              title="MIDI Export"
              desc="Instantly download standard MIDI files tracking pitch, velocity, and timing structure."
              delay={0.3}
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-primary" />}
              title="Sheet Music"
              desc="Render classical notation PDFs immediately from your raw recorded input."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 w-full py-24 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(250 25% 8%), hsl(270 30% 10%), hsl(250 25% 8%))' }}>
        {/* Radial glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[150px]" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-gradient">Workflow Pipeline</h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">From raw wave data to actionable musical notation in seconds.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
            {/* Connecting Line (Desktop) — glowing */}
            <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_10px_hsl(180_100%_50%/0.3)]" />

            <StepNode
              number="01"
              icon={<Upload className="w-6 h-6 text-primary" />}
              title="Upload Audio"
              desc="Drag and drop your WAV or MP3 files into the secure dashboard."
            />
            <StepNode
              number="02"
              icon={<Cpu className="w-6 h-6 text-violet" />}
              title="Neural Processing"
              desc="Our serverless GPUs map out temporal frequencies and transcribe."
            />
            <StepNode
              number="03"
              icon={<CheckCircle className="w-6 h-6 text-green-400" />}
              title="Review & Export"
              desc="View the generated Piano Roll and download precise MIDI/PDF files."
            />
          </div>
        </div>
      </section>

      {/* Minimal Footer (for future SaaS expansion) */}
      <footer className="relative w-full z-10 border-t border-border py-6 text-center text-muted-foreground text-xs glass-strong">
        <p>Gandarva AI Music Engine</p>
      </footer>
    </div>
  );
}
