import { Trophy, TrendingUp, Coins, Sparkles, Star, ArrowRight, Home } from 'lucide-react';

interface RewardSummaryProps {
  playerName: string;
  selectedPokemon: {
    name: string;
    level: number;
  } | null;
  coinBalance?: number;
  gameHistory?: GameRecord[];
}

interface GameRecord {
  id: number;
  miniGame: string;
  result: string;
  levelsEarned: number;
  coinsEarned: number;
}

export function RewardSummary({
  playerName,
  selectedPokemon,
  coinBalance = 0,
  gameHistory = [],
}: RewardSummaryProps) {
  if (!selectedPokemon) return null;

  const totalLevelsEarned = gameHistory.reduce((sum, record) => sum + record.levelsEarned, 0);
  const totalCoinsEarned = gameHistory.reduce((sum, record) => sum + record.coinsEarned, 0);

  const previousLevel = selectedPokemon.level;
  const currentLevel = previousLevel + totalLevelsEarned;

  const previousCoins = coinBalance - totalCoinsEarned;
  const currentCoins = previousCoins + totalCoinsEarned;

  // XP Progress calculation (example: 80% to next level)
  const xpProgress = 80;

  return (
    <div className="max-w-6xl mx-auto mt-16 mb-16">
      {/* Page Header */}
      <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-3xl shadow-2xl p-8 border-8 border-yellow-600 mb-12 overflow-hidden">
        {/* Animated stars/sparkles background */}
        <div className="absolute inset-0 opacity-20">
          <Sparkles className="absolute top-4 left-10 w-8 h-8 text-white animate-pulse" />
          <Star className="absolute top-12 right-16 w-6 h-6 text-white animate-pulse" />
          <Sparkles className="absolute bottom-8 left-20 w-10 h-10 text-white animate-pulse" />
          <Star className="absolute bottom-4 right-12 w-8 h-8 text-white animate-pulse" />
        </div>

        <div className="relative z-10">
          <h1 className="text-6xl text-center mb-6 text-white drop-shadow-lg">
            Reward Summary
          </h1>

          {/* Player Name */}
          <div className="text-center mb-6">
            <p className="text-2xl text-white mb-2">Trainer</p>
            <div className="inline-block bg-white px-8 py-3 rounded-full shadow-lg">
              <p className="text-3xl text-gray-800">{playerName || 'Guest Trainer'}</p>
            </div>
          </div>

          {/* Selected Pokemon Display */}
          <div className="text-center">
            <p className="text-2xl text-white mb-3">Champion Pokemon</p>
            <div className="inline-flex items-center gap-4 bg-white px-10 py-4 rounded-full shadow-lg">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl text-gray-800">{selectedPokemon.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Rewards Section */}
      <div className="bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 rounded-3xl shadow-2xl p-10 border-8 border-green-500 mb-12">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Trophy className="w-12 h-12 text-green-600" />
          <h2 className="text-4xl text-green-800">Total Rewards Earned</h2>
        </div>

        <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Total Levels */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-blue-400">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-10 h-10 text-blue-600" />
              <span className="text-2xl text-gray-700">Total Levels</span>
            </div>
            <p className="text-7xl text-center text-blue-600 mb-2">+{totalLevelsEarned}</p>
            <div className="flex items-center justify-center gap-2 text-xl text-gray-600">
              <span>Level {previousLevel}</span>
              <ArrowRight className="w-5 h-5" />
              <span className="text-blue-600">Level {currentLevel}</span>
            </div>
          </div>

          {/* Total Coins */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-yellow-400">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coins className="w-10 h-10 text-yellow-600" />
              <span className="text-2xl text-gray-700">Total Coins</span>
            </div>
            <p className="text-7xl text-center text-yellow-600 mb-2">+{totalCoinsEarned}</p>
            <div className="flex items-center justify-center gap-2 text-xl text-gray-600">
              <span>{previousCoins}</span>
              <ArrowRight className="w-5 h-5" />
              <span className="text-yellow-600">{currentCoins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 border-8 border-purple-500 mb-12">
        <h2 className="text-4xl text-center mb-10 text-purple-700 flex items-center justify-center gap-3">
          <Sparkles className="w-10 h-10" />
          Progress Tracker
        </h2>

        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* Level Progress */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-4 border-blue-400 shadow-lg">
            <h3 className="text-2xl text-center text-blue-800 mb-6">Level Progress</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-xl">
                <span className="text-gray-600">Previous Level:</span>
                <span className="text-blue-600">{previousLevel}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-gray-600">Current Level:</span>
                <span className="text-blue-600 text-2xl">{currentLevel}</span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>XP to Next Level</span>
                <span>{xpProgress}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden border-2 border-blue-500">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                  style={{ width: `${xpProgress}%` }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Coin Wallet */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 border-4 border-yellow-400 shadow-lg">
            <h3 className="text-2xl text-center text-yellow-800 mb-6">Coin Wallet</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-xl">
                <span className="text-gray-600">Previous Coins:</span>
                <span className="text-yellow-600">{previousCoins}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-gray-600">Current Coins:</span>
                <span className="text-yellow-600 text-2xl">{currentCoins}</span>
              </div>
            </div>

            {/* Coin visualization */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-700 shadow-lg flex items-center justify-center"
                  >
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-4 border-purple-400 shadow-lg">
          <h3 className="text-2xl text-center text-purple-800 mb-6">Achievement Badges</h3>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-600 shadow-xl flex items-center justify-center mb-2">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-700">Master Trainer</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-4 border-blue-600 shadow-xl flex items-center justify-center mb-2">
                <Star className="w-10 h-10 text-white" fill="white" />
              </div>
              <p className="text-sm text-gray-700">All Games</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-green-600 shadow-xl flex items-center justify-center mb-2">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-700">Level Up Pro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game History Table */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 border-8 border-indigo-500 mb-12">
        <h2 className="text-4xl text-center mb-8 text-indigo-700">Game History</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <th className="px-6 py-4 text-left text-xl rounded-tl-2xl">Mini Game</th>
                <th className="px-6 py-4 text-left text-xl">Result</th>
                <th className="px-6 py-4 text-center text-xl">Levels Earned</th>
                <th className="px-6 py-4 text-center text-xl rounded-tr-2xl">Coins Earned</th>
              </tr>
            </thead>
            <tbody>
              {gameHistory.map((record, index) => (
                <tr
                  key={record.id}
                  className={`border-b-2 border-gray-200 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } hover:bg-indigo-50 transition-colors`}
                >
                  <td className="px-6 py-4 text-lg text-gray-800">{record.miniGame}</td>
                  <td className="px-6 py-4 text-lg">
                    <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full border-2 border-green-400">
                      {record.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-2 text-blue-600 text-xl">
                      <TrendingUp className="w-5 h-5" />
                      +{record.levelsEarned}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-2 text-yellow-600 text-xl">
                      <Coins className="w-5 h-5" />
                      +{record.coinsEarned}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                <td className="px-6 py-4 text-xl rounded-bl-2xl" colSpan={2}>Total Rewards</td>
                <td className="px-6 py-4 text-center text-2xl">
                  <span className="inline-flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    +{totalLevelsEarned}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-2xl rounded-br-2xl">
                  <span className="inline-flex items-center gap-2">
                    <Coins className="w-6 h-6" />
                    +{totalCoinsEarned}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-6 justify-center">
        <button className="px-12 py-6 text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 border-4 border-blue-700 shadow-2xl hover:scale-105 flex items-center gap-3">
          <Trophy className="w-8 h-8" />
          Play Another Mini Game
        </button>

        <button className="px-12 py-6 text-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300 border-4 border-red-700 shadow-2xl hover:scale-105 flex items-center gap-3">
          <Home className="w-8 h-8" />
          Return to Pokemon Selection
        </button>
      </div>

      {/* Level Up Effect */}
      <div className="fixed bottom-8 right-8 animate-bounce">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4 shadow-2xl border-4 border-yellow-600">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </div>
    </div>
  );
}
