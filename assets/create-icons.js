const fs = require('fs');
const path = require('path');

// إنشاء أيقونة SVG بسيطة
const iconSVG = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- خلفية دائرية -->
  <circle cx="128" cy="128" r="120" fill="url(#grad1)" stroke="#fff" stroke-width="8"/>
  
  <!-- أيقونة الساعة -->
  <circle cx="128" cy="128" r="80" fill="none" stroke="#fff" stroke-width="6"/>
  
  <!-- عقارب الساعة -->
  <line x1="128" y1="128" x2="128" y2="80" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
  <line x1="128" y1="128" x2="160" y2="128" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  
  <!-- نقطة المركز -->
  <circle cx="128" cy="128" r="8" fill="#fff"/>
  
  <!-- علامات الساعة -->
  <circle cx="128" cy="60" r="4" fill="#fff"/>
  <circle cx="128" cy="196" r="4" fill="#fff"/>
  <circle cx="60" cy="128" r="4" fill="#fff"/>
  <circle cx="196" cy="128" r="4" fill="#fff"/>
</svg>
`;

// إنشاء أيقونة tray أصغر
const trayIconSVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <circle cx="16" cy="16" r="14" fill="url(#grad2)"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="#fff" stroke-width="2"/>
  <line x1="16" y1="16" x2="16" y2="8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="22" y2="16" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2" fill="#fff"/>
</svg>
`;

// حفظ الأيقونات
fs.writeFileSync(path.join(__dirname, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(__dirname, 'tray-icon.svg'), trayIconSVG);

console.log('✅ Icons created successfully!');
console.log('📁 Files created:');
console.log('  - assets/icon.svg');
console.log('  - assets/tray-icon.svg');
console.log('');
console.log('💡 To convert to PNG format, you can use online converters or tools like:');
console.log('  - https://convertio.co/svg-png/');
console.log('  - ImageMagick: convert icon.svg icon.png'); 