"""
Export & Analysis API endpoints — Additive only.
These endpoints are read-only: they query existing DB state, never modify the pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import AudioFile, Note, User
from app.models.schemas import AnalysisDetailResponse
from app.api.deps import get_current_user
from app.services import export_service, analysis_service
import io

router = APIRouter()


@router.get("/export/midi/{audio_id}")
def export_midi(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download MIDI file for a completed audio analysis."""
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden or Not Found")
    if audio.status != "complete":
        raise HTTPException(status_code=400, detail="Audio analysis not complete")

    try:
        midi_bytes = export_service.generate_midi(db, audio_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return StreamingResponse(
        io.BytesIO(midi_bytes),
        media_type="audio/midi",
        headers={"Content-Disposition": f'attachment; filename="{audio_id}.mid"'},
    )


@router.get("/export/pdf/{audio_id}")
def export_pdf(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download PDF sheet music for a completed audio analysis."""
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden or Not Found")
    if audio.status != "complete":
        raise HTTPException(status_code=400, detail="Audio analysis not complete")

    try:
        pdf_bytes = export_service.generate_pdf(db, audio_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{audio_id}_sheet.pdf"'},
    )


@router.get("/analysis/{audio_id}", response_model=AnalysisDetailResponse)
def get_analysis(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get key, BPM, and note count for a completed audio analysis."""
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden or Not Found")
    if audio.status != "complete":
        raise HTTPException(status_code=400, detail="Audio analysis not complete")

    notes_count = db.query(Note).filter(Note.audio_id == audio_id).count()

    key = None
    bpm = None
    try:
        key = analysis_service.detect_key(db, audio_id)
    except Exception:
        pass
    try:
        bpm = analysis_service.detect_bpm(db, audio_id)
    except Exception:
        pass

    return AnalysisDetailResponse(
        audio_id=audio_id,
        key=key,
        bpm=bpm,
        notes_count=notes_count,
        instrument=getattr(audio, "instrument_result", None),
    )
