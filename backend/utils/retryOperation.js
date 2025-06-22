/**
 * دالة لإعادة محاولة العمليات الحرجة
 * @param {Function} operation - الدالة المراد تنفيذها
 * @param {number} maxRetries - عدد المحاولات الأقصى
 * @param {number} baseDelay - التأخير الأساسي بين المحاولات (بالمللي ثانية)
 * @param {Function} onRetry - دالة تنفذ عند كل محاولة إعادة
 */
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000, onRetry = null) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // تسجيل محاولة الإعادة
      console.warn(`Retry attempt ${attempt}/${maxRetries}:`, {
        error: error.message,
        operation: operation.name || 'anonymous',
        timestamp: new Date().toISOString()
      });
      
      // استدعاء دالة onRetry إذا تم توفيرها
      if (onRetry) {
        await onRetry(attempt, error);
      }
      
      // إذا كانت هذه آخر محاولة، نرمي الخطأ
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts. Last error: ${error.message}`);
      }
      
      // انتظار قبل المحاولة التالية مع زيادة تدريجية في وقت الانتظار
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = retryOperation; 