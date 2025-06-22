// Script لتسجيل الدخول مباشرة عبر Console المتصفح
// انسخ هذا الكود كاملاً والصقه في Console (F12) ثم اضغط Enter

console.log('🔄 جاري تسجيل الدخول تلقائياً...');

// مسح البيانات القديمة
localStorage.clear();

// تسجيل الدخول التلقائي
fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ 
    username: 'admin', 
    password: 'admin123' 
  })
})
.then(response => {
  console.log('📡 استجابة الخادم:', response.status);
  return response.json();
})
.then(data => {
  console.log('📦 بيانات الاستجابة:', data);
  
  if (data.success && data.data && data.data.token) {
    // حفظ التوكن وبيانات المستخدم
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    
    console.log('✅ تم تسجيل الدخول بنجاح!');
    console.log('🔑 التوكن:', data.data.token.substring(0, 50) + '...');
    console.log('👤 المستخدم:', data.data.user.username);
    console.log('🔄 إعادة تحميل الصفحة...');
    
    // إعادة تحميل الصفحة بعد ثانية واحدة
    setTimeout(() => {
      location.reload();
    }, 1000);
    
  } else {
    console.error('❌ فشل تسجيل الدخول:', data.message || 'خطأ غير معروف');
    console.log('💡 جرب تسجيل الدخول يدوياً من النموذج');
  }
})
.catch(error => {
  console.error('❌ خطأ في الاتصال:', error.message);
  console.log('💡 تأكد من أن الخادم الخلفي يعمل على http://localhost:5001');
  console.log('💡 أو جرب تسجيل الدخول يدوياً من النموذج');
}); 