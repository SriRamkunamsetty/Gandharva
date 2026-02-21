import requests
import time
import os
import psutil
import json
from datetime import datetime

API_URL = "http://localhost:8000"
with open("scripts/token.txt", "r") as f:
    TOKEN = f.read().strip()

def get_worker_process():
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info.get('cmdline') or []
            # Check for celery worker process
            if any('celery' in arg for arg in cmdline) and any('app.workers.celery_app' in arg for arg in cmdline):
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return None

def run_test(file_path, test_name):
    print(f"\n=== Running {test_name} ({file_path}) ===")
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # 1. Upload
    start_time = time.time()
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, "audio/wav")}
        response = requests.post(f"{API_URL}/api/v1/audio/upload", headers=headers, files=files)
    
    if response.status_code != 200:
        print(f"Upload failed: {response.text}")
        return
    
    audio_id = response.json()["id"]
    print(f"Uploaded audio_id: {audio_id}")
    
    # 2. Analyze
    response = requests.post(f"{API_URL}/api/v1/audio/analyze/{audio_id}", headers=headers)
    if response.status_code != 200:
        print(f"Analyze failed: {response.text}")
        return
    
    print(f"Analysis dispatched. Job ID: {response.json().get('job_id')}")
    
    # 3. Monitor
    worker = get_worker_process()
    if not worker:
        print("Warning: Could not find Celery worker process for RAM monitoring.")
        
    peak_rss = 0
    status = "processing"
    
    while status == "processing":
        if worker:
            try:
                rss = worker.memory_info().rss / (1024 * 1024)
                if rss > peak_rss:
                    peak_rss = rss
                    # print(f"Current RAM: {peak_rss:.2f} MB", end='\r')
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        time.sleep(1)
        resp = requests.get(f"{API_URL}/api/v1/audio/status/{audio_id}", headers=headers)
        status = resp.json()["status"]
        if status in ["complete", "failed"]:
            break
            
    total_time = time.time() - start_time
    print(f"\nTest {test_name} finished with status: {status}")
    print(f"Total Time: {total_time:.2f}s")
    print(f"Peak RAM (RSS during task): {peak_rss:.2f} MB")
    
    return {
        "test_name": test_name,
        "audio_id": audio_id,
        "status": status,
        "total_time": total_time,
        "peak_rss": peak_rss
    }

if __name__ == "__main__":
    # Test A
    test_a = run_test("tests/test_a_short.wav", "Test A (<30s)")
