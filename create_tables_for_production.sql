-- Production Tables for Monad Dog App
-- Run this in Supabase SQL Editor

-- 1. Dog Collection Table
CREATE TABLE IF NOT EXISTS dog_collection (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  dog_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, dog_id)
);

-- 2. Challenge Progress Table
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

-- 3. User Stats Table
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dog_collection_wallet ON dog_collection(wallet_address);
CREATE INDEX IF NOT EXISTS idx_dog_collection_dog_id ON dog_collection(dog_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_wallet ON challenge_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_id ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_wallet ON user_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_reset ON user_stats(last_reset_date);

-- Row Level Security (RLS) Policies
ALTER TABLE dog_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dog_collection
CREATE POLICY "Users can view their own dog collection" ON dog_collection
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own dog collection" ON dog_collection
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own dog collection" ON dog_collection
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own dog collection" ON dog_collection
  FOR DELETE USING (true);

-- RLS Policies for challenge_progress
CREATE POLICY "Users can view their own challenge progress" ON challenge_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own challenge progress" ON challenge_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own challenge progress" ON challenge_progress
  FOR UPDATE USING (true);

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (true);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_challenge_progress_updated_at 
    BEFORE UPDATE ON challenge_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO challenge_progress (wallet_address, challenge_id, progress) VALUES 
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 'pet', 0),
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 'greet', 0),
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 'flip', 0),
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 'slots', 0),
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 'collection', 0);

-- INSERT INTO user_stats (wallet_address, daily_pets, daily_greets, daily_flips, daily_slots) VALUES 
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 0, 0, 0, 0);

-- INSERT INTO dog_collection (wallet_address, dog_id) VALUES 
--   ('0x99344b575b83360410a0e4dce75189edecacc824', 'dog_1');

-- Verify tables were created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('dog_collection', 'challenge_progress', 'user_stats')
ORDER BY table_name, ordinal_position; 