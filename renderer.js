const { ipcRenderer } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// متغيرات التطبيق
let currentUser = null;
let authToken = null;
let serverUrl = 'http://localhost:5001';

// متغيرات تتبع الوقت
let isWorking = false;
let isPaused = false;
let isOnShortBreak = false;
let workStartTime = null;
let pauseStartTime = null;
let shortBreakStartTime = null;
let sessionStartTime = null;

// إحصائيات اليوم
let todayStats = {
    totalWorkTime: 0,      // إجمالي وقت العمل (ميلي ثانية)
    activeTime: 0,         // وقت النشاط
    idleTime: 0,           // وقت الخمول
    breakTime: 0,          // وقت الاستراحة
    sessionCount: 0,       // عدد الجلسات
    screenshotCount: 0,    // عدد لقطات الشاشة
    productivity: 0        // نسبة الإنتاجية
};

// نظام الخمول البسيط الجديد - 40 ثانية للخمول (للاختبار)
let lastActivityTime = Date.now();
let activityCheckInterval = null;
let isUserActive = true;
const IDLE_TIME = 30 * 1000; // 30 ثانية للخمول (للاختبار)

// متغيرات جديدة لإصلاح نظام الخمول
let idleCheckTimer = null;
let currentActivityState = 'active'; // 'active' أو 'idle'

// متغيرات العداد التنازلي للخمول
let idleCountdownTimer = null;
let currentIdleCountdown = 0;
let isIdleCountdownActive = false;

// متغيرات الحفظ والتقاط الشاشة
let autoSaveInterval = null;
let screenshotInterval = null;
let screenshots = [];
let screenshotConfig = null;

// متغيرات التاريخ
let currentDate = new Date().toISOString().split('T')[0];

// عناصر DOM
const loginPage = document.getElementById('loginPage');
const workPage = document.getElementById('workPage');
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const workStatus = document.getElementById('workStatus');
const userInfo = document.getElementById('userInfo');
const currentTimer = document.getElementById('currentTimer');
const autoSaveStatus = document.getElementById('autoSaveStatus');
const debugInfo = document.getElementById('debugInfo');

// أزرار التحكم
const startWorkBtn = document.getElementById('startWorkBtn');
const pauseWorkBtn = document.getElementById('pauseWorkBtn');
const shortBreakBtn = document.getElementById('shortBreakBtn');
const stopWorkBtn = document.getElementById('stopWorkBtn');
const takeScreenshotBtn = document.getElementById('takeScreenshotBtn');
const logoutBtn = document.getElementById('logoutBtn');

// عناصر الإحصائيات
const totalWorkTimeEl = document.getElementById('totalWorkTime');
const activeTimeEl = document.getElementById('activeTime');
const idleTimeEl = document.getElementById('idleTime');
const sessionCountEl = document.getElementById('sessionCount');
const screenshotCountEl = document.getElementById('screenshotCount');
const breakTimeEl = document.getElementById('breakTime');
const activityIndicator = document.getElementById('activityIndicator');
const activityStatus = document.getElementById('activityStatus');
const productivityFill = document.getElementById('productivityFill');
const productivityPercent = document.getElementById('productivityPercent');
const screenshotGrid = document.getElementById('screenshotGrid');

// عناصر جديدة
const currentDateEl = document.getElementById('currentDate');
const idleCountdown = document.getElementById('idleCountdown');
const idleCountdownValueEl = document.getElementById('idleCountdownValue');

// إعداد معالجة الأوامر عن بُعد
ipcRenderer.on('remote-start-work', (event, payload) => {
    log('📡 تم استلام أمر بدء العمل عن بُعد:', payload);
    if (!isWorking) {
        startWork();
        showStatus(workStatus, '🟢 تم بدء العمل عن بُعد من الموقع', 'success');
    } else {
        log('⚠️ العمل جاري بالفعل');
    }
});

ipcRenderer.on('remote-stop-work', (event, payload) => {
    log('📡 تم استلام أمر إنهاء العمل عن بُعد:', payload);
    if (isWorking) {
        stopWork();
        showStatus(workStatus, '🔴 تم إنهاء العمل عن بُعد من الموقع', 'info');
    } else {
        log('⚠️ العمل متوقف بالفعل');
    }
});

ipcRenderer.on('remote-pause-work', (event, payload) => {
    log('📡 تم استلام أمر إيقاف مؤقت عن بُعد:', payload);
    if (isWorking && !isPaused) {
        // استخدام دالة togglePause الموجودة لضمان إيقاف كل شيء
        togglePause();
        showStatus(workStatus, '⏸️ تم إيقاف العمل مؤقتاً عن بُعد من الموقع', 'warning');
        log('⏸️ تم إيقاف العمل مؤقتاً عن بُعد');
    } else if (!isWorking) {
        log('⚠️ لا يمكن الإيقاف المؤقت - العمل متوقف');
    } else {
        log('⚠️ العمل متوقف مؤقتاً بالفعل');
    }
});

ipcRenderer.on('remote-resume-work', (event, payload) => {
    log('📡 تم استلام أمر استكمال العمل عن بُعد:', payload);
    if (isWorking && isPaused) {
        // استخدام دالة togglePause الموجودة لضمان استكمال كل شيء
        togglePause();
        showStatus(workStatus, '▶️ تم استكمال العمل عن بُعد من الموقع', 'success');
        log('▶️ تم استكمال العمل عن بُعد');
    } else if (!isWorking) {
        log('⚠️ لا يمكن استكمال العمل - العمل متوقف');
    } else {
        log('⚠️ العمل ليس متوقفاً مؤقتاً');
    }
});

ipcRenderer.on('remote-take-break', (event, payload) => {
    log('📡 تم استلام أمر أخذ استراحة عن بُعد:', payload);
    if (isWorking) {
        // بدء استراحة
        isOnShortBreak = true;
        shortBreakStartTime = Date.now();
        showStatus(workStatus, '☕ تم بدء الاستراحة عن بُعد من الموقع', 'info');
        log('☕ تم بدء الاستراحة');
        
        // تحديث واجهة المستخدم
        updateButtonStates();
    } else {
        log('⚠️ لا يمكن أخذ استراحة - العمل متوقف');
    }
});

ipcRenderer.on('remote-end-break', (event, payload) => {
    log('📡 تم استلام أمر إنهاء الاستراحة عن بُعد:', payload);
    if (isWorking && isOnShortBreak) {
        // إنهاء الاستراحة
        if (shortBreakStartTime) {
            todayStats.breakTime += Date.now() - shortBreakStartTime;
        }
        isOnShortBreak = false;
        shortBreakStartTime = null;
        showStatus(workStatus, '🔚 تم إنهاء الاستراحة عن بُعد من الموقع', 'success');
        log('🔚 تم إنهاء الاستراحة');
        
        // تحديث واجهة المستخدم
        updateButtonStates();
    } else {
        log('⚠️ لا يمكن إنهاء الاستراحة - لا توجد استراحة نشطة');
    }
});

// قراءة إعدادات لقطات الشاشة
async function loadScreenshotConfig() {
    try {
        const configPath = path.join(__dirname, 'screenshot-config.json');
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            screenshotConfig = JSON.parse(configData);
            log('📸 تم تحميل إعدادات لقطات الشاشة:', screenshotConfig.capture.timerOptions);
        } else {
            // إعدادات افتراضية
            screenshotConfig = {
                capture: {
                    interval: 300000,
                    timerOptions: {
                        currentPreset: 'medium',
                        useCustom: false,
                        customInterval: 300000,
                        presets: {
                            medium: { interval: 300000, name: 'متوسط - كل 5 دقائق' }
                        }
                    }
                }
            };
            log('📸 استخدام إعدادات افتراضية للقطات الشاشة');
        }
    } catch (error) {
        log('❌ خطأ في قراءة إعدادات لقطات الشاشة:', error);
        // إعدادات افتراضية في حالة الخطأ
        screenshotConfig = {
            capture: {
                interval: 300000,
                timerOptions: {
                    currentPreset: 'medium',
                    useCustom: false,
                    customInterval: 300000
                }
            }
        };
    }
}

// الحصول على فترة التقاط الشاشة من الإعدادات
function getScreenshotInterval() {
    if (!screenshotConfig) return 300000; // 5 دقائق افتراضي
    
    const options = screenshotConfig.capture.timerOptions;
    if (options.useCustom) {
        log(`📸 استخدام فترة مخصصة: ${options.customInterval / 1000} ثانية`);
        return options.customInterval;
    }
    
    const preset = options.presets[options.currentPreset];
    if (preset) {
        log(`📸 استخدام إعداد ${options.currentPreset}: ${preset.interval / 1000} ثانية (${preset.name})`);
        return preset.interval;
    }
    
    return screenshotConfig.capture.interval || 300000;
}

