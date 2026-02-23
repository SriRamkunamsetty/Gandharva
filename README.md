# 🎵 Gandharva - AI Music Intelligence Platform

## 1. Project Overview

**Gandharva** is an advanced AI-powered Music Intelligence Platform designed to process uploaded or live-recorded audio, perform deep signal analysis, and return structured, actionable musical intelligence data in real-time. 

**Vision and Purpose:**
The platform aims to bridge the gap between human musical intuition and machine-level precision, providing musicians, producers, and audio engineers with instantaneous transcriptions, instrument detections, spectrograms, and exact frequency analysis over a sleek, modern, and highly responsive interface.

**Problem it Solves:**
Traditional audio analysis tools are often fragmented, clunky, or require extensive offline processing. Gandharva centralizes these capabilities into a unified, web-based dashboard where real-time WebSocket streaming provides instant feedback and structured data exports (MIDI, PDF, CSV) integrate directly into existing production workflows.

**Target Users:**
- Music Producers and Sound Engineers
- Composers and Arrangers
- Music Students and Educators
- AI Audio Researchers

---

## 2. Current Implementation Status

### ✅ Phase 1 – Core Infrastructure (Implemented)
- **JWT Authentication:** Secure OAuth2 compatible token generation and validation.
- **Login / Register:** End-to-end user onboarding flows.
- **Protected Routes:** Next.js middleware securing dashboard access.
- **Dashboard Base Layout:** 3-panel professional SaaS layout (Sidebar, Main Visualizer, Analytics).
- **API Connection:** Axios interceptors handling token injection and refresh.
- **File Upload System:** Drag-and-drop secure media handling to the backend.
- **Database Schema:** SQLAlchemy models mapping Users, AudioFiles, Notes, and Logs.
- **Environment Config:** Fully containerized setup via Docker Compose `.env` files.
- **Basic UI System:** Custom Tailwind system using HSL tokens (Neon Cyan, Deep Purple).

### ✅ Phase 2 – Intelligence Layer (Implemented)
- **Audio Processing Pipeline:** Sandboxed FFmpeg normalization and basic extraction.
- **Real-Time Analysis via WebSocket:** Live streaming of processing status, completion percentage, and extracted notes.
- **Structured Output Generation:** Quantized note tracking and confidence scoring.
- **CSV / JSON Export:** Data serialization for external DAWs.
- **Dynamic Frontend Rendering:** Framer Motion enhanced UI that reacts to connection states.
- **Loading + Error Handling:** Graceful degradation when workers are offline.
- **Clean Architecture Separation:** Distinct service abstractions (Auth, Audio, ML Workers).

### 🚧 Phase 3 – Planned (Not Implemented Yet)
- **Advanced Analytics Dashboard:** Aggregated insights across user libraries.
- **Subscription System:** Stripe integration for tier-based access limits.
- **Payment Integration:** Secure checkout flows.
- **Model Retraining Interface:** Allowing users to correct transcriptions to fine-tune personal models.
- **Role-Based Access Control (RBAC):** Differentiating between Standard, Pro, and Admin users.
- **Admin Panel:** Global system health and metrics overview.
- **Cloud Scaling System:** Kubernetes deployment for dynamic Celery worker scaling.
- **Multi-Tenant Architecture:** Complete data isolation for B2B API integrations.

---

## 3. Technology Stack

### Frontend
- **Next.js (React):** App Router architecture for SSR and fast client transitions.
- **TypeScript:** Strict type definitions across props and API payloads.
- **Tailwind CSS:** Fully customized with a dynamic HSL token-based design system.
- **Framer Motion:** High-performance hardware-accelerated micro-animations.
- **Context API:** Global state management for Authentication (`AuthContext`).
- **WebSocket Client:** Custom Native WebSocket hooks for real-time connection lifecycle management.

### Backend
- **FastAPI:** High-performance async Python web framework.
- **Python 3.10+:** Core runtime environment.
- **JWT (Authentication):** `python-jose` and `passlib` for secure token signing and password hashing.
- **WebSockets:** FastAPI native WebSocket routing for bidirectional streams.
- **Async Processing:** Celery distributed task queue backed by Redis.
- **Uvicorn:** Lightning-fast ASGI web server implementation.

