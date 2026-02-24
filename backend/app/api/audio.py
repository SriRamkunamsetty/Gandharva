from app.core.firebase import db
import requests
import tempfile
from typing import List, Optional

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
    # For the library preview, we'll slice the notes to avoid payload bloat
    for f in files:
        if f.notes:
            f.notes = f.notes[:50] # Take first 50 for thumbnail
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
    
    # Update Firestore as requested
    if db:
        try:
            track_ref = db.collection("tracks").document(audio_id)
            track_ref.set({
                "id": audio_id,
                "filename": file.filename,
                "status": "uploaded",
                "duration": duration,
                "user_id": current_user.id,
                "created_at": firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            logger.error(f"Firestore save error: {e}")
    
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


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_audio_url(
    payload: dict,
    db_session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts a firebase audio_url, downloads it temporarily, and starts analysis.
    """
    audio_url = payload.get("audio_url")
    if not audio_url:
        raise HTTPException(status_code=400, detail="Missing audio_url")
    
    audio_id = str(uuid.uuid4())
    
    # Create record in Firestore first
    if db:
        db.collection("tracks").document(audio_id).set({
            "id": audio_id,
            "url": audio_url,
            "user_id": current_user.id,
            "status": "processing",
            "created_at": firestore.SERVER_TIMESTAMP
        })

    # Download file to temp path for processing
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    temp_path = temp_file.name
    temp_file.close()

    try:
        response = requests.get(audio_url, stream=True)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download audio from URL")
        
        with open(temp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # 3. Dispatch to Celery (Needs update to handle temp_path or we download in worker?)
        # For Hugging Face, we'll download in the worker to keep web server fast.
        from app.workers.celery_app import celery_app
        task = celery_app.send_task("app.workers.tasks.process_audio_pipeline_url", args=[audio_id, audio_url])
        
        return AnalyzeResponse(message="Dispatched", audio_id=audio_id, job_id=task.id, status="processing")
    
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Analysis dispatch failed: {e}")
    finally:
        # Note: In a real worker, cleanup happens there. 
        # Here we just clean up the web server's temp download if any.
        if os.path.exists(temp_path):
             os.remove(temp_path)

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
