from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audio_files = relationship("AudioFile", back_populates="owner")

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(String, primary_key=True, index=True) # UUID string
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    original_filename = Column(String, nullable=False)
    status = Column(String, default="uploaded", index=True) # uploaded, processing, complete, failed
    
    # Storage Paths
    raw_path = Column(String)
    processed_path = Column(String)
    midi_path = Column(String)
    pdf_path = Column(String)
    
    # Metrics
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="audio_files")
    notes = relationship("Note", back_populates="audio_file", cascade="all, delete-orphan")
    processing_log = relationship("ProcessingLog", back_populates="audio_file", uselist=False, cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    audio_id = Column(String, ForeignKey("audio_files.id"), index=True, nullable=False)
    
    note_name = Column(String, nullable=False) # e.g., C4
    frequency = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    
    raw_start = Column(Float, nullable=False)
    raw_end = Column(Float, nullable=False)
    quantized_start = Column(Float, nullable=True)
    quantized_end = Column(Float, nullable=True)
    
    audio_file = relationship("AudioFile", back_populates="notes")

class ProcessingLog(Base):
    __tablename__ = "processing_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    audio_id = Column(String, ForeignKey("audio_files.id"), unique=True, nullable=False)
    
    job_id = Column(String, nullable=True)
    model_version_pitch = Column(String, nullable=True)
    model_version_classifier = Column(String, nullable=True)
    
    preprocessing_time_ms = Column(Integer, nullable=True)
    pitch_time_ms = Column(Integer, nullable=True)
    instrument_time_ms = Column(Integer, nullable=True)
    total_time_ms = Column(Integer, nullable=True)
    
    error_trace = Column(Text, nullable=True)
    
    audio_file = relationship("AudioFile", back_populates="processing_log")
