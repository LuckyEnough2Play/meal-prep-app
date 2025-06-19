import { MealPlan, ProfileData } from "./types";

export async function fetchMealPlan(profile: ProfileData): Promise<MealPlan> {
const res = await fetch("/api/mealplan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Backend error: ${error}`);
  }

  // Parse the JSON response and transform to MealPlan shape
  const raw = await res.json();
  const weekly = raw.weeklyMealPlan as Record<string, any>;
  const meals = Object.entries(weekly).map(([day, details]) => ({
    day,
    name: details.mealName,
    ingredients: details.ingredients,
    instructions: details.instructions,
    estimatedCost: parseFloat(
      String(details.estimatedCostPerMeal).replace(/[^0-9.]/g, "")
    ),
  }));

  const mealPlan: MealPlan = {
    week: raw.week || "Weekly Meal Plan",
    meals,
  };
  return mealPlan;
}
