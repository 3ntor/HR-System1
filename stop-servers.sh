#!/bin/bash

echo "🛑 Stopping HR System Servers..."

# إيقاف خوادم الباك إند
echo "⏹️  Stopping Backend servers..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

# إيقاف خوادم الفرونت إند
echo "⏹️  Stopping Frontend servers..."
pkill -f "react-scripts" 2>/dev/null

# إيقاف أي عمليات npm
echo "⏹️  Stopping npm processes..."
pkill -f "npm.*start" 2>/dev/null

sleep 2

echo "✅ All servers stopped!"

# فحص البورتات
echo "📊 Checking ports..."
if lsof -i :5001 > /dev/null 2>&1; then
    echo "⚠️  Port 5001 still in use"
    lsof -i :5001
else
    echo "✅ Port 5001 is free"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 still in use"
    lsof -i :3000
else
    echo "✅ Port 3000 is free"
fi 