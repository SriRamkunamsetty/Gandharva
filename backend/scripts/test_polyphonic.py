"""
Polyphonic Stress Test — Generates synthetic multi-note audio via pretty_midi,
uploads it through the API, triggers analysis, and collects metrics.
Does NOT modify the pipeline. Tests the pipeline as-is with polyphonic content.
"""

import requests
import time
import os
import sys
import psutil
import json
import tempfile
import numpy as np

API_URL = "http://localhost:8000"

def get_token():
    """Get auth token from file or login."""
    token_path = os.path.join(os.path.dirname(__file__), "token.txt")
    if os.path.exists(token_path):
        with open(token_path) as f:
            return f.read().strip()
    # Try login
    resp = requests.post(f"{API_URL}/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "testpassword"
    })
    if resp.ok:
        return resp.json()["access_token"]
    raise RuntimeError(f"Auth failed: {resp.text}")


def generate_polyphonic_wav(output_path: str, duration: float = 30.0):
    """Generate a polyphonic WAV with multiple simultaneous notes using pretty_midi."""
    import pretty_midi
    import soundfile as sf

    pm = pretty_midi.PrettyMIDI(initial_tempo=120.0)
    piano = pretty_midi.Instrument(program=0, name="Piano")

    # Create chord progressions: C major → A minor → F major → G major (each 4 beats)
    chords = [
        [60, 64, 67],       # C major (C4, E4, G4)
        [57, 60, 64],       # A minor (A3, C4, E4)
        [53, 57, 60],       # F major (F3, A3, C4)
        [55, 59, 62],       # G major (G3, B3, D4)
    ]

    # Add a melody on top
    melody = [72, 74, 76, 77, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60]

    beat_duration = 0.5  # 120 BPM = 0.5s per beat
    chord_beats = 4

    t = 0.0
    melody_idx = 0
    while t < duration:
        chord_idx = int((t / (chord_beats * beat_duration))) % len(chords)
        chord = chords[chord_idx]

        # Add chord notes
        for pitch in chord:
            chord_end = min(t + chord_beats * beat_duration, duration)
            piano.notes.append(pretty_midi.Note(
                velocity=80, pitch=pitch, start=t, end=chord_end
            ))

        # Add melody notes over this chord
        for beat in range(chord_beats):
            if melody_idx < len(melody):
                mel_start = t + beat * beat_duration
                mel_end = min(mel_start + beat_duration * 0.9, duration)
                if mel_start < duration:
                    piano.notes.append(pretty_midi.Note(
                        velocity=100, pitch=melody[melody_idx % len(melody)],
                        start=mel_start, end=mel_end
                    ))
                melody_idx += 1

        t += chord_beats * beat_duration

    pm.instruments.append(piano)

    # Synthesize to WAV
    audio_data = pm.synthesize(fs=22050)
    sf.write(output_path, audio_data, 22050)

    total_notes = len(piano.notes)
    print(f"  Generated polyphonic WAV: {total_notes} notes, {duration}s, {os.path.getsize(output_path)} bytes")
    return total_notes


def get_worker_process():
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info.get('cmdline') or []
            if any('celery' in arg for arg in cmdline) and any('app.workers.celery_app' in arg for arg in cmdline):
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return None


