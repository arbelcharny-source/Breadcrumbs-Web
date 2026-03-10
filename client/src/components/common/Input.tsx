import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps {
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  Icon?: LucideIcon;
  children?: React.ReactNode; 
  className?: string;
  variant?: 'auth' | 'modal';
  required?: boolean;
}

const Input = ({ 
  type, 
  placeholder = "", 
  value, 
  onChange, 
  Icon, 
  children, 
  className = "", 
  variant = 'auth',
  required = false
}: InputProps) => {
  if (variant === 'modal') {
    return (
      <div className={`relative ${className}`}>
        {Icon && <Icon size={14} className="absolute left-1 top-1/2 -translate-y-1/2 text-[#D2B48C]" />}
        <input 
          type={type} 
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-transparent border-b border-[#D2B48C]/30 py-2 ${Icon ? 'pl-7' : 'px-1'} pr-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter placeholder:tracking-tighter`}
          required={required}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />}
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={onChange}
        className="w-full pl-14 pr-6 py-4 bg-input-gray border-none rounded-full focus:ring-2 focus:ring-[#D2B48C] outline-none transition-all placeholder:text-stone-400"
        required={required}
      />
      {children}
    </div>
  );
};

export default Input;
