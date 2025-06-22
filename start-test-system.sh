#!/bin/bash

# اسكريبت تشغيل نظام الاختبار مع الرسائل التجريبية

echo "🚀 تشغيل نظام الموارد البشرية مع الرسائل التجريبية"
echo "=================================================="

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت"
    exit 1
fi

# التحقق من وجود Chrome
if [ ! -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    echo "⚠️ تحذير: Google Chrome غير موجود في المسار المتوقع"
fi

# قتل العمليات السابقة
echo "🧹 تنظيف العمليات السابقة..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

sleep 2

# بدء الخادم الخلفي
echo "🔧 بدء الخادم الخلفي..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت التبعيات..."
    npm install
fi

# بدء الخادم في الخلفية
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ الخادم الخلفي بدأ (PID: $BACKEND_PID)"

# انتظار تشغيل الخادم
echo "⏳ انتظار تشغيل الخادم..."
for i in {1..20}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo "✅ الخادم الخلفي جاهز"
        break
    fi
    sleep 1
    if [ $i -eq 20 ]; then
        echo "❌ فشل في تشغيل الخادم الخلفي"
        exit 1
    fi
done

# العودة للمجلد الجذر
cd ..

# بدء الفرونت إند
echo "🎨 بدء الفرونت إند..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت تبعيات الفرونت إند..."
    npm install
fi

# بدء الفرونت إند في الخلفية
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ الفرونت إند بدأ (PID: $FRONTEND_PID)"

# العودة للمجلد الجذر
cd ..

# انتظار تشغيل الفرونت إند
echo "⏳ انتظار تشغيل الفرونت إند..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ الفرونت إند جاهز"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ فشل في تشغيل الفرونت إند"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
done

# تحميل القوالب التجريبية
echo "📝 تحميل القوالب التجريبية..."
TEMPLATES_RESPONSE=$(curl -s -X POST http://localhost:5001/api/whatsapp/load-test-templates)
if echo $TEMPLATES_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ تم تحميل القوالب التجريبية بنجاح"
else
    echo "⚠️ تحذير: فشل في تحميل القوالب التجريبية"
fi

# حفظ معرفات العمليات
echo "# معرفات العمليات - تم إنشاؤها تلقائياً" > .pids
echo "BACKEND_PID=$BACKEND_PID" >> .pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .pids

echo ""
echo "🎉 النظام جاهز للاستخدام!"
echo "========================="
echo ""
echo "🌐 الروابط المتاحة:"
echo "   📊 الفرونت إند: http://localhost:3000"
echo "   🔧 API الخلفي: http://localhost:5001"
echo "   🧪 الرسائل التجريبية: http://localhost:3000/whatsapp (تبويب: رسائل تجريبية)"
echo "   🔗 اتصال WhatsApp: http://localhost:3000/whatsapp/connect"
echo ""
echo "👤 جهة الاتصال التجريبية:"
echo "   📱 الاسم: كريم البحراوي"
echo "   📞 الرقم: 01016772118"
echo ""
echo "📋 الخطوات التالية:"
echo "   1. اذهب إلى: http://localhost:3000/whatsapp/connect"
echo "   2. امسح QR Code بهاتفك"
echo "   3. انتقل إلى: http://localhost:3000/whatsapp"
echo "   4. اضغط على تبويب 'رسائل تجريبية'"
echo "   5. ابدأ الاختبار!"
echo ""
echo "🛑 لإيقاف النظام:"
echo "   ./stop-test-system.sh"
echo ""
echo "📊 مراقبة السجلات:"
echo "   tail -f backend.log"
echo "   tail -f frontend.log"
echo ""

# فتح المتصفح تلقائياً
if command -v open &> /dev/null; then
    echo "🌐 فتح المتصفح..."
    sleep 3
    open http://localhost:3000/whatsapp/connect
fi

echo "✨ استمتع بالاختبار!" 