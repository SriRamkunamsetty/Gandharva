import { motion } from "framer-motion";
import { Music, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Note {
  note: string;
  start: number;
  end: number;
  frequency: number;
}

interface NotesPanelProps {
  notes: Note[];
  isAnalyzing: boolean;
}

const PIANO_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const NotesPanel = ({ notes, isAnalyzing }: NotesPanelProps) => {
  return (
    <div className="space-y-4">
      {/* Detected Notes */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          Detected Notes
        </h3>
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {isAnalyzing ? "Analyzing audio..." : "No notes detected yet"}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {notes.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50 text-sm"
              >
                <span className="font-display text-primary font-semibold">{n.note}</span>
                <span className="text-xs text-muted-foreground">
                  {n.start.toFixed(2)}s – {n.end.toFixed(2)}s
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-violet" />
          Timeline
        </h3>
        {notes.length > 0 ? (
          <div className="relative h-20">
            {/* Mini piano roll */}
            {notes.map((n, i) => {
              const maxEnd = Math.max(...notes.map((x) => x.end), 1);
              const left = (n.start / maxEnd) * 100;
              const width = Math.max(((n.end - n.start) / maxEnd) * 100, 2);
              const noteIdx = PIANO_KEYS.indexOf(n.note.replace(/[0-9]/g, ""));
              const top = ((11 - noteIdx) / 12) * 100;

              return (
                <motion.div
                  key={i}
                  className="absolute h-3 rounded-sm"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `${top * 0.8}%`,
                    background: `linear-gradient(90deg, hsl(180,100%,50%), hsl(270,80%,60%))`,
                    opacity: 0.8,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Play to see note timeline</p>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Export
        </h3>
        <div className="flex flex-col gap-2">
          {["MIDI File", "PDF Report", "CSV Notes"].map((label) => (
            <Button
              key={label}
              variant="glass"
              size="sm"
              className="justify-start text-xs"
              disabled={notes.length === 0}
            >
              <Download className="h-3 w-3 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;
