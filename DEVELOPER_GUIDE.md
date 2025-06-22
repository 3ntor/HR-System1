# 🔧 دليل المطور - نظام إدارة الموارد البشرية والمالية

## 📋 نظرة عامة تقنية

**نظام شامل مبني على Node.js + React مع تكامل WhatsApp**

### 🏗️ **هيكل المشروع**
```
HR-System/
├── backend/                 # Node.js Express Server
│   ├── server.js           # Entry point
│   ├── routes/             # API Routes
│   ├── data/               # JSON Database
│   ├── managers/           # WhatsApp Manager
│   └── middleware/         # Authentication, etc.
├── frontend/               # React App
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/          # Page Components
│   │   ├── services/       # API Services
│   │   └── utils/          # Utility Functions
├── start-system.sh         # System Launcher
└── stop-system.sh          # System Stopper
```

---

## 🛠️ **Backend Architecture**

### **تكنولوجيا Backend:**
- **Node.js** v18+ - Runtime Environment
- **Express.js** - Web Framework  
- **whatsapp-web.js** - WhatsApp Integration
- **JSON Files** - Simple Database
- **CORS** - Cross-Origin Resource Sharing
- **Multer** - File Upload Handling

### **قاعدة البيانات (JSON Files):**
```
backend/data/
├── employees.json          # بيانات الموظفين
├── transactions.json       # المعاملات المالية
├── clients.json           # بيانات العملاء
├── categories.json        # فئات المعاملات
├── logs/
│   └── logs.json          # سجلات النظام
└── whatsapp/
    └── session/           # WhatsApp Session Data
```

---

## 🔗 **API Endpoints Documentation**

### **🏠 Health Check**
```http
GET /health
Response: { status: "OK", message: "Server is running" }
```

### **📊 System Logs**
```http
GET /api/logs                    # جلب جميع السجلات
GET /api/logs/stats              # إحصائيات السجلات
POST /api/logs                   # إضافة سجل جديد
Body: { action, user, details, timestamp }
```

### **💰 Transactions (المعاملات المالية)**
```http
GET /api/transactions            # جلب جميع المعاملات
POST /api/transactions           # إضافة معاملة جديدة
PUT /api/transactions/:id        # تحديث معاملة
DELETE /api/transactions/:id     # حذف معاملة

Body Structure:
{
  "id": "string",
  "type": "income|expense", 
  "amount": number,
  "description": "string",
  "category": "string",
  "date": "ISO string",
  "status": "pending|approved|rejected",
  "approvedBy": "string|null"
}
```

### **👥 Employees (الموظفين)**
```http
GET /api/employees               # جلب جميع الموظفين
POST /api/employees              # إضافة موظف جديد
PUT /api/employees/:id           # تحديث بيانات موظف
DELETE /api/employees/:id        # حذف موظف

Body Structure:
{
  "id": "string",
  "name": "string",
  "email": "string", 
  "phone": "string",
  "department": "string",
  "position": "string",
  "salary": number,
  "startDate": "ISO string",
  "status": "active|inactive"
}
```

### **🤝 Clients (العملاء)**
```http
GET /api/clients                 # جلب جميع العملاء
POST /api/clients                # إضافة عميل جديد
PUT /api/clients/:id             # تحديث بيانات عميل
DELETE /api/clients/:id          # حذف عميل

Body Structure:
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string", 
  "company": "string",
  "address": "string",
  "totalProjects": number,
  "totalPayments": number
}
```

### **📱 WhatsApp Integration**
```http
GET /api/whatsapp/status         # حالة الاتصال
GET /api/whatsapp/qr             # QR Code للربط
POST /api/whatsapp/send          # إرسال رسالة
POST /api/whatsapp/disconnect    # قطع الاتصال
POST /api/whatsapp/restart       # إعادة التشغيل

Send Message Body:
{
  "to": "phone_number",
  "message": "text_content"
}
```

---

## 📱 **WhatsApp Integration Deep Dive**

### **WhatsApp Manager Class:**
```javascript
// backend/managers/WhatsAppManager.js
class WhatsAppManager {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
  }
  
  async initialize() {
    // Initialize WhatsApp client with session
  }
  
  async sendMessage(to, message) {
    // Send message to phone number
  }
  
  async generateQR() {
    // Generate QR code for linking
  }
}
```

### **WhatsApp Events:**
- `qr` - QR Code generated
- `ready` - Client ready to send messages  
- `authenticated` - Session authenticated
- `auth_failure` - Authentication failed
- `disconnected` - Client disconnected

