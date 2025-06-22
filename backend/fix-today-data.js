const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');
const Employee = require('./models/Employee');

mongoose.connect('mongodb://localhost:27017/hr-system');

const createTodayData = async () => {
  try {
    console.log('🚀 إنشاء بيانات لليوم الحالي...');

    // جلب الموظف الأول
    const employee = await Employee.findOne();
    console.log('Employee ID:', employee._id.toString());
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log('Today:', todayString);
    
    // حذف أي بيانات موجودة لليوم الحالي
    await Tracking.deleteMany({ 
      userId: employee._id,
      dateString: todayString 
    });
    
    // إنشاء بيانات لليوم الحالي
    const startTime = new Date(today);
    startTime.setHours(9, 0, 0, 0);
    
    const currentHours = new Date().getHours();
    const workHours = Math.max(1, currentHours - 9); // العمل من 9 صباحاً حتى الآن
    
    const totalSeconds = workHours * 3600 + Math.floor(Math.random() * 3600); // إضافة وقت عشوائي
    const activeSeconds = Math.floor(totalSeconds * 0.85); // 85% نشاط
    const idleSeconds = totalSeconds - activeSeconds;
    const breakSeconds = Math.floor(Math.random() * 1800 + 900); // 15-45 دقيقة استراحة
    
    const todayTracking = new Tracking({
      userId: employee._id,
      employeeId: employee._id,
      date: today,
      dateString: todayString,
      workData: {
        totalSeconds: totalSeconds,
        activeSeconds: activeSeconds,
        idleSeconds: idleSeconds,
        breakSeconds: breakSeconds,
        sessionsCount: 1,
        productivity: Math.round((activeSeconds / totalSeconds) * 100),
        lastActivity: new Date()
      },
      screenshots: [],
      status: 'working', // حالة العمل الحالية
      isWorking: true,  // يعمل حالياً
      lastUpdate: new Date(),
      metadata: {
        deviceType: 'desktop',
        appVersion: '2.8.0',
        systemInfo: {
          platform: 'darwin',
          arch: 'arm64',
          version: '24.3.0'
        }
      }
    });
    
    await todayTracking.save();
    
    console.log('✅ تم إنشاء بيانات لليوم الحالي بنجاح');
    console.log('📊 إجمالي الوقت:', Math.floor(totalSeconds / 3600), 'ساعات');
    console.log('🟢 وقت النشاط:', Math.floor(activeSeconds / 3600), 'ساعات');
    console.log('📈 نسبة الإنتاجية:', Math.round((activeSeconds / totalSeconds) * 100), '%');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTodayData(); 