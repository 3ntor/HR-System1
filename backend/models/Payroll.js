const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  // معرف الموظف
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },

  // معلومات الراتب
  month: {
    type: String,
    required: true, // بتنسيق "2024-01"
  },
  
  year: {
    type: Number,
    required: true
  },

  // تفاصيل الراتب
  salaryDetails: {
    baseSalary: { type: Number, required: true },
    allowances: {
      transportation: { type: Number, default: 0 },
      housing: { type: Number, default: 0 },
      meal: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    bonuses: [{
      type: String,
      amount: Number,
      reason: String,
      date: { type: Date, default: Date.now }
    }],
    deductions: {
      insurance: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      loans: { type: Number, default: 0 },
      absence: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    otherDeductions: [{
      type: String,
      amount: Number,
      reason: String,
      date: { type: Date, default: Date.now }
    }],
    grossSalary: { type: Number, required: true },
    netSalary: { type: Number, required: true }
  },

  // حالة الراتب
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'partially_paid', 'cancelled'],
    default: 'pending'
  },

  // معلومات الدفع
  paymentInfo: {
    method: {
      type: String,
      enum: ['bank_transfer', 'cash', 'check', 'paypal', 'other'],
      default: 'bank_transfer'
    },
    bankAccount: String,
    referenceNumber: String,
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // الدفعات الجزئية
  partialPayments: [{
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    reason: String,
    method: String,
    referenceNumber: String,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // الدفع المبكر
  earlyPayment: {
    isEarly: { type: Boolean, default: false },
    originalDueDate: Date,
    actualPayDate: Date,
    reason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },

  // تواريخ مهمة
  dueDate: {
    type: Date,
    required: true
  },

  // ملاحظات وتعليقات
  notes: String,
  
  // تتبع التعديلات
  history: [{
    action: String,
    details: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: { type: Date, default: Date.now }
  }],

  // معلومات النظام
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// إنشاء فهارس للبحث السريع
payrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ dueDate: 1 });
payrollSchema.index({ 'paymentInfo.paidAt': 1 });

// دالة لحساب المبلغ المدفوع من الدفعات الجزئية
payrollSchema.methods.getTotalPaidAmount = function() {
  return this.partialPayments.reduce((total, payment) => total + payment.amount, 0);
};

// دالة لحساب المبلغ المتبقي
payrollSchema.methods.getRemainingAmount = function() {
  return this.salaryDetails.netSalary - this.getTotalPaidAmount();
};

// دالة للتحقق من إكتمال الدفع
payrollSchema.methods.isFullyPaid = function() {
  return this.getRemainingAmount() <= 0;
};

// دالة قبل الحفظ لتحديث الحالة
payrollSchema.pre('save', function(next) {
  // تحديث updatedBy
  if (this.isModified() && !this.isNew) {
    this.updatedBy = this.updatedBy || this.createdBy;
  }

  // تحديث الحالة بناءً على الدفعات
  const totalPaid = this.getTotalPaidAmount();
  const netSalary = this.salaryDetails.netSalary;

  if (totalPaid >= netSalary) {
    this.status = 'paid';
    if (!this.paymentInfo.paidAt) {
      this.paymentInfo.paidAt = new Date();
    }
  } else if (totalPaid > 0) {
    this.status = 'partially_paid';
  }

  next();
});

module.exports = mongoose.model('Payroll', payrollSchema); 