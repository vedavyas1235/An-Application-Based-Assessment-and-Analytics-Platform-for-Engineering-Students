import React from 'react';

export const Card = ({ children, className = '' }) => {
  return <div className={`bg-white shadow-md rounded p-4 ${className}`}>{children}</div>;
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`font-bold text-lg mb-2 ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`text-gray-700 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h2 className={`text-xl font-bold mb-2 ${className}`}>{children}</h2>;
};

export const CardDescription = ({ children, className = '' }) => {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>;
};
