require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
// إعادة تفعيل الاتصال بقاعدة البيانات
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// إعداد Socket.IO للتحكم في التطبيق المكتبي
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // السماح بجميع المنافذ الممكنة
      const allowedOrigins = [
        'http://localhost:3000',    // الفرونت إند (تطوير)
        'http://localhost:5001',    // باك إند
        'http://127.0.0.1:3000',   // الفرونت إند (تطوير)
        'http://127.0.0.1:5001',   // باك إند
        'http://localhost:3001',    // الفرونت إند (تطوير بديل)
        'http://127.0.0.1:3001',   // الفرونت إند (تطوير بديل)
        'http://localhost:8080',    // الفرونت إند (إنتاج)
        'http://127.0.0.1:8080',   // الفرونت إند (إنتاج)
        'http://localhost:80',     // الفرونت إند (إنتاج)
        'http://127.0.0.1:80',    // الفرونت إند (إنتاج)
        undefined,                 // السماح بطلبات بدون أصل
        'http://localhost:4200',   // Angular (تطوير)
        'http://localhost:4000',   // Vue.js (تطوير)
        'http://localhost:3002',   // React Native (تطوير)
        'http://localhost:8000',   // Django (تطوير)
        'http://localhost:8081',   // React Native (تطوير)
        'http://localhost:3003',   // Next.js (تطوير)
        'http://localhost:3004',   // Gatsby (تطوير)
        'http://localhost:3005',   // Nuxt.js (تطوير)
        'http://localhost:3006',   // Svelte (تطوير)
        'http://localhost:3007',   // Vue.js (تطوير)
        'http://localhost:3008',   // Angular (تطوير)
        'http://localhost:3009',   // React (تطوير)
        'http://localhost:3010',   // React (تطوير)
        'http://localhost:3011',   // React (تطوير)
        'http://localhost:3012',   // React (تطوير)
        'http://localhost:3013',   // React (تطوير)
        'http://localhost:3014',   // React (تطوير)
        'http://localhost:3015',   // React (تطوير)
        'http://localhost:3016',   // React (تطوير)
        'http://localhost:3017',   // React (تطوير)
        'http://localhost:3018',   // React (تطوير)
        'http://localhost:3019',   // React (تطوير)
        'http://localhost:3020',   // React (تطوير)
        'http://localhost:3021',   // React (تطوير)
        'http://localhost:3022',   // React (تطوير)
        'http://localhost:3023',   // React (تطوير)
        'http://localhost:3024',   // React (تطوير)
        'http://localhost:3025',   // React (تطوير)
        'http://localhost:3026',   // React (تطوير)
        'http://localhost:3027',   // React (تطوير)
        'http://localhost:3028',   // React (تطوير)
        'http://localhost:3029',   // React (تطوير)
        'http://localhost:3030',   // React (تطوير)
        'http://localhost:3031',   // React (تطوير)
        'http://localhost:3032',   // React (تطوير)
        'http://localhost:3033',   // React (تطوير)
        'http://localhost:3034',   // React (تطوير)
        'http://localhost:3035',   // React (تطوير)
        'http://localhost:3036',   // React (تطوير)
        'http://localhost:3037',   // React (تطوير)
        'http://localhost:3038',   // React (تطوير)
        'http://localhost:3039',   // React (تطوير)
        'http://localhost:3040',   // React (تطوير)
        'http://localhost:3041',   // React (تطوير)
        'http://localhost:3042',   // React (تطوير)
        'http://localhost:3043',   // React (تطوير)
        'http://localhost:3044',   // React (تطوير)
        'http://localhost:3045',   // React (تطوير)
        'http://localhost:3046',   // React (تطوير)
        'http://localhost:3047',   // React (تطوير)
        'http://localhost:3048',   // React (تطوير)
        'http://localhost:3049',   // React (تطوير)
        'http://localhost:3050'    // React (تطوير)
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    credentials: true,
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept', 
      'Origin',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Credentials',
      'Access-Control-Expose-Headers',
      'Access-Control-Max-Age',
      'Access-Control-Request-Headers',
      'Access-Control-Request-Method'
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    maxAge: 86400, // 24 ساعة
    preflightContinue: false,
    httpStatusMessages: true
  },
  pingTimeout: 60000, // 60 ثانية
  pingInterval: 25000, // 25 ثانية
  maxHttpBufferSize: 1e8, // 100MB
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  serveClient: true,
  upgrade: true,
  cookie: true
});

// متغيرات لتتبع الاتصالات
const connectedDesktopApps = new Map(); // userId -> socket
const connectedWebClients = new Map(); // userId -> socket

// تفعيل قاعدة البيانات
console.log('✅ Database enabled - Server running with MongoDB Atlas');
console.log('Attempting to connect to MongoDB...');

// متغير لحالة اتصال MongoDB
let isMongoConnected = false;

