// اختبار شامل لنظام المصادقة والـ JWT في API التتبع
// تشغيل هذا الملف: node test_authentication.js

const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:5001/api/tracking';
let authToken = '';
let employeeId = '';

// ألوان للطباعة
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// اختبار 1: تسجيل الدخول بنجاح
async function testSuccessfulLogin() {
  log('\n🔐 اختبار 1: تسجيل الدخول بنجاح', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/desktop-login`, {
      username: 'fatima@company.com', // يمكن استخدام email أو employeeNumber أو name
      password: '123456'
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      employeeId = response.data.employee.id;
      log('✅ تم تسجيل الدخول بنجاح', 'green');
      log(`📋 معلومات الموظف: ${response.data.employee.name}`, 'green');
      log(`🎫 التوكن: ${authToken.substring(0, 20)}...`, 'green');
      return true;
    } else {
      log('❌ فشل في تسجيل الدخول - لا يوجد توكن', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ خطأ في تسجيل الدخول: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// اختبار 2: تسجيل الدخول ببيانات خاطئة
async function testFailedLogin() {
  log('\n🚫 اختبار 2: تسجيل الدخول ببيانات خاطئة', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/desktop-login`, {
      username: 'wrong@email.com',
      password: 'wrongpassword'
    });

    log('❌ يجب أن يفشل تسجيل الدخول لكنه نجح!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ تم رفض البيانات الخاطئة بنجاح', 'green');
      return true;
    } else {
      log(`❌ خطأ غير متوقع: ${error.message}`, 'red');
      return false;
    }
  }
}

// اختبار 3: الوصول لـ endpoint محمي بدون توكن
async function testUnauthorizedAccess() {
  log('\n🛡️ اختبار 3: الوصول بدون توكن', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/update`, {
      workData: {
        totalSeconds: 3600,
        activeSeconds: 3000,
        idleSeconds: 600,
        productivity: 83
      }
    });

    log('❌ يجب أن يرفض الطلب بدون توكن لكنه قبله!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ تم رفض الطلب بدون توكن بنجاح', 'green');
      return true;
    } else {
      log(`❌ خطأ غير متوقع: ${error.message}`, 'red');
      return false;
    }
  }
}

// اختبار 4: الوصول لـ endpoint محمي بتوكن صحيح
async function testAuthorizedAccess() {
  log('\n✅ اختبار 4: الوصول بتوكن صحيح', 'blue');
  
  if (!authToken) {
    log('❌ لا يوجد توكن للاختبار', 'red');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/update`, {
      workData: {
        totalSeconds: 3600,
        activeSeconds: 3000,
        idleSeconds: 600,
        productivity: 83,
        sessionsCount: 5,
        tasksCompleted: 12
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('✅ تم قبول الطلب بالتوكن الصحيح', 'green');
      log(`📊 البيانات المحفوظة: ${JSON.stringify(response.data.data)}`, 'green');
      return true;
    } else {
      log('❌ فشل في حفظ البيانات', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ خطأ في الطلب: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// اختبار 5: الوصول بتوكن مزيف
async function testInvalidToken() {
  log('\n🔒 اختبار 5: الوصول بتوكن مزيف', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/update`, {
      workData: {
        totalSeconds: 3600,
        activeSeconds: 3000,
        idleSeconds: 600
      }
    }, {
      headers: {
        'Authorization': 'Bearer invalid.token.here',
        'Content-Type': 'application/json'
      }
    });

    log('❌ يجب أن يرفض التوكن المزيف لكنه قبله!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ تم رفض التوكن المزيف بنجاح', 'green');
      return true;
    } else {
      log(`❌ خطأ غير متوقع: ${error.message}`, 'red');
      return false;
    }
  }
}

// اختبار 6: جلب البيانات بتوكن صحيح
async function testGetEmployeeData() {
  log('\n📊 اختبار 6: جلب بيانات الموظف', 'blue');
  
  if (!authToken || !employeeId) {
    log('❌ لا يوجد توكن أو معرف موظف للاختبار', 'red');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/employee/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      log('✅ تم جلب بيانات الموظف بنجاح', 'green');
      log(`📈 عدد السجلات: ${response.data.count}`, 'green');
      return true;
    } else {
      log('❌ فشل في جلب البيانات', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ خطأ في جلب البيانات: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// اختبار 7: heartbeat مع توكن
async function testHeartbeat() {
  log('\n💓 اختبار 7: فحص heartbeat', 'blue');
  
  if (!authToken) {
    log('❌ لا يوجد توكن للاختبار', 'red');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/heartbeat`, {
      status: 'active',
      lastActivity: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('✅ تم heartbeat بنجاح', 'green');
      return true;
    } else {
      log('❌ فشل في heartbeat', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ خطأ في heartbeat: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// اختبار 8: validation للبيانات
async function testDataValidation() {
  log('\n🔍 اختبار 8: validation البيانات', 'blue');
  
  if (!authToken) {
    log('❌ لا يوجد توكن للاختبار', 'red');
    return false;
  }

  try {
    // إرسال بيانات خاطئة (activeSeconds أكبر من totalSeconds)
    const response = await axios.post(`${BASE_URL}/update`, {
      workData: {
        totalSeconds: 1000,
        activeSeconds: 2000, // خطأ: أكبر من totalSeconds
        idleSeconds: 500
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    log('❌ يجب أن يرفض البيانات الخاطئة لكنه قبلها!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅ تم رفض البيانات الخاطئة بنجاح', 'green');
      log(`📝 رسالة الخطأ: ${error.response.data.message}`, 'yellow');
      return true;
    } else {
      log(`❌ خطأ غير متوقع: ${error.message}`, 'red');
      return false;
    }
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  log('🚀 بدء اختبارات نظام المصادقة والـ JWT', 'blue');
  log('=' .repeat(50), 'blue');

  const tests = [
    { name: 'تسجيل الدخول بنجاح', func: testSuccessfulLogin },
    { name: 'تسجيل الدخول ببيانات خاطئة', func: testFailedLogin },
    { name: 'الوصول بدون توكن', func: testUnauthorizedAccess },
    { name: 'الوصول بتوكن صحيح', func: testAuthorizedAccess },
    { name: 'الوصول بتوكن مزيف', func: testInvalidToken },
    { name: 'جلب بيانات الموظف', func: testGetEmployeeData },
    { name: 'فحص heartbeat', func: testHeartbeat },
    { name: 'validation البيانات', func: testDataValidation }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.func();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ خطأ في اختبار ${test.name}: ${error.message}`, 'red');
      failed++;
    }
    
    // انتظار قصير بين الاختبارات
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log('\n' + '=' .repeat(50), 'blue');
  log('📊 نتائج الاختبارات:', 'blue');
  log(`✅ نجح: ${passed}`, 'green');
  log(`❌ فشل: ${failed}`, 'red');
  log(`📈 معدل النجاح: ${Math.round((passed / (passed + failed)) * 100)}%`, 'yellow');

  if (failed === 0) {
    log('\n🎉 جميع الاختبارات نجحت! نظام المصادقة يعمل بشكل مثالي', 'green');
  } else {
    log('\n⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه', 'yellow');
  }
}

// تشغيل الاختبارات
if (require.main === module) {
  runAllTests().catch(error => {
    log(`❌ خطأ عام في الاختبارات: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testSuccessfulLogin,
  testFailedLogin,
  testUnauthorizedAccess,
  testAuthorizedAccess,
  testInvalidToken,
  testGetEmployeeData,
  testHeartbeat,
  testDataValidation
}; 