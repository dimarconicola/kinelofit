'use client';

import React, { ReactNode } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { logger } from '@/lib/observability/logger';
import { reportError } from './handler';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for user to report
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to observability system
    logger.error(`React Error Boundary caught: ${error.message}`, error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    // Report to external error tracking
    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      type: 'react-error-boundary'
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <Card className="w-full max-w-md">
            <CardBody className="gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                <p className="text-gray-600 mb-4">
                  An unexpected error occurred. Please try again or contact support if the problem persists.
                </p>
              </div>

              <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all">
                <div className="font-bold text-gray-700 mb-1">Error ID:</div>
                <div className="text-gray-600">{this.state.errorId}</div>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="cursor-pointer">
                  <summary className="font-semibold text-sm text-gray-700 hover:text-gray-900">
                    Error Details (Dev Only)
                  </summary>
                  <div className="mt-3 bg-red-50 p-3 rounded text-xs font-mono break-all max-h-48 overflow-auto">
                    <p className="text-red-800 mb-2">
                      <strong>{this.state.error?.name}:</strong> {this.state.error?.message}
                    </p>
                    <pre className="text-red-600 whitespace-pre-wrap text-xs">{this.state.error?.stack}</pre>
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button fullWidth color="primary" onClick={this.handleReset}>
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

    return this.props.children;
  }
}
