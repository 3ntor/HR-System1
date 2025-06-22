const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API Proxy - توجيه جميع طلبات /api إلى المنفذ 5001
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug', // تفعيل التسجيل للتتبع
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying request:', req.method, req.url, '-> http://localhost:5001' + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message, req.url);
      }
    })
  );

  // تقليل التحذيرات في بيئة التطوير
  if (process.env.NODE_ENV === 'development') {
    // إخفاء بعض console logs من webpack dev server
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      if (args[0] && typeof args[0] === 'string') {
        if (
          args[0].includes('webpack') ||
          args[0].includes('HMR') ||
          args[0].includes('hot-dev-server') ||
          args[0].includes('sockjs-node')
        ) {
          return;
        }
      }
      return originalConsoleWarn.apply(console, arguments);
    };
  }
}; 