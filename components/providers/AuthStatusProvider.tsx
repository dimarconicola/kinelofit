'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { RuntimeCapabilities } from '@/lib/runtime/capabilities';

type AuthStatus = {
  loading: boolean;
  signedInEmail?: string;
  provider?: 'supabase' | 'demo';
  runtimeCapabilities?: RuntimeCapabilities;
};

const AuthStatusContext = createContext<AuthStatus>({ loading: true });

export function AuthStatusProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<AuthStatus>({ loading: true });

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/session/status', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    })
      .then(async (response) => {
        if (!response.ok) {
          setValue({ loading: false });
          return;
        }

        const payload = (await response.json()) as {
          signedInEmail?: string;
          provider?: 'supabase' | 'demo';
          runtimeCapabilities?: RuntimeCapabilities;
        };

        setValue({
          loading: false,
          signedInEmail: payload.signedInEmail,
          provider: payload.provider,
          runtimeCapabilities: payload.runtimeCapabilities
        });
      })
      .catch(() => {
        setValue({ loading: false });
      });

    return () => controller.abort();
  }, []);

  const memoizedValue = useMemo(() => value, [value]);

  return <AuthStatusContext.Provider value={memoizedValue}>{children}</AuthStatusContext.Provider>;
}

export const useAuthStatus = () => useContext(AuthStatusContext);
