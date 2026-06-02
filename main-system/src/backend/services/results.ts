import { getPokemonByName } from '../../../../shared/data/pokemonData';
import { addHistoryLog } from './history';
import { getPlayerByName, updatePlayerCoins } from './players';
import { addCaughtPokemon, getOwnedPokemonBySpecies, updatePokemonLevel } from './pokemon';
import { ServiceResult, SubsystemResult } from '../types';
import { validateSubsystemResult } from '../validators/subsystemResult';

function sourceForCaughtPokemon(sourceSystem: string) {
  const normalized = sourceSystem.toLowerCase();
  if (normalized.includes('guess')) return 'PokeGuess' as const;
  if (normalized.includes('catch') || normalized.includes('reflex')) return 'PokeReflex' as const;
  return 'Manual Log' as const;
}

/**
 * Receives a subsystem result, validates it against the shared result format,
 * updates the right player records, and writes game_logs.
 */
export async function processSubsystemResult(payload: unknown): Promise<ServiceResult<SubsystemResult>> {
  const result = validateSubsystemResult(payload);
  const player = await getPlayerByName(result.playerName);

  if (!player) {
    throw new Error(`Player "${result.playerName}" not found.`);
  }

  const pokemonData = result.pokemonName ? getPokemonByName(result.pokemonName) : undefined;
  const ownedPokemon = pokemonData ? await getOwnedPokemonBySpecies(player.id, pokemonData.id) : null;

  if (result.result.toLowerCase() === 'caught' && pokemonData && !ownedPokemon) {
    await addCaughtPokemon(
      player.id,
      pokemonData.id,
      sourceForCaughtPokemon(result.sourceSystem),
      result.coinsEarned,
      result.gameName,
      `${player.name} caught ${pokemonData.name} through ${result.gameName}.`,
      result.sourceSystem,
    );

    if (result.coinsEarned > 0) {
      await updatePlayerCoins(player.id, result.coinsEarned, result.gameName, result.sourceSystem);
    }

    return { data: result, message: `Catch result processed for ${player.name}.` };
  }

  if (ownedPokemon && result.levelGain > 0) {
    await updatePokemonLevel(
      player.id,
      ownedPokemon.id,
      result.levelGain,
      result.coinsEarned,
      result.gameName,
      result.result,
      result.sourceSystem,
      `${player.name} gained +${result.levelGain} levels from ${result.gameName}.`,
    );

    if (result.coinsEarned > 0) {
      await updatePlayerCoins(player.id, result.coinsEarned, result.gameName, result.sourceSystem);
    }

    return { data: result, message: `Level result processed for ${player.name}.` };
  }

  await addHistoryLog({
    playerId: player.id,
    pokemonId: ownedPokemon?.pokemonDataId ?? pokemonData?.id,
    gameName: result.gameName,
    result: result.result,
    levelGain: result.levelGain,
    coinsEarned: result.coinsEarned,
    sourceSystem: result.sourceSystem,
    notes: `Subsystem result received from ${result.sourceSystem}.`,
    loggedBy: result.sourceSystem,
  });

  if (result.coinsEarned > 0) {
    await updatePlayerCoins(player.id, result.coinsEarned, result.gameName, result.sourceSystem);
  }

  return { data: result, message: `Result processed for ${player.name}.` };
}
