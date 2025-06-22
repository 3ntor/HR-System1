import React, { useState, useEffect } from 'react';
import WhatsAppService from '../services/WhatsAppService';
import { formatEgyptianPhone, EGYPTIAN_TEST_NUMBERS } from '../utils/phoneFormatter';
import './WhatsAppDashboard.css';

// دالة مسح بيانات WhatsApp Web
const clearWhatsAppData = () => {
    // مسح Local Storage
    Object.keys(localStorage).forEach(key => {
        if (key.includes('whatsapp') || key.includes('wa-') || key.includes('waweb')) {
            localStorage.removeItem(key)
        }
    })
    
    // مسح Session Storage
    Object.keys(sessionStorage).forEach(key => {
        if (key.includes('whatsapp') || key.includes('wa-') || key.includes('waweb')) {
            sessionStorage.removeItem(key)
        }
    })
    
    // مسح IndexedDB إذا كان متاح
    if ('indexedDB' in window) {
        try {
            indexedDB.deleteDatabase('WhatsAppWeb')
            indexedDB.deleteDatabase('waweb')
        } catch (error) {
            console.log('تعذر مسح IndexedDB:', error)
        }
    }
    
    alert('تم مسح بيانات WhatsApp Web. أعد تحميل الصفحة وحاول مرة أخرى.')
}

