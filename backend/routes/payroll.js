const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const sendError = require('../utils/sendError');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

// دالة مساعدة لحساب الراتب الصافي
const calculateNetSalary = (employee) => {
  const baseSalary = employee.baseSalary || 0;
  const allowances = employee.allowances || {};
  const benefits = employee.benefits || {};
  const deductions = employee.deductions || {};
  const monthlyAdjustments = employee.monthlyAdjustments || { bonuses: [], deductions: [] };

  const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + (val || 0), 0) +
                         Object.values(benefits).reduce((sum, val) => sum + (val || 0), 0);
  
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
  
  const monthlyBonuses = monthlyAdjustments.bonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
  const monthlyDeductionsAmount = monthlyAdjustments.deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);

  const grossSalary = baseSalary + totalAllowances + monthlyBonuses;
  const netSalary = grossSalary - totalDeductions - monthlyDeductionsAmount;

  return {
    baseSalary,
    totalAllowances,
    totalDeductions,
    monthlyBonuses,
    monthlyDeductionsAmount,
    grossSalary,
    netSalary
  };
};

// دالة لحساب تاريخ استحقاق الراتب (آخر يوم في الشهر)
const getPaymentDeadline = (month) => {
  const [year, monthNum] = month.split('-');
  return new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
};

// GET - جلب كشف الرواتب للشهر المحدد
router.get('/', requireAuth, async (req, res) => {
  try {
    const { month, year, department, status, search } = req.query;
    
    // تحديد الشهر الافتراضي (الشهر الحالي)
    const currentDate = new Date();
    const defaultMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const defaultYear = year || currentDate.getFullYear();

    // جلب الموظفين مع الفلترة
    const employeeFilter = {};
    if (department && department !== 'all') employeeFilter.department = department;
    if (search) {
      employeeFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(employeeFilter);

    // جلب كشوف الرواتب للشهر المحدد
    const payrolls = await Payroll.find({ 
      month: defaultMonth, 
      ...(status && status !== 'all' ? { status } : {})
    })
    .populate('employeeId', 'name email department position')
    .populate('paymentInfo.paidBy', 'username')
    .populate('partialPayments.paidBy', 'username');

    // دمج بيانات الموظفين مع كشوف الرواتب
    const payrollData = employees.map(employee => {
      const existingPayroll = payrolls.find(p => p.employeeId && p.employeeId._id.toString() === employee._id.toString());
      
      if (existingPayroll) {
        return {
          ...employee.toObject(),
          payroll: existingPayroll,
          paymentStatus: existingPayroll.status,
          netSalary: existingPayroll.salaryDetails.netSalary,
          totalPaid: existingPayroll.getTotalPaidAmount(),
          remainingAmount: existingPayroll.getRemainingAmount(),
          isFullyPaid: existingPayroll.isFullyPaid(),
          partialPayments: existingPayroll.partialPayments,
          earlyPayment: existingPayroll.earlyPayment
        };
      } else {
        // إنشاء حسابات للموظفين الذين ليس لديهم كشف راتب
        const salaryCalc = calculateNetSalary(employee);
        return {
          ...employee.toObject(),
          payroll: null,
          paymentStatus: 'pending',
          netSalary: salaryCalc.netSalary,
          totalPaid: 0,
          remainingAmount: salaryCalc.netSalary,
          isFullyPaid: false,
          partialPayments: [],
          earlyPayment: { isEarly: false }
        };
      }
    });

    res.json({
      success: true,
      data: payrollData,
      summary: {
        totalEmployees: employees.length,
        totalPayrolls: payrolls.length,
        totalSalaries: payrollData.reduce((sum, emp) => sum + emp.netSalary, 0),
        totalPaid: payrollData.reduce((sum, emp) => sum + emp.totalPaid, 0),
        totalRemaining: payrollData.reduce((sum, emp) => sum + emp.remainingAmount, 0),
        statusCounts: {
          paid: payrollData.filter(emp => emp.paymentStatus === 'paid').length,
          partially_paid: payrollData.filter(emp => emp.paymentStatus === 'partially_paid').length,
          pending: payrollData.filter(emp => emp.paymentStatus === 'pending').length
        }
      },
      currentMonth: defaultMonth,
      currentYear: defaultYear
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    sendError(res, 500, 'خطأ في جلب كشف الرواتب', 'INTERNAL_ERROR', error.message);
  }
});

// POST - إنشاء كشف راتب جديد أو تحديث موجود
router.post('/generate', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { month, employeeIds } = req.body;
    
    if (!month) {
      return sendError(res, 400, 'الشهر مطلوب', 'VALIDATION_ERROR');
    }

    const [year, monthNum] = month.split('-');
    const dueDate = getPaymentDeadline(month);

    // تحديد الموظفين المراد إنشاء كشوف رواتب لهم
    const employeeFilter = employeeIds && employeeIds.length > 0 
      ? { _id: { $in: employeeIds } } 
      : { status: 'نشط' };

    const employees = await Employee.find(employeeFilter);
    const created = [];
    const updated = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // التحقق من وجود كشف راتب للشهر
        let payroll = await Payroll.findOne({ 
          employeeId: employee._id, 
          month: month 
        });

        const salaryCalc = calculateNetSalary(employee);

        const payrollData = {
          employeeId: employee._id,
          month: month,
          year: parseInt(year),
          dueDate: dueDate,
          salaryDetails: {
            baseSalary: salaryCalc.baseSalary,
            allowances: {
              transportation: employee.allowances?.transportation || employee.benefits?.transportationAllowance || 0,
              housing: employee.allowances?.housing || employee.benefits?.housingAllowance || 0,
              meal: employee.allowances?.meal || employee.benefits?.mealAllowance || 0,
              performance: employee.benefits?.performanceAllowance || 0,
              other: 0
            },
            bonuses: employee.monthlyAdjustments?.bonuses || [],
            deductions: {
              insurance: employee.deductions?.socialInsurance || 0,
              taxes: employee.deductions?.tax || 0,
              loans: 0,
              absence: 0,
              other: 0
            },
            otherDeductions: employee.monthlyAdjustments?.deductions || [],
            grossSalary: salaryCalc.grossSalary,
            netSalary: salaryCalc.netSalary
          },
          createdBy: req.user.id,
          updatedBy: req.user.id
        };

        if (payroll) {
          // تحديث كشف راتب موجود
          Object.assign(payroll, payrollData);
          await payroll.save();
          updated.push({ employee: employee.name, payrollId: payroll._id });
        } else {
          // إنشاء كشف راتب جديد
          payroll = new Payroll(payrollData);
          await payroll.save();
          created.push({ employee: employee.name, payrollId: payroll._id });
        }
      } catch (error) {
        errors.push({ employee: employee.name, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `تم إنشاء ${created.length} كشف راتب جديد وتحديث ${updated.length} كشف موجود`,
      data: {
        created,
        updated,
        errors
      }
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    sendError(res, 500, 'خطأ في إنشاء كشف الرواتب', 'INTERNAL_ERROR', error.message);
  }
});

// POST - دفع راتب موظف (كامل أو مبكر)
router.post('/:employeeId/pay', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, paymentMethod = 'bank_transfer', referenceNumber, notes, isEarlyPayment = false, earlyPaymentReason } = req.body;

    // الحصول على الشهر الافتراضي
    const currentDate = new Date();
    const payrollMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // البحث عن كشف الراتب أو إنشاء واحد جديد
    let payroll = await Payroll.findOne({ 
      employeeId: employeeId, 
      month: payrollMonth 
    });

    if (!payroll) {
      // إنشاء كشف راتب جديد
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
      }

      const salaryCalc = calculateNetSalary(employee);
      const [year] = payrollMonth.split('-');

      payroll = new Payroll({
        employeeId: employeeId,
        month: payrollMonth,
        year: parseInt(year),
        dueDate: getPaymentDeadline(payrollMonth),
        salaryDetails: {
          baseSalary: salaryCalc.baseSalary,
          allowances: {
            transportation: employee.allowances?.transportation || employee.benefits?.transportationAllowance || 0,
            housing: employee.allowances?.housing || employee.benefits?.housingAllowance || 0,
            meal: employee.allowances?.meal || employee.benefits?.mealAllowance || 0,
            performance: employee.benefits?.performanceAllowance || 0,
            other: 0
          },
          bonuses: employee.monthlyAdjustments?.bonuses || [],
          deductions: {
            insurance: employee.deductions?.socialInsurance || 0,
            taxes: employee.deductions?.tax || 0,
            loans: 0,
            absence: 0,
            other: 0
          },
          otherDeductions: employee.monthlyAdjustments?.deductions || [],
          grossSalary: salaryCalc.grossSalary,
          netSalary: salaryCalc.netSalary
        },
        createdBy: req.user.id
      });
    }

    // التحقق من عدم الدفع المسبق
    if (payroll.status === 'paid') {
      return sendError(res, 400, 'تم دفع هذا الراتب بالفعل', 'ALREADY_PAID');
    }

    // إضافة دفعة جزئية بالمبلغ المتبقي (أي دفع كامل)
    const remainingAmount = payroll.getRemainingAmount();
    
    payroll.partialPayments.push({
      amount: remainingAmount,
      paidAt: new Date(),
      reason: isEarlyPayment ? earlyPaymentReason : 'دفع راتب كامل',
      method: paymentMethod,
      referenceNumber: referenceNumber,
      paidBy: req.user.id
    });

    // تحديث معلومات الدفع
    payroll.paymentInfo = {
      method: paymentMethod,
      referenceNumber: referenceNumber,
      paidAt: new Date(),
      paidBy: req.user.id
    };

    // تحديث معلومات الدفع المبكر إذا كان ينطبق
    if (isEarlyPayment) {
      payroll.earlyPayment = {
        isEarly: true,
        originalDueDate: payroll.dueDate,
        actualPayDate: new Date(),
        reason: earlyPaymentReason,
        approvedBy: req.user.id,
        approvedAt: new Date()
      };
    }

    payroll.status = 'paid';
    payroll.notes = notes;
    payroll.updatedBy = req.user.id;

    // إضافة سجل في التاريخ
    payroll.history.push({
      action: isEarlyPayment ? 'early_payment' : 'full_payment',
      details: `تم دفع راتب ${payrollMonth} بمبلغ ${remainingAmount} ريال`,
      performedBy: req.user.id
    });

    await payroll.save();

    res.json({
      success: true,
      message: `تم دفع راتب ${isEarlyPayment ? 'مبكر' : 'كامل'} للموظف بنجاح`,
      data: {
        payrollId: payroll._id,
        amount: remainingAmount,
        status: payroll.status,
        paidAt: payroll.paymentInfo.paidAt,
        isEarlyPayment: payroll.earlyPayment.isEarly
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    sendError(res, 500, 'خطأ في معالجة الدفع', 'INTERNAL_ERROR', error.message);
  }
});

// POST - دفع جزئي لراتب موظف
router.post('/:employeeId/partial-pay', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, amount, reason, paymentMethod = 'bank_transfer', referenceNumber } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 400, 'مبلغ الدفع يجب أن يكون أكبر من صفر', 'VALIDATION_ERROR');
    }

    // الحصول على الشهر الافتراضي
    const currentDate = new Date();
    const payrollMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // البحث عن كشف الراتب أو إنشاء واحد جديد
    let payroll = await Payroll.findOne({ 
      employeeId: employeeId, 
      month: payrollMonth 
    });

    if (!payroll) {
      // إنشاء كشف راتب جديد
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
      }

      const salaryCalc = calculateNetSalary(employee);
      const [year] = payrollMonth.split('-');

      payroll = new Payroll({
        employeeId: employeeId,
        month: payrollMonth,
        year: parseInt(year),
        dueDate: getPaymentDeadline(payrollMonth),
        salaryDetails: {
          baseSalary: salaryCalc.baseSalary,
          allowances: {
            transportation: employee.allowances?.transportation || employee.benefits?.transportationAllowance || 0,
            housing: employee.allowances?.housing || employee.benefits?.housingAllowance || 0,
            meal: employee.allowances?.meal || employee.benefits?.mealAllowance || 0,
            performance: employee.benefits?.performanceAllowance || 0,
            other: 0
          },
          bonuses: employee.monthlyAdjustments?.bonuses || [],
          deductions: {
            insurance: employee.deductions?.socialInsurance || 0,
            taxes: employee.deductions?.tax || 0,
            loans: 0,
            absence: 0,
            other: 0
          },
          otherDeductions: employee.monthlyAdjustments?.deductions || [],
          grossSalary: salaryCalc.grossSalary,
          netSalary: salaryCalc.netSalary
        },
        createdBy: req.user.id
      });
    }

    const remainingAmount = payroll.getRemainingAmount();

    // التحقق من أن المبلغ لا يتجاوز المبلغ المتبقي
    if (amount > remainingAmount) {
      return sendError(res, 400, `المبلغ يتجاوز المبلغ المتبقي (${remainingAmount} ريال)`, 'VALIDATION_ERROR');
    }

    // إضافة الدفعة الجزئية
    payroll.partialPayments.push({
      amount: parseFloat(amount),
      paidAt: new Date(),
      reason: reason || 'دفعة جزئية',
      method: paymentMethod,
      referenceNumber: referenceNumber,
      paidBy: req.user.id
    });

    payroll.updatedBy = req.user.id;

    // إضافة سجل في التاريخ
    payroll.history.push({
      action: 'partial_payment',
      details: `دفعة جزئية بمبلغ ${amount} ريال - السبب: ${reason || 'غير محدد'}`,
      performedBy: req.user.id
    });

    await payroll.save();

    res.json({
      success: true,
      message: 'تم إضافة الدفعة الجزئية بنجاح',
      data: {
        payrollId: payroll._id,
        paidAmount: amount,
        totalPaid: payroll.getTotalPaidAmount(),
        remainingAmount: payroll.getRemainingAmount(),
        status: payroll.status,
        isFullyPaid: payroll.isFullyPaid()
      }
    });
  } catch (error) {
    console.error('Error processing partial payment:', error);
    sendError(res, 500, 'خطأ في معالجة الدفعة الجزئية', 'INTERNAL_ERROR', error.message);
  }
});

