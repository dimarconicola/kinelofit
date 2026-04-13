/**
 * Sentry error tracking integration
 *
 * Set NEXT_PUBLIC_SENTRY_DSN in environment to enable production error tracking.
 * Requires no configuration - errors are automatically captured from:
 * - Error boundaries
 * - Unhandled promise rejections
 * - API errors
 * - Performance metrics
 *
 * Environment-specific behavior:
 * - Production: Reports to Sentry (if DSN configured)
 * - Development: Logs to console but doesn't report to Sentry
 */

export function initSentry() {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  // Skip initialization if no DSN configured
  if (!dsn) {
    console.info('Sentry not configured (NEXT_PUBLIC_SENTRY_DSN not set)');
    return;
  }

  // Dynamic import of Sentry - only loads if DSN is configured
  import('@sentry/browser').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      // Performance Monitoring - sample 5% of transactions in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

      // Release tracking
      release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
    });

    console.info('✅ Sentry initialized');
  });
}

/**
 * Helper to report errors explicitly to Sentry
 * Called automatically from our error handler, but can be called manually
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (typeof window === 'undefined') return; // Skip on server-side

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return; // Skip if not configured

  import('@sentry/browser').then((Sentry) => {
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context });
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });
}

/**
 * Helper to add breadcrumbs for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/browser').then((Sentry) => {
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data
    });
  });
}

/**
 * Helper to set user context for error tracking
 * Call this when user authenticates
 */
export function setUser(userId: string, email?: string) {
  if (typeof window === 'undefined') return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/browser').then((Sentry) => {
    Sentry.setUser({
      id: userId,
      email
    });
  });
}

/**
 * Helper to clear user context
 * Call this when user signs out
 */
export function clearUser() {
  if (typeof window === 'undefined') return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/browser').then((Sentry) => {
    Sentry.setUser(null);
  });
}

/**
 * Lightweight product event tracking through the existing observability layer.
 * This keeps PWA/install telemetry inside the current Sentry-based setup.
 */
export function trackProductEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  console.info(`[product-event] ${name}`, data ?? {});

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/browser').then((Sentry) => {
    Sentry.addBreadcrumb({
      category: 'product',
      message: name,
      level: 'info',
      data
    });

    Sentry.captureMessage(`product:${name}`, {
      level: 'info',
      extra: data,
      tags: {
        area: 'pwa',
        event: name
      }
    });
  });
}
