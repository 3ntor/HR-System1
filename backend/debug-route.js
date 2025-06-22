const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const debugRoute = async () => {
  try {
    const userId = '684be22e2fb53495db4eb7e1';
    
    console.log('🔍 Debug Route:');
    console.log('User ID:', userId);
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log('Today String:', todayString);
    
    // البحث بنفس الطريقة المستخدمة في Route
    const todayTracking = await Tracking.findOne({
      userId: userId,
      dateString: todayString
    }).sort({ createdAt: -1 });

    console.log('Found today tracking:', todayTracking ? 'YES' : 'NO');
    
    if (todayTracking) {
      console.log('Work Data:', todayTracking.workData);
      console.log('Total Seconds:', todayTracking.workData?.totalSeconds);
      console.log('Active Seconds:', todayTracking.workData?.activeSeconds);
      console.log('Status:', todayTracking.status);
      console.log('IsWorking:', todayTracking.isWorking);
    }
    
    // تطبيق نفس منطق Route
    const todayData = {
      totalSeconds: todayTracking?.workData?.totalSeconds || 0,
      activeSeconds: todayTracking?.workData?.activeSeconds || 0,
      idleSeconds: todayTracking?.workData?.idleSeconds || 0,
      breakSeconds: todayTracking?.workData?.breakSeconds || 0,
      productivity: todayTracking?.workData?.productivity || 0,
      sessionsCount: todayTracking?.workData?.sessionsCount || 0,
      screenshotsCount: todayTracking?.screenshots?.length || 0,
      screenshots: todayTracking?.screenshots?.map(s => s.filename).filter(Boolean) || [],
      lastActivity: todayTracking?.workData?.lastActivity || null,
      isWorking: todayTracking?.isWorking || false,
      status: todayTracking?.isWorking ? 'working' : 'offline'
    };
    
    console.log('Processed Today Data:', todayData);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

debugRoute(); 