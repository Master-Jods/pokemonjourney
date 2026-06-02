import { addHistoryLog } from './history';
import { updatePlayerCoins } from './players';
import { addCaughtPokemon, updatePokemonLevel } from './pokemon';
import { ManualLogInput, ServiceResult } from '../types';

/**
 * Manual facilitator logging follows the same rules as subsystem results:
 * update Pokemon if selected, update coins if awarded, and always write
 * game_logs so the facilitator action is auditable.
 */
export async function createManualLog(input: ManualLogInput): Promise<ServiceResult<ManualLogInput>> {
  const sourceSystem = input.sourceSystem ?? 'facilitator';
  const notes = input.notes?.trim() || 'Manual facilitator log.';

  if (input.addNewPokemon && input.pokemonDataId) {
    await addCaughtPokemon(
      input.playerId,
      input.pokemonDataId,
      'Manual Log',
      input.coinsEarned,
      input.gameName,
      notes,
      sourceSystem,
    );
  } else if (input.ownedPokemonId && input.levelGain > 0) {
    await updatePokemonLevel(
      input.playerId,
      input.ownedPokemonId,
      input.levelGain,
      input.coinsEarned,
      input.gameName,
      input.result,
      sourceSystem,
      notes,
    );
  } else {
    await addHistoryLog({
      playerId: input.playerId,
      pokemonId: input.pokemonDataId,
      gameName: input.gameName,
      result: input.result,
      levelGain: input.levelGain,
      coinsEarned: input.coinsEarned,
      sourceSystem,
      loggedBy: notes,
    });
  }

  if (input.coinsEarned !== 0) {
    await updatePlayerCoins(input.playerId, input.coinsEarned, input.gameName, sourceSystem);
  }

  return { data: input, message: 'Manual log created successfully.' };
}
