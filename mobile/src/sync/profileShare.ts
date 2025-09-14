import * as Linking from 'expo-linking';

export type ProfileShare = {
  gid: string;
  name?: string;
  dietTypes: string[];
  allergies: string[];
  dislikes: string[];
};

function toBase64(json: any) {
  // lightweight base64 for small payloads
  const s = JSON.stringify(json);
  // @ts-ignore
  return typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'utf8').toString('base64');
}

function fromBase64(b64: string) {
  // @ts-ignore
  const s = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
  return JSON.parse(s);
}

export function buildProfileShareURL(card: ProfileShare): string {
  const payload = toBase64(card);
  return `marble://profile?card=${encodeURIComponent(payload)}`;
}

export function parseProfileShareURL(url: string): ProfileShare | null {
  try {
    const parsed = Linking.parse(url);
    const q = parsed.queryParams || {} as any;
    if (!q.card) return null;
    const data = fromBase64(String(q.card));
    if (!data.gid) return null;
    return data as ProfileShare;
  } catch {
    return null;
  }
}

