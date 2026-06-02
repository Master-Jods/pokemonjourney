import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: '../../.env' });
dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 5001);
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const nativePokemonDexByRegion = {
  Kanto: createDexRange(1, 151),
  Unova: createDexRange(494, 649),
  Paldea: createDexRange(906, 1010),
};

const starterDexIds = new Set([1, 4, 7, 495, 498, 501, 906, 909, 912]);
const regionNames = Object.keys(nativePokemonDexByRegion);

const EXCLUDED_DEX_IDS = new Set([
  // Kanto
  144, 145, 146, 150, 151,
  // Unova
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Paldea
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
  1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010
]);

function createDexRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizedLower(value) {
  return normalizeText(value).toLowerCase();
}

function exactNameMatch(records, key, rawName) {
  const target = normalizedLower(rawName);
  return (records ?? []).find((record) => normalizedLower(record[key]) === target);
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function toTitleCase(value) {
  return String(value ?? '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDifficulty({ dexId, captureRate, isLegendary, isMythical }) {
  if (starterDexIds.has(dexId)) return 'Easy';
  if (isLegendary || isMythical || captureRate <= 45) return 'Hard';
  if (captureRate <= 120) return 'Medium';
  return 'Easy';
}

function buildClue({ region, type, difficulty }) {
  if (difficulty === 'Hard') return `I am a rare ${type}-type Pokémon from ${region}.`;
  if (difficulty === 'Medium') return `I am a less common ${type}-type Pokémon from ${region}.`;
  return `I am a common ${type}-type Pokémon from ${region}.`;
}

function buildPokeGuessCategory({ type, difficulty, isStarter }) {
  if (isStarter) return `${type}-type starter`;
  if (difficulty === 'Hard') return `Rare ${type}-type Pokemon`;
  if (difficulty === 'Medium') return `Less common ${type}-type Pokemon`;
  return `Common ${type}-type Pokemon`;
}

function buildPokeGuessClue({ region, type, difficulty, genus, isStarter }) {
  const cleanGenus = normalizeText(genus).replace(/\s*Pokemon$/i, '');
  const rarityHint =
    difficulty === 'Hard'
      ? 'a rare'
      : difficulty === 'Medium'
        ? 'a less common'
        : 'a common';
  const starterHint = isStarter ? ' starter' : '';
  const identityHint = cleanGenus ? ` and I am known as the ${cleanGenus}` : '';

  return `I am ${rarityHint} ${type}-type${starterHint} from ${region}${identityHint}.`;
}

async function fetchPokeApiJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status}`);
  }
  return response.json();
}

async function buildWildPokemonFromDexId(dexId, region) {
  const [pokemon, species] = await Promise.all([
    fetchPokeApiJson(`https://pokeapi.co/api/v2/pokemon/${dexId}`),
    fetchPokeApiJson(`https://pokeapi.co/api/v2/pokemon-species/${dexId}`),
  ]);

  if (EXCLUDED_DEX_IDS.has(dexId) || species?.is_legendary || species?.is_mythical) {
    return null;
  }

  const primaryType = pokemon?.types?.[0]?.type?.name;
  const artwork =
    pokemon?.sprites?.other?.['official-artwork']?.front_default ??
    pokemon?.sprites?.other?.home?.front_default ??
    pokemon?.sprites?.front_default;

  if (!primaryType || !artwork) {
    return null;
  }

  const type = toTitleCase(primaryType);
  const englishGenus = species?.genera?.find((entry) => entry?.language?.name === 'en')?.genus;
  const isStarter = starterDexIds.has(dexId);
  const difficulty = getDifficulty({
    dexId,
    captureRate: Number(species?.capture_rate ?? 0),
    isLegendary: Boolean(species?.is_legendary),
    isMythical: Boolean(species?.is_mythical),
  });

  return {
    pokedex_id: dexId,
    pokemon_name: toTitleCase(pokemon.name),
    type,
    region,
    image: artwork,
    difficulty,
    category: buildPokeGuessCategory({ type, difficulty, isStarter }),
    clue: buildPokeGuessClue({ region, type, difficulty, genus: englishGenus, isStarter }),
    cry: pokemon?.cries?.latest ?? pokemon?.cries?.legacy ?? null,
  };
}

