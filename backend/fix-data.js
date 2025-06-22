const Transaction = require('./models/Transaction');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';

async function fixData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // محو البيانات القديمة
    const deleteResult = await Transaction.deleteMany({});
    console.log('🗑️ Deleted', deleteResult.deletedCount, 'old transactions');
    
    // إضافة البيانات الحقيقية التي تطابق الموقع
    console.log('📝 Adding real matching transactions...');
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
        createdBy: 'نظام الرواتب',
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
        createdBy: 'أحمد محمد',
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
        createdBy: 'قسم المبيعات',
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
        createdBy: 'الإدارة',
        approvedBy: 'المدير المالي'
      }
    ];
    
    await Transaction.insertMany(realTransactions);
    console.log('🎉 Added', realTransactions.length, 'real transactions!');
    
    // التحقق من الملخص
    const totalIncome = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpense = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('=' .repeat(50));
    console.log('💰 Transaction Summary:');
    console.log('📈 Total Income:', totalIncome[0]?.total || 0);
    console.log('📉 Total Expense:', totalExpense[0]?.total || 0);
    console.log('💵 Net Amount:', (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0));
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixData(); 