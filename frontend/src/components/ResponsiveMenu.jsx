import React, { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

const ResponsiveMenu = ({ isOpen, onClose, navigationItems, onNavigate, currentPath }) => {
  // إغلاق القائمة عند تغيير الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onClose])

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.responsive-menu')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu Content */}
      <div className="responsive-menu fixed right-0 rtl:left-0 rtl:right-auto top-0 h-full w-80 max-w-sm bg-white dark:bg-gray-900 shadow-xl transform transition-transform">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            القائمة الرئيسية
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.path)
                  onClose()
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-right rtl:text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span className="font-medium">{item.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>نظام إدارة الموارد البشرية</p>
            <p className="mt-1">النسخة 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveMenu 