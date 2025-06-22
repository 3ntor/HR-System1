const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function checkUsers() {
  try {
    console.log('🔍 فحص المستخدمين في قاعدة البيانات...');

    // الاتصال بقاعدة البيانات
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';
    await mongoose.connect(mongoUri);
    console.log('✅ متصل بقاعدة البيانات');

    // جلب جميع المستخدمين
    const users = await User.find({});
    console.log(`📊 عدد المستخدمين: ${users.length}`);

    if (users.length === 0) {
      console.log('❌ لا يوجد مستخدمين - سيتم إنشاء مستخدم admin');
      
      // إنشاء مستخدم admin جديد
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
        username: 'admin',
        email: 'admin@hr-system.com',
        password: hashedPassword,
        name: 'مدير النظام',
        role: 'admin',
        isActive: true,
        createdAt: new Date()
      });
      
      await adminUser.save();
      console.log('✅ تم إنشاء مستخدم admin جديد');
      console.log('📧 البريد: admin@hr-system.com');
      console.log('🔑 كلمة المرور: admin123');
      
    } else {
      console.log('\n👥 المستخدمين الموجودين:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. المستخدم: ${user.username}`);
        console.log(`   - البريد: ${user.email || 'غير محدد'}`);
        console.log(`   - الاسم: ${user.name || 'غير محدد'}`);
        console.log(`   - الدور: ${user.role || 'غير محدد'}`);
        console.log(`   - نشط: ${user.isActive ? 'نعم' : 'لا'}`);
        console.log('');
      });
    }

    console.log('\n🔑 للدخول للموقع استخدم:');
    console.log('- الرابط: http://localhost:3000');
    console.log('- اسم المستخدم: admin');
    console.log('- كلمة المرور: admin123');

  } catch (error) {
    console.error('❌ خطأ في فحص المستخدمين:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔒 تم إغلاق اتصال قاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
checkUsers(); 