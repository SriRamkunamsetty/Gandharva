import { useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileAudio, Sparkles } from "lucide-react";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
}

const AudioUploader = ({ onFileSelect }: AudioUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        setFileName(file.name);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      className={`glass-card glass-card-hover relative p-6 cursor-pointer overflow-hidden ${
        isDragging ? "ring-2 ring-primary/60" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Decorative gradient ring */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleChange}
      />
      <div className="relative flex flex-col items-center gap-3 py-3 text-center">
        {fileName ? (
          <>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/25 to-accent/25 border border-primary/30">
              <FileAudio className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium truncate max-w-full px-2">
              {fileName}
            </p>
            <p className="text-[11px] text-muted-foreground">Tap to replace</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
              <Upload className="h-5 w-5 text-foreground/80" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop audio here
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                or click to browse — WAV, MP3, FLAC, OGG
              </p>
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary/80">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AudioUploader;