### AI / Processing
- **Audio Preprocessing:** FFmpeg for channel downmixing and sample rate normalization.
- **Signal Processing Modules:** Librosa for spectrograms and beat tracking.
- **Custom Analysis Pipeline:** Basic Pitch (Spotify) and custom CNN inference mappings.

### Database
- **PostgreSQL (Relational SQL):** Ensuring ACID compliance for user accounts and relational audio logs.
- **Schema Explanation:**
  - `users`: Core identity and credential storage.
  - `audio_files`: Metadata, processing states (`uploaded`, `processing`, `complete`), and file paths.
  - `notes`: Strongly-typed individual extracted frequencies, tied to foreign keys of `audio_files`.
  - `processing_logs`: Granular telemetry on model execution times.

### Deployment
- **Frontend Hosting:** Vercel / Node.js standard build.
- **Backend Server:** Dockerized Gunicorn + Uvicorn workers.
- **Environment Variables Handling:** `.env` parsed rigidly via Pydantic `BaseSettings`.

---

## 4. Project Structure (Detailed)

```text
Gandharva/
├── frontend/                 # Next.js UI Client
│   ├── src/app/              # App Router pages (login, register, dashboard, library)
│   ├── src/components/       # Reusable UI (AudioUploader, PianoRoll, Spectrogram, etc.)
│   ├── src/context/          # Global React Contexts (AuthContext)
│   ├── src/hooks/            # Custom React Hooks (useAudioWebSocket)
│   ├── src/lib/              # Utility libraries and API interceptors (axios setup)
│   └── tailwind.config.ts    # HSL design system definitions
│
├── backend/                  # FastAPI Application
│   ├── app/main.py           # Application entrypoint & FastAPI instance setup
│   ├── app/api/              # Route controllers (auth.py, audio.py)
│   ├── app/core/             # Security, configuration (Pydantic settings), JWT logic
│   ├── app/db/               # SQLAlchemy session management and base classes
│   ├── app/models/           # Domain models (domain.py) and Pydantic schemas (schemas.py)
│   ├── app/workers/          # Celery configuration and ML task execution (tasks.py)
│   └── create_tables.py      # Database initialization script
│
├── docker-compose.yml        # Orchestration for DB, Redis, Backend, and Celery Workers
└── README.md                 # Project Documentation
```

---

## 5. How It Works (End-to-End Flow)

1. **User Authentication Flow:** User submits credentials to `POST /api/v1/auth/login/access-token`.
2. **JWT Token Issuance:** Backend validates hashes and returns an encrypted JWT Bearer Token.
3. **Protected Dashboard Access:** Frontend stores the token in `localStorage`, injecting it into Axios headers. The user is redirected to the `/dashboard`.
4. **Audio Upload Process:** The user drops a file or records audio. The frontend calls `POST /api/v1/audio/upload` as `multipart/form-data`.
5. **Backend Receives File:** FastAPI writes the raw asset to disk and inserts an `AudioFile` record in Postgres with status `uploaded`. A Celery background task is dispatched.
6. **Processing Pipeline Execution:** The Celery worker picks up the job, sanitizes it via FFmpeg, extracts notes, and saves the structured `notes` back to the DB, updating the status to `complete`.
7. **WebSocket Streaming of Results:** Simultaneously, the frontend opens a connection to `ws://.../audio/ws/{audio_id}`. The backend polls the database/Redis, streaming progress `poll` messages and eventually the final JSON payload.
8. **Frontend Dynamic Rendering:** The `useAudioWebSocket` hook updates state, causing the Canvas (Spectrogram) and Piano Roll to cleanly render the AI output.
9. **Export System:** User clicks export, calling a dedicated backend route that compiles the notes into a `.mid` or `.pdf` file.
10. **Cleanup and Memory Management:** WebSocket connection closes cleanly. React unmounts cleanly drop AudioContexts minimizing memory leaks.

---

## 6. Authentication Architecture

- **JWT Flow:** Follows the OAuth2 Password Bearer flow.
- **Token Storage:** Stored securely in frontend `localStorage` (with plans to migrate to `HttpOnly` cookies in Phase 3).
- **Protected Routes:** FastAPI `Depends(get_current_user)` intercepts all intelligence endpoints.
- **Middleware Logic:** Next.js checks `AuthContext` state before allowing renders of `app/dashboard`.
- **Expiry Handling:** Tokens span a predefined minute-window configurable via `.env`, generating a `401 Unauthorized` that triggers the frontend interceptor to log the user out.

---

