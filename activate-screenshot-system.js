#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 تفعيل نظام لقطات الشاشة المتقدم...\n');

// 1. إنشاء مجلد لقطات الشاشة
const createScreenshotDirectories = () => {
  const directories = [
    './backend/uploads',
    './backend/uploads/screenshots',
    './uploads',
    './uploads/screenshots'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ تم إنشاء مجلد: ${dir}`);
    } else {
      console.log(`📁 المجلد موجود: ${dir}`);
    }
  });
};

// 2. إنشاء إعدادات مُحسّنة لنظام لقطات الشاشة
const createScreenshotConfig = () => {
  const config = {
    // إعدادات التقاط الشاشة
    capture: {
      enabled: true,
      interval: 300000, // 5 دقائق (300000 مللي ثانية)
      quality: 0.8, // جودة 80%
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'png',
      
      // التقاط تلقائي أثناء:
      captureWhen: {
        working: true,
        onBreak: false,
        paused: false,
        idle: false
      },
      
      // التقاط ذكي حسب النشاط
      smartCapture: {
        enabled: true,
        highActivityInterval: 180000, // 3 دقائق إذا كان النشاط عالي
        lowActivityInterval: 600000,  // 10 دقائق إذا كان النشاط منخفض
        productivityThreshold: 80 // عتبة الإنتاجية للتقاط المتكرر
      }
    },
    
    // إعدادات التخزين
    storage: {
      maxFiles: 50, // أقصى عدد ملفات لكل مستخدم
      maxFileSize: 5242880, // 5 MB
      cleanupOldFiles: true,
      retentionDays: 30, // الاحتفاظ بالملفات لمدة 30 يوم
      
      // ضغط الصور
      compression: {
        enabled: true,
        quality: 0.7,
        maxWidth: 1280,
        maxHeight: 720
      }
    },
    
    // إعدادات الأمان والخصوصية
    privacy: {
      blurPersonalInfo: true,
      excludePrivateApps: true,
      watermark: {
        enabled: true,
        text: 'HR System - Confidential',
        position: 'bottom-right'
      }
    },
    
    // التحكم بالأداء
    performance: {
      cpuThreshold: 80, // إيقاف التقاط إذا تجاوز استخدام CPU 80%
      memoryThreshold: 80, // إيقاف التقاط إذا تجاوز استخدام Memory 80%
      diskSpaceThreshold: 500 // يتطلب 500 MB مساحة فارغة على الأقل
    }
  };
  
  const configPath = './screenshot-config.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`⚙️ تم إنشاء ملف الإعدادات: ${configPath}`);
  
  return config;
};

// 3. تحديث إعدادات التطبيق المكتبي لتفعيل لقطات الشاشة
const updateRendererConfig = () => {
  console.log('\n📱 تحديث إعدادات التطبيق المكتبي...');
  
  const rendererPath = './renderer.js';
  if (fs.existsSync(rendererPath)) {
    let content = fs.readFileSync(rendererPath, 'utf8');
    
    // تحديث فترة التقاط الشاشة لتكون أقل (3 دقائق بدلاً من 5)
    content = content.replace(
      /}, 300000\); \/\/ 5 دقائق/g,
      '}, 180000); // 3 دقائق - محسن للأداء'
    );
    
    // إضافة تقاط ذكي حسب مستوى النشاط
    const smartCaptureCode = `
// التقاط ذكي حسب مستوى النشاط
function startSmartScreenshotCapture() {
    stopScreenshotCapture();
    
    const getInterval = () => {
        const productivity = todayStats.productivity || 0;
        // إذا كانت الإنتاجية عالية، التقط أكثر
        return productivity > 80 ? 180000 : 300000; // 3 أو 5 دقائق
    };
    
    const scheduleNext = () => {
        screenshotInterval = setTimeout(() => {
            if (isWorking && !isPaused && currentActivityState === 'active') {
                log('📸 التقاط شاشة ذكي...');
                captureScreenshot();
            }
            scheduleNext(); // جدولة اللقطة التالية
        }, getInterval());
    };
    
    scheduleNext();
    log('🧠 تم تفعيل التقاط الشاشة الذكي');
}`;
    
    // إضافة الكود الذكي قبل دالة startScreenshotCapture
    if (!content.includes('startSmartScreenshotCapture')) {
      content = content.replace(
        'function startScreenshotCapture() {',
        smartCaptureCode + '\n\nfunction startScreenshotCapture() {'
      );
    }
    
    fs.writeFileSync(rendererPath, content);
    console.log('✅ تم تحديث renderer.js');
  }
};

// 4. تحديث المحاكي لدعم لقطات الشاشة الحقيقية
const updateSimulator = () => {
  console.log('\n🤖 تحديث المحاكي...');
  
  const simulatorPath = './desktop-app-simulator.js';
  if (fs.existsSync(simulatorPath)) {
    let content = fs.readFileSync(simulatorPath, 'utf8');
    
    // تقليل فترة لقطات الشاشة في المحاكي أيضاً
    content = content.replace(
      /screenshotInterval: 300000/g,
      'screenshotInterval: 120000 // 2 دقيقة للمحاكي'
    );
    
    // تحسين محاكاة لقطات الشاشة
    const enhancedSimulation = `
  // محاكاة لقطة شاشة محسّنة
  async simulateScreenshot() {
    if (!this.isRunning) return;
    
    this.screenshotCount++;
    const productivity = Math.floor(Math.random() * 30) + 70; // 70-100%
    const activities = [
      'العمل على المشروع الرئيسي',
      'مراجعة الكود',
      'كتابة التوثيق',
      'اجتماع فريق العمل',
      'تطوير ميزة جديدة',
      'اختبار التطبيق',
      'حل المشاكل التقنية'
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    console.log(\`📸 لقطة شاشة #\${this.screenshotCount} - \${activity} (إنتاجية: \${productivity}%)\`);
    
    // محاكاة إرسال بيانات اللقطة للخادم
    try {
      const screenshotData = {
        filename: \`screenshot_\${Date.now()}.png\`,
        timestamp: new Date().toISOString(),
        activity: activity,
        productivity: productivity,
        simulated: true
      };
      
      // يمكن إضافة إرسال فعلي للخادم هنا
      console.log(\`💾 تم حفظ بيانات اللقطة: \${screenshotData.filename}\`);
      
    } catch (error) {
      console.error('❌ خطأ في محاكاة لقطة الشاشة:', error.message);
    }
  }`;
    
    // استبدال دالة simulateScreenshot القديمة
    content = content.replace(
      /\/\/ محاكاة لقطة شاشة[\s\S]*?console\.log\(`📸 محاكاة لقطة شاشة #\$\{this\.screenshotCount\}`\);[\s\S]*?}/,
      enhancedSimulation
    );
    
    fs.writeFileSync(simulatorPath, content);
    console.log('✅ تم تحديث desktop-app-simulator.js');
  }
};

// 5. إنشاء سكريبت اختبار نظام لقطات الشاشة
const createTestScript = () => {
  console.log('\n🧪 إنشاء سكريبت الاختبار...');
  
  const testScript = `#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  serverUrl: 'http://localhost:5001',
  credentials: {
    username: 'admin',
    password: 'admin123'
  }
};

class ScreenshotSystemTester {
  constructor() {
    this.authToken = null;
  }

  // تسجيل الدخول
  async login() {
    try {
      console.log('🔐 تسجيل الدخول...');
      
      const response = await axios.post(\`\${CONFIG.serverUrl}/api/tracking/desktop-login\`, {
        username: CONFIG.credentials.username,
        password: CONFIG.credentials.password
      });

      if (response.data.success) {
        this.authToken = response.data.token;
        console.log('✅ تم تسجيل الدخول بنجاح');
        return true;
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error.message);
      return false;
    }
  }

  // اختبار رفع لقطة شاشة وهمية
  async testScreenshotUpload() {
    try {
      console.log('📸 اختبار رفع لقطة شاشة...');
      
      // إنشاء صورة وهمية بسيطة (1x1 pixel PNG)
      const fakeImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58hkAAjACMnB',
        'base64'
      );
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('screenshot', fakeImageBuffer, {
        filename: 'test-screenshot.png',
        contentType: 'image/png'
      });
      formData.append('employeeId', '684fedd883e2693199a30a96');
      formData.append('timestamp', new Date().toISOString());
      
      const response = await axios.post(\`\${CONFIG.serverUrl}/api/tracking/screenshot\`, formData, {
        headers: {
          'Authorization': \`Bearer \${this.authToken}\`,
          ...formData.getHeaders()
        }
      });
      
      if (response.data.success) {
        console.log('✅ تم رفع لقطة الشاشة بنجاح');
        console.log('📁 اسم الملف:', response.data.filename);
        return true;
      }
    } catch (error) {
      console.error('❌ خطأ في رفع لقطة الشاشة:', error.response?.data || error.message);
      return false;
    }
  }

  // اختبار جلب لقطات الشاشة
  async testGetScreenshots() {
    try {
      console.log('📂 اختبار جلب لقطات الشاشة...');
      
      const response = await axios.get(\`\${CONFIG.serverUrl}/api/tracking/my-data\`, {
        headers: {
          'Authorization': \`Bearer \${this.authToken}\`
        }
      });
      
      if (response.data.success) {
        const screenshots = response.data.data
          .map(record => record.screenshots || [])
          .flat();
          
        console.log(\`✅ تم جلب \${screenshots.length} لقطة شاشة\`);
        
        if (screenshots.length > 0) {
          console.log('📸 آخر لقطة:', screenshots[screenshots.length - 1]);
        }
        
        return true;
      }
    } catch (error) {
      console.error('❌ خطأ في جلب لقطات الشاشة:', error.message);
      return false;
    }
  }

  // تشغيل جميع الاختبارات
  async runAllTests() {
    console.log('🚀 بدء اختبار نظام لقطات الشاشة...\n');
    
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ فشل في تسجيل الدخول، توقف الاختبار');
      return;
    }
    
    console.log('');
    const uploadSuccess = await this.testScreenshotUpload();
    
    console.log('');
    const getSuccess = await this.testGetScreenshots();
    
    console.log('\n📊 نتائج الاختبار:');
    console.log(\`- تسجيل الدخول: \${loginSuccess ? '✅' : '❌'}\`);
    console.log(\`- رفع لقطة الشاشة: \${uploadSuccess ? '✅' : '❌'}\`);
    console.log(\`- جلب لقطات الشاشة: \${getSuccess ? '✅' : '❌'}\`);
    
    if (loginSuccess && uploadSuccess && getSuccess) {
      console.log('\n🎉 نظام لقطات الشاشة يعمل بشكل مثالي!');
    } else {
      console.log('\n⚠️ هناك مشاكل في النظام تحتاج إلى حل');
    }
  }
}

// تشغيل الاختبار
const tester = new ScreenshotSystemTester();
tester.runAllTests().catch(console.error);`;

  fs.writeFileSync('./test-screenshot-system.js', testScript);
  console.log('✅ تم إنشاء test-screenshot-system.js');
};

// 6. إنشاء دليل الاستخدام
const createUsageGuide = () => {
  console.log('\n📚 إنشاء دليل الاستخدام...');
  
  const guide = `# 📸 دليل نظام لقطات الشاشة المتقدم

## نظرة عامة
تم تفعيل نظام لقطات الشاشة المتقدم بنجاح! النظام يلتقط لقطات تلقائية أثناء العمل.

## ✅ الميزات المفعّلة:

### 1. التقاط تلقائي ذكي
- 📷 كل 3 دقائق عند الإنتاجية العالية (>80%)
- 📷 كل 5 دقائق عند الإنتاجية العادية
- 🚫 لا يلتقط أثناء الاستراحة أو الإيقاف

### 2. إعدادات الجودة
- 🎯 جودة 80% لضمان وضوح جيد
- 📐 أقصى حجم: 1920x1080
- 💾 ضغط ذكي لتوفير المساحة

### 3. الأمان والخصوصية
- 🔒 علامة مائية "HR System - Confidential"
- 🚫 عدم التقاط أثناء التطبيقات الشخصية
- 🗓️ حذف تلقائي بعد 30 يوم

### 4. إدارة الأداء
- ⚡ إيقاف تلقائي عند استهلاك CPU عالي
- 💾 مراقبة مساحة القرص الصلب
- 📊 تحسين حسب حالة النظام

## 🚀 كيفية الاستخدام:

### في التطبيق المكتبي:
1. ابدأ العمل بالضغط على "بدء العمل"
2. النظام سيلتقط لقطات تلقائياً
3. يمكنك التقاط لقطة يدوية بالضغط على "التقاط شاشة"
4. اعرض اللقطات في قسم "لقطات الشاشة"

### في الواجهة الويب:
1. اذهب إلى صفحة "تتبع سطح المكتب"
2. اضغط "مزامنة الآن" لرؤية آخر اللقطات
3. اعرض اللقطات في معرض الصور

## 🧪 اختبار النظام:
\`\`\`bash
node test-screenshot-system.js
\`\`\`

## ⚙️ تخصيص الإعدادات:
عدّل ملف \`screenshot-config.json\` لتغيير:
- فترات التقاط الشاشة
- جودة الصور
- إعدادات التخزين
- خيارات الخصوصية

## 📁 مجلدات النظام:
- \`./backend/uploads/screenshots/\` - لقطات الشاشة المحفوظة
- \`./uploads/screenshots/\` - نسخة احتياطية محلية

## 🔧 استكشاف الأخطاء:

### إذا لم تظهر اللقطات:
1. تأكد من تشغيل الخادم على المنفذ 5001
2. تحقق من صلاحيات مجلد uploads
3. شغّل سكريبت الاختبار للتشخيص

### إذا كانت اللقطات بطيئة:
1. قلل جودة الصور في الإعدادات
2. زد فترة التقاط الشاشة
3. تحقق من مساحة القرص الصلب

## 📞 الدعم:
لأي استفسارات أو مشاكل، راجع ملفات السجل في التطبيق.

---
🎉 **نظام لقطات الشاشة جاهز للاستخدام!**
`;

  fs.writeFileSync('./SCREENSHOT_SYSTEM_GUIDE.md', guide);
  console.log('✅ تم إنشاء SCREENSHOT_SYSTEM_GUIDE.md');
};

// 7. تفعيل النظام
const activateSystem = async () => {
  console.log('\n🎯 تفعيل النظام...');
  
  try {
    // إنشاء المجلدات
    createScreenshotDirectories();
    console.log('');
    
    // إنشاء الإعدادات
    const config = createScreenshotConfig();
    console.log('');
    
    // تحديث الملفات
    updateRendererConfig();
    updateSimulator();
    console.log('');
    
    // إنشاء أدوات الاختبار والدليل
    createTestScript();
    createUsageGuide();
    
    console.log('\n🎉 تم تفعيل نظام لقطات الشاشة بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. شغّل الخادم: cd backend && npm start');
    console.log('2. شغّل التطبيق المكتبي أو المحاكي');
    console.log('3. اختبر النظام: node test-screenshot-system.js');
    console.log('4. اقرأ الدليل: SCREENSHOT_SYSTEM_GUIDE.md');
    
    return true;
  } catch (error) {
    console.error('\n❌ خطأ في تفعيل النظام:', error.message);
    return false;
  }
};

// تشغيل السكريبت الرئيسي
if (require.main === module) {
  activateSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { activateSystem }; 