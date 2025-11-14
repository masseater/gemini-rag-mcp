/**
 * Base tool abstract class
 */

import type { ZodSchema } from "zod";
import type { ToolContext, ToolDefinition, ToolResponse } from "../base-tool.js";
import { createToolResponse, convertToJsonSchema } from "../base-tool.js";
import { logger } from "../../utils/logger.js";

/**
 * Abstract base class for all MCP tools
 * Implements Template Method pattern for tool definition
 */
export abstract class BaseTool<TArgs = Record<string, unknown>> {
  /**
   * Tool name (must be unique across all tools)
   */
  abstract readonly name: string;

  /**
   * Tool description for MCP clients
   */
  abstract readonly description: string;

  constructor(protected readonly context: ToolContext) {}

  /**
   * Get Zod schema for input validation
   * Override this method to define tool-specific input schema
   */
  abstract getInputSchema(): ZodSchema;

  /**
   * Execute the tool logic
   * Override this method to implement tool-specific behavior
   * @param args - Validated input arguments
   * @returns Tool execution result
   */
  abstract execute(args: TArgs): Promise<unknown>;

  /**
   * Default handler that wraps execute() with response creation
   * Handles errors and returns error response with isError flag
   *
   * Error handling strategy:
   * - Catches all errors thrown by execute()
   * - Logs error details for debugging (without sensitive information)
   * - Returns error.message to AI client for appropriate action
   * - Sets isError: true to indicate error state
   *
   * Can be overridden if custom response handling is needed
   */
  async handler(args: TArgs): Promise<ToolResponse> {
    try {
      const result = await this.execute(args);
      return createToolResponse(result);
    } catch (error) {
      // Log error for debugging (error object does not contain sensitive args)
      logger.error(`[${this.name}] Error`, { error });

      // Return error message to AI client
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Convert this tool instance to a ToolDefinition
   * Used by ToolRegistry for MCP server registration
   */
  toDefinition(): ToolDefinition<TArgs> {
    return {
      name: this.name,
      description: this.description,
      inputSchema: convertToJsonSchema(this.getInputSchema()),
      handler: this.handler.bind(this),
    };
  }
}
