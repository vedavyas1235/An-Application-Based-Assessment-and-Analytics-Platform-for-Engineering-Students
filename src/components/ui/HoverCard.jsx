import React, { useState } from 'react';

export const HoverCard = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const HoverCardTrigger = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`inline-block cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const HoverCardContent = ({ children, className = '' }) => {
  return (
    <div
      className={`absolute bg-white shadow-md rounded p-4 mt-2 ${className}`}
    >
      {children}
    </div>
  );
};
