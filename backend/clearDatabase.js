const mongoose = require('mongoose');

const clearDatabase = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect('mongodb://localhost:27017/hr-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // حذف قاعدة البيانات بالكامل
    await mongoose.connection.db.dropDatabase();
    console.log('✅ تم حذف قاعدة البيانات بالكامل');

    // إغلاق الاتصال
    await mongoose.disconnect();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في حذف قاعدة البيانات:', error);
    process.exit(1);
  }
};

clearDatabase(); 