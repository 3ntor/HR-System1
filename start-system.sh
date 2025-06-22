#!/bin/bash

# HR System Startup Script
echo "🚀 Starting HR System with WhatsApp Integration..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "🔄 Killing processes on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Check and clean ports
echo "🔍 Checking for existing processes..."

if check_port 5001; then
    echo "⚠️  Port 5001 is in use"
    kill_port 5001
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is in use"
    kill_port 3000
fi

# Check Chrome browser installation for WhatsApp
echo "🌐 Checking Chrome installation..."
if command -v google-chrome >/dev/null 2>&1; then
    echo "✅ Chrome found: $(google-chrome --version)"
elif command -v chromium-browser >/dev/null 2>&1; then
    echo "✅ Chromium found: $(chromium-browser --version)"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    if [[ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
        echo "✅ Chrome found on macOS"
    else
        echo "⚠️  Chrome not found on macOS - WhatsApp may not work properly"
    fi
else
    echo "⚠️  No Chrome/Chromium found - WhatsApp may not work properly"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/data/whatsapp
mkdir -p backend/logs

# Start Backend
echo "🔧 Starting Backend Server..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
echo "🟢 Starting backend on port 5001..."
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "🔄 Waiting for backend... ($i/30)"
    sleep 2
done

# Check if backend started successfully
if ! curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "❌ Backend failed to start!"
    echo "📄 Backend logs:"
    tail -20 ../backend.log
    exit 1
fi

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
echo "🟢 Starting frontend on port 3000..."
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    echo "🔄 Waiting for frontend... ($i/60)"
    sleep 2
done

# Go back to root directory
cd ..

# Create PID file for easy cleanup
echo "$BACKEND_PID" > backend.pid
echo "$FRONTEND_PID" > frontend.pid

echo ""
echo "🎉 HR System is now running!"
echo ""
echo "📊 System URLs:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend:     http://localhost:5001"
echo "   Health:      http://localhost:5001/health"
echo "   WhatsApp:    http://localhost:3000/whatsapp/connect"
echo ""
echo "📋 Quick Commands:"
echo "   Check Status:    curl http://localhost:5001/health"
echo "   Stop System:     ./stop-system.sh"
echo "   View Backend:    tail -f backend.log"
echo "   View Frontend:   tail -f frontend.log"
echo ""
echo "🟢 WhatsApp Connection:"
echo "   Go to: http://localhost:3000/whatsapp/connect"
echo "   Login as admin and click 'بدء الاتصال'"
echo ""
echo "✅ System startup complete!"

# Open browser automatically (optional)
if command -v open >/dev/null 2>&1; then
    # macOS
    echo "🌐 Opening browser..."
    sleep 3
    open http://localhost:3000
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    echo "🌐 Opening browser..."
    sleep 3
    xdg-open http://localhost:3000
fi 