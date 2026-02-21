from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
result = db.execute(text("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'notes'"))
rows = result.fetchall()
for r in rows:
    print(r)
db.close()
