const jwt = require('jsonwebtoken');

console.log('🔧 حل سريع لمشكلة المصادقة');
console.log('================================');

// توليد توكن جديد
const JWT_SECRET = 'hr-system-2024-default-secret-change-in-production';
const adminUser = {
  id: '507f1f77bcf86cd799439011',
  username: 'admin',
  role: 'admin',
  email: 'admin@company.com'
};

const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '24h' });

console.log('\n🔑 التوكن الجديد:');
console.log(token);

console.log('\n📋 إرشادات التطبيق:');
console.log('1. اذهب إلى صفحة النظام في المتصفح');
console.log('2. اضغط F12 لفتح Developer Tools');
console.log('3. اذهب إلى تبويب Console');
console.log('4. انسخ والصق الأمر التالي:');
console.log('');
console.log(`localStorage.setItem('token', '${token}');`);
console.log(`localStorage.setItem('user', '${JSON.stringify(adminUser)}');`);
console.log('');
console.log('5. اضغط Enter');
console.log('6. أعد تحميل الصفحة (F5)');

console.log('\n✅ النتيجة المتوقعة:');
console.log('- لن ترى رسالة "انتهت جلسة العمل" بعد الآن');
console.log('- ستتمكن من الوصول لجميع الصفحات بدون إعادة توجيه');
console.log('- ستعمل جميع API calls بشكل طبيعي');

console.log('\n🔄 بديل أسرع:');
console.log('اذهب إلى http://localhost:3000/login واستخدم:');
console.log('اسم المستخدم: admin');
console.log('كلمة المرور: admin123');

// كتابة script للمتصفح
const browserScript = `
// نسخ هذا ولصقه في Console المتصفح
localStorage.setItem('token', '${token}');
localStorage.setItem('user', '${JSON.stringify(adminUser)}');
console.log('✅ تم حفظ بيانات المصادقة بنجاح!');
console.log('🔄 أعد تحميل الصفحة الآن...');
location.reload();
`;

require('fs').writeFileSync('browser-fix.js', browserScript);
console.log('\n💾 تم إنشاء ملف browser-fix.js - يمكنك نسخ محتواه ولصقه في المتصفح');

console.log('\n' + '='.repeat(50)); 