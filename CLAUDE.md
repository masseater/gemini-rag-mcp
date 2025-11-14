# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities using Google's Gemini API File Search feature. The server enables AI applications to create knowledge bases from uploaded documents and retrieve information using semantic search. Built with TypeScript in strict mode, supporting both stdio and HTTP transports.

## Development Commands

### Setup
```bash
pnpm install
```

### Development
```bash
# stdio transport (default, for MCP clients like Claude Desktop)
pnpm run dev

# HTTP transport (for debugging and testing)
pnpm run dev:http
```

### Building
```bash
pnpm run build
```

### Code Quality
```bash
# Type checking (MUST pass before committing)
pnpm run type-check

# Linting (MUST pass before committing)
pnpm run lint

# Auto-fix linting errors
pnpm run lint:fix

# Detect unused code/dependencies
pnpm run knip

# Auto-fix knip issues
pnpm run knip:fix
```

### Testing
```bash
# Run tests
pnpm run test

# Watch mode
pnpm run test:watch

# With coverage
pnpm run test:coverage
```

### Running Built Server
```bash
# stdio transport
pnpm run start:stdio

# HTTP transport
pnpm run start:http
```

## Node.js Version Management

This project uses **Volta** for Node.js version management. The required version is specified in `package.json` under `volta` field (Node.js 22.20.0).

When running commands, Volta automatically uses the correct Node.js version specified in the project.

## Architecture

### Tool System Architecture

The codebase implements a **Template Method Pattern** for tool development:

1. **BaseTool** (`src/tools/base/base-tool.ts`): Abstract base class for all tools
   - Provides consistent error handling and response formatting
   - All tools must extend this class
   - Override `getInputSchema()` to define Zod validation schema
   - Override `execute()` to implement tool logic (can be sync or async)

2. **ToolRegistry** (`src/server/tool-registry.ts`): Central tool registration
   - Manual registration for explicit control and safety
   - All tools must be added to the `Tool` type union
   - All tools must be added to the `tools` array in `initialize()`

### Gemini Client Architecture

**GeminiClient** (`src/clients/gemini-client.ts`): Core integration with Gemini API
- Handles FileSearchStore CRUD operations
- Manages document uploads with operation polling
- Executes RAG queries with citation extraction
- Provides store discovery by display name
- Accessible via `ToolContext` in all tools

### Current RAG Tools

1. **upload_file**: Upload file documents to knowledge base (auto-detects MIME type)
2. **upload_content**: Upload text content directly to knowledge base (text/plain, UTF-8)
3. **query**: Query knowledge base using RAG with Gemini models

Note: FileSearchStore is automatically created/ensured internally during upload and query operations.

### Key Files

- `src/index.ts`: Entry point with CLI handling and transport initialization
- `src/server/mcp-server.ts`: Core MCP server implementation
- `src/server/tool-registry.ts`: Tool registration and management
- `src/clients/gemini-client.ts`: Gemini API client for RAG operations
- `src/tools/base/base-tool.ts`: Base class for all tools
- `src/tools/implementations/`: RAG tool implementations (upload-file, upload-content, query)
- `src/types/index.ts`: Shared type definitions
- `src/config/index.ts`: Configuration management with Gemini config validation
- `src/utils/logger.ts`: Winston-based logging

### Adding New Tools

1. Create tool file in `src/tools/implementations/your-tool.ts`:
```typescript
import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type YourToolArgs = {
  param: string;
};

export class YourTool extends BaseTool<YourToolArgs> {
  readonly name = "your_tool";
  readonly description = "What your tool does";

  getInputSchema() {
    return z.object({
      param: z.string().describe("Parameter description"),
    });
  }

  execute(args: YourToolArgs): MCPToolResponse<YourDataType> {
    // Access Gemini client via context
    const result = this.context.geminiClient.someMethod();

    return {
      success: true,
      message: "Operation completed",
      data: result,
    };
  }
}
```

2. Register in `src/server/tool-registry.ts`:
   - Add to `Tool` type union: `type Tool = EnsureStoreTool | ... | YourTool;`
   - Add to tools array: `new YourTool(context),`

**Important**: Access `geminiClient`, `storeDisplayName`, and `defaultModel` via `this.context` in tools.

### Upload Architecture

The codebase implements shared upload logic to avoid code duplication:

1. **GeminiClient.uploadBlob()** (private): Common logic for uploading Blob to Gemini API
   - Handles file upload operation and polling
   - Used by both uploadFile and uploadContent methods

2. **GeminiClient.uploadFile()**: Reads file from path → Blob → uploadBlob
3. **GeminiClient.uploadContent()**: Encodes text (UTF-8) → Blob → uploadBlob

### Transport Modes

- **stdio** (default): For direct integration with MCP clients like Claude Desktop
- **HTTP**: For debugging, testing, and HTTP-based clients (runs on port 3000)

## TypeScript Rules

- **Strict mode enabled**: All strict TypeScript options are ON
- **NO `any` type**: Use proper types or `unknown` with type guards
- **Use `type` instead of `interface`**: Only use `interface` when extending external library types (document reason in comments)
- **NO barrel imports/exports**: Import directly from source files
- **Functional array operations**: Prefer `map`, `filter`, `reduce` over imperative loops

## ESLint Configuration

The project uses strict TypeScript ESLint rules:
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-unsafe-*`: All unsafe operations are errors
- `@typescript-eslint/consistent-type-definitions`: Enforces `type` over `interface`
- Unused variables must be prefixed with `_`

## Environment Variables

Required for Gemini RAG functionality:
- `GOOGLE_API_KEY`: Google API key with Gemini API access
- `STORE_DISPLAY_NAME`: Display name for vector store/knowledge base

Optional:
- `GEMINI_MODEL`: Gemini model to use for queries (default: gemini-2.5-pro)
- `LOG_LEVEL`: error|warn|info|debug (default: info)
- `DEBUG`: Enable debug console output (default: false)
- `PORT`: HTTP server port (default: 3000)

## Error Handling Strategy

All tools inherit automatic error handling from `BaseTool`:
- Errors are caught and logged without sensitive information
- Error messages are returned to AI clients for appropriate action
- Response includes `isError: true` flag for error states
- Never expose sensitive information in error responses

## Logging

- Winston-based logging to `logs/mcp-server-{timestamp}.log`
- Console output enabled only for HTTP transport
- Log levels: error, warn, info, debug
- stdio transport disables console logging to avoid protocol interference

## Dependencies

Key dependencies:
- `@google/genai`: Google Generative AI SDK for Gemini API
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `zod`: Runtime type validation and schema definition
- `winston`: Logging
- `commander`: CLI argument parsing
- `express`: HTTP server (for HTTP transport)

## Package Manager

This project uses **pnpm** (version 10.19.0) as specified in `package.json`.
