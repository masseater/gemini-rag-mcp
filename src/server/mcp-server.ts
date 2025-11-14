/**
 * MCP server implementation with stdio and http transport support
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import type { ServerConfig, TransportConfig } from "../types/index.js";
import { ToolRegistry } from "./tool-registry.js";

/**
 * MCP server implementation
 */
export class MCPServerImpl {
  private server: McpServer;
  private config: ServerConfig | null = null;
  private toolRegistry: ToolRegistry | null = null;

  constructor() {
    this.server = new McpServer({
      name: "mcp-server",
      version: "1.0.0",
    });
  }

  /**
   * Initialize the MCP server with configuration
   */
  async initialize(config: ServerConfig): Promise<void> {
    this.config = config;

    // Setup tool registry and handlers
    this.toolRegistry = new ToolRegistry(this.server);

    // Initialize tool registry (loads tools automatically)
    this.toolRegistry.initialize();

    this.toolRegistry.setupToolHandlers();
  }

  /**
   * Start the server with specified transport
   */
  async start(transport: TransportConfig): Promise<void> {
    if (!this.config) {
      throw new Error("Server not initialized. Call initialize() first.");
    }

    if (transport.type === "stdio") {
      const stdioTransport = new StdioServerTransport();
      await this.server.connect(stdioTransport);
      // Don't log to stdout for stdio transport as it interferes with MCP protocol
    } else {
      const port = transport.port ?? 3000;
      const app = express();
      app.use(express.json());

      console.log("🌐 Setting up HTTP transport...");

      // Health check endpoint
      app.get("/health", (_req, res) => {
        console.log("📊 Health check requested");
        res.json({ status: "ok", timestamp: new Date().toISOString() });
      });

      // MCP Streamable HTTP endpoint
      app.post("/mcp", async (req, res) => {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        res.on("close", () => {
          void transport.close();
        });

        await this.server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      });

      app.listen(port, () => {
        console.log("🚀 HTTP MCP Server started successfully!");
        console.log(`🌐 Server listening on port ${String(port)}`);
        console.log(`📋 Available endpoints:`);
        console.log(`  - GET /health - Health check endpoint`);
        console.log(`  - POST /mcp - MCP Streamable HTTP endpoint`);
        if (this.toolRegistry) {
          console.log(`🔧 MCP Tools available: ${this.toolRegistry.getRegisteredTools().join(", ")}`);
        }
      });

      // Keep the process alive
      await new Promise<void>(() => {
        // Process will be kept alive by HTTP server
      });
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    // Server cleanup if needed
  }

  /**
   * Get server instance
   */
  getServer(): McpServer {
    return this.server;
  }
}
