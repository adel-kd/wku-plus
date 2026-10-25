import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { Profile, Role } from './types';

interface AuthState {
  loading: boolean;
  profile: Profile | null;
  isSampleMode: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const Ctx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.signOut();
    setProfile(null);
  }, []);

  const hasRole = useCallback((...roles: Role[]) => !!profile && roles.includes(profile.role), [profile]);

  const value = useMemo(
    () => ({ loading, profile, isSampleMode: api.mode === 'mock', refresh, signOut, hasRole }),
    [loading, profile, refresh, signOut, hasRole],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
