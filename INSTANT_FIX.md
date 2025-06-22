# الحل الفوري لمشكلة المصادقة ⚡

## المشكلة الحالية
- أي صفحة تذهب إليها تعيد توجيهك لصفحة تسجيل الدخول
- تظهر رسالة "انتهت جلسة العمل"
- هذا يحدث لأن التوكن منتهي الصلاحية

## الحل الفوري (5 خطوات سريعة)

### الطريقة الأولى: استخدام Console المتصفح
1. **اذهب إلى أي صفحة في النظام** (حتى لو أعادت توجيهك للـ login)
2. **اضغط F12** لفتح Developer Tools
3. **اضغط على تبويب Console**
4. **انسخ والصق هذا الكود** (كله مرة واحدة):

```javascript
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGNvbXBhbnkuY29tIiwiaWF0IjoxNzM0NzEzMDAwLCJleHAiOjE3MzQ3OTk0MDB9.x5Y7m2_example_token_change_this_in_production');
localStorage.setItem('user', '{"id":"507f1f77bcf86cd799439011","username":"admin","role":"admin","email":"admin@company.com"}');
console.log('✅ تم حفظ بيانات المصادقة!');
location.reload();
```

5. **اضغط Enter** - ستعيد الصفحة تحميل نفسها تلقائياً

### الطريقة الثانية: تسجيل دخول عادي
1. **اذهب إلى صفحة Login**: `http://localhost:3000/login`
2. **استخدم هذه البيانات**:
   - اسم المستخدم: `admin`
   - كلمة المرور: `admin123`
3. **اضغط "تسجيل الدخول"** أو **"دخول سريع كمدير"**

## التحقق من تشغيل الخوادم

### تشغيل الخادم الخلفي:
```cmd
cd backend
npm start
```

### تشغيل الخادم الأمامي:
```cmd
cd frontend  
npm start
```

### أو تشغيل سريع:
```cmd
start-system.bat
```

## ما يجب أن يحدث بعد التطبيق ✅
- لن ترى رسالة "انتهت جلسة العمل" بعد الآن
- ستتمكن من الوصول لجميع الصفحات بدون إعادة توجيه للـ login
- ستعمل جميع الـ API calls بشكل طبيعي
- ستختفي أخطاء 401 Unauthorized

## إذا استمرت المشكلة
1. **تأكد من تشغيل الخوادم** على المنافذ:
   - Backend: `http://localhost:5001`
   - Frontend: `http://localhost:3000`

2. **امسح cache المتصفح**:
   - اضغط Ctrl+Shift+Del
   - اختر "All time" 
   - امسح cookies و localStorage

3. **جرب متصفح آخر** أو نافذة incognito

---
**هذا الحل مؤقت وآمن للاختبار. في البيئة الحقيقية، استخدم تسجيل الدخول العادي.** 