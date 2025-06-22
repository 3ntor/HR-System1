#!/bin/bash

# 🚀 سكريبت النشر على Hostinger VPS
# HR System Deployment Script
# المؤلف: فريق تطوير نظام الموارد البشرية

echo "🚀 بدء نشر نظام الموارد البشرية على Hostinger VPS"
echo "=================================================="

# معلومات الخادم
VPS_IP="109.176.199.143"
VPS_USER="root"
PROJECT_NAME="hr-system"
DOMAIN="your-domain.com"  # غير هذا إلى domain الخاص بك

# ألوان للتحسين البصري
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 معلومات النشر:${NC}"
echo -e "🖥️  الخادم: ${GREEN}${VPS_IP}${NC}"
echo -e "👤 المستخدم: ${GREEN}${VPS_USER}${NC}"
echo -e "📁 المشروع: ${GREEN}${PROJECT_NAME}${NC}"
echo ""

# التحقق من الاتصال بالخادم
echo -e "${YELLOW}🔍 التحقق من الاتصال بالخادم...${NC}"
if ! ping -c 1 $VPS_IP &> /dev/null; then
    echo -e "${RED}❌ لا يمكن الوصول للخادم ${VPS_IP}${NC}"
    exit 1
fi
echo -e "${GREEN}✅ الخادم متاح${NC}"

# التحقق من أن Git repository جاهز
echo -e "${YELLOW}🔍 التحقق من Git repository...${NC}"
if ! git remote get-url origin &> /dev/null; then
    echo -e "${RED}❌ يجب أولاً إضافة GitHub repository${NC}"
    echo -e "${YELLOW}قم بتشغيل هذه الأوامر:${NC}"
    echo "git remote add origin https://github.com/username/hr-system.git"
    echo "git push -u origin master"
    exit 1
fi
echo -e "${GREEN}✅ Git repository جاهز${NC}"

# إعداد الخادم
echo -e "${YELLOW}⚙️  إعداد الخادم...${NC}"

# إنشاء سكريبت الإعداد
cat > server-setup.sh << 'EOF'
#!/bin/bash

echo "🔧 بدء إعداد الخادم..."

# تحديث النظام
echo "📦 تحديث النظام..."
apt update && apt upgrade -y

# تثبيت Node.js 18
echo "⚡ تثبيت Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# تثبيت Git
echo "📚 تثبيت Git..."
apt install git -y

# تثبيت PM2
echo "🔄 تثبيت PM2..."
npm install -g pm2

# تثبيت Nginx
echo "🌐 تثبيت Nginx..."
apt install nginx -y

# تثبيت Chrome (للـ WhatsApp)
echo "🌎 تثبيت Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt update
apt install google-chrome-stable -y

# إنشاء مجلد المشروع
mkdir -p /var/www/hr-system
chown -R $USER:$USER /var/www/hr-system

echo "✅ تم إعداد الخادم بنجاح!"
EOF

# نسخ سكريبت الإعداد ونقله للخادم
echo -e "${YELLOW}📤 نقل سكريبت الإعداد للخادم...${NC}"
scp server-setup.sh ${VPS_USER}@${VPS_IP}:/tmp/
ssh ${VPS_USER}@${VPS_IP} "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

# استنساخ المشروع على الخادم
echo -e "${YELLOW}📥 استنساخ المشروع على الخادم...${NC}"
REPO_URL=$(git remote get-url origin)
ssh ${VPS_USER}@${VPS_IP} << EOF
cd /var/www
rm -rf hr-system
git clone $REPO_URL hr-system
cd hr-system
echo "✅ تم استنساخ المشروع"
EOF

# تثبيت التبعيات
echo -e "${YELLOW}📦 تثبيت تبعيات المشروع...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
cd /var/www/hr-system

# تثبيت تبعيات Backend
echo "⚙️ تثبيت تبعيات Backend..."
cd backend
npm install --production

# تثبيت تبعيات Frontend
echo "🎨 تثبيت تبعيات Frontend..."
cd ../frontend
npm install

# بناء Frontend للإنتاج
echo "🔨 بناء Frontend..."
npm run build

