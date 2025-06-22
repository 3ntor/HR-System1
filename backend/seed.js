const mongoose = require('mongoose');
const seedData = require('./seedData');

// الاتصال بقاعدة البيانات وإضافة البيانات التجريبية
const runSeed = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect('mongodb://localhost:27017/hr-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // تشغيل إضافة البيانات التجريبية
    await seedData();

    // إغلاق الاتصال
    await mongoose.disconnect();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في تشغيل البيانات التجريبية:', error);
    process.exit(1);
  }
};

runSeed(); 