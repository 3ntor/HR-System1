const mongoose = require('mongoose');
const Tracking = require('./models/Tracking');

mongoose.connect('mongodb://localhost:27017/hr-system');

const cleanupFutureTrackingData = async () => {
  try {
    console.log('🧹 Cleaning up future tracking data...');
    console.log('=' .repeat(50));
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Current date: ${today}`);
    
    // Find all records with future dates
    const futureRecords = await Tracking.find({
      dateString: { $gt: today }
    });
    
    console.log(`🔮 Found ${futureRecords.length} records with future dates`);
    
    if (futureRecords.length > 0) {
      console.log('📋 Future records details:');
      futureRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Date: ${record.dateString}`);
        console.log(`      User ID: ${record.userId}`);
        console.log(`      Employee ID: ${record.employeeId}`);
        console.log(`      Total: ${record.workData?.totalSeconds || 0} seconds`);
        console.log(`      Active: ${record.workData?.activeSeconds || 0} seconds`);
        
        // Convert seconds to minutes for readability
        const totalMinutes = Math.floor((record.workData?.totalSeconds || 0) / 60);
        const activeMinutes = Math.floor((record.workData?.activeSeconds || 0) / 60);
        console.log(`      Total: ${totalMinutes} minutes`);
        console.log(`      Active: ${activeMinutes} minutes`);
        console.log('      ---');
      });
      
      // Delete future records
      console.log('\n🗑️  Deleting future date records...');
      const deleteResult = await Tracking.deleteMany({
        dateString: { $gt: today }
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} future tracking records`);
      
      // Specifically check for 2025-06-20
      const specificDate = '2025-06-20';
      const specificRecords = await Tracking.find({
        dateString: specificDate
      });
      
      if (specificRecords.length > 0) {
        console.log(`\n🚨 Still found ${specificRecords.length} records for ${specificDate}`);
        console.log('🗑️  Deleting specific problematic date records...');
        
        const specificDeleteResult = await Tracking.deleteMany({
          dateString: specificDate
        });
        
        console.log(`✅ Deleted ${specificDeleteResult.deletedCount} records for ${specificDate}`);
      } else {
        console.log(`\n✅ No records found for ${specificDate} after cleanup`);
      }
    } else {
      console.log('✅ No future date records found - database is clean');
    }
    
    // Verify cleanup
    console.log('\n🔍 Verification after cleanup:');
    const remainingFutureRecords = await Tracking.find({
      dateString: { $gt: today }
    });
    
    console.log(`📊 Remaining future records: ${remainingFutureRecords.length}`);
    
    if (remainingFutureRecords.length === 0) {
      console.log('🎉 Cleanup successful! No future date records remain.');
    } else {
      console.log('⚠️  Some future records still exist:');
      remainingFutureRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Date: ${record.dateString}, User: ${record.userId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
};

cleanupFutureTrackingData(); 