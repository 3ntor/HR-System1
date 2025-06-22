#!/bin/bash

echo "🚀 HR System - Quick Deploy Script"
echo "================================="

# نسخ إعدادات النشر إلى VPS
scp -o StrictHostKeyChecking=no deploy-to-hostinger.sh admin@109.176.199.143:/tmp/

# تشغيل النشر على VPS
ssh -o StrictHostKeyChecking=no admin@109.176.199.143 "cd /tmp && chmod +x deploy-to-hostinger.sh && ./deploy-to-hostinger.sh https://github.com/B7rawy/HR-System.git"

echo ""
echo "🎉 النشر مكتمل!"
echo "🌐 الموقع متاح على: http://109.176.199.143"
echo "🔗 الباك إند على: http://109.176.199.143:5001"
echo "" 