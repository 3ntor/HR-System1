const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');
const Employee = require('./models/Employee');

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/hr-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createSampleTrackingData = async () => {
  try {
    console.log('🚀 بدء إنشاء بيانات التتبع التجريبية...');

    // الحصول على أول موظف
    const employee = await Employee.findOne();
    if (!employee) {
      console.log('❌ لم يتم العثور على أي موظف');
      return;
    }

    console.log(`👤 إنشاء بيانات لموظف: ${employee.name}`);

    // حذف البيانات الموجودة
    await Tracking.deleteMany({ userId: employee._id });

    // إنشاء بيانات لآخر 14 يوم
    const today = new Date();
    const trackingData = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // فحص العطلة الأسبوعية بناءً على الإعدادات (افتراضي: الجمعة والسبت) 
    const isWeekend = [5, 6].includes(date.getDay());
      const isToday = i === 0;

      if (!isWeekend) {
        // إنشاء جلسة عمل
        const startTime = new Date(date);
        startTime.setHours(9, 0, 0, 0); // بداية العمل 9 صباحاً

        const workHours = isToday ? 
          (Math.random() * 4 + 2) : // 2-6 ساعات لليوم الحالي
          (Math.random() * 3 + 6); // 6-9 ساعات للأيام السابقة

        const totalSeconds = Math.floor(workHours * 3600);
        const activeSeconds = Math.floor(totalSeconds * (0.7 + Math.random() * 0.2)); // 70-90% نشاط
        const idleSeconds = totalSeconds - activeSeconds;
        const breakSeconds = Math.floor(Math.random() * 3600 + 1800); // 30-90 دقيقة استراحة

        const tracking = new Tracking({
          userId: employee._id,
          employeeId: employee._id,
          date: date,
          dateString: date.toISOString().split('T')[0],
          workData: {
            totalSeconds: totalSeconds,
            activeSeconds: activeSeconds,
            idleSeconds: idleSeconds,
            breakSeconds: breakSeconds,
            sessionsCount: 1,
            productivity: Math.round((activeSeconds / totalSeconds) * 100),
            lastActivity: isToday ? new Date() : new Date(startTime.getTime() + totalSeconds * 1000)
          },
          screenshots: [],
          status: isToday ? 'working' : 'offline',
          isWorking: isToday,
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

        trackingData.push(tracking);
      }
    }

    // حفظ البيانات
    await Tracking.insertMany(trackingData);
    
    console.log(`✅ تم إنشاء ${trackingData.length} سجل تتبع بنجاح`);
    console.log('📊 يمكنك الآن رؤية البيانات في صفحة Desktop Tracking');

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error);
  } finally {
    mongoose.connection.close();
  }
};

createSampleTrackingData(); 