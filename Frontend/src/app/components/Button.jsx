import React from 'react';

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] transform-gpu';

  const variantStyles = {
    primary: 'bg-primary text-white premium-shadow hover:brightness-110 hover:-translate-y-0.5 rounded-xl',
    secondary: 'bg-secondary text-white shadow-lg hover:brightness-110 hover:-translate-y-0.5 rounded-xl',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5 hover:text-black rounded-xl',
    ghost: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-lg',
    destructive: 'bg-destructive text-white shadow-md hover:bg-destructive/90 rounded-xl',
    glass: 'bg-white/20 backdrop-blur-lg border border-white/30 text-white hover:bg-white/30 rounded-xl shadow-xl'
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
