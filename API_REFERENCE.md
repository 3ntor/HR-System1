# 📡 API Reference - نظام الموارد البشرية

## 🌐 Base URL
```
Local Development: http://localhost:5001
Production: https://your-domain.com/api
```

---

## 🔐 Authentication
```http
# Currently using simple session storage
# Future: JWT Bearer Token
Authorization: Bearer <token>
```

---

## 📊 **System Logs API**

### GET /api/logs
```http
GET /api/logs?page=1&limit=50&action=login

Response:
{
  "success": true,
  "data": [
    {
      "id": "log_001",
      "action": "user_login",
      "user": "admin",
      "details": "تسجيل دخول ناجح",
      "timestamp": "2024-12-01T10:00:00.000Z",
      "ip": "192.168.1.1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

### POST /api/logs
```http
POST /api/logs
Content-Type: application/json

Body:
{
  "action": "transaction_created",
  "user": "admin",
  "details": "تم إنشاء معاملة جديدة: 5000 جنيه"
}

Response:
{
  "success": true,
  "message": "تم إضافة السجل بنجاح",
  "data": {
    "id": "log_002",
    "timestamp": "2024-12-01T10:15:00.000Z"
  }
}
```

### GET /api/logs/stats
```http
GET /api/logs/stats

Response:
{
  "success": true,
  "data": {
    "totalLogs": 1250,
    "todayLogs": 45,
    "actionBreakdown": {
      "user_login": 230,
      "transaction_created": 180,
      "employee_added": 25
    },
    "userActivity": {
      "admin": 650,
      "employee1": 200
    }
  }
}
```

---

## 💰 **Transactions API**

### GET /api/transactions
```http
GET /api/transactions?type=income&status=approved&page=1&limit=20

Query Parameters:
- type: income|expense
- status: pending|approved|rejected
- category: string
- dateFrom: ISO date string
- dateTo: ISO date string
- page: number (default: 1)
- limit: number (default: 50)

