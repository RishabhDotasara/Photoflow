# Use official Python image
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    git \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Debian/Ubuntu-based image
RUN apt-get update && apt-get install -y \
    gcc \
    libdbus-1-dev \
    pkg-config \
    libglib2.0-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install system dependencies (for psycopg2, etc.)
RUN apt-get update && apt-get install -y \
    gcc libpq-dev curl

# Copy requirements and install them
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

    
    # Copy the rest of the backend code
COPY . .
    
# Expose port (adjust if needed)
EXPOSE 8000

# Command to run the server (adjust for your entrypoint)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
