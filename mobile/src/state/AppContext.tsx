import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '@/models/types';
import { initDb, loadUserProfile, saveUserProfile } from '@/db';

type AppCtx = {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => Promise<void>;
};

const Ctx = createContext<AppCtx | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  useEffect(() => {
    initDb();
    // Load existing profile, if any
    loadUserProfile()
      .then((p) => p && setProfileState(p))
      .catch(() => {});
  }, []);

  const setProfile = async (p: UserProfile) => {
    setProfileState(p);
    try {
      await saveUserProfile(p);
    } catch (e) {
      // swallow for now; could add in-app toast/logging
    }
  };

  const value = useMemo(() => ({ profile, setProfile }), [profile]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
