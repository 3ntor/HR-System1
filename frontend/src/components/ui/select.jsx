import React, { useState, useRef, useEffect } from 'react'

const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  const selectRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setSelectedValue(value || '')
  }, [value])

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue)
    setIsOpen(false)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            selectedValue,
            onValueChange: handleValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

const SelectTrigger = ({ children, isOpen, setIsOpen, className = '', ...props }) => {
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-200 
        bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      <span className="block truncate">{children}</span>
      <svg
        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

const SelectValue = ({ placeholder, selectedValue, children }) => {
  // If there are children, render them (for custom content)
  if (children) {
    return <span>{children}</span>
  }
  
  return (
    <span className={selectedValue ? '' : 'text-gray-500'}>
      {selectedValue || placeholder}
    </span>
  )
}

const SelectContent = ({ children, isOpen, onValueChange, selectedValue, className = '' }) => {
  if (!isOpen) return null

  return (
    <div
      className={`
        absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-gray-200 
        bg-white shadow-lg max-h-60 overflow-auto
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <div className="py-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onValueChange,
              selectedValue,
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

const SelectItem = ({ children, value, onValueChange, selectedValue, className = '' }) => {
  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value)
    }
  }

  const isSelected = selectedValue === value

  return (
    <div
      onClick={handleClick}
      className={`
        relative flex cursor-pointer select-none items-center py-2 px-3 text-sm 
        hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
        ${isSelected ? 'bg-blue-50 text-blue-900' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
      {isSelected && (
        <svg
          className="mr-2 h-4 w-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } 