from app.db.session import SessionLocal
from app.models.domain import AudioFile, Note, ProcessingLog

db = SessionLocal()

audios = db.query(AudioFile).order_by(AudioFile.created_at).all()
with open("scripts/full_audit.txt", "w") as f:
    f.write(f"Total audio records: {len(audios)}\n")
    for a in audios:
        f.write(f"\n--- Audio: {a.id} ---\n")
        f.write(f"  Status: {a.status}\n")
        f.write(f"  File: {a.original_filename}\n")
        f.write(f"  Processing time: {a.processing_time_ms}ms\n")
        f.write(f"  Instrument: {a.instrument_result if hasattr(a, 'instrument_result') else 'N/A'}\n")
        notes = db.query(Note).filter(Note.audio_id == a.id).all()
        f.write(f"  Notes count: {len(notes)}\n")
        if notes:
            for n in notes[:5]:
                f.write(f"    Note: {n.note_name} freq={n.frequency:.2f} conf={n.confidence:.2f} [{n.raw_start:.4f}-{n.raw_end:.4f}]\n")
            if len(notes) > 5:
                f.write(f"    ... and {len(notes)-5} more notes\n")
        log = db.query(ProcessingLog).filter(ProcessingLog.audio_id == a.id).first()
        if log:
            f.write(f"  Processing Log:\n")
            f.write(f"    Job ID: {log.job_id}\n")
            f.write(f"    Preprocessing: {log.preprocessing_time_ms}ms\n")
            f.write(f"    Pitch detection: {log.pitch_time_ms}ms\n")
            f.write(f"    Instrument: {log.instrument_time_ms}ms\n")
            f.write(f"    Total: {log.total_time_ms}ms\n")

db.close()
print("Full audit written to scripts/full_audit.txt")
