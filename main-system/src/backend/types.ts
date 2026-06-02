/**
 * Database row types mirror the updated Supabase schema guide.
 * Keep these snake_case because they represent actual table columns.
 */
export interface PlayerRow {
  id: string;
  player_name: string;
  section: string | null;
  assigned_journey: string | null;
  pokedex_id: number | null;
  created_at: string;
}

export interface WalletRow {
  id: string;
  player_id: string;
  coin_balance: number;
}

export interface PokemonRow {
  id: number;
  pokedex_id: number | null;
  pokemon_name: string;
  type: string;
  region: string;
  image: string | null;
  evolution_stage: number;
  evolves_to: number | null;
  required_stone: string | null;
}

export interface PlayerPokemonRow {
  id: string;
  player_id: string;
  pokedex_id: number;
  level: number;
  source: PokemonSource;
  status: PokemonStatus;
  created_at: string;
}

export interface StoreItemRow {
  id: number;
  item_name: string;
  price: number;
  effect: string;
  compatible_type: string | null;
}

export interface InventoryRow {
  id: string;
  player_id: string;
  item_id: number;
  quantity: number;
}

export interface GameLogRow {
  id: string;
  player_id: string;
  pokemon_id: number | null;
  game_name: string;
  result: string;
  level_gain: number;
  coins_earned: number;
  source_system: string;
  logged_by: string | null;
  created_at: string;
}

/**
 * App-facing types use camelCase so frontend code does not need to know the
 * database column naming style.
 */
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
  source: PokemonSource;
  status: PokemonStatus;
  caughtAt: string;
}

export interface InventoryItem {
  id: string;
  playerId: string;
  itemId: number;
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
  loggedBy?: string;
  createdAt: string;
}

export type PokemonSource = 'Starter' | 'PokeReflex' | 'PokeGuess' | 'IRL Catch' | 'Manual Log';
export type PokemonStatus = 'Active' | 'Inactive';

export interface HistoryLogInput {
  playerId: string;
  pokemonId?: string | number | null;
  gameName: string;
  result: string;
  levelGain?: number;
  coinsEarned?: number;
  sourceSystem: string;
  loggedBy?: string | null;
  notes?: string | null;
}

export interface SubsystemResult {
  playerName: string;
  pokemonName?: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
}

export interface ManualLogInput {
  playerId: string;
  ownedPokemonId?: string | null;
  pokemonDataId?: string | null;
  levelGain: number;
  coinsEarned: number;
  gameName: string;
  result: string;
  sourceSystem?: string;
  notes?: string;
  addNewPokemon?: boolean;
}

export interface ServiceResult<T> {
  data: T;
  message: string;
}

export function toPokemonDbId(pokemonId: string | number | null | undefined): number | null {
  if (pokemonId === null || pokemonId === undefined || pokemonId === '') return null;
  const value = typeof pokemonId === 'number' ? pokemonId : Number.parseInt(pokemonId, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid pokemon id: ${pokemonId}`);
  }
  return value;
}

export function toPokemonDataId(pokemonId: number | null | undefined): string | undefined {
  if (pokemonId === null || pokemonId === undefined) return undefined;
  return String(pokemonId).padStart(3, '0');
}

export function mapPlayer(row: PlayerRow, coins = 0): Player {
  return {
    id: row.id,
    name: row.player_name,
    section: row.section ?? undefined,
    assignedJourney: row.assigned_journey ?? undefined,
    starterPokemonId: toPokemonDataId(row.pokedex_id),
    coins,
    createdAt: row.created_at,
  };
}

export function mapOwnedPokemon(row: PlayerPokemonRow): OwnedPokemon {
  return {
    id: row.id,
    playerId: row.player_id,
    pokemonDataId: toPokemonDataId(row.pokedex_id) ?? String(row.pokedex_id),
    level: row.level,
    source: row.source,
    status: row.status,
    caughtAt: row.created_at,
  };
}

export function mapInventoryItem(row: InventoryRow, itemName: string): InventoryItem {
  return {
    id: row.id,
    playerId: row.player_id,
    itemId: row.item_id,
    itemName,
    quantity: row.quantity,
  };
}

export function mapHistoryEntry(row: GameLogRow): GameHistoryEntry {
  return {
    id: row.id,
    playerId: row.player_id,
    pokemonId: toPokemonDataId(row.pokemon_id),
    gameName: row.game_name,
    result: row.result,
    levelGain: row.level_gain,
    coinsEarned: row.coins_earned,
    sourceSystem: row.source_system,
    loggedBy: row.logged_by ?? undefined,
    createdAt: row.created_at,
  };
}

export function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.trunc(level)));
}

export function clampCoins(coins: number): number {
  return Math.max(0, Math.trunc(coins));
}

