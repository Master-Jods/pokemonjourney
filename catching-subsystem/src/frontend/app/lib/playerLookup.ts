export type PlayerRecord = {
  id: string;
  player_name: string;
  section: string | null;
  assigned_journey: string | null;
  pokedex_id: number | null;
  coin_balance: number | null;
  created_at: string;
};

export function normalizePlayerName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, ' ');
}

export async function findPlayerByName(rawName: string): Promise<PlayerRecord> {
  const normalizedName = normalizePlayerName(rawName);

  if (!normalizedName) {
    throw new Error('Player name is required.');
  }

  const apiBase = (import.meta.env.VITE_BACKEND_URL ?? '').trim().replace(/\/$/, '');
  const requestUrl = `${apiBase}/api/player/lookup?name=${encodeURIComponent(normalizedName)}`;
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  let body: { message?: string; player?: PlayerRecord } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message ?? 'Unable to verify player right now.');
  }

  if (!body?.player) {
    throw new Error('Player lookup succeeded but no player data was returned.');
  }

  return body.player;
}