// دالة الاتصال بقاعدة البيانات
const connectToMongoDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await connectDB();
    isMongoConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    
    // إنشاء مستخدم admin افتراضي
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('📋 Error details:', error);
    isMongoConnected = false;
    
    // Continue running server even if database connection fails
    console.log('⚠️ Server will continue running without database connection');
  }
};

// إنشاء مستخدم admin افتراضي
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    console.log('👤 Checking for admin user...');
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const admin = new User({
        username: 'admin',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'admin',
        name: 'مدير النظام',
        firstName: 'مدير',
        lastName: 'النظام',
        department: 'إدارة',
        position: 'مدير عام',
        approvalStatus: 'approved'
      });
      await admin.save();
      console.log('✅ Default admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// تحسين إعدادات CORS للتأكد من عمل الفرونت والباك إند معاً
const corsOptions = {
  origin: function (origin, callback) {
    // السماح بجميع المنافذ الممكنة
    const allowedOrigins = [
      'http://localhost:3000',    // الفرونت إند (تطوير)
      'http://localhost:5001',    // باك إند
      'http://127.0.0.1:3000',   // الفرونت إند (تطوير)
      'http://127.0.0.1:5001',   // باك إند
      'http://localhost:3001',    // الفرونت إند (تطوير بديل)
      'http://127.0.0.1:3001',   // الفرونت إند (تطوير بديل)
      'http://localhost:8080',    // الفرونت إند (إنتاج)
      'http://127.0.0.1:8080',   // الفرونت إند (إنتاج)
      'http://localhost:80',     // الفرونت إند (إنتاج)
      'http://127.0.0.1:80',    // الفرونت إند (إنتاج)
      undefined,                 // السماح بطلبات بدون أصل
      'http://localhost:4200',   // Angular (تطوير)
      'http://localhost:4000',   // Vue.js (تطوير)
      'http://localhost:3002',   // React Native (تطوير)
      'http://localhost:8000',   // Django (تطوير)
      'http://localhost:8081',   // React Native (تطوير)
      'http://localhost:3003',   // Next.js (تطوير)
      'http://localhost:3004',   // Gatsby (تطوير)
      'http://localhost:3005',   // Nuxt.js (تطوير)
      'http://localhost:3006',   // Svelte (تطوير)
      'http://localhost:3007',   // Vue.js (تطوير)
      'http://localhost:3008',   // Angular (تطوير)
      'http://localhost:3009',   // React (تطوير)
      'http://localhost:3010',   // React (تطوير)
      'http://localhost:3011',   // React (تطوير)
      'http://localhost:3012',   // React (تطوير)
      'http://localhost:3013',   // React (تطوير)
      'http://localhost:3014',   // React (تطوير)
      'http://localhost:3015',   // React (تطوير)
      'http://localhost:3016',   // React (تطوير)
      'http://localhost:3017',   // React (تطوير)
      'http://localhost:3018',   // React (تطوير)
      'http://localhost:3019',   // React (تطوير)
      'http://localhost:3020',   // React (تطوير)
      'http://localhost:3021',   // React (تطوير)
      'http://localhost:3022',   // React (تطوير)
      'http://localhost:3023',   // React (تطوير)
      'http://localhost:3024',   // React (تطوير)
      'http://localhost:3025',   // React (تطوير)
      'http://localhost:3026',   // React (تطوير)
      'http://localhost:3027',   // React (تطوير)
      'http://localhost:3028',   // React (تطوير)
      'http://localhost:3029',   // React (تطوير)
      'http://localhost:3030',   // React (تطوير)
      'http://localhost:3031',   // React (تطوير)
      'http://localhost:3032',   // React (تطوير)
      'http://localhost:3033',   // React (تطوير)
      'http://localhost:3034',   // React (تطوير)
      'http://localhost:3035',   // React (تطوير)
      'http://localhost:3036',   // React (تطوير)
      'http://localhost:3037',   // React (تطوير)
      'http://localhost:3038',   // React (تطوير)
      'http://localhost:3039',   // React (تطوير)
      'http://localhost:3040',   // React (تطوير)
      'http://localhost:3041',   // React (تطوير)
      'http://localhost:3042',   // React (تطوير)
      'http://localhost:3043',   // React (تطوير)
      'http://localhost:3044',   // React (تطوير)
      'http://localhost:3045',   // React (تطوير)
      'http://localhost:3046',   // React (تطوير)
      'http://localhost:3047',   // React (تطوير)
      'http://localhost:3048',   // React (تطوير)
      'http://localhost:3049',   // React (تطوير)
      'http://localhost:3050'    // React (تطوير)
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Credentials',
    'Access-Control-Expose-Headers',
    'Access-Control-Max-Age',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method'
  ],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 ساعة
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  httpStatusMessages: true
};

// Middleware
app.use(cors(corsOptions));

// تحسين معالجة headers
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Allow-Credentials, Access-Control-Expose-Headers, Access-Control-Max-Age, Access-Control-Request-Headers, Access-Control-Request-Method');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
  res.header('Access-Control-Max-Age', '86400');
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تشغيل الاتصال بقاعدة البيانات
connectToMongoDB();

// Middleware للتحقق من اتصال قاعدة البيانات
app.use((req, res, next) => {
  req.isMongoConnected = isMongoConnected;
  next();
});

// إتاحة Socket.IO للـ routes
app.set('io', io);

// Static files serving for uploads (including screenshots)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static file serving enabled for uploads directory');

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📊 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes - تفعيل جميع الـ routes
console.log('🛣️ Loading routes...');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/daily-attendance', require('./routes/daily-attendance'));
console.log('✅ All routes loaded');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'HR System API is running with MongoDB Atlas',
    database: isMongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    version: '2.8.0'
  });
});

