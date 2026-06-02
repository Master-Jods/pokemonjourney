import { useState } from 'react';
import { POKEMON_DATABASE, PokemonData } from '../../../../../shared/data/pokemonData';
import { Player } from '../store/gameStore';
import { PokemonSprite, TypeBadge, RegionBadge, PokeHeader } from './PokeShared';

interface Props {
  player: Player;
  onSelect: (pokemonDataId: string, pokemonName: string) => void;
  onBack: () => void;
  alreadyHasStarter: boolean;
  currentStarterId?: string;
}

const QUESTIONS = [
  {
    text: 'In a battle, you prefer to...',
    options: [
      { label: 'Rush in with full force 🔥', type: 'Fire' },
      { label: 'Outlast the opponent with patience 🌿', type: 'Grass' },
      { label: 'Stay flexible and find openings 💧', type: 'Water' },
    ],
  },
  {
    text: "What's your ideal vacation?",
    options: [
      { label: 'Volcanic island adventure 🌋', type: 'Fire' },
      { label: 'Dense forest exploration 🌲', type: 'Grass' },
      { label: 'Ocean cruise or surfing 🏄', type: 'Water' },
    ],
  },
  {
    text: 'Your biggest strength is...',
    options: [
      { label: 'Passion and raw determination 💪', type: 'Fire' },
      { label: 'Patience and careful strategy 🧠', type: 'Grass' },
      { label: 'Adaptability and staying calm 🌊', type: 'Water' },
    ],
  },
  {
    text: 'When facing a tough problem, you...',
    options: [
      { label: 'Attack it head-on immediately ⚡', type: 'Fire' },
      { label: 'Analyze every detail first 🔍', type: 'Grass' },
      { label: 'Go with the flow and improvise 🎯', type: 'Water' },
    ],
  },
  {
    text: 'Your favorite element is...',
    options: [
      { label: 'Fire — powerful and unstoppable 🔥', type: 'Fire' },
      { label: 'Nature — wise and enduring 🌿', type: 'Grass' },
      { label: 'Water — calm yet overwhelming 💧', type: 'Water' },
    ],
  },
];

type Step = 'quiz' | 'pick' | 'confirm';

export function StarterSelection({ player, onSelect, onBack, alreadyHasStarter, currentStarterId }: Props) {
  const [step, setStep] = useState<Step>('quiz');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ Fire: 0, Grass: 0, Water: 0 });
  const [recommended, setRecommended] = useState<PokemonData | null>(null);
  const [selected, setSelected] = useState<PokemonData | null>(null);
  const [recommendedType, setRecommendedType] = useState('');

  if (alreadyHasStarter) {
    const current = currentStarterId ? POKEMON_DATABASE.find(p => p.id === currentStarterId) : null;
    return (
      <div className="flex flex-col min-h-full">
        <PokeHeader title="Starter Selection" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center">
            <span style={{ fontSize: '4rem' }}>⭐</span>
            <h2 className="font-bold text-gray-800 mt-2">You already have a starter!</h2>
            {current && (
              <>
                <div className="flex justify-center my-4">
                  <PokemonSprite spriteId={current.spriteId} name={current.name} size={96} />
                </div>
                <p className="text-gray-600">
                  Your starter is <strong>{current.name}</strong>
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <TypeBadge type={current.type} />
                  <RegionBadge region={current.region} />
                </div>
              </>
            )}
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: '#CC0000' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  function handleAnswer(type: string) {
    const newScores = { ...scores, [type]: (scores[type] ?? 0) + 1 };
    setScores(newScores);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      // Calculate result
      const maxScore = Math.max(...Object.values(newScores));
      const topTypes = Object.entries(newScores).filter(([, v]) => v === maxScore).map(([k]) => k);
      const winType = topTypes[Math.floor(Math.random() * topTypes.length)];
      setRecommendedType(winType);

      // Get all starters of that type
      const starters = POKEMON_DATABASE.filter(p => p.isStarter && p.type === winType);
      if (starters.length > 0) {
        const rec = starters[Math.floor(Math.random() * starters.length)];
        setRecommended(rec);
      }
      setStep('pick');
    }
  }

  function handlePickStarter(pokemon: PokemonData) {
    setSelected(pokemon);
    setStep('confirm');
  }

  if (step === 'quiz') {
    const q = QUESTIONS[questionIndex];
    const progress = ((questionIndex) / QUESTIONS.length) * 100;
    return (
      <div className="flex flex-col min-h-full">
        <PokeHeader title="Starter Questionnaire" onBack={onBack} />
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Question {questionIndex + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full  duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #CC0000, #FF4444)' }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-2">Choose wisely, Trainer!</p>
            <h2 className="text-gray-800 font-bold" style={{ fontSize: '1.1rem' }}>{q.text}</h2>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {q.options.map(opt => (
              <button
                key={opt.type}
                onClick={() => handleAnswer(opt.type)}
                className="w-full p-4 rounded-2xl text-left font-medium bg-white border-2 border-gray-100 hover:border-red-300   shadow-sm"
                style={{ fontSize: '0.95rem' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'pick') {
    const starters = POKEMON_DATABASE.filter(p => p.isStarter && p.type === recommendedType);
    return (
      <div className="flex flex-col min-h-full">
        <PokeHeader title="Choose Your Starter" onBack={onBack} />
        <div className="flex-1 flex flex-col p-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">Based on your answers, you suit a</p>
            <span
              className="inline-block px-3 py-1 rounded-full text-white font-bold text-lg mt-1"
              style={{
                background: recommendedType === 'Fire' ? '#FF6B35' : recommendedType === 'Water' ? '#4A90E2' : '#38A169',
              }}
            >
              {recommendedType}-type Trainer!
            </span>
            <p className="text-xs text-gray-400 mt-2">Pick one starter from any region</p>
          </div>

          <div className="flex flex-col gap-3">
            {starters.map(pokemon => (
              <button
                key={pokemon.id}
                onClick={() => handlePickStarter(pokemon)}
                className="w-full bg-white rounded-2xl p-4 border-2 border-gray-100 flex items-center gap-4 hover:border-red-300   shadow-sm text-left"
              >
                <div className="rounded-xl p-2" style={{ background: '#FFF5F5' }}>
                  <PokemonSprite spriteId={pokemon.spriteId} name={pokemon.name} size={64} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{pokemon.name}</h3>
                    {pokemon.id === recommended?.id && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Recommended</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <TypeBadge type={pokemon.type} />
                    <RegionBadge region={pokemon.region} />
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setQuestionIndex(0); setScores({ Fire: 0, Grass: 0, Water: 0 }); setStep('quiz'); }}
            className="text-sm text-gray-400 underline text-center"
          >
            Retake questionnaire
          </button>
        </div>
      </div>
    );
  }

  // Confirm step
  if (selected) {
    return (
      <div className="flex flex-col min-h-full">
        <PokeHeader title="Confirm Starter" onBack={() => setStep('pick')} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Your chosen partner</p>
            <div className="w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #FFF5F5, #FECACA)' }}>
              <PokemonSprite spriteId={selected.spriteId} name={selected.name} size={120} />
            </div>
            <h2 className="font-bold text-gray-800" style={{ fontSize: '1.75rem' }}>{selected.name}</h2>
            <div className="flex justify-center gap-2 mt-2">
              <TypeBadge type={selected.type} />
              <RegionBadge region={selected.region} />
            </div>
          </div>

          <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 text-center">
            <strong>{selected.name}</strong> will start at Lv.5 and join your adventure. You can evolve it later using the correct stone!
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => onSelect(selected.id, selected.name)}
              className="w-full py-4 rounded-xl font-bold text-white text-lg  "
              style={{
                background: 'linear-gradient(135deg, #CC0000 0%, #FF4444 100%)',
                boxShadow: '0 4px 15px rgba(204,0,0,0.4)',
              }}
            >
              Choose {selected.name}! ⭐
            </button>
            <button
              onClick={() => setStep('pick')}
              className="w-full py-3 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
