from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Note: For async operations we use asyncpg
# Since psycopg2 is standard we are using the sync engine for simple migration and async later if needed, 
# For now we'll stick to mostly sync or standard SQLAlchemy 2.0 async based on requirements
# I will use sync engine initially to match `psycopg2-binary` dependency.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
