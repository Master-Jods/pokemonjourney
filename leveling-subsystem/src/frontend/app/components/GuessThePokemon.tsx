import { useEffect, useState } from 'react';
import { HelpCircle, Trophy, TrendingUp, Coins, Star, Volume2, VolumeX, Play } from 'lucide-react';
import { GuessResultCard } from './GuessResultCard';
import {
  playPokemonCry,
  playSound,
  playWhosThatPokemon,
  preloadPokemonCry,
  stopPokemonCry,
} from '../../lib/soundEffects';
import {
  GuessRound,
  formatPokemonName,
  loadGuessRound,
  loadRandomPokemon,
} from '../../lib/pokeApiService';

type GuessQuestionType = 'name' | 'type';

interface GuessChoice {
  value: string;
  label: string;
}

const TYPE_CHOICES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

interface GuessThePokemonProps {
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

function renderPokemonImage(round: GuessRound) {
  return (
    <img
      src={round.pokemon.image}
      alt={round.pokemon.displayName}
      className="w-full h-full object-contain"
    />
  );
}

function shuffleChoices<T>(choices: T[]) {
  return [...choices].sort(() => Math.random() - 0.5);
}

function formatTypeCombo(types: string[]) {
  return types.map(formatPokemonName).join(' / ');
}

function getRandomQuestionType(): GuessQuestionType {
  return Math.random() > 0.5 ? 'name' : 'type';
}

export function GuessThePokemon({ selectedPokemon, onSaveResult }: GuessThePokemonProps) {
  if (!selectedPokemon) return null;

  const [currentRound, setCurrentRound] = useState<GuessRound | null>(null);
  const [questionType, setQuestionType] = useState<GuessQuestionType>('name');
  const [choices, setChoices] = useState<GuessChoice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isPokemonRevealed, setIsPokemonRevealed] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const loadRound = async () => {
    setIsLoadingRound(true);
    setSaveError('');
    setIsPokemonRevealed(false);
    setIsGameStarted(false);
    setIsSoundPlaying(false);
    stopPokemonCry();

    try {
      const nextRound = await loadGuessRound();
      const nextQuestionType = getRandomQuestionType();
      const distractorPokemon = await loadRandomPokemon(8);
      const correctChoice =
        nextQuestionType === 'name'
          ? {
              value: nextRound.pokemon.name,
              label: nextRound.pokemon.displayName,
            }
          : {
              value: nextRound.pokemon.types.join('/'),
              label: formatTypeCombo(nextRound.pokemon.types),
            };
      const distractorChoices = distractorPokemon
        .filter((pokemon) => pokemon.id !== nextRound.pokemon.id)
        .map((pokemon) =>
          nextQuestionType === 'name'
            ? {
                value: pokemon.name,
                label: pokemon.displayName,
              }
            : {
                value: pokemon.types.join('/'),
                label: formatTypeCombo(pokemon.types),
              },
        )
        .filter((choice) => choice.value !== correctChoice.value)
        .filter(
          (choice, index, allChoices) =>
            allChoices.findIndex((candidate) => candidate.value === choice.value) === index,
        )
        .slice(0, 3);
      const fallbackTypeChoices =
        nextQuestionType === 'type'
          ? TYPE_CHOICES.map((type) => ({
              value: type,
              label: formatPokemonName(type),
            })).filter((choice) => choice.value !== correctChoice.value)
          : [];
      const finalDistractorChoices = shuffleChoices([
        ...distractorChoices,
        ...fallbackTypeChoices,
      ])
        .filter(
          (choice, index, allChoices) =>
            allChoices.findIndex((candidate) => candidate.value === choice.value) === index,
        )
        .slice(0, 3);

      setCurrentRound(nextRound);
      setQuestionType(nextQuestionType);
      setChoices(shuffleChoices([correctChoice, ...finalDistractorChoices]).slice(0, 4));
      setSelectedChoice('');
      preloadPokemonCry(nextRound.pokemon.name).catch(() => undefined);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to load Pokemon round.');
      playSound('error');
    } finally {
      setIsLoadingRound(false);
    }
  };

  useEffect(() => {
    loadRound();

    return () => {
      stopPokemonCry();
    };
  }, []);

  const getRewards = (currentScore: number) => {
    if (currentScore >= 8) {
      return { level_gain: 5, coins_earned: 15 };
    }

    if (currentScore >= 4) {
      return { level_gain: 5, coins_earned: 8 };
    }

    if (currentScore >= 1) {
      return { level_gain: 1, coins_earned: 3 };
    }

    return { level_gain: 0, coins_earned: 0 };
  };

