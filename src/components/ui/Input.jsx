import React from 'react';

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`border rounded p-2 w-full ${className}`}
      {...props}
    />
  );
};

export default Input;
