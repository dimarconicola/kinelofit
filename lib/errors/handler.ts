import { logger } from '@/lib/observability/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Wrap API responses in consistent success/error format
 */
export function createResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown, defaultCode = 'INTERNAL_ERROR'): ErrorResponse {
  // Handle typed AppError
  if (error instanceof AppError) {
    logger.error(error.message, error, { statusCode: error.statusCode, details: error.details });
    return {
      success: false,
      error: {
        message: error.message,
        code: error.name,
        statusCode: error.statusCode,
        details: error.details
      }
    };
  }

  // Handle Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    logger.warn('Validation error', { message: error.message });
    return {
      success: false,
      error: {
        message: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: { errors: error.message }
      }
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    logger.error(error.message, error);
    return {
      success: false,
      error: {
        message: error.message,
        code: defaultCode,
        statusCode: 500
      }
    };
  }

  // Handle unknown types
  const message = String(error);
  logger.error(`Unknown error: ${message}`);
  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: defaultCode,
      statusCode: 500
    }
  };
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error instanceof Error && error.name === 'ZodError') {
    return 400;
  }

  return 500;
}

/**
 * Report error to external tracking service (Sentry, etc.)
 * This is a stub that can be extended with actual service integration
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    logger.error(`Reported: ${error.message}`, error, context);

    // TODO: Integrate with Sentry or similar
    // Sentry.captureException(error, { extra: context });
  } else {
    logger.error(`Reported unknown error: ${String(error)}`, undefined, context);
  }
}

/**
 * Global handler for unhandled promise rejections
 * Call this in a client-side setup
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return; // Only in browser

  window.addEventListener('error', (event) => {
    logger.error(`Uncaught error: ${event.message}`, event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    reportError(event.error, { type: 'uncaughtError' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error(`Unhandled promise rejection: ${String(event.reason)}`, undefined, {
      reason: event.reason
    });
    reportError(event.reason, { type: 'unhandledRejection' });
  });
}
