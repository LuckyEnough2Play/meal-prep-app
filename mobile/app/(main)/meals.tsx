import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { useApp } from '@/state/AppContext';
import { appendMealToPlan, addOrMergeShoppingItems, estimateRecipeCost, getActivePlan, listRecipes, seedRecipesIfEmpty } from '@/db';
import { STARTER_RECIPES } from '@/data/recipes';
import { evaluateCompatibility } from '@/features/recipes/compatibility';
import type { Recipe } from '@/models/types';

export default function Meals() {
  const { profile } = useApp();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [servingsById, setServings] = useState<Record<string, string>>({});

  const load = async () => {
    await seedRecipesIfEmpty(STARTER_RECIPES);
    const all = await listRecipes();
    // Sort by compatibility descending, exclude hard excludes
    const withComp = all
      .map((r) => ({ r, c: evaluateCompatibility(r, profile) }))
      .filter((x) => !x.c.hardExcluded)
      .sort((a, b) => b.c.score - a.c.score)
      .map((x) => x.r);
    setRecipes(withComp);
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  const addToPlan = async (r: Recipe) => {
    const s = Number(servingsById[r.id] || '1') || 1;
    let ap = await getActivePlan();
    if (!ap) {
      // Ensure there is an active plan
      const { upsertPlan, setActivePlan } = await import('@/db');
      const now = new Date();
      const id = `plan-${Date.now()}`;
      await upsertPlan({
        id,
        type: 'weekly',
        name: 'Auto Plan',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 6 * 86400000).toISOString(),
        storeMode: 'one',
        budgetTarget: profile?.weeklyBudget ?? undefined,
        meals: [],
        createdBy: profile?.id || 'local-user',
        isActive: true
      });
      await setActivePlan(id);
      ap = await getActivePlan();
    }
    if (!ap) return Alert.alert('Unable to create active plan');

    await appendMealToPlan(ap.id, { recipeId: r.id, servings: s });
    // Create items scaled by servings
    const items = (r.ingredients || []).map((i) => ({ name: i.name || '', qty: (i.qty || 0) * s, unit: i.unit }));
    await addOrMergeShoppingItems(ap.id, items);
    Alert.alert('Added', `${r.name} x ${s} added to plan and list.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Discovery</Text>
      <FlatList
        data={recipes}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{(item.tags || []).join(' • ')}</Text>
            <CostEstimate recipe={item} servings={Number(servingsById[item.id] || '1') || 1} />
            <View style={styles.row}>
              <TextInput
                style={styles.servings}
                keyboardType="number-pad"
                value={servingsById[item.id] || '1'}
                onChangeText={(v) => setServings((p) => ({ ...p, [item.id]: v }))}
              />
              <Pressable onPress={() => addToPlan(item)} style={styles.addBtn}>
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd', borderRadius: 10, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  servings: { width: 60, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 8, padding: 8 },
  addBtn: { backgroundColor: '#0a7', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  addText: { color: 'white', fontWeight: '700' }
});

function CostEstimate({ recipe, servings }: { recipe: Recipe; servings: number }) {
  const { profile } = useApp();
  const [text, setText] = useState<string>('');
  useEffect(() => {
    (async () => {
      const stores = profile?.preferredStores || [];
      if (stores.length === 0) {
        setText('Select stores to see savings');
        return;
      }
      const mode: 'one' | 'multi' = 'one'; // quick hint; true mode lives on plan, but for card preview show one-store
      const est = await estimateRecipeCost(recipe, servings, stores, mode);
      if (!est.oneStoreBest) {
        setText('No price data yet');
        return;
      }
      const unknown = est.oneStoreBest.unknown.length;
      const approx = unknown > 0 ? '~' : '';
      setText(`${approx}$${est.oneStoreBest.cost.toFixed(2)} at ${est.oneStoreBest.storeName}${unknown ? ` • ${unknown} unknown` : ''}`);
    })();
  }, [recipe.id, servings, profile?.preferredStores?.join(',')]);
  return <Text style={{ fontSize: 12, color: '#0a7', marginTop: 6 }}>{text}</Text>;
}
