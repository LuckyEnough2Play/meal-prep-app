import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_ID = 'marble_master_key_v1';

function bytesToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getOrCreateMasterKey() {
  let key = await SecureStore.getItemAsync(KEY_ID);
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    key = bytesToHex(bytes as unknown as Uint8Array);
    await SecureStore.setItemAsync(KEY_ID, key, {
      keychainService: KEY_ID,
      accessible: SecureStore.AFTER_FIRST_UNLOCK
    });
  }
  return key;
}
