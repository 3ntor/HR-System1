const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.authInfo = null;
    this.eventListeners = new Map();
    this.connectionStatus = 'disconnected'; // 'disconnected', 'initializing', 'waiting_qr', 'qr_ready', 'scanning', 'connected', 'error'
    this.stats = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      receivedMessages: 0,
      startTime: null
    };
  }

  async initialize() {
    try {
      console.log('\n=== Starting WhatsApp initialization ===\n');
      this.connectionStatus = 'initializing';
      this.emitEvent('status', { status: this.connectionStatus });
      
      // Try to find Chrome in different locations based on OS
      const os = require('os');
      const platform = os.platform();
      
      let possibleChromePaths = [];
      
      if (platform === 'win32') {
        possibleChromePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
        ];
      } else if (platform === 'darwin') {
        possibleChromePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ];
      } else {
        possibleChromePaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium'
        ];
      }

      let chromePath;
      for (const path of possibleChromePaths) {
        try {
          if (fs.existsSync(path)) {
            chromePath = path;
            break;
          }
        } catch (e) {
          console.log(`Chrome not found at ${path}`);
        }
      }

      console.log('Using Chrome path:', chromePath);
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: "whatsapp-client",
          dataPath: "./.wwebjs_auth"
        }),
        puppeteer: {
          headless: true,
          executablePath: chromePath,
          defaultViewport: null,
          ignoreDefaultArgs: ['--disable-extensions'],
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-translate',
            '--disable-sync',
            '--disable-background-networking',
            '--metrics-recording-only',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--force-color-profile=srgb',
            '--hide-scrollbars',
            '--mute-audio',
            '--window-size=1280,720',
            '--start-maximized',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      });

      this.client.on('qr', qr => {
        console.log('\n=== WhatsApp QR Code ===\n');
        qrcode.generate(qr, { small: true });
        console.log('\n=== Scan this QR code with your WhatsApp ===\n');
        this.qrCode = qr;
        this.connectionStatus = 'qr_ready';
        this.emitEvent('qr', { qrCode: qr });
        this.emitEvent('status', { status: this.connectionStatus });
      });

      this.client.on('authenticated', (session) => {
        console.log('\n=== WhatsApp client is authenticated! ===\n');
        this.authInfo = {
          number: session?.wid?.user || 'unknown',
          name: session?.pushname || 'unknown',
          connectedAt: new Date().toISOString()
        };
        this.connectionStatus = 'scanning';
        this.emitEvent('authenticated', this.authInfo);
        this.emitEvent('status', { status: this.connectionStatus });
      });

      this.client.on('ready', () => {
        this.isReady = true;
        this.qrCode = null;
        this.connectionStatus = 'connected';
        console.log('\n=== WhatsApp client is ready! ===\n');
        this.emitEvent('ready', {
          isReady: true,
          authInfo: this.authInfo
        });
        this.emitEvent('status', { status: this.connectionStatus });
      });

      this.client.on('disconnected', (reason) => {
        this.isReady = false;
        this.qrCode = null;
        this.authInfo = null;
        this.connectionStatus = 'disconnected';
        console.log('\n=== WhatsApp client disconnected! ===\n', reason);
        this.emitEvent('disconnected', { reason });
        this.emitEvent('status', { status: this.connectionStatus });
      });

      this.client.on('message', msg => {
        console.log('Message received:', msg.body);
        this.emitEvent('message', {
          from: msg.from,
          body: msg.body,
          timestamp: msg.timestamp
        });
      });

      console.log('Initializing WhatsApp client...');
      this.connectionStatus = 'waiting_qr';
      this.emitEvent('status', { status: this.connectionStatus });
      await this.client.initialize();
      
      console.log('WhatsApp client initialization completed');
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      this.connectionStatus = 'error';
      this.emitEvent('error', { message: error.message });
      this.emitEvent('status', { status: this.connectionStatus });
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
        this.isReady = false;
        this.qrCode = null;
        this.authInfo = null;
        this.client = null;
        this.connectionStatus = 'disconnected';
        this.emitEvent('disconnected', { reason: 'manual_disconnect' });
        this.emitEvent('status', { status: this.connectionStatus });
      } catch (error) {
        console.error('Error disconnecting WhatsApp client:', error);
        throw error;
      }
    }
  }

  async sendMessage(to, message, options = {}) {
    if (!this.client || !this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }
    try {
      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
      const result = await this.client.sendMessage(chatId, message);
      this.updateStats('message_sent');
      this.emitEvent('message_sent', {
        to: chatId,
        messageId: result.id,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      this.updateStats('message_failed');
      this.emitEvent('message_error', {
        to,
        error: error.message
      });
      return false;
    }
  }

  getQRCode() {
    return this.qrCode;
  }

  isClientReady() {
    return this.isReady;
  }

  getAuthInfo() {
    return this.authInfo;
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Event handling
  addEventListener(clientId, callback) {
    this.eventListeners.set(clientId, callback);
  }

  removeEventListener(clientId) {
    this.eventListeners.delete(clientId);
  }

  emitEvent(event, data) {
    this.eventListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  async resetData() {
    try {
      console.log('\n=== Resetting WhatsApp Data ===\n');
      
      // 1. قطع الاتصال إذا كان متصلاً
      if (this.client) {
        await this.disconnect();
      }

      // 2. حذف ملفات الجلسة
      const authPath = './.wwebjs_auth';
      const cachePath = './.wwebjs_cache';
      
      try {
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true });
          console.log('✅ تم حذف مجلد المصادقة');
        }
      } catch (error) {
        console.error('❌ خطأ في حذف مجلد المصادقة:', error);
      }

      try {
        if (fs.existsSync(cachePath)) {
          fs.rmSync(cachePath, { recursive: true, force: true });
          console.log('✅ تم حذف مجلد الكاش');
        }
      } catch (error) {
        console.error('❌ خطأ في حذف مجلد الكاش:', error);
      }

      // 3. إعادة تعيين المتغيرات
      this.client = null;
      this.isReady = false;
      this.qrCode = null;
      this.authInfo = null;
      this.connectionStatus = 'disconnected';
      this.stats = {
        totalMessages: 0,
        successfulMessages: 0,
        failedMessages: 0,
        receivedMessages: 0,
        startTime: null
      };

      // 4. إرسال حدث إعادة التعيين
      this.emitEvent('reset', { 
        message: 'تم إعادة تعيين البيانات بنجاح',
        timestamp: new Date().toISOString()
      });
      this.emitEvent('status', { status: this.connectionStatus });

      console.log('✅ تم إعادة تعيين بيانات WhatsApp بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في إعادة تعيين البيانات:', error);
      this.connectionStatus = 'error';
      this.emitEvent('error', { 
        message: 'فشل في إعادة تعيين البيانات',
        error: error.message
      });
      throw error;
    }
  }

  // تحديث الإحصائيات
  updateStats(type) {
    if (!this.stats.startTime) {
      this.stats.startTime = new Date();
    }

    switch (type) {
      case 'message_sent':
        this.stats.totalMessages++;
        this.stats.successfulMessages++;
        break;
      case 'message_failed':
        this.stats.totalMessages++;
        this.stats.failedMessages++;
        break;
      case 'message_received':
        this.stats.receivedMessages++;
        break;
    }

    // إرسال تحديث الإحصائيات
    this.emitEvent('stats_update', this.getStats());
  }

  getStats() {
    const now = new Date();
    const uptime = this.stats.startTime ? 
      Math.floor((now - this.stats.startTime) / 1000) : 0;

    return {
      ...this.stats,
      uptime: this.formatUptime(uptime),
      successRate: this.stats.totalMessages > 0 ? 
        Math.round((this.stats.successfulMessages / this.stats.totalMessages) * 100) : 0
    };
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

module.exports = WhatsAppManager;