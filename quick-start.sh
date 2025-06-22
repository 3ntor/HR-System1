#!/bin/bash

# Quick Start Script for HR WhatsApp System
# تشغيل سريع للنظام

echo "⚡ تشغيل سريع لنظام WhatsApp HR"
echo "================================"

# Kill existing processes
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 2

# Clear ports
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Install puppeteer if needed
echo "🔧 تحقق من المتطلبات..."
cd backend
if ! npm list puppeteer >/dev/null 2>&1; then
    echo "📦 تثبيت Puppeteer..."
    npm install puppeteer@latest --save
fi

# Start backend
echo "🚀 بدء الخادم..."
npm start &
sleep 3

# Start frontend
echo "🎨 بدء الواجهة..."
cd ../frontend
export PORT=3000
npm start &

echo ""
echo "✅ النظام يعمل على:"
echo "🌐 الواجهة: http://localhost:3000"
echo "🔧 الخادم: http://localhost:5001"
echo "📱 WhatsApp: http://localhost:3000/whatsapp"
echo ""
echo "⏳ انتظر دقيقة واحدة حتى يكتمل التحميل..."

wait 