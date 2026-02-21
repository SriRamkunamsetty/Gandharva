import pytest
from unittest.mock import patch, MagicMock
from app.workers.tasks import process_audio_pipeline
from app.core.config import settings

@patch('app.workers.tasks.SessionLocal')
@patch('app.workers.tasks.time.sleep') # For mocking ML Processing time
def test_pipeline_atomic_commit(mock_sleep, mock_db_session):
    # Setup mock DB session and Audio record
    mock_db = MagicMock()
    mock_db_session.return_value = mock_db
    
    mock_audio = MagicMock()
    mock_audio.status = 'processing'
    mock_audio.user_id = 1
    mock_db.query().filter().first.return_value = mock_audio
    
    # Run the worker pipeline function
    result = process_audio_pipeline("test-audio-1234")
    
    # Assert successful execution
    assert result.get("status") == "success"
    
    # Verify State Machine transition to 'complete'
    assert mock_audio.status == "complete"
    
    # Verify exactly one commit happened to wrap all DB transactions at the end
    mock_db.commit.assert_called_once()
    mock_db.close.assert_called_once()
    mock_db.rollback.assert_not_called()

@patch('app.workers.tasks.SessionLocal')
def test_worker_graceful_exception_handling(mock_db_session):
    # Setup mock DB
    mock_db = MagicMock()
    mock_db_session.return_value = mock_db
    
    mock_audio = MagicMock()
    mock_audio.status = 'processing'
    mock_db.query().filter().first.return_value = mock_audio
    
    # Force an exception during processing (e.g., simulating SIGTERM or memory crash)
    mock_db.add.side_effect = Exception("Simulated Worker Crash")
    
    # Run process
    result = process_audio_pipeline("crash-val")
    
    # Assert worker handled exception by returning failed payload
    assert result.get("status") == "failed"
    
    # Assert rollback occurred AND status was set to 'failed' with a recovery commit
    mock_db.rollback.assert_called_once()
    assert mock_audio.status == "failed"
    mock_db.commit.assert_called_once() # Recovery commit
