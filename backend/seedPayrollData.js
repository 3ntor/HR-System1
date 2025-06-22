const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// إنشاء بيانات خاصة بالرواتب
const seedPayrollData = async () => {
  try {
    console.log('💰 بدء إضافة بيانات الرواتب...');

    // حذف البيانات الموجودة
    await Employee.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ تم مسح البيانات السابقة');

    // إنشاء مستخدم إداري
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@hrsystem.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    await adminUser.save();
    console.log('✅ تم إنشاء المستخدم الإداري: admin / admin123');

    // إنشاء موظفين مع بيانات رواتب تفصيلية
    const employees = [
      {
        name: 'أحمد محمد علي',
        employeeNumber: 'EMP001',
        email: 'ahmed.mohamed@company.com',
        phone: '+966501234567',
        position: 'مطور برمجيات أول',
        department: 'تقنية المعلومات',
        startDate: new Date('2023-01-15'),
        baseSalary: 8000,
        currentSalary: 8000,
        status: 'نشط',
        approvalStatus: 'approved',
        benefits: {
          transportationAllowance: 500,
          mealAllowance: 300,
          medicalInsurance: true,
          lifeInsurance: true
        },
        allowances: {
          transportation: 500,
          housing: 1200,
          meal: 300
        },
        deductions: {
          socialInsurance: 400,
          tax: 200
        },
        monthlyAdjustments: {
          bonuses: [
            {
              id: 1,
              type: 'مكافأة أداء',
              amount: 1000,
              date: new Date(),
              description: 'تميز في المشاريع',
              reason: 'أداء ممتاز في مشروع النظام الجديد'
            },
            {
              id: 2,
              type: 'مكافأة حضور',
              amount: 300,
              date: new Date(),
              description: 'انتظام في الحضور',
              reason: 'عدم غياب لمدة 3 شهور'
            }
          ],
          deductions: []
        }
      },
      {
        name: 'فاطمة عبدالله الزهراني',
        employeeNumber: 'EMP002',
        email: 'fatima.alzahrani@company.com',
        phone: '+966502345678',
        position: 'محاسبة رئيسية',
        department: 'المالية',
        startDate: new Date('2022-08-20'),
        baseSalary: 7500,
        currentSalary: 7500,
        status: 'نشط',
        approvalStatus: 'approved',
        benefits: {
          transportationAllowance: 500,
          mealAllowance: 300,
          medicalInsurance: true,
          lifeInsurance: true
        },
        allowances: {
          transportation: 500,
          housing: 1000,
          meal: 300
        },
        deductions: {
          socialInsurance: 375,
          tax: 180
        },
        monthlyAdjustments: {
          bonuses: [
            {
              id: 3,
              type: 'مكافأة إنجاز',
              amount: 800,
              date: new Date(),
              description: 'إتمام التقارير المالية',
              reason: 'إنجاز التقارير في الوقت المحدد'
            }
          ],
          deductions: [
            {
              id: 4,
              type: 'خصم تأخير',
              amount: 200,
              date: new Date(),
              description: 'تأخير في الحضور',
              reason: 'تأخير 3 أيام في الشهر'
            }
          ]
        }
      },
      {
        name: 'خالد سعد النفيعي',
        employeeNumber: 'EMP003',
        email: 'khalid.alnafia@company.com',
        phone: '+966503456789',
        position: 'مدير موارد بشرية',
        department: 'الموارد البشرية',
        startDate: new Date('2021-03-10'),
        baseSalary: 9500,
        currentSalary: 9500,
        status: 'نشط',
        approvalStatus: 'approved',
        benefits: {
          transportationAllowance: 600,
          mealAllowance: 400,
          medicalInsurance: true,
          lifeInsurance: true
        },
        allowances: {
          transportation: 600,
          housing: 1500,
          meal: 400
        },
        deductions: {
          socialInsurance: 475,
          tax: 250
        },
        monthlyAdjustments: {
          bonuses: [
            {
              id: 5,
              type: 'مكافأة إدارية',
              amount: 2000,
              date: new Date(),
              description: 'تطوير السياسات',
              reason: 'تطوير وتحديث سياسات الموارد البشرية'
            },
            {
              id: 6,
              type: 'مكافأة قيادة',
              amount: 1500,
              date: new Date(),
              description: 'قيادة الفريق',
              reason: 'نجاح في إدارة وتطوير فريق العمل'
            }
          ],
          deductions: []
        }
      },
      {
        name: 'نورا عبدالعزيز القحطاني',
        employeeNumber: 'EMP004',
        email: 'nora.alqahtani@company.com',
        phone: '+966504567890',
        position: 'أخصائية مبيعات',
        department: 'المبيعات',
        startDate: new Date('2023-06-01'),
        baseSalary: 6000,
        currentSalary: 6000,
        status: 'نشط',
        approvalStatus: 'approved',
        benefits: {
          transportationAllowance: 400,
          mealAllowance: 250,
          medicalInsurance: true,
          lifeInsurance: true
        },
        allowances: {
          transportation: 400,
          housing: 800,
          meal: 250
        },
        deductions: {
          socialInsurance: 300,
          tax: 150
        },
        monthlyAdjustments: {
          bonuses: [
            {
              id: 7,
              type: 'عمولة مبيعات',
              amount: 1500,
              date: new Date(),
              description: 'تحقيق الهدف الشهري',
              reason: 'تحقيق 120% من الهدف المطلوب'
            },
            {
              id: 8,
              type: 'مكافأة عميل جديد',
              amount: 500,
              date: new Date(),
              description: 'جلب عملاء جدد',
              reason: 'إضافة 5 عملاء جدد في الشهر'
            }
          ],
          deductions: []
        }
      },
      {
        name: 'محمد عبدالرحمن الشهري',
        employeeNumber: 'EMP005',
        email: 'mohammed.alshehri@company.com',
        phone: '+966505678901',
        position: 'مطور واجهات أمامية',
        department: 'تقنية المعلومات',
        startDate: new Date('2023-02-15'),
        baseSalary: 7000,
        currentSalary: 7000,
        status: 'نشط',
        approvalStatus: 'approved',
        benefits: {
          transportationAllowance: 500,
          mealAllowance: 300,
          medicalInsurance: true,
          lifeInsurance: true
        },
        allowances: {
          transportation: 500,
          housing: 1000,
          meal: 300
        },
        deductions: {
          socialInsurance: 350,
          tax: 170
        },
        monthlyAdjustments: {
          bonuses: [
            {
              id: 9,
              type: 'مكافأة تطوير',
              amount: 600,
              date: new Date(),
              description: 'تطوير ميزات جديدة',
              reason: 'تطوير واجهات مستخدم مبتكرة'
            }
          ],
          deductions: [
            {
              id: 10,
              type: 'خصم إجازة',
              amount: 150,
              date: new Date(),
              description: 'إجازة بدون راتب',
              reason: 'يومين إجازة بدون راتب'
            }
          ]
        }
      },
      {
        name: 'سارة أحمد الغامدي',
        employeeNumber: 'EMP006',
        email: 'sarah.alghamdi@company.com',
        phone: '+966506789012',
        position: 'مصممة جرافيك',
        department: 'التسويق',
        startDate: new Date('2023-04-01'),
        baseSalary: 5500,
        currentSalary: 5500,
        status: 'نشط',
        approvalStatus: 'approved',
        benefits: {
          transportationAllowance: 400,
          mealAllowance: 250,
          medicalInsurance: true,
          lifeInsurance: true
        },
        allowances: {
          transportation: 400,
          housing: 700,
          meal: 250
        },
        deductions: {
          socialInsurance: 275,
          tax: 130
        },
        monthlyAdjustments: {
          bonuses: [],
          deductions: []
        }
      }
    ];

    // حفظ الموظفين
    const savedEmployees = [];
    for (const employeeData of employees) {
      const employee = new Employee(employeeData);
      const savedEmployee = await employee.save();
      savedEmployees.push(savedEmployee);
      console.log(`✅ تم إنشاء الموظف: ${employee.name} - الراتب الأساسي: ${employee.baseSalary} ريال`);
    }

    console.log('🎉 تم إضافة جميع بيانات الرواتب بنجاح!');
    console.log('\n📊 ملخص البيانات:');
    console.log(`- المستخدمين: 1 (admin)`);
    console.log(`- الموظفين: ${employees.length}`);
    console.log(`- إجمالي الرواتب الأساسية: ${employees.reduce((sum, emp) => sum + emp.baseSalary, 0)} ريال`);
    console.log('- الأقسام: تقنية المعلومات، المالية، الموارد البشرية، المبيعات، التسويق');
    
    console.log('\n💰 تفاصيل الرواتب:');
    employees.forEach(emp => {
      const netSalary = emp.baseSalary + 
        Object.values(emp.allowances).reduce((sum, val) => sum + val, 0) - 
        Object.values(emp.deductions).reduce((sum, val) => sum + val, 0) +
        emp.monthlyAdjustments.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0) -
        emp.monthlyAdjustments.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      
      console.log(`- ${emp.name}: ${netSalary} ريال صافي`);
    });
    
    console.log('\n🔐 بيانات الدخول:');
    console.log('اسم المستخدم: admin');
    console.log('كلمة المرور: admin123');

  } catch (error) {
    console.error('❌ خطأ في إضافة بيانات الرواتب:', error);
  }
};

module.exports = seedPayrollData; 