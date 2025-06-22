const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  // معرف المستخدم
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // معرف الموظف (للتوافق)
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // تاريخ التتبع
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // تاريخ بصيغة نصية للبحث السريع (YYYY-MM-DD)
  dateString: {
    type: String,
    required: true,
    default: function() {
      return new Date().toISOString().split('T')[0];
    }
  },
  
  // بيانات العمل المفصلة
  workData: {
    // إجمالي وقت العمل بالثواني
    totalSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // وقت النشاط بالثواني
    activeSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // وقت الخمول بالثواني
    idleSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // وقت الاستراحة بالثواني
    breakSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // عدد الجلسات
    sessionsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // المهام المكتملة
    tasksCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // نسبة الإنتاجية (0-100)
    productivity: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // نسبة الكفاءة (0-100)
    efficiency: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // آخر نشاط
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // لقطات الشاشة
  screenshots: [{
    timestamp: {
      type: Date,
      required: true
    },
    filename: {
      type: String
    },
    size: {
      width: Number,
      height: Number
    },
    path: {
      type: String
    }
  }],
  
  // حالة العمل الحالية
  status: {
    type: String,
    enum: ['working', 'idle', 'break', 'offline'],
    default: 'offline'
  },
  
  // حالة العمل (true/false)
  isWorking: {
    type: Boolean,
    default: false
  },
  
  // آخر تحديث
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  
  // معلومات إضافية
  metadata: {
    // نوع الجهاز
    deviceType: {
      type: String,
      default: 'desktop'
    },
    
    // إصدار التطبيق
    appVersion: {
      type: String,
      default: '2.0.0'
    },
    
    // معلومات النظام
    systemInfo: {
      platform: String,
      arch: String,
      version: String
    }
  }
}, {
  timestamps: true,
  collection: 'tracking'
});

// إنشاء فهرس مركب للبحث السريع
trackingSchema.index({ userId: 1, date: 1 });
trackingSchema.index({ employeeId: 1, date: 1 });
trackingSchema.index({ date: 1, status: 1 });
trackingSchema.index({ userId: 1, dateString: 1 });
trackingSchema.index({ employeeId: 1, dateString: 1 });

// دالة للحصول على إحصائيات اليوم
trackingSchema.methods.getTodayStats = function() {
  return {
    totalWorkTime: this.workData.totalSeconds || 0,
    activeTime: this.workData.activeSeconds || 0,
    idleTime: this.workData.idleSeconds || 0,
    breakTime: this.workData.breakSeconds || 0,
    productivity: this.workData.productivity || 0,
    sessionsCount: this.workData.sessionsCount || 0,
    screenshotCount: this.screenshots ? this.screenshots.length : 0
  };
};

// دالة لحساب نسبة الإنتاجية
trackingSchema.methods.calculateProductivity = function() {
  const total = this.workData.totalSeconds || 0;
  const active = this.workData.activeSeconds || 0;
  
  if (total === 0) return 0;
  
  return Math.round((active / total) * 100);
};

// تحديث نسبة الإنتاجية قبل الحفظ
trackingSchema.pre('save', function(next) {
  if (this.workData) {
    this.workData.productivity = this.calculateProductivity();
    this.lastUpdate = new Date();
  }
  next();
});

// دالة static للبحث عن بيانات اليوم
trackingSchema.statics.findTodayData = function(userId, dateString = null) {
  const todayString = dateString || new Date().toISOString().split('T')[0];
  
  return this.findOne({
    $or: [
      { userId: userId },
      { employeeId: userId }
    ],
    dateString: todayString
  });
};

// دالة static للبحث عن بيانات يوم محدد
trackingSchema.statics.findByDate = function(userId, dateString) {
  return this.findOne({
    $or: [
      { userId: userId },
      { employeeId: userId }
    ],
    dateString: dateString
  });
};

// دالة static للحصول على إحصائيات الأسبوع
trackingSchema.statics.getWeeklyStats = function(userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  return this.find({
    $or: [
      { userId: userId },
      { employeeId: userId }
    ],
    date: {
      $gte: weekAgo
    }
  }).sort({ date: -1 });
};

module.exports = mongoose.model('Tracking', trackingSchema); 