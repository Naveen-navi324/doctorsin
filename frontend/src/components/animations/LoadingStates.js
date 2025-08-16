import React from 'react';
import { motion } from 'framer-motion';

// Skeleton Loader Component
export const SkeletonLoader = ({ className = "", lines = 1, height = "h-4" }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className={`bg-gray-200 rounded-md ${height} mb-2 last:mb-0`}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
};

// Doctor Card Skeleton
export const DoctorCardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex items-start gap-4">
        <motion.div
          className="w-16 h-16 bg-gray-200 rounded-full"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="flex-1">
          <SkeletonLoader height="h-6" className="mb-2" />
          <SkeletonLoader height="h-4" lines={2} />
          <div className="mt-4 flex gap-2">
            <motion.div
              className="w-20 h-6 bg-gray-200 rounded-full"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
            <motion.div
              className="w-16 h-6 bg-gray-200 rounded-full"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonLoader height="h-6" className="w-32" />
        <motion.div
          className="w-8 h-8 bg-gray-200 rounded"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <SkeletonLoader height="h-8" className="w-16 mb-2" />
      <SkeletonLoader height="h-4" className="w-24" />
    </motion.div>
  );
};

// Appointment Card Skeleton
export const AppointmentCardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white p-4 rounded-lg border border-gray-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <SkeletonLoader height="h-5" className="w-40 mb-2" />
          <SkeletonLoader height="h-4" className="w-32" />
        </div>
        <motion.div
          className="w-20 h-6 bg-gray-200 rounded-full"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <div className="flex gap-4 text-sm text-gray-600">
        <SkeletonLoader height="h-4" className="w-24" />
        <SkeletonLoader height="h-4" className="w-20" />
      </div>
    </motion.div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`border-3 border-blue-200 border-t-blue-600 rounded-full ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// Page Loading Overlay
export const PageLoader = ({ message = "Loading..." }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex flex-col items-center justify-center z-50"
    >
      <LoadingSpinner size="xl" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-gray-600 text-lg"
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

// Dots Loading Animation
export const DotsLoader = ({ className = "" }) => {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-blue-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Pulsing Avatar Loader
export const AvatarLoader = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  return (
    <motion.div
      className={`bg-gray-300 rounded-full ${sizeClasses[size]}`}
      animate={{
        opacity: [0.4, 0.8, 0.4],
        scale: [1, 1.05, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};