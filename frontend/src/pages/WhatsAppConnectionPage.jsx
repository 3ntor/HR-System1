import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WhatsAppService from '../services/WhatsAppService';
import './WhatsAppConnectionPage.css';

const WhatsAppConnectionPage = () => {
    const navigate = useNavigate();
    const [connectionState, setConnectionState] = useState({
        status: 'disconnected', // 'disconnected', 'initializing', 'waiting_qr', 'qr_ready', 'scanning', 'connected', 'error'
        qrCode: null,
        errorMessage: '',
        retryCount: 0,
        isLoading: false
    });
    
    const [qrMetadata, setQrMetadata] = useState({
        generated: false,
        timestamp: null,
        attempts: 0,
        autoRefreshCount: 0
    });

    const connectionTimeoutRef = useRef(null);
    const qrPollingRef = useRef(null);
    const eventSourceRef = useRef(null);
    const maxRetries = 3;
    const qrTimeout = 120000; // 2 minutes
    const pollingInterval = 2000; // 2 seconds

    // تنظيف الموارد عند مغادرة الصفحة
    useEffect(() => {
        // محاولة استعادة QR Code من localStorage عند تحميل الصفحة
        const restoreQRFromStorage = () => {
            try {
                const savedQR = localStorage.getItem('lastQRCode');
                const savedTimestamp = localStorage.getItem('lastQRTimestamp');
                
                if (savedQR && savedTimestamp) {
                    const qrAge = Date.now() - new Date(savedTimestamp).getTime();
                    const maxAge = 5 * 60 * 1000; // 5 دقائق
                    
                    if (qrAge < maxAge) {
                        console.log('🔄 استعادة QR Code من localStorage');
                        setConnectionState(prev => ({
                            ...prev,
                            qrCode: savedQR,
                            status: 'qr_ready',
                            errorMessage: 'QR مستعاد من الذاكرة - امسحه إذا كان صالح'
                        }));
                        
                        setQrMetadata(prev => ({
                            ...prev,
                            generated: true,
                            timestamp: new Date(savedTimestamp)
                        }));
                    } else {
                        console.log('⏰ QR المحفوظ انتهت صلاحيته');
                        localStorage.removeItem('lastQRCode');
                        localStorage.removeItem('lastQRTimestamp');
                    }
                }
            } catch (error) {
                console.log('⚠️ فشل استعادة QR من localStorage:', error.message);
            }
        };
        
        restoreQRFromStorage();
        
        return () => {
            clearAllTimers();
            closeEventSource();
        };
    }, []);

    const clearAllTimers = () => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
        if (qrPollingRef.current) {
            clearInterval(qrPollingRef.current);
            qrPollingRef.current = null;
        }
    };

    const closeEventSource = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    };

    // بدء عملية الاتصال الكاملة
    const startConnection = async () => {
        setConnectionState(prev => ({
            ...prev,
            status: 'initializing',
            errorMessage: '',
            isLoading: true
        }));

        clearAllTimers();
        closeEventSource();

        try {
            // خطوة 1: تهيئة WhatsApp client
            console.log('🔄 خطوة 1: تهيئة WhatsApp client...');
            const initResult = await WhatsAppService.initialize();
            
            if (!initResult.success) {
                throw new Error(initResult.message || 'فشل في تهيئة WhatsApp');
            }

            console.log('✅ تم تهيئة WhatsApp client بنجاح');
            
            // خطوة 2: إعداد Event Source للتحديثات المباشرة
            setupEventSource();
            
            // خطوة 3: بدء انتظار QR Code
            setConnectionState(prev => ({
                ...prev,
                status: 'waiting_qr',
                isLoading: true
            }));

            // خطوة 4: بدء polling للـ QR Code
            await startQRPolling();

        } catch (error) {
            console.error('❌ خطأ في بدء الاتصال:', error);
            handleConnectionError(error.message);
        }
    };

    // إعداد Event Source للتحديثات المباشرة
    const setupEventSource = () => {
        try {
            const eventSource = new EventSource(`${WhatsAppService.baseURL}/events`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('🔗 EventSource متصل');
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleEventSourceMessage(data);
                } catch (error) {
                    console.error('خطأ في تحليل رسالة EventSource:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.log('🔄 خطأ في EventSource، سيتم إعادة الاتصال...');
                // EventSource يعيد الاتصال تلقائياً
            };

        } catch (error) {
            console.error('خطأ في إعداد EventSource:', error);
        }
    };

    // معالجة رسائل EventSource
    const handleEventSourceMessage = (data) => {
        console.log('📱 رسالة من EventSource:', data.type);

        switch (data.type) {
            case 'qr':
                if (data.data) {
                    console.log('✅ تم استلام QR Code من EventSource');
                    handleQRCodeReceived(data.data);
                }
                break;

            case 'ready':
                console.log('🎉 WhatsApp متصل بنجاح!');
                handleConnectionSuccess();
                break;

            case 'disconnected':
                console.log('🔌 تم قطع اتصال WhatsApp');
                handleDisconnection();
                break;

            default:
                console.log('📝 رسالة EventSource:', data.type, data);
        }
    };

    // دالة polling للـ QR Code (منفصلة لتكون متاحة في كل مكان)
    const pollQRCode = async () => {
        try {
            const response = await WhatsAppService.apiCall('/qr-code');
            
            if (response.success && response.qrCode) {
                console.log('✅ تم استلام QR Code من polling');
                handleQRCodeReceived(response.qrCode);
                return true; // وقف polling
            } else {
                console.log('⏳ QR Code ليس جاهزاً بعد...');
                // لا تغير الحالة إذا كان QR موجود بالفعل
                if (!connectionState.qrCode) {
                    setConnectionState(prev => ({
                        ...prev,
                        status: 'waiting_qr',
                        errorMessage: 'انتظار QR Code...'
                    }));
                }
                return false; // استمرار polling
            }
        } catch (error) {
            console.log('🔄 خطأ في polling QR Code:', error.message);
            // لا تمسح QR الموجود عند حدوث خطأ في API
            return false; // استمرار polling
        }
    };

    // بدء polling للـ QR Code
    const startQRPolling = async () => {
        console.log('🔄 بدء polling للـ QR Code...');

        // محاولة فورية أولى
        const immediate = await pollQRCode();
        if (immediate) return;

        // بدء polling دوري
        qrPollingRef.current = setInterval(async () => {
            const success = await pollQRCode();
            if (success) {
                clearInterval(qrPollingRef.current);
                qrPollingRef.current = null;
            }
        }, pollingInterval);

        // timeout للـ QR Code - زيادة المدة وتحسين المعالجة
        connectionTimeoutRef.current = setTimeout(() => {
            console.log('⏰ timeout للـ QR Code - لكن سنبقي على QR الحالي');
            // لا نوقف polling تماماً، فقط نقلل تكراره
            if (qrPollingRef.current) {
                clearInterval(qrPollingRef.current);
                qrPollingRef.current = null;
                
                // إعادة تشغيل polling بتكرار أقل
                setTimeout(() => {
                    if (!connectionState.qrCode) {
                        startQRPolling();
                    }
                }, 5000);
            }
            handleQRTimeout();
        }, qrTimeout * 2); // مضاعفة مدة الـ timeout
    };

    // معالجة استلام QR Code
    const handleQRCodeReceived = (qrCode) => {
        console.log('🎯 معالجة QR Code المستلم');
        
        // حفظ QR في localStorage كنسخة احتياطية
        try {
            localStorage.setItem('lastQRCode', qrCode);
            localStorage.setItem('lastQRTimestamp', new Date().toISOString());
            console.log('💾 تم حفظ QR Code في localStorage');
        } catch (error) {
            console.log('⚠️ فشل حفظ QR Code:', error.message);
        }
        
        setConnectionState(prev => ({
            ...prev,
            status: 'qr_ready',
            qrCode: qrCode,
            isLoading: false,
            errorMessage: 'QR Code جاهز - امسحه بسرعة!'
        }));

        setQrMetadata(prev => ({
            ...prev,
            generated: true,
            timestamp: new Date(),
            attempts: prev.attempts + 1
        }));

        // اترك polling يعمل بتكرار أقل للحصول على QR جديد عند الحاجة
        if (qrPollingRef.current) {
            clearInterval(qrPollingRef.current);
            
            // إعادة تشغيل polling بتكرار أبطأ
            qrPollingRef.current = setInterval(async () => {
                console.log('🔍 فحص دوري للـ QR Code الجديد...');
                const result = await pollQRCode();
                if (result) {
                    clearInterval(qrPollingRef.current);
                    qrPollingRef.current = null;
                }
            }, 15000); // كل 15 ثانية بدلاً من 3
        }

        console.log('✅ QR Code جاهز للعرض ومحفوظ بأمان');
    };

    // معالجة نجاح الاتصال
    const handleConnectionSuccess = () => {
        clearAllTimers();
        closeEventSource();
        
        setConnectionState(prev => ({
            ...prev,
            status: 'connected',
            isLoading: false,
            errorMessage: ''
        }));

        // الانتقال للداشبورد بعد 2 ثانية
        setTimeout(() => {
            navigate('/whatsapp');
        }, 2000);
    };

    // معالجة قطع الاتصال
    const handleDisconnection = () => {
        console.log('🔌 معالجة قطع الاتصال - سنحافظ على QR إذا كان متاح');
        
        // لا نمسح QR Code فوراً، قد يكون قطع اتصال مؤقت
        setConnectionState(prev => ({
            ...prev,
            status: 'disconnected',
            // اترك qrCode كما هو إذا كان موجود
            qrCode: prev.qrCode, 
            isLoading: false,
            errorMessage: 'تم قطع الاتصال - امسح QR إذا كان متاح'
        }));

        // لا نعيد تعيين metadata فوراً
        console.log('📝 الحفاظ على QR metadata للاستخدام المتواصل');
    };

    // معالجة timeout للـ QR Code
    const handleQRTimeout = () => {
        console.log('⏰ انتهت مهلة QR Code');
        
        // فقط أظهر رسالة وانتظر QR جديد، لا تمسح QR الحالي
        if (qrMetadata.autoRefreshCount < 5) {
            console.log('🔄 انتظار QR Code جديد تلقائياً...');
            setQrMetadata(prev => ({
                ...prev,
                autoRefreshCount: prev.autoRefreshCount + 1
            }));
            
            // لا تمسح QR الحالي، فقط انتظر QR جديد
            setConnectionState(prev => ({
                ...prev,
                status: 'waiting_qr',
                errorMessage: `انتظار QR جديد... (${qrMetadata.autoRefreshCount + 1}/5)`
            }));
            
            // إعادة محاولة الحصول على QR جديد دون مسح القديم
            setTimeout(() => {
                startQRPolling();
            }, 2000);
        } else {
            handleConnectionError('انتهت صلاحية رمز QR عدة مرات. يرجى إعادة المحاولة.');
        }
    };

    // معالجة أخطاء الاتصال
    const handleConnectionError = (errorMessage) => {
        clearAllTimers();
        closeEventSource();
        
        setConnectionState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: errorMessage,
            isLoading: false,
            retryCount: prev.retryCount + 1
        }));
    };

    // إعادة المحاولة
    const handleRetry = () => {
        if (connectionState.retryCount < maxRetries) {
            startConnection();
        } else {
            setConnectionState(prev => ({
                ...prev,
                errorMessage: 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.'
            }));
        }
    };

    // الرجوع للداشبورد
    const goBack = () => {
        clearAllTimers();
        closeEventSource();
        navigate('/whatsapp');
    };

    // رسائل الحالة
    const getStatusMessage = () => {
        switch (connectionState.status) {
            case 'disconnected':
                return 'اضغط "اتصال" لبدء ربط WhatsApp';
            case 'initializing':
                return 'جاري تهيئة WhatsApp...';
            case 'waiting_qr':
                return 'جاري إنتاج رمز QR...';
            case 'qr_ready':
                return 'امسح رمز QR بهاتفك لربط WhatsApp';
            case 'scanning':
                return 'جاري مسح الرمز...';
            case 'connected':
                return 'تم الاتصال بنجاح! جاري التوجيه...';
            case 'error':
                return connectionState.errorMessage;
            default:
                return 'حالة غير معروفة';
        }
    };

    const getStatusIcon = () => {
        switch (connectionState.status) {
            case 'disconnected':
                return '🔌';
            case 'initializing':
            case 'waiting_qr':
                return '🔄';
            case 'qr_ready':
                return '📱';
            case 'scanning':
                return '👁️';
            case 'connected':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '❓';
        }
    };

    return (
        <div className="whatsapp-connection-page" dir="rtl">
            <div className="connection-container">
                {/* Header */}
                <div className="connection-header">
                    <button className="back-btn" onClick={goBack}>
                        ← العودة
                    </button>
                    <h1>🟢 ربط WhatsApp</h1>
                </div>

                {/* Status Card */}
                <div className="status-card">
                    <div className="status-icon">
                        {connectionState.isLoading ? (
                            <div className="spinner"></div>
                        ) : (
                            <span className="status-emoji">{getStatusIcon()}</span>
                        )}
                    </div>
                    <div className="status-message">
                        {getStatusMessage()}
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="progress-steps">
                        <div className={`step ${['initializing', 'waiting_qr', 'qr_ready', 'scanning', 'connected'].includes(connectionState.status) ? 'active' : ''}`}>
                            1. تهيئة
                        </div>
                        <div className={`step ${['waiting_qr', 'qr_ready', 'scanning', 'connected'].includes(connectionState.status) ? 'active' : ''}`}>
                            2. إنتاج QR
                        </div>
                        <div className={`step ${['qr_ready', 'scanning', 'connected'].includes(connectionState.status) ? 'active' : ''}`}>
                            3. مسح الرمز
                        </div>
                        <div className={`step ${connectionState.status === 'connected' ? 'active' : ''}`}>
                            4. متصل
                        </div>
                    </div>
                </div>

                {/* QR Code Display */}
                {connectionState.status === 'qr_ready' && connectionState.qrCode && (
                    <div className="qr-display">
                        <div className="qr-container">
                            <img 
                                src={connectionState.qrCode} 
                                alt="WhatsApp QR Code"
                                className="qr-image"
                            />
                            <div className="qr-instructions">
                                <h3>📱 كيفية المسح:</h3>
                                <ol>
                                    <li>افتح WhatsApp على هاتفك</li>
                                    <li>اذهب إلى الإعدادات ← الأجهزة المرتبطة</li>
                                    <li>اضغط "ربط جهاز"</li>
                                    <li>وجه الكاميرا نحو هذا الرمز</li>
                                </ol>
                            </div>
                        </div>
                        
                        {qrMetadata.timestamp && (
                            <div className="qr-metadata">
                                <small>
                                    تم إنتاج الرمز: {qrMetadata.timestamp.toLocaleTimeString('en-US')}
                                    {qrMetadata.attempts > 1 && ` (المحاولة ${qrMetadata.attempts})`}
                                </small>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                    {connectionState.status === 'disconnected' && (
                        <button 
                            className="btn btn-primary btn-large"
                            onClick={startConnection}
                            disabled={connectionState.isLoading}
                        >
                            🔗 بدء الاتصال
                        </button>
                    )}

                    {connectionState.status === 'error' && (
                        <div className="button-group">
                            {connectionState.retryCount < maxRetries && (
                                <button 
                                    className="btn btn-warning btn-large"
                                    onClick={handleRetry}
                                    disabled={connectionState.isLoading}
                                >
                                    🔄 إعادة المحاولة ({connectionState.retryCount}/{maxRetries})
                                </button>
                            )}
                            <button 
                                className="btn btn-danger"
                                onClick={() => {
                                    // مسح بيانات WhatsApp Web
                                    Object.keys(localStorage).forEach(key => {
                                        if (key.includes('whatsapp') || key.includes('wa-') || key.includes('waweb')) {
                                            localStorage.removeItem(key)
                                        }
                                    })
                                    
                                    Object.keys(sessionStorage).forEach(key => {
                                        if (key.includes('whatsapp') || key.includes('wa-') || key.includes('waweb')) {
                                            sessionStorage.removeItem(key)
                                        }
                                    })
                                    
                                    if ('indexedDB' in window) {
                                        try {
                                            indexedDB.deleteDatabase('WhatsAppWeb')
                                            indexedDB.deleteDatabase('waweb')
                                        } catch (error) {
                                            console.log('تعذر مسح IndexedDB:', error)
                                        }
                                    }
                                    
                                    alert('تم مسح بيانات WhatsApp Web. سيتم إعادة تحميل الصفحة.')
                                    window.location.reload()
                                }}
                                title="مسح بيانات WhatsApp وإعادة تعيين الاتصال"
                            >
                                🗑️ مسح البيانات وإعادة المحاولة
                            </button>
                        </div>
                    )}

                    {connectionState.status === 'qr_ready' && (
                        <div className="button-group">
                            <button 
                                className="btn btn-success"
                                onClick={() => {
                                    console.log('💾 الحفاظ على QR Code يدوياً');
                                    localStorage.setItem('lastQRCode', connectionState.qrCode);
                                    localStorage.setItem('lastQRTimestamp', new Date().toISOString());
                                    localStorage.setItem('qr_keep_manual', 'true');
                                    alert('تم حفظ QR Code! سيبقى متاح حتى لو اختفى.');
                                }}
                                title="حفظ QR Code للاحتفاظ به"
                            >
                                💾 حفظ QR
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => startQRPolling()}
                                disabled={connectionState.isLoading}
                            >
                                🔄 تحديث الرمز
                            </button>
                            <button 
                                className="btn btn-danger"
                                onClick={() => {
                                    // مسح بيانات WhatsApp Web
                                    Object.keys(localStorage).forEach(key => {
                                        if (key.includes('whatsapp') || key.includes('wa-') || key.includes('waweb') || key.includes('lastQR')) {
                                            localStorage.removeItem(key)
                                        }
                                    })
                                    
                                    Object.keys(sessionStorage).forEach(key => {
                                        if (key.includes('whatsapp') || key.includes('wa-') || key.includes('waweb')) {
                                            sessionStorage.removeItem(key)
                                        }
                                    })
                                    
                                    if ('indexedDB' in window) {
                                        try {
                                            indexedDB.deleteDatabase('WhatsAppWeb')
                                            indexedDB.deleteDatabase('waweb')
                                        } catch (error) {
                                            console.log('تعذر مسح IndexedDB:', error)
                                        }
                                    }
                                    
                                    alert('تم مسح بيانات WhatsApp Web. أعد تحميل الصفحة وحاول مرة أخرى.')
                                    window.location.reload()
                                }}
                                title="مسح بيانات WhatsApp وإعادة تعيين الاتصال"
                            >
                                🗑️ إعادة تعيين
                            </button>
                        </div>
                    )}
                </div>

                {/* Debug Info (في بيئة التطوير فقط) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info">
                        <details>
                            <summary>معلومات التصحيح</summary>
                            <pre>{JSON.stringify({
                                connectionState,
                                qrMetadata,
                                hasEventSource: !!eventSourceRef.current,
                                hasPolling: !!qrPollingRef.current,
                                hasTimeout: !!connectionTimeoutRef.current
                            }, null, 2)}</pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppConnectionPage;