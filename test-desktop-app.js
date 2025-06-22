const { io } = require('socket.io-client');

console.log('🖥️ محاكاة التطبيق المكتبي...');

const userId = '6850332a7f1d1ba42a526370';
const socket = io('http://localhost:5001');

socket.on('connect', () => {
    console.log('✅ متصل بالخادم:', socket.id);
    
    // تسجيل التطبيق المكتبي
    socket.emit('register-desktop-app', {
        userId: userId,
        userInfo: { 
            name: 'أحمد تيسير', 
            username: 'ahmedte' 
        }
    });
    
    console.log('📱 تم تسجيل التطبيق المكتبي للمستخدم:', userId);
});

socket.on('disconnect', () => {
    console.log('❌ انقطع الاتصال');
});

socket.on('remote-command', (data) => {
    const { command, payload } = data;
    console.log('📡 تم استلام أمر:', command, payload);
    
    // محاكاة تنفيذ الأمر
    setTimeout(() => {
        socket.emit('desktop-app-response', {
            userId: userId,
            command: command,
            success: true,
            payload: { 
                message: `تم تنفيذ ${command} بنجاح`, 
                timestamp: new Date().toISOString() 
            }
        });
        console.log('✅ تم إرسال تأكيد تنفيذ الأمر');
    }, 1000);
});

socket.on('connect_error', (error) => {
    console.log('❌ خطأ في الاتصال:', error.message);
});

console.log('🔄 التطبيق المكتبي يعمل... اضغط Ctrl+C للإيقاف');

// إبقاء التطبيق يعمل
process.on('SIGINT', () => {
    console.log('\n🔚 إيقاف التطبيق المكتبي...');
    socket.disconnect();
    process.exit(0);
}); 