const WhatsAppDashboard = () => {
    // استخدام بيانات كريم من ملف تنسيق الأرقام المصرية
    const TEST_CONTACT = EGYPTIAN_TEST_NUMBERS.KARIM_BAHRAWY;

    // Main state
    const [activeTab, setActiveTab] = useState('connection');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({
        status: 'disconnected',
        isReady: false,
        qrCode: null,
        authInfo: null,
        stats: {}
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Connection state
    const [connecting, setConnecting] = useState(false);

    // Templates state
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        content: '',
        description: '',
        category: 'general',
        variables: []
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Message state
    const [messageForm, setMessageForm] = useState({
        to: '',
        message: '',
        templateName: '',
        templateData: {}
    });

    // Bulk message state
    const [bulkForm, setBulkForm] = useState({
        recipients: '',
        message: '',
        templateName: '',
        delayMs: 3000
    });
    const [bulkProgress, setBulkProgress] = useState(null);

    // Stats state
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);

    // Test message state
    const [testForm, setTestForm] = useState({
        message: '',
        templateName: '',
        templateData: {}
    });
    const [testHistory, setTestHistory] = useState([]);

    // Effects
    useEffect(() => {
        initializeService();
        return () => {
            WhatsAppService.destroy();
            if (statusInterval) clearInterval(statusInterval);
        };
    }, []);

    let statusInterval;

    // Service initialization
    const initializeService = async () => {
        try {
            await checkStatus();
            startEventStream();
            if (status.status === 'connected') {
                await loadTemplates();
                await loadStats();
            }
        } catch (error) {
            console.error('Service initialization error:', error);
        }
    };

    // Status management
    const checkStatus = async () => {
        try {
            const result = await WhatsAppService.getStatus();
            setStatus(result);
            return result;
        } catch (error) {
            console.error('Status check error:', error);
            setError('خطأ في التحقق من حالة الاتصال');
        }
    };

    const startEventStream = () => {
        WhatsAppService.startEventStream();
        
        WhatsAppService.on('qr', (data) => {
            setStatus(prev => ({ ...prev, ...data }));
        });

        WhatsAppService.on('ready', (data) => {
            setStatus(prev => ({ ...prev, ...data }));
            setSuccess('تم الاتصال بنجاح! 🎉');
            
            // Clear QR polling interval when connected
            if (window.qrInterval) {
                clearInterval(window.qrInterval);
                window.qrInterval = null;
                console.log('✅ QR Code polling stopped - connection successful');
            }
            
            loadTemplates();
            loadStats();
        });

        WhatsAppService.on('disconnected', (data) => {
            setStatus(prev => ({ ...prev, ...data }));
            setError('تم قطع الاتصال');
        });

        // Status polling
        statusInterval = setInterval(checkStatus, 5000);
    };

    // Connection operations
    const handleConnect = () => {
        // توجه لصفحة الاتصال المخصصة
        window.location.href = '/whatsapp/connect';
    };

    const handleDisconnect = async () => {
        setLoading(true);
        try {
            const result = await WhatsAppService.disconnect();
            if (result.success) {
                setSuccess('تم قطع الاتصال بنجاح');
                setStatus({
                    status: 'disconnected',
                    isReady: false,
                    qrCode: null,
                    authInfo: null,
                    stats: {}
                });
            }
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Disconnect'));
        } finally {
            setLoading(false);
        }
    };

    // Template operations
    const loadTemplates = async () => {
        try {
            const result = await WhatsAppService.getTemplates();
            setTemplates(result.templates || []);
        } catch (error) {
            setError('خطأ في تحميل القوالب');
        }
    };

    const handleSaveTemplate = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const templateData = {
                ...templateForm,
                variables: WhatsAppService.extractTemplateVariables(templateForm.content)
            };

            if (selectedTemplate) {
                await WhatsAppService.updateTemplate(selectedTemplate.id, templateData);
                setSuccess('تم تحديث القالب بنجاح');
            } else {
                await WhatsAppService.createTemplate(templateData);
                setSuccess('تم إنشاء القالب بنجاح');
            }

            await loadTemplates();
            setShowTemplateModal(false);
            resetTemplateForm();
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Template Save'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

        try {
            await WhatsAppService.deleteTemplate(id);
            setSuccess('تم حذف القالب بنجاح');
            await loadTemplates();
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Template Delete'));
        }
    };

    const resetTemplateForm = () => {
        setTemplateForm({
            name: '',
            content: '',
            description: '',
            category: 'general',
            variables: []
        });
        setSelectedTemplate(null);
    };

    // Message operations
    const handleSendMessage = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (messageForm.templateName) {
                await WhatsAppService.sendTemplateMessage(
                    messageForm.to,
                    messageForm.templateName,
                    messageForm.templateData
                );
            } else {
                await WhatsAppService.sendMessage(messageForm.to, messageForm.message);
            }
            
            setSuccess('تم إرسال الرسالة بنجاح! 📤');
            setMessageForm({
                to: '',
                message: '',
                templateName: '',
                templateData: {}
            });
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Send Message'));
        } finally {
            setLoading(false);
        }
    };

    // Bulk message operations
    const handleBulkSend = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setBulkProgress(null);

        try {
            const recipients = bulkForm.recipients
                .split('\n')
                .map(line => {
                    const parts = line.trim().split(',');
                    return {
                        phone: parts[0]?.trim(),
                        name: parts[1]?.trim() || 'مستخدم'
                    };
                })
                .filter(r => r.phone);

            if (recipients.length === 0) {
                setError('يرجى إدخال أرقام هواتف صحيحة');
                return;
            }

            const options = {
                delayMs: parseInt(bulkForm.delayMs),
                onProgress: setBulkProgress
            };

            const result = await WhatsAppService.sendBulkMessages(
                recipients,
                bulkForm.message,
                bulkForm.templateName || null,
                options
            );

            setSuccess(`تم إرسال ${result.success.length} رسالة من أصل ${result.total}`);
            setBulkForm({
                recipients: '',
                message: '',
                templateName: '',
                delayMs: 3000
            });
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Bulk Send'));
        } finally {
            setLoading(false);
            setBulkProgress(null);
        }
    };

    // Test message operations
    const handleTestMessage = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let result;
            if (testForm.templateName) {
                // استخدام البيانات المدخلة من المستخدم أو قيم افتراضية
                const autoTemplateData = {
                    employeeName: testForm.templateData?.employeeName || 'غير محدد',
                    companyName: testForm.templateData?.companyName || 'اسم الشركة',
                    department: testForm.templateData?.department || 'قسم عام',
                    position: testForm.templateData?.position || 'موظف',
                    month: testForm.templateData?.month || new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
                    paymentDate: testForm.templateData?.paymentDate || new Date().toLocaleDateString('ar-EG'),
                    paymentMethod: testForm.templateData?.paymentMethod || 'تحويل بنكي',
                    transactionId: testForm.templateData?.transactionId || 'TXN' + Date.now().toString().slice(-6),
                    subject: testForm.templateData?.subject || 'موضوع الاجتماع',
                    date: testForm.templateData?.date || 'التاريخ',
                    time: testForm.templateData?.time || 'الوقت',
                    status: testForm.templateData?.status || 'قيد المراجعة',
                    startDate: testForm.templateData?.startDate || 'تاريخ البداية',
                    endDate: testForm.templateData?.endDate || 'تاريخ النهاية',
                    title: testForm.templateData?.title || 'العنوان',
                    content: testForm.templateData?.content || 'المحتوى',
                    startTime: testForm.templateData?.startTime || '09:00 صباحاً',
                    endTime: testForm.templateData?.endTime || '05:00 مساءً',
                    // إضافة قيم افتراضية للبيانات المالية
                    amount: testForm.templateData?.amount || '0',
                    basicSalary: testForm.templateData?.basicSalary || '0',
                    allowances: testForm.templateData?.allowances || '0',
                    deductions: testForm.templateData?.deductions || '0',
                    netSalary: testForm.templateData?.netSalary || '0',
                    ...testForm.templateData // دمج أي بيانات إضافية من المستخدم
                };
                
                result = await WhatsAppService.sendTemplateMessage(
                    TEST_CONTACT.international,
                    testForm.templateName,
                    autoTemplateData
                );
            } else if (testForm.message.trim()) {
                result = await WhatsAppService.sendMessage(
                    TEST_CONTACT.international, 
                    testForm.message
                );
            } else {
                throw new Error('يرجى إدخال رسالة أو اختيار قالب');
            }
            
            // Add to test history
            const historyEntry = {
                id: Date.now(),
                timestamp: new Date().toLocaleString('en-US'),
                type: testForm.templateName ? 'template' : 'text',
                content: testForm.templateName || testForm.message.substring(0, 50) + '...',
                templateName: testForm.templateName || null,
                status: 'sent',
                contact: TEST_CONTACT.name
            };
            
            setTestHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
            setSuccess(`تم إرسال الرسالة التجريبية إلى ${TEST_CONTACT.name} بنجاح! 📤`);
            
            // Reset form
            setTestForm({
                message: '',
                templateName: '',
                templateData: {}
            });
            
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Test Message'));
        } finally {
            setLoading(false);
        }
    };

    const sendQuickTestMessage = async (messageText) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // استخدام الرقم الدولي الصحيح
            await WhatsAppService.sendMessage(TEST_CONTACT.international, messageText);
            
            const historyEntry = {
                id: Date.now(),
                timestamp: new Date().toLocaleString('en-US'),
                type: 'quick',
                content: messageText,
                status: 'sent',
                contact: TEST_CONTACT.name
            };
            
            setTestHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
            setSuccess(`تم إرسال الرسالة السريعة إلى ${TEST_CONTACT.name} بنجاح! 🚀`);
            
        } catch (error) {
            setError(WhatsAppService.handleApiError(error, 'Quick Test Message'));
        } finally {
            setLoading(false);
        }
    };

    // إنشاء قوالب افتراضية بدلاً من تحميل قوالب تجريبية
    const createDefaultTemplates = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const defaultTemplates = [
                {
                    name: 'welcome_new_employee',
                    content: 'مرحباً {{employeeName}} 👋\n\nأهلاً بك في {{companyName}}!\nتم تعيينك في قسم {{department}} كـ {{position}}.\n\nنتمنى لك التوفيق والنجاح معنا! 🎉',
                    description: 'رسالة ترحيب بالموظف الجديد',
                    category: 'hr',
                    variables: ['employeeName', 'companyName', 'department', 'position']
                },
                {
                    name: 'salary_notification',
                    content: '💰 إشعار راتب - {{month}}\n\nعزيزي/عزيزتي {{employeeName}},\n\nتم صرف راتبك لشهر {{month}} بنجاح! 🎉\n\n💵 المبلغ: {{amount}} جنيه مصري\n📅 تاريخ الصرف: {{paymentDate}}\n🏦 طريقة الدفع: {{paymentMethod}}\n📋 رقم المعاملة: {{transactionId}}\n\n📊 تفاصيل الراتب:\n• الراتب الأساسي: {{basicSalary}} ج.م\n• البدلات: {{allowances}} ج.م\n• الخصوميات: {{deductions}} ج.م\n• صافي الراتب: {{netSalary}} ج.م\n\n🔗 يمكنك مراجعة كشف الراتب التفصيلي من النظام.\n\nشكراً لجهودك المتميزة! 🙏',
                    description: 'إشعار صرف الراتب الشهري - مفصل',
                    category: 'payroll',
                    variables: ['employeeName', 'month', 'amount', 'paymentDate', 'paymentMethod', 'transactionId', 'basicSalary', 'allowances', 'deductions', 'netSalary']
                },
                {
                    name: 'meeting_reminder',
                    content: 'تذكير اجتماع 📅\n\nعزيزي/عزيزتي {{employeeName}}\n\nلديك اجتماع بعنوان: {{subject}}\nالتاريخ: {{date}}\nالوقت: {{time}}\n\nنرجو الحضور في الموعد المحدد.',
                    description: 'تذكير بموعد اجتماع',
                    category: 'meetings',
                    variables: ['employeeName', 'subject', 'date', 'time']
                },
                {
                    name: 'leave_approval',
                    content: 'إشعار طلب الإجازة ✅\n\nعزيزي/عزيزتي {{employeeName}}\n\nحالة طلب الإجازة: {{status}}\nمن تاريخ: {{startDate}}\nإلى تاريخ: {{endDate}}\n\nشكراً لك!',
                    description: 'إشعار حالة طلب الإجازة',
                    category: 'hr',
                    variables: ['employeeName', 'status', 'startDate', 'endDate']
                },
                {
                    name: 'birthday_wishes',
                    content: 'عيد ميلاد سعيد! 🎂🎉\n\nعزيزي/عزيزتي {{employeeName}}\n\nكل عام وأنت بخير بمناسبة عيد ميلادك!\nنتمنى لك سنة مليئة بالنجاح والسعادة.\n\nمع أطيب التهاني! 💐',
                    description: 'تهنئة بعيد الميلاد',
                    category: 'general',
                    variables: ['employeeName']
                },
                {
                    name: 'general_announcement',
                    content: 'إعلان مهم 📢\n\n{{title}}\n\n{{content}}\n\nشكراً لاهتمامكم.',
                    description: 'إعلان عام لجميع الموظفين',
                    category: 'general',
                    variables: ['title', 'content']
                },
                {
                    name: 'attendance_reminder',
                    content: 'تذكير الحضور ⏰\n\nعزيزي/عزيزتي {{employeeName}}\n\nنذكركم بأهمية الالتزام بمواعيد العمل.\nموعد بداية العمل: {{startTime}}\nموعد نهاية العمل: {{endTime}}\n\nشكراً لتعاونكم.',
                    description: 'تذكير بمواعيد الحضور',
                    category: 'hr',
                    variables: ['employeeName', 'startTime', 'endTime']
                }
            ];

            let createdCount = 0;
            for (const template of defaultTemplates) {
                try {
                    await WhatsAppService.createTemplate(template);
                    createdCount++;
                } catch (error) {
                    console.warn(`فشل في إنشاء القالب ${template.name}:`, error);
                }
            }

            if (createdCount > 0) {
                setSuccess(`تم إنشاء ${createdCount} قالب افتراضي بنجاح! 📝`);
                await loadTemplates(); // Reload templates list
            } else {
                setError('فشل في إنشاء القوالب الافتراضية');
            }
        } catch (error) {
            setError('خطأ في إنشاء القوالب الافتراضية');
        } finally {
            setLoading(false);
        }
    };

    // Statistics operations
    const loadStats = async () => {
        try {
            const [statsResult, logsResult] = await Promise.all([
                WhatsAppService.getStats(),
                WhatsAppService.getLogs(50)
            ]);
            
            setStats(WhatsAppService.formatStats(statsResult.stats));
            setLogs(logsResult.logs || []);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // HR Integration helpers
    const hrTemplates = WhatsAppService.getHRTemplates();

    // Clear Sessions Function
    const clearSessions = async () => {
        if (!window.confirm('هل أنت متأكد من مسح جميع البيانات والجلسات المحفوظة؟\n\nسيتم:\n• قطع الاتصال الحالي\n• مسح جميع الجلسات المحفوظة\n• حذف رموز QR القديمة\n• إعادة تعيين الحالة\n\nستحتاج لمسح رمز QR مرة أخرى للاتصال.')) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5001/api/whatsapp/clear-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but received:', text);
                throw new Error('استجابة غير صالحة من الخادم');
            }

            const result = await response.json();

            if (result.success) {
                setSuccess('🗑️ تم مسح جميع البيانات والجلسات بنجاح! يمكنك الآن البدء من جديد.');
                
                // Reset local state immediately and completely
                setStatus({ 
                    status: 'disconnected', 
                    isReady: false,
                    phone: null,
                    qrCode: null,
                    authInfo: null,
                    stats: {},
                    isConnecting: false,
                    lastConnected: null
                });
                
                // Stop event stream
                WhatsAppService.destroy();
                
                // Clear any intervals
                if (statusInterval) {
                    clearInterval(statusInterval);
                }
                
                // Force immediate status check after clearing
                setTimeout(() => {
                    checkStatus();
                }, 1000);
                
            } else {
                throw new Error(result.message || 'فشل في مسح البيانات');
            }
        } catch (error) {
            console.error('Clear sessions error:', error);
            if (error.message.includes('Failed to fetch')) {
                setError('خطأ في الاتصال: تأكد من تشغيل الخادم الخلفي على المنفذ 5001');
            } else {
                setError('خطأ في مسح البيانات: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Enhanced QR retry with better error handling
    const retryQRGeneration = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            console.log('🔄 Starting enhanced QR retry...');
            
            // Step 1: Clear all data
            clearWhatsAppData();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 2: Force disconnect
            try {
                await WhatsAppService.disconnect();
            } catch (error) {
                console.log('Disconnect not needed:', error.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Step 3: Clear backend sessions
            const clearResult = await fetch('http://localhost:5001/api/whatsapp/clear-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!clearResult.ok) {
                console.warn('Backend clear failed');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 4: Enhanced initialization with new methods
            const initResponse = await fetch('http://localhost:5001/api/whatsapp/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    forceRestart: true,
                    enhancedQR: true,
                    clearSessions: true,
                    retryAttempt: true
                })
            });
            
            const initResult = await initResponse.json();
            
            if (initResult.success) {
                setSuccess('🔄 تم بدء عملية إنتاج QR محسنة. انتظر قليلاً...');
                
                // Step 5: Start monitoring for new QR
                let attempts = 0;
                const maxAttempts = 25;
                
                const checkForQR = async () => {
                    attempts++;
                    console.log(`🔍 Checking for QR (attempt ${attempts}/${maxAttempts})`);
                    
                    try {
                        const statusResult = await checkStatus();
                        
                        if (statusResult && statusResult.qrCode) {
                            setSuccess('✅ تم إنتاج QR Code بطريقة محسنة! امسح الكود بسرعة.');
                            clearInterval(window.qrCheckInterval);
                            return;
                        }
                        
                        if (attempts >= maxAttempts) {
                            clearInterval(window.qrCheckInterval);
                            setError('فشل في إنتاج QR Code حتى بعد التحسينات. جرب إعادة تشغيل النظام.');
                        }
                    } catch (error) {
                        console.log(`QR check attempt ${attempts} failed:`, error.message);
                    }
                };
                
                // Start checking for QR
                checkForQR();
                window.qrCheckInterval = setInterval(checkForQR, 2500);
                
                // Cleanup interval after 60 seconds
                setTimeout(() => {
                    if (window.qrCheckInterval) {
                        clearInterval(window.qrCheckInterval);
                        window.qrCheckInterval = null;
                    }
                }, 60000);
                
            } else {
                throw new Error(initResult.message || 'فشل في بدء العملية المحسنة');
            }
            
        } catch (error) {
            console.error('Enhanced QR retry failed:', error);
            setError(`فشل في إعادة المحاولة المحسنة: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Notification helpers
    const showNotification = (message, type = 'info') => {
        if (type === 'success') {
            setSuccess(message);
            setError('');
        } else {
            setError(message);
            setSuccess('');
        }
        
        setTimeout(() => {
            setSuccess('');
            setError('');
        }, 5000);
    };

    return (
        <div className="whatsapp-dashboard" dir="rtl">
            <div className="dashboard-header">
                <h1>🟢 لوحة تحكم WhatsApp</h1>
                <div className="status-indicator">
                    <span className={`status-dot ${status.status}`}></span>
                    <span className="status-text">
                        {status.status === 'connected' ? 'متصل' :
                         status.status === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
                    </span>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="notification error">
                    <span>❌ {error}</span>
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}
            
            {success && (
                <div className="notification success">
                    <span>✅ {success}</span>
                    <button onClick={() => setSuccess('')}>×</button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="tab-navigation">
                {[
                    { id: 'connection', label: '🔗 الاتصال', icon: '🔗' },
                    { id: 'test', label: '🧪 رسائل تجريبية', icon: '🧪' },
                    { id: 'templates', label: '📝 القوالب', icon: '📝' },
                    { id: 'send', label: '📤 إرسال رسالة', icon: '📤' },
                    { id: 'bulk', label: '📨 الإرسال المجمع', icon: '📨' },
                    { id: 'hr', label: '👥 الموارد البشرية', icon: '👥' },
                    { id: 'stats', label: '📊 الإحصائيات', icon: '📊' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Connection Tab */}
                {activeTab === 'connection' && (
                    <div className="connection-tab">
                        <div className="connection-status">
                            <h2>حالة الاتصال</h2>
                            <div className="status-card">
                                <div className="status-info">
                                    <p><strong>الحالة:</strong> {
                                        status.status === 'connected' ? '✅ متصل' :
                                        status.status === 'connecting' ? '🔄 جاري الاتصال' :
                                        '❌ غير متصل'
                                    }</p>
                                    {status.authInfo && (
                                        <>
                                            <p><strong>الرقم:</strong> {status.authInfo.number}</p>
                                            <p><strong>الاسم:</strong> {status.authInfo.name}</p>
                                            <p><strong>وقت الاتصال:</strong> {new Date(status.authInfo.connectedAt).toLocaleString('en-US')}</p>
                                        </>
                                    )}
                                </div>
                                
                                <div className="connection-actions">
                                    {status.status !== 'connected' ? (
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleConnect}
                                            disabled={connecting}
                                        >
                                            {connecting ? '🔄 جاري الاتصال...' : '🔗 اتصال'}
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn-danger"
                                            onClick={handleDisconnect}
                                            disabled={loading}
                                        >
                                            {loading ? '🔄 جاري القطع...' : '🔌 قطع الاتصال'}
                                        </button>
                                    )}
                                    
                                    <button 
                                        className="btn btn-warning"
                                        onClick={clearSessions}
                                        disabled={loading}
                                        style={{ marginTop: '10px' }}
                                        title="مسح جميع البيانات والجلسات المحفوظة"
                                    >
                                        {loading ? '🔄 جاري المسح...' : '🗑️ مسح البيانات والبدء من جديد'}
                                    </button>
                                    
                                    <button 
                                        className="btn btn-success"
                                        onClick={retryQRGeneration}
                                        disabled={loading}
                                        style={{ marginTop: '10px' }}
                                        title="إعادة محاولة إنتاج QR Code بطرق محسنة"
                                    >
                                        {loading ? '🔄 جاري المحاولة...' : '🚀 إعادة محاولة QR محسنة'}
                                    </button>
                                </div>
                            </div>

                            {/* QR Code */}
                            {status.qrCode && (
                                <div className="qr-section">
                                    <h3>مسح رمز QR</h3>
                                    <div className="qr-container">
                                        <img src={status.qrCode} alt="QR Code" />
                                        <p>امسح هذا الرمز بهاتفك لربط WhatsApp</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Test Messages Tab */}
                {activeTab === 'test' && (
                    <div className="test-tab">
                        <div className="test-header">
                            <h2>🧪 رسائل تجريبية</h2>
                            <div className="test-contact-info">
                                <span className="contact-badge">
                                    👤 جهة الاتصال التجريبية: {TEST_CONTACT.name} ({TEST_CONTACT.display}) - الرقم الدولي: {TEST_CONTACT.international}
                                </span>
                            </div>
                            <div className="test-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={createDefaultTemplates}
                                    disabled={loading}
                                >
                                    {loading ? '🔄 جاري الإنشاء...' : '📝 إنشاء القوالب الافتراضية'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Test Messages */}
                        <div className="quick-tests">
                            <h3>رسائل سريعة</h3>
                            <div className="quick-buttons">
                                <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => sendQuickTestMessage('السلام عليكم ورحمة الله وبركاته، هذه رسالة تجريبية من نظام الموارد البشرية 👋')}
                                    disabled={loading || !status.isReady}
                                >
                                    ✋ رسالة ترحيب
                                </button>
                                <button 
                                    className="btn btn-outline-success"
                                    onClick={() => sendQuickTestMessage('تم اختبار النظام بنجاح! ✅ جميع الخدمات تعمل بشكل طبيعي.')}
                                    disabled={loading || !status.isReady}
                                >
                                    ✅ اختبار النظام
                                </button>
                                <button 
                                    className="btn btn-outline-info"
                                    onClick={() => sendQuickTestMessage(`تم الإرسال في ${new Date().toLocaleString('en-US')} 📅⏰`)}
                                    disabled={loading || !status.isReady}
                                >
                                    🕐 رسالة بالتوقيت
                                </button>
                                <button 
                                    className="btn btn-outline-warning"
                                    onClick={() => sendQuickTestMessage('هذه رسالة تجريبية تحتوي على رموز تعبيرية 😊📱💻🎉🔥⭐')}
                                    disabled={loading || !status.isReady}
                                >
                                    😊 رسالة بالإيموجي
                                </button>
                            </div>
                        </div>

                        {/* Custom Test Message */}
                        <div className="custom-test">
                            <h3>رسالة مخصصة</h3>
                            <div className="test-form">
                                <div className="form-group">
                                    <label>اختر القالب (اختياري):</label>
                                    <select
                                        value={testForm.templateName}
                                        onChange={(e) => setTestForm({...testForm, templateName: e.target.value})}
                                        className="form-control"
                                    >
                                        <option value="">بدون قالب - رسالة نصية</option>
                                        {templates.map(template => (
                                            <option key={template.id} value={template.name}>
                                                📝 {template.name} - {template.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!testForm.templateName && (
                                    <div className="form-group">
                                        <label>نص الرسالة:</label>
                                        <textarea
                                            value={testForm.message}
                                            onChange={(e) => setTestForm({...testForm, message: e.target.value})}
                                            placeholder="اكتب رسالتك التجريبية هنا..."
                                            className="form-control"
                                            rows="4"
                                        />
                                    </div>
                                )}

                                <button 
                                    className="btn btn-primary btn-block"
                                    onClick={handleTestMessage}
                                    disabled={loading || !status.isReady || (!testForm.message.trim() && !testForm.templateName)}
                                >
                                    {loading ? '🔄 جاري الإرسال...' : '🚀 إرسال رسالة تجريبية'}
                                </button>
                            </div>
                        </div>

                        {/* Test History */}
                        {testHistory.length > 0 && (
                            <div className="test-history">
                                <h3>سجل الرسائل التجريبية</h3>
                                <div className="history-list">
                                    {testHistory.map(entry => (
                                        <div key={entry.id} className="history-item">
                                            <div className="history-header">
                                                <span className="history-type">
                                                    {entry.type === 'template' ? '📝' : 
                                                     entry.type === 'quick' ? '⚡' : '💬'} 
                                                    {entry.type === 'template' ? 'قالب' : 
                                                     entry.type === 'quick' ? 'سريعة' : 'نصية'}
                                                </span>
                                                <span className="history-time">{entry.timestamp}</span>
                                                <span className={`history-status ${entry.status}`}>
                                                    {entry.status === 'sent' ? '✅ تم الإرسال' : '❌ فشل'}
                                                </span>
                                            </div>
                                            <div className="history-content">
                                                {entry.templateName && (
                                                    <div className="template-used">📝 القالب: {entry.templateName}</div>
                                                )}
                                                <div className="message-preview">{entry.content}</div>
                                                <div className="contact-info">👤 إلى: {entry.contact}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Test Instructions */}
                        <div className="test-instructions">
                            <h3>تعليمات الاختبار</h3>
                            <div className="instructions-content">
                                <ul>
                                    <li>🎯 الرسائل التجريبية سيتم إرسالها إلى {TEST_CONTACT.name} فقط</li>
                                    <li>⚡ استخدم الرسائل السريعة للاختبار المبدئي</li>
                                    <li>📝 جرب القوالب المختلفة للتأكد من صحة تنسيقها</li>
                                    <li>📊 راقب سجل الرسائل لمتابعة حالة الإرسال</li>
                                    <li>🔄 تأكد من أن الاتصال نشط قبل الإرسال</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="templates-tab">
                        <div className="templates-header">
                            <h2>إدارة القوالب</h2>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    resetTemplateForm();
                                    setShowTemplateModal(true);
                                }}
                            >
                                ➕ قالب جديد
                            </button>
                        </div>

                        <div className="templates-grid">
                            {templates.map(template => (
                                <div key={template.id} className="template-card">
                                    <div className="template-header">
                                        <h3>{template.name}</h3>
                                        <span className={`category-badge ${template.category}`}>
                                            {template.category}
                                        </span>
                                    </div>
                                    <p className="template-description">{template.description}</p>
                                    <div className="template-content">
                                        {template.content.substring(0, 100)}...
                                    </div>
                                    <div className="template-variables">
                                        <small>المتغيرات: {template.variables?.join(', ') || 'لا توجد'}</small>
                                    </div>
                                    <div className="template-actions">
                                        <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                setTemplateForm(template);
                                                setShowTemplateModal(true);
                                            }}
                                        >
                                            ✏️ تعديل
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                        >
                                            🗑️ حذف
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Send Message Tab */}
                {activeTab === 'send' && (
                    <div className="send-tab">
                        <h2>إرسال رسالة</h2>
                        <div className="send-form">
                            <div className="form-group">
                                <label>رقم الهاتف:</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={messageForm.to}
                                        onChange={(e) => setMessageForm({...messageForm, to: e.target.value})}
                                        placeholder="201XXXXXXXX (مصري دولي)"
                                        className="form-control"
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary"
                                        onClick={() => setMessageForm({...messageForm, to: TEST_CONTACT.international})}
                                        title="استخدام رقم كريم التجريبي"
                                    >
                                        👤 كريم
                                    </button>
                                </div>
                                <small className="form-text text-muted">
                                    📞 للاختبار: {TEST_CONTACT.name} ({TEST_CONTACT.display})
                                </small>
                            </div>

                            <div className="form-group">
                                <label>استخدام قالب (اختياري):</label>
                                <select
                                    value={messageForm.templateName}
                                    onChange={(e) => setMessageForm({...messageForm, templateName: e.target.value})}
                                    className="form-control"
                                >
                                    <option value="">بدون قالب</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.name}>
                                            {template.name} - {template.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!messageForm.templateName && (
                                <div className="form-group">
                                    <label>الرسالة:</label>
                                    <textarea
                                        value={messageForm.message}
                                        onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                                        placeholder="اكتب رسالتك هنا..."
                                        className="form-control"
                                        rows="5"
                                    />
                                </div>
                            )}

                            <button 
                                className="btn btn-primary btn-block"
                                onClick={handleSendMessage}
                                disabled={loading || !status.isReady}
                            >
                                {loading ? '🔄 جاري الإرسال...' : '📤 إرسال'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk Send Tab */}
                {activeTab === 'bulk' && (
                    <div className="bulk-tab">
                        <h2>الإرسال المجمع</h2>
                        <div className="bulk-form">
                            <div className="form-group">
                                <label>قائمة المستقبلين (رقم,اسم في كل سطر):</label>
                                <textarea
                                    value={bulkForm.recipients}
                                    onChange={(e) => setBulkForm({...bulkForm, recipients: e.target.value})}
                                    placeholder="966555555555,أحمد محمد&#10;966666666666,فاطمة علي"
                                    className="form-control"
                                    rows="6"
                                />
                            </div>

                            <div className="form-group">
                                <label>القالب:</label>
                                <select
                                    value={bulkForm.templateName}
                                    onChange={(e) => setBulkForm({...bulkForm, templateName: e.target.value})}
                                    className="form-control"
                                >
                                    <option value="">بدون قالب</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.name}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!bulkForm.templateName && (
                                <div className="form-group">
                                    <label>الرسالة:</label>
                                    <textarea
                                        value={bulkForm.message}
                                        onChange={(e) => setBulkForm({...bulkForm, message: e.target.value})}
                                        placeholder="الرسالة المجمعة..."
                                        className="form-control"
                                        rows="4"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>التأخير بين الرسائل (بالثواني):</label>
                                <select
                                    value={bulkForm.delayMs}
                                    onChange={(e) => setBulkForm({...bulkForm, delayMs: e.target.value})}
                                    className="form-control"
                                >
                                    <option value="2000">2 ثانية</option>
                                    <option value="3000">3 ثواني</option>
                                    <option value="5000">5 ثواني</option>
                                    <option value="10000">10 ثواني</option>
                                </select>
                            </div>

                            {bulkProgress && (
                                <div className="progress-section">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{width: `${(bulkProgress.current / bulkProgress.total) * 100}%`}}
                                        />
                                    </div>
                                    <p>تم إرسال {bulkProgress.current} من {bulkProgress.total}</p>
                                </div>
                            )}

                            <button 
                                className="btn btn-primary btn-block"
                                onClick={handleBulkSend}
                                disabled={loading || !status.isReady}
                            >
                                {loading ? '🔄 جاري الإرسال...' : '📨 إرسال مجمع'}
                            </button>
                        </div>
                    </div>
                )}

                {/* HR Integration Tab */}
                {activeTab === 'hr' && (
                    <div className="hr-tab">
                        <h2>تكامل الموارد البشرية</h2>
                        <div className="hr-templates">
                            <h3>القوالب المتاحة:</h3>
                            <div className="hr-templates-grid">
                                {hrTemplates.map(template => (
                                    <div key={template.name} className="hr-template-card">
                                        <h4>{template.title}</h4>
                                        <p>الفئة: {template.category}</p>
                                        <small>الحقول المطلوبة: {template.requiredFields.join(', ')}</small>
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => {
                                                setMessageForm({
                                                    ...messageForm,
                                                    templateName: template.name
                                                });
                                                setActiveTab('send');
                                            }}
                                        >
                                            استخدام
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'stats' && (
                    <div className="stats-tab">
                        <h2>الإحصائيات والسجلات</h2>
                        
                        {stats && (
                            <div className="stats-cards">
                                <div className="stat-card">
                                    <h3>📨 الرسائل المرسلة</h3>
                                    <div className="stat-number">{stats.totalMessages}</div>
                                </div>
                                <div className="stat-card success">
                                    <h3>✅ نجحت</h3>
                                    <div className="stat-number">{stats.successfulMessages}</div>
                                </div>
                                <div className="stat-card error">
                                    <h3>❌ فشلت</h3>
                                    <div className="stat-number">{stats.failedMessages}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>📊 معدل النجاح</h3>
                                    <div className="stat-number">{stats.successRate}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>⏱️ وقت التشغيل</h3>
                                    <div className="stat-number">{stats.uptime}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>📥 الرسائل الواردة</h3>
                                    <div className="stat-number">{stats.receivedMessages}</div>
                                </div>
                            </div>
                        )}

                        <div className="logs-section">
                            <div className="logs-header">
                                <h3>سجل العمليات</h3>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={loadStats}
                                >
                                    🔄 تحديث
                                </button>
                            </div>
                            
                            <div className="logs-list">
                                {logs.map(log => (
                                    <div key={log.id} className={`log-entry ${log.status}`}>
                                        <div className="log-header">
                                            <span className="log-type">{log.type}</span>
                                            <span className="log-time">
                                                {new Date(log.timestamp).toLocaleString('en-US')}
                                            </span>
                                        </div>
                                        <div className="log-message">{log.message}</div>
                                        {log.to && <div className="log-details">إلى: {log.to}</div>}
                                        {log.error && <div className="log-error">خطأ: {log.error}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{selectedTemplate ? 'تعديل القالب' : 'قالب جديد'}</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowTemplateModal(false)}
                            >×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>اسم القالب:</label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                                    className="form-control"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>الوصف:</label>
                                <input
                                    type="text"
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                                    className="form-control"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>الفئة:</label>
                                <select
                                    value={templateForm.category}
                                    onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                                    className="form-control"
                                >
                                    <option value="general">عام</option>
                                    <option value="hr">موارد بشرية</option>
                                    <option value="payroll">رواتب</option>
                                    <option value="meetings">اجتماعات</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>محتوى القالب:</label>
                                <textarea
                                    value={templateForm.content}
                                    onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                                    className="form-control"
                                    rows="8"
                                    placeholder="اكتب محتوى القالب... استخدم {{variableName}} للمتغيرات"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowTemplateModal(false)}
                            >إلغاء</button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveTemplate}
                                disabled={loading}
                            >
                                {loading ? '🔄 جاري الحفظ...' : '💾 حفظ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppDashboard; 