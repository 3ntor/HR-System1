const mongoose = require('mongoose');
const Transaction = require('./backend/models/Transaction');

const MONGODB_URI = 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';

console.log('🔍 فحص البيانات الحقيقية مقابل API...');
console.log('=' .repeat(60));

async function addRealTransactions() {
    try {
        console.log('🔗 الاتصال بـ MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
        });

        console.log('✅ تم الاتصال بنجاح!');
        
        // التحقق من المعاملات الموجودة
        const existingTransactions = await Transaction.find({});
        console.log('📊 عدد المعاملات الموجودة:', existingTransactions.length);
        
        if (existingTransactions.length === 0) {
            console.log('📝 إضافة بيانات حقيقية للمعاملات...');
            
            // إضافة معاملات حقيقية تطابق البيانات المعروضة في الموقع
            const realTransactions = [
                {
                    description: 'راتب شهر يونيو - أحمد محمد',
                    amount: 8500,
                    type: 'expense',
                    category: 'رواتب',
                    date: new Date('2024-06-01'),
                    reference: 'SAL-2024-001',
                    status: 'completed',
                    notes: 'راتب شهر يونيو مع العلاوات',
                    createdBy: '65f9e8b2c9d6b123456789ab',
                    approvedBy: 'مدير الموارد البشرية'
                },
                {
                    description: 'إيرادات مشروع ABC',
                    amount: 25000,
                    type: 'income',
                    category: 'مشاريع',
                    date: new Date('2024-06-10'),
                    reference: 'PRJ-2024-001',
                    status: 'completed',
                    notes: 'دفعة أولى من مشروع تطوير الموقع',
                    createdBy: '65f9e8b2c9d6b123456789ab',
                    approvedBy: 'مدير المشاريع'
                },
                {
                    description: 'عمولة مبيعات - فاطمة',
                    amount: 3500,
                    type: 'expense',
                    category: 'عمولات',
                    date: new Date('2024-06-08'),
                    reference: 'COM-2024-001',
                    status: 'pending',
                    notes: 'عمولة على المبيعات الشهرية',
                    createdBy: '65f9e8b2c9d6b123456789ab',
                    approvedBy: null
                },
                {
                    description: 'فاتورة إنترنت ومكالمات',
                    amount: 2500,
                    type: 'expense',
                    category: 'مرافق',
                    date: new Date('2024-06-05'),
                    reference: 'UTL-2024-001',
                    status: 'completed',
                    notes: 'فواتير الاتصالات لشهر مايو',
                    createdBy: '65f9e8b2c9d6b123456789ab',
                    approvedBy: 'المدير المالي'
                }
            ];

            // إضافة المعاملات
            for (let txn of realTransactions) {
                const newTransaction = new Transaction(txn);
                await newTransaction.save();
                console.log(`✅ تم إضافة: ${txn.description}`);
            }

            console.log('🎉 تم إضافة جميع المعاملات بنجاح!');
        } else {
            console.log('📋 المعاملات الموجودة:');
            existingTransactions.forEach((txn, index) => {
                console.log(`   ${index + 1}. ${txn.description} - ${txn.amount} (${txn.type})`);
            });
        }

        // التحقق من الملخص
        const totalIncome = await Transaction.aggregate([
            { $match: { type: 'income' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalExpense = await Transaction.aggregate([
            { $match: { type: 'expense' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        console.log('=' .repeat(60));
        console.log('💰 ملخص المعاملات:');
        console.log('📈 إجمالي الإيرادات:', totalIncome[0]?.total || 0);
        console.log('📉 إجمالي المصروفات:', totalExpense[0]?.total || 0);
        console.log('💵 صافي المبلغ:', (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0));
        console.log('=' .repeat(60));

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ تم قطع الاتصال بقاعدة البيانات');
        
        // اختبار API الآن
        console.log('\n🧪 اختبار API...');
        testAPI();
    }
}

function testAPI() {
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/transactions',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('📡 Status API:', res.statusCode);
                console.log('✅ Success:', jsonData.success);
                console.log('📊 عدد المعاملات في API:', jsonData.data ? jsonData.data.length : 0);
                console.log('📝 رسالة:', jsonData.message || 'لا توجد رسالة');
                
                if (jsonData.summary) {
                    console.log('💰 ملخص API:');
                    console.log('   - إجمالي الإيرادات:', jsonData.summary.totalIncome);
                    console.log('   - إجمالي المصروفات:', jsonData.summary.totalExpense);
                    console.log('   - صافي المبلغ:', jsonData.summary.netAmount);
                }
                
                console.log('🎉 تم اختبار API بنجاح!');
                
            } catch (error) {
                console.error('❌ خطأ في تحليل API:', error.message);
                console.log('📄 الاستجابة الخام:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ خطأ في طلب API:', error.message);
    });

    req.end();
}

addRealTransactions(); 