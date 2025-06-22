#!/bin/bash

echo "🚀 Starting HR System Servers..."

# تنظيف الـ logs المكسورة
echo "🧹 Cleaning up..."
echo "[]" > backend/data/whatsapp/logs.json
rm -rf backend/data/whatsapp/session/
rm -f backend/data/whatsapp/qr_debug.png

# إيقاف أي خوادم سابقة
echo "⏹️  Stopping existing servers..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 3

# تشغيل الباك إند في الخلفية
echo "🔧 Starting Backend Server..."
cd backend
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
cd ..

# انتظار حتى يصبح الباك إند جاهز
echo "⏳ Waiting for backend to be ready..."
sleep 10

# فحص حالة الباك إند
until curl -s http://localhost:5001/health > /dev/null; do
  echo "⏳ Still waiting for backend..."
  sleep 2
done
echo "✅ Backend is ready!"

# تشغيل الفرونت إند في الخلفية
echo "🎨 Starting Frontend Server..."
cd frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
cd ..

# انتظار حتى يصبح الفرونت إند جاهز
echo "⏳ Waiting for frontend to be ready..."
sleep 15

echo ""
echo "🎉 Both servers are running in background!"
echo "📊 Backend: http://localhost:5001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📝 Log files:"
echo "   Backend: backend.log"
echo "   Frontend: frontend.log"
echo ""
echo "🛑 To stop servers, run:"
echo "   pkill -f 'node.*server.js'"
echo "   pkill -f 'react-scripts'"
echo ""
echo "📊 Server status:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID" 