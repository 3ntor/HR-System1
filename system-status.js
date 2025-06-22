#!/usr/bin/env node

const axios = require('axios');

// إعدادات المراقبة
const CONFIG = {
  serverUrl: 'http://localhost:5001',
  frontendUrl: 'http://localhost:3001',
  checkInterval: 5000 // 5 ثواني
};

class SystemMonitor {
  constructor() {
    this.isRunning = false;
    this.checkCount = 0;
  }

  // فحص حالة الخادم الخلفي
  async checkBackend() {
    try {
      const response = await axios.get(`${CONFIG.serverUrl}/api/health`, {
        timeout: 3000
      });
      
      return {
        status: 'running',
        message: response.data.message,
        database: response.data.database
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // فحص حالة الواجهة الأمامية
  async checkFrontend() {
    try {
      const response = await axios.get(CONFIG.frontendUrl, {
        timeout: 3000
      });
      
      return {
        status: 'running',
        message: 'Frontend accessible'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // عرض الحالة
  displayStatus(backend, frontend) {
    console.clear();
    console.log('🖥️  نظام إدارة الموارد البشرية - مراقب الحالة');
    console.log('═'.repeat(60));
    console.log(`📊 فحص رقم: ${this.checkCount}`);
    console.log(`⏰ وقت الفحص: ${new Date().toLocaleString('ar-SA')}`);
    console.log('═'.repeat(60));
    
    // حالة الخادم الخلفي
    const backendIcon = backend.status === 'running' ? '✅' : '❌';
    console.log(`${backendIcon} الخادم الخلفي (Backend): ${backend.status.toUpperCase()}`);
    console.log(`   📡 ${CONFIG.serverUrl}`);
    console.log(`   💬 ${backend.message}`);
    if (backend.database) {
      console.log(`   🗄️  قاعدة البيانات: ${backend.database}`);
    }
    console.log('');
    
    // حالة الواجهة الأمامية
    const frontendIcon = frontend.status === 'running' ? '✅' : '❌';
    console.log(`${frontendIcon} الواجهة الأمامية (Frontend): ${frontend.status.toUpperCase()}`);
    console.log(`   🌐 ${CONFIG.frontendUrl}`);
    console.log(`   💬 ${frontend.message}`);
    console.log('');
    
    // معلومات إضافية
    console.log('📈 معلومات التحديث:');
    console.log(`   🔄 تحديث البيانات: كل 5 ثواني`);
    console.log(`   📸 لقطات الشاشة: كل 5 دقائق`);
    console.log(`   🔍 فحص الحالة: كل 5 ثواني`);
    console.log('');
    
    console.log('⌨️  اضغط Ctrl+C لإيقاف المراقب');
    console.log('═'.repeat(60));
  }

  // بدء المراقبة
  async start() {
    console.log('🚀 بدء مراقب حالة النظام...');
    this.isRunning = true;
    
    // فحص فوري
    await this.checkSystem();
    
    // فحص دوري
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      await this.checkSystem();
    }, CONFIG.checkInterval);
    
    // التعامل مع إيقاف البرنامج
    process.on('SIGINT', () => {
      console.log('\n\n🛑 إيقاف مراقب النظام...');
      this.isRunning = false;
      clearInterval(interval);
      process.exit(0);
    });
  }

  // فحص النظام
  async checkSystem() {
    this.checkCount++;
    
    const [backend, frontend] = await Promise.all([
      this.checkBackend(),
      this.checkFrontend()
    ]);
    
    this.displayStatus(backend, frontend);
  }
}

// بدء المراقب
if (require.main === module) {
  const monitor = new SystemMonitor();
  monitor.start().catch(console.error);
}

module.exports = SystemMonitor; 