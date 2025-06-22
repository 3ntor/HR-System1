#!/bin/bash

# 🟢 WhatsApp Web.js Complete System Launcher
# تطوير: فريق نظام الموارد البشرية
# التاريخ: ديسمبر 2024

# تعريف الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# رسم الشعار
print_logo() {
    echo ""
    echo -e "${GREEN}████████████████████████████████████████████████████████${NC}"
    echo -e "${GREEN}█                                                      █${NC}"
    echo -e "${GREEN}█  ${WHITE}🟢 نظام WhatsApp Web.js المتكامل${GREEN}                    █${NC}"
    echo -e "${GREEN}█  ${CYAN}HR System - Complete WhatsApp Integration${GREEN}         █${NC}"
    echo -e "${GREEN}█                                                      █${NC}"
    echo -e "${GREEN}█  ${YELLOW}الإصدار: 2.0.0 - نظام متكامل جديد من الصفر${GREEN}         █${NC}"
    echo -e "${GREEN}█  ${BLUE}تطوير: فريق الموارد البشرية - ديسمبر 2024${GREEN}           █${NC}"
    echo -e "${GREEN}█                                                      █${NC}"
    echo -e "${GREEN}████████████████████████████████████████████████████████${NC}"
    echo ""
}

# فحص النظام
check_system() {
    echo -e "${BLUE}🔍 فحص متطلبات النظام...${NC}"
    
    # فحص Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✅ Node.js متاح: ${NODE_VERSION}${NC}"
    else
        echo -e "${RED}❌ Node.js غير مثبت. يرجى تثبيته أولاً.${NC}"
        exit 1
    fi
    
    # فحص npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✅ npm متاح: v${NPM_VERSION}${NC}"
    else
        echo -e "${RED}❌ npm غير متاح.${NC}"
        exit 1
    fi
    
    # فحص المجلدات
    if [ -d "backend" ] && [ -d "frontend" ]; then
        echo -e "${GREEN}✅ هيكل المشروع صحيح${NC}"
    else
        echo -e "${RED}❌ مجلدات المشروع غير موجودة${NC}"
        exit 1
    fi
    
    echo ""
}

# عرض المميزات الجديدة
show_features() {
    echo -e "${PURPLE}🚀 المميزات الجديدة في النظام:${NC}"
    echo ""
    echo -e "${CYAN}📱 واجهة التحكم الجديدة:${NC}"
    echo -e "   ${WHITE}• 6 تبويبات متكاملة (الاتصال، القوالب، الإرسال، المجمع، HR، الإحصائيات)${NC}"
    echo -e "   ${WHITE}• QR Code Authentication - مسح واحد للربط الدائم${NC}"
    echo -e "   ${WHITE}• Real-time Status Monitoring - مراقبة الحالة لحظياً${NC}"
    echo -e "   ${WHITE}• Arabic RTL Support - دعم كامل للعربية${NC}"
    echo ""
    echo -e "${CYAN}💬 نظام الرسائل المطور:${NC}"
    echo -e "   ${WHITE}• 7 قوالب رسائل جاهزة باللغة العربية${NC}"
    echo -e "   ${WHITE}• Bulk Messaging - إرسال جماعي مع تحكم في التوقيت${NC}"
    echo -e "   ${WHITE}• Template Variables - متغيرات قابلة للتخصيص${NC}"
    echo -e "   ${WHITE}• Phone Number Validation - تحقق من الأرقام السعودية${NC}"
    echo ""
    echo -e "${CYAN}🏢 تكامل الموارد البشرية:${NC}"
    echo -e "   ${WHITE}• رسائل ترحيب للموظفين الجدد${NC}"
    echo -e "   ${WHITE}• إشعارات صرف الرواتب${NC}"
    echo -e "   ${WHITE}• تذكير الاجتماعات${NC}"
    echo -e "   ${WHITE}• إشعارات طلبات الإجازات${NC}"
    echo ""
    echo -e "${CYAN}📊 النظام التحليلي:${NC}"
    echo -e "   ${WHITE}• إحصائيات مفصلة للرسائل${NC}"
    echo -e "   ${WHITE}• سجل العمليات المباشر${NC}"
    echo -e "   ${WHITE}• معدلات النجاح والفشل${NC}"
    echo -e "   ${WHITE}• نسخ احتياطية تلقائية${NC}"
    echo ""
}

