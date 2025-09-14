import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';

type Item = { id: string; name: string; qty: number; unit?: string; checked?: boolean };

export default function List() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Chicken breast', qty: 2, unit: 'lb' },
    { id: '2', name: 'Broccoli', qty: 2, unit: 'heads' }
  ]);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping List</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggle(item.id)} style={styles.row}>
            <Text style={[styles.item, item.checked && styles.checked]}>
              {item.name} — {item.qty} {item.unit || ''}
            </Text>
          </Pressable>
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
  note: { marginTop: 12, color: '#666' }
});

