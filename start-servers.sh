#!/bin/bash

# PredictX - Start Chat & Frontend Servers
# This script starts both the chat server and frontend development server

echo "🚀 Starting PredictX Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the predictx directory
if [ ! -d "chat_server" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the predictx root directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $CHAT_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start Chat Server
echo "${BLUE}📨 Starting Chat Server on port 3001...${NC}"
cd chat_server
npm install > /dev/null 2>&1
node server.js &
CHAT_PID=$!
cd ..

sleep 2

# Start Frontend
echo "${GREEN}🌐 Starting Frontend on port 3000...${NC}"
cd frontend
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo ""
echo "Chat Server: http://localhost:3001"
echo "Frontend:    http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop
wait
