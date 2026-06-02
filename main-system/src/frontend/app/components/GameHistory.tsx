import { useState } from 'react';
import { GameHistoryEntry } from '../store/gameStore';
import { getPokemonById } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, PokeHeader, EmptyState } from './PokeShared';

interface Props {
  history: GameHistoryEntry[];
  playerName: string;
  onBack: () => void;
}

const RESULT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  selected: { bg: '#EBF8FF', text: '#2B6CB0', dot: '#4299E1' },
  caught: { bg: '#F0FFF4', text: '#276749', dot: '#38A169' },
  evolved: { bg: '#FAF5FF', text: '#44337A', dot: '#805AD5' },
  purchased: { bg: '#FFFFF0', text: '#744210', dot: '#D69E2E' },
  'used item': { bg: '#FFFFF0', text: '#744210', dot: '#D69E2E' },
  correct: { bg: '#F0FFF4', text: '#276749', dot: '#38A169' },
  win: { bg: '#F0FFF4', text: '#276749', dot: '#38A169' },
  wrong: { bg: '#FFF5F5', text: '#C53030', dot: '#FC8181' },
  lose: { bg: '#FFF5F5', text: '#C53030', dot: '#FC8181' },
  partial: { bg: '#FFFFF0', text: '#744210', dot: '#D69E2E' },
};

function getResultStyle(result: string) {
  const lower = result.toLowerCase();
  return RESULT_COLORS[lower] ?? { bg: '#F7FAFC', text: '#718096', dot: '#A0AEC0' };
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function GameHistory({ history, playerName, onBack }: Props) {
  const [filter, setFilter] = useState<'all' | 'caught' | 'level' | 'coins' | 'evolution' | 'store'>('all');

  const filterDefs: { key: typeof filter; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📜' },
    { key: 'caught', label: 'Caught', icon: '🎯' },
    { key: 'level', label: 'Levels', icon: '⬆️' },
    { key: 'coins', label: 'Coins', icon: '🪙' },
    { key: 'evolution', label: 'Evolution', icon: '✨' },
    { key: 'store', label: 'Store', icon: '🛒' },
  ];

  function matchFilter(entry: GameHistoryEntry): boolean {
    if (filter === 'all') return true;
    if (filter === 'caught') return entry.result === 'caught' || entry.result === 'selected';
    if (filter === 'level') return entry.levelGain > 0;
    if (filter === 'coins') return entry.coinsEarned !== 0;
    if (filter === 'evolution') return entry.result === 'evolved';
    if (filter === 'store') return entry.gameName === 'Pokémon Store';
    return true;
  }

  const filtered = history.filter(matchFilter);

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader
        title="Game History"
        onBack={onBack}
        rightContent={
          <span className="text-white/80 text-xs">{history.length} entries</span>
        }
      />

      {/* Filter tabs */}
      <div className="px-3 pt-3 flex gap-2 overflow-x-auto pb-2">
        {filterDefs.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap "
            style={{
              background: filter === f.key ? '#1a1a2e' : '#F1F5F9',
              color: filter === f.key ? '#FFDE00' : '#64748B',
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-3 pb-4 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState icon="📜" message="No history yet. Start playing to record your adventures!" />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(entry => {
              const resultStyle = getResultStyle(entry.result);
              const pd = entry.pokemonId ? getPokemonById(entry.pokemonId) : null;

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl p-3 border border-gray-100 flex gap-3"
                >
                  {/* Dot / sprite */}
                  <div className="flex-shrink-0 flex flex-col items-center pt-1 gap-1">
                    {pd ? (
                      <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={40} />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: resultStyle.bg }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: resultStyle.dot }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div>
                        <span className="font-semibold text-sm text-gray-800">{entry.gameName}</span>
                        {pd && <span className="text-xs text-gray-500"> • {pd.name}</span>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-gray-600 leading-relaxed mb-1">{entry.notes}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: resultStyle.bg, color: resultStyle.text }}
                      >
                        {entry.result}
                      </span>
                      {entry.levelGain > 0 && (
                        <span className="text-xs font-semibold text-blue-600">+{entry.levelGain} Lv</span>
                      )}
                      {entry.coinsEarned > 0 && (
                        <span className="text-xs font-semibold text-yellow-600">+🪙{entry.coinsEarned}</span>
                      )}
                      {entry.coinsEarned < 0 && (
                        <span className="text-xs font-semibold text-red-500">-🪙{Math.abs(entry.coinsEarned)}</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 mt-0.5">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
