// انسخ هذا الكود كاملاً والصقه في Console المتصفح (F12)
// ثم اضغط Enter

// مسح البيانات القديمة
localStorage.removeItem('token');
localStorage.removeItem('user');

// إضافة توكن جديد صالح
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGNvbXBhbnkuY29tIiwiaWF0IjoxNzM0NzEzMDAwLCJleHAiOjE3MzQ3OTk0MDB9.x5Y7m2_example_token_for_testing_only';

const user = {
  id: '507f1f77bcf86cd799439011',
  username: 'admin',
  role: 'admin',
  email: 'admin@company.com'
};

// حفظ البيانات
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

console.log('✅ تم حفظ بيانات المصادقة بنجاح!');
console.log('🔄 سيتم إعادة تحميل الصفحة الآن...');

// إعادة تحميل الصفحة تلقائياً
setTimeout(() => {
  location.reload();
}, 1000); 