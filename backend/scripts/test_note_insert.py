from app.db.session import SessionLocal
from app.models.domain import Note, AudioFile

db = SessionLocal()

# Check if there are any audio files in processing/failed state
audios = db.query(AudioFile).filter(AudioFile.status.in_(["processing", "failed"])).all()
for a in audios:
    print(f"Audio: {a.id}, status: {a.status}, file: {a.original_filename}")

# Try inserting a test note
if audios:
    audio_id = audios[0].id
    try:
        note = Note(
            audio_id=audio_id,
            note_name="69",
            frequency=440.0,
            confidence=0.8,
            raw_start=0.5,
            raw_end=1.0
        )
        db.add(note)
        db.commit()
        print(f"Successfully inserted test note for audio {audio_id}")
        # Clean up
        db.delete(note)
        db.commit()
        print("Cleaned up test note")
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()

db.close()
