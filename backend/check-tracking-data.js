const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');
const Employee = require('./models/Employee');

mongoose.connect('mongodb://localhost:27017/hr-system');

const checkTrackingData = async () => {
  try {
    console.log('🔍 Checking tracking data in database...');
    console.log('=' .repeat(50));
    
    // Check for 2025-06-20 specific data
    const problematicDate = '2025-06-20';
    const problematicRecords = await Tracking.find({
      dateString: problematicDate
    });
    
    console.log(`📊 Records found for ${problematicDate}: ${problematicRecords.length}`);
    
    if (problematicRecords.length > 0) {
      console.log('🚨 Found problematic records for 2025-06-20:');
      problematicRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record._id}`);
        console.log(`      User ID: ${record.userId}`);
        console.log(`      Employee ID: ${record.employeeId}`);
        console.log(`      Total Seconds: ${record.workData?.totalSeconds || 0}`);
        console.log(`      Active Seconds: ${record.workData?.activeSeconds || 0}`);
        console.log(`      Date: ${record.date}`);
        console.log('      ---');
      });
      
      // Option to delete these problematic records
      console.log('🗑️  Do you want to delete these problematic records? (Uncomment the line below)');
      // await Tracking.deleteMany({ dateString: problematicDate });
      // console.log('✅ Deleted problematic records for 2025-06-20');
    }
    
    // Check current employees
    const employees = await Employee.find().limit(5);
    console.log('\n👥 Current employees:');
    employees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.name} (ID: ${emp._id})`);
      console.log(`      User ID: ${emp.userId}`);
      console.log(`      Email: ${emp.email}`);
      console.log('      ---');
    });
    
    // Check tracking data for today
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Checking tracking data for today (${today}):`);
    
    const todayRecords = await Tracking.find({
      dateString: today
    });
    
    console.log(`📊 Records found for today: ${todayRecords.length}`);
    todayRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. User ID: ${record.userId}`);
      console.log(`      Total: ${record.workData?.totalSeconds || 0} seconds`);
      console.log(`      Active: ${record.workData?.activeSeconds || 0} seconds`);
      console.log('      ---');
    });
    
    // Check for any future dates
    const futureRecords = await Tracking.find({
      dateString: { $gt: today }
    });
    
    console.log(`\n🔮 Future date records found: ${futureRecords.length}`);
    if (futureRecords.length > 0) {
      console.log('🚨 WARNING: Found records for future dates:');
      futureRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Date: ${record.dateString}`);
        console.log(`      User ID: ${record.userId}`);
        console.log(`      Total: ${record.workData?.totalSeconds || 0} seconds`);
        console.log('      ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkTrackingData(); 