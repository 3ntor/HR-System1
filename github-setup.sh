#!/bin/bash

echo "🚀 HR System - GitHub Setup & Deployment"
echo "========================================="

# اللون للرسائل
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📋 Step 1: GitHub Repository Setup${NC}"
echo "1. Go to https://github.com"
echo "2. Click 'New repository' or '+' button"
echo "3. Repository name: hr-system"
echo "4. Make it Public or Private (your choice)"
echo "5. DON'T initialize with README (we have code ready)"
echo ""

read -p "📝 Enter your GitHub repository URL (e.g., https://github.com/username/hr-system.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔗 Step 2: Connecting to GitHub${NC}"

# إضافة GitHub remote
git remote add origin "$REPO_URL"
echo -e "${GREEN}✅ GitHub remote added${NC}"

# دفع الكود
echo -e "${BLUE}📤 Pushing code to GitHub...${NC}"
git push -u origin master

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub. Please check your credentials.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Step 3: Deployment Options${NC}"
echo "Choose your deployment method:"
echo "1. Deploy to Hostinger VPS now"
echo "2. Just show deployment instructions"
read -p "Enter your choice (1 or 2): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" = "1" ]; then
    echo ""
    echo -e "${BLUE}🌐 Starting Hostinger VPS Deployment...${NC}"
    
    read -p "📝 Enter your Hostinger VPS IP (e.g., 109.176.199.143): " VPS_IP
    read -p "📝 Enter your VPS username (default: root): " VPS_USER
    VPS_USER=${VPS_USER:-root}
    
    if [ -z "$VPS_IP" ]; then
        echo -e "${RED}❌ VPS IP is required!${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}🔧 Running deployment script on VPS...${NC}"
    
    # تشغيل script النشر على VPS
    ssh $VPS_USER@$VPS_IP "curl -o deploy.sh https://raw.githubusercontent.com/$(echo $REPO_URL | sed 's/https:\/\/github.com\///g' | sed 's/\.git//g')/master/deploy-to-hostinger.sh && chmod +x deploy.sh && ./deploy.sh $REPO_URL"
    
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    
elif [ "$DEPLOY_CHOICE" = "2" ]; then
    echo ""
    echo -e "${BLUE}📋 Manual Deployment Instructions:${NC}"
    echo "1. SSH to your VPS: ssh root@YOUR_VPS_IP"
    echo "2. Run: curl -o deploy.sh https://raw.githubusercontent.com/YOUR_USERNAME/hr-system/master/deploy-to-hostinger.sh"
    echo "3. Run: chmod +x deploy.sh"
    echo "4. Run: ./deploy.sh $REPO_URL"
fi

echo ""
echo -e "${GREEN}🏆 HR System Setup Complete!${NC}"
echo -e "${BLUE}📱 Frontend URL: http://YOUR_VPS_IP:3000${NC}"
echo -e "${BLUE}🔧 Backend URL: http://YOUR_VPS_IP:5001${NC}"
echo -e "${BLUE}📊 GitHub: $REPO_URL${NC}" 