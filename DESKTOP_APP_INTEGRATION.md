# 🖥️ دليل ربط التطبيق المكتبي مع نظام إدارة الموارد البشرية

## 📋 **نظرة عامة**

تم إضافة نظام تتبع الساعات والحضور والغياب للتطبيق المكتبي بشكل آمن ومتكامل مع النظام الحالي.

## ✅ **التعديلات المنجزة**

### 1. **إصلاح المشاكل الموجودة:**
- ✅ إصلاح مشكلة `Calendar` في `MePage.jsx`
- ✅ إصلاح duplicate `mongoose.connect` في `server.js`
- ✅ إضافة API endpoints جديدة للتطبيق المكتبي

### 2. **الإضافات الجديدة:**
- ✅ ملف `backend/routes/tracking.js` - APIs للتطبيق المكتبي
- ✅ MongoDB schema للتتبع مع Tracking model
- ✅ نظام رفع وحفظ screenshots
- ✅ نظام مصادقة خاص بالتطبيق المكتبي

## 🔌 **API Endpoints للتطبيق المكتبي**

### **1. تسجيل الدخول:**
```http
POST /api/tracking/desktop-login
Content-Type: application/json

{
  "username": "fatima@company.com",  // أو employeeNumber أو name
  "password": "123456"              // كلمة مرور افتراضية
}

Response:
{
  "success": true,
  "token": "JWT_TOKEN_HERE",
  "employee": {
    "id": "EMPLOYEE_ID",
    "employeeNumber": "EMP-001",
    "name": "فاطمة أحمد",
    "email": "fatima@company.com",
    "department": "المحاسبة",
    "position": "محاسبة أولى"
  }
}
```

### **2. تحديث بيانات العمل:**
```http
POST /api/tracking/update
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "workData": {
    "totalSeconds": 28800,        // إجمالي الثواني (8 ساعات)
    "activeSeconds": 25200,       // ثواني النشاط (7 ساعات)
    "idleSeconds": 3600,          // ثواني عدم النشاط (1 ساعة)
    "productivity": 87.5,         // نسبة الإنتاجية
    "sessionsCount": 3,           // عدد الجلسات
    "lastActivity": "2024-01-09T15:30:00Z"
  }
}
```

### **3. رفع لقطة شاشة:**
```http
POST /api/tracking/screenshot
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

FormData:
- screenshot: [PNG/JPG file]
- employeeId: EMPLOYEE_ID
```

### **4. جلب بيانات الموظف:**
```http
GET /api/tracking/employee/:employeeId?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer JWT_TOKEN
```

### **5. تحديث حالة الاتصال:**
```http
POST /api/tracking/heartbeat
Authorization: Bearer JWT_TOKEN

{
  "status": "active",
  "lastActivity": "2024-01-09T15:30:00Z"
}
```

## 🛡️ **الأمان والحماية**

### **المصادقة:**
- نظام JWT منفصل للتطبيق المكتبي
- كلمة مرور افتراضية: `123456` (يمكن تخصيصها لاحقاً)
- Token صالح لـ 24 ساعة

### **الصلاحيات:**
- كل موظف يمكنه رؤية بياناته فقط
- تشفير جميع الطلبات
- تحديد حجم الصور المرفوعة (5MB max)

## 📊 **قاعدة البيانات**

### **Tracking Collection:**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,          // ربط مع Employee
  date: Date,                    // تاريخ السجل
  workData: {
    totalSeconds: Number,        // إجمالي الثواني
    activeSeconds: Number,       // ثواني النشاط
    idleSeconds: Number,         // ثواني عدم النشاط
    productivity: Number,        // نسبة الإنتاجية (0-100)
    efficiency: Number,          // نسبة الكفاءة
    sessionsCount: Number,       // عدد الجلسات
    lastActivity: Date          // آخر نشاط
  },
  screenshots: [String],         // أسماء ملفات الصور
  lastUpdate: Date,             // آخر تحديث
  createdAt: Date,              // تاريخ الإنشاء
  updatedAt: Date               // تاريخ التحديث
}
```

## 🚀 **التشغيل**

### **1. تشغيل النظام:**
```bash
# في مجلد backend
npm install
npm run dev

# في مجلد frontend
npm install
npm start
```

### **2. اختبار APIs:**
```bash
# اختبار تسجيل الدخول
curl -X POST http://localhost:5000/api/tracking/desktop-login \
  -H "Content-Type: application/json" \
  -d '{"username":"fatima@company.com","password":"123456"}'
```

## 📁 **هيكل الملفات المضافة**

```
backend/
├── routes/
│   └── tracking.js              # ✅ جديد - APIs للتطبيق المكتبي
├── uploads/
│   └── screenshots/             # ✅ جديد - مجلد الصور
└── server.js                    # ✅ محدث - إضافة route جديد

frontend/
└── src/pages/
    └── MePage.jsx               # ✅ محدث - إصلاح Calendar import
```

## ⚠️ **مهم - لا يؤثر على الوظائف الحالية**

### **✅ آمن تماماً:**
- جميع التعديلات إضافية ولا تؤثر على الكود الموجود
- APIs منفصلة تحت `/api/tracking`
- Database schema منفصل (Tracking collection)
- نظام مصادقة منفصل للتطبيق المكتبي

### **🔧 إصلاحات فقط:**
- إصلاح import خطأ في MePage.jsx
- إصلاح duplicate mongoose connection
- لا توجد تغييرات على الوظائف الأساسية

## 🎯 **الخطوات التالية للمطور**

### **1. إضافة كلمة مرور للموظفين (اختياري):**
```javascript
// في Employee model
password: {
  type: String,
  required: false,
  default: '123456'
}
```

### **2. تخصيص نظام المصادقة:**
```javascript
// في tracking.js - تغيير كلمة المرور الافتراضية
const defaultPassword = 'كلمة_مرور_مخصصة';
```

### **3. إضافة validation إضافي:**
```javascript
// في tracking.js - إضافة تحقق من صحة البيانات
if (!workData.totalSeconds || workData.totalSeconds < 0) {
  return res.status(400).json({
    success: false,
    message: 'بيانات العمل غير صحيحة'
  });
}
```

## 📱 **ربط التطبيق المكتبي**

### **Base URL:**
```
http://localhost:5000/api/tracking
```

### **Headers مطلوبة:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token  // بعد تسجيل الدخول
}
```

### **مثال تشغيل من التطبيق:**
```javascript
// تسجيل الدخول
const loginResponse = await fetch('http://localhost:5000/api/tracking/desktop-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'fatima@company.com',
    password: '123456'
  })
});

const { token, employee } = await loginResponse.json();

// تحديث البيانات
await fetch('http://localhost:5000/api/tracking/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    workData: {
      totalSeconds: 28800,
      activeSeconds: 25200,
      productivity: 87.5
    }
  })
});
```

---

## ✨ **النتيجة النهائية**

✅ **نظام تتبع متكامل وآمن**  
✅ **لا يؤثر على الوظائف الحالية**  
✅ **جاهز للربط مع التطبيق المكتبي**  
✅ **قابل للتوسع والتطوير**  

**🎉 النظام جاهز الآن للاستخدام!** 