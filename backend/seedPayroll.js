const mongoose = require('mongoose');
const seedPayrollData = require('./seedPayrollData');

const runPayrollSeed = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect('mongodb://localhost:27017/hr-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // تشغيل إضافة بيانات الرواتب
    await seedPayrollData();

    // إغلاق الاتصال
    await mongoose.disconnect();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في تشغيل بيانات الرواتب:', error);
    process.exit(1);
  }
};

runPayrollSeed(); 