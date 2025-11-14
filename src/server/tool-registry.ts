/**
 * Tool registry for MCP server
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../tools/base-tool.js";
import { UploadFileTool } from "../tools/implementations/upload-file-tool.js";
import { UploadContentTool } from "../tools/implementations/upload-content-tool.js";
import { QueryTool } from "../tools/implementations/query-tool.js";

type Tool =
  | UploadFileTool
  | UploadContentTool
  | QueryTool;

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
      new UploadFileTool(context),
      new UploadContentTool(context),
      new QueryTool(context),
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
