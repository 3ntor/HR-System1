const jwt = require('jsonwebtoken');
const sendError = require('../utils/sendError');

const JWT_SECRET = process.env.JWT_SECRET || 'hr-system-2024-default-secret-change-in-production';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return sendError(res, 401, 'يجب تسجيل الدخول أولاً', 'UNAUTHORIZED');
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 401, 'توكن غير صالح أو منتهي', 'UNAUTHORIZED');
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return sendError(res, 403, 'غير مصرح لك بتنفيذ هذه العملية', 'FORBIDDEN');
    }
    next();
  };
}

function requireViewerOrHigher(req, res, next) {
  if (!req.user) {
    return sendError(res, 401, 'يجب تسجيل الدخول أولاً', 'UNAUTHORIZED');
  }
  
  const allowedRoles = ['admin', 'manager', 'employee', 'viewer'];
  const userRoleIndex = allowedRoles.indexOf(req.user.role);
  
  if (userRoleIndex === -1) {
    return sendError(res, 403, 'غير مصرح لك بتنفيذ هذه العملية', 'FORBIDDEN');
  }
  
  next();
}

module.exports = { requireAuth, requireRole, requireViewerOrHigher }; 