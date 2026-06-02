import { useEffect, useState } from 'react';
import { Grid3x3, Trophy, TrendingUp, Coins } from 'lucide-react';
import { MemoryCard } from './MemoryCard';
import { MatchResultCard } from './MatchResultCard';
import { playSound } from '../../lib/soundEffects';
import {
  MatchPair,
  loadMatchPairs,
} from '../../lib/pokeApiService';

const REQUIRED_MATCH_PAIRS = 2;
const BOARD_MATCH_PAIRS = 6;

interface MatchThePokemonProps {
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

export interface Card {
  id: number;
  type: 'pokemon' | 'symbol';
  name: string;
  pairId: number;
  content: JSX.Element;
  isFlipped: boolean;
  isMatched: boolean;
}

function PokemonImage({ pair, variant }: { pair: MatchPair; variant: 'A' | 'B' }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <img
        src={pair.pokemon.image}
        alt={pair.pokemon.displayName}
        className="w-full min-h-0 object-contain"
      />
      <span className="text-xs text-center text-gray-700">{pair.pokemon.displayName}</span>
      <span className="text-[10px] text-gray-400">Pair {variant}</span>
    </div>
  );
}

function createCardList(pairs: MatchPair[]) {
  const cardList: Card[] = [];

  pairs.forEach((pair, index) => {
    cardList.push({
      id: index * 2,
      type: 'pokemon',
      name: pair.pokemon.displayName,
      pairId: pair.pairId,
      content: <PokemonImage pair={pair} variant="A" />,
      isFlipped: false,
      isMatched: false,
    });
    cardList.push({
      id: index * 2 + 1,
      type: 'pokemon',
      name: pair.pokemon.displayName,
      pairId: pair.pairId,
      content: <PokemonImage pair={pair} variant="B" />,
      isFlipped: false,
      isMatched: false,
    });
  });

  return cardList.sort(() => Math.random() - 0.5);
}

