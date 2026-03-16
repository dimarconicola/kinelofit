import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/observability/logger';
import type { ErrorResponse, SuccessResponse } from './handler';

/**
 * Helper to wrap API route handlers with error handling and logging
 *
 * Usage:
 * ```
 * export const POST = apiHandler(async (req) => {
 *   const data = await req.json();
 *   // ... handler logic
 *   return { status: 200, data: { ok: true } };
 * });
 * ```
 */
export function apiHandler<T>(
  handler: (req: Request) => Promise<{ status: number; data: T }>
) {
  return async (req: Request) => {
    try {
      const result = await handler(req);
      return NextResponse.json(
        { success: true, data: result.data } as SuccessResponse<T>,
        { status: result.status }
      );
    } catch (error) {
      return handleApiError(error, req);
    }
  };
}

/**
 * Handle errors in API routes with proper logging and response formatting
 */
function handleApiError(error: unknown, req: Request) {
  // Log request context
  const context = {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    logger.warn('API Validation error', {
      ...context,
      errors: error.errors
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: { errors: error.errors }
        }
      } as ErrorResponse,
      { status: 400 }
    );
  }

  // Handle typed errors with status codes
  if (error instanceof Error && 'statusCode' in error) {
    const appError = error as Error & { statusCode: number };
    logger.warn(error.message, context);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.name || 'API_ERROR',
          statusCode: appError.statusCode
        }
      } as ErrorResponse,
      { status: appError.statusCode }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    logger.error(error.message, error, context);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
          statusCode: 500
        }
      } as ErrorResponse,
      { status: 500 }
    );
  }

  // Handle unknown types
  logger.error(`Unknown API error: ${String(error)}`, undefined, context);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        statusCode: 500
      }
    } as ErrorResponse,
    { status: 500 }
  );
}
