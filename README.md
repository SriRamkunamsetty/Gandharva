# 🎵 Gandharva — AI Music Transcription Studio

> Turn any audio into instruments, notes, sheet music, and MIDI — powered by AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-7c3aed)](https://lovable.dev)

**Live demo:** https://gandharva85.lovable.app

---

## 📖 Table of Contents
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [System Workflow](#-system-workflow)
- [Block Diagram](#-block-diagram)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🧩 Problem Statement

Musicians, students, producers, and researchers often need to transcribe audio recordings into a structured musical representation — identifying the instrument, extracting notes with timing, and exporting to formats like MIDI or sheet music.

Existing solutions are either:
- 🔒 **Closed/expensive** desktop apps (Melodyne, AnthemScore)
- 🧪 **Hard to use** (CREPE, Basic Pitch require Python + ML setup)
- 📉 **Inaccurate** for polyphonic or multi-instrument input
- 🌐 **Not collaborative** — no cloud history, no sharing, no comparison

## 💡 Solution

**Gandharva** is a fully cloud-native, AI-powered transcription studio that runs in the browser. Upload an audio file or record live from your microphone, and within seconds you get:

- 🎻 **Instrument detection** with top-3 confidence scoring
- 🎼 **Note transcription** (scientific pitch notation, frequency, start/end timing)
- 🥁 **Tempo, key signature, and mood** detection
- 📊 **Visualizations:** waveform, spectrogram, piano roll, pitch curves
- 📤 **Multi-format export:** MIDI, MusicXML, CSV, branded PDF report, PNG sheet
- ☁️ **Cloud history** with reopen + project comparison overlay

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Live Mic Recording** | Stream microphone audio in 5-second chunks with near-real-time analysis |
| 📁 **File Upload** | Drag & drop WAV, MP3, FLAC, OGG |
| 🤖 **AI Analysis** | Multimodal Gemini via Lovable AI Gateway with 4-stage progress (preprocess → features → classify → pitch) |
| 🎯 **Confidence Visualization** | Animated bars for top instrument candidates |
| 📈 **Pitch Graph** | Frequency-over-time visualization |
| 🎹 **Piano Roll** | Color-coded note timeline |
| 💾 **Cloud Save** | Auto-save analyses to per-user history (RLS-protected) |
| 🔁 **Reopen Projects** | Restore any past analysis with full data |
| 🔀 **Compare Mode** | Overlay pitch curves & timelines from two projects |
| 📤 **5 Export Formats** | MIDI · MusicXML · CSV · PDF report · PNG sheet |
| ✨ **Onboarding Flow** | Animated 5-step welcome with skip + progress |
| 🍏 **iOS Liquid Nav** | Glassmorphic dock with morphing active indicator |
| 🔐 **Auth** | Email/password + session persistence |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript 5** + **Vite 5**
- **Tailwind CSS** (HSL design tokens, glassmorphism)
- **Framer Motion** (liquid nav, page transitions, micro-interactions)
- **shadcn/ui** + **Radix UI** primitives
- **Lucide Icons**
- **jsPDF** (PDF report generation)
- **React Router v6**
- **Sonner** (toasts)

### Backend (Lovable Cloud / Supabase)
- **Supabase Postgres** with Row-Level Security
- **Supabase Auth** (email/password)
- **Supabase Edge Functions** (Deno runtime)
- **Lovable AI Gateway** → Google Gemini 2.5 Flash (multimodal audio understanding)

### Audio Processing
- **Web Audio API** for waveform & spectrogram rendering
- **MediaRecorder API** for live mic capture (chunked WebM/Opus)
- **Custom MIDI byte writer** (Format-0 SMF)
- **Custom MusicXML serializer** (3.1 Partwise)
- **Canvas 2D** for PNG sheet rendering

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │   React UI   │  │ MediaRecorder│  │  Web Audio API     │ │
│  │  (Vite/TSX)  │  │  (Live Mic)  │  │ (Waveform/Spectro) │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────┘ │
│         │                 │                                  │
│         └────────┬────────┘                                  │
│                  │ base64 audio                              │
└──────────────────┼──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  LOVABLE CLOUD (Supabase)                    │
│  ┌────────────────┐    ┌──────────────────┐    ┌──────────┐ │
│  │  Edge Function │───▶│ Lovable AI       │───▶│  Gemini  │ │
│  │ analyze-audio  │    │ Gateway          │    │ 2.5 Flash│ │
│  └────────┬───────┘    └──────────────────┘    └──────────┘ │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────┐    ┌──────────────────┐                 │
│  │  Postgres + RLS│    │  Supabase Auth   │                 │
│  │  projects      │    │ (email/password) │                 │
│  └────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 System Workflow

### Upload Flow
1. User drops audio file → `AudioUploader` component
2. File converted to **base64** + duration extracted via `<audio>` metadata
3. `AnalysisProgress` shows 4 stages: preprocess → features → classify → pitch
4. POST to `analyze-audio` edge function with `{ audioBase64, mimeType, fileName, durationHint }`
5. Edge function calls **Lovable AI Gateway** (Gemini 2.5 Flash) with **tool-calling** for structured output
6. Returns `{ instrument, confidence, candidates[], notes[], tempo_bpm, key, mood, summary }`
7. UI updates: instrument card, confidence bars, pitch graph, piano roll, notes list
8. Auto-save inserts row into `projects` table (if `prefs.autoSave !== false`)

### Live Mic Flow
1. `useLiveRecorder` hook requests `getUserMedia({ audio: true })`
2. `MediaRecorder` emits **5-second WebM chunks** via `ondataavailable`
3. Each chunk → `analyze-audio` edge function in parallel
4. Returned notes are **time-shifted** by `chunkIndex × 5s` and appended to state
5. Stop → `MediaRecorder.stop()` + tracks released

### Export Flow
- **MIDI**: Custom Format-0 SMF byte writer (variable-length delta times, tempo meta event)
- **MusicXML**: Score-Partwise 3.1 with treble clef, dynamic note duration mapping
- **PDF**: jsPDF with branded header band + alternating-row notes table
- **CSV**: Standard comma-separated with note/freq/start/end/duration
- **PNG**: HTML Canvas 2D — staff lines, treble clef glyph, note heads with stems

---

## 📦 Block Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  Onboarding ──▶ Auth ──▶ Studio ──▶ History/Analytics/Compare │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    DOMAIN LAYER                             │
│  AudioUploader │ LiveRecorder │ AnalysisProgress           │
│  WaveformViz   │ SpectrogramViz │ NotesPanel │ Candidates  │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    SERVICE LAYER                            │
│  exporters.ts (MIDI/CSV/PDF/MusicXML/PNG)                  │
│  audioUtils.ts (base64, duration)                          │
│  useLiveRecorder.tsx (MediaRecorder hook)                  │
│  useAuth.tsx (session management)                          │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    DATA LAYER                               │
│  Supabase Client │ Edge Functions │ Lovable AI Gateway     │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (or bun)

### Installation

```bash
git clone <YOUR_GIT_URL>
cd gandharva
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Lovable Cloud is auto-configured via `.env`.

### Editing on Lovable
Open the [Lovable project](https://lovable.dev) and start prompting. Changes commit automatically to this repo.

---

## 📁 Project Structure

```
gandharva/
├── src/
│   ├── components/
│   │   ├── layout/AppShell.tsx          # iOS liquid-glass nav
│   │   ├── AudioUploader.tsx
│   │   ├── WaveformVisualizer.tsx
│   │   ├── SpectrogramDisplay.tsx
│   │   ├── InstrumentDetector.tsx
│   │   ├── InstrumentCandidates.tsx     # Top-N confidence bars
│   │   ├── AnalysisProgress.tsx         # 4-stage progress
│   │   ├── NotesPanel.tsx               # Notes + piano roll + 5 exports
│   │   └── ui/                          # shadcn primitives
│   ├── pages/
│   │   ├── Index.tsx                    # Landing
│   │   ├── Onboarding.tsx               # 5-step animated intro
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx                # Studio
│   │   ├── History.tsx
│   │   ├── Analytics.tsx
│   │   ├── Compare.tsx                  # Overlay 2 projects
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   └── useLiveRecorder.tsx
│   ├── lib/
│   │   ├── exporters.ts                 # MIDI/CSV/PDF/MusicXML/PNG
│   │   └── audioUtils.ts
│   └── integrations/supabase/           # Auto-generated client + types
├── supabase/
│   ├── functions/analyze-audio/         # Gemini-powered analysis
│   └── migrations/                      # SQL migrations
├── LICENSE                              # MIT
└── README.md
```

---

## 🔮 Future Enhancements

- 🧠 **CREPE / Basic Pitch integration** via external Python service for sub-cent pitch accuracy
- 🎚️ **Polyphonic transcription** (multiple simultaneous instruments per track)
- 🎼 **VexFlow rendering** for in-browser interactive sheet music (zoom, edit, replay)
- 🥁 **Drum kit detection** and beat-grid quantization
- 🎤 **Vocal melody extraction** with lyrics alignment via Whisper
- 🌐 **Public sharing** of projects with embeddable players
- 👥 **Real-time collaboration** using Supabase Realtime channels
- 📱 **PWA / mobile app** with offline-first caching
- 🎹 **VST/MIDI keyboard input** for live transcription scoring
- 📊 **Evaluation suite** computing Precision, Recall, F1, onset accuracy, and cent deviation against ground-truth MIDI
- 🎵 **Style transfer** — re-render detected notes with a different instrument timbre
- 🌍 **Multilingual UI** (i18n)
- 🔌 **DAW plugins** (Logic, Ableton, FL Studio export presets)

---

## 📜 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ using <a href="https://lovable.dev">Lovable</a> · Powered by Lovable AI & Lovable Cloud
</p>
