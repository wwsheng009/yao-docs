# Yao Agent Context API Reference

## Overview

The Context JavaScript API provides a comprehensive interface for interacting with the Yao Agent system from JavaScript/TypeScript hooks (Create, Next). The Context object exposes agent state, configuration, messaging capabilities, trace operations, MCP (Model Context Protocol), and Search integrations.

## Context Object

The Context object is automatically passed to hook functions and provides access to the agent's execution environment.

### Basic Properties

```typescript
interface Context {
  // Identifiers
  chat_id: string; // Current chat session ID
  assistant_id: string; // Assistant identifier

  // Configuration
  locale: string; // User locale (e.g., "en", "zh-cn")
  theme: string; // UI theme preference
  accept: string; // Output format ("standard", "cui-web", "cui-native", etc.)
  route: string; // Request route path
  referer: string; // Request referer

  // Client Information
  client: {
    type: string; // Client type
    user_agent: string; // User agent string
    ip: string; // Client IP address
  };

  // Dynamic Data
  metadata: Record<string, any>; // Custom metadata
  authorized: Record<string, any>; // Authorization data (user_id, team_id, etc.)

  // Objects
  memory: Memory; // Agent memory with four namespaces
  trace: Trace; // Trace object for debugging and monitoring
  mcp: MCP; // MCP object for external tool/resource access
  search: Search; // Search object for KB/DB/Web search
}
```

### Authorized Object

The `ctx.authorized` object contains authentication and authorization information:

```typescript
interface Authorized {
  // Identity
  user_id?: string; // User ID
  team_id?: string; // Team ID (if team login)
  tenant_id?: string; // Tenant ID (multi-tenancy)
  client_id?: string; // OAuth client ID
  session_id?: string; // Session ID

  // Data Access Constraints (set by ACL)
  constraints?: DataConstraints;
}

interface DataConstraints {
  owner_only?: boolean; // Only access owner's data
  creator_only?: boolean; // Only access creator's data
  editor_only?: boolean; // Only access editor's data
  team_only?: boolean; // Only access team's data
  extra?: Record<string, any>; // Custom constraints
}
```

**Usage Examples:**

```javascript
// Get owner ID (team takes priority)
function getOwnerID(ctx) {
  const authorized = ctx.authorized;
  if (!authorized) return null;
  return authorized.team_id || authorized.user_id;
}

// Check if team context
function isTeamContext(ctx) {
  return !!ctx.authorized?.team_id;
}

// Apply permission filter based on constraints
function applyPermissionFilter(ctx) {
  const authorized = ctx.authorized;
  const constraints = authorized?.constraints || {};
  const wheres = [];

  if (constraints.owner_only || constraints.creator_only) {
    wheres.push({ column: '__yao_created_by', value: authorized.user_id });
  }

  if (constraints.team_only && authorized.team_id) {
    wheres.push({ column: '__yao_team_id', value: authorized.team_id });
  }

  return wheres;
}
```

### Permission Columns

When querying models with `permission: true` option, use these columns for access control:

| Column             | Description                    | Use Case                |
| ------------------ | ------------------------------ | ----------------------- |
| `__yao_created_by` | User ID who created the record | Owner/Creator filtering |
| `__yao_updated_by` | User ID who last updated       | Editor filtering        |
| `__yao_team_id`    | Team ID                        | Team-based access       |
| `__yao_tenant_id`  | Tenant ID                      | Multi-tenancy           |

**Creating Records with Permission:**

```javascript
function createRecord(ctx, data) {
  const authorized = ctx.authorized;
  return Process('models.agents.expense.voucher.Create', {
    ...data,
    __yao_created_by: authorized.user_id,
    __yao_updated_by: authorized.user_id,
    __yao_team_id: authorized.team_id || null,
    __yao_tenant_id: authorized.tenant_id || null
  });
}
```

**Querying with Permission Filter:**

```javascript
function getRecords(ctx) {
  const authorized = ctx.authorized;
  const constraints = authorized?.constraints || {};

  const wheres = [];

  // Team-based access: user's own records OR team records
  if (constraints.team_only && authorized.team_id) {
    wheres.push({
      wheres: [
        { column: '__yao_created_by', value: authorized.user_id },
        {
          column: '__yao_team_id',
          value: authorized.team_id,
          method: 'orwhere'
        }
      ]
    });
  }
  // Owner-only access
  else if (constraints.owner_only) {
    wheres.push({ column: '__yao_created_by', value: authorized.user_id });
  }

  return Process('models.agents.expense.voucher.Get', {
    select: ['id', 'title', 'amount'],
    wheres: wheres
  });
}
```

