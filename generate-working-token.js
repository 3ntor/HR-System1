// Script لتوليد توكن صحيح يعمل مع الخادم
const crypto = require('crypto');

// إنشاء JWT يدوياً باستخدام نفس الطريقة المستخدمة في الخادم
function createJWT(payload, secret, expiresIn = '24h') {
  // Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // تحويل مدة الانتهاء
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 ساعة
  
  // Payload مع انتهاء الصلاحية
  const fullPayload = {
    ...payload,
    iat: now,
    exp: exp
  };
  
  // تشفير Base64
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  // إنشاء التوقيع
  const signatureInput = `${base64Header}.${base64Payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

// نفس الـ JWT_SECRET المستخدم في الخادم
const JWT_SECRET = 'hr-system-2024-default-secret-change-in-production';

// بيانات المستخدم admin
const adminPayload = {
  id: '507f1f77bcf86cd799439011',
  username: 'admin',
  role: 'admin',
  email: 'admin@company.com'
};

// توليد التوكن
const token = createJWT(adminPayload, JWT_SECRET);

console.log('🔑 توكن صحيح جديد:');
console.log(token);
console.log('');

// إنشاء الكود للمتصفح
console.log('📋 انسخ والصق هذا في Console المتصفح (F12):');
console.log('');
console.log(`// مسح البيانات القديمة`);
console.log(`localStorage.clear();`);
console.log('');
console.log(`// إضافة التوكن الجديد`);
console.log(`localStorage.setItem('token', '${token}');`);
console.log(`localStorage.setItem('user', '${JSON.stringify(adminPayload)}');`);
console.log('');
console.log(`console.log('✅ تم حفظ التوكن الجديد بنجاح!');`);
console.log(`location.reload();`);
console.log('');

// كتابة script للمتصفح
const browserScript = `// Script للمتصفح - انسخ كل هذا والصقه في Console
localStorage.clear();
localStorage.setItem('token', '${token}');
localStorage.setItem('user', '${JSON.stringify(adminPayload)}');
console.log('✅ تم حفظ التوكن الجديد بنجاح!');
console.log('🔄 إعادة تحميل الصفحة...');
setTimeout(() => location.reload(), 1000);`;

require('fs').writeFileSync('working-token-script.js', browserScript);

console.log('💾 تم حفظ الـ script في ملف working-token-script.js');
console.log('');
console.log('🎯 خطوات الاستخدام:');
console.log('1. اذهب إلى http://localhost:3000');
console.log('2. اضغط F12 > Console');
console.log('3. انسخ محتوى ملف working-token-script.js والصقه');
console.log('4. اضغط Enter');
console.log('5. ستعيد الصفحة تحميل نفسها مع التوكن الجديد');

// إظهار معلومات التوكن
console.log('');
console.log('ℹ️ معلومات التوكن:');
try {
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  console.log('- المستخدم:', payload.username);
  console.log('- الدور:', payload.role);
  console.log('- تاريخ الإنشاء:', new Date(payload.iat * 1000).toLocaleString('ar-EG'));
  console.log('- تاريخ الانتهاء:', new Date(payload.exp * 1000).toLocaleString('ar-EG'));
} catch (e) {
  console.log('- لا يمكن قراءة معلومات التوكن');
} 