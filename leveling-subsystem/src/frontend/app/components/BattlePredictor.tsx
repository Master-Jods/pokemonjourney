import { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { ResultPopup } from './ResultPopup';
import { playSound } from '../../lib/soundEffects';
import {
  BattleScenario,
  getTypeColor,
  loadBattleScenario,
} from '../../lib/pokeApiService';

interface BattlePredictorProps {
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

function TypeBadge({ typeName }: { typeName: string }) {
  return (
    <div
      className="text-white px-4 py-2 rounded-2xl flex items-center justify-center gap-2 capitalize"
      style={{ backgroundColor: getTypeColor(typeName) }}
    >
      <span>{typeName} Type</span>
    </div>
  );
}

function PokemonBattleCard({
  label,
  pokemon,
}: {
  label: string;
  pokemon: BattleScenario['opponent'];
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
      <p className="text-sm text-gray-600 text-center mb-2">{label}</p>
      <h3 className="text-2xl text-center mb-4">{pokemon.displayName}</h3>
      <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4 aspect-square flex items-center justify-center">
        <img src={pokemon.image} alt={pokemon.displayName} className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col gap-2">
        {pokemon.types.map((typeName) => (
          <TypeBadge key={typeName} typeName={typeName} />
        ))}
      </div>
    </div>
  );
}

export function BattlePredictor({ selectedPokemon, onSaveResult }: BattlePredictorProps) {
  if (!selectedPokemon) return null;

  const [scenario, setScenario] = useState<BattleScenario | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'YES' | 'NO' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadScenario = async () => {
    setIsLoadingScenario(true);
    setSaveError('');

    try {
      setScenario(await loadBattleScenario());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to load battle scenario.');
      playSound('error');
    } finally {
      setIsLoadingScenario(false);
    }
  };

  useEffect(() => {
    loadScenario();
  }, []);

  const handleSubmit = async () => {
    if (!selectedAnswer || !scenario || isSaving) return;

    const correctAnswer = scenario.isChallengerFavored ? 'YES' : 'NO';
    const answerIsCorrect = selectedAnswer === correctAnswer;

    setIsSaving(true);
    setSaveError('');

    try {
      await onSaveResult({
        game_name: 'Battle Predictor',
        result: answerIsCorrect
          ? `Correct: ${scenario.challenger.displayName} vs ${scenario.opponent.displayName}`
          : `Wrong: ${scenario.challenger.displayName} vs ${scenario.opponent.displayName}`,
        level_gain: answerIsCorrect ? 5 : 0,
        coins_earned: answerIsCorrect ? 15 : 5,
      });
      playSound(answerIsCorrect ? 'victory' : 'miss');
      setShowResult(true);
    } catch (error) {
      playSound('error');
      setSaveError(error instanceof Error ? error.message : 'Unable to save result.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClosePopup = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setSaveError('');
    loadScenario();
  };

  const isCorrect = scenario
    ? selectedAnswer === (scenario.isChallengerFavored ? 'YES' : 'NO')
    : false;

  return (
    <div>
      <div className="bg-white rounded-3xl p-8 border-4 border-[#EF4444] shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl text-center mb-8 text-gray-800">Battle Scenario</h2>

        {isLoadingScenario && (
          <p className="text-center text-gray-700 mb-8">Loading Pokemon battle...</p>
        )}

        {scenario && (
          <>
            {/* Battle Cards */}
            <div className="grid grid-cols-3 gap-6 items-center mb-8">
              <PokemonBattleCard label="Opponent" pokemon={scenario.opponent} />

              {/* VS */}
              <div className="flex justify-center">
                <div className="bg-[#2563EB] rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-3xl text-white">VS</span>
                </div>
              </div>

              <PokemonBattleCard label="Challenger" pokemon={scenario.challenger} />
            </div>

            {/* Question */}
            <div className="bg-[#F8FAFC] rounded-2xl p-6 mb-6 border-2 border-gray-200">
              <h3 className="text-xl text-center text-gray-800">
                Will {scenario.challenger.displayName} likely win based on type advantage?
              </h3>
              <div className="flex items-center justify-center gap-2 mt-3 text-gray-600">
                <Swords className="w-5 h-5" />
                <span>Type multiplier: x{scenario.multiplier}</span>
              </div>
            </div>

            {/* Answer Buttons */}
            <div className="flex gap-4 justify-center mb-6">
              <button
                onClick={() => {
                  playSound('choice');
                  setSelectedAnswer('YES');
                }}
                className={`min-w-32 px-12 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
                  selectedAnswer === 'YES'
                    ? 'bg-[#10B981] text-white border-[#10B981] hover:bg-green-700'
                    : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-gray-50'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => {
                  playSound('choice');
                  setSelectedAnswer('NO');
                }}
                className={`min-w-32 px-12 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
                  selectedAnswer === 'NO'
                    ? 'bg-[#EF4444] text-white border-[#EF4444] hover:bg-red-700'
                    : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-gray-50'
                }`}
              >
                NO
              </button>
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <button
                disabled={!selectedAnswer || isSaving}
                onClick={handleSubmit}
                className={`px-12 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
                  selectedAnswer && !isSaving
                    ? 'bg-[#2563EB] text-white border-[#2563EB] hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isSaving ? 'Saving...' : 'Submit Answer'}
              </button>
            </div>
          </>
        )}

        {saveError && (
          <p className="text-center text-[#EF4444] mt-4 font-medium">{saveError}</p>
        )}

        {showResult && <ResultPopup isCorrect={isCorrect} onClose={handleClosePopup} />}
      </div>
    </div>
  );
}
