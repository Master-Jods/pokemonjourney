import { Button } from './ui/button';
import { PageFrame } from './PageFrame';
import type { CatchResult } from '../lib/mainSystem';
import type { WildPokemon } from '../lib/wildPokemon';

type ResultScreenProps = {
  result: CatchResult;
  wild: WildPokemon;
  isSavingResult: boolean;
  saveError: string;
  onPlayAgain: () => void;
  onMenu: () => void;
};

function renderPokemonVisual(image: string, pokemonName: string, className: string) {
  if (/^https?:\/\//i.test(image)) {
    return <img src={image} alt={pokemonName} className={className} />;
  }
  return <div className={className}>{image}</div>;
}

export function ResultScreen({ result, wild, isSavingResult, saveError, onPlayAgain, onMenu }: ResultScreenProps) {
  const caught = result.result === 'caught';

  return (
    <PageFrame>
      <div className="relative bg-white rounded-3xl shadow-xl p-8 border-2 border-yellow-400 text-center">
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-400" />
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
        <div className="mb-3 flex justify-center">
          {caught
            ? renderPokemonVisual(wild.image, wild.pokemon_name, 'h-36 w-36 object-contain')
            : <div className="text-8xl">😔</div>}
        </div>
        <h2 className={`text-3xl font-bold mb-2 ${caught ? 'text-green-600' : 'text-red-500'}`}>
          {caught ? `${wild.pokemon_name} Caught!` : `${wild.pokemon_name} Fled!`}
        </h2>
        <p className="text-gray-600">
          {caught
            ? `Great job, ${result.playerName}! The wild ${wild.pokemon_name} is now yours.`
            : `Better luck next time, ${result.playerName}.`}
        </p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl border-2 border-blue-400 overflow-hidden">
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-400 z-10" />
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 z-10" />
        <h3 className="text-center text-2xl font-bold text-blue-600 pt-6">Game Result</h3>

        <div className="p-6">
          {isSavingResult && (
            <div className="mb-4 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Saving result to database...
            </div>
          )}
          {saveError && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl px-5 py-3 grid grid-cols-4 text-sm font-bold">
            <div>Mini Game</div>
            <div>Result</div>
            <div>Levels Earned</div>
            <div>Coins Earned</div>
          </div>
          <div className="bg-gray-50 rounded-b-2xl px-5 py-4 grid grid-cols-4 items-center">
            <div className="text-gray-800">{result.gameName}</div>
            <div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                caught
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-red-100 text-red-700 border-red-300'
              }`}>
                {caught ? 'Caught' : 'Fled'}
              </span>
            </div>
            <div className="text-blue-600 font-bold">📈 +{result.levelGain}</div>
            <div className="text-yellow-600 font-bold">🪙 +{result.coinsEarned}</div>
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={onPlayAgain} className="rounded-full px-6" disabled={isSavingResult}>Play Again</Button>
            <Button onClick={onMenu} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8" disabled={isSavingResult}>Menu</Button>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
