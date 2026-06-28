FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app/project

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-smoke.txt ./

RUN pip install --upgrade pip && \
    pip install --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchvision==0.18.1 && \
    pip install -r requirements-smoke.txt

COPY . .

CMD ["python", "scripts/smoke_test.py"]
