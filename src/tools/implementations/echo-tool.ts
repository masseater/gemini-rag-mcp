/**
 * Echo tool - Simple example tool that returns the input message
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type EchoArgs = {
  message: string;
};

/**
 * Echo tool that demonstrates basic tool implementation
 * Returns the input message back to the caller
 */
export class EchoTool extends BaseTool<EchoArgs> {
  readonly name = "echo";
  readonly description = "Echo back the input message";

  getInputSchema() {
    return z.object({
      message: z.string().describe("The message to echo back"),
    });
  }

  async execute(args: EchoArgs): Promise<MCPToolResponse<{ message: string }>> {
    return {
      success: true,
      message: "Message echoed successfully",
      data: {
        message: args.message,
      },
    };
  }
}
