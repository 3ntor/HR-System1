const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Atlas Connection...');
console.log('📍 Current directory:', __dirname);

// Connection string
const MONGODB_URI = 'mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System';

console.log('🔗 Connection URI configured');
console.log('📡 Attempting to connect to MongoDB Atlas...');

async function testConnection() {
    try {
        console.log('⏳ Connecting...');
        
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📊 Database Host: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        console.log(`📊 Connection State: ${conn.connection.readyState}`);
        
        // Test a simple operation
        const collections = await conn.connection.db.listCollections().toArray();
        console.log(`📊 Available Collections: ${collections.length}`);
        
        console.log('🎉 Database connection test SUCCESSFUL!');
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('🔧 Error details:', error);
    } finally {
        console.log('🔌 Closing connection...');
        await mongoose.disconnect();
        console.log('✅ Connection closed');
        process.exit(0);
    }
}

testConnection(); 