// GET - جلب تفاصيل كشف راتب موظف معين
router.get('/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;

    // الحصول على الشهر الافتراضي
    const currentDate = new Date();
    const payrollMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const payroll = await Payroll.findOne({ 
      employeeId: employeeId, 
      month: payrollMonth 
    })
    .populate('employeeId', 'name email department position baseSalary allowances benefits deductions monthlyAdjustments')
    .populate('paymentInfo.paidBy', 'username')
    .populate('partialPayments.paidBy', 'username')
    .populate('earlyPayment.approvedBy', 'username')
    .populate('history.performedBy', 'username');

    if (!payroll) {
      // إذا لم يوجد كشف راتب، قم بإنشاء واحد افتراضي
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
      }

      const salaryCalc = calculateNetSalary(employee);
      
      return res.json({
        success: true,
        data: {
          employee: employee,
          payroll: null,
          salaryCalculation: salaryCalc,
          paymentStatus: 'pending',
          totalPaid: 0,
          remainingAmount: salaryCalc.netSalary,
          isFullyPaid: false,
          partialPayments: [],
          earlyPayment: { isEarly: false }
        }
      });
    }

    res.json({
      success: true,
      data: {
        employee: payroll.employeeId,
        payroll: payroll,
        salaryCalculation: {
          baseSalary: payroll.salaryDetails.baseSalary,
          totalAllowances: Object.values(payroll.salaryDetails.allowances).reduce((sum, val) => sum + val, 0),
          totalDeductions: Object.values(payroll.salaryDetails.deductions).reduce((sum, val) => sum + val, 0),
          grossSalary: payroll.salaryDetails.grossSalary,
          netSalary: payroll.salaryDetails.netSalary
        },
        paymentStatus: payroll.status,
        totalPaid: payroll.getTotalPaidAmount(),
        remainingAmount: payroll.getRemainingAmount(),
        isFullyPaid: payroll.isFullyPaid(),
        partialPayments: payroll.partialPayments,
        earlyPayment: payroll.earlyPayment
      }
    });
  } catch (error) {
    console.error('Error fetching employee payroll:', error);
    sendError(res, 500, 'خطأ في جلب كشف راتب الموظف', 'INTERNAL_ERROR', error.message);
  }
});

