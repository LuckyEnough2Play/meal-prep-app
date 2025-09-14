import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, FlatList } from 'react-native';
import { useApp } from '@/state/AppContext';
import {
  upsertPlan,
  setActivePlan,
  addShoppingItems,
  getActivePlan,
  estimatePlanCost,
  assignStoresForPlanItems,
  updatePlanFields,
  getStoreNamesMap,
  refreshStoreNow
} from '@/db';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { SwitchRow } from '@/ui/SwitchRow';

export default function Plan() {
  const { profile } = useApp();
  const [name, setName] = useState('My Plan');
  const [type, setType] = useState<'weekly' | 'event'>('weekly');
  const [multi, setMulti] = useState(false);
  const [planBudgetInput, setPlanBudgetInput] = useState('');

  const [summary, setSummary] = useState('');
  const [perStore, setPerStore] = useState<Array<{ storeId: string; storeName: string; cost: number; unknown: string[]; stale?: number }>>([]);
  const [potentialSavings, setPotentialSavings] = useState('');
  const [weeklyVariance, setWeeklyVariance] = useState('');
  const [planVariance, setPlanVariance] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; storeName?: string; estCost?: number }>>([]);

  useEffect(() => {
    (async () => {
      const ap = await getActivePlan();
      if (ap?.budgetTarget != null) setPlanBudgetInput(String(ap.budgetTarget));
      await refreshSummary();
    })();
  }, []);

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
      budgetTarget: planBudgetInput ? Number(planBudgetInput) : undefined,
      storeMode: multi ? 'multi' : 'one',
      meals: [],
      createdBy: profile.id,
      isActive: true
    });
    await setActivePlan(id);
    Alert.alert('Plan created', `${name} (${type}) set active`);
  };

  const onAddSampleItems = async () => {
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
    if (!stores.length) { setSummary('Select stores in onboarding'); return; }

    const one = await estimatePlanCost(ap.id, stores, 'one');
    let line = one.oneStoreBest ? `$${one.oneStoreBest.cost.toFixed(2)} at ${one.oneStoreBest.storeName}` : 'No price data';
    const unk = one.oneStoreBest?.unknown?.length || 0;
    if (unk) line += ` • ${unk} unknown`;
    if (ap.storeMode === 'multi' && stores.length > 1) {
      const multi = await estimatePlanCost(ap.id, stores, 'multi');
      if (multi.multiStore && one.oneStoreBest) {
        const delta = one.oneStoreBest.cost - multi.multiStore.cost;
        if (delta > 0.01) line += ` • save ~$${delta.toFixed(2)} multi-store`;
      }
      // Suggestions
      if (multi.suggestions && multi.suggestions.length) {
        const map = await getStoreNamesMap();
        const tops = multi.suggestions
          .filter((s) => s.estCost)
          .sort((a, b) => (b.estCost || 0) - (a.estCost || 0))
          .slice(0, 5)
          .map((s) => ({ name: s.name, storeName: s.bestStoreName || (s.bestStoreId ? map[s.bestStoreId] : undefined), estCost: s.estCost }));
        setSuggestions(tops);
      } else setSuggestions([]);
    } else setSuggestions([]);
    setSummary(line);
    setPerStore(one.perStore as any);

    // Variances
    if (profile?.weeklyBudget && one.oneStoreBest) {
      const diff = profile.weeklyBudget - one.oneStoreBest.cost;
      setWeeklyVariance(Math.abs(diff) < 0.01 ? 'At weekly budget' : diff > 0 ? `Under weekly by $${diff.toFixed(2)}` : `Over weekly by $${Math.abs(diff).toFixed(2)}`);
    } else setWeeklyVariance('');
    if (ap.budgetTarget != null && one.oneStoreBest) {
      const d2 = ap.budgetTarget - one.oneStoreBest.cost;
      setPlanVariance(Math.abs(d2) < 0.01 ? 'At plan budget' : d2 > 0 ? `Under plan by $${d2.toFixed(2)}` : `Over plan by $${Math.abs(d2).toFixed(2)}`);
    } else setPlanVariance('');
  };

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
      <Input value={planBudgetInput} onChangeText={setPlanBudgetInput} keyboardType="decimal-pad" />
      <SwitchRow label="Allow multi-store optimization" value={multi} onValueChange={setMulti} />
      <View style={{ height: 8 }} />
      <Button title="Create & Set Active" onPress={onCreate} />
      <View style={{ height: 12 }} />
      <Button title="Add Sample Items" onPress={onAddSampleItems} />
      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Active Plan Summary</Text>
      <Text style={styles.summary}>{summary}</Text>
      {!!weeklyVariance && <Text style={[styles.summary, { color: weeklyVariance.startsWith('Over') ? '#DC2626' : '#059669' }]}>{weeklyVariance}</Text>}
      {!!planVariance && <Text style={[styles.summary, { color: planVariance.startsWith('Over') ? '#DC2626' : '#059669' }]}>{planVariance}</Text>}
      <View style={{ height: 8 }} />
      <Text style={styles.subtitle}>Cost by Store</Text>
      <FlatList
        data={perStore}
        keyExtractor={(s) => s.storeId}
        renderItem={({ item }) => (
          <View style={styles.breakRow}>
            <Text style={{ fontWeight: '600' }}>{item.storeName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text>
                ${item.cost.toFixed(2)}
                {item.unknown.length ? ` • ${item.unknown.length} unknown` : ''}
                {item.stale ? ` • ${item.stale} stale` : ''}
              </Text>
              <Button title="Refresh" onPress={async () => { await refreshStoreNow(item.storeId); await refreshSummary(); }} />
            </View>
          </View>
        )}
      />
      {!!suggestions.length && (
        <>
          <View style={{ height: 8 }} />
          <Text style={styles.subtitle}>Top Savings Suggestions (multi-store)</Text>
          {suggestions.map((s, idx) => (
            <View key={idx} style={styles.breakRow}>
              <Text>{s.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text>{s.storeName ? `Buy at ${s.storeName}` : 'No match'}{s.estCost ? ` • ~$${s.estCost.toFixed(2)}` : ''}</Text>
                {!!s.storeName && (
                  <Button title="Map" onPress={async () => {
                    const ap = await getActivePlan();
                    if (!ap) return;
                    // @ts-ignore
                    const sid = (s as any).bestStoreId as string | undefined;
                    // @ts-ignore
                    const itemId = (s as any).bestItemId as string | undefined;
                    if (!sid || !itemId) return Alert.alert('Unavailable', 'No store item found to map.');
                    const { applyAliasToPlanItems } = await import('@/db');
                    await applyAliasToPlanItems(ap.id, s.name, sid, itemId);
                    await assignStoresForPlanItems(ap.id, profile?.preferredStores || [], 'multi');
                    await refreshSummary();
                    Alert.alert('Mapped', `Mapped "${s.name}" to ${s.storeName}.`);
                  }} />
                )}
              </View>
            </View>
          ))}
        </>
      )}
      <View style={{ height: 8 }} />
      <SwitchRow label="Use multi-store optimization" value={multi} onValueChange={setMulti} />
      <Button title="Apply to Active Plan" onPress={async () => {
        const ap = await getActivePlan();
        if (!ap) return Alert.alert('No active plan');
        await updatePlanFields(ap.id, { storeMode: multi ? 'multi' : 'one', budgetTarget: planBudgetInput ? Number(planBudgetInput) : null });
        const stores = profile?.preferredStores || [];
        await assignStoresForPlanItems(ap.id, stores, multi ? 'multi' : 'one');
        await refreshSummary();
        Alert.alert('Updated', `Store mode set to ${multi ? 'multi' : 'one'}`);
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, color: '#444', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  subtitle: { fontSize: 16, fontWeight: '700' },
  summary: { fontSize: 14, color: '#0a7', marginTop: 6 },
  breakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }
});
