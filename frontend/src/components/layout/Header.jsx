import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Receipt, 
  Tag, 
  Settings, 
  User,
  LogOut,
  Menu,
  Bell
} from 'lucide-react'

const Header = ({ user, onLogout, isSidebarOpen, toggleSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', admin: true },
    { path: '/transactions', icon: DollarSign, label: 'المعاملات المالية', admin: true },
    { path: '/employees', icon: Users, label: 'الموظفين', admin: true },
    { path: '/payroll', icon: Receipt, label: 'الرواتب', admin: true },
    { path: '/categories', icon: Tag, label: 'التصنيفات', admin: true },
    { path: '/me/overview', icon: User, label: 'حسابي الشخصي', admin: false },
    { path: '/employees-list', icon: Users, label: 'دليل الموظفين', admin: false },
    { path: '/settings', icon: Settings, label: 'الإعدادات', admin: true },
  ]

  const filteredItems = navItems.filter(item => 
    user?.role === 'admin' || !item.admin
  )

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg border-b border-blue-800/20 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* الجزء الأيمن - اللوجو والقائمة */}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden ml-2 text-white hover:bg-white/10 transition-colors duration-200"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <Link to="/dashboard" className="flex items-center group">
              <div className="bg-white/10 backdrop-blur-sm text-white rounded-xl p-3 ml-3 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <DollarSign className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">
                  نظام الإدارة المالية
                </span>
                <span className="text-xs text-blue-100 opacity-80">
                  إدارة الموارد البشرية والمالية
                </span>
              </div>
            </Link>
          </div>

          {/* القائمة الرئيسية - مخفية على الشاشات الصغيرة */}
          <nav className="hidden lg:flex space-x-2 space-x-reverse">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10'
                      : 'text-blue-100 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md'
                  }`}
                >
                  <Icon className={`ml-2 h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* معلومات المستخدم وزر تسجيل الخروج */}
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* زر الإشعارات */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors duration-200 relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center notification-badge">
                3
              </span>
            </Button>

            {/* معلومات المستخدم */}
            <div className="flex items-center space-x-3 space-x-reverse bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user?.name || 'المستخدم'}
                </p>
                <p className="text-xs text-blue-100">
                  {user?.role === 'admin' ? 'مدير النظام' : 'موظف'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-white/20 to-white/10 text-white rounded-full p-2.5 border border-white/20">
                <User className="h-5 w-5" />
              </div>
            </div>
            
            {/* زر تسجيل الخروج */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-blue-100 hover:text-white hover:bg-red-500/20 transition-all duration-200 px-4 py-2.5 rounded-xl border border-transparent hover:border-red-400/20"
            >
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>

      {/* القائمة المنسدلة للهواتف */}
      {isSidebarOpen && (
        <div className="lg:hidden border-t border-white/10 bg-gradient-to-b from-blue-700 to-blue-800 backdrop-blur-sm">
          <nav className="px-4 py-3 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleSidebar}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/10'
                      : 'text-blue-100 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm'
                  }`}
                >
                  <Icon className="ml-3 h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header 