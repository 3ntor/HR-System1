import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// تطبيق الثيم فوراً قبل الرندر لتجنب الوميض
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    // التحقق من تفضيل النظام
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

// تطبيق الثيم فوراً على المستند
const applyTheme = (isDark) => {
  if (typeof window !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }
}

export const ThemeProvider = ({ children }) => {
  // تحديد الثيم الأولي
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const initialTheme = getInitialTheme()
    // تطبيق الثيم فوراً
    applyTheme(initialTheme)
    return initialTheme
  })

  // التحقق من التفضيل المحفوظ عند التحميل
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    let shouldBeDark = false
    
    if (savedTheme) {
      shouldBeDark = savedTheme === 'dark'
    } else {
      shouldBeDark = prefersDark
    }
    
    // تحديث الحالة والمستند إذا كان مختلفاً
    if (shouldBeDark !== isDarkMode) {
      setIsDarkMode(shouldBeDark)
      applyTheme(shouldBeDark)
    }
  }, [])

  // تطبيق الثيم عند تغيير الحالة
  useEffect(() => {
    applyTheme(isDarkMode)
  }, [isDarkMode])

  // مراقبة تغييرات تفضيل النظام
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      // فقط إذا لم يكن هناك تفضيل محفوظ
      const savedTheme = localStorage.getItem('theme')
      if (!savedTheme) {
        setIsDarkMode(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    applyTheme(newTheme)
    
    // إظهار رسالة تأكيد في الكونسول
    console.log(`🎨 تم تغيير الثيم إلى: ${newTheme ? 'المظلم' : 'الفاتح'}`)
    console.log(`💾 تم حفظ التفضيل في localStorage: ${newTheme ? 'dark' : 'light'}`)
    
    // إشعار بصري إضافي (اختياري)
    if (typeof window !== 'undefined') {
      // يمكن إضافة toast notification هنا إذا أردت
    }
  }

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext 