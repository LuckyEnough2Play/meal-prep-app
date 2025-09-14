import * as Linking from 'expo-linking';

export type InviteData = {
  gid: string;
  name: string;
  type: 'static' | 'event';
  exp?: string | null;
  key: string; // hex group key
};

export function buildInviteURL(data: InviteData): string {
  const params = new URLSearchParams();
  params.set('gid', data.gid);
  params.set('name', data.name);
  params.set('type', data.type);
  if (data.exp) params.set('exp', data.exp);
  params.set('k', data.key);
  // marble://invite?...
  return `marble://invite?${params.toString()}`;
}

export function parseInviteURL(url: string): InviteData | null {
  try {
    const parsed = Linking.parse(url);
    const query = parsed.queryParams || {} as any;
    if (!query.gid || !query.k || !query.name || !query.type) return null;
    const gid = String(query.gid);
    const key = String(query.k);
    const name = String(query.name);
    const type = String(query.type) as 'static' | 'event';
    const exp = query.exp ? String(query.exp) : null;
    return { gid, name, type, exp, key };
  } catch {
    return null;
  }
}

