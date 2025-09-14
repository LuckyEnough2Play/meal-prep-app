import React, { createContext, useContext, useMemo, useState } from 'react';
import type { UserProfile } from '@/models/types';

type AppCtx = {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
};

const Ctx = createContext<AppCtx | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const setProfile = (p: UserProfile) => setProfileState(p);

  const value = useMemo(() => ({ profile, setProfile }), [profile]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

