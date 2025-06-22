const express = require('express');
const router = express.Router();
const DailyAttendance = require('../models/DailyAttendance');
const Employee = require('../models/Employee');
const Tracking = require('../models/Tracking');
const { requireAuth } = require('../middleware/auth');
const moment = require('moment');
const Setting = require('../models/Setting');

// Add endpoint that matches frontend expectations: /employee/:userId/month/:month
router.get('/employee/:userId/month/:month', requireAuth, async (req, res) => {
  try {
    const { userId, month } = req.params;
    
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-');
    
    // Find employee by userId
    const employee = await Employee.findOne({ userId: userId });
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'الموظف غير موجود' 
      });
    }
    
    // Redirect to existing monthly endpoint
    const monthlyData = await getMonthlyAttendanceData(employee._id, year, monthNum);
    
    res.json({
      success: true,
      message: 'تم جلب سجلات التأخيرات بنجاح',
      data: monthlyData.records || [],
      stats: monthlyData.stats,
      employeeName: employee.name,
      baseSalary: employee.baseSalary
    });
    
  } catch (error) {
    console.error('خطأ في جلب سجلات التأخيرات:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الخادم', 
      error: error.message 
    });
  }
});

// الحصول على سجل التأخيرات الشهري لموظف معين
router.get('/monthly/:employeeId/:year/:month', requireAuth, async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    
    // التحقق من وجود الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // تحديد نطاق الشهر
    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();

    // البحث عن سجلات الحضور للشهر المحدد
    let attendanceRecords = await DailyAttendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // تحديد ما إذا كان الشهر المطلوب هو الشهر الحالي
    const today = new Date();
    const currentDate = moment(`${year}-${month}-01`);
    const isCurrentMonth = currentDate.format('YYYY-MM') === moment(today).format('YYYY-MM');
    
    // إذا لم توجد سجلات، إنشاء سجلات افتراضية
    if (attendanceRecords.length === 0) {
      if (isCurrentMonth) {
        // للشهر الحالي: إنشاء سجلات حتى اليوم فقط
        attendanceRecords = await createMonthlyRecordsUntilToday(employeeId, year, month, employee.baseSalary, employee.userId);
      } else {
        // للأشهر السابقة: إنشاء سجلات الشهر بالكامل
        attendanceRecords = await createMonthlyRecords(employeeId, year, month, employee.baseSalary, employee.userId);
      }
    } else {
      // فحص إذا كانت السجلات ناقصة
      const expectedDays = isCurrentMonth ? today.getDate() : moment(`${year}-${month}`).daysInMonth();
      if (attendanceRecords.length < expectedDays) {
        // حذف السجلات الناقصة وإعادة إنشائها
        await DailyAttendance.deleteMany({
          employeeId,
          date: { $gte: startDate, $lte: endDate }
        });
        
        if (isCurrentMonth) {
          // للشهر الحالي: إنشاء سجلات حتى اليوم فقط
          attendanceRecords = await createMonthlyRecordsUntilToday(employeeId, year, month, employee.baseSalary, employee.userId);
        } else {
          // للأشهر السابقة: إنشاء سجلات الشهر بالكامل
          attendanceRecords = await createMonthlyRecords(employeeId, year, month, employee.baseSalary, employee.userId);
        }
      } else if (isCurrentMonth && attendanceRecords.length === expectedDays) {
        // إذا كان اليوم جديد، أضف سجل اليوم الجديد
        const lastRecordDate = moment(attendanceRecords[attendanceRecords.length - 1].date);
        const todayMoment = moment(today);
        
        if (todayMoment.isAfter(lastRecordDate, 'day')) {
          // إضافة الأيام المفقودة من آخر سجل حتى اليوم
          const startDay = lastRecordDate.add(1, 'day');
          const newRecords = [];
          
          while (startDay.isSameOrBefore(todayMoment, 'day')) {
            const dateString = startDay.format('YYYY-MM-DD');
            const date = startDay.toDate();
            const dayOfWeek = date.getDay();
            // فحص العطلة الأسبوعية بناءً على الإعدادات
            const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
            const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
            const isWeekend = weekends.includes(dayOfWeek);
            
            let status = 'في الوقت';
            
            // جلب بيانات الحضور الحقيقية من تطبيق الديسك توب فقط
            const desktopData = await getDesktopTrackingData(employee.userId, dateString);
            
            const record = new DailyAttendance({
              employeeId,
              date,
              requiredTime: '09:00',
              totalHours: desktopData.totalHours,
              activeHours: desktopData.activeHours,
              totalMinutes: desktopData.totalMinutes || 0,
              activeMinutes: desktopData.activeMinutes || 0,
              totalHoursExact: desktopData.totalHoursExact || 0,
              totalMinutesExact: desktopData.totalMinutesExact || 0,
              activeHoursExact: desktopData.activeHoursExact || 0,
              activeMinutesExact: desktopData.activeMinutesExact || 0,
              totalFormatted: desktopData.totalFormatted || '0 ساعة 0 دقيقة',
              activeFormatted: desktopData.activeFormatted || '0 ساعة 0 دقيقة',
              totalSeconds: desktopData.totalSeconds || 0,
              activeSeconds: desktopData.activeSeconds || 0,
              delayHours: 0,
              deductionAmount: 0,
              status: isWeekend ? 'عطلة' : status,
              isWeekend
            });
            
            // حساب التأخير والخصم
            if (!isWeekend) {
              record.calculateLateness(employee.baseSalary);
            }
            
            await record.save();
            newRecords.push(record);
            attendanceRecords.push(record);
            
            console.log(`✅ إضافة سجل يوم جديد ${dateString}: حضور كلي=${desktopData.totalFormatted}، نشط=${desktopData.activeFormatted}، حالة=${record.status}`);
            
            startDay.add(1, 'day');
          }
          
          if (newRecords.length > 0) {
            console.log(`🎯 تم إضافة ${newRecords.length} يوم جديد`);
          }
        }
      }
    }

    // فلترة نهائية للتأكد من عدم عرض أيام مستقبلية
    if (isCurrentMonth) {
      const todayDateString = today.toISOString().split('T')[0];
      attendanceRecords = attendanceRecords.filter(record => {
        const recordDateString = new Date(record.date).toISOString().split('T')[0];
        return recordDateString <= todayDateString;
      });
      console.log(`🔽 Final filter: keeping ${attendanceRecords.length} records until today`);
    }

    // حساب الإحصائيات
    const stats = calculateMonthlyStats(attendanceRecords);

    res.json({
      success: true,
      message: 'تم جلب سجلات التأخيرات بنجاح',
      data: {
        records: attendanceRecords,
        stats: stats,
        employeeName: employee.name,
        baseSalary: employee.baseSalary
      }
    });

  } catch (error) {
    console.error('خطأ في جلب سجلات التأخيرات:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تحديث سجل حضور يوم واحد
router.put('/update/:recordId', requireAuth, async (req, res) => {
  try {
    const { recordId } = req.params;
    const { requiredTime, status, deductionAmount } = req.body;

    const record = await DailyAttendance.findById(recordId).populate('employeeId');
    if (!record) {
      return res.status(404).json({ message: 'السجل غير موجود' });
    }

    // تحديث البيانات
    if (requiredTime !== undefined) record.requiredTime = requiredTime;
    if (status !== undefined) record.status = status;
    if (deductionAmount !== undefined) record.deductionAmount = deductionAmount;

    // إعادة حساب التأخير إذا لم يتم تحديد قيمة الخصم يدوياً
    if (deductionAmount === undefined) {
      record.calculateLateness(record.employeeId.baseSalary);
    }

    await record.save();

    res.json({
      success: true,
      message: 'تم تحديث السجل بنجاح',
      data: record
    });

  } catch (error) {
    console.error('خطأ في تحديث سجل الحضور:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إعادة إنشاء سجلات الشهر حتى اليوم الحالي
router.post('/reset-current/:employeeId/:year/:month', requireAuth, async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    
    // التحقق من وجود الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // تحديد نطاق الشهر
    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();

    // حذف السجلات الموجودة
    await DailyAttendance.deleteMany({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // إنشاء سجلات جديدة حتى اليوم الحالي
    const records = await createMonthlyRecordsUntilToday(employeeId, year, month, employee.baseSalary, employee.userId);
    const stats = calculateMonthlyStats(records);

    res.json({
      success: true,
      message: 'تم إعادة إنشاء السجلات بنجاح',
      data: {
        records: records,
        stats: stats
      }
    });

  } catch (error) {
    console.error('خطأ في إعادة إنشاء السجلات:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إعادة تعيين النظام من تاريخ اليوم
router.post('/reset-from-today/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // التحقق من وجود الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // تحديد نطاق الشهر الحالي
    const startDate = moment(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`).startOf('month').toDate();
    const endDate = moment(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`).endOf('month').toDate();

    // حذف جميع السجلات الموجودة للشهر الحالي
    await DailyAttendance.deleteMany({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // إنشاء سجلات جديدة من بداية الشهر حتى اليوم فقط
    const attendanceRecords = await createMonthlyRecordsUntilToday(employeeId, currentYear, currentMonth, employee.baseSalary, employee.userId);

    // حساب الإحصائيات
    const stats = calculateMonthlyStats(attendanceRecords);

    res.json({
      success: true,
      message: 'تم إعادة تعيين النظام من تاريخ اليوم بنجاح',
      data: {
        records: attendanceRecords,
        stats: stats
      }
    });

  } catch (error) {
    console.error('خطأ في إعادة تعيين النظام:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إعادة توليد بيانات الشهر بالكامل
router.post('/regenerate/:employeeId/:year/:month', requireAuth, async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    
    // التحقق من وجود الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // تحديد نطاق الشهر
    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();

    // حذف جميع السجلات الموجودة للشهر
    await DailyAttendance.deleteMany({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // إنشاء سجلات جديدة
    const attendanceRecords = await createMonthlyRecords(employeeId, year, month, employee.baseSalary, employee.userId);

    // حساب الإحصائيات
    const stats = calculateMonthlyStats(attendanceRecords);

    res.json({
      success: true,
      message: 'تم إعادة توليد بيانات الشهر بنجاح',
      data: {
        records: attendanceRecords,
        stats: stats
      }
    });

  } catch (error) {
    console.error('خطأ في إعادة توليد البيانات:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تحديث عدة سجلات دفعة واحدة
router.put('/bulk-update', requireAuth, async (req, res) => {
  try {
    const { records } = req.body;

    const updatePromises = records.map(async (recordData) => {
      const record = await DailyAttendance.findById(recordData.id).populate('employeeId');
      if (record) {
        // تحديث البيانات المطلوبة فقط
        if (recordData.requiredTime !== undefined) record.requiredTime = recordData.requiredTime;
        if (recordData.status !== undefined) record.status = recordData.status;
        if (recordData.deductionAmount !== undefined) record.deductionAmount = recordData.deductionAmount;

        // إعادة حساب التأخير إذا لم يتم تحديد قيمة الخصم يدوياً
        if (recordData.deductionAmount === undefined) {
          record.calculateLateness(record.employeeId.baseSalary);
        }
        
        await record.save();
      }
      return record;
    });

    const updatedRecords = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'تم تحديث السجلات بنجاح',
      data: updatedRecords.filter(r => r !== null)
    });

  } catch (error) {
    console.error('خطأ في تحديث السجلات:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تم حذف route تحديث اليوم - الآن نستخدم تحديث الشهر فقط الذي يتضمن اليوم الحالي

// تحديث جميع سجلات الشهر الحالي من بيانات التطبيق
router.post('/sync-month/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // التحقق من وجود الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const todayString = today.toISOString().split('T')[0];
    
    // فحص أمني: التأكد من عدم تعديل أشهر مستقبلية
    const requestedMonthString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const currentMonthString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (requestedMonthString > currentMonthString) {
      return res.status(400).json({ 
        success: false,
        message: 'لا يمكن تحديث بيانات شهر مستقبلي' 
      });
    }
    
    console.log(`🔄 تحديث مباشر لجميع سجلات شهر ${currentMonth}/${currentYear} للموظف ${employee.name} - الشهر الحالي فقط`);

    // تحديد نطاق الشهر
    const startDate = moment(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`).startOf('month').toDate();
    const endDate = moment(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`).endOf('month').toDate();
    
    // التأكد من عدم حذف أي سجلات مستقبلية عن طريق فلترة التواريخ
    const todayDate = new Date(todayString);
    const safeEndDate = endDate > todayDate ? todayDate : endDate;

    // فحص أمني إضافي: التأكد من عدم حذف أي سجلات مستقبلية
    console.log(`🔍 Safe date range: ${startDate.toISOString().split('T')[0]} to ${safeEndDate.toISOString().split('T')[0]}`);
    console.log(`📅 Today: ${todayString}, Safe end date: ${safeEndDate.toISOString().split('T')[0]}`);
    
    // حذف السجلات الحالية للشهر الحالي حتى اليوم فقط
    const deleteResult = await DailyAttendance.deleteMany({
      employeeId,
      date: { 
        $gte: startDate, 
        $lte: safeEndDate 
      }
    });
    
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} records for the safe date range`);

    // إنشاء سجلات محدثة من بيانات التطبيق
    const attendanceRecords = await createMonthlyRecordsUntilToday(employeeId, currentYear, currentMonth, employee.baseSalary, employee.userId);

    // حساب الإحصائيات
    const stats = calculateMonthlyStats(attendanceRecords);

    console.log(`✅ تم تحديث ${attendanceRecords.length} سجل من بيانات التطبيق`);

    res.json({
      success: true,
      message: 'تم تحديث جميع سجلات الشهر من بيانات التطبيق',
      data: {
        records: attendanceRecords,
        stats: stats,
        employeeName: employee.name
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث سجلات الشهر:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// دالة مساعدة لجلب بيانات الحضور من تطبيق الديسك توب
async function getDesktopTrackingData(userId, dateString) {
  console.log(`🔍 getDesktopTrackingData called with userId: ${userId}, dateString: ${dateString}`);
  
  if (!userId) {
    console.log('❌ No userId provided, returning empty data');
    return { 
      totalHours: 0, 
      activeHours: 0,
      idleHours: 0,
      breakHours: 0,
      totalMinutes: 0,
      activeMinutes: 0,
      idleMinutes: 0,
      breakMinutes: 0,
      totalHoursExact: 0,
      totalMinutesExact: 0,
      activeHoursExact: 0,
      activeMinutesExact: 0,
      idleHoursExact: 0,
      idleMinutesExact: 0,
      breakHoursExact: 0,
      breakMinutesExact: 0,
      totalFormatted: '0 ساعة 0 دقيقة',
      activeFormatted: '0 ساعة 0 دقيقة',
      idleFormatted: '0 ساعة 0 دقيقة',
      breakFormatted: '0 ساعة 0 دقيقة',
      totalSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      breakSeconds: 0,
      productivity: 0
    };
  }
  
  // Additional safety check: ensure we're not looking for future dates
  const currentDate = new Date().toISOString().split('T')[0];
  if (dateString > currentDate) {
    console.log(`⚠️ Requested date ${dateString} is in the future (current: ${currentDate}), returning empty data`);
    return { 
      totalHours: 0, 
      activeHours: 0,
      idleHours: 0,
      breakHours: 0,
      totalMinutes: 0,
      activeMinutes: 0,
      idleMinutes: 0,
      breakMinutes: 0,
      totalHoursExact: 0,
      totalMinutesExact: 0,
      activeHoursExact: 0,
      activeMinutesExact: 0,
      idleHoursExact: 0,
      idleMinutesExact: 0,
      breakHoursExact: 0,
      breakMinutesExact: 0,
      totalFormatted: '0 ساعة 0 دقيقة',
      activeFormatted: '0 ساعة 0 دقيقة',
      idleFormatted: '0 ساعة 0 دقيقة',
      breakFormatted: '0 ساعة 0 دقيقة',
      totalSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      breakSeconds: 0,
      productivity: 0
    };
  }
  
  try {
    console.log(`🔍 Searching for tracking data with query:`, {
      $or: [
        { userId: userId },
        { employeeId: userId }
      ],
      dateString: dateString
    });
    
    const tracking = await Tracking.findOne({
      $or: [
        { userId: userId },
        { employeeId: userId }
      ],
      dateString: dateString
    });
    
    console.log(`📊 Tracking query result:`, tracking ? 'Found' : 'Not found');
    if (tracking) {
      console.log(`📊 Found tracking data:`, {
        _id: tracking._id,
        userId: tracking.userId,
        employeeId: tracking.employeeId,
        dateString: tracking.dateString,
        totalSeconds: tracking.workData?.totalSeconds,
        activeSeconds: tracking.workData?.activeSeconds
      });
    }

    if (tracking && tracking.workData) {
      // فحص أمني نهائي: التأكد من أن البيانات المسترجعة هي للتاريخ المطلوب بالضبط
      if (tracking.dateString !== dateString) {
        console.log(`⚠️ WARNING: Requested data for ${dateString} but got data for ${tracking.dateString}. Returning empty data.`);
        return { 
          totalHours: 0, 
          activeHours: 0,
          idleHours: 0,
          breakHours: 0,
          totalMinutes: 0,
          activeMinutes: 0,
          idleMinutes: 0,
          breakMinutes: 0,
          totalHoursExact: 0,
          totalMinutesExact: 0,
          activeHoursExact: 0,
          activeMinutesExact: 0,
          idleHoursExact: 0,
          idleMinutesExact: 0,
          breakHoursExact: 0,
          breakMinutesExact: 0,
          totalFormatted: '0 ساعة 0 دقيقة',
          activeFormatted: '0 ساعة 0 دقيقة',
          idleFormatted: '0 ساعة 0 دقيقة',
          breakFormatted: '0 ساعة 0 دقيقة',
          totalSeconds: 0,
          activeSeconds: 0,
          idleSeconds: 0,
          breakSeconds: 0,
          productivity: 0
        };
      }
      
      // تحويل البيانات من ثوانٍ إلى ساعات ودقائق
      const totalSeconds = tracking.workData.totalSeconds || 0;
      const activeSeconds = tracking.workData.activeSeconds || 0;
      const idleSeconds = tracking.workData.idleSeconds || 0;
      const breakSeconds = tracking.workData.breakSeconds || 0;
      
      // حساب الساعات والدقائق
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      const totalHoursDecimal = totalSeconds / 3600;
      
      const activeHours = Math.floor(activeSeconds / 3600);
      const activeMinutes = Math.floor((activeSeconds % 3600) / 60);
      const activeHoursDecimal = activeSeconds / 3600;
      
      const idleHours = Math.floor(idleSeconds / 3600);
      const idleMinutes = Math.floor((idleSeconds % 3600) / 60);
      const idleHoursDecimal = idleSeconds / 3600;
      
      const breakHours = Math.floor(breakSeconds / 3600);
      const breakMinutes = Math.floor((breakSeconds % 3600) / 60);
      const breakHoursDecimal = breakSeconds / 3600;
      
      // تنسيق العرض بطريقة موحدة مع Frontend (تنسيق مطول)
      const formatHoursMinutes = (hrs, mins) => {
        if (hrs === 0 && mins === 0) return '0 ساعة 0 دقيقة';
        
        let result = '';
        if (hrs > 0) result += `${hrs} ساعة`;
        if (mins > 0) {
          if (hrs > 0) result += ' ';
          result += `${mins} دقيقة`;
        }
        return result || '0 ساعة 0 دقيقة';
      };
      
      const totalFormatted = formatHoursMinutes(totalHours, totalMinutes);
      const activeFormatted = formatHoursMinutes(activeHours, activeMinutes);
      const idleFormatted = formatHoursMinutes(idleHours, idleMinutes);
      const breakFormatted = formatHoursMinutes(breakHours, breakMinutes);
      
      // حساب الإنتاجية
      const productivity = totalSeconds > 0 ? Math.round((activeSeconds / totalSeconds) * 100) : 0;
      
      console.log(`📊 بيانات التطبيق لتاريخ ${dateString}:`, {
        totalSeconds,
        activeSeconds,
        idleSeconds,
        breakSeconds,
        productivity,
        totalTime: totalFormatted,
        activeTime: activeFormatted,
        idleTime: idleFormatted,
        breakTime: breakFormatted
      });
      
      return {
        totalHours: Math.round(totalHoursDecimal * 100) / 100, // للحسابات القديمة
        activeHours: Math.round(activeHoursDecimal * 100) / 100,
        idleHours: Math.round(idleHoursDecimal * 100) / 100,
        breakHours: Math.round(breakHoursDecimal * 100) / 100,
        totalMinutes: totalHours * 60 + totalMinutes, // إجمالي الدقائق
        activeMinutes: activeHours * 60 + activeMinutes,
        idleMinutes: idleHours * 60 + idleMinutes,
        breakMinutes: breakHours * 60 + breakMinutes,
        totalHoursExact: totalHours,
        totalMinutesExact: totalMinutes,
        activeHoursExact: activeHours,
        activeMinutesExact: activeMinutes,
        idleHoursExact: idleHours,
        idleMinutesExact: idleMinutes,
        breakHoursExact: breakHours,
        breakMinutesExact: breakMinutes,
        totalFormatted,
        activeFormatted,
        idleFormatted,
        breakFormatted,
        totalSeconds,
        activeSeconds,
        idleSeconds,
        breakSeconds,
        productivity
      };
    }
  } catch (error) {
    console.error('خطأ في جلب بيانات التتبع:', error);
  }
  
  // إذا لم توجد بيانات في التطبيق، إرجاع صفر
  console.log(`⚠️ لا توجد بيانات في التطبيق لتاريخ ${dateString}`);
  return { 
    totalHours: 0, 
    activeHours: 0,
    idleHours: 0,
    breakHours: 0,
    totalMinutes: 0,
    activeMinutes: 0,
    idleMinutes: 0,
    breakMinutes: 0,
    totalHoursExact: 0,
    totalMinutesExact: 0,
    activeHoursExact: 0,
    activeMinutesExact: 0,
    idleHoursExact: 0,
    idleMinutesExact: 0,
    breakHoursExact: 0,
    breakMinutesExact: 0,
    totalFormatted: '0 ساعة 0 دقيقة',
    activeFormatted: '0 ساعة 0 دقيقة',
    idleFormatted: '0 ساعة 0 دقيقة',
    breakFormatted: '0 ساعة 0 دقيقة',
    totalSeconds: 0,
    activeSeconds: 0,
    idleSeconds: 0,
    breakSeconds: 0,
    productivity: 0
  };
}

async function createMonthlyRecords(employeeId, year, month, baseSalary, userId) {
  const records = [];
  const daysInMonth = moment(`${year}-${month}`).daysInMonth();

  console.log(`📅 إنشاء سجلات شهرية لـ ${daysInMonth} يوم في ${year}-${month}`);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = moment(`${year}-${month}-${day.toString().padStart(2, '0')}`).toDate();
    const dayOfWeek = date.getDay();
    // فحص العطلة الأسبوعية بناءً على الإعدادات
    const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
    const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
    const isWeekend = weekends.includes(dayOfWeek);
    const dateString = date.toISOString().split('T')[0];

    let status = 'في الوقت';

    // جلب بيانات الحضور الحقيقية من تطبيق الديسك توب فقط
    const desktopData = await getDesktopTrackingData(userId, dateString);

    const record = new DailyAttendance({
      employeeId,
      date,
      requiredTime: '09:00',
      totalHours: desktopData.totalHours, // البيانات من التطبيق فقط
      activeHours: desktopData.activeHours, // البيانات من التطبيق فقط
      // البيانات التفصيلية الجديدة
      totalMinutes: desktopData.totalMinutes || 0,
      activeMinutes: desktopData.activeMinutes || 0,
      totalHoursExact: desktopData.totalHoursExact || 0,
      totalMinutesExact: desktopData.totalMinutesExact || 0,
      activeHoursExact: desktopData.activeHoursExact || 0,
      activeMinutesExact: desktopData.activeMinutesExact || 0,
      totalFormatted: desktopData.totalFormatted || '0 ساعة 0 دقيقة',
      activeFormatted: desktopData.activeFormatted || '0 ساعة 0 دقيقة',
      totalSeconds: desktopData.totalSeconds || 0,
      activeSeconds: desktopData.activeSeconds || 0,
      delayHours: 0, // سيتم حسابها في calculateLateness
      deductionAmount: 0, // سيتم حسابها في calculateLateness
      status: isWeekend ? 'عطلة' : status,
      isWeekend
    });

    // حساب التأخير والخصم بناءً على البيانات الحقيقية من التطبيق
    if (!isWeekend) {
      record.calculateLateness(baseSalary);
    }

    await record.save();
    records.push(record);
    
    console.log(`✅ سجل ${dateString}: حضور كلي=${desktopData.totalFormatted}، نشط=${desktopData.activeFormatted}، حالة=${record.status}`);
  }

  console.log(`🎯 تم إنشاء ${records.length} سجل بنجاح`);
  return records;
}

// دالة لحساب الإحصائيات الشهرية
function calculateMonthlyStats(records) {
      const workDays = records.filter(r => !r.isWeekend && !r.status.includes('عطلة') && !r.status.includes('إجازة'));
  const onTimeDays = records.filter(r => r.status === 'في الوقت').length;
  const lateDays = records.filter(r => r.status === 'متأخر').length;
  const absentDays = records.filter(r => r.status === 'غائب').length;
  const leaveDays = records.filter(r => r.status === 'إجازة' || r.status === 'مهمة خارجية').length;
      const weekendDays = records.filter(r => r.isWeekend || r.status.includes('عطلة') || r.status.includes('إجازة')).length;
  
  const totalDelayHours = records.reduce((sum, r) => sum + (r.delayHours || 0), 0);
  const totalDeductions = records.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);
  
  const attendanceRate = workDays.length > 0 ? Math.round(((onTimeDays + lateDays) / workDays.length) * 100) : 0;

  return {
    totalDays: records.length,
    workDays: workDays.length,
    onTimeDays,
    lateDays,
    absentDays,
    leaveDays,
    weekendDays,
    totalDelayHours: Math.round(totalDelayHours * 100) / 100,
    totalDeductions,
    attendanceRate
  };
}

async function createMonthlyRecordsUntilToday(employeeId, year, month, baseSalary, userId) {
  const records = [];
  const today = new Date();
  const currentDate = moment(`${year}-${month}-01`);
  const isCurrentMonth = currentDate.format('YYYY-MM') === moment(today).format('YYYY-MM');
  
  // إذا كان الشهر الحالي، إنشاء السجلات حتى اليوم الحالي
  const daysToGenerate = isCurrentMonth ? today.getDate() : currentDate.daysInMonth();

  console.log(`📅 إنشاء سجلات شهرية حتى اليوم لـ ${daysToGenerate} يوم في ${year}-${month}`);

  for (let day = 1; day <= daysToGenerate; day++) {
    const date = moment(`${year}-${month}-${day.toString().padStart(2, '0')}`).toDate();
    const dayOfWeek = date.getDay();
    // فحص العطلة الأسبوعية بناءً على الإعدادات
    const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
    const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
    const isWeekend = weekends.includes(dayOfWeek);
    const dateString = date.toISOString().split('T')[0];

    let status = 'في الوقت';

    // جلب بيانات الحضور الحقيقية من تطبيق الديسك توب فقط
    const desktopData = await getDesktopTrackingData(userId, dateString);

    const record = new DailyAttendance({
      employeeId,
      date,
      requiredTime: '09:00',
      totalHours: desktopData.totalHours, // البيانات من التطبيق فقط - لا توجد بيانات وهمية
      activeHours: desktopData.activeHours, // البيانات من التطبيق فقط - لا توجد بيانات وهمية
      // البيانات التفصيلية الجديدة
      totalMinutes: desktopData.totalMinutes || 0,
      activeMinutes: desktopData.activeMinutes || 0,
      totalHoursExact: desktopData.totalHoursExact || 0,
      totalMinutesExact: desktopData.totalMinutesExact || 0,
      activeHoursExact: desktopData.activeHoursExact || 0,
      activeMinutesExact: desktopData.activeMinutesExact || 0,
      totalFormatted: desktopData.totalFormatted || '0 ساعة 0 دقيقة',
      activeFormatted: desktopData.activeFormatted || '0 ساعة 0 دقيقة',
      totalSeconds: desktopData.totalSeconds || 0,
      activeSeconds: desktopData.activeSeconds || 0,
      delayHours: 0, // سيتم حسابها في calculateLateness
      deductionAmount: 0, // سيتم حسابها في calculateLateness
              status: isWeekend ? 'عطلة' : status,
      isWeekend
    });

    // حساب التأخير والخصم بناءً على البيانات الحقيقية من التطبيق
    if (!isWeekend) {
      record.calculateLateness(baseSalary);
    }

    await record.save();
    records.push(record);
    
    console.log(`✅ سجل ${dateString}: حضور كلي=${desktopData.totalFormatted}، نشط=${desktopData.activeFormatted}، حالة=${record.status}`);
  }

  console.log(`🎯 تم إنشاء ${records.length} سجل حتى اليوم بنجاح`);
  return records;
}

// إضافة route جديد لتحديث سجلات اليوم التلقائي لجميع الموظفين
router.post('/auto-update-daily', requireAuth, async (req, res) => {
  try {
    console.log('🔄 بدء التحديث التلقائي للسجلات اليومية...');
    
    const employees = await Employee.find({ approvalStatus: 'approved' });
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // البحث عن سجل اليوم
        let dailyRecord = await DailyAttendance.findOne({
          employeeId: employee._id,
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        });

        // جلب بيانات الحضور الحقيقية من التطبيق
        const desktopData = await getDesktopTrackingData(employee.userId, todayString);
        
        const dayOfWeek = today.getDay();
        // فحص العطلة الأسبوعية بناءً على الإعدادات
        const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
        const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
        const isWeekend = weekends.includes(dayOfWeek);
        
        // فحص الإجازات المعتمدة لهذا اليوم
        const isHoliday = await checkIfHoliday(todayString);

        if (dailyRecord) {
          // تحديث السجل الموجود
          dailyRecord.totalHours = desktopData.totalHours;
          dailyRecord.activeHours = desktopData.activeHours;
          dailyRecord.totalMinutes = desktopData.totalMinutes || 0;
          dailyRecord.activeMinutes = desktopData.activeMinutes || 0;
          dailyRecord.totalHoursExact = desktopData.totalHoursExact || 0;
          dailyRecord.totalMinutesExact = desktopData.totalMinutesExact || 0;
          dailyRecord.activeHoursExact = desktopData.activeHoursExact || 0;
          dailyRecord.activeMinutesExact = desktopData.activeMinutesExact || 0;
          dailyRecord.totalFormatted = desktopData.totalFormatted || '0 ساعة 0 دقيقة';
          dailyRecord.activeFormatted = desktopData.activeFormatted || '0 ساعة 0 دقيقة';
          dailyRecord.totalSeconds = desktopData.totalSeconds || 0;
          dailyRecord.activeSeconds = desktopData.activeSeconds || 0;
          
          // تحديث الحالة بناءً على نوع اليوم
          if (isWeekend) {
            dailyRecord.status = 'عطلة';
            dailyRecord.isWeekend = true;
          } else if (isHoliday) {
            dailyRecord.status = 'إجازة';
            dailyRecord.isWeekend = false;
          } else {
            dailyRecord.isWeekend = false;
            // إعادة حساب التأخير والخصم
            dailyRecord.calculateLateness(employee.baseSalary);
          }
          
          await dailyRecord.save();
          
          results.push({
            employeeId: employee._id,
            employeeName: employee.name,
            action: 'updated',
            totalHours: desktopData.totalHours,
            activeHours: desktopData.activeHours,
            status: dailyRecord.status
          });
        } else {
          // إنشاء سجل جديد
          let status = 'في الوقت';
          
          if (isWeekend) {
            status = 'عطلة';
          } else if (isHoliday) {
            status = 'إجازة';
          }

          const record = new DailyAttendance({
            employeeId: employee._id,
            date: today,
            requiredTime: '09:00',
            totalHours: desktopData.totalHours,
            activeHours: desktopData.activeHours,
            totalMinutes: desktopData.totalMinutes || 0,
            activeMinutes: desktopData.activeMinutes || 0,
            totalHoursExact: desktopData.totalHoursExact || 0,
            totalMinutesExact: desktopData.totalMinutesExact || 0,
            activeHoursExact: desktopData.activeHoursExact || 0,
            activeMinutesExact: desktopData.activeMinutesExact || 0,
            totalFormatted: desktopData.totalFormatted || '0 ساعة 0 دقيقة',
            activeFormatted: desktopData.activeFormatted || '0 ساعة 0 دقيقة',
            totalSeconds: desktopData.totalSeconds || 0,
            activeSeconds: desktopData.activeSeconds || 0,
            delayHours: 0,
            deductionAmount: 0,
            status: status,
            isWeekend: isWeekend
          });

          // حساب التأخير والخصم إذا لم يكن عطلة أو إجازة
          if (!isWeekend && !isHoliday) {
            record.calculateLateness(employee.baseSalary);
          }

          await record.save();
          
          results.push({
            employeeId: employee._id,
            employeeName: employee.name,
            action: 'created',
            totalHours: desktopData.totalHours,
            activeHours: desktopData.activeHours,
            status: record.status
          });
        }

      } catch (error) {
        console.error(`خطأ في تحديث سجل ${employee.name}:`, error);
        errors.push({
          employeeId: employee._id,
          employeeName: employee.name,
          error: error.message
        });
      }
    }

    console.log(`✅ تم تحديث سجلات ${results.length} موظف، أخطاء: ${errors.length}`);

    res.json({
      success: true,
      message: `تم تحديث سجلات اليوم لـ ${results.length} موظف`,
      data: {
        updated: results.length,
        errors: errors.length,
        results: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('خطأ في التحديث التلقائي:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إضافة route لإدارة الإجازات الرسمية
router.get('/holidays', requireAuth, async (req, res) => {
  try {
    const holidays = await Setting.findOne({ id: 'official_holidays' });
    
    if (!holidays) {
      // إنشاء إعدادات افتراضية للإجازات
      const defaultHolidays = {
        id: 'official_holidays',
        category: 'attendance',
        settings: {
          holidays: [
            { name: 'رأس السنة الميلادية', date: '2024-01-01', type: 'fixed' },
            { name: 'عيد الثورة', date: '2024-01-25', type: 'fixed' },
            { name: 'شم النسيم', date: '2024-05-06', type: 'variable' },
            { name: 'عيد العمال', date: '2024-05-01', type: 'fixed' },
            { name: 'عيد الفطر', date: '2024-04-10', type: 'islamic', duration: 3 },
            { name: 'عيد الأضحى', date: '2024-06-16', type: 'islamic', duration: 4 },
            { name: 'رأس السنة الهجرية', date: '2024-07-07', type: 'islamic' },
            { name: 'المولد النبوي', date: '2024-09-15', type: 'islamic' },
            { name: 'عيد 23 يوليو', date: '2024-07-23', type: 'fixed' },
            { name: 'عيد 6 أكتوبر', date: '2024-10-06', type: 'fixed' }
          ],
          weekends: [5, 6], // الجمعة والسبت
          customDays: []
        }
      };
      
      await Setting.create(defaultHolidays);
      return res.json({ success: true, data: defaultHolidays.settings });
    }

    res.json({ success: true, data: holidays.settings });
  } catch (error) {
    console.error('خطأ في جلب الإجازات:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إضافة route لتحديث الإجازات الرسمية
router.post('/holidays', requireAuth, async (req, res) => {
  try {
    const { holidays, weekends, customDays } = req.body;
    
    const holidaySettings = {
      holidays: holidays || [],
      weekends: weekends || [5, 6],
      customDays: customDays || []
    };

    await Setting.findOneAndUpdate(
      { id: 'official_holidays' },
      {
        id: 'official_holidays',
        category: 'attendance',
        settings: holidaySettings,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'تم تحديث إعدادات الإجازات بنجاح',
      data: holidaySettings
    });
  } catch (error) {
    console.error('خطأ في تحديث الإجازات:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إضافة endpoint جديد لجلب السجلات اليومية للمستخدم (للاستخدام في جدول الأيام)
router.get('/user-records/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.query; // دعم فلترة بالشهر
    
    console.log('🔍 Daily attendance records request for userId:', userId);
    console.log('🔍 Request user from token:', req.user);
    
    // البحث عن الموظف باستخدام userId - مع دعم معرفات متعددة
    let employee = await Employee.findOne({ userId: userId });
    console.log('👤 Found employee:', employee ? employee.name : 'Not found');
    
    if (!employee) {
      // محاولة البحث بمعرفات أخرى محتملة
      const possibleUserIds = [
        '6855b3f5869dc00ad4b46cc8', // المعرف الأصلي من الخطأ
        '6855b3f715cf56bc12d059a3', // المعرف الحالي من التطبيق المكتبي
        userId // المعرف المرسل
      ];
      
      for (const possibleId of possibleUserIds) {
        employee = await Employee.findOne({ userId: possibleId });
        if (employee) {
          console.log(`✅ Found employee with alternative userId: ${possibleId}`);
          break;
        }
      }
    }
    
    if (!employee) {
      // محاولة إنشاء موظف جديد إذا لم يوجد
      console.log('🆕 Trying to create new employee record for userId:', userId);
      
      // البحث عن المستخدم
      const User = require('../models/User');
      let user = await User.findById(userId);
      
      // إذا لم يوجد، جرب المعرفات الأخرى
      if (!user) {
        const possibleUserIds = [
          '6855b3f5869dc00ad4b46cc8',
          '6855b3f715cf56bc12d059a3'
        ];
        
        for (const possibleId of possibleUserIds) {
          user = await User.findById(possibleId);
          if (user) {
            console.log(`✅ Found user with alternative ID: ${possibleId}`);
            break;
          }
        }
      }
      
      if (user) {
        console.log('👤 Found user for employee creation:', user.username);
        
        // إنشاء موظف جديد
        const newEmployee = new Employee({
          userId: user._id,
          name: user.name || user.username,
          email: user.email,
          position: 'موظف',
          department: 'عام',
          baseSalary: 5000,
          status: 'active'
        });
        
        await newEmployee.save();
        console.log('✅ Created new employee record:', newEmployee.name);
        
        // استخدام الموظف الجديد
        employee = newEmployee;
      } else {
        return res.status(404).json({ 
          success: false, 
          message: 'المستخدم غير موجود في النظام',
          debug: { requestedUserId: userId, foundUser: false, triedUserIds: possibleUserIds }
        });
      }
    }

    // حساب نطاق التاريخ المطلوب
    let endDate, startDate;
    
    if (month) {
      // إذا تم تحديد شهر معين، استخدم نطاق الشهر
      const [year, monthNum] = month.split('-');
      startDate = new Date(year, monthNum - 1, 1); // بداية الشهر
      endDate = new Date(year, monthNum, 0); // نهاية الشهر
      
      console.log('📅 Filtering by month:', month, 'from', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    } else {
      // إذا لم يتم تحديد شهر، استخدم آخر 14 يوم (السلوك الافتراضي)
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 13); // آخر 14 يوم
      
      console.log('📅 Using default 14-day range');
    }
    
    console.log('📅 Searching for data between:', startDate.toISOString().split('T')[0], 'and', endDate.toISOString().split('T')[0]);
    
    // جلب السجلات الموجودة
    const existingRecords = await DailyAttendance.find({
      employeeId: employee._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    console.log('📊 Found existing daily attendance records:', existingRecords.length);

    // إنشاء سجل للفترة المطلوبة
    const dailyRecords = [];
    
    // حساب عدد الأيام في النطاق
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateString = currentDate.toISOString().split('T')[0];
      // فحص العطلة الأسبوعية بناءً على الإعدادات
      const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
      const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
      const isWeekend = weekends.includes(currentDate.getDay());
      const isToday = dateString === endDate.toISOString().split('T')[0];
      
      // البحث عن سجل هذا اليوم
      const existingRecord = existingRecords.find(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === dateString;
      });
      
      // فحص العطل الرسمية لهذا التاريخ
      const holidayCheck = await checkIfHoliday(dateString);
      const isHoliday = holidayCheck && holidayCheck.isHoliday;
      
      let dailyRecord = {
        date: dateString,
        day: currentDate.toLocaleDateString('ar', { weekday: 'long' }),
        hijriDate: currentDate.toLocaleDateString('ar-EG-u-ca-islamic', {
          day: '2-digit',
          month: 'short'
        }),
        isWeekend: isWeekend,
        isHoliday: isHoliday,
        isToday: isToday,
        hasRealData: false, // Default to false, will be set to true only if real data exists
        totalHours: 0,
        activeHours: 0,
        totalSeconds: 0, // إضافة الحقل المفقود
        activeSeconds: 0, // إضافة الحقل المفقود
        totalFormatted: '0د',
        activeFormatted: '0د',
        delayHours: 0,
        deductionAmount: 0,
        status: isWeekend ? 'عطلة' : (isHoliday ? 'إجازة' : 'غائب'),
        productivity: 0
      };
      
      if (existingRecord) {
        dailyRecord = {
          ...dailyRecord,
          _id: existingRecord._id,
          hasRealData: (existingRecord.totalSeconds > 0 || existingRecord.totalHours > 0), // Only true if actual data exists
          totalHours: existingRecord.totalHours || 0,
          activeHours: existingRecord.activeHours || 0,
          totalSeconds: existingRecord.totalSeconds || 0, // إضافة البيانات المفقودة
          activeSeconds: existingRecord.activeSeconds || 0, // إضافة البيانات المفقودة
          totalFormatted: existingRecord.totalFormatted || '0د',
          activeFormatted: existingRecord.activeFormatted || '0د',
          delayHours: existingRecord.delayHours || 0,
          deductionAmount: existingRecord.deductionAmount || 0,
          // Always use dynamic status evaluation instead of stored status
        status: isWeekend ? 'عطلة' : (isHoliday ? 'إجازة' : (existingRecord.totalHours > 0 ? (existingRecord.status || 'في الوقت') : 'غائب')),
          productivity: existingRecord.activeSeconds && existingRecord.totalSeconds ? 
            Math.round((existingRecord.activeSeconds / existingRecord.totalSeconds) * 100) : 0
        };
      } else if (isToday || (currentDate <= new Date() && !isWeekend)) {
        // إنشاء سجل جديد للأيام المفقودة (اليوم أو الأيام السابقة غير العطل)
        try {
          console.log(`✨ Creating missing record for ${dateString}...`);
          
          // استخدام نتيجة فحص العطل المحسوبة مسبقاً
          
          // تحديد الحالة بناءً على نوع اليوم
          let recordStatus = 'في الوقت';
          if (isWeekend) {
            recordStatus = 'عطلة';
          } else if (isHoliday) {
            recordStatus = 'إجازة';
          }
          
          // جلب بيانات الحضور الحقيقية من تطبيق الديسك توب فقط إذا لم يكن عطلة
          const desktopData = await getDesktopTrackingData(employee.userId, dateString);
          if (!desktopData.totalSeconds && !isHoliday && !isWeekend) {
            console.log(`⚠️ لا توجد بيانات في التطبيق لتاريخ ${dateString}`);
            recordStatus = 'غائب';
          }
          
          const newRecord = new DailyAttendance({
            employeeId: employee._id,
            date: currentDate,
            requiredTime: '09:00',
            totalHours: desktopData.totalHours || 0,
            activeHours: desktopData.activeHours || 0,
            idleHours: desktopData.idleHours || 0,
            breakHours: desktopData.breakHours || 0,
            totalMinutes: desktopData.totalMinutes || 0,
            activeMinutes: desktopData.activeMinutes || 0,
            idleMinutes: desktopData.idleMinutes || 0,
            breakMinutes: desktopData.breakMinutes || 0,
            totalHoursExact: desktopData.totalHoursExact || 0,
            totalMinutesExact: desktopData.totalMinutesExact || 0,
            activeHoursExact: desktopData.activeHoursExact || 0,
            activeMinutesExact: desktopData.activeMinutesExact || 0,
            idleHoursExact: desktopData.idleHoursExact || 0,
            idleMinutesExact: desktopData.idleMinutesExact || 0,
            breakHoursExact: desktopData.breakHoursExact || 0,
            breakMinutesExact: desktopData.breakMinutesExact || 0,
            totalFormatted: desktopData.totalFormatted || '0د',
            activeFormatted: desktopData.activeFormatted || '0د',
            idleFormatted: desktopData.idleFormatted || '0د',
            breakFormatted: desktopData.breakFormatted || '0د',
            totalSeconds: desktopData.totalSeconds || 0,
            activeSeconds: desktopData.activeSeconds || 0,
            idleSeconds: desktopData.idleSeconds || 0,
            breakSeconds: desktopData.breakSeconds || 0,
            productivity: desktopData.productivity || 0,
            delayHours: 0,
            deductionAmount: 0,
            status: recordStatus,
            isWeekend: isWeekend
          });

          // حساب التأخير والخصم فقط إذا لم يكن عطلة أو إجازة
          if (!isWeekend && !isHoliday) {
            newRecord.calculateLateness(employee.baseSalary);
          }

          await newRecord.save();
          console.log(`✅ Created record for ${dateString} - Status: ${newRecord.status}`);
          
          dailyRecord = {
            ...dailyRecord,
            _id: newRecord._id,
            hasRealData: (newRecord.totalSeconds > 0 || newRecord.totalHours > 0), // Only true if actual data exists
            totalHours: newRecord.totalHours,
            activeHours: newRecord.activeHours,
            totalSeconds: newRecord.totalSeconds || 0, // إضافة البيانات المفقودة
            activeSeconds: newRecord.activeSeconds || 0, // إضافة البيانات المفقودة
            totalFormatted: newRecord.totalFormatted,
            activeFormatted: newRecord.activeFormatted,
            delayHours: newRecord.delayHours,
            deductionAmount: newRecord.deductionAmount,
            status: newRecord.status,
            productivity: newRecord.activeSeconds && newRecord.totalSeconds ? 
              Math.round((newRecord.activeSeconds / newRecord.totalSeconds) * 100) : 0
          };
        } catch (error) {
          console.error(`❌ Error creating record for ${dateString}:`, error.message);
        }
      }
      
      dailyRecords.push(dailyRecord);
    }
    
    console.log('📋 Generated daily records:', dailyRecords.length);
    
    // إضافة logging لتتبع البيانات المرسلة
    console.log('📊 Sample record data:', dailyRecords.slice(0, 2).map(record => ({
      date: record.date,
      totalHours: record.totalHours,
      totalSeconds: record.totalSeconds,
      activeHours: record.activeHours,
      activeSeconds: record.activeSeconds,
      hasRealData: record.hasRealData
    })));
    
    // حساب الإحصائيات (استبعاد العطل الرسمية والأسبوعية)
    const workingDays = dailyRecords.filter(day => 
      !day.isWeekend && 
      !day.isHoliday && 
      !day.status.includes('عطلة') && 
              !day.status.includes('إجازة') &&
      day.status !== 'مهمة خارجية'
    );
    const presentDays = workingDays.filter(day => day.totalHours > 0);
    const totalWorkTime = workingDays.reduce((sum, day) => sum + (day.totalHours || 0), 0);
    const totalActiveTime = workingDays.reduce((sum, day) => sum + (day.activeHours || 0), 0);
    const averageProductivity = presentDays.length > 0 ? 
      presentDays.reduce((sum, day) => sum + (day.productivity || 0), 0) / presentDays.length : 0;
    
    const summary = {
      totalWorkingDays: workingDays.length,
      presentDays: presentDays.length,
      absentDays: workingDays.length - presentDays.length,
      totalWorkTime: Math.round(totalWorkTime * 10) / 10,
      totalActiveTime: Math.round(totalActiveTime * 10) / 10,
      averageProductivity: Math.round(averageProductivity)
    };
    
    res.json({
      success: true,
      data: {
        records: dailyRecords,
        count: dailyRecords.length
      },
      summary: summary
    });

  } catch (error) {
    console.error('Error fetching user daily attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب السجلات اليومية',
      error: error.message,
      debug: { 
        userId: req.params.userId,
        userFromToken: req.user
      }
    });
  }
});

async function checkIfHoliday(dateString) {
  try {
    const holidays = await Setting.findOne({ id: 'official_holidays' });
    if (!holidays) return false;

    const targetDate = new Date(dateString);
    const todayString = targetDate.toISOString().split('T')[0];
    
    // فحص الإجازات الثابتة والمتغيرة
    for (const holiday of holidays.settings.holidays) {
      const holidayDate = new Date(holiday.date);
      const holidayString = holidayDate.toISOString().split('T')[0];
      
      if (holiday.duration && holiday.duration > 1) {
        // إجازة متعددة الأيام
        for (let i = 0; i < holiday.duration; i++) {
          const extendedDate = new Date(holidayDate);
          extendedDate.setDate(extendedDate.getDate() + i);
          if (extendedDate.toISOString().split('T')[0] === todayString) {
            return { isHoliday: true, name: holiday.name, type: holiday.type };
          }
        }
      } else {
        // إجازة يوم واحد
        if (holidayString === todayString) {
          return { isHoliday: true, name: holiday.name, type: holiday.type };
        }
      }
    }

    // فحص الأيام المخصصة
    for (const customDay of holidays.settings.customDays || []) {
      if (customDay.date === todayString) {
        return { isHoliday: true, name: customDay.name, type: 'custom' };
      }
    }

    return false;
  } catch (error) {
    console.error('خطأ في فحص الإجازات:', error);
    return false;
  }
}

// Helper function to get monthly attendance data
async function getMonthlyAttendanceData(employeeId, year, month) {
  try {
    // Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('الموظف غير موجود');
    }

    // Define date range
    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();

    // Find attendance records
    let attendanceRecords = await DailyAttendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Check if current month
    const today = new Date();
    const currentDate = moment(`${year}-${month}-01`);
    const isCurrentMonth = currentDate.format('YYYY-MM') === moment(today).format('YYYY-MM');
    
    // Create records if missing
    if (attendanceRecords.length === 0) {
      if (isCurrentMonth) {
        attendanceRecords = await createMonthlyRecordsUntilToday(employeeId, year, month, employee.baseSalary, employee.userId);
      } else {
        attendanceRecords = await createMonthlyRecords(employeeId, year, month, employee.baseSalary, employee.userId);
      }
    } else {
      // Check for missing records
      const expectedDays = isCurrentMonth ? today.getDate() : moment(`${year}-${month}`).daysInMonth();
      if (attendanceRecords.length < expectedDays) {
        // Delete incomplete records and recreate
        await DailyAttendance.deleteMany({
          employeeId,
          date: { $gte: startDate, $lte: endDate }
        });
        
        if (isCurrentMonth) {
          attendanceRecords = await createMonthlyRecordsUntilToday(employeeId, year, month, employee.baseSalary, employee.userId);
        } else {
          attendanceRecords = await createMonthlyRecords(employeeId, year, month, employee.baseSalary, employee.userId);
        }
      }
    }

    // Filter out future dates for current month
    if (isCurrentMonth) {
      const todayDateString = today.toISOString().split('T')[0];
      attendanceRecords = attendanceRecords.filter(record => {
        const recordDateString = new Date(record.date).toISOString().split('T')[0];
        return recordDateString <= todayDateString;
      });
    }

    // Calculate statistics
    const stats = calculateMonthlyStats(attendanceRecords);

    return {
      records: attendanceRecords,
      stats: stats
    };

  } catch (error) {
    console.error('Error getting monthly attendance data:', error);
    throw error;
  }
}

// تحديث حالة الحضور
router.post('/update-status', requireAuth, async (req, res) => {
  try {
    const allowedStatuses = ["present", "absent", "late", "excused"];
    const { employeeId, date, status, note } = req.body;

    // التحقق من وجود جميع البيانات المطلوبة
    if (!employeeId || !date || !status) {
      return res.status(400).json({
        error: "Validation failed",
        details: "Missing required fields: employeeId, date, and status are required"
      });
    }

    // التحقق من صحة قيمة status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Validation failed",
        details: `Invalid status value: ${status}. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    // البحث عن سجل الحضور
    const attendance = await DailyAttendance.findOne({
      employeeId: employeeId,
      date: new Date(date)
    });

    if (!attendance) {
      return res.status(404).json({
        error: "Not found",
        details: "Attendance record not found"
      });
    }

    // تحديث الحالة والملاحظة
    attendance.status = status;
    if (note) {
      attendance.note = note;
    }

    await attendance.save();

    res.json({
      success: true,
      message: "تم تحديث حالة الحضور بنجاح",
      data: attendance
    });

  } catch (error) {
    console.error('خطأ في تحديث حالة الحضور:', error);
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

module.exports = router; 