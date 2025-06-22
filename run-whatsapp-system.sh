#!/bin/bash

# HR WhatsApp System Universal Launcher
# يعمل على أي جهاز بدون مشاكل تثبيت

echo "🚀 بدء تشغيل نظام WhatsApp للموارد البشرية"
echo "========================================"

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "🔧 تحرير البورت $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while ! check_port $port; do
        echo "⚠️  البورت $port مستخدم، جاري البحث عن بورت آخر..."
        kill_port $port
        sleep 1
        if check_port $port; then
            break
        fi
        ((port++))
        if [ $port -gt $((start_port + 10)) ]; then
            echo "❌ لم يتم العثور على بورت متاح"
            exit 1
        fi
    done
    
    echo $port
}

# Check system requirements
echo "🔍 فحص متطلبات النظام..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً"
    echo "📥 يمكنك تحميله من: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js متوفر: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت"
    exit 1
fi

echo "✅ npm متوفر: $(npm --version)"

# Navigate to project directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ المجلدات المطلوبة غير موجودة (backend/frontend)"
    exit 1
fi

echo "✅ هيكل المشروع صحيح"

# Kill any existing processes
echo "🧹 تنظيف العمليات السابقة..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 3

# Find available ports
echo "🔍 البحث عن بورتات متاحة..."
BACKEND_PORT=$(find_available_port 5001)
FRONTEND_PORT=$(find_available_port 3000)

echo "✅ البورتات المحددة:"
echo "   - Backend: $BACKEND_PORT"
echo "   - Frontend: $FRONTEND_PORT"

# Update backend port configuration
echo "⚙️  تحديث إعدادات البورت..."
cd backend

# Update server.js port
sed -i.bak "s/const PORT = process.env.PORT || [0-9]*/const PORT = process.env.PORT || $BACKEND_PORT/" server.js 2>/dev/null || {
    # If sed -i.bak doesn't work, try without backup
    sed -i "s/const PORT = process.env.PORT || [0-9]*/const PORT = process.env.PORT || $BACKEND_PORT/" server.js 2>/dev/null || {
        # Manual replacement
        node -e "
        const fs = require('fs');
        const content = fs.readFileSync('server.js', 'utf8');
        const updated = content.replace(/const PORT = process\.env\.PORT \|\| \d+/, 'const PORT = process.env.PORT || $BACKEND_PORT');
        fs.writeFileSync('server.js', updated);
        "
    }
}

# Install backend dependencies with error handling
echo "📦 تثبيت مكتبات الخادم..."
if ! npm install --no-optional 2>/dev/null; then
    echo "⚠️  إعادة المحاولة بدون مكتبات اختيارية..."
    npm install --ignore-scripts --no-optional
fi

# Install Puppeteer separately for better compatibility
echo "🌐 تثبيت متصفح Chromium..."
if ! npm list puppeteer >/dev/null 2>&1; then
    npm install puppeteer@latest --no-save 2>/dev/null || {
        echo "⚠️  تثبيت إصدار أقدم من Puppeteer..."
        npm install puppeteer@^19.0.0 --no-save
    }
fi

# Start backend
echo "🚀 بدء تشغيل الخادم..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ انتظار بدء الخادم..."
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ فشل في بدء الخادم"
    exit 1
fi

# Test backend connection
for i in {1..10}; do
    if curl -s http://localhost:$BACKEND_PORT/test >/dev/null 2>&1; then
        echo "✅ الخادم يعمل بنجاح على البورت $BACKEND_PORT"
        break
    fi
    echo "⏳ انتظار استجابة الخادم... ($i/10)"
    sleep 2
    if [ $i -eq 10 ]; then
        echo "❌ الخادم لا يستجيب"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

# Update frontend configuration
echo "⚙️  تحديث إعدادات الواجهة..."
cd ../frontend

# Update API URL in WhatsApp service
if [ -f "src/services/WhatsAppService.js" ]; then
    sed -i.bak "s|http://localhost:[0-9]*/api|http://localhost:$BACKEND_PORT/api|g" src/services/WhatsAppService.js 2>/dev/null || {
        sed -i "s|http://localhost:[0-9]*/api|http://localhost:$BACKEND_PORT/api|g" src/services/WhatsAppService.js 2>/dev/null || {
            node -e "
            const fs = require('fs');
            const content = fs.readFileSync('src/services/WhatsAppService.js', 'utf8');
            const updated = content.replace(/http:\/\/localhost:\d+\/api/g, 'http://localhost:$BACKEND_PORT/api');
            fs.writeFileSync('src/services/WhatsAppService.js', updated);
            "
        }
    }
fi

# Install frontend dependencies
echo "📦 تثبيت مكتبات الواجهة..."
if ! npm install 2>/dev/null; then
    echo "⚠️  إعادة المحاولة..."
    npm install --legacy-peer-deps
fi

# Set frontend port
export PORT=$FRONTEND_PORT

# Start frontend
echo "🎨 بدء تشغيل الواجهة..."
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ انتظار بدء الواجهة..."
sleep 10

# Check if frontend is running
for i in {1..15}; do
    if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        echo "✅ الواجهة تعمل بنجاح على البورت $FRONTEND_PORT"
        break
    fi
    echo "⏳ انتظار استجابة الواجهة... ($i/15)"
    sleep 2
    if [ $i -eq 15 ]; then
        echo "❌ الواجهة لا تستجيب"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
done

# Success message
echo ""
echo "🎉 تم تشغيل النظام بنجاح!"
echo "================================"
echo "🌐 الواجهة الأمامية: http://localhost:$FRONTEND_PORT"
echo "🔧 خادم API: http://localhost:$BACKEND_PORT"
echo "📱 WhatsApp Dashboard: http://localhost:$FRONTEND_PORT/whatsapp"
echo ""
echo "📋 معلومات مهمة:"
echo "   • النظام يعمل الآن بدون الحاجة لإصدارات محددة من Chrome"
echo "   • يدعم جميع أنظمة التشغيل (macOS, Windows, Linux)"
echo "   • يتم تثبيت Chromium تلقائياً مع Puppeteer"
echo "   • لإيقاف النظام: اضغط Ctrl+C"
echo ""
echo "🚀 النظام جاهز للاستخدام!"

# Keep script running
wait 