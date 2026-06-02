import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import {
  clampLevel,
  mapOwnedPokemon,
  OwnedPokemon,
  PlayerPokemonRow,
  PokemonSource,
  toPokemonDbId,
} from '../types';

/**
 * Adds a newly caught Pokemon to player_pokemon and logs the catch.
 */
export async function addCaughtPokemon(
  playerId: string,
  pokemonDataId: string | number,
  source: PokemonSource = 'Manual Log',
  coinsEarned = 0,
  gameName = 'Pokemon Catch',
  notes?: string,
  sourceSystem = source === 'Manual Log' ? 'facilitator' : source,
): Promise<OwnedPokemon> {
  const pokemonId = toPokemonDbId(pokemonDataId);

  const { data, error } = await supabase
    .from('player_pokemon')
    .insert({
      player_id: playerId,
      pokemon_id: pokemonId,
      level: 5,
      source,
      status: 'Active',
    })
    .select()
    .single<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to add caught Pokemon: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId,
    gameName,
    result: 'caught',
    coinsEarned,
    sourceSystem,
    loggedBy: notes ?? sourceSystem,
  });

  return mapOwnedPokemon(data);
}

async function getPlayerLevelCap(playerId: string): Promise<number> {
  try {
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from('inventory')
      .select('item_id, quantity')
      .eq('player_id', playerId);

    if (inventoryError || !inventoryRows || inventoryRows.length === 0) {
      return 20;
    }

    const itemIds = [...new Set(inventoryRows.map(row => row.item_id).filter(id => id !== null && id !== undefined))];
    if (itemIds.length === 0) {
      return 20;
    }

    const { data: itemRows, error: itemError } = await supabase
      .from('store_items')
      .select('id, item_name')
      .in('id', itemIds);

    if (itemError || !itemRows) {
      return 20;
    }

    const itemQtyMap = new Map<number, number>();
    for (const row of inventoryRows) {
      itemQtyMap.set(row.item_id, row.quantity ?? 0);
    }

    let maxBadgeNumber = 0;
    for (const item of itemRows) {
      const qty = itemQtyMap.get(item.id) ?? 0;
      if (qty <= 0) continue;

      const match = item.item_name.match(/Badge\s*(\d+)/i);
      if (match) {
        const badgeNum = parseInt(match[1], 10);
        if (badgeNum > maxBadgeNumber) {
          maxBadgeNumber = badgeNum;
        }
      }
    }

    if (maxBadgeNumber >= 5) return 100;
    if (maxBadgeNumber === 4) return 90;
    if (maxBadgeNumber === 3) return 70;
    if (maxBadgeNumber === 2) return 50;
    if (maxBadgeNumber === 1) return 40;
    return 20;
  } catch (err) {
    console.error('Error in getPlayerLevelCap:', err);
    return 20;
  }
}

/**
 * Increases a Pokemon level but never beyond level 100.
 */
export async function updatePokemonLevel(
  playerId: string,
  ownedPokemonId: string,
  levelGain: number,
  coinsEarned = 0,
  gameName = 'Level Update',
  result = 'level gained',
  sourceSystem = 'main_system',
  notes?: string,
): Promise<OwnedPokemon> {
  const { data: currentRow, error: fetchError } = await supabase
    .from('player_pokemon')
    .select()
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .single<PlayerPokemonRow>();

  if (fetchError) {
    throw new Error(`Failed to load Pokemon level: ${fetchError.message}`);
  }

  const safeLevelGain = Math.max(0, Math.trunc(levelGain));
  const levelCap = await getPlayerLevelCap(playerId);
  const nextLevel = currentRow.level >= levelCap ? currentRow.level : Math.min(levelCap, clampLevel(currentRow.level + safeLevelGain));

  const { data, error } = await supabase
    .from('player_pokemon')
    .update({ level: nextLevel })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .select()
    .single<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to update Pokemon level: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: data.pokedex_id,
    gameName,
    result,
    levelGain: nextLevel - currentRow.level,
    coinsEarned,
    sourceSystem,
    loggedBy: notes ?? sourceSystem,
  });

  return mapOwnedPokemon(data);
}

/**
 * Evolves an owned Pokemon after inventory service has confirmed/consumed the
 * required stone. This function only changes player_pokemon and logs evolution.
 */
export async function evolvePokemon(
  playerId: string,
  ownedPokemonId: string,
  newPokemonDataId: string | number,
  stoneName: string,
  sourceSystem = 'main_system',
): Promise<OwnedPokemon> {
  const newPokemonId = toPokemonDbId(newPokemonDataId);

  const { data, error } = await supabase
    .from('player_pokemon')
    .update({ pokemon_id: newPokemonId })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId)
    .select()
    .single<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to evolve Pokemon: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    pokemonId: newPokemonId,
    gameName: 'Evolution',
    result: 'evolved',
    sourceSystem,
    loggedBy: `Used ${stoneName}.`,
  });

  return mapOwnedPokemon(data);
}

export async function getOwnedPokemonBySpecies(
  playerId: string,
  pokemonDataId: string | number,
): Promise<OwnedPokemon | null> {
  const pokemonId = toPokemonDbId(pokemonDataId);

  const { data, error } = await supabase
    .from('player_pokemon')
    .select()
    .eq('player_id', playerId)
    .eq('pokemon_id', pokemonId)
    .maybeSingle<PlayerPokemonRow>();

  if (error) {
    throw new Error(`Failed to find owned Pokemon: ${error.message}`);
  }

  return data ? mapOwnedPokemon(data) : null;
}

