import React, { useState } from 'react'
import Header from './Header'

const Layout = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
      <Header 
        user={user} 
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* خلفية تزيينية */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-indigo-600/5 rounded-3xl"></div>
            <div className="relative">
              {children}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-black border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-right mb-4 md:mb-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                نظام إدارة مالية الموظفين
              </h3>
              <p className="text-sm text-gray-300">
                حلول متكاملة لإدارة الموارد البشرية والمالية
              </p>
            </div>
            
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400 mb-1">
                © 2024 جميع الحقوق محفوظة
              </p>
              <p className="text-xs text-gray-500">
                تطوير فريق التكنولوجيا المتقدمة
              </p>
            </div>
          </div>
          
          {/* خط تزييني */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 