// تشغيل التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', async () => {
    // الحصول على معلومات الإصدار
    try {
        const appInfo = await ipcRenderer.invoke('get-app-info');
        log(`🚀 ${appInfo.name} v${appInfo.version} Advanced Started`);
        log(`📅 تاريخ البناء: ${new Date(appInfo.buildDate).toLocaleString('ar-SA')}`);
        
        // تحديث عرض الإصدار في الواجهة
        const versionElement = document.getElementById('appVersion');
        if (versionElement) {
            versionElement.textContent = `الإصدار ${appInfo.version} - HR Time Tracker`;
        }
        
        // تحديث معلومات الإصدار في قسم المستخدم
        const versionInfoElement = document.getElementById('versionInfo');
        if (versionInfoElement) {
            versionInfoElement.textContent = `الإصدار ${appInfo.version} - ${new Date().toLocaleDateString('ar-SA')}`;
        }
        
        // تحديث عنوان الصفحة
        document.title = `HR Time Tracker v${appInfo.version} - نظام تتبع الوقت المتقدم`;
        
    } catch (error) {
        log('⚠️ لم يتم الحصول على معلومات الإصدار:', error);
        log('🚀 HR Time Tracker Advanced Started');
    }
    
    // تحميل إعدادات لقطات الشاشة
    await loadScreenshotConfig();
    
    log('🔧 تهيئة نظام تتبع الخمول المحسن...');
    initializeApp();
});

// تهيئة التطبيق المحسن
function initializeApp() {
    // إضافة مستمعات الأحداث
    loginForm.addEventListener('submit', handleLogin);
    startWorkBtn.addEventListener('click', startWork);
    pauseWorkBtn.addEventListener('click', togglePause);
    shortBreakBtn.addEventListener('click', toggleShortBreak);
    stopWorkBtn.addEventListener('click', stopWork);
    takeScreenshotBtn.addEventListener('click', takeManualScreenshot);
    logoutBtn.addEventListener('click', logout);
    
    // إضافة مستمع لزر اختبار النشاط
    const testActivityBtn = document.getElementById('testActivityBtn');
    if (testActivityBtn) {
        testActivityBtn.addEventListener('click', testActivityMonitoring);
    }
    
    // إضافة مستمع لزر مزامنة البيانات
    const syncDataBtn = document.getElementById('syncDataBtn');
    if (syncDataBtn) {
        syncDataBtn.addEventListener('click', manualSyncData);
    }

    // تهيئة نظام مراقبة النشاط المتقدم
    log('🔧 تهيئة نظام مراقبة النشاط...');
    
    // تهيئة متغيرات النشاط
    lastActivityTime = Date.now();
    isUserActive = true;
    
    // بدء مراقبة النشاط فوراً
    setupActivityMonitoring();
    
    // محاولة استعادة الجلسة السابقة
    restoreSession();

    // إذا لم يكن هناك مستخدم مسجل، قم بتسجيل دخول تلقائي
    if (!currentUser || !authToken) {
        log('🔐 لا توجد جلسة محفوظة، محاولة تسجيل دخول تلقائي...');
        setTimeout(() => {
            autoLogin();
        }, 1000);
    } else {
        log('✅ تم استعادة الجلسة السابقة');
        showWorkPage();
        loadTodayData();
    }

    // فحص اليوم الجديد
    checkForNewDay();
    
    // تحديث التاريخ الحالي
    updateCurrentDate();
    
    // تحديث العرض كل ثانية
    setInterval(() => {
        updateTimerDisplay();
        updateCurrentDate();
    }, 1000);

    log('✅ تم تهيئة التطبيق بنجاح');
}

// إعداد مراقبة النشاط - نظام جديد مبسط
function setupActivityMonitoring() {
    log('🔧 بدء إعداد نظام الخمول الجديد (30 ثانية للاختبار)...');
    
    // إيقاف أي مراقبة سابقة
    if (activityCheckInterval) {
        clearInterval(activityCheckInterval);
        activityCheckInterval = null;
    }
    
    if (idleCheckTimer) {
        clearInterval(idleCheckTimer);
        idleCheckTimer = null;
    }
    
    // تهيئة متغيرات النشاط
    lastActivityTime = Date.now();
    isUserActive = true;
    currentActivityState = 'active';
    
    // مراقبة حركة الماوس والكيبورد
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'keydown', 'mousedown', 'mouseup', 'wheel', 'touchstart', 'touchmove'];
    
    // إزالة المستمعات القديمة أولاً
    events.forEach(eventType => {
        document.removeEventListener(eventType, updateActivity);
        document.addEventListener(eventType, updateActivity, { passive: true });
    });
    
    // بدء مراقبة الخمول كل 5 ثوانٍ (للاختبار)
    idleCheckTimer = setInterval(() => {
        checkIdleStatus();
    }, 5000);
    
    // بدء تحديث الإحصائيات كل ثانية
    activityCheckInterval = setInterval(() => {
        updateTimeStats();
        updateStatsDisplay();
    }, 1000);
    
    log('✅ تم تفعيل نظام الخمول الجديد - 30 ثانية للخمول (للاختبار)');
    log(`🎯 حالة النشاط الأولية: ${currentActivityState}`);
}

// تحديث النشاط - نظام جديد مبسط
function updateActivity() {
    const now = Date.now();
    const previousState = currentActivityState;
    
    // تحديث وقت آخر نشاط
    lastActivityTime = now;
    
    // إخفاء العداد التنازلي عند النشاط
    hideIdleCountdown();
    
    // إذا كان المستخدم خامل، أعده للنشاط
    if (currentActivityState === 'idle') {
        currentActivityState = 'active';
        isUserActive = true;
        updateActivityStatus();
        log('✅ المستخدم عاد للنشاط من حالة الخمول');
    }
    
    // تحديث الحالة إذا تغيرت
    if (previousState !== currentActivityState) {
        log(`🔄 تغير النشاط: ${previousState} → ${currentActivityState}`);
    }
}

// اختبار نظام الخمول الجديد
function testActivityMonitoring() {
    log('🧪 اختبار نظام الخمول الجديد...');
    
    const now = Date.now();
    const timeSinceActivity = Math.round((now - lastActivityTime) / 1000);
    
    log(`📊 معلومات النشاط:`);
    log(`   - الحالة الحالية: ${currentActivityState}`);
    log(`   - آخر نشاط منذ: ${timeSinceActivity} ثانية`);
    log(`   - الحد الأقصى للخمول: ${IDLE_TIME/1000} ثوان`);
    log(`   - يعمل؟ ${isWorking ? 'نعم' : 'لا'}`);
    log(`   - في استراحة؟ ${isPaused ? 'نعم' : 'لا'}`);
    
    // فحص المؤقتات
    log(`🔧 حالة المؤقتات:`);
    log(`   - مؤقت فحص الخمول: ${idleCheckTimer ? 'نشط' : 'متوقف'}`);
    log(`   - مؤقت الإحصائيات: ${activityCheckInterval ? 'نشط' : 'متوقف'}`);
    
    // اختبار تحديث النشاط
    updateActivity();
    log(`✅ تم تحديث النشاط`);
    
    log('🎉 انتهى اختبار نظام الخمول');
}

// فحص حالة الخمول - نظام جديد مبسط
function checkIdleStatus() {
    // لا نفحص الخمول إذا لم نكن نعمل أو في استراحة
    if (!isWorking || isPaused || isOnShortBreak) {
        hideIdleCountdown();
        return;
    }

    const now = Date.now();
    const timeSinceActivity = now - lastActivityTime;
    const secondsSinceActivity = Math.round(timeSinceActivity / 1000);
    
    // طباعة معلومات التشخيص كل 10 ثوانٍ للاختبار
    if (secondsSinceActivity > 0 && secondsSinceActivity % 10 === 0) {
        log(`⏱️ لا يوجد نشاط منذ ${secondsSinceActivity} ثانية (الحد الأقصى: ${IDLE_TIME/1000} ثانية)`);
    }
    
    // حساب الوقت المتبقي حتى الخمول
    const idleThreshold = IDLE_TIME / 1000; // 30 ثانية
    const countdownThreshold = 10; // بدء العداد التنازلي عند 10 ثوانٍ
    
    if (secondsSinceActivity >= idleThreshold - countdownThreshold && secondsSinceActivity < idleThreshold) {
        // بدء العداد التنازلي
        const remainingSeconds = idleThreshold - secondsSinceActivity;
        showIdleCountdown(remainingSeconds);
    } else if (secondsSinceActivity >= idleThreshold && currentActivityState === 'active') {
        // إذا مر 30 ثانية أو أكثر، ضع المستخدم في حالة خمول
        hideIdleCountdown();
        setUserIdle();
    } else if (secondsSinceActivity < idleThreshold - countdownThreshold) {
        // إخفاء العداد إذا كان المستخدم نشطاً
        hideIdleCountdown();
    }
}

// إظهار العداد التنازلي للخمول
function showIdleCountdown(remainingSeconds) {
    if (!idleCountdown || !idleCountdownValueEl) return;
    
    const seconds = Math.ceil(remainingSeconds);
    idleCountdownValueEl.textContent = seconds;
    idleCountdown.style.display = 'block';
    
    if (!isIdleCountdownActive) {
        isIdleCountdownActive = true;
        log(`⏰ بدء العداد التنازلي للخمول: ${seconds} ثانية`);
    }
}

// إخفاء العداد التنازلي للخمول
function hideIdleCountdown() {
    if (!idleCountdown) return;
    
    if (isIdleCountdownActive) {
        idleCountdown.style.display = 'none';
        isIdleCountdownActive = false;
        log(`⏰ تم إخفاء العداد التنازلي للخمول`);
    }
}

// تحديث إحصائيات الوقت
function updateTimeStats() {
    // تحديث إحصائيات الوقت فقط أثناء العمل (بما في ذلك الاستراحة)
    if (!isWorking || isPaused) {
        return;
    }
    
    // إضافة إجمالي وقت العمل دائماً (حتى أثناء الاستراحة)
    todayStats.totalWorkTime += 1000;
    
    if (isOnShortBreak) {
        // إضافة وقت للاستراحة (ثانية واحدة)
        todayStats.breakTime += 1000;
    } else if (currentActivityState === 'active') {
        // إضافة وقت للنشاط (ثانية واحدة)
        todayStats.activeTime += 1000;
    } else {
        // إضافة وقت للخمول (ثانية واحدة)
        todayStats.idleTime += 1000;
    }
    
    // حساب نسبة الإنتاجية
    if (todayStats.totalWorkTime > 0) {
        todayStats.productivity = Math.round((todayStats.activeTime / todayStats.totalWorkTime) * 100);
    }
}

// تعيين المستخدم في حالة خمول
function setUserIdle() {
    if (currentActivityState === 'idle') return; // إذا كان خامل بالفعل
    
    const timeSinceActivity = Math.round((Date.now() - lastActivityTime) / 1000);
    currentActivityState = 'idle';
    isUserActive = false;
    updateActivityStatus();
    log(`😴 المستخدم دخل في حالة الخمول بعد ${timeSinceActivity} ثانية من عدم النشاط`);
}

// تحديث مؤشر حالة النشاط
function updateActivityStatus() {
    if (!isWorking) {
        activityIndicator.className = 'activity-indicator offline';
        activityStatus.textContent = 'غير متصل';
    } else if (isOnShortBreak) {
        activityIndicator.className = 'activity-indicator idle';
        activityStatus.textContent = 'استراحة قصيرة';
    } else if (isPaused) {
        activityIndicator.className = 'activity-indicator idle';
        activityStatus.textContent = 'في استراحة';
    } else if (isUserActive) {
        activityIndicator.className = 'activity-indicator active';
        activityStatus.textContent = 'نشط';
    } else {
        activityIndicator.className = 'activity-indicator idle';
        activityStatus.textContent = 'خامل';
    }
}

