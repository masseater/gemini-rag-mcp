/**
 * RawTool base class for tools that support raw option
 */

import { BaseTool } from "./base-tool.js";

/**
 * Base class for tools that support the 'raw' option
 * The raw option controls response verbosity:
 * - raw=false (default): Returns minimal, optimized response for context efficiency
 * - raw=true: Returns full, detailed response with all available data
 */
export abstract class RawTool<TArgs extends { raw?: boolean | undefined }> extends BaseTool<TArgs> {
  /**
   * Execute core tool logic without raw option handling
   * Override this method to implement the main tool behavior
   * @param args - Tool arguments excluding the raw option
   * @returns Raw result data before formatting
   */
  abstract executeCore(args: Omit<TArgs, "raw">): Promise<unknown>;

  /**
   * Format the result based on raw option
   * Override this method to implement response optimization logic
   * @param data - Raw result data from executeCore()
   * @param raw - Whether to return full data (true) or optimized summary (false)
   * @returns Formatted response appropriate for the raw setting
   */
  abstract formatResponse(data: unknown, raw: boolean): unknown;

  /**
   * Final execute implementation that coordinates core execution and formatting
   * This method should not be overridden in subclasses
   */
  async execute(args: TArgs): Promise<unknown> {
    const { raw, ...coreArgs } = args;
    const result = await this.executeCore(coreArgs);
    return this.formatResponse(result, raw ?? false);
  }
}
