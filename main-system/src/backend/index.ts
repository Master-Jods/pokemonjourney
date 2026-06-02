export { supabase } from './supabaseClient';

export type {
  GameHistoryEntry,
  HistoryLogInput,
  InventoryItem,
  ManualLogInput,
  OwnedPokemon,
  Player,
  PokemonSource,
  ServiceResult,
  SubsystemResult,
} from './types';

export { addHistoryLog } from './services/history';
export { findOrCreatePlayer, getPlayerByName, getPlayerCoins, updatePlayerCoins } from './services/players';
export {
  addCaughtPokemon,
  getOwnedPokemonBySpecies,
  updatePokemonLevel,
} from './services/pokemon';
export {
  buyStoreItem,
  consumeInventoryItem,
  evolvePokemon,
} from './services/inventory';
export { processSubsystemResult } from './services/results';
export { createManualLog } from './services/facilitator';
export { validateSubsystemResult } from './validators/subsystemResult';
