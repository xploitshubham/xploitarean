#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   XIQ - Starting Frontend & Backend   ${NC}"
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

# Stop existing servers
echo -e "${YELLOW}Step 1: Stopping existing servers...${NC}"
kill_port 8001  # Frontend port
kill_port 8080  # Backend port
echo ""

# Check if required directories exist
if [ ! -d "backend" ]; then
    echo -e "${RED}Error: backend directory not found${NC}"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo -e "${RED}Error: frontend directory not found${NC}"
    exit 1
fi

# Start Backend
echo -e "${YELLOW}Step 2: Starting Backend Server...${NC}"
cd backend

# Check if .env file exists (optional, backend can use default values)
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Note: Backend .env file not found (using defaults)${NC}"
else
    echo -e "${GREEN}✓ Backend .env file found${NC}"
fi

if [ ! -f "cmd/pentagi/main.go" ]; then
    echo -e "${RED}Error: Backend main.go not found${NC}"
    exit 1
fi

# Start backend in background
echo -e "${YELLOW}Starting backend server...${NC}"
nohup go run cmd/pentagi/main.go > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}  Backend logs: tail -f backend.log${NC}"
cd ..

# Wait a bit for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check backend.log${NC}"
    exit 1
fi

echo ""

# Start Frontend
echo -e "${YELLOW}Step 3: Starting Frontend Server...${NC}"
cd frontend

# Check and create .env file if missing
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > .env << EOF
VITE_API_URL=localhost:8080
VITE_USE_HTTPS=false
EOF
    echo -e "${GREEN}✓ Frontend .env file created${NC}"
else
    # Check if VITE_API_URL is set
    if ! grep -q "VITE_API_URL" .env; then
        echo -e "${YELLOW}Adding VITE_API_URL to .env file...${NC}"
        echo "VITE_API_URL=localhost:8080" >> .env
    fi
    if ! grep -q "VITE_USE_HTTPS" .env; then
        echo -e "${YELLOW}Adding VITE_USE_HTTPS to .env file...${NC}"
        echo "VITE_USE_HTTPS=false" >> .env
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}  Frontend logs: tail -f frontend.log${NC}"
cd ..

# Wait a bit for frontend to start
sleep 3

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check frontend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✓ Both servers started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:8080"
echo -e "${BLUE}Frontend:${NC} http://localhost:8001"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo -e "  Backend:  ${BLUE}tail -f backend.log${NC}"
echo -e "  Frontend: ${BLUE}tail -f frontend.log${NC}"
echo ""
echo -e "${YELLOW}To stop servers:${NC}"
echo -e "  ${BLUE}./stop.sh${NC} or kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Save PIDs to file for easy stopping
echo "$BACKEND_PID $FRONTEND_PID" > .server_pids
echo -e "${GREEN}PIDs saved to .server_pids${NC}"
