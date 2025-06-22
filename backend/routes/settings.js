const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { settingsValidation } = require('../middleware/validation');
const { requireAuth, requireRole } = require('../middleware/auth');
const sendError = require('../utils/sendError');
const Setting = require('../models/Setting');

const dataFile = path.join(__dirname, '../data/settings.json');

function readSettings() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}
function writeSettings(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// GET all settings (filter, search, pagination)
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add settings
router.post('/', requireAuth, requireRole('admin'), settingsValidation, async (req, res) => {
  const setting = new Setting(req.body);
  try {
    const newSetting = await setting.save();
    res.status(201).json(newSetting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update settings
router.put('/:id', requireAuth, requireRole('admin'), settingsValidation, (req, res) => {
  const sets = readSettings();
  const idx = sets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return sendError(res, 404, 'الإعدادات غير موجودة', 'NOT_FOUND');
  sets[idx] = { ...sets[idx], ...req.body };
  writeSettings(sets);
  res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح', data: sets[idx] });
});

// DELETE settings
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  let sets = readSettings();
  const before = sets.length;
  sets = sets.filter(s => s.id !== req.params.id);
  if (sets.length === before) return sendError(res, 404, 'الإعدادات غير موجودة', 'NOT_FOUND');
  writeSettings(sets);
  res.json({ success: true, message: 'تم حذف الإعدادات بنجاح' });
});

module.exports = router; 