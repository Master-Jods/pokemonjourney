import { Trophy, TrendingUp, Coins, X, CheckCircle, XCircle } from 'lucide-react';

interface ResultPopupProps {
  isCorrect: boolean;
  onClose: () => void;
}

export function ResultPopup({ isCorrect, onClose }: ResultPopupProps) {
  const rewards = {
    levels: isCorrect ? 5 : 0,
    coins: isCorrect ? 15 : 5
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-[20px] w-full max-w-[700px] border-2 ${isCorrect ? 'border-[#10B981]' : 'border-[#EF4444]'} relative shadow-xl`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white border-2 border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors shadow-md"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-6">
          {/* Header: Result Icon and Title */}
          <div className="flex justify-center mb-4">
            {isCorrect ? (
              <div className="bg-[#10B981] rounded-full p-3">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
            ) : (
              <div className="bg-[#EF4444] rounded-full p-3">
                <XCircle className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
            )}
          </div>

          <h2 className={`text-3xl text-center mb-6 ${isCorrect ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {isCorrect ? 'Correct Answer!' : 'Wrong Answer!'}
          </h2>

          {/* Body: Rewards */}
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

          {/* Footer: Action Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className={`px-8 py-3 text-lg rounded-2xl transition-all duration-200 font-medium border-2 ${
                isCorrect
                  ? 'bg-[#10B981] text-white border-[#10B981] hover:bg-green-700'
                  : 'bg-[#EF4444] text-white border-[#EF4444] hover:bg-red-700'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
