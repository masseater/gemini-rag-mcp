/**
 * Tool to query FileSearchStore using RAG
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type QueryStoreArgs = {
  query: string;
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
    });
  }

  async execute(args: QueryStoreArgs): Promise<MCPToolResponse<QueryStoreResult>> {
    const { geminiClient, storeDisplayName, defaultModel } = this.context;

    // Ensure store exists
    const store = await geminiClient.ensureStore(storeDisplayName);

    // Query the store using the default model from environment variable
    const result = await geminiClient.queryStore({
      storeName: store.name,
      query: args.query,
      model: defaultModel,
    });

    return {
      success: true,
      message: `Query completed successfully. Found ${String(result.citations.length)} citation(s).`,
      data: {
        text: result.text,
        citations: result.citations,
        query: args.query,
        model: defaultModel,
        storeName: store.name,
      },
    };
  }
}
