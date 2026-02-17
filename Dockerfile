FROM python:3.11-slim

# So logs appear immediately when running under gunicorn
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads static/css static/js static/images

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Expose port
EXPOSE 5000

# Gunicorn configuration via environment variables:
#   GUNICORN_WORKERS (default: 4)
#   GUNICORN_THREADS (default: 2)
#   GUNICORN_TIMEOUT (default: 120)
# Override at runtime or in docker-compose.yml

CMD ["sh", "-c", "gunicorn --workers ${GUNICORN_WORKERS:-4} --threads ${GUNICORN_THREADS:-2} --timeout ${GUNICORN_TIMEOUT:-120} --bind 0.0.0.0:5000 --access-logfile - --error-logfile - --capture-output app:app"]

