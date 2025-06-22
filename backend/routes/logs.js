const express = require('express');
const router = express.Router();
const sendError = require('../utils/sendError');
const Log = require('../models/Log');

// GET all logs
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add log
router.post('/', async (req, res) => {
  const log = new Log(req.body);
  try {
    const newLog = await log.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET logs stats
router.get('/stats', async (req, res) => {
  try {
    const totalLogs = await Log.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayLogs = await Log.countDocuments({ timestamp: { $gte: today, $lt: tomorrow } });
    // Breakdown by action
    const actionAgg = await Log.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    const actionBreakdown = {};
    actionAgg.forEach(a => { actionBreakdown[a._id] = a.count; });
    // Breakdown by user
    const userAgg = await Log.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const userActivity = {};
    userAgg.forEach(u => { userActivity[u._id] = u.count; });
    res.json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        actionBreakdown,
        userActivity
      }
    });
  } catch (err) {
    sendError(res, 500, 'خطأ في جلب إحصائيات السجلات', 'INTERNAL_ERROR', err.message);
  }
});

module.exports = router; 