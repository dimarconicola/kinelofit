'use client';

import { useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { ErrorBoundary } from '@/lib/errors/boundary';
import { setupGlobalErrorHandlers } from '@/lib/errors/handler';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up global error handlers (unhandled rejections, etc.)
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <HeroUIProvider>{children}</HeroUIProvider>
    </ErrorBoundary>
  );
}
