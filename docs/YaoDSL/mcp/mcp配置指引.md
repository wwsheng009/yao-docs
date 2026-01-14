---
name: mcp配置指引
description: Guide to defining Yao MCP servers, mapping Yao Processes to MCP tools and resources.
license: Complete terms in LICENSE.txt
---

# Yao MCP Servers

This directory contains MCP (Model Context Protocol) server definitions that expose Yao Processes as MCP tools.

## Overview

Yao MCP servers provide a bridge between the MCP protocol and Yao's process system, allowing AI assistants (like Claude) to interact with Yao applications through standardized tool interfaces.

## Architecture

```
MCP Client (AI Assistant)
    ↓ (MCP Protocol)
MCP Server Definition (*.mcp.yao)
    ↓ (Process Mapping)
Yao Process
    ├── Built-in Processes (models.*, flows.*, etc.)
    └── Custom Processes
        ├── TypeScript/JavaScript (scripts.*)
        └── Plugins (plugins.*)
```

**Key Concept**: MCP tools and resources map directly to Yao Processes. Any Yao process can be exposed, including:

- Built-in processes (`models.user.Find`, `flows.data.Process`, etc.)
- Custom TypeScript/JavaScript processes (`scripts.myapp.MyFunction`)
- Plugin processes (`plugins.vision.Analyze`)
- Any other registered Yao process

## MCP Server Configuration

Yao exposes processes as MCP tools and resources using the **Process Transport**.

```json
{
  "transport": "process",
  "endpoint": "/customer", // Optional: Exposes as /v1/mcps/customer for external MCP clients (HTTP/SSE)
  "capabilities": {
    "tools": { "listChanged": false },
    "resources": { "subscribe": true, "listChanged": false }
  },
  "tools": {
    "create_customer": "models.customer.Create",
    "update_customer": "models.customer.Update"
  },
  "resources": {
    "detail": "models.customer.Find", // customers://{id}
    "list": "models.customer.Paginate" // customers://list?params
  }
}
```

**Examples**: `echo.mcp.yao`, `dsl.mcp.yao`, `customer.mcp.yao`

**Configuration Options**:

- `transport`: Must be `"process"` for Yao MCP servers
- `label`: Human-readable name for the MCP server
- `description`: Description of what the server provides
- `endpoint` (optional): Exposes the server at `/v1/mcps/{endpoint}` for external MCP clients
  - Supports HTTP and SSE transport protocols
  - Example: `"endpoint": "/customer"` → accessible at `/v1/mcps/customer`
  - If not provided, the server is only accessible within Yao application
- `capabilities` (optional): Declare server capabilities
  - `tools`: Tool-related capabilities
  - `resources`: Resource-related capabilities (subscribe, listChanged)
- `tools`: Map of MCP tool names to Yao process names (for operations)
  - Can map to any Yao process: built-in, custom, or plugin processes
- `resources`: Map of MCP resource names to Yao process names (for read-only data access)
  - Resources are read-only but can accept parameters via URI query strings

## File Structure

需要注意的是：mcp有两种作用范围，一种是全局的mcp定义，放在应用的根目录`/mcps`下，另外一种是针对某一个assistant的mcp定义，放在assistants目录`/assistants/assistant_id/mcps`下。mcp

```
mcps/
├── README.md                    # This file
├── echo.mcp.yao                # Simple test MCP server
├── dsl.mcp.yao                 # DSL operations MCP server
├── customer.mcp.yao            # Customer management MCP server
└── mapping/                    # MCP mappings (renamed from tools)
    ├── echo/
    │   ├── schemes/            # Tools: Input/output schemas
    │   │   ├── ping.in.yao     # Input schema (required)
    │   │   ├── ping.out.yao    # Output schema (optional)
    │   │   └── ping.jsonl      # Sample data (optional)
    │   └── prompts/            # Prompts (optional)
    │       └── test_connection.pmt.yao
    ├── dsl/
    │   ├── schemes/            # Tools
    │   │   ├── validate_model.in.yao
    │   │   ├── validate_model.out.yao
    │   │   └── validate_model.jsonl
    │   └── prompts/
    │       ├── create_model.pmt.yao
    │       └── review_api.pmt.yao
    └── customer/
        ├── schemes/            # Tools: Create/Update operations
        │   ├── create_customer.in.yao
        │   ├── create_customer.out.yao
        │   ├── create_customer.jsonl
        │   ├── update_customer.in.yao
        │   ├── update_customer.out.yao
        │   └── update_customer.jsonl
        ├── resources/          # Resources: Read-only data access
        │   ├── detail.res.yao  # Single customer (customers://{id})
        │   ├── detail.jsonl
        │   ├── list.res.yao    # Customer list (customers://list)
        │   └── list.jsonl
        └── prompts/
            └── manage_customer.pmt.yao
```

## Creating an MCP Server

### Step 1: Define the MCP Server

Create a `*.mcp.yao` file:

```json
{
  "label": "My MCP Server",
  "description": "Description of what this server does",
  "transport": "process",
  "endpoint": "/my-server",
  "capabilities": {
    "tools": { "listChanged": false }
  },
  "tools": {
    "my_tool": "scripts.myserver.MyTool"
  }
}
```

### Step 2: Create Tool Schemas

Create schemas in `mapping/{server_name}/schemes/`:

**`my_tool.in.yao`** (Required - Input Schema):

```json
{
  "type": "object",
  "description": "Tool description",
  "properties": {
    "param1": {
      "type": "string",
      "description": "Parameter description"
    }
  },
  "required": ["param1"]
}
```

**`my_tool.out.yao`** (Optional - Output Schema):

```json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "Result description"
    }
  }
}
```

