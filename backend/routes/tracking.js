const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Tracking = require('../models/Tracking');
const Setting = require('../models/Setting');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const moment = require('moment-timezone');

// Rate limiting بسيط
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 60, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.user ? req.user.id : req.ip;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = rateLimitMap.get(key);
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز الحد المسموح من الطلبات. حاول مرة أخرى لاحقاً',
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    userLimit.count++;
    next();
  };
};

// إنشاء مجلد screenshots إذا لم يكن موجود
const uploadsDir = path.join(__dirname, '../uploads/screenshots');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// إعداد multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const employeeId = req.body.employeeId || 'unknown';
    cb(null, `screenshot-${timestamp}-${employeeId}.png`);
  }
});

// تحسين multer مع validation أفضل
const fileFilter = (req, file, cb) => {
  // التحقق من نوع الملف
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('نوع الملف غير مدعوم. يُسمح فقط بـ PNG و JPEG');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  // التحقق من امتداد الملف
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    const error = new Error('امتداد الملف غير مدعوم');
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB حد أقصى
    files: 1 // ملف واحد فقط
  }
});

// تحسين قواعد التحقق من صحة البيانات
const validateWorkData = [
  body('workData').exists().withMessage('workData مطلوب'),
  
  body('workData.totalSeconds')
    .isNumeric({ min: 0 })
    .withMessage('totalSeconds يجب أن يكون رقم أكبر من أو يساوي 0')
    .toInt(),
  
  body('workData.activeSeconds')
    .isNumeric({ min: 0 })
    .withMessage('activeSeconds يجب أن يكون رقم أكبر من أو يساوي 0')
    .toInt()
    .custom((value, { req }) => {
      if (value > req.body.workData.totalSeconds) {
        throw new Error('وقت النشاط لا يمكن أن يكون أكبر من الوقت الإجمالي');
      }
      return true;
    }),
  
  body('workData.idleSeconds')
    .isNumeric({ min: 0 })
    .withMessage('idleSeconds يجب أن يكون رقم أكبر من أو يساوي 0')
    .toInt()
    .custom((value, { req }) => {
      if (value > req.body.workData.totalSeconds) {
        throw new Error('وقت الخمول لا يمكن أن يكون أكبر من الوقت الإجمالي');
      }
      return true;
    }),
  
  body('workData.breakSeconds')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('breakSeconds يجب أن يكون رقم أكبر من أو يساوي 0')
    .toInt()
    .custom((value, { req }) => {
      const { totalSeconds, activeSeconds, idleSeconds } = req.body.workData;
      const totalTrackedTime = (activeSeconds || 0) + (idleSeconds || 0) + (value || 0);
      if (totalTrackedTime > totalSeconds) {
        throw new Error('مجموع الأوقات (نشاط + خمول + استراحة) لا يمكن أن يتجاوز الوقت الإجمالي');
      }
      return true;
    }),
  
  body('workData.productivity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('productivity يجب أن يكون رقم بين 0 و 100')
    .toFloat()
    .custom((value, { req }) => {
      const { totalSeconds, activeSeconds } = req.body.workData;
      if (totalSeconds > 0) {
        const calculatedProductivity = Math.round((activeSeconds / totalSeconds) * 100);
        if (Math.abs(value - calculatedProductivity) > 1) { // 1% margin of error
          throw new Error('قيمة الإنتاجية غير متوافقة مع نسبة وقت النشاط إلى الوقت الإجمالي');
        }
      }
      return true;
    }),
  
  body('workData.lastActivity')
    .optional()
    .isISO8601()
    .withMessage('lastActivity يجب أن يكون تاريخ صحيح بصيغة ISO8601')
    .toDate()
    .custom((value) => {
      if (value > new Date()) {
        throw new Error('تاريخ آخر نشاط لا يمكن أن يكون في المستقبل');
      }
      return true;
    })
];

// Validation middleware لتسجيل الدخول
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('اسم المستخدم مطلوب')
    .isLength({ min: 3 })
    .withMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

// Validation middleware للصور
const validateScreenshot = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId مطلوب')
    .isMongoId()
    .withMessage('employeeId يجب أن يكون MongoDB ObjectId صحيح')
];

