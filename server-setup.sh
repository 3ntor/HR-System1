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
