import { useState } from 'react';
import { View, Text, Button, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/AppContext';
import { MAJOR_STORES } from '@/constants/stores';

export default function StoreSelection() {
  const { profile, setProfile } = useApp();
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of MAJOR_STORES) init[s.id] = profile?.preferredStores?.includes(s.id) ?? false;
    return init;
  });
  const [multiStore, setMultiStore] = useState(false);

  const onContinue = async () => {
    const chosen = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await setProfile({ ...(profile as any), preferredStores: chosen });
    router.push('/(main)/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your grocers</Text>
      {MAJOR_STORES.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.label}>{s.name}</Text>
          <Switch
            value={selected[s.id]}
            onValueChange={(v) => setSelected((prev) => ({ ...prev, [s.id]: v }))}
          />
        </View>
      ))}
      <View style={[styles.row, { marginTop: 16 }]}>
        <Text style={styles.label}>Allow multi-store optimization</Text>
        <Switch value={multiStore} onValueChange={setMultiStore} />
      </View>
      <Button title="Continue" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  label: { fontSize: 16 }
});
