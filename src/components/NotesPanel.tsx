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
    <div className="space-y-5">
      {/* Detected Notes */}
      <div className="glass-card glass-card-hover p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20">
              <Music className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="panel-heading text-sm">Detected Notes</h3>
          </div>
          {notes.length > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">
              {notes.length}
            </span>
          )}
        </div>
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {isAnalyzing ? "Analyzing audio…" : "No notes detected yet"}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 -mr-1">
            {notes.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center font-display text-[11px] text-primary font-semibold">
                    {n.note}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {n.frequency.toFixed(1)} Hz
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {n.start.toFixed(2)}–{n.end.toFixed(2)}s
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card glass-card-hover p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-violet/15 border border-violet/20">
            <Clock className="h-3.5 w-3.5 text-violet" />
          </div>
          <h3 className="panel-heading text-sm">Piano Roll</h3>
        </div>
        {notes.length > 0 ? (
          <div className="relative h-24 rounded-xl bg-black/20 border border-white/5 p-2 overflow-hidden">
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
                  className="absolute h-2.5 rounded-md origin-left"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `${top * 0.8}%`,
                    background: `linear-gradient(90deg, hsl(180,100%,55%), hsl(270,80%,65%))`,
                    boxShadow: "0 0 12px hsl(var(--primary) / 0.4)",
                    opacity: 0.9,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center rounded-xl bg-black/20 border border-white/5">
            <p className="text-xs text-muted-foreground">
              Notes will appear here
            </p>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="glass-card glass-card-hover p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20">
            <Download className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="panel-heading text-sm">Export</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {["MIDI File", "PDF Report", "CSV Notes"].map((label) => (
            <Button
              key={label}
              variant="glass"
              size="sm"
              className="justify-between text-xs rounded-xl h-10 border border-white/5 hover:border-primary/30"
              disabled={notes.length === 0}
            >
              <span className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5" />
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                .{label.split(" ")[0].toLowerCase()}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;