### **Phone Number Format:**
```javascript
// All phone numbers stored as: "20xxxxxxxxxx" (Egypt format)
function formatPhone(phone) {
  return phone.replace(/[^\d]/g, '').replace(/^0/, '20');
}
```

---

## 🔐 **Authentication System**

### **User Structure:**
```json
{
  "id": "string",
  "username": "string", 
  "password": "hashed_string",
  "role": "admin|employee",
  "employeeId": "string|null",
  "lastLogin": "ISO_string",
  "isActive": boolean
}
```

### **JWT Token (Future Implementation):**
```javascript
// Currently using localStorage, upgrade to JWT recommended
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### **Role-Based Access:**
- **Admin**: Full access to all endpoints
- **Employee**: Limited access (own data only)

---

## 📂 **File Structure Deep Dive**

### **Backend Server (server.js):**
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/logs', require('./routes/logs'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

const PORT = process.env.PORT || 5001;
app.listen(PORT);
```

### **Data Management Pattern:**
```javascript
// Read JSON file
function readData(filename) {
  const filePath = path.join(__dirname, 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Write JSON file  
function writeData(filename, data) {
  const filePath = path.join(__dirname, 'data', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
```

---

## 🚀 **Development Setup**

### **Prerequisites:**
```bash
# Node.js v18+
node --version

# npm v8+
npm --version  

# Git
git --version
```

### **Backend Setup:**
```bash
# 1. Navigate to backend
cd backend/

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Setup data directories
mkdir -p data/logs data/whatsapp/session

# 5. Initialize data files
echo '[]' > data/employees.json
echo '[]' > data/transactions.json  
echo '[]' > data/clients.json
echo '[]' > data/logs/logs.json

# 6. Start development server
npm run dev
```

### **Environment Variables:**
```bash
# .env file
PORT=5001
NODE_ENV=development
WHATSAPP_SESSION_PATH=./data/whatsapp/session
LOG_FILE_PATH=./data/logs/logs.json
```

---

## 🔧 **Development Guidelines**

### **Code Structure:**
```
backend/
├── server.js              # Main server file
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── employees.js       # Employee CRUD
│   ├── transactions.js    # Transaction CRUD  
│   ├── clients.js         # Client CRUD
│   ├── logs.js           # System logs
│   └── whatsapp.js       # WhatsApp integration
├── middleware/
│   ├── auth.js           # Authentication middleware
│   ├── validation.js     # Input validation
│   └── logging.js        # Request logging
├── managers/
│   └── WhatsAppManager.js # WhatsApp business logic
├── utils/
│   ├── dataHelper.js     # JSON file operations
│   ├── phoneFormatter.js # Phone number formatting
│   └── logger.js         # Logging utilities
└── data/                 # JSON database files
```

### **Error Handling Pattern:**
```javascript
// Standard error response
function sendError(res, statusCode, message, details = null) {
  res.status(statusCode).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

// Success response
function sendSuccess(res, data, message = 'Success') {
  res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}
```

### **Logging Pattern:**
```javascript
// Log all actions
function logAction(action, user, details) {
  const logEntry = {
    id: generateId(),
    action,
    user: user || 'System',
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  // Save to logs.json
  appendLog(logEntry);
}
```

---

## 📊 **Database Schema**

### **Transactions Collection:**
```json
{
  "id": "txn_20241201_001",
  "type": "income",
  "amount": 5000,
  "description": "استشارة تقنية",
  "category": "consulting", 
  "date": "2024-12-01T10:00:00.000Z",
  "status": "approved",
  "approvedBy": "admin",
  "approvedAt": "2024-12-01T11:00:00.000Z",
  "createdBy": "admin",
  "createdAt": "2024-12-01T10:00:00.000Z",
  "attachments": ["file1.pdf"],
  "clientId": "client_001",
  "projectId": "proj_001"
}
```

