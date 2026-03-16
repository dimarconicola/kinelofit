'use client';

import { useEffect } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { logger } from '@/lib/observability/logger';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    logger.error(`Next.js Error Page: ${error.message}`, error, {
      digest: error.digest
    });
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Card className="w-full max-w-md">
        <CardBody className="gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Page Error</h1>
            <p className="text-gray-600 mb-4">
              An error occurred while rendering this page. Please try again.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="cursor-pointer">
              <summary className="font-semibold text-sm text-gray-700 hover:text-gray-900">
                Error Details (Dev Only)
              </summary>
              <div className="mt-3 bg-red-50 p-3 rounded text-xs font-mono break-all max-h-48 overflow-auto">
                <p className="text-red-800 font-bold mb-2">{error.message}</p>
                <pre className="text-red-600 whitespace-pre-wrap text-xs">{error.stack}</pre>
              </div>
            </details>
          )}

          <div className="flex gap-2">
            <Button fullWidth color="primary" onClick={() => reset()}>
              Try Again
            </Button>
            <Button fullWidth variant="bordered" onClick={() => (window.location.href = '/')}>
              Go Home
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