// دالة للتحقق من نتائج الـ validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // تسجيل الأخطاء للمراقبة
    console.warn('❌ أخطاء validation:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'خطأ في البيانات المرسلة',
      errors: errors.array()
    });
  }
  next();
};

// دالة logging للعمليات المهمة
const logActivity = (action, userId, details = {}) => {
  console.log('Activity Log:', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown'
  });
};

// استخدام الـ Tracking model المُعرَّف في models/Tracking.js

// Middleware للتحقق من التوكن
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'مطلوب توكن المصادقة' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'توكن غير صالح' 
      });
    }
    req.user = user;
    next();
  });
}

// تسجيل دخول للتطبيق المكتبي
router.post('/desktop-login', rateLimit(5, 300000), validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'يرجى إدخال اسم المستخدم وكلمة المرور' 
      });
    }

    // أولاً: البحث في جدول المستخدمين (User) - نفس نظام الموقع
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (user) {
      // التحقق من كلمة المرور
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: 'بيانات دخول غير صحيحة' 
        });
      }

      // التحقق من حالة الموافقة للموظفين
      if (user.role === 'employee') {
        // البحث عن الموظف المرتبط
        let employee = await Employee.findOne({ userId: user._id });
        
        // إذا لم يجد بواسطة userId، ابحث بواسطة البريد الإلكتروني
        if (!employee) {
          employee = await Employee.findOne({ email: user.email });
        }
        
        if (!employee) {
          console.log(`⚠️ لم يتم العثور على موظف للمستخدم: ${user.username} (${user._id})`);
          return res.status(403).json({ 
            success: false,
            message: 'لم يتم العثور على بيانات الموظف' 
          });
        }

        // إذا تم العثور على الموظف بدون userId، قم بتحديثه
        if (!employee.userId) {
          employee.userId = user._id;
          await employee.save();
          console.log(`🔗 تم ربط الموظف ${employee.name} بالمستخدم ${user.username}`);
        }

        console.log(`🔍 فحص حالة الموافقة للموظف: ${employee.name} - الحالة: ${employee.approvalStatus}`);

        if (employee.approvalStatus === 'pending') {
          return res.status(403).json({ 
            success: false,
            message: 'حسابك قيد المراجعة من قبل الإدارة' 
          });
        }

        if (employee.approvalStatus === 'rejected') {
          return res.status(403).json({ 
            success: false,
            message: 'تم رفض طلب التسجيل الخاص بك' 
          });
        }
      }

      // تحديث آخر تسجيل دخول
      user.lastLogin = new Date();
      await user.save();

      // إنشاء JWT token
      const token = jwt.sign(
        { 
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          type: 'desktop-app'
        },
        process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          position: user.position
        }
      });
    }

    // ثانياً: إذا لم يجد في جدول المستخدمين، ابحث في جدول الموظفين (للتوافق مع النظام القديم)
    const employee = await Employee.findOne({
      $or: [
        { email: username },
        { employeeNumber: username },
        { name: username }
      ]
    });

    if (!employee) {
      return res.status(401).json({ 
        success: false,
        message: 'بيانات دخول غير صحيحة' 
      });
    }

    // التحقق من كلمة المرور (للموظفين القدامى نستخدم كلمة مرور افتراضية)
    const defaultPassword = '123456';
    if (password !== defaultPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'بيانات دخول غير صحيحة' 
      });
    }

    // إنشاء JWT token
    const token = jwt.sign(
      { 
        id: employee._id,
        employeeNumber: employee.employeeNumber,
        email: employee.email,
        name: employee.name,
        type: 'desktop-app'
      },
      process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      employee: {
        id: employee._id,
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        avatar: employee.avatar
      }
    });

  } catch (error) {
    console.error('Desktop login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم', 
      error: error.message 
    });
  }
});

