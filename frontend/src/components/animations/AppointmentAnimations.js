import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Star,
  Video,
  Building
} from 'lucide-react';

// Enhanced Appointment Card
export const AnimatedAppointmentCard = ({ 
  appointment, 
  onStatusUpdate, 
  userRole = "patient",
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200", 
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle
    };
    return icons[status] || AlertCircle;
  };

  const StatusIcon = getStatusIcon(appointment.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -2,
        boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
      }}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      <motion.div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-gray-900 text-lg mb-1"
            >
              {userRole === 'doctor' ? appointment.patient_name : appointment.doctor_name}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 text-sm"
            >
              {appointment.specialization}
            </motion.p>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(appointment.status)}`}
          >
            <StatusIcon size={14} />
            <span className="text-sm font-medium capitalize">{appointment.status}</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 text-gray-600"
          >
            <Calendar size={16} />
            <span className="text-sm">{appointment.date}</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 text-gray-600"
          >
            <Clock size={16} />
            <span className="text-sm">{appointment.start_time} - {appointment.end_time}</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 text-gray-600"
          >
            {appointment.consultation_type === 'online' ? (
              <Video size={16} />
            ) : (
              <Building size={16} />
            )}
            <span className="text-sm capitalize">{appointment.consultation_type}</span>
          </motion.div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="flex justify-center"
        >
          <ArrowRight className="text-gray-400" size={20} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-6 border-t border-gray-100"
          >
            <div className="pt-4 space-y-4">
              {appointment.reason && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reason for Visit</h4>
                  <p className="text-gray-600 text-sm">{appointment.reason}</p>
                </div>
              )}
              
              {appointment.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 text-sm">{appointment.notes}</p>
                </div>
              )}
              
              {userRole === 'doctor' && appointment.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusUpdate(appointment.id, 'confirmed')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Confirm Appointment
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusUpdate(appointment.id, 'cancelled')}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              )}
              
              {userRole === 'doctor' && appointment.status === 'confirmed' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStatusUpdate(appointment.id, 'completed')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Mark as Completed
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Time Slot Selection Component
export const AnimatedTimeSlot = ({ 
  slot, 
  isSelected, 
  isAvailable = true,
  onClick,
  className = "" 
}) => {
  return (
    <motion.button
      onClick={isAvailable ? onClick : undefined}
      disabled={!isAvailable}
      className={`
        p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2
        ${isSelected 
          ? 'bg-blue-600 text-white border-blue-600' 
          : isAvailable 
            ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }
        ${className}
      `}
      whileHover={isAvailable ? { scale: 1.05 } : {}}
      whileTap={isAvailable ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {slot.start_time} - {slot.end_time}
    </motion.button>
  );
};

// Booking Progress Steps
export const BookingProgress = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  ${index <= currentStep 
                    ? index < currentStep 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                animate={{
                  scale: index === currentStep ? [1, 1.1, 1] : 1
                }}
                transition={{
                  scale: {
                    duration: 0.5,
                    repeat: index === currentStep ? Infinity : 0,
                    repeatType: "reverse"
                  }
                }}
              >
                {index < currentStep ? (
                  <CheckCircle size={18} />
                ) : (
                  index + 1
                )}
              </motion.div>
              <motion.span
                className={`mt-2 text-xs font-medium ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {step}
              </motion.span>
            </motion.div>
            
            {index < steps.length - 1 && (
              <motion.div
                className="flex-1 h-0.5 mx-4 bg-gray-200 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index < currentStep ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Doctor Rating Component
export const DoctorRating = ({ rating = 0, reviews = 0, size = "sm" }) => {
  const starSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.div
            key={star}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: star * 0.1 }}
          >
            <Star
              size={starSizes[size]}
              className={`${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          </motion.div>
        ))}
      </div>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-gray-600"
      >
        {rating.toFixed(1)} ({reviews} reviews)
      </motion.span>
    </motion.div>
  );
};

// Consultation Type Selector
export const ConsultationTypeSelector = ({ 
  selected, 
  onSelect, 
  options = ['online', 'clinic'],
  className = "" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`grid grid-cols-2 gap-4 ${className}`}
    >
      {options.map((type, index) => {
        const isSelected = selected === type;
        const Icon = type === 'online' ? Video : Building;
        
        return (
          <motion.button
            key={type}
            onClick={() => onSelect(type)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              animate={{ 
                scale: isSelected ? 1.1 : 1,
                rotate: isSelected ? [0, 10, -10, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Icon size={24} />
            </motion.div>
            <span className="font-medium capitalize">{type} Consultation</span>
            <span className="text-sm text-gray-500">
              {type === 'online' ? 'Video call with doctor' : 'Visit clinic in person'}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};