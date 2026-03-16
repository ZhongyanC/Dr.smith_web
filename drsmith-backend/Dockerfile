FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir gunicorn

COPY . /app

ENV DJANGO_SETTINGS_MODULE=myblog.settings \
    PYTHONPATH=/app

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "myblog.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]

