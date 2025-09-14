import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/AppContext';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

export default function ProfileSetup() {
  const { setProfile } = useApp();
  const [name, setName] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [dietTypes, setDietTypes] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [dislikes, setDislikes] = useState<string>('');

  const onSave = async () => {
    await setProfile({
      id: 'local-user',
      name,
      dietTypes: dietTypes.split(',').map((s) => s.trim()).filter(Boolean),
      allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
      dislikes: dislikes.split(',').map((s) => s.trim()).filter(Boolean),
      weeklyBudget: Number(weeklyBudget) || 0,
      preferredStores: []
    });
    router.push('/(onboarding)/stores');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <Input placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <Input
        placeholder="Weekly budget (USD)"
        value={weeklyBudget}
        onChangeText={setWeeklyBudget}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <Input
        placeholder="Diet types (comma-separated)"
        value={dietTypes}
        onChangeText={setDietTypes}
        style={styles.input}
      />
      <Input
        placeholder="Allergies (comma-separated)"
        value={allergies}
        onChangeText={setAllergies}
        style={styles.input}
      />
      <Input
        placeholder="Dislikes (comma-separated)"
        value={dislikes}
        onChangeText={setDislikes}
        style={styles.input}
      />
      <Button title="Save & Continue" onPress={onSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: {
    borderColor: '#ccc',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  }
});