// تسجيل دخول تلقائي للاختبار
async function autoLogin() {
    try {
        log('🔐 محاولة تسجيل دخول تلقائي...');
        
        // استخدام بيانات افتراضية للاختبار
        serverUrl = 'http://localhost:5001';
        const username = 'admin';
        const password = 'admin123';
        
        const response = await axios.post(`${serverUrl}/api/tracking/desktop-login`, {
            username,
            password
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        log('📨 استجابة الخادم:', response.data);
        
        if (response.data.success && response.data.token) {
            authToken = response.data.token;
            currentUser = response.data.user || response.data.employee || { username, name: username };
            
            // حفظ بيانات الجلسة
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('serverUrl', serverUrl);
            
            showWorkPage();
            
            // تحميل بيانات اليوم
            await loadTodayData();
            
            // بدء الأنظمة التلقائية
            startAutoSave();
            startScreenshotCapture();
            
            log(`✅ تم تسجيل الدخول التلقائي بنجاح: ${currentUser.name || currentUser.username}`);
            return true;
        } else {
            throw new Error(response.data.message || 'فشل في تسجيل الدخول التلقائي');
        }
        
    } catch (error) {
        log('❌ فشل تسجيل الدخول التلقائي:', error.message);
        showLoginPage();
        return false;
    }
}

// تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    const url = document.getElementById('serverUrl').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!url || !username || !password) {
        showStatus(loginStatus, 'يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    serverUrl = url;
    showStatus(loginStatus, 'جاري تسجيل الدخول...', 'info');
    
    try {
        log(`🔐 محاولة تسجيل الدخول: ${username} على ${serverUrl}`);
        
        const response = await axios.post(`${serverUrl}/api/tracking/desktop-login`, {
            username,
            password
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        log('📨 استجابة الخادم:', response.data);
        
        if (response.data.success || response.data.token) {
            authToken = response.data.token;
            currentUser = response.data.user || response.data.employee || { username, name: username };
            
            // حفظ بيانات الجلسة
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('serverUrl', serverUrl);
            
            showStatus(loginStatus, 'تم تسجيل الدخول بنجاح!', 'success');
            showWorkPage();
            
            // تحميل بيانات اليوم
            await loadTodayData();
            
            // بدء الأنظمة التلقائية
            startAutoSave();
            startScreenshotCapture();
            
            // إعداد التحكم عن بُعد
            setupRemoteControl();
            
            log(`✅ تم تسجيل الدخول بنجاح: ${currentUser.name || currentUser.username}`);
        } else {
            throw new Error(response.data.message || 'فشل في تسجيل الدخول');
        }
        
    } catch (error) {
        log('❌ خطأ في تسجيل الدخول:', error.message);
        showStatus(loginStatus, error.response?.data?.message || 'خطأ في تسجيل الدخول', 'error');
    }
}

// تحميل بيانات اليوم
async function loadTodayData() {
    try {
        const response = await axios.get(`${serverUrl}/api/tracking/date/${currentDate}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.data.success && response.data.data) {
            const data = response.data.data;
            
            // تحميل جميع البيانات التراكمية لليوم (إجمالي العمل المُنجز)
            if (data.workData) {
                todayStats.sessionCount = data.workData.sessionsCount || 0;
                todayStats.totalWorkTime = (data.workData.totalSeconds || 0) * 1000; // تحويل إلى milliseconds
                todayStats.activeTime = (data.workData.activeSeconds || 0) * 1000;
                todayStats.idleTime = (data.workData.idleSeconds || 0) * 1000;
                todayStats.breakTime = (data.workData.breakSeconds || 0) * 1000;
                todayStats.productivity = data.workData.productivity || 0;
                
                log(`📊 تم تحميل البيانات التراكمية لليوم: ${formatTime(todayStats.totalWorkTime)} إجمالي`);
            }
            
            // تحديد حالة العمل بناءً على البيانات المُحمّلة
            if (data.isWorking) {
                log('🔄 البيانات تُشير إلى أن العمل كان جارياً - الحفاظ على الحالة');
                // لا نُعيد تشغيل العمل تلقائياً، فقط نُحدث الواجهة لتُظهر البيانات
            } else {
                log('⏹️ البيانات تُشير إلى أن العمل كان متوقفاً');
                isWorking = false;
                isPaused = false;
                isOnShortBreak = false;
            }
            
            if (data.screenshots) {
                screenshots = data.screenshots;
                todayStats.screenshotCount = screenshots.length;
                displayScreenshots();
            }
            
            log(`📊 تم تحميل بيانات ${currentDate} - إجمالي العمل: ${formatTime(todayStats.totalWorkTime)}`);
        }
        
        updateStatsDisplay();
        updateButtonStates(); // تحديث حالة الأزرار بناءً على البيانات المُحمّلة
        
    } catch (error) {
        log(`⚠️ لم يتم العثور على بيانات ${currentDate}، سيتم البدء من الصفر`);
        updateStatsDisplay();
        updateButtonStates(); // تحديث حالة الأزرار
    }
}

// بدء العمل
function startWork() {
    log(`🚀 محاولة بدء العمل... حالة isWorking الحالية: ${isWorking}`);
    log(`🔍 حالة زر بدء العمل: ${startWorkBtn.disabled ? 'معطل' : 'مفعل'}`);
    
    if (isWorking) {
        showStatus(workStatus, 'العمل قيد التشغيل بالفعل', 'warning');
        log('⚠️ العمل قيد التشغيل بالفعل - لا يمكن البدء مرة أخرى');
        return;
    }
    
    log('🚀 بدء العمل الجديد...');
    
    isWorking = true;
    isPaused = false;
    isOnShortBreak = false;
    workStartTime = Date.now();
    sessionStartTime = Date.now();
    
    // لا نُصفّر البيانات التراكمية - سنُضيف عليها في هذه الجلسة الجديدة
    // البيانات الموجودة محفوظة من تحميل بيانات اليوم
    log('🔄 بدء جلسة جديدة مع الحفاظ على البيانات التراكمية الموجودة');
    log(`📊 إجمالي العمل السابق: ${formatTime(todayStats.totalWorkTime)}`);
    
    // إعادة تعيين متغيرات النشاط
    lastActivityTime = Date.now();
    isUserActive = true;
    currentActivityState = 'active';
    
    // تأكد من تشغيل مراقبة النشاط
    if (!activityCheckInterval) {
        log('🔧 إعادة تشغيل مراقبة النشاط...');
        setupActivityMonitoring();
    }
    
    // زيادة عدد الجلسات
    todayStats.sessionCount++;
    
    // تحديث الأزرار بوضوح
    log('🔧 تحديث حالة الأزرار لبدء العمل...');
    updateButtonStates();
    
    // تحديث الحالة والإحصائيات
    updateActivityStatus();
    updateStatsDisplay();
    showStatus(workStatus, '✅ تم بدء العمل بنجاح - الجلسة نشطة الآن', 'success');
    
    // بدء الأنظمة التلقائية
    startAutoSave();
    startScreenshotCapture();
    
    log(`✅ تم بدء العمل بنجاح - الجلسة رقم ${todayStats.sessionCount}`);
    log(`🎯 مراقبة النشاط نشطة - آخر نشاط: ${new Date(lastActivityTime).toLocaleTimeString()}`);
    log(`🔍 حالة الأزرار بعد البدء: بدء=${startWorkBtn.disabled ? 'معطل' : 'مفعل'}, إيقاف=${stopWorkBtn.disabled ? 'معطل' : 'مفعل'}`);
}

// إيقاف مؤقت / استئناف العمل
function togglePause() {
    if (!isWorking) return;
    
    if (isPaused) {
        // استئناف العمل
        isPaused = false;
        if (pauseStartTime) {
            todayStats.breakTime += Date.now() - pauseStartTime;
            pauseStartTime = null;
        }
        showStatus(workStatus, 'تم استئناف العمل', 'success');
        log('▶️ تم استئناف العمل');
        } else {
        // إيقاف مؤقت
        isPaused = true;
        pauseStartTime = Date.now();
        showStatus(workStatus, 'تم إيقاف العمل مؤقتاً', 'info');
        log('⏸️ تم إيقاف العمل مؤقتاً');
    }
    
    updateButtonStates();
    updateActivityStatus();
    saveWorkData();
}

// إنهاء العمل
async function stopWork() {
    if (!isWorking) {
        showStatus(workStatus, 'لا يوجد عمل قيد التشغيل', 'warning');
        return;
    }
    
    log('⏹️ بدء إيقاف العمل...');
    
    // حساب وقت الجلسة الحالية
    if (sessionStartTime) {
        const sessionDuration = Date.now() - sessionStartTime;
        log(`⏱️ مدة الجلسة: ${formatTime(sessionDuration)}`);
    }
    
    // حساب وقت الاستراحة إذا كان في استراحة
    if (isOnShortBreak && shortBreakStartTime) {
        const breakDuration = Date.now() - shortBreakStartTime;
        todayStats.breakTime += breakDuration;
        log(`☕ إضافة وقت الاستراحة: ${formatTime(breakDuration)}`);
    }
    
    // إيقاف جميع الأنظمة التلقائية أولاً
    stopAutoSave();
    stopScreenshotCapture();
    
    // إيقاف جميع المؤقتات والعدادات
    if (activityCheckInterval) {
        clearInterval(activityCheckInterval);
        activityCheckInterval = null;
        log('🔄 تم إيقاف مراقبة النشاط');
    }
    
    if (idleCheckTimer) {
        clearInterval(idleCheckTimer);
        idleCheckTimer = null;
        log('⏰ تم إيقاف عداد الخمول');
    }
    
    // إخفاء العداد التنازلي
    hideIdleCountdown();
    
    // إعادة تعيين المتغيرات
    isWorking = false;
    isPaused = false;
    isOnShortBreak = false;
    workStartTime = null;
    pauseStartTime = null;
    shortBreakStartTime = null;
    sessionStartTime = null;
    
    // إعادة تعيين متغيرات النشاط
    lastActivityTime = Date.now();
    isUserActive = true;
    currentActivityState = 'active';
    
    // تأكيد إعادة ضبط الأزرار بشكل قوي
    log('🔧 إعادة ضبط الأزرار بعد إيقاف العمل...');
    updateButtonStates();
    
    // تحديث حالة النشاط والإحصائيات
    updateActivityStatus();
    updateStatsDisplay();
    
    // حفظ البيانات النهائية
    await saveWorkData();
    
    // انتظار قصير لضمان حفظ البيانات
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // التحقق من تطابق البيانات مع الجدول التفصيلي وإعادة المزامنة
    log('🔄 بدء مزامنة البيانات مع الجدول التفصيلي...');
    await verifyAndSyncData();
    
    // انتظار إضافي للمزامنة
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // رسالة نجاح واضحة
    showStatus(workStatus, '✅ تم إيقاف العمل ومزامنة البيانات بنجاح - يمكنك بدء العمل مرة أخرى الآن', 'success');
    
    log(`⏹️ تم إيقاف العمل بنجاح - إجمالي الوقت: ${formatTime(todayStats.totalWorkTime)}`);
    log(`📊 إحصائيات الجلسة: نشط ${formatTime(todayStats.activeTime)}, خامل ${formatTime(todayStats.idleTime)}, إنتاجية ${todayStats.productivity}%`);
    log(`✅ زر بدء العمل مفعل ومتاح للاستخدام - حالة الزر: ${startWorkBtn.disabled ? 'معطل' : 'مفعل'}`);
    
    // تأكيد إضافي بعد ثانية واحدة للتأكد من أن الزر ما زال مفعلاً
    setTimeout(() => {
        if (startWorkBtn.disabled) {
            log('⚠️ اكتشاف زر بدء العمل معطل بعد الإيقاف - سيتم تفعيله...');
            startWorkBtn.disabled = false;
            startWorkBtn.style.opacity = '1';
            startWorkBtn.style.cursor = 'pointer';
            startWorkBtn.style.pointerEvents = 'auto';
        }
        log(`🔍 فحص نهائي - حالة زر بدء العمل: ${startWorkBtn.disabled ? 'معطل ❌' : 'مفعل ✅'}`);
    }, 1000);
}

// التحقق من تطابق البيانات مع الجدول التفصيلي وإعادة المزامنة
async function verifyAndSyncData() {
    try {
        log('🔄 جاري مزامنة بيانات اليوم مع الجدول التفصيلي...');
        
        // إرسال طلب لمزامنة بيانات اليوم مع الجدول التفصيلي
        const response = await axios.post(`${serverUrl}/api/daily-attendance/sync-today/${currentUser._id || currentUser.id}`, {
            forceSync: true, // إجبار المزامنة
            verifyOnly: false // ليس فقط التحقق، بل أيضاً المزامنة
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        if (response.data.success) {
            log('✅ تم مزامنة البيانات مع الجدول التفصيلي بنجاح');
            log(`📊 التفاصيل: ${response.data.details || 'تم التحديث'}`);
            
            // إظهار معلومات التحقق من التطابق
            if (response.data.data && response.data.data.verification) {
                const verification = response.data.data.verification;
                log(`🔍 تحقق التطابق - الثواني الكلية: ${verification.totalSecondsMatched ? '✅' : '❌'}, الثواني النشطة: ${verification.activeSecondsMatched ? '✅' : '❌'}`);
            }
        } else {
            log('⚠️ فشل في مزامنة البيانات:', response.data.message);
            throw new Error(response.data.message || 'فشل في المزامنة');
        }
        
        return true;
        
    } catch (error) {
        log('❌ خطأ في مزامنة البيانات:', error.message);
        
        // إذا فشلت المزامنة، محاولة إنشاء سجل اليوم مباشرة
        try {
            log('🔄 محاولة إنشاء سجل اليوم مباشرة...');
            const fallbackResponse = await axios.post(`${serverUrl}/api/daily-attendance/add-today/${currentUser._id || currentUser.id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            if (fallbackResponse.data.success) {
                log('✅ تم إنشاء سجل اليوم كبديل للمزامنة');
                return true;
            } else {
                log('❌ فشل في إنشاء سجل اليوم أيضاً');
            }
        } catch (fallbackError) {
            log('❌ فشل في إنشاء سجل اليوم:', fallbackError.message);
        }
        
        return false;
    }
}

// مزامنة البيانات يدوياً
async function manualSyncData() {
    try {
        log('🔄 بدء المزامنة اليدوية للبيانات...');
        
        // تعطيل الزر أثناء المزامنة
        const syncBtn = document.getElementById('syncDataBtn');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<i class="ph-spinner"></i> جاري المزامنة...';
        }
        
        // حفظ البيانات أولاً
        await saveWorkData();
        
        // انتظار قصير
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // مزامنة البيانات
        const success = await verifyAndSyncData();
        
        if (success) {
            showStatus(workStatus, '✅ تم مزامنة البيانات بنجاح مع الجدول التفصيلي', 'success');
            log('✅ انتهت المزامنة اليدوية بنجاح');
        } else {
            showStatus(workStatus, '⚠️ فشلت المزامنة - تحقق من الاتصال', 'error');
            log('❌ فشلت المزامنة اليدوية');
        }
        
    } catch (error) {
        log('❌ خطأ في المزامنة اليدوية:', error.message);
        showStatus(workStatus, '❌ خطأ في المزامنة: ' + error.message, 'error');
    } finally {
        // إعادة تفعيل الزر
        const syncBtn = document.getElementById('syncDataBtn');
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<i class="ph-arrows-clockwise"></i> مزامنة البيانات';
        }
    }
}

// التقاط شاشة يدوي
async function takeManualScreenshot() {
    await captureScreenshot();
    showStatus(workStatus, 'تم التقاط لقطة شاشة', 'success');
}

// التقاط لقطة شاشة
async function captureScreenshot() {
    try {
        // استخدام ipcRenderer للتفاعل مع العملية الرئيسية
        const sources = await ipcRenderer.invoke('get-desktop-sources', {
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });
        
        if (sources && sources.length > 0) {
            // تحويل البيانات إلى صورة
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const screenshot = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    dataUrl: canvas.toDataURL('image/png'),
                    size: { width: canvas.width, height: canvas.height }
                };
                
                screenshots.push(screenshot);
                todayStats.screenshotCount = screenshots.length;
                
                // عرض لقطة الشاشة الجديدة
                displayScreenshots();
                
                log(`📸 تم التقاط لقطة شاشة رقم ${todayStats.screenshotCount}`);
                
                // حفظ لقطة الشاشة في الخادم
                await uploadScreenshot(screenshot);
            };
            
            img.src = sources[0].thumbnail;
        }
        
    } catch (error) {
        log('❌ خطأ في التقاط لقطة الشاشة:', error.message);
        
        // محاولة احتياطية: إنشاء لقطة شاشة وهمية للاختبار
        createDummyScreenshot();
    }
}

// إنشاء لقطة شاشة وهمية للاختبار
function createDummyScreenshot() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // رسم خلفية ملونة
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // إضافة نص
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('لقطة شاشة تجريبية', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px Arial';
        ctx.fillText(new Date().toLocaleString('ar-SA'), canvas.width / 2, canvas.height / 2 + 20);
        
        const screenshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            dataUrl: canvas.toDataURL('image/png'),
            size: { width: canvas.width, height: canvas.height },
            dummy: true
        };
        
        screenshots.push(screenshot);
        todayStats.screenshotCount = screenshots.length;
        
        displayScreenshots();
        log(`📸 تم إنشاء لقطة شاشة تجريبية رقم ${todayStats.screenshotCount}`);
        
        // رفع اللقطة التجريبية
        uploadScreenshot(screenshot);
        
    } catch (error) {
        log('❌ خطأ في إنشاء لقطة الشاشة التجريبية:', error.message);
    }
}