---

## Messaging Methods

The Context provides methods for sending messages to the client:

| Method                               | Description                 | Auto `message_end` | Updatable |
| ------------------------------------ | --------------------------- | ------------------ | --------- |
| `Send(message, block_id?)`           | Send a complete message     | ✅ Yes             | ❌ No     |
| `SendStream(message, block_id?)`     | Start a streaming message   | ❌ No              | ✅ Yes    |
| `Append(message_id, content, path?)` | Append content to a message | -                  | -         |
| `Replace(message_id, message)`       | Replace message content     | -                  | -         |
| `Merge(message_id, data, path?)`     | Merge data into message     | -                  | -         |
| `Set(message_id, data, path)`        | Set a field in message      | -                  | -         |
| `End(message_id, final_content?)`    | Finalize streaming message  | ✅ Yes             | -         |
| `EndBlock(block_id)`                 | End a message block         | -                  | -         |

### ID Generators

| Method        | Returns | Description                |
| ------------- | ------- | -------------------------- |
| `MessageID()` | string  | Generate unique message ID |
| `BlockID()`   | string  | Generate unique block ID   |
| `ThreadID()`  | string  | Generate unique thread ID  |

### Send Examples

```javascript
// Send complete message
ctx.Send({ type: 'text', props: { content: 'Hello!' } });

// Send with block grouping
const block_id = ctx.BlockID();
ctx.Send('Step 1', block_id);
ctx.Send('Step 2', block_id);

// Streaming message
const msg_id = ctx.SendStream('Processing...');
ctx.Append(msg_id, ' done!');
ctx.End(msg_id);

// Replace message content
const loading_id = ctx.SendStream({
  type: 'loading',
  props: { message: 'Loading...' }
});
ctx.Replace(loading_id, { type: 'text', props: { content: 'Complete!' } });
ctx.End(loading_id);
```

---

## Memory API

The `ctx.memory` object provides a four-level hierarchical memory system.

### Memory Namespaces

| Namespace            | Scope               | Persistence | Use Case                   |
| -------------------- | ------------------- | ----------- | -------------------------- |
| `ctx.memory.user`    | Per user            | Persistent  | User preferences, settings |
| `ctx.memory.team`    | Per team            | Persistent  | Team-wide configurations   |
| `ctx.memory.chat`    | Per chat session    | Persistent  | Conversation state         |
| `ctx.memory.context` | Per request context | Temporary   | Request-scoped data        |

### Memory Methods

```typescript
interface MemoryNamespace {
  // Basic KV operations
  Get(key: string): any;
  Set(key: string, value: any, ttl?: number): void;
  Del(key: string): void; // Supports wildcards: "prefix:*"
  Has(key: string): boolean;
  GetDel(key: string): any;

  // Collection operations
  Keys(): string[];
  Len(): number;
  Clear(): void;

  // Atomic counter operations
  Incr(key: string, delta?: number): number;
  Decr(key: string, delta?: number): number;

  // List operations
  Push(key: string, values: any[]): number;
  Pop(key: string): any;
  Pull(key: string, count: number): any[];
  PullAll(key: string): any[];
  AddToSet(key: string, values: any[]): number;

  // Array access
  ArrayLen(key: string): number;
  ArrayGet(key: string, index: number): any;
  ArraySet(key: string, index: number, value: any): void;
  ArraySlice(key: string, start: number, end: number): any[];
  ArrayPage(key: string, page: number, size: number): any[];
  ArrayAll(key: string): any[];
}
```

### Memory Examples

```javascript
// Pass data between Create and Next hooks
function Create(ctx, messages) {
  ctx.memory.context.Set('original_query', messages[0]?.content);
  ctx.memory.context.Set('request_time', Date.now());
  return { messages };
}

function Next(ctx, payload) {
  const query = ctx.memory.context.Get('original_query');
  const duration = Date.now() - ctx.memory.context.Get('request_time');
  console.log(`Query: ${query}, Duration: ${duration}ms`);
}

// User preferences (persistent)
ctx.memory.user.Set('theme', 'dark');
const theme = ctx.memory.user.Get('theme');

// Rate limiting with counters
const count = ctx.memory.user.Incr('api_calls_today');
if (count > 100) throw new Error('Rate limit exceeded');
```

