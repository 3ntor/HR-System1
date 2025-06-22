# 🗄️ Database Schema - نظام الموارد البشرية

## 📊 **نظرة عامة**

النظام يستخدم **JSON Files** كقاعدة بيانات بسيطة. كل ملف يمثل جدول/مجموعة من البيانات.

```
backend/data/
├── employees.json          # بيانات الموظفين
├── transactions.json       # المعاملات المالية  
├── clients.json           # بيانات العملاء
├── categories.json        # فئات المعاملات
├── users.json             # مستخدمي النظام
├── settings.json          # إعدادات النظام
└── logs/
    └── logs.json          # سجلات النظام
```

---

## 👥 **Employees Schema**

```json
{
  "id": "emp_001",                          // معرف فريد للموظف
  "employeeNumber": "HR2024001",            // رقم الموظف
  "name": "أحمد محمد علي",                   // الاسم الكامل
  "email": "ahmed@company.com",             // البريد الإلكتروني
  "phone": "201234567890",                  // رقم الهاتف (بالصيغة المصرية)
  "department": "تقنية المعلومات",           // القسم
  "position": "مطور برمجيات أول",           // المنصب
  "salary": 12000,                          // الراتب الأساسي
  "startDate": "2024-01-15T00:00:00.000Z",  // تاريخ بداية العمل
  "endDate": null,                          // تاريخ انتهاء العمل (null إذا لم ينته)
  "status": "active",                       // الحالة: active, inactive, terminated
  "bankAccount": "123456789",               // رقم الحساب البنكي
  "nationalId": "12345678901234",           // الرقم القومي
  "address": "القاهرة، مصر",                 // العنوان
  "birthDate": "1990-05-15T00:00:00.000Z", // تاريخ الميلاد
  "gender": "male",                         // الجنس: male, female
  "maritalStatus": "married",               // الحالة الاجتماعية: single, married, divorced
  "emergencyContact": {                     // جهة الاتصال في الطوارئ
    "name": "فاطمة أحمد",
    "phone": "201234567891", 
    "relation": "زوجة",
    "address": "القاهرة، مصر"
  },
  "workSchedule": {                         // جدول العمل
    "startTime": "09:00",
    "endTime": "17:00",
    "workDays": ["sunday", "monday", "tuesday", "wednesday", "thursday"],
    "breakTime": "60"                       // وقت الاستراحة بالدقائق
  },
  "benefits": {                             // المزايا
    "medicalInsurance": true,
    "lifeInsurance": false,
    "transportationAllowance": 500,
    "mealAllowance": 300
  },
  "attendance": {                           // الحضور والانصراف
    "totalWorkingDays": 22,
    "presentDays": 20,
    "absentDays": 2,
    "lateDays": 1,
    "overtimeHours": 10
  },
  "documents": [                            // المستندات المرفقة
    "cv.pdf",
    "nationalId.pdf", 
    "bankStatement.pdf"
  ],
  "notes": "موظف مميز - أداء ممتاز",          // ملاحظات إضافية
  "createdBy": "admin",                     // منشئ السجل
  "createdAt": "2024-01-15T00:00:00.000Z",  // تاريخ الإنشاء
  "updatedBy": "admin",                     // آخر من عدل السجل
  "updatedAt": "2024-01-15T00:00:00.000Z"   // تاريخ آخر تحديث
}
```

---

## 💰 **Transactions Schema**

