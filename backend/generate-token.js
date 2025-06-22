const jwt = require('jsonwebtoken');

// استخدام نفس القيمة المستخدمة في auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production';

// بيانات المستخدم admin الافتراضي
const adminUser = {
  id: '507f1f77bcf86cd799439011', // معرف افتراضي
  username: 'admin',
  role: 'admin',
  email: 'admin@company.com'
};

// إنشاء توكن جديد صالح لمدة 24 ساعة
const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 توكن جديد للمستخدم admin:');
console.log(token);
console.log('');
console.log('📋 لاستخدام هذا التوكن:');
console.log('1. اذهب إلى Developer Tools في المتصفح (F12)');
console.log('2. اذهب إلى تبويب Application/Storage');
console.log('3. في Local Storage، أضف/عدّل:');
console.log('   - Key: token');
console.log('   - Value:', token);
console.log('4. أضف أيضاً بيانات المستخدم:');
console.log('   - Key: user');
console.log('   - Value:', JSON.stringify(adminUser));
console.log('5. أعد تحميل الصفحة'); 