// رفع لقطة الشاشة للخادم
async function uploadScreenshot(screenshot) {
    try {
        // تحويل dataUrl إلى blob
        const response = await fetch(screenshot.dataUrl);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('screenshot', blob, `screenshot-${screenshot.id}.png`);
        formData.append('employeeId', currentUser.id || currentUser._id);
        formData.append('timestamp', screenshot.timestamp);
        
        await axios.post(`${serverUrl}/api/tracking/screenshot`, formData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        log('📤 تم رفع لقطة الشاشة للخادم');
        
    } catch (error) {
        log('❌ خطأ في رفع لقطة الشاشة:', error.message);
    }
}

// عرض لقطات الشاشة
function displayScreenshots() {
    screenshotGrid.innerHTML = '';
    
    // عرض آخر 12 لقطة شاشة
    const recentScreenshots = screenshots.slice(-12).reverse();
    
    recentScreenshots.forEach(screenshot => {
        const item = document.createElement('div');
        item.className = 'screenshot-item';
        
        const img = document.createElement('img');
        
        // تحديد مصدر الصورة بناءً على نوع البيانات
        if (screenshot.dataUrl && screenshot.dataUrl.startsWith('data:')) {
            // صورة مضمنة (Base64)
            img.src = screenshot.dataUrl;
        } else if (screenshot.path && !screenshot.dataUrl) {
            // صورة محفوظة على الخادم
            const cleanPath = screenshot.path.startsWith('/') ? screenshot.path.substring(1) : screenshot.path;
            img.src = `${serverUrl}/${cleanPath}`;
            
            // معالجة أخطاء تحميل الصورة
            img.onerror = function() {
                log(`❌ فشل تحميل الصورة: ${this.src}`);
                // إنشاء صورة بديلة
                this.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="150" height="100" xmlns="http://www.w3.org/2000/svg">
                        <rect width="150" height="100" fill="#f0f0f0" stroke="#ccc"/>
                        <text x="75" y="45" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
                            صورة غير متوفرة
                        </text>
                        <text x="75" y="65" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">
                            ${new Date(screenshot.timestamp).toLocaleTimeString('ar-SA')}
                        </text>
                    </svg>
                `);
            };
        } else if (screenshot.dataUrl) {
            // استخدام dataUrl كما هو
            img.src = screenshot.dataUrl;
        } else {
            // إنشاء صورة افتراضية
            img.src = 'data:image/svg+xml;base64,' + btoa(`
                <svg width="150" height="100" xmlns="http://www.w3.org/2000/svg">
                    <rect width="150" height="100" fill="#e9ecef" stroke="#dee2e6"/>
                    <text x="75" y="45" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">
                        لقطة شاشة
                    </text>
                    <text x="75" y="65" text-anchor="middle" font-family="Arial" font-size="10" fill="#adb5bd">
                        ${new Date(screenshot.timestamp).toLocaleTimeString('ar-SA')}
                    </text>
                </svg>
            `);
        }
        
        img.alt = 'لقطة شاشة';
        img.loading = 'lazy'; // تحميل كسول لتحسين الأداء
        
        const time = document.createElement('div');
        time.className = 'screenshot-time';
        time.textContent = new Date(screenshot.timestamp).toLocaleTimeString('ar-SA');
        
        item.appendChild(img);
        item.appendChild(time);
        screenshotGrid.appendChild(item);
    });
    
    log(`🖼️ تم عرض ${recentScreenshots.length} لقطة شاشة في المعرض`);
}

// حفظ بيانات العمل المحسن
async function saveWorkData() {
    if (!currentUser || !authToken) {
        log('⚠️ لا يمكن الحفظ - المستخدم غير مسجل دخول');
        return false;
    }
    
    try {
        // حساب الأوقات الحالية بدقة
        let currentTotalTime = todayStats.totalWorkTime;
        let currentActiveTime = todayStats.activeTime;
        let currentIdleTime = todayStats.idleTime;
        
        // إضافة وقت الجلسة الحالية إذا كان العمل جارياً
        if (isWorking && !isPaused && !isOnShortBreak && workStartTime) {
            const sessionTime = Date.now() - workStartTime;
            currentTotalTime += sessionTime;
            
            // توزيع وقت الجلسة بين النشاط والخمول
            if (isUserActive) {
                currentActiveTime += sessionTime;
            } else {
                currentIdleTime += sessionTime;
            }
        }
        
        // التأكد من أن مجموع النشاط والخمول لا يتجاوز الإجمالي
        const totalActivityTime = currentActiveTime + currentIdleTime;
        if (totalActivityTime > currentTotalTime) {
            const ratio = currentTotalTime / totalActivityTime;
            currentActiveTime = Math.floor(currentActiveTime * ratio);
            currentIdleTime = Math.floor(currentIdleTime * ratio);
        }
        
        // حساب نسبة الإنتاجية
        const productivity = currentTotalTime > 0 ? 
            Math.round((currentActiveTime / currentTotalTime) * 100) : 0;
        
        todayStats.productivity = productivity;
        
        const requestData = {
            workData: {
                totalSeconds: Math.floor(currentTotalTime / 1000),
                activeSeconds: Math.floor(currentActiveTime / 1000),
                idleSeconds: Math.floor(currentIdleTime / 1000),
                breakSeconds: Math.floor(todayStats.breakTime / 1000),
                sessionsCount: todayStats.sessionCount,
                productivity: productivity,
                lastActivity: new Date().toISOString()
            },
            screenshots: screenshots.map(s => ({
                timestamp: s.timestamp,
                size: s.size
            })),
            isWorking: isWorking && !isPaused && !isOnShortBreak,
            date: new Date().toISOString().split('T')[0],
            dateString: currentDate,
            timestamp: new Date().toISOString(),
            appVersion: document.title.match(/v([\d.]+)/)?.[1] || '2.1.0',
            clientInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };
        
        // إضافة معلومات إضافية للتشخيص
        log('📊 إحصائيات الحفظ:', {
            إجمالي: Math.floor(currentTotalTime / 1000) + ' ثانية',
            نشط: Math.floor(currentActiveTime / 1000) + ' ثانية',
            خامل: Math.floor(currentIdleTime / 1000) + ' ثانية',
            إنتاجية: productivity + '%',
            حالة_المستخدم: isUserActive ? 'نشط' : 'خامل',
            يعمل: isWorking && !isPaused && !isOnShortBreak
        });
        
        log('💾 حفظ البيانات:', requestData);
        
        const response = await axios.post(`${serverUrl}/api/tracking/save`, requestData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        if (response.data.success) {
            const now = new Date();
            autoSaveStatus.textContent = `💾 آخر حفظ: ${now.toLocaleTimeString('ar-SA')}`;
            log('✅ تم حفظ البيانات بنجاح');
            return true;
        } else {
            throw new Error(response.data.message || 'فشل في الحفظ');
        }
        
    } catch (error) {
        let errorMessage = error.message;
        
        // تحسين رسائل الخطأ
        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'لا يمكن الاتصال بالخادم';
        } else if (error.code === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
            errorMessage = 'انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى';
        } else if (error.response?.status === 500) {
            errorMessage = 'خطأ في الخادم - يرجى المحاولة لاحقاً';
        } else if (error.response?.status === 401) {
            errorMessage = 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى';
        }
        
        log('❌ خطأ في حفظ البيانات:', error.message);
        autoSaveStatus.textContent = `❌ فشل الحفظ: ${errorMessage}`;
        return false;
    }
}

// بدء الحفظ التلقائي
function startAutoSave() {
    stopAutoSave();
    
    // حفظ كل 15 ثانية
    autoSaveInterval = setInterval(() => {
        // حفظ حالة الأزرار قبل الحفظ
        const wasStartWorkDisabled = startWorkBtn.disabled;
        
        log('🔄 تنفيذ الحفظ التلقائي...');
        saveWorkData();
        updateStatsDisplay();
        
        // التأكد من أن زر بدء العمل لا يتأثر بالحفظ التلقائي
        if (!isWorking && wasStartWorkDisabled !== startWorkBtn.disabled) {
            log('🔧 تصحيح حالة زر بدء العمل بعد الحفظ التلقائي...');
            startWorkBtn.disabled = false;
            startWorkBtn.style.opacity = '1';
            startWorkBtn.style.cursor = 'pointer';
            startWorkBtn.style.pointerEvents = 'auto';
        }
    }, 15000);
    
    log('⏰ تم تفعيل الحفظ التلقائي (كل 15 ثانية)');
}

// إيقاف الحفظ التلقائي
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        log('⏰ تم إيقاف الحفظ التلقائي');
    }
}

// بدء التقاط الشاشة التلقائي

// التقاط ذكي حسب مستوى النشاط
function startSmartScreenshotCapture() {
    stopScreenshotCapture();
    
    const getInterval = () => {
        const productivity = todayStats.productivity || 0;
        const baseInterval = getScreenshotInterval();
        
        // إذا كانت الإنتاجية عالية، التقط أكثر (تقليل الفترة بـ 30%)
        if (productivity > 80) {
            return Math.floor(baseInterval * 0.7);
        }
        // إذا كانت الإنتاجية منخفضة، التقط أقل (زيادة الفترة بـ 50%)
        else if (productivity < 50) {
            return Math.floor(baseInterval * 1.5);
        }
        
        return baseInterval;
    };
    
    const scheduleNext = () => {
        const interval = getInterval();
        screenshotInterval = setTimeout(() => {
            if (isWorking && !isPaused && currentActivityState === 'active') {
                log(`📸 التقاط شاشة ذكي... (كل ${Math.floor(interval/1000)} ثانية)`);
                captureScreenshot();
            }
            scheduleNext(); // جدولة اللقطة التالية
        }, interval);
    };
    
    scheduleNext();
    log(`🧠 تم تفعيل التقاط الشاشة الذكي - إعداد: ${screenshotConfig?.capture?.timerOptions?.currentPreset || 'افتراضي'}`);
}

function startScreenshotCapture() {
    stopScreenshotCapture();
    
    const interval = getScreenshotInterval();
    
    // التقاط شاشة حسب الفترة المحددة في الإعدادات
    screenshotInterval = setInterval(() => {
        if (isWorking && !isPaused) {
            log(`📸 التقاط شاشة تلقائي... (كل ${Math.floor(interval/1000)} ثانية)`);
            captureScreenshot();
        }
    }, interval);
    
    const configInfo = screenshotConfig?.capture?.timerOptions;
    const presetName = configInfo?.presets?.[configInfo?.currentPreset]?.name || 'غير محدد';
    log(`📸 تم تفعيل التقاط الشاشة التلقائي - ${presetName} (كل ${Math.floor(interval/1000)} ثانية)`);
}

// إيقاف التقاط الشاشة التلقائي
function stopScreenshotCapture() {
    if (screenshotInterval) {
        clearInterval(screenshotInterval);
        screenshotInterval = null;
        log('📸 تم إيقاف التقاط الشاشة التلقائي');
    }
}

// بدء العداد
function startTimer() {
    setInterval(() => {
        updateTimerDisplay();
        updateStatsDisplay();
    }, 1000);
}

// تحديث عرض العداد
function updateTimerDisplay() {
    let currentSessionTime = 0;
    
    if (isWorking && workStartTime) {
        currentSessionTime = Date.now() - workStartTime;
        
        // طرح وقت الإيقاف المؤقت فقط (ليس وقت الاستراحة)
        if (isPaused && pauseStartTime) {
            currentSessionTime -= (Date.now() - pauseStartTime);
        }
        
        // لا نطرح وقت الاستراحة القصيرة - ندعه يستمر في العد
        // if (isOnShortBreak && shortBreakStartTime) {
        //     currentSessionTime -= (Date.now() - shortBreakStartTime);
        // }
    }
    
    currentTimer.textContent = formatTime(currentSessionTime);
}

// تحديث عرض الإحصائيات
function updateStatsDisplay() {
    // تحديث الأوقات (أوقات الجلسة الحالية فقط)
    if (totalWorkTimeEl) totalWorkTimeEl.textContent = formatTime(todayStats.totalWorkTime);
    if (activeTimeEl) activeTimeEl.textContent = formatTime(todayStats.activeTime);
    if (idleTimeEl) idleTimeEl.textContent = formatTime(todayStats.idleTime);
    if (breakTimeEl) breakTimeEl.textContent = formatTime(todayStats.breakTime);
    if (sessionCountEl) sessionCountEl.textContent = todayStats.sessionCount;
    if (screenshotCountEl) screenshotCountEl.textContent = todayStats.screenshotCount;
    
    // حساب وتحديث نسبة الإنتاجية
    let productivity = 0;
    if (todayStats.totalWorkTime > 0) {
        productivity = Math.round((todayStats.activeTime / todayStats.totalWorkTime) * 100);
        todayStats.productivity = productivity;
    }
    
    // تحديث شريط الإنتاجية
    if (productivityFill) {
        productivityFill.style.width = `${productivity}%`;
        
        // تغيير لون الشريط حسب النسبة
        if (productivity >= 80) {
            productivityFill.style.background = '#28a745'; // أخضر
        } else if (productivity >= 60) {
            productivityFill.style.background = '#ffc107'; // أصفر
    } else {
            productivityFill.style.background = '#dc3545'; // أحمر
        }
    }
    
    if (productivityPercent) {
        productivityPercent.textContent = `${productivity}%`;
    }
    
    // تحديث مؤشر النشاط مع معلومات إضافية
    updateActivityStatus();
    
    // تحديث معلومات التشخيص المفصلة
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo && isWorking) {
        const timeSinceActivity = Date.now() - lastActivityTime;
        const activityInfo = `
            📊 حالة النشاط الحالية:<br>
            - الحالة: ${isUserActive ? '🟢 نشط' : '🔴 خامل'}<br>
            - آخر نشاط: منذ ${Math.round(timeSinceActivity/1000)} ثانية<br>
            - نظام الخمول: 30 ثوان (بسيط)<br>
            - إجمالي الوقت: ${formatTime(todayStats.totalWorkTime)}<br>
            - وقت النشاط: ${formatTime(todayStats.activeTime)} (${Math.round((todayStats.activeTime/todayStats.totalWorkTime)*100)}%)<br>
            - وقت الخمول: ${formatTime(todayStats.idleTime)} (${Math.round((todayStats.idleTime/todayStats.totalWorkTime)*100)}%)<br>
            - الإنتاجية: ${productivity}%<br>
        `;
        
        // إضافة معلومات النشاط في نهاية المحتوى الموجود
        const existingContent = debugInfo.innerHTML;
        if (!existingContent.includes('📊 حالة النشاط الحالية')) {
            debugInfo.innerHTML = existingContent + '<br>' + activityInfo;
        } else {
            // استبدال المعلومات الموجودة
            debugInfo.innerHTML = existingContent.replace(/📊 حالة النشاط الحالية:.*?<br>/s, activityInfo);
        }
    }
}

// تنسيق الوقت
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// استعادة الجلسة السابقة
function restoreSession() {
    try {
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');
        const savedServerUrl = localStorage.getItem('serverUrl');
        
        if (savedToken && savedUser && savedServerUrl) {
            authToken = savedToken;
            currentUser = JSON.parse(savedUser);
            serverUrl = savedServerUrl;
            
            showWorkPage();
            loadTodayData();
            startAutoSave();
            startScreenshotCapture();
            
            log(`🔄 تم استعادة الجلسة السابقة: ${currentUser.name || currentUser.username}`);
        } else {
            log('💡 لا توجد جلسة سابقة محفوظة');
        }
    } catch (error) {
        log('❌ خطأ في استعادة الجلسة:', error.message);
        showLoginPage();
    }
}

// تسجيل الخروج
function logout() {
    // حفظ البيانات قبل الخروج
    if (isWorking) {
        stopWork();
    }
    
    // إيقاف جميع الأنظمة التلقائية
    stopAutoSave();
    stopScreenshotCapture();
    
    if (activityCheckInterval) {
        clearInterval(activityCheckInterval);
        activityCheckInterval = null;
    }
    
    if (idleCheckTimer) {
        clearInterval(idleCheckTimer);
        idleCheckTimer = null;
    }
    
    // إعادة تعيين جميع متغيرات الحالة
    isWorking = false;
    isPaused = false;
    isOnShortBreak = false;
    workStartTime = null;
    pauseStartTime = null;
    shortBreakStartTime = null;
    sessionStartTime = null;
    isUserActive = true;
    currentActivityState = 'active';
    lastActivityTime = Date.now();
    
    // مسح البيانات
    currentUser = null;
    authToken = null;
    todayStats = {
        totalWorkTime: 0,
        activeTime: 0,
        idleTime: 0,
        breakTime: 0,
        sessionCount: 0,
        screenshotCount: 0,
        productivity: 0
    };
    screenshots = [];
    
    // مسح localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('serverUrl');
    
    showLoginPage();
    log('🚪 تم تسجيل الخروج وإعادة تعيين جميع البيانات');
}

// إظهار صفحة تسجيل الدخول
function showLoginPage() {
    loginPage.classList.add('active');
    workPage.classList.remove('active');
}

// إظهار صفحة العمل
function showWorkPage() {
    loginPage.classList.remove('active');
    workPage.classList.add('active');
    
    // تحديث معلومات المستخدم
    if (currentUser) {
        userInfo.textContent = `مرحباً ${currentUser.name || currentUser.username}`;
    }
    
    // إعادة تعيين حالة الأزرار للحالة الافتراضية (غير نشط)
    resetButtonsToDefault();
    
    updateActivityStatus();
    updateStatsDisplay();
}

// إعادة تعيين الأزرار للحالة الافتراضية
function resetButtonsToDefault() {
    // عدم تغيير حالة العمل عند إعادة تعيين الأزرار - فقط إعادة تعيين واجهة المستخدم
    // isWorking سيتم تحديدها بناءً على البيانات المُحمّلة من الخادم
    // isPaused = false;
    // isOnShortBreak = false;
    
    // إعادة تعيين الأزرار
    startWorkBtn.disabled = false;  // زر بدء العمل نشط
    pauseWorkBtn.disabled = true;   // زر الإيقاف المؤقت معطل
    shortBreakBtn.disabled = true;  // زر الاستراحة معطل
    stopWorkBtn.disabled = true;    // زر إيقاف العمل معطل
    takeScreenshotBtn.disabled = true; // زر التقاط الشاشة معطل
    
    // التأكد من الشكل المرئي للأزرار
    startWorkBtn.style.opacity = '1';
    startWorkBtn.style.cursor = 'pointer';
    
    // إعادة تعيين نصوص الأزرار مع الأيقونات
    startWorkBtn.innerHTML = '<i class="ph-play"></i> بدء العمل';
    pauseWorkBtn.innerHTML = '<i class="ph-pause"></i> إيقاف مؤقت';
    shortBreakBtn.innerHTML = '<i class="ph-coffee"></i> استراحة قصيرة';
    stopWorkBtn.innerHTML = '<i class="ph-stop"></i> إنهاء العمل';
    takeScreenshotBtn.innerHTML = '<i class="ph-camera"></i> التقاط شاشة';
    
    // إعادة تعيين ألوان الأزرار
    shortBreakBtn.style.background = 'linear-gradient(135deg, var(--accent-color), #0891b2)';
    
    log('🔄 تم إعادة تعيين الأزرار للحالة الافتراضية - زر بدء العمل مفعل');
}

// تحديث حالة الأزرار بناءً على حالة العمل
function updateButtonStates() {
    if (!isWorking) {
        // العمل متوقف
        startWorkBtn.disabled = false;
        startWorkBtn.innerHTML = '<i class="ph-play"></i> بدء العمل';
        
        pauseWorkBtn.disabled = true;
        shortBreakBtn.disabled = true;
        stopWorkBtn.disabled = true;
        takeScreenshotBtn.disabled = true;
    } else if (isPaused) {
        // العمل متوقف مؤقتاً
        startWorkBtn.disabled = true;
        
        pauseWorkBtn.disabled = false;
        pauseWorkBtn.innerHTML = '<i class="ph-play"></i> استكمال العمل';
        
        shortBreakBtn.disabled = true;
        stopWorkBtn.disabled = false;
        takeScreenshotBtn.disabled = true;
    } else if (isOnShortBreak) {
        // في استراحة
        startWorkBtn.disabled = true;
        pauseWorkBtn.disabled = true;
        
        shortBreakBtn.disabled = false;
        shortBreakBtn.innerHTML = '<i class="ph-arrow-counter-clockwise"></i> إنهاء الاستراحة';
        
        stopWorkBtn.disabled = false;
        takeScreenshotBtn.disabled = true;
    } else {
        // العمل جاري
        startWorkBtn.disabled = true;
        
        pauseWorkBtn.disabled = false;
        pauseWorkBtn.innerHTML = '<i class="ph-pause"></i> إيقاف مؤقت';
        
        shortBreakBtn.disabled = false;
        shortBreakBtn.innerHTML = '<i class="ph-coffee"></i> استراحة قصيرة';
        
        stopWorkBtn.disabled = false;
        takeScreenshotBtn.disabled = false;
    }
    
    log('🔄 تم تحديث حالة الأزرار');
}

// إظهار رسالة الحالة
function showStatus(element, message, type = 'info') {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';
    
    // إخفاء الرسالة بعد 5 ثوان إذا كانت نجاح
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// تسجيل الرسائل
function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage, data);
    
    // إضافة الرسالة لمنطقة التشخيص
    const logLine = document.createElement('div');
    logLine.textContent = logMessage;
    debugInfo.appendChild(logLine);
    
    // الاحتفاظ بآخر 15 رسالة فقط
    while (debugInfo.children.length > 15) {
        debugInfo.removeChild(debugInfo.firstChild);
    }
    
    // التمرير للأسفل
    debugInfo.scrollTop = debugInfo.scrollHeight;
}

// الحفظ قبل إغلاق التطبيق
window.addEventListener('beforeunload', () => {
    if (isWorking) {
        stopWork();
    }
});

// دوال جديدة للميزات المطلوبة

// تحديث التاريخ الحالي
function updateCurrentDate() {
    const today = new Date();
    currentDate = today.toISOString().split('T')[0];
    
    if (currentDateEl) {
        // استخدام التقويم الميلادي بدلاً من الهجري
        currentDateEl.textContent = today.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }
}

// فحص إذا كان يوم جديد
function checkForNewDay() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('lastWorkDate');
    
    if (lastDate && lastDate !== today) {
        // يوم جديد - إعادة تعيين البيانات
        resetDailyStats();
        log('🌅 يوم جديد - تم إعادة تعيين الإحصائيات');
    }
    
    localStorage.setItem('lastWorkDate', today);
}

// إعادة تعيين إحصائيات اليوم
function resetDailyStats() {
    todayStats = {
        totalWorkTime: 0,
        activeTime: 0,
        idleTime: 0,
        breakTime: 0,
        sessionCount: 0,
        screenshotCount: 0,
        productivity: 0
    };
    screenshots = [];
    updateStatsDisplay();
    displayScreenshots();
}

// دوال نظام الخمول الجديد تم إضافتها أعلاه

// تبديل الاستراحة القصيرة
function toggleShortBreak() {
    if (!isWorking) {
        showStatus(workStatus, 'يجب بدء العمل أولاً', 'error');
        return;
    }
    
    if (isOnShortBreak) {
        // إنهاء الاستراحة القصيرة
        endShortBreak();
    } else {
        // بدء الاستراحة القصيرة
        startShortBreak();
    }
}

// بدء الاستراحة القصيرة
function startShortBreak() {
    isOnShortBreak = true;
    shortBreakStartTime = Date.now();
    
    // إخفاء عداد الخمول إذا كان موجوداً
    const idleCountdown = document.getElementById('idleCountdown');
    if (idleCountdown) {
        idleCountdown.style.display = 'none';
    }
    
    // تحديث الأزرار
    updateButtonStates();
    
    updateActivityStatus();
    showStatus(workStatus, 'بدأت الاستراحة القصيرة', 'info');
    log('☕ بدء الاستراحة القصيرة');
}

// إنهاء الاستراحة القصيرة
function endShortBreak() {
    if (shortBreakStartTime) {
        const breakDuration = Date.now() - shortBreakStartTime;
        todayStats.breakTime += breakDuration;
    }
    
    isOnShortBreak = false;
    shortBreakStartTime = null;
    
    // تحديث الأزرار
    updateButtonStates();
    
    // إعادة تعيين وقت النشاط
    lastActivityTime = Date.now();
    isUserActive = true;
    
    updateActivityStatus();
    showStatus(workStatus, 'انتهت الاستراحة القصيرة', 'success');
    log('🔄 انتهاء الاستراحة القصيرة');
}

log('📱 تم تحميل النظام المتقدم لتتبع الوقت بنجاح');

// ======== مستقبلات أحداث النشاط العامة ========

// استقبال أحداث حركة الماوس العامة من main.js
ipcRenderer.on('global-mouse-activity', (event, data) => {
    // تحديث النشاط عند حركة الماوس خارج التطبيق
    updateActivity();
    
    // تسجيل النشاط كل 15 ثانية فقط لتجنب الازدحام
    if (Math.floor(Date.now() / 15000) !== Math.floor((Date.now() - 300) / 15000)) {
        log(`🖱️ نشاط ماوس عام: (${data.position.x}, ${data.position.y}) - مسافة: ${data.distance}px`);
    }
});

// استقبال أحداث فحص النشاط من main.js
ipcRenderer.on('check-system-activity', () => {
    // فحص حالة الخمول
    checkIdleStatus();
});

// استقبال أحداث نشاط النظام
ipcRenderer.on('system-activity-detected', () => {
    log('🔄 تم اكتشاف نشاط على مستوى النظام');
    updateActivity();
});

// استقبال أحداث توقف النظام
ipcRenderer.on('system-suspend', () => {
    log('💤 النظام في وضع السكون');
    if (isWorking && !isPaused) {
        // إيقاف مؤقت تلقائي عند توقف النظام
        togglePause();
    }
});

// تحسين مراقبة النشاط العامة
async function enhanceGlobalActivityMonitoring() {
    try {
        // طلب موضع الماوس الحالي من النظام
        const mousePosition = await ipcRenderer.invoke('get-mouse-position');
        if (mousePosition) {
            log(`🖱️ موضع الماوس الحالي: (${mousePosition.x}, ${mousePosition.y})`);
        }
        
        // طلب آخر نشاط للنظام
        const lastSystemActivity = await ipcRenderer.invoke('get-system-activity');
        if (lastSystemActivity) {
            const timeSinceActivity = Date.now() - lastSystemActivity;
            log(`⏱️ آخر نشاط للنظام منذ: ${Math.round(timeSinceActivity/1000)} ثانية`);
            
            // تحديث آخر نشاط إذا كان النظام نشط مؤخراً
            if (timeSinceActivity < 5000) { // 5 ثوان
                lastActivityTime = Math.max(lastActivityTime, lastSystemActivity);
            }
        }
        
        log('✅ تم تفعيل مراقبة النشاط العامة المحسنة');
        
    } catch (error) {
        log('⚠️ خطأ في تحسين مراقبة النشاط العامة:', error.message);
    }
}

// تشغيل التحسينات عند تحميل النظام
document.addEventListener('DOMContentLoaded', () => {
    // تأخير قصير للتأكد من تحميل كل شيء
    setTimeout(() => {
        enhanceGlobalActivityMonitoring();
    }, 2000);
});

// اختبار النشاط العام
function testGlobalActivity() {
    log('🧪 اختبار النشاط العام...');
    enhanceGlobalActivityMonitoring();
    
    // اختبار تحديث النشاط
    updateActivity();
    log(`✅ آخر نشاط محلي: ${new Date(lastActivityTime).toLocaleTimeString()}`);
    log(`🎯 حالة المستخدم: ${currentActivityState}`);
    log(`⏰ مراقبة النشاط: ${activityCheckInterval ? 'نشطة' : 'متوقفة'}`);
    log(`🖱️ مراقبة الخمول: ${idleCheckTimer ? 'نشطة' : 'متوقفة'}`);
}

// إضافة اختبار للوحة المطور
window.testGlobalActivity = testGlobalActivity;
window.enhanceGlobalActivityMonitoring = enhanceGlobalActivityMonitoring;

log('🌐 تم تفعيل مراقبة النشاط العامة للماوس والنظام');

// إعداد التحكم عن بُعد
async function setupRemoteControl() {
    if (!currentUser || !currentUser.id) {
        log('⚠️ لا يمكن إعداد التحكم عن بُعد - لا يوجد مستخدم');
        return;
    }

    try {
        log('🔌 إعداد التحكم عن بُعد...');
        
        // إعداد WebSocket للتحكم عن بُعد
        await ipcRenderer.invoke('setup-remote-control', currentUser.id, {
            name: currentUser.name || currentUser.username,
            username: currentUser.username
        });
        
        log('✅ تم إعداد التحكم عن بُعد بنجاح');
        
    } catch (error) {
        log('❌ خطأ في إعداد التحكم عن بُعد:', error);
    }
} 