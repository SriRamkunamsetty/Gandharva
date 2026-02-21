import requests
import time
import os
import psutil
import json
import sys

API_URL = "http://localhost:8000"
with open("scripts/token.txt", "r") as f:
    TOKEN = f.read().strip()

def get_worker_process():
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info.get('cmdline') or []
            if any('celery' in arg for arg in cmdline) and any('app.workers.celery_app' in arg for arg in cmdline):
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return None

def run_test(file_path, test_name):
    print(f"\n{'='*60}")
    print(f"  {test_name} ({file_path})")
    print(f"{'='*60}")
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # 1. Upload
    upload_start = time.time()
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, "audio/wav")}
        response = requests.post(f"{API_URL}/api/v1/audio/upload", headers=headers, files=files)
    
    if response.status_code != 200:
        print(f"  Upload FAILED: {response.text}")
        return None
    
    audio_id = response.json()["id"]
    upload_time = time.time() - upload_start
    print(f"  Uploaded audio_id: {audio_id} ({upload_time:.2f}s)")
    
    # 2. Analyze
    analyze_start = time.time()
    response = requests.post(f"{API_URL}/api/v1/audio/analyze/{audio_id}", headers=headers)
    if response.status_code != 200:
        print(f"  Analyze FAILED: {response.text}")
        return None
    
    job_id = response.json().get('job_id')
    print(f"  Dispatched job: {job_id}")
    
    # 3. Monitor
    worker = get_worker_process()
    if worker:
        print(f"  Worker PID: {worker.pid}")
    else:
        print("  WARNING: Worker process not found for RAM monitoring")
        
    peak_rss = 0
    status = "processing"
    poll_count = 0
    
    while status == "processing":
        if worker:
            try:
                rss = worker.memory_info().rss / (1024 * 1024)
                if rss > peak_rss:
                    peak_rss = rss
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        time.sleep(1)
        poll_count += 1
        try:
            resp = requests.get(f"{API_URL}/api/v1/audio/status/{audio_id}", headers=headers)
            status = resp.json()["status"]
        except Exception as e:
            print(f"  Poll error: {e}")
            
        if status in ["complete", "failed"]:
            break
        
        if poll_count > 600:  # 10 min timeout
            print("  TIMEOUT after 10 minutes")
            break
            
    total_time = time.time() - analyze_start
    
    result = {
        "test_name": test_name,
        "audio_id": audio_id,
        "job_id": job_id,
        "status": status,
        "total_processing_time_s": round(total_time, 2),
        "peak_rss_mb": round(peak_rss, 2),
    }
    
    print(f"\n  Status: {status}")
    print(f"  Total Processing Time: {total_time:.2f}s")
    print(f"  Peak RAM (RSS): {peak_rss:.2f} MB")
    
    return result

def collect_db_metrics(audio_id):
    """Collect metrics from DB after test completion"""
    sys.path.insert(0, ".")
    from app.db.session import SessionLocal
    from app.models.domain import AudioFile, Note, ProcessingLog
    
    db = SessionLocal()
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    notes = db.query(Note).filter(Note.audio_id == audio_id).all()
    log = db.query(ProcessingLog).filter(ProcessingLog.audio_id == audio_id).first()
    
    metrics = {
        "status": audio.status if audio else "not found",
        "notes_count": len(notes),
        "processing_time_ms": audio.processing_time_ms if audio else None,
    }
    
    if log:
        metrics["preprocessing_time_ms"] = log.preprocessing_time_ms
        metrics["pitch_time_ms"] = log.pitch_time_ms
        metrics["instrument_time_ms"] = log.instrument_time_ms
        metrics["total_time_ms"] = log.total_time_ms
        metrics["job_id"] = log.job_id
    
    db.close()
    return metrics

if __name__ == "__main__":
    test_name = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    results = []

    if test_name in ["a", "all"]:
        r = run_test("tests/test_a_short.wav", "Test A (<30s audio)")
        if r and r["status"] == "complete":
            db_m = collect_db_metrics(r["audio_id"])
            r.update(db_m)
        results.append(r)
    
    if test_name in ["b", "all"]:
        r = run_test("tests/test_b_medium.wav", "Test B (2.5 min audio)")
        if r and r["status"] == "complete":
            db_m = collect_db_metrics(r["audio_id"])
            r.update(db_m)
        results.append(r)
    
    if test_name in ["c", "all"]:
        r = run_test("tests/test_c_long.wav", "Test C (9 min audio)")
        if r and r["status"] == "complete":
            db_m = collect_db_metrics(r["audio_id"])
            r.update(db_m)
        results.append(r)
    
    # Summary
    print(f"\n{'='*60}")
    print("  VALIDATION SUMMARY")
    print(f"{'='*60}")
    for r in results:
        if r:
            print(f"\n  {r['test_name']}:")
            print(f"    Status:              {r.get('status', 'N/A')}")
            print(f"    Notes Count:         {r.get('notes_count', 'N/A')}")
            print(f"    Processing Time:     {r.get('total_time_ms', 'N/A')}ms")
            print(f"    Pitch Time:          {r.get('pitch_time_ms', 'N/A')}ms")
            print(f"    Peak RAM (RSS):      {r.get('peak_rss_mb', 'N/A')} MB")
    
    # Write results to JSON
    with open("scripts/validation_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nResults saved to scripts/validation_results.json")
