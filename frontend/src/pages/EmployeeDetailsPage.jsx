import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { employeeService } from '../services/api'
import dailyAttendanceService from '../services/dailyAttendanceService'
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar, 
  DollarSign,
  Clock, 
  TrendingUp, 
  FileText, 
  Award,
  Building,
  CreditCard,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Activity,
  Monitor,
  RefreshCw,
  Gift,
  Minus,
  Trash2,
  Save,
  X,
  BarChart3,
  CalendarIcon,
  Calculator,
  Shield,
  RotateCcw
} from 'lucide-react'

const EmployeeDetailsPage = () => {
  const params = useParams()
  const id = params.id || params.employeeId
  const navigate = useNavigate()
  const location = useLocation()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  
  // state لإدارة المكافآت والخصومات
  const [selectedMonth, setSelectedMonth] = useState('2025-06')
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [showDeductionModal, setShowDeductionModal] = useState(false)
  const [bonusForm, setBonusForm] = useState({
    type: '',
    amount: '',
    description: '',
    reason: '',
    month: ''
  })
  const [deductionForm, setDeductionForm] = useState({
    type: '',
    amount: '',
    description: '',
    reason: '',
    month: ''
  })
  const [monthlyBonuses, setMonthlyBonuses] = useState([])
  const [monthlyDeductions, setMonthlyDeductions] = useState([])
  const [loadingSalaryData, setLoadingSalaryData] = useState(false)
  
  // حالة تعديل جدول التأخيرات
  const [isEditingAttendance, setIsEditingAttendance] = useState(false)
  const [attendanceData, setAttendanceData] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  
  // إعدادات الإجازات الديناميكية
  const [holidaySettings, setHolidaySettings] = useState({
    weekends: [5, 6], // الجمعة والسبت افتراضياً
    holidays: [],
    customDays: []
  })
  
  // استخراج القسم النشط من URL
  const currentSection = location.pathname.split('/').pop() || 'overview'

  // تعريف التبويبات
  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'desktop-tracking', label: 'مراقبة سطح المكتب', icon: Activity },
    { id: 'salary', label: 'الراتب والمزايا', icon: DollarSign },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock },
    { id: 'performance', label: 'الأداء والتقييم', icon: TrendingUp },
    { id: 'documents', label: 'المستندات', icon: FileText },
    { id: 'requests', label: 'الطلبات والإجازات', icon: CalendarIcon }
  ]

  // جلب إعدادات الإجازات
  const fetchHolidaySettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/daily-attendance/holidays', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHolidaySettings({
            weekends: result.data.weekends || [5, 6],
            holidays: result.data.holidays || [],
            customDays: result.data.customDays || []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching holiday settings:', err);
    }
  }, []);

  // دالة للتحقق من كون اليوم عطلة أسبوعية
  const isWeekendDay = (date) => {
    return holidaySettings.weekends.includes(date.getDay());
  };

  // دالة للتحقق من كون اليوم إجازة رسمية
  const isOfficialHoliday = (date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // فحص الإجازات الرسمية
    for (const holiday of holidaySettings.holidays) {
      const holidayDate = new Date(holiday.date);
      const holidayString = holidayDate.toISOString().split('T')[0];
      
      if (holiday.duration && holiday.duration > 1) {
        // إجازة متعددة الأيام
        for (let i = 0; i < holiday.duration; i++) {
          const extendedDate = new Date(holidayDate);
          extendedDate.setDate(extendedDate.getDate() + i);
          if (extendedDate.toISOString().split('T')[0] === dateString) {
            return { isHoliday: true, name: holiday.name, type: holiday.type };
          }
        }
      } else {
        // إجازة يوم واحد
        if (holidayString === dateString) {
          return { isHoliday: true, name: holiday.name, type: holiday.type };
        }
      }
    }

    // فحص الأيام المخصصة
    for (const customDay of holidaySettings.customDays) {
      if (customDay.date === dateString) {
        return { isHoliday: true, name: customDay.name, type: 'custom' };
      }
    }

    return false;
  };

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true)
        const response = await employeeService.getById(id)
        if (!response.data) {
          throw new Error('لم يتم العثور على بيانات الموظف')
        }
        // استخدام البيانات كما هي من قاعدة البيانات مع توحيد الحقول
        const employeeData = {
          ...response.data,
          // الاحتفاظ بالبيانات الأصلية مع إضافة القيم الافتراضية فقط للحقول المفقودة
          baseSalary: response.data.baseSalary || response.data.salary || 0,
          name: response.data.name || response.data.fullName || '',
          fullName: response.data.fullName || response.data.name || '',
          location: response.data.location || response.data.workLocation || response.data.address || '',
          education: response.data.education || '',
          experience: response.data.experience || '',
          skills: response.data.skills || [],
          allowances: {
            transport: response.data.allowances?.transportation || response.data.allowances?.transport || response.data.benefits?.transportationAllowance || 0,
            food: response.data.allowances?.meal || response.data.allowances?.food || response.data.benefits?.mealAllowance || 0,
            housing: response.data.allowances?.housing || response.data.benefits?.housingAllowance || 0,
            performance: response.data.allowances?.performance || response.data.benefits?.performanceAllowance || 0,
            ...response.data.allowances
          },
          deductions: {
            insurance: response.data.deductions?.socialInsurance || response.data.deductions?.insurance || 0,
            taxes: response.data.deductions?.tax || response.data.deductions?.taxes || 0,
            loans: response.data.deductions?.loans || response.data.deductions?.loan || 0,
            absence: response.data.deductions?.absence || 0,
            ...response.data.deductions
          },
          monthlyAdjustments: response.data.monthlyAdjustments || { bonuses: [], deductions: [] }
        }
        setEmployee(employeeData)
        setEditForm(employeeData) // تحضير نموذج التعديل
      } catch (err) {
        setError(err.message || 'حدث خطأ أثناء جلب بيانات الموظف')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeDetails()
    fetchHolidaySettings().catch(err => console.warn('خطأ في جلب إعدادات الإجازات:', err))
  }, [id])

  // تحديد الشهر الحالي عند تحميل الصفحة
  useEffect(() => {
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(currentMonth)
  }, [])

  // دالة تحميل بيانات الراتب
  const fetchSalaryData = useCallback(async () => {
    if (!selectedMonth || !employee) return
    
    try {
      setLoadingSalaryData(true)
      const response = await employeeService.getSalaryData(id, selectedMonth)
      if (response.data) {
        setMonthlyBonuses(response.data.bonuses || [])
        setMonthlyDeductions(response.data.deductions || [])
      }
    } catch (error) {
      console.error('Error fetching salary data:', error)
      setMonthlyBonuses([])
      setMonthlyDeductions([])
    } finally {
      setLoadingSalaryData(false)
    }
  }, [selectedMonth, employee, id])

  // تحميل بيانات الراتب للشهر المحدد
  useEffect(() => {
    if (selectedMonth && employee) {
      fetchSalaryData()
    }
  }, [selectedMonth, employee, fetchSalaryData])

  // تحميل بيانات التأخيرات من الباك إند
  const fetchAttendanceData = useCallback(async () => {
    if (!employee || !selectedMonth) return
    
    try {
      setLoadingAttendance(true)
      console.log('🔄 جلب بيانات الحضور لـ:', employee.name, 'userId:', employee.userId, 'selectedMonth:', selectedMonth)
      
      // استخدام نفس API endpoint المستخدم في MePage مع معامل الشهر لضمان تطابق البيانات
      const trackingResponse = await fetch(`http://localhost:5001/api/daily-attendance/user-records/${employee.userId}?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!trackingResponse.ok) {
        throw new Error(`HTTP ${trackingResponse.status}: ${trackingResponse.statusText}`)
      }
      
      const trackingData = await trackingResponse.json()
      console.log('📊 استجابة API للحضور:', trackingData)
      
      if (trackingData.success && trackingData.data?.records) {
        const today = new Date()
        const todayDateString = today.toISOString().split('T')[0]
        
        // تحويل بيانات الحضور اليومي إلى تنسيق جدول التأخيرات مع نفس المنطق المستخدم في MePage
        const formattedData = trackingData.data.records.map(record => {
          const recordDate = new Date(record.date)
          const recordDateString = recordDate.toISOString().split('T')[0]
          const isToday = recordDateString === todayDateString
          
          // حساب الساعات من الثواني إذا توفرت (نفس منطق MePage)
          const totalHours = record.totalSeconds ? record.totalSeconds / 3600 : (record.totalHours || 0)
          const activeHours = record.activeSeconds ? record.activeSeconds / 3600 : (record.activeHours || 0)
          
          // تطبيق الفحص الديناميكي للإجازات على كل سجل
          const isDynamicWeekend = isWeekendDay(recordDate)
          const dynamicHolidayCheck = isOfficialHoliday(recordDate)
          
          // تحديد الحالة بناءً على البيانات الفعلية (نفس منطق MePage)
          let status = 'غير متوفر'
          let updatedIsWeekend = isDynamicWeekend
          
          if (isDynamicWeekend) {
            status = 'عطلة أسبوعية'
          } else if (dynamicHolidayCheck) {
            status = `إجازة رسمية - ${dynamicHolidayCheck.name}`
          } else if (record.status === 'عطلة' || record.status === 'إجازة') {
            status = record.status
          } else if (record.hasRealData && totalHours > 0) {
            if (totalHours >= 8) {
              status = 'في الوقت'
            } else {
              status = 'متأخر'
            }
          } else if (record.hasRealData && totalHours === 0) {
            status = 'غائب'
          } else {
            // لا توجد بيانات حقيقية من التطبيق
            if (recordDateString > todayDateString) {
              status = 'في الوقت' // الأيام المستقبلية
            } else {
              status = 'غائب' // الأيام الماضية بدون بيانات
            }
          }
          
          // حساب ساعات التأخير والخصم (نفس منطق MePage)
          let delayHours = 0
          let deductionAmount = 0
          
          if (!updatedIsWeekend && !dynamicHolidayCheck) {
            if (status === 'غائب') {
              delayHours = 8 // يوم كامل
              deductionAmount = Math.round((employee.baseSalary || 0) / 30) // خصم يوم
            } else if (status === 'متأخر' && totalHours > 0 && totalHours < 8) {
              delayHours = 8 - totalHours
              deductionAmount = Math.round(delayHours * ((employee.baseSalary || 0) / 30 / 8)) // خصم بالساعة
            }
          }
          
          console.log(`📅 معالجة سجل ${recordDateString}:`, {
            totalSeconds: record.totalSeconds,
            totalHours: totalHours,
            activeHours: activeHours,
            status: status,
            isWeekend: updatedIsWeekend,
            isToday: isToday,
            delayHours: delayHours
          })

          return {
            id: record._id || record.id || `${record.date}_${employee.userId}`,
            date: recordDate.toLocaleDateString('en-GB'), 
            day: record.day || recordDate.toLocaleDateString('ar', { weekday: 'long' }),
            isWeekend: updatedIsWeekend,
            totalHours: totalHours,
            activeHours: activeHours,
            requiredTime: '08:00',
            delayHours: delayHours,
            deductionAmount: deductionAmount || record.deductionAmount || 0,
            status: status,
            isToday: isToday
          }
        })
        
        setAttendanceData(formattedData)
        
        // حساب الإحصائيات (استبعاد العطل الرسمية والأسبوعية)
        const workingDays = formattedData.filter(day => 
          !day.isWeekend && 
          !day.status.includes('عطلة') && 
          !day.status.includes('إجازة رسمية') &&
          day.status !== 'مهمة خارجية'
        )
        const presentDays = workingDays.filter(day => day.status !== 'غائب' && day.status !== 'غير متوفر')
        const lateDays = workingDays.filter(day => day.status === 'متأخر')
        const absentDays = workingDays.filter(day => day.status === 'غائب')
        const totalDeductions = workingDays.reduce((sum, day) => sum + (day.deductionAmount || 0), 0)
        
        setAttendanceStats({
          totalWorkingDays: workingDays.length,
          presentDays: presentDays.length,
          lateDays: lateDays.length,
          absentDays: absentDays.length,
          totalHours: formattedData.reduce((sum, day) => sum + (day.totalHours || 0), 0),
          totalActiveHours: formattedData.reduce((sum, day) => sum + (day.activeHours || 0), 0),
          totalDelayHours: formattedData.reduce((sum, day) => sum + (day.delayHours || 0), 0),
          totalDeductions: totalDeductions
        })
        
        console.log('✅ تم تحديث بيانات الحضور بنجاح:', {
          totalRecords: formattedData.length,
          workingDays: workingDays.length,
          totalHours: formattedData.reduce((sum, day) => sum + (day.totalHours || 0), 0),
          totalActiveHours: formattedData.reduce((sum, day) => sum + (day.activeHours || 0), 0)
        })
      } else {
        console.log('⚠️ لا توجد بيانات تتبع - عرض بيانات فارغة')
        setAttendanceData([])
        setAttendanceStats({
          totalWorkingDays: 0,
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          totalHours: 0,
          totalActiveHours: 0,
          totalDelayHours: 0,
          totalDeductions: 0
        })
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات التأخيرات:', error)
      setNotification({
        type: 'error',
        message: `خطأ في الاتصال بالخادم: ${error.message}`
      })
      // عرض بيانات فارغة في حالة الخطأ
      setAttendanceData([])
      setAttendanceStats({
        totalWorkingDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        totalHours: 0,
        totalActiveHours: 0,
        totalDelayHours: 0,
        totalDeductions: 0
      })
    } finally {
      setLoadingAttendance(false)
    }
  }, [employee, selectedMonth])

  // تحميل بيانات التأخيرات عند تغيير الموظف أو الشهر
  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  // وظائف التعديل
  const handleEdit = () => {
    setIsEditing(true)
    // تهيئة النموذج مع البيانات الكاملة للموظف
    setEditForm({
      ...employee,
      // التأكد من وجود جميع الحقول المطلوبة
      name: employee.name || employee.fullName || '',
      fullName: employee.fullName || employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      location: employee.location || employee.workLocation || employee.address || '',
      education: employee.education || '',
      experience: employee.experience || '',
      status: employee.status || 'نشط',
      baseSalary: employee.baseSalary || 0,
      startDate: employee.startDate ? new Date(employee.startDate).toISOString().split('T')[0] : '',
      joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
      allowances: {
        transport: 0,
        housing: 0,
        food: 0,
        performance: 0,
        transportation: 0,
        meal: 0,
        ...employee.allowances
      },
      deductions: {
        insurance: 0,
        taxes: 0,
        loans: 0,
        absence: 0,
        socialInsurance: 0,
        tax: 0,
        loan: 0,
        ...employee.deductions
      }
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({ ...employee })
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // تنسيق البيانات قبل الإرسال
      const formattedData = {
        ...editForm,
        // تنسيق رقم الهاتف
        phone: editForm.phone ? (editForm.phone.startsWith('20') ? editForm.phone : `20${editForm.phone.replace(/^0+/, '')}`) : '',
        
        // تنسيق التواريخ
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : new Date().toISOString(),
        joinDate: editForm.joinDate ? new Date(editForm.joinDate).toISOString() : editForm.startDate ? new Date(editForm.startDate).toISOString() : new Date().toISOString(),
        
        // تنسيق البدلات
        allowances: {
          transportation: Number(editForm.allowances?.transportation || editForm.allowances?.transport || 0),
          housing: Number(editForm.allowances?.housing || 0),
          meal: Number(editForm.allowances?.meal || editForm.allowances?.food || 0)
        },
        
        // تنسيق الخصومات
        deductions: {
          socialInsurance: Number(editForm.deductions?.socialInsurance || editForm.deductions?.insurance || 0),
          tax: Number(editForm.deductions?.tax || editForm.deductions?.taxes || 0)
        },
        
        // تنسيق الراتب الأساسي
        baseSalary: Number(editForm.baseSalary || 0),
        
        // إضافة الحقول المطلوبة إذا لم تكن موجودة
        department: editForm.department || 'قسم عام',
        position: editForm.position || 'موظف',
        status: editForm.status || 'نشط'
      }
      
      console.log('البيانات المنسقة للإرسال:', formattedData)
      
      const response = await employeeService.update(id, formattedData)
      if (response.success || response.data) {
        setEmployee(formattedData)
        setIsEditing(false)
        // عرض رسالة نجاح
        setNotification({ type: 'success', message: 'تم تحديث بيانات الموظف بنجاح!' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        throw new Error(response.message || 'حدث خطأ أثناء التحديث')
      }
    } catch (err) {
      console.error('خطأ في الحفظ:', err)
      setNotification({ type: 'error', message: 'خطأ: ' + (err.message || 'حدث خطأ أثناء حفظ البيانات') })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  // وظائف المكافآت والخصومات
  const handleAddBonus = async () => {
    try {
      const bonusData = {
        ...bonusForm,
        amount: parseFloat(bonusForm.amount),
        month: selectedMonth
      }
      
      await employeeService.addBonus(id, bonusData)
      await fetchSalaryData() // إعادة تحميل البيانات
      setShowBonusModal(false)
      setBonusForm({ type: '', amount: '', description: '', reason: '', month: '' })
      setNotification({ type: 'success', message: 'تم إضافة المكافأة بنجاح' })
      
      // إخفاء الإشعار بعد 3 ثوان
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error adding bonus:', error)
      setNotification({ type: 'error', message: 'حدث خطأ أثناء إضافة المكافأة' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleAddDeduction = async () => {
    try {
      const deductionData = {
        ...deductionForm,
        amount: parseFloat(deductionForm.amount),
        month: selectedMonth
      }
      
      await employeeService.addDeduction(id, deductionData)
      await fetchSalaryData() // إعادة تحميل البيانات
      setShowDeductionModal(false)
      setDeductionForm({ type: '', amount: '', description: '', reason: '', month: '' })
      setNotification({ type: 'success', message: 'تم إضافة الخصم بنجاح' })
      
      // إخفاء الإشعار بعد 3 ثوان
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error adding deduction:', error)
      setNotification({ type: 'error', message: 'حدث خطأ أثناء إضافة الخصم' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleDeleteBonus = async (bonusId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المكافأة؟')) {
      return
    }
    
    try {
      await employeeService.deleteBonus(id, bonusId)
      await fetchSalaryData() // إعادة تحميل البيانات
      setNotification({ type: 'success', message: 'تم حذف المكافأة بنجاح' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error deleting bonus:', error)
      setNotification({ type: 'error', message: 'حدث خطأ أثناء حذف المكافأة' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleDeleteDeduction = async (deductionId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخصم؟')) {
      return
    }
    
    try {
      await employeeService.deleteDeduction(id, deductionId)
      await fetchSalaryData() // إعادة تحميل البيانات
      setNotification({ type: 'success', message: 'تم حذف الخصم بنجاح' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error deleting deduction:', error)
      setNotification({ type: 'error', message: 'حدث خطأ أثناء حذف الخصم' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // دوال تعديل بيانات الحضور
  const handleEditAttendance = () => {
    setIsEditingAttendance(true)
  }

  const handleCancelEditAttendance = async () => {
    setIsEditingAttendance(false)
    // إعادة تحميل البيانات من الخادم لإلغاء التغييرات
    await fetchAttendanceData()
  }

  const handleSaveAttendance = async () => {
    try {
      setLoadingAttendance(true)
      
      // تحضير البيانات للإرسال (لا نرسل أوقات الحضور - فقط البيانات الإدارية)
      const recordsToUpdate = attendanceData.map(record => ({
        id: record.id,
        requiredTime: record.requiredTime,
        status: record.status,
        deductionAmount: record.deductionAmount
        // ملاحظة: لا نرسل totalHours أو activeHours لأنها تأتي من التطبيق فقط
      }))
      
      const result = await dailyAttendanceService.bulkUpdateRecords(recordsToUpdate)
      
      if (result.success) {
        setIsEditingAttendance(false)
        setNotification({
          type: 'success',
          message: 'تم حفظ بيانات التأخيرات بنجاح - أوقات الحضور تبقى كما هي من التطبيق'
        })
        // إعادة تحميل البيانات لضمان التحديث
        await fetchAttendanceData()
      } else {
        throw new Error(result.message || 'خطأ في حفظ البيانات')
      }
    } catch (error) {
      console.error('خطأ في حفظ بيانات التأخيرات:', error)
      setNotification({
        type: 'error',
        message: 'خطأ في حفظ البيانات: ' + error.message
      })
    } finally {
      setLoadingAttendance(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleAttendanceFieldChange = (dayId, field, value) => {
    setAttendanceData(prev => prev.map(day => {
      if (day.id === dayId) {
        const updatedDay = { ...day, [field]: value }
        
        // التعامل مع تغيير الحالة
        if (field === 'status' && !day.isWeekend) {
          if (value === 'في الوقت') {
            updatedDay.delayHours = 0
            updatedDay.deductionAmount = 0
          } else if (value === 'غائب') {
            // خصم يوم كامل للغياب
            updatedDay.delayHours = 8 // 8 ساعات يوم عمل كامل
            updatedDay.deductionAmount = Math.round((employee.baseSalary / 30))
          } else if (value === 'إجازة' || value === 'مهمة خارجية') {
            updatedDay.delayHours = 0
            updatedDay.deductionAmount = 0
          }
          // إذا كانت الحالة 'متأخر' فسنبقي على قيم التأخير والخصم الحالية
        }
        
        return updatedDay
      }
      return day
    }))
  }

  // إعادة توليد بيانات الشهر بالكامل
  const handleRegenerateMonthlyData = async () => {
    if (!employee || !selectedMonth) return
    
    try {
      setLoadingAttendance(true)
      
      // تحديث إعدادات الإجازات أولاً قبل إعادة التوليد
      await fetchHolidaySettings()
      
      const [year, month] = selectedMonth.split('-')
      const result = await dailyAttendanceService.regenerateMonthlyData(employee._id, year, month)
      
      if (result.success) {
        const today = new Date()
        const todayDateString = today.toISOString().split('T')[0]
        
        // تحويل البيانات للتنسيق المطلوب للجدول مع تطبيق إعدادات الإجازات الحالية
        const formattedData = result.data.data.records
          .filter(record => {
            // فلترة الأيام المستقبلية - عرض فقط حتى اليوم الحالي
            const recordDateString = new Date(record.date).toISOString().split('T')[0]
            return recordDateString <= todayDateString
          })
          .map(record => {
            const recordDate = new Date(record.date)
            const recordDateString = recordDate.toISOString().split('T')[0]
            
            // تطبيق الفحص الديناميكي للإجازات على كل سجل
            const isDynamicWeekend = isWeekendDay(recordDate);
            const dynamicHolidayCheck = isOfficialHoliday(recordDate);
            
            // تحديث حالة السجل بناءً على الإعدادات الديناميكية الحالية
            let updatedStatus = record.status || 'غير متوفر';
            let updatedIsWeekend = isDynamicWeekend;
            
            // إعادة تقييم الحالة بناءً على الإعدادات الجديدة
            if (isDynamicWeekend) {
              updatedStatus = 'عطلة أسبوعية';
            } else if (dynamicHolidayCheck) {
              updatedStatus = `إجازة رسمية - ${dynamicHolidayCheck.name}`;
            } else if (record.status === 'عطلة' || record.status === 'إجازة' || record.status?.includes('عطلة')) {
              // إذا كان السجل محفوظ كعطلة في قاعدة البيانات ولكن الإعدادات تغيرت
              updatedStatus = record.totalHours > 0 ? 'حاضر' : 'غير متوفر';
              updatedIsWeekend = false;
            }

            return {
              id: record._id,
              date: recordDate.toLocaleDateString('en-GB'), // استخدام التاريخ الميلادي بصيغة DD/MM/YYYY
              day: recordDate.toLocaleDateString('ar', { weekday: 'long' }), // يوم الأسبوع بالعربي
              isWeekend: updatedIsWeekend, // استخدام الإعدادات الديناميكية الحالية
              totalHours: record.totalHours || 0,
              activeHours: record.activeHours || 0,
              requiredTime: record.requiredTime || '08:00',
              delayHours: record.delayHours || 0,
              deductionAmount: record.deductionAmount || 0,
              status: updatedStatus, // استخدام الحالة المحدثة
              isToday: recordDateString === todayDateString
            }
          })
        
        setAttendanceData(formattedData)
        
        // إعادة حساب الإحصائيات بناءً على البيانات المحدثة (استبعاد العطل الرسمية والأسبوعية)
        const workingDays = formattedData.filter(day => 
          !day.isWeekend && 
          !day.status.includes('عطلة') && 
          !day.status.includes('إجازة رسمية') &&
          day.status !== 'مهمة خارجية'
        )
        const presentDays = workingDays.filter(day => day.status !== 'غائب' && day.status !== 'غير متوفر')
        const lateDays = workingDays.filter(day => day.status === 'متأخر')
        const absentDays = workingDays.filter(day => day.status === 'غائب')
        const totalDeductions = workingDays.reduce((sum, day) => sum + (day.deductionAmount || 0), 0)
        
        setAttendanceStats({
          totalWorkingDays: workingDays.length,
          presentDays: presentDays.length,
          lateDays: lateDays.length,
          absentDays: absentDays.length,
          totalHours: formattedData.reduce((sum, day) => sum + (day.totalHours || 0), 0),
          totalActiveHours: formattedData.reduce((sum, day) => sum + (day.activeHours || 0), 0),
          totalDelayHours: formattedData.reduce((sum, day) => sum + (day.delayHours || 0), 0),
          totalDeductions: totalDeductions
        })
        
        setNotification({
          type: 'success',
          message: 'تم إعادة توليد بيانات الشهر بنجاح مع تطبيق إعدادات الإجازات الحالية'
        })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'خطأ في إعادة توليد البيانات'
        })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('خطأ في إعادة توليد البيانات:', error)
      setNotification({
        type: 'error',
        message: 'خطأ في الاتصال بالخادم'
      })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setLoadingAttendance(false)
    }
  }

  // إعادة تعيين النظام من تاريخ اليوم
  const handleResetFromToday = async () => {
    if (!employee) return
    
    try {
      setLoadingAttendance(true)
      
      // تحديث إعدادات الإجازات أولاً قبل إعادة التعيين
      await fetchHolidaySettings()
      
      const result = await dailyAttendanceService.resetFromToday(employee._id)
      
      if (result.success) {
        const today = new Date()
        const todayDateString = today.toISOString().split('T')[0]
        
        // تحويل البيانات للتنسيق المطلوب للجدول مع تطبيق إعدادات الإجازات الحالية
        const formattedData = result.data.data.records.map(record => {
          const recordDate = new Date(record.date)
          const recordDateString = recordDate.toISOString().split('T')[0]
          
          // تطبيق الفحص الديناميكي للإجازات على كل سجل
          const isDynamicWeekend = isWeekendDay(recordDate);
          const dynamicHolidayCheck = isOfficialHoliday(recordDate);
          
          // تحديث حالة السجل بناءً على الإعدادات الديناميكية الحالية
          let updatedStatus = record.status || 'غير متوفر';
          let updatedIsWeekend = isDynamicWeekend;
          
          // إعادة تقييم الحالة بناءً على الإعدادات الجديدة
          if (isDynamicWeekend) {
            updatedStatus = 'عطلة أسبوعية';
          } else if (dynamicHolidayCheck) {
            updatedStatus = `إجازة رسمية - ${dynamicHolidayCheck.name}`;
          } else if (record.status === 'عطلة' || record.status === 'إجازة' || record.status?.includes('عطلة')) {
            // إذا كان السجل محفوظ كعطلة في قاعدة البيانات ولكن الإعدادات تغيرت
            updatedStatus = record.totalHours > 0 ? 'حاضر' : 'غير متوفر';
            updatedIsWeekend = false;
          }

          return {
            id: record._id,
            date: recordDate.toLocaleDateString('en-GB'),
            day: recordDate.toLocaleDateString('ar', { weekday: 'long' }),
            isWeekend: updatedIsWeekend, // استخدام الإعدادات الديناميكية الحالية
            totalHours: record.totalHours || 0,
            activeHours: record.activeHours || 0,
            requiredTime: record.requiredTime || '08:00',
            delayHours: record.delayHours || 0,
            deductionAmount: record.deductionAmount || 0,
            status: updatedStatus, // استخدام الحالة المحدثة
            isToday: recordDateString === todayDateString
          }
        })
        
        setAttendanceData(formattedData)
        
        // إعادة حساب الإحصائيات بناءً على البيانات المحدثة (استبعاد العطل الرسمية والأسبوعية)
        const workingDays = formattedData.filter(day => 
          !day.isWeekend && 
          !day.status.includes('عطلة') && 
          !day.status.includes('إجازة رسمية') &&
          day.status !== 'مهمة خارجية'
        )
        const presentDays = workingDays.filter(day => day.status !== 'غائب' && day.status !== 'غير متوفر')
        const lateDays = workingDays.filter(day => day.status === 'متأخر')
        const absentDays = workingDays.filter(day => day.status === 'غائب')
        const totalDeductions = workingDays.reduce((sum, day) => sum + (day.deductionAmount || 0), 0)
        
        setAttendanceStats({
          totalWorkingDays: workingDays.length,
          presentDays: presentDays.length,
          lateDays: lateDays.length,
          absentDays: absentDays.length,
          totalHours: formattedData.reduce((sum, day) => sum + (day.totalHours || 0), 0),
          totalActiveHours: formattedData.reduce((sum, day) => sum + (day.activeHours || 0), 0),
          totalDelayHours: formattedData.reduce((sum, day) => sum + (day.delayHours || 0), 0),
          totalDeductions: totalDeductions
        })
        
        // تحديث الشهر المحدد ليكون الشهر الحالي
        const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
        setSelectedMonth(currentMonth)
        
        setNotification({
          type: 'success',
          message: 'تم إعادة تعيين النظام بنجاح مع تطبيق إعدادات الإجازات الحالية! الجدول يقف الآن عند تاريخ اليوم'
        })
        setTimeout(() => setNotification(null), 5000)
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'خطأ في إعادة تعيين النظام'
        })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('خطأ في إعادة تعيين النظام:', error)
      setNotification({
        type: 'error',
        message: 'خطأ في الاتصال بالخادم'
      })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setLoadingAttendance(false)
    }
  }

  // إضافة دالة التحديث التلقائي اليومي
  const handleAutoUpdateDaily = async () => {
    if (!employee) return
    
    try {
      setLoadingAttendance(true)
      const response = await fetch('http://localhost:5001/api/daily-attendance/auto-update-daily', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // إعادة تحميل بيانات الحضور
        await fetchAttendanceData()
        
        setNotification({
          type: 'success',
          message: `تم تحديث سجلات ${result.data.updated} موظف بنجاح! ${result.data.errors > 0 ? `مع ${result.data.errors} أخطاء` : ''}`
        })
        setTimeout(() => setNotification(null), 5000)
      } else {
        throw new Error('فشل في التحديث التلقائي')
      }
    } catch (error) {
      console.error('خطأ في التحديث التلقائي:', error)
      setNotification({
        type: 'error',
        message: 'فشل في التحديث التلقائي للسجلات'
      })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const getArabicMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // Helper functions
  const getAvatarColor = (id) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
    if (!id) return colors[0]
    const numericId = typeof id === 'string' ? id.length : id
    return colors[numericId % colors.length]
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ')[0].charAt(0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0) + ' جنيه'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG')
  }

  // دالة تحويل الساعات إلى ساعات ودقائق
  const formatHoursToHoursMinutes = (totalHours) => {
    if (!totalHours || totalHours === 0) return '0 ساعة 0 دقيقة'
    
    const hours = Math.floor(totalHours)
    const minutes = Math.round((totalHours - hours) * 60)
    
    let result = ''
    if (hours > 0) {
      result += `${hours} ساعة`
    }
    if (minutes > 0) {
      if (hours > 0) result += ' '
      result += `${minutes} دقيقة`
    }
    
    return result || '0 ساعة 0 دقيقة'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات الموظف...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <User className="w-12 h-12 mx-auto mb-4" />
              {error || 'موظف غير موجود'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'لم يتم العثور على الموظف المطلوب'}
            </p>
            <Button onClick={() => navigate('/employees')}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة لإدارة الموظفين
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const employeeId = employee.id || employee._id || '000'
  const employeeIdString = typeof employeeId === 'string' ? employeeId.slice(-3) : employeeId.toString()

  return (
    <div className="space-y-6">
      {/* إشعار النجاح/الخطأ */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
        {/* رأس الصفحة */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/employees')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة لإدارة الموظفين
          </Button>
          
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getAvatarColor(employeeId)}`}>
                  {getInitials(employee.name)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{employee.name}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">{employee.position}</p>
              <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                  EMP-{employeeIdString.padStart(3, '0')}
                    </span>
                <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {employee.status || 'نشط'}
                    </span>
                    {employee.teamLead && (
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm px-2 py-1 rounded-full flex items-center">
                        <Shield className="w-3 h-3 ml-1" />
                        قائد فريق
                      </span>
                    )}
                  </div>
                </div>
          </div>
          
          <div className="mt-4 lg:mt-0">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل البيانات
                  </Button>
                  <Button size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تحديث البيانات
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </>
              )}
              </div>
            </div>
          </div>
        </div>

      {/* التبويبات */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-0 rtl:space-x-reverse min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/employees/${id}/${tab.id}`)}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  currentSection === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* محتوى التبويب */}
      {renderTabContent()}
    </div>
  )

  // دالة عرض محتوى التبويب
  function renderTabContent() {
    switch(currentSection) {
      case 'overview': return renderOverview()
      case 'desktop-tracking': return renderDesktopTracking()
      case 'salary': return renderSalary()
      case 'attendance': return renderAttendance()
      case 'performance': return renderPerformance()
      case 'documents': return renderDocuments()
      case 'requests': return renderRequests()
      default: return renderOverview()
    }
  }

  // نظرة عامة
  function renderOverview() {
    const attendanceRate = employee.attendance ? 
      Math.round((employee.attendance.presentDays / employee.attendance.totalWorkingDays) * 100) : 0
    
    const yearsOfExperience = employee.joinDate ? 
      Math.floor((new Date() - new Date(employee.joinDate)) / (365.25 * 24 * 60 * 60 * 1000)) : 0

    return (
      <div className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">الراتب الصافي</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {(() => {
                      const baseSalary = employee.baseSalary || 0
                      const allowances = employee.allowances ? Object.values(employee.allowances).reduce((sum, val) => sum + (val || 0), 0) : 0
                      const bonuses = employee.monthlyAdjustments?.bonuses ? employee.monthlyAdjustments.bonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0) : 0
                      const deductions = employee.deductions ? Object.values(employee.deductions).reduce((sum, val) => sum + (val || 0), 0) : 0
                      const monthlyDeductions = employee.monthlyAdjustments?.deductions ? employee.monthlyAdjustments.deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0) : 0
                      return formatCurrency(baseSalary + allowances + bonuses - deductions - monthlyDeductions)
                    })()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">نسبة الحضور</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{attendanceRate}%</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">تقييم الأداء</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {employee.performance?.rating || 0}/5
                  </p>
                </div>
                <Star className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">سنوات الخبرة</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{yearsOfExperience}</p>
                </div>
                <Award className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات مفصلة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* معلومات الاتصال */}
          <Card>
              <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>معلومات الاتصال</span>
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {!isEditing ? (
                <>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300">البريد الإلكتروني</p>
                    <p className="text-blue-600 dark:text-blue-400">{employee.email}</p>
                  </div>
                </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300">الهاتف</p>
                    <p className="text-blue-600 dark:text-blue-400">{employee.phone}</p>
                  </div>
                </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300">الموقع</p>
                      <p className="dark:text-gray-400">{employee.location || employee.workLocation || 'غير محدد'}</p>
                  </div>
                </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={editForm.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">الهاتف</Label>
                    <Input
                      id="phone"
                      value={editForm.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">الموقع</Label>
                    <Input
                      id="location"
                      value={editForm.location || editForm.workLocation || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              </CardContent>
            </Card>

            {/* معلومات التوظيف */}
          <Card>
              <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Building className="w-5 h-5 text-green-500 dark:text-green-400" />
                <span>معلومات التوظيف</span>
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
              {!isEditing ? (
                <>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">تاريخ الانضمام:</span>
                  <span className="dark:text-white">{formatDate(employee.joinDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">سنوات الخبرة:</span>
                  <span className="dark:text-white">{yearsOfExperience} سنوات</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">التعليم:</span>
                    <span className="dark:text-white">{employee.education || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">الراتب الأساسي:</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(employee.baseSalary || 0)}</span>
                </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="position" className="text-sm font-medium">المنصب</Label>
                    <Input
                      id="position"
                      value={editForm.position || ''}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="mt-1"
                    />
                </div>
                  <div>
                    <Label htmlFor="joinDate" className="text-sm font-medium">تاريخ الانضمام</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={editForm.joinDate ? new Date(editForm.joinDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('joinDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="education" className="text-sm font-medium">التعليم</Label>
                    <Input
                      id="education"
                      value={editForm.education || ''}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="baseSalary" className="text-sm font-medium">الراتب الأساسي</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.baseSalary || ''}
                      onChange={(e) => handleInputChange('baseSalary', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">الحالة</Label>
                    <select
                      id="status"
                      value={editForm.status || 'نشط'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="نشط">نشط</option>
                      <option value="معطل">معطل</option>
                      <option value="إجازة">إجازة</option>
                      <option value="منتهي الخدمة">منتهي الخدمة</option>
                    </select>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </div>
      </div>
    )
  }

  // Placeholder functions for other tabs
  function renderDesktopTracking() {
    return (
      <div className="text-center py-12">
        <Monitor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">مراقبة سطح المكتب</h3>
        <p className="text-gray-500 dark:text-gray-400">سيتم تطوير هذا القسم قريباً</p>
      </div>
    )
  }

  function renderSalary() {
    // التحقق من وجود بيانات الموظف
    if (!employee) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">جاري تحميل بيانات الموظف...</p>
          </div>
        </div>
      )
    }

    // حساب البيانات المالية
    const baseSalary = employee?.baseSalary || 0
    
    // حساب خصومات التأخير من بيانات الجدول (مع استبعاد العطل الرسمية)
    const workingDaysOnly = attendanceData.filter(day => 
      !day.isWeekend && 
      day.status !== 'عطلة' && 
      day.status !== 'إجازة' && 
      day.status !== 'مهمة خارجية'
    )
    const totalLateDays = workingDaysOnly.filter(day => day.status === 'متأخر').length
    const totalLateHours = workingDaysOnly.reduce((sum, day) => sum + (day.delayHours || 0), 0)
    
    // حساب معدل الساعة بناءً على الأيام العملية فقط (استبعاد العطل الرسمية)
    const workingDaysInMonth = workingDaysOnly.length > 0 ? workingDaysOnly.length : 22 // افتراض 22 يوم عمل إذا لم توجد بيانات
    const dailyRate = baseSalary / workingDaysInMonth
    const hourlyRate = Math.round(dailyRate / 8) // معدل الساعة
    const totalLatenessDeduction = workingDaysOnly.reduce((sum, day) => sum + (day.deductionAmount || 0), 0)
    
    // حساب المجاميع
    const totalBonuses = monthlyBonuses.reduce((sum, bonus) => sum + (Number(bonus.amount) || 0), 0)
    const totalMonthlyDeductions = monthlyDeductions.reduce((sum, deduction) => sum + (Number(deduction.amount) || 0), 0)
    const totalAllDeductions = totalMonthlyDeductions + totalLatenessDeduction // إجمالي جميع الخصومات
    const netSalary = baseSalary + totalBonuses - totalAllDeductions

    return (
      <div className="space-y-8">
        {/* رأس القسم مع اختيار الشهر */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                    <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة الراتب والمزايا</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">إدارة شاملة لراتب الموظف والمكافآت والخصومات</p>
                    </div>
                  </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse flex-wrap gap-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">الشهر:</Label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm min-w-[160px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() - i)
                    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    return (
                      <option key={monthValue} value={monthValue}>
                        {getArabicMonthName(monthValue)}
                      </option>
                    )
                  })}
                </select>
                
                <Button
                  onClick={handleAutoUpdateDaily}
                  disabled={loadingAttendance}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingAttendance ? 'animate-spin' : ''}`} />
                  تحديث شامل
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
              </Card>

        {/* ملخص الراتب - البطاقات الملونة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* الراتب الأساسي */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">الراتب الأساسي</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(baseSalary)}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">المبلغ الثابت الشهري</p>
                    </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                  </div>
                </CardContent>
              </Card>

          {/* إجمالي المكافآت */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">إجمالي المكافآت</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalBonuses)}</p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">المكافآت الشهرية</p>
                    </div>
                <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                  <Plus className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                  </div>
                </CardContent>
              </Card>

          {/* إجمالي الخصومات */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">إجمالي الخصومات</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalAllDeductions)}</p>
                  <div className="text-xs text-red-500 dark:text-red-400 mt-1 space-y-1">
                    <div>خصومات شهرية: {formatCurrency(totalMonthlyDeductions)}</div>
                    <div>خصم التأخير: {formatCurrency(totalLatenessDeduction)}</div>
                    </div>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                  <Minus className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                  </div>
                </CardContent>
              </Card>

          {/* صافي الراتب */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">صافي الراتب</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(netSalary)}</p>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">المبلغ النهائي للاستلام</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                  <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                </div>
              </CardContent>
            </Card>
        </div>



        {/* قسم خصم التأخير */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 border-yellow-200 dark:border-yellow-700">
              <CardHeader>
            <CardTitle className="flex items-center space-x-3 rtl:space-x-reverse">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span>خصم التأخير اليومي</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ساعات التأخير */}
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-yellow-200 dark:border-yellow-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">ساعات التأخير الشهري</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{formatHoursToHoursMinutes(totalLateHours)}</p>
                <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">إجمالي في {totalLateDays} يوم</p>
                      </div>

              {/* معدل الخصم */}
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
                    <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">معدل الخصم/ساعة</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(hourlyRate)}</p>
                <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">من الراتب اليومي</p>
              </div>

              {/* إجمالي الخصم */}
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                    <Minus className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">إجمالي خصم التأخير</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalLatenessDeduction)}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">خصم الشهر</p>
              </div>
            </div>

            {/* تفاصيل حساب التأخير */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Calculator className="w-4 h-4 ml-2" />
                طريقة حساب خصم التأخير
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="space-y-2">
                      <div className="flex justify-between">
                    <span>الراتب الأساسي:</span>
                    <span className="font-medium">{formatCurrency(baseSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                    <span>أيام العمل الفعلية (بدون عطل):</span>
                    <span className="font-medium">{workingDaysInMonth} يوم</span>
                      </div>
                      <div className="flex justify-between">
                    <span>الراتب اليومي (÷ أيام العمل):</span>
                    <span className="font-medium">{formatCurrency(Math.round(dailyRate))}</span>
                      </div>
                        <div className="flex justify-between">
                    <span>الراتب بالساعة (÷ 8):</span>
                    <span className="font-medium">{formatCurrency(hourlyRate)}</span>
                        </div>
                </div>
                <div className="space-y-2">
                        <div className="flex justify-between">
                    <span>ساعات التأخير الشهري (أيام العمل فقط):</span>
                    <span className="font-medium text-yellow-600">{formatHoursToHoursMinutes(totalLateHours)}</span>
                        </div>
                        <div className="flex justify-between">
                    <span>أيام التأخير (بدون عطل):</span>
                    <span className="font-medium text-yellow-600">{totalLateDays} يوم</span>
                        </div>
                  <div className="flex justify-between">
                    <span>خصم التأخير:</span>
                    <span className="font-medium text-red-600">{formatCurrency(totalLatenessDeduction)}</span>
                    </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">صافي الراتب النهائي:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(netSalary)}</span>
                  </div>
                </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* سجل التأخيرات الشهري */}
                        <Card className="bg-gradient-to-br from-amber-50 to-red-100 dark:from-amber-900/20 dark:to-red-800/20 border-amber-200 dark:border-amber-700">
              <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span>سجل التأخيرات الشهري - {getArabicMonthName(selectedMonth)}</span>
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="text-sm text-green-700 dark:text-green-300 flex items-center">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full ml-2 block"></span>
                        البيانات تأتي من نفس مصدر <strong>جدول سجل الأيام التفصيلي</strong> في صفحة Desktop Tracking
                      </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      أوقات الحضور الكلي والنشط ثابتة من التطبيق - حساب ساعات التأخير والخصم يعتمد على 8 ساعات يومياً (بدون احتساب العطل الرسمية والإجازات)
                    </p>
                  </div>
                </div>
                <span className="text-sm bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full">
                  إجمالي الخصم: {formatCurrency(totalLatenessDeduction)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {!isEditingAttendance ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEditAttendance}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل الجدول
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegenerateMonthlyData}
                      className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                      disabled={loadingAttendance}
                    >
                      <RefreshCw className={`w-4 h-4 ml-2 ${loadingAttendance ? 'animate-spin' : ''}`} />
                      إعادة توليد البيانات
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResetFromToday}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      disabled={loadingAttendance}
                    >
                      <CalendarIcon className={`w-4 h-4 ml-2 ${loadingAttendance ? 'animate-pulse' : ''}`} />
                      إعادة تعيين من اليوم
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEditAttendance}
                      className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                    >
                      <X className="w-4 h-4 ml-2" />
                      إلغاء
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveAttendance}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 ml-2" />
                      حفظ التغييرات
                    </Button>
                  </>
                )}
              </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
            {isEditingAttendance && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-blue-800 dark:text-blue-200">
                  <Edit className="w-5 h-5" />
                  <p className="font-medium">وضع التعديل نشط</p>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  يمكنك تعديل الأوقات المطلوبة، قيمة الخصم، والحالة لكل يوم. <strong>أوقات الحضور الكلي والنشط ثابتة من التطبيق ولا يمكن تعديلها.</strong>
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                  💡 تلميح: تغيير الحالة إلى "غائب" سيطبق خصم يوم كامل، بينما "إجازة" أو "مهمة خارجية" لن تؤثر على الراتب.
                </p>
              </div>
            )}
            
            {loadingAttendance ? (
              <div className="text-center py-16">
                <RefreshCw className="w-12 h-12 animate-spin mx-auto text-amber-500 mb-4" />
                <p className="text-amber-600 dark:text-amber-400 text-lg font-medium">جاري تحميل بيانات التأخيرات من الخادم...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">يتم جلب البيانات الحقيقية لشهر {getArabicMonthName(selectedMonth)}</p>
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="text-center py-16">
                <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">لا توجد بيانات حضور لهذا الشهر</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">سيتم إنشاء البيانات تلقائياً عند الحاجة</p>
              </div>
            ) : (
                <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                    <thead>
                  <tr className="bg-amber-100 dark:bg-amber-900/30">
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-right text-sm font-semibold text-amber-800 dark:text-amber-200">التاريخ</th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">اليوم</th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200 bg-blue-100 dark:bg-blue-900/30">
                      <div>الحضور الكلي</div>
                      <div className="text-xs font-normal text-blue-600 dark:text-blue-400">(من التطبيق)</div>
                    </th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200 bg-green-100 dark:bg-green-900/30">
                      <div>الحضور النشط</div>
                      <div className="text-xs font-normal text-green-600 dark:text-green-400">(من التطبيق)</div>
                    </th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">الوقت المطلوب</th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">ساعات التأخير</th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">قيمة الخصم</th>
                    <th className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                  {attendanceData.map((dayData) => (
                    <tr key={dayData.id} className={`hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors duration-200 ${
                      dayData.isToday ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-300 dark:ring-blue-600' : 
                      dayData.isWeekend ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-right text-sm">
                        <div className="flex items-center justify-between">
                          <span className={dayData.isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>{dayData.date}</span>
                          {dayData.isToday && (
                            <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">اليوم</span>
                          )}
                        </div>
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm">
                        {dayData.isWeekend ? (
                          <span className="text-gray-500 dark:text-gray-400">{dayData.day}</span>
                        ) : (
                          <span className={dayData.isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>{dayData.day}</span>
                        )}
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm bg-blue-50 dark:bg-blue-900/20">
                        {dayData.isWeekend ? (
                          <span className="text-gray-400">-</span>
                        ) : dayData.totalHours > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {formatHoursToHoursMinutes(dayData.totalHours)}
                            <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">من التطبيق</div>
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs">لا توجد بيانات</span>
                        )}
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm bg-green-50 dark:bg-green-900/20">
                        {dayData.isWeekend ? (
                          <span className="text-gray-400">-</span>
                        ) : dayData.activeHours > 0 ? (
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            {formatHoursToHoursMinutes(dayData.activeHours)}
                            <div className="text-xs text-green-500 dark:text-green-300 mt-1">من التطبيق</div>
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs">لا توجد بيانات</span>
                        )}
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm">
                        {dayData.isWeekend ? (
                          <span className="text-gray-400">-</span>
                        ) : isEditingAttendance ? (
                          <input
                            type="time"
                            value={dayData.requiredTime}
                            onChange={(e) => handleAttendanceFieldChange(dayData.id, 'requiredTime', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          dayData.requiredTime
                        )}
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm">
                        {dayData.isWeekend ? (
                          <span className="text-gray-400">-</span>
                        ) : dayData.delayHours > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">
                            {formatHoursToHoursMinutes(dayData.delayHours)}
                            </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">-</span>
                        )}
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm">
                        {dayData.isWeekend ? (
                          <span className="text-gray-400">-</span>
                        ) : isEditingAttendance ? (
                          <input
                            type="number"
                            value={dayData.deductionAmount || 0}
                            onChange={(e) => handleAttendanceFieldChange(dayData.id, 'deductionAmount', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="1"
                          />
                        ) : dayData.deductionAmount > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">
                            {formatCurrency(dayData.deductionAmount)}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">-</span>
                        )}
                      </td>
                      <td className="border border-amber-200 dark:border-amber-700 px-4 py-3 text-center text-sm">
                        {dayData.isWeekend ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            عطلة
                          </span>
                        ) : isEditingAttendance ? (
                          <select
                            value={dayData.status}
                            onChange={(e) => handleAttendanceFieldChange(dayData.id, 'status', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="في الوقت">في الوقت</option>
                            <option value="متأخر">متأخر</option>
                            <option value="غائب">غائب</option>
                            <option value="إجازة">إجازة</option>
                            <option value="إجازة رسمية">إجازة رسمية</option>
                            <option value="مهمة خارجية">مهمة خارجية</option>
                          </select>
                        ) : dayData.status === 'إجازة رسمية' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                            إجازة رسمية
                          </span>
                        ) : dayData.status === 'متأخر' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                            متأخر
                          </span>
                        ) : dayData.status === 'غائب' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-100">
                            غائب
                          </span>
                        ) : dayData.status === 'إجازة' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                            إجازة
                          </span>
                        ) : dayData.status === 'مهمة خارجية' ? (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                            مهمة خارجية
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            في الوقت
                          </span>
                        )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                <tfoot>
                  {(() => {
                    const totalDelayHours = attendanceData.reduce((sum, day) => sum + (day.delayHours || 0), 0)
                    const totalDeductionAmount = attendanceData.reduce((sum, day) => sum + (day.deductionAmount || 0), 0)
                    const totalHours = attendanceData.reduce((sum, day) => sum + (day.totalHours || 0), 0)
                    const totalActiveHours = attendanceData.reduce((sum, day) => sum + (day.activeHours || 0), 0)
                    return (
                      <tr className="bg-amber-200 dark:bg-amber-900/50 font-bold">
                        <td colSpan="2" className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-right text-sm">
                          إجمالي الشهر:
                        </td>
                        <td className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-center text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                          <div className="font-bold">{totalHours.toFixed(2)} ساعة</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">من التطبيق</div>
                        </td>
                        <td className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-center text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20">
                          <div className="font-bold">{totalActiveHours.toFixed(2)} ساعة</div>
                          <div className="text-xs text-green-600 dark:text-green-400">من التطبيق</div>
                        </td>
                        <td className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-center text-sm">
                          -
                        </td>
                        <td className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-center text-sm text-red-700 dark:text-red-300">
                          {totalDelayHours.toFixed(1)} ساعة
                        </td>
                        <td className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-center text-sm text-red-700 dark:text-red-300">
                          {formatCurrency(totalDeductionAmount)}
                        </td>
                        <td className="border border-amber-300 dark:border-amber-600 px-4 py-3 text-center text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            totalDelayHours === 0 ? 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200' :
                            totalDelayHours <= 5 ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' :
                            'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                          }`}>
                            {totalDelayHours === 0 ? 'ممتاز' : totalDelayHours <= 5 ? 'جيد' : 'يحتاج تحسن'}
                          </span>
                        </td>
                      </tr>
                    )
                  })()}
                </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>



        {/* مودال إضافة مكافأة */}
        {showBonusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                      <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إضافة مكافأة شهرية</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowBonusModal(false)} className="rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="bonusType" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">نوع المكافأة</Label>
                    <select
                      id="bonusType"
                      value={bonusForm.type}
                      onChange={(e) => setBonusForm({...bonusForm, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- اختر نوع المكافأة --</option>
                      <option value="أداء متميز">مكافأة أداء متميز</option>
                      <option value="وقت إضافي">مكافأة وقت إضافي</option>
                      <option value="مشروع">مكافأة إنجاز مشروع</option>
                      <option value="عيد">مكافأة عيد</option>
                      <option value="تشجيعية">مكافأة تشجيعية</option>
                      <option value="خاصة">مكافأة خاصة</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bonusAmount" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">المبلغ (ريال)</Label>
                    <Input
                      id="bonusAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bonusForm.amount}
                      onChange={(e) => setBonusForm({...bonusForm, amount: e.target.value})}
                      placeholder="أدخل مبلغ المكافأة"
                      className="px-4 py-3 text-lg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bonusDescription" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">الوصف</Label>
                    <Input
                      id="bonusDescription"
                      value={bonusForm.description}
                      onChange={(e) => setBonusForm({...bonusForm, description: e.target.value})}
                      placeholder="وصف المكافأة"
                      className="px-4 py-3"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bonusReason" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">السبب (اختياري)</Label>
                    <Textarea
                      id="bonusReason"
                      value={bonusForm.reason}
                      onChange={(e) => setBonusForm({...bonusForm, reason: e.target.value})}
                      placeholder="اذكر سبب منح المكافأة..."
                      rows={3}
                      className="px-4 py-3"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 rtl:space-x-reverse mt-8">
                  <Button 
                    onClick={handleAddBonus}
                    disabled={!bonusForm.type || !bonusForm.amount || !bonusForm.description}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3 text-lg font-medium shadow-lg"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    حفظ المكافأة
                  </Button>
                  <Button variant="outline" onClick={() => setShowBonusModal(false)} className="px-8 py-3">
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* مودال إضافة خصم */}
        {showDeductionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                      <Minus className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إضافة خصم شهري</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowDeductionModal(false)} className="rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="deductionType" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">نوع الخصم</Label>
                    <select
                      id="deductionType"
                      value={deductionForm.type}
                      onChange={(e) => setDeductionForm({...deductionForm, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- اختر نوع الخصم --</option>
                      <option value="غياب">خصم غياب</option>
                      <option value="تأخير">خصم تأخير</option>
                      <option value="قرض">سداد قرض</option>
                      <option value="سلفة">سداد سلفة</option>
                      <option value="تأديبي">خصم تأديبي</option>
                      <option value="إداري">خصم إداري</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="deductionAmount" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">المبلغ (ريال)</Label>
                    <Input
                      id="deductionAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deductionForm.amount}
                      onChange={(e) => setDeductionForm({...deductionForm, amount: e.target.value})}
                      placeholder="أدخل مبلغ الخصم"
                      className="px-4 py-3 text-lg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deductionDescription" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">الوصف</Label>
                    <Input
                      id="deductionDescription"
                      value={deductionForm.description}
                      onChange={(e) => setDeductionForm({...deductionForm, description: e.target.value})}
                      placeholder="وصف الخصم"
                      className="px-4 py-3"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deductionReason" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">السبب (اختياري)</Label>
                    <Textarea
                      id="deductionReason"
                      value={deductionForm.reason}
                      onChange={(e) => setDeductionForm({...deductionForm, reason: e.target.value})}
                      placeholder="اذكر سبب الخصم..."
                      rows={3}
                      className="px-4 py-3"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 rtl:space-x-reverse mt-8">
                  <Button 
                    onClick={handleAddDeduction}
                    disabled={!deductionForm.type || !deductionForm.amount || !deductionForm.description}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-3 text-lg font-medium shadow-lg"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    حفظ الخصم
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeductionModal(false)} className="px-8 py-3">
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderAttendance() {
    const attendance = employee.attendance || {}
    const presentDays = attendance.presentDays || 22
    const absentDays = attendance.absentDays || 2
    const lateDays = attendance.lateDays || 3
    const totalWorkingDays = attendance.totalWorkingDays || 24
    const attendanceRate = Math.round((presentDays / totalWorkingDays) * 100)

    // بيانات وهمية للأسبوع
    const weeklyAttendance = [
      { day: 'السبت', date: '15/6', status: 'حاضر', checkIn: '09:00', checkOut: '17:00' },
      { day: 'الأحد', date: '16/6', status: 'حاضر', checkIn: '09:15', checkOut: '17:05' },
      { day: 'الإثنين', date: '17/6', status: 'متأخر', checkIn: '09:30', checkOut: '17:30' },
      { day: 'الثلاثاء', date: '18/6', status: 'حاضر', checkIn: '08:55', checkOut: '17:00' },
      { day: 'الأربعاء', date: '19/6', status: 'غائب', checkIn: '-', checkOut: '-' },
      { day: 'الخميس', date: '20/6', status: 'حاضر', checkIn: '09:00', checkOut: '17:10' },
      { day: 'الجمعة', date: '21/6', status: 'إجازة', checkIn: '-', checkOut: '-' }
    ]

    return (
      <div className="space-y-6">
        {/* إحصائيات الحضور */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">أيام الحضور</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{presentDays}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">أيام الغياب</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{absentDays}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">أيام التأخير</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{lateDays}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات العمل */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>مواعيد العمل</span>
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">وقت الدخول:</span>
                <span className="font-semibold dark:text-white">9:00 صباحاً</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">وقت الخروج:</span>
                <span className="font-semibold dark:text-white">5:00 مساءً</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">ساعات العمل اليومية:</span>
                <span className="font-semibold dark:text-white">8 ساعات</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">أيام العمل الأسبوعية:</span>
                <span className="font-semibold dark:text-white">6 أيام</span>
                </div>
              </CardContent>
            </Card>

          <Card>
              <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart3 className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span>نسبة الحضور</span>
              </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${attendanceRate * 3.14} 314`}
                      className="text-blue-500 dark:text-blue-400"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendanceRate}%</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {presentDays} من {totalWorkingDays} يوم عمل
                </p>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* حضور الأسبوع */}
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <CalendarIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
              <span>حضور الأسبوع الحالي</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weeklyAttendance.map((day, index) => (
                <div key={index} className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {day.day}
                        </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    {day.date}
                    </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    day.status === 'حاضر' || day.status === 'في الوقت' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    day.status === 'متأخر' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                    day.status === 'غائب' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    day.status === 'إجازة رسمية' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                    day.status === 'إجازة' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    day.status === 'مهمة خارجية' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                    day.status === 'عطلة' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {day.status}
                  </div>
                  {day.checkIn !== '-' && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>دخول: {day.checkIn}</div>
                      <div>خروج: {day.checkOut}</div>
                    </div>
                  )}
                        </div>
                      ))}
                    </div>
          </CardContent>
        </Card>

        {/* رصيد الإجازات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span>رصيد الإجازات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {employee.attendance?.leaveBalance || 21}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">إجازة متبقية</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">9</div>
                <div className="text-sm text-green-600 dark:text-green-400">إجازة مستخدمة</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">30</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">إجمالي الإجازات</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
    )
  }

  function renderPerformance() {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">الأداء والتقييم</h3>
        <p className="text-gray-500 dark:text-gray-400">سيتم تطوير هذا القسم قريباً</p>
        </div>
    )
  }

  function renderDocuments() {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">المستندات</h3>
        <p className="text-gray-500 dark:text-gray-400">سيتم تطوير هذا القسم قريباً</p>
      </div>
    )
  }

  function renderRequests() {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">الطلبات والإجازات</h3>
        <p className="text-gray-500 dark:text-gray-400">سيتم تطوير هذا القسم قريباً</p>
    </div>
  )
  }
}

export default EmployeeDetailsPage 