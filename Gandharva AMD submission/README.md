# Gandharva

> AI-powered, fully responsive music analysis platform — instrument recognition, note transcription, and multi-format exports across mobile, tablet, and desktop.

---

## Overview

**Gandharva** is a responsive, multi-device music platform designed to deliver a consistent and scalable user experience across mobile, tablet, and desktop environments. It uses a unified architecture with adaptive layouts and reusable components to ensure flexibility and performance.

It also performs real audio analysis: detecting instruments, transcribing pitch/notes, and exporting results as MIDI, MusicXML, PDF, CSV, and PNG sheet music — all branded with a themed watermark.

---

## Problem Statement

Modern music platforms often face the following challenges:

- Inconsistent user experience across devices
- Rigid UI layouts that do not adapt well to different screen sizes
- Duplication of code when handling mobile and desktop separately
- Poor performance due to inefficient rendering strategies

---

## Solution

Gandharva solves these problems by implementing:

- A **mobile-first responsive architecture**
- A **single codebase** with adaptive layout rendering
- A **component-driven UI system** that dynamically adjusts based on screen size
- Efficient **navigation patterns** tailored to each device class

---

## System Architecture

Gandharva follows a layered architecture:

### 1. Presentation Layer (UI)
- Renders the user interface using responsive design principles
- Dynamically switches layouts based on screen-width breakpoints
- Built with reusable shadcn/ui + Tailwind components

### 2. Application Layer (Logic)
- Handles navigation and routing (React Router)
- Manages state and user interactions (React hooks + Context)
- Controls conditional rendering of layouts (mobile, tablet, desktop)
- Orchestrates analysis pipeline (preprocess → features → classify → pitch)

### 3. Data Layer
- Persists projects, notes, and analyses in **Lovable Cloud** (Postgres + Auth + RLS)
- Backend audio analysis runs in an Edge Function powered by **Lovable AI Gateway (Gemini 2.5 Flash)**

---

## Workflow

1. User accesses the application (mobile / tablet / desktop)
2. System detects screen size using Tailwind breakpoints
3. The appropriate layout is selected:
   - **Mobile (<600px)** → single-column layout with bottom navigation dock
   - **Tablet (600–1024px)** → two-column layout with compact icon sidebar
   - **Desktop (>1024px)** → multi-column layout with full sidebar and secondary panels
4. UI components render dynamically with lazy loading where appropriate
5. User interactions (upload, record, navigate, export) are handled by the application layer
6. Data is fetched/stored through the cloud data layer

---

## Tech Stack

### Frontend
- **React 18 + Vite 5 + TypeScript 5**
- **Tailwind CSS v3** — semantic design tokens, responsive utilities
- **shadcn/ui** — accessible component primitives
- **Framer Motion** — iOS-style liquid-glass nav transitions, page animations
- **Wavesurfer.js** — waveform visualization
- **React Router** — client-side routing

### State & Logic
- React Context + hooks for auth and live recording
- Conditional rendering driven by Tailwind breakpoints (`md:`, `lg:`)
- Reusable `<AppShell>` wrapper for consistent navigation across all pages

### Backend / Data
- **Lovable Cloud** (managed Postgres, Auth, Storage, Edge Functions)
- **Lovable AI Gateway** with Gemini 2.5 Flash for instrument & note detection
- Row-Level Security on all user data
- REST + RPC via the Supabase JS SDK

### Development Approach
- Built with Lovable for rapid UI generation
- Architecture and responsiveness structured manually for scalability

---

## Key Features

### 1. Responsive Layout Engine
| Breakpoint | Range       | Layout                                  | Navigation       |
| ---------- | ----------- | --------------------------------------- | ---------------- |
| Mobile     | `<600px`    | Single column, stacked panels           | Bottom dock      |
| Tablet     | `600–1024`  | Two-column grid, compact panels         | Icon sidebar     |
| Desktop    | `>1024px`   | 3-column (sidebar + main + notes panel) | Full sidebar     |

