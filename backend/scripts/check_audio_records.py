from app.db.session import SessionLocal
from app.models.domain import AudioFile, Note, ProcessingLog

db = SessionLocal()

audios = db.query(AudioFile).order_by(AudioFile.created_at.desc()).all()
with open("scripts/audit.txt", "w") as f:
    f.write(f"Total audio records: {len(audios)}\n")
    for a in audios:
        f.write(f"\n--- Audio: {a.id} ---\n")
        f.write(f"  Status: {a.status}\n")
        f.write(f"  File: {a.original_filename}\n")
        f.write(f"  Raw path: {a.raw_path}\n")
        notes = db.query(Note).filter(Note.audio_id == a.id).all()
        f.write(f"  Notes count: {len(notes)}\n")
        log = db.query(ProcessingLog).filter(ProcessingLog.audio_id == a.id).first()
        if log:
            f.write(f"  Log: job_id={log.job_id}\n")
            f.write(f"  Total time: {log.total_time_ms}ms\n")
            f.write(f"  Pitch time: {log.pitch_time_ms}ms\n")
            if log.error_trace:
                f.write(f"  ERROR TRACE:\n{log.error_trace}\n")

db.close()
print("Audit written to scripts/audit.txt")
