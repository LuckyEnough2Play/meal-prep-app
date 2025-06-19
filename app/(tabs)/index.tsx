import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ProfileData } from "../../utils/types";

export default function HomeScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>({
    groceryStore: "Walmart",
    mealsPerWeek: 7,
    peoplePerMeal: 2,
    allergies: "None",
    priceLimit: 10,
  });

  const handleChange = (key: keyof ProfileData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "mealsPerWeek" || key === "peoplePerMeal" || key === "priceLimit"
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.groceryStore || !form.mealsPerWeek || !form.peoplePerMeal || !form.priceLimit) {
      Alert.alert("Please fill out all required fields.");
      return;
    }
    router.push({
      pathname: "/meal-plan",
      params: {
        groceryStore: form.groceryStore,
        mealsPerWeek: String(form.mealsPerWeek),
        peoplePerMeal: String(form.peoplePerMeal),
        allergies: form.allergies,
        priceLimit: String(form.priceLimit),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meal Prep Profile</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Grocery Store *</Text>
        <TextInput
          style={styles.input}
          value={form.groceryStore}
          onChangeText={(v) => handleChange("groceryStore", v)}
          placeholder="e.g. Walmart"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Meals per Week *</Text>
        <TextInput
          style={styles.input}
          value={String(form.mealsPerWeek)}
          onChangeText={(v) => handleChange("mealsPerWeek", v)}
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>People per Meal *</Text>
        <TextInput
          style={styles.input}
          value={String(form.peoplePerMeal)}
          onChangeText={(v) => handleChange("peoplePerMeal", v)}
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={styles.input}
          value={form.allergies}
          onChangeText={(v) => handleChange("allergies", v)}
          placeholder="e.g. peanuts, gluten"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Price Limit per Person ($) *</Text>
        <TextInput
          style={styles.input}
          value={String(form.priceLimit)}
          onChangeText={(v) => handleChange("priceLimit", v)}
          keyboardType="decimal-pad"
        />
      </View>
      <Button title="Get Meal Plan" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
});
