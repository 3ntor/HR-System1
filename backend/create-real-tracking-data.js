require('dotenv').config();
const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');
const User = require('./models/User');

const createRealTrackingData = async () => {
  try {
    console.log('🚀 إنشاء بيانات التتبع الحقيقية...');

    // اتصال بقاعدة البيانات
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';
    await mongoose.connect(mongoUri);
    console.log('✅ متصل بقاعدة البيانات');

    // العثور على المستخدم admin
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.log('❌ لم يتم العثور على المستخدم admin');
      return;
    }

    const userId = adminUser._id;
    console.log('👤 المستخدم:', adminUser.name || adminUser.username);
    console.log('🆔 User ID:', userId);

    // حذف البيانات الموجودة للأيام الـ 14 الماضية
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14);

    await Tracking.deleteMany({
      userId: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    console.log('🗑️ تم حذف البيانات القديمة');

    // إنشاء بيانات لآخر 14 يوم
    const trackingData = [];
    
    for (let i = 13; i >= 0; i--) {
      const currentDate = new Date(endDate);
      currentDate.setDate(endDate.getDate() - i);
      currentDate.setHours(0, 0, 0, 0);
      
      const dateString = currentDate.toISOString().split('T')[0];
      // فحص العطلة الأسبوعية بناءً على الإعدادات (افتراضي: الجمعة والسبت)
      const isWeekend = [5, 6].includes(currentDate.getDay());
      const isToday = i === 0;

      if (!isWeekend) {
        // إنشاء بيانات عمل واقعية
        const baseWorkHours = isToday ? 
          (new Date().getHours() >= 9 ? new Date().getHours() - 9 + (new Date().getMinutes() / 60) : 1) :
          (Math.random() * 3 + 6); // 6-9 ساعات للأيام السابقة

        const totalSeconds = Math.floor(baseWorkHours * 3600);
        const productivityRate = 0.75 + Math.random() * 0.2; // 75-95% إنتاجية
        const activeSeconds = Math.floor(totalSeconds * productivityRate);
        const idleSeconds = totalSeconds - activeSeconds;
        const breakSeconds = Math.floor(Math.random() * 1800 + 1800); // 30-60 دقيقة استراحة

        // إنشاء بعض لقطات الشاشة للأيام الحديثة
        const screenshots = [];
        if (i <= 2) { // آخر 3 أيام
          const screenshotCount = Math.floor(Math.random() * 3 + 2);
          for (let j = 0; j < screenshotCount; j++) {
            const screenshotTime = new Date(currentDate);
            screenshotTime.setHours(9 + j * 2, Math.floor(Math.random() * 60));
            screenshots.push({
              timestamp: screenshotTime,
              filename: `screenshot_${dateString}_${j + 1}.jpg`,
              path: `/uploads/screenshots/screenshot_${dateString}_${j + 1}.jpg`
            });
          }
        }

        const tracking = new Tracking({
          userId: userId,
          employeeId: userId,
          date: currentDate,
          dateString: dateString,
          workData: {
            totalSeconds: totalSeconds,
            activeSeconds: activeSeconds,
            idleSeconds: idleSeconds,
            breakSeconds: breakSeconds,
            sessionsCount: Math.floor(Math.random() * 2 + 1), // 1-2 جلسات
            productivity: Math.round(productivityRate * 100),
            lastActivity: isToday ? new Date() : new Date(currentDate.getTime() + totalSeconds * 1000)
          },
          screenshots: screenshots,
          status: isToday ? 'working' : 'offline',
          isWorking: isToday,
          lastUpdate: isToday ? new Date() : new Date(currentDate.getTime() + totalSeconds * 1000),
          metadata: {
            deviceType: 'desktop',
            appVersion: '2.8.0',
            systemInfo: {
              platform: 'win32',
              arch: 'x64',
              version: '10.0.26100'
            }
          }
        });

        trackingData.push(tracking);
        
        console.log(`📅 ${dateString}: ${Math.floor(totalSeconds/3600)}س ${Math.floor((totalSeconds%3600)/60)}د - إنتاجية: ${Math.round(productivityRate * 100)}%`);
      }
    }

    // حفظ البيانات
    if (trackingData.length > 0) {
      await Tracking.insertMany(trackingData);
      console.log(`✅ تم إنشاء ${trackingData.length} سجل تتبع بنجاح`);
      
      // إحصائيات
      const totalHours = trackingData.reduce((sum, record) => sum + (record.workData.totalSeconds / 3600), 0);
      const avgProductivity = trackingData.reduce((sum, record) => sum + record.workData.productivity, 0) / trackingData.length;
      
      console.log('📊 الإحصائيات:');
      console.log(`⏰ إجمالي ساعات العمل: ${Math.floor(totalHours)} ساعة`);
      console.log(`📈 متوسط الإنتاجية: ${Math.round(avgProductivity)}%`);
      console.log(`📸 إجمالي لقطات الشاشة: ${trackingData.reduce((sum, record) => sum + record.screenshots.length, 0)}`);
    } else {
      console.log('⚠️ لم يتم إنشاء أي سجلات (جميع الأيام كانت إجازات)');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔒 تم إغلاق اتصال قاعدة البيانات');
    }
  }
};

// تشغيل السكريبت
createRealTrackingData(); 