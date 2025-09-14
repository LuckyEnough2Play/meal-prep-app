import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, Modal } from 'react-native';
import { useApp } from '@/state/AppContext';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { SwitchRow } from '@/ui/SwitchRow';
import { createGroup, listGroups, type GroupRow, upsertGroupFromInvite, addProfileCardToGroup, computeCombinedProfile, setAppState, getAppState, getGroupById, updateGroupExpiry } from '@/db';
import { setGroupKey, getGroupKey } from '@/storage/secure';
import * as Crypto from 'expo-crypto';
import { buildInviteURL, parseInviteURL } from '@/sync/invite';
import { buildProfileShareURL, parseProfileShareURL } from '@/sync/profileShare';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Linking from 'expo-linking';

export default function Groups() {
  const { profile } = useApp();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [name, setName] = useState('My Group');
  const [isEvent, setIsEvent] = useState(false);
  const [expiryDays, setExpiryDays] = useState('7');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [combinedSummary, setCombinedSummary] = useState<string>('');
  const [activeGroupName, setActiveGroupName] = useState<string>('');
  const [activeGroupExpiry, setActiveGroupExpiry] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState('7');

  const load = async () => {
    setGroups(await listGroups());
    const ag = await getAppState('active_group_id');
    setActiveGroupId(ag);
    if (ag) {
      const g = await getGroupById(ag);
      setActiveGroupName(g?.name || '');
      setActiveGroupExpiry(g?.expiresAt || null);
      await refreshCombined(ag);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sub = Linking.addEventListener('url', async (e) => {
      const url = e.url;
      if (url && url.includes('marble://invite')) {
        await handleInvite(url);
      }
    });
    return () => { sub.remove(); };
  }, []);

  const onCreate = async () => {
    if (!profile) return Alert.alert('Complete profile first');
    const exp = isEvent ? new Date(Date.now() + (Number(expiryDays) || 7) * 86400000).toISOString() : undefined;
    const g = await createGroup({ name, type: isEvent ? 'event' : 'static', createdBy: profile.id, expiresAt: exp });
    // Generate group key (hex) and store in SecureStore
    const bytes = await Crypto.getRandomBytesAsync(32);
    const keyHex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    await setGroupKey(g.id, keyHex);
    const link = buildInviteURL({ gid: g.id, name: g.name, type: g.type, exp: g.expiresAt || undefined, key: keyHex });
    setInviteLink(link);
    setShowQR(link);
    await load();
  };

  const onCopy = async () => { if (inviteLink) { await Clipboard.setStringAsync(inviteLink); Alert.alert('Copied', 'Invite link copied to clipboard'); } };

  const startScan = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    setScanning(true);
  };

  const onBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    // Try group invite first, then profile share
    if (data.includes('marble://invite')) await handleInvite(data);
    else if (data.includes('marble://profile')) await handleProfileShare(data);
  };

  const handleInvite = async (url: string) => {
    const parsed = parseInviteURL(url);
    if (!parsed) return Alert.alert('Invalid invite');
    await upsertGroupFromInvite({ id: parsed.gid, name: parsed.name, type: parsed.type, expiresAt: parsed.exp || null, createdBy: null });
    await setGroupKey(parsed.gid, parsed.key);
    await load();
    Alert.alert('Joined', `You joined group: ${parsed.name}`);
  };

  const handleProfileShare = async (url: string) => {
    const parsed = parseProfileShareURL(url);
    if (!parsed) return Alert.alert('Invalid profile card');
    if (!activeGroupId || parsed.gid !== activeGroupId) {
      return Alert.alert('Wrong group', 'Select the correct active group before scanning profile cards.');
    }
    await addProfileCardToGroup(parsed.gid, { name: parsed.name, dietTypes: parsed.dietTypes || [], allergies: parsed.allergies || [], dislikes: parsed.dislikes || [] });
    await refreshCombined(parsed.gid);
    Alert.alert('Added', `Profile card added to group.`);
  };

  const refreshCombined = async (gid: string) => {
    const comb = await computeCombinedProfile(gid);
    if (!comb) { setCombinedSummary('No cards yet'); return; }
    const diets = (comb.dietTypes || []).join(', ') || '—';
    const alls = (comb.allergies || []).join(', ') || '—';
    const dls = (comb.dislikes || []).join(', ') || '—';
    setCombinedSummary(`Diet: ${diets} • Allergies: ${alls} • Dislikes: ${dls}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>
      <Text style={styles.sub}>Create static or event groups; invite via QR or link.</Text>

      <Text style={styles.label}>Group name</Text>
      <Input value={name} onChangeText={setName} />
      <SwitchRow label="Event group (expires)" value={isEvent} onValueChange={setIsEvent} />
      {isEvent && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Days until expiry</Text>
          <Input value={expiryDays} onChangeText={setExpiryDays} keyboardType="number-pad" />
        </View>
      )}
      <View style={{ height: 8 }} />
      <Button title="Create & Invite" onPress={onCreate} />

      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Your Groups</Text>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => (
          <View style={styles.groupRow}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title={activeGroupId === item.id ? 'Active' : 'Set Active'} onPress={async () => { await setAppState('active_group_id', item.id); setActiveGroupId(item.id); const g = await getGroupById(item.id); setActiveGroupName(g?.name || ''); setActiveGroupExpiry(g?.expiresAt || null); await refreshCombined(item.id); }} />
              <Button title="Invite" onPress={async () => { const key = await getGroupKey(item.id); if (!key) { Alert.alert('Missing key', 'No group key found on this device'); return; } const link = buildInviteURL({ gid: item.id, name: item.name, type: item.type, exp: item.expiresAt || undefined, key }); setInviteLink(link); setShowQR(link); }} />
              <Button title="Share My Profile" onPress={async () => {
                if (!profile) return Alert.alert('Complete profile first');
                const link = buildProfileShareURL({ gid: item.id, name: profile.name, dietTypes: (profile.dietTypes as any[]) || [], allergies: profile.allergies || [], dislikes: profile.dislikes || [] });
                setShowQR(link);
              }} />
              <Button title="Scan Profile" onPress={startScan} />
            </View>
          </View>
        )}
      />

      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Active Group</Text>
      <Text style={styles.sub}>{activeGroupId ? `Active: ${activeGroupName || activeGroupId}` : 'None selected'}</Text>
      {!!activeGroupId && (
        <>
          <Text style={styles.sub}>Combined Profile: {combinedSummary}</Text>
          {activeGroupExpiry && (
            <Text style={styles.sub}>Expires: {new Date(activeGroupExpiry).toLocaleString()}</Text>
          )}
          {activeGroupExpiry && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Extend expiry (days)</Text>
              <Input value={extendDays} onChangeText={setExtendDays} keyboardType="number-pad" />
              <View style={{ height: 8 }} />
              <Button title="Extend" onPress={async () => {
                if (!activeGroupId || !activeGroupExpiry) return;
                const newDate = new Date(activeGroupExpiry);
                newDate.setDate(newDate.getDate() + (Number(extendDays) || 7));
                await updateGroupExpiry(activeGroupId, newDate.toISOString());
                const g = await getGroupById(activeGroupId);
                setActiveGroupExpiry(g?.expiresAt || null);
                Alert.alert('Extended', 'Group expiry updated');
              }} />
            </View>
          )}
        </>
      )}
      {!!activeGroupId && (
        <>
          <Text style={styles.sub}>Combined Profile: {combinedSummary}</Text>
        </>
      )}

      <View style={{ height: 12 }} />
      <Text style={styles.subtitle}>Join Group</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Scan QR" onPress={startScan} />
        <Button title="Paste Link" onPress={async () => { const text = await Clipboard.getStringAsync(); if (text) await handleInvite(text); }} />
      </View>

      <Modal visible={!!showQR} transparent animationType="fade" onRequestClose={() => setShowQR(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.subtitle}>Share Invite</Text>
            {!!showQR && <QRCode value={showQR} size={240} />}
            <View style={{ height: 12 }} />
            <Button title="Copy Link" onPress={onCopy} />
            <View style={{ height: 8 }} />
            <Button title="Close" onPress={() => setShowQR(null)} />
          </View>
        </View>
      </Modal>

      <Modal visible={scanning} transparent animationType="slide" onRequestClose={() => setScanning(false)}>
        <View style={styles.scanWrap}>
          {hasPermission === false ? (
            <Text>No camera permission</Text>
          ) : (
            <BarCodeScanner onBarCodeScanned={onBarCodeScanned} style={styles.scanner} />
          )}
          <View style={{ height: 8 }} />
          <Button title="Cancel" onPress={() => setScanning(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#666', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, color: '#444', marginTop: 8, marginBottom: 6 },
  groupRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName: { fontSize: 16, fontWeight: '600' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center' },
  scanWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  scanner: { width: '100%', height: '60%', borderRadius: 12 }
});
