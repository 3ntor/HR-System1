const mongoose = require('mongoose');
const DailyAttendance = require('./models/DailyAttendance');

async function fixStatusValues() {
    try {
        await mongoose.connect('mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System');
        
        console.log('🔍 Checking existing records with invalid status...');
        
        // Find records with invalid status
        const invalidRecords = await DailyAttendance.find({
            status: { $in: ['عطلة أسبوعية', 'إجازة رسمية', 'غير متوفر', 'حاضر'] }
        });
        
        console.log('Found', invalidRecords.length, 'records with invalid status');
        
        if (invalidRecords.length > 0) {
            console.log('Sample invalid records:');
            invalidRecords.slice(0, 5).forEach(record => {
                console.log(`- ${record.date.toISOString().split('T')[0]}: ${record.status}`);
            });
        }
        
        // Update invalid status values
        const result1 = await DailyAttendance.updateMany(
            { status: 'عطلة أسبوعية' },
            { $set: { status: 'عطلة' } }
        );
        console.log('Updated', result1.modifiedCount, 'records from "عطلة أسبوعية" to "عطلة"');
        
        const result2 = await DailyAttendance.updateMany(
            { status: 'إجازة رسمية' },
            { $set: { status: 'إجازة' } }
        );
        console.log('Updated', result2.modifiedCount, 'records from "إجازة رسمية" to "إجازة"');
        
        const result3 = await DailyAttendance.updateMany(
            { status: 'غير متوفر' },
            { $set: { status: 'غائب' } }
        );
        console.log('Updated', result3.modifiedCount, 'records from "غير متوفر" to "غائب"');
        
        const result4 = await DailyAttendance.updateMany(
            { status: 'حاضر' },
            { $set: { status: 'في الوقت' } }
        );
        console.log('Updated', result4.modifiedCount, 'records from "حاضر" to "في الوقت"');
        
        // Also fix any status that contains "إجازة رسمية -"
        const result5 = await DailyAttendance.updateMany(
            { status: { $regex: /إجازة رسمية/ } },
            { $set: { status: 'إجازة' } }
        );
        console.log('Updated', result5.modifiedCount, 'records containing "إجازة رسمية" to "إجازة"');
        
        console.log('✅ Fixed all invalid status values');
        
        // Verify fix
        const remainingInvalid = await DailyAttendance.find({
            status: { $nin: ['في الوقت', 'متأخر', 'غائب', 'إجازة', 'مهمة خارجية', 'عطلة'] }
        });
        
        if (remainingInvalid.length > 0) {
            console.log('⚠️ Still found', remainingInvalid.length, 'records with invalid status:');
            remainingInvalid.slice(0, 5).forEach(record => {
                console.log(`- ${record.date.toISOString().split('T')[0]}: "${record.status}"`);
            });
        } else {
            console.log('✅ All status values are now valid');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixStatusValues(); 