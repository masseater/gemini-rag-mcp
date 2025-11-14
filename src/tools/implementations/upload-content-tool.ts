/**
 * Tool to upload text content to FileSearchStore
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type UploadContentArgs = {
  content: string;
  displayName: string;
};

type UploadContentResult = {
  documentName: string;
  displayName: string;
  storeName: string;
  contentLength: number;
};

export class UploadContentTool extends BaseTool<UploadContentArgs> {
  readonly name = "upload_content";
  readonly description =
    "Upload text content to the FileSearchStore for RAG indexing. The content will be processed and made searchable.";

  getInputSchema() {
    return z.object({
      content: z
        .string()
        .min(1)
        .describe("Text content to upload to the knowledge base"),
      displayName: z
        .string()
        .min(1)
        .describe("Display name for the content in the store"),
    });
  }

  async execute(
    args: UploadContentArgs,
  ): Promise<MCPToolResponse<UploadContentResult>> {
    const { geminiClient, storeDisplayName } = this.context;

    // Ensure store exists
    const store = await geminiClient.ensureStore(storeDisplayName);

    // Upload content
    const result = await geminiClient.uploadContent({
      storeName: store.name,
      content: args.content,
      displayName: args.displayName,
    });

    return {
      success: true,
      message: `Content uploaded successfully: ${args.displayName}`,
      data: {
        documentName: result.documentName,
        displayName: args.displayName,
        storeName: store.name,
        contentLength: args.content.length,
      },
    };
  }
}
