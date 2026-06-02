import { Player, OwnedPokemon } from '../store/gameStore';
import { getPokemonById } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, TypeBadge, CoinDisplay, LevelBadge, PokeCard, PokeBall } from './PokeShared';

type Page = 'dashboard' | 'starter' | 'pokedex' | 'store' | 'inventory' | 'evolution' | 'history' | 'facilitator' | 'subsystem';

interface Props {
  player: Player;
  ownedPokemon: OwnedPokemon[];
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function Dashboard({ player, ownedPokemon, onNavigate, onLogout }: Props) {
  const starter = player.starterPokemonId ? getPokemonById(player.starterPokemonId) : null;
  const starterOwned = starter ? ownedPokemon.find(o => o.pokemonDataId === starter.id) : null;
  const totalLevels = ownedPokemon.reduce((sum, p) => sum + p.level, 0);

  const navItems: { label: string; page: Page; icon: string; color: string }[] = [
    { label: 'Pokédex', page: 'pokedex', icon: '📔', color: '#2B6CB0' },
    { label: 'Starter', page: 'starter', icon: '⭐', color: '#D69E2E' },
    { label: 'Store', page: 'store', icon: '🛒', color: '#276749' },
    { label: 'Inventory', page: 'inventory', icon: '🎒', color: '#C05621' },
    { label: 'Evolution', page: 'evolution', icon: '✨', color: '#805AD5' },
    { label: 'History', page: 'history', icon: '📜', color: '#718096' },
    { label: 'Facilitator', page: 'facilitator', icon: '🔑', color: '#CC0000' },
    { label: 'Subsystem', page: 'subsystem', icon: '🔗', color: '#1a1a2e' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      {/* Player Card */}
      <PokeCard className="overflow-hidden ">
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF4444 100%)' }}
        >
          <div>
            <p className="text-white/80 text-xs">Trainer</p>
            <h2 className="text-white font-bold" style={{ fontSize: '1.25rem' }}>{player.name}</h2>
          </div>
          <div className="spin-slow">
            <PokeBall size={48} />
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Pokémon</p>
              <p className="font-bold text-gray-800">{ownedPokemon.length}</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Lvls</p>
              <p className="font-bold text-gray-800">{totalLevels}</p>
            </div>
          </div>
          <CoinDisplay coins={player.coins} />
        </div>
      </PokeCard>

      {/* Starter card */}
      {starter && starterOwned ? (
        <PokeCard className="p-4 " style={{ animationDelay: '0.1s' }}>
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Your Starter</p>
          <div className="flex items-center gap-4">
            <div
              className="rounded-2xl p-2 flex items-center justify-center"
              style={{ background: '#FFF5F5', border: '2px solid #FEB2B2' }}
            >
              <PokemonSprite spriteId={starter.spriteId} name={starter.name} size={64} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-800">{starter.name}</h3>
                <LevelBadge level={starterOwned.level} />
              </div>
              <div className="flex gap-1">
                <TypeBadge type={starter.type} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{starter.region} Region</p>
            </div>
          </div>
        </PokeCard>
      ) : (
        <button
          onClick={() => onNavigate('starter')}
          className="w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          style={{ borderColor: '#CC0000', color: '#CC0000', background: '#FFF5F5' }}
        >
          <span>⭐</span> Choose your Starter Pokémon
        </button>
      )}

      {/* Navigation grid */}
      <div className="" style={{ animationDelay: '0.2s' }}>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Features</p>
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item, index) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md   "
              style={{ animationDelay: `${0.3 + index * 0.05}s` }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-600 leading-tight text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Pokémon */}
      {ownedPokemon.length > 0 && (
        <div className="" style={{ animationDelay: '0.7s' }}>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Recent Pokémon</p>
          <PokeCard className="p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[...ownedPokemon].reverse().slice(0, 6).map((owned, index) => {
                const pd = getPokemonById(owned.pokemonDataId);
                if (!pd) return null;
                return (
                  <div key={owned.id} className="flex flex-col items-center gap-1 min-w-[60px] " style={{ animationDelay: `${0.8 + index * 0.1}s` }}>
                    <div className="float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={52} />
                    </div>
                    <span className="text-xs text-gray-600 text-center leading-tight">{pd.name}</span>
                    <LevelBadge level={owned.level} />
                  </div>
                );
              })}
            </div>
          </PokeCard>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="text-sm text-gray-400 underline text-center mt-2"
      >
        Switch Trainer
      </button>
    </div>
  );
}
