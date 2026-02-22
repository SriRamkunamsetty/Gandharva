import os
import subprocess
from celery import shared_task
from app.db.session import SessionLocal
from app.models.domain import AudioFile, Note, ProcessingLog
import traceback
import time
from app.core.config import settings
from loguru import logger
from typing import List, Dict

def post_process_notes(notes: List[Dict]) -> List[Dict]:
    """
    Applies rigorous heuristics to raw extracted notes to improve transcription quality.
    """
    if not notes:
        return notes

    # 1. Global deduplication (existing +/- 50ms tolerance)
    tolerance_s = 0.05
    deduplicated = []
    for n in notes:
        is_duplicate = False
        n_duration = n["end"] - n["start"]
        for existing in deduplicated:
            if existing["midi"] == n["midi"]:
                e_duration = existing["end"] - existing["start"]
                if (abs(existing["start"] - n["start"]) <= tolerance_s and 
                    abs(existing["end"] - n["end"]) <= tolerance_s and
                    abs(e_duration - n_duration) <= tolerance_s):
                    is_duplicate = True
                    # Retain max confidence from exact duplicates
                    existing["confidence"] = max(existing["confidence"], n["confidence"])
                    break
        if not is_duplicate:
            deduplicated.append(n.copy())
            
    notes = deduplicated

    # 2. Sort by start time
    notes.sort(key=lambda x: x["start"])

    # 3. Drop minimum duration notes
    valid_duration = [n for n in notes if (n["end"] - n["start"]) >= settings.POST_MIN_DURATION]
    
    # 4 & 5. Merge adjacent and overlapping same-pitch notes
    merged_notes = []
    active_by_pitch = {}
    
    for n in valid_duration:
        pitch = n["midi"]
        if pitch in active_by_pitch:
            curr = active_by_pitch[pitch]
            # Adjacent (gap <= MERGE_GAP) or Overlapping (n.start <= curr.end)
            if n["start"] <= curr["end"] + settings.MERGE_GAP:
                # Merge
                curr["end"] = max(curr["end"], n["end"])
                curr["confidence"] = max(curr["confidence"], n["confidence"])
            else:
                # Gap is > 50ms, flush current and start new
                merged_notes.append(curr)
                active_by_pitch[pitch] = n.copy()
        else:
            active_by_pitch[pitch] = n.copy()
            
    for curr in active_by_pitch.values():
        merged_notes.append(curr)
        
    merged_notes.sort(key=lambda x: x["start"])

    # 6. Polyphonic False Positives (Dynamic Density Filter)
    poly_filtered = []
    if not merged_notes:
        return poly_filtered
        
    clusters = []
    current_cluster = [merged_notes[0]]
    for n in merged_notes[1:]:
        # Cluster notes starting within settings.CLUSTER_WINDOW
        if n["start"] - current_cluster[0]["start"] <= settings.CLUSTER_WINDOW:
            current_cluster.append(n)
        else:
            clusters.append(current_cluster)
            current_cluster = [n]
    if current_cluster:
        clusters.append(current_cluster)
        
    for cluster in clusters:
        if len(cluster) >= 3:
            max_conf = max(c["confidence"] for c in cluster)
            # Dynamic threshold ratio
            threshold = max_conf * settings.CLUSTER_RATIO 
            
            # Find the lowest confidence note
            min_conf = min(c["confidence"] for c in cluster)
            
            for c in cluster:
                # Drop the lowest confidence note ONLY if it is below the dynamic threshold
                if c["confidence"] == min_conf and c["confidence"] < threshold:
                    continue # Drop
                poly_filtered.append(c)
        else:
            poly_filtered.extend(cluster)

    return poly_filtered

