import jsPDF from "jspdf";

export interface ExportNote {
  note: string;
  start: number;
  end: number;
  frequency: number;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ---------------- CSV ---------------- */
export const exportNotesAsCSV = (notes: ExportNote[], baseName = "gandharva-notes") => {
  const header = "note,frequency_hz,start_seconds,end_seconds,duration_seconds\n";
  const rows = notes
    .map(
      (n) =>
        `${n.note},${n.frequency.toFixed(2)},${n.start.toFixed(3)},${n.end.toFixed(
          3
        )},${(n.end - n.start).toFixed(3)}`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${baseName}.csv`);
};

/* ---------------- MIDI ---------------- */
const NOTE_TO_MIDI: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

const noteNameToMidi = (noteName: string): number => {
  const m = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!m) return 60;
  const [, pitch, octStr] = m;
  const octave = parseInt(octStr, 10);
  return (octave + 1) * 12 + (NOTE_TO_MIDI[pitch] ?? 0);
};

const writeVarLen = (value: number): number[] => {
  const buffer: number[] = [value & 0x7f];
  while ((value >>= 7)) buffer.unshift(0x80 | (value & 0x7f));
  return buffer;
};

export const exportNotesAsMIDI = (notes: ExportNote[], baseName = "gandharva-notes") => {
  const TICKS_PER_QUARTER = 480;
  const TEMPO_BPM = 120;
  const TICKS_PER_SECOND = (TICKS_PER_QUARTER * TEMPO_BPM) / 60;

  // Build event list (absolute ticks)
  type Evt = { tick: number; type: "on" | "off"; midi: number };
  const events: Evt[] = [];
  notes.forEach((n) => {
    const startTick = Math.round(n.start * TICKS_PER_SECOND);
    const endTick = Math.max(startTick + 1, Math.round(n.end * TICKS_PER_SECOND));
    const midi = Math.max(0, Math.min(127, noteNameToMidi(n.note)));
    events.push({ tick: startTick, type: "on", midi });
    events.push({ tick: endTick, type: "off", midi });
  });
  events.sort((a, b) => a.tick - b.tick || (a.type === "off" ? -1 : 1));

  // Track bytes
  const trackBytes: number[] = [];
  // Tempo meta event (microseconds per quarter)
  const microsPerQuarter = Math.round(60_000_000 / TEMPO_BPM);
  trackBytes.push(0x00, 0xff, 0x51, 0x03,
    (microsPerQuarter >> 16) & 0xff,
    (microsPerQuarter >> 8) & 0xff,
    microsPerQuarter & 0xff);

  let lastTick = 0;
  events.forEach((e) => {
    const delta = e.tick - lastTick;
    lastTick = e.tick;
    trackBytes.push(...writeVarLen(delta));
    if (e.type === "on") trackBytes.push(0x90, e.midi, 100);
    else trackBytes.push(0x80, e.midi, 0);
  });
  // End of track
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Header chunk
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // length
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (TICKS_PER_QUARTER >> 8) & 0xff, TICKS_PER_QUARTER & 0xff,
  ];
  const trackHeader = [0x4d, 0x54, 0x72, 0x6b]; // "MTrk"
  const len = trackBytes.length;
  const trackLen = [(len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff];

  const out = new Uint8Array([...header, ...trackHeader, ...trackLen, ...trackBytes]);
  triggerDownload(new Blob([out], { type: "audio/midi" }), `${baseName}.mid`);
};

/* ---------------- PDF ---------------- */
export const exportAnalysisAsPDF = (
  meta: { title: string; instrument: string | null; confidence: number; fileName?: string | null },
  notes: ExportNote[],
  baseName = "gandharva-report"
) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 56;

  // Header band
  doc.setFillColor(20, 12, 40);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(0, 230, 230);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Gandharva", 40, 50);
  doc.setTextColor(180, 180, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("AI Music Transcription Report", 40, 70);

  y = 130;
  doc.setTextColor(30, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(meta.title, 40, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 90);
  if (meta.fileName) {
    doc.text(`Source: ${meta.fileName}`, 40, y);
    y += 16;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
  y += 24;

  // Instrument card
  doc.setDrawColor(220);
  doc.setFillColor(245, 245, 252);
  doc.roundedRect(40, y, pageW - 80, 70, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 60);
  doc.text("Detected Instrument", 56, y + 22);
  doc.setFontSize(20);
  doc.setTextColor(80, 40, 200);
  doc.text(meta.instrument ?? "Unknown", 56, y + 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 90);
  doc.text(`Confidence: ${meta.confidence}%`, pageW - 200, y + 50);
  y += 96;

  // Notes table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 60);
  doc.text(`Detected Notes (${notes.length})`, 40, y);
  y += 14;

  doc.setFontSize(10);
  doc.setFillColor(20, 12, 40);
  doc.setTextColor(255, 255, 255);
  doc.rect(40, y, pageW - 80, 22, "F");
  doc.text("Note", 56, y + 15);
  doc.text("Frequency (Hz)", 160, y + 15);
  doc.text("Start (s)", 300, y + 15);
  doc.text("End (s)", 380, y + 15);
  doc.text("Duration (s)", 460, y + 15);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 40);
  notes.forEach((n, i) => {
    if (y > pageH - 60) {
      doc.addPage();
      y = 60;
    }
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 252);
      doc.rect(40, y, pageW - 80, 18, "F");
    }
    doc.text(n.note, 56, y + 13);
    doc.text(n.frequency.toFixed(2), 160, y + 13);
    doc.text(n.start.toFixed(2), 300, y + 13);
    doc.text(n.end.toFixed(2), 380, y + 13);
    doc.text((n.end - n.start).toFixed(2), 460, y + 13);
    y += 18;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Gandharva • Page ${p} of ${pageCount}`, pageW / 2, pageH - 20, { align: "center" });
  }

  doc.save(`${baseName}.pdf`);
};
