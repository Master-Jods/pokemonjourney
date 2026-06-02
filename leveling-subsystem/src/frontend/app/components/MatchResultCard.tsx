import { Trophy, TrendingUp, Coins, X, CheckCircle } from 'lucide-react';

interface MatchResultCardProps {
  matchedPairs: number;
  totalPairs: number;
  onClose: () => void;
}

export function MatchResultCard({ matchedPairs, totalPairs, onClose }: MatchResultCardProps) {
  const getRewards = (pairs: number) => {
    if (pairs >= 2) {
      return { levels: 5, coins: 15, tier: 'Perfect Match!', color: '#10B981' };
    } else if (pairs === 1) {
      return { levels: 0, coins: 5, tier: 'Good Job!', color: '#2563EB' };
    } else {
      return { levels: 0, coins: 0, tier: 'Better Luck Next Time!', color: '#6B7280' };
    }
  };

  const rewards = getRewards(matchedPairs);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[700px] border-2 border-gray-200 relative shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white border-2 border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors shadow-md"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-center mb-4">
            <div className="bg-[#FBBF24] rounded-full p-3">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h2 className="text-3xl text-center mb-6 text-gray-800">{rewards.tier}</h2>

          {/* Matched Pairs Card */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 border-2 border-gray-200 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5" style={{ color: rewards.color }} />
              <h3 className="text-lg text-gray-800">Matched Pairs</h3>
            </div>
            <p className="text-5xl text-center mb-1" style={{ color: rewards.color }}>
              {matchedPairs} / {totalPairs}
            </p>
            <p className="text-sm text-center text-gray-600">Pairs Found</p>
          </div>

          {/* Rewards Earned */}
          {rewards.levels > 0 && (
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border-2 border-gray-200 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-[#FBBF24]" />
                <h3 className="text-lg text-gray-800">Rewards Earned</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-3 border-2 border-gray-200 text-center">
                  <TrendingUp className="w-5 h-5 text-[#2563EB] mx-auto mb-1" />
                  <p className="text-xl text-[#2563EB]">+{rewards.levels}</p>
                  <p className="text-xs text-gray-600">Levels</p>
                </div>
                <div className="bg-white rounded-2xl p-3 border-2 border-gray-200 text-center">
                  <Coins className="w-5 h-5 text-[#FBBF24] mx-auto mb-1" />
                  <p className="text-xl text-[#FBBF24]">+{rewards.coins}</p>
                  <p className="text-xs text-gray-600">Coins</p>
                </div>
              </div>
            </div>
          )}

          {rewards.levels === 0 && (
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border-2 border-gray-200 mb-6 text-center">
              <p className="text-gray-600">No rewards earned. Try again!</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 text-lg bg-[#2563EB] text-white hover:bg-blue-700 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
