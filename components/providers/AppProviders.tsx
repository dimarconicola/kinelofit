'use client';

import { useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { ErrorBoundary } from '@/lib/errors/boundary';
import { setupGlobalErrorHandlers } from '@/lib/errors/handler';
import { initSentry } from '@/lib/observability/sentry';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry();
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <HeroUIProvider>{children}</HeroUIProvider>
    </ErrorBoundary>
  );
}
