/**
 * Egyptian Phone Number Formatter
 * تنسيق الأرقام المصرية للاستخدام مع WhatsApp
 */

/**
 * تنسيق رقم الهاتف المصري للتنسيق الدولي
 * @param {string} phoneNumber - الرقم المصري (مثال: 01016772118)
 * @returns {string} - الرقم بالتنسيق الدولي (مثال: 201016772118)
 */
export const formatEgyptianPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // إزالة المسافات والرموز الخاصة
    let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    
    // إزالة رمز البلد إذا كان موجوداً مسبقاً
    if (cleaned.startsWith('+20')) {
        cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('20')) {
        cleaned = cleaned.substring(2);
    }
    
    // إزالة الصفر الأول إذا كان موجوداً
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // التحقق من صحة الرقم المصري
    if (!isValidEgyptianMobile(cleaned)) {
        throw new Error(`رقم الهاتف المصري غير صحيح: ${phoneNumber}`);
    }
    
    // إضافة رمز البلد المصري
    return '20' + cleaned;
};

/**
 * تحقق من صحة رقم الهاتف المصري
 * @param {string} phoneNumber - الرقم بدون رمز البلد والصفر الأول
 * @returns {boolean} - هل الرقم صحيح أم لا
 */
export const isValidEgyptianMobile = (phoneNumber) => {
    // أرقام الهواتف المحمولة المصرية تبدأ بـ:
    // 10, 11, 12, 15 (بعد إزالة الصفر الأول)
    const mobilePatterns = [
        /^10\d{8}$/, // Vodafone (010)
        /^11\d{8}$/, // Etisalat (011)
        /^12\d{8}$/, // Orange (012)
        /^15\d{8}$/  // WE (015)
    ];
    
    return mobilePatterns.some(pattern => pattern.test(phoneNumber));
};

/**
 * تنسيق الرقم للعرض بالتنسيق المصري المحلي
 * @param {string} phoneNumber - الرقم الدولي أو المحلي
 * @returns {string} - الرقم بالتنسيق المحلي (مثال: 010 1677 2118)
 */
export const formatEgyptianPhoneDisplay = (phoneNumber) => {
    let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    
    // إزالة رمز البلد
    if (cleaned.startsWith('+20')) {
        cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('20')) {
        cleaned = cleaned.substring(2);
    }
    
    // إضافة الصفر إذا لم يكن موجوداً
    if (!cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
    }
    
    // تنسيق العرض: 010 1677 2118
    if (cleaned.length === 11) {
        return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 7)} ${cleaned.substring(7)}`;
    }
    
    return cleaned;
};

/**
 * دالة مساعدة لتنسيق قائمة أرقام مصرية
 * @param {Array<string>} phoneNumbers - قائمة الأرقام
 * @returns {Array<string>} - الأرقام مُنسقة للتنسيق الدولي
 */
export const formatEgyptianPhoneList = (phoneNumbers) => {
    return phoneNumbers.map(phone => {
        try {
            return formatEgyptianPhone(phone);
        } catch (error) {
            console.warn(`فشل في تنسيق الرقم: ${phone}`, error.message);
            return null;
        }
    }).filter(phone => phone !== null);
};

/**
 * استخراج الأرقام المصرية من نص
 * @param {string} text - النص المحتوي على أرقام
 * @returns {Array<string>} - الأرقام المستخرجة ومُنسقة
 */
export const extractEgyptianPhones = (text) => {
    // نمط للبحث عن أرقام الهواتف المصرية
    const phonePattern = /(?:\+20|20|0)?(1[0125]\d{8})/g;
    const matches = text.match(phonePattern) || [];
    
    return formatEgyptianPhoneList(matches);
};

/**
 * أرقام اختبار مصرية صالحة
 */
export const EGYPTIAN_TEST_NUMBERS = {
    KARIM_BAHRAWY: {
        name: 'كريم البحراوي',
        local: '01016772118',
        international: '201016772118',
        display: '010 1677 2118'
    },
    VODAFONE: {
        name: 'Vodafone Test',
        local: '01012345678',
        international: '201012345678',
        display: '010 1234 5678'
    },
    ETISALAT: {
        name: 'Etisalat Test', 
        local: '01123456789',
        international: '201123456789',
        display: '011 2345 6789'
    },
    ORANGE: {
        name: 'Orange Test',
        local: '01234567890',
        international: '201234567890',
        display: '012 3456 7890'
    },
    WE: {
        name: 'WE Test',
        local: '01534567890',
        international: '201534567890',
        display: '015 3456 7890'
    }
}; 