import type { WildPokemon } from './wildPokemon';

export type CatchResult = {
  playerName: string;
  pokemonName: string;
  gameName: 'PokeReflex' | 'PokeGuess';
  result: 'caught' | 'fled';
  levelGain: number;
  coinsEarned: number;
  sourceSystem: 'catching_subsystem';
  wildPokemon?: WildPokemon;
};

export async function sendResultToMainSystem(payload: CatchResult): Promise<void> {
  const apiBase = (import.meta.env.VITE_BACKEND_URL ?? '').trim().replace(/\/$/, '');
  const requestUrl = `${apiBase}/api/results/catch`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let body: { message?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message ?? 'Failed to send result to the main system.');
  }
}
