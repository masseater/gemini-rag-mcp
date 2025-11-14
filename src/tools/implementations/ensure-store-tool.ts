/**
 * Tool to ensure FileSearchStore exists (create if not found)
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type EnsureStoreArgs = Record<string, never>;

type EnsureStoreResult = {
  storeName: string;
  displayName?: string | undefined;
  created: boolean;
};

export class EnsureStoreTool extends BaseTool<EnsureStoreArgs> {
  readonly name = "ensure_store";
  readonly description =
    "Ensure a FileSearchStore exists for the configured display name. Creates one if it doesn't exist.";

  getInputSchema() {
    return z.object({});
  }

  async execute(_args: EnsureStoreArgs): Promise<MCPToolResponse<EnsureStoreResult>> {
    const { geminiClient, storeDisplayName } = this.context;

    // Check if store exists
    const existingStore = await geminiClient.findStoreByDisplayName(storeDisplayName);

    if (existingStore) {
      return {
        success: true,
        message: `FileSearchStore already exists: ${existingStore.name}`,
        data: {
          storeName: existingStore.name,
          displayName: existingStore.displayName,
          created: false,
        },
      };
    }

    // Create new store
    const newStore = await geminiClient.createStore(storeDisplayName);

    return {
      success: true,
      message: `Created new FileSearchStore: ${newStore.name}`,
      data: {
        storeName: newStore.name,
        displayName: newStore.displayName,
        created: true,
      },
    };
  }
}
