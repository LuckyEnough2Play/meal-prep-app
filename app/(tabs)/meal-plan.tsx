import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MealPlanView from "../../components/MealPlan/MealPlanView";
import { fetchMealPlan } from "../../utils/gptClient";
import { MealPlan, ProfileData } from "../../utils/types";

export default function MealPlanScreen() {
  const params = useLocalSearchParams();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    async function getPlan() {
      console.log("getPlan called with params:", params);
      setLoading(true);
      setError(null);
      try {
        // Convert params to ProfileData
        const profile: ProfileData = {
          groceryStore: String(params.groceryStore ?? ""),
          mealsPerWeek: Number(params.mealsPerWeek ?? 0),
          peoplePerMeal: Number(params.peoplePerMeal ?? 0),
          allergies: String(params.allergies ?? ""),
          priceLimit: Number(params.priceLimit ?? 0),
        };
        console.log("Profile for fetchMealPlan:", profile);
        const plan = await fetchMealPlan(profile);
        console.log("Parsed mealPlan:", plan);
        setMealPlan(plan);
      } catch (e: any) {
        setError(
          (typeof e === "object" && e && "message" in e)
            ? (e as any).message
            : String(e) || "Failed to load meal plan."
        );
        setMealPlan(null);
        // Optionally log error for debugging
        if (typeof window !== "undefined" && window.console) {
          console.error("Meal plan fetch error:", e);
        }
      }
      setLoading(false);
    }
    getPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text>{error}</Text></View>;
  if (!mealPlan) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text>No meal plan found.</Text></View>;
  return <MealPlanView mealPlan={mealPlan} />;
}