**`my_tool.jsonl`** (Optional - Sample Data):

```jsonl
{"name":"example1","description":"First example","input":{"param1":"value1"},"output":{"result":"output1"}}
{"name":"example2","description":"Second example","input":{"param1":"value2"},"output":{"result":"output2"}}
```

### Step 3: Implement the Process

You have several options:

#### Option A: Use Built-in Yao Processes

Map directly to existing Yao processes:

```json
{
  "tools": {
    "find_user": "models.user.Find",
    "create_pet": "models.pet.Create",
    "process_data": "flows.data.Transform"
  }
}
```

No additional implementation needed!

#### Option B: Create Custom TypeScript Processes

Create TypeScript types in `scripts/myserver.d.ts`:

```typescript
export declare type MyToolInput = {
  param1: string;
};

export declare type MyToolOutput = {
  result: string;
};
```

Implement in `scripts/myserver.ts`:

```typescript
import type { MyToolInput, MyToolOutput } from './myserver.d';

function MyTool(ctx: mcp.Context, input: MyToolInput): MyToolOutput {
  // Implementation
  return {
    result: `Processed: ${input.param1}`
  };
}
```

#### Option C: Use Plugin Processes

Map to processes from Yao plugins:

```json
{
  "tools": {
    "analyze_image": "plugins.vision.Analyze",
    "generate_pdf": "plugins.pdf.Generate"
  }
}
```

## Convention-Based Loading

MCP servers automatically scan and load:

### Tools

- Scans `mapping/{server_name}/schemes/*.in.yao`
- Tool name = filename (without `.in.yao`)
- Maps to process defined in `*.mcp.yao`

### Resources

- Scans `mapping/{server_name}/resources/*.res.yao`
- Resource name = filename (without `.res.yao`)
- Maps to process defined in `*.mcp.yao`
- Resources are read-only but can accept parameters via URI query strings

### Prompts (Optional)

- Scans `mapping/{server_name}/prompts/*.pmt.yao`
- Prompt name = filename (without `.pmt.yao`)
- Automatically exposed via MCP's `ListPrompts`
- If no prompts directory exists, server will have no prompts

### Samples

- Loads `mapping/{server_name}/schemes/*.jsonl` for tools
- Loads `mapping/{server_name}/resources/*.jsonl` for resources
- Provides examples for AI assistants
- Format: one JSON object per line (JSONL)

## File Naming Conventions

| Extension  | Purpose                          | Required            | Location     | Example                |
| ---------- | -------------------------------- | ------------------- | ------------ | ---------------------- |
| `.in.yao`  | Tool input schema (JSON Schema)  | ✅ If has tools     | `schemes/`   | `ping.in.yao`          |
| `.out.yao` | Tool output schema (optional)    | ⭕ No               | `schemes/`   | `ping.out.yao`         |
| `.res.yao` | Resource schema with URI pattern | ✅ If has resources | `resources/` | `detail.res.yao`       |
| `.jsonl`   | Sample data (JSONL format)       | ⭕ No               | Both         | `ping.jsonl`           |
| `.pmt.yao` | Prompt template                  | ⭕ No               | `prompts/`   | `create_model.pmt.yao` |

**Note**: An MCP server can have:

- **Only tools** (e.g., `echo.mcp.yao` - no resources)
- **Only resources** (e.g., a read-only data server)
- **Both tools and resources** (e.g., `customer.mcp.yao` - full CRUD)
- At least one of tools or resources must be present

## Example Servers

### Echo Server (`echo.mcp.yao`)

Simple testing server with basic tools:

**Tools**:

- `ping` - Echo with count and timestamp
- `status` - System status report

### DSL Server (`dsl.mcp.yao`)

Yao DSL operations:

**Tools**:

- `validate_model` - Validate Yao Model DSL
- `format_flow` - Format Yao Flow DSL
- `analyze_api` - Analyze Yao API DSL

### Customer Server (`customer.mcp.yao`)

Customer management with full CRUD operations:

**Tools** (Operations):

- `create_customer` - Create a new customer
- `update_customer` - Update existing customer

**Resources** (Read-only):

- `detail` - Get customer by ID (`customers://{id}`)
- `list` - Get customer list with parameters (`customers://list?page=1&pagesize=10&where={...}`)

## Environment Variables

You can use environment variables in MCP definitions:

```json
{
  "url": "$ENV.MCP_SERVER_URL",
  "authorization_token": "$ENV.MCP_TOKEN",
  "env": {
    "API_KEY": "$ENV.MY_API_KEY"
  }
}
```

## Testing

To test an MCP server:

1. Start your Yao application
2. Connect an MCP client (e.g., Claude Desktop)
3. Use the tools exposed by the server

## Best Practices

1. **Reuse Existing Processes**: Leverage built-in Yao processes (`models.*`, `flows.*`) when possible
2. **Tools vs Resources**: Use tools for operations (create, update, delete) and resources for read-only data access
3. **Resource URIs**: Use consistent URI patterns (e.g., `customers://{id}`, `customers://list`)
4. **Clear Descriptions**: Provide detailed descriptions for tools, resources, and parameters in schemas
5. **Type Safety**: Define TypeScript types for custom processes
6. **Sample Data**: Include `.jsonl` files with realistic examples to help AI understand usage
7. **Error Handling**: Handle errors gracefully in your process implementations
8. **Documentation**: Add comments to explain complex tools and parameters
9. **Naming Consistency**: Use clear, descriptive names that match the process functionality
10. **Resource Parameters**: Define parameters in `.res.yao` for filterable/paginated resources

## Learn More

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Yao Process Documentation](https://yaoapps.com/docs)
- [JSON Schema Reference](https://json-schema.org/)
