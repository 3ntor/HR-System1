const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const createFinalData = async () => {
  try {
    console.log('🚀 إنشاء البيانات النهائية...');

    // المستخدم الذي تستخدمه الواجهة
    const targetUserId = '684ffd2d69efefc90e0e6cde';
    
    // إنشاء بيانات لليوم الحالي
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // حذف أي بيانات موجودة
    await Tracking.deleteMany({ 
      userId: targetUserId,
      dateString: todayString 
    });
    
    const currentHours = new Date().getHours();
    const workHours = Math.max(1, currentHours - 9);
    
    const totalSeconds = workHours * 3600 + 2400; // إضافة 40 دقيقة
    const activeSeconds = Math.floor(totalSeconds * 0.88); // 88% نشاط
    const idleSeconds = totalSeconds - activeSeconds;
    const breakSeconds = 1800; // 30 دقيقة استراحة
    
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
        sessionsCount: 2,
        productivity: Math.round((activeSeconds / totalSeconds) * 100),
        lastActivity: new Date()
      },
      screenshots: [
        {
          timestamp: new Date(Date.now() - 300000), // 5 دقائق مضت
          filename: 'screenshot_001.jpg',
          path: '/uploads/screenshots/screenshot_001.jpg'
        },
        {
          timestamp: new Date(Date.now() - 900000), // 15 دقيقة مضت
          filename: 'screenshot_002.jpg',
          path: '/uploads/screenshots/screenshot_002.jpg'
        }
      ],
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
    console.log('📊 إجمالي الوقت:', Math.floor(totalSeconds / 3600), 'ساعات و', Math.floor((totalSeconds % 3600) / 60), 'دقيقة');
    console.log('🟢 وقت النشاط:', Math.floor(activeSeconds / 3600), 'ساعات و', Math.floor((activeSeconds % 3600) / 60), 'دقيقة');
    console.log('📈 نسبة الإنتاجية:', Math.round((activeSeconds / totalSeconds) * 100), '%');
    console.log('📸 لقطات الشاشة:', 2);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

createFinalData(); 