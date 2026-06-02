import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import { clampCoins, mapPlayer, Player, PlayerRow, WalletRow } from '../types';

function normalizePlayerName(playerName: string): string {
  const name = playerName.trim();
  if (!name) {
    throw new Error('Player name is required.');
  }
  return name;
}

async function getWallet(playerId: string): Promise<WalletRow | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select()
    .eq('player_id', playerId)
    .maybeSingle<WalletRow>();

  if (error) {
    throw new Error(`Failed to load wallet: ${error.message}`);
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
    throw new Error(`Failed to create wallet: ${error.message}`);
  }

  return data;
}

/**
 * Finds a player by the updated players.player_name column.
 */
export async function getPlayerByName(playerName: string): Promise<Player | null> {
  const name = normalizePlayerName(playerName);
  const { data, error } = await supabase
    .from('players')
    .select()
    .ilike('player_name', name)
    .maybeSingle<PlayerRow>();

  if (error) {
    throw new Error(`Failed to get player by name: ${error.message}`);
  }

  if (!data) return null;

  const wallet = await ensureWallet(data.id);
  return mapPlayer(data, wallet.coin_balance);
}

/**
 * Used by login/start journey. Existing names resume the same player record;
 * new names create a player row and matching wallets row.
 */
export async function findOrCreatePlayer(playerName: string): Promise<{ player: Player; isNew: boolean }> {
  const name = normalizePlayerName(playerName);
  const existing = await getPlayerByName(name);

  if (existing) {
    return { player: existing, isNew: false };
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ player_name: name })
    .select()
    .single<PlayerRow>();

  if (error) {
    throw new Error(`Failed to create player: ${error.message}`);
  }

  const wallet = await ensureWallet(data.id);
  const player = mapPlayer(data, wallet.coin_balance);

  await addHistoryLog({
    playerId: player.id,
    gameName: 'Journey Started',
    result: 'created',
    sourceSystem: 'main_system',
    loggedBy: 'main_system',
  });

  return { player, isNew: true };
}

/**
 * Adds or removes coins in wallets.coin_balance while keeping the balance >= 0.
 * A game_logs row is written for every explicit coin update.
 */
export async function updatePlayerCoins(
  playerId: string,
  amountDelta: number,
  reason = 'Coin Update',
  sourceSystem = 'main_system',
): Promise<number> {
  const wallet = await ensureWallet(playerId);
  const nextCoins = clampCoins(wallet.coin_balance + amountDelta);

  const { data, error } = await supabase
    .from('wallets')
    .update({ coin_balance: nextCoins })
    .eq('player_id', playerId)
    .select()
    .single<WalletRow>();

  if (error) {
    throw new Error(`Failed to update wallet coins: ${error.message}`);
  }

  await addHistoryLog({
    playerId,
    gameName: reason,
    result: amountDelta >= 0 ? 'coins added' : 'coins spent',
    coinsEarned: amountDelta,
    sourceSystem,
    loggedBy: sourceSystem,
  });

  return data.coin_balance;
}

export async function getPlayerCoins(playerId: string): Promise<number> {
  const wallet = await ensureWallet(playerId);
  return wallet.coin_balance;
}