// DELETE - حذف دفعة جزئية معينة
router.delete('/:employeeId/partial-payments/:paymentId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { employeeId, paymentId } = req.params;
    const { month } = req.query;

    // الحصول على الشهر الافتراضي
    const currentDate = new Date();
    const payrollMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // البحث عن كشف الراتب
    const payroll = await Payroll.findOne({ 
      employeeId: employeeId, 
      month: payrollMonth 
    });

    if (!payroll) {
      return sendError(res, 404, 'كشف الراتب غير موجود', 'NOT_FOUND');
    }

    // البحث عن الدفعة الجزئية وحذفها
    const paymentIndex = payroll.partialPayments.findIndex(payment => payment._id.toString() === paymentId);
    
    if (paymentIndex === -1) {
      return sendError(res, 404, 'الدفعة الجزئية غير موجودة', 'NOT_FOUND');
    }

    const removedPayment = payroll.partialPayments[paymentIndex];
    payroll.partialPayments.splice(paymentIndex, 1);

    // إعادة حساب الحالة
    const totalPaid = payroll.getTotalPaidAmount();
    if (totalPaid >= payroll.salaryDetails.netSalary) {
      payroll.status = 'paid';
    } else if (totalPaid > 0) {
      payroll.status = 'partially_paid';
    } else {
      payroll.status = 'pending';
    }

    payroll.updatedBy = req.user.id;

    // إضافة سجل في التاريخ
    payroll.history.push({
      action: 'remove_partial_payment',
      details: `تم حذف دفعة جزئية بمبلغ ${removedPayment.amount} ريال`,
      performedBy: req.user.id
    });

    await payroll.save();

    res.json({
      success: true,
      message: 'تم حذف الدفعة الجزئية بنجاح',
      data: {
        payrollId: payroll._id,
        removedAmount: removedPayment.amount,
        totalPaid: payroll.getTotalPaidAmount(),
        remainingAmount: payroll.getRemainingAmount(),
        status: payroll.status
      }
    });
  } catch (error) {
    console.error('Error removing partial payment:', error);
    sendError(res, 500, 'خطأ في حذف الدفعة الجزئية', 'INTERNAL_ERROR', error.message);
  }
});

