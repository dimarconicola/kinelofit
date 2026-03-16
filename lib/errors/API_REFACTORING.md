/**
 * API Error Handling & Standardization Guide
 *
 * This document shows how to refactor existing API routes to use the new
 * centralized error handling system.
 */

# API Standardization Pattern

## Before: Current Approach
```typescript
export async function POST(request: Request) {
  const parsed = schema.parse(await request.json());  // Throws on error
  await appendDigestSubscription({ ...parsed, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
```

**Problems:**
- Unhandled Zod validation errors crash the route
- No logging of request/response
- Inconsistent response format (sometimes { ok: true }, sometimes other formats)
- No error details for debugging

## After: Refactored with Error Handling
```typescript
import { apiHandler } from '@/lib/errors/api-handler';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(['en', 'it']),
  citySlug: z.string().min(1),
  preferences: z.array(z.string()).default([])
});

export const POST = apiHandler(async (request) => {
  // Validation automatically caught and formatted
  const parsed = schema.parse(await request.json());

  // Business logic
  await appendDigestSubscription({
    ...parsed,
    createdAt: new Date().toISOString()
  });

  // Return with status code
  return {
    status: 201,
    data: {
      ok: true,
      message: 'Digest subscription created'
    }
  };
});
```

## Response Format

All API routes now return a standardized format:

### Success Response (2xx)
```json
{
  "success": true,
  "data": {
    "ok": true,
    "message": "Operation successful",
    ...
  }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": { "errors": [...] }
  }
}
```

## Common Patterns

### 1. Validation Error (Auto-handled)
```typescript
export const POST = apiHandler(async (req) => {
  // If schema.parse() fails, automatically returns 400 with validation details
  const data = schema.parse(await req.json());
  return { status: 201, data: { ok: true } };
});
```

### 2. Custom Validation
```typescript
export const POST = apiHandler(async (req) => {
  const data = await req.json();

  if (!data.email) {
    throw Object.assign(
      new Error('Email is required'),
      { statusCode: 400 }
    );
  }

  return { status: 200, data: { ok: true } };
});
```

### 3. Async Operations with Error Handling
```typescript
export const DELETE = apiHandler(async (req) => {
  const { id } = await req.json();

  try {
    await deleteEntity(id);
    return { status: 200, data: { ok: true, deleted: id } };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw Object.assign(
        new Error('Entity not found'),
        { statusCode: 404 }
      );
    }
    throw error; // Re-throw to generic error handler
  }
});
```

## Migration Checklist

- [ ] Add `import { apiHandler } from '@/lib/errors/api-handler'`
- [ ] Wrap route handler with `export const POST = apiHandler(async (req) => { ... })`
- [ ] Update response to `return { status: 200, data: { ... } }`
- [ ] Test validation errors (malformed JSON, invalid schema)
- [ ] Test successful responses
- [ ] Check logs for structured logging output

## Client-Side Integration

Client code that calls these APIs can now expect:

```typescript
const response = await fetch('/api/digest', { method: 'POST', ... });
const result = await response.json();

if (result.success) {
  // Handle success: result.data
  console.log(result.data);
} else {
  // Handle error: result.error
  console.error(result.error.message);
  if (result.error.code === 'VALIDATION_ERROR') {
    // Show validation errors
    console.log(result.error.details);
  }
}
```

## Next Steps

1. Prioritize refactoring high-traffic API routes first:
   - `/api/digest` - digest subscriptions
   - `/api/state/*` - user state (favorites, schedule)
   - `/api/outbound` - click tracking

2. Add integration tests after refactoring to verify:
   - Validation errors return 400
   - Successful requests return expected data
   - Unhandled errors return 500 with safe message

3. Monitor logs in production for error patterns
