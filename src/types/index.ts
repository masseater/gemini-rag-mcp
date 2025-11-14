/**
 * Core type definitions for MCP Server
 */

// Configuration types
export type ServerConfig = {
  server: {
    name: string;
    version: string;
  };
  mcp: {
    maxResponseSize: number;
    defaultPageSize: number;
  };
  logging: {
    level: string;
    enableDebugConsole: boolean;
  };
  gemini: {
    apiKey: string;
    storeDisplayName: string;
  };
}

// Transport types
export type TransportType = "stdio" | "http";

export type TransportConfig = {
  type: TransportType;
  port?: number | undefined;
}

// MCP response types
export type MCPToolResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
}
