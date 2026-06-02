import { supabase } from './supabaseClient';
import { GameLogRow, InventoryRow, PlayerPokemonRow, PlayerRow, PokemonRow, StoreItemRow, WalletRow, toPokemonDataId } from './types';
import { POKEMON_DATABASE, STORE_ITEMS, StoreItem } from '../../../shared/data/pokemonData';

/**
 * Compatibility service for the current frontend App.tsx.
 *
 * The frontend still expects older field names like player_id, player_name,
 * coin_balance, pokedex_id, and pokemon_id. This file keeps that shape while
 * querying the updated Supabase tables:
 * players, wallets, player_pokemon.
 */

type FrontendPlayer = {
  player_id: string;
  player_name: string;
  coin_balance: number;
  starter_pokemon_id: string | null;
};

type FrontendPokedexRow = {
  pokedex_id: string;
  player_id: string;
  pokemon_id: string;
  level: number;
  source: string;
  status: string;
};

type FrontendInventory = Record<string, number>;

type FrontendHistoryEntry = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  pokemonId?: string;
  levelGain?: number;
  result?: string;
  sourceSystem?: string;
};

function mapFrontendPlayer(player: PlayerRow, wallet?: WalletRow | null): FrontendPlayer {
  return {
    player_id: player.id,
    player_name: player.player_name,
    coin_balance: wallet?.coin_balance ?? 0,
    starter_pokemon_id: toPokemonDataId(player.pokedex_id) ?? null,
  };
}

function mapFrontendPokedex(row: PlayerPokemonRow): FrontendPokedexRow {
  return {
    pokedex_id: row.id,
    player_id: row.player_id,
    pokemon_id: toPokemonDataId(row.pokedex_id) ?? String(row.pokedex_id),
    level: row.level,
    source: row.source,
    status: row.status,
  };
}

function mapFrontendHistory(
  row: GameLogRow,
  playerName?: string,
  pokemonMap?: Map<number, string>
): FrontendHistoryEntry {
  const pName = playerName ?? 'Trainer';
  const pMap = pokemonMap ?? new Map<number, string>();

  let detail = row.logged_by ?? '';

  if (row.source_system === 'catching_subsystem') {
    let pokemonName = 'a Pokémon';
    if (row.pokemon_id) {
      const localPokemon = POKEMON_DATABASE.find(p => Number.parseInt(p.id, 10) === row.pokemon_id);
      pokemonName = localPokemon?.name ?? pMap.get(row.pokemon_id) ?? 'a Pokémon';
    }
    detail = `${row.game_name}: ${pName} caught ${pokemonName} and earned ${row.coins_earned} coins.`;
  } else if (row.source_system === 'leveling_subsystem') {
    let pokemonName = 'a Pokémon';
    if (row.pokemon_id) {
      const localPokemon = POKEMON_DATABASE.find(p => Number.parseInt(p.id, 10) === row.pokemon_id);
      pokemonName = localPokemon?.name ?? pMap.get(row.pokemon_id) ?? 'a Pokémon';
    }
    detail = `${row.game_name}: ${pName} leveled up ${pokemonName} and earned ${row.coins_earned} coins.`;
  } else if (row.source_system === 'main_system' && row.result === 'evolved' && row.logged_by) {
    detail = row.logged_by.replace(' evolved his ', ' evolved ');
  } else {
    const fallbackDetailParts = [
      row.result,
      row.level_gain > 0 ? `+${row.level_gain} levels` : '',
      row.coins_earned ? `${row.coins_earned > 0 ? '+' : ''}${row.coins_earned} coins` : '',
    ].filter(Boolean);
    detail = row.logged_by ?? (fallbackDetailParts.join(' · ') || row.result);
  }

  return {
    id: row.id,
    title: row.game_name,
    detail,
    createdAt: new Date(row.created_at).toLocaleString(),
    pokemonId: toPokemonDataId(row.pokemon_id),
    levelGain: row.level_gain,
    result: row.result,
    sourceSystem: row.source_system,
  };
}

