# Main System Backend

TypeScript service layer for the PokeJourney Main System Supabase backend.

These files are intentionally isolated from `src/frontend` so the frontend member can integrate them later without losing UI work.

## Environment

Set these variables before calling the services:

```text
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The client also accepts `SUPABASE_URL` and `SUPABASE_ANON_KEY` as fallbacks.

## Database

The services match the updated schema guide and query these tables using snake_case columns:

- `players`
- `wallets`
- `pokemon`
- `player_pokemon`
- `store_items`
- `inventory`
- `game_logs`

Returned objects are converted to camelCase for frontend use.

## Main Exports

- `findOrCreatePlayer(playerName)`
- `getPlayerByName(playerName)`
- `addHistoryLog(input)`
- `addCaughtPokemon(playerId, pokemonDataId, source, coinsEarned, gameName, notes, sourceSystem)`
- `updatePokemonLevel(playerId, ownedPokemonId, levelGain, coinsEarned, gameName, result, sourceSystem, notes)`
- `updatePlayerCoins(playerId, amountDelta, reason, sourceSystem)`
- `buyStoreItem(playerId, itemName, price)`
- `consumeInventoryItem(playerId, itemName, quantity, reason)`
- `evolvePokemon(playerId, ownedPokemonId, newPokemonDataId, stoneName)`
- `processSubsystemResult(payload)`
- `createManualLog(input)`

## Demo Notes

- Levels are clamped at 100.
- Coins are clamped so they never go below 0.
- Subsystem payloads are validated against the shared result format rules.
- Every gameplay mutation writes to `game_logs` for auditing.