// تحديث بيانات التتبع مع معالجة Race Condition
router.post('/update', validateWorkData, handleValidationErrors, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { employeeId } = req.body;
    const workData = req.body.workData;
    
    // البحث عن السجل وتحديثه في نفس Transaction
    const tracking = await Tracking.findOne({ employeeId }).session(session);
    if (!tracking) {
      // إنشاء سجل جديد إذا لم يكن موجوداً
      const newTracking = new Tracking({
        employeeId,
        workData,
        version: 1
      });
      await newTracking.save({ session });
    } else {
      // تحديث السجل الموجود مع زيادة رقم النسخة
      tracking.workData = workData;
      tracking.version = (tracking.version || 0) + 1;
      tracking.lastUpdated = new Date();
      await tracking.save({ session });
    }

    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'تم تحديث بيانات التتبع بنجاح',
      data: tracking
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('خطأ في تحديث بيانات التتبع:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات التتبع',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// رفع صورة الشاشة مع validation شامل
router.post('/screenshot', authenticateToken, rateLimit(20, 60000), (req, res, next) => {
  // استخدام multer مع error handling محسن
  upload.single('screenshot')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'حجم الملف كبير جداً. الحد الأقصى 5MB',
          error: 'FILE_TOO_LARGE'
        });
      }
      if (err.code === 'INVALID_FILE_TYPE' || err.code === 'INVALID_FILE_EXTENSION') {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: err.code
        });
      }
      return res.status(400).json({
        success: false,
        message: 'خطأ في رفع الملف',
        error: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي صورة'
      });
    }

    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const screenshotInfo = {
      filename: req.file.filename,
      timestamp: new Date(),
      path: req.file.path,
      size: req.file.size
    };

    // تحديد نوع المستخدم وإعداد معايير البحث
    let searchCriteria = { date: { $gte: today, $lt: tomorrow } };
    let userInfo = {};
    let userType = 'user';

    // إذا كان المستخدم من النوع الجديد (User)
    if (req.user.username || req.user.role) {
      searchCriteria.userId = userId;
      userInfo = {
        username: req.user.username,
        email: req.user.email,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        department: req.user.department,
        position: req.user.position
      };
      userType = 'user';
    } else {
      // إذا كان من النوع القديم (Employee)
      searchCriteria.employeeId = userId;
      userInfo = {
        email: req.user.email,
        name: req.user.name,
        department: req.user.department,
        position: req.user.position
      };
      userType = 'employee';
    }

    // إضافة مسار الصورة لسجل اليوم
    let tracking = await Tracking.findOne(searchCriteria);

    if (!tracking) {
      const trackingData = {
        screenshots: [screenshotInfo],
        date: new Date(),
        userType: userType,
        userInfo: userInfo
      };

      // إضافة المعرف المناسب
      if (userType === 'user') {
        trackingData.userId = userId;
      } else {
        trackingData.employeeId = userId;
      }

      tracking = new Tracking(trackingData);
    } else {
      tracking.screenshots.push(screenshotInfo);
      tracking.lastUpdate = new Date();
      tracking.userInfo = { ...tracking.userInfo, ...userInfo };
    }

    await tracking.save();

    // تسجيل العملية
    logActivity('SCREENSHOT_UPLOAD', userId, {
      userType: userType,
      filename: screenshotInfo.filename,
      fileSize: req.file.size,
      ip: req.ip
    });

    res.json({ 
      success: true, 
      message: 'تم رفع الصورة بنجاح',
      filename: screenshotInfo.filename,
      timestamp: screenshotInfo.timestamp
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في رفع الصورة', 
      error: error.message 
    });
  }
});

// جلب بيانات المستخدم الحالي
router.get('/my-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    // تحديد نوع المستخدم وإعداد معايير البحث
    let searchCriteria = {};
    
    if (req.user.username || req.user.role) {
      // مستخدم من النوع الجديد (User)
      searchCriteria.userId = userId;
    } else {
      // مستخدم من النوع القديم (Employee)
      searchCriteria.employeeId = userId;
    }

    // إضافة فلتر التاريخ إذا تم تحديده
    if (startDate && endDate) {
      searchCriteria.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const trackingData = await Tracking.find(searchCriteria)
      .populate('userId', 'username email firstName lastName department position')
      .populate('employeeId', 'name employeeNumber email department position')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // حساب الإحصائيات
    const stats = {
      totalDays: trackingData.length,
      totalWorkTime: 0,
      totalActiveTime: 0,
      totalScreenshots: 0,
      averageProductivity: 0
    };

    trackingData.forEach(record => {
      if (record.workData) {
        stats.totalWorkTime += record.workData.totalSeconds || 0;
        stats.totalActiveTime += record.workData.activeSeconds || 0;
        stats.averageProductivity += record.workData.productivity || 0;
      }
      stats.totalScreenshots += record.screenshots ? record.screenshots.length : 0;
    });

    if (trackingData.length > 0) {
      stats.averageProductivity = Math.round(stats.averageProductivity / trackingData.length);
    }

    res.json({ 
      success: true, 
      data: trackingData,
      stats: stats,
      count: trackingData.length
    });

  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب البيانات', 
      error: error.message 
    });
  }
});

