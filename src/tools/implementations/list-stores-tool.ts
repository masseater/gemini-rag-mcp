/**
 * Tool to list all FileSearchStores
 */

import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type ListStoresArgs = {
  pageSize?: number;
};

type StoreInfo = {
  name: string;
  displayName?: string | undefined;
};

type ListStoresResult = {
  stores: StoreInfo[];
  total: number;
};

export class ListStoresTool extends BaseTool<ListStoresArgs> {
  readonly name = "list_stores";
  readonly description =
    "List all available FileSearchStores in the current project.";

  getInputSchema() {
    return z.object({
      pageSize: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Number of stores to fetch per page (max 100, default 20)"),
    });
  }

  async execute(args: ListStoresArgs): Promise<MCPToolResponse<ListStoresResult>> {
    const { geminiClient } = this.context;

    const stores = await geminiClient.listStores({
      pageSize: args.pageSize ?? 20,
    });

    return {
      success: true,
      message: `Found ${String(stores.length)} FileSearchStore(s)`,
      data: {
        stores,
        total: stores.length,
      },
    };
  }
}
