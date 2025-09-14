import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, FlatList, Alert, ScrollView } from 'react-native';
import { MAJOR_STORES } from '@/constants/stores';
import { ensureStore, listStoreItems, seedSamplePrices, upsertStoreItem, listAliasesForStore, upsertAlias, getStoreById } from '@/db';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

export default function Prices() {
  const [storeId, setStoreId] = useState(MAJOR_STORES[0].id);
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [pkg, setPkg] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [onSale, setOnSale] = useState(false);
  const [aisle, setAisle] = useState('');
  const [alias, setAlias] = useState('');
  const [aliasFilter, setAliasFilter] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [aliases, setAliases] = useState<Array<{ alias: string; targetItemId: string }>>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const load = async (sid = storeId) => {
    await ensureStore(sid, (MAJOR_STORES.find((s) => s.id === sid)?.name || sid));
    const data = await listStoreItems(sid);
    setItems(data);
    setAliases(await listAliasesForStore(sid));
    const st = await getStoreById(sid);
    if (st?.lastPriceRefresh) setLastUpdated(new Date(st.lastPriceRefresh).toLocaleString()); else setLastUpdated('—');
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
      onSale,
      aisle: aisle || undefined
    });
    setName(''); setPkg(''); setUnit(''); setPrice(''); setOnSale(false); setAisle('');
    await load();
  };

  const onSaveAlias = async () => {
    if (!alias || !selectedItemId) return Alert.alert('Missing', 'Alias and a target item are required');
    await upsertAlias(alias, storeId, selectedItemId);
    setAlias(''); setSelectedItemId(null); setAliasFilter('');
    await load();
    Alert.alert('Saved', 'Alias mapping created');
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

      <Button title="Seed Sample Prices" onPress={onSeed} />
      <Text style={{ marginTop: 6, color: '#666' }}>Last updated: {lastUpdated}</Text>

      <Text style={styles.section}>Add Item</Text>
      <View style={styles.formRow}><Input placeholder="Name" value={name} onChangeText={setName} /></View>
      <View style={styles.formRow}>
        <Input placeholder="Package size" keyboardType="decimal-pad" value={pkg} onChangeText={setPkg} style={styles.inputHalf} />
        <Input placeholder="Unit (e.g., lb, oz)" value={unit} onChangeText={setUnit} style={styles.inputHalf} />
      </View>
      <View style={styles.formRow}>
        <Input placeholder="Price (USD)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} style={styles.inputHalf} />
        <View style={[styles.inputHalf, styles.saleRow]}>
          <Text>On sale</Text>
          <Switch value={onSale} onValueChange={setOnSale} />
        </View>
      </View>
      <View style={styles.formRow}>
        <Input placeholder="Aisle (optional)" value={aisle} onChangeText={setAisle} />
      </View>
      <Button title="Add / Update" onPress={onAdd} />

      <Text style={styles.section}>Items</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.packageSize || '?'} {item.unit || ''} • ${item.price.toFixed(2)} {item.onSale ? '• SALE' : ''} {item.aisle ? `• Aisle ${item.aisle}` : ''}</Text>
          </View>
        )}
      />

      <Text style={styles.section}>Aliases (map ingredient name → store item)</Text>
      <Input placeholder="Alias (ingredient name)" value={alias} onChangeText={setAlias} />
      <View style={{ height: 8 }} />
      <Input placeholder="Filter items" value={aliasFilter} onChangeText={setAliasFilter} />
      <FlatList
        data={items.filter((it) => !aliasFilter || it.name.toLowerCase().includes(aliasFilter.toLowerCase()))}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedItemId(item.id)} style={styles.itemRow}>
            <Text style={[styles.itemName, selectedItemId === item.id && { color: '#0a7' }]}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.packageSize || '?'} {item.unit || ''} • ${item.price.toFixed(2)}</Text>
          </Pressable>
        )}
        style={{ maxHeight: 200 }}
      />
      <View style={{ height: 8 }} />
      <Button title="Save Alias" onPress={onSaveAlias} />

      <Text style={styles.section}>Existing Aliases</Text>
      <FlatList
        data={aliases}
        keyExtractor={(a) => a.alias + '|' + a.targetItemId}
        renderItem={({ item }) => {
          const t = items.find((it) => it.id === item.targetItemId);
          return (
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>{item.alias}</Text>
              <Text style={styles.itemMeta}>{t ? t.name : item.targetItemId}</Text>
            </View>
          );
        }}
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
  section: { fontSize: 16, fontWeight: '700', marginTop: 16 },
  formRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  inputHalf: { flex: 1 },
  saleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: '#ccc', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10 },
  itemRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#666', marginTop: 2 }
});