async function generateWildPokemonFromPokeApi() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const region = randomFrom(regionNames);
    const dexId = randomFrom(nativePokemonDexByRegion[region]);

    const [pokemon, species] = await Promise.all([
      fetchPokeApiJson(`https://pokeapi.co/api/v2/pokemon/${dexId}`),
      fetchPokeApiJson(`https://pokeapi.co/api/v2/pokemon-species/${dexId}`),
    ]);

    if (EXCLUDED_DEX_IDS.has(dexId) || species?.is_legendary || species?.is_mythical) {
      continue;
    }

    const primaryType = pokemon?.types?.[0]?.type?.name;
    const artwork =
      pokemon?.sprites?.other?.['official-artwork']?.front_default ??
      pokemon?.sprites?.other?.home?.front_default ??
      pokemon?.sprites?.front_default;

    if (!primaryType || !artwork) continue;

    const type = toTitleCase(primaryType);
    const difficulty = getDifficulty({
      dexId,
      captureRate: Number(species?.capture_rate ?? 0),
      isLegendary: Boolean(species?.is_legendary),
      isMythical: Boolean(species?.is_mythical),
    });

    return {
      pokedex_id: dexId,
      pokemon_name: toTitleCase(pokemon.name),
      type,
      region,
      image: artwork,
      difficulty,
      category: `${type}-type Pokémon`,
      clue: buildClue({ region, type, difficulty }),
    };
  }

  throw new Error('Unable to generate a wild Pokémon right now. Please try again.');
}

async function generateRandomWildPokemonGameSeed() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const region = randomFrom(regionNames);
    const dexId = randomFrom(nativePokemonDexByRegion[region]);
    const wildPokemon = await buildWildPokemonFromDexId(dexId, region);

    if (wildPokemon) return wildPokemon;
  }

  throw new Error('Unable to generate a wild Pokemon right now. Please try again.');
}

async function generateWildPokemonGameData() {
  const wildPokemon = await generateRandomWildPokemonGameSeed();

  await ensurePokemonExistsFromWild(wildPokemon);

  return wildPokemon;
}

