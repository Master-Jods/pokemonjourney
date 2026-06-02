import { useState } from 'react';
import { Scroll, Trophy, TrendingUp, Coins, Calendar, User, Swords } from 'lucide-react';
import { BattleSummaryCard } from './BattleSummaryCard';
import { playSound } from '../../lib/soundEffects';

interface BattleResultLoggerProps {
  selectedPokemon: {
    name: string;
    level: number;
  } | null;
  onSaveResult: (input: {
    game_name: string;
    result: string;
    level_gain: number;
    coins_earned: number;
  }) => Promise<string>;
}

export function BattleResultLogger({ selectedPokemon, onSaveResult }: BattleResultLoggerProps) {
  if (!selectedPokemon) return null;

  const [opponentTrainer, setOpponentTrainer] = useState('');
  const [opponentPokemon, setOpponentPokemon] = useState('');
  const [battleDate, setBattleDate] = useState('');
  const [battleResult, setBattleResult] = useState<'Victory' | 'Defeat' | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async () => {
    if (opponentTrainer && opponentPokemon && battleDate && battleResult && !isSaving) {
      const isVictory = battleResult === 'Victory';

      setIsSaving(true);
      setSaveError('');

      try {
        await onSaveResult({
          game_name: 'Battle Result Logger',
          result: battleResult,
          level_gain: isVictory ? 5 : 0,
          coins_earned: isVictory ? 15 : 0,
        });
        playSound(isVictory ? 'victory' : 'defeat');
        setShowSummary(true);
      } catch (error) {
        playSound('error');
        setSaveError(error instanceof Error ? error.message : 'Unable to save result.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setOpponentTrainer('');
    setOpponentPokemon('');
    setBattleDate('');
    setBattleResult(null);
    setSaveError('');
  };

  const isFormValid = opponentTrainer && opponentPokemon && battleDate && battleResult;

  return (
    <div className="max-w-6xl mx-auto mt-16">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-indigo-600 mb-12">
        <h1 className="text-5xl text-center mb-8 text-indigo-600">
          Battle Result Logger
        </h1>

        {/* Selected Pokemon Display */}
        <div className="text-center">
          <h2 className="text-2xl text-gray-700 mb-4">Selected Pokemon:</h2>
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-lg">
            <span className="text-3xl">{selectedPokemon.name}</span>
            <span className="text-2xl">-</span>
            <span className="text-3xl">Level {selectedPokemon.level}</span>
          </div>
        </div>
      </div>

      {/* Battle Logger Area */}
      <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-3xl shadow-2xl p-10 border-8 border-yellow-400">
        {/* Description */}
        <div className="bg-white rounded-3xl p-6 border-4 border-indigo-400 shadow-xl mb-10">
          <div className="flex items-center justify-center gap-3">
            <Scroll className="w-8 h-8 text-indigo-600" />
            <p className="text-2xl text-center text-gray-800">
              Record Pokemon Showdown battle results
            </p>
          </div>
        </div>

        {/* Battle Form */}
        <div className="bg-white rounded-3xl p-8 border-4 border-purple-400 shadow-xl mb-10">
          <h3 className="text-3xl text-center text-purple-700 mb-8 flex items-center justify-center gap-3">
            <Swords className="w-10 h-10" />
            Battle Details
          </h3>

          <div className="grid gap-6 max-w-2xl mx-auto">
            {/* Opponent Trainer Name */}
            <div>
              <label className="flex items-center gap-2 text-2xl text-gray-700 mb-3">
                <User className="w-6 h-6 text-indigo-600" />
                Opponent Trainer Name
              </label>
              <input
                type="text"
                value={opponentTrainer}
                onChange={(e) => setOpponentTrainer(e.target.value)}
                placeholder="Enter trainer name..."
                className="w-full px-6 py-4 text-xl border-4 border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 shadow-md"
              />
            </div>

            {/* Opponent Pokemon */}
            <div>
              <label className="flex items-center gap-2 text-2xl text-gray-700 mb-3">
                <Swords className="w-6 h-6 text-red-600" />
                Opponent Pokemon
              </label>
              <input
                type="text"
                value={opponentPokemon}
                onChange={(e) => setOpponentPokemon(e.target.value)}
                placeholder="Enter opponent Pokemon..."
                className="w-full px-6 py-4 text-xl border-4 border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 shadow-md"
              />
            </div>

            {/* Battle Date */}
            <div>
              <label className="flex items-center gap-2 text-2xl text-gray-700 mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                Battle Date
              </label>
              <input
                type="date"
                value={battleDate}
                onChange={(e) => setBattleDate(e.target.value)}
                className="w-full px-6 py-4 text-xl border-4 border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Battle Result Section */}
        <div className="bg-white rounded-3xl p-8 border-4 border-pink-400 shadow-xl mb-10">
          <h3 className="text-3xl text-center text-pink-700 mb-8">
            Battle Result
          </h3>

          <div className="flex gap-8 justify-center mb-6">
            {/* Victory Radio Button */}
            <div
              onClick={() => {
                playSound('victory');
                setBattleResult('Victory');
              }}
              className={`cursor-pointer transition-all duration-300 ${
                battleResult === 'Victory'
                  ? 'scale-110'
                  : 'scale-100 hover:scale-105'
              }`}
            >
              <div
                className={`rounded-3xl p-8 border-6 shadow-xl ${
                  battleResult === 'Victory'
                    ? 'bg-gradient-to-br from-green-400 to-green-500 border-green-600 shadow-green-400/50'
                    : 'bg-white border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <Trophy className={`w-16 h-16 ${battleResult === 'Victory' ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  <p className={`text-3xl ${battleResult === 'Victory' ? 'text-white' : 'text-gray-800'}`}>
                    Victory
                  </p>
                </div>
              </div>
            </div>

            {/* Defeat Radio Button */}
            <div
              onClick={() => {
                playSound('defeat');
                setBattleResult('Defeat');
              }}
              className={`cursor-pointer transition-all duration-300 ${
                battleResult === 'Defeat'
                  ? 'scale-110'
                  : 'scale-100 hover:scale-105'
              }`}
            >
              <div
                className={`rounded-3xl p-8 border-6 shadow-xl ${
                  battleResult === 'Defeat'
                    ? 'bg-gradient-to-br from-red-400 to-red-500 border-red-600 shadow-red-400/50'
                    : 'bg-white border-gray-300 hover:border-red-400'
                }`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <Swords className={`w-16 h-16 ${battleResult === 'Defeat' ? 'text-white' : 'text-red-600'}`} />
                  </div>
                  <p className={`text-3xl ${battleResult === 'Defeat' ? 'text-white' : 'text-gray-800'}`}>
                    Defeat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSaving}
              className={`px-20 py-6 text-3xl rounded-full transition-all duration-300 border-6 shadow-2xl ${
                isFormValid
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-700 hover:scale-105 hover:shadow-indigo-400/50'
                  : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isSaving ? 'Saving...' : 'Submit Result'}
            </button>
          </div>

          {saveError && (
            <p className="text-center text-[#EF4444] mt-4 font-medium">{saveError}</p>
          )}
        </div>

        {/* Reward Rules */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-orange-400 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-orange-600" />
            <h3 className="text-3xl text-orange-800">Reward Rules</h3>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Victory Rewards */}
            <div className="bg-white rounded-3xl p-8 border-4 border-green-400 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Trophy className="w-8 h-8 text-green-600" />
                <h4 className="text-2xl text-gray-800">Victory</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl text-blue-600">+5 Levels</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Coins className="w-8 h-8 text-yellow-600" />
                  <span className="text-2xl text-yellow-600">+15 Coins</span>
                </div>
              </div>
            </div>

            {/* Defeat Rewards */}
            <div className="bg-white rounded-3xl p-8 border-4 border-gray-400 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Swords className="w-8 h-8 text-gray-600" />
                <h4 className="text-2xl text-gray-800">Defeat</h4>
              </div>
              <div className="flex items-center justify-center h-24">
                <span className="text-2xl text-gray-600">No Reward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Summary Card */}
        {showSummary && (
          <BattleSummaryCard
            selectedPokemon={selectedPokemon}
            opponentTrainer={opponentTrainer}
            opponentPokemon={opponentPokemon}
            battleDate={battleDate}
            result={battleResult!}
            onClose={handleCloseSummary}
          />
        )}
      </div>
    </div>
  );
}
