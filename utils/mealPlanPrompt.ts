import { ProfileData } from "./types";

export function formatMealPlanPrompt(profile: ProfileData): string {
  return `
You are a meal planning assistant. Create a weekly meal plan for a household with these preferences:
- Grocery store: ${profile.groceryStore}
- Meals per week: ${profile.mealsPerWeek}
- People per meal: ${profile.peoplePerMeal}
- Allergies: ${profile.allergies || "None"}
- Price limit per person: $${profile.priceLimit}

Return the plan as a JSON object with days, meal names, ingredients, instructions, and estimated cost per meal.
  `.trim();
}
