"""
Analysis Service — Read-only key and BPM detection from processed audio.
Does NOT modify any DB records or touch the pipeline.
"""

from sqlalchemy.orm import Session
from app.models.domain import AudioFile
from loguru import logger


def detect_key(db: Session, audio_id: str) -> str:
    """Detect musical key using Krumhansl-Schmuckler algorithm via librosa."""
    import librosa
    import numpy as np

    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.status != "complete":
        raise ValueError(f"Audio {audio_id} not found or not complete")
    if not audio.raw_path:
        raise ValueError(f"No audio file path for {audio_id}")

    y, sr = librosa.load(audio.raw_path, sr=22050, mono=True)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)

    # Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    best_corr = -2
    best_key = "C major"

    for i in range(12):
        rotated = np.roll(chroma_mean, -i)
        major_corr = float(np.corrcoef(rotated, major_profile)[0, 1])
        minor_corr = float(np.corrcoef(rotated, minor_profile)[0, 1])

        if major_corr > best_corr:
            best_corr = major_corr
            best_key = f"{note_names[i]} major"
        if minor_corr > best_corr:
            best_corr = minor_corr
            best_key = f"{note_names[i]} minor"

    logger.info(f"Key detection for {audio_id}: {best_key} (corr={best_corr:.3f})")
    return best_key


def detect_bpm(db: Session, audio_id: str) -> float:
    """Detect BPM using librosa beat tracking."""
    import librosa

    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.status != "complete":
        raise ValueError(f"Audio {audio_id} not found or not complete")
    if not audio.raw_path:
        raise ValueError(f"No audio file path for {audio_id}")

    y, sr = librosa.load(audio.raw_path, sr=22050, mono=True)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

    bpm = float(tempo[0]) if hasattr(tempo, '__len__') else float(tempo)
    logger.info(f"BPM detection for {audio_id}: {bpm:.1f}")
    return round(bpm, 1)
