import jsPDF from "jspdf";

export interface ExportNote {
  note: string;
  start: number;
  end: number;
  frequency: number;
}

/* ---------------- Watermark ---------------- */
export const WATERMARK_TEXT = "Developed by Mohan Sriram Kunamsetty";

export interface WatermarkOptions {
  enabled?: boolean;       // default true
  includeTimestamp?: boolean; // default true
}

const wmLine = (opts?: WatermarkOptions) => {
  const enabled = opts?.enabled ?? true;
  if (!enabled) return "";
  const ts = (opts?.includeTimestamp ?? true) ? ` • ${new Date().toLocaleString()}` : "";
  return `${WATERMARK_TEXT}${ts}`;
};

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
export const exportNotesAsCSV = (
  notes: ExportNote[],
  baseName = "gandharva-notes",
  wm?: WatermarkOptions
) => {
  const watermark = wmLine(wm);
  const wmHeader = watermark ? `# ${watermark}\n# Gandharva — AI Music Transcription\n` : "";
  const header = "note,frequency_hz,start_seconds,end_seconds,duration_seconds\n";
  const rows = notes
    .map(
      (n) =>
        `${n.note},${n.frequency.toFixed(2)},${n.start.toFixed(3)},${n.end.toFixed(
          3
        )},${(n.end - n.start).toFixed(3)}`
    )
    .join("\n");
  const footer = watermark ? `\n# ${watermark}\n` : "";
  const blob = new Blob([wmHeader + header + rows + footer], { type: "text/csv;charset=utf-8" });
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

export const exportNotesAsMIDI = (
  notes: ExportNote[],
  baseName = "gandharva-notes",
  wm?: WatermarkOptions
) => {
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

  // Watermark as MIDI meta events (Text 0x01, Copyright 0x02, Track Name 0x03)
  const watermark = wmLine(wm);
  if (watermark) {
    const encode = (s: string) => Array.from(new TextEncoder().encode(s));
    const writeMeta = (type: number, text: string) => {
      const data = encode(text);
      trackBytes.push(0x00, 0xff, type, ...writeVarLen(data.length), ...data);
    };
    writeMeta(0x03, "Gandharva Transcription"); // Track name
    writeMeta(0x02, watermark);                  // Copyright notice
    writeMeta(0x01, watermark);                  // Generic text
  }

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
  baseName = "gandharva-report",
  wm?: WatermarkOptions
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
  const watermark = wmLine(wm);
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Gandharva • Page ${p} of ${pageCount}`, pageW / 2, pageH - 20, { align: "center" });

    if (watermark) {
      // Diagonal centered watermark — semi-transparent cyan/white tint
      const gs: any = (doc as any).GState ? new (doc as any).GState({ opacity: 0.12 }) : null;
      if (gs) (doc as any).setGState(gs);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(46);
      doc.setTextColor(0, 200, 220);
      doc.text(WATERMARK_TEXT, pageW / 2, pageH / 2, {
        align: "center",
        angle: -28,
      } as any);
      if (gs) (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));

      // Bottom-center highlighted credit line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setFillColor(20, 12, 40);
      const wmW = doc.getTextWidth(watermark) + 24;
      doc.roundedRect((pageW - wmW) / 2, pageH - 44, wmW, 18, 6, 6, "F");
      doc.setTextColor(126, 232, 255); // neon cyan accent
      doc.text(watermark, pageW / 2, pageH - 31, { align: "center" });
    }
  }

  doc.save(`${baseName}.pdf`);
};

/* ---------------- MusicXML ---------------- */
const STEP_ALTER: Record<string, { step: string; alter: number }> = {
  C: { step: "C", alter: 0 }, "C#": { step: "C", alter: 1 }, Db: { step: "D", alter: -1 },
  D: { step: "D", alter: 0 }, "D#": { step: "D", alter: 1 }, Eb: { step: "E", alter: -1 },
  E: { step: "E", alter: 0 }, F: { step: "F", alter: 0 },
  "F#": { step: "F", alter: 1 }, Gb: { step: "G", alter: -1 },
  G: { step: "G", alter: 0 }, "G#": { step: "G", alter: 1 }, Ab: { step: "A", alter: -1 },
  A: { step: "A", alter: 0 }, "A#": { step: "A", alter: 1 }, Bb: { step: "B", alter: -1 },
  B: { step: "B", alter: 0 },
};

const noteToParts = (n: string) => {
  const m = n.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!m) return { step: "C", alter: 0, octave: 4 };
  const sa = STEP_ALTER[m[1]] ?? { step: "C", alter: 0 };
  return { ...sa, octave: parseInt(m[2], 10) };
};

export const exportNotesAsMusicXML = (
  notes: ExportNote[],
  meta: { title: string; instrument?: string | null },
  baseName = "gandharva-score",
  wm?: WatermarkOptions
) => {
  const DIVISIONS = 4;
  const measureNotes = notes
    .map((n) => {
      const dur = Math.max(1, Math.round((n.end - n.start) * DIVISIONS * 2));
      const { step, alter, octave } = noteToParts(n.note);
      return `      <note>
        <pitch>
          <step>${step}</step>${alter ? `\n          <alter>${alter}</alter>` : ""}
          <octave>${octave}</octave>
        </pitch>
        <duration>${dur}</duration>
        <type>${dur >= 8 ? "whole" : dur >= 4 ? "half" : dur >= 2 ? "quarter" : "eighth"}</type>
      </note>`;
    })
    .join("\n");

  const watermark = wmLine(wm);
  const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const wmComment = watermark ? `<!-- ${xmlEscape(watermark)} -->\n` : "";
  const creditBlock = watermark
    ? `  <credit page="1">
    <credit-words font-size="11" justify="center" valign="bottom" default-x="600" default-y="40">${xmlEscape(watermark)}</credit-words>
  </credit>
  `
    : "";
  const rightsLine = watermark ? `<rights>${xmlEscape(WATERMARK_TEXT)}</rights>` : "";
  const miscField = watermark
    ? `<miscellaneous><miscellaneous-field name="watermark">${xmlEscape(watermark)}</miscellaneous-field></miscellaneous>`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${wmComment}<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${meta.title}</work-title></work>
  <identification>
    <creator type="composer">Gandharva AI</creator>
    ${rightsLine}
    ${miscField}
  </identification>
${creditBlock}<part-list>
    <score-part id="P1"><part-name>${meta.instrument ?? "Instrument"}</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
${measureNotes}
    </measure>
  </part>
</score-partwise>`;
  triggerDownload(new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" }), `${baseName}.musicxml`);
};

/* ---------------- PNG sheet rendering ---------------- */
export const exportNotesAsPNG = (
  notes: ExportNote[],
  meta: { title: string; instrument?: string | null; confidence?: number },
  baseName = "gandharva-sheet",
  wm?: WatermarkOptions
) => {
  const W = 1400, H = 600;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0b0820");
  grad.addColorStop(1, "#050211");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = "#e5f9ff";
  ctx.font = "600 28px Inter, sans-serif";
  ctx.fillText(meta.title, 60, 60);
  ctx.fillStyle = "#7ee8ff";
  ctx.font = "400 16px Inter, sans-serif";
  ctx.fillText(
    `${meta.instrument ?? "Unknown instrument"}${meta.confidence != null ? ` • ${meta.confidence}% confidence` : ""}`,
    60, 88
  );

  // Staff
  const staffTop = 200;
  const staffGap = 14;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(60, staffTop + i * staffGap);
    ctx.lineTo(W - 60, staffTop + i * staffGap);
    ctx.stroke();
  }
  // Treble clef glyph (approx)
  ctx.fillStyle = "#7ee8ff";
  ctx.font = "italic 800 60px Georgia, serif";
  ctx.fillText("𝄞", 70, staffTop + 50);

  // Notes layout (single line)
  const noteAreaX = 160, noteAreaW = W - 220;
  const maxNotes = Math.min(notes.length, 32);
  const slot = noteAreaW / Math.max(1, maxNotes);
  notes.slice(0, maxNotes).forEach((n, i) => {
    const cx = noteAreaX + slot * i + slot / 2;
    // Map midi (48..84) to staff y
    const midi = (() => {
      const m = n.note.match(/^([A-G][#b]?)(-?\d+)$/);
      if (!m) return 60;
      const semis: Record<string, number> = { C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11 };
      return (parseInt(m[2], 10) + 1) * 12 + (semis[m[1]] ?? 0);
    })();
    const ratio = (84 - midi) / 36;
    const cy = staffTop - 20 + ratio * 90;

    // Note head
    ctx.fillStyle = "#5eead4";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.strokeStyle = "#5eead4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy);
    ctx.lineTo(cx + 7, cy - 36);
    ctx.stroke();
    // Label
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 11px Inter, sans-serif";
    ctx.fillText(n.note, cx - 10, cy + 28);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 12px Inter, sans-serif";
  ctx.fillText(`Gandharva • ${notes.length} notes • ${new Date().toLocaleString()}`, 60, H - 30);

  // Watermark — diagonal large + bottom-center pill, themed in neon cyan
  const watermark = wmLine(wm);
  if (watermark) {
    // Diagonal big watermark
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 9);
    const grad2 = ctx.createLinearGradient(-400, 0, 400, 0);
    grad2.addColorStop(0, "rgba(126, 232, 255, 0.18)");
    grad2.addColorStop(0.5, "rgba(168, 132, 255, 0.22)");
    grad2.addColorStop(1, "rgba(126, 232, 255, 0.18)");
    ctx.fillStyle = grad2;
    ctx.font = "800 56px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(WATERMARK_TEXT, 0, 0);
    ctx.restore();

    // Bottom-center highlighted pill
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 14px Inter, sans-serif";
    const padX = 18, padY = 10;
    const textW = ctx.measureText(watermark).width;
    const pillW = textW + padX * 2;
    const pillH = 30;
    const pillX = (W - pillW) / 2;
    const pillY = H - 60;
    // pill bg
    ctx.fillStyle = "rgba(11, 8, 32, 0.75)";
    const r = pillH / 2;
    ctx.beginPath();
    ctx.moveTo(pillX + r, pillY);
    ctx.lineTo(pillX + pillW - r, pillY);
    ctx.arc(pillX + pillW - r, pillY + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(pillX + r, pillY + pillH);
    ctx.arc(pillX + r, pillY + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    // pill border (cyan glow)
    ctx.strokeStyle = "rgba(126, 232, 255, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // text
    ctx.fillStyle = "#7ee8ff";
    ctx.fillText(watermark, W / 2, pillY + pillH / 2 + 1);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `${baseName}.png`);
  }, "image/png");
};
