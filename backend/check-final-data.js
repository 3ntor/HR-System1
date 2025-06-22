const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const checkFinalData = async () => {
  try {
    const targetUserId = '684ffd2d69efefc90e0e6cde';
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    console.log('🔍 فحص البيانات:');
    console.log('User ID:', targetUserId);
    console.log('Today String:', todayString);
    
    // فحص جميع البيانات لهذا المستخدم
    const allData = await Tracking.find({ userId: targetUserId });
    console.log('جميع البيانات:', allData.length);
    
    if (allData.length > 0) {
      console.log('آخر سجل:', {
        date: allData[allData.length - 1].date,
        dateString: allData[allData.length - 1].dateString,
        totalSeconds: allData[allData.length - 1].workData?.totalSeconds,
        status: allData[allData.length - 1].status
      });
    }
    
    // فحص بيانات اليوم
    const todayData = await Tracking.findOne({
      userId: targetUserId,
      dateString: todayString
    });
    
    console.log('بيانات اليوم:', todayData ? 'موجودة' : 'غير موجودة');
    
    if (todayData) {
      console.log('تفاصيل بيانات اليوم:', {
        totalSeconds: todayData.workData?.totalSeconds,
        activeSeconds: todayData.workData?.activeSeconds,
        productivity: todayData.workData?.productivity,
        status: todayData.status,
        isWorking: todayData.isWorking
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkFinalData(); 