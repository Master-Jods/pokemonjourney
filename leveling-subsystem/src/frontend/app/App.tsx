import { useState } from 'react';
import { BattlePredictor } from './components/BattlePredictor';
import { GuessThePokemon } from './components/GuessThePokemon';
import { MatchThePokemon } from './components/MatchThePokemon';
import { BattleResultLogger } from './components/BattleResultLogger';
import { Coins, TrendingUp, Swords, HelpCircle, Grid3x3, Scroll } from 'lucide-react';
import {
  findPlayerByName,
  loadPlayerPokemon,
  saveLevelingResult,
} from '../../backend/levelingService';
import type { PlayerPokemonRecord, PlayerRecord } from '../../backend/levelingService';
import { playSound, startBackgroundMusic } from '../lib/soundEffects';

type Screen = 'trainer-name' | 'pokemon-selection' | 'mini-games';
type Tab = 'battle-predictor' | 'guess-pokemon' | 'match-pokemon' | 'battle-logger';
const OWNED_POKEMON_SOURCES = ['starter', 'pokereflex', 'pokeguess', 'irl catch', 'manual log'];

export interface SelectedPokemon extends PlayerPokemonRecord {
  name: string;
}

export interface GameSaveRequest {
  game_name: string;
  result: string;
  level_gain: number;
  coins_earned: number;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('trainer-name');
  const [playerName, setPlayerName] = useState('');
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [trainerPokemon, setTrainerPokemon] = useState<SelectedPokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<SelectedPokemon | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('battle-predictor');
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);
  const [appError, setAppError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const handleTrainerNameSubmit = async () => {
    if (!playerName.trim() || isLoadingPlayer) return;

    startBackgroundMusic();
    setIsLoadingPlayer(true);
    setAppError('');
    setSaveMessage('');

    try {
      const foundPlayer = await findPlayerByName(playerName);
      const pokemon = await loadPlayerPokemon(foundPlayer.player_id);
      const normalizedPokemon = pokemon
        .filter(
          (record) =>
            record.player_id === foundPlayer.player_id &&
            record.status?.toLowerCase() === 'active' &&
            OWNED_POKEMON_SOURCES.includes(record.source?.toLowerCase() ?? ''),
        )
        .map((record) => ({
          ...record,
          name: record.pokemon_name,
        }));

      setPlayer(foundPlayer);
      setPlayerName(foundPlayer.player_name);
      setTrainerPokemon(normalizedPokemon);
      setSelectedPokemon(null);
      setCurrentScreen('pokemon-selection');
      playSound('trainer-found');
    } catch (error) {
      setPlayer(null);
      setTrainerPokemon([]);
      setSelectedPokemon(null);
      setAppError(error instanceof Error ? error.message : 'Unable to load player.');
      playSound('error');
    } finally {
      setIsLoadingPlayer(false);
    }
  };

  const handlePokemonSelect = (pokemon: SelectedPokemon) => {
    startBackgroundMusic();
    playSound('select-pokemon');
    setSelectedPokemon(pokemon);
    setCurrentScreen('mini-games');
    setActiveTab('battle-predictor');
    setSaveMessage('');
  };

  const handleBackToPokemonSelection = () => {
    playSound('back');
    setSelectedPokemon(null);
    setCurrentScreen('pokemon-selection');
    setSaveMessage('');
  };

  const handleSaveLevelingResult = async (resultInput: GameSaveRequest) => {
    if (!player || !selectedPokemon) {
      throw new Error('Select a player and Pokemon before saving a result.');
    }

    const { message, updatedLevel } = await saveLevelingResult({
      player_id: player.player_id,
      pokedex_id: selectedPokemon.pokedex_id,
      pokemon_id: selectedPokemon.pokemon_id,
      game_name: resultInput.game_name,
      result: resultInput.result,
      level_gain: resultInput.level_gain,
      coins_earned: resultInput.coins_earned,
      source_system: 'leveling_subsystem',
    });

    const updatedPokemon = { ...selectedPokemon, level: updatedLevel };

    setSelectedPokemon(updatedPokemon);
    setTrainerPokemon((pokemonList) =>
      pokemonList.map((pokemon) =>
        pokemon.pokedex_id === selectedPokemon.pokedex_id ? updatedPokemon : pokemon,
      ),
    );
    setPlayer((currentPlayer) =>
      currentPlayer
        ? {
            ...currentPlayer,
            coin_balance: currentPlayer.coin_balance + resultInput.coins_earned,
          }
        : currentPlayer,
    );
    setSaveMessage(message);
    playSound(resultInput.level_gain > 0 || resultInput.coins_earned > 0 ? 'reward' : 'success');

    return message;
  };

  const renderPokemonImage = (pokemon: SelectedPokemon) => {
    if (pokemon.image) {
      return (
        <img
          src={pokemon.image}
          alt={pokemon.pokemon_name}
          className="w-full h-full object-contain"
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-3 bg-gradient-to-br from-[#FBBF24] to-[#2563EB] flex items-center justify-center text-white text-4xl font-bold">
            {pokemon.pokemon_name.charAt(0)}
          </div>
          <p className="text-sm text-gray-600">{pokemon.pokemon_name}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-yellow-300 to-red-400 p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-8 border-white"></div>
        <div className="absolute top-10 left-10 w-32 h-16 border-b-8 border-white"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full border-8 border-white"></div>
        <div className="absolute bottom-20 right-20 w-40 h-20 border-b-8 border-white"></div>
        <div className="absolute top-1/3 right-10 w-24 h-24 rounded-full border-8 border-white"></div>
        <div className="absolute top-1/3 right-10 w-24 h-12 border-b-8 border-white"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with Pokeball logo */}
        <div className="relative mb-8">
          {/* Decorative Pokeballs */}
          <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full bg-white border-4 border-gray-800 shadow-lg">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-gray-800"></div>
          </div>
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white border-4 border-gray-800 shadow-lg">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-gray-800"></div>
          </div>

          <div className="bg-white rounded-3xl p-8 border-4 border-[#2563EB] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-red-200/20 to-transparent rounded-full blur-2xl"></div>

            <div className="absolute top-4 left-4 flex gap-1">
              <div className="w-2 h-2 bg-[#EF4444] rounded-full"></div>
              <div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div>
              <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
            </div>
            <div className="absolute top-4 right-4 flex gap-1">
              <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
              <div className="w-2 h-2 bg-[#FBBF24] rounded-full"></div>
              <div className="w-2 h-2 bg-[#EF4444] rounded-full"></div>
            </div>

            <h1 className="text-5xl text-center bg-gradient-to-r from-[#EF4444] via-[#FBBF24] to-[#2563EB] bg-clip-text text-transparent mb-6 drop-shadow-sm font-bold relative z-10">
              Pokemon Training Grounds
            </h1>

            {currentScreen === 'trainer-name' && (
              <div className="flex gap-4 items-center justify-center">
                <input
                  type="text"
                  placeholder="Enter Trainer Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrainerNameSubmit()}
                  className="px-6 py-3 text-lg border-3 border-[#FBBF24] rounded-2xl focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white shadow-md"
                />
                <button
                  onClick={handleTrainerNameSubmit}
                  disabled={isLoadingPlayer}
                  className="px-8 py-3 text-lg bg-[#2563EB] text-white hover:bg-blue-700 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
                >
                  {isLoadingPlayer ? 'Loading...' : 'Continue'}
                </button>
              </div>
            )}

            {appError && (
              <p className="text-center text-[#EF4444] mt-4 font-medium relative z-10">
                {appError}
              </p>
            )}

            {currentScreen !== 'trainer-name' && (
              <div className="text-center">
                <p className="text-xl text-gray-700 relative z-10">
                  Trainer: <span className="font-bold text-[#2563EB]">{player?.player_name}</span>
                </p>
                <p className="text-lg text-gray-700 relative z-10 mt-2">
                  Coins: <span className="font-bold text-[#FBBF24]">{player?.coin_balance ?? 0}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pokemon Selection Screen */}
        {currentScreen === 'pokemon-selection' && (
          <div className="bg-white rounded-3xl p-8 border-4 border-[#FBBF24] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-yellow-200/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl"></div>

            {/* Corner Pokeballs */}
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>
            <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-white border-4 border-gray-800 shadow-lg">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-4 border-gray-800"></div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">⭐</span>
              </div>
            </div>

            <h2 className="text-3xl text-center mb-2 text-gray-800 font-bold relative z-10">
              Choose a Pokemon to Level Up
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FBBF24] to-transparent mx-auto mb-8"></div>

            <div className={`grid gap-6 mb-8 relative z-10 ${
              trainerPokemon.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              trainerPokemon.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
              trainerPokemon.length === 3 ? 'grid-cols-3' :
              'grid-cols-4'
            }`}>
              {trainerPokemon.map((pokemon) => (
                <div
                  key={pokemon.pokedex_id}
                  onClick={() => handlePokemonSelect(pokemon)}
                  className="relative bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer border-3 border-gray-200 hover:border-[#2563EB] shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Pokemon Illustration */}
                  <div className="relative mb-4 rounded-2xl overflow-hidden aspect-square p-4 bg-[#F8FAFC]">
                    {renderPokemonImage(pokemon)}
                  </div>

                  {/* Pokemon Name */}
                  <h3 className="text-2xl text-center mb-3 text-gray-800 font-medium">{pokemon.pokemon_name}</h3>
                  {pokemon.type && (
                    <p className="text-sm text-center text-gray-600 mb-3">{pokemon.type}</p>
                  )}

                  {/* Current Level and Coins */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white px-4 py-2 rounded-full shadow-md">
                        <span className="text-sm">Level</span>
                        <span className="text-lg font-bold">{pokemon.level}</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#EF4444] text-white px-4 py-2 rounded-full shadow-md">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-medium">{player?.coin_balance ?? 0} Coins</span>
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePokemonSelect(pokemon);
                    }}
                    className="w-full px-8 py-3 text-lg bg-white text-[#2563EB] hover:bg-gray-50 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>

            {trainerPokemon.length === 0 && (
              <p className="text-center text-gray-700 relative z-10">
                No Pokemon found for this player.
              </p>
            )}
          </div>
        )}

        {/* Mini Games Screen with Tab Navigation */}
        {currentScreen === 'mini-games' && selectedPokemon && (
          <>
            {/* Selected Pokemon Info Bar */}
            <div className="bg-white rounded-3xl p-6 border-4 border-[#2563EB] shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/20 to-transparent rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="text-2xl font-bold text-gray-800">
                    {selectedPokemon.pokemon_name}
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white px-4 py-2 rounded-full shadow-md">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Level {selectedPokemon.level}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#EF4444] text-white px-4 py-2 rounded-full shadow-md">
                    <Coins className="w-5 h-5" />
                    <span className="font-medium">{player?.coin_balance ?? 0} Coins</span>
                  </div>
                </div>
                <button
                  onClick={handleBackToPokemonSelection}
                  className="px-8 py-3 text-lg bg-white text-[#2563EB] hover:bg-gray-50 border-2 border-[#2563EB] rounded-2xl transition-all duration-200 font-medium"
                >
                  ← Back to Pokemon
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-3xl p-2 border-4 border-gray-200 shadow-2xl">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'battle-predictor' as Tab, label: 'Battle Predictor', icon: <Swords className="w-6 h-6" />, color: '#EF4444' },
                  { id: 'guess-pokemon' as Tab, label: 'Guess That Pokemon', icon: <HelpCircle className="w-6 h-6" />, color: '#2563EB' },
                  { id: 'match-pokemon' as Tab, label: 'Match That Pokemon', icon: <Grid3x3 className="w-6 h-6" />, color: '#FBBF24' },
                  { id: 'battle-logger' as Tab, label: 'Battle Result Logger', icon: <Scroll className="w-6 h-6" />, color: '#8B5CF6' }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (activeTab !== tab.id) {
                          const tabSound = {
                            'battle-predictor': 'tab-battle',
                            'guess-pokemon': 'tab-guess',
                            'match-pokemon': 'tab-match',
                            'battle-logger': 'tab-logger',
                          } as const;

                          playSound(tabSound[tab.id]);

                        }

                        setActiveTab(tab.id);
                      }}
                      className={`relative rounded-2xl p-4 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br shadow-lg scale-105'
                          : 'bg-gray-50 hover:bg-gray-100 hover:scale-102'
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: tab.color,
                              boxShadow: `0 4px 20px ${tab.color}40`
                            }
                          : {}
                      }
                    >
                      {isActive && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse"
                          style={{ backgroundColor: tab.color }}
                        ></div>
                      )}

                      <div className="flex flex-col items-center gap-2">
                        <div className={`transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>
                          {tab.icon}
                        </div>
                        <span className={`text-sm text-center font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-700'}`}>
                          {tab.label}
                        </span>
                      </div>

                      {isActive && (
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full"
                          style={{ backgroundColor: 'white' }}
                        ></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {saveMessage && (
                <p className="text-center text-white font-medium mb-4">{saveMessage}</p>
              )}
              {activeTab === 'battle-predictor' && (
                <BattlePredictor selectedPokemon={selectedPokemon} onSaveResult={handleSaveLevelingResult} />
              )}
              {activeTab === 'guess-pokemon' && (
                <GuessThePokemon selectedPokemon={selectedPokemon} onSaveResult={handleSaveLevelingResult} />
              )}
              {activeTab === 'match-pokemon' && (
                <MatchThePokemon selectedPokemon={selectedPokemon} onSaveResult={handleSaveLevelingResult} />
              )}
              {activeTab === 'battle-logger' && (
                <BattleResultLogger selectedPokemon={selectedPokemon} onSaveResult={handleSaveLevelingResult} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
