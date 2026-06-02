import { useState } from 'react';
import { Player } from '../store/gameStore';
import { STORE_ITEMS } from '../../../../../shared/data/pokemonData';
import { CoinDisplay, PokeHeader, PokeCard } from './PokeShared';

interface Props {
  player: Player;
  onBuy: (itemName: string, price: number) => boolean;
  onBack: () => void;
}

export function PokemonStore({ player, onBuy, onBack }: Props) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  function handleBuy(itemName: string, price: number) {
    setBuying(itemName);
    const success = onBuy(itemName, price);
    if (success) {
      setMessage({ text: `${itemName} added to inventory!`, ok: true });
    } else {
      setMessage({ text: 'Not enough coins!', ok: false });
    }
    setBuying(null);
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader
        title="Pokémon Store"
        onBack={onBack}
        rightContent={<CoinDisplay coins={player.coins} />}
      />

      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* Balance card */}
        <PokeCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Your Balance</p>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '1.5rem' }}>🪙</span>
                <span className="font-bold text-gray-800" style={{ fontSize: '1.75rem' }}>{player.coins}</span>
                <span className="text-gray-500 text-sm">coins</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Earn more by</p>
              <p className="text-xs text-gray-400">winning games!</p>
            </div>
          </div>
        </PokeCard>

        {/* Toast message */}
        {message && (
          <div
            className="rounded-xl p-3 text-sm font-semibold text-center"
            style={{
              background: message.ok ? '#F0FFF4' : '#FFF5F5',
              color: message.ok ? '#276749' : '#C53030',
              border: `1px solid ${message.ok ? '#C6F6D5' : '#FED7D7'}`,
            }}
          >
            {message.ok ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Items */}
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Available Items</p>
          <div className="flex flex-col gap-3">
            {STORE_ITEMS.map((item, index) => {
              const canAfford = player.coins >= item.price;
              return (
                <PokeCard key={item.name} className="p-4 " style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: canAfford ? '#FFF5F5' : '#F7FAFC', fontSize: '1.75rem' }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <div className="flex items-center gap-1 font-bold" style={{ color: '#B7791F' }}>
                          <span>🪙</span>
                          <span>{item.price}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuy(item.name, item.price)}
                    disabled={!canAfford || buying === item.name}
                    className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm  "
                    style={{
                      background: canAfford ? 'linear-gradient(135deg, #CC0000, #FF4444)' : '#E2E8F0',
                      color: canAfford ? '#fff' : '#A0AEC0',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {canAfford ? `Buy for 🪙${item.price}` : `Need ${item.price - player.coins} more coins`}
                  </button>
                </PokeCard>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <PokeCard className="p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">💡 Tips</p>
          <ul className="text-xs text-gray-500 flex flex-col gap-1">
            <li>• Evolution stones are used to evolve Pokémon</li>
            <li>• Rare Candy adds +5 levels to any Pokémon</li>
            <li>• Earn coins by winning games and catching Pokémon</li>
          </ul>
        </PokeCard>
      </div>
    </div>
  );
}
