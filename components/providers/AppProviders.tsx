'use client';

import { useEffect } from 'react';

import { ErrorBoundary } from '@/lib/errors/boundary';
import { setupGlobalErrorHandlers } from '@/lib/errors/global-handlers';
import { AuthStatusProvider } from '@/components/providers/AuthStatusProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupGlobalErrorHandlers();

    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return;
    }

    void import('@/lib/observability/sentry').then(({ initSentry }) => {
      initSentry();
    });
  }, []);

  return (
    <ErrorBoundary>
      <AuthStatusProvider>{children}</AuthStatusProvider>
    </ErrorBoundary>
  );
}