Response:
{
  "success": true,
  "data": [
    {
      "id": "txn_001",
      "type": "income",
      "amount": 5000,
      "description": "استشارة تقنية لشركة ABC",
      "category": "consulting",
      "date": "2024-12-01T10:00:00.000Z",
      "status": "approved",
      "approvedBy": "admin",
      "approvedAt": "2024-12-01T11:00:00.000Z",
      "createdBy": "admin",
      "createdAt": "2024-12-01T10:00:00.000Z",
      "clientId": "client_001",
      "attachments": ["invoice_001.pdf"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "summary": {
    "totalIncome": 45000,
    "totalExpense": 25000,
    "netAmount": 20000
  }
}
```

### POST /api/transactions
```http
POST /api/transactions
Content-Type: application/json

Body:
{
  "type": "income",
  "amount": 7500,
  "description": "تطوير موقع إلكتروني",
  "category": "web_development",
  "clientId": "client_002",
  "dueDate": "2024-12-15T00:00:00.000Z",
  "notes": "دفعة أولى من المشروع"
}

Response:
{
  "success": true,
  "message": "تم إضافة المعاملة بنجاح",
  "data": {
    "id": "txn_002",
    "type": "income",
    "amount": 7500,
    "description": "تطوير موقع إلكتروني",
    "category": "web_development",
    "date": "2024-12-01T12:00:00.000Z",
    "status": "pending",
    "createdBy": "admin",
    "createdAt": "2024-12-01T12:00:00.000Z",
    "clientId": "client_002"
  }
}
```

### PUT /api/transactions/:id
```http
PUT /api/transactions/txn_002
Content-Type: application/json

Body:
{
  "amount": 8000,
  "description": "تطوير موقع إلكتروني - محدث",
  "status": "approved"
}

Response:
{
  "success": true,
  "message": "تم تحديث المعاملة بنجاح",
  "data": {
    "id": "txn_002",
    "amount": 8000,
    "description": "تطوير موقع إلكتروني - محدث",
    "status": "approved",
    "approvedBy": "admin",
    "approvedAt": "2024-12-01T12:30:00.000Z",
    "updatedAt": "2024-12-01T12:30:00.000Z"
  }
}
```

### DELETE /api/transactions/:id
```http
DELETE /api/transactions/txn_002

Response:
{
  "success": true,
  "message": "تم حذف المعاملة بنجاح"
}
```

---

## 👥 **Employees API**

### GET /api/employees
```http
GET /api/employees?department=IT&status=active&search=أحمد

Query Parameters:
- department: string
- status: active|inactive
- position: string
- search: string (name, email, phone)
- page: number
- limit: number

Response:
{
  "success": true,
  "data": [
    {
      "id": "emp_001",
      "employeeNumber": "HR2024001",
      "name": "أحمد محمد علي",
      "email": "ahmed@company.com",
      "phone": "201234567890",
      "department": "تقنية المعلومات",
      "position": "مطور برمجيات أول",
      "salary": 12000,
      "startDate": "2024-01-15T00:00:00.000Z",
      "status": "active",
      "bankAccount": "123456789",
      "nationalId": "12345678901234",
      "address": "القاهرة، مصر",
      "emergencyContact": {
        "name": "فاطمة أحمد",
        "phone": "201234567891",
        "relation": "زوجة"
      },
      "workSchedule": {
        "startTime": "09:00",
        "endTime": "17:00",
        "workDays": ["sunday", "monday", "tuesday", "wednesday", "thursday"]
      },
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25
  },
  "departments": [
    "تقنية المعلومات",
    "الموارد البشرية",
    "المحاسبة",
    "التسويق"
  ]
}
```

### POST /api/employees
```http
POST /api/employees
Content-Type: application/json

Body:
{
  "name": "سارة أحمد محمد",
  "email": "sara@company.com",
  "phone": "201234567892",
  "department": "الموارد البشرية",
  "position": "أخصائي موارد بشرية",
  "salary": 8500,
  "startDate": "2024-12-01T00:00:00.000Z",
  "bankAccount": "987654321",
  "nationalId": "12345678901235",
  "address": "الجيزة، مصر",
  "emergencyContact": {
    "name": "محمد أحمد",
    "phone": "201234567893",
    "relation": "أب"
  }
}

Response:
{
  "success": true,
  "message": "تم إضافة الموظف بنجاح",
  "data": {
    "id": "emp_002",
    "employeeNumber": "HR2024002",
    "name": "سارة أحمد محمد",
    "email": "sara@company.com",
    "phone": "201234567892",
    "department": "الموارد البشرية",
    "position": "أخصائي موارد بشرية",
    "salary": 8500,
    "status": "active",
    "createdAt": "2024-12-01T13:00:00.000Z"
  }
}
```

---

## 🤝 **Clients API**

### GET /api/clients
```http
GET /api/clients?search=شركة&sortBy=name

Response:
{
  "success": true,
  "data": [
    {
      "id": "client_001",
      "name": "شركة التكنولوجيا المتقدمة",
      "email": "info@techadvanced.com",
      "phone": "201234567890",
      "company": "Advanced Tech Solutions",
      "address": "القاهرة الجديدة، مصر",
      "contactPerson": "محمد أحمد الديب",
      "industry": "تكنولوجيا المعلومات",
      "totalProjects": 5,
      "totalPayments": 75000,
      "outstandingPayments": 15000,
      "status": "active",
      "contractStartDate": "2024-01-01T00:00:00.000Z",
      "notes": "عميل مميز - أولوية عالية",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-11-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/clients
```http
POST /api/clients
Content-Type: application/json

Body:
{
  "name": "مؤسسة النور للتجارة",
  "email": "info@alnoor.com",
  "phone": "201234567894",
  "company": "Al Noor Trading",
  "address": "الإسكندرية، مصر",
  "contactPerson": "فاطمة محمد علي",
  "industry": "تجارة التجزئة"
}

Response:
{
  "success": true,
  "message": "تم إضافة العميل بنجاح",
  "data": {
    "id": "client_002",
    "name": "مؤسسة النور للتجارة",
    "email": "info@alnoor.com",
    "phone": "201234567894",
    "status": "active",
    "totalProjects": 0,
    "totalPayments": 0,
    "createdAt": "2024-12-01T14:00:00.000Z"
  }
}
```

---

## 📱 **WhatsApp API**

### GET /api/whatsapp/status
```http
GET /api/whatsapp/status

Response:
{
  "success": true,
  "data": {
    "isConnected": true,
    "clientInfo": {
      "name": "HR System",
      "number": "201234567890",
      "platform": "web"
    },
    "lastSeen": "2024-12-01T14:30:00.000Z",
    "messagesSent": 145,
    "messagesReceived": 23
  }
}
```

### GET /api/whatsapp/qr
```http
GET /api/whatsapp/qr

Response:
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresAt": "2024-12-01T15:00:00.000Z"
  }
}
```

### POST /api/whatsapp/send
```http
POST /api/whatsapp/send
Content-Type: application/json

Body:
{
  "to": "201234567891",
  "message": "مرحباً، تم استلام راتبك الشهري. المبلغ: 8000 جنيه",
  "type": "text"
}

Response:
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح",
  "data": {
    "messageId": "msg_001",
    "to": "201234567891",
    "sentAt": "2024-12-01T15:00:00.000Z",
    "status": "sent"
  }
}
```

### POST /api/whatsapp/send-bulk
```http
POST /api/whatsapp/send-bulk
Content-Type: application/json

Body:
{
  "recipients": ["201234567891", "201234567892"],
  "message": "تذكير: اجتماع الفريق غداً الساعة 10 صباحاً",
  "type": "text"
}

Response:
{
  "success": true,
  "message": "تم إرسال الرسائل بنجاح",
  "data": {
    "totalRecipients": 2,
    "successfulSends": 2,
    "failedSends": 0,
    "results": [
      {
        "to": "201234567891",
        "status": "sent",
        "messageId": "msg_002"
      },
      {
        "to": "201234567892", 
        "status": "sent",
        "messageId": "msg_003"
      }
    ]
  }
}
```

---

## 📁 **File Upload API**

### POST /api/upload
```http
POST /api/upload
Content-Type: multipart/form-data

Body: FormData with file field

Response:
{
  "success": true,
  "message": "تم رفع الملف بنجاح",
  "data": {
    "filename": "invoice_20241201_001.pdf",
    "originalName": "فاتورة ديسمبر.pdf",
    "size": 245760,
    "mimetype": "application/pdf",
    "uploadedAt": "2024-12-01T15:30:00.000Z",
    "url": "/uploads/invoice_20241201_001.pdf"
  }
}
```

---

## ⚠️ **Error Responses**

### Standard Error Format:
```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "details": "تفاصيل إضافية عن الخطأ",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2024-12-01T15:45:00.000Z"
}
```

### Common Error Codes:
- `VALIDATION_ERROR` (400) - خطأ في التحقق من البيانات
- `UNAUTHORIZED` (401) - غير مصرح بالوصول
- `FORBIDDEN` (403) - محظور الوصول
- `NOT_FOUND` (404) - المورد غير موجود
- `CONFLICT` (409) - تضارب في البيانات
- `INTERNAL_ERROR` (500) - خطأ داخلي في الخادم

---

## 📊 **Response Pagination**

### Standard Pagination Format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

---

## 🔍 **Search & Filter Examples**

### Advanced Filtering:
```http
GET /api/transactions?type=income&amount_gte=1000&amount_lte=10000&date_gte=2024-01-01&date_lte=2024-12-31

GET /api/employees?department_in=IT,HR&salary_gte=5000&status=active

GET /api/clients?industry=تكنولوجيا&total_payments_gte=50000
```

### Search Examples:
```http
GET /api/employees?search=أحمد&searchFields=name,email,phone

GET /api/transactions?search=استشارة&searchFields=description,category

GET /api/clients?search=شركة&searchFields=name,company
```

---

**📝 ملاحظة**: جميع التواريخ بصيغة ISO 8601 والعملة بالجنيه المصري 