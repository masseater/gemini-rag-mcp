import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodSchema } from "zod";
import type { GeminiClient } from "../clients/gemini-client.js";

type ToolHandler<TArgs = Record<string, unknown>> = (
  args: TArgs
) => Promise<{
  content: {
    type: string;
    text: string;
  }[];
}>;

export type ToolDefinition<TArgs = Record<string, unknown>> = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler<TArgs>;
}

export type ToolContext = {
  geminiClient: GeminiClient;
  storeDisplayName: string;
  defaultModel: string;
}

export type ToolResponse = {
  content: {
    type: "text";
    text: string;
  }[];
  isError?: boolean;
};

export function createToolResponse(data: unknown): ToolResponse {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function convertToJsonSchema(schema: ZodSchema): Record<string, unknown> {
  // Use jsonSchema2019-09 target for better compatibility with JSON Schema Draft 2020-12
  // Note: MCP SDK uses zod-to-json-schema internally, so we must match its approach
  const jsonSchema = zodToJsonSchema(schema, {
    target: "jsonSchema2019-09",
    $refStrategy: "none",
  });

  if (typeof jsonSchema === "object") {
    // Remove $schema and definitions fields as MCP doesn't require them in tool definitions
    const { $schema: _$schema, definitions: _definitions, ...cleanSchema } = jsonSchema as Record<string, unknown>;
    return cleanSchema;
  }

  return jsonSchema as Record<string, unknown>;
}
