import { useState } from 'react';
import { Button } from './ui/button';
import { PageFrame } from './PageFrame';
import type { WildPokemon } from '../lib/wildPokemon';

type PokeGuessProps = {
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

function normalizeGuess(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function PokeGuess({ wild, isSavingResult, onFinish, onBack }: PokeGuessProps) {
  const [stage, setStage] = useState<'appear' | 'playing' | 'checking'>('appear');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [audioError, setAudioError] = useState('');

  const canSubmit = answer.trim().length > 0 && !isSavingResult && stage === 'playing';

  const playCry = () => {
    setAudioError('');
    if (!wild.cry) {
      setAudioError('No cry available for this Pokemon.');
      return;
    }

    const cry = new Audio(wild.cry);
    cry.volume = 0.65;
    void cry.play().catch(() => {
      setAudioError('Tap again to play the Pokemon cry.');
    });
  };

  const showClue = () => {
    setStage('playing');
    playCry();
  };

  const submitGuess = () => {
    if (!canSubmit) return;

    const isCorrect = normalizeGuess(answer) === normalizeGuess(wild.pokemon_name);
    setStage('checking');
    setFeedback(isCorrect ? 'Correct! The Pokemon was caught!' : 'Wrong guess! The Pokemon fled!');

    window.setTimeout(() => {
      onFinish(isCorrect ? 'caught' : 'fled');
    }, 900);
  };

  return (
    <PageFrame>
      <div className="relative bg-white rounded-3xl shadow-xl px-8 py-4 border-2 border-yellow-400 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-full" disabled={isSavingResult}>← Back</Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PokeGuess</h1>
        <div className="w-20" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl p-8 border-2 border-blue-400">
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-400" />
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />

        {stage === 'appear' && (
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4 flex justify-center animate-bounce">
              {renderPokemonVisual(
                wild.image,
                'Unknown Pokemon',
                'h-36 w-36 object-contain brightness-0 contrast-200 opacity-90',
              )}
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">A wild Pokemon appeared!</h2>
            <p className="text-gray-600 mb-6">
              Listen closely, read the clue, then type the Pokemon name to catch it.
            </p>
            <Button onClick={showClue} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-5 text-lg">
              Show the Clue
            </Button>
          </div>
        )}

        {(stage === 'playing' || stage === 'checking') && (
          <div className="max-w-xl mx-auto">
            <div className="mb-5 flex justify-center">
              {renderPokemonVisual(
                wild.image,
                'Unknown Pokemon',
                'h-32 w-32 object-contain brightness-0 contrast-200 opacity-90',
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-5 mb-5 text-center">
              <div className="text-xs opacity-90">Category</div>
              <div className="text-xl font-bold mb-3">{wild.category}</div>
              <div className="text-xs opacity-90">Clue</div>
              <div className="text-base italic">"{wild.clue}"</div>
            </div>

            <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-4 mb-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setFeedback('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitGuess();
                  }}
                  disabled={stage === 'checking' || isSavingResult}
                  placeholder="Type the Pokemon name"
                  className="flex-1 rounded-full border-2 border-blue-200 bg-white px-5 py-3 text-center font-bold text-gray-800 outline-none focus:border-blue-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={playCry}
                  disabled={!wild.cry || stage === 'checking' || isSavingResult}
                  className="rounded-full px-5"
                >
                  Play Cry
                </Button>
              </div>
              {audioError && <p className="mt-2 text-center text-xs font-semibold text-blue-700">{audioError}</p>}
            </div>

            {feedback && (
              <div className="mb-5 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-center font-bold text-yellow-800">
                {feedback}
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={submitGuess}
                disabled={!canSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-5 text-lg disabled:opacity-50"
              >
                Throw Poke Ball
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
