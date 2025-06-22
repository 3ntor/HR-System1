#!/usr/bin/env node

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
      
      const response = await axios.post(`${CONFIG.serverUrl}/api/tracking/desktop-login`, {
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
      
      const response = await axios.post(`${CONFIG.serverUrl}/api/tracking/screenshot`, formData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
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
      
      const response = await axios.get(`${CONFIG.serverUrl}/api/tracking/my-data`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      if (response.data.success) {
        const screenshots = response.data.data
          .map(record => record.screenshots || [])
          .flat();
          
        console.log(`✅ تم جلب ${screenshots.length} لقطة شاشة`);
        
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
    console.log(`- تسجيل الدخول: ${loginSuccess ? '✅' : '❌'}`);
    console.log(`- رفع لقطة الشاشة: ${uploadSuccess ? '✅' : '❌'}`);
    console.log(`- جلب لقطات الشاشة: ${getSuccess ? '✅' : '❌'}`);
    
    if (loginSuccess && uploadSuccess && getSuccess) {
      console.log('\n🎉 نظام لقطات الشاشة يعمل بشكل مثالي!');
    } else {
      console.log('\n⚠️ هناك مشاكل في النظام تحتاج إلى حل');
    }
  }
}

// تشغيل الاختبار
const tester = new ScreenshotSystemTester();
tester.runAllTests().catch(console.error);