// Basic endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HR System API is running with MongoDB Atlas',
    version: '2.8.0',
    status: 'active',
    database: isMongoConnected ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : 'خطأ داخلي'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة'
  });
});

const PORT = process.env.PORT || 5001;

// إعداد Socket.IO للتحكم في التطبيق المكتبي
io.on('connection', (socket) => {
  console.log('🔌 New socket connection:', socket.id);

  // تسجيل التطبيق المكتبي
  socket.on('register-desktop-app', (data) => {
    const { userId, userInfo } = data;
    connectedDesktopApps.set(userId, socket);
    socket.userId = userId;
    socket.userType = 'desktop';
    console.log(`📱 Desktop app registered for user: ${userInfo?.name || userId}`);
    
    // إشعار العملاء المتصلين بالويب
    const webClient = connectedWebClients.get(userId);
    if (webClient) {
      webClient.emit('desktop-app-status', { connected: true, userId });
    }
  });

  // تسجيل عميل الويب
  socket.on('register-web-client', (data) => {
    const { userId } = data;
    connectedWebClients.set(userId, socket);
    socket.userId = userId;
    socket.userType = 'web';
    console.log(`🌐 Web client registered for user: ${userId}`);
    
    // إرسال حالة التطبيق المكتبي
    const desktopConnected = connectedDesktopApps.has(userId);
    socket.emit('desktop-app-status', { connected: desktopConnected, userId });
  });

  // أوامر التحكم من الويب للتطبيق المكتبي
  socket.on('control-desktop-app', (data) => {
    const { userId, command, payload } = data;
    const desktopApp = connectedDesktopApps.get(userId);
    
    if (desktopApp) {
      console.log(`📡 Sending command '${command}' to desktop app for user: ${userId}`);
      desktopApp.emit('remote-command', { command, payload });
      
      // تأكيد الإرسال للويب
      const webClient = connectedWebClients.get(userId);
      if (webClient) {
        webClient.emit('command-sent', { command, success: true });
      }
    } else {
      console.log(`❌ Desktop app not found for user: ${userId}`);
      // إرسال خطأ للويب
      const webClient = connectedWebClients.get(userId);
      if (webClient) {
        webClient.emit('command-sent', { command, success: false, error: 'Desktop app not connected' });
      }
    }
  });

  // استقبال حالة من التطبيق المكتبي
  socket.on('desktop-status', (data) => {
    try {
      const { userId, status } = data;
      
      // التحقق من صحة البيانات
      if (!userId) {
        throw new Error('Missing userId');
      }
      
      // إرسال الحالة لعميل الويب
      const webClient = connectedWebClients.get(userId);
      if (webClient) {
        webClient.emit('desktop-status-update', {
          userId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ Error handling desktop status: ${error.message}`);
    }
    if (webClient) {
      webClient.emit('desktop-status-update', data);
    }
  });

  // معالجة قطع الاتصال
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
    
    if (socket.userId) {
      if (socket.userType === 'desktop') {
        connectedDesktopApps.delete(socket.userId);
        console.log(`📱 Desktop app disconnected for user: ${socket.userId}`);
        
        // إشعار عميل الويب
        const webClient = connectedWebClients.get(socket.userId);
        if (webClient) {
          webClient.emit('desktop-app-status', { connected: false, userId: socket.userId });
        }
      } else if (socket.userType === 'web') {
        connectedWebClients.delete(socket.userId);
        console.log(`🌐 Web client disconnected for user: ${socket.userId}`);
      }
    }
  });
});

// بدء الخادم
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

// معالجة إشارات الإغلاق
process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  if (isMongoConnected) {
    console.log('🔒 إغلاق اتصال MongoDB Atlas...');
    await mongoose.connection.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  if (isMongoConnected) {
    console.log('🔒 إغلاق اتصال MongoDB Atlas...');
    await mongoose.connection.close();
  }
  process.exit(0);
});

module.exports = app; 