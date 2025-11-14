# Gemini RAG MCP Server

A Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities using Google's Gemini API File Search feature. This server enables AI applications to create knowledge bases and retrieve information from uploaded documents.

## Features

- ✅ **File Search RAG**: Create and manage knowledge bases using Gemini's File Search API
- ✅ **Document Upload**: Upload documents to create searchable knowledge bases
- ✅ **Information Retrieval**: Query knowledge bases to retrieve relevant information
- ✅ **MCP Protocol**: Full compatibility with Model Context Protocol
- ✅ **Type-Safe**: Full TypeScript support with strict mode enabled
- ✅ **Dual Transport Support**: stdio (default) and HTTP transports
- ✅ **Production-Ready**: Logging, error handling, and configuration management

## Prerequisites

- Node.js >= 22.10.0
- pnpm >= 10.19.0
- Google API Key with Gemini API access

## Installation

### Using with Claude Desktop (Recommended)

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-rag-mcp": {
      "command": "npx",
      "args": ["-y", "@r_masseater/gemini-rag-mcp"],
      "env": {
        "GOOGLE_API_KEY": "your_google_api_key_here",
        "STORE_DISPLAY_NAME": "your_store_name"
      }
    }
  }
}
```

**Required Environment Variables:**
- `GOOGLE_API_KEY`: Your Google API key with Gemini API access
- `STORE_DISPLAY_NAME`: Display name for your vector store/knowledge base

After configuration, restart Claude Desktop to load the server.

## Development

### 1. Clone the repository

```bash
git clone https://github.com/masseater/gemini-rag-mcp.git
cd gemini-rag-mcp
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Run in development mode

```bash
# stdio transport (default)
pnpm run dev

# HTTP transport (with hot reload)
pnpm run dev:http
```

## Project Structure

```
mcp-server-template/
├── src/
│   ├── server/
│   │   ├── mcp-server.ts       # Main MCP server implementation
│   │   └── tool-registry.ts    # Tool registration and management
│   ├── tools/
│   │   ├── base/
│   │   │   ├── base-tool.ts    # Base class for all tools
│   │   │   └── raw-tool.ts     # Base class for tools with raw option
│   │   ├── implementations/
│   │   │   ├── echo-tool.ts    # Example: Echo tool
│   │   │   └── ping-tool.ts    # Example: Ping tool
│   │   └── base-tool.ts        # Tool utilities
│   ├── types/
│   │   └── index.ts            # Type definitions
│   ├── config/
│   │   └── index.ts            # Configuration management
│   ├── utils/
│   │   └── logger.ts           # Logging utilities
│   └── index.ts                # Entry point
├── dist/                       # Compiled output (generated)
├── logs/                       # Log files (generated)
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## Creating Your Own Tools

### Basic Tool Example

Create a new file in `src/tools/implementations/`:

```typescript
import { z } from "zod";
import { BaseTool } from "../base/base-tool.js";
import type { MCPToolResponse } from "../../types/index.js";

type MyToolArgs = {
  input: string;
};

export class MyTool extends BaseTool<MyToolArgs> {
  readonly name = "my_tool";
  readonly description = "Description of what my tool does";

  getInputSchema() {
    return z.object({
      input: z.string().describe("Input parameter description"),
    });
  }

  async execute(args: MyToolArgs): Promise<MCPToolResponse<YourDataType>> {
    // Your tool logic here
    const result = await someOperation(args.input);

    return {
      success: true,
      message: "Operation completed successfully",
      data: result,
    };
  }
}
```

### Register Your Tool

Add your tool to `src/server/tool-registry.ts`:

```typescript
import { MyTool } from "../tools/implementations/my-tool.js";

// Add to Tool type
type Tool = EchoTool | PingTool | MyTool;

// Add to tools array in initialize()
const tools: Tool[] = [
  new EchoTool(context),
  new PingTool(context),
  new MyTool(context), // Add your tool
];
```

## Available Scripts

```bash
# Development
pnpm run dev          # Start with stdio transport (hot reload)
pnpm run dev:http     # Start with HTTP transport (hot reload)

# Production
pnpm run build        # Build for production
pnpm run start:stdio  # Run built server with stdio
pnpm run start:http   # Run built server with HTTP

# Code Quality
pnpm run type-check   # Run TypeScript type checking
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint errors automatically

# Testing
pnpm run test         # Run tests once
pnpm run test:watch   # Run tests in watch mode
pnpm run test:coverage # Run tests with coverage

# Maintenance
pnpm run clean        # Remove dist directory
pnpm run knip         # Detect unused files/dependencies
pnpm run knip:fix     # Auto-fix knip issues
```

## Configuration

Configuration is managed through environment variables and can be extended in `src/config/index.ts`:

```typescript
export type ServerConfig = {
  server: {
    name: string;
    version: string;
  };
  mcp: {
    maxResponseSize: number;
    defaultPageSize: number;
  };
  logging: {
    level: string;
    enableDebugConsole: boolean;
  };
}
```

### Environment Variables

- `LOG_LEVEL`: Logging level (error|warn|info|debug, default: info)
- `DEBUG`: Enable debug console output (true|false, default: false)
- `PORT`: HTTP server port (default: 3000)

## Transport Modes

### stdio Transport (Default)

Used for direct integration with MCP clients like Claude Desktop:

```bash
pnpm run dev          # Development
pnpm run start:stdio  # Production
```

### HTTP Transport

Used for HTTP-based clients or debugging:

```bash
pnpm run dev:http     # Development (port 3000)
pnpm run start:http   # Production (port 3000)
```

Endpoints:
- `GET /health` - Health check endpoint
- `POST /mcp` - MCP Streamable HTTP endpoint

## Architecture

### Tool System

The template uses a **Template Method Pattern** for tools:

1. **BaseTool**: Abstract base class for all tools
   - Handles error catching and response formatting
   - Provides consistent tool definition interface

2. **RawTool**: Extended base for tools with `raw` option
   - Supports minimal vs full response modes
   - Automatically handles `raw` parameter extraction

### Error Handling

All tools automatically:
- Catch and log errors
- Return user-friendly error messages
- Set `isError: true` flag for error responses
- Never expose sensitive information

## Example Tools

### Echo Tool

Simple tool that echoes back the input message:

```bash
# Test with HTTP transport
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "Hello, MCP!"
      }
    }
  }'