```json
{
  "id": "txn_001",                          // معرف فريد للمعاملة
  "transactionNumber": "TXN2024001",        // رقم المعاملة
  "type": "income",                         // نوع المعاملة: income, expense
  "amount": 5000,                           // المبلغ
  "currency": "EGP",                        // العملة (افتراضي: جنيه مصري)
  "description": "استشارة تقنية لشركة ABC",   // وصف المعاملة
  "category": "consulting",                 // فئة المعاملة
  "subcategory": "software_consulting",     // فئة فرعية
  "date": "2024-12-01T10:00:00.000Z",       // تاريخ المعاملة
  "dueDate": "2024-12-15T00:00:00.000Z",    // تاريخ الاستحقاق
  "status": "approved",                     // الحالة: pending, approved, rejected, paid
  "paymentMethod": "bank_transfer",         // طريقة الدفع
  "paymentStatus": "completed",             // حالة الدفع: pending, completed, failed
  "reference": "REF2024001",                // رقم مرجعي
  "invoice": {                              // بيانات الفاتورة
    "number": "INV2024001",
    "issueDate": "2024-12-01T00:00:00.000Z",
    "dueDate": "2024-12-15T00:00:00.000Z"
  },
  "clientId": "client_001",                 // معرف العميل (للمعاملات المرتبطة بعميل)
  "employeeId": "emp_001",                  // معرف الموظف (للمصروفات المرتبطة بموظف)
  "projectId": "proj_001",                  // معرف المشروع
  "departmentId": "dept_001",               // معرف القسم
  "tags": ["urgent", "recurring"],         // علامات للتصنيف
  "attachments": [                          // المرفقات
    "invoice_001.pdf",
    "receipt_001.jpg"
  ],
  "approvalHistory": [                      // تاريخ الموافقات
    {
      "action": "approved",
      "by": "admin",
      "date": "2024-12-01T11:00:00.000Z",
      "comment": "موافق عليها"
    }
  ],
  "tax": {                                  // الضرائب
    "rate": 14,                             // معدل الضريبة %
    "amount": 700,                          // مبلغ الضريبة
    "included": false                       // هل الضريبة مشمولة في المبلغ
  },
  "recurring": {                            // المعاملات المتكررة
    "isRecurring": false,
    "frequency": "monthly",                 // daily, weekly, monthly, yearly
    "nextDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T00:00:00.000Z"
  },
  "notes": "دفعة أولى من المشروع",            // ملاحظات
  "createdBy": "admin",                     // منشئ المعاملة
  "createdAt": "2024-12-01T10:00:00.000Z",  // تاريخ الإنشاء
  "updatedBy": "admin",                     // آخر من عدل المعاملة
  "updatedAt": "2024-12-01T10:00:00.000Z",  // تاريخ آخر تحديث
  "approvedBy": "admin",                    // من وافق على المعاملة
  "approvedAt": "2024-12-01T11:00:00.000Z"  // تاريخ الموافقة
}
```

---

## 🤝 **Clients Schema**

```json
{
  "id": "client_001",                       // معرف فريد للعميل
  "clientNumber": "CLT2024001",             // رقم العميل
  "name": "شركة التكنولوجيا المتقدمة",       // اسم العميل
  "company": "Advanced Tech Solutions",     // اسم الشركة
  "email": "info@techadvanced.com",         // البريد الإلكتروني
  "phone": "201234567890",                  // رقم الهاتف
  "alternativePhone": "201234567899",       // رقم هاتف بديل
  "website": "https://techadvanced.com",    // الموقع الإلكتروني
  "industry": "تكنولوجيا المعلومات",        // المجال
  "address": {                              // العنوان التفصيلي
    "street": "شارع النيل، الزمالك",
    "city": "القاهرة",
    "governorate": "القاهرة",
    "country": "مصر",
    "postalCode": "11211"
  },
  "contactPerson": {                        // الشخص المسؤول
    "name": "محمد أحمد الديب",
    "position": "مدير التقنية",
    "email": "mohamed@techadvanced.com",
    "phone": "201234567891"
  },
  "financialInfo": {                        // المعلومات المالية
    "creditLimit": 100000,                 // الحد الائتماني
    "paymentTerms": "30",                   // مدة الدفع (أيام)
    "taxNumber": "123456789",               // الرقم الضريبي
    "currency": "EGP"                       // العملة المفضلة
  },
  "businessInfo": {                         // معلومات العمل
    "foundedYear": 2015,
    "employeeCount": 50,
    "annualRevenue": 5000000,
    "businessType": "شركة مساهمة"
  },
  "totalProjects": 5,                       // إجمالي المشاريع
  "activeProjects": 2,                      // المشاريع النشطة
  "completedProjects": 3,                   // المشاريع المكتملة
  "totalPayments": 75000,                   // إجمالي المدفوعات
  "outstandingPayments": 15000,             // المدفوعات المعلقة
  "lastPaymentDate": "2024-11-01T00:00:00.000Z", // آخر دفعة
  "status": "active",                       // الحالة: active, inactive, blacklisted
  "priority": "high",                       // الأولوية: low, medium, high
  "source": "website",                      // مصدر العميل: website, referral, social, other
  "contractStartDate": "2024-01-01T00:00:00.000Z", // تاريخ بداية التعاقد
  "contractEndDate": "2024-12-31T00:00:00.000Z",   // تاريخ انتهاء التعاقد
  "documents": [                            // المستندات
    "contract.pdf",
    "tax_certificate.pdf"
  ],
  "notes": "عميل مميز - أولوية عالية",        // ملاحظات
  "tags": ["vip", "tech", "long_term"],     // علامات
  "socialMedia": {                          // وسائل التواصل الاجتماعي
    "facebook": "https://facebook.com/techadvanced",
    "linkedin": "https://linkedin.com/company/techadvanced",
    "twitter": "@techadvanced"
  },
  "createdBy": "admin",                     // منشئ السجل
  "createdAt": "2024-01-01T00:00:00.000Z",  // تاريخ الإنشاء
  "updatedBy": "admin",                     // آخر من عدل السجل
  "updatedAt": "2024-11-01T00:00:00.000Z"   // تاريخ آخر تحديث
}
```

