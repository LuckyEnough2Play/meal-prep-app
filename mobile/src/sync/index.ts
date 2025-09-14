// E2EE group sync stubs. The app will use E2EE payloads and a
// minimal relay for NAT traversal; creator’s device anchors the group.

export type SyncEvent =
  | { type: 'invite-created'; groupId: string; token: string }
  | { type: 'joined'; groupId: string }
  | { type: 'list-item-updated'; groupId: string; itemId: string };

export async function createInvite(groupId: string) {
  // TODO: create E2EE invite payload and share via QR/link
  return { token: `invite:${groupId}:${Date.now()}` };
}

export async function acceptInvite(token: string) {
  // TODO: validate and join group, fetch group key securely
  return { ok: true } as const;
}

export async function broadcastListCheck(groupId: string, itemId: string, checked: boolean) {
  // TODO: send encrypted delta to peers via relay/P2P
  return { ok: true } as const;
}