# تثبيت Dependencies
install_dependencies() {
    echo -e "${BLUE}📦 تثبيت المتطلبات...${NC}"
    
    # Backend
    echo -e "${YELLOW}🔧 تثبيت مكتبات الخادم...${NC}"
    cd backend
    if npm install; then
        echo -e "${GREEN}✅ تم تثبيت مكتبات الخادم بنجاح${NC}"
    else
        echo -e "${RED}❌ خطأ في تثبيت مكتبات الخادم${NC}"
        exit 1
    fi
    cd ..
    
    # Frontend
    echo -e "${YELLOW}🔧 تثبيت مكتبات الواجهة...${NC}"
    cd frontend
    if npm install --legacy-peer-deps; then
        echo -e "${GREEN}✅ تم تثبيت مكتبات الواجهة بنجاح${NC}"
    else
        echo -e "${RED}❌ خطأ في تثبيت مكتبات الواجهة${NC}"
        exit 1
    fi
    cd ..
    
    echo ""
}

# إنشاء مجلد البيانات
create_data_structure() {
    echo -e "${BLUE}📁 إنشاء هيكل البيانات...${NC}"
    
    mkdir -p backend/data/whatsapp/session
    mkdir -p backend/data/whatsapp/media
    mkdir -p backend/data/whatsapp/backups
    
    echo -e "${GREEN}✅ تم إنشاء مجلدات البيانات${NC}"
    echo ""
}

# فحص العمليات الجارية
check_running_processes() {
    echo -e "${BLUE}🔍 فحص العمليات الجارية...${NC}"
    
    # فحص منافذ الخادم
    if lsof -i :5000 &> /dev/null; then
        echo -e "${YELLOW}⚠️  المنفذ 5000 قيد الاستخدام${NC}"
        echo -e "${YELLOW}    سيتم إيقاف العملية الجارية...${NC}"
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    fi
    
    if lsof -i :3000 &> /dev/null; then
        echo -e "${YELLOW}⚠️  المنفذ 3000 قيد الاستخدام${NC}"
        echo -e "${YELLOW}    سيتم إيقاف العملية الجارية...${NC}"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ المنافذ جاهزة للاستخدام${NC}"
    echo ""
}

# عرض خطوات البدء
show_startup_steps() {
    echo -e "${PURPLE}📋 خطوات بدء النظام:${NC}"
    echo ""
    echo -e "${WHITE}1.${NC} ${CYAN}تشغيل خادم النظام (Backend)${NC}"
    echo -e "${WHITE}2.${NC} ${CYAN}تشغيل واجهة المستخدم (Frontend)${NC}"
    echo -e "${WHITE}3.${NC} ${CYAN}فتح المتصفح على: http://localhost:3000${NC}"
    echo -e "${WHITE}4.${NC} ${CYAN}تسجيل دخول كـ Admin${NC}"
    echo -e "${WHITE}5.${NC} ${CYAN}الانتقال إلى تبويب 'واتساب'${NC}"
    echo -e "${WHITE}6.${NC} ${CYAN}الضغط على 'اتصال' ومسح QR Code${NC}"
    echo -e "${WHITE}7.${NC} ${CYAN}البدء في استخدام النظام! 🎉${NC}"
    echo ""
}

