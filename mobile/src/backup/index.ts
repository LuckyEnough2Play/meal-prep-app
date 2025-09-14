import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { listGroups, upsertGroupFromInvite } from '@/db';
import { getGroupKey, setGroupKey } from '@/storage/secure';

const SQLITE_DIR = FileSystem.documentDirectory + 'SQLite/';
const DB_PATH = SQLITE_DIR + 'marble.db';

type BackupPayload = {
  version: 1;
  createdAt: string;
  groups: Array<{ id: string; name: string; type: 'static' | 'event'; expiresAt?: string | null }>;
  groupKeys: Record<string, string>; // hex
  dbBase64: string; // base64 of the db file
};

export async function createEncryptedBackup(password: string): Promise<string> {
  // Ensure directories
  await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true }).catch(() => {});
  // Read DB as base64 (if missing, treat as empty)
  let dbBase64 = '';
  try {
    const info = await FileSystem.getInfoAsync(DB_PATH);
    if (info.exists) {
      dbBase64 = await FileSystem.readAsStringAsync(DB_PATH, { encoding: FileSystem.EncodingType.Base64 });
    }
  } catch {}

  // Gather groups and keys
  const groups = await listGroups();
  const groupKeys: Record<string, string> = {};
  for (const g of groups) {
    const k = await getGroupKey(g.id);
    if (k) groupKeys[g.id] = k;
  }

  const payload: BackupPayload = {
    version: 1,
    createdAt: new Date().toISOString(),
    groups: groups.map((g) => ({ id: g.id, name: g.name, type: g.type, expiresAt: g.expiresAt ?? null })),
    groupKeys,
    dbBase64
  };

  const plaintext = JSON.stringify(payload);
  const ciphertext = CryptoJS.AES.encrypt(plaintext, password).toString();
  return ciphertext;
}

export async function restoreEncryptedBackup(password: string, ciphertext: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) return { ok: false, error: 'Invalid password or backup' };
    const parsed = JSON.parse(plaintext) as BackupPayload;
    if (parsed.version !== 1) return { ok: false, error: 'Unsupported backup version' };

    // Restore DB
    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true }).catch(() => {});
    if (parsed.dbBase64 && parsed.dbBase64.length > 0) {
      await FileSystem.writeAsStringAsync(DB_PATH, parsed.dbBase64, { encoding: FileSystem.EncodingType.Base64 });
    }

    // Restore groups and keys
    for (const g of parsed.groups) {
      await upsertGroupFromInvite({ id: g.id, name: g.name, type: g.type, expiresAt: g.expiresAt ?? null, createdBy: null });
    }
    for (const [gid, key] of Object.entries(parsed.groupKeys)) {
      await setGroupKey(gid, key);
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

