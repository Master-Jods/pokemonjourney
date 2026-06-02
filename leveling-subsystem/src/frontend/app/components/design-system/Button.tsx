import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'md',
  className = ''
}: ButtonProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200 font-medium';

  const sizeStyles = {
    sm: 'px-6 py-2 text-base',
    md: 'px-8 py-3 text-lg',
    lg: 'px-12 py-4 text-xl'
  };

  const variantStyles = {
    primary: 'bg-[#2563EB] text-white hover:bg-blue-700 border-2 border-[#2563EB]',
    secondary: 'bg-white text-[#2563EB] hover:bg-gray-50 border-2 border-[#2563EB]',
    success: 'bg-[#10B981] text-white hover:bg-green-700 border-2 border-[#10B981]',
    danger: 'bg-[#EF4444] text-white hover:bg-red-700 border-2 border-[#EF4444]'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed hover:bg-gray-300 bg-gray-300 text-gray-500 border-gray-300';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${disabled ? disabledStyles : variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