async function findPlayerByName(playerName) {
  const normalizedName = normalizeText(playerName);
  if (!normalizedName) {
    throw new Error('Player name is required.');
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, player_name, section, assigned_journey, pokedex_id, created_at')
    .ilike('player_name', normalizedName);

  if (error) {
    throw new Error(`Failed to look up player: ${error.message}`);
  }

  const player = exactNameMatch(data, 'player_name', normalizedName);
  if (!player) {
    return null;
  }

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('coin_balance')
    .eq('player_id', player.id)
    .maybeSingle();

  if (walletError) {
    throw new Error(`Failed to load wallet: ${walletError.message}`);
  }

  return {
    ...player,
    coin_balance: wallet?.coin_balance ?? 0,
  };
}

async function ensurePokemonExistsFromWild(wildPokemon) {
  const pokemonName = normalizeText(wildPokemon?.pokemon_name);
  const pokedexId = Number(wildPokemon?.pokedex_id);
  if (!pokemonName) return null;
  if (!Number.isInteger(pokedexId) || pokedexId <= 0) {
    throw new Error('Wild Pokémon is missing a valid Pokédex id.');
  }

  // 1. Query by pokedex_id = pokedexId
  const { data: pokedexRows, error: pokedexError } = await supabase
    .from('pokemon')
    .select('*')
    .eq('pokedex_id', pokedexId);

  if (pokedexError) {
    throw new Error(`Failed to find Pokémon by pokedex_id: ${pokedexError.message}`);
  }

  // 2. Query by id = pokedexId
  const { data: idRows, error: idError } = await supabase
    .from('pokemon')
    .select('*')
    .eq('id', pokedexId);

  if (idError) {
    throw new Error(`Failed to find Pokémon by id: ${idError.message}`);
  }

  const pokedexRow = pokedexRows?.[0] ?? null;
  const idRow = idRows?.[0] ?? null;

  if (pokedexRow) {
    // A main row with pokedex_id = pokedexId already exists.
    // Ensure compatibility row at id = pokedexId exists and is correct.
    if (idRow) {
      if (idRow.pokemon_name.toLowerCase() === pokemonName.toLowerCase()) {
        if (idRow.pokedex_id !== pokedexId) {
          try {
            await supabase
              .from('pokemon')
              .update({ pokedex_id: pokedexId })
              .eq('id', pokedexId);
          } catch (e) {
            // Ignore unique constraint conflicts
          }
        }
      } else {
        // Primary key conflict: id = pokedexId is occupied by a different Pokemon.
        // Free up the slot.
        const { error: deleteErr } = await supabase
          .from('pokemon')
          .delete()
          .eq('id', pokedexId);

        if (deleteErr) {
          const temporaryFreeId = idRow.id + 10000;
          await supabase
            .from('pokemon')
            .update({ id: temporaryFreeId })
            .eq('id', pokedexId);
        }

        // Insert the correct compatibility row (or main row if we can)
        await supabase.from('pokemon').insert({
          id: pokedexId,
          pokemon_name: pokemonName,
          type: normalizeText(wildPokemon.type ?? pokedexRow.type),
          region: normalizeText(wildPokemon.region ?? pokedexRow.region),
          image: normalizeText(wildPokemon.image ?? pokedexRow.image),
          evolution_stage: pokedexRow.evolution_stage ?? 1,
          evolves_to: pokedexRow.evolves_to ?? null,
          required_stone: pokedexRow.required_stone ?? null,
          pokedex_id: null,
        });
      }
    } else {
      // Slot is free, insert compatibility row
      await supabase.from('pokemon').insert({
        id: pokedexId,
        pokemon_name: pokemonName,
        type: normalizeText(wildPokemon.type ?? pokedexRow.type),
        region: normalizeText(wildPokemon.region ?? pokedexRow.region),
        image: normalizeText(wildPokemon.image ?? pokedexRow.image),
        evolution_stage: pokedexRow.evolution_stage ?? 1,
        evolves_to: pokedexRow.evolves_to ?? null,
        required_stone: pokedexRow.required_stone ?? null,
        pokedex_id: null,
      });
    }

    return pokedexRow;
  }

  // A row with pokedex_id = pokedexId does not exist yet.
  if (idRow) {
    if (idRow.pokemon_name.toLowerCase() === pokemonName.toLowerCase()) {
      const { data: updated, error: updateErr } = await supabase
        .from('pokemon')
        .update({ pokedex_id: pokedexId })
        .eq('id', pokedexId)
        .select()
        .single();
      
      if (!updateErr && updated) {
        return updated;
      }
      
      const { data: correctRow } = await supabase
        .from('pokemon')
        .select('*')
        .eq('id', pokedexId)
        .single();
      return correctRow;
    } else {
      // Primary key conflict: id = pokedexId is occupied by a different Pokemon.
      // Free up the slot.
      const { error: deleteErr } = await supabase
        .from('pokemon')
        .delete()
        .eq('id', pokedexId);

      if (deleteErr) {
        const temporaryFreeId = idRow.id + 10000;
        await supabase
          .from('pokemon')
          .update({ id: temporaryFreeId })
          .eq('id', pokedexId);
      }
    }
  }

  // Insert new row at id = pokedexId with pokedex_id = pokedexId
  const { data: inserted, error: insertError } = await supabase
    .from('pokemon')
    .insert({
      id: pokedexId,
      pokedex_id: pokedexId,
      pokemon_name: pokemonName,
      type: normalizeText(wildPokemon.type),
      region: normalizeText(wildPokemon.region),
      image: normalizeText(wildPokemon.image),
      evolution_stage: 1,
      evolves_to: null,
      required_stone: null,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to insert Pokémon ${pokedexId}: ${insertError.message}`);
  }

  return inserted;
}

async function ensurePokemonCompatibilityRow(pokedexId, pokemon) {
  const { data: idRows, error: findError } = await supabase
    .from('pokemon')
    .select('*')
    .eq('id', pokedexId);

  if (findError) {
    throw new Error(`Failed to check Pokémon compatibility row: ${findError.message}`);
  }

  const idRow = idRows?.[0] ?? null;
  if (idRow) {
    if (idRow.pokemon_name.toLowerCase() === pokemon.pokemon_name.toLowerCase()) {
      if (idRow.pokedex_id !== pokedexId) {
        try {
          await supabase
            .from('pokemon')
            .update({ pokedex_id: pokedexId })
            .eq('id', pokedexId);
        } catch (e) {
          // Ignore unique constraint conflicts
        }
      }
      return;
    }

    // Primary key conflict: id = pokedexId is occupied by a different Pokemon.
    // Free up the slot.
    const { error: deleteErr } = await supabase
      .from('pokemon')
      .delete()
      .eq('id', pokedexId);

    if (deleteErr) {
      const temporaryFreeId = idRow.id + 10000;
      await supabase
        .from('pokemon')
        .update({ id: temporaryFreeId })
        .eq('id', pokedexId);
    }
  }

  await supabase.from('pokemon').insert({
    id: pokedexId,
    pokemon_name: pokemon.pokemon_name,
    type: normalizeText(pokemon.type),
    region: normalizeText(pokemon.region),
    image: normalizeText(pokemon.image),
    evolution_stage: pokemon.evolution_stage ?? 1,
    evolves_to: pokemon.evolves_to ?? null,
    required_stone: pokemon.required_stone ?? null,
    pokedex_id: null,
  });
}

async function findPokemonByName(pokemonName) {
  const normalizedName = normalizeText(pokemonName);
  if (!normalizedName) {
    throw new Error('Pokémon name is required.');
  }

  const { data, error } = await supabase
    .from('pokemon')
    .select('id, pokedex_id, pokemon_name')
    .ilike('pokemon_name', normalizedName);

  if (error) {
    throw new Error(`Failed to look up Pokémon: ${error.message}`);
  }

  const matches = (data ?? []).filter((record) => normalizedLower(record.pokemon_name) === normalizedLower(normalizedName));
  return matches.find((record) => record.pokedex_id !== null && record.pokedex_id !== undefined && Number.isInteger(Number(record.pokedex_id))) ?? matches[0] ?? null;
}

async function ensurePlayerPokemonRecord({ playerId, pokemonId, gameName }) {
  const { data: existing, error: existingError } = await supabase
    .from('player_pokemon')
    .select('id')
    .eq('player_id', playerId)
    .eq('pokedex_id', pokemonId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check player Pokédex: ${existingError.message}`);
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await supabase
    .from('player_pokemon')
    .insert({
      player_id: playerId,
      pokedex_id: pokemonId,
      level: 1,
      source: gameName,
      status: 'Active',
    });

  if (insertError) {
    throw new Error(`Failed to add Pokémon to player Pokédex: ${insertError.message}`);
  }
}

async function applyCoinReward({ playerId, coinsEarned }) {
  if (!coinsEarned || coinsEarned <= 0) return;

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, coin_balance')
    .eq('player_id', playerId)
    .maybeSingle();

  if (walletError) {
    throw new Error(`Failed to load wallet: ${walletError.message}`);
  }

  if (!wallet) {
    const { error: createWalletError } = await supabase
      .from('wallets')
      .insert({ player_id: playerId, coin_balance: coinsEarned });
    if (createWalletError) {
      throw new Error(`Failed to create wallet: ${createWalletError.message}`);
    }
    return;
  }

  const nextBalance = Number(wallet.coin_balance ?? 0) + coinsEarned;
  const { error: updateWalletError } = await supabase
    .from('wallets')
    .update({ coin_balance: nextBalance })
    .eq('id', wallet.id);

  if (updateWalletError) {
    throw new Error(`Failed to update wallet: ${updateWalletError.message}`);
  }
}

async function writeGameLog({
  playerId,
  pokemonId,
  gameName,
  result,
  levelGain,
  coinsEarned,
  sourceSystem,
}) {
  const { error } = await supabase.from('game_logs').insert({
    player_id: playerId,
    pokemon_id: pokemonId,
    game_name: gameName,
    result,
    level_gain: levelGain,
    coins_earned: coinsEarned,
    source_system: sourceSystem,
    logged_by: 'catching-subsystem-api',
  });

  if (error) {
    throw new Error(`Failed to save game log: ${error.message}`);
  }
}

function validateCatchPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload.');
  }

  const playerName = normalizeText(payload.playerName);
  const pokemonName = normalizeText(payload.pokemonName);
  const gameName = normalizeText(payload.gameName);
  const result = normalizeText(payload.result).toLowerCase();
  const sourceSystem = normalizeText(payload.sourceSystem);
  const levelGain = Number(payload.levelGain ?? 0);
  const requestedCoinsEarned = Number(payload.coinsEarned ?? 0);

  if (!playerName) throw new Error('playerName is required.');
  if (!pokemonName) throw new Error('pokemonName is required.');
  if (!gameName) throw new Error('gameName is required.');
  if (!['caught', 'fled'].includes(result)) throw new Error('result must be either "caught" or "fled".');
  if (sourceSystem !== 'catching_subsystem') throw new Error('sourceSystem must be "catching_subsystem".');
  if (Number.isNaN(levelGain) || levelGain < 0) throw new Error('levelGain must be a non-negative number.');
  if (Number.isNaN(requestedCoinsEarned) || requestedCoinsEarned < 0) {
    throw new Error('coinsEarned must be a non-negative number.');
  }

  const enforcedCoinsEarned = result === 'caught' ? 20 : 0;
  const enforcedLevelGain = 0;

  return {
    playerName,
    pokemonName,
    gameName,
    result,
    levelGain: enforcedLevelGain,
    coinsEarned: enforcedCoinsEarned,
    sourceSystem,
    wildPokemon: payload.wildPokemon ?? null,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'catching-subsystem-backend' });
});

