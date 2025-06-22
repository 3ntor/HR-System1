require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Transaction = require('./models/Transaction');
const Client = require('./models/Client');
const Category = require('./models/Category');

// استخدام قاعدة بيانات Atlas
const MONGO_URI = process.env.MONGO_URI || 
                  process.env.MONGODB_URI || 
                  "mongodb+srv://Anter:anter1234@anter.1cdaq.mongodb.net/?retryWrites=true&w=majority&appName=Anter";

const resetDatabase = async () => {
  try {
    console.log('🚨 تحذير: سيتم حذف جميع البيانات من قاعدة البيانات!');
    console.log('⏳ انتظار 5 ثوان للإلغاء إذا لزم الأمر...');
    
    // انتظار 5 ثوان للسماح بالإلغاء
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔗 تم الاتصال بقاعدة البيانات');

    // حذف جميع البيانات
    console.log('🗑️ حذف جميع البيانات...');
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Transaction.deleteMany({});
    await Client.deleteMany({});
    await Category.deleteMany({});
    
    console.log('✅ تم حذف جميع البيانات');

    // إنشاء مستخدم admin جديد
    console.log('👤 إنشاء مستخدم admin جديد...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      firstName: 'المدير',
      lastName: 'العام',
      phone: '01234567890',
      personalInfo: {
        nationalId: '12345678901234',
        address: 'القاهرة، مصر',
        birthDate: new Date('1980-01-01'),
        gender: 'male',
        maritalStatus: 'married'
      }
    });
    
    await adminUser.save();
    console.log('✅ تم إنشاء مستخدم admin');

    // إنشاء بعض التصنيفات الأساسية
    console.log('📂 إنشاء التصنيفات الأساسية...');
    const categories = [
      { name: 'رواتب', type: 'expense', description: 'رواتب الموظفين' },
      { name: 'مبيعات', type: 'income', description: 'إيرادات المبيعات' },
      { name: 'إيجار', type: 'expense', description: 'مصاريف الإيجار' },
      { name: 'مرافق', type: 'expense', description: 'فواتير الكهرباء والماء والغاز' },
      { name: 'عمولات', type: 'income', description: 'عمولات المبيعات والخدمات' }
    ];

    for (const catData of categories) {
      const category = new Category(catData);
      await category.save();
    }
    
    console.log('✅ تم إنشاء التصنيفات الأساسية');

    // إغلاق الاتصال
    await mongoose.disconnect();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
    
    console.log('\n🎉 تم إعادة تعيين قاعدة البيانات بنجاح!');
    console.log('\n🔑 بيانات تسجيل الدخول:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين قاعدة البيانات:', error);
    process.exit(1);
  }
};

// تشغيل إعادة التعيين
resetDatabase(); 