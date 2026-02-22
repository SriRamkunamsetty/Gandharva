import os
from celery import Celery
from app.core.config import settings
import logging

# Ensure logs use standard output mapped to our severity definitions
logger = logging.getLogger(__name__)

broker_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
# Swap DB to 1 for backend results automatically
backend_url = broker_url[:-1] + "1" if broker_url.endswith("/0") else broker_url

celery_app = Celery(
    "gandarva_worker",
    broker=broker_url,
    backend=backend_url
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
