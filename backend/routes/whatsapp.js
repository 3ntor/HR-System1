const express = require('express');
const router = express.Router();
const sendError = require('../utils/sendError');
const WhatsAppManager = require('../managers/WhatsAppManager');

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
    try {
        // التحقق من وجود waManager
        if (!global.waManager) {
            return res.json({
                success: true,
                data: {
                    status: 'disabled',
                    isReady: false,
                    qrCode: null,
                    authInfo: null,
                    message: 'WhatsApp service is disabled'
                }
            });
        }

        const isReady = global.waManager.isClientReady();
        const qrCode = global.waManager.getQRCode();
        const authInfo = global.waManager.getAuthInfo();
        const status = global.waManager.getConnectionStatus();

        res.json({
            success: true,
            data: {
                status,
                isReady,
                qrCode,
                authInfo
            }
        });
    } catch (error) {
        sendError(res, 500, 'خطأ في جلب حالة WhatsApp', 'INTERNAL_ERROR', error.message);
    }
});

// GET /api/whatsapp/qr
router.get('/qr', (req, res) => {
  res.json({
    success: true,
    data: {
      qrCode: 'data:image/png;base64,FAKEQR==',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }
  });
});

// POST /api/whatsapp/initialize
router.post('/initialize', async (req, res) => {
    try {
        if (!global.waManager) {
            return res.json({
                success: false,
                message: 'WhatsApp service is disabled',
                data: { status: 'disabled' }
            });
        }

        await global.waManager.initialize();
        res.json({
            success: true,
            message: 'تم تهيئة WhatsApp بنجاح',
            data: {
                status: global.waManager.getConnectionStatus()
            }
        });
    } catch (error) {
        sendError(res, 500, 'خطأ في تهيئة WhatsApp', 'INTERNAL_ERROR', error.message);
    }
});

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
    try {
        if (!global.waManager) {
            return res.json({
                success: false,
                message: 'WhatsApp service is disabled',
                data: { status: 'disabled' }
            });
        }

        await global.waManager.disconnect();
        res.json({
            success: true,
            message: 'تم قطع الاتصال بنجاح',
            data: {
                status: global.waManager.getConnectionStatus()
            }
        });
    } catch (error) {
        sendError(res, 500, 'خطأ في قطع الاتصال', 'INTERNAL_ERROR', error.message);
    }
});

// POST /api/whatsapp/send
router.post('/send', async (req, res) => {
    try {
        if (!global.waManager) {
            return res.json({
                success: false,
                message: 'WhatsApp service is disabled',
                data: { status: 'disabled' }
            });
        }

        const { to, message, options } = req.body;
        
        if (!to || !message) {
            return sendError(res, 400, 'رقم الهاتف والرسالة مطلوبة', 'VALIDATION_ERROR');
        }

        if (!global.waManager.isClientReady()) {
            return sendError(res, 400, 'WhatsApp غير متصل', 'NOT_CONNECTED');
        }

        const result = await global.waManager.sendMessage(to, message, options);
        
        res.json({
            success: result,
            message: result ? 'تم إرسال الرسالة بنجاح' : 'فشل في إرسال الرسالة',
            data: {
                status: global.waManager.getConnectionStatus()
            }
        });
    } catch (error) {
        sendError(res, 500, 'خطأ في إرسال الرسالة', 'INTERNAL_ERROR', error.message);
    }
});

// GET /api/whatsapp/events
router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const sendEvent = (event, data) => {
        res.write(`data: ${JSON.stringify({ event, data })}\n\n`);
    };

    // Check if waManager exists
    if (!global.waManager) {
        sendEvent('status', {
            status: 'disabled',
            isReady: false,
            qrCode: null,
            authInfo: null,
            message: 'WhatsApp service is disabled'
        });
        return;
    }

    // Send initial connection status
    sendEvent('status', {
        status: global.waManager.getConnectionStatus(),
        isReady: global.waManager.isClientReady(),
        qrCode: global.waManager.getQRCode(),
        authInfo: global.waManager.getAuthInfo()
    });

    // Add client to manager's event listeners
    global.waManager.addEventListener(clientId, sendEvent);

    // Remove client when connection closes
    req.on('close', () => {
        if (global.waManager) {
            global.waManager.removeEventListener(clientId);
        }
    });
});

// إعادة تعيين البيانات
router.post('/reset', async (req, res) => {
    try {
        await WhatsAppManager.resetData();
        res.json({
            success: true,
            message: 'تم إعادة تعيين البيانات بنجاح',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error resetting WhatsApp data:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إعادة تعيين البيانات',
            error: error.message
        });
    }
});

// الحصول على الإحصائيات
router.get('/stats', (req, res) => {
    try {
        const stats = WhatsAppManager.getStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting WhatsApp stats:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في الحصول على الإحصائيات',
            error: error.message
        });
    }
});

module.exports = router; 