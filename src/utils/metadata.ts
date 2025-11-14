/**
 * Metadata conversion utilities
 */

import type { CustomMetadata, MetadataInput } from "../types/index.js";

/**
 * Convert simple key-value metadata to Gemini API CustomMetadata format
 */
export function convertMetadataInput(
  input: MetadataInput,
): CustomMetadata[] {
  return Object.entries(input).map(([key, value]) => {
    if (typeof value === "string") {
      return { key, stringValue: value };
    }
    return { key, numericValue: value };
  });
}
