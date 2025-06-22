const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  settings: { type: Object, required: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

SettingSchema.index({ id: 1 });
SettingSchema.index({ category: 1 });
SettingSchema.index({ createdAt: -1 });
SettingSchema.index({ updatedAt: -1 });

SettingSchema.index({ 
  category: 1, 
  id: 1 
});

module.exports = mongoose.model('Setting', SettingSchema); 