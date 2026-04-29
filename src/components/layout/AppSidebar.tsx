import { motion, AnimatePresence } from "framer-motion";
import { Home, AudioWaveform, History, Scale, Music2, FileText, BarChart3, Settings, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/gandharva-logo.png";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Analysis", icon: AudioWaveform, path: "/dashboard" },
  { label: "History", icon: History, path: "/history" },
  { label: "Compare", icon: Scale, path: "/compare" },
  { label: "Library", icon: Music2, path: "/library" },
  { label: "Exports", icon: FileText, path: "/exports" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

/**
 * Ornamental gold corner SVG used at the four corners of the sidebar.
 */
const GoldCorner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={cn("w-10 h-10 text-gold/80", className)} fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M2 18 V4 H18" strokeLinecap="round" />
    <path d="M6 14 V8 H14" strokeLinecap="round" opacity="0.7" />
    <circle cx="4" cy="4" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { pathname } = useLocation();
  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* Deep navy base — matches logo background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #0b1430 0%, #060a1c 45%, #020617 100%)",
        }}
      />
      {/* Divine golden ambient bloom */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 12%, hsl(var(--gold-glow) / 0.18) 0%, transparent 38%), radial-gradient(circle at 50% 92%, hsl(var(--gold) / 0.10) 0%, transparent 45%)",
        }}
      />
      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Floating shimmer particles — capped count, GPU-friendly transforms,
          paused when the tab is offscreen via Framer Motion's automatic
          requestAnimationFrame throttling. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{ contain: "layout paint", willChange: "transform" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: "hsl(var(--gold-glow))",
              boxShadow: "0 0 8px hsl(var(--gold-glow) / 0.9)",
              opacity: 0.55,
              willChange: "transform, opacity",
            }}
            animate={{
              transform: ["translateY(0px)", "translateY(-14px)", "translateY(0px)"],
              opacity: [0.25, 0.85, 0.25],
            }}
            transition={{
              duration: 8 + (i % 5),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Engraved gold double border */}
      <div className="pointer-events-none absolute inset-2 rounded-2xl border border-gold/45 shadow-[inset_0_0_30px_hsl(var(--gold)/0.08)]" />
      <div className="pointer-events-none absolute inset-[10px] rounded-2xl border border-gold/15" />

      {/* Ornamental corners */}
      <GoldCorner className="absolute top-1.5 left-1.5" />
      <GoldCorner className="absolute top-1.5 right-1.5 rotate-90" />
      <GoldCorner className="absolute bottom-1.5 left-1.5 -rotate-90" />
      <GoldCorner className="absolute bottom-1.5 right-1.5 rotate-180" />

      {/* Logo — uses uploaded artwork as primary identity */}
      <div className="relative z-10 pt-9 pb-5 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative mx-auto w-[120px] h-[120px] flex items-center justify-center"
        >
          {/* Divine radial aura behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--gold-glow) / 0.45) 0%, hsl(var(--gold) / 0.18) 35%, transparent 70%)",
              filter: "blur(6px)",
            }}
            animate={{ opacity: [0.55, 0.95, 0.55], scale: [1, 1.06, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <img
            src={logoImg}
            alt="Gandharva"
            className="relative z-10 w-[112px] h-[112px] object-contain drop-shadow-[0_0_18px_hsl(var(--gold-glow)/0.55)]"
            style={{
              maskImage:
                "radial-gradient(circle at 50% 45%, black 62%, transparent 78%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 45%, black 62%, transparent 78%)",
            }}
          />
        </motion.div>
        <h1
          className="font-cinzel text-[22px] tracking-[0.32em] mt-2 font-semibold"
          style={{
            background:
              "linear-gradient(180deg, #F6C453 0%, #D4AF37 55%, #B8902B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 10px hsl(var(--gold-glow) / 0.45))",
          }}
        >
          GANDHARVA
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-px w-10 bg-gradient-to-r from-transparent via-gold/70 to-gold/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-gold-glow shadow-[0_0_8px_hsl(var(--gold-glow))]" />
          <div className="h-px w-10 bg-gradient-to-l from-transparent via-gold/70 to-gold/30" />
        </div>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar relative z-10 flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item, i) => {
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.2, duration: 0.5 }}
            >
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className="group relative block"
              >
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all duration-500",
                    "border border-transparent overflow-hidden",
                    isActive
                      ? "text-gold-glow border-gold/60"
                      : "text-cream/70 hover:text-gold-glow hover:border-gold/25"
                  )}
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(90deg, hsl(var(--gold) / 0.22) 0%, hsl(var(--gold) / 0.06) 60%, transparent 100%)",
                          boxShadow:
                            "inset 0 1px 0 hsl(var(--gold-glow) / 0.25), inset 0 0 18px hsl(var(--gold) / 0.18), 0 0 22px hsl(var(--gold-glow) / 0.22)",
                        }
                      : undefined
                  }
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebarActiveBar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-gradient-to-b from-gold-glow via-gold to-gold/40 shadow-[0_0_12px_hsl(var(--gold-glow))]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Hover shimmer */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] transition-transform duration-300",
                      "group-hover:scale-110",
                      isActive ? "text-gold-glow" : "text-gold/70"
                    )}
                  />
                  <span className="font-cinzel text-[15px] tracking-[0.12em] uppercase">
                    {item.label}
                  </span>
                </div>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 px-6 pb-8 pt-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold" fill="currentColor">
            <path d="M12 2 C14 6 18 8 22 8 C18 10 14 12 12 22 C10 12 6 10 2 8 C6 8 10 6 12 2 Z" opacity="0.85" />
          </svg>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
        </div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-cream/50 font-cinzel">Developed by</p>
        <p className="text-[12px] tracking-wide text-gold-glow font-cinzel mt-0.5">
          Mohan Sriram Kunamsetty
        </p>
      </div>
    </div>
  );
};

const AppSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 h-11 w-11 rounded-xl border border-gold/40 bg-black/40 backdrop-blur-md flex items-center justify-center text-gold-glow shadow-[0_0_20px_hsl(var(--gold)/0.25)]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-[280px] z-30">
        <SidebarContent />
      </aside>

      {/* Tablet compact sidebar (md to lg) */}
      <aside className="hidden md:block lg:hidden fixed left-0 top-0 h-screen w-[88px] z-30">
        <CompactSidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-screen w-[280px] z-50 lg:hidden"
            >
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-lg flex items-center justify-center text-gold-glow hover:bg-gold/10"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* Compact (tablet) variant — icons only */
const CompactSidebar = () => {
  const { pathname } = useLocation();
  return (
    <div className="relative h-full w-full overflow-hidden no-scrollbar">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #0b1430 0%, #060a1c 50%, #020617 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-2 rounded-2xl border border-gold/40 shadow-[inset_0_0_24px_hsl(var(--gold)/0.08)]" />
      <div className="pt-6 pb-4 flex justify-center">
        <svg viewBox="0 0 64 64" className="w-9 h-9 text-gold" fill="currentColor">
          <path d="M32 4 L36 14 L46 14 L38 21 L41 31 L32 25 L23 31 L26 21 L18 14 L28 14 Z" />
        </svg>
      </div>
      <nav className="px-2 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={cn(
                "group relative flex items-center justify-center h-12 w-full rounded-xl transition-all",
                isActive
                  ? "text-gold-glow border border-gold/50 bg-gold/10 shadow-[0_0_18px_hsl(var(--gold)/0.25)]"
                  : "text-gold/70 hover:text-gold-glow hover:bg-gold/5"
              )}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AppSidebar;