// PUT - تحديث المكافآت والخصومات الشهرية
router.put('/:employeeId/adjustments', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, type, adjustment } = req.body;

    // التحقق من صحة البيانات
    if (!type || !adjustment || !['bonus', 'deduction'].includes(type)) {
      return sendError(res, 400, 'نوع التعديل يجب أن يكون bonus أو deduction', 'VALIDATION_ERROR');
    }

    if (!adjustment.type || !adjustment.amount || adjustment.amount <= 0) {
      return sendError(res, 400, 'بيانات التعديل غير مكتملة', 'VALIDATION_ERROR');
    }

    // الحصول على الشهر الافتراضي
    const currentDate = new Date();
    const payrollMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // البحث عن الموظف أولاً لتحديث بياناته الأساسية
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
    }

    // تحديث البيانات في نموذج الموظف
    if (!employee.monthlyAdjustments) {
      employee.monthlyAdjustments = { bonuses: [], deductions: [] };
    }

    const adjustmentWithId = {
      ...adjustment,
      id: Date.now(),
      date: new Date()
    };

    if (type === 'bonus') {
      if (!employee.monthlyAdjustments.bonuses) {
        employee.monthlyAdjustments.bonuses = [];
      }
      employee.monthlyAdjustments.bonuses.push(adjustmentWithId);
    } else {
      if (!employee.monthlyAdjustments.deductions) {
        employee.monthlyAdjustments.deductions = [];
      }
      employee.monthlyAdjustments.deductions.push(adjustmentWithId);
    }

    await employee.save();

    // البحث عن كشف الراتب أو إنشاء واحد جديد
    let payroll = await Payroll.findOne({ 
      employeeId: employeeId, 
      month: payrollMonth 
    });

    if (!payroll) {
      // إنشاء كشف راتب جديد
      const salaryCalc = calculateNetSalary(employee);
      const [year] = payrollMonth.split('-');

      payroll = new Payroll({
        employeeId: employeeId,
        month: payrollMonth,
        year: parseInt(year),
        dueDate: getPaymentDeadline(payrollMonth),
        salaryDetails: {
          baseSalary: salaryCalc.baseSalary,
          allowances: {
            transportation: employee.allowances?.transportation || employee.benefits?.transportationAllowance || 0,
            housing: employee.allowances?.housing || employee.benefits?.housingAllowance || 0,
            meal: employee.allowances?.meal || employee.benefits?.mealAllowance || 0,
            performance: employee.benefits?.performanceAllowance || 0,
            other: 0
          },
          bonuses: employee.monthlyAdjustments?.bonuses || [],
          deductions: {
            insurance: employee.deductions?.socialInsurance || 0,
            taxes: employee.deductions?.tax || 0,
            loans: 0,
            absence: 0,
            other: 0
          },
          otherDeductions: employee.monthlyAdjustments?.deductions || [],
          grossSalary: salaryCalc.grossSalary,
          netSalary: salaryCalc.netSalary
        },
        createdBy: req.user.id
      });
    } else {
      // تحديث كشف الراتب الموجود
      if (payroll.status === 'paid') {
        return sendError(res, 400, 'لا يمكن تعديل راتب مدفوع بالكامل', 'CANNOT_MODIFY_PAID_SALARY');
      }

      const salaryCalc = calculateNetSalary(employee);
      
      // تحديث البونوسات والخصومات
      if (type === 'bonus') {
        payroll.salaryDetails.bonuses = employee.monthlyAdjustments.bonuses;
      } else {
        payroll.salaryDetails.otherDeductions = employee.monthlyAdjustments.deductions;
      }
      
      // إعادة حساب الراتب
      payroll.salaryDetails.grossSalary = salaryCalc.grossSalary;
      payroll.salaryDetails.netSalary = salaryCalc.netSalary;
      payroll.updatedBy = req.user.id;
    }

    // إضافة سجل في التاريخ
    payroll.history.push({
      action: `add_${type}`,
      details: `تم إضافة ${type === 'bonus' ? 'مكافأة' : 'خصم'}: ${adjustment.type} بمبلغ ${adjustment.amount} ريال`,
      performedBy: req.user.id
    });

    await payroll.save();

    res.json({
      success: true,
      message: `تم إضافة ${type === 'bonus' ? 'المكافأة' : 'الخصم'} بنجاح`,
      data: {
        payrollId: payroll._id,
        adjustment: adjustmentWithId,
        newNetSalary: payroll.salaryDetails.netSalary,
        status: payroll.status
      }
    });
  } catch (error) {
    console.error('Error updating adjustments:', error);
    sendError(res, 500, 'خطأ في تحديث التعديلات', 'INTERNAL_ERROR', error.message);
  }
});

