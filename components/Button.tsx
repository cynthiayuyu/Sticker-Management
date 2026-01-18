
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center transition-all duration-500 font-cormorant tracking-[0.1em] uppercase border disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#7D7489] text-[#FDFBF7] border-[#7D7489] hover:bg-[#635B6D] hover:border-[#635B6D] shadow-sm",
    secondary: "bg-[#F3F0EB] text-[#5D5550] border-[#F3F0EB] hover:bg-[#E5E0D8]",
    outline: "bg-transparent text-[#7D7489] border-[#D8D2CB] hover:border-[#7D7489] hover:text-[#635B6D]",
    ghost: "bg-transparent border-transparent text-[#9F97A8] hover:text-[#7D7489]"
  };

  const sizes = {
    sm: "px-4 py-1 text-xs",
    md: "px-8 py-2 text-sm",
    lg: "px-10 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
