// إعادة تفعيل الاتصال بقاعدة البيانات
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // تأكد من وجود MONGODB_URI أو استخدم القيمة الافتراضية
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Anter:ahmed123@anter.1cdaq.mongodb.net/?retryWrites=true&w=majority&appName=Anter';
    console.log('🔗 محاولة الاتصال بـ MongoDB Atlas...');
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('🔗 Connection string:', process.env.MONGODB_URI ? 'Available' : 'Missing');
    process.exit(1);
  }
};

// معالجة أحداث الاتصال
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB Atlas');
});

// إغلاق الاتصال عند إيقاف التطبيق
process.on('SIGINT', async () => {
  console.log('🔒 إغلاق اتصال MongoDB Atlas...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB; 