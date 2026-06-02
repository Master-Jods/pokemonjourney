-- PokéJourney Database Schema for Supabase
-- Created: 2026-05-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PLAYERS TABLE
-- =====================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  section TEXT,
  assigned_journey TEXT,
  starter_pokemon_id TEXT,
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique player names (case-insensitive)
  CONSTRAINT unique_player_name UNIQUE (LOWER(name))
);

-- Index for faster player lookups by name
CREATE INDEX idx_players_name ON players (LOWER(name));
CREATE INDEX idx_players_created_at ON players (created_at DESC);

-- =====================================================
-- OWNED_POKEMON TABLE
-- =====================================================
CREATE TABLE owned_pokemon (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pokemon_data_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 5 CHECK (level > 0 AND level <= 100),
  source TEXT NOT NULL CHECK (source IN ('Starter', 'PokeReflex', 'PokeGuess', 'IRL Catch', 'Manual Log')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for owned_pokemon
CREATE INDEX idx_owned_pokemon_player_id ON owned_pokemon (player_id);
CREATE INDEX idx_owned_pokemon_pokemon_data_id ON owned_pokemon (pokemon_data_id);
CREATE INDEX idx_owned_pokemon_caught_at ON owned_pokemon (caught_at DESC);

-- =====================================================
-- INVENTORY_ITEMS TABLE
-- =====================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one row per player per item
  CONSTRAINT unique_player_item UNIQUE (player_id, item_name)
);

-- Indexes for inventory
CREATE INDEX idx_inventory_player_id ON inventory_items (player_id);
CREATE INDEX idx_inventory_item_name ON inventory_items (item_name);

-- =====================================================
-- GAME_HISTORY TABLE
-- =====================================================
CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pokemon_id TEXT,
  game_name TEXT NOT NULL,
  result TEXT NOT NULL,
  level_gain INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  source_system TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for game_history
CREATE INDEX idx_game_history_player_id ON game_history (player_id);
CREATE INDEX idx_game_history_created_at ON game_history (created_at DESC);
CREATE INDEX idx_game_history_game_name ON game_history (game_name);
CREATE INDEX idx_game_history_source_system ON game_history (source_system);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for players table
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for owned_pokemon table
CREATE TRIGGER update_owned_pokemon_updated_at
  BEFORE UPDATE ON owned_pokemon
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for inventory_items table
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE owned_pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Public read/write access for all tables (for anonymous users in your app)
-- You can restrict this later if you add authentication

CREATE POLICY "Enable all access for players" ON players
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for owned_pokemon" ON owned_pokemon
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for inventory_items" ON inventory_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for game_history" ON game_history
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View: Player summary with Pokemon count
CREATE VIEW player_summary AS
SELECT
  p.id,
  p.name,
  p.section,
  p.assigned_journey,
  p.starter_pokemon_id,
  p.coins,
  p.created_at,
  COUNT(DISTINCT op.id) AS pokemon_count,
  COALESCE(SUM(ii.quantity), 0) AS total_items,
  COUNT(DISTINCT gh.id) AS games_played
FROM players p
LEFT JOIN owned_pokemon op ON p.id = op.player_id
LEFT JOIN inventory_items ii ON p.id = ii.player_id
LEFT JOIN game_history gh ON p.id = gh.player_id
GROUP BY p.id;

-- View: Pokemon with owner info
CREATE VIEW pokemon_roster AS
SELECT
  op.id,
  op.pokemon_data_id,
  op.level,
  op.source,
  op.status,
  op.caught_at,
  p.id AS player_id,
  p.name AS player_name
FROM owned_pokemon op
JOIN players p ON op.player_id = p.id
ORDER BY op.caught_at DESC;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample data:
/*
INSERT INTO players (name, coins) VALUES
  ('Ash', 100),
  ('Misty', 75),
  ('Brock', 50);

INSERT INTO owned_pokemon (player_id, pokemon_data_id, level, source)
SELECT id, 'bulbasaur', 10, 'Starter'
FROM players WHERE name = 'Ash';

INSERT INTO inventory_items (player_id, item_name, quantity)
SELECT id, 'Fire Stone', 2
FROM players WHERE name = 'Ash';
*/
