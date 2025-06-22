const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const forceUpdateData = async () => {
  try {
    console.log('🔥 حذف البيانات القديمة وإنشاء بيانات جديدة...');

    const currentUserId = '684fedd883e2693199a30a96';
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // حذف تام لجميع البيانات لهذا المستخدم اليوم
    const deleteResult = await Tracking.deleteMany({ 
      userId: currentUserId,
      $or: [
        { dateString: todayString },
        { date: { $gte: new Date(todayString), $lt: new Date(new Date(todayString).getTime() + 24*60*60*1000) }}
      ]
    });
    
    console.log('🗑️ تم حذف', deleteResult.deletedCount, 'سجل');
    
    // انتظار ثانية
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentHours = new Date().getHours();
    const workHours = Math.max(3, currentHours - 8);
    
    const totalSeconds = workHours * 3600 + 2700; // 45 دقيقة إضافية
    const activeSeconds = Math.floor(totalSeconds * 0.92); // 92% نشاط
    const idleSeconds = totalSeconds - activeSeconds;
    const breakSeconds = 2700; // 45 دقيقة استراحة
    
    console.log('📊 إنشاء بيانات جديدة...');
    console.log('⏰ ساعات العمل:', workHours);
    console.log('🔢 إجمالي الثواني:', totalSeconds);
    
    const newTracking = new Tracking({
      userId: currentUserId,
      employeeId: currentUserId,
      date: today,
      dateString: todayString,
      workData: {
        totalSeconds: totalSeconds,
        activeSeconds: activeSeconds,
        idleSeconds: idleSeconds,
        breakSeconds: breakSeconds,
        sessionsCount: 3,
        productivity: Math.round((activeSeconds / totalSeconds) * 100),
        lastActivity: new Date()
      },
      screenshots: [
        {
          timestamp: new Date(Date.now() - 120000), // 2 دقيقة مضت
          filename: 'live_screenshot_001.jpg',
          path: '/uploads/screenshots/live_screenshot_001.jpg'
        },
        {
          timestamp: new Date(Date.now() - 480000), // 8 دقائق مضت
          filename: 'live_screenshot_002.jpg',
          path: '/uploads/screenshots/live_screenshot_002.jpg'
        },
        {
          timestamp: new Date(Date.now() - 900000), // 15 دقيقة مضت
          filename: 'live_screenshot_003.jpg',
          path: '/uploads/screenshots/live_screenshot_003.jpg'
        },
        {
          timestamp: new Date(Date.now() - 1800000), // 30 دقيقة مضت
          filename: 'live_screenshot_004.jpg',
          path: '/uploads/screenshots/live_screenshot_004.jpg'
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
    
    const result = await newTracking.save();
    console.log('✅ تم حفظ البيانات الجديدة:', result._id);
    
    console.log('📊 إجمالي الوقت:', Math.floor(totalSeconds / 3600), 'ساعات و', Math.floor((totalSeconds % 3600) / 60), 'دقيقة');
    console.log('🟢 وقت النشاط:', Math.floor(activeSeconds / 3600), 'ساعات و', Math.floor((activeSeconds % 3600) / 60), 'دقيقة');
    console.log('📈 نسبة الإنتاجية:', Math.round((activeSeconds / totalSeconds) * 100), '%');
    console.log('📸 لقطات الشاشة:', 4);
    console.log('🎯 الحالة: يعمل حالياً');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

forceUpdateData(); 