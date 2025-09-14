import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl } from 'react-native';
import { getActivePlan, listShoppingItems, toggleShoppingItemChecked, getStoreNamesMap, setListItemStore, getAisleForStoreAlias, estimatePlanCost } from '@/db';
import { useApp } from '@/state/AppContext';

export default function List() {
  const { profile } = useApp();
  const [planId, setPlanId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Array<{ key: string; title: string; items: any[] }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [suggestMap, setSuggestMap] = useState<Record<string, { storeId: string; storeName: string }>>({});

  const load = async () => {
    setRefreshing(true);
    const ap = await getActivePlan();
    setPlanId(ap?.id ?? null);
    const data = ap ? await listShoppingItems(ap.id) : [];
    setItems(data);
    // Build suggestions from plan estimate (multi-store)
    if (ap) {
      const storeIds = profile?.preferredStores || [];
      const est = await estimatePlanCost(ap.id, storeIds, 'multi');
      const map: Record<string, { storeId: string; storeName: string }> = {};
      if (est.suggestions) {
        for (const s of est.suggestions) {
          if (s.bestStoreId && s.bestStoreName) map[s.name.toLowerCase()] = { storeId: s.bestStoreId, storeName: s.bestStoreName };
        }
      }
      setSuggestMap(map);
    }
    // Group by store
    const groups: Record<string, any[]> = {};
    for (const it of data) {
      const key = it.storeId || 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    }
    // Sort items within store by aisle when available
    const arr = await Promise.all(Object.keys(groups).map(async (k) => {
      const title = k === 'unassigned' ? 'Unassigned' : (storeNames[k] || k);
      const itemsWithAisle = await Promise.all(groups[k].map(async (it) => {
        let aisle: string | null = null;
        if (k !== 'unassigned') {
          try { aisle = await getAisleForStoreAlias(k, it.name); } catch {}
        }
        return { ...it, aisle };
      }));
      itemsWithAisle.sort((a, b) => {
        const ai = a.aisle || '';
        const bi = b.aisle || '';
        if (ai && bi) {
          const an = parseInt(ai, 10), bn = parseInt(bi, 10);
          if (!isNaN(an) && !isNaN(bn)) return an - bn;
          return ai.localeCompare(bi);
        }
        if (ai) return -1;
        if (bi) return 1;
        return a.name.localeCompare(b.name);
      });
      return { key: k, title, items: itemsWithAisle };
    }));
    // Sort unassigned last
    arr.sort((a, b) => (a.key === 'unassigned' ? 1 : b.key === 'unassigned' ? -1 : a.title.localeCompare(b.title)));
    setGrouped(arr);
    // Load store names via DB helper
    try { setStoreNames(await getStoreNamesMap()); } catch {}
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string) => {
    if (!profile) return;
    await toggleShoppingItemChecked(id, profile.id);
    await load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping List</Text>
      {!planId && <Text style={{ color: '#666' }}>No active plan. Create one in the Plans tab.</Text>}
      <FlatList
        data={grouped}
        keyExtractor={(g) => g.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item: group }) => (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.section}>{group.title}</Text>
            {group.items.map((item) => {
              const checked = (item.checkedBy || []).includes(profile?.id);
              const suggestion = suggestMap[item.name.toLowerCase()];
              const showMove = suggestion && suggestion.storeId && suggestion.storeId !== group.key;
              return (
                <View key={item.id} style={styles.row}>
                  <Pressable onPress={() => toggle(item.id)} style={{ flex: 1 }}>
                    <Text style={[styles.item, checked && styles.checked]}>
                      {item.name} — {item.qty} {item.unit || ''} {item.aisle ? `• Aisle ${item.aisle}` : ''}
                    </Text>
                  </Pressable>
                  {showMove && (
                    <Pressable onPress={async () => { await setListItemStore(item.id, suggestion.storeId); await load(); }}>
                      <Text style={{ color: '#07a' }}>Move to {suggestion.storeName}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
      />
      <Text style={styles.note}>Checking an item syncs to all group members.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  row: { paddingVertical: 10 },
  item: { fontSize: 16 },
  checked: { textDecorationLine: 'line-through', color: '#888' },
  note: { marginTop: 12, color: '#666' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8 }
});
