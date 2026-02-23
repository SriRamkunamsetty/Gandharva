import os
import uuid
import magic
import subprocess
import json
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import AudioFile, User
from app.models.schemas import AudioStatusResponse, AnalyzeResponse, AudioFileResponse
from app.core.config import settings
from app.api.deps import get_current_user
from app.services.audio_vis import generate_waveform_peaks, generate_spectrogram_png
from typing import List

router = APIRouter()

@router.get("/", response_model=List[AudioFileResponse])
async def get_audio_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all audio files for the current user
    """
    files = db.query(AudioFile).filter(AudioFile.user_id == current_user.id).all()
    return files

def get_audio_metadata(file_path: str):
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path]
    try:
        output = subprocess.check_output(cmd)
        data = json.loads(output)
        streams = data.get('streams', [])
        audio_stream = next((s for s in streams if s.get('codec_type') == 'audio'), None)
        format_info = data.get('format', {})
        
        duration = float(format_info.get('duration', 0))
        size = int(format_info.get('size', 0))
        sample_rate = int(audio_stream.get('sample_rate', 0)) if audio_stream and audio_stream.get('sample_rate') else None
        channels = int(audio_stream.get('channels', 0)) if audio_stream and audio_stream.get('channels') else None
        bit_depth_raw = audio_stream.get('bits_per_raw_sample') or audio_stream.get('bits_per_sample') or 0 if audio_stream else 0
        bit_depth = int(bit_depth_raw) if bit_depth_raw else None
            
        return duration, sample_rate, channels, size, bit_depth
    except Exception as e:
        return None, None, None, None, None

@router.post("/upload", response_model=AudioStatusResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_bytes = await file.read(2048)
    mime = magic.from_buffer(file_bytes, mime=True)
    if "audio/" not in mime and "video/" not in mime:
        raise HTTPException(status_code=400, detail="Invalid file signature. Only audio files permitted.")
    await file.seek(0)
    
    user_dir = f"data/users/{current_user.id}/uploads"
    processed_dir = f"data/users/{current_user.id}/processed"
    os.makedirs(user_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)
    
    audio_id = str(uuid.uuid4())
    file_path = os.path.join(user_dir, f"{audio_id}_{file.filename}")
    waveform_path = os.path.join(processed_dir, f"{audio_id}_waveform.json")
    spectrogram_path = os.path.join(processed_dir, f"{audio_id}_spectrogram.png")
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    duration, sample_rate, channels, size, bit_depth = get_audio_metadata(file_path)
        
    audio_record = AudioFile(
        id=audio_id,
        user_id=current_user.id,
        original_filename=file.filename,
        raw_path=file_path,
        status="uploaded",
        duration=duration,
        sample_rate=sample_rate,
        channels=channels,
        file_size=size,
        bit_depth=bit_depth
    )
    db.add(audio_record)
    db.commit()
    db.refresh(audio_record)
    
    # 3. Dispatch heavy visual processing to FastAPI BackgroundTasks (non-blocking)
    background_tasks.add_task(generate_waveform_peaks, file_path, waveform_path)
    background_tasks.add_task(generate_spectrogram_png, file_path, spectrogram_path)
    
    return audio_record

@router.get("/waveform/{audio_id}")
async def get_waveform(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    waveform_path = f"data/users/{current_user.id}/processed/{audio_id}_waveform.json"
    if not os.path.exists(waveform_path):
        raise HTTPException(status_code=404, detail="Waveform not generated yet")
        
    with open(waveform_path, 'r') as f:
        peaks = json.load(f)
    return JSONResponse(content={"peaks": peaks})

@router.get("/spectrogram/{audio_id}")
async def get_spectrogram(
    audio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio or audio.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    spectrogram_path = f"data/users/{current_user.id}/processed/{audio_id}_spectrogram.png"
    if not os.path.exists(spectrogram_path):
        raise HTTPException(status_code=404, detail="Spectrogram not generated yet")
        
    return FileResponse(spectrogram_path, media_type="image/png")


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