// DELETE - حذف مكافأة أو خصم
router.delete('/:employeeId/adjustments/:adjustmentId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { employeeId, adjustmentId } = req.params;
    const { month, type } = req.query;

    if (!type || !['bonus', 'deduction'].includes(type)) {
      return sendError(res, 400, 'نوع التعديل يجب أن يكون bonus أو deduction', 'VALIDATION_ERROR');
    }

    // الحصول على الشهر الافتراضي
    const currentDate = new Date();
    const payrollMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // البحث عن الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
    }

    // البحث عن كشف الراتب
    const payroll = await Payroll.findOne({ 
      employeeId: employeeId, 
      month: payrollMonth 
    });

    if (!payroll) {
      return sendError(res, 404, 'كشف الراتب غير موجود', 'NOT_FOUND');
    }

    if (payroll.status === 'paid') {
      return sendError(res, 400, 'لا يمكن تعديل راتب مدفوع بالكامل', 'CANNOT_MODIFY_PAID_SALARY');
    }

    // حذف التعديل من بيانات الموظف
    let removedAdjustment = null;
    if (type === 'bonus') {
      const bonusIndex = employee.monthlyAdjustments?.bonuses?.findIndex(b => b.id == adjustmentId);
      if (bonusIndex >= 0) {
        removedAdjustment = employee.monthlyAdjustments.bonuses[bonusIndex];
        employee.monthlyAdjustments.bonuses.splice(bonusIndex, 1);
      }
    } else {
      const deductionIndex = employee.monthlyAdjustments?.deductions?.findIndex(d => d.id == adjustmentId);
      if (deductionIndex >= 0) {
        removedAdjustment = employee.monthlyAdjustments.deductions[deductionIndex];
        employee.monthlyAdjustments.deductions.splice(deductionIndex, 1);
      }
    }

    if (!removedAdjustment) {
      return sendError(res, 404, 'التعديل غير موجود', 'NOT_FOUND');
    }

    await employee.save();

    // تحديث كشف الراتب
    const salaryCalc = calculateNetSalary(employee);
    
    if (type === 'bonus') {
      payroll.salaryDetails.bonuses = employee.monthlyAdjustments.bonuses;
    } else {
      payroll.salaryDetails.otherDeductions = employee.monthlyAdjustments.deductions;
    }
    
    payroll.salaryDetails.grossSalary = salaryCalc.grossSalary;
    payroll.salaryDetails.netSalary = salaryCalc.netSalary;
    payroll.updatedBy = req.user.id;

    // إضافة سجل في التاريخ
    payroll.history.push({
      action: `remove_${type}`,
      details: `تم حذف ${type === 'bonus' ? 'مكافأة' : 'خصم'}: ${removedAdjustment.type} بمبلغ ${removedAdjustment.amount} ريال`,
      performedBy: req.user.id
    });

    await payroll.save();

    res.json({
      success: true,
      message: `تم حذف ${type === 'bonus' ? 'المكافأة' : 'الخصم'} بنجاح`,
      data: {
        payrollId: payroll._id,
        removedAdjustment,
        newNetSalary: payroll.salaryDetails.netSalary,
        status: payroll.status
      }
    });
  } catch (error) {
    console.error('Error removing adjustment:', error);
    sendError(res, 500, 'خطأ في حذف التعديل', 'INTERNAL_ERROR', error.message);
  }
});

