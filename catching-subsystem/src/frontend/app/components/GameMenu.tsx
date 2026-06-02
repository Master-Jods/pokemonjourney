import { Button } from './ui/button';
import { PageFrame, PokeballCorner } from './PageFrame';
import type { PlayerRecord } from '../lib/playerLookup';

type GameMenuProps = {
  onSelectGame: (game: 'reflex' | 'guess' | 'throw') => Promise<void> | void;
  playerName: string;
  playerData: PlayerRecord | null;
  isPreparingGame: boolean;
  prepareError: string;
  onLogout: () => void;
};

export function GameMenu({ onSelectGame, playerName, playerData, isPreparingGame, prepareError, onLogout }: GameMenuProps) {
  return (
    <PageFrame>
      <div className="relative bg-white rounded-3xl shadow-xl px-10 py-5 border-2 border-yellow-400">
        <PokeballCorner side="left" />
        <PokeballCorner side="right" />
        <div className="text-center">
          <p className="text-sm text-gray-500">Selected Player</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-bold text-gray-800">{playerName}</span>
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-3 py-1">
              Trainer
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Section: {playerData?.section ?? 'N/A'} · Journey: {playerData?.assigned_journey ?? 'N/A'} · Coins: {playerData?.coin_balance ?? 0}
          </p>
        </div>
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl p-8 border-2 border-blue-400">
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-400" />
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
        <h2 className="text-center text-2xl font-bold mb-6 text-gray-700">Choose a Catching Mini Game</h2>

        <div className="grid sm:grid-cols-3 gap-5">
          <button
            onClick={() => onSelectGame('reflex')}
            disabled={isPreparingGame}
            className="bg-white rounded-2xl border-2 border-red-400 p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500 text-white flex items-center justify-center text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-bold mb-1">PokeReflex</h3>
            <p className="text-sm text-gray-500 mb-4">
              Click the matching symbol fast to catch the wild Pokémon.
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-3 py-2 text-xs text-yellow-800">
              <span className="font-bold">🏆 Reward</span> · +20 Coins
            </div>
          </button>

          <button
            onClick={() => onSelectGame('guess')}
            disabled={isPreparingGame}
            className="bg-white rounded-2xl border-2 border-blue-400 p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl mb-3">❓</div>
            <h3 className="text-lg font-bold mb-1">PokeGuess</h3>
            <p className="text-sm text-gray-500 mb-4">
              Read the category and clue, then pick the right Pokémon.
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-3 py-2 text-xs text-yellow-800">
              <span className="font-bold">🏆 Reward</span> · +20 Coins
            </div>
          </button>

          <button
            onClick={() => onSelectGame('throw')}
            disabled={isPreparingGame}
            className="bg-white rounded-2xl border-2 border-green-400 p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center text-2xl mb-3">🎯</div>
              <h3 className="text-lg font-bold mb-1">Throw that Pokeball!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Play the physical game in real life. Facilitator logs the outcome.
              </p>
            </div>
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-3 py-2 text-xs text-yellow-800 mt-auto">
              <span className="font-bold">🏆 Reward</span> · +20 Coins
            </div>
          </button>
        </div>

        <div className="text-center mt-4 min-h-6">
          {isPreparingGame && (
            <p className="text-sm text-blue-600 font-medium">Generating a wild Pokémon from PokéAPI...</p>
          )}
          {!isPreparingGame && prepareError && (
            <p className="text-sm text-red-600 font-medium">{prepareError}</p>
          )}
        </div>

        <div className="text-center mt-6">
          <Button variant="outline" onClick={onLogout} className="rounded-full px-6" disabled={isPreparingGame}>
            Change Player
          </Button>
        </div>
      </div>
    </PageFrame>
  );
}
