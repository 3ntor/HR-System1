const { app, BrowserWindow, ipcMain, powerMonitor, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { io } = require('socket.io-client');

// قراءة معلومات الإصدار من package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const APP_VERSION = packageJson.version;
const APP_NAME = packageJson.description;

// إضافة مكتبة مراقبة النشاط على مستوى النظام
let mouse, keyboard;
try {
    const { mouse: nutMouse, keyboard: nutKeyboard } = require('@nut-tree-fork/nut-js');
    mouse = nutMouse;
    keyboard = nutKeyboard;
} catch (error) {
    console.log('⚠️ لم يتم تحميل مكتبة مراقبة النشاط:', error.message);
}

let mainWindow;
let systemActivityMonitor = null;
let lastSystemActivity = Date.now();
let lastMousePosition = { x: 0, y: 0 };
let globalActivityMonitor = null;

// متغيرات WebSocket للتحكم عن بُعد
let socket = null;
let currentUserId = null;
let isWorkingRemotely = false;

// إنشاء النافذة الرئيسية
function createMainWindow() {
    console.log('🖥️ إنشاء النافذة الرئيسية...');
    
  mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
        show: true, // إظهار النافذة فوراً
        center: true, // توسيط النافذة
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        title: `HR Time Tracker v${APP_VERSION}`,
        icon: null // يمكن إضافة أيقونة لاحقاً
  });

    console.log('📄 تحميل ملف HTML...');
  mainWindow.loadFile('index.html');

  // إظهار النافذة عند الانتهاء من التحميل
  mainWindow.once('ready-to-show', () => {
        console.log('✅ النافذة جاهزة للعرض');
    mainWindow.show();
        mainWindow.focus(); // التركيز على النافذة
    });

    // فتح أدوات المطور للتشخيص
      mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
        console.log('🚪 تم إغلاق النافذة');
    mainWindow = null;
  });

    // معالجة أخطاء التحميل
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ فشل في تحميل الصفحة:', errorCode, errorDescription);
    });

    console.log('🖥️ تم إنشاء النافذة الرئيسية بنجاح');
}

// مراقبة النشاط على مستوى النظام المحسنة
function startSystemActivityMonitoring() {
    console.log('👁️ بدء مراقبة النشاط الشاملة على مستوى النظام...');
    
    // مراقبة أحداث النظام
    powerMonitor.on('resume', () => {
        lastSystemActivity = Date.now();
        console.log('🔄 النظام استأنف العمل');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('system-activity-detected');
        }
    });

    powerMonitor.on('suspend', () => {
        console.log('💤 النظام في وضع السكون');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('system-suspend');
        }
    });

    // مراقبة النشاط العامة كل ثانية
    systemActivityMonitor = setInterval(() => {
        // إرسال إشارة للتحقق من النشاط
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('check-system-activity');
        }
    }, 1000);

    // مراقبة حركة الماوس على مستوى النظام
    if (mouse) {
        startGlobalMouseMonitoring();
        console.log('✅ تم تفعيل مراقبة الماوس العامة');
    } else {
        console.log('⚠️ مكتبة مراقبة الماوس غير متوفرة');
    }
    
    console.log('✅ تم تفعيل مراقبة النشاط الشاملة');
    console.log('⚙️ فحص النشاط كل ثانية، مراقبة الماوس كل 500ms');
      }

// مراقبة حركة الماوس على مستوى النظام
function startGlobalMouseMonitoring() {
    if (globalActivityMonitor) {
        clearInterval(globalActivityMonitor);
    }

    globalActivityMonitor = setInterval(async () => {
        try {
            if (mouse) {
                const currentPosition = await mouse.getPosition();
                
                // التحقق من تغيير موضع الماوس
                if (currentPosition.x !== lastMousePosition.x || currentPosition.y !== lastMousePosition.y) {
                    const previousPosition = { ...lastMousePosition };
                    lastMousePosition = currentPosition;
                    lastSystemActivity = Date.now();
                    
                    // حساب المسافة المقطوعة
                    const distance = Math.sqrt(
                        Math.pow(currentPosition.x - previousPosition.x, 2) + 
                        Math.pow(currentPosition.y - previousPosition.y, 2)
                    );
                    
                    // إرسال إشعار بالنشاط للتطبيق مع تفاصيل أكثر
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('global-mouse-activity', {
                            position: currentPosition,
                            previousPosition: previousPosition,
                            distance: Math.round(distance),
                            timestamp: lastSystemActivity
                        });
          }
                    
                    // تسجيل النشاط كل 10 ثوان فقط لتجنب الإزعاج
                    if (Math.floor(Date.now() / 10000) !== Math.floor((Date.now() - 500) / 10000)) {
                        console.log(`🖱️ حركة ماوس: (${currentPosition.x}, ${currentPosition.y}) - مسافة: ${Math.round(distance)}px`);
                    }
                }
            }
        } catch (error) {
            // تجاهل الأخطاء في مراقبة الماوس
            if (Math.floor(Date.now() / 30000) !== Math.floor((Date.now() - 500) / 30000)) {
                console.log('⚠️ خطأ في مراقبة الماوس:', error.message);
            }
        }
    }, 300); // فحص كل 300ms للحصول على استجابة أسرع

    console.log('🖱️ تم تفعيل مراقبة حركة الماوس على مستوى النظام');
    console.log('⚙️ فحص موضع الماوس كل 300ms');
}

