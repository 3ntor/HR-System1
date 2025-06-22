const axios = require('axios');

async function testBackend() {
  console.log('🧪 اختبار الباك اند...');
  
  try {
    // Test 1: Health Check
    console.log('\n1. فحص حالة الخادم...');
    const healthResponse = await axios.get('http://localhost:5001/api/whatsapp/health');
    console.log('✅ الخادم يعمل:', healthResponse.status === 200);
    
    // Test 2: Test Registration
    console.log('\n2. اختبار التسجيل...');
    const testUser = {
      username: 'test_user_' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'test123456',
      firstName: 'اختبار',
      lastName: 'المستخدم',
      phone: '01012345678',
      department: 'تكنولوجيا المعلومات',
      position: 'موظف',
      role: 'employee'
    };
    
    const registerResponse = await axios.post('http://localhost:5001/api/auth/register', testUser);
    console.log('✅ التسجيل يعمل:', registerResponse.data.success);
    console.log('📝 رسالة:', registerResponse.data.message);
    
    console.log('\n🎉 جميع الاختبارات نجحت!');
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:');
    console.error('- الرسالة:', error.message);
    if (error.response) {
      console.error('- الحالة:', error.response.status);
      console.error('- البيانات:', error.response.data);
    }
  }
}

// تشغيل الاختبار بعد 3 ثوان للسماح للخادم بالبدء
setTimeout(testBackend, 3000); 