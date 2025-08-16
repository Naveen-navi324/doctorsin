import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Page Transition Wrapper
export const PageTransition = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger Container for animating lists
export const StaggerContainer = ({ children, className = "", delay = 0.1 }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger Item for individual list items
export const StaggerItem = ({ children, className = "" }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated Card with hover effects
export const AnimatedCard = ({ children, className = "", onClick, hover = true }) => {
  const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: hover ? { 
      scale: 1.02, 
      y: -4,
      transition: { duration: 0.2, ease: "easeOut" }
    } : {},
    tap: { scale: 0.98 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px'
      }}
      whileHover={{
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Button with animations
export const AnimatedButton = ({ 
  children, 
  className = "", 
  variant = "primary",
  loading = false,
  onClick,
  disabled = false,
  ...props 
}) => {
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      y: -1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    tap: { scale: 0.98 },
    disabled: { opacity: 0.6, cursor: "not-allowed" }
  };

  const getVariantClasses = () => {
    const base = "px-6 py-3 rounded-lg font-medium transition-all duration-200 relative overflow-hidden";
    switch (variant) {
      case 'primary':
        return `${base} bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl`;
      case 'secondary':
        return `${base} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200`;
      case 'success':
        return `${base} bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl`;
      case 'danger':
        return `${base} bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl`;
      default:
        return `${base} bg-blue-600 text-white`;
    }
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !loading ? "hover" : "initial"}
      whileTap={!disabled && !loading ? "tap" : "initial"}
      animate={disabled ? "disabled" : "initial"}
      onClick={disabled || loading ? undefined : onClick}
      className={`${getVariantClasses()} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.span
        animate={{ opacity: loading ? 0 : 1 }}
        className="flex items-center gap-2"
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Animated Modal Backdrop
export const AnimatedModal = ({ children, isOpen, onClose, className = "" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Animated Counter
export const AnimatedCounter = ({ from = 0, to, duration = 1, suffix = "", className = "" }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.span
          animate={{ 
            opacity: [0, 1],
            y: [20, 0]
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {to}{suffix}
        </motion.span>
      </motion.span>
    </motion.span>
  );
};

// Animated Progress Bar
export const AnimatedProgress = ({ value, max = 100, className = "" }) => {
  const percentage = (value / max) * 100;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
      />
    </div>
  );
};

// Floating Action Button
export const FloatingButton = ({ children, onClick, className = "" }) => {
  return (
    <motion.button
      className={`fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg ${className}`}
      whileHover={{ 
        scale: 1.1,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.button>
  );
};