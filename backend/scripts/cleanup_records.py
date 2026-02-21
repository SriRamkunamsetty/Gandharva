from app.db.session import SessionLocal
from app.models.domain import AudioFile, Note, ProcessingLog

db = SessionLocal()

# Delete all existing audio records and related data
db.query(Note).delete()
db.query(ProcessingLog).delete()
db.query(AudioFile).delete()
db.commit()
print("All audio records cleaned up.")
db.close()
