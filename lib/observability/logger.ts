/**
 * Structured logging system with environment-aware output.
 * Development: Pretty console logs
 * Production: JSON logs suitable for log aggregation (Sentry, DataDog, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = typeof window === 'undefined' ? process.env.NODE_ENV === 'development' : false;

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        : undefined
    };
  }

  private output(entry: LogEntry) {
    // In development, pretty-print to console
    if (this.isDevelopment) {
      const { level, message, context, error } = entry;
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[level];

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${entry.timestamp}] ${message}`,
        context ? context : '',
        error ? error : ''
      );
    } else {
      // In production, output as JSON for log aggregation
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.output(this.formatEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>) {
    this.output(this.formatEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.output(this.formatEntry('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.output(this.formatEntry('error', message, context, error));
  }
}

export const logger = new Logger();