---

## 📂 **Categories Schema**

```json
{
  "id": "cat_001",                          // معرف فريد للفئة
  "name": "استشارات تقنية",                 // اسم الفئة
  "nameEn": "Technical Consulting",         // الاسم بالإنجليزية
  "type": "income",                         // نوع الفئة: income, expense, both
  "description": "خدمات الاستشارات التقنية والبرمجية", // وصف الفئة
  "color": "#3B82F6",                       // لون الفئة (hex)
  "icon": "💻",                            // أيقونة الفئة
  "parentId": null,                         // معرف الفئة الأب (للفئات الفرعية)
  "subcategories": [                        // الفئات الفرعية
    {
      "id": "subcat_001",
      "name": "استشارات البرمجيات",
      "nameEn": "Software Consulting"
    },
    {
      "id": "subcat_002", 
      "name": "استشارات قواعد البيانات",
      "nameEn": "Database Consulting"
    }
  ],
  "budgetLimit": 50000,                     // حد الميزانية الشهرية
  "isActive": true,                         // هل الفئة نشطة
  "sortOrder": 1,                           // ترتيب العرض
  "defaultTaxRate": 14,                     // معدل الضريبة الافتراضي
  "accountingCode": "4001",                 // كود المحاسبة
  "tags": ["consulting", "technical"],      // علامات
  "createdBy": "admin",                     // منشئ الفئة
  "createdAt": "2024-01-01T00:00:00.000Z",  // تاريخ الإنشاء
  "updatedBy": "admin",                     // آخر من عدل الفئة
  "updatedAt": "2024-01-01T00:00:00.000Z"   // تاريخ آخر تحديث
}
```

---

## 👤 **Users Schema**

```json
{
  "id": "user_001",                         // معرف فريد للمستخدم
  "username": "admin",                      // اسم المستخدم
  "email": "admin@company.com",             // البريد الإلكتروني
  "password": "$2b$10$...",                 // كلمة المرور المشفرة
  "role": "admin",                          // الدور: admin, manager, employee, accountant
  "status": "active",                       // الحالة: active, inactive, suspended
  "permissions": [                          // الصلاحيات
    "transactions.read",
    "transactions.create", 
    "transactions.update",
    "transactions.delete",
    "employees.read",
    "employees.create"
  ],
  "employeeId": null,                       // معرف الموظف (إذا كان موظفاً)
  "profile": {                              // الملف الشخصي
    "firstName": "أحمد",
    "lastName": "محمد",
    "avatar": "avatar_admin.jpg",
    "phone": "201234567890",
    "language": "ar",                       // اللغة المفضلة: ar, en
    "timezone": "Africa/Cairo",
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  },
  "security": {                             // الأمان
    "lastLogin": "2024-12-01T10:00:00.000Z",
    "lastLoginIP": "192.168.1.100",
    "loginAttempts": 0,
    "isLocked": false,
    "lockUntil": null,
    "passwordChangedAt": "2024-01-01T00:00:00.000Z",
    "mustChangePassword": false,
    "twoFactorEnabled": false
  },
  "preferences": {                          // التفضيلات
    "theme": "light",                       // dark, light, auto
    "notifications": {
      "email": true,
      "sms": false,
      "whatsapp": true,
      "inApp": true
    },
    "dashboard": {
      "defaultView": "overview",
      "autoRefresh": true,
      "refreshInterval": 30                 // ثواني
    }
  },
  "sessions": [                             // الجلسات النشطة
    {
      "id": "session_001",
      "token": "jwt_token_here",
      "device": "Chrome on Windows",
      "ip": "192.168.1.100",
      "startedAt": "2024-12-01T10:00:00.000Z",
      "lastActiveAt": "2024-12-01T14:30:00.000Z"
    }
  ],
  "createdBy": "system",                    // منشئ المستخدم
  "createdAt": "2024-01-01T00:00:00.000Z",  // تاريخ الإنشاء
  "updatedBy": "admin",                     // آخر من عدل المستخدم
  "updatedAt": "2024-01-01T00:00:00.000Z"   // تاريخ آخر تحديث
}
```

