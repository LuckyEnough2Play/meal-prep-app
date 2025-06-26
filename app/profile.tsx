import { supabase } from '@/utils/supabase';
import { ProfileData } from '@/utils/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [groceryStore, setGroceryStore] = useState<string>('');
  const [mealsPerWeek, setMealsPerWeek] = useState<string>('');
  const [peoplePerMeal, setPeoplePerMeal] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [priceLimit, setPriceLimit] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (!user) {
        // not logged in
        return;
      }
      // fetch existing profile
      const { data, error } = await supabase
        .from<ProfileData & { user_id: string }>('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }
      if (data) {
        setGroceryStore(data.groceryStore);
        setMealsPerWeek(String(data.mealsPerWeek));
        setPeoplePerMeal(String(data.peoplePerMeal));
        setAllergies(data.allergies);
        setPriceLimit(String(data.priceLimit));
      }
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    if (!groceryStore || !mealsPerWeek || !peoplePerMeal || !priceLimit) {
      Alert.alert('Please fill in all required fields.');
      return;
    }
    setSaving(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;
    if (!user) {
      Alert.alert('Authentication error');
      setSaving(false);
      return;
    }

    const profile: ProfileData & { user_id: string } = {
      user_id: user.id,
      groceryStore,
      mealsPerWeek: parseInt(mealsPerWeek, 10),
      peoplePerMeal: parseInt(peoplePerMeal, 10),
      allergies,
      priceLimit: parseFloat(priceLimit),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error saving profile:', error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    // Navigate to main tabs (home)
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Grocery Store</Text>
      <TextInput
        style={styles.input}
        value={groceryStore}
        onChangeText={setGroceryStore}
        placeholder="e.g. Walmart"
      />

      <Text style={styles.label}>Meals per Week</Text>
      <TextInput
        style={styles.input}
        value={mealsPerWeek}
        onChangeText={setMealsPerWeek}
        placeholder="e.g. 7"
        keyboardType="number-pad"
      />

      <Text style={styles.label}>People per Meal</Text>
      <TextInput
        style={styles.input}
        value={peoplePerMeal}
        onChangeText={setPeoplePerMeal}
        placeholder="e.g. 4"
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Allergies (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={allergies}
        onChangeText={setAllergies}
        placeholder="e.g. nuts, dairy"
      />

      <Text style={styles.label}>Price Limit per Person ($)</Text>
      <TextInput
        style={styles.input}
        value={priceLimit}
        onChangeText={setPriceLimit}
        placeholder="e.g. 10"
        keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
      />

      <View style={styles.button}>
        {saving ? (
          <ActivityIndicator />
        ) : (
          <Button title="Save Profile" onPress={onSave} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
  },
  button: {
    marginTop: 24,
  },
});
