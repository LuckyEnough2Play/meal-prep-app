import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, Alert, FlatList } from 'react-native';
import { useApp } from '@/state/AppContext';
import { upsertPlan, setActivePlan, addShoppingItems, getActivePlan, estimatePlanCost, assignStoresForPlanItems, updatePlanFields } from '@/db';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { SwitchRow } from '@/ui/SwitchRow';

export default function Plan() {
  const { profile } = useApp();
  const [name, setName] = useState('My Plan');
  const [type, setType] = useState<'weekly' | 'event'>('weekly');
  const [multi, setMulti] = useState(false);
  const [budget, setBudget] = useState('');
  const [summary, setSummary] = useState<string>('');
  const [perStore, setPerStore] = useState<Array<{ storeId: string; storeName: string; cost: number; unknown: string[] }>>([]);
  const [unknownCount, setUnknownCount] = useState<number>(0);
  const [potentialSavings, setPotentialSavings] = useState<string>('');

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

  const refreshSummary = async () => {
    const ap = await getActivePlan();
    if (!ap) { setSummary('No active plan'); return; }
    const stores = profile?.preferredStores || [];
    if (stores.length === 0) { setSummary('Select stores in onboarding'); return; }
    const one = await estimatePlanCost(ap.id, stores, 'one');
    let line = one.oneStoreBest ? `$${one.oneStoreBest.cost.toFixed(2)} at ${one.oneStoreBest.storeName}` : 'No price data';
    if (ap.storeMode === 'multi' && stores.length > 1) {
      const multiEst = await estimatePlanCost(ap.id, stores, 'multi');
      if (multiEst.multiStore && one.oneStoreBest) {
        const delta = one.oneStoreBest.cost - multiEst.multiStore.cost;
        if (delta > 0.01) line += ` • save ~$${delta.toFixed(2)} multi-store`;
      }
    }
    const unk = one.oneStoreBest?.unknown?.length || 0;
    if (unk) line += ` • ${unk} unknown`;
    setSummary(line);
    setPerStore(one.perStore || []);
    setUnknownCount(unk);
    // compute potential savings if switching to multi
    if (stores.length > 1 && one.oneStoreBest) {
      const multiEst = await estimatePlanCost(ap.id, stores, 'multi');
      if (multiEst.multiStore) {
        const delta = one.oneStoreBest.cost - multiEst.multiStore.cost;
        setPotentialSavings(delta > 0.01 ? `Switching to multi-store saves ~$${delta.toFixed(2)}` : '');
      }
    } else {
      setPotentialSavings('');
    }
  };

  useEffect(() => { refreshSummary(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plans</Text>
      <Text style={styles.label}>Name</Text>
      <Input value={name} onChangeText={setName} placeholder="e.g., Week 42" />
      <View style={styles.row}>
        <Text style={styles.label}>Weekly</Text>
        <Switch value={type === 'weekly'} onValueChange={(v) => setType(v ? 'weekly' : 'event')} />
        <Text style={styles.label}>Event</Text>
      </View>
      <Text style={styles.label}>Per-plan budget (USD)</Text>
      <Input value={budget} onChangeText={setBudget} keyboardType="decimal-pad" />
      <SwitchRow label="Allow multi-store optimization" value={multi} onValueChange={setMulti} />
      <View style={{ height: 8 }} />
      <Button title="Create & Set Active" onPress={onCreate} />
      <View style={{ height: 12 }} />
      <Button title="Add Sample Items" onPress={onAddSampleItems} />
      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Active Plan Summary</Text>
      <Text style={styles.summary}>{summary}</Text>
      {!!potentialSavings && <Text style={[styles.summary, { color: '#059669' }]}>{potentialSavings}</Text>}
      <View style={{ height: 8 }} />
      <Text style={styles.subtitle}>Cost by Store</Text>
      <FlatList
        data={perStore}
        keyExtractor={(s) => s.storeId}
        renderItem={({ item }) => (
          <View style={styles.breakRow}>
            <Text style={{ fontWeight: '600' }}>{item.storeName}</Text>
            <Text>${item.cost.toFixed(2)}{item.unknown.length ? ` • ${item.unknown.length} unknown` : ''}</Text>
          </View>
        )}
      />
      <View style={{ height: 8 }} />
      <SwitchRow label="Use multi-store optimization" value={multi} onValueChange={setMulti} />
      <Button title="Apply to Active Plan" onPress={async () => {
        const ap = await getActivePlan();
        if (!ap) return Alert.alert('No active plan');
        await updatePlanFields(ap.id, { storeMode: multi ? 'multi' : 'one' });
        const stores = profile?.preferredStores || [];
        await assignStoresForPlanItems(ap.id, stores, multi ? 'multi' : 'one');
        await refreshSummary();
        Alert.alert('Updated', `Store mode set to ${multi ? 'multi' : 'one'}`);
      }} />
      <View style={{ height: 8 }} />
      <Button title="Assign stores to list items" onPress={async () => {
        const ap = await getActivePlan();
        if (!ap) return Alert.alert('No active plan');
        const stores = profile?.preferredStores || [];
        if (stores.length === 0) return Alert.alert('Pick stores');
        await assignStoresForPlanItems(ap.id, stores, ap.storeMode);
        Alert.alert('Assigned', 'Items now tagged with suggested stores');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, color: '#444', marginTop: 8 },
  input: { borderColor: '#ccc', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  subtitle: { fontSize: 16, fontWeight: '700' },
  summary: { fontSize: 14, color: '#0a7', marginTop: 6 }
});