# بدء تشغيل النظام
start_system() {
    echo -e "${GREEN}🚀 بدء تشغيل النظام...${NC}"
    echo ""
    
    # تشغيل الخادم في الخلفية
    echo -e "${BLUE}🔧 تشغيل خادم النظام...${NC}"
    cd backend
    nohup npm start > server.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > server.pid
    cd ..
    
    # انتظار تشغيل الخادم
    echo -e "${YELLOW}⏳ انتظار تشغيل الخادم...${NC}"
    sleep 5
    
    # فحص حالة الخادم
    if curl -s http://localhost:5000/health > /dev/null; then
        echo -e "${GREEN}✅ الخادم يعمل بنجاح على المنفذ 5000${NC}"
    else
        echo -e "${RED}❌ فشل في تشغيل الخادم${NC}"
        exit 1
    fi
    
    # تشغيل الواجهة في الخلفية
    echo -e "${BLUE}🔧 تشغيل واجهة المستخدم...${NC}"
    cd frontend
    nohup npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    cd ..
    
    # انتظار تشغيل الواجهة
    echo -e "${YELLOW}⏳ انتظار تشغيل واجهة المستخدم...${NC}"
    sleep 10
    
    echo -e "${GREEN}✅ النظام جاهز للاستخدام!${NC}"
    echo ""
}

# عرض معلومات الوصول
show_access_info() {
    echo -e "${GREEN}🌐 معلومات الوصول:${NC}"
    echo ""
    echo -e "${CYAN}📱 واجهة المستخدم:${NC}   ${WHITE}http://localhost:3000${NC}"
    echo -e "${CYAN}🔧 API الخادم:${NC}        ${WHITE}http://localhost:5000${NC}"
    echo -e "${CYAN}💚 فحص صحة النظام:${NC}   ${WHITE}http://localhost:5000/health${NC}"
    echo -e "${CYAN}🟢 WhatsApp API:${NC}      ${WHITE}http://localhost:5000/api/whatsapp${NC}"
    echo ""
    echo -e "${BLUE}👤 بيانات الدخول الافتراضية:${NC}"
    echo -e "${WHITE}   المستخدم: admin${NC}"
    echo -e "${WHITE}   كلمة المرور: admin123${NC}"
    echo ""
}

# عرض نصائح الاستخدام
show_usage_tips() {
    echo -e "${PURPLE}💡 نصائح للاستخدام الأمثل:${NC}"
    echo ""
    echo -e "${CYAN}🔗 للاتصال بـ WhatsApp:${NC}"
    echo -e "   ${WHITE}• تأكد من اتصال الإنترنت على الجهاز والهاتف${NC}"
    echo -e "   ${WHITE}• امسح QR Code خلال دقيقة واحدة${NC}"
    echo -e "   ${WHITE}• لا تغلق WhatsApp على الهاتف${NC}"
    echo ""
    echo -e "${CYAN}📤 لإرسال الرسائل:${NC}"
    echo -e "   ${WHITE}• استخدم أرقام بصيغة: 966555555555${NC}"
    echo -e "   ${WHITE}• تأكد من وجود الرقم في WhatsApp${NC}"
    echo -e "   ${WHITE}• اختبر برسالة واحدة قبل الإرسال الجماعي${NC}"
    echo ""
    echo -e "${CYAN}📊 لمراقبة الأداء:${NC}"
    echo -e "   ${WHITE}• راجع تبويب الإحصائيات بانتظام${NC}"
    echo -e "   ${WHITE}• تابع سجل العمليات للأخطاء${NC}"
    echo -e "   ${WHITE}• اعمل نسخة احتياطية أسبوعياً${NC}"
    echo ""
}

# عرض خيارات التحكم
show_control_options() {
    echo -e "${YELLOW}🎛️  خيارات التحكم بالنظام:${NC}"
    echo ""
    echo -e "${WHITE}لإيقاف النظام:${NC}"
    echo -e "${CYAN}   ./stop-whatsapp-system.sh${NC}"
    echo ""
    echo -e "${WHITE}لإعادة تشغيل النظام:${NC}"
    echo -e "${CYAN}   ./restart-whatsapp-system.sh${NC}"
    echo ""
    echo -e "${WHITE}لعرض سجل الأخطاء:${NC}"
    echo -e "${CYAN}   tail -f backend/server.log${NC}"
    echo -e "${CYAN}   tail -f frontend/frontend.log${NC}"
    echo ""
    echo -e "${WHITE}لفحص حالة العمليات:${NC}"
    echo -e "${CYAN}   ps aux | grep node${NC}"
    echo ""
}

