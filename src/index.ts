#!/usr/bin/env node

/**
 * MCP Server - Main entry point
 *
 * Provides Model Context Protocol server with support for both stdio and http transports.
 */

import { Command } from "commander";
import type { TransportType } from "./types/index.js";
import { loadConfig, validateConfig } from "./config/index.js";
import { MCPServerImpl } from "./server/mcp-server.js";
import { logger } from "./utils/logger.js";

type CLIOptions = {
  transport: string;
  port: string;
  logLevel: string;
};

const program = new Command();

// Configure CLI
program
  .name("mcp-server")
  .description("Model Context Protocol server")
  .version("1.0.0");

program
  .option("-t, --transport <type>", "Transport type (stdio|http)", "stdio")
  .option(
    "-p, --port <number>",
    "Port for HTTP transport",
    process.env.PORT ?? "3000",
  )
  .option("--log-level <level>", "Log level (error|warn|info|debug)", "info")
  .action(async (options: CLIOptions) => {
    try {
      // Validate transport type
      const transport = options.transport as TransportType;
      if (!["stdio", "http"].includes(transport)) {
        console.error('Error: Transport must be either "stdio" or "http"');
        process.exit(1);
      }

      // Load configuration
      const config = loadConfig();

      // Initialize logger with file output
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logDir = "logs";
      const logFileName = `${logDir}/mcp-server-${timestamp}.log`;

      logger.initialize({
        level: options.logLevel,
        logFileName,
        enableConsole: transport === "http",
        enableDebugConsole: config.logging.enableDebugConsole,
      });

      logger.info("Starting MCP Server", {
        transport,
        port: transport === "http" ? parseInt(options.port) : undefined,
      });

      // Validate configuration
      if (!validateConfig(config)) {
        console.error("Invalid configuration");
        process.exit(1);
      }

      // Initialize and start MCP server
      const mcpServer = new MCPServerImpl();

      await mcpServer.initialize(config);
      await mcpServer.start({
        type: transport,
        port: transport === "http" ? parseInt(options.port) : undefined,
      });

      // Keep process alive for stdio transport
      if (transport === "stdio") {
        process.stdin.resume();
        // Don't log to stdout for stdio transport as it interferes with MCP protocol
      } else {
        // HTTP transport keeps process alive automatically
        logger.info("MCP Server started successfully");
        console.log("HTTP MCP Server is running. Press Ctrl+C to stop.");

        // Keep the process alive for HTTP transport
        await new Promise<void>(() => {
          // Don't resolve the promise to keep the process alive
          // The process will be kept alive by the HTTP server
        });
      }
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  });

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Parse command line arguments
program.parse();
