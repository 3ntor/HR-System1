const jwt = require('jsonwebtoken');

const JWT_SECRET = 'hr-system-2024-default-secret-change-in-production';

const testUser = {
  id: 'test-admin',
  username: 'admin',
  role: 'admin',
  email: 'admin@test.com'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1d' });
console.log('Test JWT Token:');
console.log(token); 