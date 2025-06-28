-- 2025-06-29: Create cart table for user carts

-- Cart table
CREATE TABLE IF NOT EXISTS carts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  meals           UUID[] DEFAULT ARRAY[]::UUID[],
  total_cost      NUMERIC DEFAULT 0,
  coupons_applied JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cart_updated_at ON carts;
CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
