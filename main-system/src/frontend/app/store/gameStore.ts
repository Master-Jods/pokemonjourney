import { useReducer, useCallback } from 'react';
import { getPokemonByName } from '../../../../../shared/data/pokemonData';

export interface Player {
  id: string;
  name: string;
  section?: string;
  assignedJourney?: string;
  starterPokemonId?: string;
  coins: number;
  createdAt: string;
}

export interface OwnedPokemon {
  id: string;
  playerId: string;
  pokemonDataId: string;
  level: number;
  source: 'Starter' | 'PokeReflex' | 'PokeGuess' | 'IRL Catch' | 'Manual Log';
  status: 'Active';
  caughtAt: string;
}

export interface InventoryItem {
  itemName: string;
  quantity: number;
}

export interface GameHistoryEntry {
  id: string;
  playerId: string;
  pokemonId?: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
  notes?: string;
  createdAt: string;
}

export interface GameState {
  players: Player[];
  ownedPokemon: OwnedPokemon[];
  inventory: Record<string, InventoryItem[]>;
  history: GameHistoryEntry[];
  currentPlayerId: string | null;
}

type Action =
  | { type: 'SET_PLAYER'; playerId: string }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'SET_STARTER'; playerId: string; pokemonDataId: string; owned: OwnedPokemon; entry: GameHistoryEntry }
  | { type: 'ADD_COINS'; playerId: string; amount: number }
  | { type: 'BUY_ITEM'; playerId: string; itemName: string; price: number; entry: GameHistoryEntry }
  | { type: 'EVOLVE'; playerId: string; ownedId: string; newPokemonDataId: string; stoneName: string; entry: GameHistoryEntry }
  | { type: 'UPDATE_LEVEL'; playerId: string; ownedId: string; levelGain: number; coinsEarned: number; entry: GameHistoryEntry }
  | { type: 'ADD_POKEMON'; playerId: string; owned: OwnedPokemon; coinsEarned: number; entry: GameHistoryEntry }
  | { type: 'USE_RARE_CANDY'; playerId: string; ownedId: string; entry: GameHistoryEntry }
  | { type: 'ADD_HISTORY'; entry: GameHistoryEntry }
  | { type: 'LOGOUT' };

const STORAGE_KEY = 'pokejourney_v1';

const DEFAULT_STATE: GameState = {
  players: [],
  ownedPokemon: [],
  inventory: {},
  history: [],
  currentPlayerId: null,
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_STATE;
}

function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function reduceInventory(inv: InventoryItem[], itemName: string, delta: number): InventoryItem[] {
  const existing = inv.find(i => i.itemName === itemName);
  if (delta > 0) {
    return existing
      ? inv.map(i => i.itemName === itemName ? { ...i, quantity: i.quantity + delta } : i)
      : [...inv, { itemName, quantity: delta }];
  }
  return inv
    .map(i => i.itemName === itemName ? { ...i, quantity: i.quantity + delta } : i)
    .filter(i => i.quantity > 0);
}

function reducer(state: GameState, action: Action): GameState {
  let next: GameState;
  switch (action.type) {
    case 'SET_PLAYER':
      next = { ...state, currentPlayerId: action.playerId };
      break;
    case 'ADD_PLAYER':
      next = {
        ...state,
        players: [...state.players, action.player],
        inventory: { ...state.inventory, [action.player.id]: [] },
        currentPlayerId: action.player.id,
      };
      break;
    case 'SET_STARTER':
      next = {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, starterPokemonId: action.pokemonDataId } : p
        ),
        ownedPokemon: [...state.ownedPokemon, action.owned],
        history: [...state.history, action.entry],
      };
      break;
    case 'ADD_COINS':
      next = {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, coins: Math.max(0, p.coins + action.amount) } : p
        ),
      };
      break;
    case 'BUY_ITEM': {
      const inv = state.inventory[action.playerId] ?? [];
      next = {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, coins: p.coins - action.price } : p
        ),
        inventory: { ...state.inventory, [action.playerId]: reduceInventory(inv, action.itemName, 1) },
        history: [...state.history, action.entry],
      };
      break;
    }
    case 'EVOLVE': {
      const inv = state.inventory[action.playerId] ?? [];
      next = {
        ...state,
        ownedPokemon: state.ownedPokemon.map(p =>
          p.id === action.ownedId ? { ...p, pokemonDataId: action.newPokemonDataId } : p
        ),
        inventory: { ...state.inventory, [action.playerId]: reduceInventory(inv, action.stoneName, -1) },
        history: [...state.history, action.entry],
      };
      break;
    }
    case 'UPDATE_LEVEL':
      next = {
        ...state,
        ownedPokemon: state.ownedPokemon.map(p =>
          p.id === action.ownedId ? { ...p, level: p.level + action.levelGain } : p
        ),
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, coins: Math.max(0, p.coins + action.coinsEarned) } : p
        ),
        history: [...state.history, action.entry],
      };
      break;
    case 'ADD_POKEMON':
      next = {
        ...state,
        ownedPokemon: [...state.ownedPokemon, action.owned],
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, coins: Math.max(0, p.coins + action.coinsEarned) } : p
        ),
        history: [...state.history, action.entry],
      };
      break;
    case 'USE_RARE_CANDY': {
      const inv2 = state.inventory[action.playerId] ?? [];
      next = {
        ...state,
        ownedPokemon: state.ownedPokemon.map(p =>
          p.id === action.ownedId ? { ...p, level: p.level + 5 } : p
        ),
        inventory: { ...state.inventory, [action.playerId]: reduceInventory(inv2, 'Rare Candy', -1) },
        history: [...state.history, action.entry],
      };
      break;
    }
    case 'ADD_HISTORY':
      next = { ...state, history: [...state.history, action.entry] };
      break;
    case 'LOGOUT':
      next = { ...state, currentPlayerId: null };
      break;
    default:
      return state;
  }
  saveState(next);
  return next;
}

