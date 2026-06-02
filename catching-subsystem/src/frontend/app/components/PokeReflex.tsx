import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { PageFrame } from './PageFrame';
import type { WildPokemon } from '../lib/wildPokemon';

type Symbol = { id: string; name: string; emoji: string };

const typeSymbols: Symbol[] = [
  { id: 'fire', name: 'Fire Type', emoji: '🔥' },
  { id: 'water', name: 'Water Type', emoji: '💧' },
  { id: 'grass', name: 'Grass Type', emoji: '🍃' },
  { id: 'electric', name: 'Electric Type', emoji: '⚡' },
  { id: 'ice', name: 'Ice Type', emoji: '❄️' },
  { id: 'fighting', name: 'Fighting Type', emoji: '🥊' },
  { id: 'poison', name: 'Poison Type', emoji: '☠️' },
  { id: 'ground', name: 'Ground Type', emoji: '🪨' },
  { id: 'flying', name: 'Flying Type', emoji: '🪽' },
  { id: 'psychic', name: 'Psychic Type', emoji: '🔮' },
  { id: 'bug', name: 'Bug Type', emoji: '🐛' },
  { id: 'rock', name: 'Rock Type', emoji: '🪨' },
  { id: 'steel', name: 'Steel Type', emoji: '⚙️' },
  { id: 'fairy', name: 'Fairy Type', emoji: '✨' },
  { id: 'dark', name: 'Dark Type', emoji: '🌑' },
  { id: 'ghost', name: 'Ghost Type', emoji: '👻' },
  { id: 'dragon', name: 'Dragon Type', emoji: '🐉' },
  { id: 'normal', name: 'Normal Type', emoji: '⭐' },
];

const distractorItems: Symbol[] = [
  { id: 'pokeball', name: 'Poké Ball', emoji: '⚾' },
  { id: 'leafstone', name: 'Leaf Stone', emoji: '🍀' },
  { id: 'potion', name: 'Potion', emoji: '🧪' },
  { id: 'berry', name: 'Berry', emoji: '🍒' },
];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

type PokeReflexProps = {
  wild: WildPokemon;
  playerName: string;
  isSavingResult: boolean;
  onFinish: (result: 'caught' | 'fled') => void;
  onBack: () => void;
};

function renderPokemonVisual(image: string, pokemonName: string, className: string) {
  if (/^https?:\/\//i.test(image)) {
    return <img src={image} alt={pokemonName} className={className} />;
  }
  return <div className={className}>{image}</div>;
}

export function PokeReflex({ wild, isSavingResult, onFinish, onBack }: PokeReflexProps) {
  const [stage, setStage] = useState<'appear' | 'playing'>('appear');
  const [timeLeft, setTimeLeft] = useState(5);
  const [choices, setChoices] = useState<Symbol[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);

  const targetSymbol = typeSymbols.find((symbol) =>
    symbol.name.toLowerCase().startsWith(wild.type.toLowerCase()),
  ) ?? typeSymbols.find((symbol) => symbol.id === 'normal')!;

  useEffect(() => {
    if (stage !== 'playing') return;
    if (timeLeft <= 0 && !hasAnswered && !isSavingResult) {
      onFinish('fled');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, timeLeft, hasAnswered, isSavingResult, onFinish]);

  const startPlaying = () => {
    const wrongs = shuffle(typeSymbols.filter((symbol) => symbol.id !== targetSymbol.id)).slice(0, 2);
    const items = shuffle(distractorItems).slice(0, 1);
    setChoices(shuffle([targetSymbol, ...wrongs, ...items]));
    setTimeLeft(5);
    setHasAnswered(false);
    setStage('playing');
  };

  return (
    <PageFrame>
      <div className="relative bg-white rounded-3xl shadow-xl px-8 py-4 border-2 border-yellow-400 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-full" disabled={isSavingResult}>← Back</Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">PokeReflex</h1>
        <div className="w-20" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl p-8 border-2 border-red-400">
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-400" />
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />

        {stage === 'appear' && (
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4 flex justify-center animate-bounce">
              {renderPokemonVisual(wild.image, wild.pokemon_name, 'h-36 w-36 object-contain')}
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">A wild {wild.pokemon_name} appeared!</h2>
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold">{wild.type}</span>
              <span className="bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs font-bold">{wild.region}</span>
              <span className="bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-xs font-bold">{wild.difficulty}</span>
            </div>
            <p className="text-gray-600 mb-6">Click the matching symbol before time runs out to catch it!</p>
            <Button onClick={startPlaying} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-5 text-lg" disabled={isSavingResult}>
              Try to Catch It!
            </Button>
          </div>
        )}

        {stage === 'playing' && (
          <div className="text-center">
            <div className="flex justify-center mb-1">
              {renderPokemonVisual(wild.image, wild.pokemon_name, 'h-24 w-24 object-contain')}
            </div>
            <div className="text-sm text-gray-500 mb-3">Wild {wild.pokemon_name}</div>

            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl px-6 py-3 mb-3">
              <div className="text-xs opacity-90">Target</div>
              <div className="text-2xl font-bold">{targetSymbol.name}</div>
            </div>
            <div className="text-xl font-bold text-orange-500 mb-6">⏱ Time: {timeLeft}s</div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {choices.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => {
                    if (hasAnswered || isSavingResult) return;
                    setHasAnswered(true);
                    onFinish(symbol.id === targetSymbol.id ? 'caught' : 'fled');
                  }}
                  disabled={hasAnswered || isSavingResult}
                  className="aspect-square bg-gray-50 rounded-2xl shadow hover:shadow-lg transition-all hover:scale-105 flex flex-col items-center justify-center p-4 border-2 border-gray-200 hover:border-blue-400"
                >
                  <div className="text-6xl">{symbol.emoji}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