async function addFrontendHistoryLog(input: {
  playerId: string;
  title: string;
  detail: string;
  result: string;
  sourceSystem: string;
  coinsEarned?: number;
  levelGain?: number;
  pokemonId?: number | null;
}): Promise<FrontendHistoryEntry> {
  const { data, error } = await supabase
    .from('game_logs')
    .insert({
      player_id: input.playerId,
      pokemon_id: input.pokemonId ?? null,
      game_name: input.title,
      result: input.result,
      level_gain: Math.max(0, Math.trunc(input.levelGain ?? 0)),
      coins_earned: Math.trunc(input.coinsEarned ?? 0),
      source_system: input.sourceSystem,
      logged_by: input.detail,
    })
    .select()
    .single<GameLogRow>();

  if (error) {
    throw new Error(`Failed to save history: ${error.message}`);
  }

  const { data: player } = await supabase
    .from('players')
    .select('player_name')
    .eq('id', input.playerId)
    .maybeSingle();
  const playerName = player?.player_name ?? 'Trainer';

  return mapFrontendHistory(data, playerName, new Map());
}

async function getWallet(playerId: string): Promise<WalletRow | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select()
    .eq('player_id', playerId)
    .maybeSingle<WalletRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureWallet(playerId: string): Promise<WalletRow> {
  const existing = await getWallet(playerId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('wallets')
    .insert({ player_id: playerId, coin_balance: 0 })
    .select()
    .single<WalletRow>();

  if (error) {
    throw error;
  }

  return data;
}

function mapInventory(rows: InventoryRow[], itemById: Map<number, StoreItemRow>): FrontendInventory {
  return rows.reduce<FrontendInventory>((inventory, row) => {
    const item = itemById.get(row.item_id);
    if (item && row.quantity > 0) {
      inventory[item.item_name] = row.quantity;
    }
    return inventory;
  }, {});
}

async function ensureStoreItem(item: StoreItem): Promise<StoreItemRow> {
  const { data: existing, error: findError } = await supabase
    .from('store_items')
    .select()
    .ilike('item_name', item.name)
    .maybeSingle<StoreItemRow>();

  if (findError) {
    throw findError;
  }

  if (existing) {
    if (existing.price === item.price && existing.effect === item.description) {
      return existing;
    }

    const { data, error } = await supabase
      .from('store_items')
      .update({
        price: item.price,
        effect: item.description,
        compatible_type: item.isStone ? item.name.replace(' Stone', '') : null,
      })
      .eq('id', existing.id)
      .select()
      .single<StoreItemRow>();

    if (error) {
      throw new Error(`Failed to update store item "${item.name}": ${error.message}`);
    }

    return data;
  }

  const { data, error } = await supabase
    .from('store_items')
    .insert({
      item_name: item.name,
      price: item.price,
      effect: item.description,
      compatible_type: item.isStone ? item.name.replace(' Stone', '') : null,
    })
    .select()
    .single<StoreItemRow>();

  if (error) {
    throw new Error(`Failed to create store item "${item.name}": ${error.message}`);
  }

  return data;
}

export async function ensureAllStoreItems(): Promise<void> {
  try {
    for (const item of STORE_ITEMS) {
      await ensureStoreItem(item);
    }
  } catch (err) {
    console.error('Failed to ensure store items in DB:', err);
  }
}

async function getInventoryRow(playerId: string, itemId: number): Promise<InventoryRow | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select()
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .maybeSingle<InventoryRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function saveInventoryQuantity(playerId: string, itemId: number, quantity: number): Promise<void> {
  const existing = await getInventoryRow(playerId, itemId);
  const nextQuantity = Math.max(0, Math.trunc(quantity));

  if (existing) {
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: nextQuantity })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase
    .from('inventory')
    .insert({ player_id: playerId, item_id: itemId, quantity: nextQuantity });

  if (error) {
    throw new Error(`Failed to create inventory item: ${error.message}`);
  }
}

async function setWalletCoins(playerId: string, coins: number): Promise<number> {
  const { data, error } = await supabase
    .from('wallets')
    .update({ coin_balance: Math.max(0, Math.trunc(coins)) })
    .eq('player_id', playerId)
    .select()
    .single<WalletRow>();

  if (error) {
    throw new Error(`Failed to update wallet: ${error.message}`);
  }

  return data.coin_balance;
}

