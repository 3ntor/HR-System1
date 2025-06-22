#!/bin/bash

echo "🚀 HR System - Manual Deployment Guide"
echo "========================================="

echo ""
echo "📋 Step 1: Access your VPS via Hostinger Panel"
echo "1. Login to your Hostinger account"
echo "2. Go to VPS section" 
echo "3. Click on your VPS (109.176.199.143)"
echo "4. Use the 'Browser Terminal' option"
echo ""

echo "📋 Step 2: Run these commands in the VPS terminal:"
echo ""
echo "# Update system"
echo "sudo apt update && sudo apt upgrade -y"
echo ""
echo "# Install Node.js 18+"
echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
echo "sudo apt-get install -y nodejs"
echo ""
echo "# Install PM2"
echo "sudo npm install -g pm2"
echo ""
echo "# Install Git"
echo "sudo apt install git -y"
echo ""
echo "# Clone project"
echo "git clone https://github.com/B7rawy/HR-System.git"
echo "cd HR-System"
echo ""
echo "# Install backend dependencies"
echo "cd backend"
echo "npm install"
echo ""
echo "# Install frontend dependencies" 
echo "cd ../frontend"
echo "npm install"
echo "npm run build"
echo ""
echo "# Setup environment"
echo "cd ../backend"
echo "cp .env.example .env"
echo ""
echo "# Start with PM2"
echo "pm2 start server.js --name hr-backend"
echo "pm2 startup"
echo "pm2 save"
echo ""
echo "# Install Nginx"
echo "sudo apt install nginx -y"
echo ""

echo "📋 Step 3: Nginx Configuration"
echo "Create file: /etc/nginx/sites-available/hr-system"
echo ""
cat << 'EOF'
server {
    listen 80;
    server_name 109.176.199.143;
    
    # Frontend
    location / {
        root /root/HR-System/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

echo ""
echo "# Enable site"
echo "sudo ln -s /etc/nginx/sites-available/hr-system /etc/nginx/sites-enabled/"
echo "sudo nginx -t"
echo "sudo systemctl restart nginx"
echo ""
echo "🎉 Your HR System will be available at: http://109.176.199.143" 