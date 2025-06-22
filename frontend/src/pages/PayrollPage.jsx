import React, { useState, useEffect, useRef } from 'react'
import { employeeService, salaryHelpers } from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { 
  Search, 
  DollarSign, 
  Calendar, 
  FileText, 
  Users, 
  Plus, 
  Minus,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Calculator,
  History,
  Eye,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  XCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '../components/ui/alert'

const PayrollPage = () => {
  // Core state
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(salaryHelpers.getCurrentMonth())
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  
  // Modals and views
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [paymentCalculation, setPaymentCalculation] = useState(null)
  
  // Forms
  const [paymentForm, setPaymentForm] = useState({
    paymentType: 'full',
    amount: '',
    description: '',
    note: ''
  })
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'bonus',
    category: '',
    amount: '',
    description: '',
    reason: '',
    month: currentMonth
  })
  
  // Messages
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // Refs for input focus management
  const amountRef = useRef(null)
  const descriptionRef = useRef(null)
  const reasonRef = useRef(null)
  const noteRef = useRef(null)

  const [payrollStats, setPayrollStats] = useState({
    totalEmployees: 0,
    totalSalaries: 0,
    totalPaid: 0,
    totalRemaining: 0,
    completedPayments: 0,
    partialPayments: 0,
    pendingPayments: 0
  })

  const [paymentHistory, setPaymentHistory] = useState([])

  const bonusTypes = [
    { value: 'performance', label: 'مكافأة أداء' },
    { value: 'holiday', label: 'مكافأة عيد' },
    { value: 'overtime', label: 'مكافأة إضافية' },
    { value: 'special', label: 'مكافأة خاصة' }
  ]

  const deductionTypes = [
    { value: 'absence', label: 'خصم غياب' },
    { value: 'tardiness', label: 'خصم تأخير' },
    { value: 'personal', label: 'خصم شخصي' },
    { value: 'other', label: 'خصم آخر' }
  ]

  // Load employees on component mount
  useEffect(() => {
    loadEmployeesAndStats()
  }, [departmentFilter])

  const loadEmployeesAndStats = async () => {
    try {
      setLoading(true)
      console.log('🔄 جاري تحميل بيانات الموظفين...')
      
      // جلب بيانات الموظفين
      const employeesResponse = await employeeService.getAll({
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        status: 'نشط',
        approvalStatus: 'approved'
      })
      
      console.log('📊 استجابة الموظفين:', employeesResponse)
      
      // التأكد من هيكل البيانات
      let employeesData = []
      if (employeesResponse?.data) {
        employeesData = Array.isArray(employeesResponse.data) ? employeesResponse.data : []
      } else if (Array.isArray(employeesResponse)) {
        employeesData = employeesResponse
      }
      
      console.log('👥 عدد الموظفين المحملين:', employeesData.length)
      
      // جلب تاريخ المدفوعات
      let historyData = []
      try {
        const historyResponse = await employeeService.getPaymentHistory(currentMonth)
        historyData = Array.isArray(historyResponse) ? historyResponse : 
                     (historyResponse?.data && Array.isArray(historyResponse.data)) ? historyResponse.data : []
      } catch (historyError) {
        console.warn('تعذر جلب تاريخ المدفوعات:', historyError)
        historyData = []
      }

      setEmployees(employeesData)
      setPaymentHistory(historyData)
      
      // حساب الإحصائيات
      calculateStats(employeesData)
      
      setLoading(false)
      showMessage('تم تحميل البيانات بنجاح', 'success')
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error)
      setMessage({ text: 'حدث خطأ في تحميل البيانات: ' + error.message, type: 'error' })
      setEmployees([])
      setPaymentHistory([])
      setLoading(false)
    }
  }

  const calculateStats = (employeesData) => {
    // التأكد من أن البيانات مصفوفة
    const employees = Array.isArray(employeesData) ? employeesData : []
    
    const stats = {
      totalEmployees: employees.length,
      totalSalaries: 0,
      totalPaid: 0,
      totalRemaining: 0,
      completedPayments: 0,
      partialPayments: 0,
      pendingPayments: 0
    }

    employees.forEach(emp => {
      // حساب صافي الراتب من البيانات الأساسية
      const baseSalary = emp.baseSalary || 0
      const allowancesTotal = (emp.allowances?.transportation || 0) + 
                             (emp.allowances?.housing || 0) + 
                             (emp.allowances?.meal || 0)
      
      // حساب المكافآت والخصومات الشهرية
      const monthlyPayment = emp.monthlyPayments?.find(mp => mp.month === currentMonth)
      const bonusesTotal = monthlyPayment?.salaryCalculation?.bonusesTotal || 0
      const deductionsTotal = monthlyPayment?.salaryCalculation?.deductionsTotal || 0
      
      const netSalary = baseSalary + allowancesTotal + bonusesTotal - deductionsTotal
      const totalPaid = monthlyPayment?.totalPaid || 0
      const remaining = Math.max(0, netSalary - totalPaid)

      stats.totalSalaries += netSalary
      stats.totalPaid += totalPaid
      stats.totalRemaining += remaining

      if (totalPaid >= netSalary) {
        stats.completedPayments++
      } else if (totalPaid > 0) {
        stats.partialPayments++
      } else {
        stats.pendingPayments++
      }
    })

    setPayrollStats(stats)
  }

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 5000)
  }

  // Handle input focus management
  const handleInputFocus = (ref) => {
    if (ref?.current) {
      setTimeout(() => {
        ref.current.focus()
        ref.current.select()
      }, 100)
    }
  }

  // Filter employees based on search term
  const filteredEmployees = (employees || []).filter(emp => 
    emp && (
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Open salary details modal
  const openSalaryModal = async (employee) => {
    try {
      // فحص وجود الموظف أولاً
      if (!employee) {
        console.error('❌ محاولة فتح تفاصيل راتب لموظف غير موجود')
        showMessage('خطأ: لا يمكن العثور على بيانات الموظف', 'error')
        return
      }
      
      setSelectedEmployee(employee)
      console.log('🔍 فتح تفاصيل راتب:', employee.name || employee._id)
      
      // حساب أو جلب تفاصيل الدفع للشهر الحالي
      let paymentData = null
      try {
        // محاولة جلب البيانات من API
        if (employeeService.calculateMonthlyPayment) {
          paymentData = await employeeService.calculateMonthlyPayment(employee._id, currentMonth)
          console.log('💰 بيانات الراتب المحسوبة:', paymentData)
        }
      } catch (apiError) {
        console.warn('تعذر جلب البيانات من API، سيتم الحساب محلياً:', apiError)
      }
      
      // إذا لم تنجح محاولة API، احسب محلياً
      if (!paymentData) {
        const baseSalary = employee.baseSalary || 0
        const allowancesTotal = (employee.allowances?.transportation || 0) + 
                               (employee.allowances?.housing || 0) + 
                               (employee.allowances?.meal || 0)
        
        // البحث عن بيانات الشهر الحالي
        const monthlyPayment = employee.monthlyPayments?.find(mp => mp.month === currentMonth)
        const bonusesTotal = monthlyPayment?.salaryCalculation?.bonusesTotal || 0
        const deductionsTotal = monthlyPayment?.salaryCalculation?.deductionsTotal || 0
        const totalPaid = monthlyPayment?.totalPaid || 0
        
        const netSalary = baseSalary + allowancesTotal + bonusesTotal - deductionsTotal
        const remainingAmount = Math.max(0, netSalary - totalPaid)
        
        paymentData = {
          salaryCalculation: {
            baseSalary,
            allowancesTotal,
            bonusesTotal,
            deductionsTotal,
            netSalary,
            allowancesBreakdown: employee.allowances || {},
            bonusesBreakdown: monthlyPayment?.salaryCalculation?.bonusesBreakdown || [],
            deductionsBreakdown: monthlyPayment?.salaryCalculation?.deductionsBreakdown || { fixed: {}, adjustments: [] }
          },
          paymentStatus: {
            totalPaid,
            remainingAmount,
            status: totalPaid >= netSalary ? 'completed' : totalPaid > 0 ? 'partial' : 'pending'
          },
          adjustments: {
            bonuses: employee.monthlyAdjustments?.bonuses?.filter(b => b.month === currentMonth && b.isActive !== false) || [],
            deductions: employee.monthlyAdjustments?.deductions?.filter(d => d.month === currentMonth && d.isActive !== false) || []
          },
          paymentHistory: monthlyPayment?.payments || []
        }
      }
      
      setPaymentCalculation(paymentData)
      setShowSalaryModal(true)
    } catch (error) {
      console.error('❌ خطأ في فتح نافذة الراتب:', error)
      showMessage('حدث خطأ في تحميل بيانات الراتب: ' + error.message, 'error')
    }
  }

  // Open payment modal
  const openPaymentModal = (paymentType = 'full') => {
    if (!paymentCalculation) return
    
    const maxAmount = paymentCalculation.paymentStatus.remainingAmount
    
    setPaymentForm({
      paymentType,
      amount: paymentType === 'full' ? maxAmount.toString() : '',
      description: paymentType === 'full' ? 'دفع راتب كامل' : 
                   paymentType === 'partial' ? 'دفع جزئي' : 'سلفة',
      note: ''
    })
    
    setShowPaymentModal(true)
    setTimeout(() => handleInputFocus(amountRef), 200)
  }

  // Open adjustment modal
  const openAdjustmentModal = (type = 'bonus') => {
    setAdjustmentForm({
      type,
      category: '',
      amount: '',
      description: '',
      reason: '',
      month: currentMonth
    })
    setShowAdjustmentModal(true)
    setTimeout(() => handleInputFocus(amountRef), 200)
  }

  // Add bonus or deduction
  const handleAddAdjustment = async () => {
    if (!selectedEmployee || !adjustmentForm.amount || !adjustmentForm.description) {
      showMessage('يرجى ملء جميع الحقون المطلوبة', 'error')
      return
    }

    try {
      const endpoint = adjustmentForm.type === 'bonus' ? 'addBonus' : 'addDeduction'
      await employeeService[endpoint](selectedEmployee._id, {
        ...adjustmentForm,
        amount: parseFloat(adjustmentForm.amount)
      })

      showMessage(`تم إضافة ${adjustmentForm.type === 'bonus' ? 'المكافأة' : 'الخصم'} بنجاح`, 'success')
      setShowAdjustmentModal(false)
      setAdjustmentForm({ type: '', amount: '', description: '', month: currentMonth })
      loadEmployeesAndStats()
    } catch (error) {
      showMessage(`خطأ في إضافة ${adjustmentForm.type === 'bonus' ? 'المكافأة' : 'الخصم'}`, 'error')
    }
  }

  // Remove adjustment
  const handleRemoveAdjustment = async (adjustmentId) => {
    if (!selectedEmployee) return

    try {
      await employeeService.removeAdjustment(selectedEmployee._id, adjustmentId)
      showMessage('تم حذف التعديل بنجاح', 'success')
      loadEmployeesAndStats()
    } catch (error) {
      showMessage('خطأ في حذف التعديل', 'error')
    }
  }

  // Process payment confirmation
  const handlePaymentConfirmation = () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showMessage('يرجى إدخال مبلغ صحيح', 'error')
      return
    }

    const amount = parseFloat(paymentForm.amount)
    const maxAmount = paymentCalculation.paymentStatus.remainingAmount

    if (amount > maxAmount && paymentForm.paymentType !== 'advance') {
      showMessage('المبلغ المدخل أكبر من المبلغ المستحق', 'error')
      return
    }

    setShowPaymentModal(false)
    setShowConfirmationModal(true)
  }

  // Execute payment
  const executePayment = async () => {
    try {
      if (!selectedEmployee || !paymentCalculation) {
        console.error('Missing data:', { selectedEmployee, paymentCalculation })
        return
      }

      const paymentData = {
        paymentType: paymentForm.paymentType,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description,
        note: paymentForm.note,
        month: currentMonth
      }

      console.log('Processing payment with data:', paymentData)
      const response = await employeeService.processPayment(selectedEmployee._id, paymentData)
      console.log('Payment processed successfully:', response)

      // Update the payment calculation
      setPaymentCalculation(prev => ({
        ...prev,
        paymentStatus: response.data
      }))

      setShowConfirmationModal(false)
      setShowSalaryModal(false)
      showMessage('تم تسجيل الدفع بنجاح', 'success')

      // Refresh employees list
      loadEmployeesAndStats()
    } catch (error) {
      console.error('خطأ في معالجة الدفع:', error)
      const errorMessage = error.response?.data?.message || error.message || 'خطأ غير معروف'
      showMessage('خطأ في معالجة الدفع: ' + errorMessage, 'error')
    }
  }

  // Get payment status badge
  const getPaymentStatusBadge = (employee) => {
    try {
      // فحص وجود الموظف أولاً
      if (!employee) {
        return <Badge variant="default">غير محدد</Badge>
      }
      
      // حساب صافي الراتب من البيانات الأساسية
      const baseSalary = employee.baseSalary || 0
      const allowancesTotal = (employee.allowances?.transportation || 0) + 
                             (employee.allowances?.housing || 0) + 
                             (employee.allowances?.meal || 0)
      
      // البحث عن بيانات الشهر الحالي
      const monthlyPayment = employee.monthlyPayments?.find(mp => mp.month === currentMonth)
      const bonusesTotal = monthlyPayment?.salaryCalculation?.bonusesTotal || 0
      const deductionsTotal = monthlyPayment?.salaryCalculation?.deductionsTotal || 0
      const totalPaid = monthlyPayment?.totalPaid || 0
      
      const netSalary = baseSalary + allowancesTotal + bonusesTotal - deductionsTotal
      
      if (totalPaid >= netSalary) {
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>
      } else if (totalPaid > 0) {
        return <Badge className="bg-yellow-100 text-yellow-800">جزئي</Badge>
      }
      return <Badge className="bg-red-100 text-red-800">معلق</Badge>
    } catch (error) {
      console.warn('خطأ في حساب حالة الدفع:', error)
      return <Badge className="bg-gray-100 text-gray-800">غير محدد</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الرواتب</h1>
        <p className="text-gray-600">إدارة رواتب الموظفين والدفعات الشهرية</p>
                  </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
                  </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث عن موظف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
                  </div>
        
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger>
            <SelectValue placeholder="اختر القسم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأقسام</SelectItem>
            <SelectItem value="تكنولوجيا المعلومات">تكنولوجيا المعلومات</SelectItem>
            <SelectItem value="المالية">المالية</SelectItem>
            <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
            <SelectItem value="المبيعات">المبيعات</SelectItem>
            <SelectItem value="التسويق">التسويق</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="text-sm"
          />
                  </div>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                    <p className="text-xs text-gray-500">{employee.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {salaryHelpers.formatCurrency(employee?.baseSalary || 0)}
                    </p>
                    <p className="text-xs text-gray-500">الراتب الأساسي</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {employee.monthlyPayments?.find(mp => mp.month === currentMonth) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">حالة الدفع:</span>
                      {getPaymentStatusBadge(employee)}
                  </div>
                  )}
                </div>

                <Button 
                  onClick={() => openSalaryModal(employee)}
                  className="w-full"
                  variant="outline"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  إدارة الراتب
                </Button>
                </CardContent>
              </Card>
          ))}
        </div>
      )}

      {/* Salary Details Modal */}
      {showSalaryModal && selectedEmployee && paymentCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                راتب {selectedEmployee.name} - {salaryHelpers.formatMonth(currentMonth)}
              </h2>
              <Button variant="outline" onClick={() => setShowSalaryModal(false)}>
                إغلاق
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Salary Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    تفاصيل الراتب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>الراتب الأساسي:</span>
                    <span className="font-medium">
                      {salaryHelpers.formatCurrency(paymentCalculation.salaryCalculation.baseSalary)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>البدلات:</span>
                    <span className="font-medium">
                      {salaryHelpers.formatCurrency(paymentCalculation.salaryCalculation.allowancesTotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-green-600">
                    <span>المكافآت:</span>
                    <span className="font-medium">
                      {salaryHelpers.formatCurrency(paymentCalculation.salaryCalculation.bonusesTotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-red-600">
                    <span>الخصومات:</span>
                    <span className="font-medium">
                      -{salaryHelpers.formatCurrency(paymentCalculation.salaryCalculation.deductionsTotal)}
                    </span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>صافي الراتب:</span>
                    <span>{salaryHelpers.formatCurrency(paymentCalculation.salaryCalculation.netSalary)}</span>
                  </div>
                  
                  <div className="flex justify-between text-blue-600">
                    <span>المدفوع:</span>
                    <span className="font-medium">
                      {salaryHelpers.formatCurrency(paymentCalculation.paymentStatus.totalPaid)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>المتبقي:</span>
                    <span>
                      {salaryHelpers.formatCurrency(paymentCalculation.paymentStatus.remainingAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    إجراءات الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => openAdjustmentModal('bonus')}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة مكافأة
                  </Button>
                  
                  <Button 
                    onClick={() => openAdjustmentModal('deduction')}
                    className="w-full"
                    variant="outline"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    إضافة خصم
                  </Button>
                  
                  <hr />
                  
                  <Button 
                    onClick={() => openPaymentModal('full')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={paymentCalculation.paymentStatus.remainingAmount <= 0}
                  >
                    دفع كامل
                  </Button>
                  
                  <Button 
                    onClick={() => openPaymentModal('partial')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={paymentCalculation.paymentStatus.remainingAmount <= 0}
                  >
                    دفع جزئي
                  </Button>
                  
                  <Button 
                    onClick={() => openPaymentModal('advance')}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    سلفة
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Adjustments List */}
            {(paymentCalculation.salaryCalculation.bonusesBreakdown?.length > 0 || 
              paymentCalculation.salaryCalculation.deductionsBreakdown?.adjustments?.length > 0) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>التعديلات الشهرية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Bonuses */}
                    {paymentCalculation.salaryCalculation.bonusesBreakdown?.map((bonus) => (
                      <div key={bonus.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">{bonus.description}</p>
                          <p className="text-sm text-green-600">{bonus.type}</p>
                          </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-800">
                            +{salaryHelpers.formatCurrency(bonus.amount)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveAdjustment(bonus.id)}
                          >
                            حذف
                          </Button>
                        </div>
                        </div>
                      ))}
                    
                    {/* Deductions */}
                    {paymentCalculation.salaryCalculation.deductionsBreakdown?.adjustments?.map((deduction) => (
                      <div key={deduction.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">{deduction.description}</p>
                          <p className="text-sm text-red-600">{deduction.type}</p>
                      </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-800">
                            -{salaryHelpers.formatCurrency(deduction.amount)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveAdjustment(deduction.id)}
                          >
                            حذف
                          </Button>
                    </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            {paymentCalculation.paymentStatus.payments?.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    سجل الدفعات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentCalculation.paymentStatus.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.date).toLocaleDateString('ar-SA')}
                          </p>
                          {payment.note && (
                            <p className="text-xs text-gray-500">{payment.note}</p>
                          )}
                          </div>
                        <div className="text-right">
                          <span className="font-medium">
                            {salaryHelpers.formatCurrency(payment.amount)}
                          </span>
                          <p className="text-xs text-gray-500">{payment.paymentType}</p>
                        </div>
                        </div>
                      ))}
                      </div>
                </CardContent>
              </Card>
            )}
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {paymentForm.paymentType === 'full' ? 'دفع كامل' : 
               paymentForm.paymentType === 'partial' ? 'دفع جزئي' : 'سلفة'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">المبلغ</label>
                <Input
                  ref={amountRef}
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  onFocus={() => handleInputFocus(amountRef)}
                  placeholder="أدخل المبلغ"
                />
                {paymentCalculation && (
                  <p className="text-xs text-gray-500 mt-1">
                    المتاح للدفع: {salaryHelpers.formatCurrency(paymentCalculation.paymentStatus.remainingAmount)}
                  </p>
                )}
                </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">الوصف</label>
                <Input
                  ref={descriptionRef}
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                  onFocus={() => handleInputFocus(descriptionRef)}
                  placeholder="وصف الدفعة"
                />
                </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">ملاحظات (اختياري)</label>
                <Textarea
                  ref={noteRef}
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                  onFocus={() => handleInputFocus(noteRef)}
                  placeholder="ملاحظات إضافية"
                  rows={3}
                />
                  </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handlePaymentConfirmation} className="flex-1">
                متابعة
                </Button>
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              إضافة {adjustmentForm.type === 'bonus' ? 'مكافأة' : 'خصم'}
            </h2>
            
            <div className="space-y-4">
                  <div>
                <label className="block text-sm font-medium mb-2">النوع</label>
                <Select 
                  value={adjustmentForm.category} 
                  onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`اختر نوع ${adjustmentForm.type === 'bonus' ? 'المكافأة' : 'الخصم'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(adjustmentForm.type === 'bonus' ? bonusTypes : deductionTypes).map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  </div>
              
                  <div>
                <label className="block text-sm font-medium mb-2">المبلغ</label>
                    <Input
                  ref={amountRef}
                      type="number"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                  onFocus={() => handleInputFocus(amountRef)}
                  placeholder="أدخل المبلغ"
                    />
                  </div>
              
                  <div>
                <label className="block text-sm font-medium mb-2">الوصف</label>
                    <Input
                  ref={descriptionRef}
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, description: e.target.value }))}
                  onFocus={() => handleInputFocus(descriptionRef)}
                  placeholder="وصف التعديل"
                    />
                  </div>
              
                  <div>
                <label className="block text-sm font-medium mb-2">السبب (اختياري)</label>
                <Textarea
                  ref={reasonRef}
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  onFocus={() => handleInputFocus(reasonRef)}
                  placeholder="سبب التعديل"
                  rows={3}
                    />
                  </div>
              
                  <div>
                <label className="block text-sm font-medium mb-2">الشهر</label>
                    <Input
                  type="month"
                  value={adjustmentForm.month}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, month: e.target.value }))}
                    />
                  </div>
                  </div>
            
            <div className="flex gap-2 mt-6">
                  <Button 
                onClick={handleAddAdjustment} 
                className="flex-1"
                disabled={!adjustmentForm.category || !adjustmentForm.amount || !adjustmentForm.description}
              >
                إضافة
                  </Button>
              <Button variant="outline" onClick={() => setShowAdjustmentModal(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showConfirmationModal && paymentCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold">تأكيد الدفع</h2>
                          </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">تفاصيل الدفعة:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>الموظف:</span>
                    <span className="font-medium">{selectedEmployee?.name}</span>
                        </div>
                  <div className="flex justify-between">
                    <span>الشهر:</span>
                    <span className="font-medium">{salaryHelpers.formatMonth(currentMonth)}</span>
                    </div>
                  <div className="flex justify-between">
                    <span>نوع الدفع:</span>
                    <span className="font-medium">
                      {paymentForm.paymentType === 'full' ? 'دفع كامل' : 
                       paymentForm.paymentType === 'partial' ? 'دفع جزئي' : 'سلفة'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-medium text-green-600">
                      {salaryHelpers.formatCurrency(parseFloat(paymentForm.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>صافي الراتب:</span>
                    <span className="font-medium">
                      {salaryHelpers.formatCurrency(paymentCalculation.salaryCalculation.netSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المدفوع سابقاً:</span>
                    <span className="font-medium">
                      {salaryHelpers.formatCurrency(paymentCalculation.paymentStatus.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المتبقي بعد الدفع:</span>
                    <span className="font-medium text-orange-600">
                      {salaryHelpers.formatCurrency(
                        paymentCalculation.paymentStatus.remainingAmount - parseFloat(paymentForm.amount)
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              {paymentForm.description && (
                          <div>
                  <span className="text-sm font-medium">الوصف:</span>
                  <p className="text-sm text-gray-600 mt-1">{paymentForm.description}</p>
                          </div>
              )}
              
              {paymentForm.note && (
                <div>
                  <span className="text-sm font-medium">الملاحظات:</span>
                  <p className="text-sm text-gray-600 mt-1">{paymentForm.note}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
                          <Button 
                onClick={executePayment}
                disabled={!selectedEmployee || !paymentCalculation}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                تأكيد الدفع
              </Button>
              <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>
                إلغاء
                          </Button>
                        </div>
                    </div>
        </div>
      )}

      {/* إحصائيات الرواتب */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
              <p className="text-2xl font-bold text-gray-900">{payrollStats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
              </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي الرواتب</p>
              <p className="text-2xl font-bold text-gray-900">
                {salaryHelpers.formatCurrency(payrollStats.totalSalaries)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">المبلغ المدفوع</p>
              <p className="text-2xl font-bold text-green-600">
                {salaryHelpers.formatCurrency(payrollStats.totalPaid)}
              </p>
                </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
            </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">المبلغ المتبقي</p>
              <p className="text-2xl font-bold text-red-600">
                {salaryHelpers.formatCurrency(payrollStats.totalRemaining)}
              </p>
          </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
        </div>
        </Card>
      </div>

      {/* إحصائيات حالة المدفوعات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">مدفوعات مكتملة</p>
              <p className="text-xl font-bold text-green-600">{payrollStats.completedPayments}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">مدفوعات جزئية</p>
              <p className="text-xl font-bold text-yellow-600">{payrollStats.partialPayments}</p>
            </div>
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">مدفوعات معلقة</p>
              <p className="text-xl font-bold text-red-600">{payrollStats.pendingPayments}</p>
            </div>
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قائمة الموظفين */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">الموظفين</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedEmployee?._id === employee._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEmployee(employee)}
              >
                <div className="flex justify-between items-center">
        <div>
                    <h3 className="font-medium">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                    {employee.salaryData && (
                      <p className="text-sm text-gray-800">
                        صافي الراتب: {salaryHelpers.formatCurrency(
                          salaryHelpers.calculateNetSalary(employee.salaryData)
                        )}
                      </p>
                    )}
        </div>
                  <div className="text-left">
                    {getPaymentStatusBadge(employee)}
                    {employee.salaryData && (
                      <p className="text-xs text-gray-600 mt-1">
                        مدفوع: {salaryHelpers.formatCurrency(employee.salaryData.totalPaid || 0)}
                      </p>
                    )}
          </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* تفاصيل الموظف المختار */}
        <Card className="p-4">
          {selectedEmployee ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">تفاصيل الراتب</h2>
                <div className="flex gap-2">
          <Button 
                    onClick={() => {
                      setAdjustmentForm({ type: 'bonus', amount: '', description: '', month: currentMonth })
                      setShowAdjustmentModal(true)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة مكافأة
                  </Button>
                  <Button
                    onClick={() => {
                      setAdjustmentForm({ type: 'deduction', amount: '', description: '', month: currentMonth })
                      setShowAdjustmentModal(true)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Minus className="h-4 w-4 ml-1" />
                    إضافة خصم
                  </Button>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    size="sm"
                  >
                    <DollarSign className="h-4 w-4 ml-1" />
                    دفع راتب
          </Button>
        </div>
      </div>

              {selectedEmployee.salaryData ? (
                <div className="space-y-4">
                  {/* معلومات الراتب الأساسية */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">الراتب الأساسي</p>
                      <p className="font-semibold">
                        {salaryHelpers.formatCurrency(selectedEmployee.salaryData.baseSalary)}
                      </p>
            </div>
                    <div>
                      <p className="text-sm text-gray-600">البدلات</p>
                      <p className="font-semibold">
                        {salaryHelpers.formatCurrency(selectedEmployee.salaryData.allowancesTotal || 0)}
                      </p>
            </div>
                    <div>
                      <p className="text-sm text-gray-600">المكافآت</p>
                      <p className="font-semibold text-green-600">
                        +{salaryHelpers.formatCurrency(selectedEmployee.salaryData.bonusesTotal || 0)}
                      </p>
            </div>
                    <div>
                      <p className="text-sm text-gray-600">الخصومات</p>
                      <p className="font-semibold text-red-600">
                        -{salaryHelpers.formatCurrency(selectedEmployee.salaryData.deductionsTotal || 0)}
                      </p>
            </div>
                    <div className="col-span-2 pt-2 border-t">
                      <p className="text-sm text-gray-600">صافي الراتب</p>
                      <p className="text-lg font-bold">
                        {salaryHelpers.formatCurrency(
                          salaryHelpers.calculateNetSalary(selectedEmployee.salaryData)
                        )}
                      </p>
            </div>
      </div>

                  {/* المكافآت والخصومات الحالية */}
                  {(selectedEmployee.salaryData.bonuses?.length > 0 || 
                    selectedEmployee.salaryData.deductions?.length > 0) && (
                        <div>
                      <h3 className="font-medium mb-2">التعديلات الحالية</h3>
                      <div className="space-y-2">
                        {selectedEmployee.salaryData.bonuses?.map((bonus) => (
                          <div key={bonus._id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <div>
                              <span className="font-medium text-green-800">
                                {bonusTypes.find(t => t.value === bonus.type)?.label || bonus.type}
                              </span>
                              <span className="text-sm text-gray-600 mr-2">
                                {bonus.description}
                              </span>
                        </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">
                                +{salaryHelpers.formatCurrency(bonus.amount)}
                        </span>
                          <Button 
                            size="sm" 
                                variant="ghost"
                                onClick={() => handleRemoveAdjustment(bonus._id)}
                          >
                                <Trash2 className="h-4 w-4" />
                          </Button>
                            </div>
                          </div>
                        ))}
                        
                        {selectedEmployee.salaryData.deductions?.map((deduction) => (
                          <div key={deduction._id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <div>
                              <span className="font-medium text-red-800">
                                {deductionTypes.find(t => t.value === deduction.type)?.label || deduction.type}
                              </span>
                              <span className="text-sm text-gray-600 mr-2">
                                {deduction.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-red-600">
                                -{salaryHelpers.formatCurrency(deduction.amount)}
                              </span>
                          <Button 
                            size="sm" 
                                variant="ghost"
                                onClick={() => handleRemoveAdjustment(deduction._id)}
                          >
                                <Trash2 className="h-4 w-4" />
                          </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* سجل المدفوعات */}
                  {selectedEmployee.salaryData.payments?.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">سجل المدفوعات</h3>
                      <div className="space-y-2">
                        {selectedEmployee.salaryData.payments.map((payment) => (
                          <div key={payment._id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <div>
                              <span className="font-medium">
                                {payment.type === 'full' ? 'راتب كامل' : 
                                 payment.type === 'partial' ? 'دفعة جزئية' : 'سلفة'}
                              </span>
                              <span className="text-sm text-gray-600 mr-2">
                                {new Date(payment.date).toLocaleDateString('ar-SA')}
                              </span>
                              {payment.description && (
                                <span className="text-sm text-gray-600 block">
                                  {payment.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-600">
                                {salaryHelpers.formatCurrency(payment.amount)}
                              </span>
                            <Button 
                              size="sm" 
                                variant="ghost"
                                onClick={() => handleRemoveAdjustment(payment._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                          )}
                        </div>
              ) : (
                <p className="text-gray-600">لا توجد بيانات راتب لهذا الموظف</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">اختر موظفاً لعرض تفاصيل راتبه</p>
          )}
        </Card>
      </div>

      {/* سجل معاملات الرواتب */}
      <Card className="p-4 mt-6">
        <h2 className="text-xl font-semibold mb-4">سجل المعاملات</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">الموظف</th>
                <th className="p-3 text-right">نوع المعاملة</th>
                <th className="p-3 text-right">المبلغ</th>
                <th className="p-3 text-right">الوصف</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((transaction, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3">
                    {new Date(transaction.date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-3 font-medium">{transaction.employeeName}</td>
                  <td className="p-3">
                    <Badge variant={
                      transaction.type === 'payment' ? 'success' :
                      transaction.type === 'bonus' ? 'info' : 'warning'
                    }>
                      {transaction.type === 'payment' ? 'دفع راتب' :
                       transaction.type === 'bonus' ? 'مكافأة' : 'خصم'}
                    </Badge>
                  </td>
                  <td className="p-3 font-semibold">
                    {salaryHelpers.formatCurrency(transaction.amount)}
                  </td>
                  <td className="p-3">{transaction.description || '-'}</td>
                  <td className="p-3">
                    <Badge variant="success">مكتمل</Badge>
                      </td>
                    </tr>
              ))}
              </tbody>
            </table>
          </div>
      </Card>
    </div>
  )
}

export default PayrollPage 
