const fs = require('fs');
const path = require('path');

console.log('🔧 حل مشكلة المصادقة (401 Unauthorized) في نظام HR');
console.log('=' .repeat(60));

console.log('\n🔍 المشكلة:');
console.log('- التوكن (Token) غير صالح أو منتهي الصلاحية');
console.log('- API requests تعطي خطأ 401 Unauthorized');

console.log('\n✅ الحلول المتاحة:');

console.log('\n1️⃣ الحل السريع - تسجيل دخول جديد:');
console.log('   - اذهب إلى http://localhost:3000/login');
console.log('   - استخدم: admin / admin123');
console.log('   - أو اضغط زر "دخول سريع كمدير"');

console.log('\n2️⃣ الحل البديل - توليد توكن يدوي:');
console.log('   - شغل: node backend/generate-token.js');
console.log('   - انسخ التوكن المولد');
console.log('   - اذهب إلى Developer Tools (F12)');
console.log('   - ادخل إلى Application > Local Storage');
console.log('   - أضف/عدّل token مع القيمة الجديدة');

console.log('\n3️⃣ الحل التلقائي - API endpoint:');
console.log('   - اذهب إلى http://localhost:5001/api/auth/generate-demo-token');
console.log('   - انسخ التوكن من الاستجابة');
console.log('   - احفظه في Local Storage');

console.log('\n📋 تشغيل النظام:');
console.log('   - Backend: npm start (في مجلد backend)');
console.log('   - Frontend: npm start (في مجلد frontend)');

console.log('\n🔄 إعادة تشغيل كامل:');
console.log('   - شغل start-system.bat أو start-system.sh');

console.log('\n⚠️ ملاحظة:');
console.log('   - هذه مشكلة شائعة عند انتهاء صلاحية التوكن (24 ساعة)');
console.log('   - النظام سيعيد توجيهك تلقائياً لصفحة تسجيل الدخول');
console.log('   - بعد تسجيل الدخول، كل شيء سيعمل بشكل طبيعي');

console.log('\n' + '=' .repeat(60));

// فحص حالة الخوادم
const { exec } = require('child_process');

console.log('🔍 فحص حالة الخوادم...');

exec('netstat -ano | findstr :5001', (error, stdout, stderr) => {
  if (stdout.includes('5001')) {
    console.log('✅ Backend Server: يعمل على المنفذ 5001');
  } else {
    console.log('❌ Backend Server: غير متاح على المنفذ 5001');
    console.log('   - شغل: cd backend && npm start');
  }
});

exec('netstat -ano | findstr :3000', (error, stdout, stderr) => {
  if (stdout.includes('3000')) {
    console.log('✅ Frontend Server: يعمل على المنفذ 3000');
  } else {
    console.log('❌ Frontend Server: غير متاح على المنفذ 3000');
    console.log('   - شغل: cd frontend && npm start');
  }
}); 