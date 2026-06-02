# API Format

Subsystems send game outcomes to the main system using the shared result format in `shared/result-format/subsystem-result.schema.json`.

```json
{
  "playerName": "Ash",
  "pokemonName": "Pikachu",
  "gameName": "PokeReflex",
  "result": "caught",
  "levelGain": 2,
  "coinsEarned": 25,
  "sourceSystem": "catching-subsystem"
}
```