---

## Trace API

The `ctx.trace` object provides tracing capabilities for user transparency and debugging.

### Trace Methods

| Method                    | Description                     |
| ------------------------- | ------------------------------- |
| `Add(input, option)`      | Create a sequential trace node  |
| `Parallel(inputs)`        | Create parallel trace nodes     |
| `Info(message)`           | Add info log to current node    |
| `Debug(message)`          | Add debug log to current node   |
| `Warn(message)`           | Add warning log to current node |
| `Error(message)`          | Add error log to current node   |
| `SetOutput(output)`       | Set output for current node     |
| `SetMetadata(key, value)` | Set metadata for current node   |
| `Complete(output?)`       | Mark current node as completed  |
| `Fail(error)`             | Mark current node as failed     |
| `CreateSpace(option)`     | Create a visual space container |

### Trace Node Options

```typescript
interface TraceNodeOption {
  label: string; // Display label in UI
  type?: string; // Node type identifier
  icon?: string; // Icon identifier
  description?: string; // Node description
  metadata?: Record<string, any>;
}
```

### Trace Examples

```javascript
// Create trace node
const node = ctx.trace.Add(
  { query: 'search term' },
  { label: 'Search', type: 'search', icon: 'search' }
);

// Add logs
node.Info('Starting search');
node.Debug('Query validated');

// Complete with output
node.Complete({ results: 10 });

// Parallel operations
const nodes = ctx.trace.Parallel([
  { input: { url: 'api1' }, option: { label: 'API 1' } },
  { input: { url: 'api2' }, option: { label: 'API 2' } }
]);
```

---

## MCP API

The `ctx.mcp` object provides access to Model Context Protocol operations for interacting with external tools, resources, and prompts.

### MCP Methods

| Method                               | Description                      |
| ------------------------------------ | -------------------------------- |
| `ListResources(client, cursor?)`     | List available resources         |
| `ReadResource(client, uri)`          | Read a specific resource         |
| `ListTools(client, cursor?)`         | List available tools             |
| `CallTool(client, name, args?)`      | Call a single tool               |
| `CallTools(client, tools)`           | Call multiple tools sequentially |
| `CallToolsParallel(client, tools)`   | Call multiple tools in parallel  |
| `ListPrompts(client, cursor?)`       | List available prompts           |
| `GetPrompt(client, name, args?)`     | Get a specific prompt            |
| `ListSamples(client, type, name)`    | List samples for a tool/resource |
| `GetSample(client, type, name, idx)` | Get a specific sample by index   |

### MCP Tool Operations

```javascript
// List available tools
const tools = ctx.mcp.ListTools('echo', '');
console.log(tools.tools);

// Call a single tool
const result = ctx.mcp.CallTool('echo', 'ping', { count: 3 });
console.log(result.content);

// Call multiple tools sequentially
const results = ctx.mcp.CallTools('echo', [
  { name: 'ping', arguments: { count: 1 } },
  { name: 'status', arguments: { verbose: true } }
]);

// Call multiple tools in parallel
const parallelResults = ctx.mcp.CallToolsParallel('echo', [
  { name: 'ping', arguments: { count: 1 } },
  { name: 'status', arguments: { verbose: false } }
]);
```

### MCP Resource Operations

```javascript
// List resources
const resources = ctx.mcp.ListResources('echo', '');

// Read a resource
const info = ctx.mcp.ReadResource('echo', 'echo://info');
console.log(info.contents);
```

### MCP Prompt Operations

```javascript
// List prompts
const prompts = ctx.mcp.ListPrompts('echo', '');

// Get a prompt with arguments
const prompt = ctx.mcp.GetPrompt('echo', 'test_connection', {
  detailed: 'true'
});
console.log(prompt.messages);
```

---

## Search API

The agent system provides automatic search capabilities that can search the web, knowledge bases (KB), and databases.

### Search Configuration

Search is configured in `package.yao` under the `uses` field:

```yaml
uses:
  search: '<agent>' # or "disabled", "mcp:server_id"
  web: '<provider>' # or "mcp:server_id"
  keyword: 'builtin' # or "<agent>", "mcp:server_id"
  querydsl: '<agent>' # or "mcp:server_id"
  rerank: '<agent>' # or "mcp:server_id"
```

### Search Flow