// GET - إحصائيات الرواتب
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const targetYear = year || currentDate.getFullYear();

    // إحصائيات الموظفين
    const totalEmployees = await Employee.countDocuments({ status: 'نشط' });
    
    // إحصائيات كشوف الرواتب
    const payrollStats = await Payroll.aggregate([
      { $match: { month: targetMonth } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$salaryDetails.netSalary' },
          totalPaid: { 
            $sum: { 
              $reduce: {
                input: '$partialPayments',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.amount'] }
              }
            }
          }
        }
      }
    ]);

    // حساب الإجماليات
    const totalSalaries = payrollStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    const totalPaidAmount = payrollStats.reduce((sum, stat) => sum + stat.totalPaid, 0);
    const totalRemaining = totalSalaries - totalPaidAmount;

    // تنظيم الإحصائيات
    const statusCounts = {};
    payrollStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        employees: {
          total: totalEmployees,
          withPayroll: payrollStats.reduce((sum, stat) => sum + stat.count, 0),
          withoutPayroll: totalEmployees - payrollStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        financials: {
          totalSalaries: totalSalaries,
          totalPaid: totalPaidAmount,
          totalRemaining: totalRemaining,
          percentagePaid: totalSalaries > 0 ? Math.round((totalPaidAmount / totalSalaries) * 100) : 0
        },
        statusBreakdown: {
          paid: statusCounts.paid || 0,
          partially_paid: statusCounts.partially_paid || 0,
          pending: statusCounts.pending || 0,
          processing: statusCounts.processing || 0,
          cancelled: statusCounts.cancelled || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    sendError(res, 500, 'خطأ في جلب إحصائيات الرواتب', 'INTERNAL_ERROR', error.message);
  }
});

module.exports = router; 