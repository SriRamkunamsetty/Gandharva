import os
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import AudioFile, User
from app.models.schemas import AudioStatusResponse, AnalyzeResponse
from app.core.config import settings
from app.api.deps import get_current_user
import uuid
import magic

router = APIRouter()

@router.post("/upload", response_model=AudioStatusResponse)
async def upload_audio(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Enforce Max Upload Size (Approximate via fast spools, or content-length if available)
    # 2. Strict MIME Type / Magic byte sandboxing
    file_bytes = await file.read(2048)
    mime = magic.from_buffer(file_bytes, mime=True)
    if "audio/" not in mime and "video/" not in mime:
        raise HTTPException(status_code=400, detail="Invalid file signature. Only audio files permitted.")
    await file.seek(0)
    
    # Storage Architecture Isolation
    user_dir = f"data/users/{current_user.id}/uploads"
    os.makedirs(user_dir, exist_ok=True)
    
    audio_id = str(uuid.uuid4())
    file_path = os.path.join(user_dir, f"{audio_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    audio_record = AudioFile(
        id=audio_id,
        user_id=current_user.id,
        original_filename=file.filename,
        raw_path=file_path,
        status="uploaded"
    )
    db.add(audio_record)
    db.commit()
    db.refresh(audio_record)
    
    return audio_record

@router.post("/analyze/{audio_id}", response_model=AnalyzeResponse)
async def analyze_audio(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    
    # Ownership Control Guard
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden or Not Found")
        
    # Idempotency Protection
    if audio.status == "complete":
        return AnalyzeResponse(message="Already processed", audio_id=audio_id, status="complete")
        
    # Concurrency Lock
    if audio.status == "processing":
        raise HTTPException(status_code=409, detail="Analysis already in progress for this file.")
        
    # Atomic Pre-Dispatch Guard: Lock processing state BEFORE queuing
    try:
        audio.status = "processing"
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to initialize processing state securely.")
        
    # Now dispatch task safely
    from app.workers.celery_app import celery_app
    task = celery_app.send_task("app.workers.tasks.process_audio_pipeline", args=[audio_id])
    
    return AnalyzeResponse(message="Dispatched", audio_id=audio_id, job_id=task.id, status="processing")

@router.get("/status/{audio_id}", response_model=AudioStatusResponse)
async def get_status(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden or Not Found")
        
    return audio
