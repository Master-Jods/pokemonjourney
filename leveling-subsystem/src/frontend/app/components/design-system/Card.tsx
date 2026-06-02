import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  borderColor?: 'blue' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
  onClick?: () => void;
}

export function Card({ children, borderColor = 'gray', className = '', onClick }: CardProps) {
  const borderColors = {
    blue: 'border-[#2563EB]',
    red: 'border-[#EF4444]',
    yellow: 'border-[#FBBF24]',
    purple: 'border-[#8B5CF6]',
    gray: 'border-gray-200'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-2 ${borderColors[borderColor]} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
