import { useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileAudio } from "lucide-react";

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
      className={`glass rounded-xl p-6 border-2 border-dashed transition-colors cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
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
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-3 py-4">
        {fileName ? (
          <>
            <FileAudio className="h-10 w-10 text-primary" />
            <p className="text-sm text-foreground font-medium truncate max-w-full">
              {fileName}
            </p>
            <p className="text-xs text-muted-foreground">Click to change file</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop audio or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              WAV, MP3, FLAC, OGG supported
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AudioUploader;
