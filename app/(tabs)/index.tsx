import MealPlanView from "@/components/MealPlan/MealPlanView";
import { fetchMealPlan } from "@/utils/gptClient";
import { supabase } from "@/utils/supabase";
import { MealPlan, ProfileData } from "@/utils/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
-        router.replace("/profile");
+        router.replace("profile");
        return;
      }

      const { data, error } = await supabase
        .from<ProfileData & { user_id: string }>("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
-        router.replace("/profile");
+        router.replace("profile");
        return;
      }

      const profile: ProfileData = {
        groceryStore: data.groceryStore,
        mealsPerWeek: data.mealsPerWeek,
        peoplePerMeal: data.peoplePerMeal,
        allergies: data.allergies,
        priceLimit: data.priceLimit,
      };

      try {
        const plan = await fetchMealPlan(profile);
        setMealPlan(plan);
      } catch (err) {
        console.error("Error fetching meal plan:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!mealPlan) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No meal plan available.</Text>
      </View>
    );
  }

  return <MealPlanView mealPlan={mealPlan} />;
}
