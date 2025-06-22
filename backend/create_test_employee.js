// إنشاء موظف تجريبي لاختبار نظام المصادقة
// تشغيل هذا الملف: node create_test_employee.js

const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// الاتصال بقاعدة البيانات
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hr-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ تم الاتصال بقاعدة البيانات');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
}

// إنشاء موظف تجريبي
async function createTestEmployee() {
  try {
    // التحقق من وجود الموظف
    const existingEmployee = await Employee.findOne({ email: 'fatima@company.com' });
    
    if (existingEmployee) {
      console.log('✅ الموظف التجريبي موجود بالفعل');
      console.log(`📋 الاسم: ${existingEmployee.name}`);
      console.log(`📧 البريد: ${existingEmployee.email}`);
      console.log(`🆔 رقم الموظف: ${existingEmployee.employeeNumber}`);
      return existingEmployee;
    }

    // إنشاء موظف جديد
    const testEmployee = new Employee({
      employeeNumber: 'EMP-2024-001',
      name: 'فاطمة أحمد محمد',
      email: 'fatima@company.com',
      phone: '01012345678',
      department: 'القسم المالي',
      position: 'محاسبة أولى',
      status: 'نشط',
      approvalStatus: 'approved',
      teamLead: false,
      location: 'المقر الرئيسي',
      address: 'مصر الجديدة، القاهرة',
      startDate: new Date('2022-03-15'),
      baseSalary: 12000,
      allowances: {
        transportation: 1200,
        housing: 2000,
        meal: 800
      },
      deductions: {
        socialInsurance: 650,
        tax: 850
      },
      attendance: {
        totalWorkingDays: 22,
        presentDays: 21,
        absentDays: 1,
        totalHours: 168,
        overtimeHours: 8,
        leaveBalance: 18
      },
      performance: {
        rating: 4.2,
        lastReview: new Date(),
        goals: ['تحسين الأداء المالي', 'تطوير المهارات التقنية'],
        achievements: ['إنجاز مشروع الميزانية', 'تدريب الموظفين الجدد']
      },
      skills: ['المحاسبة', 'Excel المتقدم', 'إدارة الوقت'],
      directManager: 'أحمد محمد علي',
      nationalId: '29203151234567',
      birthDate: new Date('1992-03-15'),
      gender: 'أنثى',
      maritalStatus: 'متزوجة',
      emergencyContact: {
        name: 'أحمد محمد',
        phone: '01098765432',
        relation: 'زوج',
        address: 'نفس العنوان'
      }
    });

    await testEmployee.save();
    
    console.log('✅ تم إنشاء الموظف التجريبي بنجاح');
    console.log(`📋 الاسم: ${testEmployee.name}`);
    console.log(`📧 البريد: ${testEmployee.email}`);
    console.log(`🆔 رقم الموظف: ${testEmployee.employeeNumber}`);
    console.log(`🔑 كلمة المرور الافتراضية: 123456`);
    
    return testEmployee;
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الموظف:', error);
    throw error;
  }
}

// تشغيل الدالة
async function main() {
  await connectDB();
  await createTestEmployee();
  
  console.log('\n🎯 يمكنك الآن اختبار نظام المصادقة باستخدام:');
  console.log('📧 البريد الإلكتروني: fatima@company.com');
  console.log('🆔 رقم الموظف: EMP-2024-001');
  console.log('👤 الاسم: فاطمة أحمد محمد');
  console.log('🔑 كلمة المرور: 123456');
  
  mongoose.connection.close();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  });
}

module.exports = { createTestEmployee }; 