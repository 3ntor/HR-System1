#!/bin/bash

echo "🚀 النشر المباشر للنظام المصري"
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

# إنشاء ملف مضغوط محدث
echo "📦 إنشاء ملف النشر..."
cd ..
rm -f hr-system-deploy.tar.gz
tar -czf hr-system-deploy.tar.gz --exclude='.git' --exclude='*.log' --exclude='*.pid' --exclude='node_modules' --exclude='backend/data/whatsapp/session' HR-System/
cd HR-System

# نقل الملف للخادم
echo "📤 نقل الملف للخادم..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no ../hr-system-deploy.tar.gz $VPS_USER@$VPS_IP:/tmp/

# الاتصال بالخادم وتنفيذ النشر
echo "🌐 الاتصال بالخادم وبدء النشر..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
echo "🎯 بدء عملية النشر على الخادم..."

# إنشاء مجلد المشروع
mkdir -p /var/www
cd /var/www

# إزالة النسخة القديمة
rm -rf hr-system

# فك الضغط
echo "📦 فك ضغط المشروع..."
tar -xzf /tmp/hr-system-deploy.tar.gz
mv HR-System hr-system
cd hr-system

echo "📁 محتويات المجلد:"
ls -la

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

# إعداد Nginx (إذا لم يكن موجود)
echo "🌐 إعداد Nginx..."
if [ ! -f "/etc/nginx/sites-available/hr-system" ]; then
    cat > /etc/nginx/sites-available/hr-system << 'NGINXEOF'
server {
    listen 80;
    server_name 109.176.199.143;
    
    # Frontend (React build)
    location / {
        root /var/www/hr-system/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # إعدادات للملفات الثابتة
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
NGINXEOF

    # تفعيل الموقع
    ln -s /etc/nginx/sites-available/hr-system /etc/nginx/sites-enabled/ 2>/dev/null || true
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
fi

echo "✅ تم النشر بنجاح!"
echo "🌐 الموقع متاح على: http://109.176.199.143"
echo "🔗 API متاح على: http://109.176.199.143:5001"
echo "📊 حالة PM2:"
pm2 status

EOF

echo "🎉 تم النشر بنجاح!"
echo "🌐 رابط الموقع: http://109.176.199.143"
echo "🔗 رابط API: http://109.176.199.143:5001" 