@shared_task(name="app.workers.tasks.process_audio_pipeline", bind=True)
def process_audio_pipeline(self, audio_id: str):
    db = SessionLocal()
    start_time = time.time()
    
    # Reload from DB 
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        return {"status": "error", "message": "Audio record not found"}

    # 1. Celery Task Idempotency Guard
    if audio.status != "processing":
        logger.warning(f"Task skipped for {audio_id}: status is '{audio.status}' (expected 'processing')")
        return {"status": "skipped", "message": "Task already processed or invalid state"}

    try:
        # Step 1: Pre-processing with FFmpeg Sandboxed (16kHz Mono)
        prep_start = time.time()
        processed_dir = f"data/users/{audio.user_id}/processed"
        os.makedirs(processed_dir, exist_ok=True)
        processed_path = os.path.join(processed_dir, f"{audio_id}.wav")
        
        # Security: strictly call ffmpeg on the known raw_path bound to this user
        subprocess.run([
            "ffmpeg", "-y", "-i", audio.raw_path, 
            "-ac", "1", "-ar", "16000", processed_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        prep_time = int((time.time() - prep_start) * 1000)

        # ML Pipeline Feature Flag
        if not settings.ENABLE_ML_PIPELINE:
            logger.info(f"ENABLE_ML_PIPELINE is False. Simulating ML Pipeline for {audio_id}.")
            time.sleep(2) # Mock processing time
            pitch_time = 1500
            inst_time = 500
            audio.instrument_result = "Piano (Simulated)"
        else:
            # Explicit Device Routing Feature
            processing_device = settings.DEVICE
            try:
                import torch
                if processing_device == "cuda" and not torch.cuda.is_available():
                    logger.warning("CUDA requested but not available. Falling back to CPU.")
                    processing_device = "cpu"
            except ImportError:
                processing_device = "cpu"
                
            logger.info(f"Running ML Pipeline on device: {processing_device}")
            
            # [CRITICAL LAZY IMPORT GUARD]
            try:
                from basic_pitch.inference import predict
                from basic_pitch import ICASSP_2022_MODEL_PATH
                import librosa
                import numpy as np
                import gc
            except ImportError as exc:
                logger.error(f"Failed to load heavy ML dependencies: {exc}")
                raise Exception(f"ML Pipeline enabled but dependencies missing (Python 3.10/3.11 required): {exc}")
            
            # Step 2: Pitch Detection (Basic Pitch)
            pitch_start = time.time()
            
            # Processing in chunks: window=30s, overlap=5s
            chunk_duration = 30
            overlap = 5
            logger.info(f"Processing Pitch Detection with {chunk_duration}s windows and {overlap}s overlap.")
            
            # Load audio using librosa (16kHz mono)
            audio_data, sr = librosa.load(processed_path, sr=16000, mono=True)
            total_duration = librosa.get_duration(y=audio_data, sr=sr)
            
            # [EXPLICIT OVERLAP MERGE LOGIC] -> Moved to global post_process_notes
            extracted_notes = []
            total_windows = 0
            
            if total_duration <= chunk_duration:
                # Small file, single pass
                model_output, midi_data, note_events = predict(processed_path)
                for start_t, end_t, pitch, amplitude, _ in note_events:
                    extracted_notes.append({
                        "start": start_t,
                        "end": end_t,
                        "midi": pitch,
                        "confidence": amplitude
                    })
            else:
                # Sliding Window Inference
                # Write temp chunk, predict, map to global offset, delete chunk
                step = chunk_duration - overlap
                for offset in np.arange(0, total_duration, step):
                    window_start_time = time.time()
                    # End bound
                    end_offset = min(offset + chunk_duration, total_duration)
                    
                    logger.info(f"Processing window: [{offset:.2f}s - {end_offset:.2f}s]")
                    
                    # Slicing
                    start_sample = int(offset * sr)
                    end_sample = int(end_offset * sr)
                    chunk_audio = audio_data[start_sample:end_sample]
                    
                    # Need to save chunk audio to temp file for predict() to work properly natively 
                    import soundfile as sf
                    temp_chunk_path = f"{processed_path}_temp_chunk.wav"
                    
                    window_extracted_count = 0
                    try:
                        sf.write(temp_chunk_path, chunk_audio, sr)
                        
                        # Predict Chunk
                        model_output, midi_data, note_events = predict(temp_chunk_path)
                        
                        total_windows += 1
                        for start_t, end_t, pitch, amplitude, _ in note_events:
                            global_start = offset + start_t
                            global_end = offset + end_t
                            extracted_notes.append({
                                "start": global_start,
                                "end": global_end,
                                "midi": pitch,
                                "confidence": amplitude
                            })
                            window_extracted_count += 1
                    finally:
                        # Cleanup chunk safely even if predict() crashes
                        if os.path.exists(temp_chunk_path):
                            os.remove(temp_chunk_path)
                            
                        # Memory Guard: Explicitly delete chunk arrays and force GC
                        del chunk_audio
                        gc.collect()
                        
                    logger.info(f"Window [{offset:.2f}s - {end_offset:.2f}s] completed in {time.time() - window_start_time:.2f}s, extracted {window_extracted_count} notes")

            # [GLOBAL POST-PROCESSING PIPELINE]
            # Runs ONCE after all windows are merged and timestamps realigned
            
            # --- Performance Guard Logging (Pre) ---
            pre_process_count = len(extracted_notes)
            
            deduplicated_notes = post_process_notes(extracted_notes)
            
            # --- Performance Guard Logging (Post) ---
            post_process_count = len(deduplicated_notes)
            wall_time_ms = int((time.time() - pitch_start) * 1000)
            
            # Memory check if available (Linux)
            import resource
            try:
                peak_memory_mb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0
            except Exception:
                peak_memory_mb = -1.0
                
            logger.info("====== PERFORMANCE GUARD ======")
            logger.info(f"Windows Processed: {total_windows}")
            logger.info(f"Notes (Raw): {pre_process_count}")
            logger.info(f"Notes (Post-Processed): {post_process_count}")
            logger.info(f"Processing Time (ms): {wall_time_ms}")
            if peak_memory_mb > 0:
                logger.info(f"Peak Memory (MB): {peak_memory_mb:.2f}")
            logger.info("===============================")
            
            # Note Quantization mapping placeholder for Phase 3 (Keeping DB schema valid)
            db_notes = []
            for n in deduplicated_notes:
                # Basic frequency mapping logic
                freq = 440.0 * (2.0 ** ((float(n["midi"]) - 69) / 12.0))
                db_notes.append(Note(
                    audio_id=audio_id,
                    note_name=str(int(n["midi"])), # Temporary MIDI store, update logic for C4 etc later
                    frequency=float(freq),
                    confidence=float(n["confidence"]),
                    raw_start=round(float(n["start"]), 4),
                    raw_end=round(float(n["end"]), 4)
                ))
            
            pitch_time = int((time.time() - pitch_start) * 1000)
            
            # Branch B: Instrument Classification
            inst_start = time.time()
            # [CNN/CRNN Inference mapping to Piano/Guitar/Violin/Drums]
            inst_time = int((time.time() - inst_start) * 1000)
            audio.instrument_result = "Piano"


        # Step 3: Atomic Merge & Persist
        total_time = int((time.time() - start_time) * 1000)
        
        # Begin Transaction Boundary
        audio.status = "complete"
        audio.processed_path = processed_path
        audio.processing_time_ms = total_time
        
        # Generate Log
        log = ProcessingLog(
            audio_id=audio_id,
            job_id=self.request.id,
            preprocessing_time_ms=prep_time,
            pitch_time_ms=pitch_time,
            instrument_time_ms=inst_time,
            total_time_ms=total_time
        )
        db.add(log)
        
        # Merge Notes safely
        if settings.ENABLE_ML_PIPELINE:
            db.add_all(db_notes)
        
        # Ensure single atomic commit wraps Notes, Status, and Log
        logger.info("committing transaction")
        db.commit()
        return {"status": "success", "audio_id": audio_id}

    except BaseException as e:
        db.rollback()
        error_trace = traceback.format_exc()
        # Worker Failure Recovery transition
        audio.status = "failed"
        logger.info("committing transaction")
        db.commit()
        
        # Log Critical Error
        logger.critical(f"Worker failed on {audio_id}: {str(e)}")
        logger.debug(error_trace)
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