### **Employees Collection:**
```json
{
  "id": "emp_001",
  "employeeNumber": "HR2024001",
  "name": "أحمد محمد علي",
  "email": "ahmed@company.com",
  "phone": "201234567890",
  "department": "تقنية المعلومات",
  "position": "مطور برمجيات",
  "salary": 8000,
  "startDate": "2024-01-15T00:00:00.000Z",
  "status": "active",
  "bankAccount": "123456789",
  "nationalId": "12345678901234",
  "address": "القاهرة، مصر",
  "emergencyContact": {
    "name": "فاطمة أحمد",
    "phone": "201234567891",
    "relation": "زوجة"
  },
  "createdAt": "2024-01-15T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

---

## 🔐 **Security Implementation**

### **Input Validation:**
```javascript
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateTransaction = [
  body('amount').isNumeric().withMessage('Amount must be numeric'),
  body('type').isIn(['income', 'expense']).withMessage('Invalid type'),
  body('description').trim().isLength({ min: 3 }).withMessage('Description required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Validation failed', errors.array());
    }
    next();
  }
];
```

### **CORS Configuration:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

---

## 🚀 **Deployment Guide**

### **Production Environment:**
```bash
# 1. Clone repository
git clone <repository-url>
cd HR-System

# 2. Install dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit .env with production values

# 4. Setup PM2 (Process Manager)
npm install -g pm2
pm2 start backend/ecosystem.config.js
pm2 startup
pm2 save

# 5. Setup Nginx (reverse proxy)
sudo nginx -t
sudo systemctl reload nginx
```

### **PM2 Configuration (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'hr-backend',
    script: 'server.js',
    cwd: './backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### **Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 **Testing Guidelines**

### **API Testing with curl:**
```bash
# Test health endpoint
curl http://localhost:5001/health

# Test get transactions
curl http://localhost:5001/api/transactions

# Test create transaction
curl -X POST http://localhost:5001/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"type":"income","amount":1000,"description":"Test transaction"}'

# Test WhatsApp status
curl http://localhost:5001/api/whatsapp/status
```

### **Unit Testing Setup:**
```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.0.0"
  }
}

// tests/transactions.test.js
const request = require('supertest');
const app = require('../server');

describe('Transactions API', () => {
  test('GET /api/transactions', async () => {
    const response = await request(app).get('/api/transactions');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🔧 **Performance Optimization**

### **Caching Strategy:**
```javascript
// Simple in-memory cache
const cache = new Map();

function getCachedData(key, fetchFunction, ttl = 300000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = fetchFunction();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### **Database Optimization:**
```javascript
// Index simulation for faster searches
function createIndex(data, field) {
  const index = new Map();
  data.forEach((item, idx) => {
    const key = item[field];
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(idx);
  });
  return index;
}

// Fast search using index
function findByIndex(data, index, field, value) {
  const indices = index.get(value) || [];
  return indices.map(idx => data[idx]);
}
```

---

## 🐛 **Debugging & Troubleshooting**

### **Common Issues:**

**1. WhatsApp Connection Issues:**
```javascript
// Check session files
ls -la backend/data/whatsapp/session/

// Clear session and restart
rm -rf backend/data/whatsapp/session/*
pm2 restart hr-backend
```

**2. JSON File Corruption:**
```javascript
// Backup and restore
cp data/transactions.json data/transactions.json.backup
echo '[]' > data/transactions.json
```

**3. Port Already in Use:**
```bash
# Find process using port
lsof -i :5001

# Kill process
kill -9 <PID>
```

### **Debug Logging:**
```javascript
// Enhanced logging for debugging
const debug = require('debug')('hr:backend');

function debugLog(action, data) {
  if (process.env.NODE_ENV === 'development') {
    debug(`${action}:`, JSON.stringify(data, null, 2));
  }
}
```

---

## 📈 **Future Enhancements**

### **Recommended Upgrades:**

1. **Database Migration:**
   - Move from JSON files to MongoDB/PostgreSQL
   - Implement proper relationships and indexing

2. **Authentication Enhancement:**
   - Implement JWT tokens
   - Add password hashing (bcrypt)
   - Session management

3. **API Improvements:**
   - Add pagination for large datasets
   - Implement API versioning
   - Add rate limiting

4. **WhatsApp Features:**
   - Message templates
   - Bulk messaging queues
   - Media message support

### **Code Structure Improvements:**
```javascript
// Proposed new structure
backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── models/         # Data models
│   ├── services/       # External services
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   └── utils/          # Utility functions
├── tests/              # Test files
├── docs/               # API documentation
└── config/             # Configuration files
```

---

## 📞 **Developer Support**

### **Development Commands:**
```bash
# Start development server
npm run dev

# Check code style
npm run lint

# Run tests  
npm test

# Build for production
npm run build

# Generate API docs
npm run docs
```

### **Useful Resources:**
- **Express.js Docs**: https://expressjs.com/
- **WhatsApp Web.js**: https://wwebjs.dev/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

**تم إنشاء هذا الدليل لمساعدة المطورين في فهم وتطوير النظام بكفاءة 🚀** 