  const handleSubmit = async () => {
    if (isSaving || !currentRound || !isGameStarted) return;

    const correctAnswer =
      questionType === 'name' ? currentRound.pokemon.name : currentRound.pokemon.types.join('/');
    const totalScore = selectedChoice === correctAnswer ? 10 : 0;

    const rewards = getRewards(totalScore);

    setIsSaving(true);
    setSaveError('');

    try {
      await onSaveResult({
        game_name: 'Guess That Pokemon',
        result: `${totalScore}/10 Points: ${currentRound.pokemon.displayName}`,
        level_gain: rewards.level_gain,
        coins_earned: rewards.coins_earned,
      });
      setIsPokemonRevealed(true);
      if (totalScore >= 8) {
        playPokemonCry(currentRound.pokemon.name).catch(() => playSound('victory'));
      } else if (totalScore > 0) {
        playSound('success');
      } else {
        playSound('defeat');
      }
      setScore(totalScore);
      setShowResult(true);
    } catch (error) {
      playSound('error');
      setSaveError(error instanceof Error ? error.message : 'Unable to save result.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setSelectedChoice('');
    setChoices([]);
    setScore(0);
    setSaveError('');
    setIsPokemonRevealed(false);
    setIsGameStarted(false);
    loadRound();
  };

  const handleStartGame = async () => {
    if (!currentRound || isLoadingRound || isGameStarted) return;

    setSaveError('');
    setIsPokemonRevealed(false);
    setIsGameStarted(true);
    playSound('choice');
    await playWhosThatPokemon();
  };

  const handleSoundToggle = async () => {
    if (!isGameStarted) return;

    if (isSoundPlaying) {
      stopPokemonCry();
      setIsSoundPlaying(false);
      playSound('back');
      return;
    }

    setIsSoundPlaying(true);
    playSound('mystery');

    try {
      if (currentRound) {
        await playPokemonCry(currentRound.pokemon.name);
      }
    } catch {
      playSound('error');
    } finally {
      setIsSoundPlaying(false);
    }
  };

  const isFormValid = Boolean(
    currentRound && isGameStarted && choices.length === 4 && selectedChoice,
  );
  const canStartGame = Boolean(currentRound && !isLoadingRound && !isGameStarted);

  return (
    <div className="max-w-6xl mx-auto mt-16">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-blue-600 mb-12">
        <h1 className="text-5xl text-center mb-8 text-blue-600">
          Guess That Pokemon
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

      {/* Game Area */}
      <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 rounded-3xl shadow-2xl p-10 border-8 border-yellow-400">
        <h2 className="text-3xl text-center mb-10 text-gray-800 flex items-center justify-center gap-3">
          <HelpCircle className="w-10 h-10 text-blue-600" />
          Game Area
        </h2>

        {isLoadingRound && (
          <p className="text-center text-gray-700 mb-8">Loading Pokemon from PokeAPI...</p>
        )}

        {/* Start Game */}
        <div className="bg-white rounded-3xl p-6 border-4 border-yellow-400 shadow-xl mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-14 h-14 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <Play className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl text-gray-800">Start Game</h3>
                <p className="text-lg text-gray-600">
                  Start the round to unlock the picture, clue, and guess form
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`inline-flex items-center justify-center gap-3 min-w-44 px-8 py-4 text-xl rounded-full transition-all duration-300 border-4 shadow-lg ${
                canStartGame
                  ? 'bg-yellow-400 text-gray-900 border-yellow-600 hover:bg-yellow-500 hover:scale-105'
                  : isGameStarted
                    ? 'bg-green-500 text-white border-green-700'
                    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-6 h-6" />
              {isGameStarted ? 'Game Started' : 'Start Game'}
            </button>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="bg-white rounded-3xl p-6 border-4 border-blue-400 shadow-xl mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                {isSoundPlaying ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-2xl text-gray-800">Pokemon Sound</h3>
                <p className="text-lg text-gray-600">
                  {isGameStarted
                    ? 'Play the sound clue for this round'
                    : 'Press Start Game to unlock the sound clue'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSoundToggle}
              disabled={!currentRound || isLoadingRound || !isGameStarted}
              className={`inline-flex items-center justify-center gap-3 min-w-44 px-8 py-4 text-xl rounded-full transition-all duration-300 border-4 shadow-lg ${
                isSoundPlaying
                  ? 'bg-red-500 text-white border-red-700 hover:bg-red-600'
                  : currentRound && !isLoadingRound && isGameStarted
                    ? 'bg-blue-500 text-white border-blue-700 hover:bg-blue-600 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isSoundPlaying ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              {isSoundPlaying ? 'Stop Sound' : 'Play Sound'}
            </button>
          </div>
        </div>

        {/* Blurred Pokemon Silhouette */}
        <div className="bg-white rounded-3xl p-8 border-4 border-purple-400 shadow-xl mb-10">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-6">
            <div className="max-w-md mx-auto aspect-square flex items-center justify-center">
              {currentRound && isGameStarted ? (
                <div
                  className={`w-full h-full transition-all duration-500 ${
                    isPokemonRevealed ? 'blur-none opacity-100' : 'blur-lg opacity-70'
                  }`}
                >
                  {renderPokemonImage(currentRound)}
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl border-4 border-dashed border-purple-200 flex items-center justify-center text-center px-8">
                  <p className="text-2xl text-gray-500">Press Start Game</p>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-4xl text-center text-gray-800">
            {isPokemonRevealed && currentRound
              ? currentRound.pokemon.displayName
              : 'Guess the Pokemon'}
          </h3>
          {isPokemonRevealed && currentRound && (
            <p className="text-xl text-center text-gray-600 mt-3">
              {currentRound.pokemon.types.map(formatPokemonName).join(' / ')} Type
            </p>
          )}
        </div>

        {/* Multiple Choice Answers */}
        <div className="bg-white rounded-3xl p-8 border-4 border-blue-400 shadow-xl mb-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600 mb-2">Choose the correct answer</p>
              <h3 className="text-3xl text-gray-800">
                {questionType === 'name'
                  ? 'What is this Pokemon named?'
                  : 'What type is this Pokemon?'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isGameStarted
                ? choices.map((choice) => {
                    const isSelected = selectedChoice === choice.value;

                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() => {
                          setSelectedChoice(choice.value);
                          playSound('choice');
                        }}
                        className={`min-h-24 px-6 py-4 rounded-2xl border-4 text-2xl shadow-lg transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-500 text-white border-blue-700 scale-[1.02]'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        {choice.label}
                      </button>
                    );
                  })
                : Array.from({ length: 4 }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled
                      className="min-h-24 px-6 py-4 rounded-2xl border-4 text-2xl shadow-lg bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    >
                      Choice {index + 1}
                    </button>
                  ))}
            </div>

            {!isGameStarted && (
              <p className="text-center text-gray-500 mt-5">
                Press Start Game to reveal the answer choices.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSaving}
              className={`px-20 py-6 text-3xl rounded-full transition-all duration-300 border-6 shadow-2xl ${
                isFormValid
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-700 hover:scale-105 hover:shadow-blue-400/50'
                  : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isSaving ? 'Saving...' : 'Submit Guess'}
            </button>
          </div>

          {saveError && (
            <p className="text-center text-[#EF4444] mt-4 font-medium">{saveError}</p>
          )}
        </div>

        {/* Question Rules */}
        <div className="bg-white rounded-3xl p-8 border-4 border-yellow-400 shadow-xl mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Star className="w-10 h-10 text-yellow-600" />
            <h3 className="text-3xl text-gray-800">Question Rules</h3>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 text-center">
              <p className="text-xl text-gray-700 mb-2">Question Changes</p>
              <p className="text-3xl text-blue-600">Name or Type</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 text-center">
              <p className="text-xl text-gray-700 mb-2">Answer Choices</p>
              <p className="text-3xl text-purple-600">Pick 1 of 4</p>
            </div>
          </div>
        </div>

        {/* Reward Rules */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-orange-400 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-orange-600" />
            <h3 className="text-3xl text-orange-800">Reward Rules</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-green-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3">Correct Answer:</p>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="text-xl text-blue-600">+5 Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-600" />
                <span className="text-xl text-yellow-600">+15 Coins</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3">Wrong Answer:</p>
              <div className="flex items-center gap-2">
                <span className="text-xl text-gray-600">No Reward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result Card */}
        {showResult && (
          currentRound && (
          <GuessResultCard
            score={score}
            pokemonName={currentRound.pokemon.displayName}
            pokemonTypes={currentRound.pokemon.types.map(formatPokemonName)}
            pokemonIllustration={renderPokemonImage(currentRound)}
            onClose={handleCloseResult}
          />
          )
        )}
      </div>
    </div>
  );
}
