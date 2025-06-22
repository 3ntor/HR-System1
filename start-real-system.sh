#!/bin/bash

# HR System - Real Database Startup Script
# سكريپت تشغيل النظام مع قاعدة بيانات حقيقية

echo "🚀 تشغيل نظام HR مع قاعدة البيانات الحقيقية"
echo "========================================"

# تحقق من وجود .env
if [ ! -f "backend/.env" ]; then
    echo "❌ ملف .env غير موجود!"
    echo "📝 قم بإنشاء ملف backend/.env أولاً"
    exit 1
fi

# إيقاف أي عمليات سابقة
echo "🛑 إيقاف العمليات السابقة..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "test-server" 2>/dev/null || true
sleep 2

# تحرير المنافذ
echo "🔧 تحرير المنافذ..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# تثبيت التبعيات
echo "📦 فحص التبعيات..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📥 تثبيت تبعيات الباك اند..."
    npm install
fi

# إنشاء Admin إذا لم يكن موجوداً
echo "👤 إنشاء مستخدم Admin..."
node create-admin.js

# تشغيل الباك اند
echo "🔧 تشغيل الباك اند..."
npm start &
BACKEND_PID=$!
sleep 3

# تشغيل الفرونت اند
echo "🎨 تشغيل الفرونت اند..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📥 تثبيت تبعيات الفرونت اند..."
    npm install
fi

export PORT=3000
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ النظام يعمل الآن:"
echo "🌐 الواجهة: http://localhost:3000"
echo "🔧 الباك اند: http://localhost:5001"
echo "📱 WhatsApp: http://localhost:3000/whatsapp"
echo ""
echo "👤 بيانات تسجيل الدخول:"
echo "   اسم المستخدم: admin"
echo "   كلمة المرور: admin123"
echo ""
echo "⏹️  لإيقاف النظام اضغط Ctrl+C"

# انتظار الإيقاف
wait 