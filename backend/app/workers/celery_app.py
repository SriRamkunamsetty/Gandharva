from celery import Celery
from app.core.config import settings
import logging

# Ensure logs use standard output mapped to our severity definitions
logger = logging.getLogger(__name__)

celery_app = Celery(
    "gandarva_worker",
    broker=f"redis://localhost:6379/0",
    backend=f"redis://localhost:6379/1"
)

# Apply Hard Resource Constraints from Environment
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Critical Architecture Rule: Concurrency limits & memory caps to prevent runaway Celery spawning
    worker_concurrency=settings.CELERY_WORKER_CONCURRENCY,
    worker_max_memory_per_child=settings.CELERY_MAX_MEMORY_PER_CHILD,
    
    # Graceful Shutdown
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Load task modules
celery_app.autodiscover_tasks(["app.workers.tasks"])