def run_polyphonic_test():
    print("\n" + "=" * 60)
    print("  POLYPHONIC STRESS TEST")
    print("=" * 60)

    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Generate polyphonic audio
    print("\n1. Generating polyphonic audio...")
    wav_path = os.path.join(os.path.dirname(__file__), "..", "tests", "test_polyphonic.wav")
    os.makedirs(os.path.dirname(wav_path), exist_ok=True)
    source_notes = generate_polyphonic_wav(wav_path, duration=30.0)

    # 2. Upload
    print("\n2. Uploading...")
    with open(wav_path, "rb") as f:
        files = {"file": ("test_polyphonic.wav", f, "audio/wav")}
        resp = requests.post(f"{API_URL}/api/v1/audio/upload", headers=headers, files=files)

    if resp.status_code != 200:
        print(f"  Upload FAILED: {resp.text}")
        return

    audio_id = resp.json()["id"]
    print(f"  Uploaded: {audio_id}")

    # 3. Analyze
    print("\n3. Starting analysis...")
    resp = requests.post(f"{API_URL}/api/v1/audio/analyze/{audio_id}", headers=headers)
    if resp.status_code != 200:
        print(f"  Analyze FAILED: {resp.text}")
        return

    job_id = resp.json().get("job_id")
    print(f"  Job dispatched: {job_id}")

    # 4. Monitor
    print("\n4. Monitoring...")
    worker = get_worker_process()
    peak_rss = 0
    status = "processing"
    start_time = time.time()

    while status == "processing":
        if worker:
            try:
                rss = worker.memory_info().rss / (1024 * 1024)
                if rss > peak_rss:
                    peak_rss = rss
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        time.sleep(1)
        elapsed = time.time() - start_time
        try:
            resp = requests.get(f"{API_URL}/api/v1/audio/status/{audio_id}", headers=headers)
            data = resp.json()
            status = data["status"]
        except Exception as e:
            print(f"  Poll error: {e}")

        if status in ["complete", "failed"]:
            break

        if elapsed > 300:
            print("  TIMEOUT after 5 minutes")
            status = "timeout"
            break

        sys.stdout.write(f"\r  Elapsed: {elapsed:.0f}s | Status: {status} | Peak RAM: {peak_rss:.1f} MB")
        sys.stdout.flush()

    total_time = time.time() - start_time
    print(f"\n\n  Final Status: {status}")
    print(f"  Total Time: {total_time:.2f}s")
    print(f"  Peak RAM: {peak_rss:.2f} MB")

    # 5. Collect DB metrics
    if status == "complete":
        print("\n5. Collecting metrics...")
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from app.db.session import SessionLocal
        from app.models.domain import AudioFile, Note, ProcessingLog

        db = SessionLocal()
        audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
        notes = db.query(Note).filter(Note.audio_id == audio_id).all()
        log = db.query(ProcessingLog).filter(ProcessingLog.audio_id == audio_id).first()

        detected_notes = len(notes)
        print(f"  Source notes (pretty_midi): {source_notes}")
        print(f"  Detected notes (pipeline): {detected_notes}")
        print(f"  Detection ratio: {detected_notes / max(source_notes, 1) * 100:.1f}%")

        if log:
            print(f"  Preprocessing: {log.preprocessing_time_ms}ms")
            print(f"  Pitch detection: {log.pitch_time_ms}ms")
            print(f"  Total: {log.total_time_ms}ms")

        # 6. Test exports
        print("\n6. Testing exports on polyphonic result...")
        midi_resp = requests.get(f"{API_URL}/api/v1/audio/export/midi/{audio_id}", headers=headers)
        print(f"  MIDI export: {'OK' if midi_resp.status_code == 200 else 'FAILED'} ({len(midi_resp.content)} bytes)")

        pdf_resp = requests.get(f"{API_URL}/api/v1/audio/export/pdf/{audio_id}", headers=headers)
        print(f"  PDF export: {'OK' if pdf_resp.status_code == 200 else 'FAILED'} ({len(pdf_resp.content)} bytes)")

        analysis_resp = requests.get(f"{API_URL}/api/v1/audio/analysis/{audio_id}", headers=headers)
        if analysis_resp.status_code == 200:
            analysis = analysis_resp.json()
            print(f"  Key: {analysis.get('key', 'N/A')}")
            print(f"  BPM: {analysis.get('bpm', 'N/A')}")
        else:
            print(f"  Analysis: FAILED ({analysis_resp.text})")

        db.close()

    # Summary
    print(f"\n{'=' * 60}")
    print("  POLYPHONIC STRESS TEST — RESULT")
    print(f"{'=' * 60}")
    print(f"  Status:              {'PASS ✅' if status == 'complete' else 'FAIL ❌'}")
    print(f"  Source notes:        {source_notes}")
    if status == "complete":
        print(f"  Detected notes:      {detected_notes}")
        print(f"  Detection ratio:     {detected_notes / max(source_notes, 1) * 100:.1f}%")
    print(f"  Total time:          {total_time:.2f}s")
    print(f"  Peak RAM:            {peak_rss:.2f} MB")
    print(f"  Pipeline stable:     {'YES' if status != 'timeout' else 'TIMEOUT'}")

    return status == "complete"


if __name__ == "__main__":
    success = run_polyphonic_test()
    sys.exit(0 if success else 1)
