export interface ProfileData {
  groceryStore: string;
  mealsPerWeek: number;
  peoplePerMeal: number;
  allergies: string;
  priceLimit: number;
}

export interface MealPlan {
  week: string;
  meals: Array<{
    day: string;
    name: string;
    ingredients: string[];
    instructions: string;
    estimatedCost: number;
  }>;
}
