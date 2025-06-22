// تقليل التحذيرات في بيئة التطوير - إصدار محدث
if (process.env.NODE_ENV === 'development') {
  // حفظ الدوال الأصلية
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // تجاهل تحذيرات محددة من console.warn
  console.warn = (...args) => {
    if (
      args[0] && typeof args[0] === 'string' && (
        args[0].includes('React Router Future Flag Warning') ||
        args[0].includes('Download the React DevTools') ||
        args[0].includes('startTransition') ||
        args[0].includes('v7_') ||
        args[0].includes('react-dom.development.js') ||
        args[0].includes('scheduler.development.js') ||
        args[0].includes('Each child in a list should have a unique "key" prop') ||
        args[0].includes('validateDOMNesting') ||
        args[0].includes('Warning:') ||
        args[0].includes('printWarning') ||
        args[0].includes('scheduler') ||
        args[0].includes('react-dom') ||
        args[0].includes('reconciler') ||
        args[0].includes('Warning')
      )
    ) {
      return; // تجاهل هذه التحذيرات
    }
    originalWarn.apply(console, args);
  };

  // تجاهل أخطاء محددة من console.error
  console.error = (...args) => {
    if (
      args[0] && typeof args[0] === 'string' && (
        args[0].includes('Warning:') ||
        args[0].includes('validateDOMNesting') ||
        args[0].includes('scheduler.development.js') ||
        args[0].includes('react-dom.development.js') ||
        args[0].includes('reconciler') ||
        args[0].includes('printError')
      )
    ) {
      return; // تجاهل هذه الأخطاء
    }
    originalError.apply(console, args);
  };

  // تجاهل logs محددة 
  console.log = (...args) => {
    if (
      args[0] && typeof args[0] === 'string' && (
        args[0].includes('scheduler.development.js') ||
        args[0].includes('react-dom.development.js') ||
        args[0].includes('printWarning')
      )
    ) {
      return;
    }
    originalLog.apply(console, args);
  };

  // تحسين أداء React DevTools
  if (typeof window !== 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {
      isDisabled: false,
      supportsFiber: true,
      inject: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
    };
    
    // منع تحذيرات React DevTools
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE = () => {};
    
    // تقليل noise من React
    if (window.React) {
      window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
        ReactCurrentDispatcher: { current: null },
        ReactCurrentBatchConfig: { transition: null },
      };
    }
  }
}

export default function suppressWarnings() {
  // تم تنفيذ التحسينات عند استيراد هذا الملف
} 