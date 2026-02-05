#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   XIQ - Stopping Frontend & Backend   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Stopping process on port $port (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}✓ Port $port cleared${NC}"
    else
        echo -e "${GREEN}✓ Port $port is already free${NC}"
    fi
}

# Stop from PIDs file if exists
if [ -f ".server_pids" ]; then
    echo -e "${YELLOW}Stopping servers from saved PIDs...${NC}"
    PIDS=$(cat .server_pids)
    for pid in $PIDS; do
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Killing process $pid...${NC}"
            kill -9 $pid 2>/dev/null
            echo -e "${GREEN}✓ Process $pid stopped${NC}"
        fi
    done
    rm .server_pids
    echo ""
fi

# Stop by ports (fallback)
echo -e "${YELLOW}Stopping processes on ports...${NC}"
kill_port 8001  # Frontend port
kill_port 8080  # Backend port

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✓ All servers stopped${NC}"
echo -e "${GREEN}========================================${NC}"
