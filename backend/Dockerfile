FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .

RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment defaults
ENV ENV=prod
ENV DEVICE=cpu

# Use gunicorn with uvicorn workers for 1 vCPU safety
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "-w", "1", "-b", "0.0.0.0:8000"]
