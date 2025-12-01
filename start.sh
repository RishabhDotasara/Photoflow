#!/bin/bash

# filepath: /home/sinosuke/Documents/Photoflow/start.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default number of workers
NUM_WORKERS=1
CONCURRENCY=4

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--workers)
            NUM_WORKERS="$2"
            shift 2
            ;;
        -c|--concurrency)
            CONCURRENCY="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -w, --workers NUM      Number of Celery workers to start (default: 1)"
            echo "  -c, --concurrency NUM  Concurrency per worker (default: 4)"
            echo "  -h, --help             Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Photoflow Application Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Celery Workers: ${GREEN}$NUM_WORKERS${NC}"
echo -e "  Concurrency per worker: ${GREEN}$CONCURRENCY${NC}"
echo ""

# Store PIDs for cleanup
PIDS=()

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${NC}"
    
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "Stopping process $pid..."
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Kill any remaining child processes
    pkill -P $$ 2>/dev/null || true
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap for cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

# ============ Start Frontend ============
echo -e "${BLUE}[1/4] Starting Frontend...${NC}"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start Next.js development server
echo -e "${GREEN}Starting Next.js on port 3000...${NC}"
npm run dev &
PIDS+=($!)
sleep 3

# ============ Setup Backend ============
echo -e "${BLUE}[2/4] Setting up Backend...${NC}"

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade pip
pip install --upgrade pip -q

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r requirements.txt -q
else
    echo -e "${RED}Warning: requirements.txt not found${NC}"
fi

# ============ Start Uvicorn Server ============
echo -e "${BLUE}[3/4] Starting Uvicorn Server...${NC}"

echo -e "${GREEN}Starting FastAPI server on port 8000...${NC}"
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
PIDS+=($!)
sleep 2

# ============ Start Celery Workers ============
echo -e "${BLUE}[4/4] Starting Celery Workers...${NC}"

# Define queues
QUEUES="folder_tasks,image_tasks,thumbnail_tasks"

for i in $(seq 1 $NUM_WORKERS); do
    WORKER_NAME="worker${i}@%h"
    echo -e "${GREEN}Starting Celery worker $i ($WORKER_NAME) with concurrency $CONCURRENCY...${NC}"
    
    celery -A celery_config worker \
        --loglevel=info \
        --concurrency=$CONCURRENCY \
        --hostname="$WORKER_NAME" \
        -Q "$QUEUES" &
    PIDS+=($!)
    sleep 1
done

# ============ All Services Started ============
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Services running:${NC}"
echo -e "  Frontend:       ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API:    ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:       ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  Celery Workers: ${GREEN}$NUM_WORKERS workers (concurrency: $CONCURRENCY each)${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait