import { Swords, HelpCircle, Grid3x3, Scroll } from 'lucide-react';
import { GameCard } from './GameCard';
import { PageHeader } from './design-system/PageHeader';
import { SelectedPokemonCard } from './design-system/SelectedPokemonCard';

interface MiniGameSelectionProps {
  selectedPokemon: {
    name: string;
    level: number;
  } | null;
}

export function MiniGameSelection({ selectedPokemon }: MiniGameSelectionProps) {
  if (!selectedPokemon) return null;

  const games = [
    {
      id: 1,
      title: 'Battle Predictor',
      description: 'Predict which Pokemon wins based on type advantage.',
      reward: '+5 Levels, +15 Coins',
      icon: <Swords className="w-10 h-10" />,
      color: 'red' as const
    },
    {
      id: 2,
      title: 'Guess That Pokemon',
      description: 'Guess the Pokemon, its type, and counter type.',
      reward: 'Up to +5 Levels, +15 Coins',
      icon: <HelpCircle className="w-10 h-10" />,
      color: 'blue' as const
    },
    {
      id: 3,
      title: 'Match That Pokemon',
      description: 'Match Pokemon-themed memory cards.',
      reward: '+5 Levels, +15 Coins',
      icon: <Grid3x3 className="w-10 h-10" />,
      color: 'yellow' as const
    },
    {
      id: 4,
      title: 'Battle Result Logger',
      description: 'Record Pokemon Showdown battle results.',
      reward: '+5 Levels, +15 Coins',
      icon: <Scroll className="w-10 h-10" />,
      color: 'purple' as const
    }
  ];

  return (
    <div className="max-w-6xl mx-auto mt-16">
      <SelectedPokemonCard pokemonName={selectedPokemon.name} level={selectedPokemon.level} />

      <div className="bg-white rounded-3xl p-8 border-4 border-[#8B5CF6] shadow-2xl relative">
        {/* Decorative corner accents */}
        <div className="absolute top-4 left-4 w-3 h-3 bg-[#EF4444] rounded-full"></div>
        <div className="absolute top-4 right-4 w-3 h-3 bg-[#2563EB] rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-[#FBBF24] rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-3 h-3 bg-[#8B5CF6] rounded-full"></div>

        <h2 className="text-3xl text-center mb-8 text-gray-800">
          Choose a Leveling Mini Game
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}
