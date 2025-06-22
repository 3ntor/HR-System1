const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 إعادة تشغيل نظام لقطات الشاشة المحدث...');
console.log('');

// إيقاف العمليات الجارية
process.on('SIGINT', () => {
    console.log('\n⏹️ تم إيقاف التطبيق');
    process.exit(0);
});

// إعادة تشغيل التطبيق
try {
    console.log('📱 بدء تشغيل التطبيق مع إصلاح لقطات الشاشة...');
    
    const electronProcess = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });
    
    electronProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل التطبيق:', error.message);
    });
    
    electronProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`⚠️ التطبيق توقف برمز: ${code}`);
        } else {
            console.log('✅ تم إغلاق التطبيق بنجاح');
        }
    });
    
} catch (error) {
    console.error('❌ خطأ في إعادة التشغيل:', error.message);
    console.log('💡 يرجى تشغيل الأمر يدوياً: npm start');
} 