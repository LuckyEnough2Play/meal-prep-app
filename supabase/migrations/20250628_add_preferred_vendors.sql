-- 2025-06-28: Add preferred_vendors column to profiles
ALTER TABLE profiles
  ADD COLUMN preferred_vendors TEXT[] DEFAULT ARRAY[]::TEXT[];
