/**
 * Tool registry for MCP server
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../tools/base-tool.js";
import { EnsureStoreTool } from "../tools/implementations/ensure-store-tool.js";
import { ListStoresTool } from "../tools/implementations/list-stores-tool.js";
import { UploadFileTool } from "../tools/implementations/upload-file-tool.js";
import { QueryStoreTool } from "../tools/implementations/query-store-tool.js";

type Tool =
  | EnsureStoreTool
  | ListStoresTool
  | UploadFileTool
  | QueryStoreTool;

export class ToolRegistry {
  private registeredTools: string[] = [];
  private toolInstances = new Map<string, Tool>();

  constructor(private server: McpServer) {}

  /**
   * Initialize tool registry by creating tool instances
   */
  initialize(context: ToolContext): void {
    // Manual tool registration for safety and explicit review
    const tools: Tool[] = [
      new EnsureStoreTool(context),
      new ListStoresTool(context),
      new UploadFileTool(context),
      new QueryStoreTool(context),
    ];

    for (const tool of tools) {
      this.toolInstances.set(tool.name, tool);
    }

    console.log(`✅ ToolRegistry initialized with ${String(this.toolInstances.size)} tools`);
  }

  getToolByName(name: string): Tool | undefined {
    return this.toolInstances.get(name);
  }

  setupToolHandlers(): void {
    for (const tool of this.toolInstances.values()) {
      // Pass Zod schema directly to MCP SDK
      // SDK handles JSON Schema conversion internally for both stdio and HTTP transports
      this.server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.getInputSchema().shape,
        },
        tool.handler.bind(tool) as never,
      );
      this.registeredTools.push(tool.name);
    }
  }

  getRegisteredTools(): string[] {
    return this.registeredTools;
  }
}
