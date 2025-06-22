const mongoose = require('mongoose');

// استخدام MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';

console.log('🔍 فحص المعاملات في قاعدة البيانات hr-system...');
console.log('=' .repeat(60));

async function checkTransactions() {
    try {
        console.log('🔗 الاتصال بـ MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
        });

        console.log('✅ تم الاتصال بنجاح!');
        console.log('📊 اسم قاعدة البيانات:', mongoose.connection.name);
        console.log('=' .repeat(60));

        // قائمة جميع الجداول
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 جميع الجداول الموجودة:');
        collections.forEach((collection, index) => {
            console.log(`   ${index + 1}. ${collection.name}`);
        });
        console.log('=' .repeat(60));

        // فحص المعاملات (transactions)
        const transactionCollection = mongoose.connection.db.collection('transactions');
        const transactionCount = await transactionCollection.countDocuments();
        console.log(`💰 عدد المعاملات: ${transactionCount}`);

        if (transactionCount > 0) {
            const transactions = await transactionCollection.find({}).toArray();
            console.log('📋 جميع المعاملات:');
            transactions.forEach((transaction, index) => {
                console.log(`\n   معاملة ${index + 1}:`);
                console.log(`   - ID: ${transaction._id}`);
                console.log(`   - العنوان: ${transaction.title || transaction.description || 'غير محدد'}`);
                console.log(`   - المبلغ: ${transaction.amount || 'غير محدد'}`);
                console.log(`   - النوع: ${transaction.type || 'غير محدد'}`);
                console.log(`   - التاريخ: ${transaction.date || transaction.createdAt || 'غير محدد'}`);
                console.log(`   - الحالة: ${transaction.status || 'غير محدد'}`);
            });
        }

        console.log('=' .repeat(60));

        // فحص الموظفين
        const employeeCollection = mongoose.connection.db.collection('employees');
        const employeeCount = await employeeCollection.countDocuments();
        console.log(`👥 عدد الموظفين: ${employeeCount}`);

        if (employeeCount > 0) {
            const employees = await employeeCollection.find({}).limit(3).toArray();
            console.log('📋 عينة من الموظفين:');
            employees.forEach((emp, index) => {
                console.log(`   ${index + 1}. ${emp.name || emp.username || 'غير محدد'} (ID: ${emp._id})`);
            });
        }

        console.log('=' .repeat(60));

        // فحص المستخدمين
        const userCollection = mongoose.connection.db.collection('users');
        const userCount = await userCollection.countDocuments();
        console.log(`👤 عدد المستخدمين: ${userCount}`);

        if (userCount > 0) {
            const users = await userCollection.find({}).toArray();
            console.log('📋 جميع المستخدمين:');
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.username || user.name || 'غير محدد'} - ${user.role || 'غير محدد'}`);
            });
        }

        console.log('=' .repeat(60));
        console.log('✅ انتهى فحص قاعدة البيانات!');

    } catch (error) {
        console.error('❌ خطأ في فحص قاعدة البيانات:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkTransactions(); 