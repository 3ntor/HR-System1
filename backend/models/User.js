const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['admin', 'employee', 'viewer'],
    default: 'employee'
  },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'inactive', 'suspended'],
    default: 'pending'
  },

  firstName: String,
  lastName: String,
  phone: String,
  department: String,
  position: String,
  lastLogin: Date,
  permissions: [String],
  preferences: {
    language: { type: String, default: 'ar' },
    theme: { type: String, default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// دالة للتحقق من كلمة المرور
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLogin: -1 });

UserSchema.index({ 
  username: 'text', 
  email: 'text', 
  firstName: 'text', 
  lastName: 'text' 
});

module.exports = mongoose.model('User', UserSchema); 