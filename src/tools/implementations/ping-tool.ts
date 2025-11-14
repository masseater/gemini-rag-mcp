/**
 * Ping tool - Simple health check tool
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type PingArgs = Record<string, never>;

/**
 * Ping tool that demonstrates a no-argument tool
 * Returns server status and timestamp
 */
export class PingTool extends BaseTool<PingArgs> {
  readonly name = "ping";
  readonly description = "Check if the server is responding";

  getInputSchema() {
    return z.object({});
  }

  execute(_args: PingArgs): MCPToolResponse<{ status: string; timestamp: string }> {
    return {
      success: true,
      message: "Server is responding",
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
