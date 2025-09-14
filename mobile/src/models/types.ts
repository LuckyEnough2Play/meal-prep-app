export type DietType =
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'gluten-free'
  | 'paleo'
  | 'dairy-free';

export interface UserProfile {
  id: string;
  name: string;
  dietTypes: DietType[] | string[];
  allergies: string[];
  dislikes: string[];
  weeklyBudget: number;
  homeLocation?: { lat: number; lon: number };
  preferredStores: string[]; // store ids
}

export interface Store {
  id: string; // e.g., 'aldi', 'publix'
  name: string;
  lastPriceRefresh?: number;
}

export interface IngredientCanonical {
  id: string;
  name: string;
  unit?: string;
  tags?: string[];
}

export interface RecipeIngredientRef {
  ingredientId?: string;
  name?: string;
  qty: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredientRef[];
  instructions?: string;
  tags?: string[];
  dietTypes?: string[];
  allergens?: string[];
  timePrep?: number;
  timeCook?: number;
  createdBy?: string;
}

export type PlanType = 'weekly' | 'event';

export interface PlanMealRef {
  recipeId: string;
  servings: number;
}

export interface Plan {
  id: string;
  type: PlanType;
  name?: string;
  startDate: string; // ISO
  endDate: string; // ISO
  budgetTarget?: number;
  storeMode: 'one' | 'multi';
  meals: PlanMealRef[];
  createdBy: string;
  isActive?: boolean;
}

export interface ShoppingListItem {
  id: string;
  planId: string;
  storeId?: string;
  ingredientId?: string;
  name: string;
  qty: number;
  unit?: string;
  checkedBy: string[]; // user ids
}

export interface Group {
  id: string;
  name: string;
  type: 'static' | 'event';
  expiresAt?: string; // ISO
  memberIds: string[];
  adminIds: string[];
}
