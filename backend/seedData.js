const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// البيانات التجريبية
const seedData = async () => {
  try {
    console.log('🌱 بدء إضافة البيانات التجريبية...');

    // حذف البيانات الموجودة (اختياري)
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

    // إنشاء موظفين تجريبيين
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
        status: 'نشط',
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
              description: 'تميز في المشاريع'
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
        status: 'نشط',
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
          bonuses: [],
          deductions: [
            {
              id: 2,
              type: 'خصم تأخير',
              amount: 200,
              date: new Date(),
              description: 'تأخير 3 أيام'
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
        status: 'نشط',
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
              id: 3,
              type: 'مكافأة إدارية',
              amount: 2000,
              date: new Date(),
              description: 'تطوير السياسات'
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
        status: 'نشط',
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
              id: 4,
              type: 'عمولة مبيعات',
              amount: 1500,
              date: new Date(),
              description: 'تحقيق الهدف الشهري'
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
        status: 'نشط',
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
          bonuses: [],
          deductions: []
        }
      }
    ];

    // حفظ الموظفين
    for (const employeeData of employees) {
      const employee = new Employee(employeeData);
      await employee.save();
      console.log(`✅ تم إنشاء الموظف: ${employee.name}`);
    }

    console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
    console.log('\n📊 ملخص البيانات:');
    console.log(`- المستخدمين: 1 (admin)`);
    console.log(`- الموظفين: ${employees.length}`);
    console.log(`- الأقسام: تقنية المعلومات، المالية، الموارد البشرية، المبيعات`);
    console.log('\n🔐 بيانات الدخول:');
    console.log('اسم المستخدم: admin');
    console.log('كلمة المرور: admin123');

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات التجريبية:', error);
  }
};

module.exports = seedData; 