'use client';

import React, { ReactNode } from 'react';

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
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`React Error Boundary caught: ${error.message}`, error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      type: 'react-error-boundary'
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="site-shell site-main error-shell">
          <section className="panel error-panel">
            <p className="eyebrow">Application error</p>
            <h1>Something went wrong.</h1>
            <p className="lead">The page hit an unexpected error. Try again. If it keeps happening, use the error id below.</p>
            <div className="metric-card">
              <strong>Error ID</strong>
              <span className="muted">{this.state.errorId}</span>
            </div>
            {process.env.NODE_ENV === 'development' ? (
              <details className="error-details">
                <summary>Error details</summary>
                <pre>{this.state.error?.stack ?? this.state.error?.message}</pre>
              </details>
            ) : null}
            <div className="error-actions">
              <button type="button" className="button button-primary" onClick={this.handleReset}>
                Try again
              </button>
              <button type="button" className="button button-ghost" onClick={() => (window.location.href = '/en/palermo')}>
                Go to Palermo
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
