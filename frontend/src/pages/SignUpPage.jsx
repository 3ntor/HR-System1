import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Eye, EyeOff, User, Mail, Lock, Sun, Moon, UserPlus, Building, Phone, Calendar } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { authService } from '../services/api'

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    name: '', // إضافة name field
    phone: '',
    department: '',
    position: '',
    birthDate: '',
    role: 'employee'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const departments = [
    'الموارد البشرية',
    'المحاسبة والمالية',
    'تكنولوجيا المعلومات',
    'التسويق والمبيعات',
    'العمليات',
    'الإدارة العامة'
  ]

  const positions = [
    'مدير',
    'مدير مساعد',
    'موظف أول',
    'موظف',
    'متدرب',
    'استشاري'
  ]

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('يرجى إدخال الاسم الكامل')
      return false
    }

    if (!formData.email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح')
      return false
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين')
      return false
    }

    if (!formData.phone.trim()) {
      setError('يرجى إدخال رقم الهاتف')
      return false
    }

    if (!formData.department) {
      setError('يرجى اختيار القسم')
      return false
    }

    if (!formData.position) {
      setError('يرجى اختيار المنصب')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // تقسيم الاسم الكامل إلى الاسم الأول والأخير
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      // تجهيز البيانات للإرسال مع إضافة console.log للتشخيص
      const userData = {
        username: formData.username || formData.name.replace(/\s+/g, '').toLowerCase(), // إنشاء username إذا لم يوجد
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        birthDate: formData.birthDate,
        role: formData.role
      }
      
      console.log('📤 إرسال بيانات التسجيل:', userData)

      // إرسال البيانات للباك إند
      const response = await authService.register(userData)
      console.log('✅ استجابة التسجيل:', response)
      
      if (response.success) {
        setSuccess('تم إنشاء الحساب بنجاح! في انتظار موافقة الإدارة.')
        
        // إعادة تعيين النموذج
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          name: '',
          phone: '',
          department: '',
          position: '',
          birthDate: '',
          role: 'employee'
        })

        // الانتقال لصفحة تسجيل الدخول بعد 5 ثوان
        setTimeout(() => {
          navigate('/login')
        }, 5000)
      } else {
        setError(response.message || 'حدث خطأ أثناء إنشاء الحساب')
      }
    } catch (error) {
      console.error('❌ خطأ في التسجيل:', error)
      setError(error.response?.data?.message || error.message || 'حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* زر تبديل الثيم */}
      <div className="fixed top-4 left-4 rtl:right-4 rtl:left-auto z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        
        {/* الجانب الأيسر - معلومات النظام */}
        <div className="hidden lg:block space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <UserPlus className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              إنشاء حساب جديد
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              انضم إلى نظام إدارة الموارد البشرية
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">إدارة البيانات</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">تحديث وإدارة بياناتك الشخصية</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">متابعة الراتب</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">تتبع الراتب والبدلات والخصومات</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">طلب الإجازات</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">تقديم طلبات الإجازة ومتابعتها</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">التقارير</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">عرض التقارير والإحصائيات</p>
            </div>
          </div>
        </div>

        {/* الجانب الأيمن - نموذج إنشاء الحساب */}
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* بطاقة إنشاء الحساب الرئيسية */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">إنشاء حساب جديد</CardTitle>
              <CardDescription className="dark:text-gray-300">أدخل بياناتك لإنشاء حساب في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-green-700 dark:text-green-400 text-sm">
                    {success}
                  </div>
                )}

                {/* اسم المستخدم */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم المستخدم</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="أدخل اسم المستخدم"
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* الاسم الكامل */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="أدخل الاسم الكامل"
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* البريد الإلكتروني */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="أدخل البريد الإلكتروني"
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="أدخل رقم الهاتف"
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* القسم والمنصب */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">القسم</label>
                    <div className="relative">
                      <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                        required
                      >
                        <option value="">اختر القسم</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المنصب</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    >
                      <option value="">اختر المنصب</option>
                      {positions.map((pos, index) => (
                        <option key={index} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* تاريخ الميلاد */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الميلاد</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                    />
                  </div>
                </div>

                {/* كلمة المرور */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="أدخل كلمة المرور"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* تأكيد كلمة المرور */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="أعد إدخال كلمة المرور"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* زر إنشاء الحساب */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 py-3 text-lg font-medium"
                >
                  {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* الانتقال لتسجيل الدخول */}
          <Card className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                لديك حساب بالفعل؟
              </p>
                             <Button
                 variant="outline"
                 onClick={() => navigate('/login')}
                 className="bg-white/60 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700"
               >
                 تسجيل الدخول
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage