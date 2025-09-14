import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { createEncryptedBackup, restoreEncryptedBackup } from '@/backup';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

export default function Backup() {
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const onBackup = async () => {
    if (!pwd) return Alert.alert('Password required', 'Enter a password to encrypt the backup');
    setBusy(true);
    try {
      const content = await createEncryptedBackup(pwd);
      const path = FileSystem.cacheDirectory + `marble-backup-${Date.now()}.mmbak`;
      await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { dialogTitle: 'Share Marble Backup' });
      } else {
        Alert.alert('Backup created', `Saved to: ${path}`);
      }
    } catch (e: any) {
      Alert.alert('Backup failed', String(e?.message || e));
    }
    setBusy(false);
  };

  const onRestore = async () => {
    if (!pwd) return Alert.alert('Password required', 'Enter the backup password');
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false, copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    try {
      const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
      const out = await restoreEncryptedBackup(pwd, content);
      if (!out.ok) return Alert.alert('Restore failed', out.error || 'Unknown error');
      Alert.alert('Restore complete', 'Please restart the app to load restored data.');
    } catch (e: any) {
      Alert.alert('Restore failed', String(e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backup & Restore</Text>
      <Text style={styles.sub}>Create an encrypted backup of your data and restore it on another device. Keep your password safe — it cannot be recovered.</Text>
      <Text style={styles.label}>Backup password</Text>
      <Input secureTextEntry value={pwd} onChangeText={setPwd} placeholder="Enter password" />
      <View style={{ height: 10 }} />
      <Button title={busy ? 'Creating...' : 'Create & Share Backup'} onPress={onBackup} />
      <View style={{ height: 10 }} />
      <Button title="Restore from File" onPress={onRestore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#666', marginBottom: 8 },
  label: { fontSize: 14, color: '#444', marginTop: 8, marginBottom: 6 }
});

