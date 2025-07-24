-- Monad Dog App Database Schema
-- Run this in Supabase SQL Editor

-- 1. User XP Table
CREATE TABLE IF NOT EXISTS user_xp (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  daily_pets INTEGER DEFAULT 0,
  daily_greets INTEGER DEFAULT 0,
  daily_flips INTEGER DEFAULT 0,
  daily_slots INTEGER DEFAULT 0,
  total_pets INTEGER DEFAULT 0,
  total_greets INTEGER DEFAULT 0,
  total_flips INTEGER DEFAULT 0,
  total_slots INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Challenge Progress Table
CREATE TABLE IF NOT EXISTS challenge_progress (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  challenge_id VARCHAR(50) NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, challenge_id)
);

-- 4. Dog Collection Table
CREATE TABLE IF NOT EXISTS dog_collection (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  dog_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, dog_id)
);

-- 5. Transaction History Table
CREATE TABLE IF NOT EXISTS transaction_history (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  action_type VARCHAR(20) NOT NULL, -- 'pet', 'greet', 'flip', 'slots', 'claim'
  xp_gained INTEGER DEFAULT 0,
  tx_hash VARCHAR(66),
  block_number BIGINT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Leaderboard Table (for future use)
CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  dogs_collected INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_xp_wallet ON user_xp(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON user_xp(level);
CREATE INDEX IF NOT EXISTS idx_user_stats_wallet ON user_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_wallet ON challenge_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_dog_collection_wallet ON dog_collection(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_wallet ON transaction_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON transaction_history(action_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_xp ON leaderboard(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_level ON leaderboard(level DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_xp
CREATE POLICY "Users can view their own XP" ON user_xp
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own XP" ON user_xp
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own XP" ON user_xp
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for challenge_progress
CREATE POLICY "Users can view their own challenge progress" ON challenge_progress
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own challenge progress" ON challenge_progress
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own challenge progress" ON challenge_progress
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for dog_collection
CREATE POLICY "Users can view their own dog collection" ON dog_collection
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own dog collection" ON dog_collection
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for transaction_history
CREATE POLICY "Users can view their own transaction history" ON transaction_history
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own transaction history" ON transaction_history
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for leaderboard (public read, authenticated write)
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own leaderboard entry" ON leaderboard
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own leaderboard entry" ON leaderboard
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_user_xp_updated_at BEFORE UPDATE ON user_xp
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at BEFORE UPDATE ON challenge_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync user data
CREATE OR REPLACE FUNCTION sync_user_data(
  p_wallet_address VARCHAR(42),
  p_xp INTEGER DEFAULT 0,
  p_total_xp INTEGER DEFAULT 0,
  p_level INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- Upsert user_xp
  INSERT INTO user_xp (wallet_address, xp, total_xp, level)
  VALUES (p_wallet_address, p_xp, p_total_xp, p_level)
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    xp = EXCLUDED.xp,
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    updated_at = NOW();
    
  -- Upsert leaderboard
  INSERT INTO leaderboard (wallet_address, total_xp, level)
  VALUES (p_wallet_address, p_total_xp, p_level)
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    last_activity = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

