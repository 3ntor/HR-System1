#!/usr/bin/env node

const axios = require('axios');

// إعدادات المحاكي
const CONFIG = {
  serverUrl: 'http://localhost:5001',
  credentials: {
    username: 'admin',
    password: 'admin123'
  },
  updateInterval: 5000, // 5 ثواني
  screenshotInterval: 120000, // 2 دقيقة للمحاكي
  userId: '684fedd883e2693199a30a96'
};

class SimpleDesktopSimulator {
  constructor() {
    this.authToken = null;
    this.isRunning = false;
    this.startTime = null;
    this.updateTimer = null;
    this.screenshotTimer = null;
    this.screenshotCount = 0;
  }

  // تسجيل الدخول
  async login() {
    try {
      console.log('🔐 محاولة تسجيل الدخول...');
      
      const response = await axios.post(`${CONFIG.serverUrl}/api/tracking/desktop-login`, {
        username: CONFIG.credentials.username,
        password: CONFIG.credentials.password
      });

      if (response.data.success) {
        this.authToken = response.data.token;
        const user = response.data.user || response.data.employee;
        console.log(`✅ تم تسجيل الدخول بنجاح: ${user.name || user.username}`);
        return true;
      } else {
        console.log('❌ فشل في تسجيل الدخول:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // إرسال البيانات
  async sendUpdate() {
    if (!this.authToken || !this.isRunning) return;

    try {
      const now = new Date();
      const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
      
      // محاكاة بيانات واقعية
      const activeSeconds = Math.floor(elapsedSeconds * 0.85); // 85% نشاط
      const idleSeconds = elapsedSeconds - activeSeconds;
      const productivity = Math.floor((activeSeconds / elapsedSeconds) * 100) || 85;

      const requestData = {
        workData: {
          totalSeconds: elapsedSeconds,
          activeSeconds: activeSeconds,
          idleSeconds: idleSeconds,
          breakSeconds: 0,
          sessionsCount: 1,
          productivity: productivity,
          lastActivity: now.toISOString()
        },
        screenshots: [],
        isWorking: true,
        date: now.toISOString().split('T')[0],
        dateString: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        appVersion: '2.8.0-simulator'
      };

      const response = await axios.post(`${CONFIG.serverUrl}/api/tracking/save`, requestData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const minutes = Math.floor(elapsedSeconds / 60);
        console.log(`✅ تم إرسال البيانات - النشاط: ${productivity}% - الوقت: ${minutes} دقيقة`);
      } else {
        console.log('⚠️ فشل في إرسال البيانات:', response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال البيانات:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 401) {
        console.log('🔄 إعادة تسجيل الدخول...');
        await this.login();
      }
    }
  }

  
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
    
    console.log(`📸 لقطة شاشة #${this.screenshotCount} - ${activity} (إنتاجية: ${productivity}%)`);
    
    // محاكاة إرسال بيانات اللقطة للخادم
    try {
      const screenshotData = {
        filename: `screenshot_${Date.now()}.png`,
        timestamp: new Date().toISOString(),
        activity: activity,
        productivity: productivity,
        simulated: true
      };
      
      // يمكن إضافة إرسال فعلي للخادم هنا
      console.log(`💾 تم حفظ بيانات اللقطة: ${screenshotData.filename}`);
      
    } catch (error) {
      console.error('❌ خطأ في محاكاة لقطة الشاشة:', error.message);
    }
  }

  // بدء المحاكي
  async start() {
    console.log('🚀 بدء المحاكي المبسط...');
    console.log(`📡 الخادم: ${CONFIG.serverUrl}`);
    
    // تسجيل الدخول
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ فشل في بدء المحاكي');
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();
    
    console.log('✅ تم بدء المحاكي بنجاح!');
    console.log('🔄 إرسال البيانات كل 5 ثواني');
    console.log('📸 محاكاة لقطات الشاشة كل 5 دقائق');
    console.log('➡️  لإيقاف المحاكي اضغط Ctrl+C');

    // إرسال أول تحديث
    await this.sendUpdate();

    // تشغيل المؤقتات
    this.updateTimer = setInterval(() => {
      this.sendUpdate();
    }, CONFIG.updateInterval);

    this.screenshotTimer = setInterval(() => {
      this.simulateScreenshot();
    }, CONFIG.screenshotInterval);

    // عرض الإحصائيات كل دقيقة
    setInterval(() => {
      if (this.isRunning) {
        this.showStats();
      }
    }, 60000);
  }

  // إيقاف العمل
  async stopWork() {
    if (!this.isRunning) return;

    console.log('⏹️ إيقاف العمل...');
    
    try {
      const now = new Date();
      const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
      const activeSeconds = Math.floor(elapsedSeconds * 0.85);
      const idleSeconds = elapsedSeconds - activeSeconds;
      const productivity = Math.floor((activeSeconds / elapsedSeconds) * 100) || 85;

      const requestData = {
        workData: {
          totalSeconds: elapsedSeconds,
          activeSeconds: activeSeconds,
          idleSeconds: idleSeconds,
          breakSeconds: 0,
          sessionsCount: 1,
          productivity: productivity,
          lastActivity: now.toISOString()
        },
        screenshots: [],
        isWorking: false, // مهم: إيقاف العمل
        date: now.toISOString().split('T')[0],
        dateString: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        appVersion: '2.8.0-simulator'
      };

      const response = await axios.post(`${CONFIG.serverUrl}/api/tracking/save`, requestData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ تم إرسال إشارة إيقاف العمل');
      }
    } catch (error) {
      console.error('❌ خطأ في إيقاف العمل:', error.message);
    }
  }

  // إيقاف المحاكي
  stop() {
    console.log('🛑 إيقاف المحاكي...');
    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.screenshotTimer) {
      clearInterval(this.screenshotTimer);
      this.screenshotTimer = null;
    }
    
    console.log('✅ تم إيقاف المحاكي');
  }

  // عرض الإحصائيات
  showStats() {
    if (!this.isRunning) return;
    
    const now = new Date();
    const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const activeSeconds = Math.floor(elapsedSeconds * 0.85);
    const idleSeconds = elapsedSeconds - activeSeconds;
    const productivity = Math.floor((activeSeconds / elapsedSeconds) * 100) || 85;
    
    console.log('\n📊 إحصائيات الجلسة الحالية:');
    console.log(`⏱️  وقت التشغيل: ${minutes} دقيقة`);
    console.log(`🟢 وقت النشاط: ${Math.floor(activeSeconds / 60)} دقيقة`);
    console.log(`🔴 وقت عدم النشاط: ${Math.floor(idleSeconds / 60)} دقيقة`);
    console.log(`📈 نسبة الإنتاجية: ${productivity}%`);
    console.log(`📷 لقطات الشاشة: ${this.screenshotCount}\n`);
  }
}

// تشغيل المحاكي
const simulator = new SimpleDesktopSimulator();

// التعامل مع إشارات الإيقاف
process.on('SIGINT', async () => {
  console.log('\n⚠️ تم استلام إشارة الإيقاف...');
  await simulator.stopWork();
  simulator.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await simulator.stopWork();
  simulator.stop();
  process.exit(0);
});

// بدء المحاكي
simulator.start().catch(error => {
  console.error('❌ خطأ في تشغيل المحاكي:', error.message);
  process.exit(1);
}); 