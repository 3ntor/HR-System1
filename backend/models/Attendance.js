const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: Date,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    },
    device: String,
    ip: String
  },
  checkOut: {
    time: Date,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    },
    device: String,
    ip: String
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'half-day', 'leave'],
    default: 'absent'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  deductionHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  notes: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

attendanceSchema.methods.calculateWorkingHours = function() {
  if (this.checkIn && this.checkIn.time && this.checkOut && this.checkOut.time) {
    const diff = this.checkOut.time - this.checkIn.time;
    this.workingHours = Math.round(diff / (1000 * 60 * 60) * 10) / 10;
  }
  return this.workingHours;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 