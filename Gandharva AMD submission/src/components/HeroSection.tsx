import heroImage from "@/assets/hero-gandharva.png";
import HeroButtons from "@/components/HeroButtons";
import HeroFeatureIcons from "@/components/HeroFeatureIcons";
import { motion } from "framer-motion";

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

      {/* Very light readability gradient — keep mythological artwork dominant */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent lg:from-black/25" />

      {/* Hero overlay content (mobile/tablet only — desktop relies on the artwork itself) */}
      <div className="relative z-10 h-full w-full flex flex-col justify-end lg:justify-center px-6 sm:px-10 pb-32 sm:pb-36 lg:pb-0 lg:pl-12 xl:pl-16 max-w-2xl">
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

      {/* Bottom feature icon rail — direct, no glass card */}
      <div className="absolute bottom-8 sm:bottom-10 left-0 right-0 z-10 px-6 sm:px-10 lg:pl-12 xl:pl-16">
        <div className="max-w-2xl">
          <HeroFeatureIcons />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
