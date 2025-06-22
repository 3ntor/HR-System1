const fs = require('fs');
const path = require('path');

console.log('⚙️ أداة تغيير إعدادات توقيت لقطات الشاشة');
console.log('');

// قراءة الإعدادات الحالية
function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'screenshot-config.json');
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
        return null;
    } catch (error) {
        console.error('❌ خطأ في قراءة الإعدادات:', error.message);
        return null;
    }
}

// حفظ الإعدادات
function saveConfig(config) {
    try {
        const configPath = path.join(__dirname, 'screenshot-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ الإعدادات:', error.message);
        return false;
    }
}

// عرض الإعدادات الحالية
function displayCurrentSettings() {
    const config = loadConfig();
    if (!config) {
        console.log('❌ لم يتم العثور على ملف الإعدادات');
        return;
    }

    const options = config.capture.timerOptions;
    console.log('📋 الإعدادات الحالية:');
    console.log(`   - الإعداد النشط: ${options.currentPreset}`);
    console.log(`   - استخدام فترة مخصصة: ${options.useCustom ? 'نعم' : 'لا'}`);
    
    if (options.useCustom) {
        console.log(`   - الفترة المخصصة: ${options.customInterval / 1000} ثانية`);
    } else {
        const preset = options.presets[options.currentPreset];
        if (preset) {
            console.log(`   - ${preset.name}: ${preset.interval / 1000} ثانية`);
        }
    }
    console.log('');
}

// عرض جميع الخيارات المتاحة
function displayAvailablePresets() {
    const config = loadConfig();
    if (!config || !config.capture.timerOptions.presets) {
        console.log('❌ لا توجد إعدادات متوفرة');
        return;
    }

    console.log('📝 الخيارات المتاحة:');
    Object.entries(config.capture.timerOptions.presets).forEach(([key, preset]) => {
        const minutes = Math.floor(preset.interval / 60000);
        const seconds = Math.floor((preset.interval % 60000) / 1000);
        console.log(`   ${key}: ${preset.name} - ${minutes > 0 ? minutes + ' دقيقة' : ''} ${seconds > 0 ? seconds + ' ثانية' : ''}`);
    });
    console.log('   custom: فترة مخصصة (بالثواني)');
    console.log('');
}

// تغيير الإعداد
function changePreset(newPreset) {
    const config = loadConfig();
    if (!config) {
        console.log('❌ لم يتم العثور على ملف الإعدادات');
        return false;
    }

    if (newPreset === 'custom') {
        // طلب الفترة المخصصة
        const customSeconds = parseInt(process.argv[3]);
        if (!customSeconds || customSeconds < 10) {
            console.log('❌ يرجى تحديد عدد الثواني (أقل شيء 10 ثوان)');
            console.log('مثال: node change-screenshot-timer.js custom 120');
            return false;
        }

        config.capture.timerOptions.useCustom = true;
        config.capture.timerOptions.customInterval = customSeconds * 1000;
        config.capture.timerOptions.currentPreset = 'custom';
        
        console.log(`✅ تم تعيين فترة مخصصة: ${customSeconds} ثانية`);
    } else {
        // التحقق من وجود الإعداد
        if (!config.capture.timerOptions.presets[newPreset]) {
            console.log(`❌ الإعداد "${newPreset}" غير موجود`);
            displayAvailablePresets();
            return false;
        }

        config.capture.timerOptions.useCustom = false;
        config.capture.timerOptions.currentPreset = newPreset;
        
        const preset = config.capture.timerOptions.presets[newPreset];
        console.log(`✅ تم تعيين إعداد: ${preset.name}`);
    }

    // حفظ الإعدادات
    if (saveConfig(config)) {
        console.log('💾 تم حفظ الإعدادات بنجاح');
        console.log('🔄 يرجى إعادة تشغيل التطبيق لتطبيق التغييرات');
        return true;
    } else {
        console.log('❌ فشل في حفظ الإعدادات');
        return false;
    }
}

// تشغيل الأداة
function main() {
    const command = process.argv[2];

    if (!command) {
        console.log('🔧 كيفية الاستخدام:');
        console.log('');
        console.log('   عرض الإعدادات الحالية:');
        console.log('   node change-screenshot-timer.js current');
        console.log('');
        console.log('   عرض جميع الخيارات:');
        console.log('   node change-screenshot-timer.js list');
        console.log('');
        console.log('   تغيير الإعداد:');
        console.log('   node change-screenshot-timer.js very_fast');
        console.log('   node change-screenshot-timer.js fast');
        console.log('   node change-screenshot-timer.js normal');
        console.log('   node change-screenshot-timer.js medium');
        console.log('   node change-screenshot-timer.js slow');
        console.log('   node change-screenshot-timer.js very_slow');
        console.log('');
        console.log('   تعيين فترة مخصصة:');
        console.log('   node change-screenshot-timer.js custom 120  (كل 120 ثانية)');
        console.log('');
        return;
    }

    switch (command) {
        case 'current':
            displayCurrentSettings();
            break;
        case 'list':
            displayAvailablePresets();
            break;
        case 'very_fast':
        case 'fast':
        case 'normal':
        case 'medium':
        case 'slow':
        case 'very_slow':
        case 'custom':
            changePreset(command);
            break;
        default:
            console.log(`❌ أمر غير معروف: ${command}`);
            console.log('استخدم: node change-screenshot-timer.js للحصول على المساعدة');
    }
}

// تشغيل الأداة
main(); 