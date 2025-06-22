const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // ربط مع المستخدم
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    validate: {
      validator: async function(value) {
        try {
          const User = mongoose.model('User');
          const user = await User.findById(value);
          if (!user) {
            return false;
          }
          // التحقق من وجود البريد الإلكتروني والهاتف
          if (!user.email || !user.phone) {
            return false;
          }
          return true;
        } catch (error) {
          console.error('Error validating user:', error);
          return false;
        }
      },
      message: 'لا يوجد مستخدم مرتبط أو بيانات المستخدم غير كاملة'
    }
  },
  // تحسين التحقق من البريد الإلكتروني
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: async function(value) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          return false;
        }
        const User = mongoose.model('User');
        const user = await User.findOne({ email: value });
        if (!user) {
          return false;
        }
        return user._id.toString() === this.userId.toString();
      },
      message: 'البريد الإلكتروني غير صالح أو لا يتطابق مع المستخدم المرتبط'
    }
  },
  // تحسين التحقق من رقم الهاتف
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    validate: {
      validator: async function(value) {
        const phoneRegex = /^\+?\d{10,15}$/;
        if (!phoneRegex.test(value)) {
          return false;
        }
        const User = mongoose.model('User');
        const user = await User.findOne({ phone: value });
        if (!user) {
          return false;
        }
        return user._id.toString() === this.userId.toString();
      },
      message: 'رقم الهاتف غير صالح أو لا يتطابق مع المستخدم المرتبط'
    }
  },
  // إزالة التكرار في البيانات
  employeeId: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(value) {
        return /^[A-Z0-9]+$/.test(value);
      },
      message: 'رقم الموظف يجب أن يتكون من أحرف وأرقام فقط'
    }
  },
  employeeNumber: { 
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(value) {
        return /^[0-9]+$/.test(value);
      },
      message: 'رقم الموظف الداخلي يجب أن يكون أرقام فقط'
    }
  },
  // معلومات أساسية
  employeeId: { 
    type: String, 
    unique: true,
    required: true,
    trim: true
  }, // رقم الموظف فريد لكل موظف
  employeeNumber: { 
    type: String,
    unique: true,
    required: true,
    trim: true
  }, // رقم الموظف الداخلي
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  directManager: { type: String, default: 'المدير العام' },
  workLocation: { type: String, default: 'المكتب الرئيسي' },
  joinDate: { type: Date, default: Date.now }, // تاريخ الانضمام
  address: { type: String, default: 'القاهرة، مصر' },
  
  status: { 
    type: String, 
    enum: ['نشط', 'إجازة', 'تحت التدريب', 'غير نشط'],
    default: 'تحت التدريب'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalDetails: {
    approvedBy: String,
    approvedAt: Date,
    rejectionReason: String,
    comments: String
  },
  teamLead: { type: Boolean, default: false },
  location: String,

  // معلومات التوظيف
  startDate: { type: Date, required: true },
  endDate: Date,
  baseSalary: { type: Number, default: 0 },
  
  // البدلات الثابتة
  allowances: {
    transportation: { type: Number, default: 0 },
    housing: { type: Number, default: 0 },
    meal: { type: Number, default: 0 }
  },
  
  // الخصومات الثابتة
  deductions: {
    socialInsurance: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }
  },

  // التعديلات الشهرية (مكافآت وخصومات)
  monthlyAdjustments: {
    bonuses: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      type: { type: String, required: true }, // مكافأة أداء، مكافأة عيد، إضافي
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      description: { type: String, required: true },
      reason: { type: String },
      addedBy: { type: String },
      month: { type: String, default: () => new Date().toISOString().slice(0, 7) }, // YYYY-MM
      isActive: { type: Boolean, default: true }
    }],
    deductions: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      type: { type: String, required: true }, // خصم غياب، خصم تأخير، خصم شخصي
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      description: { type: String, required: true },
      reason: { type: String },
      addedBy: { type: String },
      month: { type: String, default: () => new Date().toISOString().slice(0, 7) }, // YYYY-MM
      isActive: { type: Boolean, default: true }
    }]
  },

  // تتبع الدفعات الشهرية
  monthlyPayments: [{
    month: { type: String, required: true }, // YYYY-MM
    salaryCalculation: {
      baseSalary: { type: Number, default: 0 },
      allowancesTotal: { type: Number, default: 0 },
      allowancesBreakdown: {
        transportation: { type: Number, default: 0 },
        housing: { type: Number, default: 0 },
        meal: { type: Number, default: 0 }
      },
      bonusesTotal: { type: Number, default: 0 },
      bonusesBreakdown: [{ 
        id: String,
        type: String,
        amount: Number,
        description: String,
        date: Date
      }],
      deductionsTotal: { type: Number, default: 0 },
      deductionsBreakdown: {
        fixed: {
          socialInsurance: { type: Number, default: 0 },
          tax: { type: Number, default: 0 }
        },
        adjustments: [{
          id: String,
          type: String,
          amount: Number,
          description: String,
          date: Date
        }]
      },
      grossSalary: { type: Number, default: 0 }, // الراتب الإجمالي
      netSalary: { type: Number, default: 0 } // صافي الراتب
    },
    payments: [{
      id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      paymentType: { 
        type: String, 
        enum: ['full', 'partial', 'advance'], 
        required: true 
      },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      description: String,
      note: String,
      paidBy: String,
      remainingAmount: { type: Number, default: 0 }
    }],
    totalPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'partial', 'completed'], 
      default: 'pending' 
    },
    lastUpdated: { type: Date, default: Date.now }
  }],

  // معلومات الحضور
  attendance: {
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    leaveBalance: { type: Number, default: 21 },
    dailyAttendance: [{
      date: Date,
      checkIn: String,
      checkOut: String,
      hours: Number,
      status: String
    }]
  },

  // معلومات الأداء
  performance: {
    rating: { type: Number, default: 0 },
    lastReview: { type: Date, default: Date.now },
    goals: [String],
    achievements: [String]
  },

  // معلومات الإجازات
  leaveRequests: [{
    id: Number,
    type: String,
    startDate: Date,
    endDate: Date,
    days: Number,
    status: String,
    reason: String
  }],

  // الطلبات الإدارية
  requests: [{
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    type: { type: String, required: true }, // إجازة سنوية، إجازة مرضية، شهادة راتب، تعديل بيانات
    date: { type: Date, default: Date.now },
    duration: { type: String, default: '-' }, // للإجازات
    status: { 
      type: String, 
      enum: ['قيد المراجعة', 'موافق عليها', 'مرفوضة', 'مكتملة'],
      default: 'قيد المراجعة'
    },
    description: String,
    reason: String,
    approvedBy: String,
    approvedAt: Date,
    rejectionReason: String,
    isActive: { type: Boolean, default: true }
  }],

  // الإشعارات
  notifications: [{
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['success', 'info', 'warning', 'error'],
      default: 'info'
    },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  }],

  // سجل الرواتب التاريخي
  salaryHistory: [{
    date: Date,
    baseSalary: Number,
    allowances: Number,
    bonuses: Number,
    deductions: Number,
    netSalary: Number,
    paymentType: String,
    month: String
  }],

  // معلومات إضافية
  skills: { type: [String], default: [] },
  projects: { type: [String], default: [] },
  experience: { type: String, default: '' },
  education: { type: String, default: '' },
  maritalStatus: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
    address: String
  },

  // معلومات العمل
  workSchedule: {
    startTime: String,
    endTime: String,
    workDays: [String],
    breakTime: String
  },

  // معلومات المزايا
  benefits: {
    medicalInsurance: { type: Boolean, default: true },
    lifeInsurance: { type: Boolean, default: true },
    transportationAllowance: { type: Number, default: 0 },
    mealAllowance: { type: Number, default: 0 }
  },

  // معلومات النظام
  documents: [String],
  notes: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

