console.log('🚀 Starting HR System Debug...');
console.log('📍 Current directory:', __dirname);
console.log('📊 Node version:', process.version);
console.log('🔧 Environment variables:');
console.log('  - PORT:', process.env.PORT || 'Not set');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// Test basic requirements
try {
  const express = require('express');
  console.log('✅ Express available');
} catch (e) {
  console.log('❌ Express not available:', e.message);
}

try {
  const mongoose = require('mongoose');
  console.log('✅ Mongoose available');
} catch (e) {
  console.log('❌ Mongoose not available:', e.message);
}

try {
  const jwt = require('jsonwebtoken');
  console.log('✅ JWT available');
} catch (e) {
  console.log('❌ JWT not available:', e.message);
}

// Test database connection
const testDatabase = async () => {
  try {
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';
    
    console.log('🔗 Testing MongoDB connection...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
  }
};

// Test JWT
const testJWT = () => {
  try {
    const jwt = require('jsonwebtoken');
    const secret = 'hr-system-2024-default-secret-change-in-production';
    const token = jwt.sign({ test: 'data' }, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    console.log('✅ JWT test successful');
  } catch (error) {
    console.log('❌ JWT test failed:', error.message);
  }
};

// Run tests
testJWT();
testDatabase().then(() => {
  console.log('🏁 Debug complete');
}); 