import { logger } from '@/lib/observability/logger';

const reportClientError = (error: unknown, context: Record<string, unknown>) => {
  void import('@/lib/errors/handler').then(({ reportError }) => {
    reportError(error, context);
  });
};

export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logger.error(`Uncaught error: ${event.message}`, event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    reportClientError(event.error, { type: 'uncaughtError' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error(`Unhandled promise rejection: ${String(event.reason)}`, undefined, {
      reason: event.reason
    });
    reportClientError(event.reason, { type: 'unhandledRejection' });
  });
}
