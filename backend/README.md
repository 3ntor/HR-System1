# نظام إدارة الموارد البشرية

## نظرة عامة
هذا المشروع هو نظام متكامل لإدارة الموارد البشرية، يتضمن إدارة الموظفين، الرواتب، الحضور والانصراف، والاتصال عبر WhatsApp.

## المميزات الرئيسية
1. **إدارة الموظفين**
   - تسجيل بيانات الموظفين
   - تتبع ساعات العمل
   - حساب الرواتب
   - إدارة الإجازات

2. **نظام الرواتب**
   - حساب الراتب الأساسي
   - حساب البدلات والعلاوات
   - حساب الخصومات
   - تتبع المدفوعات

3. **نظام الحضور والانصراف**
   - تسجيل الحضور والانصراف
   - تتبع ساعات العمل الإضافي
   - تقارير الحضور

4. **التواصل عبر WhatsApp**
   - إرسال إشعارات للموظفين
   - إرسال تقارير الرواتب
   - إرسال تنبيهات الحضور

## التقنيات المستخدمة
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **WhatsApp Integration**: whatsapp-web.js
- **File Upload**: Multer

## هيكل المشروع
```
backend/
├── config/         # ملفات الإعداد
├── data/          # بيانات النظام
├── managers/      # مديري النظام (مثل WhatsApp)
├── middleware/    # وسائط Express
├── models/        # نماذج MongoDB
├── routes/        # مسارات API
├── tests/         # اختبارات
├── uploads/       # الملفات المرفوعة
└── utils/         # أدوات مساعدة
```

## الإعداد والتشغيل

### المتطلبات
- Node.js
- MongoDB
- Chrome (لـ WhatsApp Web)

### تثبيت الاعتمادات
```bash
npm install
```

### إعداد ملف البيئة
إنشاء ملف `.env` في المجلد الرئيسي:
```
# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=.wwebjs_auth
WHATSAPP_CACHE_PATH=.wwebjs_cache
```

### تشغيل المشروع
```bash
# وضع التطوير
npm run dev

# وضع الإنتاج
npm start
```

## API Endpoints

### الموظفين
- `GET /api/employees` - قائمة الموظفين
- `POST /api/employees` - إضافة موظف جديد
- `GET /api/employees/:id` - بيانات موظف محدد
- `PUT /api/employees/:id` - تحديث بيانات موظف
- `DELETE /api/employees/:id` - حذف موظف

### الرواتب
- `GET /api/salaries` - قائمة الرواتب
- `POST /api/salaries` - إضافة راتب جديد
- `GET /api/salaries/:id` - تفاصيل راتب محدد
- `PUT /api/salaries/:id` - تحديث راتب

### الحضور والانصراف
- `GET /api/attendance` - سجل الحضور
- `POST /api/attendance` - تسجيل حضور/انصراف
- `GET /api/attendance/:id` - سجل حضور موظف محدد

### WhatsApp
- `POST /api/whatsapp/send` - إرسال رسالة
- `GET /api/whatsapp/status` - حالة الاتصال

## الأمان
- استخدام JWT للمصادقة
- تشفير كلمات المرور
- حماية المسارات
- التحقق من الصلاحيات

## التطوير المستقبلي
1. إضافة واجهة مستخدم
2. دعم المزيد من منصات التواصل
3. تحسين نظام التقارير
4. إضافة نظام إدارة الإجازات
5. دعم اللغات المتعددة

## المساهمة
نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:
1. Fork المشروع
2. إنشاء فرع جديد
3. إجراء التغييرات
4. إرسال Pull Request

## الترخيص
هذا المشروع مرخص تحت رخصة MIT. 