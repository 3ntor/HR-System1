const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');

const JWT_SECRET = 'hr-system-2024-default-secret-change-in-production';
const MONGODB_URI = 'mongodb://localhost:27017/hr-system';

async function testAuth() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin user if not exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const admin = new User({
        username: 'admin',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'admin',
        name: 'مدير النظام',
        department: 'إدارة',
        approvalStatus: 'approved'
      });
      await admin.save();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Test login
    console.log('\nTesting login...');
    const user = await User.findOne({ username: 'admin' });
    if (!user) {
      throw new Error('Admin user not found');
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\nGenerated token:', token);
    
    // Verify token
    console.log('\nVerifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully:', decoded);

    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAuth(); 