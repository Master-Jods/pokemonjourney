import { ReactNode } from 'react';
import { Trophy, TrendingUp, Coins, X, Star } from 'lucide-react';

interface GuessResultCardProps {
  score: number;
  pokemonName: string;
  pokemonTypes: string[];
  pokemonIllustration: ReactNode;
  onClose: () => void;
}

export function GuessResultCard({
  score,
  pokemonName,
  pokemonTypes,
  pokemonIllustration,
  onClose,
}: GuessResultCardProps) {
  const getRewards = (score: number) => {
    if (score >= 8) {
      return { levels: 5, coins: 15, tier: 'Excellent!', color: '#10B981' };
    } else if (score >= 4) {
      return { levels: 5, coins: 8, tier: 'Good Job!', color: '#2563EB' };
    } else if (score >= 1) {
      return { levels: 1, coins: 3, tier: 'Nice Try!', color: '#FBBF24' };
    } else {
      return { levels: 0, coins: 0, tier: 'Better Luck Next Time!', color: '#6B7280' };
    }
  };

  const rewards = getRewards(score);
  const pokemonTypeText = pokemonTypes.join(' / ');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[18px] w-full max-w-[560px] border-2 border-gray-200 relative shadow-xl max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white border-2 border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors shadow-md"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="flex justify-center mb-3">
            <div className="bg-[#8B5CF6] rounded-full p-2.5">
              <Star className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>
          <h2 className="text-2xl text-center mb-4 text-gray-800">{rewards.tier}</h2>

          {/* Revealed Pokemon */}
          <div className="bg-[#F8FAFC] rounded-2xl p-3 border-2 border-gray-200 mb-3">
            <div className="max-w-28 mx-auto aspect-square mb-2">
              {pokemonIllustration}
            </div>
            <p className="text-2xl text-center text-gray-800">{pokemonName}</p>
            <p className="text-sm text-center text-gray-600 mt-1">{pokemonTypeText} Type</p>
          </div>

          {/* Correct Answers */}
          <div className="bg-[#F8FAFC] rounded-2xl p-3 border-2 border-gray-200 mb-3">
            <h3 className="text-base text-center text-gray-800 mb-2">Correct Answers</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <p className="text-sm text-gray-600">
                Pokemon<br />
                <span className="text-gray-800">{pokemonName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Type<br />
                <span className="text-gray-800">{pokemonTypeText}</span>
              </p>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-[#F8FAFC] rounded-2xl p-3 border-2 border-gray-200 mb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5" style={{ color: rewards.color }} />
              <h3 className="text-base text-gray-800">Your Score</h3>
            </div>
            <p className="text-4xl text-center mb-1" style={{ color: rewards.color }}>
              {score} / 10
            </p>
            <p className="text-xs text-center text-gray-600">Points</p>
          </div>

          {/* Rewards Earned */}
          {rewards.levels > 0 && (
            <div className="bg-[#F8FAFC] rounded-2xl p-3 border-2 border-gray-200 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-[#FBBF24]" />
                <h3 className="text-base text-gray-800">Rewards Earned</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl p-2.5 border-2 border-gray-200 text-center">
                  <TrendingUp className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
                  <p className="text-lg text-[#2563EB]">+{rewards.levels}</p>
                  <p className="text-xs text-gray-600">Levels</p>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border-2 border-gray-200 text-center">
                  <Coins className="w-4 h-4 text-[#FBBF24] mx-auto mb-1" />
                  <p className="text-lg text-[#FBBF24]">+{rewards.coins}</p>
                  <p className="text-xs text-gray-600">Coins</p>
                </div>
              </div>
            </div>
          )}

          {rewards.levels === 0 && (
            <div className="bg-[#F8FAFC] rounded-2xl p-3 border-2 border-gray-200 mb-4 text-center">
              <p className="text-sm text-gray-600">No rewards earned. Try again!</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-7 py-2.5 text-base bg-[#2563EB] text-white hover:bg-blue-700 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
