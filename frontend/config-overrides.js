// تخصيص إعدادات webpack لتقليل التحذيرات
module.exports = function override(config, env) {
  if (env === 'development') {
    // تقليل التحذيرات في بيئة التطوير
    config.stats = {
      ...config.stats,
      warnings: false,
      warningsFilter: [
        /export .* was not found in/,
        /Critical dependency: the request of a dependency is an expression/,
        /Module not found: Error: Can't resolve/
      ]
    };

    // تحسين performance
    config.performance = {
      hints: false
    };

    // إخفاء source maps في التطوير لتحسين الأداء
    config.devtool = false;

    // تقليل verbosity في webpack dev server
    if (config.devServer) {
      config.devServer.clientLogLevel = 'silent';
      config.devServer.noInfo = true;
      config.devServer.quiet = true;
    }
  }

  return config;
}; 