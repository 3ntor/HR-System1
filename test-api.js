const https = require('https');
const http = require('http');

console.log('🧪 اختبار API المعاملات...');
console.log('=' .repeat(50));

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/transactions',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('=' .repeat(50));
      console.log('📊 Response from API:');
      console.log('✅ Success:', jsonData.success);
      console.log('📝 Message:', jsonData.message || 'No message');
      console.log('📊 Data Count:', jsonData.data ? jsonData.data.length : 0);
      
      if (jsonData.data && jsonData.data.length > 0) {
        console.log('📋 First Transaction:');
        console.log('   - Description:', jsonData.data[0].description);
        console.log('   - Amount:', jsonData.data[0].amount);
        console.log('   - Type:', jsonData.data[0].type);
        console.log('   - Date:', jsonData.data[0].date);
      }
      
      if (jsonData.summary) {
        console.log('💰 Summary:');
        console.log('   - Total Income:', jsonData.summary.totalIncome);
        console.log('   - Total Expense:', jsonData.summary.totalExpense);
        console.log('   - Net Amount:', jsonData.summary.netAmount);
      }
      
      console.log('=' .repeat(50));
      
    } catch (error) {
      console.error('❌ Error parsing JSON:', error.message);
      console.log('📄 Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end(); 