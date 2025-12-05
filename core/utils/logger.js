/**
 * Logger utility with different log levels
 * In production, only warnings and errors are logged
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Determine log level based on environment
// Safe check for window object (for Node.js compatibility)
const isDevelopment = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
);

const currentLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, context, ...args) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = context ? `[${timestamp}] [${level}] [${context}]` : `[${timestamp}] [${level}]`;
  return [prefix, ...args];
}

export const logger = {
  /**
   * Debug level logging - only in development
   * @param {string} context - Context/module name
   * @param  {...any} args - Arguments to log
   */
  debug(context, ...args) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(...formatMessage('DEBUG', context, ...args));
    }
  },

  /**
   * Info level logging - only in development
   * @param {string} context - Context/module name
   * @param  {...any} args - Arguments to log
   */
  info(context, ...args) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info(...formatMessage('INFO', context, ...args));
    }
  },

  /**
   * Warning level logging - always shown
   * @param {string} context - Context/module name
   * @param  {...any} args - Arguments to log
   */
  warn(context, ...args) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(...formatMessage('WARN', context, ...args));
    }
  },

  /**
   * Error level logging - always shown
   * @param {string} context - Context/module name
   * @param  {...any} args - Arguments to log
   */
  error(context, ...args) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(...formatMessage('ERROR', context, ...args));
    }
  },

  /**
   * Get current log level
   */
  getLevel() {
    return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLevel);
  }
};