echo "✅ تم تثبيت جميع التبعيات"
EOF

# إعداد PM2
echo -e "${YELLOW}🔄 إعداد PM2...${NC}"

# إنشاء ملف PM2 ecosystem
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hr-system-backend',
    script: 'server.js',
    cwd: '/var/www/hr-system/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/hr-system/error.log',
    out_file: '/var/log/hr-system/out.log',
    log_file: '/var/log/hr-system/combined.log',
    time: true
  }]
};
EOF

# نقل ملف PM2 وبدء التطبيق
scp ecosystem.config.js ${VPS_USER}@${VPS_IP}:/var/www/hr-system/
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
# إنشاء مجلد Logs
mkdir -p /var/log/hr-system

cd /var/www/hr-system
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
EOF

# إعداد Nginx
echo -e "${YELLOW}🌐 إعداد Nginx...${NC}"

# إنشاء ملف Nginx config
cat > hr-system.conf << EOF
server {
    listen 80;
    server_name ${VPS_IP} ${DOMAIN} www.${DOMAIN};
    
    # Frontend (React build)
    location / {
        root /var/www/hr-system/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # WebSocket support for WhatsApp
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# نقل ملف Nginx وتفعيله
scp hr-system.conf ${VPS_USER}@${VPS_IP}:/tmp/
ssh ${VPS_USER}@${VPS_IP} << 'EOF'
# نسخ الإعداد إلى Nginx
cp /tmp/hr-system.conf /etc/nginx/sites-available/hr-system
ln -sf /etc/nginx/sites-available/hr-system /etc/nginx/sites-enabled/

# حذف الموقع الافتراضي
rm -f /etc/nginx/sites-enabled/default

# اختبار إعداد Nginx
nginx -t

# إعادة تشغيل Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ تم إعداد Nginx بنجاح"
EOF

# إعداد SSL مجاني (اختياري)
echo -e "${YELLOW}🔒 هل تريد إعداد SSL مجاني؟ (y/n)${NC}"
read -r ssl_choice
if [[ $ssl_choice =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔒 إعداد SSL مع Let's Encrypt...${NC}"
    ssh ${VPS_USER}@${VPS_IP} << EOF
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
systemctl enable certbot.timer
EOF
fi

# تنظيف الملفات المؤقتة
rm -f server-setup.sh ecosystem.config.js hr-system.conf

echo ""
echo -e "${GREEN}🎉 تم النشر بنجاح!${NC}"
echo "=================================================="
echo -e "${BLUE}📍 روابط النظام:${NC}"
echo -e "🌐 الموقع: ${GREEN}http://${VPS_IP}${NC}"
if [[ ! -z "$DOMAIN" && "$DOMAIN" != "your-domain.com" ]]; then
    echo -e "🌍 الدومين: ${GREEN}http://${DOMAIN}${NC}"
fi
echo -e "🔗 الـ API: ${GREEN}http://${VPS_IP}/api${NC}"
echo -e "💚 فحص الصحة: ${GREEN}http://${VPS_IP}/health${NC}"
echo ""
echo -e "${YELLOW}📋 أوامر إدارة النظام:${NC}"
echo -e "▶️  بدء التطبيق: ${GREEN}pm2 start hr-system-backend${NC}"
echo -e "⏹️  إيقاف التطبيق: ${GREEN}pm2 stop hr-system-backend${NC}"
echo -e "🔄 إعادة التشغيل: ${GREEN}pm2 restart hr-system-backend${NC}"
echo -e "📊 حالة التطبيق: ${GREEN}pm2 status${NC}"
echo -e "📝 عرض اللوجز: ${GREEN}pm2 logs hr-system-backend${NC}"
echo ""
echo -e "${YELLOW}🔧 للتحديث في المستقبل:${NC}"
echo "1. git push origin master"
echo "2. ssh ${VPS_USER}@${VPS_IP}"
echo "3. cd /var/www/hr-system && git pull"
echo "4. cd backend && npm install --production"
echo "5. cd ../frontend && npm install && npm run build"
echo "6. pm2 restart hr-system-backend"
echo ""
echo -e "${GREEN}✅ النظام جاهز للاستخدام!${NC}" 