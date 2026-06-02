export interface PokeApiPokemon {
  id: number;
  name: string;
  displayName: string;
  types: string[];
  image: string;
  cryUrl: string | null;
}

export interface BattleScenario {
  opponent: PokeApiPokemon;
  challenger: PokeApiPokemon;
  multiplier: number;
  isChallengerFavored: boolean;
}

export interface GuessRound {
  pokemon: PokeApiPokemon;
  counterTypes: string[];
}

export interface MatchPair {
  pairId: number;
  pokemon: PokeApiPokemon;
}

interface PokemonResponse {
  id: number;
  name: string;
  cries?: {
    latest?: string;
    legacy?: string;
  };
  sprites?: {
    front_default?: string;
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
}

interface TypeResponse {
  damage_relations: {
    double_damage_to: Array<{ name: string }>;
    half_damage_to: Array<{ name: string }>;
    no_damage_to: Array<{ name: string }>;
  };
}

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const FIRST_GENERATION_MAX_ID = 151;

const pokemonCache = new Map<string, PokeApiPokemon>();
const typeCache = new Map<string, TypeResponse>();
let typeNamesCache: string[] | null = null;

export function formatPokemonName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getTypeColor(typeName: string) {
  const colors: Record<string, string> = {
    bug: '#92BC2C',
    dark: '#595761',
    dragon: '#0C69C8',
    electric: '#F2D94E',
    fairy: '#EE90E6',
    fighting: '#D3425F',
    fire: '#FBA54C',
    flying: '#A1BBEC',
    ghost: '#5F6DBC',
    grass: '#5FBD58',
    ground: '#DA7C4D',
    ice: '#75D0C1',
    normal: '#A0A29F',
    poison: '#B763CF',
    psychic: '#FA8581',
    rock: '#C9BB8A',
    steel: '#5695A3',
    water: '#539DDF',
  };

  return colors[typeName.toLowerCase()] ?? '#64748B';
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status}`);
  }

  return response.json();
}

function randomPokemonId() {
  return Math.floor(Math.random() * FIRST_GENERATION_MAX_ID) + 1;
}

function getUniqueRandomIds(count: number) {
  const ids = new Set<number>();

  while (ids.size < count) {
    ids.add(randomPokemonId());
  }

  return Array.from(ids);
}

export async function loadPokemon(identifier: number | string): Promise<PokeApiPokemon> {
  const cacheKey = String(identifier).toLowerCase();
  const cachedPokemon = pokemonCache.get(cacheKey);

  if (cachedPokemon) return cachedPokemon;

  const data = await fetchJson<PokemonResponse>(`${POKEAPI_BASE_URL}/pokemon/${cacheKey}`);
  const image =
    data.sprites?.other?.['official-artwork']?.front_default ||
    data.sprites?.front_default ||
    '';

  const pokemon = {
    id: data.id,
    name: data.name,
    displayName: formatPokemonName(data.name),
    types: data.types.map((entry) => entry.type.name),
    image,
    cryUrl: data.cries?.latest || data.cries?.legacy || null,
  };

  pokemonCache.set(cacheKey, pokemon);
  pokemonCache.set(String(data.id), pokemon);
  pokemonCache.set(data.name, pokemon);

  return pokemon;
}

export async function loadRandomPokemon(count: number) {
  return Promise.all(getUniqueRandomIds(count).map((id) => loadPokemon(id)));
}

async function loadType(typeName: string) {
  const normalizedType = normalizeAnswer(typeName);
  const cachedType = typeCache.get(normalizedType);

  if (cachedType) return cachedType;

  const typeData = await fetchJson<TypeResponse>(`${POKEAPI_BASE_URL}/type/${normalizedType}`);
  typeCache.set(normalizedType, typeData);

  return typeData;
}

async function loadTypeNames() {
  if (typeNamesCache) return typeNamesCache;

  const response = await fetchJson<{ results: Array<{ name: string }> }>(`${POKEAPI_BASE_URL}/type`);
  typeNamesCache = response.results
    .map((type) => type.name)
    .filter((type) => !['unknown', 'shadow'].includes(type));

  return typeNamesCache;
}

export async function getTypeEffectiveness(attackingType: string, defendingTypes: string[]) {
  const typeData = await loadType(attackingType);
  let multiplier = 1;

  defendingTypes.forEach((defendingType) => {
    if (typeData.damage_relations.no_damage_to.some((type) => type.name === defendingType)) {
      multiplier *= 0;
    } else if (typeData.damage_relations.double_damage_to.some((type) => type.name === defendingType)) {
      multiplier *= 2;
    } else if (typeData.damage_relations.half_damage_to.some((type) => type.name === defendingType)) {
      multiplier *= 0.5;
    }
  });

  return multiplier;
}

export async function getCounterTypes(defendingTypes: string[]) {
  const typeNames = await loadTypeNames();
  const scoredTypes = await Promise.all(
    typeNames.map(async (typeName) => ({
      typeName,
      multiplier: await getTypeEffectiveness(typeName, defendingTypes),
    })),
  );
  const bestMultiplier = Math.max(...scoredTypes.map((type) => type.multiplier));

  return scoredTypes
    .filter((type) => type.multiplier === bestMultiplier && type.multiplier > 1)
    .map((type) => type.typeName);
}

export async function loadGuessRound(): Promise<GuessRound> {
  const [pokemon] = await loadRandomPokemon(1);
  const counterTypes = await getCounterTypes(pokemon.types);

  return {
    pokemon,
    counterTypes: counterTypes.length > 0 ? counterTypes : ['normal'],
  };
}

export async function loadBattleScenario(): Promise<BattleScenario> {
  let [opponent, challenger] = await loadRandomPokemon(2);
  let attempts = 0;

  while (opponent.types[0] === challenger.types[0] && attempts < 20) {
    attempts += 1;
    [opponent, challenger] = await loadRandomPokemon(2);
  }

  const multiplier = await getTypeEffectiveness(challenger.types[0], opponent.types);

  return {
    opponent,
    challenger,
    multiplier,
    isChallengerFavored: multiplier > 1,
  };
}

export async function loadMatchPairs(count = 4): Promise<MatchPair[]> {
  const chosenPokemon: PokeApiPokemon[] = [];
  const usedPokemon = new Set<number>();
  let attempts = 0;

  while (chosenPokemon.length < count && attempts < 30) {
    attempts += 1;
    const [pokemon] = await loadRandomPokemon(1);

    if (!usedPokemon.has(pokemon.id)) {
      chosenPokemon.push(pokemon);
      usedPokemon.add(pokemon.id);
    }
  }

  return chosenPokemon.slice(0, count).map((pokemon, index) => ({
    pairId: index + 1,
    pokemon,
  }));
}
