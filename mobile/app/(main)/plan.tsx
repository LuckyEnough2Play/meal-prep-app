import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Switch, Alert } from 'react-native';
import { useApp } from '@/state/AppContext';
import { upsertPlan, setActivePlan, addShoppingItems } from '@/db';

export default function Plan() {
  const { profile } = useApp();
  const [name, setName] = useState('My Plan');
  const [type, setType] = useState<'weekly' | 'event'>('weekly');
  const [multi, setMulti] = useState(false);
  const [budget, setBudget] = useState('');

  const onCreate = async () => {
    if (!profile) return Alert.alert('Complete profile first');
    const now = new Date();
    const start = now;
    const end = type === 'weekly' ? new Date(now.getTime() + 6 * 86400000) : new Date(now.getTime() + 2 * 86400000);
    const id = `plan-${Date.now()}`;
    await upsertPlan({
      id,
      type,
      name,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      budgetTarget: budget ? Number(budget) : undefined,
      storeMode: multi ? 'multi' : 'one',
      meals: [],
      createdBy: profile.id,
      isActive: true
    });
    await setActivePlan(id);
    Alert.alert('Plan created', `${name} (${type}) set active`);
  };

  const onAddSampleItems = async () => {
    const { getActivePlan } = await import('@/db');
    const ap = await getActivePlan();
    if (!ap) return Alert.alert('No active plan');
    await addShoppingItems(ap.id, [
      { name: 'Chicken breast', qty: 2, unit: 'lb' },
      { name: 'Broccoli', qty: 2, unit: 'heads' },
      { name: 'Rice', qty: 2, unit: 'lb' }
    ]);
    Alert.alert('Items added', 'Sample items added to active plan');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plans</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g., Week 42" />
      <View style={styles.row}>
        <Text style={styles.label}>Weekly</Text>
        <Switch value={type === 'weekly'} onValueChange={(v) => setType(v ? 'weekly' : 'event')} />
        <Text style={styles.label}>Event</Text>
      </View>
      <Text style={styles.label}>Per-plan budget (USD)</Text>
      <TextInput value={budget} onChangeText={setBudget} keyboardType="decimal-pad" style={styles.input} />
      <View style={styles.row}>
        <Text style={styles.label}>Allow multi-store optimization</Text>
        <Switch value={multi} onValueChange={setMulti} />
      </View>
      <Button title="Create & Set Active" onPress={onCreate} />
      <View style={{ height: 12 }} />
      <Button title="Add Sample Items" onPress={onAddSampleItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, color: '#444', marginTop: 8 },
  input: { borderColor: '#ccc', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }
});
