/**
 * Tool to upload a file to FileSearchStore
 */

import { z } from "zod";
import { basename } from "node:path";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type UploadFileArgs = {
  filePath: string;
  mimeType?: string;
  displayName?: string;
};

type UploadFileResult = {
  documentName: string;
  filePath: string;
  displayName: string;
  storeName: string;
};

export class UploadFileTool extends BaseTool<UploadFileArgs> {
  readonly name = "upload_file";
  readonly description =
    "Upload a file to the FileSearchStore for RAG indexing. The file will be processed and made searchable.";

  getInputSchema() {
    return z.object({
      filePath: z
        .string()
        .describe(
          "Absolute path to the file to upload (e.g., /path/to/document.pdf)",
        ),
      mimeType: z
        .string()
        .optional()
        .describe(
          "MIME type of the file (e.g., application/pdf, text/markdown). Auto-detected if not provided.",
        ),
      displayName: z
        .string()
        .optional()
        .describe(
          "Display name for the file in the store. Uses filename if not provided.",
        ),
    });
  }

  async execute(args: UploadFileArgs): Promise<MCPToolResponse<UploadFileResult>> {
    const { geminiClient, storeDisplayName } = this.context;

    // Ensure store exists
    const store = await geminiClient.ensureStore(storeDisplayName);

    // Determine display name
    const displayName = args.displayName ?? basename(args.filePath);

    // Auto-detect MIME type if not provided
    let mimeType = args.mimeType;
    if (!mimeType) {
      const ext = args.filePath.split(".").pop()?.toLowerCase();
      mimeType = this.getMimeTypeFromExtension(ext ?? "");
    }

    // Upload file
    const result = await geminiClient.uploadFile({
      storeName: store.name,
      filePath: args.filePath,
      mimeType,
      displayName,
    });

    return {
      success: true,
      message: `File uploaded successfully: ${displayName}`,
      data: {
        documentName: result.documentName,
        filePath: args.filePath,
        displayName,
        storeName: store.name,
      },
    };
  }

  /**
   * Simple MIME type mapping for common file types
   */
  private getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      txt: "text/plain",
      md: "text/markdown",
      html: "text/html",
      json: "application/json",
      xml: "application/xml",
      csv: "text/csv",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    return mimeTypes[ext] ?? "application/octet-stream";
  }
}
