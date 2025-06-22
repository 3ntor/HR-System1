const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const LogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ['debug', 'info', 'warn', 'error', 'fatal'], default: 'info' },
  action: { type: String, required: true },
  category: { type: String },
  user: { type: String },
  userId: { type: String },
  details: { type: String },
  metadata: { type: Object },
  resource: {
    type: {
      type: String
    },
    id: String,
    name: String
  },
  changes: {
    before: { type: Object },
    after: { type: Object }
  },
  result: { type: String, enum: ['success', 'failure', 'partial'] },
  errorCode: { type: String },
  errorMessage: { type: String },
  duration: { type: Number },
  tags: [String],
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  isSystemGenerated: { type: Boolean },
  correlationId: { type: String }
}, {
  timestamps: true
});

LogSchema.index({ id: 1 });
LogSchema.index({ timestamp: -1 });
LogSchema.index({ level: 1 });
LogSchema.index({ action: 1 });
LogSchema.index({ category: 1 });
LogSchema.index({ userId: 1 });
LogSchema.index({ result: 1 });
LogSchema.index({ severity: 1 });
LogSchema.index({ isSystemGenerated: 1 });
LogSchema.index({ correlationId: 1 });
LogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
LogSchema.index({ tags: 1 });
LogSchema.index({ createdAt: -1 });

LogSchema.index({ 
  timestamp: -1, 
  level: 1, 
  category: 1 
});

LogSchema.pre('validate', function(next) {
  if (!this.id) {
    this.id = uuidv4();
  }
  next();
});

module.exports = mongoose.model('Log', LogSchema); 