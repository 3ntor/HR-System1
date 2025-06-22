Write-Host "🚀 Starting HR System Backend..." -ForegroundColor Green
Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Cyan

# Set environment variables
$env:MONGODB_URI = "mongodb+srv://hrsystem:KUv0eSeiMJbXRNsl@hr-system.veyoe3q.mongodb.net/hr-system?retryWrites=true&w=majority&appName=HR-System"
$env:PORT = "5001"
$env:NODE_ENV = "development"
$env:JWT_SECRET = "hr_time_tracker_secret_key_2024_production_secure"
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "admin123456"

Write-Host "✅ Environment variables set:" -ForegroundColor Yellow
Write-Host "   MONGODB_URI: Set" -ForegroundColor Gray
Write-Host "   PORT: $env:PORT" -ForegroundColor Gray
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray
Write-Host "   JWT_SECRET: Set" -ForegroundColor Gray

Write-Host ""
Write-Host "🔌 Starting Backend Server on port $env:PORT..." -ForegroundColor Green
Write-Host "📊 Health check will be available at: http://localhost:$env:PORT/api/health" -ForegroundColor Cyan
Write-Host ""

# Start the server
try {
    node server.js
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
} 