---

## ⚙️ **Settings Schema**

```json
{
  "id": "settings_001",                     // معرف الإعدادات
  "category": "general",                    // فئة الإعدادات: general, financial, whatsapp, security
  "settings": {
    "companyInfo": {                        // معلومات الشركة
      "name": "شركة الموارد البشرية المتقدمة",
      "nameEn": "Advanced HR Solutions",
      "logo": "company_logo.png",
      "address": "القاهرة، مصر",
      "phone": "201234567890",
      "email": "info@company.com",
      "website": "https://company.com",
      "taxNumber": "123456789",
      "commercialRegister": "987654321"
    },
    "financial": {                          // الإعدادات المالية
      "defaultCurrency": "EGP",
      "taxRate": 14,
      "fiscalYearStart": "01-01",           // MM-DD
      "invoicePrefix": "INV",
      "receiptPrefix": "REC",
      "paymentTerms": 30,                   // أيام
      "autoApprovalLimit": 1000             // حد الموافقة التلقائية
    },
    "whatsapp": {                           // إعدادات WhatsApp
      "isEnabled": true,
      "autoSendSalaryNotifications": true,
      "autoSendReminderNotifications": true,
      "messageTemplates": {
        "salaryNotification": "مرحباً {name}، تم إيداع راتبك الشهري بمبلغ {amount} جنيه",
        "reminder": "تذكير: {message}",
        "welcome": "مرحباً بك في شركتنا، {name}"
      }
    },
    "notifications": {                      // إعدادات الإشعارات
      "emailEnabled": true,
      "smsEnabled": false,
      "whatsappEnabled": true,
      "inAppEnabled": true,
      "reminderDays": [1, 3, 7]             // أيام التذكير قبل الاستحقاق
    },
    "security": {                           // إعدادات الأمان
      "passwordMinLength": 8,
      "passwordRequireNumbers": true,
      "passwordRequireSymbols": true,
      "sessionTimeout": 480,                // دقائق
      "maxLoginAttempts": 5,
      "lockoutDuration": 30                 // دقائق
    },
    "system": {                             // إعدادات النظام
      "maintenanceMode": false,
      "autoBackup": true,
      "backupFrequency": "daily",           // daily, weekly, monthly
      "logRetentionDays": 90,
      "defaultLanguage": "ar",
      "defaultTimezone": "Africa/Cairo"
    }
  },
  "createdBy": "admin",                     // منشئ الإعدادات
  "createdAt": "2024-01-01T00:00:00.000Z",  // تاريخ الإنشاء
  "updatedBy": "admin",                     // آخر من عدل الإعدادات
  "updatedAt": "2024-01-01T00:00:00.000Z"   // تاريخ آخر تحديث
}
```

---

## 📋 **Logs Schema**