employeeSchema.index({ employeeNumber: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ createdAt: -1 });
employeeSchema.index({ name: 'text', email: 'text' });
employeeSchema.index({ 'monthlyPayments.month': 1 });

// حساب الراتب للشهر المحدد
employeeSchema.methods.calculateMonthlySalary = function(month = null) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  
  // الراتب الأساسي
  const baseSalary = this.baseSalary || 0;
  
  // البدلات الثابتة
  const allowancesTotal = Object.values(this.allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
  
  // الخصومات الثابتة
  const fixedDeductionsTotal = Object.values(this.deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
  
  // المكافآت للشهر المحدد
  const monthlyBonuses = (this.monthlyAdjustments?.bonuses || [])
    .filter(bonus => bonus.isActive && (bonus.month === targetMonth || !bonus.month))
    .reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
  
  // الخصومات الإضافية للشهر المحدد
  const monthlyDeductions = (this.monthlyAdjustments?.deductions || [])
    .filter(deduction => deduction.isActive && (deduction.month === targetMonth || !deduction.month))
    .reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
  
  // الراتب الإجمالي والصافي
  const grossSalary = baseSalary + allowancesTotal + monthlyBonuses;
  const netSalary = grossSalary - fixedDeductionsTotal - monthlyDeductions;
  
  return {
    month: targetMonth,
    baseSalary,
    allowancesTotal,
    allowancesBreakdown: this.allowances,
    bonusesTotal: monthlyBonuses,
    bonusesBreakdown: (this.monthlyAdjustments?.bonuses || [])
      .filter(bonus => bonus.isActive && (bonus.month === targetMonth || !bonus.month)),
    deductionsTotal: fixedDeductionsTotal + monthlyDeductions,
    deductionsBreakdown: {
      fixed: this.deductions,
      adjustments: (this.monthlyAdjustments?.deductions || [])
        .filter(deduction => deduction.isActive && (deduction.month === targetMonth || !deduction.month))
    },
    grossSalary,
    netSalary
  };
};

// إضافة مكافأة
employeeSchema.methods.addBonus = function(bonusData) {
  if (!this.monthlyAdjustments) {
    this.monthlyAdjustments = { bonuses: [], deductions: [] };
  }
  if (!this.monthlyAdjustments.bonuses) {
    this.monthlyAdjustments.bonuses = [];
  }
  
  const bonus = {
    id: new mongoose.Types.ObjectId().toString(),
    type: bonusData.type,
    amount: bonusData.amount,
    description: bonusData.description,
    reason: bonusData.reason,
    addedBy: bonusData.addedBy,
    month: bonusData.month || new Date().toISOString().slice(0, 7),
    date: new Date(),
    isActive: true
  };
  
  this.monthlyAdjustments.bonuses.push(bonus);
  return bonus;
};

// إضافة خصم
employeeSchema.methods.addDeduction = function(deductionData) {
  if (!this.monthlyAdjustments) {
    this.monthlyAdjustments = { bonuses: [], deductions: [] };
  }
  if (!this.monthlyAdjustments.deductions) {
    this.monthlyAdjustments.deductions = [];
  }
  
  const deduction = {
    id: new mongoose.Types.ObjectId().toString(),
    type: deductionData.type,
    amount: deductionData.amount,
    description: deductionData.description,
    reason: deductionData.reason,
    addedBy: deductionData.addedBy,
    month: deductionData.month || new Date().toISOString().slice(0, 7),
    date: new Date(),
    isActive: true
  };
  
  this.monthlyAdjustments.deductions.push(deduction);
  return deduction;
};

// إضافة أو تحديث بيانات الدفع للشهر
employeeSchema.methods.updateMonthlyPayment = function(month, paymentData) {
  if (!this.monthlyPayments) {
    this.monthlyPayments = [];
  }
  
  let monthlyPayment = this.monthlyPayments.find(mp => mp.month === month);
  
  if (!monthlyPayment) {
    // حساب الراتب للشهر
    const salaryCalculation = this.calculateMonthlySalary(month);
    
    monthlyPayment = {
      month,
      salaryCalculation,
      payments: [],
      totalPaid: 0,
      remainingAmount: salaryCalculation.netSalary,
      status: 'pending',
      lastUpdated: new Date()
    };
    
    this.monthlyPayments.push(monthlyPayment);
  } else {
    // تحديث حساب الراتب
    monthlyPayment.salaryCalculation = this.calculateMonthlySalary(month);
    monthlyPayment.remainingAmount = monthlyPayment.salaryCalculation.netSalary - monthlyPayment.totalPaid;
  }
  
  if (paymentData) {
    const payment = {
      id: new mongoose.Types.ObjectId().toString(),
      paymentType: paymentData.paymentType,
      amount: paymentData.amount,
      date: new Date(),
      description: paymentData.description,
      note: paymentData.note,
      paidBy: paymentData.paidBy
    };
    
    monthlyPayment.payments.push(payment);
    monthlyPayment.totalPaid += paymentData.amount;
    monthlyPayment.remainingAmount = monthlyPayment.salaryCalculation.netSalary - monthlyPayment.totalPaid;
    
    // تحديث الحالة
    if (monthlyPayment.remainingAmount <= 0) {
      monthlyPayment.status = 'completed';
    } else if (monthlyPayment.totalPaid > 0) {
      monthlyPayment.status = 'partial';
    }
    
    monthlyPayment.lastUpdated = new Date();
  }
  
  return monthlyPayment;
};

// الحصول على بيانات الدفع للشهر الحالي
employeeSchema.methods.getCurrentMonthPayment = function() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return this.monthlyPayments?.find(mp => mp.month === currentMonth) || null;
};

// حساب معدل الحضور
employeeSchema.methods.calculateAttendanceRate = function() {
  if (!this.attendance.totalWorkingDays) return 0;
  return Math.round((this.attendance.presentDays / this.attendance.totalWorkingDays) * 100);
};

module.exports = mongoose.model('Employee', employeeSchema); 