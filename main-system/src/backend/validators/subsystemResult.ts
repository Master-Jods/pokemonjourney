import { SubsystemResult } from '../types';

/**
 * Validator for shared/result-format/subsystem-result.schema.json.
 *
 * The schema currently requires:
 * playerName, gameName, result, levelGain, coinsEarned, sourceSystem.
 * additionalProperties is false, so extra fields are rejected here too.
 */
const allowedKeys = new Set([
  'playerName',
  'pokemonName',
  'gameName',
  'result',
  'levelGain',
  'coinsEarned',
  'sourceSystem',
]);

export function validateSubsystemResult(payload: unknown): SubsystemResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Subsystem result must be a JSON object.');
  }

  const value = payload as Record<string, unknown>;
  const extraKeys = Object.keys(value).filter(key => !allowedKeys.has(key));
  if (extraKeys.length > 0) {
    throw new Error(`Subsystem result has unsupported fields: ${extraKeys.join(', ')}.`);
  }

  const playerName = requireNonEmptyString(value.playerName, 'playerName');
  const gameName = requireNonEmptyString(value.gameName, 'gameName');
  const result = requireNonEmptyString(value.result, 'result');
  const sourceSystem = requireNonEmptyString(value.sourceSystem, 'sourceSystem');
  const levelGain = requireNonNegativeInteger(value.levelGain, 'levelGain');
  const coinsEarned = requireNonNegativeInteger(value.coinsEarned, 'coinsEarned');

  return {
    playerName,
    pokemonName: value.pokemonName === undefined ? undefined : requireString(value.pokemonName, 'pokemonName'),
    gameName,
    result,
    levelGain,
    coinsEarned,
    sourceSystem,
  };
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  const text = requireString(value, fieldName).trim();
  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }
  return text;
}

function requireNonNegativeInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
  return Number(value);
}

