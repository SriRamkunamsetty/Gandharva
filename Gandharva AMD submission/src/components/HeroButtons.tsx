import { motion } from "framer-motion";
import { Upload, Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Tiny engraved corner ornament (mythological filigree) */
const CornerOrnament = ({
  className,
  color,
}: {
  className?: string;
  color: string;
}) => (
  <svg
    viewBox="0 0 16 16"
    className={cn("absolute w-3 h-3", className)}
    fill="none"
    stroke={color}
    strokeWidth="1"
    strokeLinecap="round"
  >
    <path d="M1 6 V1 H6" />
    <path d="M3 4 V3 H4" opacity="0.7" />
    <circle cx="1.5" cy="1.5" r="0.7" fill={color} stroke="none" />
  </svg>
);

interface OrnateButtonProps {
  variant: "gold" | "ruby";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const OrnateButton = ({ variant, icon, title, subtitle, onClick }: OrnateButtonProps) => {
  const isGold = variant === "gold";
  const cornerColor = isGold ? "hsl(42 88% 64%)" : "hsl(42 75% 55%)";
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "group relative px-6 py-2.5 rounded-[6px] overflow-hidden",
        "border",
        isGold
          ? "border-gold/80"
          : "border-gold/60"
      )}
      style={{
        background: isGold
          ? "linear-gradient(180deg, #0a1024 0%, #050913 100%)"
          : "linear-gradient(180deg, #2a070a 0%, #14030a 100%)",
        boxShadow: isGold
          ? "0 0 18px hsl(var(--gold)/0.32), inset 0 0 14px hsl(var(--gold)/0.14), inset 0 1px 0 hsl(var(--gold-glow)/0.25)"
          : "0 0 16px rgba(140, 20, 35, 0.45), inset 0 0 14px rgba(120, 18, 30, 0.35), inset 0 1px 0 hsl(var(--gold)/0.18)",
      }}
    >
      {/* Inner gold engraved double border */}
      <span
        className={cn(
          "pointer-events-none absolute inset-[3px] rounded-[3px] border",
          isGold ? "border-gold/45" : "border-gold/35"
        )}
      />
      {/* Engraved corner ornaments — filigree feel */}
      <CornerOrnament color={cornerColor} className="top-1 left-1" />
      <CornerOrnament color={cornerColor} className="top-1 right-1 rotate-90" />
      <CornerOrnament color={cornerColor} className="bottom-1 left-1 -rotate-90" />
      <CornerOrnament color={cornerColor} className="bottom-1 right-1 rotate-180" />
      {/* Shimmer */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-gold/22 to-transparent" />

      <span className="relative flex items-center gap-3 text-left px-1">
        <span className="text-gold-glow drop-shadow-[0_0_6px_hsl(var(--gold-glow)/0.6)]">
          {icon}
        </span>
        <span className="leading-tight">
          <span className="block font-cinzel text-[15px] sm:text-base text-gold-glow tracking-[0.08em]">
            {title}
          </span>
          <span className="block text-[10px] sm:text-[11px] text-cream/65 tracking-wide">
            {subtitle}
          </span>
        </span>
      </span>
    </motion.button>
  );
};

const HeroButtons = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const navigate = useNavigate();

  const onUpload = () => fileRef.current?.click();
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`Loaded ${file.name}`);
    navigate("/dashboard");
  };

  const toggleRecord = () => {
    setRecording((r) => !r);
    if (!recording) {
      toast.info("Live recording started");
      navigate("/dashboard?mode=record");
    } else {
      toast.success("Recording stopped");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={onFileSelected}
      />
      <OrnateButton
        variant="gold"
        icon={<Upload className="h-5 w-5" />}
        title="Upload Audio"
        subtitle="Analyze from File"
        onClick={onUpload}
      />
      <OrnateButton
        variant="ruby"
        icon={recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        title={recording ? "Stop Recording" : "Start Live Recording"}
        subtitle={recording ? "Analyzing..." : "Record & Analyze"}
        onClick={toggleRecord}
      />
    </div>
  );
};

export default HeroButtons;