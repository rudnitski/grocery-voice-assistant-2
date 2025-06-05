/**
 * Shared logger utility for consistent logging across the application.
 * Provides different log levels and configurable verbosity based on environment.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  /** Minimum log level to display */
  minLevel?: LogLevel;
  /** Whether to include timestamps in logs */
  timestamps?: boolean;
  /** Whether to include log level in logs */
  showLevel?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a logger instance with the specified options
 */
export function createLogger(options: LoggerOptions = {}) {
  const {
    minLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamps = true,
    showLevel = true,
  } = options;

  const minLevelValue = LOG_LEVELS[minLevel];

  /**
   * Formats a log message with optional timestamp and level
   */
  const formatMessage = (level: LogLevel, message: string): string => {
    const parts: string[] = [];
    
    if (timestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (showLevel) {
      parts.push(`[${level.toUpperCase()}]`);
    }
    
    parts.push(message);
    return parts.join(' ');
  };

  return {
    /**
     * Log a debug message
     */
    debug: (message: string, ...args: any[]): void => {
      if (LOG_LEVELS.debug >= minLevelValue) {
        console.debug(formatMessage('debug', message), ...args);
      }
    },

    /**
     * Log an info message
     */
    info: (message: string, ...args: any[]): void => {
      if (LOG_LEVELS.info >= minLevelValue) {
        console.info(formatMessage('info', message), ...args);
      }
    },

    /**
     * Log a warning message
     */
    warn: (message: string, ...args: any[]): void => {
      if (LOG_LEVELS.warn >= minLevelValue) {
        console.warn(formatMessage('warn', message), ...args);
      }
    },

    /**
     * Log an error message
     */
    error: (message: string, ...args: any[]): void => {
      if (LOG_LEVELS.error >= minLevelValue) {
        console.error(formatMessage('error', message), ...args);
      }
    },
  };
}

/**
 * Default logger instance for the application
 */
export const logger = createLogger();

export default logger;
