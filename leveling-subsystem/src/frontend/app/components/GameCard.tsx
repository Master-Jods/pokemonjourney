import { ReactNode } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from './design-system/Button';

interface Game {
  id: number;
  title: string;
  description: string;
  reward: string;
  icon: ReactNode;
  color: 'red' | 'blue' | 'yellow' | 'purple';
}

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const colorClasses = {
    red: {
      border: 'border-[#EF4444]',
      iconBg: 'bg-[#EF4444]'
    },
    blue: {
      border: 'border-[#2563EB]',
      iconBg: 'bg-[#2563EB]'
    },
    yellow: {
      border: 'border-[#FBBF24]',
      iconBg: 'bg-[#FBBF24]'
    },
    purple: {
      border: 'border-[#8B5CF6]',
      iconBg: 'bg-[#8B5CF6]'
    }
  };

  const colors = colorClasses[game.color];

  return (
    <div className={`bg-white rounded-2xl p-6 border-3 ${colors.border} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative`}>
      {/* Circular Icon */}
      <div className="flex justify-center mb-5">
        <div className={`${colors.iconBg} text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg`}>
          {game.icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl text-center mb-3 text-gray-800 font-medium">
        {game.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mb-5 min-h-[2.5rem]">
        {game.description}
      </p>

      {/* Reward Section */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-[#FBBF24] mb-5 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-[#FBBF24]" />
          <p className="text-xs text-gray-600 font-medium">Reward</p>
        </div>
        <p className="text-sm text-gray-800 text-center font-medium">{game.reward}</p>
      </div>

      {/* Play Now Button */}
      <Button variant="primary" className="w-full shadow-md">
        Play Now
      </Button>
    </div>
  );
}
