import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatCurrency, formatDate } from '../utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle, Eye, Download, Calendar, UserCheck, Clock, MapPin, Wifi, Phone, Mail } from 'lucide-react'
import { employeeService, transactionService } from '../services/api'
import api from '../services/api'

const DashboardPage = () => {
  // بيانات الداشبورد الفعلية (ستربط لاحقًا بالباك إند)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalEmployees: 0,
    pendingPayrolls: 0,
    revenueChange: 0,
    expensesChange: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // بيانات الموظفين النشطين
  const [activeEmployees, setActiveEmployees] = useState([]);
  useEffect(() => {
    const fetchActiveEmployees = async () => {
      try {
        const response = await employeeService.getAll();
        // فلترة الموظفين النشطين فقط
        const actives = (response.data || response).filter(emp => emp.status === 'active');
        setActiveEmployees(actives);
      } catch (error) {
        // يمكنك إضافة إشعار أو رسالة خطأ هنا
      }
    };
    fetchActiveEmployees();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب البيانات الحقيقية من الخادم
        const [statsResponse, employeesResponse, transactionsResponse, analyticsResponse] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/active-employees'),
          api.get('/api/transactions/recent'),
          api.get('/api/dashboard/analytics')
        ]);

        // تحديث الإحصائيات الرئيسية
        const statsData = statsResponse.data?.data || {};
        setStats({
          totalRevenue: statsData.financial?.totalRevenue || 0,
          totalExpenses: statsData.financial?.totalExpenses || 0,
          totalEmployees: statsData.employees?.total || 0,
          pendingPayrolls: statsData.employees?.pending || 0,
          revenueChange: 0, // Would need historical data
          expensesChange: 0  // Would need historical data
        });
        
        // تحديث الموظفين النشطين
        setActiveEmployees(employeesResponse.data?.data || []);
        
        // تحديث المعاملات الحديثة
        setRecentTransactions(transactionsResponse.data?.data || []);
        
        // تحديث بيانات الرسوم البيانية
        if (analyticsResponse.data?.data) {
          setMonthlyData(analyticsResponse.data.data.monthlyData || []);
          setExpenseCategories(analyticsResponse.data.data.expenseCategories || []);
          setQuickStats(analyticsResponse.data.data.quickStats || {});
        }

      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        
        // في حالة فشل الاتصال، عرض قيم فارغة
        setStats({
          totalRevenue: 0,
          totalExpenses: 0,
          totalEmployees: 0,
          pendingPayrolls: 0,
          revenueChange: 0,
          expensesChange: 0
        });
        
        // عرض قوائم فارغة للموظفين والمعاملات
        setActiveEmployees([]);
        setRecentTransactions([]);
        setMonthlyData([]);
        setExpenseCategories([]);
        setQuickStats({
          avgSalary: 0,
          monthlyGrowth: 0,
          totalBonuses: 0,
          attendanceRate: 0
        });
      }
    };
    
    fetchData();
  }, []);

  // إحصائيات سريعة (ملخص الأداء المالي)
  const [quickStats, setQuickStats] = useState({
    avgSalary: 0,
    monthlyGrowth: 0,
    totalBonuses: 0,
    attendanceRate: 0
  });

  const StatCard = ({ title, value, change, icon: Icon, positive }) => (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {value}
        </div>
        {change && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${
            positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}% من الشهر الماضي
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/50 dark:border-gray-600/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">لوحة التحكم</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">نظرة شاملة على الوضع المالي</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 text-sm sm:text-base rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">تقرير شهري</span>
              <span className="sm:hidden">تقرير</span>
            </Button>
            <Button className="gap-2 text-sm sm:text-base rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير البيانات</span>
              <span className="sm:hidden">تصدير</span>
            </Button>
          </div>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          icon={DollarSign}
          positive={stats.revenueChange > 0}
        />
        <StatCard
          title="إجمالي المصروفات"
          value={formatCurrency(stats.totalExpenses)}
          change={stats.expensesChange}
          icon={TrendingDown}
          positive={stats.expensesChange < 0}
        />
        <StatCard
          title="عدد الموظفين"
          value={stats.totalEmployees}
          icon={Users}
        />
        <StatCard
          title="رواتب معلقة"
          value={stats.pendingPayrolls}
          icon={AlertTriangle}
        />
      </div>

      {/* الموظفين النشطين */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500 dark:text-green-400" />
                الموظفين النشطين
              </CardTitle>
              <CardDescription>الموظفين المسجلين حضور اليوم</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 dark:text-green-400 font-medium">{activeEmployees.filter(emp => emp.status === 'حاضر').length} حاضر</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">{activeEmployees.filter(emp => emp.status === 'في اجتماع').length} في اجتماع</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-orange-600 dark:text-orange-400 font-medium">{activeEmployees.filter(emp => emp.location === 'العمل عن بُعد').length} عن بُعد</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeEmployees.map((employee) => (
              <div
                key={`employee-${employee.id}`}
                className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* حالة الموظف */}
                <div className="absolute top-3 right-3">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    employee.status === 'حاضر' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : employee.status === 'في اجتماع'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      employee.status === 'حاضر' ? 'bg-green-500' 
                      : employee.status === 'في اجتماع' ? 'bg-blue-500' 
                      : 'bg-orange-500'
                    }`}></div>
                    {employee.status}
                  </div>
                </div>

                {/* معلومات الموظف الأساسية */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {employee.name.split(' ')[0].charAt(0)}{employee.name.split(' ')[1]?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {employee.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {employee.position}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {employee.department}
                    </p>
                  </div>
                </div>

                {/* تفاصيل الحضور */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">وقت الوصول:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{employee.checkInTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">الموقع:</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">{employee.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Wifi className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">آخر نشاط:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{employee.lastActivity}</span>
                  </div>
                </div>

                {/* إحصائيات العمل */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 mb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">ساعات العمل اليوم</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{employee.workingHours}</span>
                  </div>
                </div>

                {/* أزرار التواصل */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 text-xs h-7 border-gray-300 dark:border-gray-600"
                  >
                    <Phone className="w-3 h-3" />
                    اتصال
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 text-xs h-7 border-gray-300 dark:border-gray-600"
                  >
                    <Mail className="w-3 h-3" />
                    إيميل
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* إحصائيات سريعة للحضور */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeEmployees.filter(emp => emp.status === 'حاضر').length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 font-medium">حاضر اليوم</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(activeEmployees.reduce((total, emp) => total + parseFloat(emp.workingHours), 0) / activeEmployees.length).toFixed(1)}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">متوسط الساعات</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {activeEmployees.filter(emp => emp.location === 'العمل عن بُعد').length}
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">عمل عن بُعد</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {((activeEmployees.length / stats.totalEmployees) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">معدل الحضور</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسم البياني الشهري */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات والمصروفات الشهرية</CardTitle>
            <CardDescription>مقارنة الأداء المالي خلال الأشهر الماضية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="الإيرادات" />
                <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                <Bar dataKey="salaries" fill="#3b82f6" name="الرواتب" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* الرسم الدائري للمصروفات */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المصروفات</CardTitle>
            <CardDescription>تصنيف المصروفات حسب النوع</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`expense-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات والإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            التنبيهات والإشعارات
          </CardTitle>
          <CardDescription>تنبيهات مهمة تتطلب انتباهك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={`alert-${alert.id}`}
                className={`p-4 rounded-lg border-r-4 ${
                  alert.type === 'warning' 
                    ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500' 
                    : alert.type === 'success'
                    ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-500'
                    : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className={`font-medium ${
                    alert.type === 'warning' 
                      ? 'text-yellow-800 dark:text-yellow-200'
                      : alert.type === 'success'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {alert.message}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.priority === 'عالي' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      : alert.priority === 'متوسط'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* أحدث المعاملات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>أحدث المعاملات</CardTitle>
            <CardDescription>آخر العمليات المالية المسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={`recent-transaction-${transaction.id}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span>رقم المعاملة: </span>
                      <span className="font-semibold">{transaction.transactionNumber || 'غير محدد'}</span>
                      {transaction.reference && <span> • {transaction.reference}</span>}
                      {transaction.date && <span> • {formatDate(transaction.date)}</span>}
                      {transaction.category && <span> • {transaction.category}</span>}
                      {transaction.subcategory && <span> • {transaction.subcategory}</span>}
                      {transaction.paymentMethod && <span> • {transaction.paymentMethod}</span>}
                    </p>
                  </div>
                  <div className={`font-bold ${
                    transaction.type === 'income' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    {transaction.currency && <span className="text-base ml-1">{transaction.currency}</span>}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 gap-2">
              <Eye className="w-4 h-4" />
              عرض كافة المعاملات
            </Button>
          </CardContent>
        </Card>

        {/* إحصائيات سريعة */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات سريعة</CardTitle>
            <CardDescription>ملخص الأداء المالي الحالي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <span className="font-medium text-blue-900 dark:text-blue-100">متوسط الراتب الشهري</span>
                <span className="font-bold text-blue-900 dark:text-blue-100">{formatCurrency(quickStats.avgSalary)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <span className="font-medium text-green-900 dark:text-green-100">معدل النمو الشهري</span>
                <span className="font-bold text-green-900 dark:text-green-100">{quickStats.monthlyGrowth}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <span className="font-medium text-purple-900 dark:text-purple-100">إجمالي المكافآت</span>
                <span className="font-bold text-purple-900 dark:text-purple-100">{formatCurrency(quickStats.totalBonuses)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <span className="font-medium text-orange-900 dark:text-orange-100">نسبة الحضور</span>
                <span className="font-bold text-orange-900 dark:text-orange-100">{quickStats.attendanceRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage 