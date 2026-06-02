import { Check, Sparkles, Coins } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from './design-system/Button';

interface Pokemon {
  id: number;
  name: string;
  level: number;
  coins: number;
  illustration: ReactNode;
}

interface PokemonCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  onSelect: () => void;
}

export function PokemonCard({ pokemon, isSelected, onSelect }: PokemonCardProps) {
  return (
    <div
      className={`relative bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer border-3 shadow-lg hover:shadow-xl hover:-translate-y-1 ${
        isSelected
          ? 'border-[#FBBF24] shadow-[#FBBF24]/30 shadow-2xl scale-105'
          : 'border-gray-200 hover:border-[#2563EB]'
      }`}
      onClick={onSelect}
    >
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="bg-gradient-to-br from-[#FBBF24] to-[#EF4444] rounded-full p-2 shadow-lg animate-pulse">
            <Check className="w-5 h-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Glow effect for selected */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FBBF24]/10 to-[#EF4444]/10 rounded-2xl pointer-events-none">
          <Sparkles className="absolute top-2 right-2 w-4 h-4 text-[#FBBF24] animate-pulse" />
        </div>
      )}

      {/* Pokemon Illustration */}
      <div className={`relative mb-4 rounded-2xl overflow-hidden aspect-square p-4 ${
        isSelected
          ? 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
          : 'bg-[#F8FAFC]'
      }`}>
        {pokemon.illustration}
      </div>

      {/* Pokemon Name */}
      <h3 className="text-2xl text-center mb-3 text-gray-800 font-medium">{pokemon.name}</h3>

      {/* Current Level and Coins */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white px-4 py-2 rounded-full shadow-md">
            <span className="text-sm">Level</span>
            <span className="text-lg font-bold">{pokemon.level}</span>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#EF4444] text-white px-4 py-2 rounded-full shadow-md">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">{pokemon.coins} Coins</span>
          </div>
        </div>
      </div>

      {/* Select Button */}
      <Button
        variant={isSelected ? 'primary' : 'secondary'}
        onClick={(e) => {
          e?.stopPropagation();
          onSelect();
        }}
        className="w-full"
      >
        {isSelected ? '✓ Selected' : 'Select'}
      </Button>
    </div>
  );
}