### 2. Adaptive Navigation System
- **Mobile** → iOS liquid-glass bottom navigation
- **Tablet** → compact icon-only sidebar
- **Desktop** → full sidebar with hover labels and animated active indicator (Framer Motion `layoutId`)

### 3. Dynamic Content Rendering
- Grid layouts (1 / 2 / 3-4 columns) for History, Analytics, Compare
- Tables convert to **card lists** on mobile
- Conditional rendering avoids loading unused layouts

### 4. Component Reusability
- Same components (NotesPanel, WaveformVisualizer, InstrumentDetector, etc.) used across all breakpoints
- Reduced duplication and improved maintainability

### 5. AI-Powered Analysis
- Upload or **live-record** audio in 5-second chunks
- Detect primary instrument + candidates with confidence bars
- Transcribe notes with frequency, start time, end time
- Extract tempo, key, mood

### 6. Branded Multi-Format Export
- **MIDI** (`.mid`) — proper timing, watermark in meta events
- **PDF Report** — sheet-style summary with diagonal watermark
- **CSV** — note name, frequency, start, end (Excel-ready)
- **MusicXML** — full notation software compatibility
- **PNG Sheet** — rendered staff with treble clef, notes, stems
- All exports include the themed **"Developed by Mohan Sriram Kunamsetty"** watermark (toggleable, with optional timestamp)

---

## Responsive Design Strategy

- **Mobile-first** design approach — base styles target the smallest screen
- **Breakpoint-based** layout switching using Tailwind's `md:` (768px / tablet tier) and `lg:` (1024px / desktop tier)
- **Flexible layouts** using `grid` and `flex` — no fixed widths
- Avoidance of fixed dimensions; content scales fluidly
- **Conditional rendering** instead of static `display: none` whenever possible, so heavy panels don't render off-screen

---

## Performance Optimization

- Lazy loading of heavy components (waveform, spectrogram, notes panel)
- Efficient rendering — only the active layout tier mounts (no duplicate trees)
- Optimized scrolling: single vertical scroll on mobile, multiple scroll regions on desktop
- Reduced re-renders via memoized stats and stable dependency arrays
- Edge-function analysis to keep the client thread free

---

## Scalability

- Single codebase serves all devices
- Modular page architecture — each route owns its layout and data fetching
- Easily extendable for new export formats, AI models, or live-collab features

---

## Project Structure

```
src/
├── components/
│   ├── layout/AppShell.tsx        # Responsive shell + adaptive nav
│   ├── NotesPanel.tsx             # Notes table → card list on mobile
│   ├── WaveformVisualizer.tsx
│   ├── SpectrogramDisplay.tsx
│   ├── InstrumentDetector.tsx
│   ├── InstrumentCandidates.tsx
│   └── AnalysisProgress.tsx
├── pages/
│   ├── Dashboard.tsx              # Studio (1/2/3-col adaptive grid)
│   ├── Analytics.tsx              # Stats (2-col mobile → 4-col desktop)
│   ├── History.tsx                # Cards (1 → 2 → 3 columns)
│   ├── Compare.tsx                # 2-up comparison (stacks on mobile)
│   ├── Settings.tsx
│   ├── Auth.tsx
│   └── Onboarding.tsx
├── hooks/
│   ├── useAuth.tsx
│   └── useLiveRecorder.tsx
├── lib/
│   ├── exporters.ts               # MIDI / PDF / CSV / MusicXML / PNG
│   └── audioUtils.ts
└── integrations/supabase/         # Auto-generated client
supabase/
└── functions/analyze-audio/       # Gemini-powered analysis edge function
```

---

## Future Enhancements

- AI-based music recommendation system
- Real-time streaming optimization (true WebSocket pipeline)
- Offline caching support (PWA)
- Advanced analytics and personalization
- Collaborative session sharing
- On-device pitch detection (CREPE / Basic Pitch in WASM)

---

## Conclusion

Gandharva demonstrates how a unified responsive architecture can deliver a scalable, efficient, and consistent user experience across multiple platforms — without maintaining separate implementations — while combining a premium Apple-event-style aesthetic with real AI-powered audio analysis.

---

**Developed by Mohan Sriram Kunamsetty**
