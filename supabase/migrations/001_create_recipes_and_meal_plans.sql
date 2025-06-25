-- Create recipes table
create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  ingredients jsonb not null,
  instructions text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create recipe_deals join table to link scraped deals to recipes
create table if not exists public.recipe_deals (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  deal_identifier text not null,
  created_at timestamp with time zone default now()
);

-- Create user_meal_plans table to store suggested meal plans per user
create table if not exists public.user_meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  plan jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
