const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const sendError = require('../utils/sendError');
const Employee = require('../models/Employee');
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const Attendance = require('../models/Attendance');
const DailyAttendance = require('../models/DailyAttendance');
const Payroll = require('../models/Payroll');

// GET dashboard statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      totalTransactions,
      totalClients,
      pendingEmployees,
      todayAttendance
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: { $in: ['فعال', 'active'] } }),
      Transaction.countDocuments(),
      Client.countDocuments(),
      Employee.countDocuments({ approvalStatus: 'pending' }),
      Attendance.countDocuments({ 
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    // Calculate total revenue
    const revenueResult = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Calculate total expenses
    const expenseResult = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

    const stats = {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        pending: pendingEmployees,
        inactive: totalEmployees - activeEmployees
      },
      financial: {
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses
      },
      operations: {
        totalTransactions,
        totalClients,
        todayAttendance
      },
      attendance: {
        present: todayAttendance,
        absent: activeEmployees - todayAttendance,
        attendanceRate: activeEmployees > 0 ? Math.round(todayAttendance / activeEmployees * 100) : 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    sendError(res, 500, 'خطأ في جلب إحصائيات النظام', 'INTERNAL_ERROR', err.message);
  }
});

// GET recent activities
router.get('/activities', requireAuth, async (req, res) => {
  try {
    const activities = [];

    // Recent employee registrations
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt approvalStatus');

    recentEmployees.forEach(emp => {
      activities.push({
        type: 'employee_registration',
        description: `تم تسجيل موظف جديد: ${emp.name}`,
        timestamp: emp.createdAt,
        status: emp.approvalStatus
      });
    });

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('description amount type createdAt');

    recentTransactions.forEach(trans => {
      activities.push({
        type: 'transaction',
        description: `معاملة جديدة: ${trans.description}`,
        amount: trans.amount,
        transactionType: trans.type,
        timestamp: trans.createdAt
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, 10) // Return top 10 recent activities
    });
  } catch (err) {
    console.error('Dashboard activities error:', err);
    sendError(res, 500, 'خطأ في جلب الأنشطة الأخيرة', 'INTERNAL_ERROR', err.message);
  }
});

// GET analytics data for charts
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    // Get monthly financial data for the past 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyData = [];
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    for (let i = 0; i < 6; i++) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0);
      
      const [incomeTotal, expenseTotal, salariesTotal] = await Promise.all([
        Transaction.aggregate([
          { 
            $match: { 
              type: 'income',
              date: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { 
            $match: { 
              type: 'expense',
              category: { $ne: 'رواتب' },
              date: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payroll.aggregate([
          { 
            $match: { 
              payrollDate: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$netSalary' } } }
        ])
      ]);
      
      monthlyData.push({
        name: monthNames[startDate.getMonth()],
        income: incomeTotal.length > 0 ? incomeTotal[0].total : 0,
        expenses: expenseTotal.length > 0 ? expenseTotal[0].total : 0,
        salaries: salariesTotal.length > 0 ? salariesTotal[0].total : 0
      });
    }
    
    // Get expense categories
    const expenseCategories = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);
    
    const formattedExpenseCategories = expenseCategories.map((cat, index) => ({
      name: cat._id || 'أخرى',
      value: cat.value,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index] || '#6b7280'
    }));
    
    // Get quick stats
    const [avgSalaryResult, totalBonusesResult, attendanceData] = await Promise.all([
      Payroll.aggregate([
        { $group: { _id: null, avgSalary: { $avg: '$netSalary' } } }
      ]),
      Payroll.aggregate([
        { $group: { _id: null, totalBonuses: { $sum: '$bonuses' } } }
      ]),
      DailyAttendance.countDocuments({
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: now
        },
        status: 'present'
      })
    ]);
    
    const totalEmployees = await Employee.countDocuments({ status: { $in: ['فعال', 'active'] } });
    const workingDays = Math.floor((now - new Date(now.getFullYear(), now.getMonth(), 1)) / (1000 * 60 * 60 * 24)) + 1;
    
    const quickStats = {
      avgSalary: Math.round(avgSalaryResult.length > 0 ? avgSalaryResult[0].avgSalary : 0),
      monthlyGrowth: 0, // This would need historical data to calculate
      totalBonuses: totalBonusesResult.length > 0 ? totalBonusesResult[0].totalBonuses : 0,
      attendanceRate: totalEmployees > 0 ? Math.round((attendanceData / (totalEmployees * workingDays)) * 100) : 0
    };
    
    res.json({
      success: true,
      data: {
        monthlyData,
        expenseCategories: formattedExpenseCategories,
        quickStats
      }
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    sendError(res, 500, 'خطأ في جلب بيانات التحليل', 'INTERNAL_ERROR', err.message);
  }
});

// GET active employees (currently present)
router.get('/active-employees', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get employees with today's attendance
    const activeEmployees = await Employee.aggregate([
      {
        $match: { 
          status: { $in: ['فعال', 'active'] }
        }
      },
      {
        $lookup: {
          from: 'dailyattendances',
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$employee', '$$empId'] },
                date: { $gte: today }
              }
            }
          ],
          as: 'attendance'
        }
      },
      {
        $addFields: {
          todayAttendance: { $arrayElemAt: ['$attendance', 0] },
          status: {
            $cond: {
              if: { $gt: [{ $size: '$attendance' }, 0] },
              then: 'حاضر',
              else: 'غائب'
            }
          }
        }
      },
      {
        $match: { status: 'حاضر' } // Only return present employees
      },
      {
        $project: {
          name: 1,
          position: 1,
          department: 1,
          status: 1,
          location: 'المكتب', // Default location
          workingHours: { $ifNull: ['$todayAttendance.totalHours', 0] },
          checkInTime: { $ifNull: ['$todayAttendance.checkInTime', ''] }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: activeEmployees
    });
  } catch (err) {
    console.error('Active employees error:', err);
    sendError(res, 500, 'خطأ في جلب بيانات الموظفين النشطين', 'INTERNAL_ERROR', err.message);
  }
});

module.exports = router; 