# عرض معلومات الدعم
show_support_info() {
    echo -e "${BLUE}📞 معلومات الدعم والمساعدة:${NC}"
    echo ""
    echo -e "${CYAN}📖 التوثيق الكامل:${NC} ${WHITE}WHATSAPP_COMPLETE_GUIDE.md${NC}"
    echo -e "${CYAN}🔧 استكشاف الأخطاء:${NC} ${WHITE}راجع قسم Troubleshooting في الدليل${NC}"
    echo -e "${CYAN}📊 مراقبة النظام:${NC} ${WHITE}تبويب الإحصائيات في الواجهة${NC}"
    echo ""
    echo -e "${YELLOW}في حالة وجود مشاكل:${NC}"
    echo -e "${WHITE}1. راجع ملف السجل: backend/server.log${NC}"
    echo -e "${WHITE}2. تحقق من اتصال الإنترنت${NC}"
    echo -e "${WHITE}3. أعد تشغيل النظام${NC}"
    echo -e "${WHITE}4. راجع الدليل الشامل${NC}"
    echo ""
}

# الدالة الرئيسية
main() {
    # مسح الشاشة
    clear
    
    # طباعة الشعار
    print_logo
    
    # فحص النظام
    check_system
    
    # عرض المميزات
    show_features
    
    # تأكيد البدء
    echo -e "${YELLOW}🚀 هل تريد بدء تشغيل النظام؟ (y/n): ${NC}"
    read -r confirm
    
    if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
        echo -e "${RED}تم إلغاء التشغيل${NC}"
        exit 0
    fi
    
    # فحص العمليات الجارية
    check_running_processes
    
    # تثبيت المتطلبات
    install_dependencies
    
    # إنشاء هيكل البيانات
    create_data_structure
    
    # عرض خطوات البدء
    show_startup_steps
    
    # بدء التشغيل
    start_system
    
    # عرض معلومات الوصول
    show_access_info
    
    # عرض نصائح الاستخدام
    show_usage_tips
    
    # عرض خيارات التحكم
    show_control_options
    
    # عرض معلومات الدعم
    show_support_info
    
    # رسالة النهاية
    echo -e "${GREEN}████████████████████████████████████████████████████████${NC}"
    echo -e "${GREEN}█                                                      █${NC}"
    echo -e "${GREEN}█  ${WHITE}🎉 تم تشغيل النظام بنجاح!${GREEN}                          █${NC}"
    echo -e "${GREEN}█  ${CYAN}نظام WhatsApp Web.js جاهز للاستخدام${GREEN}              █${NC}"
    echo -e "${GREEN}█                                                      █${NC}"
    echo -e "${GREEN}█  ${YELLOW}افتح المتصفح على: http://localhost:3000${GREEN}       █${NC}"
    echo -e "${GREEN}█  ${BLUE}واستمتع بتجربة المراسلة المتطورة! 📱${GREEN}           █${NC}"
    echo -e "${GREEN}█                                                      █${NC}"
    echo -e "${GREEN}████████████████████████████████████████████████████████${NC}"
    echo ""
    
    # فتح المتصفح تلقائياً (اختياري)
    echo -e "${YELLOW}🌐 هل تريد فتح المتصفح تلقائياً؟ (y/n): ${NC}"
    read -r open_browser
    
    if [[ $open_browser == [yY] || $open_browser == [yY][eE][sS] ]]; then
        # فتح المتصفح حسب نظام التشغيل
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            open http://localhost:3000
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            xdg-open http://localhost:3000
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            # Windows
            start http://localhost:3000
        fi
        
        echo -e "${GREEN}✅ تم فتح المتصفح${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}النظام يعمل في الخلفية. استخدم Ctrl+C لإيقافه أو اتبع التعليمات أعلاه.${NC}"
    echo ""
    
    # الانتظار للحفاظ على النصوص
    echo -e "${WHITE}اضغط Enter للمتابعة أو Ctrl+C للخروج...${NC}"
    read -r
}

# تشغيل البرنامج الرئيسي
main 