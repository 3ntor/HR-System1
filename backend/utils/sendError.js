const Log = require('../models/Log');

async function sendError(res, statusCode, message, errorCode = 'INTERNAL_ERROR', details = null) {
  try {
    // تسجيل الخطأ في MongoDB
    await Log.create({
      level: 'error',
      action: 'ERROR',
      details: message,
      errorCode,
      metadata: details,
      result: 'failure',
      severity: 'high',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }

  // إرسال الرد
  res.status(statusCode).json({
    success: false,
    message,
    details,
    errorCode,
    timestamp: new Date().toISOString()
  });
}

module.exports = sendError; 