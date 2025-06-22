const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const finalCheck = async () => {
  try {
    const userId = '684fedd883e2693199a30a96';
    const todayString = '2025-06-17';
    
    const data = await Tracking.findOne({
      userId: userId,
      dateString: todayString
    });
    
    console.log('🔍 فحص نهائي للبيانات:');
    console.log('User ID:', userId);
    console.log('Date:', todayString);
    
    if (data) {
      console.log('✅ البيانات موجودة:');
      console.log('- ID:', data._id.toString());
      console.log('- Total Seconds:', data.workData?.totalSeconds);
      console.log('- Active Seconds:', data.workData?.activeSeconds);
      console.log('- Productivity:', data.workData?.productivity);
      console.log('- Status:', data.status);
      console.log('- IsWorking:', data.isWorking);
      console.log('- Screenshots:', data.screenshots?.length || 0);
      console.log('- Created:', data.createdAt);
      console.log('- Updated:', data.updatedAt);
    } else {
      console.log('❌ لا توجد بيانات');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    mongoose.connection.close();
  }
};

finalCheck(); 