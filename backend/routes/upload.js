const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);

const router = express.Router();

// إعدادات التخزين
const MAX_STORAGE_MB = 1024; // 1GB
const MIN_FREE_SPACE_PERCENT = 10; // 10%
const MAX_FILE_AGE_DAYS = 30; // حذف الملفات الأقدم من 30 يوم

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// دالة لحساب حجم المجلد
async function getDirSize(dirPath) {
  const files = await readdirAsync(dirPath);
  const sizes = await Promise.all(
    files.map(async file => {
      const filePath = path.join(dirPath, file);
      try {
        const stats = await statAsync(filePath);
        return stats.isFile() ? stats.size : 0;
      } catch (error) {
        console.error(`Error getting size for ${filePath}:`, error);
        return 0;
      }
    })
  );
  return sizes.reduce((acc, size) => acc + size, 0);
}

// دالة لحذف الملفات القديمة
async function cleanOldFiles() {
  try {
    const files = await readdirAsync(uploadDir);
    const now = Date.now();
    const maxAge = MAX_FILE_AGE_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      try {
        const stats = await statAsync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await unlinkAsync(filePath);
          console.log(`Deleted old file: ${file}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error cleaning old files:', error);
  }
}

// دالة للتحقق من مساحة التخزين
async function checkStorageSpace(file) {
  try {
    const currentSize = await getDirSize(uploadDir);
    const maxSize = MAX_STORAGE_MB * 1024 * 1024; // تحويل إلى بايت
    const availableSpace = maxSize - currentSize;
    const minFreeSpace = maxSize * (MIN_FREE_SPACE_PERCENT / 100);

    // إذا كانت المساحة المتبقية أقل من 10%
    if (availableSpace < minFreeSpace) {
      await cleanOldFiles();
      // إعادة حساب المساحة بعد التنظيف
      const newSize = await getDirSize(uploadDir);
      const newAvailableSpace = maxSize - newSize;
      
      if (newAvailableSpace < file.size) {
        throw new Error('لا توجد مساحة كافية للتخزين');
      }
    }

    return true;
  } catch (error) {
    console.error('Storage check error:', error);
    throw error;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// تحسين multer مع فحص المساحة
const upload = multer({
  storage,
  fileFilter: async (req, file, cb) => {
    try {
      await checkStorageSpace(file);
      cb(null, true);
    } catch (error) {
      cb(error);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB للملف الواحد
  }
}).single('file');

// تحسين راوت الرفع مع معالجة الأخطاء
router.post('/', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'فشل في رفع الملف',
        error: err.code || 'UPLOAD_ERROR'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي ملف'
      });
    }

    try {
      // حفظ معلومات الملف
      const metaPath = req.file.path + '.meta.json';
      await fs.promises.writeFile(metaPath, JSON.stringify({
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        size: req.file.size
      }));

      res.json({
        success: true,
        message: 'تم رفع الملف بنجاح',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
          url: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      console.error('Meta file error:', error);
      res.status(500).json({
        success: false,
        message: 'تم رفع الملف ولكن فشل في حفظ البيانات الوصفية',
        error: error.message
      });
    }
  });
});

// راوت لجلب كل الملفات المرفوعة
router.get('/', (req, res) => {
  console.log('GET /api/upload called');
  try {
    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stat = fs.statSync(filePath);
      // محاولة قراءة اسم الملف الأصلي من ملف جانبي (لو متاح)
      let originalName = filename;
      const metaPath = filePath + '.meta.json';
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.originalName) originalName = meta.originalName;
        } catch {}
      }
      return {
        filename,
        originalName,
        url: `/uploads/${filename}`,
        size: (stat.size / 1024).toFixed(1) + ' KB',
        uploadedAt: stat.birthtime,
        type: path.extname(filename).replace('.', '').toUpperCase()
      };
    });
    console.log('Files found:', files.length);
    res.json({ success: true, data: files });
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب الملفات', error: err.message });
  }
});

module.exports = router; 