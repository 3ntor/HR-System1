import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { 
  User, 
  BarChart3, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  FileText, 
  Calendar as CalendarIcon,
  Calendar,
  Activity,
  Wallet,
  UserCheck,
  Star,
  CheckCircle,
  Target,
  Award,
  Plus,
  Edit3,
  Bell,
  Download,
  Eye,
  Shield,
  Users,
  Home,
  Car,
  Phone as PhoneIcon,
  BookOpen,
  CreditCard,
  GraduationCap,
  Archive,
  Clock3,
  AlertTriangle,
  Camera,
  RefreshCw,
  FileCheck,
  Calculator,
  Gift,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Calendar as CalendarFilter,
  SlidersHorizontal,
  X,
  Minus,
  Edit,
  Save,
  XCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  BarChart, 
  LineChart,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar,
  Line
} from 'recharts'
import { formatCurrency, formatDate } from '../utils/formatters'
import dailyAttendanceService from '../services/dailyAttendanceService'

// إعداد الـ URL الأساسي للخادم الخلفي
const BACKEND_BASE_URL = 'http://localhost:5001'

const MePage = ({ user, activeSection = 'overview' }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedScreenshot, setSelectedScreenshot] = useState(null)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  
  // حالة بيانات الموظف الحقيقية
  const [employeeProfile, setEmployeeProfile] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [attendanceData, setAttendanceData] = useState(null)
  const [desktopTrackingData, setDesktopTrackingData] = useState(null)
  const [salaryData, setSalaryData] = useState(null)
  const [documentsData, setDocumentsData] = useState(null)
  const [requestsData, setRequestsData] = useState(null)
  const [notificationsData, setNotificationsData] = useState(null)
  const [dailyRecordsData, setDailyRecordsData] = useState(null) // السجلات اليومية الحقيقية
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // إضافة متغيرات خاصة بقسم الراتب من EmployeeDetailsPage
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
  const [attendanceDataEmployee, setAttendanceDataEmployee] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // حالة بيانات الإحصائيات
  const [statsData, setStatsData] = useState(null)
  
  // حالة بيانات المزايا (كانت مفقودة!)
  const [benefitsData, setBenefitsData] = useState([])

  // حالة WebSocket للتحكم في التطبيق المكتبي
  const [socket, setSocket] = useState(null)
  const [desktopAppConnected, setDesktopAppConnected] = useState(false)
  const [remoteControlLoading, setRemoteControlLoading] = useState(false)
  
  // حالات العمل المختلفة
  const [workStatus, setWorkStatus] = useState('stopped') // stopped, working, paused, break
  const [isPaused, setIsPaused] = useState(false)
  const [isOnBreak, setIsOnBreak] = useState(false)

  // حالات مؤقت الاستراحة
  const [breakStartTime, setBreakStartTime] = useState(null)
  const [breakDuration, setBreakDuration] = useState(0) // بالثواني
  const [breakTimer, setBreakTimer] = useState(null)
  
  // flag لحماية حالة الاستراحة من التحديثات غير المرغوب فيها
  const [breakProtectionActive, setBreakProtectionActive] = useState(false)
  
  // حالات التحميل المختلفة
  const [loadingStates, setLoadingStates] = useState({
    syncing: false,
    manualSync: false
  })
  
  // حالات نافذة إدخال سبب الاستراحة
  const [showBreakReasonModal, setShowBreakReasonModal] = useState(false)
  const [breakReason, setBreakReason] = useState('')
  const [breakNotes, setBreakNotes] = useState([]) // قائمة ملاحظات الاستراحات
  const [showBreakNotesModal, setShowBreakNotesModal] = useState(false) // عرض ملاحظات الاستراحة

  // حالات التصفح للصور
  const [currentPage, setCurrentPage] = useState(1)
  const [imagesPerPage] = useState(6) // عدد الصور في كل صفحة
  
  // حالات التصفح للمعرض الثاني  
  const [galleryPage, setGalleryPage] = useState(1)
  const [galleryImagesPerPage] = useState(12) // عدد الصور في كل صفحة للمعرض

  // إعدادات الإجازات
  const [holidaySettings, setHolidaySettings] = useState({
    weekends: [5, 6], // الجمعة والسبت افتراضياً
    holidays: [],
    customDays: []
  })

  // حالات المرشحات (Filters)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: {
      start: '',
      end: ''
    },
    activityType: 'all', // all, work, break, idle
    timeRange: 'all', // all, morning, afternoon, evening
    productivity: 'all', // all, high, medium, low
    searchQuery: ''
  })
  const [filteredScreenshots, setFilteredScreenshots] = useState([])

  // استخدام activeSection من props أو استخراجه من URL
  const currentSection = activeSection || location.pathname.split('/').pop() || 'overview'
  
  console.log('MePage user:', user) // للتحقق من البيانات في console

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

  // إعداد WebSocket للتحكم في التطبيق المكتبي
  useEffect(() => {
    if (!user?.id) return
    
    const newSocket = io('http://localhost:5001')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('🔌 متصل بخادم التحكم عن بُعد')
      
      // تسجيل عميل الويب
      newSocket.emit('register-web-client', {
        userId: user.id
      })
    })

    newSocket.on('desktop-app-status', (data) => {
      console.log('📱 حالة التطبيق المكتبي:', data)
      setDesktopAppConnected(data.connected)
      
      // عند اتصال التطبيق المكتبي، جلب حالة العمل الحالية
      if (data.connected) {
        setTimeout(() => {
          fetchDesktopTrackingData()
        }, 1000)
      }
    })

    newSocket.on('desktop-app-response', (data) => {
      console.log('📡 استجابة من التطبيق المكتبي:', data)
      setRemoteControlLoading(false)
      
      if (data.success) {
        // لا نقوم بتحديث الحالة هنا لأنها محدثة بالفعل من الدوال المحلية
        // هذا يمنع تداخل التحديثات ويحافظ على استقرار الحالة
        console.log('✅ تم تأكيد تنفيذ الأمر:', data.command)
      }
    })

    newSocket.on('command-sent', (data) => {
      console.log('📤 تم إرسال الأمر:', data)
      if (!data.success) {
        setRemoteControlLoading(false)
        alert('فشل في إرسال الأمر: ' + (data.error || 'التطبيق المكتبي غير متصل'))
      }
    })

    return () => {
      newSocket.disconnect()
    }
  }, [user?.id])

  // تحميل ملاحظات الاستراحة من localStorage عند تحميل الصفحة
  useEffect(() => {
    const savedBreakNotes = localStorage.getItem('breakNotes')
    if (savedBreakNotes) {
      try {
        setBreakNotes(JSON.parse(savedBreakNotes))
      } catch (err) {
        console.warn('خطأ في تحميل ملاحظات الاستراحة:', err)
        setBreakNotes([])
      }
    }
  }, [])

  // استعادة حالة العمل من localStorage عند تحميل الصفحة
  useEffect(() => {
    const savedWorkStatus = localStorage.getItem('workStatus')
    if (savedWorkStatus) {
      try {
        const statusData = JSON.parse(savedWorkStatus)
        const savedTime = new Date(statusData.timestamp)
        const now = new Date()
        const timeDiff = (now - savedTime) / 1000 / 60 // بالدقائق
        
        // إذا كانت البيانات المحفوظة أقل من 30 دقيقة، استخدمها كما هي
        if (timeDiff < 30) {
          setWorkStatus(statusData.status || 'stopped')
          setIsPaused(statusData.isPaused || false)
          setIsOnBreak(statusData.isOnBreak || false)
          
          // إذا كانت الحالة المحفوظة "استراحة"، فعل الحماية أيضاً
          if (statusData.status === 'break' || statusData.isOnBreak) {
            setBreakProtectionActive(true)
            console.log('🛡️ تم تفعيل حماية الاستراحة عند استعادة الحالة')
            
            // إعادة تفعيل مؤقت الحماية لـ 10 دقائق
            setTimeout(() => {
              if (isOnBreak) {
                console.log('⏰ المستخدم لا يزال في استراحة - تمديد الحماية لـ 10 دقائق إضافية')
                setTimeout(() => {
                  setBreakProtectionActive(false)
                  console.log('⏰ تم إلغاء حماية الاستراحة تلقائياً بعد 20 دقيقة إجمالية')
                }, 600000)
              } else {
                setBreakProtectionActive(false)
                console.log('⏰ تم إلغاء حماية الاستراحة تلقائياً بعد 10 دقائق')
              }
            }, 600000)
          }
          
          console.log('✅ تم استعادة حالة العمل من localStorage بالكامل:', statusData)
        } else {
          // إذا انتهت صلاحية البيانات، احذفها
          localStorage.removeItem('workStatus')
        }
      } catch (err) {
        console.warn('خطأ في استعادة حالة العمل:', err)
        localStorage.removeItem('workStatus')
      }
    }
  }, [])

  // دوال المرشحات
  const applyFilters = useCallback((screenshots, todayData) => {
    if (!screenshots || screenshots.length === 0) return []
    
    let filtered = [...screenshots]
    
    // تطبيق مرشح البحث
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter((screenshot, index) => 
        screenshot.toLowerCase().includes(query) ||
        `لقطة ${index + 1}`.includes(query)
      )
    }
    
    // تطبيق مرشح التاريخ
    if (filters.dateRange.start || filters.dateRange.end) {
      console.log('🔍 تطبيق مرشح التاريخ:', filters.dateRange)
      filtered = filtered.filter((screenshot) => {
        // استخراج التاريخ من اسم الملف
        // صيغة الاسم: screenshot_real_YYYY-MM-DD_N.png أو screenshot-timestamp-unknown.png
        let screenshotDate = new Date()
        
        // محاولة استخراج التاريخ من اسم الملف
        const dateMatch = screenshot.match(/screenshot_real_(\d{4}-\d{2}-\d{2})_/)
        if (dateMatch) {
          screenshotDate = new Date(dateMatch[1])
          console.log(`📅 تاريخ الصورة ${screenshot}: ${dateMatch[1]} -> ${screenshotDate.toDateString()}`)
        } else {
          // إذا لم نتمكن من استخراج التاريخ، نفترض أنها من اليوم
          const timestampMatch = screenshot.match(/screenshot-(\d+)-/)
          if (timestampMatch) {
            screenshotDate = new Date(parseInt(timestampMatch[1]))
            console.log(`🕐 timestamp الصورة ${screenshot}: ${timestampMatch[1]} -> ${screenshotDate.toDateString()}`)
          } else {
            console.log(`❓ لا يمكن استخراج التاريخ من ${screenshot}, استخدام اليوم الحالي`)
          }
        }
        
        // تحقق من نطاق التاريخ
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start)
          startDate.setHours(0, 0, 0, 0)
          if (screenshotDate < startDate) {
            console.log(`❌ صورة ${screenshot} قبل تاريخ البداية`)
            return false
          }
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end)
          endDate.setHours(23, 59, 59, 999)
          if (screenshotDate > endDate) {
            console.log(`❌ صورة ${screenshot} بعد تاريخ النهاية`)
            return false
          }
        }
        
        console.log(`✅ صورة ${screenshot} مقبولة في المرشح`)
        return true
      })
    }
    
    // تطبيق مرشح نوع النشاط
    if (filters.activityType !== 'all') {
      filtered = filtered.filter((screenshot, index) => {
        const productivity = todayData?.productivity || 0
        if (filters.activityType === 'work' && productivity >= 70) return true
        if (filters.activityType === 'break' && productivity < 30) return true
        if (filters.activityType === 'idle' && productivity >= 30 && productivity < 70) return true
        return false
      })
    }
    
    // تطبيق مرشح الإنتاجية
    if (filters.productivity !== 'all') {
      const productivity = todayData?.productivity || 0
      if (filters.productivity === 'high' && productivity < 80) return []
      if (filters.productivity === 'medium' && (productivity < 50 || productivity >= 80)) return []
      if (filters.productivity === 'low' && productivity >= 50) return []
    }
    
    // تطبيق مرشح الوقت (للصور المأخوذة في فترات معينة من اليوم)
    if (filters.timeRange !== 'all') {
      filtered = filtered.filter((screenshot) => {
        // استخراج الوقت من الصورة
        let screenshotTime = new Date()
        
        // محاولة استخراج الوقت من timestamp
        const timestampMatch = screenshot.match(/screenshot-(\d+)-/)
        if (timestampMatch) {
          screenshotTime = new Date(parseInt(timestampMatch[1]))
        }
        
        const hour = screenshotTime.getHours()
        
        if (filters.timeRange === 'morning' && (hour >= 6 && hour < 12)) return true
        if (filters.timeRange === 'afternoon' && (hour >= 12 && hour < 18)) return true
        if (filters.timeRange === 'evening' && (hour >= 18 || hour < 6)) return true
        return false
      })
    }
    
    return filtered
  }, [filters])

  // دالة إعادة تعيين المرشحات
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: { start: '', end: '' },
      activityType: 'all',
      timeRange: 'all',
      productivity: 'all',
      searchQuery: ''
    })
  }, [])
  
  // دالة تحديث مرشح معين
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // دالة لجلب بيانات اليوم
  const getTodayTrackingData = useCallback(() => {
    // البيانات الحقيقية من desktopTrackingData
    if (desktopTrackingData && desktopTrackingData.todayData) {
      return {
        totalSeconds: desktopTrackingData.todayData.totalSeconds || 0,
        activeSeconds: desktopTrackingData.todayData.activeSeconds || 0,
        idleSeconds: desktopTrackingData.todayData.idleSeconds || 0,
        productivity: desktopTrackingData.todayData.productivity || 0,
        lastActivity: desktopTrackingData.todayData.lastActivity || null,
        isWorking: desktopTrackingData.todayData.isWorking || false,
        status: desktopTrackingData.todayData.status || 'offline',
        screenshots: Array.isArray(desktopTrackingData.todayData.screenshots) ? desktopTrackingData.todayData.screenshots : []
      }
    }
    
    // البيانات الافتراضية إذا لم تكن متوفرة
    return {
      totalSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      productivity: 0,
      lastActivity: null,
      isWorking: false,
      status: 'offline',
      screenshots: []
    }
  }, [desktopTrackingData])

  // تحديث المرشحات عند تغيير الفلاتر أو البيانات
  useEffect(() => {
    const todayData = getTodayTrackingData()
    const screenshots = Array.isArray(todayData?.screenshots) ? todayData.screenshots : []
    const filtered = applyFilters(screenshots, todayData)
    setFilteredScreenshots(filtered)
  }, [filters, desktopTrackingData, applyFilters, getTodayTrackingData])

  // دالة مساعدة لتحديد حالة العمل من البيانات
  const determineWorkStatus = (todayData) => {
    if (!todayData || !todayData.isWorking) {
      return { status: 'stopped', isPaused: false, isOnBreak: false }
    }

    const { breakSeconds = 0, activeSeconds = 0, idleSeconds = 0, totalSeconds = 0 } = todayData
    
    // لا نستخدم وقت الاستراحة لتحديد الحالة تلقائياً
    // بدلاً من ذلك، نعتمد على الحالة المحفوظة في localStorage
    const savedStatus = localStorage.getItem('workStatus')
    if (savedStatus) {
      try {
        const parsed = JSON.parse(savedStatus)
        const timeDiff = new Date() - new Date(parsed.timestamp)
        // إذا كانت الحالة محفوظة في آخر 30 دقيقة، نعطيها الأولوية
        if (timeDiff < 1800000) { // 30 دقيقة
          if (parsed.isOnBreak) {
            console.log('🚫 الحفاظ على حالة الاستراحة من localStorage')
            return { status: 'break', isPaused: false, isOnBreak: true }
          }
          if (parsed.isPaused) {
            console.log('🚫 الحفاظ على حالة الإيقاف المؤقت من localStorage')
            return { status: 'paused', isPaused: true, isOnBreak: false }
          }
        }
      } catch (e) {
        // تجاهل أخطاء التحليل
      }
    }
    
    // إذا كان وقت عدم النشاط كبير جداً (أكثر من 30 دقيقة)
    if (idleSeconds > 30 * 60 && activeSeconds > 0) {
      const lastActivityTime = new Date(todayData.lastActivity)
      const now = new Date()
      const timeSinceLastActivity = (now - lastActivityTime) / 1000
      
      // إذا مر أكثر من 30 دقيقة على آخر نشاط، فهو إيقاف مؤقت
      if (timeSinceLastActivity > 30 * 60) {
        return { status: 'paused', isPaused: true, isOnBreak: false }
      }
    }
    
    // العمل جاري بشكل طبيعي
    return { status: 'working', isPaused: false, isOnBreak: false }
  }

  // جلب بيانات التتبع لسطح المكتب
  const fetchDesktopTrackingData = useCallback(async () => {
    if (!user?.id) return
    
    // إذا كانت حماية الاستراحة مفعلة، لا نحدث الحالة
    if (breakProtectionActive) {
      console.log('🚫 تم منع تحديث بيانات التتبع - حماية الاستراحة مفعلة')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
              const response = await fetch(`http://localhost:5001/api/employees/desktop-tracking/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // تحديث بيانات التتبع المكتبي مع البيانات الكاملة
          setDesktopTrackingData({
            data: result.data,
            todayData: result.todayData
          })
          
          // تحديث حالة العمل بناءً على البيانات المجلبة
          // لكن فقط إذا لم تكن هناك حالة محفوظة حديثاً
          const savedStatus = localStorage.getItem('workStatus')
          let shouldUpdateStatus = true
          let workStatusInfo = { status: 'stopped', isPaused: false, isOnBreak: false }
          
          if (savedStatus) {
            try {
              const parsed = JSON.parse(savedStatus)
              const timeDiff = new Date() - new Date(parsed.timestamp)
              // إذا كانت الحالة المحفوظة أحدث من 30 دقيقة، استخدمها بدلاً من البيانات المجلبة
              if (timeDiff < 1800000) {
                shouldUpdateStatus = false
                workStatusInfo = {
                  status: parsed.status,
                  isPaused: parsed.isPaused,
                  isOnBreak: parsed.isOnBreak
                }
                console.log('🔄 استخدام الحالة المحفوظة بدلاً من البيانات المجلبة:', workStatusInfo)
              }
            } catch (e) {
              // إذا فشل في قراءة البيانات المحفوظة، نحدث الحالة
              shouldUpdateStatus = true
              localStorage.removeItem('workStatus')
            }
          }
          
          if (shouldUpdateStatus) {
            // حماية إضافية: إذا كانت حماية الاستراحة مفعلة أو كان المستخدم في استراحة، لا نحدث الحالة
            if (breakProtectionActive || isOnBreak) {
              console.log('🛡️ حماية إضافية: منع تحديث الحالة بسبب حماية الاستراحة أو الحالة الحالية')
              return // خروج من الدالة بدون تحديث
            }
            
            // نحدد الحالة بناءً على isWorking مع الحفاظ على الحالات الخاصة (استراحة، إيقاف مؤقت)
            if (result.todayData?.isWorking) {
              // استخدام دالة determineWorkStatus للحصول على الحالة الصحيحة
              workStatusInfo = determineWorkStatus(result.todayData)
            } else {
              workStatusInfo = { status: 'stopped', isPaused: false, isOnBreak: false }
            }
            
            setWorkStatus(workStatusInfo.status)
            setIsPaused(workStatusInfo.isPaused)
            setIsOnBreak(workStatusInfo.isOnBreak)
            console.log('🔄 تحديث الحالة من البيانات المجلبة (بدون استراحة تلقائية):', workStatusInfo)
            
            // حفظ الحالة الجديدة في localStorage
            localStorage.setItem('workStatus', JSON.stringify({
              status: workStatusInfo.status,
              isPaused: workStatusInfo.isPaused,
              isOnBreak: workStatusInfo.isOnBreak,
              timestamp: new Date().toISOString()
            }))
          }
          
          console.log('✅ تم تحديث بيانات التتبع وحالة العمل بنجاح:', result)
          
          // تحديث تلقائي للسجلات اليومية عند تحديث بيانات التطبيق
          try {
            await fetchDailyRecords()
            console.log('🔄 تم تحديث السجلات اليومية تلقائياً')
            
            // التحقق من تطابق البيانات بين التطبيق والجدول التفصيلي
            await verifyDataConsistency(result.todayData)
          } catch (error) {
            console.warn('⚠️ فشل في التحديث التلقائي للسجلات اليومية:', error)
          }
        } else {
          // استخدام البيانات الافتراضية
          setDesktopTrackingData({
            data: { appStatus: 'غير متصل', isConnected: false },
            todayData: {
              totalSeconds: 0,
              activeSeconds: 0,
              idleSeconds: 0,
              productivity: 0,
              lastActivity: null,
              isWorking: false,
              status: 'offline'
            }
          })
        }
      } else {
        console.warn('⚠️ فشل في جلب بيانات التتبع:', response.status)
        // استخدام البيانات الافتراضية
        setDesktopTrackingData({
          data: { appStatus: 'غير متصل', isConnected: false },
          todayData: {
            totalSeconds: 0,
            activeSeconds: 0,
            idleSeconds: 0,
            productivity: 0,
            lastActivity: null,
            isWorking: false,
            status: 'offline'
          }
        })
      }
    } catch (err) {
      console.error('Error fetching desktop tracking data:', err)
      // استخدام البيانات الافتراضية في حالة الخطأ
      setDesktopTrackingData({
        data: { appStatus: 'غير متصل', isConnected: false },
        todayData: {
          totalSeconds: 0,
          activeSeconds: 0,
          idleSeconds: 0,
          productivity: 0,
          lastActivity: null,
          isWorking: false,
          status: 'offline'
        }
      })
    }
  }, [user?.id, breakProtectionActive, isOnBreak])

  // التحقق من تطابق البيانات بين التطبيق والجدول التفصيلي
  const verifyDataConsistency = async (desktopData) => {
    if (!dailyRecordsData?.records || dailyRecordsData.records.length === 0 || !desktopData) return
    
    try {
      // البحث عن سجل اليوم في الجدول التفصيلي
      const today = new Date().toISOString().split('T')[0]
      const todayRecord = dailyRecordsData.records.find(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return recordDate === today
      })
      
      if (!todayRecord) {
        console.log('📊 لا يوجد سجل لليوم في الجدول التفصيلي')
        return
      }
      
      // مقارنة البيانات
      const desktopSeconds = desktopData.totalSeconds || 0
      const recordSeconds = todayRecord.totalSeconds || 0
      const difference = Math.abs(desktopSeconds - recordSeconds)
      
      console.log('🔍 فحص تطابق البيانات:', {
        'تطبيق_المكتب_ثواني': desktopSeconds,
        'جدول_تفصيلي_ثواني': recordSeconds,
        'الفرق_بالثواني': difference,
        'تطبيق_المكتب_مُنسق': formatTime(desktopSeconds),
        'جدول_تفصيلي_مُنسق': todayRecord.totalFormatted || formatTime(recordSeconds),
      })
      
      // إذا كان الفرق أكثر من دقيقتين (120 ثانية)، قم بمزامنة البيانات
      if (difference > 120) {
        console.log('⚠️ عدم تطابق في البيانات - سيتم تحديث الجدول التفصيلي')
        await syncTodayData()
      } else {
        console.log('✅ البيانات متطابقة - لا حاجة للمزامنة')
      }
      
    } catch (error) {
      console.warn('❌ خطأ في التحقق من تطابق البيانات:', error)
    }
  }

  // مزامنة بيانات اليوم مع الخادم
  const syncTodayData = async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/daily-attendance/sync-today/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forceSync: true,
          verifyOnly: false
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('✅ تم مزامنة بيانات اليوم:', result.details)
          // إعادة تحميل السجلات التفصيلية بعد المزامنة
          await fetchDailyRecords()
        } else {
          console.warn('⚠️ فشل في مزامنة البيانات:', result.message)
        }
      } else {
        console.warn('⚠️ خطأ في مزامنة البيانات:', response.status)
      }
    } catch (error) {
      console.error('❌ خطأ في مزامنة البيانات:', error)
    }
  }

  // جلب حالة العمل عند تحميل الصفحة - لكن فقط مرة واحدة أو عند تغيير المستخدم
  useEffect(() => {
    if (user?.id && desktopAppConnected) {
      // فحص إذا كانت هناك حالة محفوظة حديثاً قبل جلب البيانات
      const savedStatus = localStorage.getItem('workStatus')
      let shouldFetch = true
      
      if (savedStatus) {
        try {
          const parsed = JSON.parse(savedStatus)
          const timeDiff = new Date() - new Date(parsed.timestamp)
          // إذا كانت الحالة محفوظة في آخر 30 دقيقة، لا نجلب البيانات
          if (timeDiff < 1800000) {
            shouldFetch = false
            console.log('⏸️ تم تخطي جلب بيانات التتبع لحماية الحالة المحفوظة حديثاً')
          }
        } catch (e) {
          // في حالة خطأ التحليل، نجلب عادياً
        }
      }
      
      if (shouldFetch) {
        fetchDesktopTrackingData()
      }
    }
  }, [user?.id, desktopAppConnected, fetchDesktopTrackingData])

  // مراقبة تغييرات حالة العمل للتشخيص
  useEffect(() => {
    console.log('🔄 تغيير حالة العمل:', {
      workStatus,
      isPaused,
      isOnBreak,
      timestamp: new Date().toISOString()
    })
  }, [workStatus, isPaused, isOnBreak])

  // إدارة مؤقت الاستراحة
  useEffect(() => {
    if (isOnBreak && !breakStartTime) {
      // بدء الاستراحة - تسجيل وقت البداية
      const startTime = new Date()
      setBreakStartTime(startTime)
      setBreakDuration(0)
      console.log('☕ بدء مؤقت الاستراحة:', startTime.toLocaleTimeString('ar-EG'))
      
      // بدء المؤقت
      const timer = setInterval(() => {
        setBreakDuration(prev => prev + 1)
      }, 1000)
      
      setBreakTimer(timer)
      
    } else if (!isOnBreak && breakStartTime) {
      // إنهاء الاستراحة - إيقاف المؤقت
      if (breakTimer) {
        clearInterval(breakTimer)
        setBreakTimer(null)
      }
      
      const endTime = new Date()
      const totalBreakTime = Math.floor((endTime - breakStartTime) / 1000)
      console.log('🔚 إنهاء مؤقت الاستراحة:', {
        startTime: breakStartTime.toLocaleTimeString('ar-EG'),
        endTime: endTime.toLocaleTimeString('ar-EG'),
        duration: formatTime(totalBreakTime)
      })
      
      // إعادة تعيين البيانات
      setBreakStartTime(null)
      setBreakDuration(0)
    }
    
    // تنظيف المؤقت عند إلغاء المكون
    return () => {
      if (breakTimer) {
        clearInterval(breakTimer)
      }
    }
  }, [isOnBreak, breakStartTime, breakTimer])

  // حفظ واستعادة حالة مؤقت الاستراحة في localStorage
  useEffect(() => {
    if (isOnBreak && breakStartTime) {
      localStorage.setItem('breakTimer', JSON.stringify({
        startTime: breakStartTime.toISOString(),
        duration: breakDuration
      }))
    } else {
      localStorage.removeItem('breakTimer')
    }
  }, [isOnBreak, breakStartTime, breakDuration])

  // استعادة مؤقت الاستراحة عند تحميل الصفحة أو تغيير حالة الاستراحة
  useEffect(() => {
    const savedBreakTimer = localStorage.getItem('breakTimer')
    if (savedBreakTimer && isOnBreak) {
      try {
        const timerData = JSON.parse(savedBreakTimer)
        const savedStartTime = new Date(timerData.startTime)
        const now = new Date()
        const elapsedSeconds = Math.floor((now - savedStartTime) / 1000)
        
        // إذا كانت الاستراحة مستمرة، استكمل المؤقت
        if (elapsedSeconds > 0 && elapsedSeconds < 24 * 60 * 60) { // أقل من 24 ساعة
          setBreakStartTime(savedStartTime)
          setBreakDuration(elapsedSeconds)
          
          // بدء المؤقت للاستمرار
          if (!breakTimer) {
            const timer = setInterval(() => {
              setBreakDuration(prev => prev + 1)
            }, 1000)
            setBreakTimer(timer)
          }
          
          console.log('✅ تم استعادة مؤقت الاستراحة واستكماله:', {
            startTime: savedStartTime.toLocaleTimeString('ar-EG'),
            elapsedTime: formatTime(elapsedSeconds)
          })
        } else {
          // إذا كانت البيانات قديمة، احذفها
          localStorage.removeItem('breakTimer')
        }
      } catch (err) {
        console.warn('خطأ في استعادة مؤقت الاستراحة:', err)
        localStorage.removeItem('breakTimer')
      }
    }
  }, [isOnBreak, breakTimer])

  // إرسال أمر للتطبيق المكتبي
  const sendDesktopCommand = (command, payload = {}) => {
    if (!socket || !user?.id) {
      alert('غير متصل بالخادم')
      return
    }

    if (!desktopAppConnected) {
      alert('التطبيق المكتبي غير متصل')
      return
    }

    setRemoteControlLoading(true)
    socket.emit('control-desktop-app', {
      userId: user.id,
      command,
      payload
    })
  }

  // بدء العمل عن بُعد
  const handleRemoteStartWork = () => {
    setRemoteControlLoading(true)
    
    const currentTimestamp = new Date().toISOString()
    
    sendDesktopCommand('start-work', {
      message: 'بدء العمل من الموقع',
      timestamp: currentTimestamp
    })
    
    // تحديث الحالة فوراً
    setWorkStatus('working')
    setIsPaused(false)
    setIsOnBreak(false)
    
    // حفظ الحالة في localStorage مع timestamp دقيق
    localStorage.setItem('workStatus', JSON.stringify({
      status: 'working',
      isPaused: false,
      isOnBreak: false,
      timestamp: currentTimestamp,
      action: 'start-work'
    }))
    
    console.log('💾 تم حفظ حالة بدء العمل:', {
      status: 'working',
      timestamp: currentTimestamp
    })
    
    // تأخير أقل لجلب البيانات
    setTimeout(() => {
      setRemoteControlLoading(false)
    }, 1000)
    
    showNotification('🟢 تم بدء العمل عن بُعد', 'success')
  }

  // إنهاء العمل عن بُعد
  const handleRemoteStopWork = () => {
    setRemoteControlLoading(true)
    
    const currentTimestamp = new Date().toISOString()
    
    sendDesktopCommand('stop-work', {
      message: 'إنهاء العمل من الموقع',
      timestamp: currentTimestamp
    })
    
    // تحديث الحالة فوراً
    setWorkStatus('stopped')
    setIsPaused(false)
    setIsOnBreak(false)
    
    // حفظ الحالة في localStorage مع timestamp دقيق
    localStorage.setItem('workStatus', JSON.stringify({
      status: 'stopped',
      isPaused: false,
      isOnBreak: false,
      timestamp: currentTimestamp,
      action: 'stop-work'
    }))
    
    console.log('💾 تم حفظ حالة إنهاء العمل:', {
      status: 'stopped',
      timestamp: currentTimestamp
    })
    
    // تأخير أقل لجلب البيانات
    setTimeout(() => {
      setRemoteControlLoading(false)
    }, 1000)
    
    showNotification('🔴 تم إنهاء العمل عن بُعد', 'info')
  }

  // إيقاف مؤقت عن بُعد
  const handleRemotePauseWork = () => {
    setRemoteControlLoading(true)
    
    const currentTimestamp = new Date().toISOString()
    
    if (isPaused) {
      // استكمال العمل
      sendDesktopCommand('resume-work', {
        message: 'استكمال العمل من الموقع',
        timestamp: currentTimestamp
      })
      
      // تحديث الحالة فوراً
      setWorkStatus('working')
      setIsPaused(false)
      
      // حفظ الحالة في localStorage مع timestamp دقيق
      localStorage.setItem('workStatus', JSON.stringify({
        status: 'working',
        isPaused: false,
        isOnBreak: false,
        timestamp: currentTimestamp,
        action: 'resume-work'
      }))
      
      console.log('💾 تم حفظ حالة استكمال العمل:', {
        status: 'working',
        timestamp: currentTimestamp
      })
      
      setTimeout(() => {
        setRemoteControlLoading(false)
      }, 1000)
      
      showNotification('▶️ تم استكمال العمل عن بُعد', 'success')
    } else {
      // إيقاف مؤقت
      sendDesktopCommand('pause-work', {
        message: 'إيقاف مؤقت من الموقع',
        timestamp: currentTimestamp
      })
      
      // تحديث الحالة فوراً
      setWorkStatus('paused')
      setIsPaused(true)
      
      // حفظ الحالة في localStorage مع timestamp دقيق
      localStorage.setItem('workStatus', JSON.stringify({
        status: 'paused',
        isPaused: true,
        isOnBreak: false,
        timestamp: currentTimestamp,
        action: 'pause-work'
      }))
      
      console.log('💾 تم حفظ حالة الإيقاف المؤقت:', {
        status: 'paused',
        timestamp: currentTimestamp
      })
      
      setTimeout(() => {
        setRemoteControlLoading(false)
      }, 1000)
      
      showNotification('⏸️ تم إيقاف العمل مؤقتاً عن بُعد', 'warning')
    }
  }

  // استراحة عن بُعد
  const handleRemoteBreak = () => {
    setRemoteControlLoading(true)
    
    const currentTimestamp = new Date().toISOString()
    
    if (isOnBreak) {
      // إنهاء الاستراحة
      sendDesktopCommand('end-break', {
        message: 'إنهاء الاستراحة من الموقع',
        timestamp: currentTimestamp
      })
      
      // تحديث الحالة فوراً
      setWorkStatus('working')
      setIsOnBreak(false)
      setBreakProtectionActive(false) // إلغاء الحماية
      
      // حفظ الحالة في localStorage مع timestamp دقيق
      localStorage.setItem('workStatus', JSON.stringify({
        status: 'working',
        isPaused: false,
        isOnBreak: false,
        timestamp: currentTimestamp,
        action: 'end-break'
      }))
      
      console.log('💾 تم حفظ حالة إنهاء الاستراحة:', {
        status: 'working',
        timestamp: currentTimestamp
      })
      
      // إزالة setTimeout وترك socket listener يتعامل مع إيقاف التحميل
      setRemoteControlLoading(false)
      
      showNotification('🔚 تم إنهاء الاستراحة عن بُعد', 'success')
    } else {
      // بدء استراحة - إظهار نافذة إدخال السبب أولاً
      setShowBreakReasonModal(true)
             setRemoteControlLoading(false) // إلغاء التحميل مؤقتاً لحين إدخال السبب
       return // إيقاف التنفيذ حتى يتم إدخال السبب
    }
  }

  // دالة بدء الاستراحة مع السبب
  const startBreakWithReason = (reason) => {
    setRemoteControlLoading(true)
    
    const currentTimestamp = new Date().toISOString()
    
    sendDesktopCommand('take-break', {
      message: 'بدء استراحة من الموقع',
      timestamp: currentTimestamp,
      reason: reason || 'بدون سبب محدد'
    })
    
    // تحديث الحالة فوراً
    setWorkStatus('break')
    setIsOnBreak(true)
    setBreakProtectionActive(true) // تفعيل الحماية
    
    // إلغاء الحماية تلقائياً بعد 10 دقائق (وقت أطول للحماية)
    setTimeout(() => {
      // فحص إذا كان المستخدم لا يزال في وضع الاستراحة قبل إلغاء الحماية
      if (isOnBreak) {
        console.log('⏰ المستخدم لا يزال في استراحة - تمديد الحماية لـ 10 دقائق إضافية')
        // تمديد الحماية لـ 10 دقائق إضافية
        setTimeout(() => {
          setBreakProtectionActive(false)
          console.log('⏰ تم إلغاء حماية الاستراحة تلقائياً بعد 20 دقيقة إجمالية')
        }, 600000) // 10 دقائق إضافية
      } else {
        setBreakProtectionActive(false)
        console.log('⏰ تم إلغاء حماية الاستراحة تلقائياً بعد 10 دقائق')
      }
    }, 600000) // 10 دقائق بدلاً من دقيقة واحدة
    
    // حفظ الحالة في localStorage مع timestamp دقيق
    localStorage.setItem('workStatus', JSON.stringify({
      status: 'break',
      isPaused: false,
      isOnBreak: true,
      timestamp: currentTimestamp,
      action: 'take-break',
      reason: reason || 'بدون سبب محدد'
    }))
    
    // حفظ ملاحظة الاستراحة في القائمة
    const newBreakNote = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      reason: reason || 'بدون سبب محدد',
      timestamp: currentTimestamp
    }
    
    const updatedNotes = [...breakNotes, newBreakNote]
    setBreakNotes(updatedNotes)
    localStorage.setItem('breakNotes', JSON.stringify(updatedNotes))
    
    console.log('💾 تم حفظ حالة بدء الاستراحة مع السبب:', {
      status: 'break',
      timestamp: currentTimestamp,
      reason: reason
    })
    
    setRemoteControlLoading(false)
    showNotification(`☕ تم بدء الاستراحة: ${reason || 'بدون سبب محدد'}`, 'info')
  }

  // دالة عرض الإشعارات
  const showNotification = (message, type = 'info') => {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      'bg-blue-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg font-bold">×</button>
      </div>
    `
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification)
    
    // إظهار الإشعار
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)
    
    // إخفاء الإشعار بعد 5 ثوان
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 300)
    }, 5000)
  }

  // جلب بيانات الموظف من API
  const fetchEmployeeProfile = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setEmployeeProfile(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching employee profile:', err)
    }
  }, [user?.id])

  // جلب إحصائيات الأداء
  const fetchPerformanceData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/performance/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPerformanceData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching performance data:', err)
    }
  }, [user?.id])

  // جلب إحصائيات الحضور
  const fetchAttendanceData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/attendance/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAttendanceData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err)
    }
  }, [user?.id])

  // جلب بيانات الراتب والمزايا
  const fetchSalaryData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/salary/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSalaryData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching salary data:', err)
    }
  }, [user?.id])

  // جلب بيانات المستندات
  const fetchDocumentsData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/documents/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDocumentsData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching documents data:', err)
    }
  }, [user?.id])

  // جلب الطلبات الإدارية
  const fetchRequestsData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/requests/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRequestsData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching requests data:', err)
    }
  }, [user?.id])

  // جلب الإشعارات
  const fetchNotificationsData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/notifications/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setNotificationsData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching notifications data:', err)
    }
  }, [user?.id])



  // جلب الإحصائيات العامة
  const fetchStatsData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/employees/stats/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStatsData(result.data)
        }
      }
    } catch (err) {
      console.error('Error fetching stats data:', err)
    }
  }, [user?.id])

  // إضافة دالة لجلب بيانات المزايا (كانت مفقودة!)
  const fetchBenefitsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/employees/benefits/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBenefitsData(result.data || []);
        } else {
          setBenefitsData([]);
        }
      } else {
        setBenefitsData([]);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المزايا:', error);
      setBenefitsData([]);
    }
  }, [user?.id]);

  // تحويل الثواني إلى صيغة وقت مقروءة
  // دالة لتحويل الثواني إلى تنسيق ساعات ودقائق عربي
  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0د'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    // إذا كان أقل من ساعة، اعرض الدقائق فقط
    if (hours === 0) {
      return `${minutes}د`
    }
    
    // إذا كان ساعة أو أكثر، اعرض الساعات والدقائق
    if (minutes === 0) {
      return `${hours}س`
    }
    
    return `${hours}س ${minutes}د`
  }

  // دالة توحيد عرض الوقت مع جدول التأخيرات الشهري
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

  // دالة لتحويل الثواني إلى ساعات عشرية
  const secondsToDecimalHours = (seconds) => {
    return seconds / 3600
  }

  // إضافة دالات من EmployeeDetailsPage مطلوبة لقسم الراتب
  const getArabicMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // دالة تنسيق العملة المحلية
  const formatCurrencyLocal = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0) + ' جنيه'
  }

  // دالة لجلب بيانات التأخيرات للموظف الحالي
  const fetchAttendanceDataEmployee = useCallback(async () => {
    if (!user?.id || !selectedMonth) return;
    
    setLoadingAttendance(true);
    try {
      const token = localStorage.getItem('token');
      
      // استخدام نفس API endpoint المستخدم في EmployeeDetailsPage لضمان تطابق البيانات
      // إضافة معامل الشهر للحصول على بيانات الشهر المحدد فقط
      const response = await fetch(`http://localhost:5001/api/daily-attendance/user-records/${user.id}?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.records) {
          // تحويل البيانات لتطابق تنسيق EmployeeDetailsPage (بدون حاجة لفلترة لأن الباك إند يتولى ذلك)
          const formattedData = result.data.records.map(record => {
            const recordDate = new Date(record.date);
            const todayString = new Date().toISOString().split('T')[0];
            const recordDateString = recordDate.toISOString().split('T')[0];
            const isToday = recordDateString === todayString;
            
            // حساب الساعات من الثواني إذا توفرت
            const totalHours = record.totalSeconds ? record.totalSeconds / 3600 : (record.totalHours || 0);
            const activeHours = record.activeSeconds ? record.activeSeconds / 3600 : (record.activeHours || 0);
            
            // تحديد الحالة بناءً على البيانات الفعلية (نفس منطق EmployeeDetailsPage)
            let status = 'غير متوفر';
            if (record.isWeekend) {
              status = 'عطلة أسبوعية';
            } else if (record.status === 'عطلة' || record.status === 'إجازة') {
              status = record.status;
            } else if (record.hasRealData && totalHours > 0) {
              if (totalHours >= 8) {
                status = 'في الوقت';
              } else {
                status = 'متأخر';
              }
            } else if (record.hasRealData && totalHours === 0) {
              status = 'غائب';
            } else {
              // لا توجد بيانات حقيقية من التطبيق
              if (recordDateString > todayString) {
                status = 'في الوقت'; // الأيام المستقبلية
              } else {
                status = 'غائب'; // الأيام الماضية بدون بيانات
              }
            }
            
            console.log(`📅 معالجة سجل ${recordDateString}:`, {
              totalSeconds: record.totalSeconds,
              totalHours: totalHours,
              activeHours: activeHours,
              status: status,
              isWeekend: record.isWeekend,
              isToday: isToday
            });
            
            return {
              id: record._id || record.id || `${record.date}_${user.id}`,
              date: recordDate.toLocaleDateString('en-GB'), 
              day: record.day || recordDate.toLocaleDateString('ar', { weekday: 'long' }),
              isWeekend: record.isWeekend || false,
              totalHours: totalHours,
              activeHours: activeHours,
              requiredTime: '08:00',
              delayHours: (status === 'متأخر' && totalHours > 0 && totalHours < 8) ? (8 - totalHours) : 
                         (status === 'غائب' && !record.isWeekend) ? 8 : 0,
              deductionAmount: record.deductionAmount || 0,
              status: status,
              isToday: isToday
            };
          });
          
          setAttendanceDataEmployee(formattedData);
        } else {
          console.warn('⚠️ لا توجد بيانات تتبع - عرض بيانات فارغة');
          setAttendanceDataEmployee([]);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات التأخيرات:', error);
      setAttendanceDataEmployee([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [user?.id, selectedMonth]);

  // دالة جلب المكافآت الشهرية
  const fetchMonthlyBonuses = useCallback(async () => {
    if (!user?.id || !selectedMonth) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/employees/${user.id}/bonuses/${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMonthlyBonuses(result.data || []);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب المكافآت:', error);
    }
  }, [user?.id, selectedMonth]);

  // دالة جلب الخصومات الشهرية
  const fetchMonthlyDeductions = useCallback(async () => {
    if (!user?.id || !selectedMonth) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/employees/${user.id}/deductions/${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMonthlyDeductions(result.data || []);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب الخصومات:', error);
    }
  }, [user?.id, selectedMonth]);

  // إضافة دالة لجلب بيانات الموظف للراتب
  const fetchEmployeeDataForSalary = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/employees/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // تحويل البيانات لتطابق تنسيق EmployeeDetailsPage
          const employeeData = {
            ...result.data,
            // الاحتفاظ بالبيانات الأصلية مع إضافة القيم الافتراضية فقط للحقول المفقودة
            baseSalary: result.data.baseSalary || result.data.salary || 0,
            name: result.data.name || result.data.fullName || '',
            fullName: result.data.fullName || result.data.name || '',
            location: result.data.location || result.data.workLocation || result.data.address || '',
            allowances: {
              transport: result.data.allowances?.transportation || result.data.allowances?.transport || result.data.benefits?.transportationAllowance || 0,
              food: result.data.allowances?.meal || result.data.allowances?.food || result.data.benefits?.mealAllowance || 0,
              housing: result.data.allowances?.housing || result.data.benefits?.housingAllowance || 0,
              performance: result.data.allowances?.performance || result.data.benefits?.performanceAllowance || 0,
              ...result.data.allowances
            },
            deductions: {
              insurance: result.data.deductions?.socialInsurance || result.data.deductions?.insurance || 0,
              taxes: result.data.deductions?.tax || result.data.deductions?.taxes || 0,
              loans: result.data.deductions?.loans || result.data.deductions?.loan || 0,
              absence: result.data.deductions?.absence || 0,
              ...result.data.deductions
            },
            monthlyAdjustments: result.data.monthlyAdjustments || { bonuses: [], deductions: [] }
          };
          setEmployeeProfile(employeeData);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات الموظف:', error);
    }
  }, [user?.id]);

  // useEffect لجلب بيانات قسم الراتب عند تغيير الشهر
  useEffect(() => {
    if (currentSection === 'salary' && user?.id) {
      fetchEmployeeDataForSalary();
      fetchAttendanceDataEmployee();
      fetchMonthlyBonuses();
      fetchMonthlyDeductions();
    }
  }, [currentSection, user?.id, selectedMonth, fetchEmployeeDataForSalary, fetchAttendanceDataEmployee, fetchMonthlyBonuses, fetchMonthlyDeductions]);

  const todayData = getTodayTrackingData()

  // جلب جميع البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user?.id) {
      setLoading(true)
      setError(null)
      
      // جلب البيانات مع التعامل مع الأخطاء
      const fetchAllData = async () => {
        try {
          // جلب البيانات بشكل متوازي مع تجاهل الأخطاء
          await Promise.allSettled([
            fetchEmployeeProfile().catch(err => console.warn('خطأ في جلب الملف الشخصي:', err)),
            fetchPerformanceData().catch(err => console.warn('خطأ في جلب بيانات الأداء:', err)),
            fetchAttendanceData().catch(err => console.warn('خطأ في جلب بيانات الحضور:', err)),
            fetchDesktopTrackingData().catch(err => console.warn('خطأ في جلب بيانات التتبع:', err)),
            fetchSalaryData().catch(err => console.warn('خطأ في جلب بيانات الراتب:', err)),
            fetchDocumentsData().catch(err => console.warn('خطأ في جلب المستندات:', err)),
            fetchRequestsData().catch(err => console.warn('خطأ في جلب الطلبات:', err)),
            fetchNotificationsData().catch(err => console.warn('خطأ في جلب الإشعارات:', err)),
            fetchDailyRecords().catch(err => console.warn('خطأ في جلب السجلات اليومية:', err)),
            fetchStatsData().catch(err => console.warn('خطأ في جلب الإحصائيات:', err)),
            fetchBenefitsData().catch(err => console.warn('خطأ في جلب بيانات المزايا:', err)),
            fetchHolidaySettings().catch(err => console.warn('خطأ في جلب إعدادات الإجازات:', err))
          ])
        } catch (error) {
          console.error('خطأ عام في جلب البيانات:', error)
          setError('فشل في تحميل بعض البيانات')
        } finally {
          setLoading(false)
        }
      }
      
      fetchAllData()
      fetchHolidaySettings().catch(err => console.warn('خطأ في جلب إعدادات الإجازات عند التحميل:', err))
      
      // تحديث بيانات التتبع كل 5 ثواني - لكن فقط إذا لم تكن هناك حالة محفوظة حديثاً
      const trackingInterval = setInterval(() => {
        const savedStatus = localStorage.getItem('workStatus')
        let shouldUpdate = true
        
        if (savedStatus) {
          try {
            const parsed = JSON.parse(savedStatus)
            const timeDiff = new Date() - new Date(parsed.timestamp)
                         // إذا كانت الحالة محفوظة في آخر 30 دقيقة، لا نحدث
             if (timeDiff < 1800000) {
              shouldUpdate = false
              console.log('⏸️ تم تخطي تحديث التتبع لحماية الحالة المحفوظة حديثاً')
            }
          } catch (e) {
            // في حالة خطأ التحليل، نحدث عادياً
          }
        }
        
        if (shouldUpdate) {
          fetchDesktopTrackingData().catch(err => console.warn('خطأ في تحديث بيانات التتبع:', err))
        }
      }, 5000)
      
      // تحديث البيانات الأخرى كل 5 دقائق
      const dataInterval = setInterval(() => {
        fetchRequestsData().catch(err => console.warn('خطأ في تحديث الطلبات:', err))
        fetchNotificationsData().catch(err => console.warn('خطأ في تحديث الإشعارات:', err))
        fetchStatsData().catch(err => console.warn('خطأ في تحديث الإحصائيات:', err))
        fetchDailyRecords().catch(err => console.warn('خطأ في تحديث السجلات اليومية:', err))
      }, 300000)
      
      return () => {
        clearInterval(trackingInterval)
        clearInterval(dataInterval)
      }
    } else {
      setLoading(false)
    }
  }, [user?.id])

  // جلب بيانات السجلات اليومية الحقيقية من DailyAttendance
  const fetchDailyRecords = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ لا يوجد معرف مستخدم للحصول على السجلات')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('⚠️ لا يوجد رمز تسجيل دخول')
        setDailyRecordsData(null)
        return
      }

      console.log('🔄 جاري جلب السجلات اليومية للمستخدم:', user.id)
      const response = await fetch(`http://localhost:5001/api/daily-attendance/user-records/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📊 حالة الاستجابة:', response.status)

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('✅ تم جلب السجلات اليومية من DailyAttendance بنجاح:', result)
          setDailyRecordsData({
            records: result.data.records,
            summary: result.summary
          })
        } else {
          console.warn('⚠️ فشل في جلب السجلات اليومية:', result.message)
          console.warn('🔍 تفاصيل الخطأ:', result)
          
          // إنشاء بيانات افتراضية للعرض
          const fallbackRecords = generateFallbackDailyRecords()
          setDailyRecordsData({
            records: fallbackRecords,
            summary: {
              totalWorkingDays: 10,
              presentDays: 0,
              absentDays: 10,
              totalWorkTime: 0,
              totalActiveTime: 0,
              averageProductivity: 0
            }
          })
        }
      } else {
        console.warn('⚠️ خطأ في API السجلات اليومية:', response.status)
        
        // محاولة قراءة رسالة الخطأ
        try {
          const errorResult = await response.json()
          console.warn('📋 تفاصيل خطأ API:', errorResult)
        } catch (e) {
          console.warn('❌ لا يمكن قراءة تفاصيل الخطأ')
        }
        
        // إنشاء بيانات افتراضية للعرض
        const fallbackRecords = generateFallbackDailyRecords()
        setDailyRecordsData({
          records: fallbackRecords,
          summary: {
            totalWorkingDays: 10,
            presentDays: 0,
            absentDays: 10,
            totalWorkTime: 0,
            totalActiveTime: 0,
            averageProductivity: 0
          }
        })
      }
    } catch (err) {
      console.error('❌ خطأ في جلب السجلات اليومية:', err)
      
      // إنشاء بيانات افتراضية للعرض
      const fallbackRecords = generateFallbackDailyRecords()
      setDailyRecordsData({
        records: fallbackRecords,
        summary: {
          totalWorkingDays: 10,
          presentDays: 0,
          absentDays: 10,
          totalWorkTime: 0,
          totalActiveTime: 0,
          averageProductivity: 0
        }
      })
    }
  }, [user?.id])



  // تحديث جميع سجلات الشهر من بيانات التطبيق
  const syncMonthRecords = useCallback(async () => {
    if (!employeeProfile?.employee?._id) return
    
    try {
      console.log('🔄 تحديث جميع سجلات الشهر من بيانات التطبيق...')
      const result = await dailyAttendanceService.syncMonth(employeeProfile.employee._id)
      
      if (result.success) {
        console.log('✅ تم تحديث جميع سجلات الشهر بنجاح من بيانات التطبيق')
        // إعادة جلب السجلات اليومية لإظهار التحديث
        await fetchDailyRecords()
        showNotification('تم تحديث جميع سجلات الشهر من بيانات التطبيق', 'success')
      } else {
        console.warn('⚠️ فشل في تحديث سجلات الشهر:', result.message)
        showNotification('فشل في تحديث سجلات الشهر: ' + result.message, 'error')
      }
    } catch (error) {
      console.error('خطأ في تحديث سجلات الشهر:', error)
      showNotification('خطأ في تحديث سجلات الشهر', 'error')
    }
  }, [employeeProfile?.employee?._id])

  // دالة لإنشاء سجلات افتراضية عند فشل جلب البيانات من API
  const generateFallbackDailyRecords = () => {
    console.log('📊 إنشاء سجلات افتراضية للعرض')
    const records = []
    const today = new Date()
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      const dateString = date.toISOString().split('T')[0]
      const isWeekend = isWeekendDay(date)
      const isToday = i === 0
      
      records.push({
        date: dateString,
        day: date.toLocaleDateString('ar', { weekday: 'long' }),
        hijriDate: date.toLocaleDateString('ar-EG-u-ca-islamic', {
          day: '2-digit',
          month: 'short'
        }),
        isWeekend,
        isToday,
        hasRealData: false,
        totalHours: 0,
        activeHours: 0,
        totalSeconds: 0,
        activeSeconds: 0,
        idleSeconds: 0,
        breakSeconds: 0,
        totalFormatted: isWeekend ? '-' : '0 دقيقة',
        activeFormatted: isWeekend ? '-' : '0 دقيقة',
        idleFormatted: isWeekend ? '-' : '0 دقيقة',
        breakFormatted: isWeekend ? '-' : '0 دقيقة',
        delayHours: 0,
        deductionAmount: 0,
        status: isWeekend ? 'عطلة' : 'غير متوفر',
        productivity: 0
      })
    }
    
    return records
  }

  // التحقق من وجود المستخدم
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">لم يتم تسجيل الدخول</h2>
          <p className="text-gray-600 dark:text-gray-300">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    )
  }

  // عرض صفحة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري تحميل البيانات...</h2>
          <p className="text-gray-600 dark:text-gray-300">يرجى الانتظار</p>
        </div>
      </div>
    )
  }

  // بيانات الموظف - استخدام البيانات الحقيقية مع fallback للبيانات الوهمية
  const employeeData = {
    name: employeeProfile?.employee?.name || employeeProfile?.user?.name || user.name || user.username || 'الموظف',
    position: employeeProfile?.employee?.position || 'مطور برمجيات أول',
    department: employeeProfile?.employee?.department || 'تقنية المعلومات والتطوير',
    email: employeeProfile?.employee?.email || employeeProfile?.user?.email || user.email || 'employee@company.com',
    phone: employeeProfile?.employee?.phone || '01000000000',
    address: employeeProfile?.employee?.address || 'شارع التحرير، وسط البلد، القاهرة، جمهورية مصر العربية',
    joinDate: employeeProfile?.employee?.joinDate || employeeProfile?.employee?.startDate || '2023-03-15',
    employeeId: employeeProfile?.employee?.employeeId || 'EMP-2024-001',
    directManager: employeeProfile?.employee?.directManager || 'محمد أحمد - مدير التطوير التقني',
    workLocation: employeeProfile?.employee?.workLocation || 'مكتب القاهرة الرئيسي - الطابق الثالث - قسم التطوير',
    salary: {
      basic: salaryData?.baseSalary || 12000,
      allowances: salaryData?.allowances ? Object.values(salaryData.allowances).reduce((sum, val) => sum + val, 0) : 3000,
      housing: salaryData?.allowances?.housing || 2000,
      transportation: salaryData?.allowances?.transportation || 1200,
      deductions: salaryData?.deductions ? Object.values(salaryData.deductions).reduce((sum, val) => sum + val, 0) : 1500,
      insurance: salaryData?.deductions?.insurance || 650,
      tax: salaryData?.deductions?.tax || 850,
      hourlyDeductions: 480,
      net: salaryData?.netSalary || 15520,
      lastPayDate: salaryData?.lastPayment?.date || '2024-06-01',
      hourlyRate: 75,
      requiredDailyHours: 8,
      dailyDeductions: []
    },
    performance: {
      rating: performanceData?.overall || 0,
      tasks: performanceData?.goals?.length || 0,
      completed: performanceData?.achievements?.length || 0,
      attendance: attendanceData?.thisMonth?.present ? Math.round((attendanceData.thisMonth.present / attendanceData.thisMonth.workDays) * 100) : 0,
      goals: performanceData?.goals?.length || 0,
      achievedGoals: performanceData?.achievements?.length || 0,
      lastReview: performanceData?.lastReview || new Date()
    },
    attendance: {
      todayStatus: attendanceData?.thisMonth?.present > 0 ? 'حاضر' : 'غير محدد',
      checkInTime: '-',
      checkOutTime: '-',
      totalHours: attendanceData?.totalHours ? `${attendanceData.totalHours}:00` : '0:00',
      thisMonthDays: attendanceData?.totalWorkingDays || 0,
      presentDays: attendanceData?.presentDays || 0,
      lateDays: attendanceData?.thisMonth?.late || 0,
      absences: attendanceData?.absentDays || 0
    },
    desktopTracking: desktopTrackingData || {
      appStatus: 'غير متصل',
      currentSession: {
        checkInTime: '-',
        workingTime: '0:00:00',
        idleTime: '0:00:00',
        activeTime: '0:00:00',
        lastActivity: null,
        isActive: false
      },
      todayStats: {
        totalWorkTime: '0:00:00',
        totalIdleTime: '0:00:00',
        productivityScore: 0,
        screenshotCount: 0,
        activityLevel: 'غير متاح'
      },
      weeklyStats: [],
      recentScreenshots: [],
      permissions: {
        canStartFromWeb: false,
        canViewScreenshots: true,
        canDeleteScreenshots: false
      }
    },
    benefits: [
      { id: 1, title: 'تأمين صحي شامل', status: 'نشط', coverage: '100%', icon: Shield },
      { id: 2, title: 'تأمين اجتماعي', status: 'نشط', coverage: '10%', icon: Users },
      { id: 3, title: 'بدل سكن', status: 'نشط', amount: 1500, icon: Home },
      { id: 4, title: 'بدل مواصلات', status: 'نشط', amount: 800, icon: Car },
      { id: 5, title: 'بدل هاتف', status: 'نشط', amount: 200, icon: PhoneIcon },
      { id: 6, title: 'تدريب مهني', status: 'متاح', coverage: 'مجاني', icon: BookOpen }
    ],
    documents: documentsData?.recent || [
      { id: 1, title: 'عقد العمل', date: '2022-03-15', type: 'PDF', size: '245 KB', icon: FileText },
      { id: 2, title: 'صورة الهوية', date: '2022-03-15', type: 'JPG', size: '156 KB', icon: CreditCard },
      { id: 3, title: 'الشهادات العلمية', date: '2022-03-15', type: 'PDF', size: '892 KB', icon: GraduationCap },
      { id: 4, title: 'السيرة الذاتية', date: '2024-01-15', type: 'PDF', size: '324 KB', icon: FileText },
      { id: 5, title: 'شهادة الخبرة', date: '2023-12-20', type: 'PDF', size: '178 KB', icon: Award },
      { id: 6, title: 'التقييم السنوي', date: '2024-03-15', type: 'PDF', size: '267 KB', icon: BarChart3 }
    ],
    requests: requestsData?.recent || [
      { id: 1, type: 'إجازة سنوية', date: '2024-06-01', duration: '5 أيام', status: 'موافق عليها', color: 'green' },
      { id: 2, type: 'إجازة مرضية', date: '2024-05-20', duration: '2 أيام', status: 'قيد المراجعة', color: 'yellow' },
      { id: 3, type: 'تعديل بيانات', date: '2024-05-15', duration: '-', status: 'مكتملة', color: 'blue' },
      { id: 4, type: 'شهادة راتب', date: '2024-05-10', duration: '-', status: 'مكتملة', color: 'blue' }
    ],
    notifications: notificationsData?.notifications || [
      { id: 1, title: 'تم صرف الراتب', message: 'تم صرف راتب شهر يونيو بنجاح', time: '10 دقائق', type: 'success', read: false },
      { id: 2, title: 'اجتماع فريق العمل', message: 'اجتماع يوم الأحد الساعة 10 صباحاً', time: '2 ساعات', type: 'info', read: false },
      { id: 3, title: 'تذكير تقييم الأداء', message: 'موعد التقييم الربع سنوي قريباً', time: '5 ساعات', type: 'warning', read: true },
      { id: 4, title: 'دورة تدريبية جديدة', message: 'دورة Excel المتقدم متاحة الآن', time: '1 يوم', type: 'info', read: true }
    ]
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'desktop-tracking', label: 'مراقبة سطح المكتب', icon: Activity },
    { id: 'salary', label: 'الراتب والمزايا', icon: DollarSign },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock },
    { id: 'performance', label: 'الأداء والتقييم', icon: TrendingUp },
    { id: 'documents', label: 'المستندات', icon: FileText },
    { id: 'requests', label: 'الطلبات والإجازات', icon: CalendarIcon }
  ]

  const renderOverview = () => {
    // استخدام البيانات الحقيقية من desktopTrackingData
    const realTodayData = getTodayTrackingData();
    
    return (
    <div className="space-y-6">
      {/* ترحيب ومعلومات سريعة */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white p-6 rounded-xl shadow-xl">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 rtl:space-x-reverse">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-3xl font-bold mb-2">مرحباً، {employeeData.name}</h1>
            <p className="text-blue-100 text-lg">{employeeData.position} - {employeeData.department}</p>
            <p className="text-blue-200 text-sm mt-2">رقم الموظف: {employeeData.employeeId}</p>
            <div className="mt-4 flex flex-col md:flex-row gap-2 text-sm">
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                📅 انضمام: {formatDate(employeeData.joinDate)}
              </span>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                👥 المدير المباشر: {employeeData.directManager}
              </span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-xs text-blue-200">حالة اليوم</p>
              <p className="text-lg font-bold text-green-200">{employeeData.attendance.todayStatus}</p>
              <p className="text-xs text-blue-200">دخول: {employeeData.attendance.checkInTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">الراتب الصافي</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(employeeData.salary.net)}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-500 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">نسبة الحضور</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{employeeData.performance.attendance}%</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">تقييم الأداء</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{employeeData.performance.rating}/5</p>
              </div>
              <Star className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">وقت الاستراحة اليوم</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {formatTime(realTodayData.breakSeconds || 0)}
                </p>
                {isOnBreak && (
                  <p className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    في استراحة حالياً
                  </p>
                )}
              </div>
              <Clock3 className="w-8 h-8 text-orange-500 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 dark:text-teal-400 text-sm font-medium">المهام المكتملة</p>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{employeeData.performance.completed}/{employeeData.performance.tasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-teal-500 dark:text-teal-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات والإشعارات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Bell className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <span>الإشعارات الحديثة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeData.notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className={`flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg ${
                  notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                  notification.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'success' ? 'bg-green-500 dark:bg-green-400' :
                    notification.type === 'warning' ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-blue-500 dark:bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <CalendarIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>الطلبات الأخيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeData.requests.map((request) => {
                // تحديد اللون بناءً على الحالة
                const getStatusColor = (status) => {
                  switch(status) {
                    case 'موافق عليها':
                    case 'مكتملة':
                      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    case 'قيد المراجعة':
                      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    case 'مرفوضة':
                      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    default:
                      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }
                }

                return (
                  <div key={request.id || request._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{request.type}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>تاريخ الطلب: {formatDate(request.date)}</p>
                      {request.duration && request.duration !== '-' && <p>المدة: {request.duration}</p>}
                      {request.description && <p>الوصف: {request.description}</p>}
                      {request.approvedBy && <p>تمت الموافقة من: {request.approvedBy}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  }

  // دالة لفتح نافذة عرض الصورة
  const openScreenshotModal = (screenshot) => {
    setSelectedScreenshot(screenshot)
    setShowScreenshotModal(true)
  }

  // دالة محاولة تسجيل الحضور/الانصراف
  const handleAttendanceAction = (action) => {
    // التحقق من حالة اتصال التطبيق المكتبي
    if (!desktopAppConnected) {
      alert('⚠️ يجب تشغيل تطبيق سطح المكتب أولاً لتسجيل الحضور/الانصراف')
      return
    }
    
    // هنا يمكن إضافة منطق تسجيل الحضور/الانصراف
    alert(`✅ تم ${action} بنجاح`)
  }

  // دالة لعرض شريط الحالة
  const renderStatusBar = () => {
    // تحديد الحالة الحالية للتطبيق
    let currentStatus = 'offline';
    let statusText = 'غير متصل';
    let statusIcon = '🔴';
    let statusColor = 'bg-red-500';
    let bgColor = 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
    let textColor = 'text-red-800 dark:text-red-200';

    if (desktopAppConnected) {
      switch (workStatus) {
        case 'working':
          currentStatus = 'working';
          statusText = 'نشط - يعمل حالياً';
          statusIcon = '🟢';
          statusColor = 'bg-green-500 animate-pulse';
          bgColor = 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700';
          textColor = 'text-green-800 dark:text-green-200';
          break;
        case 'paused':
          currentStatus = 'paused';
          statusText = 'إيقاف مؤقت';
          statusIcon = '⏸️';
          statusColor = 'bg-yellow-500 animate-pulse';
          bgColor = 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
          textColor = 'text-yellow-800 dark:text-yellow-200';
          break;
        case 'break':
          currentStatus = 'break';
          statusText = 'في استراحة';
          statusIcon = '☕';
          statusColor = 'bg-blue-500 animate-pulse';
          bgColor = 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
          textColor = 'text-blue-800 dark:text-blue-200';
          break;
        case 'stopped':
          currentStatus = 'online';
          statusText = 'متصل - جاهز للعمل';
          statusIcon = '🟡';
          statusColor = 'bg-orange-500';
          bgColor = 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700';
          textColor = 'text-orange-800 dark:text-orange-200';
          break;
        default:
          currentStatus = 'online';
          statusText = 'متصل';
          statusIcon = '🟢';
          statusColor = 'bg-green-500';
          bgColor = 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700';
          textColor = 'text-green-800 dark:text-green-200';
      }
    }

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
        {/* خلفية مزخرفة */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* مؤشر الحالة المتحرك */}
            <div className="relative flex items-center">
              <div className={`w-5 h-5 ${statusColor} rounded-full relative`}>
                {/* تأثير الإضاءة الداخلية */}
                <div className="absolute inset-0 rounded-full bg-white opacity-30 animate-pulse"></div>
              </div>
              <div className={`w-5 h-5 ${statusColor} rounded-full absolute animate-ping opacity-20`}></div>
              <div className={`w-7 h-7 ${statusColor} rounded-full absolute animate-ping opacity-10`} style={{ animationDelay: '0.5s' }}></div>
            </div>
            
            {/* معلومات الحالة */}
            <div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>
                  {statusIcon}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${textColor} tracking-wide`}>
                    حالة التطبيق
                  </h3>
                  <div className={`text-lg font-semibold ${textColor} mt-1`}>
                    {statusText}
                  </div>
                </div>
              </div>
              
              {/* معلومات إضافية حسب الحالة */}
              <div className={`text-sm ${textColor} opacity-80 mt-1`}>
                {currentStatus === 'working' && (
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <span>🕐 وقت العمل اليوم: {formatTime(desktopTrackingData?.todayData?.totalSeconds || 0)}</span>
                    <span>🎯 الإنتاجية: {desktopTrackingData?.todayData?.productivity || 0}%</span>
                  </div>
                )}
                {currentStatus === 'break' && isOnBreak && (
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <span>⏱️ مدة الاستراحة: {formatTime(breakDuration)}</span>
                    {breakStartTime && (
                      <span>🕐 بدأت الساعة: {breakStartTime.toLocaleTimeString('ar-EG')}</span>
                    )}
                  </div>
                )}
                {currentStatus === 'paused' && (
                  <span>⏸️ العمل متوقف مؤقتاً - يمكنك الاستكمال أو الإنهاء</span>
                )}
                {currentStatus === 'online' && workStatus === 'stopped' && (
                  <span>✅ التطبيق متصل وجاهز لبدء العمل</span>
                )}
                {currentStatus === 'offline' && (
                  <span>❌ التطبيق غير متصل - يرجى تشغيل تطبيق سطح المكتب</span>
                )}
              </div>
            </div>
          </div>

          {/* أزرار التحكم السريع */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* معلومات مبسطة */}
            <div className={`text-sm ${textColor} text-center p-3 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30`}>
              <div className="font-bold">
                <span className="text-lg">⏱️</span>
                <span className="ml-2">تتبع الوقت</span>
              </div>
            </div>

            {/* زر التحديث */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDesktopTrackingData}
              disabled={loading}
              className={`${textColor} border-current hover:bg-current hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm bg-white bg-opacity-10 shadow-lg`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="mr-2 font-medium">تحديث</span>
            </Button>

            {/* زر سريع حسب الحالة */}
            {currentStatus === 'working' && (
              <Button
                size="sm"
                onClick={handleRemoteStopWork}
                disabled={!desktopAppConnected || remoteControlLoading}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105 font-bold"
              >
                {remoteControlLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <span className="text-lg">🔴</span>
                )}
                إنهاء العمل
              </Button>
            )}
            
            {currentStatus === 'break' && (
              <Button
                size="sm"
                onClick={handleRemoteBreak}
                disabled={!desktopAppConnected || remoteControlLoading}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105 font-bold"
              >
                {remoteControlLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <span className="text-lg">🔚</span>
                )}
                إنهاء الاستراحة
              </Button>
            )}
            
            {currentStatus === 'paused' && (
              <Button
                size="sm"
                onClick={handleRemotePauseWork}
                disabled={!desktopAppConnected || remoteControlLoading}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105 font-bold"
              >
                {remoteControlLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <span className="text-lg">▶️</span>
                )}
                استكمال العمل
              </Button>
            )}
            
            {(currentStatus === 'online' || currentStatus === 'offline') && workStatus === 'stopped' && (
              <Button
                size="sm"
                onClick={handleRemoteStartWork}
                disabled={!desktopAppConnected || remoteControlLoading}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105 font-bold animate-pulse"
              >
                {remoteControlLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <span className="text-lg">🟢</span>
                )}
                بدء العمل
              </Button>
            )}
            
            {/* زر عرض ملاحظات الاستراحة */}
            <Button
              size="sm"
              onClick={() => setShowBreakNotesModal(true)}
              disabled={breakNotes.length === 0}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 shadow-lg transform transition-all duration-300 hover:scale-105"
              title={`عرض ملاحظات الاستراحات (${breakNotes.length} ملاحظة)`}
            >
              <span className="text-lg">📝</span>
              ملاحظات الاستراحة ({breakNotes.length})
            </Button>
          </div>
        </div>
      </div>
    );
  };



  const renderDesktopTracking = () => {
    // استخدام البيانات الحقيقية من desktopTrackingData
    const realTodayData = desktopTrackingData?.todayData || {
      totalSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      productivity: 0,
      lastActivity: null,
      isWorking: false,
      status: 'offline'
    };
    
    // حساب حالة التطبيق بناءً على حالة العمل وآخر نشاط
    const isAppConnected = desktopTrackingData?.data?.isConnected || 
      (realTodayData.isWorking && realTodayData.lastActivity && 
       (new Date() - new Date(realTodayData.lastActivity)) < 5 * 60 * 1000) // 5 دقائق

    return (
      <div className="space-y-6">
        {/* شريط الحالة الجديد */}
        {renderStatusBar()}
        {/* حالة التحميل - فقط عند التحميل الأولي */}
        {loading && !desktopTrackingData && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
              <div>
                <h3 className="text-blue-800 dark:text-blue-200 font-semibold">جاري تحميل بيانات التتبع...</h3>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  يتم جلب أحدث البيانات من التطبيق المكتبي
                </p>
              </div>
            </div>
          </div>
        )}

        {/* رسالة خطأ */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-red-800 dark:text-red-200 font-semibold">خطأ في جلب البيانات</h3>
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    onClick={fetchDesktopTrackingData}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    🔄 إعادة المحاولة
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={syncTodayData}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    title="التحقق من تطابق البيانات ومزامنتها"
                  >
                    🔍 تحقق من التطابق
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('http://localhost:5001/api/daily-attendance/auto-update-daily', {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          if (result.success) {
                            showNotification('تم تحديث سجلات اليوم بنجاح', 'success');
                            await fetchDailyRecords();
                          } else {
                            showNotification('فشل في تحديث السجلات: ' + result.message, 'error');
                          }
                        } else {
                          showNotification('فشل في تحديث السجلات', 'error');
                        }
                      } catch (error) {
                        console.error('خطأ في تحديث السجلات:', error);
                        showNotification('خطأ في تحديث السجلات', 'error');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    title="إنشاء/تحديث سجل اليوم"
                  >
                    📅 تحديث سجل اليوم
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* تحذير حالة التطبيق */}
        {/* شريط تحميل التطبيق المميز */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 shadow-2xl">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
          
          {/* النقاط المزخرفة */}
          <div className="absolute top-2 right-2 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-2 left-2 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <div className="text-2xl animate-bounce">💻</div>
                </div>
              </div>
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  تطبيق تتبع الوقت المكتبي
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  🚀 تتبع دقيق للوقت • 📊 تحليل الإنتاجية • ⏰ إدارة المهام
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-200">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                    مجاني تماماً
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                    سهل الاستخدام
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-pink-400 rounded-full"></span>
                    تزامن فوري
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm font-bold px-6 py-3"
                onClick={() => {
                  // رابط تحميل التطبيق
                  window.open('#', '_blank'); // يمكن استبداله برابط التحميل الفعلي
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">⬇️</span>
                  تحميل التطبيق
                  <span className="text-lg">✨</span>
                </span>
              </Button>
              <div className="text-center text-xs text-white/80">
                متوافق مع Windows, Mac, Linux
              </div>
            </div>
          </div>
          
          {/* شعاع ضوئي متحرك */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"></div>
      </div>

      {/* حالة الحضور الحالية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-5 h-5" />
              <span>حالة الحضور</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600 dark:text-blue-300">الحالة:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  desktopAppConnected 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {desktopAppConnected ? 'متصل' : 'غير متصل'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600 dark:text-blue-300">إجمالي الوقت:</span>
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  {formatTime(realTodayData.totalSeconds)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600 dark:text-blue-300">وقت النشاط:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatTime(realTodayData.activeSeconds)}
                </span>
              </div>
              <Button
                className={`w-full mt-3 ${
                  realTodayData.isWorking
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } ${!desktopAppConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleAttendanceAction(realTodayData.isWorking ? 'الانصراف' : 'الحضور')}
                disabled={!desktopAppConnected}
                title={!desktopAppConnected ? 'يجب تشغيل تطبيق سطح المكتب أولاً' : ''}
              >
                {realTodayData.isWorking 
                  ? '🔴 تسجيل الانصراف' 
                  : '🟢 تسجيل الحضور'
                }
              </Button>
              {!desktopAppConnected && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">
                  ⚠️ يجب تشغيل تطبيق سطح المكتب أولاً لتسجيل الحضور/الانصراف
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* بطاقة التحكم عن بُعد */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center space-x-2 rtl:space-x-reverse">
              <Shield className="w-5 h-5" />
              <span>التحكم عن بُعد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-sm text-purple-600 dark:text-purple-300">استخدم التطبيق المكتبي للحصول على أفضل تجربة تتبع</span>
              </div>
              
              <div className="space-y-2">
                {/* زر بدء العمل */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleRemoteStartWork}
                  disabled={remoteControlLoading || workStatus !== 'stopped'}
                  size="sm"
                >
                  {remoteControlLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <span>🟢</span>
                  )}
                  {workStatus !== 'stopped' ? 'العمل جاري بالفعل' : 'بدء العمل'}
                </Button>
                
                {/* زر إنهاء العمل */}
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleRemoteStopWork}
                  disabled={remoteControlLoading || workStatus === 'stopped'}
                  size="sm"
                >
                  {remoteControlLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <span>🔴</span>
                  )}
                  إنهاء العمل
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  {/* زر الإيقاف المؤقت/الاستكمال */}
                  <Button 
                    className={`${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                    onClick={handleRemotePauseWork}
                    disabled={remoteControlLoading || (workStatus !== 'working' && workStatus !== 'paused')}
                    size="sm"
                  >
                    {remoteControlLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                    ) : (
                      <span>{isPaused ? '▶️' : '⏸️'}</span>
                    )}
                    {isPaused ? 'استكمال' : 'إيقاف مؤقت'}
                  </Button>
                  
                  {/* زر الاستراحة/إنهاء الاستراحة */}
                  <Button 
                    className={`${isOnBreak ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                    onClick={handleRemoteBreak}
                    disabled={remoteControlLoading || workStatus === 'stopped'}
                    size="sm"
                  >
                    {remoteControlLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                    ) : (
                      <span>{isOnBreak ? '🔚' : '☕'}</span>
                    )}
                    {isOnBreak ? 'إنهاء الاستراحة' : 'استراحة'}
                  </Button>
                </div>
              </div>
              
              <div className="text-center text-xs text-purple-600 dark:text-purple-300 mt-2">
                {workStatus === 'stopped'
                  ? 'يمكنك بدء العمل الآن'
                  : workStatus === 'working'
                    ? 'العمل جاري - يمكنك الإيقاف المؤقت أو الاستراحة'
                    : workStatus === 'paused'
                      ? 'العمل متوقف مؤقتاً - يمكنك الاستكمال أو الإنهاء'
                      : workStatus === 'break'
                        ? 'في استراحة - يمكنك إنهاء الاستراحة أو العمل'
                        : 'يمكنك التحكم في التطبيق من هنا'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="w-5 h-5" />
              <span>النشاط اليوم</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 dark:text-green-300">وقت النشاط:</span>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {realTodayData.activeSeconds ? 
                    formatHoursToHoursMinutes(realTodayData.activeSeconds / 3600) : 
                    '0 ساعة 0 دقيقة'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 dark:text-green-300">وقت عدم النشاط:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {realTodayData.idleSeconds ? 
                    formatHoursToHoursMinutes(realTodayData.idleSeconds / 3600) : 
                    '0 ساعة 0 دقيقة'}
                </span>
              </div>
              
              {/* عداد الاستراحة الدائم */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 dark:text-green-300 flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  وقت الاستراحة:
                </span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {(() => {
                    const totalBreakSeconds = (realTodayData.breakSeconds || 0) + (isOnBreak ? breakDuration : 0);
                    return totalBreakSeconds ? 
                      formatHoursToHoursMinutes(totalBreakSeconds / 3600) : 
                      '0 ساعة 0 دقيقة';
                  })()}
                </span>
              </div>
              
              {/* مؤشر الاستراحة الحالية */}
              {isOnBreak && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-orange-600 dark:text-orange-300 flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      في استراحة حالياً:
                    </span>
                    <span className="font-medium text-orange-700 dark:text-orange-300">
                      {formatTime(breakDuration)}
                    </span>
                  </div>
                  
                  {breakStartTime && (
                    <div className="text-xs text-orange-600 dark:text-orange-400 text-center">
                      بدأت الساعة: {breakStartTime.toLocaleTimeString('ar-EG')}
                    </div>
                  )}
                  
                  {/* زر إنهاء الاستراحة السريع */}
                  <div className="text-center">
                    <Button 
                      className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                      onClick={handleRemoteBreak}
                      disabled={remoteControlLoading}
                      size="sm"
                    >
                      {remoteControlLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                      ) : (
                        <span>🔚</span>
                      )}
                      إنهاء الاستراحة
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 dark:text-green-300">نسبة الإنتاجية:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  realTodayData.productivity >= 80
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : realTodayData.productivity >= 60
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : realTodayData.productivity > 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {realTodayData.productivity}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    realTodayData.productivity >= 80 ? 'bg-green-600' :
                    realTodayData.productivity >= 60 ? 'bg-yellow-600' :
                    realTodayData.productivity > 0 ? 'bg-red-600' : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(realTodayData.productivity, 100)}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-green-600 dark:text-green-300">
                آخر نشاط: {realTodayData.lastActivity ? 
                  new Date(realTodayData.lastActivity).toLocaleTimeString('ar-EG') : 
                  'لا يوجد نشاط اليوم'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center space-x-2 rtl:space-x-reverse">
              <Eye className="w-5 h-5" />
              <span>المراقبة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600 dark:text-purple-300">وضع المراقبة:</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  نشط
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600 dark:text-purple-300">لقطات الشاشة:</span>
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  {realTodayData.screenshotsCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600 dark:text-purple-300">آخر صورة:</span>
                {realTodayData.screenshots && realTodayData.screenshots.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const lastScreenshot = realTodayData.screenshots[realTodayData.screenshots.length - 1]
                      setSelectedScreenshot({
                        url: `${BACKEND_BASE_URL}/uploads/screenshots/${lastScreenshot}`,
                        timestamp: new Date().toLocaleString('ar-EG'),
                        activity: 'عمل'
                      })
                      setShowScreenshotModal(true)
                    }}
                    className="text-xs px-2 py-1"
                  >
                    📸 عرض
                  </Button>
                ) : (
                  <span className="text-xs text-gray-500">لا توجد صور</span>
                )}
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${
                  isAppConnected 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-gray-400'
                }`} style={{ width: '100%' }}></div>
              </div>
              <div className="text-center text-xs text-purple-600 dark:text-purple-300">
                {isAppConnected ? '🟢 متصل حالياً' : '🔴 غير متصل'}
              </div>
              
              {/* زر التحقق من تطابق البيانات */}
              <Button 
                size="sm" 
                onClick={syncTodayData}
                className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                title="التحقق من تطابق البيانات بين التطبيق والجدول التفصيلي"
              >
                🔍 التحقق من تطابق البيانات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإحصائيات الأسبوعية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <BarChart3 className="w-5 h-5" />
            <span>إحصائيات الأسبوع</span>
          </CardTitle>
          <CardDescription>تتبع ساعات العمل والإنتاجية خلال الأسبوع الماضي</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={desktopTrackingData?.data?.weeklyStats || []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'productivity') return [`${value}%`, 'نسبة الإنتاجية'];
                  if (name === 'workTime') return [`${Math.round(value / 3600)} ساعة`, 'وقت العمل'];
                  if (name === 'activeTime') return [`${Math.round(value / 3600)} ساعة`, 'وقت النشاط'];
                  return [value, name];
                }}
                labelFormatter={(label) => `يوم ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'productivity') return 'نسبة الإنتاجية %';
                  if (value === 'workTime') return 'وقت العمل (ساعة)';
                  if (value === 'activeTime') return 'وقت النشاط (ساعة)';
                  return value;
                }}
              />
              <Bar 
                dataKey="productivity" 
                fill="#10b981" 
                name="productivity"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="workTime" 
                fill="#3b82f6" 
                name="workTime"
                radius={[2, 2, 0, 0]}
                formatter={(value) => Math.round(value / 3600)}
              />
              <Bar 
                dataKey="activeTime" 
                fill="#f59e0b" 
                name="activeTime"
                radius={[2, 2, 0, 0]}
                formatter={(value) => Math.round(value / 3600)}
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* ملخص الإحصائيات الأسبوعية */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="font-semibold text-green-800 dark:text-green-200">
                {desktopTrackingData?.data?.weeklyStats ? Math.round(desktopTrackingData.data.weeklyStats.reduce((sum, day) => sum + (day.productivity || 0), 0) / desktopTrackingData.data.weeklyStats.length) : 0}%
              </div>
              <div className="text-green-600 dark:text-green-400 text-xs">متوسط الإنتاجية</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="font-semibold text-blue-800 dark:text-blue-200">
                {desktopTrackingData?.data?.weeklyStats ? Math.round(desktopTrackingData.data.weeklyStats.reduce((sum, day) => sum + (day.workTime || 0), 0) / 3600) : 0} ساعة
              </div>
              <div className="text-blue-600 dark:text-blue-400 text-xs">إجمالي العمل</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                {desktopTrackingData?.data?.weeklyStats ? Math.round(desktopTrackingData.data.weeklyStats.reduce((sum, day) => sum + (day.activeTime || 0), 0) / 3600) : 0} ساعة
              </div>
              <div className="text-yellow-600 dark:text-yellow-400 text-xs">وقت النشاط</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="font-semibold text-purple-800 dark:text-purple-200">
                {desktopTrackingData?.data?.weeklyStats ? desktopTrackingData.data.weeklyStats.filter(day => day.workTime > 0).length : 0}
              </div>
              <div className="text-purple-600 dark:text-purple-400 text-xs">أيام العمل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* لقطات الشاشة الأخيرة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Eye className="w-5 h-5" />
              <span>لقطات الشاشة الأخيرة</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Filter className="w-4 h-4" />
                <span>فلاتر</span>
                {Object.values(filters).some(f => f !== 'all' && f !== '' && JSON.stringify(f) !== '{"start":"","end":""}') && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                🔒 للمشاهدة فقط - لا يمكن المسح
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            يتم أخذ لقطات عشوائية كل فترة لضمان الحضور الفعلي - البيانات محمية ولا يمكن مسحها
          </CardDescription>
          
          {/* لوحة المرشحات */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* مرشح البحث */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">بحث</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="البحث في الصور..."
                      value={filters.searchQuery}
                      onChange={(e) => updateFilter('searchQuery', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>

                {/* مرشح نوع النشاط */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع النشاط</label>
                  <select
                    value={filters.activityType}
                    onChange={(e) => updateFilter('activityType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">جميع الأنشطة</option>
                    <option value="work">عمل نشط</option>
                    <option value="idle">خمول</option>
                    <option value="break">استراحة</option>
                  </select>
                </div>

                {/* مرشح الفترة الزمنية */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الفترة الزمنية</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => updateFilter('timeRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">جميع الأوقات</option>
                    <option value="morning">صباح (6 ص - 12 ظ)</option>
                    <option value="afternoon">ظهر (12 ظ - 6 م)</option>
                    <option value="evening">مساء (6 م - 6 ص)</option>
                  </select>
                </div>

                {/* مرشح الإنتاجية */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">مستوى الإنتاجية</label>
                  <select
                    value={filters.productivity}
                    onChange={(e) => updateFilter('productivity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">جميع المستويات</option>
                    <option value="high">عالي (80%+)</option>
                    <option value="medium">متوسط (50%-80%)</option>
                    <option value="low">منخفض (أقل من 50%)</option>
                  </select>
                </div>
              </div>

              {/* مرشح النطاق الزمني */}
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">النطاق الزمني</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">من تاريخ</label>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">إلى تاريخ</label>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* أزرار العمليات */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetFilters}
                    className="flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <X className="w-4 h-4" />
                    <span>إعادة تعيين</span>
                  </Button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredScreenshots.length} من {realTodayData.screenshots?.length || 0} صورة
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  تطبيق المرشحات
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {(() => {
            const screenshots = showFilters && filteredScreenshots.length >= 0 ? filteredScreenshots : realTodayData.screenshots || [];
            const totalImages = screenshots.length;
            const totalPages = Math.ceil(totalImages / imagesPerPage);
            const startIndex = (currentPage - 1) * imagesPerPage;
            const endIndex = startIndex + imagesPerPage;
            const currentImages = screenshots.slice(startIndex, endIndex);

            return (
              <>
                {/* عرض إحصائيات الصور */}
                {totalImages > 0 && (
                  <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-semibold">إجمالي الصور: {totalImages}</span>
                      {totalPages > 1 && (
                        <span className="mx-2">|</span>
                      )}
                      {totalPages > 1 && (
                        <span>الصفحة {currentPage} من {totalPages}</span>
                      )}
                    </div>
                    {totalPages > 1 && (
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        عرض {startIndex + 1}-{Math.min(endIndex, totalImages)} من {totalImages}
                      </div>
                    )}
                  </div>
                )}

                {/* شبكة الصور */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentImages.map((screenshot, index) => {
                    const absoluteIndex = startIndex + index;
                    return (
                      <div 
                        key={absoluteIndex}
                        className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => openScreenshotModal({
                          url: `${BACKEND_BASE_URL}/uploads/screenshots/${screenshot}`,
                          timestamp: new Date().toLocaleString('ar-EG'),
                          activity: 'نشاط عمل',
                          productivity: realTodayData.productivity
                        })}
                      >
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden relative group">
                          <img 
                            src={`${BACKEND_BASE_URL}/uploads/screenshots/${screenshot}`}
                            alt={`لقطة شاشة ${absoluteIndex + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                            <Eye className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              لقطة شاشة
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              لقطة {absoluteIndex + 1}
                            </span>
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              عرض
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            نشاط عمل
                          </p>
        </div>
      </div>
    );
                  })}
                </div>

                {/* أزرار التصفح */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1 rtl:space-x-reverse"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>السابق</span>
                    </Button>
                    
                    <div className="flex space-x-1 rtl:space-x-reverse">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
  return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 p-0 ${
                              currentPage === pageNum 
                                ? 'bg-blue-600 text-white' 
                                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
      </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1 rtl:space-x-reverse"
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
    </div>
                )}

                {/* رسالة عدم وجود صور */}
                {totalImages === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>لا توجد لقطات شاشة متاحة</p>
                    <p className="text-sm">تأكد من تشغيل تطبيق سطح المكتب</p>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* جدول سجل الأيام التفصيلي - مربوط مباشرة بالتطبيق */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-700">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calendar className="w-5 h-5" />
              <span>جدول سجل الأيام التفصيلي</span>
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                ⚡ مربوط مباشر
              </span>
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                🔗 نفس بيانات التطبيق
              </span>
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button
                size="sm"
                onClick={syncMonthRecords}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
                title="تحديث جميع سجلات الشهر (بما في ذلك اليوم الحالي) من بيانات التطبيق"
              >
                <RefreshCw className="w-4 h-4 ml-1" />
                تحديث الشهر
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            🔗 مربوط مباشر مع تطبيق سطح المكتب - البيانات متطابقة 100% مع التطبيق (إجمالي، نشاط، خمول، استراحة)
            {!dailyRecordsData && (
              <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200 text-sm">
                ⚠️ جاري تحميل البيانات أو استخدام البيانات الافتراضية
              </div>
            )}
            {dailyRecordsData && dailyRecordsData.records && dailyRecordsData.records.length > 0 && 
             !dailyRecordsData.records.some(r => r.hasRealData) && (
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 rounded text-blue-800 dark:text-blue-200 text-sm">
                ℹ️ يتم عرض البيانات الافتراضية - تأكد من تشغيل التطبيق المكتبي
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* جدول الأيام */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-green-100 dark:bg-green-900/30">
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-right text-sm font-medium">التاريخ</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">اليوم</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">إجمالي الوقت</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">وقت النشاط</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">وقت الخمول</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">وقت الاستراحة</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">الوقت المتبقي</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">الإنتاجية</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">الحالة</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">البيانات</th>
                </tr>
              </thead>
              <tbody>
                {generateDailyRecords().map((record, index) => (
                  <tr key={index} className={`
                    ${record.isToday ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500' : ''}
                    ${record.isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                    ${record.hasRealData ? 'bg-green-50 dark:bg-green-900/10' : ''}
                    hover:bg-gray-100 dark:hover:bg-gray-700/50
                  `}>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">{record.date}</div>
                        <div className="text-xs text-gray-500">{record.hijriDate}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm">
                      {record.dayName}
                      {record.isToday && <span className="text-orange-600 font-bold"> (اليوم)</span>}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">
                      {(() => {
                        // إعطاء أولوية للبيانات المُنسّقة مسبقاً
                        if (record.totalFormatted && record.totalFormatted !== '0 دقيقة') {
                          return record.totalFormatted;
                        }
                        
                        // الحصول على الثواني من مصادر مختلفة
                        const totalSeconds = record.totalSeconds || (record.totalHours ? record.totalHours * 3600 : 0);
                        
                        if (totalSeconds > 0) {
                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
                        }
                        
                        return record.isWeekend ? '-' : '0 دقيقة';
                      })()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">
                      {(() => {
                        // إعطاء أولوية للبيانات المُنسّقة مسبقاً
                        if (record.activeFormatted && record.activeFormatted !== '0 دقيقة') {
                          return record.activeFormatted;
                        }
                        
                        // الحصول على الثواني من مصادر مختلفة
                        const activeSeconds = record.activeSeconds || (record.activeHours ? record.activeHours * 3600 : 0);
                        
                        if (activeSeconds > 0) {
                          const hours = Math.floor(activeSeconds / 3600);
                          const minutes = Math.floor((activeSeconds % 3600) / 60);
                          return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
                        }
                        
                        return record.isWeekend ? '-' : '0 دقيقة';
                      })()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {(() => {
                        // إعطاء أولوية للبيانات المُنسّقة مسبقاً
                        if (record.idleFormatted && record.idleFormatted !== '0 دقيقة') {
                          return record.idleFormatted;
                        }
                        
                        // الحصول على الثواني من مصادر مختلفة
                        const idleSeconds = record.idleSeconds || (record.idleHours ? record.idleHours * 3600 : 0);
                        
                        if (idleSeconds > 0) {
                          const hours = Math.floor(idleSeconds / 3600);
                          const minutes = Math.floor((idleSeconds % 3600) / 60);
                          return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
                        }
                        
                        return record.isWeekend ? '-' : '0 دقيقة';
                      })()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-orange-600 dark:text-orange-400">
                      {(() => {
                        // إعطاء أولوية للبيانات المُنسّقة مسبقاً
                        if (record.breakFormatted && record.breakFormatted !== '0 دقيقة') {
                          return record.breakFormatted;
                        }
                        
                        // الحصول على الثواني من مصادر مختلفة
                        const breakSeconds = record.breakSeconds || (record.breakHours ? record.breakHours * 3600 : 0);
                        
                        if (breakSeconds > 0) {
                          const hours = Math.floor(breakSeconds / 3600);
                          const minutes = Math.floor((breakSeconds % 3600) / 60);
                          return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
                        }
                        
                        return record.isWeekend ? '-' : '0 دقيقة';
                      })()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">
                      {(() => {
                        if (record.isWeekend || record.status === 'إجازة') return '-';
                        const requiredSeconds = 8 * 3600; // 8 ساعات مطلوبة
                        const totalSeconds = record.totalSeconds || (record.totalHours * 3600) || 0;
                        const remaining = Math.max(0, requiredSeconds - totalSeconds);
                        if (remaining === 0 && totalSeconds >= requiredSeconds) {
                          return <span className="text-green-600 font-medium">مكتمل ✅</span>;
                        }
                        const remainingHours = remaining / 3600;
                        return <span className="text-orange-600">{formatHoursToHoursMinutes(remainingHours)}</span>;
                      })()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm">
                      {(() => {
                        let productivity = record.productivity || 0;
                        // حساب الإنتاجية من البيانات التفصيلية إذا كانت متوفرة
                        if (record.totalSeconds && record.activeSeconds) {
                          productivity = Math.round((record.activeSeconds / record.totalSeconds) * 100);
                        }
                        
                        return productivity > 0 ? (
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  productivity >= 80 ? 'bg-green-500' :
                                  productivity >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${productivity}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs font-medium">{productivity}%</span>
                          </div>
                        ) : '-';
                      })()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'حاضر' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        record.status === 'متأخر' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        record.status === 'غائب' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        record.status === 'عطلة أسبوعية' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        record.status?.includes('إجازة رسمية') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                      {record.hasRealData ? (
                        <span className="text-green-600 font-bold text-xs">✅ تطبيق</span>
                      ) : record.isWeekend ? (
                        <span className="text-blue-600 text-xs">🏖️ عطلة أسبوعية</span>
                      ) : record.status?.includes('إجازة رسمية') ? (
                        <span className="text-purple-600 text-xs">🎊 إجازة رسمية</span>
                      ) : (
                        <span className="text-gray-500 text-xs">⚪ لا توجد</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص الإحصائيات */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center border border-green-200 dark:border-green-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {generateDailyRecords().filter(r => r.hasRealData).length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">أيام بيانات حقيقية</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(() => {
                  const records = generateDailyRecords();
                  const totalSeconds = records.reduce((sum, r) => {
                    return sum + (r.totalSeconds || (r.totalHours * 3600) || 0);
                  }, 0);
                  const totalHours = totalSeconds / 3600;
                  return formatHoursToHoursMinutes(totalHours);
                })()}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">إجمالي ساعات العمل</div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(() => {
                  const records = generateDailyRecords();
                  const activeSeconds = records.reduce((sum, r) => {
                    return sum + (r.activeSeconds || (r.activeHours * 3600) || 0);
                  }, 0);
                  const activeHours = activeSeconds / 3600;
                  return formatHoursToHoursMinutes(activeHours);
                })()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">إجمالي ساعات النشاط</div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg text-center border border-yellow-200 dark:border-yellow-700">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {(() => {
                  const records = generateDailyRecords();
                  const idleSeconds = records.reduce((sum, r) => {
                    return sum + (r.idleSeconds || (r.idleHours * 3600) || 0);
                  }, 0);
                  const idleHours = idleSeconds / 3600;
                  return formatHoursToHoursMinutes(idleHours);
                })()}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">إجمالي وقت الخمول</div>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg text-center border border-orange-200 dark:border-orange-700">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {(() => {
                  const records = generateDailyRecords();
                  const breakSeconds = records.reduce((sum, r) => {
                    return sum + (r.breakSeconds || (r.breakHours * 3600) || 0);
                  }, 0);
                  const breakHours = breakSeconds / 3600;
                  return formatHoursToHoursMinutes(breakHours);
                })()}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">إجمالي وقت الاستراحة</div>
            </div>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-lg text-center border border-indigo-200 dark:border-indigo-700">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(generateDailyRecords().filter(r => r.productivity > 0).reduce((sum, r) => sum + r.productivity, 0) / Math.max(1, generateDailyRecords().filter(r => r.productivity > 0).length))}%
              </div>
              <div className="text-sm text-indigo-700 dark:text-indigo-300">متوسط الإنتاجية</div>
            </div>
          </div>

          {/* زر مزامنة فورية */}
          <div className="mt-4 flex justify-center">
            <Button
              onClick={async () => {
                setLoadingStates(prev => ({ ...prev, syncing: true }));
                try {
                  // تحديث بيانات التطبيق أولاً
                  await fetchDesktopTrackingData();
                  // ثم تحديث السجلات اليومية
                  await fetchDailyRecords();
                  showNotification('تم تحديث جميع البيانات من التطبيق', 'success');
                } catch (error) {
                  console.error('خطأ في المزامنة:', error);
                  showNotification('حدث خطأ في المزامنة', 'error');
                } finally {
                  setLoadingStates(prev => ({ ...prev, syncing: false }));
                }
              }}
              disabled={loadingStates.syncing}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {loadingStates.syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري المزامنة...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  🔄 مزامنة البيانات الآن
                </>
              )}
            </Button>
          </div>

          {/* تحذير حول التحديث المباشر */}
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="text-2xl">⚡</div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ جدول سجل الأيام التفصيلي مربوط مباشرة مع قاعدة البيانات
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border-l-4 border-green-500">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    🎯 <strong>البيانات متطابقة 100%:</strong> لو التطبيق يظهر 4 دقائق وقت كلي و 2 دقيقة نشط، ستجد نفس الأرقام هنا في الجدول
                  </p>
                </div>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• <strong>إجمالي الوقت:</strong> نفس الرقم الموجود في التطبيق تماماً</li>
                  <li>• <strong>وقت النشاط:</strong> نفس وقت النشاط في التطبيق</li>
                  <li>• <strong>وقت الخمول:</strong> نفس وقت الخمول المحسوب في التطبيق</li>
                  <li>• <strong>وقت الاستراحة:</strong> نفس وقت الاستراحة إذا تم أخذ فترات راحة</li>
                  <li>• <strong>زر "تحديث اليوم":</strong> يحدث سجل اليوم الحالي فقط من بيانات التطبيق</li>
                  <li>• <strong>زر "تحديث الشهر":</strong> يحدث جميع سجلات الشهر الحالي من بيانات التطبيق</li>
                  <li>• <strong>مؤشر ✅ تطبيق:</strong> يظهر للأيام التي تحتوي على بيانات حقيقية من التطبيق</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تعليمات وإرشادات */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center space-x-2 rtl:space-x-reverse">
            <BookOpen className="w-5 h-5" />
            <span>إرشادات نظام مراقبة سطح المكتب</span>
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            دليل شامل لاستخدام نظام مراقبة الحضور والإنتاجية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                <Shield className="w-4 h-4 ml-2" />
                المتطلبات الأساسية
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">تطبيق سطح المكتب</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      تحميل وتثبيت التطبيق على جهاز العمل المخصص
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">اتصال إنترنت مستقر</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      لضمان مزامنة البيانات مع الخادم
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">تسجيل الدخول</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      استخدام نفس بيانات تسجيل الدخول للموقع
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                <Activity className="w-4 h-4 ml-2" />
                المراقبة والتتبع
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">تتبع النشاط التلقائي</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      مراقبة حركة الماوس ولوحة المفاتيح لحساب وقت العمل الفعلي
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">لقطات الشاشة العشوائية</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      كل 10-30 دقيقة للتحقق من الحضور الفعلي - محمية من المسح
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">حساب نسبة الإنتاجية</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      بناءً على نسبة الوقت النشط إلى الوقت الإجمالي
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                <Clock className="w-4 h-4 ml-2" />
                تسجيل الحضور
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">شرط التطبيق النشط</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      لا يمكن تسجيل الحضور من الموقع إلا بوجود التطبيق متصل
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">التسجيل المزدوج</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      يمكن التسجيل من التطبيق أو الموقع (بشرط اتصال التطبيق)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">التوقيت الدقيق</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      تسجيل دقيق لأوقات الدخول والخروج والفترات الزمنية
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                <Eye className="w-4 h-4 ml-2" />
                الخصوصية والأمان
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">بيانات محمية</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      جميع البيانات مشفرة ومحمية وفقاً لمعايير الأمان
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">مشاهدة فقط</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      يمكن للموظف مشاهدة لقطات الشاشة الخاصة به فقط
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Archive className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">عدم إمكانية المسح</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      البيانات محمية ولا يمكن حذفها من قبل الموظف
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">تنبيه مهم</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    نظام المراقبة مصمم لضمان العدالة والشفافية في بيئة العمل. جميع البيانات تُستخدم لأغراض إدارية فقط ومحمية بأعلى معايير الخصوصية. في حالة وجود أي استفسارات، يرجى التواصل مع قسم الموارد البشرية.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معرض الصور */}
      {(todayData.screenshots.length > 0 || filteredScreenshots.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Camera className="w-5 h-5" />
                <span>معرض لقطات الشاشة ({todayData.screenshots.length})</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>فلاتر المعرض</span>
                {Object.values(filters).some(f => f !== 'all' && f !== '' && JSON.stringify(f) !== '{"start":"","end":""}') && (
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              جميع الصور التي تم التقاطها أثناء العمل - مع إمكانية التصفح والفلترة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const screenshots = showFilters && filteredScreenshots.length >= 0 ? filteredScreenshots : todayData.screenshots || [];
              const totalImages = screenshots.length;
              const totalPages = Math.ceil(totalImages / galleryImagesPerPage);
              const startIndex = (galleryPage - 1) * galleryImagesPerPage;
              const endIndex = startIndex + galleryImagesPerPage;
              const currentImages = screenshots.slice(startIndex, endIndex);

              return (
                <>
                  {/* عرض إحصائيات المعرض */}
                  {totalImages > 0 && (
                    <div className="flex justify-between items-center mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <span className="font-semibold">معرض الصور: {totalImages} صورة</span>
                        {totalPages > 1 && (
                          <>
                            <span className="mx-2">|</span>
                            <span>الصفحة {galleryPage} من {totalPages}</span>
                          </>
                        )}
                      </div>
                      {totalPages > 1 && (
                        <div className="text-xs text-purple-600 dark:text-purple-300">
                          عرض {startIndex + 1}-{Math.min(endIndex, totalImages)} من {totalImages}
                        </div>
                      )}
                    </div>
                  )}

                  {/* شبكة الصور المصغرة */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentImages.map((screenshot, index) => {
                      const absoluteIndex = startIndex + index;
                      return (
                        <div key={absoluteIndex} className="relative group">
                          <div 
                            className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                            onClick={() => {
                              setSelectedScreenshot({
                                url: `${BACKEND_BASE_URL}/uploads/screenshots/${screenshot}`,
                                timestamp: new Date().toLocaleString('ar-EG'),
                                activity: 'عمل'
                              })
                              setShowScreenshotModal(true)
                            }}
                          >
                            <img 
                              src={`${BACKEND_BASE_URL}/uploads/screenshots/${screenshot}`}
                              alt={`لقطة ${absoluteIndex + 1}`}
                              className="w-full h-full object-cover hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTUgMTBNMjEgMTJDMjEgMTYuOTcwNiAxNi45NzA2IDIxIDEyIDIxQzcuMDI5NCAyMSAzIDE2Ljk3MDYgMyAxMkMzIDcuMDI5NCA3LjAyOTQgMyAxMiAzQzE2Ljk3MDYgMyAyMSA3LjAyOTQgMjEgMTJaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {/* رقم الصورة */}
                          <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                            {absoluteIndex + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* أزرار التصفح للمعرض */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGalleryPage(prev => Math.max(prev - 1, 1))}
                        disabled={galleryPage === 1}
                        className="flex items-center space-x-1 rtl:space-x-reverse"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>السابق</span>
                      </Button>
                      
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (galleryPage <= 3) {
                            pageNum = i + 1;
                          } else if (galleryPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = galleryPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={galleryPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setGalleryPage(pageNum)}
                              className={`w-8 h-8 p-0 ${
                                galleryPage === pageNum 
                                  ? 'bg-purple-600 text-white' 
                                  : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGalleryPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={galleryPage === totalPages}
                        className="flex items-center space-x-1 rtl:space-x-reverse"
                      >
                        <span>التالي</span>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* معلومات إضافية */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 انقر على أي صورة لعرضها بالحجم الكامل
                    </p>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* نافذة عرض الصورة */}
      {showScreenshotModal && selectedScreenshot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                لقطة شاشة - {selectedScreenshot.timestamp}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowScreenshotModal(false)}
              >
                إغلاق
              </Button>
            </div>
            <div className="p-4">
              <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                {selectedScreenshot.url ? (
                  <img 
                    src={selectedScreenshot.url} 
                    alt="لقطة شاشة" 
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className="text-center" style={{ display: selectedScreenshot.url ? 'none' : 'block' }}>
                  <Eye className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">معاينة لقطة الشاشة</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    النشاط: {selectedScreenshot.activity}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>🔒 هذه الصورة محمية ولا يمكن تحميلها أو مسحها</span>
                <span>📸 {selectedScreenshot.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
    )
  }

  // دالة لإنشاء سجل الأيام - تستخدم البيانات الحقيقية مع تطبيق إعدادات الإجازات الديناميكية
  const generateDailyRecords = () => {
    // إذا كانت البيانات الحقيقية متوفرة، استخدمها مع تطبيق إعدادات الإجازات
    if (dailyRecordsData && dailyRecordsData.records && dailyRecordsData.records.length > 0) {
      console.log('📊 استخدام السجلات اليومية الحقيقية من API مع تطبيق إعدادات الإجازات:', dailyRecordsData.records.length, 'سجل');
      
      // إضافة خصائص التنسيق للعرض مع تطبيق الفحص الديناميكي للإجازات
      const records = dailyRecordsData.records.map(record => {
        // تطبيق الفحص الديناميكي للإجازات على كل سجل
        const recordDate = new Date(record.date);
        const isDynamicWeekend = isWeekendDay(recordDate);
        const dynamicHolidayCheck = isOfficialHoliday(recordDate);
        
        // تحديث حالة السجل بناءً على الإعدادات الديناميكية
        let updatedStatus = record.status;
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
        // للسجل الحالي، استخدم البيانات المباشرة من التطبيق المكتبي
        if (record.isToday && desktopTrackingData?.todayData) {
          const realData = desktopTrackingData.todayData;
          const totalSeconds = realData.totalSeconds || 0;
          const activeSeconds = realData.activeSeconds || 0;
          const idleSeconds = realData.idleSeconds || 0;
          const breakSeconds = realData.breakSeconds || 0;
          
          console.log('🔄 استخدام البيانات المباشرة لليوم الحالي:', {
            totalSeconds,
            activeSeconds,
            idleSeconds,
            breakSeconds,
            productivity: realData.productivity
          });
          
          return {
            ...record,
            // البيانات المباشرة من التطبيق المكتبي
            totalSeconds,
            activeSeconds,
            idleSeconds,
            breakSeconds,
            productivity: realData.productivity || 0,
            status: isDynamicWeekend ? 'عطلة أسبوعية' : (dynamicHolidayCheck ? `إجازة رسمية - ${dynamicHolidayCheck.name}` : (realData.status || 'idle')),
            isWeekend: updatedIsWeekend,
            hasRealData: true,
            
            // تنسيق الوقت بناءً على البيانات المباشرة
            totalFormatted: totalSeconds > 0 ? 
              (() => {
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
              })() : '0 دقيقة',
            
            activeFormatted: activeSeconds > 0 ? 
              (() => {
                const hours = Math.floor(activeSeconds / 3600);
                const minutes = Math.floor((activeSeconds % 3600) / 60);
                return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
              })() : '0 دقيقة',
            
            idleFormatted: idleSeconds > 0 ? 
              (() => {
                const hours = Math.floor(idleSeconds / 3600);
                const minutes = Math.floor((idleSeconds % 3600) / 60);
                return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
              })() : '0 دقيقة',
            
            breakFormatted: breakSeconds > 0 ? 
              (() => {
                const hours = Math.floor(breakSeconds / 3600);
                const minutes = Math.floor((breakSeconds % 3600) / 60);
                return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
              })() : '0 دقيقة'
          };
        }
        
        // للأيام الأخرى، استخدم البيانات المخزنة
        const totalSeconds = record.totalSeconds || (record.totalHours ? record.totalHours * 3600 : 0);
        const activeSeconds = record.activeSeconds || (record.activeHours ? record.activeHours * 3600 : 0);
        const idleSeconds = record.idleSeconds || (record.idleHours ? record.idleHours * 3600 : 0);
        const breakSeconds = record.breakSeconds || (record.breakHours ? record.breakHours * 3600 : 0);
        
        return {
          ...record,
          // تطبيق الإعدادات الديناميكية المحدثة
          status: updatedStatus,
          isWeekend: updatedIsWeekend,
          // تخزين الثواني للحسابات
          totalSeconds,
          activeSeconds,
          idleSeconds,
          breakSeconds,
          
          // تنسيق الوقت الإجمالي
          totalFormatted: totalSeconds > 0 ? 
            (() => {
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة',
          
          // تنسيق وقت النشاط
          activeFormatted: activeSeconds > 0 ? 
            (() => {
              const hours = Math.floor(activeSeconds / 3600);
              const minutes = Math.floor((activeSeconds % 3600) / 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة',
          
          // تنسيق وقت الخمول
          idleFormatted: idleSeconds > 0 ? 
            (() => {
              const hours = Math.floor(idleSeconds / 3600);
              const minutes = Math.floor((idleSeconds % 3600) / 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة',
          
          // تنسيق وقت الاستراحة
          breakFormatted: breakSeconds > 0 ? 
            (() => {
              const hours = Math.floor(breakSeconds / 3600);
              const minutes = Math.floor((breakSeconds % 3600) / 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة'
        };
      });
      
      console.log('✅ تم تنسيق البيانات للعرض - عينة من البيانات:', {
        totalRecords: records.length,
        todayRecord: records.find(r => r.isToday),
        recordsWithData: records.filter(r => (r.totalSeconds > 0 || r.hasRealData)).length
      });
      
      return records;
    }
    
    // إنشاء البيانات الافتراضية للأيام التي لا توجد بها بيانات حقيقية
    console.log('📊 إنشاء البيانات للأيام المتبقية من الـ 14 يوم الماضية');
    const records = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const isWeekend = isWeekendDay(date);
      const isToday = i === 0;
      
      let totalHours = 0;
      let activeHours = 0;
      let idleHours = 0;
      let productivity = 0;
      let status = 'غائب';
      
      // فحص العطلة الرسمية
      const holidayCheck = isOfficialHoliday(date);
      
      if (isWeekend) {
        status = 'عطلة أسبوعية';
      } else if (holidayCheck) {
        status = `إجازة رسمية - ${holidayCheck.name}`;
      } else if (isToday && desktopTrackingData?.todayData?.totalSeconds > 0) {
        // استخدم البيانات الحقيقية لليوم الحالي من تطبيق الديسك توب
        const realTodayData = desktopTrackingData.todayData;
        totalHours = realTodayData.totalSeconds / 3600;
        activeHours = realTodayData.activeSeconds / 3600;
        idleHours = realTodayData.idleSeconds / 3600;
        const breakHours = realTodayData.breakSeconds ? realTodayData.breakSeconds / 3600 : 0;
        productivity = realTodayData.productivity || 0;
        status = totalHours >= 6 ? 'حاضر' : totalHours > 0 ? 'متأخر' : 'غائب';
        
        // إضافة وقت الاستراحة للسجل
        records.push({
          date: date.toLocaleDateString('ar-EG', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }),
          hijriDate: date.toLocaleDateString('ar-EG-u-ca-islamic', {
            day: '2-digit',
            month: 'short'
          }),
          dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
          totalHours: Math.round(totalHours * 10) / 10,
          activeHours: Math.round(activeHours * 10) / 10,
          idleHours: Math.round(idleHours * 10) / 10,
          breakHours: Math.round(breakHours * 10) / 10,
          totalSeconds: realTodayData.totalSeconds,
          activeSeconds: realTodayData.activeSeconds,
          idleSeconds: realTodayData.idleSeconds,
          breakSeconds: realTodayData.breakSeconds || 0,
          breakCount: 0,
          productivity,
          status,
          screenshots: 0,
          isWeekend,
          isToday,
          hasRealData: true,
          totalFormatted: totalHours > 0 ? 
            (() => {
              const hours = Math.floor(totalHours);
              const minutes = Math.floor((totalHours % 1) * 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة',
          activeFormatted: activeHours > 0 ? 
            (() => {
              const hours = Math.floor(activeHours);
              const minutes = Math.floor((activeHours % 1) * 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة',
          idleFormatted: idleHours > 0 ? 
            (() => {
              const hours = Math.floor(idleHours);
              const minutes = Math.floor((idleHours % 1) * 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة',
          breakFormatted: breakHours > 0 ? 
            (() => {
              const hours = Math.floor(breakHours);
              const minutes = Math.floor((breakHours % 1) * 60);
              return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
            })() : '0 دقيقة'
        });
        continue; // تخطي إضافة السجل مرة أخرى
      } else {
        status = 'غير متوفر';
      }

      records.push({
        date: date.toLocaleDateString('ar-EG', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        hijriDate: date.toLocaleDateString('ar-EG-u-ca-islamic', {
          day: '2-digit',
          month: 'short'
        }),
        dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
        totalHours: Math.round(totalHours * 10) / 10,
        activeHours: Math.round(activeHours * 10) / 10,
        idleHours: Math.round(idleHours * 10) / 10,
        breakHours: 0,
        totalSeconds: Math.round(totalHours * 3600),
        activeSeconds: Math.round(activeHours * 3600),
        idleSeconds: Math.round(idleHours * 3600),
        breakSeconds: 0,
        breakCount: 0,
        productivity,
        status,
        screenshots: 0,
        isWeekend,
        isToday,
        hasRealData: false, // تم نقل البيانات الحقيقية إلى الفرع السابق
        totalFormatted: totalHours > 0 ? 
          (() => {
            const hours = Math.floor(totalHours);
            const minutes = Math.floor((totalHours % 1) * 60);
            return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
          })() : '0 دقيقة',
        activeFormatted: activeHours > 0 ? 
          (() => {
            const hours = Math.floor(activeHours);
            const minutes = Math.floor((activeHours % 1) * 60);
            return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
          })() : '0 دقيقة',
        idleFormatted: idleHours > 0 ? 
          (() => {
            const hours = Math.floor(idleHours);
            const minutes = Math.floor((idleHours % 1) * 60);
            return hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`;
          })() : '0 دقيقة',
        breakFormatted: '0 دقيقة'
      });
    }

    console.log('📋 تم توليد السجلات:', {
      totalRecords: records.length,
      todayRecord: records.find(r => r.isToday),
      recordsWithData: records.filter(r => r.totalSeconds > 0).length
    });

    return records;
  };

  const renderSalary = () => {
    // التحقق من وجود بيانات الموظف
    if (!employeeProfile) {
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
    const baseSalary = employeeProfile?.baseSalary || employeeProfile?.salary || 0
    
    console.log('💰 بدء حساب الراتب:', {
      employeeProfile: employeeProfile?.name,
      baseSalary: baseSalary,
      selectedMonth: selectedMonth,
      attendanceDataLength: attendanceDataEmployee.length,
      monthlyBonusesLength: monthlyBonuses.length,
      monthlyDeductionsLength: monthlyDeductions.length
    });
    
    // حساب خصومات التأخير من بيانات الجدول (مع استبعاد العطل الرسمية)
    const workingDaysOnly = attendanceDataEmployee.filter(day => {
      const isWorkingDay = !day.isWeekend && 
        day.status !== 'عطلة' && 
        day.status !== 'إجازة' && 
        day.status !== 'مهمة خارجية' &&
        day.status !== 'غياب' &&
        day.totalHours !== undefined; // التأكد من وجود بيانات للحضور
      
      console.log(`📅 اليوم ${day.date}: isWorkingDay=${isWorkingDay}, status=${day.status}, isWeekend=${day.isWeekend}, totalHours=${day.totalHours}`);
      return isWorkingDay;
    });
    
    const totalLateDays = workingDaysOnly.filter(day => {
      // تحديد أيام التأخير بناءً على الساعات الفعلية
      const requiredHours = 8; // 8 ساعات مطلوبة يومياً
      const actualHours = day.totalHours || 0;
      const isLate = actualHours < requiredHours && actualHours > 0; // موجود لكن متأخر
      
      console.log(`🕐 يوم ${day.date}: actualHours=${actualHours}, requiredHours=${requiredHours}, isLate=${isLate}`);
      return isLate;
    }).length;
    
    const totalLateHours = workingDaysOnly.reduce((sum, day) => {
      const requiredHours = 8;
      const actualHours = day.totalHours || 0;
      const lateHours = actualHours > 0 && actualHours < requiredHours ? (requiredHours - actualHours) : 0;
      
      console.log(`⏰ يوم ${day.date}: actualHours=${actualHours}, lateHours=${lateHours}`);
      return sum + lateHours;
    }, 0);
    
    // حساب معدل الساعة بناءً على الأيام العملية فقط (استبعاد العطل الرسمية)
    const workingDaysInMonth = workingDaysOnly.length > 0 ? workingDaysOnly.length : 22; // افتراض 22 يوم عمل إذا لم توجد بيانات
    const dailyRate = baseSalary / workingDaysInMonth;
    const hourlyRate = Math.round(dailyRate / 8); // معدل الساعة
    const totalLatenessDeduction = Math.round(totalLateHours * hourlyRate); // حساب خصم التأخير
    
    // حساب المجاميع
    const totalBonuses = monthlyBonuses.reduce((sum, bonus) => sum + (Number(bonus.amount) || 0), 0);
    const totalMonthlyDeductions = monthlyDeductions.reduce((sum, deduction) => sum + (Number(deduction.amount) || 0), 0);
    const totalAllDeductions = totalMonthlyDeductions + totalLatenessDeduction; // إجمالي جميع الخصومات
    const netSalary = baseSalary + totalBonuses - totalAllDeductions;
    
    console.log('📊 نتائج حسابات الراتب:', {
      workingDaysInMonth,
      totalLateDays,
      totalLateHours: Math.round(totalLateHours * 100) / 100,
      dailyRate: Math.round(dailyRate),
      hourlyRate,
      totalLatenessDeduction,
      totalBonuses,
      totalMonthlyDeductions,
      totalAllDeductions,
      netSalary
    });

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
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrencyLocal(baseSalary)}</p>
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
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{formatCurrencyLocal(totalBonuses)}</p>
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
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">{formatCurrencyLocal(totalAllDeductions)}</p>
                  <div className="text-xs text-red-500 dark:text-red-400 mt-1 space-y-1">
                    <div>خصومات شهرية: {formatCurrencyLocal(totalMonthlyDeductions)}</div>
                    <div>خصم التأخير: {formatCurrencyLocal(totalLatenessDeduction)}</div>
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
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{formatCurrencyLocal(netSalary)}</p>
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
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrencyLocal(hourlyRate)}</p>
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
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrencyLocal(totalLatenessDeduction)}</p>
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
                    <span className="font-medium">{formatCurrencyLocal(baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أيام العمل الفعلية (بدون عطل):</span>
                    <span className="font-medium">{workingDaysInMonth} يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الراتب اليومي (÷ أيام العمل):</span>
                    <span className="font-medium">{formatCurrencyLocal(Math.round(dailyRate))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الراتب بالساعة (÷ 8):</span>
                    <span className="font-medium">{formatCurrencyLocal(hourlyRate)}</span>
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
                    <span className="font-medium text-red-600">{formatCurrencyLocal(totalLatenessDeduction)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">صافي الراتب النهائي:</span>
                    <span className="font-semibold text-green-600">{formatCurrencyLocal(netSalary)}</span>
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
                  إجمالي الخصم: {formatCurrencyLocal(totalLatenessDeduction)}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <div className="text-center py-16">
                <RefreshCw className="w-12 h-12 animate-spin mx-auto text-amber-500 mb-4" />
                <p className="text-amber-600 dark:text-amber-400 text-lg font-medium">جاري تحميل بيانات التأخيرات من الخادم...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">يتم جلب البيانات الحقيقية لشهر {getArabicMonthName(selectedMonth)}</p>
              </div>
            ) : attendanceDataEmployee.length === 0 ? (
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
                    {attendanceDataEmployee.map((dayData) => (
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
                          ) : (
                            "8 ساعات"
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
                          ) : dayData.deductionAmount > 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              {formatCurrencyLocal(dayData.deductionAmount)}
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
                          ) : dayData.status?.includes('إجازة رسمية') ? (
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
                          ) : dayData.status === 'في الوقت' ? (
                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              في الوقت
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              {dayData.status || 'غير متوفر'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAttendance = () => {
    // التحقق من وجود بيانات الحضور
    if (!employeeData?.attendance) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">⚠️</div>
            <p className="text-gray-600 dark:text-gray-300">لا توجد بيانات حضور متاحة</p>
          </div>
        </div>
      )
    }

    // بيانات حضور المالية (محاكاة بيانات)
    const monthlyAttendance = [
      { date: '2024-06-01', day: 'السبت', checkIn: '08:15', checkOut: '17:00', hours: 8.75, status: 'حاضر', overtime: 0.75 },
      { date: '2024-06-02', day: 'الأحد', checkIn: '08:00', checkOut: '16:30', hours: 8.5, status: 'حاضر', overtime: 0.5 },
      { date: '2024-06-03', day: 'الاثنين', checkIn: '08:30', checkOut: '17:15', hours: 8.75, status: 'متأخر', overtime: 0.75 },
      { date: '2024-06-04', day: 'الثلاثاء', checkIn: '08:00', checkOut: '16:45', hours: 8.75, status: 'حاضر', overtime: 0.75 },
      { date: '2024-06-05', day: 'الأربعاء', checkIn: '08:10', checkOut: '17:00', hours: 8.83, status: 'حاضر', overtime: 0.83 },
      { date: '2024-06-06', day: 'الخميس', checkIn: '-', checkOut: '-', hours: 0, status: 'غائب', overtime: 0 },
      { date: '2024-06-07', day: 'الجمعة', checkIn: '-', checkOut: '-', hours: 0, status: 'عطلة', overtime: 0 },
      { date: '2024-06-08', day: 'السبت', checkIn: '08:05', checkOut: '16:50', hours: 8.75, status: 'حاضر', overtime: 0.75 },
      { date: '2024-06-09', day: 'الأحد', checkIn: '08:15', checkOut: '-', hours: 7.5, status: 'حاضر', overtime: 0 },
    ]

    // حساب الإحصائيات
    const workingDays = monthlyAttendance.filter(day => day.status !== 'عطلة')
    const presentDays = workingDays.filter(day => day.status === 'حاضر' || day.status === 'متأخر')
    const absentDays = workingDays.filter(day => day.status === 'غائب')
    const lateDays = workingDays.filter(day => day.status === 'متأخر')
    
    const totalHours = presentDays.reduce((sum, day) => sum + day.hours, 0)
    const averageHours = totalHours / presentDays.length || 0
    const totalOvertime = presentDays.reduce((sum, day) => sum + day.overtime, 0)
    
    const attendanceRate = Math.round((presentDays.length / workingDays.length) * 100)

    return (
      <div className="space-y-6">
        {/* الصف الأول - حضور اليوم وإحصائيات */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>حضور اليوم</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">{employeeData.attendance.todayStatus}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">دخول</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{employeeData.attendance.checkInTime}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">خروج</p>
                    <p className="font-bold text-gray-700">{employeeData.attendance.checkOutTime}</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                  <p className="text-sm text-purple-600 dark:text-purple-400">ساعات العمل</p>
                  <p className="font-bold text-purple-700 dark:text-purple-300">{employeeData.attendance.totalHours} ساعة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <span>إحصائيات الشهر</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{presentDays.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">أيام حضور</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{absentDays.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">أيام غياب</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lateDays.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">أيام تأخير</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{workingDays.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">أيام العمل</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white p-3 rounded-lg text-center">
                  <p className="text-green-100 dark:text-green-200">نسبة الحضور</p>
                  <p className="text-2xl font-bold">{attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Activity className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span>معدل الساعات اليومي</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock3 className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{averageHours.toFixed(1)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">ساعة يومياً</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي الساعات</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{totalHours.toFixed(1)} ساعة</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
                    <p className="text-sm text-orange-600 dark:text-orange-400">ساعات إضافية</p>
                    <p className="font-bold text-orange-700 dark:text-orange-300">{totalOvertime.toFixed(1)} ساعة</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


                  </div>
    )
  }

  const renderPerformance = () => {
    // التحقق من وجود بيانات الأداء
    if (!employeeData?.performance) {
                      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">⚠️</div>
            <p className="text-gray-600 dark:text-gray-300">لا توجد بيانات أداء متاحة</p>
         </div>
      </div>
    )
  }

    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>تقييم الأداء</span>
            </CardTitle>
            <CardDescription>آخر تقييم: {formatDate(employeeData.performance.lastReview)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{employeeData.performance.rating}</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">من 5</div>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">أداء ممتاز</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">تقييم فوق المتوسط</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">{employeeData.performance.completed}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">مهام مكتملة</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{employeeData.performance.achievedGoals}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">أهداف محققة</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Award className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span>الإنجازات والمهارات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">المهارات الأساسية</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">المحاسبة المالية</span>
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Excel المتقدم</span>
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= 5 ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">إدارة الوقت</span>
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">الإنجازات الأخيرة</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">تطوير نظام التقارير المالية</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">قيادة مشروع تحسين العمليات</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">إكمال دورة CPA</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  }

  const renderDocuments = () => {
    // التحقق من وجود بيانات المستندات
    if (!employeeData?.documents || employeeData.documents.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">📄</div>
            <p className="text-gray-600 dark:text-gray-300">لا توجد مستندات متاحة</p>
          </div>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Archive className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>المستندات والملفات</span>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 ml-2" />
              إضافة ملف
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeData.documents.map((document) => {
              const Icon = document.icon
              return (
                <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">{document.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(document.date)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{document.type} • {document.size}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2 rtl:space-x-reverse">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 ml-2" />
                      عرض
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 ml-2" />
                      تحميل
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  }

  const renderRequests = () => {
    // التحقق من وجود بيانات الطلبات
    if (!employeeData?.requests || employeeData.requests.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">📝</div>
            <p className="text-gray-600 dark:text-gray-300">لا توجد طلبات متاحة</p>
          </div>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Plus className="w-5 h-5 text-green-500 dark:text-green-400" />
                <span>طلب جديد</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full justify-start bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">
                <CalendarIcon className="w-4 h-4 ml-2" />
                طلب إجازة سنوية
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileCheck className="w-4 h-4 ml-2" />
                شهادة راتب
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Edit3 className="w-4 h-4 ml-2" />
                تعديل البيانات الشخصية
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Bell className="w-4 h-4 ml-2" />
                استفسار إداري
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <CalendarIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>الطلبات السابقة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeData.requests.map((request) => (
                <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{request.type}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      request.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>تاريخ الطلب: {formatDate(request.date)}</p>
                    {request.duration !== '-' && <p>المدة: {request.duration}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  }

  const renderTabContent = () => {
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



  return (
    <div className="space-y-6">
      {/* نافذة إدخال سبب الاستراحة */}
      {showBreakReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">☕ سبب الاستراحة</h3>
            <p className="text-gray-600 mb-4">اكتب سبب أخذ الاستراحة (اختياري):</p>
            <textarea
              value={breakReason}
              onChange={(e) => setBreakReason(e.target.value)}
              placeholder="مثال: وقت الغداء، استراحة قهوة، مكالمة هاتفية..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={200}
            />
            <div className="text-xs text-gray-400 mb-4 text-left">
              {breakReason.length}/200
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowBreakReasonModal(false)
                  setBreakReason('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  startBreakWithReason(breakReason)
                  setShowBreakReasonModal(false)
                  setBreakReason('')
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                بدء الاستراحة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة عرض ملاحظات الاستراحة */}
      {showBreakNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">📝 ملاحظات الاستراحات</h3>
              <button
                onClick={() => setShowBreakNotesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {breakNotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">☕</div>
                <p className="text-gray-600">لا توجد ملاحظات استراحة محفوظة</p>
                <p className="text-sm text-gray-500 mt-2">ستظهر هنا ملاحظات الاستراحات التي تسجلها</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  إجمالي الاستراحات المسجلة: <span className="font-semibold">{breakNotes.length}</span>
                </div>
                
                <div className="grid gap-3">
                  {breakNotes
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((note) => (
                    <div key={note.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="text-purple-600">☕</span>
                          <span className="font-medium text-gray-800">{note.date}</span>
                          <span className="text-sm text-gray-500">{note.time}</span>
                        </div>
                        <button
                          onClick={() => {
                            const updatedNotes = breakNotes.filter(n => n.id !== note.id)
                            setBreakNotes(updatedNotes)
                            localStorage.setItem('breakNotes', JSON.stringify(updatedNotes))
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                          title="حذف هذه الملاحظة"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="bg-white border border-gray-100 rounded p-3">
                        <p className="text-gray-700 text-sm">{note.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف جميع ملاحظات الاستراحة؟')) {
                        setBreakNotes([])
                        localStorage.removeItem('breakNotes')
                        setShowBreakNotesModal(false)
                      }
                    }}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                  >
                    🗑️ حذف جميع الملاحظات
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* التبويبات */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-0 rtl:space-x-reverse min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/me/${tab.id}`)}
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
}

export default MePage