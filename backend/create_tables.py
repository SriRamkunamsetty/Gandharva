from app.db.session import engine
from app.models.domain import Base
print("Creating tables in PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("Done creating tables.")
