#!/bin/bash

# اسكريبت اختبار WhatsApp مع الرسائل التجريبية

echo "🧪 اختبار نظام WhatsApp للموارد البشرية"
echo "=========================================="

# بيانات الاختبار
TEST_CONTACT_NAME="كريم البحراوي"
TEST_PHONE="01016772118"
FORMATTED_PHONE="201016772118"

echo "📱 جهة الاتصال التجريبية: $TEST_CONTACT_NAME ($TEST_PHONE)"
echo ""

# فحص حالة الخادم
echo "🔍 فحص حالة الخادم..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ الخادم الخلفي يعمل بشكل طبيعي"
else
    echo "❌ الخادم الخلفي غير متصل"
    echo "🔄 تشغيل الخادم الخلفي..."
    cd backend && npm start &
    sleep 5
fi

# فحص حالة WhatsApp
echo "🔍 فحص حالة WhatsApp..."
WA_STATUS=$(curl -s http://localhost:5001/api/whatsapp/status | jq -r '.status')

if [ "$WA_STATUS" = "connected" ]; then
    echo "✅ WhatsApp متصل ومستعد للإرسال"
elif [ "$WA_STATUS" = "disconnected" ]; then
    echo "⚠️ WhatsApp غير متصل"
    echo "📋 يرجى الاتصال أولاً من خلال:"
    echo "   http://localhost:3000/whatsapp/connect"
else
    echo "🔄 WhatsApp في حالة الاتصال..."
fi

echo ""
echo "🌐 روابط مفيدة:"
echo "   📊 لوحة تحكم WhatsApp: http://localhost:3000/whatsapp"
echo "   🧪 الرسائل التجريبية: http://localhost:3000/whatsapp (تبويب رسائل تجريبية)"
echo "   🔗 صفحة الاتصال: http://localhost:3000/whatsapp/connect"
echo ""

# اختبار رسالة سريعة (إذا كان متصل)
if [ "$WA_STATUS" = "connected" ]; then
    echo "🚀 إرسال رسالة اختبار سريعة..."
    
    TEST_MESSAGE="🧪 رسالة اختبار من النظام - $(date '+%Y-%m-%d %H:%M:%S')"
    
    RESPONSE=$(curl -s -X POST http://localhost:5001/api/whatsapp/send \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"$FORMATTED_PHONE\",
            \"message\": \"$TEST_MESSAGE\"
        }")
    
    if echo $RESPONSE | jq -e '.success' > /dev/null; then
        echo "✅ تم إرسال رسالة الاختبار بنجاح إلى $TEST_CONTACT_NAME"
    else
        echo "❌ فشل في إرسال رسالة الاختبار"
        echo "الاستجابة: $RESPONSE"
    fi
else
    echo "⏸️ لا يمكن إرسال رسالة اختبار - WhatsApp غير متصل"
fi

echo ""
echo "📋 تعليمات الاستخدام:"
echo "   1. تأكد من أن WhatsApp متصل"
echo "   2. انتقل إلى لوحة تحكم WhatsApp"
echo "   3. اختر تبويب 'رسائل تجريبية'"
echo "   4. جرب الرسائل السريعة أو أنشئ رسالة مخصصة"
echo "   5. راقب سجل الرسائل للتأكد من الإرسال"
echo ""
echo "🎯 الهدف: اختبار إرسال الرسائل والقوالب إلى $TEST_CONTACT_NAME"
echo "✨ استمتع بالاختبار!" 