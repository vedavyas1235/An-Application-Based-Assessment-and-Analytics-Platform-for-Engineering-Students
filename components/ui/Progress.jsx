import React from 'react';

export const Progress = ({ value, max = 100, className = '' }) => {
  return (
    <div className={`relative w-full bg-gray-300 rounded ${className}`}>
      <div
        style={{ width: `${value || 0}%` }}
        className="h-2 bg-blue-600 rounded"
      ></div>
    </div>
  );
};

export default Progress;