1. **Intent Detection**: The system detects if the user query requires search
2. **Keyword Extraction**: Keywords are extracted from the query
3. **Parallel Search**: Web, KB, and DB are searched in parallel (based on authorization)
4. **Result Reranking**: Results are reranked for relevance
5. **Context Injection**: Search results are injected into the LLM context

### Search in Hooks

In the `Next` hook, you can access search results from the payload:

```javascript
function Next(ctx, payload) {
  const { completion, tools } = payload;

  // Search results may be in tool results if search was triggered
  if (tools) {
    const searchResults = tools.filter((t) => t.tool === 'search');
    // Process search results...
  }
}
```

### Manual Search Control

Control search behavior in the Create hook:

```javascript
function Create(ctx, messages) {
  // Disable search for this request
  return {
    messages,
    uses: {
      search: 'disabled'
    }
  };
}
```

---

## Hooks Reference

### Create Hook

Called at the beginning of agent execution, before any LLM call.

```typescript
function Create(
  ctx: Context,
  messages: Message[],
  options?: Record<string, any>
): HookCreateResponse | null;
```

**Return Value:**

```typescript
interface HookCreateResponse {
  messages?: Message[];
  temperature?: number;
  max_tokens?: number;
  mcp_servers?: MCPServerConfig[];
  prompt_preset?: string;
  connector?: string;
  locale?: string;
  uses?: UsesConfig;
  force_uses?: boolean;
}
```

### Next Hook

Called after the LLM response and tool calls.

```typescript
function Next(
  ctx: Context,
  payload: NextHookPayload,
  options?: Record<string, any>
): NextHookResponse | null;
```

**Payload:**

```typescript
interface NextHookPayload {
  messages: Message[];
  completion?: CompletionResponse;
  tools?: ToolCallResponse[];
  error?: string;
}
```

**Return Value:**

```typescript
interface NextHookResponse {
  delegate?: {
    agent_id: string;
    messages: Message[];
    options?: Record<string, any>;
  };
  data?: any;
  metadata?: Record<string, any>;
}
```

---

## Complete Example

```javascript
/**
 * Create Hook - Preprocess messages and configure the request
 */
function Create(ctx, messages) {
  const user_query = messages[messages.length - 1]?.content || '';

  // Store data for Next hook
  ctx.memory.context.Set('original_query', user_query);
  ctx.memory.context.Set('request_time', Date.now());

  // Add trace node
  const node = ctx.trace.Add(
    { query: user_query },
    { label: 'Create Hook', type: 'preprocessing', icon: 'play' }
  );

  // Check if search is needed
  if (user_query.includes('search') || user_query.includes('find')) {
    node.Info('Search mode enabled');
    return {
      messages,
      mcp_servers: [{ server_id: 'search_engine' }],
      prompt_preset: 'search.assistant'
    };
  }

  node.Complete({ mode: 'standard' });
  return { messages, temperature: 0.7 };
}

/**
 * Next Hook - Process LLM response
 */
function Next(ctx, payload) {
  const { completion, tools, error } = payload;

  // Retrieve data from Create hook
  const duration = Date.now() - ctx.memory.context.Get('request_time');

  // Handle errors
  if (error) {
    return { data: { status: 'error', message: error } };
  }

  // Process tool results
  if (tools && tools.length > 0) {
    const msg_id = ctx.SendStream('## Results\n\n');
    tools.forEach((t, i) => {
      ctx.Append(
        msg_id,
        `**${i + 1}. ${t.tool}**: ${JSON.stringify(t.result)}\n`
      );
    });
    ctx.End(msg_id);

    return { data: { status: 'success', duration_ms: duration } };
  }

  // Return null for standard LLM response
  return null;
}
```

---

## Best Practices

1. **Error Handling**: Always wrap Context operations in try-catch blocks
2. **Resource Cleanup**: Only call `ctx.Release()` for manually created Context, not in hooks
3. **Memory Usage**: Use `ctx.memory.context` for request-scoped data, `ctx.memory.chat` for chat state
4. **Streaming Messages**: Use `SendStream()` + `Append()` + `End()` for streaming; `Send()` for complete messages
5. **Trace Organization**: Create meaningful trace nodes with descriptive labels
6. **MCP Efficiency**: Use `CallToolsParallel` for independent tool calls

---

## See Also

- [Hooks Reference](./hooks-reference.md) - Detailed hook documentation
- [MCP Tools](./mcp-tools.md) - MCP tool implementation
- [Search API](./search-api.md) - Search configuration and flow
- [Process API](./process-api.md) - Model queries and CRUD operations
