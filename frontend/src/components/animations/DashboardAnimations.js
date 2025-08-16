import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Activity,
  DollarSign,
  Clock,
  Heart
} from 'lucide-react';
import { AnimatedCounter } from './AnimatedComponents';

// Enhanced Dashboard Stat Card
export const AnimatedStatCard = ({ 
  title, 
  value, 
  change, 
  trend = "up", 
  icon: Icon, 
  color = "blue",
  suffix = "",
  prefix = "",
  className = "" 
}) => {
  const colorClasses = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
      light: "bg-blue-50"
    },
    green: {
      bg: "from-green-500 to-green-600", 
      text: "text-green-600",
      light: "bg-green-50"
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-600", 
      light: "bg-purple-50"
    },
    orange: {
      bg: "from-orange-500 to-orange-600",
      text: "text-orange-600",
      light: "bg-orange-50"
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-center gap-2">
            <motion.p
              className="text-2xl font-bold text-gray-900"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              {prefix}
              <AnimatedCounter to={value} suffix={suffix} />
            </motion.p>
            {change !== undefined && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend === 'up' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(change)}%
              </motion.div>
            )}
          </div>
        </div>
        
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className={`p-3 rounded-lg ${colors.light}`}
        >
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </motion.div>
      </div>
    </motion.div>
  );
};

// Animated Chart/Progress Component
export const AnimatedChart = ({ 
  data = [], 
  title, 
  className = "" 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-md p-6 ${className}`}
    >
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-gray-900 mb-6"
      >
        {title}
      </motion.h3>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${item.color || 'bg-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ 
                  duration: 1.2, 
                  ease: "easeOut", 
                  delay: index * 0.1 + 0.5 
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Quick Action Button
export const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  color = "blue",
  className = "" 
}) => {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    purple: "bg-purple-500 hover:bg-purple-600 text-white",
    gray: "bg-gray-100 hover:bg-gray-200 text-gray-700"
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        p-4 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-2
        ${colorClasses[color]} ${className}
      `}
      whileHover={{ 
        scale: 1.05,
        y: -2
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm">{label}</span>
    </motion.button>
  );
};

// Recent Activity Item
export const ActivityItem = ({ 
  title, 
  description, 
  time, 
  type = "default",
  avatar,
  className = "" 
}) => {
  const typeColors = {
    appointment: "bg-blue-100 text-blue-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    default: "bg-gray-100 text-gray-600"
  };

  const typeIcons = {
    appointment: Calendar,
    success: Heart,
    warning: Clock,
    default: Activity
  };

  const Icon = typeIcons[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
      className={`flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-2 rounded-full ${typeColors[type]}`}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-medium text-gray-900 text-sm"
        >
          {title}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-sm mt-1"
        >
          {description}
        </motion.p>
      </div>
      
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-xs whitespace-nowrap"
      >
        {time}
      </motion.span>
    </motion.div>
  );
};

// Dashboard Welcome Header
export const WelcomeHeader = ({ 
  user, 
  greeting = "Good morning",
  className = "" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 ${className}`}
    >
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-bold text-gray-900 mb-2"
      >
        {greeting}, {user?.name}! 👋
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-gray-600"
      >
        Here's what's happening with your healthcare today.
      </motion.p>
    </motion.div>
  );
};

// Notification Badge
export const NotificationBadge = ({ 
  count = 0, 
  className = "" 
}) => {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold 
        rounded-full min-w-[20px] h-5 flex items-center justify-center px-1
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
};

// Floating Dashboard Widget
export const FloatingWidget = ({ 
  children, 
  title, 
  className = "" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ 
        y: -2,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      className={`
        bg-white rounded-xl shadow-md p-6 transition-all duration-300
        ${className}
      `}
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          {title}
        </motion.h3>
      )}
      {children}
    </motion.div>
  );
};