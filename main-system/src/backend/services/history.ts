import { supabase } from '../supabaseClient';
import { GameHistoryEntry, GameLogRow, HistoryLogInput, mapHistoryEntry, toPokemonDbId } from '../types';

/**
 * Writes one immutable audit entry to game_logs.
 * All gameplay services call this after they change player state.
 */
export async function addHistoryLog(input: HistoryLogInput): Promise<GameHistoryEntry> {
  const { data, error } = await supabase
    .from('game_logs')
    .insert({
      player_id: input.playerId,
      pokemon_id: toPokemonDbId(input.pokemonId),
      game_name: input.gameName,
      result: input.result,
      level_gain: Math.max(0, Math.trunc(input.levelGain ?? 0)),
      coins_earned: Math.trunc(input.coinsEarned ?? 0),
      source_system: input.sourceSystem,
      logged_by: input.loggedBy ?? input.notes ?? null,
    })
    .select()
    .single<GameLogRow>();

  if (error) {
    throw new Error(`Failed to add game log: ${error.message}`);
  }

  return mapHistoryEntry(data);
}

