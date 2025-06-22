const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  requiredTime: {
    type: String,
    required: true,
    default: '09:00'
  },
  totalHours: {
    type: Number,
    default: 0,
    comment: 'إجمالي ساعات العمل من تطبيق الديسك توب (ثابت - لا يتغير إلا من التطبيق)'
  },
  activeHours: {
    type: Number,
    default: 0,
    comment: 'ساعات النشاط الفعلية من تطبيق الديسك توب (ثابت - لا يتغير إلا من التطبيق)'
  },
  idleHours: {
    type: Number,
    default: 0,
    comment: 'ساعات الخمول من تطبيق الديسك توب'
  },
  breakHours: {
    type: Number,
    default: 0,
    comment: 'ساعات الاستراحة من تطبيق الديسك توب'
  },
  // حقول جديدة للوقت التفصيلي
  totalMinutes: {
    type: Number,
    default: 0,
    comment: 'إجمالي الدقائق المعملة'
  },
  activeMinutes: {
    type: Number,
    default: 0,
    comment: 'إجمالي دقائق النشاط الفعلية'
  },
  idleMinutes: {
    type: Number,
    default: 0,
    comment: 'إجمالي دقائق الخمول'
  },
  breakMinutes: {
    type: Number,
    default: 0,
    comment: 'إجمالي دقائق الاستراحة'
  },
  totalHoursExact: {
    type: Number,
    default: 0,
    comment: 'عدد الساعات الصحيح (بدون كسور)'
  },
  totalMinutesExact: {
    type: Number,
    default: 0,
    comment: 'عدد الدقائق الصحيح المتبقية'
  },
  activeHoursExact: {
    type: Number,
    default: 0,
    comment: 'عدد ساعات النشاط الصحيح (بدون كسور)'
  },
  activeMinutesExact: {
    type: Number,
    default: 0,
    comment: 'عدد دقائق النشاط الصحيح المتبقية'
  },
  idleHoursExact: {
    type: Number,
    default: 0,
    comment: 'عدد ساعات الخمول الصحيح (بدون كسور)'
  },
  idleMinutesExact: {
    type: Number,
    default: 0,
    comment: 'عدد دقائق الخمول الصحيح المتبقية'
  },
  breakHoursExact: {
    type: Number,
    default: 0,
    comment: 'عدد ساعات الاستراحة الصحيح (بدون كسور)'
  },
  breakMinutesExact: {
    type: Number,
    default: 0,
    comment: 'عدد دقائق الاستراحة الصحيح المتبقية'
  },
  totalFormatted: {
    type: String,
    default: '0د',
    comment: 'الوقت الكلي منسق (مثل: 8س 30د أو 45د)'
  },
  activeFormatted: {
    type: String,
    default: '0د',
    comment: 'وقت النشاط منسق (مثل: 7س 45د أو 30د)'
  },
  idleFormatted: {
    type: String,
    default: '0د',
    comment: 'وقت الخمول منسق (مثل: 1س 15د أو 10د)'
  },
  breakFormatted: {
    type: String,
    default: '0د',
    comment: 'وقت الاستراحة منسق (مثل: 30د أو 15د)'
  },
  totalSeconds: {
    type: Number,
    default: 0,
    comment: 'إجمالي الثواني من التطبيق'
  },
  activeSeconds: {
    type: Number,
    default: 0,
    comment: 'إجمالي ثواني النشاط من التطبيق'
  },
  idleSeconds: {
    type: Number,
    default: 0,
    comment: 'إجمالي ثواني الخمول من التطبيق'
  },
  breakSeconds: {
    type: Number,
    default: 0,
    comment: 'إجمالي ثواني الاستراحة من التطبيق'
  },
  productivity: {
    type: Number,
    default: 0,
    comment: 'نسبة الإنتاجية المحسوبة (activeSeconds / totalSeconds * 100)'
  },
  delayHours: {
    type: Number,
    default: 0,
    comment: 'ساعات التأخير المحسوبة بناء على totalHours'
  },
  deductionAmount: {
    type: Number,
    default: 0,
    comment: 'قيمة الخصم المحسوبة بناء على ساعات التأخير'
  },
  status: {
    type: String,
    enum: ['في الوقت', 'متأخر', 'غائب', 'إجازة', 'مهمة خارجية', 'عطلة'],
    default: 'في الوقت'
  },
  isWeekend: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// فهرس مركب لضمان عدم تكرار السجلات لنفس الموظف في نفس اليوم
dailyAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// دالة لتحويل الثواني إلى تنسيق ساعات ودقائق
dailyAttendanceSchema.methods.formatTime = function(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}س ${minutes}د`;
};

// دالة للحصول على الوقت المتبقي للعمل اليومي
dailyAttendanceSchema.methods.getRemainingTime = function() {
  const requiredSeconds = 8 * 3600; // 8 ساعات مطلوبة
  const remaining = Math.max(0, requiredSeconds - this.totalSeconds);
  return this.formatTime(remaining);
};

// دالة للحصول على نسبة الإنتاجية
dailyAttendanceSchema.methods.getProductivityRate = function() {
  if (this.totalSeconds === 0) return 0;
  return Math.round((this.activeSeconds / this.totalSeconds) * 100);
};

// دالة لحساب التأخير والخصم بناءً على الحضور الكلي من التطبيق فقط
dailyAttendanceSchema.methods.calculateLateness = function(baseSalary) {
  // لا نحسب التأخير في أيام العطل أو الإجازات
  if (this.isWeekend || this.status === 'عطلة' || this.status === 'إجازة' || this.status === 'مهمة خارجية') {
    this.delayHours = 0;
    this.deductionAmount = 0;
    return;
  }

  // معيار العمل اليومي المطلوب: 8 ساعات
  const requiredDailyHours = 8;
  
  // حساب النقص بناءً على الوقت الكلي من التطبيق فقط
  if (this.totalHours === 0) {
    // لم يعمل إطلاقاً - غياب تام
    this.status = 'غائب';
    this.delayHours = requiredDailyHours; // 8 ساعات نقص
    this.deductionAmount = Math.round(baseSalary / 30); // خصم يوم كامل
  } else if (this.totalHours < 4) {
    // أقل من نصف يوم - يعتبر غياب
    this.status = 'غائب';
    this.delayHours = requiredDailyHours; // 8 ساعات نقص (يوم كامل)
    this.deductionAmount = Math.round(baseSalary / 30); // خصم يوم كامل
  } else if (this.totalHours < requiredDailyHours) {
    // نقص في ساعات العمل - تأخير
    this.status = 'متأخر';
    this.delayHours = requiredDailyHours - this.totalHours;
    this.deductionAmount = Math.round((baseSalary / 30 / requiredDailyHours) * this.delayHours);
  } else {
    // حضر المدة المطلوبة أو أكثر - في الوقت
    this.status = 'في الوقت';
    this.delayHours = 0;
    this.deductionAmount = 0;
  }
};

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema); 