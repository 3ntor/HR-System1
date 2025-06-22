require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function createAdmin() {
  try {
    // الاتصال بقاعدة البيانات
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // التحقق من وجود admin
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ المستخدم admin موجود بالفعل');
      return;
    }

    // إنشاء مستخدم admin
    const adminUser = new User({
      username: 'admin',
      email: 'admin@hr.com',
      password: 'admin123', // سيتم تشفيرها تلقائياً
      role: 'admin',
      firstName: 'مدير',
      lastName: 'النظام',
      phone: '01000000000',
      department: 'الإدارة العامة',
      position: 'مدير عام',
      status: 'active'
    });

    await adminUser.save();
    console.log('✅ تم إنشاء مستخدم Admin');

    // إنشاء ملف موظف للـ admin
    const adminEmployee = new Employee({
      userId: adminUser._id,
      name: 'مدير النظام',
      email: 'admin@hr.com',
      phone: '01000000000',
      department: 'الإدارة العامة',
      position: 'مدير عام',
      status: 'فعال',
      approvalStatus: 'approved',
      baseSalary: 50000,
      allowances: {
        transportation: 2000,
        housing: 5000,
        meal: 1000
      },
      deductions: {
        socialInsurance: 2000,
        tax: 3000
      },
      attendance: {
        presentDays: 22,
        absentDays: 0,
        totalWorkingDays: 22,
        leaveBalance: 21
      },
      performance: {
        rating: 5,
        lastReview: new Date()
      },
      createdBy: 'system'
    });

    await adminEmployee.save();
    console.log('✅ تم إنشاء ملف موظف للـ Admin');

    // ربط المستخدم بالموظف
    adminUser.employeeId = adminEmployee._id;
    await adminUser.save();

    console.log('\n🎉 تم إنشاء النظام بنجاح!');
    console.log('👤 بيانات تسجيل الدخول:');
    console.log('   اسم المستخدم: admin');
    console.log('   كلمة المرور: admin123');
    console.log('   البريد الإلكتروني: admin@hr.com');

  } catch (error) {
    console.error('❌ خطأ في إنشاء Admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

createAdmin(); 