require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

// استخدام قاعدة بيانات في الذاكرة
const { MongoMemoryServer } = require('mongodb-memory-server');

async function createTestDB() {
  try {
    console.log('🚀 إنشاء قاعدة بيانات للاختبار...');
    
    // إنشاء خادم MongoDB في الذاكرة
    const mongod = new MongoMemoryServer();
    await mongod.start();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ تم الاتصال بقاعدة البيانات المؤقتة');
    
    // إنشاء مستخدم admin
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      firstName: 'المدير',
      lastName: 'العام',
      phone: '123456789',
      department: 'إدارة',
      position: 'مدير عام'
    });
    
    await adminUser.save();
    console.log('✅ تم إنشاء مستخدم Admin');
    
    // إنشاء بعض الموظفين التجريبيين
    const employees = [
      {
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '01012345678',
        department: 'تكنولوجيا المعلومات',
        position: 'مطور',
        hireDate: new Date('2023-01-15'),
        baseSalary: 8000,
        allowances: {
          transportation: 500,
          housing: 1000,
          meal: 300
        },
        approvalStatus: 'approved',
        status: 'active'
      },
      {
        name: 'فاطمة أحمد',
        email: 'fatima@example.com',
        phone: '01087654321',
        department: 'الموارد البشرية',
        position: 'أخصائي موارد بشرية',
        hireDate: new Date('2023-03-20'),
        baseSalary: 7000,
        allowances: {
          transportation: 500,
          housing: 800,
          meal: 300
        },
        approvalStatus: 'approved',
        status: 'active'
      }
    ];
    
    for (const empData of employees) {
      const employee = new Employee(empData);
      await employee.save();
    }
    
    console.log('✅ تم إنشاء الموظفين التجريبيين');
    console.log('\n📊 بيانات الدخول:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    // عدم إغلاق الاتصال - تركه مفتوحاً للاستخدام
    console.log('\n✅ قاعدة البيانات جاهزة للاستخدام');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestDB();
}

module.exports = { createTestDB }; 