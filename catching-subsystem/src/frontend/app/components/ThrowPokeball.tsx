import { PageFrame, PokeballCorner } from './PageFrame';
import { Button } from './ui/button';
import type { WildPokemon } from '../lib/wildPokemon';

type ThrowPokeballProps = {
  wild: WildPokemon;
  playerName: string;
  isSavingResult: boolean;
  onFinish: (result: 'caught' | 'fled') => void;
  onBack: () => void;
};

export function ThrowPokeball({ wild, playerName, isSavingResult, onFinish, onBack }: ThrowPokeballProps) {
  return (
    <PageFrame>
      <div className="relative bg-white rounded-3xl shadow-xl p-8 border-2 border-green-400 max-w-md mx-auto w-full">
        <PokeballCorner side="left" />
        <PokeballCorner side="right" />

        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 font-medium">Player</p>
          <p className="text-xl font-bold text-gray-800">{playerName}</p>
        </div>

        <h2 className="text-center text-2xl font-bold mb-4 text-gray-800">Throw That Pokeball!</h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          The facilitator will run the physical game. Did the player successfully hit the target to catch the Pokémon?
        </p>

        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 flex flex-col items-center mb-8 relative">
          {/* Wild Pokemon image */}
          <div className="w-32 h-32 relative mb-4">
            {wild.image ? (
              <img
                src={wild.image}
                alt={wild.pokemon_name}
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FBBF24] to-[#2563EB] flex items-center justify-center text-white text-5xl font-bold">
                {wild.pokemon_name.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-800 capitalize mb-1">{wild.pokemon_name}</h3>
          <p className="text-sm font-medium text-gray-500 mb-2">Wild Pokémon appeared!</p>
          {wild.type && (
            <span className="inline-block px-3 py-1 bg-slate-200 rounded-full text-xs font-bold text-slate-700">
              {wild.type} Type
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => onFinish('caught')}
            disabled={isSavingResult}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            Win (Caught)
          </Button>
          <Button
            onClick={() => onFinish('fled')}
            disabled={isSavingResult}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            Lose (Failed)
          </Button>
        </div>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isSavingResult}
            className="text-gray-500 hover:text-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </PageFrame>
  );
}
