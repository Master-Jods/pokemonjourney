export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type WildPokemon = {
  pokemon_name: string;
  type: string;
  region: 'Kanto' | 'Unova' | 'Paldea';
  image: string;
  difficulty: Difficulty;
  clue: string;
  category: string;
  cry?: string | null;
};

export async function generateWildPokemon(): Promise<WildPokemon> {
  const apiBase = (import.meta.env.VITE_BACKEND_URL ?? '').trim().replace(/\/$/, '');
  const requestUrl = `${apiBase}/api/wild-pokemon`;
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  let body: { message?: string; wildPokemon?: WildPokemon } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message ?? 'Unable to generate a wild Pokemon right now.');
  }

  if (!body?.wildPokemon) {
    throw new Error('Wild Pokemon generation succeeded but no data was returned.');
  }

  return body.wildPokemon;
}
