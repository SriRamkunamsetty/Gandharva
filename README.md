# 🎵 Gandharva - The AI Music Studio

![Gandharva Logo](frontend/public/logo.png)

**Bridging the gap between raw audio and structured musical data.** Gandharva is an intelligent transcription platform that transforms your melodies into digital reality.

---

## 1. The Real-World Problem
Imagine a musician who has a melody in their head or recorded on their phone, but doesn't know how to write sheet music or create MIDI files. For many, the transition from "idea" to "composition" is a technical wall. Manual transcription takes years of ear training, and hiring professional transcribers is expensive and slow. 

**Gandharva was built to tear down that wall.**

---

## 2. The Solution: Enter Gandharva
Gandharva acts as an **"AI Translator"** for sound. 

You upload an MP3, and the AI "listens" to the frequencies, figures out the exact notes, chords, and beats, and gives you back the digital building blocks (MIDI, data) to use in music software. Whether it's a hummed melody or a complex piano piece, Gandharva decodes the music so you can focus on the art.

---

## 3. How It Works: The Journey of an Audio File
To make this magic happen, the file goes through a four-step professional pipeline:

*   **Step 1: The Storefront (Frontend)**: The user logs in via the Next.js website (hosted on Netlify). Firebase checks their ID like a security guard to ensure their data remains private.
*   **Step 2: The Delivery (API)**: Once the user clicks "Export," the audio file is sent securely over the internet to our "AI factory."
*   **Step 3: The Brain (Backend)**: The FastAPI server on Hugging Face receives the audio. ML models (like **Basic Pitch** and **Librosa**) analyze the soundwaves, turning raw audio into math, and math into musical notes.
*   **Step 4: The Vault (Database)**: The extracted data is safely locked away in **Firebase Firestore**, tied to the user's specific account so only they can access their digital sheet music.

---

## 4. The Tech Stack
*   **Frontend**: [Next.js](https://nextjs.org/) (React) deployed on **Netlify**. Chosen for speed, SEO, and a beautiful, high-performance user interface.
*   **Backend**: [FastAPI](https://fastapi.tiangolo.com/) & [Gradio](https://gradio.app/) deployed on **Hugging Face Spaces**. Chosen because Hugging Face provides powerful servers specialized for heavy AI and machine learning math.
*   **Database/Auth**: [Firebase](https://firebase.google.com/) (gandharva-2026). Chosen for enterprise-grade secure user login and real-time data storage across the globe.

---

## 5. Advanced Engineering
Developing a cross-platform AI studio required solving two major technical hurdles:

### Denoiser++
Cloud platforms like Hugging Face often mangle complex JSON blobs when they are pasted into environment secrets. We built **Denoiser++**, a custom Python sanitization script that automatically cleans up messy JSON formatting (fixing unquoted keys and stripping "illegal" characters) to prevent server crashes during initialization.

### API Path Routing Priority
To ensure the backend API never gets blocked by the Gradio dashboard, we implemented a custom mounting strategy. We specifically mount the FastAPI application to `/api/v1` *before* the Gradio interface. This ensures that analytical requests always have priority and solves "405 Method Not Allowed" errors common in hybrid deployments.

---

## 6. Environment Setup & Security
### .env.example
> [!IMPORTANT]
> **Security Rule**: Never hardcode actual API keys in the source code. Use placeholders.

| Variable | Description | Placeholder Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Production Backend URL | `https://your-api-url.hf.space` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin Key | `{"type": "service_account", ...}` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web Key | `your-firebase-key-here` |

### Running Locally
**Backend**:
```bash
cd backend
python app.py
```
**Frontend**:
```bash
cd frontend
npm run dev
```

---

## 7. Inspiration & Call to Action
You don't need to be a math genius to build with AI. By connecting the right tools (Next.js, FastAPI, Firebase), you can solve real-world problems and build tools that people love. 

**Fork this repo, explore the code, and build your own magic!** 🚀
