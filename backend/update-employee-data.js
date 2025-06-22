const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const User = require('./models/User');

// الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    const atlasUri = "mongodb+srv://hrsystem:jwXNDn8DnwxDnCbk@hr-system.veyoe3q.mongodb.net/hr-system";
    
    await mongoose.connect(atlasUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
};

// تحديث بيانات الموظف
const updateEmployeeData = async () => {
  try {
    // البحث عن المستخدم admin
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.log('❌ لم يتم العثور على المستخدم admin');
      return;
    }

    console.log('👤 تم العثور على المستخدم:', adminUser.username);

    // البحث عن سجل الموظف أو إنشاؤه
    let employee = await Employee.findOne({ userId: adminUser._id });
    
    if (!employee) {
      console.log('📝 إنشاء سجل موظف جديد...');
      employee = new Employee({ userId: adminUser._id });
    } else {
      console.log('🔄 تحديث سجل الموظف الموجود...');
    }

    // تحديث البيانات الشخصية بقيم حقيقية
    const updatedData = {
      employeeId: `EMP-2025-${Math.floor(Math.random() * 1000)}`,
      name: adminUser.name || adminUser.username || 'أحمد محمد علي',
      email: adminUser.email || 'ahmed.mohamed@company.com',
      phone: `010${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      department: 'تقنية المعلومات والتطوير',
      position: 'مطور برمجيات أول',
      directManager: 'محمد أحمد - مدير التطوير التقني',
      workLocation: 'مكتب القاهرة الرئيسي - الطابق الثالث - قسم التطوير',
      address: 'شارع التحرير، وسط البلد، القاهرة، جمهورية مصر العربية',
      joinDate: new Date('2023-03-15'),
      startDate: new Date('2023-03-15'),
      status: 'نشط',
      approvalStatus: 'approved',
      baseSalary: 12000,
      allowances: {
        transportation: 800,
        housing: 1500,
        meal: 300
      },
      deductions: {
        socialInsurance: 650,
        tax: 850
      },
      
      // إضافة طلبات حقيقية
      requests: [
        {
          type: 'إجازة سنوية',
          date: new Date('2024-06-01'),
          duration: '5 أيام',
          status: 'موافق عليها',
          description: 'إجازة صيفية مع العائلة',
          reason: 'إجازة مخططة مسبقاً',
          approvedBy: 'مدير الموارد البشرية',
          approvedAt: new Date('2024-06-02')
        },
        {
          type: 'إجازة مرضية',
          date: new Date('2024-05-20'),
          duration: '2 أيام',
          status: 'قيد المراجعة',
          description: 'إجازة مرضية طارئة',
          reason: 'حالة صحية مؤقتة'
        },
        {
          type: 'تعديل بيانات شخصية',
          date: new Date('2024-05-15'),
          status: 'مكتملة',
          description: 'تحديث رقم الهاتف والعنوان',
          approvedBy: 'مدير الموارد البشرية',
          approvedAt: new Date('2024-05-16')
        },
        {
          type: 'شهادة راتب',
          date: new Date('2024-05-10'),
          status: 'مكتملة',
          description: 'شهادة راتب للبنك الأهلي المصري',
          approvedBy: 'مدير الموارد البشرية',
          approvedAt: new Date('2024-05-11')
        }
      ],

      // إضافة إشعارات حقيقية
      notifications: [
        {
          title: 'تم صرف راتب شهر يونيو',
          message: 'تم تحويل راتب شهر يونيو 2024 بمبلغ 12,800 جنيه إلى حسابك البنكي',
          type: 'success',
          date: new Date(Date.now() - 10 * 60 * 1000), // منذ 10 دقائق
          read: false
        },
        {
          title: 'اجتماع فريق التطوير',
          message: 'اجتماع أسبوعي لفريق التطوير يوم الأحد الساعة 10:00 صباحاً في قاعة الاجتماعات الرئيسية',
          type: 'info',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // منذ ساعتين
          read: false
        },
        {
          title: 'تذكير: تقييم الأداء الربع سنوي',
          message: 'موعد تقييم الأداء للربع الثاني من 2024 يوم الخميس القادم. يرجى تحضير تقرير الإنجازات',
          type: 'warning',
          date: new Date(Date.now() - 5 * 60 * 60 * 1000), // منذ 5 ساعات
          read: true
        },
        {
          title: 'دورة تدريبية جديدة متاحة',
          message: 'دورة "React.js المتقدم وNext.js" متاحة الآن للتسجيل. المدة: 3 أسابيع',
          type: 'info',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // منذ يوم
          read: true
        }
      ],

      // معلومات إضافية
      skills: ['JavaScript', 'React.js', 'Node.js', 'MongoDB', 'Python', 'Git'],
      education: 'بكالوريوس هندسة حاسوبات - جامعة القاهرة',
      experience: '5 سنوات في تطوير تطبيقات الويب والهواتف المحمولة',
      maritalStatus: 'متزوج',
      emergencyContact: {
        name: 'فاطمة أحمد علي',
        phone: '01012345678',
        relation: 'الزوجة',
        address: 'نفس عنوان الموظف'
      },

      updatedAt: new Date()
    };

    // تطبيق التحديثات
    Object.assign(employee, updatedData);
    await employee.save();

    console.log('✅ تم تحديث بيانات الموظف بنجاح!');
    console.log('📋 البيانات المحدثة:');
    console.log(`   الاسم: ${employee.name}`);
    console.log(`   المنصب: ${employee.position}`);
    console.log(`   القسم: ${employee.department}`);
    console.log(`   المدير المباشر: ${employee.directManager}`);
    console.log(`   مكان العمل: ${employee.workLocation}`);
    console.log(`   العنوان: ${employee.address}`);
    console.log(`   عدد الطلبات: ${employee.requests.length}`);
    console.log(`   عدد الإشعارات: ${employee.notifications.length}`);

  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات الموظف:', error);
  }
};

// تشغيل التحديث
const runUpdate = async () => {
  await connectDB();
  await updateEmployeeData();
  await mongoose.disconnect();
  console.log('🔚 تم إنهاء العملية');
  process.exit(0);
};

runUpdate(); 