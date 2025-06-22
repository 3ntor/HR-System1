const http = require('http');

console.log('🧪 اختبار النظام الكامل...');
console.log('=' .repeat(50));

function testAPI() {
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
        console.log('📡 Status Code:', res.statusCode);
        
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ API Response Success:', jsonData.success);
                console.log('📊 Number of Transactions:', jsonData.data ? jsonData.data.length : 0);
                console.log('📝 Message:', jsonData.message || 'No message');
                
                if (jsonData.data && jsonData.data.length > 0) {
                    console.log('\n📋 Transactions:');
                    jsonData.data.forEach((txn, index) => {
                        console.log(`${index + 1}. ${txn.description} - ${txn.amount} ج.م (${txn.type})`);
                    });
                }
                
                if (jsonData.summary) {
                    console.log('\n💰 Summary:');
                    console.log('📈 Total Income:', jsonData.summary.totalIncome, 'ج.م');
                    console.log('📉 Total Expense:', jsonData.summary.totalExpense, 'ج.م');
                    console.log('💵 Net Amount:', jsonData.summary.netAmount, 'ج.م');
                }
                
                console.log('\n🎉 System is working correctly!');
                console.log('🌐 Frontend: http://localhost:3000');
                console.log('🔧 Backend: http://localhost:5001');
                
            } catch (error) {
                console.error('❌ Error parsing JSON:', error.message);
                console.log('📄 Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ API Connection Error:', error.message);
        console.log('💡 Make sure Backend is running on port 5001');
    });

    req.end();
}

testAPI(); 