import React from 'react';

const Alert = ({ type = 'error', children }) => {
  const alertStyles = {
    error: 'bg-red-100 text-red-700 border-red-400',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-400',
    success: 'bg-green-100 text-green-700 border-green-400',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${alertStyles[type || 'error']}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <p className="text-sm">{children}</p>
);

export default Alert;
