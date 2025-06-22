import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// تنسيق الأرقام بالإنجليزية
export function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number)
}

// تنسيق العملة بالأرقام الإنجليزية - الجنيه المصري
export function formatCurrency(amount, currency = 'EGP') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount).replace('EGP', 'ج.م').replace('SAR', 'ج.م')
}

// تنسيق التاريخ بالأرقام الإنجليزية
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date))
}

// تنسيق التاريخ المختصر بالأرقام الإنجليزية
export function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date))
}

// تحويل النص لأرقام إنجليزية
export function toEnglishDigits(str) {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
  const englishDigits = '0123456789'
  
  return str.replace(/[٠-٩]/g, (match) => {
    return englishDigits[arabicDigits.indexOf(match)]
  })
}

// تحويل النص لأرقام عربية (مع الإبقاء على الدالة للتوافق العكسي)
export function toArabicDigits(str) {
  // تم تعطيل التحويل - سيتم إرجاع الأرقام الإنجليزية
  return str.toString()
}

// دالة لحساب الإجمالي
export function calculateTotal(items, field) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0)
}

// دالة للبحث في النصوص العربية
export function searchArabicText(text, searchTerm) {
  if (!text || !searchTerm) return false
  
  const normalizedText = text.toLowerCase().trim()
  const normalizedSearch = searchTerm.toLowerCase().trim()
  
  return normalizedText.includes(normalizedSearch)
} 