```

### Ping Tool

Health check tool that returns server status:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "ping",
      "arguments": {}
    }
  }'
```

## Logging

Logs are written to:
- `logs/mcp-server-{timestamp}.log` (always)
- Console output (HTTP transport only)

Log levels: `error`, `warn`, `info`, `debug`

## Best Practices

1. **Tool Naming**: Use snake_case for tool names
2. **Descriptions**: Write clear, concise tool descriptions
3. **Input Validation**: Always use Zod schemas for input validation
4. **Error Messages**: Return user-friendly error messages
5. **Response Format**: Use `MCPToolResponse<T>` for consistent responses
6. **Context**: Add shared resources to `ToolContext` type

## Extending the Template

### Adding API Clients

1. Create client in `src/clients/`
2. Add to `ToolContext` type in `src/tools/base-tool.ts`
3. Initialize in `src/server/tool-registry.ts`
4. Use in your tools via `this.context`

### Adding Response Formatters

1. Create formatter in `src/formatters/`
2. Add to context or import directly in tools
3. Use RawTool base class for tools needing optimization

## Publishing to npm

This template includes GitHub Actions workflows for automated publishing to npm.

### Setup

1. **Create npm account and get access token**:
   - Go to https://www.npmjs.com/
   - Create an account or sign in
   - Generate an access token: Settings → Access Tokens → Generate New Token (Automation)

2. **Add npm token to GitHub secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm access token

3. **Update package.json**:
   ```json
   {
     "name": "your-package-name",
     "version": "0.1.0",
     "author": "Your Name",
     "repository": {
       "type": "git",
       "url": "https://github.com/yourusername/your-repo.git"
     }
   }
   ```

### Publishing a New Version

The template includes two GitHub Actions workflows:

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Automatically runs on every push and pull request:
- Runs linter (ESLint)
- Runs type checking
- Runs tests
- Runs knip (unused code detection)
- Builds the project

#### 2. Publish Workflow (`.github/workflows/publish.yml`)

Manual workflow for publishing to npm:

1. Go to your GitHub repository → Actions tab
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. Enter the version number (e.g., `1.0.1`, `1.1.0`, `2.0.0`)
5. Click "Run workflow"

The workflow will:
- ✅ Run all tests
- ✅ Run linter
- ✅ Run type check
- ✅ Update version in package.json
- ✅ Build the project
- ✅ Publish to npm
- ✅ Create git tag and commit
- ✅ Push tag to GitHub

### Manual Publishing (Alternative)

You can also publish manually:

```bash
# Login to npm
npm login

# Update version
npm version patch  # or minor, major

# Build
pnpm run build

# Publish
npm publish

# Push git tag
git push origin main --tags
```

### Version Guidelines

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes (backward compatible)

## Dependency Management

This template includes automated dependency management with Dependabot.

### Dependabot Configuration

The `.github/dependabot.yml` configuration:

1. **npm Dependencies** (Weekly updates on Mondays):
   - **All updates grouped into a single PR** (major, minor, patch)
   - Creates one consolidated PR per week for npm dependencies
   - Reduces PR noise while keeping dependencies up-to-date

2. **GitHub Actions** (Weekly updates on Mondays):
   - Keeps workflow actions up to date
   - Groups all action updates together

3. **Auto-merge** (Optional):
   - Minor and patch updates can auto-merge after CI passes
   - Major updates require manual review (with warning comment)
   - Configured via `.github/workflows/dependabot-auto-merge.yml`

### How It Works

1. **Automated PRs**: Dependabot creates PRs every Monday at 9:00 AM (Asia/Tokyo)
   - 1 PR for all npm dependencies (major + minor + patch)
   - 1 PR for GitHub Actions updates
2. **CI Validation**: All PRs run through CI workflow (lint, test, build)
3. **Auto-merge** (Optional):
   - Minor/patch updates merge automatically after CI passes
   - Major updates get a warning comment and require manual review
4. **Review Changes**: Check the PR diff and test results before merging major updates

### Customization

Edit `.github/dependabot.yml` to customize:

**Change update schedule:**

```yaml
schedule:
  interval: "weekly"  # Can be: daily, weekly, monthly
  day: "monday"       # Day of the week
  time: "09:00"       # Time of day
  timezone: "Asia/Tokyo"
```

**Update reviewers/assignees:**

```yaml
reviewers:
  - "your-github-username"
assignees:
  - "your-github-username"
```

**Separate major/minor/patch updates (if preferred):**

If you want major updates in separate PRs, modify the `groups` section:

```yaml
groups:
  dependencies:
    patterns:
      - "*"
    update-types:
      - "minor"
      - "patch"
  # Add another package-ecosystem entry for major updates
```

### Disable Auto-merge

If you prefer manual merging, delete `.github/workflows/dependabot-auto-merge.yml`:

```bash
rm .github/workflows/dependabot-auto-merge.yml
git add .github/workflows/dependabot-auto-merge.yml
git commit -m "chore: disable dependabot auto-merge"
git push
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod Documentation](https://zod.dev)

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/mcp-server-template/issues
- MCP Discord: https://discord.gg/modelcontextprotocol

---

**Built with ❤️ using TypeScript and the Model Context Protocol**
