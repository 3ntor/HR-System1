#!/bin/bash

# 🔄 سكريبت إعادة تشغيل النظام السريع

echo "🛑 إيقاف جميع العمليات..."
pkill -f nodemon 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "⏳ انتظار..."
sleep 3

echo "🚀 تشغيل الخادم..."
cd backend && npm start &
BACKEND_PID=$!

echo "⏳ انتظار تشغيل الخادم..."
sleep 5

echo "🌐 فحص الخادم..."
if curl -s http://localhost:5000/test > /dev/null; then
    echo "✅ الخادم يعمل بنجاح!"
else
    echo "❌ فشل في تشغيل الخادم"
    exit 1
fi

echo ""
echo "📱 الآن افتح المتصفح على: http://localhost:3000"
echo "🔗 واذهب لتبويب الواتساب واضغط اتصال"
echo ""
echo "✅ النظام جاهز!" 