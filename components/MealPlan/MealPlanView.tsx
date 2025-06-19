import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { MealPlan } from "../../utils/types";

type Props = {
  mealPlan: MealPlan;
};

export default function MealPlanView({ mealPlan }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mealPlan.week || "Weekly Meal Plan"}</Text>
      <FlatList
        data={mealPlan.meals}
        contentContainerStyle={styles.listContainer}
        keyExtractor={(item) => item.day + item.name}
        renderItem={({ item }) => (
          <View style={styles.mealCard}>
            <Text style={styles.day}>{item.day}</Text>
            <Text style={styles.mealName}>{item.name}</Text>
            <Text style={styles.section}>Ingredients:</Text>
            <Text style={styles.text}>{item.ingredients.join(", ")}</Text>
            <Text style={styles.section}>Instructions:</Text>
            <Text style={styles.text}>{item.instructions}</Text>
            <Text style={styles.section}>
              Estimated Cost: ${item.estimatedCost.toFixed(2)}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  mealCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  day: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a5d7c",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  section: {
    fontWeight: "bold",
    marginTop: 6,
  },
  text: {
    fontSize: 14,
    marginBottom: 2,
  },
  listContainer: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
});
