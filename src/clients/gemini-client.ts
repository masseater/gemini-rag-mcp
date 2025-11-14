/**
 * Gemini API client for File Search RAG operations
 */

import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import type { CustomMetadata } from "../types/index.js";

type FileSearchStore = {
  name: string;
  displayName?: string | undefined;
};

type UploadFileResult = {
  documentName: string;
};

type ListStoresConfig = {
  pageSize?: number;
};

type GenerateContentResult = {
  text: string;
  citations: string[];
};

/**
 * Operation polling utility
 */
type MinimalOperation = {
  done?: boolean;
  name?: string;
  error?: { message?: string; code?: number; details?: unknown };
};

export class GeminiClient {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({
      vertexai: false,
      apiKey,
    });
  }

  /**
   * Wait for long-running operation to complete
   */
  private async waitForOperationDone<T extends MinimalOperation>(
    operation: T,
    pollMs = 5000,
  ): Promise<T> {
    let current: MinimalOperation = operation as MinimalOperation;

    for (;;) {
      if (current.done === true) {
        if (current.error) {
          throw new Error(
            current.error.message ?? JSON.stringify(current.error),
          );
        }
        return current as T;
      }

      await new Promise((resolve) => setTimeout(resolve, pollMs));

      const next = await (
        this.ai.operations.get as unknown as (args: {
          operation: unknown;
        }) => Promise<unknown>
      )({ operation: current });

      if (typeof next !== "object" || next === null) {
        throw new Error("Invalid operation state received while polling");
      }
      current = next as MinimalOperation;
    }
  }

  /**
   * Get a specific FileSearchStore by name
   */
  async getStore(name: string): Promise<FileSearchStore> {
    const store = await this.ai.fileSearchStores.get({ name });
    if (!store.name) {
      throw new Error(`FileSearchStore not found: ${name}`);
    }
    return {
      name: store.name,
      displayName: store.displayName,
    };
  }

  /**
   * List all FileSearchStores
   */
  async listStores(config?: ListStoresConfig): Promise<FileSearchStore[]> {
    const stores: FileSearchStore[] = [];
    const pager = await this.ai.fileSearchStores.list({
      config: { pageSize: config?.pageSize ?? 20 },
    });

    for await (const store of pager) {
      stores.push({
        name: store.name ?? "",
        displayName: store.displayName,
      });
    }

    return stores;
  }

  /**
   * Find a FileSearchStore by display name
   */
  async findStoreByDisplayName(
    displayName: string,
  ): Promise<FileSearchStore | null> {
    const stores = await this.listStores();
    const found = stores.find((store) => store.displayName === displayName);
    return found ?? null;
  }

  /**
   * Create a new FileSearchStore
   */
  async createStore(displayName: string): Promise<FileSearchStore> {
    logger.info(`Creating FileSearchStore with displayName: ${displayName}`);
    const created = await this.ai.fileSearchStores.create({
      config: { displayName },
    });

    if (!created.name) {
      throw new Error("Failed to create FileSearchStore");
    }

    logger.info(`Created FileSearchStore: ${created.name}`);
    return {
      name: created.name,
      displayName: created.displayName,
    };
  }

  /**
   * Ensure a FileSearchStore exists (find by displayName or create)
   */
  async ensureStore(displayName: string): Promise<FileSearchStore> {
    logger.info(
      `Searching for FileSearchStore with displayName: ${displayName}`,
    );
    const foundStore = await this.findStoreByDisplayName(displayName);

    if (foundStore) {
      logger.info(`Found matching FileSearchStore: ${foundStore.name}`);
      return foundStore;
    }

    logger.info(
      `No matching store found. Creating new FileSearchStore with displayName: ${displayName}`,
    );
    return await this.createStore(displayName);
  }

  /**
   * Upload a Blob to a FileSearchStore (common logic for file and content uploads)
   */
  private async uploadBlob(args: {
    storeName: string;
    blob: Blob;
    mimeType: string;
    displayName: string;
    metadata?: CustomMetadata[];
  }): Promise<UploadFileResult> {
    logger.info(`Uploading: ${args.displayName} (${args.mimeType})`);

    const config: {
      mimeType: string;
      displayName: string;
      customMetadata?: CustomMetadata[];
    } = {
      mimeType: args.mimeType,
      displayName: args.displayName,
    };

    if (args.metadata) {
      config.customMetadata = args.metadata;
    }

    const op = await this.ai.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: args.storeName,
      file: args.blob,
      config,
    });

    const finished = await this.waitForOperationDone(op, 5000);
    const result = finished as unknown as {
      response?: { documentName?: string };
    };

    const documentName = result.response?.documentName ?? randomUUID();
    logger.info(`Upload complete: ${documentName}`);

    return { documentName };
  }

  /**
   * Upload a file to a FileSearchStore
   */
  async uploadFile(args: {
    storeName: string;
    filePath: string;
    mimeType: string;
    displayName: string;
    metadata?: CustomMetadata[];
  }): Promise<UploadFileResult> {
    // Read file and convert to Blob to handle multibyte characters in path
    const fileBuffer = await readFile(args.filePath);
    const blob = new Blob([new Uint8Array(fileBuffer)], {
      type: args.mimeType,
    });

    const uploadArgs: {
      storeName: string;
      blob: Blob;
      mimeType: string;
      displayName: string;
      metadata?: CustomMetadata[];
    } = {
      storeName: args.storeName,
      blob,
      mimeType: args.mimeType,
      displayName: args.displayName,
    };

    if (args.metadata) {
      uploadArgs.metadata = args.metadata;
    }

    return await this.uploadBlob(uploadArgs);
  }

  /**
   * Upload text content to a FileSearchStore
   */
  async uploadContent(args: {
    storeName: string;
    content: string;
    displayName: string;
    metadata?: CustomMetadata[];
  }): Promise<UploadFileResult> {
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(args.content);
    const blob = new Blob([contentBytes], { type: "text/plain" });

    const uploadArgs: {
      storeName: string;
      blob: Blob;
      mimeType: string;
      displayName: string;
      metadata?: CustomMetadata[];
    } = {
      storeName: args.storeName,
      blob,
      mimeType: "text/plain",
      displayName: args.displayName,
    };

    if (args.metadata) {
      uploadArgs.metadata = args.metadata;
    }

    return await this.uploadBlob(uploadArgs);
  }

  /**
   * Query a FileSearchStore using RAG
   */
  async queryStore(args: {
    storeName: string;
    query: string;
    model?: string;
  }): Promise<GenerateContentResult> {
    const model = args.model ?? "gemini-2.5-pro";
    logger.info(`Querying store ${args.storeName} with model ${model}`);

    const response = await this.ai.models.generateContent({
      model,
      contents: args.query,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [args.storeName],
            },
          },
        ],
      },
    });

    return {
      text: this.extractResponseText(response),
      citations: this.extractCitations(response),
    };
  }

  /**
   * Extract text from Gemini response
   */
  private extractResponseText(response: unknown): string {
    const resp = response as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!resp.candidates?.[0]?.content?.parts) {
      return "";
    }

    const parts = resp.candidates[0].content.parts;
    return parts.map((part) => part.text ?? "").join("");
  }

  /**
   * Extract citations from Gemini response
   */
  private extractCitations(response: unknown): string[] {
    const resp = response as {
      candidates?: {
        groundingMetadata?: {
          groundingChunks?: { web?: { uri?: string } }[];
        };
      }[];
    };

    const chunks = resp.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!chunks) {
      return [];
    }

    return chunks
      .map((chunk) => chunk.web?.uri)
      .filter((uri): uri is string => typeof uri === "string");
  }
}