## 7. WebSocket Architecture

- **Why WebSockets are used:** AI processing taking 10-30 seconds cannot cleanly rely on slow HTTP polling. WebSockets provide instant push notifications for progress bars and live UI unblocking.
- **How Connection is Established:** `useAudioWebSocket` hook mounts and connects pushing the JWT in the query parameters. FastAPI accepts the connection and validates the token.
- **Real-Time Result Streaming:** The server enters an async loop, reading the database worker state and emitting `{"status": "processing", "poll": 45}`.
- **Cleanup Strategy:** Reaching `status: complete` naturally closes the socket. React unmount hooks explicitly invoke `ws.close()` to prevent zombie connections.

---

## 8. Performance Optimizations

- **requestAnimationFrame cleanup:** All live visualizations (waveforms, FFT, spectrograms) clear their drawing loops gracefully to prevent CPU starvation.
- **Reduced Animation Load:** Framer Motion particle effects are hardware-accelerated (`will-change: transform`).
- **Optimized State Updates:** Batching WebSocket JSON updates to prevent overwhelming the React diffing algorithm.
- **Modular Service Architecture:** Machine Learning inference is strictly sandboxed in a separate memory space (Celery Worker) from the active ASGI Web Pool (Uvicorn), preventing API lockup.

---

## 9. Environment Variables

### Backend (`.env`)
- `POSTGRES_USER`: Database username.
- `POSTGRES_PASSWORD`: Database auth.
- `POSTGRES_DB`: Name of the initialized Postgres schema.
- `POSTGRES_SERVER`: Hostname (e.g., `db` or `localhost`).
- `SECRET_KEY`: High-entropy string for JWT signing.
- `REDIS_URL`: Broker string for Celery.
- `ENABLE_ML_PIPELINE`: Boolean flag to run real heavy ML or mock processing.
- `DEVICE`: `cpu` or `cuda` for PyTorch acceleration.

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL`: Path to the FastAPI REST layer (e.g., `http://localhost:8000/api/v1`).
- `NEXT_PUBLIC_WS_URL`: Path to the FastAPI WS layer (e.g., `ws://localhost:8000/api/v1`).

---

## 10. Setup Instructions

### Backend
```bash
# Clone repository
git clone <repo-url> && cd Gandharva/backend

# Install dependencies
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Start backing services (DB, Redis)
docker-compose up -d db redis

# Initialize Database Schema
python create_tables.py

# Run development mode (Terminal 1)
python -m uvicorn app.main:app --reload --port 8000

# Run Celery Worker (Terminal 2)
celery -A app.workers.celery_app worker -l info -P solo # (-P solo for Windows)
```

### Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run development mode
npm run dev
```

---

## 11. Scalability Plan (Phase 3 Vision)

- **Multi-Tenant System:** Row-level security in PostgreSQL referencing Tenant IDs applied across `audio_files`.
- **Subscription Billing:** Stripe webhooks driving database access-level flags.
- **Role-Based Permissions:** Expanding JWT payloads with `scopes=["read:admin", "write:models"]`.
- **Cloud Auto-Scaling:** Deploying Celery workers to a Kubernetes cluster reading from a central remote Redis/RabbitMQ queue, scaling pods horizontally based on queue depth.
- **AI Model Updates:** Decoupling models into an S3 bucket that workers dynamically fetch upon rolling deployments.
- **Analytics Expansion:** ClickHouse OLAP database integration for massive time-series aggregations across the user base.

---

## 12. Security Considerations

- **Token Security:** Bearer tokens used, with expiry windows restricting replay attacks.
- **CORS Handling:** Strict Origins configurations in `main.py` allowing only the designated frontend domain.
- **Input Validation:** Pydantic strictly validates all incoming request bodies, explicitly rejecting arbitrary injection flags (`extra="forbid"`).
- **Error Sanitization:** Stack traces suppressed in production responses, mapping to generic `HTTPException` codes.
- **Secure File Handling:** Uploaded media is scrubbed of EXIF/metadata, restricted to generic names mapping exactly to UUIDs protecting against path-traversal.

---

## 13. Future Roadmap

- **Short-Term:** Stabilize the React Web Audio API rendering components for the Spectrum Analyser and Waveforms; implement precise Playhead grid synchronization. 
- **Long-Term:** Mobile application bridges, real-time live performance analysis (rolling inference), and automated sheet music arrangement capabilities.
