import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Animated Input Field
export const AnimatedInput = ({ 
  label, 
  error, 
  success, 
  icon: Icon, 
  type = "text",
  className = "",
  ...props 
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      {label && (
        <motion.label
          className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
            error ? 'text-red-600' : success ? 'text-green-600' : focused ? 'text-blue-600' : 'text-gray-700'
          }`}
          animate={{
            color: error ? '#dc2626' : success ? '#16a34a' : focused ? '#2563eb' : '#374151'
          }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        
        <motion.input
          {...props}
          type={inputType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 
            ${Icon ? 'pl-10' : ''} 
            ${isPassword ? 'pr-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : success 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : focused 
                  ? 'border-blue-500 focus:border-blue-600 focus:ring-blue-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }
            focus:ring-4 focus:outline-none
          `}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <motion.div
              initial={false}
              animate={{ rotate: showPassword ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.div>
          </button>
        )}
        
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {error ? (
                <AlertCircle className="text-red-500" size={18} />
              ) : (
                <CheckCircle className="text-green-500" size={18} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-600 text-sm mt-2"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-green-600 text-sm mt-2"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Multi-Step Progress Indicator
export const StepProgress = ({ currentStep, totalSteps, steps = [] }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <motion.div
              className="flex items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: index <= currentStep ? 1 : 0.8,
                opacity: 1
              }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300
                  ${index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                animate={{
                  backgroundColor: index < currentStep 
                    ? '#10b981' 
                    : index === currentStep 
                      ? '#3b82f6' 
                      : '#e5e7eb'
                }}
              >
                {index < currentStep ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CheckCircle size={20} />
                  </motion.div>
                ) : (
                  index + 1
                )}
              </motion.div>
              {steps[index] && (
                <motion.span
                  className={`ml-3 font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}
                  animate={{
                    color: index <= currentStep ? '#111827' : '#9ca3af'
                  }}
                >
                  {steps[index]}
                </motion.span>
              )}
            </motion.div>
            {index < totalSteps - 1 && (
              <motion.div
                className="flex-1 h-1 mx-4 bg-gray-200 rounded-full overflow-hidden"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: index < currentStep ? 1 : 0,
                    originX: 0
                  }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.4 }}
                />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Animated Form Container
export const AnimatedForm = ({ children, onSubmit, className = "" }) => {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className={className}
    >
      {children}
    </motion.form>
  );
};

// Animated Select Dropdown
export const AnimatedSelect = ({ 
  label, 
  options = [], 
  error, 
  className = "",
  onChange,
  value,
  placeholder = "Select an option...",
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || null
  );

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option.value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      {label && (
        <label className={`block text-sm font-medium mb-2 ${
          error ? 'text-red-600' : 'text-gray-700'
        }`}>
          {label}
        </label>
      )}
      
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between
          ${error 
            ? 'border-red-300 focus:border-red-500' 
            : isOpen 
              ? 'border-blue-500' 
              : 'border-gray-300 hover:border-gray-400'
          }
          ${selectedOption ? 'text-gray-900' : 'text-gray-400'}
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: '#f9fafb', x: 5 }}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-600 text-sm mt-2"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};