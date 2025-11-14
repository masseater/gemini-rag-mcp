# Gemini RAG MCP Server

A Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities using Google's Gemini API File Search feature. This server enables AI applications to create knowledge bases and retrieve information from uploaded documents.

## Features

- ✅ **File Search RAG**: Create and manage knowledge bases using Gemini's File Search API
- ✅ **Document Upload**: Upload files and text content to create searchable knowledge bases
- ✅ **Information Retrieval**: Query knowledge bases to retrieve relevant information
- ✅ **Configurable Models**: Choose Gemini models via environment variable
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

**Optional Environment Variables:**
- `GEMINI_MODEL`: Gemini model to use for queries (default: `gemini-2.5-pro`)
  - Options: `gemini-2.5-pro`, `gemini-2.5-flash`

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

## Environment Variables

**Required:**
- `GOOGLE_API_KEY`: Google API key with Gemini API access
- `STORE_DISPLAY_NAME`: Display name for vector store/knowledge base

**Optional:**
- `GEMINI_MODEL`: Gemini model for queries (default: gemini-2.5-pro)
- `LOG_LEVEL`: Logging level (error|warn|info|debug, default: info)
- `DEBUG`: Enable debug console output (true|false, default: false)
- `PORT`: HTTP server port (default: 3000)

## Available Tools

Once configured with Claude Desktop, the following tools are available:

- **upload_file**: Upload document files to the knowledge base
- **upload_content**: Upload text content directly to the knowledge base
- **query_store**: Query the knowledge base using RAG

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

## License

MIT License
