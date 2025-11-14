/**
 * Tool to query FileSearchStore using RAG
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type QueryStoreArgs = {
  query: string;
  model?: string;
};

type QueryStoreResult = {
  text: string;
  citations: string[];
  query: string;
  model: string;
  storeName: string;
};

export class QueryStoreTool extends BaseTool<QueryStoreArgs> {
  readonly name = "query_store";
  readonly description =
    "Query the FileSearchStore using RAG (Retrieval-Augmented Generation) to get answers based on uploaded documents. The AI will search through the documents and provide relevant answers with citations.";

  getInputSchema() {
    return z.object({
      query: z
        .string()
        .min(1)
        .describe("The question or query to search for in the knowledge base"),
      model: z
        .string()
        .optional()
        .describe(
          "Gemini model to use (default: gemini-2.5-pro). Options: gemini-2.5-pro, gemini-1.5-flash",
        ),
    });
  }

  async execute(args: QueryStoreArgs): Promise<MCPToolResponse<QueryStoreResult>> {
    const { geminiClient, storeDisplayName } = this.context;

    // Ensure store exists
    const store = await geminiClient.ensureStore(storeDisplayName);

    // Query the store
    const model = args.model ?? "gemini-2.5-pro";
    const result = await geminiClient.queryStore({
      storeName: store.name,
      query: args.query,
      model,
    });

    return {
      success: true,
      message: `Query completed successfully. Found ${String(result.citations.length)} citation(s).`,
      data: {
        text: result.text,
        citations: result.citations,
        query: args.query,
        model,
        storeName: store.name,
      },
    };
  }
}