export async function getPlayerInventory(playerId: string): Promise<FrontendInventory> {
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('inventory')
    .select()
    .eq('player_id', playerId);

  if (inventoryError) {
    throw new Error(`Failed to load inventory: ${inventoryError.message}`);
  }

  const itemIds = [...new Set((inventoryRows ?? []).map(row => row.item_id))];
  if (itemIds.length === 0) return {};

  const { data: itemRows, error: itemError } = await supabase
    .from('store_items')
    .select()
    .in('id', itemIds);

  if (itemError) {
    throw new Error(`Failed to load store items: ${itemError.message}`);
  }

  return mapInventory(inventoryRows ?? [], new Map((itemRows ?? []).map(row => [row.id, row as StoreItemRow])));
}

export async function getPlayerLevelCap(playerId: string): Promise<number> {
  try {
    const inventory = await getPlayerInventory(playerId);
    
    let maxBadgeNumber = 0;
    for (const itemName of Object.keys(inventory)) {
      const quantity = inventory[itemName];
      if (quantity <= 0) continue;

      const match = itemName.match(/Badge\s*(\d+)/i);
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
  } catch (error) {
    console.error('Error fetching player level cap, defaulting to 20:', error);
    return 20;
  }
}

export async function getPlayerHistory(playerId: string): Promise<FrontendHistoryEntry[]> {
  const { data: logs, error } = await supabase
    .from('game_logs')
    .select()
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  const { data: player } = await supabase
    .from('players')
    .select('player_name')
    .eq('id', playerId)
    .maybeSingle();
  const playerName = player?.player_name ?? 'Trainer';

  const pokemonIds = [...new Set((logs ?? []).map(row => row.pokemon_id).filter(Boolean) as number[])];
  const pokemonMap = new Map<number, string>();
  if (pokemonIds.length > 0) {
    const { data: pokemonRows } = await supabase
      .from('pokemon')
      .select('pokedex_id, pokemon_name')
      .in('pokedex_id', pokemonIds);
    (pokemonRows ?? []).forEach(p => {
      if (p.pokedex_id) {
        pokemonMap.set(p.pokedex_id, p.pokemon_name);
      }
    });
  }

  return (logs ?? []).map(row => mapFrontendHistory(row as GameLogRow, playerName, pokemonMap));
}

export async function getPlayerCoins(playerId: string): Promise<number> {
  const wallet = await getWallet(playerId);
  return wallet?.coin_balance ?? 0;
}

export async function buyStoreItem(
  playerId: string,
  item: StoreItem,
  playerName: string,
): Promise<{ coins: number; inventory: FrontendInventory; history: FrontendHistoryEntry }> {
  const storeItem = await ensureStoreItem(item);
  const wallet = await ensureWallet(playerId);

  if (wallet.coin_balance < item.price) {
    throw new Error(`Not enough coins to buy ${item.name}.`);
  }

  const existing = await getInventoryRow(playerId, storeItem.id);
  const coins = await setWalletCoins(playerId, wallet.coin_balance - item.price);
  await saveInventoryQuantity(playerId, storeItem.id, (existing?.quantity ?? 0) + 1);
  const history = await addFrontendHistoryLog({
    playerId,
    title: 'Pokémon Store',
    detail: `${playerName} bought ${item.name}.`,
    result: 'purchased',
    sourceSystem: 'store',
    coinsEarned: -item.price,
  });

  return { coins, inventory: await getPlayerInventory(playerId), history };
}

export async function evolveOwnedPokemon(
  playerId: string,
  ownedPokemonId: string,
  nextPokemonDataId: string,
  stoneName: string,
  playerName: string,
  currentPokemonName: string,
  nextPokemonName: string,
): Promise<{ inventory: FrontendInventory; history: FrontendHistoryEntry }> {
  const nextPokedexId = Number.parseInt(nextPokemonDataId, 10);
  await ensurePokemonInDb(nextPokedexId);

  const { error } = await supabase
    .from('player_pokemon')
    .update({ pokedex_id: nextPokedexId })
    .eq('id', ownedPokemonId)
    .eq('player_id', playerId);

  if (error) {
    throw new Error(`Failed to evolve Pokémon: ${error.message}`);
  }

  if (stoneName) {
    const stone = STORE_ITEMS.find(item => item.name === stoneName);
    if (!stone) {
      throw new Error(`Unknown evolution item: ${stoneName}`);
    }

    const storeItem = await ensureStoreItem(stone);
    const existing = await getInventoryRow(playerId, storeItem.id);
    if (!existing || existing.quantity < 1) {
      throw new Error(`Not enough ${stoneName} in inventory.`);
    }

    await saveInventoryQuantity(playerId, storeItem.id, existing.quantity - 1);
  }

  const history = await addFrontendHistoryLog({
    playerId,
    title: 'Evolution',
    detail: `${playerName} evolved ${currentPokemonName} to ${nextPokemonName}.`,
    result: 'evolved',
    sourceSystem: 'main_system',
    pokemonId: nextPokedexId,
  });

  return { inventory: await getPlayerInventory(playerId), history };
}

export async function findOrCreatePlayer(playerName: string): Promise<FrontendPlayer> {
  const cleanName = playerName.trim();
  if (!cleanName) {
    throw new Error('Player name is required.');
  }

  // Pre-seed all store items dynamically to support badges
  await ensureAllStoreItems();

  const { data: existingPlayer, error: findError } = await supabase
    .from('players')
    .select()
    .ilike('player_name', cleanName)
    .maybeSingle<PlayerRow>();

  if (findError) {
    throw findError;
  }

  if (existingPlayer) {
    const wallet = await ensureWallet(existingPlayer.id);
    return mapFrontendPlayer(existingPlayer, wallet);
  }

  const { data: newPlayer, error: createError } = await supabase
    .from('players')
    .insert({ player_name: cleanName })
    .select()
    .single<PlayerRow>();

  if (createError) {
    throw createError;
  }

  const wallet = await ensureWallet(newPlayer.id);
  await addFrontendHistoryLog({
    playerId: newPlayer.id,
    title: 'Journey Started',
    detail: `${newPlayer.player_name} began a Pokémon adventure.`,
    result: 'started',
    sourceSystem: 'main_system',
  });
  return mapFrontendPlayer(newPlayer, wallet);
}

export async function getPlayerDashboardStats(playerId: string) {
  const { data: pokedex, error } = await supabase
    .from('player_pokemon')
    .select()
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  const mappedPokedex = (pokedex ?? []).map(mapFrontendPokedex);
  const totalPokemonCaught = mappedPokedex.length;
  const totalLevelPoints = mappedPokedex.reduce((sum, pokemon) => sum + (pokemon.level ?? 0), 0);

  return {
    pokedex: mappedPokedex,
    totalPokemonCaught,
    totalLevelPoints,
  };
}

function toTitleCase(str: string): string {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function findNextEvolutionInChain(chain: any, currentSpeciesName: string): { name: string; url: string; item: string | null } | null {
  const current = currentSpeciesName.toLowerCase();
  
  if (chain.species.name === current) {
    if (chain.evolves_to && chain.evolves_to.length > 0) {
      const next = chain.evolves_to[0];
      const details = next.evolution_details?.[0] || null;
      const itemName = details?.item?.name || null;
      return {
        name: next.species.name,
        url: next.species.url,
        item: itemName ? toTitleCase(itemName) : null
      };
    }
    return null;
  }
  
  if (chain.evolves_to) {
    for (const child of chain.evolves_to) {
      const result = findNextEvolutionInChain(child, currentSpeciesName);
      if (result) return result;
    }
  }
  
  return null;
}

function findStageInChain(chain: any, currentSpeciesName: string, currentStage = 1): number {
  const current = currentSpeciesName.toLowerCase();
  if (chain.species.name === current) {
    return currentStage;
  }
  if (chain.evolves_to) {
    for (const child of chain.evolves_to) {
      const stage = findStageInChain(child, currentSpeciesName, currentStage + 1);
      if (stage > 0) return stage;
    }
  }
  return 0;
}

export async function ensurePokemonInDb(pokedexIdNum: number): Promise<PokemonRow> {
  // 1. Query by pokedex_id = pokedexIdNum
  const { data: pokedexRows, error: pokedexError } = await supabase
    .from('pokemon')
    .select()
    .eq('pokedex_id', pokedexIdNum);

  if (pokedexError) {
    throw pokedexError;
  }

  // 2. Query by id = pokedexIdNum
  const { data: idRows, error: idError } = await supabase
    .from('pokemon')
    .select()
    .eq('id', pokedexIdNum);

  if (idError) {
    throw idError;
  }

  const pokedexRow = pokedexRows?.[0] as PokemonRow | undefined;
  const idRow = idRows?.[0] as PokemonRow | undefined;

  if (pokedexRow) {
    // A main row with pokedex_id = pokedexIdNum already exists.
    // Ensure compatibility row at id = pokedexIdNum exists and is correct.
    if (idRow) {
      if (idRow.pokemon_name.toLowerCase() === pokedexRow.pokemon_name.toLowerCase()) {
        if (idRow.pokedex_id !== pokedexIdNum) {
          try {
            await supabase
              .from('pokemon')
              .update({ pokedex_id: pokedexIdNum })
              .eq('id', pokedexIdNum);
          } catch (e) {
            // Ignore unique constraint conflicts
          }
        }
      } else {
        // Primary key conflict: id = pokedexIdNum is occupied by a different Pokemon.
        // Free up the slot.
        const { error: deleteErr } = await supabase
          .from('pokemon')
          .delete()
          .eq('id', pokedexIdNum);

        if (deleteErr) {
          const temporaryFreeId = idRow.id + 10000;
          await supabase
            .from('pokemon')
            .update({ id: temporaryFreeId })
            .eq('id', pokedexIdNum);
        }

        // Insert the correct compatibility row
        await supabase.from('pokemon').insert({
          id: pokedexIdNum,
          pokemon_name: pokedexRow.pokemon_name,
          type: pokedexRow.type,
          region: pokedexRow.region,
          image: pokedexRow.image,
          evolution_stage: pokedexRow.evolution_stage,
          evolves_to: pokedexRow.evolves_to,
          required_stone: pokedexRow.required_stone,
          pokedex_id: null,
        });
      }
    } else {
      // Slot is free, insert compatibility row
      await supabase.from('pokemon').insert({
        id: pokedexIdNum,
        pokemon_name: pokedexRow.pokemon_name,
        type: pokedexRow.type,
        region: pokedexRow.region,
        image: pokedexRow.image,
        evolution_stage: pokedexRow.evolution_stage,
        evolves_to: pokedexRow.evolves_to,
        required_stone: pokedexRow.required_stone,
        pokedex_id: null,
      });
    }

    return pokedexRow;
  }

  // A row with pokedex_id = pokedexIdNum does not exist yet.
  let pokemonName = '';
  let type = '';
  let region = 'Unknown';
  let image = '';
  let evolutionStage = 1;
  let evolvesTo: number | null = null;
  let requiredStone: string | null = null;

  const localPokemon = POKEMON_DATABASE.find(pokemon => Number.parseInt(pokemon.id, 10) === pokedexIdNum);
  if (localPokemon) {
    pokemonName = localPokemon.name;
    type = localPokemon.type;
    region = localPokemon.region;
    image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${localPokemon.spriteId}.png`;
    evolutionStage = localPokemon.evolutionStage;
    requiredStone = localPokemon.requiredStone ?? null;
    
    if (localPokemon.evolvesTo) {
      const evolutionPokemon = await ensurePokemonInDb(Number.parseInt(localPokemon.evolvesTo, 10));
      evolvesTo = evolutionPokemon.pokedex_id ?? null;
    }
  } else {
    // Fetch dynamically from PokeAPI
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokedexIdNum}`);
    if (!res.ok) {
      throw new Error(`Pokemon ${pokedexIdNum} was not found on PokeAPI.`);
    }
    const pokeData = await res.json();
    
    pokemonName = pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1);
    
    const primaryType = pokeData.types?.[0]?.type?.name ?? 'Normal';
    type = primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
    
    image = pokeData.sprites?.other?.['official-artwork']?.front_default ?? 
            pokeData.sprites?.front_default ?? '';
            
    if (pokedexIdNum <= 151) region = 'Kanto';
    else if (pokedexIdNum <= 251) region = 'Johto';
    else if (pokedexIdNum <= 386) region = 'Hoenn';
    else if (pokedexIdNum <= 493) region = 'Sinnoh';
    else if (pokedexIdNum <= 649) region = 'Unova';
    else if (pokedexIdNum <= 721) region = 'Kalos';
    else if (pokedexIdNum <= 809) region = 'Alola';
    else if (pokedexIdNum <= 898) region = 'Galar';
    else region = 'Paldea';

    // Try to get evolution stage and evolves_to from species
    try {
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokedexIdNum}`);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        const chainUrl = speciesData.evolution_chain?.url;
        if (chainUrl) {
          const chainRes = await fetch(chainUrl);
          if (chainRes.ok) {
            const chainData = await chainRes.json();
            
            // Get evolution stage
            evolutionStage = findStageInChain(chainData.chain, pokeData.name);
            if (evolutionStage === 0) evolutionStage = 1;
            
            // Get next evolution
            const nextEv = findNextEvolutionInChain(chainData.chain, pokeData.name);
            if (nextEv) {
              const match = nextEv.url.match(/\/pokemon-species\/(\d+)\//);
              if (match) {
                const nextId = parseInt(match[1], 10);
                evolvesTo = nextId;
              }
              if (nextEv.item) {
                requiredStone = nextEv.item;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching species for DB ensure:", err);
    }
  }

  let fkeyRestoreIds: number[] = [];

  if (idRow) {
    if (idRow.pokemon_name.toLowerCase() === pokemonName.toLowerCase()) {
      const { data: updatedRow, error: updateErr } = await supabase
        .from('pokemon')
        .update({ pokedex_id: pokedexIdNum })
        .eq('id', pokedexIdNum)
        .select()
        .single<PokemonRow>();

      if (!updateErr && updatedRow) {
        return updatedRow;
      }

      const { data: correctRow } = await supabase
        .from('pokemon')
        .select()
        .eq('id', pokedexIdNum)
        .single<PokemonRow>();
      return correctRow || idRow;
    } else {
      // Delete conflicting row to free up the primary key slot
      const { error: deleteErr } = await supabase
        .from('pokemon')
        .delete()
        .eq('id', pokedexIdNum);

      if (deleteErr) {
        // Self-healing for fkey constraints (e.g., evolves_to references)
        const { data: referencingRows } = await supabase
          .from('pokemon')
          .select('id')
          .eq('evolves_to', pokedexIdNum);
          
        fkeyRestoreIds = (referencingRows ?? []).map(r => r.id);
        
        if (fkeyRestoreIds.length > 0) {
          await supabase
            .from('pokemon')
            .update({ evolves_to: null })
            .in('id', fkeyRestoreIds);
        }

        const { error: secondDeleteErr } = await supabase
          .from('pokemon')
          .delete()
          .eq('id', pokedexIdNum);

        if (secondDeleteErr) {
          // If delete still fails, move conflicting row to a high temporary ID
          const temporaryFreeId = idRow.id + 10000;
          await supabase
            .from('pokemon')
            .update({ id: temporaryFreeId })
            .eq('id', pokedexIdNum);
        }
      }
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('pokemon')
    .insert({
      id: pokedexIdNum,
      pokedex_id: pokedexIdNum,
      pokemon_name: pokemonName,
      type: type,
      region: region,
      image: image,
      evolution_stage: evolutionStage,
      evolves_to: evolvesTo,
      required_stone: requiredStone,
    })
    .select()
    .single<PokemonRow>();
    
  if (insertError) {
    throw new Error(`Failed to insert pokemon ${pokedexIdNum} into DB: ${insertError.message}`);
  }

  if (fkeyRestoreIds.length > 0) {
    await supabase
      .from('pokemon')
      .update({ evolves_to: pokedexIdNum })
      .in('id', fkeyRestoreIds);
  }

  await ensurePokemonIdCompatibilityRow(pokedexIdNum, inserted);

  return inserted;
}

async function ensurePokemonIdCompatibilityRow(pokedexIdNum: number, pokemon: PokemonRow): Promise<void> {
  const { data: idRows, error: findError } = await supabase
    .from('pokemon')
    .select()
    .eq('id', pokedexIdNum);

  if (findError) {
    throw findError;
  }

  const idRow = idRows?.[0] as PokemonRow | undefined;
  if (idRow) {
    if (idRow.pokemon_name.toLowerCase() === pokemon.pokemon_name.toLowerCase()) {
      if (idRow.pokedex_id !== pokedexIdNum) {
        try {
          await supabase
            .from('pokemon')
            .update({ pokedex_id: pokedexIdNum })
            .eq('id', pokedexIdNum);
        } catch (e) {
          // Ignore unique constraint conflicts
        }
      }
      return;
    }

    // Primary key conflict: id = pokedexIdNum is occupied by a different Pokemon.
    // Free up the slot.
    const { error: deleteErr } = await supabase
      .from('pokemon')
      .delete()
      .eq('id', pokedexIdNum);

    if (deleteErr) {
      const temporaryFreeId = idRow.id + 10000;
      await supabase
        .from('pokemon')
        .update({ id: temporaryFreeId })
        .eq('id', pokedexIdNum);
    }
  }

  const { error: insertError } = await supabase
    .from('pokemon')
    .insert({
      id: pokedexIdNum,
      pokemon_name: pokemon.pokemon_name,
      type: pokemon.type,
      region: pokemon.region,
      image: pokemon.image,
      evolution_stage: pokemon.evolution_stage,
      evolves_to: pokemon.evolves_to,
      required_stone: pokemon.required_stone,
      pokedex_id: null,
    });

  if (insertError) {
    throw new Error(`Failed to create Pokemon compatibility row ${pokedexIdNum}: ${insertError.message}`);
  }
}

export async function saveStarterPokemon(
  playerId: string,
  pokemonId: string | number,
  playerName?: string,
  pokemonName?: string,
): Promise<{ pokemon: FrontendPokedexRow; history: FrontendHistoryEntry }> {
  const pokedexIdNum = typeof pokemonId === 'number' ? pokemonId : parseInt(pokemonId, 10);

  await ensurePokemonInDb(pokedexIdNum);

  const { error: updateError } = await supabase
    .from('players')
    .update({ pokedex_id: pokedexIdNum })
    .eq('id', playerId);

  if (updateError) {
    throw updateError;
  }

  const { data: starterRecord, error: insertError } = await supabase
    .from('player_pokemon')
    .insert({
      player_id: playerId,
      pokedex_id: pokedexIdNum,
      level: 5,
      source: 'Starter',
      status: 'Active',
    })
    .select()
    .single<PlayerPokemonRow>();

  if (insertError) {
    throw insertError;
  }

  const mappedPokemon = mapFrontendPokedex(starterRecord);
  const history = await addFrontendHistoryLog({
    playerId,
    title: 'Starter Selection',
    detail: `${playerName ?? 'Trainer'} selected ${pokemonName ?? 'a Pokémon'} as starter.`,
    result: 'selected',
    sourceSystem: 'main_system',
    pokemonId: pokedexIdNum,
  });

  return { pokemon: mappedPokemon, history };
}

export async function rewardBadgeToPlayer(
  recipientName: string,
  badgeName: string,
): Promise<{ success: boolean; playerName: string }> {
  const cleanRecipientName = recipientName.trim();
  if (!cleanRecipientName) {
    throw new Error('Recipient trainer name is required.');
  }

  // 1. Find the player (case-insensitive)
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, player_name')
    .ilike('player_name', cleanRecipientName)
    .maybeSingle<PlayerRow>();

  if (playerError) {
    throw playerError;
  }

  if (!player) {
    throw new Error(`Trainer "${cleanRecipientName}" not found. Make sure they have started their journey.`);
  }

  // 2. Find/Ensure the badge store item
  const item = STORE_ITEMS.find((i) => i.name === badgeName);
  if (!item) {
    throw new Error(`Store item details for "${badgeName}" not found.`);
  }

  const storeItem = await ensureStoreItem(item);

  // 3. Add to recipient's inventory (set quantity to 1)
  const { data: existingInv, error: invReadError } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq('player_id', player.id)
    .eq('item_id', storeItem.id)
    .maybeSingle<InventoryRow>();

  if (invReadError) {
    throw invReadError;
  }

  if (existingInv) {
    // If they already have it, just ensure quantity is at least 1 (idempotent)
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: Math.max(1, existingInv.quantity) })
      .eq('id', existingInv.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('inventory')
      .insert({
        player_id: player.id,
        item_id: storeItem.id,
        quantity: 1,
      });

    if (insertError) {
      throw insertError;
    }
  }

  // 4. Log the rewarding to history so they see it
  await addFrontendHistoryLog({
    playerId: player.id,
    title: 'Badge Earned',
    detail: `Earned ${badgeName} from Gym Leader! Dynamic Level Cap increased!`,
    result: 'earned',
    sourceSystem: 'main_system',
  });

  return { success: true, playerName: player.player_name };
}
