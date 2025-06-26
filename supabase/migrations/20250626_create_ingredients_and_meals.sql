-- 2025-06-26: Create ingredient and meal data models

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ingredients master table
CREATE TABLE IF NOT EXISTS ingredients (
  id              SERIAL PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,       -- e.g. “Red-Protein”
  name            TEXT NOT NULL,
  category        TEXT,                       -- e.g. “Protein”, “Fat”
  allergen_tags   TEXT[] DEFAULT ARRAY[]::TEXT[],
  diet_tags       TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  instructions    TEXT,
  nutrition       JSONB,                      -- e.g. calories, macros
  tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
  serving_size    INTEGER,
  user_id         UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join table for meal ingredients
CREATE TABLE IF NOT EXISTS meal_ingredients (
  meal_id         UUID REFERENCES meals(id) ON DELETE CASCADE,
  ingredient_id   INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity        NUMERIC NOT NULL,
  unit            TEXT,
  PRIMARY KEY (meal_id, ingredient_id)
);