function stopSystemActivityMonitoring() {
    if (systemActivityMonitor) {
        clearInterval(systemActivityMonitor);
        systemActivityMonitor = null;
        console.log('⏹️ تم إيقاف مراقبة النشاط على مستوى النظام');
    }

    if (globalActivityMonitor) {
        clearInterval(globalActivityMonitor);
        globalActivityMonitor = null;
        console.log('⏹️ تم إيقاف مراقبة الماوس العامة');
    }
}

// إعداد WebSocket للتحكم عن بُعد
function setupRemoteControl(userId, userInfo) {
    if (socket) {
        socket.disconnect();
    }

    currentUserId = userId;
    socket = io('http://localhost:5001');

    socket.on('connect', () => {
        console.log('🔌 متصل بخادم التحكم عن بُعد');
        
        // تسجيل التطبيق المكتبي
        socket.emit('register-desktop-app', {
            userId: userId,
            userInfo: userInfo
        });
    });

    socket.on('disconnect', () => {
        console.log('🔌 انقطع الاتصال بخادم التحكم عن بُعد');
    });

    // استقبال الأوامر من الويب
    socket.on('remote-command', (data) => {
        const { command, payload } = data;
        console.log(`📡 تم استلام أمر: ${command}`);
        
        handleRemoteCommand(command, payload);
    });

    socket.on('connect_error', (error) => {
        console.log('❌ خطأ في الاتصال بخادم التحكم:', error.message);
    });
}

// معالجة الأوامر المستلمة من الويب
function handleRemoteCommand(command, payload) {
    switch (command) {
        case 'start-work':
            console.log('🟢 بدء العمل عن بُعد');
            isWorkingRemotely = true;
            
            // إرسال الأمر للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('remote-start-work', payload);
            }
            
            // إرسال تأكيد للويب
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'start-work',
                success: true,
                payload: { message: 'تم بدء العمل بنجاح', timestamp: new Date().toISOString() }
            });
            break;

        case 'stop-work':
            console.log('🔴 إنهاء العمل عن بُعد');
            isWorkingRemotely = false;
            
            // إرسال الأمر للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('remote-stop-work', payload);
            }
            
            // إرسال تأكيد للويب
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'stop-work',
                success: true,
                payload: { message: 'تم إنهاء العمل بنجاح', timestamp: new Date().toISOString() }
            });
            break;

        case 'pause-work':
            console.log('⏸️ إيقاف مؤقت عن بُعد');
            
            // إرسال الأمر للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('remote-pause-work', payload);
            }
            
            // إرسال تأكيد للويب
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'pause-work',
                success: true,
                payload: { message: 'تم إيقاف العمل مؤقتاً بنجاح', timestamp: new Date().toISOString() }
            });
            break;

        case 'resume-work':
            console.log('▶️ استكمال العمل عن بُعد');
            
            // إرسال الأمر للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('remote-resume-work', payload);
            }
            
            // إرسال تأكيد للويب
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'resume-work',
                success: true,
                payload: { message: 'تم استكمال العمل بنجاح', timestamp: new Date().toISOString() }
            });
            break;

        case 'take-break':
            console.log('☕ بدء استراحة عن بُعد');
            
            // إرسال الأمر للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('remote-take-break', payload);
            }
            
            // إرسال تأكيد للويب
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'take-break',
                success: true,
                payload: { message: 'تم بدء الاستراحة بنجاح', timestamp: new Date().toISOString() }
            });
            break;

        case 'end-break':
            console.log('🔚 إنهاء الاستراحة عن بُعد');
            
            // إرسال الأمر للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('remote-end-break', payload);
            }
            
            // إرسال تأكيد للويب
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'end-break',
                success: true,
                payload: { message: 'تم إنهاء الاستراحة بنجاح', timestamp: new Date().toISOString() }
            });
            break;

        case 'get-status':
            // إرسال حالة التطبيق الحالية
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: 'get-status',
                success: true,
                payload: {
                    isWorking: isWorkingRemotely,
                    lastActivity: lastSystemActivity,
                    appVersion: APP_VERSION,
                    timestamp: new Date().toISOString()
                }
            });
            break;

        default:
            console.log(`❓ أمر غير معروف: ${command}`);
            socket.emit('desktop-app-response', {
                userId: currentUserId,
                command: command,
                success: false,
                payload: { error: 'أمر غير معروف' }
            });
    }
}

