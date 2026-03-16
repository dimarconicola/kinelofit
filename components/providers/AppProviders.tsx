'use client';

import { useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { ErrorBoundary } from '@/lib/errors/boundary';
import { setupGlobalErrorHandlers } from '@/lib/errors/handler';
import { initSentry, setUser, clearUser } from '@/lib/observability/sentry';
import { getSessionUser } from '@/lib/auth/session';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize error tracking (Sentry if configured)
    initSentry();

    // Set up global error handlers (unhandled rejections, etc.)
    setupGlobalErrorHandlers();

    // Set user context if authenticated
    const setUserContext = async () => {
      try {
        const user = await getSessionUser();
        if (user) {
          setUser(user.id, user.email);
        } else {
          clearUser();
        }
      } catch (error) {
        // Silently fail if user session check fails
      }
    };

    setUserContext();
  }, []);

  return (
    <ErrorBoundary>
      <HeroUIProvider>{children}</HeroUIProvider>
    </ErrorBoundary>
  );
}
