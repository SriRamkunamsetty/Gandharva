import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_db, get_current_user
from app.models.domain import AudioFile, User

client = TestClient(app)

# Mocked dependencies
def override_get_current_user():
    return User(id=1, email="testuser@gandarva.ai")

app.dependency_overrides[get_current_user] = override_get_current_user

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_analyze_idempotency_flow(mocker):
    # Mocking DB response for an already complete audio file
    mock_db = mocker.Mock()
    mock_audio = AudioFile(id="mock-id", status="complete", user_id=1)
    mock_db.query().filter().first.return_value = mock_audio
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.post("/api/v1/audio/analyze/mock-id")
    
    # Should instantly return success due to idempotency guard
    assert response.status_code == 200
    assert response.json().get("status") == "already_completed"

def test_forbidden_foreign_audio_access(mocker):
    # Mocking DB response for an audio file owned by another user
    mock_db = mocker.Mock()
    # Current user is ID 1, but audio belongs to ID 99
    mock_audio = AudioFile(id="foreign-id", status="uploaded", user_id=99)
    mock_db.query().filter().first.return_value = mock_audio
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/api/v1/audio/status/foreign-id")
    
    # Assert exact 403 Forbidden behavior for ownership bounds
    assert response.status_code == 403
    assert "Not authorized" in response.json().get("detail", "")