export function MatchThePokemon({ selectedPokemon, onSaveResult }: MatchThePokemonProps) {
  if (!selectedPokemon) return null;

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [hasSavedResult, setHasSavedResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [saveError, setSaveError] = useState('');

  const targetPairs = cards.length > 0 ? REQUIRED_MATCH_PAIRS : 0;

  const loadCards = async () => {
    setIsLoadingCards(true);
    setSaveError('');
    setMatchedPairs(0);
    setFlippedCards([]);
    setHasSavedResult(false);
    setShowResult(false);

    try {
      const pairs = await loadMatchPairs(BOARD_MATCH_PAIRS);
      setCards(createCardList(pairs));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to load match cards.');
      playSound('error');
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleCardClick = (cardId: number) => {
    const card = cards.find((candidate) => candidate.id === cardId);
    if (
      !card ||
      card.isMatched ||
      card.isFlipped ||
      flippedCards.length >= 2 ||
      hasSavedResult ||
      isSaving ||
      (targetPairs > 0 && matchedPairs >= targetPairs)
    ) {
      return;
    }

    const updatedCards = cards.map((candidate) =>
      candidate.id === cardId ? { ...candidate, isFlipped: true } : candidate,
    );
    setCards(updatedCards);
    setFlippedCards([...flippedCards, cardId]);
    playSound('flip');

    if (flippedCards.length === 1) {
      const firstCard = updatedCards.find((candidate) => candidate.id === flippedCards[0]);
      const secondCard = updatedCards.find((candidate) => candidate.id === cardId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          setCards((previousCards) =>
            previousCards.map((candidate) =>
              candidate.pairId === firstCard.pairId ? { ...candidate, isMatched: true } : candidate,
            ),
          );
          setMatchedPairs((previousMatchedPairs) => previousMatchedPairs + 1);
          setFlippedCards([]);
          playSound('match');
        }, 600);
      } else {
        setTimeout(() => {
          setCards((previousCards) =>
            previousCards.map((candidate) =>
              candidate.id === flippedCards[0] || candidate.id === cardId
                ? { ...candidate, isFlipped: false }
                : candidate,
            ),
          );
          setFlippedCards([]);
          playSound('miss');
        }, 1000);
      }
    }
  };

  const getRewards = (pairs: number) => {
    if (pairs >= 2) {
      return { level_gain: 5, coins_earned: 15 };
    }

    if (pairs === 1) {
      return { level_gain: 0, coins_earned: 5 };
    }

    return { level_gain: 0, coins_earned: 0 };
  };

  useEffect(() => {
    const saveCompletedGame = async () => {
      if (targetPairs > 0 && matchedPairs >= targetPairs && !hasSavedResult && !isSaving) {
        const rewards = getRewards(matchedPairs);

        setIsSaving(true);
        setSaveError('');

        try {
          await onSaveResult({
            game_name: 'Match That Pokemon',
            result: `${matchedPairs} Pairs`,
            level_gain: rewards.level_gain,
            coins_earned: rewards.coins_earned,
          });
          playSound('victory');
          setHasSavedResult(true);
          setTimeout(() => {
            setShowResult(true);
          }, 500);
        } catch (error) {
          playSound('error');
          setSaveError(error instanceof Error ? error.message : 'Unable to save result.');
        } finally {
          setIsSaving(false);
        }
      }
    };

    saveCompletedGame();
  }, [matchedPairs, targetPairs, hasSavedResult, isSaving, onSaveResult]);

  const handleFinishGame = async () => {
    if (hasSavedResult || isSaving) return;

    const rewards = getRewards(matchedPairs);

    setIsSaving(true);
    setSaveError('');
    playSound('choice');

    try {
      await onSaveResult({
        game_name: 'Match That Pokemon',
        result: `${matchedPairs} Pairs`,
        level_gain: rewards.level_gain,
        coins_earned: rewards.coins_earned,
      });
      playSound(matchedPairs > 0 ? 'success' : 'defeat');
      setHasSavedResult(true);
      setShowResult(true);
    } catch (error) {
      playSound('error');
      setSaveError(error instanceof Error ? error.message : 'Unable to save result.');
    } finally {
      setIsSaving(false);
    }
  };

  const remainingPairs = Math.max(targetPairs - matchedPairs, 0);

  return (
    <div className="max-w-6xl mx-auto mt-16">
      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-purple-600 mb-12">
        <h1 className="text-5xl text-center mb-8 text-purple-600">
          Match That Pokemon
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
      <div className="bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded-3xl shadow-2xl p-10 border-8 border-yellow-400">
        {/* Instructions */}
        <div className="bg-white rounded-3xl p-6 border-4 border-pink-400 shadow-xl mb-8">
          <p className="text-2xl text-center text-gray-800">
            Match 2 pairs to win. Extra cards are only there to make it harder.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-4 border-green-400 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <Grid3x3 className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="text-xl text-gray-600">Pairs Needed</p>
                <p className="text-4xl text-green-600">{matchedPairs} / {targetPairs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-4 border-orange-400 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="text-xl text-gray-600">Left to Win</p>
                <p className="text-4xl text-orange-600">{remainingPairs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board - 4x3 Grid */}
        <div className="bg-white rounded-3xl p-8 border-4 border-purple-400 shadow-xl mb-8">
          {isLoadingCards && (
            <p className="text-center text-gray-700 mb-6">Loading Pokemon cards from PokeAPI...</p>
          )}

          <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
            {cards.map((card) => (
              <MemoryCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card.id)}
              />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <button
              onClick={handleFinishGame}
              disabled={hasSavedResult || isSaving || isLoadingCards}
              className={`px-10 py-4 text-xl rounded-2xl transition-all duration-200 font-medium border-2 ${
                hasSavedResult || isSaving || isLoadingCards
                  ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#2563EB] text-white border-[#2563EB] hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Saving...' : 'Finish Game'}
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

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-green-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3 text-center">2 Matched Pairs:</p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="text-xl text-blue-600">+5 Levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-600" />
                  <span className="text-xl text-yellow-600">+15 Coins</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-blue-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3 text-center">1 Matched Pair:</p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <span className="text-xl text-blue-600">+0 Levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-600" />
                  <span className="text-xl text-yellow-600">+5 Coins</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-400 shadow-lg">
              <p className="text-2xl text-gray-800 mb-3 text-center">0 Matched Pairs:</p>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xl text-gray-600">No Reward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result Card */}
        {showResult && (
          <MatchResultCard
            matchedPairs={matchedPairs}
            totalPairs={targetPairs}
            onClose={loadCards}
          />
        )}
      </div>
    </div>
  );
}
