import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', leftIcon, rightIcon, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    primary: 'bg-accent-secondary text-white hover:opacity-90 focus:ring-accent-secondary',
    secondary: 'bg-bg-secondary text-text-primary hover:bg-divider focus:ring-accent-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {leftIcon && <span className="mr-2 -ml-1 h-5 w-5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 -mr-1 h-5 w-5">{rightIcon}</span>}
    </button>
  );
};

export default Button;