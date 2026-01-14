# Yao MCP Tools Reference

## Overview

MCP (Model Context Protocol) provides a standardized way for agents to interact with external tools, resources, and prompts. Tools are called by the LLM during agent execution.

## Tool Name Format

MCP tool names use a double-underscore separator:

```
{server_id}__{tool_name}
```

- Dots in `server_id` are replaced with single underscores
- Examples:
  - `echo__ping` → server: `echo`, tool: `ping`
  - `github_enterprise__search` → server: `github.enterprise`, tool: `search`

**Naming constraint**: MCP server*id MUST NOT contain underscores (`*`). Only dots (`.`), letters, numbers, and hyphens (`-`) are allowed.

## Configuring MCP Servers

### In Assistant Configuration (package.yao)

```json
{
  "mcp_servers": {
    "servers": [
      "agents.expense.tools",
      { "server_id": "server", "tools": ["tool1", "tool2"] },
      {
        "server_id": "server",
        "tools": ["specificTool"],
        "resources": ["resource://data"]
      }
    ]
  }
}
```

### In Create Hook

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  return {
    messages,
    mcp_servers: [
      { server_id: 'agents.expense.tools', tools: ['recognize'] },
      { server_id: 'search.engine' } // All tools，没有配置tools，会使有server_id下所有的tool。
    ]
  };
}
```

## MCP Server Configuration

| Field       | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| `server_id` | string   | MCP server ID (required)          |
| `tools`     | string[] | Tool name filter (empty = all)    |
| `resources` | string[] | Resource URI filter (empty = all) |

## Implementing MCP Tools

创建一个mcp 工具。

### Tool Script (src/tools.ts)

创建工具脚本

```typescript
// @ts-nocheck

/**
 * Tool function - Called by LLM via MCP
 * Function name becomes tool name
 * @param params Tool parameters (from LLM)
 * @param ctx Agent context
 */
export function Recognize(params: any, ctx: agent.Context) {
  console.log('Recognize called with:', params);
  console.log('User:', ctx.authorized?.user_id);

  // Process and return result
  return {
    intent: 'analysis',
    confidence: 0.95,
    data: params
  };
}

export function Query(params: { query: string }, ctx: agent.Context) {
  // Access database
  const records = Process('models.agents.expense.voucher.Get', {
    wheres: [{ column: 'user_id', value: ctx.authorized?.user_id }],
    limit: 10
  });

  return { results: records };
}
```

### Tool Declaration (tools/tools.yao)

```json
{
  "tools": [
    {
      "name": "Recognize",
      "description": "Recognize expense intent from user input",
      "parameters": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "User input text to analyze"
          },
          "attachments": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Attachment URLs"
          }
        },
        "required": ["text"]
      }
    },
    {
      "name": "Query",
      "description": "Query expense records",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

## Tool Execution Flow

1. LLM decides to call a tool based on conversation
2. Agent parses tool name: `server_id__tool_name`
3. Agent validates arguments against tool schema
4. Tool function is called with `(params, ctx)`
5. Result is returned to LLM for further processing

## Tool Call Results in Next Hook

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools } = payload;

  if (tools && tools.length > 0) {
    for (const tool of tools) {
      console.log('Tool:', tool.tool);
      console.log('Server:', tool.server);
      console.log('Arguments:', tool.arguments);
      console.log('Result:', tool.result);
      console.log('Error:', tool.error);

      // Route based on tool result
      if (tool.result?.intent === 'query') {
        return {
          delegate: { agent_id: 'query_agent', messages: payload.messages }
        };
      }
    }
  }

  return null;
}
```

## Tool Call Response Structure

```typescript
interface ToolCallResponse {
  toolcall_id: string; // Tool call ID from LLM
  server: string; // MCP server name
  tool: string; // Tool name
  arguments?: any; // Arguments passed to tool
  result?: any; // Execution result
  error?: string; // Error if failed
}
```

## Error Handling

### Retryable Errors (LLM can fix)

- Invalid/missing parameters
- Validation failures
- Type mismatches
- Schema violations

### Non-Retryable Errors

- Network errors
- Timeout
- Authentication failures
- Service unavailable

```typescript
export function MyTool(params: any, ctx: agent.Context) {
  // Validate required params
  if (!params.required_field) {
    throw new Error('Missing required field: required_field');
    // LLM will retry with correct parameters
  }

  try {
    const result = externalApiCall(params);
    return result;
  } catch (e) {
    // Log error for debugging
    console.error('Tool error:', e);
    throw e;
  }
}
```

## MCP API in Context

Access MCP operations directly from context:

```typescript
// List tools
const tools = ctx.mcp.ListTools('server_id');

// Call single tool
const result = ctx.mcp.CallTool('server_id', 'tool_name', { arg: 'value' });

// Call multiple tools in parallel
const results = ctx.mcp.CallToolsParallel('server_id', [
  { name: 'tool1', arguments: { a: 1 } },
  { name: 'tool2', arguments: { b: 2 } }
]);

// List resources
const resources = ctx.mcp.ListResources('server_id');

// Read resource
const data = ctx.mcp.ReadResource('server_id', 'resource://uri');
```

## Best Practices

1. **Clear descriptions** - Help LLM understand when to use each tool
2. **Validate inputs** - Check required parameters early
3. **Return structured data** - Use consistent response formats
4. **Handle errors gracefully** - Distinguish retryable vs non-retryable
5. **Log for debugging** - Use `console.log` for tool execution tracing
6. **Access context** - Use `ctx.authorized` for user-specific operations

## See Also

- [Agent Context API](./agent-context-api.md)
- [Hooks Reference](./hooks-reference.md)
- [Assistant Structure](./assistant-structure.md)