function makeEntry(base: Omit<GameHistoryEntry, 'id' | 'createdAt'>): GameHistoryEntry {
  return {
    ...base,
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
}

export function useGameStore() {
  const [state, dispatch] = useReducer(reducer, loadState());

  const currentPlayer = state.players.find(p => p.id === state.currentPlayerId) ?? null;

  const getPlayerPokemon = useCallback(
    (playerId: string) => state.ownedPokemon.filter(p => p.playerId === playerId),
    [state.ownedPokemon]
  );

  const getPlayerInventory = useCallback(
    (playerId: string) => state.inventory[playerId] ?? [],
    [state.inventory]
  );

  const getPlayerHistory = useCallback(
    (playerId: string) =>
      [...state.history.filter(h => h.playerId === playerId)].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [state.history]
  );

  const findOrCreatePlayer = useCallback(
    (name: string): { player: Player; isNew: boolean } => {
      const existing = state.players.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        dispatch({ type: 'SET_PLAYER', playerId: existing.id });
        return { player: existing, isNew: false };
      }
      const player: Player = {
        id: `pl_${Date.now()}`,
        name: name.trim(),
        coins: 0,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_PLAYER', player });
      return { player, isNew: true };
    },
    [state.players]
  );

  const setStarterPokemon = useCallback((playerId: string, pokemonDataId: string, pokemonName: string) => {
    const owned: OwnedPokemon = {
      id: `own_${Date.now()}`,
      playerId,
      pokemonDataId,
      level: 5,
      source: 'Starter',
      status: 'Active',
      caughtAt: new Date().toISOString(),
    };
    dispatch({
      type: 'SET_STARTER',
      playerId,
      pokemonDataId,
      owned,
      entry: makeEntry({
        playerId,
        pokemonId: pokemonDataId,
        gameName: 'Starter Selection',
        result: 'selected',
        levelGain: 0,
        coinsEarned: 0,
        sourceSystem: 'main_system',
        notes: `${state.players.find(p => p.id === playerId)?.name} selected ${pokemonName} as starter.`,
      }),
    });
  }, [state.players]);

  const buyItem = useCallback(
    (playerId: string, itemName: string, price: number): boolean => {
      const player = state.players.find(p => p.id === playerId);
      if (!player || player.coins < price) return false;
      dispatch({
        type: 'BUY_ITEM',
        playerId,
        itemName,
        price,
        entry: makeEntry({
          playerId,
          gameName: 'Pokémon Store',
          result: 'purchased',
          levelGain: 0,
          coinsEarned: -price,
          sourceSystem: 'store',
          notes: `${player.name} bought ${itemName}.`,
        }),
      });
      return true;
    },
    [state.players]
  );

  const evolvePokemon = useCallback(
    (playerId: string, ownedId: string, newPokemonDataId: string, newName: string, stoneName: string): boolean => {
      const inv = state.inventory[playerId] ?? [];
      const stone = inv.find(i => i.itemName === stoneName);
      if (!stone || stone.quantity < 1) return false;
      const player = state.players.find(p => p.id === playerId);
      dispatch({
        type: 'EVOLVE',
        playerId,
        ownedId,
        newPokemonDataId,
        stoneName,
        entry: makeEntry({
          playerId,
          pokemonId: newPokemonDataId,
          gameName: 'Evolution',
          result: 'evolved',
          levelGain: 0,
          coinsEarned: 0,
          sourceSystem: 'main_system',
          notes: `${player?.name} evolved to ${newName} using ${stoneName}.`,
        }),
      });
      return true;
    },
    [state.inventory, state.players]
  );

  const updatePokemonLevel = useCallback(
    (playerId: string, ownedId: string, levelGain: number, coinsEarned: number, gameName: string, result: string, sourceSystem: string, notes?: string) => {
      dispatch({
        type: 'UPDATE_LEVEL',
        playerId,
        ownedId,
        levelGain,
        coinsEarned,
        entry: makeEntry({ playerId, gameName, result, levelGain, coinsEarned, sourceSystem, notes }),
      });
    },
    []
  );

  const addPokemonToPlayer = useCallback(
    (playerId: string, pokemonDataId: string, source: OwnedPokemon['source'], coinsEarned: number, gameName: string, notes?: string): OwnedPokemon => {
      const owned: OwnedPokemon = {
        id: `own_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        playerId,
        pokemonDataId,
        level: 5,
        source,
        status: 'Active',
        caughtAt: new Date().toISOString(),
      };
      dispatch({
        type: 'ADD_POKEMON',
        playerId,
        owned,
        coinsEarned,
        entry: makeEntry({ playerId, pokemonId: pokemonDataId, gameName, result: 'caught', levelGain: 0, coinsEarned, sourceSystem: 'main_system', notes }),
      });
      return owned;
    },
    []
  );

  const useRareCandy = useCallback(
    (playerId: string, ownedId: string, pokemonName: string): boolean => {
      const inv = state.inventory[playerId] ?? [];
      const candy = inv.find(i => i.itemName === 'Rare Candy');
      if (!candy || candy.quantity < 1) return false;
      const player = state.players.find(p => p.id === playerId);
      dispatch({
        type: 'USE_RARE_CANDY',
        playerId,
        ownedId,
        entry: makeEntry({
          playerId,
          gameName: 'Inventory',
          result: 'used item',
          levelGain: 5,
          coinsEarned: 0,
          sourceSystem: 'main_system',
          notes: `${player?.name} used Rare Candy on ${pokemonName} (+5 levels).`,
        }),
      });
      return true;
    },
    [state.inventory, state.players]
  );

  const processSubsystemResult = useCallback(
    (result: {
      playerName: string;
      pokemonName?: string;
      gameName: string;
      result: string;
      levelGain: number;
      coinsEarned: number;
      sourceSystem: string;
    }): { success: boolean; message: string } => {
      const player = state.players.find(p => p.name.toLowerCase() === result.playerName.toLowerCase());
      if (!player) return { success: false, message: `Player "${result.playerName}" not found.` };

      const pd = result.pokemonName ? getPokemonByName(result.pokemonName) : undefined;
      const ownedMatch = pd
        ? state.ownedPokemon.find(o => o.playerId === player.id && o.pokemonDataId === pd.id)
        : undefined;

      if (result.result === 'caught' && pd && !ownedMatch) {
        addPokemonToPlayer(player.id, pd.id, result.sourceSystem.includes('catch') ? 'PokeReflex' : 'Manual Log', result.coinsEarned, result.gameName, `${player.name} caught ${pd.name} through ${result.gameName}.`);
      } else if (ownedMatch && result.levelGain > 0) {
        updatePokemonLevel(player.id, ownedMatch.id, result.levelGain, result.coinsEarned, result.gameName, result.result, result.sourceSystem, `${player.name} gained +${result.levelGain} levels from ${result.gameName}.`);
      } else {
        dispatch({
          type: 'ADD_HISTORY',
          entry: makeEntry({
            playerId: player.id,
            pokemonId: ownedMatch?.pokemonDataId,
            gameName: result.gameName,
            result: result.result,
            levelGain: result.levelGain,
            coinsEarned: result.coinsEarned,
            sourceSystem: result.sourceSystem,
          }),
        });
        if (result.coinsEarned > 0) {
          dispatch({ type: 'ADD_COINS', playerId: player.id, amount: result.coinsEarned });
        }
      }
      return { success: true, message: `Result processed for ${player.name}.` };
    },
    [state.players, state.ownedPokemon, addPokemonToPlayer, updatePokemonLevel]
  );

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  return {
    state,
    currentPlayer,
    getPlayerPokemon,
    getPlayerInventory,
    getPlayerHistory,
    findOrCreatePlayer,
    setStarterPokemon,
    buyItem,
    evolvePokemon,
    updatePokemonLevel,
    addPokemonToPlayer,
    useRareCandy,
    processSubsystemResult,
    logout,
  };
}
