/**
 * Tool to upload text content to FileSearchStore
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type {
  MCPToolResponse,
  CustomMetadata,
  MetadataInput,
} from "../../types/index.js";
import { convertMetadataInput } from "../../utils/metadata.js";

type UploadContentArgs = {
  content: string;
  displayName: string;
  metadata?: MetadataInput;
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
      metadata: z
        .record(z.union([z.string(), z.number()]))
        .optional()
        .describe(
          "Custom metadata as key-value pairs. Values can be strings or numbers. Maximum 20 entries per document. Example: {\"category\": \"guide\", \"year\": 2025}",
        ),
    });
  }

  async execute(
    args: UploadContentArgs,
  ): Promise<MCPToolResponse<UploadContentResult>> {
    const { geminiClient, storeDisplayName } = this.context;

    // Ensure store exists
    const store = await geminiClient.ensureStore(storeDisplayName);

    // Upload content
    const uploadArgs: {
      storeName: string;
      content: string;
      displayName: string;
      metadata?: CustomMetadata[];
    } = {
      storeName: store.name,
      content: args.content,
      displayName: args.displayName,
    };

    if (args.metadata) {
      uploadArgs.metadata = convertMetadataInput(args.metadata);
    }

    const result = await geminiClient.uploadContent(uploadArgs);

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
