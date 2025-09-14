import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl } from 'react-native';
import { getActivePlan, listShoppingItems, toggleShoppingItemChecked, getStoreNamesMap } from '@/db';
import { useApp } from '@/state/AppContext';

export default function List() {
  const { profile } = useApp();
  const [planId, setPlanId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Array<{ key: string; title: string; items: any[] }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  const load = async () => {
    setRefreshing(true);
    const ap = await getActivePlan();
    setPlanId(ap?.id ?? null);
    const data = ap ? await listShoppingItems(ap.id) : [];
    setItems(data);
    // Group by store
    const groups: Record<string, any[]> = {};
    for (const it of data) {
      const key = it.storeId || 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    }
    const arr = Object.keys(groups).map((k) => ({ key: k, title: k === 'unassigned' ? 'Unassigned' : (storeNames[k] || k), items: groups[k] }));
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
              return (
                <Pressable key={item.id} onPress={() => toggle(item.id)} style={styles.row}>
                  <Text style={[styles.item, checked && styles.checked]}>
                    {item.name} — {item.qty} {item.unit || ''}
                  </Text>
                </Pressable>
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
