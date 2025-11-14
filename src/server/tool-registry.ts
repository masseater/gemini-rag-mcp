/**
 * Tool registry for MCP server
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../tools/base-tool.js";
import { EchoTool } from "../tools/implementations/echo-tool.js";
import { PingTool } from "../tools/implementations/ping-tool.js";

type Tool = EchoTool | PingTool;

export class ToolRegistry {
  private registeredTools: string[] = [];
  private toolInstances = new Map<string, Tool>();

  constructor(private server: McpServer) {}

  /**
   * Initialize tool registry by creating tool instances
   */
  initialize(): void {
    const context: ToolContext = {
      // Add your context properties here
      // Example: apiClient: this.apiClient,
    };

    // Manual tool registration for safety and explicit review
    const tools: Tool[] = [
      new EchoTool(context),
      new PingTool(context),
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
