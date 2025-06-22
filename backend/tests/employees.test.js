/**
 * اختبارات نظام الموظفين
 * هذه الاختبارات تستخدم للتأكد من عمل النظام بشكل صحيح
 * يمكن تشغيلها باستخدام: npm test
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const employeesRoute = require('../routes/employees');
const Employee = require('../models/Employee');

// إعداد التطبيق للاختبار
const app = express();
app.use(express.json());
app.use('/api/employees', employeesRoute);

// بيانات اختبارية
const testEmployee = {
  name: "أحمد محمد",
  position: "مطور برمجيات",
  department: "تكنولوجيا المعلومات",
  salary: 5000,
  email: "ahmed@example.com",
  phone: "0123456789",
  hireDate: new Date(),
  status: "active"
};

describe('Employees API', () => {
  // قبل كل اختبار
  beforeEach(async () => {
    // مسح قاعدة البيانات
    await Employee.deleteMany({});
  });

  // بعد كل اختبار
  afterEach(async () => {
    // مسح قاعدة البيانات
    await Employee.deleteMany({});
  });

  // اختبار الحصول على قائمة الموظفين
  it('GET /api/employees should return empty array when no employees', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  // اختبار إضافة موظف جديد
  it('POST /api/employees should create new employee', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send(testEmployee);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(testEmployee.name);
    expect(res.body.data.position).toBe(testEmployee.position);
  });

  // اختبار الحصول على موظف محدد
  it('GET /api/employees/:id should return specific employee', async () => {
    // إضافة موظف أولاً
    const employee = await Employee.create(testEmployee);
    
    const res = await request(app).get(`/api/employees/${employee._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(testEmployee.name);
  });

  // اختبار تحديث بيانات موظف
  it('PUT /api/employees/:id should update employee', async () => {
    // إضافة موظف أولاً
    const employee = await Employee.create(testEmployee);
    
    const updatedData = {
      name: "محمد أحمد",
      salary: 6000
    };

    const res = await request(app)
      .put(`/api/employees/${employee._id}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(updatedData.name);
    expect(res.body.data.salary).toBe(updatedData.salary);
  });

  // اختبار حذف موظف
  it('DELETE /api/employees/:id should delete employee', async () => {
    // إضافة موظف أولاً
    const employee = await Employee.create(testEmployee);
    
    const res = await request(app).delete(`/api/employees/${employee._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // التأكد من حذف الموظف
    const deletedEmployee = await Employee.findById(employee._id);
    expect(deletedEmployee).toBeNull();
  });

  // اختبار حساب راتب الموظف
  it('GET /api/employees/:id/salary should calculate employee salary', async () => {
    // إضافة موظف مع ساعات عمل
    const employee = await Employee.create({
      ...testEmployee,
      attendance: [
        { date: new Date(), hours: 8 }, // يوم عادي
        { date: new Date(), hours: 9 }, // ساعة إضافية
        { date: new Date(), hours: 7 }  // ساعة أقل
      ]
    });

    const res = await request(app).get(`/api/employees/${employee._id}/salary`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('basicSalary');
    expect(res.body.data).toHaveProperty('overtime');
    expect(res.body.data).toHaveProperty('total');
  });

  // اختبار التحقق من صحة البيانات
  it('POST /api/employees should validate required fields', async () => {
    const invalidEmployee = {
      name: "أحمد", // فقط الاسم بدون باقي البيانات المطلوبة
    };

    const res = await request(app)
      .post('/api/employees')
      .send(invalidEmployee);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // اختبار البحث عن موظفين
  it('GET /api/employees/search should find employees by criteria', async () => {
    // إضافة عدة موظفين
    await Employee.create(testEmployee);
    await Employee.create({
      ...testEmployee,
      name: "محمد علي",
      position: "مصمم"
    });

    const res = await request(app)
      .get('/api/employees/search')
      .query({ position: "مطور" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].position).toBe("مطور برمجيات");
  });
}); 