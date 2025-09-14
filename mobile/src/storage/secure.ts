import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_ID = 'marble_master_key_v1';

export async function getOrCreateMasterKey() {
  let key = await SecureStore.getItemAsync(KEY_ID);
  if (!key) {
    key = await Crypto.getRandomBytesAsync(32).then((b) => Buffer.from(b).toString('base64'));
    await SecureStore.setItemAsync(KEY_ID, key, {
      keychainService: KEY_ID,
      accessible: SecureStore.AFTER_FIRST_UNLOCK
    });
  }
  return key;
}

