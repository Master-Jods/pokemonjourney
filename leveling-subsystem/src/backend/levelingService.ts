import { supabase } from './supabaseClient';

export interface PlayerRecord {
  player_id: string;
  player_name: string;
  coin_balance: number;
}

export interface PlayerPokemonRecord {
  pokedex_id: string;
  player_id: string;
  pokemon_id: string;
  pokemon_name: string;
  type: string | null;
  region: string | null;
  image: string | null;
  level: number;
  source: string | null;
  status: string | null;
}

export interface SaveLevelingResultInput {
  player_id: string;
  pokedex_id: string;
  pokemon_id: string;
  game_name: string;
  result: string;
  level_gain?: number;
  coins_earned?: number;
  source_system: 'leveling_subsystem';
}

interface PlayerPokedexRow {
  id: string | number;
  player_id: string | number;
  pokedex_id: string | number;
  level: number | null;
  source: string | null;
  status: string | null;
}

interface PokemonRow {
  pokedex_id: number | null;
  pokemon_name: string;
  type: string | null;
  region: string | null;
  image: string | null;
}

const OWNED_POKEMON_SOURCES = ['Starter', 'PokeReflex', 'PokeGuess', 'IRL Catch', 'Manual Log'];

function requireText(value: string | undefined, fieldName: string) {
  if (!value || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
}

async function applyCoinReward(playerId: string, coinsEarned: number) {
  if (!coinsEarned || coinsEarned <= 0) return;

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, coin_balance')
    .eq('player_id', playerId)
    .maybeSingle();

  if (walletError) {
    throw new Error(walletError.message);
  }

  if (!wallet) {
    const { error: createError } = await supabase
      .from('wallets')
      .insert({ player_id: playerId, coin_balance: coinsEarned });

    if (createError) {
      throw new Error(createError.message);
    }
    return;
  }

  const { error: updateError } = await supabase
    .from('wallets')
    .update({ coin_balance: Number(wallet.coin_balance ?? 0) + coinsEarned })
    .eq('id', wallet.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function findPlayerByName(playerName: string): Promise<PlayerRecord> {
  const normalizedName = playerName.trim().replace(/\s+/g, ' ');

  if (!normalizedName) {
    throw new Error('Player name is required.');
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, player_name')
    .ilike('player_name', normalizedName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Player not found. Please register in the Main System first.');
  }

  const { data: wallet, error: coinError } = await supabase
    .from('wallets')
    .select('coin_balance')
    .eq('player_id', data.id)
    .maybeSingle();

  if (coinError) {
    throw new Error(coinError.message);
  }

  return {
    player_id: String(data.id),
    player_name: data.player_name,
    coin_balance: wallet?.coin_balance ?? 0,
  };
}

export async function loadPlayerPokemon(playerId: string): Promise<PlayerPokemonRecord[]> {
  requireText(playerId, 'player_id');

  const { data, error } = await supabase
    .from('player_pokemon')
    .select('id, player_id, pokedex_id, level, source, status')
    .eq('player_id', playerId)
    .ilike('status', 'active')
    .in('source', OWNED_POKEMON_SOURCES)
    .order('id', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PlayerPokedexRow[];
  const pokedexIds = [...new Set(rows.map((row) => Number(row.pokedex_id)).filter(Number.isFinite))];
  const { data: pokemonRows, error: pokemonError } = await supabase
    .from('pokemon')
    .select('pokedex_id, pokemon_name, type, region, image')
    .in('pokedex_id', pokedexIds);

  if (pokemonError) {
    throw new Error(pokemonError.message);
  }

  const pokemonByPokedexId = new Map(
    ((pokemonRows ?? []) as PokemonRow[]).map((pokemon) => [String(pokemon.pokedex_id), pokemon]),
  );

  return rows.map((row) => {
    const pokemonDatabase = pokemonByPokedexId.get(String(row.pokedex_id));
    return {
      pokedex_id: String(row.id),
      player_id: String(row.player_id),
      pokemon_id: String(row.pokedex_id),
      pokemon_name: pokemonDatabase?.pokemon_name ?? 'Unknown Pokemon',
      type: pokemonDatabase?.type ?? null,
      region: pokemonDatabase?.region ?? null,
      image: pokemonDatabase?.image ?? null,
      level: row.level ?? 0,
      source: row.source,
      status: row.status,
    };
  });
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

async function checkGameCooldown(playerId: string, gameName: string): Promise<{ allowed: boolean; message?: string }> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: logs, error } = await supabase
    .from('game_logs')
    .select('created_at')
    .eq('player_id', playerId)
    .eq('game_name', gameName)
    .gte('created_at', yesterday)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to check game cooldown: ${error.message}`);
  }

  let attemptsLeft = 3;
  let cooldownUntil = 0;

  for (const log of logs || []) {
    const logTime = new Date(log.created_at).getTime();
    if (logTime >= cooldownUntil) {
      if (cooldownUntil > 0) {
        attemptsLeft = 3;
        cooldownUntil = 0;
      }
      
      attemptsLeft -= 1;
      if (attemptsLeft === 0) {
        cooldownUntil = logTime + 10 * 60 * 1000;
      }
    }
  }

  const now = Date.now();
  if (now < cooldownUntil) {
    const remainingMinutes = Math.ceil((cooldownUntil - now) / 60000);
    return {
      allowed: false,
      message: `You have reached the 3 attempt limit. Please wait ${remainingMinutes} minute(s) before playing ${gameName} again.`,
    };
  }

  return { allowed: true };
}

export async function saveLevelingResult(input: SaveLevelingResultInput): Promise<{ message: string; updatedLevel: number }> {
  requireText(input.player_id, 'player_id');
  requireText(input.pokedex_id, 'pokedex_id');
  requireText(input.pokemon_id, 'pokemon_id');
  requireText(input.game_name, 'game_name');
  requireText(input.result, 'result');

  if (input.source_system !== 'leveling_subsystem') {
    throw new Error('source_system must be leveling_subsystem.');
  }

  const cooldownStatus = await checkGameCooldown(input.player_id, input.game_name);
  if (!cooldownStatus.allowed) {
    throw new Error(cooldownStatus.message);
  }

  const levelGain = input.level_gain ?? 0;
  const coinsEarned = input.coins_earned ?? 0;

  if (levelGain < 0) {
    throw new Error('level_gain cannot be negative.');
  }

  if (coinsEarned < 0) {
    throw new Error('coins_earned cannot be negative.');
  }

  const { data: pokedexRow, error: pokedexReadError } = await supabase
    .from('player_pokemon')
    .select('level')
    .eq('id', input.pokedex_id)
    .eq('player_id', input.player_id)
    .eq('pokedex_id', input.pokemon_id)
    .ilike('status', 'active')
    .in('source', OWNED_POKEMON_SOURCES)
    .single();

  if (pokedexReadError) {
    throw new Error(pokedexReadError.message);
  }

  const currentLevel = pokedexRow?.level ?? 0;
  const levelCap = await getPlayerLevelCap(input.player_id);
  const nextLevel = currentLevel >= levelCap ? currentLevel : Math.min(levelCap, currentLevel + levelGain);
  const appliedLevelGain = Math.max(0, nextLevel - currentLevel);

  const { error: pokedexUpdateError, count: updatedPokemonCount } = await supabase
    .from('player_pokemon')
    .update({ level: nextLevel }, { count: 'exact' })
    .eq('id', input.pokedex_id)
    .eq('player_id', input.player_id)
    .eq('pokedex_id', input.pokemon_id)
    .ilike('status', 'active')
    .in('source', OWNED_POKEMON_SOURCES);

  if (pokedexUpdateError) {
    throw new Error(pokedexUpdateError.message);
  }

  if (updatedPokemonCount === 0) {
    throw new Error('Selected Pokemon is not owned by this player.');
  }

  await applyCoinReward(input.player_id, coinsEarned);

  const { error: historyInsertError } = await supabase.from('game_logs').insert({
    player_id: input.player_id,
    pokemon_id: input.pokemon_id,
    game_name: input.game_name,
    result: input.result,
    level_gain: appliedLevelGain,
    coins_earned: coinsEarned,
    source_system: input.source_system,
    logged_by: `Gained +${appliedLevelGain} levels and +${coinsEarned} coins from ${input.game_name}.`,
  });

  if (historyInsertError) {
    throw new Error(historyInsertError.message);
  }

  return {
    message: 'Result saved successfully.',
    updatedLevel: nextLevel,
  };
}
