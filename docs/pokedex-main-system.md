Main System Development Guideline
The Main System is the Pokedex Mobile App. It is the main application where all player progress is stored and displayed.

The Main System must include:
Player name entry
Player dashboard
Starter Pokemon selection
Pokedex / Pokémon log
Pokemon level tracking
Coin wallet
Pokemon Store
Inventory
Evolution feature
Facilitator manual logging
Game history
Result receiver from subsystems
Main System Assignment

Developer
Assigned Features
Developer 1
Player name entry, player dashboard, player records
Developer 2
Starter selection and Pokédex
Developer 3
Coins, Pokémon Store, inventory, and evolution
Developer 4
Facilitator logging, game history, and subsystem integration













Main System Step-by-Step Development

Step 1: Create the Start Page
The Start Page is the first screen that appears when the app is opened.
Required elements:
[ ] App title
[ ] Player name input field
[ ] Start Journey button
Example layout:
Welcome to PokéJourney!

Enter Player Name:
[________________]

[Start Journey]

Expected behavior:
1. Player enters name.
2. Player clicks Start Journey.
3. System checks if the name already exists.
4. If the name exists, load existing progress.
5. If the name does not exist, create new player record.
6. Redirect player to dashboard.












Step 2: Create Player Record
When a new player enters their name, the system must create a player record.
Player data should include:
player_id
player_name
section
assigned_journey
starter_pokemon_id
created_at
Minimum required fields:
player_id
player_name
created_at
Optional fields:
section
assigned_journey
starter_pokemon_id





















Step 3: Create Player Dashboard
After entering a name, the player should be redirected to their dashboard.
The dashboard should display:
Player Name
Starter Pokémon
Total Pokémon Caught
Total Coins
Total Level Points
Buttons to other pages
Example:
Player: Jods
Starter: Charmander
Coins: 75
Pokémon Caught: 4
Total Levels: 35

[Pokédex]
[Starter Selection]
[Pokémon Store]
[Inventory]
[Game History]



















Step 4: Create Starter Selection
The player must be able to choose or receive a starter Pokémon.
Starter Pokémon choices:
Region
Grass
Fire
Water
Kanto
Bulbasaur
Charmander
Squirtle
Unova
Snivy
Tepig
Oshawott
Paldea
Sprigatito
Fuecoco
Quaxly


Starter selection flow:
Player answers questionnaire
↓
System calculates result
↓
System recommends starter Pokémon
↓
Player confirms starter
↓
Starter is saved under player account
↓
Starter is added to player’s Pokédex
Important rule:
A player should only receive one starter Pokémon.
If the player already has a starter, show:
You already have a starter Pokémon: Charmander









Step 5: Create Pokémon Database
The system must have a list of available Pokémon.
Pokémon data should include:
pokemon_id
pokemon_name
type
region
image
evolution_stage
evolves_to
required_stone
Example:
pokemon_id: 001
pokemon_name: Bulbasaur
type: Grass
region: Kanto
evolution_stage: 1
evolves_to: Ivysaur
required_stone: Leaf Stone





















Step 6: Create Player Pokédex
The Pokédex shows all Pokémon owned by the player.
Each Pokémon record should display:
Pokémon Name
Type
Region
Level
Source
Status
Example:
Charmander
Type: Fire
Region: Kanto
Level: 15
Source: Starter
Status: Active
Possible Pokémon sources:
Starter
PokeReflex
PokeGuess
IRL Catch
Manual Log
















Step 7: Create Level Tracking
Each player-owned Pokémon must have its own level.
Level rules:

Result
Level Gain
Correct / Win
+10 levels
Wrong / Partial
+1 level
Lose
+0 level


Important rules:

[ ] Players cannot manually edit levels.
[ ] Levels can only be updated through game results or facilitator logging.
[ ] Every level update must be recorded in game history.
























Step 8: Create Coin Wallet
Each player must have a coin balance.
Suggested coin rewards:

Action
Coins
Successfully catch Pokémon
+20 coins
Win mini game
+15 coins
Partial attempt
+5 coins
Lose or failed attempt
+0 coins


Coin rules:
[ ] Coins increase when player wins or completes a challenge.
[ ] Coins decrease when player buys from the Pokémon Store.
[ ] Coin balance cannot go below zero.





















Step 9: Create Pokémon Store
The Pokémon Store allows players to buy items using coins.
Suggested store items:

Item
Price
Purpose
Fire Stone
50 coins
Used for Fire-type evolution
Water Stone
50 coins
Used for Water-type evolution
Leaf Stone
50 coins
Used for Grass-type evolution
Thunder Stone
60 coins
Used for Electric-type evolution
Rare Candy
40 coins
Adds bonus level


Store purchase flow:
Player selects item
↓
System checks if player has enough coins
↓
If enough, deduct coins
↓
Add item to inventory
↓
Record purchase in game history
If coins are not enough, show:
Not enough coins.










Step 10: Create Inventory
The inventory shows all items owned by the player.
Example:
Fire Stone x1
Water Stone x2
Inventory rules:
[ ] Purchased items must appear in inventory.
[ ] Item quantity should increase when bought.
[ ] Item quantity should decrease when used.































Step 11: Create Evolution Feature
The system should allow Pokémon to evolve.
Simple evolution rule:
A Pokémon can evolve if:
1. It reaches the required level.
2. The player owns the required evolution stone.
Suggested evolution requirements:
Evolution Stage
Requirement
First evolution
Level 20 + correct stone
Final evolution
Level 40 + correct stone

Type-based stone rule:

Pokémon Type
Required Stone
Fire
Fire Stone
Water
Water Stone
Grass
Leaf Stone
Electric
Thunder Stone

Evolution flow:
Player selects Pokémon
↓
System checks level requirement
↓
System checks required stone
↓
If valid, Pokémon evolves
↓
Stone quantity decreases
↓
Evolution is recorded in game history
If not valid, show:
This Pokémon cannot evolve yet.
























Step 12: Create Facilitator Manual Logging
The Facilitator Manual Logging feature is used for IRL games.
Facilitator should be able to log:
Player name
Game name
Result
Pokémon involved
Level gain
Coins earned
Notes
Manual logging examples:
Player: Jods
Game: IRL Catch a Pokémon
Result: Caught
Pokémon: Pikachu
Reward: +20 coins
Player: Jods
Game: Pokémon Showdown Battle
Result: Win
Pokémon: Charmander
Reward: +10 levels, +20 coins

Manual logging must update:
[ ] Player’s Pokédex, if Pokémon was caught
[ ] Pokémon level, if level was earned
[ ] Coin wallet, if coins were earned
[ ] Game history











Step 13: Create Game History
Game history records every important action.
Examples of history logs:
Jods selected Charmander as starter.
Jods caught Squirtle through PokeReflex.
Jods gained +10 levels from Battle Predictor.
Jods earned +15 coins.
Jods bought Fire Stone.
Jods evolved Charmander.
Game history should include:
history_id
player_id
pokemon_id
game_name
result
level_gain
coins_earned
source_system
created_at





















Step 14: Create Result Receiver for Subsystems
The Main System must receive results from Subsystem 1 and Subsystem 2.
Recommended result format:
{
 "playerName": "Jods",
 "pokemonName": "Squirtle",
 "gameName": "PokeReflex",
 "result": "caught",
 "levelGain": 0,
 "coinsEarned": 20,
 "sourceSystem": "catching_subsystem"
}
For leveling games:
{
 "playerName": "Jods",
 "pokemonName": "Charmander",
 "gameName": "Battle Predictor",
 "result": "correct",
 "levelGain": 10,
 "coinsEarned": 15,
 "sourceSystem": "leveling_subsystem"
}

The Main System must:
[ ] Find the player by playerName.
[ ] Update Pokémon record if needed.
[ ] Update level if needed.
[ ] Update coins if needed.
[ ] Save the result in game history.


