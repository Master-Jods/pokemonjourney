import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  color?: 'blue' | 'red' | 'yellow' | 'purple';
}

export function PageHeader({ title, icon, color = 'blue' }: PageHeaderProps) {
  const colors = {
    blue: 'text-[#2563EB]',
    red: 'text-[#EF4444]',
    yellow: 'text-[#FBBF24]',
    purple: 'text-[#8B5CF6]'
  };

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 mb-8">
      <div className="flex items-center justify-center gap-4">
        {icon && <div className={colors[color]}>{icon}</div>}
        <h1 className={`text-4xl ${colors[color]}`}>{title}</h1>
      </div>
    </div>
  );
}
