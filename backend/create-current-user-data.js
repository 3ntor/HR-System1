const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const createCurrentUserData = async () => {
  try {
    console.log('🚀 إنشاء بيانات للمستخدم الحالي...');

    // المستخدم الحالي النشط
    const currentUserId = '684fedd883e2693199a30a96';
    
    // إنشاء بيانات لليوم الحالي
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // حذف أي بيانات موجودة
    await Tracking.deleteMany({ 
      userId: currentUserId,
      dateString: todayString 
    });
    
    const currentHours = new Date().getHours();
    const workHours = Math.max(2, currentHours - 8); // العمل من 8 صباحاً
    
    const totalSeconds = workHours * 3600 + 1800; // إضافة 30 دقيقة
    const activeSeconds = Math.floor(totalSeconds * 0.90); // 90% نشاط
    const idleSeconds = totalSeconds - activeSeconds;
    const breakSeconds = 2400; // 40 دقيقة استراحة
    
    const todayTracking = new Tracking({
      userId: currentUserId,
      employeeId: currentUserId,
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
          timestamp: new Date(Date.now() - 180000), // 3 دقائق مضت
          filename: 'screenshot_current_001.jpg',
          path: '/uploads/screenshots/screenshot_current_001.jpg'
        },
        {
          timestamp: new Date(Date.now() - 600000), // 10 دقائق مضت
          filename: 'screenshot_current_002.jpg',
          path: '/uploads/screenshots/screenshot_current_002.jpg'
        },
        {
          timestamp: new Date(Date.now() - 1200000), // 20 دقيقة مضت
          filename: 'screenshot_current_003.jpg',
          path: '/uploads/screenshots/screenshot_current_003.jpg'
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
    
    console.log('✅ تم إنشاء البيانات بنجاح للمستخدم:', currentUserId);
    console.log('📊 إجمالي الوقت:', Math.floor(totalSeconds / 3600), 'ساعات و', Math.floor((totalSeconds % 3600) / 60), 'دقيقة');
    console.log('🟢 وقت النشاط:', Math.floor(activeSeconds / 3600), 'ساعات و', Math.floor((activeSeconds % 3600) / 60), 'دقيقة');
    console.log('📈 نسبة الإنتاجية:', Math.round((activeSeconds / totalSeconds) * 100), '%');
    console.log('📸 لقطات الشاشة:', 3);
    console.log('🎯 الحالة: نشط ويعمل');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

createCurrentUserData(); 