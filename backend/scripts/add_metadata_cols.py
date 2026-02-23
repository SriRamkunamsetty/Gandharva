from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db.session import SessionLocal

def upgrade():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE audio_files ADD COLUMN duration FLOAT;"))
        db.execute(text("ALTER TABLE audio_files ADD COLUMN sample_rate INTEGER;"))
        db.execute(text("ALTER TABLE audio_files ADD COLUMN channels INTEGER;"))
        db.execute(text("ALTER TABLE audio_files ADD COLUMN file_size INTEGER;"))
        db.execute(text("ALTER TABLE audio_files ADD COLUMN bit_depth INTEGER;"))
        db.commit()
        print("Metadata columns added successfully")
    except Exception as e:
        print(f"Migration error (already exists?): {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    upgrade()
