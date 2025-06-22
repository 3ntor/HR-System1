// محاكي تطبيق سطح المكتب للمراقبة والحضور
// Desktop App Simulator for HR Tracking System

class DesktopAppSimulator {
  constructor() {
    this.isConnected = false
    this.currentSession = null
    this.activityTimer = null
    this.screenshotTimer = null
    this.lastActivity = new Date()
    this.startTime = null
    this.totalIdleTime = 0
    this.screenshots = []
    this.listeners = []
  }

  // بدء محاكي التطبيق
  startApp() {
    this.isConnected = true
    this.startTime = new Date()
    this.lastActivity = new Date()
    
    // بدء مراقبة النشاط
    this.startActivityMonitoring()
    
    // بدء أخذ لقطات الشاشة
    this.startScreenshotCapture()
    
    this.notifyListeners('connected')
    console.log('🟢 تطبيق مراقبة سطح المكتب متصل')
  }

  // إيقاف محاكي التطبيق
  stopApp() {
    this.isConnected = false
    this.clearTimers()
    this.currentSession = null
    this.screenshots = []
    
    this.notifyListeners('disconnected')
    console.log('🔴 تطبيق مراقبة سطح المكتب منقطع')
  }

  // تسجيل الحضور
  checkIn() {
    if (!this.isConnected) {
      throw new Error('التطبيق غير متصل')
    }

    this.currentSession = {
      checkInTime: new Date(),
      isActive: true,
      totalWorkTime: 0,
      totalIdleTime: 0
    }

    this.notifyListeners('checked-in', this.currentSession)
    console.log('✅ تم تسجيل الحضور بنجاح')
    return this.currentSession
  }

  // تسجيل الانصراف
  checkOut() {
    if (!this.isConnected || !this.currentSession) {
      throw new Error('لا يوجد جلسة حضور نشطة')
    }

    const sessionData = {
      ...this.currentSession,
      checkOutTime: new Date(),
      totalWorkTime: this.getTotalWorkTime(),
      totalIdleTime: this.totalIdleTime,
      screenshots: [...this.screenshots]
    }

    this.currentSession = null
    this.notifyListeners('checked-out', sessionData)
    console.log('✅ تم تسجيل الانصراف بنجاح')
    return sessionData
  }

  // بدء مراقبة النشاط
  startActivityMonitoring() {
    this.activityTimer = setInterval(() => {
      if (this.currentSession && this.currentSession.isActive) {
        // محاكاة تتبع النشاط
        const now = new Date()
        const timeSinceLastActivity = now - this.lastActivity

        // اعتبار المستخدم خامل إذا لم يكن هناك نشاط لأكثر من 5 دقائق
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          this.totalIdleTime += timeSinceLastActivity
          this.lastActivity = now
        }

        // محاكاة نشاط عشوائي
        if (Math.random() > 0.7) {
          this.simulateActivity()
        }
      }
    }, 30000) // فحص كل 30 ثانية
  }

  // محاكاة نشاط المستخدم
  simulateActivity() {
    this.lastActivity = new Date()
    
    const activities = [
      'كتابة على لوحة المفاتيح',
      'تحريك الماوس', 
      'النقر على التطبيقات',
      'تصفح الملفات',
      'فتح المجلدات'
    ]
    
    const activity = activities[Math.floor(Math.random() * activities.length)]
    this.notifyListeners('activity', { type: activity, timestamp: new Date() })
  }

  // بدء أخذ لقطات الشاشة
  startScreenshotCapture() {
    this.screenshotTimer = setInterval(() => {
      if (this.currentSession && this.isConnected) {
        this.takeScreenshot()
      }
    }, this.getRandomInterval(10, 30) * 60 * 1000) // كل 10-30 دقيقة عشوائياً
  }

  // أخذ لقطة شاشة
  takeScreenshot() {
    const screenshot = {
      id: Date.now(),
      timestamp: new Date(),
      activity: this.getRandomActivity(),
      size: Math.floor(Math.random() * 500 + 200) + ' KB',
      protected: true // محمية من المسح
    }

    this.screenshots.push(screenshot)
    
    // الاحتفاظ بآخر 20 لقطة فقط
    if (this.screenshots.length > 20) {
      this.screenshots = this.screenshots.slice(-20)
    }

    this.notifyListeners('screenshot-taken', screenshot)
    console.log(`📸 تم أخذ لقطة شاشة: ${screenshot.activity}`)
  }

  // الحصول على نشاط عشوائي للقطة الشاشة
  getRandomActivity() {
    const activities = [
      'العمل على Excel',
      'كتابة التقارير',
      'مراجعة الإيميلات',
      'تصفح المواقع المهنية',
      'اجتماع فيديو',
      'استخدام نظام الشركة',
      'قراءة المستندات',
      'تحليل البيانات',
      'إعداد العروض التقديمية',
      'التواصل مع الفريق'
    ]
    
    return activities[Math.floor(Math.random() * activities.length)]
  }

  // الحصول على فترة زمنية عشوائية
  getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // الحصول على إجمالي وقت العمل
  getTotalWorkTime() {
    if (!this.startTime) return 0
    return new Date() - this.startTime - this.totalIdleTime
  }

  // الحصول على وقت العمل المنسق
  getFormattedWorkTime() {
    const totalMs = this.getTotalWorkTime()
    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // الحصول على وقت الخمول المنسق
  getFormattedIdleTime() {
    const hours = Math.floor(this.totalIdleTime / (1000 * 60 * 60))
    const minutes = Math.floor((this.totalIdleTime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((this.totalIdleTime % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // حساب نسبة الإنتاجية
  getProductivityScore() {
    const totalTime = this.getTotalWorkTime()
    if (totalTime === 0) return 0
    
    const activeTime = totalTime - this.totalIdleTime
    return Math.round((activeTime / totalTime) * 100)
  }

  // الحصول على حالة التطبيق
  getStatus() {
    return {
      isConnected: this.isConnected,
      currentSession: this.currentSession,
      totalWorkTime: this.getFormattedWorkTime(),
      totalIdleTime: this.getFormattedIdleTime(),
      productivityScore: this.getProductivityScore(),
      screenshotCount: this.screenshots.length,
      lastActivity: this.lastActivity,
      screenshots: this.screenshots.slice(-5) // آخر 5 لقطات
    }
  }

  // إضافة مستمع للأحداث
  addEventListener(callback) {
    this.listeners.push(callback)
  }

  // إزالة مستمع للأحداث
  removeEventListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }

  // إشعار جميع المستمعين
  notifyListeners(event, data = null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('خطأ في إشعار المستمع:', error)
      }
    })
  }

  // مسح المؤقتات
  clearTimers() {
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
      this.activityTimer = null
    }
    
    if (this.screenshotTimer) {
      clearInterval(this.screenshotTimer)
      this.screenshotTimer = null
    }
  }

  // إعادة تعيين البيانات
  reset() {
    this.clearTimers()
    this.isConnected = false
    this.currentSession = null
    this.startTime = null
    this.totalIdleTime = 0
    this.screenshots = []
    this.lastActivity = new Date()
  }
}

// إنشاء مثيل وحيد للمحاكي
const desktopAppSimulator = new DesktopAppSimulator()

// تصدير المحاكي
export default desktopAppSimulator

// تصدير كلاس للاستخدام المتقدم
export { DesktopAppSimulator } 