```json
{
  "id": "log_001",                          // معرف فريد للسجل
  "timestamp": "2024-12-01T10:00:00.000Z",  // وقت الحدث
  "level": "info",                          // مستوى السجل: debug, info, warn, error, fatal
  "action": "user_login",                   // نوع العملية
  "category": "authentication",             // فئة السجل: auth, transaction, system, whatsapp
  "user": "admin",                          // المستخدم
  "userId": "user_001",                     // معرف المستخدم
  "details": "تسجيل دخول ناجح",             // تفاصيل العملية
  "metadata": {                             // بيانات إضافية
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "device": "Chrome on Windows",
    "location": "Cairo, Egypt",
    "sessionId": "session_001"
  },
  "resource": {                             // المورد المتأثر
    "type": "user",                         // نوع المورد
    "id": "user_001",                       // معرف المورد
    "name": "admin"                         // اسم المورد
  },
  "changes": {                              // التغييرات (للعمليات التي تغير البيانات)
    "before": {
      "status": "inactive"
    },
    "after": {
      "status": "active"
    }
  },
  "result": "success",                      // نتيجة العملية: success, failure, partial
  "errorCode": null,                        // كود الخطأ (إن وجد)
  "errorMessage": null,                     // رسالة الخطأ (إن وجد)
  "duration": 150,                          // مدة العملية (ميلي ثانية)
  "tags": ["login", "success"],             // علامات للتصنيف
  "severity": "low",                        // درجة الأهمية: low, medium, high, critical
  "isSystemGenerated": true,                // هل السجل مولد تلقائياً
  "correlationId": "req_001"                // معرف الربط (لربط السجلات المترابطة)
}
```

---

## 🔗 **Relationships (العلاقات)**

### **العلاقات بين الجداول:**

1. **Employees ↔ Users**
   ```json
   // في Users
   "employeeId": "emp_001"
   
   // في Employees  
   "userId": "user_001"
   ```

2. **Transactions ↔ Clients**
   ```json
   // في Transactions
   "clientId": "client_001"
   ```

3. **Transactions ↔ Employees**
   ```json
   // في Transactions
   "employeeId": "emp_001"
   ```

4. **Transactions ↔ Categories**
   ```json
   // في Transactions
   "category": "consulting",
   "subcategory": "software_consulting"
   ```

5. **Logs ↔ Users**
   ```json
   // في Logs
   "userId": "user_001",
   "user": "admin"
   ```

---

## 📊 **Indexes (فهارس للبحث السريع)**

### **للبحث السريع، يمكن إنشاء فهارس في الذاكرة:**

```javascript
// فهارس مقترحة
const indexes = {
  employees: {
    byDepartment: new Map(),
    byStatus: new Map(),
    byEmail: new Map(),
    byPhone: new Map()
  },
  transactions: {
    byType: new Map(),
    byStatus: new Map(),
    byClient: new Map(),
    byDate: new Map(),
    byCategory: new Map()
  },
  clients: {
    byStatus: new Map(),
    byIndustry: new Map(),
    byEmail: new Map()
  },
  logs: {
    byUser: new Map(),
    byAction: new Map(),
    byDate: new Map(),
    byLevel: new Map()
  }
};
```

---

## 💾 **Backup Strategy**

### **استراتيجية النسخ الاحتياطي:**

```json
{
  "backupSchedule": {
    "frequency": "daily",
    "time": "02:00",
    "retention": {
      "daily": 7,
      "weekly": 4, 
      "monthly": 12
    }
  },
  "backupLocation": "./backups/",
  "compression": true,
  "encryption": false
}
```

---

## 🔧 **Data Validation Rules**

### **قواعد التحقق من البيانات:**

```javascript
// Employee Validation
const employeeValidation = {
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, format: "email", unique: true },
  phone: { required: true, format: "phone", unique: true },
  salary: { required: true, type: "number", min: 0 },
  nationalId: { required: true, length: 14, unique: true },
  department: { required: true, enum: ["IT", "HR", "Finance", "Marketing"] }
};

// Transaction Validation  
const transactionValidation = {
  amount: { required: true, type: "number", min: 0.01 },
  type: { required: true, enum: ["income", "expense"] },
  description: { required: true, minLength: 3, maxLength: 500 },
  category: { required: true },
  date: { required: true, format: "ISO8601" }
};
```

---

**📝 ملاحظة**: هذا Schema قابل للتطوير والتوسع حسب احتياجات المشروع المستقبلية 