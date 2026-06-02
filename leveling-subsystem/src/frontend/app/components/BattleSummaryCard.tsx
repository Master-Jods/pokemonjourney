import { Trophy, TrendingUp, Coins, X, Swords, Calendar, User } from 'lucide-react';

interface BattleSummaryCardProps {
  selectedPokemon: {
    name: string;
    level: number;
  };
  opponentTrainer: string;
  opponentPokemon: string;
  battleDate: string;
  result: 'Victory' | 'Defeat';
  onClose: () => void;
}

export function BattleSummaryCard({
  selectedPokemon,
  opponentTrainer,
  opponentPokemon,
  battleDate,
  result,
  onClose
}: BattleSummaryCardProps) {
  const isVictory = result === 'Victory';

  const rewards = {
    levels: isVictory ? 5 : 0,
    coins: isVictory ? 15 : 0
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-[20px] w-full max-w-[700px] border-2 ${
          isVictory ? 'border-[#10B981]' : 'border-[#EF4444]'
        } relative shadow-xl`}
      >
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
            <div className={`rounded-full p-3 ${isVictory ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}>
              {isVictory ? (
                <Trophy className="w-10 h-10 text-white" strokeWidth={2} />
              ) : (
                <Swords className="w-10 h-10 text-white" strokeWidth={2} />
              )}
            </div>
          </div>
          <h2 className={`text-3xl text-center mb-6 ${isVictory ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            Battle Summary
          </h2>

          {/* Battle Details */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 border-2 border-gray-200 mb-4">
            <h3 className="text-lg text-center text-gray-800 mb-3">Battle Record</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-2xl p-3 border-2 border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-1">Your Pokemon</p>
                <p className="text-base text-[#2563EB] text-center font-medium">{selectedPokemon.name}</p>
                <p className="text-xs text-gray-600 text-center">Level {selectedPokemon.level}</p>
              </div>

              <div className="bg-white rounded-2xl p-3 border-2 border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-1">Opponent</p>
                <p className="text-base text-[#EF4444] text-center font-medium">{opponentPokemon}</p>
              </div>

              <div className="bg-white rounded-2xl p-3 border-2 border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-1">Trainer</p>
                <p className="text-base text-[#8B5CF6] text-center font-medium">{opponentTrainer}</p>
              </div>

              <div className="bg-white rounded-2xl p-3 border-2 border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-1">Date</p>
                <p className="text-xs text-gray-800 text-center">{formatDate(battleDate)}</p>
              </div>
            </div>

            {/* Result Badge */}
            <div className={`rounded-2xl p-3 text-center ${isVictory ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}>
              <p className="text-sm text-white mb-1">Result</p>
              <p className="text-2xl text-white font-medium">{result}!</p>
            </div>
          </div>

          {/* Rewards */}
          {isVictory ? (
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
          ) : (
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border-2 border-gray-200 mb-6 text-center">
              <p className="text-gray-600">No rewards earned. Better luck next time!</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className={`px-8 py-3 text-lg rounded-2xl transition-all duration-200 font-medium border-2 ${
                isVictory
                  ? 'bg-[#10B981] text-white border-[#10B981] hover:bg-green-700'
                  : 'bg-[#EF4444] text-white border-[#EF4444] hover:bg-red-700'
              }`}
            >
              Log Another Battle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
