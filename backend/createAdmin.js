require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://Anter:anter1234@anter.1cdaq.mongodb.net/?retryWrites=true&w=majority&appName=Anter";

async function createAdmin() {
  try {
    console.log('الاتصال بقاعدة البيانات...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('تم الاتصال بنجاح!');
    
    // حذف المستخدم الموجود إن وُجد
    await User.deleteOne({ username: 'admin' });
    
    // إنشاء مستخدم admin جديد
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      firstName: 'Admin',
      lastName: 'User',
      phone: '123456789',
      department: 'إدارة',
      position: 'مدير عام'
    });
    
    await adminUser.save();
    console.log('✅ تم إنشاء مستخدم Admin بنجاح');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

createAdmin(); 