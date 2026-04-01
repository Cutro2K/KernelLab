import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
<<<<<<< HEAD
  variant?: 'primary' | 'secondary' | 'danger' | 'info';
=======
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
>>>>>>> e7d5a9964c7e7e8197f4085b95871cd0cc546283
}

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "px-4 py-2 font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
<<<<<<< HEAD
    info: "bg-slate-500 text-white hover:bg-slate-400"
=======
    ghost: "bg-transparent text-gray-800 hover:bg-gray-100"
>>>>>>> e7d5a9964c7e7e8197f4085b95871cd0cc546283
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}