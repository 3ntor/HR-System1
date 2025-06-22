#!/bin/bash

# HR System Stop Script
echo "🛑 Stopping HR System..."

# Function to kill process by PID if it exists
kill_pid() {
    local pid=$1
    local name=$2
    
    if [ -n "$pid" ] && ps -p $pid > /dev/null 2>&1; then
        echo "🔄 Stopping $name (PID: $pid)..."
        kill $pid 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            echo "💀 Force killing $name..."
            kill -9 $pid 2>/dev/null
        fi
        
        echo "✅ $name stopped"
    else
        echo "❌ $name not running or PID not found"
    fi
}

# Function to kill processes by port
kill_port() {
    local port=$1
    local name=$2
    
    echo "🔄 Checking port $port for $name..."
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "💀 Killing processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "✅ Port $port cleared"
    else
        echo "✅ Port $port is already free"
    fi
}

# Stop using PID files
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    kill_pid $BACKEND_PID "Backend"
    rm -f backend.pid
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    kill_pid $FRONTEND_PID "Frontend"
    rm -f frontend.pid
fi

# Kill by ports as backup
kill_port 5001 "Backend"
kill_port 3000 "Frontend"

# Kill any remaining Node.js processes related to our project
echo "🧹 Cleaning up remaining processes..."
pkill -f "nodemon server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

# Clean up log files (optional)
if [ "$1" = "--clean-logs" ]; then
    echo "🧹 Cleaning log files..."
    rm -f backend.log frontend.log
    echo "✅ Log files cleaned"
fi

# Clean up WhatsApp session (optional)
if [ "$1" = "--clean-whatsapp" ]; then
    echo "🧹 Cleaning WhatsApp session..."
    rm -rf backend/data/whatsapp/.wwebjs_*
    rm -f backend/data/whatsapp/qr*.png
    echo "✅ WhatsApp session cleaned"
fi

echo ""
echo "✅ HR System stopped successfully!"
echo ""
echo "💡 Options:"
echo "   --clean-logs      Clean log files"
echo "   --clean-whatsapp  Clean WhatsApp session"
echo ""
echo "🚀 To restart: ./start-system.sh"