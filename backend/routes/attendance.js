const express = require('express');
const router = express.Router();
const sendError = require('../utils/sendError');
const { requireAuth, requireRole } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// GET attendance records for an employee
router.get('/employee/:employeeId', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filter = { employeeId: req.params.employeeId };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('employeeId', 'name employeeNumber department position');

    res.json({
      success: true,
      data: attendance
    });
  } catch (err) {
    sendError(res, 500, 'خطأ في جلب سجلات الحضور', 'INTERNAL_ERROR', err.message);
  }
});

// GET today's attendance status for an employee
router.get('/employee/:employeeId/today', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: req.params.employeeId,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: attendance || { status: 'absent' }
    });
  } catch (err) {
    sendError(res, 500, 'خطأ في جلب حالة الحضور اليوم', 'INTERNAL_ERROR', err.message);
  }
});

// POST check-in
router.post('/check-in', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return sendError(res, 400, 'تم تسجيل الحضور مسبقاً اليوم', 'DUPLICATE_ENTRY');
    }

    // Get employee's work schedule
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
    }

    const workStartTime = new Date(today);
    const [hours, minutes] = employee.workSchedule.startTime.split(':');
    workStartTime.setHours(parseInt(hours), parseInt(minutes), 0);

    // Determine if late
    const status = today > workStartTime ? 'late' : 'present';

    const attendance = existingAttendance || new Attendance({
      employeeId: req.user.id,
      date: today,
      status
    });

    attendance.checkIn = {
      time: new Date(),
      location: req.body.location,
      device: req.body.device,
      ip: req.ip
    };

    await attendance.save();

    res.json({
      success: true,
      message: 'تم تسجيل الحضور بنجاح',
      data: attendance
    });
  } catch (err) {
    sendError(res, 500, 'خطأ في تسجيل الحضور', 'INTERNAL_ERROR', err.message);
  }
});

// POST check-out
router.post('/check-out', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance) {
      return sendError(res, 400, 'لم يتم تسجيل الحضور اليوم', 'NOT_FOUND');
    }

    if (attendance.checkOut) {
      return sendError(res, 400, 'تم تسجيل الانصراف مسبقاً اليوم', 'DUPLICATE_ENTRY');
    }

    // Get employee's work schedule
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return sendError(res, 404, 'الموظف غير موجود', 'NOT_FOUND');
    }

    const workEndTime = new Date(today);
    const [hours, minutes] = employee.workSchedule.endTime.split(':');
    workEndTime.setHours(parseInt(hours), parseInt(minutes), 0);

    attendance.checkOut = {
      time: new Date(),
      location: req.body.location,
      device: req.body.device,
      ip: req.ip
    };

    // Calculate working hours and overtime
    attendance.calculateWorkingHours();
    // حساب الساعات المطلوبة
    let requiredHours = 0;
    if (employee.workSchedule && employee.workSchedule.startTime && employee.workSchedule.endTime) {
      const [startH, startM] = employee.workSchedule.startTime.split(':');
      const [endH, endM] = employee.workSchedule.endTime.split(':');
      const start = new Date(today);
      start.setHours(parseInt(startH), parseInt(startM), 0);
      const end = new Date(today);
      end.setHours(parseInt(endH), parseInt(endM), 0);
      requiredHours = (end - start) / (1000 * 60 * 60);
    }
    // حساب الساعات الفعلية
    const actualHours = attendance.workingHours || 0;
    // منطق الخصم أو الإضافة
    if (actualHours < requiredHours) {
      attendance.deductionHours = Math.round((requiredHours - actualHours) * 10) / 10;
      attendance.overtimeHours = 0;
    } else if (actualHours > requiredHours) {
      attendance.overtimeHours = Math.round((actualHours - requiredHours) * 10) / 10;
      attendance.deductionHours = 0;
    } else {
      attendance.deductionHours = 0;
      attendance.overtimeHours = 0;
    }
    // حساب overtime القديم (للتوافق)
    if (attendance.checkOut.time > workEndTime) {
      const overtimeDiff = attendance.checkOut.time - workEndTime;
      attendance.overtime = Math.round(overtimeDiff / (1000 * 60 * 60) * 10) / 10;
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'تم تسجيل الانصراف بنجاح',
      data: attendance
    });
  } catch (err) {
    sendError(res, 500, 'خطأ في تسجيل الانصراف', 'INTERNAL_ERROR', err.message);
  }
});

// GET attendance statistics
router.get('/stats', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (department) {
      const employees = await Employee.find({ department });
      filter.employeeId = { $in: employees.map(emp => emp._id) };
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$workingHours' },
          totalOvertime: { $sum: '$overtime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    sendError(res, 500, 'خطأ في جلب إحصائيات الحضور', 'INTERNAL_ERROR', err.message);
  }
});

module.exports = router; 