import React from 'react'

const Alert = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'relative w-full rounded-lg border p-4'
  
  const variants = {
    default: 'bg-white border-gray-200 text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  }

  const classes = `${baseClasses} ${variants[variant]} ${className}`

  return (
    <div className={classes} role="alert" {...props}>
      {children}
    </div>
  )
}

const AlertDescription = ({ children, className = '', ...props }) => {
  return (
    <div className={`text-sm leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  )
}

const AlertTitle = ({ children, className = '', ...props }) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h5>
  )
}

export { Alert, AlertDescription, AlertTitle } 