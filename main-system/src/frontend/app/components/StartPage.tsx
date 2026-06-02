import { useState } from 'react';
import { PokeBall } from './PokeShared';
import pokemonLogo from '../../imports/image-3.png';

interface Props {
  onStart: (name: string) => void;
}

export function StartPage({ onStart }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your trainer name!');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    // Start pokeball transition
    setIsTransitioning(true);

    // Wait for animation to complete before navigating
    setTimeout(() => {
      onStart(trimmed);
    }, 1200); // Animation duration
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center px-6 py-12 gap-8 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #CC0000 0%, #FF4444 40%, #1a1a2e 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Floating Pokemon Elements */}
      <div className="absolute top-10 left-5 text-4xl opacity-30 float" style={{ animationDelay: '0s' }}>⚡</div>
      <div className="absolute top-20 right-10 text-5xl opacity-30 float-reverse" style={{ animationDelay: '0.5s' }}>🔥</div>
      <div className="absolute bottom-32 left-10 text-4xl opacity-30 float" style={{ animationDelay: '1s' }}>💧</div>
      <div className="absolute bottom-40 right-8 text-4xl opacity-30 float-reverse" style={{ animationDelay: '1.5s' }}>🌿</div>
      <div className="absolute top-1/3 left-1/4 text-3xl opacity-20 float" style={{ animationDelay: '0.8s' }}>⭐</div>
      <div className="absolute top-2/3 right-1/4 text-3xl opacity-20 float-reverse" style={{ animationDelay: '1.2s' }}>✨</div>

      {/* Logo area */}
      <div className="flex flex-col items-center gap-4  relative z-10">
        <img
          src={pokemonLogo}
          alt="Pokemon"
          style={{ width: '200px', height: 'auto' }}
          className="drop-shadow-2xl"
        />
        <div className="drop-shadow-2xl spin-slow">
          <PokeBall size={96} />
        </div>
        <div className="text-center">
          <h1
            className="text-white tracking-widest drop-shadow-lg glow-"
            style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '0.1em' }}
          >
            PokéJourney
          </h1>
          <p className="text-white/80 text-sm mt-1 " style={{ animationDelay: '0.3s' }}>Begin your Pokémon adventure!</p>
        </div>
      </div>

      {/* Input card */}
      <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-6 flex flex-col gap-5  relative z-10" style={{ animationDelay: '0.2s' }}>
        <div>
          <p className="text-gray-500 text-sm mb-1">Welcome, Trainer!</p>
          <h2 className="text-gray-800" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Enter your name to start
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Trainer Name</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && !isTransitioning && handleStart()}
            placeholder="e.g. Ash, Misty, Brock..."
            maxLength={20}
            disabled={isTransitioning}
            className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors"
            style={{
              borderColor: error ? '#FC8181' : '#E2E8F0',
              fontSize: '1rem',
              opacity: isTransitioning ? 0.6 : 1,
            }}
            onFocus={e => { if (!error && !isTransitioning) e.target.style.borderColor = '#CC0000'; }}
            onBlur={e => { if (!error) e.target.style.borderColor = '#E2E8F0'; }}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <button
          onClick={handleStart}
          disabled={isTransitioning}
          className="w-full py-3.5 rounded-xl font-bold text-white  "
          style={{
            background: isTransitioning
              ? '#94A3B8'
              : 'linear-gradient(135deg, #CC0000 0%, #FF4444 100%)',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(204,0,0,0.4)',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
          }}
        >
          {isTransitioning ? 'Starting Journey...' : 'Start Journey →'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Returning trainer? Enter your name to continue your journey.
        </p>
      </div>

      {/* Pokeball Transition Overlay */}
      {isTransitioning && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(160deg, #CC0000 0%, #FF4444 40%, #1a1a2e 100%)',
            zIndex: 9999,
          }}
        >
          <div
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              animation: 'pokeballExpand 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards, spin 0.8s linear infinite',
            }}
          >
            <PokeBall size={96} />
          </div>
        </div>
      )}
    </div>
  );
}