// قطع اتصال WebSocket
function disconnectRemoteControl() {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentUserId = null;
        isWorkingRemotely = false;
        console.log('🔌 تم قطع اتصال التحكم عن بُعد');
    }
}

// أحداث التطبيق
app.whenReady().then(() => {
    console.log(`🚀 ${APP_NAME} v${APP_VERSION} Started`);
    console.log(`📅 تاريخ التشغيل: ${new Date().toLocaleString('ar-SA')}`);
    console.log(`💻 منصة التشغيل: ${process.platform} ${process.arch}`);
  createMainWindow();
    
    // بدء مراقبة النشاط على مستوى النظام
    startSystemActivityMonitoring();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
    console.log('🔚 إغلاق جميع النوافذ');
    stopSystemActivityMonitoring();
    disconnectRemoteControl();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('show-notification', (event, title, body) => {
    try {
        // استخدام إشعارات النظام المدمجة في Electron
        const { Notification: ElectronNotification } = require('electron');
        if (ElectronNotification.isSupported()) {
            const notification = new ElectronNotification({ 
                title: title || 'HR Time Tracker', 
                body: body || 'إشعار من التطبيق'
            });
            notification.show();
            return true;
        }
        return false;
    } catch (error) {
        console.error('خطأ في الإشعار:', error);
        return false;
    }
});

// معالج للحصول على آخر نشاط للنظام
ipcMain.handle('get-system-activity', () => {
    return lastSystemActivity;
});

// معالج لتحديث آخر نشاط للنظام
ipcMain.handle('update-system-activity', () => {
    lastSystemActivity = Date.now();
    return lastSystemActivity;
});

// معالج للحصول على موضع الماوس الحالي
ipcMain.handle('get-mouse-position', async () => {
    try {
        if (mouse) {
            return await mouse.getPosition();
        }
        return null;
    } catch (error) {
        return null;
    }
});

// معالج للحصول على معلومات الإصدار
ipcMain.handle('get-app-info', () => {
    return {
        version: APP_VERSION,
        name: APP_NAME,
        description: packageJson.description,
        author: packageJson.author,
        buildDate: new Date().toISOString()
    };
});

// معالجة طلبات لقطات الشاشة
ipcMain.handle('get-desktop-sources', async (event, options) => {
    try {
        console.log('📸 طلب الحصول على مصادر سطح المكتب...');
        
        const sources = await desktopCapturer.getSources({
            types: options.types || ['screen'],
            thumbnailSize: options.thumbnailSize || { width: 1920, height: 1080 }
        });
        
        console.log(`📺 تم العثور على ${sources.length} مصدر للشاشة`);
        
        // تحويل الصورة المصغرة إلى Base64
        const processedSources = sources.map(source => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail.toDataURL(),
            display_id: source.display_id,
            appIcon: source.appIcon ? source.appIcon.toDataURL() : null
        }));
        
        console.log('✅ تم معالجة مصادر الشاشة بنجاح');
        return processedSources;
        
    } catch (error) {
        console.error('❌ خطأ في الحصول على مصادر سطح المكتب:', error);
        throw error;
    }
});

// معالجات التحكم عن بُعد
ipcMain.handle('setup-remote-control', (event, userId, userInfo) => {
    setupRemoteControl(userId, userInfo);
    return true;
});

ipcMain.handle('disconnect-remote-control', () => {
    disconnectRemoteControl();
    return true;
});

ipcMain.handle('get-remote-status', () => {
    return {
        connected: socket && socket.connected,
        userId: currentUserId,
        isWorking: isWorkingRemotely
    };
});

console.log('📱 تم تحميل main.js بنجاح'); 