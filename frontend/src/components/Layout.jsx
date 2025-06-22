import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopHeader from './TopHeader'
import NavigationHeader from './NavigationHeader'

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // التحقق من وجود المستخدم - مع مراعاة حالة التحميل
  useEffect(() => {
    // التحقق من localStorage قبل إعادة التوجيه
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (!user && !token && !savedUser) {
      // إعادة التوجيه فقط إذا لم توجد أي بيانات محفوظة
      navigate('/login')
    }
  }, [user, navigate])

  // صفحات لا تحتاج للهيدر (مثل صفحة تسجيل الدخول)
  const hideHeaderRoutes = ['/login', '/register']
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname)

  if (shouldHideHeader) {
    return children
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopHeader user={user} onLogout={onLogout} />
      <NavigationHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout 