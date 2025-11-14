/**
 * Singleton logger instance for the MCP Server
 * Provides file and console logging using Winston
 */

import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

class LoggerService {
  private logger: WinstonLogger | null = null;
  private isInitialized = false;
  private enableDebugConsole = false;

  /**
   * Initialize the logger with configuration
   * Must be called before using logger methods
   */
  initialize(options: {
    level: string;
    logFileName: string;
    enableConsole: boolean;
    enableDebugConsole: boolean;
  }): void {
    if (this.isInitialized) {
      return;
    }

    this.enableDebugConsole = options.enableDebugConsole;

    const logDir = dirname(options.logFileName);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const fileTransport = new transports.File({
      filename: options.logFileName,
      level: options.level,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    });

    const consoleTransport = new transports.Console({
      format: format.combine(
        format.timestamp(),
        format((info) => {
          // Filter out debug logs if DEBUG=false
          if (info.isDebug && !this.enableDebugConsole) {
            return false;
          }
          return info;
        })(),
        format.json()
      ),
    });

    this.logger = createLogger({
      level: options.level,
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        fileTransport,
        ...(options.enableConsole ? [consoleTransport] : []),
      ],
    });

    this.isInitialized = true;
  }

  /**
   * Get the logger instance
   * Throws error if not initialized
   */
  getLogger(): WinstonLogger {
    if (!this.logger) {
      throw new Error('Logger not initialized. Call logger.initialize() first.');
    }
    return this.logger;
  }

  /**
   * Log info message (always to console + file)
   */
  info(message: string, meta?: Record<string, unknown>): void {
    if (!this.logger) {
      throw new Error('Logger not initialized. Call logger.initialize() first.');
    }
    this.logger.info(message, meta);
  }

  /**
   * Log warning message (always to console + file)
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    if (!this.logger) {
      throw new Error('Logger not initialized. Call logger.initialize() first.');
    }
    this.logger.warn(message, meta);
  }

  /**
   * Log error message (always to console + file)
   */
  error(message: string, meta?: Record<string, unknown>): void {
    if (!this.logger) {
      throw new Error('Logger not initialized. Call logger.initialize() first.');
    }
    this.logger.error(message, meta);
  }

  /**
   * Log debug message (file always, console controlled by DEBUG env var)
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (!this.logger) {
      throw new Error('Logger not initialized. Call logger.initialize() first.');
    }
    this.logger.info(message, { ...meta, isDebug: true });
  }

  /**
   * Check if logger is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export as singleton instance
export const logger = new LoggerService();
