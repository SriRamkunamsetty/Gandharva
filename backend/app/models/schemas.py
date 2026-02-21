from pydantic import BaseModel, Field
from typing import Optional, List

class RequestBase(BaseModel):
    model_config = {"extra": "forbid"} # Strict Pydantic parsing: Reject unknown

# -----------------
# Response Models
# -----------------
class NoteInDB(BaseModel):
    note_name: str
    confidence: float
    raw_start: float
    raw_end: float
    quantized_start: Optional[float]
    quantized_end: Optional[float]
    
    model_config = {"from_attributes": True}

class AudioStatusResponse(BaseModel):
    id: str
    status: str
    original_filename: str
    notes: Optional[List[NoteInDB]] = None
    instrument: Optional[str] = None
    
    model_config = {"from_attributes": True}

class AnalyzeResponse(BaseModel):
    message: str
    audio_id: str
    job_id: Optional[str] = None
    status: str

class AnalysisDetailResponse(BaseModel):
    audio_id: str
    key: Optional[str] = None
    bpm: Optional[float] = None
    notes_count: int = 0
    instrument: Optional[str] = None

