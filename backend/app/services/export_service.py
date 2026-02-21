"""
Export Service — Generates MIDI and PDF exports from DB state only.
Read-only: does NOT modify any DB records or touch the pipeline.
"""

import io
from sqlalchemy.orm import Session
from app.models.domain import AudioFile, Note
from loguru import logger


def generate_midi(db: Session, audio_id: str) -> bytes:
    """Generate a MIDI file from stored Note records. Returns raw bytes."""
    import pretty_midi

    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.status != "complete":
        raise ValueError(f"Audio {audio_id} not found or not complete")

    notes = db.query(Note).filter(Note.audio_id == audio_id).order_by(Note.raw_start).all()
    if not notes:
        raise ValueError(f"No notes found for audio {audio_id}")

    midi = pretty_midi.PrettyMIDI(initial_tempo=120.0)
    instrument = pretty_midi.Instrument(program=0, name="Piano")

    for n in notes:
        midi_note = pretty_midi.Note(
            velocity=int(min(max(n.confidence * 127, 30), 127)),
            pitch=int(n.note_name) if n.note_name.isdigit() else 60,
            start=float(n.raw_start),
            end=float(n.raw_end),
        )
        instrument.notes.append(midi_note)

    midi.instruments.append(instrument)

    buf = io.BytesIO()
    midi.write(buf)
    buf.seek(0)
    logger.info(f"Generated MIDI for {audio_id}: {len(notes)} notes, {buf.getbuffer().nbytes} bytes")
    return buf.read()


def generate_pdf(db: Session, audio_id: str) -> bytes:
    """Generate a visual grid-based PDF sheet from stored Note records. Returns raw bytes."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas as pdf_canvas

    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.status != "complete":
        raise ValueError(f"Audio {audio_id} not found or not complete")

    notes = db.query(Note).filter(Note.audio_id == audio_id).order_by(Note.raw_start).all()
    if not notes:
        raise ValueError(f"No notes found for audio {audio_id}")

    buf = io.BytesIO()
    c = pdf_canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    # --- Title Block ---
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor("#1a1a2e"))
    c.drawString(30, height - 40, f"Gandharva — Note Transcription")

    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#555555"))
    c.drawString(30, height - 58, f"File: {audio.original_filename}")
    c.drawString(30, height - 72, f"Notes detected: {len(notes)}")
    if audio.processing_time_ms:
        c.drawString(300, height - 72, f"Processing time: {audio.processing_time_ms}ms")

    # --- Grid-based Piano Roll ---
    grid_top = height - 100
    grid_bottom = 60
    grid_left = 60
    grid_right = width - 30
    grid_height = grid_top - grid_bottom
    grid_width = grid_right - grid_left

    # Determine pitch and time bounds
    pitches = [int(n.note_name) if n.note_name.isdigit() else 60 for n in notes]
    min_pitch = max(min(pitches) - 2, 21)
    max_pitch = min(max(pitches) + 2, 108)
    pitch_range = max(max_pitch - min_pitch, 1)

    time_end = max(n.raw_end for n in notes)
    time_start = min(n.raw_start for n in notes)
    time_range = max(time_end - time_start, 0.1)

    # Draw grid lines (pitch rows)
    c.setStrokeColor(HexColor("#e0e0e0"))
    c.setLineWidth(0.3)
    for i in range(pitch_range + 1):
        y = grid_bottom + (i / pitch_range) * grid_height
        c.line(grid_left, y, grid_right, y)

    # Draw time grid lines (every 1 second)
    for t in range(int(time_start), int(time_end) + 2):
        x = grid_left + ((t - time_start) / time_range) * grid_width
        if grid_left <= x <= grid_right:
            c.setStrokeColor(HexColor("#e8e8e8"))
            c.line(x, grid_bottom, x, grid_top)
            c.setFont("Helvetica", 6)
            c.setFillColor(HexColor("#999999"))
            c.drawString(x - 3, grid_bottom - 12, f"{t}s")

    # Pitch labels
    note_names_map = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    c.setFont("Helvetica", 6)
    for p in range(min_pitch, max_pitch + 1):
        octave = (p // 12) - 1
        name = note_names_map[p % 12]
        y = grid_bottom + ((p - min_pitch) / pitch_range) * grid_height
        c.setFillColor(HexColor("#888888"))
        c.drawRightString(grid_left - 4, y - 2, f"{name}{octave}")

    # Draw note bars
    accent_colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#7c3aed", "#4f46e5"]
    bar_height = max(grid_height / pitch_range * 0.7, 2)

    for i, n in enumerate(notes):
        pitch = int(n.note_name) if n.note_name.isdigit() else 60
        x = grid_left + ((n.raw_start - time_start) / time_range) * grid_width
        w = max(((n.raw_end - n.raw_start) / time_range) * grid_width, 2)
        y = grid_bottom + ((pitch - min_pitch) / pitch_range) * grid_height

        color = accent_colors[i % len(accent_colors)]
        c.setFillColor(HexColor(color))
        c.roundRect(x, y, w, bar_height, 1, fill=1, stroke=0)

    # Axis labels
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#333333"))
    c.drawString(grid_left, grid_top + 8, "Pitch →")
    c.drawString(grid_right - 30, grid_bottom - 24, "Time →")

    c.showPage()
    c.save()
    buf.seek(0)
    logger.info(f"Generated PDF for {audio_id}: {len(notes)} notes, {buf.getbuffer().nbytes} bytes")
    return buf.read()
