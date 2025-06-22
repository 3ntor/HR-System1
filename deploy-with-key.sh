#!/bin/bash

echo "🚀 نشر النظام باستخدام SSH Key"
echo "================================"

# معلومات الخادم
VPS_IP="109.176.199.143"
VPS_USER="root"
SSH_KEY="$HOME/.ssh/hostinger_key"

# التحقق من وجود SSH Key
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH Key غير موجود: $SSH_KEY"
    exit 1
fi

echo "🔑 استخدام SSH Key للاتصال..."

# تحديث المشروع على GitHub أولاً
echo "📤 رفع آخر تحديث على GitHub..."
git add .
git commit -m "🚀 تحديث قبل النشر" || echo "لا توجد تغييرات للـ commit"
git push origin master

# الاتصال بالخادم وتنفيذ النشر
echo "🌐 الاتصال بالخادم..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
echo "🎯 بدء عملية النشر على الخادم..."

# التحقق من وجود Git
if ! command -v git &> /dev/null; then
    echo "📦 تثبيت Git..."
    apt update && apt install git -y
fi

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "⚡ تثبيت Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# التحقق من وجود PM2
if ! command -v pm2 &> /dev/null; then
    echo "🔄 تثبيت PM2..."
    npm install -g pm2
fi

# إنشاء مجلد المشروع
mkdir -p /var/www
cd /var/www

# استنساخ أو تحديث المشروع
if [ -d "hr-system" ]; then
    echo "🔄 تحديث المشروع الموجود..."
    cd hr-system
    git pull origin master
else
    echo "📥 استنساخ المشروع..."
    git clone https://github.com/B7rawy/HR-System.git hr-system
    cd hr-system
fi

# تثبيت التبعيات للـ Backend
echo "📦 تثبيت تبعيات Backend..."
cd backend
npm install --production

# تثبيت تبعيات Frontend
echo "🎨 تثبيت تبعيات Frontend..."
cd ../frontend
npm install

# بناء Frontend
echo "🔨 بناء Frontend للإنتاج..."
npm run build

# العودة للـ Backend وتشغيله
echo "🚀 تشغيل Backend..."
cd ../backend

# إيقاف العملية السابقة إن وجدت
pm2 delete hr-system-backend 2>/dev/null || true

# تشغيل Backend الجديد
pm2 start server.js --name hr-system-backend
pm2 save

echo "✅ تم النشر بنجاح!"
echo "🌐 الموقع متاح على: http://109.176.199.143"
echo "🔗 API متاح على: http://109.176.199.143:5001"

EOF

echo "🎉 تم النشر بنجاح!"
echo "🌐 رابط الموقع: http://109.176.199.143" 