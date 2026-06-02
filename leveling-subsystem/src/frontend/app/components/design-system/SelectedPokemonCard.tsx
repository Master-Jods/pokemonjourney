import { Sparkles } from 'lucide-react';

interface SelectedPokemonCardProps {
  pokemonName: string;
  level: number;
}

export function SelectedPokemonCard({ pokemonName, level }: SelectedPokemonCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border-3 border-[#FBBF24] mb-8 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FBBF24]/5 via-transparent to-[#2563EB]/5 pointer-events-none"></div>
      <Sparkles className="absolute top-2 right-2 w-5 h-5 text-[#FBBF24]" />
      <p className="text-gray-600 text-center mb-3 relative z-10">Selected Pokemon</p>
      <div className="flex items-center justify-center gap-4 relative z-10">
        <span className="text-2xl text-gray-800 font-medium">{pokemonName}</span>
        <span className="text-gray-400">•</span>
        <div className="bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white px-4 py-1 rounded-full shadow-md">
          <span className="text-lg font-bold">Level {level}</span>
        </div>
      </div>
    </div>
  );
}
