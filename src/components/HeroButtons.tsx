import { motion } from "framer-motion";
import { Upload, Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrnateButtonProps {
  variant: "gold" | "ruby";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const OrnateButton = ({ variant, icon, title, subtitle, onClick }: OrnateButtonProps) => {
  const isGold = variant === "gold";
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "group relative px-7 py-3.5 rounded-md overflow-hidden",
        "border-2 backdrop-blur-md",
        isGold
          ? "border-gold/70 bg-black/30"
          : "border-[#7a1f24]/80 bg-[#3a0a0d]/60"
      )}
      style={{
        boxShadow: isGold
          ? "0 0 24px hsl(var(--gold)/0.35), inset 0 0 16px hsl(var(--gold)/0.18)"
          : "0 0 22px rgba(196, 30, 58, 0.35), inset 0 0 14px rgba(196, 30, 58, 0.2)",
      }}
    >
      {/* Inner gold double border */}
      <span
        className={cn(
          "pointer-events-none absolute inset-1 rounded-sm border",
          isGold ? "border-gold/40" : "border-gold/30"
        )}
      />
      {/* Shimmer */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] ease-out bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

      <span className="relative flex items-center gap-3 text-left">
        <span className="text-gold-glow drop-shadow-[0_0_8px_hsl(var(--gold-glow)/0.7)]">
          {icon}
        </span>
        <span className="leading-tight">
          <span className="block font-cinzel text-base sm:text-lg text-gold-glow tracking-wider">
            {title}
          </span>
          <span className="block text-[11px] sm:text-xs text-cream/70 tracking-wide">
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