// استرجاع بيانات اليوم
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // البحث عن سجل اليوم
        const tracking = await Tracking.findOne({
            $or: [
                { userId: userId },
                { employeeId: userId }
            ],
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });
        
        if (!tracking) {
            return res.json({
                success: true,
                message: 'لا توجد بيانات لليوم الحالي',
                data: null
            });
        }
        
        res.json({
            success: true,
            message: 'تم استرجاع بيانات اليوم بنجاح',
            data: tracking
        });
        
    } catch (error) {
        console.error('Error fetching today data:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع البيانات',
            error: error.message
        });
    }
});

// جلب بيانات موظف محدد (للإدارة)
router.get('/employee/:id', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { startDate, endDate } = req.query;

    // التحقق من الصلاحيات - الموظف يمكنه رؤية بياناته فقط أو الإدارة
    if (req.user.id !== employeeId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مسموح بالوصول لهذه البيانات'
      });
    }

    const dateFilter = { 
      $or: [
        { employeeId: employeeId },
        { userId: employeeId }
      ]
    };
    
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const trackingData = await Tracking.find(dateFilter)
      .populate('userId', 'username email firstName lastName department position')
      .populate('employeeId', 'name employeeNumber email department position')
      .sort({ date: -1 })
      .limit(30);

    res.json({ 
      success: true, 
      data: trackingData,
      count: trackingData.length
    });

  } catch (error) {
    console.error('Get employee data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب البيانات', 
      error: error.message 
    });
  }
});

// جلب صورة شاشة محددة
router.get('/screenshot/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'الملف غير موجود'
      });
    }

    // إرسال الملف
    res.sendFile(filePath);

  } catch (error) {
    console.error('Get screenshot error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الصورة',
      error: error.message
    });
  }
});

// تحديث حالة الاتصال
router.post('/heartbeat', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, lastActivity } = req.body;

    // يمكن إضافة logic لتحديث آخر نشاط للموظف
    // أو حفظ حالة الاتصال في قاعدة البيانات

    res.json({
      success: true,
      message: 'تم تحديث حالة الاتصال',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الاتصال',
      error: error.message
    });
  }
});

// حفظ بيانات تتبع الوقت المتقدمة
router.post('/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { workData, screenshots, isWorking, date, timestamp } = req.body;

    console.log('💾 حفظ بيانات التتبع المتقدمة:', {
      userId,
      workData,
      screenshotCount: screenshots ? screenshots.length : 0,
      isWorking,
      date,
      timestamp
    });

    // العثور على أو إنشاء سجل اليوم
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let tracking = await Tracking.findOne({
      $or: [
        { userId: userId },
        { employeeId: userId }
      ],
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!tracking) {
      // إنشاء سجل جديد
      tracking = new Tracking({
        userId: userId,
        employeeId: userId,
        date: new Date(date),
        workData: {
          totalSeconds: workData.totalSeconds || 0,
          activeSeconds: workData.activeSeconds || 0,
          idleSeconds: workData.idleSeconds || 0,
          breakSeconds: workData.breakSeconds || 0,
          sessionsCount: workData.sessionsCount || 0,
          productivity: workData.productivity || 0,
          lastActivity: new Date(workData.lastActivity || timestamp)
        },
        screenshots: screenshots || [],
        status: isWorking ? 'working' : 'idle',
        lastUpdate: new Date(timestamp)
      });
    } else {
      // تحديث السجل الموجود
      tracking.workData = {
        totalSeconds: workData.totalSeconds || 0,
        activeSeconds: workData.activeSeconds || 0,
        idleSeconds: workData.idleSeconds || 0,
        breakSeconds: workData.breakSeconds || 0,
        sessionsCount: workData.sessionsCount || 0,
        productivity: workData.productivity || 0,
        lastActivity: new Date(workData.lastActivity || timestamp)
      };
      
      // دمج لقطات الشاشة الجديدة
      if (screenshots && screenshots.length > 0) {
        tracking.screenshots = tracking.screenshots || [];
        screenshots.forEach(newScreenshot => {
          const exists = tracking.screenshots.some(existing => 
            existing.timestamp === newScreenshot.timestamp
          );
          if (!exists) {
            tracking.screenshots.push(newScreenshot);
          }
        });
      }
      
      tracking.status = isWorking ? 'working' : 'idle';
      tracking.lastUpdate = new Date(timestamp);
    }

    await tracking.save();

    res.json({
      success: true,
      message: 'تم حفظ البيانات المتقدمة بنجاح',
      data: {
        workData: tracking.workData,
        screenshotCount: tracking.screenshots ? tracking.screenshots.length : 0,
        isWorking: tracking.status === 'working',
        lastUpdate: tracking.lastUpdate
      }
    });

  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات المتقدمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حفظ البيانات',
      error: error.message
    });
  }
});

