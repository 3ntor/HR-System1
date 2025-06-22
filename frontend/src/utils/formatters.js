// Formatters utility functions with English numbers - Egyptian Locale

export const formatArabicNumber = (number) => {
  // تم تعطيل تحويل الأرقام العربية - سيتم استخدام الأرقام الإنجليزية
  return number.toString();
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP', // الجنيه المصري
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('EGP', 'ج.م'); // استبدال رمز العملة بالنص العربي المصري
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
};

export const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
};

export const formatPercentage = (value) => {
  const number = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(number)) return '0%';
  return `${Math.round(number)}%`;
};

// دالة لتنسيق الأرقام العادية بالأرقام الإنجليزية
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

// تنسيق الأرقام العشرية (حد أقصى منزلة واحدة)
export const formatDecimal = (value, maxDecimals = 1) => {
  const number = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(number)) return '0';
  return Math.round(number * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
};

export const searchArabicText = (text, searchTerm) => {
  if (!searchTerm) return true;
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  return normalizedText.includes(normalizedSearch);
}; 