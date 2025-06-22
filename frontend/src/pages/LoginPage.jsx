import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Eye, EyeOff, User, Shield, Mail, Lock, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { authService } from '../services/api'

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // فحص إذا كان المستخدم جاء بسبب انتهاء صلاحية التوكن
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
      setError('انتهت صلاحية جلسة العمل، الرجاء تسجيل الدخول مرة أخرى');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 محاولة تسجيل دخول من LoginPage:', formData);
      
      // استخدام fetch مباشرة بدلاً من authService لتجنب المشاكل
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Login failed:', errorText);
        throw new Error(`فشل في تسجيل الدخول: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Login successful:', data);
      
      if (data.success && data.data && data.data.token) {
        // حفظ التوكن والبيانات
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user || {
          username: formData.username,
          role: 'admin'
        }));
        
        // استدعاء onLogin callback
        if (onLogin) {
          onLogin(data.data.user || { username: formData.username, role: 'admin' });
        }
        
        // التوجيه للصفحة الرئيسية
        navigate('/');
      } else {
        throw new Error('لم يتم إرجاع توكن صحيح');
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      setError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (userType) => {
    setIsLoading(true)
    setError('')
    
    try {
      const credentials = userType === 'admin' 
        ? { username: 'admin', password: 'admin123' }  // تصحيح اسم المستخدم
        : { username: 'employee', password: 'emp123' }
      
      console.log('🚀 دخول سريع:', credentials);
      
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`فشل في تسجيل الدخول: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user || {
          username: credentials.username,
          role: userType
        }));
        
        if (onLogin) {
          onLogin(data.data.user || { username: credentials.username, role: userType });
        }
        
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Quick login error:', error);
      setError(error.message || 'حدث خطأ أثناء تسجيل الدخول السريع')
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* زر تبديل الثيم */}
      <div className="fixed top-4 left-4 rtl:right-4 rtl:left-auto z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title={isDarkMode ? 'تبديل إلى الوضع الفاتح' : 'تبديل إلى الوضع المظلم'}
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
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
              <span className="text-white font-bold text-3xl">HR</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              نظام إدارة الموارد البشرية
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              منصة شاملة لإدارة الموظفين والرواتب والعمليات المالية
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">إدارة الموظفين</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">إضافة وتعديل بيانات الموظفين بسهولة</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">إدارة الرواتب</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">حساب ومتابعة الرواتب والبدلات</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">التقارير المالية</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">تقارير شاملة عن الوضع المالي</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">إدارة الحضور</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">متابعة حضور وغياب الموظفين</p>
            </div>
          </div>
        </div>

        {/* الجانب الأيمن - نموذج تسجيل الدخول */}
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* بطاقة تسجيل الدخول الرئيسية */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">تسجيل الدخول</CardTitle>
              <CardDescription className="dark:text-gray-300">أدخل بياناتك للوصول إلى النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* اسم المستخدم أو البريد الإلكتروني */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم المستخدم أو البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
                      required
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
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 dark:text-white"
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

                {/* زر تسجيل الدخول */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 text-lg font-medium"
                >
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
                <div className="text-center mt-4">
                  <span className="text-gray-600 dark:text-gray-300">ليس لديك حساب؟ </span>
                  <Link to="/signup" className="text-blue-600 hover:underline">إنشاء حساب جديد</Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* خيارات الدخول السريع */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">أو</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* دخول كمدير */}
              <Button
                onClick={() => handleQuickLogin('admin')}
                disabled={isLoading}
                variant="outline"
                className="flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 bg-white/60 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">دخول كمدير</span>
              </Button>

              {/* دخول كموظف */}
              <Button
                onClick={() => handleQuickLogin('employee')}
                disabled={isLoading}
                variant="outline"
                className="flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 bg-white/60 dark:bg-gray-800/60 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600"
              >
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-medium">دخول كموظف</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 