import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Music, BarChart3, History, Settings, GitCompare, Sparkles, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { MusicParticles } from "@/components/AnimatedBackground";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AppShellProps {
  children: ReactNode;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

const NAV = [
  { icon: Home, label: "Home", route: "/" },
  { icon: Music, label: "Studio", route: "/dashboard" },
  { icon: BarChart3, label: "Analytics", route: "/analytics" },
  { icon: History, label: "History", route: "/history" },
  { icon: GitCompare, label: "Compare", route: "/compare" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const AppShell = ({ children, title, subtitle, actions, showBack }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);

  const activeRoute = NAV.find((n) => n.route === location.pathname)?.route ?? null;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="relative min-h-screen flex flex-col gradient-hero overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb" style={{ width: 520, height: 520, top: -160, left: -120, background: "hsl(var(--violet-glow) / 0.35)" }} />
      <div className="ambient-orb" style={{ width: 600, height: 600, bottom: -200, right: -160, background: "hsl(var(--neon-cyan) / 0.18)" }} />
      <div className="ambient-orb" style={{ width: 400, height: 400, top: "40%", left: "45%", background: "hsl(var(--accent) / 0.12)" }} />
      <MusicParticles />

      {/* Top bar */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between">
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9 hover:bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-lg text-gradient tracking-tight">Gandharva</h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Studio</p>
            </div>
          </div>
        </motion.div>

        <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {actions}
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full hidden sm:inline-flex">
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate("/auth")} className="rounded-full">
              Sign in
            </Button>
          )}
        </motion.div>
      </header>

      {/* Page heading */}
      <motion.div className="relative z-10 px-6 pt-2 pb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">{subtitle}</p>}
      </motion.div>

      {/* Content
          - Mobile (<600): single column, bottom dock, padding for dock
          - Tablet (600-1024): compact icon sidebar on the left
          - Desktop (>1024): full sidebar with labels, multi-column friendly */}
      <div className="relative z-10 flex-1 px-4 sm:px-6 pb-28 md:pb-10 md:pl-20 lg:pl-24 overflow-y-auto">{children}</div>

      {/* iOS liquid-glass dock — mobile bottom (<600px only) */}
      <motion.nav
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 glass-strong rounded-full px-2 py-2 flex items-center gap-1 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-[95vw] overflow-x-auto"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onMouseLeave={() => setHovered(null)}
      >
        {NAV.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              onMouseEnter={() => setHovered(item.route)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full"
            >
              {isActive && (
                <motion.div
                  layoutId="liquidActiveMobile"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--accent) / 0.25))",
                    boxShadow: "0 0 20px hsl(var(--primary) / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
                    border: "1px solid hsl(var(--primary) / 0.3)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="h-4 w-4" />
              </span>
              <span className={`relative z-10 text-[9px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.nav>

      {/* iOS liquid-glass sidebar — tablet (compact, icons only) + desktop (with hover labels) */}
      <motion.nav
        className="hidden md:flex fixed left-3 lg:left-4 top-1/2 -translate-y-1/2 z-30 glass-strong rounded-2xl px-2 py-3 flex-col items-center gap-1 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onMouseLeave={() => setHovered(null)}
      >
        {NAV.map((item) => {
          const isActive = activeRoute === item.route;
          const isHovered = hovered === item.route;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              onMouseEnter={() => setHovered(item.route)}
              className="group relative h-11 w-11 rounded-xl flex items-center justify-center"
            >
              {isActive && (
                <motion.div
                  layoutId="liquidActiveDesktop"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.28), hsl(var(--accent) / 0.28))",
                    boxShadow: "0 0 24px hsl(var(--primary) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.18)",
                    border: "1px solid hsl(var(--primary) / 0.35)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.span
                className={`relative z-10 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                animate={{ scale: isHovered && !isActive ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <item.icon className="h-4 w-4" />
              </motion.span>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="absolute left-14 px-2.5 py-1 rounded-lg glass-strong border border-white/10 text-xs whitespace-nowrap pointer-events-none text-foreground"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default AppShell;
