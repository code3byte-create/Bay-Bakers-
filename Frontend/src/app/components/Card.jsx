import React from 'react';

export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-card rounded-lg shadow-sm border border-border p-6 ${
        hover ? 'transition-shadow duration-200 hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h3 className={className}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};
