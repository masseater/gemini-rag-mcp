/**
 * Configuration management utilities
 */

import type { ServerConfig } from "../types/index.js";

/**
 * Default server configuration
 */
const DEFAULT_CONFIG: ServerConfig = {
  server: {
    name: "mcp-server",
    version: "1.0.0",
  },
  mcp: {
    maxResponseSize: 100000,
    defaultPageSize: 50,
  },
  logging: {
    level: process.env.LOG_LEVEL ?? "info",
    enableDebugConsole: process.env.DEBUG === "true",
  },
};

/**
 * Validate server configuration
 */
export function validateConfig(config: ServerConfig): boolean {
  try {
    // Validate MCP configuration
    if (config.mcp.maxResponseSize <= 0) {
      throw new Error("MCP maxResponseSize must be positive");
    }

    if (config.mcp.defaultPageSize <= 0) {
      throw new Error("MCP defaultPageSize must be positive");
    }

    // Validate logging configuration
    const validLogLevels = ["error", "warn", "info", "debug"];
    if (!validLogLevels.includes(config.logging.level)) {
      throw new Error(`Invalid log level: ${config.logging.level}`);
    }

    return true;
  } catch (error) {
    console.error("Configuration validation failed:", error);
    return false;
  }
}

/**
 * Load configuration from environment variables and defaults
 */
export function loadConfig(): ServerConfig {
  return {
    ...DEFAULT_CONFIG,
  };
}
