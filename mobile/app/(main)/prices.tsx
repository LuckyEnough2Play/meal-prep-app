import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, FlatList, Alert, ScrollView } from 'react-native';
import { MAJOR_STORES } from '@/constants/stores';
import { ensureStore, listStoreItems, seedSamplePrices, upsertStoreItem } from '@/db';

export default function Prices() {
  const [storeId, setStoreId] = useState(MAJOR_STORES[0].id);
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [pkg, setPkg] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [onSale, setOnSale] = useState(false);

  const load = async (sid = storeId) => {
    await ensureStore(sid, (MAJOR_STORES.find((s) => s.id === sid)?.name || sid));
    const data = await listStoreItems(sid);
    setItems(data);
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const onSeed = async () => {
    await seedSamplePrices();
    await load();
    Alert.alert('Seeded', 'Sample prices added.');
  };

  const onAdd = async () => {
    if (!name || !price) return Alert.alert('Missing', 'Name and price are required');
    await upsertStoreItem(storeId, {
      name,
      packageSize: pkg ? Number(pkg) : undefined,
      unit: unit || undefined,
      price: Number(price),
      onSale
    });
    setName(''); setPkg(''); setUnit(''); setPrice(''); setOnSale(false);
    await load();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Prices & Stores</Text>
      <View style={styles.storeRow}>
        {MAJOR_STORES.map((s) => (
          <Pressable key={s.id} onPress={() => setStoreId(s.id)} style={[styles.storeBtn, storeId === s.id && styles.storeBtnActive]}>
            <Text style={[styles.storeText, storeId === s.id && styles.storeTextActive]}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onSeed} style={styles.seedBtn}>
        <Text style={styles.seedText}>Seed Sample Prices</Text>
      </Pressable>

      <Text style={styles.section}>Add Item</Text>
      <View style={styles.formRow}><TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} /></View>
      <View style={styles.formRow}>
        <TextInput placeholder="Package size" keyboardType="decimal-pad" value={pkg} onChangeText={setPkg} style={[styles.input, styles.inputHalf]} />
        <TextInput placeholder="Unit (e.g., lb, oz)" value={unit} onChangeText={setUnit} style={[styles.input, styles.inputHalf]} />
      </View>
      <View style={styles.formRow}>
        <TextInput placeholder="Price (USD)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} style={[styles.input, styles.inputHalf]} />
        <View style={[styles.inputHalf, styles.saleRow]}>
          <Text>On sale</Text>
          <Switch value={onSale} onValueChange={setOnSale} />
        </View>
      </View>
      <Pressable onPress={onAdd} style={styles.addBtn}><Text style={styles.addText}>Add / Update</Text></Pressable>

      <Text style={styles.section}>Items</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.packageSize || '?'} {item.unit || ''} • ${item.price.toFixed(2)} {item.onSale ? '• SALE' : ''}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  storeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  storeBtn: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 16, marginRight: 8, marginBottom: 8 },
  storeBtnActive: { backgroundColor: '#eefaf6', borderColor: '#0a7' },
  storeText: { color: '#333' },
  storeTextActive: { color: '#0a7', fontWeight: '700' },
  seedBtn: { backgroundColor: '#07a', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginTop: 10, alignSelf: 'flex-start' },
  seedText: { color: 'white', fontWeight: '700' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 16 },
  formRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, borderColor: '#ccc', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10 },
  inputHalf: { flex: 1 },
  saleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: '#ccc', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10 },
  addBtn: { backgroundColor: '#0a7', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 10, alignSelf: 'flex-start' },
  addText: { color: 'white', fontWeight: '700' },
  itemRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#666', marginTop: 2 }
});

