import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl } from 'react-native';
import { getActivePlan, listShoppingItems, toggleShoppingItemChecked } from '@/db';
import * as SQLite from 'expo-sqlite';
import { useApp } from '@/state/AppContext';

export default function List() {
  const { profile } = useApp();
  const [planId, setPlanId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  const load = async () => {
    setRefreshing(true);
    const ap = await getActivePlan();
    setPlanId(ap?.id ?? null);
    const data = ap ? await listShoppingItems(ap.id) : [];
    setItems(data);
    // Load store names
    try {
      const db = SQLite.openDatabase('marble.db');
      await new Promise<void>((resolve) => db.readTransaction((tx) => {
        tx.executeSql('SELECT id,name FROM store', [], (_tx, rs) => {
          const map: Record<string, string> = {};
          for (const r of (rs.rows as any)._array || []) map[r.id] = r.name;
          setStoreNames(map);
          resolve();
        });
      }));
    } catch {}
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
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => {
          const checked = (item.checkedBy || []).includes(profile?.id);
          return (
            <Pressable onPress={() => toggle(item.id)} style={styles.row}>
              <Text style={[styles.item, checked && styles.checked]}>
                {item.storeId ? `[${storeNames[item.storeId] || item.storeId}] ` : ''}{item.name} — {item.qty} {item.unit || ''}
              </Text>
            </Pressable>
          );
        }}
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
  note: { marginTop: 12, color: '#666' }
});