// دالة إعادة المحاولة للعمليات
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`❌ المحاولة ${attempt} فشلت:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // انتظار قبل إعادة المحاولة
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// حفظ بيانات تتبع الوقت - يدعم البيانات البسيطة والمتقدمة
router.post('/save', async (req, res) => {
  try {
    // استخراج userId من التوكن إذا كان موجوداً، أو استخدام قيمة افتراضية
    let userId;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production');
        userId = decoded.id || decoded._id;
      } catch (error) {
        console.log('⚠️ خطأ في فك تشفير التوكن، استخدام مستخدم افتراضي');
        userId = '684d388390512f7f24e4744c'; // admin user ID
      }
    } else {
      userId = '684d388390512f7f24e4744c'; // admin user ID افتراضي
    }
    
    // التحقق من نوع البيانات المرسلة
    let workData, screenshots, isWorking, date, timestamp;
    
    if (req.body.workData) {
      // بيانات متقدمة
      ({ workData, screenshots, isWorking, date, timestamp } = req.body);
      console.log('💾 حفظ بيانات التتبع المتقدمة:', {
        userId,
        workData,
        screenshotCount: screenshots ? screenshots.length : 0,
        isWorking,
        date,
        timestamp
      });
    } else {
      // بيانات بسيطة للتوافق مع النسخة القديمة
      const { totalSeconds } = req.body;
      ({ isWorking, date, timestamp } = req.body);
      
      workData = {
        totalSeconds: totalSeconds || 0,
        activeSeconds: Math.floor((totalSeconds || 0) * 0.9),
        idleSeconds: Math.floor((totalSeconds || 0) * 0.1),
        productivity: 90,
        lastActivity: timestamp
      };
      screenshots = [];
      
      console.log('💾 حفظ بيانات التتبع البسيطة:', {
        userId,
        totalSeconds,
        isWorking,
        date,
        timestamp
      });
    }

    // العثور على أو إنشاء سجل اليوم
    const dateString = req.body.dateString || new Date(date).toISOString().split('T')[0];

    let tracking = await retryOperation(async () => {
      return await Tracking.findOne({
        $or: [
          { userId: userId },
          { employeeId: userId }
        ],
        dateString: dateString
      });
    });

    if (!tracking) {
      // إنشاء سجل جديد
      tracking = new Tracking({
        userId: userId,
        employeeId: userId,
        date: new Date(date),
        dateString: dateString,
        workData: {
          totalSeconds: workData.totalSeconds || 0,
          activeSeconds: workData.activeSeconds || 0,
          idleSeconds: workData.idleSeconds || 0,
          breakSeconds: workData.breakSeconds || 0,
          sessionsCount: workData.sessionsCount || 0,
          productivity: workData.productivity || 0,
          lastActivity: new Date(workData.lastActivity || timestamp)
        },
        screenshots: screenshots || [],
        status: isWorking ? 'working' : 'idle',
        isWorking: isWorking, // إضافة حفظ حالة isWorking
        lastUpdate: new Date(timestamp)
      });
    } else {
      // تحديث السجل الموجود
      tracking.workData = {
        totalSeconds: workData.totalSeconds || 0,
        activeSeconds: workData.activeSeconds || 0,
        idleSeconds: workData.idleSeconds || 0,
        breakSeconds: workData.breakSeconds || 0,
        sessionsCount: workData.sessionsCount || 0,
        productivity: workData.productivity || 0,
        lastActivity: new Date(workData.lastActivity || timestamp)
      };
      
      // دمج لقطات الشاشة الجديدة
      if (screenshots && screenshots.length > 0) {
        tracking.screenshots = tracking.screenshots || [];
        screenshots.forEach(newScreenshot => {
          const exists = tracking.screenshots.some(existing => 
            existing.timestamp === newScreenshot.timestamp
          );
          if (!exists) {
            tracking.screenshots.push(newScreenshot);
          }
        });
      }
      
      tracking.status = isWorking ? 'working' : 'idle';
      tracking.isWorking = isWorking; // إضافة حفظ حالة isWorking
      tracking.lastUpdate = new Date(timestamp);
    }

    await retryOperation(async () => {
      return await tracking.save();
    });

    res.json({
      success: true,
      message: 'تم حفظ البيانات بنجاح',
      data: {
        workData: tracking.workData,
        screenshotCount: tracking.screenshots ? tracking.screenshots.length : 0,
        isWorking: tracking.status === 'working',
        lastUpdate: tracking.lastUpdate
      }
    });

  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حفظ البيانات',
      error: error.message
    });
  }
});

// الحصول على بيانات يوم محدد
router.get('/date/:dateString', async (req, res) => {
  try {
    // استخراج userId من التوكن
    let userId;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production');
        userId = decoded.id || decoded._id;
      } catch (error) {
        userId = '684d388390512f7f24e4744c'; // admin user ID افتراضي
      }
    } else {
      userId = '684d388390512f7f24e4744c'; // admin user ID افتراضي
    }

    const { dateString } = req.params;
    
    // التحقق من صحة التاريخ
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return res.status(400).json({
        success: false,
        message: 'تنسيق التاريخ غير صحيح. يجب أن يكون YYYY-MM-DD'
      });
    }

    const tracking = await retryOperation(async () => {
      return await Tracking.findOne({
        $or: [
          { userId: userId },
          { employeeId: userId }
        ],
        dateString: dateString
      });
    });

    if (!tracking) {
      return res.json({
        success: true,
        message: 'لا توجد بيانات لهذا التاريخ',
        data: {
          workData: {
            totalSeconds: 0,
            activeSeconds: 0,
            idleSeconds: 0,
            breakSeconds: 0,
            sessionsCount: 0,
            productivity: 0
          },
          screenshotCount: 0,
          isWorking: false,
          date: dateString
        }
      });
    }

    res.json({
      success: true,
      message: 'تم جلب البيانات بنجاح',
      data: {
        workData: tracking.workData,
        screenshotCount: tracking.screenshots ? tracking.screenshots.length : 0,
        isWorking: tracking.status === 'working',
        date: tracking.dateString,
        lastUpdate: tracking.lastUpdate
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب بيانات التاريخ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البيانات',
      error: error.message
    });
  }
});

// جلب بيانات السجلات اليومية للأسبوعين الماضيين
router.get('/daily-records/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Daily records request for userId:', userId);
    
    // حساب تاريخ الأسبوعين الماضيين
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14); // آخر 14 يوم
    
    console.log('📅 Searching for data between:', startDate.toISOString().split('T')[0], 'and', endDate.toISOString().split('T')[0]);
    
    // جلب بيانات التتبع للأسبوعين الماضيين
    const trackingData = await Tracking.find({
      $or: [
        { userId: userId },
        { employeeId: userId }
      ],
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    console.log('📊 Found tracking records:', trackingData.length);

    // إنشاء سجل للأيام الـ 14 الماضية
    const dailyRecords = [];
    
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(endDate);
      currentDate.setDate(endDate.getDate() - (13 - i));
      
      const dateString = currentDate.toISOString().split('T')[0];
      // فحص العطلة الأسبوعية بناءً على الإعدادات
      const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
      const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
      const isWeekend = weekends.includes(currentDate.getDay());
      
      // البحث عن بيانات هذا اليوم
      const dayData = trackingData.find(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === dateString;
      });
      
      let dailyRecord = {
        date: dateString,
        day: currentDate.toLocaleDateString('ar', { weekday: 'long' }),
        hijriDate: currentDate.toLocaleDateString('ar-EG-u-ca-islamic', {
          day: '2-digit',
          month: 'short'
        }),
        isWeekend: isWeekend,
        isToday: dateString === endDate.toISOString().split('T')[0],
        hasRealData: false,
        totalHours: 0,
        activeHours: 0,
        idleHours: 0,
        breakHours: 0,
        breakCount: 0,
        productivity: 0,
        status: isWeekend ? 'عطلة' : 'غائب',
        screenshots: 0
      };
      
      if (dayData && dayData.workData) {
        const workData = dayData.workData;
        dailyRecord = {
          ...dailyRecord,
          hasRealData: true,
          totalHours: Math.round((workData.totalSeconds / 3600) * 10) / 10,
          activeHours: Math.round((workData.activeSeconds / 3600) * 10) / 10,
          idleHours: Math.round((workData.idleSeconds / 3600) * 10) / 10,
          breakHours: Math.round((workData.breakSeconds / 3600) * 10) / 10,
          productivity: workData.productivity || 0,
          screenshots: dayData.screenshots ? dayData.screenshots.length : 0,
          status: workData.totalSeconds >= 6 * 3600 ? 'حاضر' : 
                   workData.totalSeconds > 0 ? 'متأخر' : 'غائب'
        };
      }
      
      dailyRecords.push(dailyRecord);
    }
    
    console.log('📋 Generated daily records:', dailyRecords.length);
    
    res.json({
      success: true,
      data: {
        records: dailyRecords,
        count: dailyRecords.length
      }
    });

  } catch (error) {
    console.error('Error fetching daily records:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب السجلات اليومية',
      error: error.message
    });
  }
});

// جلب بيانات السجلات الشهرية للمستخدم (للاستخدام في جدول التأخيرات)
router.get('/user/:userId/records', async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    console.log('🔍 Monthly records request for userId:', userId, 'year:', year, 'month:', month);
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year و month مطلوبان'
      });
    }
    
    // حساب تواريخ بداية ونهاية الشهر
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // أول يوم في الشهر
    const endDate = new Date(parseInt(year), parseInt(month), 0); // آخر يوم في الشهر
    
    console.log('📅 Searching for data between:', startDate.toISOString().split('T')[0], 'and', endDate.toISOString().split('T')[0]);
    
    // جلب بيانات التتبع للشهر المحدد
    const trackingData = await Tracking.find({
      $or: [
        { userId: userId },
        { employeeId: userId }
      ],
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    console.log('📊 Found tracking records:', trackingData.length);

    // إنشاء سجل لجميع أيام الشهر
    const monthlyRecords = [];
    const daysInMonth = endDate.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
      const dateString = currentDate.toISOString().split('T')[0];
      // فحص العطلة الأسبوعية بناءً على الإعدادات
      const holidaySettings = await Setting.findOne({ id: 'official_holidays' });
      const weekends = holidaySettings?.settings?.weekends || [5, 6]; // الجمعة والسبت افتراضياً
      const isWeekend = weekends.includes(currentDate.getDay());
      
      // البحث عن بيانات هذا اليوم
      const dayData = trackingData.find(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === dateString;
      });
      
      let dailyRecord = {
        _id: dayData?._id || `${dateString}_${userId}`,
        date: dateString,
        userId: userId,
        totalSeconds: 0,
        activeSeconds: 0,
        idleSeconds: 0,
        productivity: 0,
        isWeekend: isWeekend
      };
      
      if (dayData && dayData.workData) {
        const workData = dayData.workData;
        dailyRecord = {
          ...dailyRecord,
          totalSeconds: workData.totalSeconds || 0,
          activeSeconds: workData.activeSeconds || 0,
          idleSeconds: workData.idleSeconds || 0,
          productivity: workData.productivity || 0
        };
      }
      
      monthlyRecords.push(dailyRecord);
    }
    
    console.log('📋 Generated monthly records:', monthlyRecords.length);
    
    // حساب الإحصائيات
    const workingDays = monthlyRecords.filter(day => !day.isWeekend);
    const presentDays = workingDays.filter(day => day.totalSeconds > 0);
    const totalWorkTime = monthlyRecords.reduce((sum, day) => sum + (day.totalSeconds || 0), 0);
    const totalActiveTime = monthlyRecords.reduce((sum, day) => sum + (day.activeSeconds || 0), 0);
    const averageProductivity = presentDays.length > 0 ? 
      presentDays.reduce((sum, day) => sum + (day.productivity || 0), 0) / presentDays.length : 0;
    
    const stats = {
      totalWorkingDays: workingDays.length,
      presentDays: presentDays.length,
      absentDays: workingDays.length - presentDays.length,
      totalWorkTime: totalWorkTime,
      totalActiveTime: totalActiveTime,
      averageProductivity: Math.round(averageProductivity)
    };
    
    res.json({
      success: true,
      data: {
        records: monthlyRecords,
        stats: stats,
        count: monthlyRecords.length
      }
    });

  } catch (error) {
    console.error('Error fetching monthly records:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب السجلات الشهرية',
      error: error.message
    });
  }
});

// تحديث دالة حساب الإحصائيات لاستخدام UTC
async function calculateDailyStats(userId, date) {
  try {
    // استخدام UTC للتواريخ
    const startDate = moment.utc(date).startOf('day');
    const endDate = moment.utc(date).endOf('day');

    const tracking = await Tracking.findOne({
      userId,
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    });

    if (!tracking) {
      return {
        totalSeconds: 0,
        activeSeconds: 0,
        productivity: 0,
        lastUpdate: null
      };
    }

    return {
      totalSeconds: tracking.workData.totalSeconds || 0,
      activeSeconds: tracking.workData.activeSeconds || 0,
      productivity: tracking.workData.productivity || 0,
      lastUpdate: moment.utc(tracking.lastUpdate).format()
    };
  } catch (error) {
    console.error('Error calculating daily stats:', error);
    throw error;
  }
}

// تحديث راوت الإحصائيات
router.get('/stats/:userId/:date?', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const targetDate = date ? moment.utc(date) : moment.utc();

    const stats = await calculateDailyStats(userId, targetDate);
    
    res.json({
      success: true,
      data: {
        ...stats,
        date: targetDate.format('YYYY-MM-DD'),
        timezone: 'UTC'
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات',
      error: error.message
    });
  }
});

// دالة مساعدة لإنشاء هيكل بيانات فارغ
const createEmptyTrackingData = () => {
  return {
    totalSeconds: 0,
    activeSeconds: 0,
    idleSeconds: 0,
    breakSeconds: 0,
    productivity: 0,
    lastActivity: null,
    isWorking: false,
    status: 'offline',
    screenshots: []
  };
};

// الحصول على بيانات التتبع الحالية
router.get('/current', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = moment().startOf('day');
    
    const tracking = await Tracking.findOne({
      userId,
      date: {
        $gte: today.toDate(),
        $lt: moment(today).endOf('day').toDate()
      }
    });
    
    // إرجاع هيكل بيانات ثابت حتى في حالة عدم وجود بيانات
    const responseData = {
      success: true,
      data: tracking ? {
        totalSeconds: tracking.totalSeconds || 0,
        activeSeconds: tracking.activeSeconds || 0,
        idleSeconds: tracking.idleSeconds || 0,
        breakSeconds: tracking.breakSeconds || 0,
        productivity: tracking.productivity || 0,
        lastActivity: tracking.lastActivity || null,
        isWorking: tracking.isWorking || false,
        status: tracking.status || 'offline',
        screenshots: tracking.screenshots || []
      } : createEmptyTrackingData()
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('خطأ في جلب بيانات التتبع:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات التتبع',
      error: error.message,
      data: createEmptyTrackingData() // إرجاع هيكل بيانات فارغ حتى في حالة الخطأ
    });
  }
});

module.exports = router; 