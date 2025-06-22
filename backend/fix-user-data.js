const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');
const Employee = require('./models/Employee');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/hr-system');

const createDataForCorrectUser = async () => {
  try {
    console.log('🔄 إصلاح بيانات المستخدم...');

    // الحصول على جميع المستخدمين
    const users = await User.find();
    const employees = await Employee.find();
    
    console.log('Users found:', users.map(u => ({ id: u._id.toString(), email: u.email, username: u.username })));
    console.log('Employees found:', employees.map(e => ({ id: e._id.toString(), email: e.email, name: e.name })));
    
    // نستخدم المستخدم الموجود الأول
    const targetUserId = '684d101efe04a03093466829'; // Ahmed Mohamed user
    const targetEmployeeId = '684be22e2fb53495db4eb7e1'; // Ahmed Mohamed employee
    
    console.log('استخدام المستخدم الموجود:', targetUserId);
    
    // إنشاء بيانات لليوم الحالي
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // حذف أي بيانات موجودة لهذا المستخدم اليوم
    await Tracking.deleteMany({ 
      userId: targetUserId,
      dateString: todayString 
    });
    
    const currentHours = new Date().getHours();
    const workHours = Math.max(1, currentHours - 9);
    
    const totalSeconds = workHours * 3600 + Math.floor(Math.random() * 3600);
    const activeSeconds = Math.floor(totalSeconds * 0.85);
    const idleSeconds = totalSeconds - activeSeconds;
    const breakSeconds = Math.floor(Math.random() * 1800 + 900);
    
    const todayTracking = new Tracking({
      userId: targetUserId,
      employeeId: targetUserId,
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
      status: 'working',
      isWorking: true,
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
    
    console.log('✅ تم إنشاء البيانات بنجاح للمستخدم:', targetUserId);
    console.log('📊 إجمالي الوقت:', Math.floor(totalSeconds / 3600), 'ساعات');
    console.log('🟢 وقت النشاط:', Math.floor(activeSeconds / 3600), 'ساعات');
    console.log('📈 نسبة الإنتاجية:', Math.round((activeSeconds / totalSeconds) * 100), '%');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

createDataForCorrectUser(); 