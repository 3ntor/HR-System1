const http = require('http');

function detailedTest() {
  console.log('🔍 Detailed API Test for June 2025...\n');
  
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
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        
        if (jsonData.data?.records) {
          console.log('📊 All June 2025 Records:');
          console.log('Date\t\tDay\t\tHours\tSeconds\tStatus\t\tHasReal');
          console.log('='.repeat(80));
          
          jsonData.data.records.forEach((record, index) => {
            const date = record.date.substring(0, 10);
            const day = record.day || 'N/A';
            const hours = record.totalHours || 0;
            const seconds = record.totalSeconds || 0;
            const status = record.status || 'N/A';
            const hasReal = record.hasRealData ? 'YES' : 'NO';
            
            console.log(`${date}\t${day.substring(0, 8)}\t${hours}h\t${seconds}s\t${status.substring(0, 12)}\t${hasReal}`);
          });
          
          // Summary
          const recordsWithHours = jsonData.data.records.filter(r => r.totalHours > 0);
          const recordsWithSeconds = jsonData.data.records.filter(r => r.totalSeconds > 0);
          const recordsWithRealFlag = jsonData.data.records.filter(r => r.hasRealData);
          
          console.log('\n📈 Summary:');
          console.log(`Total Records: ${jsonData.data.records.length}`);
          console.log(`Records with Hours > 0: ${recordsWithHours.length}`);
          console.log(`Records with Seconds > 0: ${recordsWithSeconds.length}`);
          console.log(`Records with hasRealData flag: ${recordsWithRealFlag.length}`);
          
          if (recordsWithHours.length > 0) {
            console.log('\n🎯 Records with Actual Hours:');
            recordsWithHours.forEach(record => {
              console.log(`  ${record.date}: ${record.totalHours}h (${record.totalSeconds}s) - ${record.status}`);
            });
          }
          
          if (recordsWithSeconds.length > 0) {
            console.log('\n⏱️ Records with Actual Seconds:');
            recordsWithSeconds.forEach(record => {
              console.log(`  ${record.date}: ${record.totalSeconds}s (${record.totalHours}h) - ${record.status}`);
            });
          }
        }
        
      } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

detailedTest(); 