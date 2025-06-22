import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { 
  Search, 
  Mail, 
  Phone, 
  Building, 
  Users,
  Calendar,
  Award,
  MapPin,
  Star,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Shield,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { employeeService } from '../services/api'
import { useNotifications } from '../components/NotificationSystem'

const EmployeesListPage = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotifications()
  
  // تعريف جميع المتغيرات في البداية
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('pending')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // دالة جلب الموظفين
  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeeService.getAll({
        approvalStatus: selectedApprovalStatus,
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined
      });

      if (data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
      } else if (Array.isArray(data)) {
        setEmployees(data);
      } else if (data.data && Array.isArray(data.data)) {
        setEmployees(data.data);
      } else {
        setEmployees([]);
        setError('لم يتم العثور على بيانات موظفين.');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('تعذر جلب بيانات الموظفين من الخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // جلب الموظفين عند تحميل الصفحة وعند تغيير الفلاتر
  useEffect(() => {
    fetchEmployees();
  }, [selectedApprovalStatus, selectedDepartment, selectedStatus, searchTerm]);

  // الحصول على قائمة الأقسام
  const departments = [...new Set(employees.map(emp => emp.department))];

  // إحصائيات سريعة
  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => emp.status === 'نشط').length,
    onLeaveEmployees: employees.filter(emp => emp.status === 'إجازة').length,
    departments: departments.length,
    teamLeaders: employees.filter(emp => emp.teamLead).length,
    averageSalary: employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length
  };

  // فلترة وترتيب الموظفين
  const filteredAndSortedEmployees = employees
    .filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
      const matchesApprovalStatus = selectedApprovalStatus === 'all' || employee.approvalStatus === selectedApprovalStatus;
      return matchesSearch && matchesDepartment && matchesStatus && matchesApprovalStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate);
          bValue = new Date(b.joinDate);
          break;
        case 'department':
          aValue = a.department;
          bValue = b.department;
          break;
        case 'salary':
          aValue = a.salary || 0;
          bValue = b.salary || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // الحصول على أول حرف من الاسم للأفاتار
  const getInitials = (name) => {
    return name.split(' ')[0].charAt(0)
  }

  // ألوان عشوائية للأفاتار
  const avatarColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
    'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
  ]

  const getAvatarColor = (id) => {
    return avatarColors[id % avatarColors.length]
  }

  // دالة الموافقة على موظف
  const handleApprove = async (employeeId) => {
    try {
      const response = await employeeService.approve(employeeId);
      if (response.success) {
        showSuccess('تم الموافقة على الموظف بنجاح');
        fetchEmployees(); // تحديث القائمة
      }
    } catch (err) {
      showError('حدث خطأ أثناء الموافقة على الموظف');
    }
  };

  // دالة رفض موظف
  const handleReject = async (employeeId) => {
    if (!rejectionReason.trim()) {
      showError('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      const response = await employeeService.reject(employeeId, rejectionReason);
      if (response.success) {
        showSuccess('تم رفض الموظف بنجاح');
        setShowApprovalModal(false);
        setRejectionReason('');
        fetchEmployees(); // تحديث القائمة
      }
    } catch (err) {
      showError('حدث خطأ أثناء رفض الموظف');
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">دليل الموظفين</h1>
        <p className="text-gray-600 dark:text-gray-300">تصفح معلومات الاتصال بزملائك في العمل وبياناتهم المهنية</p>
      </div>
        <button
          onClick={fetchEmployees}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow text-sm"
          disabled={loading}
        >
          {loading ? 'جاري التحديث...' : 'تحديث القائمة'}
        </button>
      </div>
      {/* رسالة خطأ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center">
          {error}
        </div>
      )}

      {/* الإحصائيات السريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">إجمالي الموظفين</p>
                <p className="text-2xl font-bold dark:text-white">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">الموظفون النشطون</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.activeEmployees}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">قادة الفرق</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.teamLeaders}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">عدد الأقسام</p>
                <p className="text-2xl font-bold dark:text-white">{stats.departments}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">النتائج المعروضة</p>
                <p className="text-2xl font-bold dark:text-white">{filteredAndSortedEmployees.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  من {stats.totalEmployees} موظف
                </p>
              </div>
              <Search className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* البحث */}
            <div className="relative lg:col-span-2">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث بالاسم، القسم، المهارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            {/* فلتر القسم */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* فلتر الحالة */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="إجازة">في إجازة</option>
              <option value="تحت التدريب">تحت التدريب</option>
            </select>

            {/* فلتر حالة الموافقة */}
            <select
              value={selectedApprovalStatus}
              onChange={(e) => setSelectedApprovalStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">في انتظار الموافقة</option>
              <option value="approved">تمت الموافقة</option>
              <option value="rejected">مرفوض</option>
            </select>

            {/* الترتيب */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="name">الاسم</option>
                <option value="joinDate">تاريخ التوظيف</option>
                <option value="department">القسم</option>
                <option value="salary">الراتب</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                title={sortOrder === 'asc' ? 'ترتيب تصاعدي' : 'ترتيب تنازلي'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الموظفين */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedEmployees.map((employee) => (
          <Card 
            key={employee._id} 
            className="hover:shadow-lg transition-all cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:scale-105"
            onClick={() => navigate(`/employee/${employee._id}`)}
          >
            <CardHeader>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className={`rounded-full h-16 w-16 flex items-center justify-center text-white text-xl font-bold ${getAvatarColor(employee._id)}`}>
                  {getInitials(employee.name)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {employee.name}
                  </CardTitle>
                  <CardDescription className="text-sm dark:text-gray-300">
                    {employee.position}
                  </CardDescription>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400 px-2 py-1 rounded">
                      EMP-{(employee.employeeNumber || employee._id?.toString().slice(-3) || '000').padStart(3, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Building className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium dark:text-gray-300">القسم:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{employee.department || 'غير محدد'}</span>
                  {employee.teamLead && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">قائد فريق</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">البريد:</span>
                  <a 
                    href={`mailto:${employee.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {employee.email || 'غير محدد'}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">الهاتف:</span>
                  <a 
                    href={`tel:${employee.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {employee.phone || 'غير محدد'}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">الموقع:</span>
                  <span className="text-sm text-gray-600">{employee.location || employee.address || 'غير محدد'}</span>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">تاريخ التوظيف:</span>
                  <span className="text-sm text-gray-600">{formatDate(employee.startDate)}</span>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">التعليم:</span>
                  <span className="text-sm text-gray-600">{employee.education || 'غير محدد'}</span>
                </div>

                {/* المهارات */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">المهارات:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(employee.skills || []).slice(0, 3).map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {(employee.skills || []).length > 3 && (
                      <span className="text-xs text-gray-500">+{employee.skills.length - 3} أخرى</span>
                    )}
                  </div>
                </div>

                {/* المشاريع الحالية */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">المشاريع:</span>
                  </div>
                  <div className="space-y-1">
                    {(employee.projects || []).slice(0, 2).map((project, index) => (
                      <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                        • {project}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.floor((new Date() - new Date(employee.startDate)) / (365.25 * 24 * 60 * 60 * 1000))} سنوات خبرة
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    employee.status === 'نشط' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : employee.status === 'إجازة'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  }`}>
                    {employee.status}
                  </span>
                </div>
                
                {/* معلومات إضافية */}
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <TrendingUp className="h-3 w-3" />
                    <span>{employee.salary ? `${employee.salary.toLocaleString('en-US')} ج.م` : 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Briefcase className="h-3 w-3" />
                    <span>{employee.experience || 'غير محدد'}</span>
                  </div>
                </div>
                
                {/* حالة الموافقة */}
                <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {employee.approvalStatus === 'pending' && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    {employee.approvalStatus === 'approved' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {employee.approvalStatus === 'rejected' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      employee.approvalStatus === 'pending' 
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : employee.approvalStatus === 'approved'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {employee.approvalStatus === 'pending' 
                        ? 'في انتظار الموافقة'
                        : employee.approvalStatus === 'approved'
                        ? 'تمت الموافقة'
                        : 'مرفوض'}
                    </span>
                  </div>

                  {/* أزرار الموافقة للموظفين في انتظار الموافقة */}
                  {employee.approvalStatus === 'pending' && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(employee._id);
                        }}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(employee);
                          setShowApprovalModal(true);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* رسالة عدم وجود نتائج */}
      {filteredAndSortedEmployees.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600">
              لم يتم العثور على موظفين يطابقون البحث الحالي. جرب تغيير مصطلح البحث أو الفلتر.
            </p>
          </CardContent>
        </Card>
      )}

      {/* معلومة عن الصفحة */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">ملاحظة حول الخصوصية</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                يعرض دليل الموظفين معلومات الاتصال والبيانات المهنية الأساسية. المعلومات المالية الحساسة محمية وفقاً لسياسات الخصوصية.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نافذة رفض الموظف */}
      {showApprovalModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">رفض الموظف</h3>
            <p className="mb-4">يرجى إدخال سبب رفض الموظف {selectedEmployee.name}</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
              rows="4"
              placeholder="سبب الرفض..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedEmployee(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReject(selectedEmployee._id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeesListPage 