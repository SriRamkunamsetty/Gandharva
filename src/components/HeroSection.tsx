import { motion } from "framer-motion";
import heroImage from "@/assets/hero-gandharva.png";
import HeroButtons from "@/components/HeroButtons";

const HeroSection = () => {
  return (
    <section
      className="relative w-full h-screen overflow-hidden bg-[hsl(var(--bg-deep))]"
      aria-label="Gandharva hero"
    >
      {/* Hero image — fullscreen, untouched */}
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Gandharva — Hear the music of the gods"
      />

      {/* Subtle readability gradient (only on small screens where overlay text matters) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent lg:from-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Floating gold particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold-glow/70"
            style={{
              left: `${(i * 73) % 100}%`,
              top: `${(i * 41) % 100}%`,
              boxShadow: "0 0 8px hsl(var(--gold-glow))",
            }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{
              duration: 6 + (i % 5),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Hero overlay content (mobile/tablet only — desktop relies on the artwork itself) */}
      <div className="relative z-10 h-full w-full flex flex-col justify-end lg:justify-center px-6 sm:px-10 pb-16 lg:pb-0 lg:pl-12 xl:pl-16 max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3 }}
          className="lg:hidden font-cinzel text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.05] tracking-tight"
          style={{ textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}
        >
          Hear the
          <br />
          <span className="text-gold drop-shadow-[0_0_18px_hsl(var(--gold-glow)/0.6)]">
            Music of the Gods
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="lg:hidden mt-4 mb-7 text-cream/85 text-sm sm:text-base max-w-md"
        >
          AI-powered instrument recognition, sacred note extraction, and
          celestial music intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <HeroButtons />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
