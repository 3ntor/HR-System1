const http = require('http');

function testAPI() {
  console.log('🔍 Testing API data...\n');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/daily-attendance/user-records/68504d38cdbe5640cba5a489?month=2025-06',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGNvbXBhbnkuY29tIiwiaWF0IjoxNzUwNTMzOTAyLCJleHAiOjE3NTA2MjAzMDJ9.p5EyrWrUvwMR6z8XzhOU-PAa8tO-mzeRUHnKvMmX1EU',
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('📊 API Response:');
        console.log(`   Success: ${jsonData.success}`);
        console.log(`   Records Count: ${jsonData.data?.records?.length || 0}`);
        
        if (jsonData.data?.records) {
          const recordsWithHours = jsonData.data.records.filter(r => r.totalHours > 0);
          const recordsWithRealData = jsonData.data.records.filter(r => r.hasRealData);
          
          console.log(`   Records with hours > 0: ${recordsWithHours.length}`);
          console.log(`   Records with hasRealData: ${recordsWithRealData.length}`);
          
          // Show June 18th data specifically
          const june18 = jsonData.data.records.find(r => 
            r.date.includes('18/06/2025') || 
            r.date.includes('2025-06-18') ||
            r.date === '18/06/2025'
          );
          
          if (june18) {
            console.log('\n🎯 June 18th Data:');
            console.log(`   Date: ${june18.date}`);
            console.log(`   Total Hours: ${june18.totalHours}`);
            console.log(`   Active Hours: ${june18.activeHours}`);
            console.log(`   Total Seconds: ${june18.totalSeconds}`);
            console.log(`   Active Seconds: ${june18.activeSeconds}`);
            console.log(`   Status: ${june18.status}`);
            console.log(`   Has Real Data: ${june18.hasRealData}`);
          }
          
          // Show first 3 records for debugging
          console.log('\n📅 First 3 Records:');
          jsonData.data.records.slice(0, 3).forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.date}: ${record.totalHours}h (${record.status})`);
          });
        }
        
      } catch (error) {
        console.error('❌ Error parsing JSON:', error.message);
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

testAPI(); 