app.get('/api/player/lookup', async (req, res) => {
  try {
    const normalizedName = normalizeText(req.query.name);
    if (!normalizedName) {
      return res.status(400).json({ message: 'Player name is required.' });
    }

    const player = await findPlayerByName(normalizedName);
    if (!player) {
      return res.status(404).json({
        message: 'Player not found. Please retry with your registered name.',
      });
    }

    return res.status(200).json({ player });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return res.status(500).json({ message });
  }
});

async function checkGameCooldown(playerId, gameName) {
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
        cooldownUntil = logTime + 2 * 60 * 1000;
      }
    }
  }

  const now = Date.now();
  if (now < cooldownUntil) {
    const remainingMinutes = Math.ceil((cooldownUntil - now) / 60000);
    return {
      allowed: false,
      message: `You have reached the 3 attempt limit. Please wait ${remainingMinutes} minute(s) before playing ${gameName} again.`
    };
  }

  return { allowed: true };
}

app.get('/api/wild-pokemon', async (_req, res) => {
  try {
    const wildPokemon = await generateWildPokemonGameData();
    return res.status(200).json({ wildPokemon });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return res.status(500).json({ message });
  }
});

app.post('/api/results/catch', async (req, res) => {
  try {
    const payload = validateCatchPayload(req.body);

    const player = await findPlayerByName(payload.playerName);
    if (!player) {
      return res.status(404).json({ message: 'Player not found. Please retry with your registered name.' });
    }

    const cooldownStatus = await checkGameCooldown(player.id, payload.gameName);
    if (!cooldownStatus.allowed) {
      return res.status(429).json({ success: false, message: cooldownStatus.message });
    }

    let pokemon = await findPokemonByName(payload.pokemonName);
    if (!pokemon && payload.wildPokemon) {
      pokemon = await ensurePokemonExistsFromWild(payload.wildPokemon);
    }

    if (!pokemon) {
      return res.status(404).json({
        message: `Pokémon "${payload.pokemonName}" was not found in the pokemon table.`,
      });
    }

    const pokemonPokedexId = Number(pokemon.pokedex_id ?? pokemon.id);

    if (pokemon.pokedex_id === null || pokemon.pokedex_id === undefined) {
      await supabase
        .from('pokemon')
        .update({ pokedex_id: pokemonPokedexId })
        .eq('id', pokemon.id);
    }

    await ensurePokemonCompatibilityRow(pokemonPokedexId, pokemon);

    if (payload.result === 'caught') {
      await ensurePlayerPokemonRecord({
        playerId: player.id,
        pokemonId: pokemonPokedexId,
        gameName: payload.gameName,
      });
    }

    await applyCoinReward({
      playerId: player.id,
      coinsEarned: payload.coinsEarned,
    });

    await writeGameLog({
      playerId: player.id,
      pokemonId: pokemonPokedexId,
      gameName: payload.gameName,
      result: payload.result,
      levelGain: payload.levelGain,
      coinsEarned: payload.coinsEarned,
      sourceSystem: payload.sourceSystem,
    });

    return res.status(200).json({
      success: true,
      message: 'Result saved successfully.',
      playerId: player.id,
      pokemonId: pokemonPokedexId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return res.status(500).json({ success: false, message });
  }
});

app.listen(port, () => {
  console.log(`[catching-backend] listening on http://127.0.0.1:${port}`);
});
