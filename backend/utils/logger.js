const Log = require('../models/Log');

async function logAction(action, user, details, metadata = {}) {
  try {
    await Log.create({
      action,
      user: user || 'System',
      details,
      metadata,
      timestamp: new Date(),
      level: 'info',
      result: 'success',
      severity: 'low'
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}

// دالة مساعدة لتسجيل الأخطاء
async function logError(action, user, error, metadata = {}) {
  try {
    await Log.create({
      action,
      user: user || 'System',
      details: error.message,
      metadata: { ...metadata, stack: error.stack },
      timestamp: new Date(),
      level: 'error',
      result: 'failure',
      severity: 'high'
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

// دالة مساعدة لتسجيل التحذيرات
async function logWarning(action, user, details, metadata = {}) {
  try {
    await Log.create({
      action,
      user: user || 'System',
      details,
      metadata,
      timestamp: new Date(),
      level: 'warn',
      result: 'partial',
      severity: 'medium'
    });
  } catch (error) {
    console.error('Failed to log warning:', error);
  }
}

module.exports = { 
  logAction,
  logError,
  logWarning
}; 