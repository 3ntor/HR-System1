import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useNotifications } from '../components/NotificationSystem'
import { Label } from '../components/ui/label'
import { 
  Settings, 
  Bell, 
  Database,
  Download,
  Upload,
  Save,
  RefreshCw,
  Shield,
  User,
  Building,
  Globe,
  CreditCard,
  Calendar
} from 'lucide-react'
import { settingsService } from '../services/api'
import HolidayConfiguration from '../components/HolidayConfiguration'

const SettingsPage = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState('')
  
  // إعدادات الشركة
  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    companyEmail: '',
    currency: 'EGP',
    language: 'ar',
    theme: 'light',
    address: {
      street: '',
      city: '',
      governorate: '',
      country: 'مصر',
      postalCode: ''
    },
    contactInfo: {
      phone: '',
      website: '',
      taxNumber: ''
    }
  })

  // إعدادات المستخدم
  const [userSettings, setUserSettings] = useState({
    preferences: {
      language: 'ar',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        payroll: true,
        budget: true,
        reports: false
      }
    },
    security: {
      twoFactorAuth: false,
      autoLogout: 30,
      passwordExpiry: 90,
      sessionTimeout: 30
    }
  })

  // وسائل الدفع
  const [paymentSettings, setPaymentSettings] = useState({
    methods: [],
    defaultMethod: '',
    taxRate: 14,
    currency: 'EGP'
  })

  // جلب الإعدادات
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await settingsService.get()
        if (response.success) {
          const data = response.data
          // تحديث إعدادات الشركة
          if (data.company) {
            setCompanySettings(data.company)
          }
          // تحديث إعدادات المستخدم
          if (data.user) {
            setUserSettings(data.user)
          }
          // تحديث إعدادات الدفع
          if (data.payment) {
            setPaymentSettings(data.payment)
          }
        }
      } catch (error) {
        showError('حدث خطأ في جلب الإعدادات')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // تحديث إعدادات الشركة
  const handleCompanyUpdate = async (data) => {
    try {
      setSaving(true)
      const response = await settingsService.updateCompany(data)
      if (response.success) {
        setCompanySettings(data)
        showSuccess('تم تحديث إعدادات الشركة بنجاح')
      }
    } catch (error) {
      showError('حدث خطأ في تحديث إعدادات الشركة')
    } finally {
      setSaving(false)
    }
  }

  // تحديث إعدادات المستخدم
  const handleUserUpdate = async (data) => {
    try {
      setSaving(true)
      const response = await settingsService.updateUser(data)
      if (response.success) {
        setUserSettings(data)
        showSuccess('تم تحديث إعدادات المستخدم بنجاح')
      }
    } catch (error) {
      showError('حدث خطأ في تحديث إعدادات المستخدم')
    } finally {
      setSaving(false)
    }
  }

  // تحديث إعدادات الدفع
  const handlePaymentUpdate = async (data) => {
    try {
      setSaving(true)
      const response = await settingsService.updatePayment(data)
      if (response.success) {
        setPaymentSettings(data)
        showSuccess('تم تحديث إعدادات الدفع بنجاح')
      }
    } catch (error) {
      showError('حدث خطأ في تحديث إعدادات الدفع')
    } finally {
      setSaving(false)
    }
  }

  // إضافة وسيلة دفع جديدة
  const handleAddPaymentMethod = async (method) => {
    try {
      setSaving(true)
      const updatedMethods = [...paymentSettings.methods, method]
      const response = await settingsService.updatePayment({
        ...paymentSettings,
        methods: updatedMethods
      })
      if (response.success) {
        setPaymentSettings(prev => ({
          ...prev,
          methods: updatedMethods
        }))
        showSuccess('تم إضافة وسيلة الدفع بنجاح')
      }
    } catch (error) {
      showError('حدث خطأ في إضافة وسيلة الدفع')
    } finally {
      setSaving(false)
    }
  }

  // حذف وسيلة دفع
  const handleRemovePaymentMethod = async (method) => {
    try {
      setSaving(true)
      const updatedMethods = paymentSettings.methods.filter(m => m !== method)
      const response = await settingsService.updatePayment({
        ...paymentSettings,
        methods: updatedMethods
      })
      if (response.success) {
        setPaymentSettings(prev => ({
          ...prev,
          methods: updatedMethods
        }))
        showSuccess('تم حذف وسيلة الدفع بنجاح')
      }
    } catch (error) {
      showError('حدث خطأ في حذف وسيلة الدفع')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* العنوان الرئيسي */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة إعدادات النظام والشركة والمستخدم
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تحميل
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* إعدادات الشركة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="ml-2 h-5 w-5" />
              إعدادات الشركة
            </CardTitle>
            <CardDescription>إعدادات الشركة الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">اسم الشركة</Label>
              <Input
                id="companyName"
                value={companySettings.companyName}
                onChange={(e) => handleCompanyUpdate({
                  ...companySettings,
                  companyName: e.target.value
                })}
              />
            </div>

            <div>
              <Label htmlFor="companyEmail">البريد الإلكتروني للشركة</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companySettings.companyEmail}
                onChange={(e) => handleCompanyUpdate({
                  ...companySettings,
                  companyEmail: e.target.value
                })}
              />
            </div>

            <div>
              <Label htmlFor="currency">العملة الافتراضية</Label>
              <select
                id="currency"
                value={companySettings.currency}
                onChange={(e) => handleCompanyUpdate({
                  ...companySettings,
                  currency: e.target.value
                })}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="language">اللغة</Label>
              <select
                id="language"
                value={companySettings.language}
                onChange={(e) => handleCompanyUpdate({
                  ...companySettings,
                  language: e.target.value
                })}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات المستخدم */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="ml-2 h-5 w-5" />
              إعدادات المستخدم
            </CardTitle>
            <CardDescription>تخصيص إعدادات المستخدم والإشعارات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>إشعارات البريد الإلكتروني</Label>
                <p className="text-sm text-gray-500">تلقي إشعارات عبر البريد</p>
              </div>
              <button
                onClick={() => handleUserUpdate({
                  ...userSettings,
                  preferences: {
                    ...userSettings.preferences,
                    notifications: {
                      ...userSettings.preferences.notifications,
                      email: !userSettings.preferences.notifications.email
                    }
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userSettings.preferences.notifications.email ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userSettings.preferences.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>إشعارات النظام</Label>
                <p className="text-sm text-gray-500">تلقي إشعارات من النظام</p>
              </div>
              <button
                onClick={() => handleUserUpdate({
                  ...userSettings,
                  preferences: {
                    ...userSettings.preferences,
                    notifications: {
                      ...userSettings.preferences.notifications,
                      push: !userSettings.preferences.notifications.push
                    }
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userSettings.preferences.notifications.push ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userSettings.preferences.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>المصادقة الثنائية</Label>
                <p className="text-sm text-gray-500">تفعيل المصادقة الثنائية للأمان</p>
              </div>
              <button
                onClick={() => handleUserUpdate({
                  ...userSettings,
                  security: {
                    ...userSettings.security,
                    twoFactorAuth: !userSettings.security.twoFactorAuth
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  userSettings.security.twoFactorAuth ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userSettings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الدفع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="ml-2 h-5 w-5" />
              إعدادات الدفع
            </CardTitle>
            <CardDescription>إدارة وسائل الدفع وإعدادات الضرائب</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={paymentSettings.taxRate}
                onChange={(e) => handlePaymentUpdate({
                  ...paymentSettings,
                  taxRate: parseFloat(e.target.value)
                })}
              />
            </div>

            <div>
              <Label>وسائل الدفع المتاحة</Label>
              <div className="space-y-2">
                {paymentSettings.methods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{method}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method)}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="وسيلة دفع جديدة"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (newPaymentMethod.trim()) {
                        handleAddPaymentMethod(newPaymentMethod.trim())
                        setNewPaymentMethod('')
                      }
                    }}
                  >
                    إضافة
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الأمان */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="ml-2 h-5 w-5" />
              إعدادات الأمان
            </CardTitle>
            <CardDescription>إدارة إعدادات الأمان والنظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="autoLogout">مدة تسجيل الخروج التلقائي (دقائق)</Label>
              <Input
                id="autoLogout"
                type="number"
                value={userSettings.security.autoLogout}
                onChange={(e) => handleUserUpdate({
                  ...userSettings,
                  security: {
                    ...userSettings.security,
                    autoLogout: parseInt(e.target.value)
                  }
                })}
              />
            </div>

            <div>
              <Label htmlFor="passwordExpiry">مدة صلاحية كلمة المرور (يوم)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={userSettings.security.passwordExpiry}
                onChange={(e) => handleUserUpdate({
                  ...userSettings,
                  security: {
                    ...userSettings.security,
                    passwordExpiry: parseInt(e.target.value)
                  }
                })}
              />
            </div>

            <div>
              <Label htmlFor="sessionTimeout">مدة انتهاء الجلسة (دقائق)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={userSettings.security.sessionTimeout}
                onChange={(e) => handleUserUpdate({
                  ...userSettings,
                  security: {
                    ...userSettings.security,
                    sessionTimeout: parseInt(e.target.value)
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الإجازات الرسمية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calendar className="w-5 h-5" />
              <span>إعدادات الإجازات الرسمية</span>
            </CardTitle>
            <CardDescription>
              إدارة الإجازات الرسمية والعطلات الأسبوعية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <HolidayConfiguration />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage 