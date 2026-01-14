# MCP JSAPI

JavaScript API for MCP (Model Context Protocol) clients in Yao.

## Quick Start

### Recommended: Using `Use()` for Automatic Resource Management

The `Use()` function automatically handles resource cleanup with a callback pattern:

```javascript
// Simple and clean - resources are automatically released
Use(MCP, 'client_id', (client) => {
  const tools = client.ListTools();
  const result = client.CallTool('tool_name', { arg: 'value' });
  return result;
});
// client.__release() is automatically called after the callback, even if an error occurs
```

### Alternative: Manual Resource Management

For cases where you need explicit control or complex control flow:

```javascript
const client = new MCP('client_id');
try {
  // Use the client...
  const result = client.CallTool('tool_name', { arg: 'value' });
  return result;
} finally {
  client.Release(); // Manually release resources
}
```

## Resource Management

MCP clients hold Go resources that must be released. Two approaches:

### ✅ Recommended: `Use()` Function

**Pros:**

- Automatic cleanup - no need to remember `Release()`
- Less boilerplate code
- Always releases resources, even on errors
- Cleaner, more readable code

**When to use:**

- Most cases
- When resource lifetime matches callback scope
- When you want guaranteed cleanup with minimal code

```javascript
Use(MCP, 'dsl', (client) => {
  // Use client here
  return client.CallTool('validate', { schema: data });
});
```

### Alternative: Manual `try-finally`

**Pros:**

- Explicit control over resource lifetime
- Suitable for complex control flow
- No callback nesting

**When to use:**

- Resource needs to be used across multiple scopes
- Complex error handling requirements
- Performance-critical code (minimal overhead difference)

```javascript
const client = new MCP('dsl');
try {
  // Use client
} finally {
  client.Release();
}
```

## API Reference

### Tool Operations

```javascript
// List available tools
Use(MCP, 'client_id', (client) => {
  const tools = client.ListTools();
  console.log(tools.tools); // Array of tool definitions
});

// Call a single tool
Use(MCP, 'client_id', (client) => {
  const result = client.CallTool('tool_name', {
    arg1: 'value1',
    arg2: 123
  });
  return result;
});

// Call multiple tools sequentially
Use(MCP, 'client_id', (client) => {
  const results = client.CallTools([
    { name: 'tool1', arguments: { foo: 'bar' } },
    { name: 'tool2', arguments: { baz: 42 } }
  ]);
  return results;
});

// Call multiple tools in parallel
Use(MCP, 'client_id', (client) => {
  const results = client.CallToolsParallel([
    { name: 'tool1', arguments: { foo: 'bar' } },
    { name: 'tool2', arguments: { baz: 42 } }
  ]);
  return results;
});
```

### Resource Operations

```javascript
// List available resources
Use(MCP, 'customer', (client) => {
  const resources = client.ListResources();
  return resources.resources;
});

// Read a resource by URI
Use(MCP, 'customer', (client) => {
  const content = client.ReadResource('customers://123');
  return content.contents;
});

// Subscribe to resource updates
Use(MCP, 'customer', (client) => {
  await client.SubscribeResource('customers://123');
  console.log('Subscribed to customer updates');
});

// Unsubscribe from resource updates
Use(MCP, 'customer', (client) => {
  await client.UnsubscribeResource('customers://123');
  console.log('Unsubscribed from customer updates');
});
```

### Prompt Operations

```javascript
// List available prompts
Use(MCP, 'client_id', (client) => {
  const prompts = client.ListPrompts();
  return prompts.prompts;
});

// Get a prompt template with arguments
Use(MCP, 'client_id', (client) => {
  const prompt = client.GetPrompt('prompt_name', {
    arg1: 'value1'
  });
  return prompt.messages;
});
```

### Sample Operations

```javascript
// List samples for a tool
Use(MCP, 'client_id', (client) => {
  const samples = client.ListSamples('tool', 'tool_name');
  return samples.samples;
});

// Get a specific sample by index
Use(MCP, 'client_id', (client) => {
  const sample = client.GetSample('tool', 'tool_name', 0);
  return { input: sample.input, output: sample.output };
});

// List samples for a resource
Use(MCP, 'client_id', (client) => {
  return client.ListSamples('resource', 'resource_name');
});
```

### Connection Operations

```javascript
// Connect to MCP server with options
Use(MCP, 'github', (client) => {
  await client.Connect({
    headers: { 'Authorization': 'Bearer token' },
    timeout: 5000,
    max_retries: 3,
    retry_delay: 1000
  });
});

// Initialize the MCP session
Use(MCP, 'github', (client) => {
  const initResult = await client.Initialize();
  console.log('Server capabilities:', initResult.capabilities);
});

// Mark the session as initialized
Use(MCP, 'github', (client) => {
  await client.Initialized();
});

// Disconnect from MCP server
Use(MCP, 'github', (client) => {
  await client.Disconnect();
  console.log('Disconnected');
});

// Check connection status
Use(MCP, 'github', (client) => {
  const connected = client.IsConnected();
  console.log('Connected:', connected);
});

// Get current connection state
Use(MCP, 'github', (client) => {
  const state = client.State();
  console.log('Current state:', state);
});

// Get client information
Use(MCP, 'github', (client) => {
  const info = client.Info();
  console.log('Client info:', info);
});
```

### Logging Operations

```javascript
// Set log level
Use(MCP, 'github', (client) => {
  await client.SetLogLevel('debug'); // "debug" | "info" | "warn" | "error"
});
```

### Request Management

```javascript
// Cancel a request
Use(MCP, 'github', (client) => {
  await client.CancelRequest('request_id_123');
  console.log('Request cancelled');
});
```

### Progress Tracking

```javascript
// Create a progress token
Use(MCP, 'github', (client) => {
  const token = await client.CreateProgress(100);
  console.log('Progress token:', token);
  return token;
});

// Update progress
Use(MCP, 'github', (client) => {
  await client.UpdateProgress(token, 50);
  console.log('Progress: 50%');
});
```

### Meta Info

```javascript
// Get client metadata
Use(MCP, 'github', (client) => {
  const meta = client.GetMetaInfo();
  console.log('Meta info:', meta);
  return meta;
});
```

### Event Handling

**Important**: Due to V8 context thread-safety limitations, JavaScript function callbacks are NOT supported. Only Yao process handlers are supported.

```javascript
// Register event handler with Yao process
Use(MCP, 'github', (client) => {
  // First argument: event type
  // Second argument: Yao process name
  // Additional arguments: custom data to pass to the process
  client.OnEvent('connected', 'scripts.mcp.handleConnectedEvent', 'github');

  client.OnEvent('disconnected', 'scripts.mcp.handleDisconnectedEvent');

  client.OnEvent('error', 'scripts.mcp.handleErrorEvent', {
    clientId: 'github'
  });
});

// Register notification handler with Yao process
Use(MCP, 'github', (client) => {
  // First argument: notification method
  // Second argument: Yao process name
  // Additional arguments: custom data to pass to the process
  client.OnNotification(
    'notifications/message',
    'scripts.mcp.handleNotification',
    'github'
  );

  client.OnNotification(
    'notifications/progress',
    'scripts.mcp.handleProgress',
    { updateUI: true }
  );
});

// Register error handler with Yao process
Use(MCP, 'github', (client) => {
  // First argument: Yao process name
  // Additional arguments: custom data to pass to the process
  client.OnError('scripts.mcp.handleError', { clientId: 'github' });

  client.OnError('scripts.mcp.logError', 'error-log-file');
});
```

**Event Handler Process Signature**:

Your Yao process will receive event data as the first argument, followed by any additional arguments you passed:

```javascript
// In your Yao process (e.g., scripts/mcp/handleConnectedEvent.yao)
// Args: [event, ...customArgs]
function handleConnectedEvent(event, clientId) {
  console.log('Connected event:', event);
  console.log('Client ID:', clientId);
  // Process event...
  return;
}
```

**Connection Options**:

When calling `Connect()`, you can provide the following options:

```javascript
{
  headers: {              // Optional: HTTP headers
    'Authorization': 'Bearer token',
    'Custom-Header': 'value'
  },
  timeout: 5000,         // Optional: Timeout in milliseconds
  max_retries: 3,       // Optional: Maximum retry attempts
  retry_delay: 1000      // Optional: Delay between retries in milliseconds
}
```

## Complete Examples

### Example 1: Using `Use()` (Recommended)

```javascript
function processCustomer(customerId) {
  return Use(MCP, 'customer', (mcp) => {
    // List available tools
    const tools = mcp.ListTools();
    console.log(
      'Available tools:',
      tools.tools.map((t) => t.name)
    );

    // Read customer resource
    const customer = mcp.ReadResource(`customers://${customerId}`);

    // Call a tool
    const result = mcp.CallTool('update_customer', {
      id: customerId,
      status: 'active'
    });

    return result;
  }); // Automatic cleanup happens here
}
```

### Example 2: Nested MCP Clients

```javascript
function validateAndProcess(schema, customerId) {
  return Use(MCP, 'dsl', (dslClient) => {
    // Validate schema
    const validation = dslClient.CallTool('validate_schema', { schema });

    if (!validation.isValid) {
      throw new Error('Invalid schema');
    }

    // Process customer with another MCP client
    return Use(MCP, 'customer', (customerClient) => {
      return customerClient.CallTool('process', {
        id: customerId,
        schema: validation.normalized
      });
    });
  });
}
```

### Example 3: Error Handling with `Use()`

```javascript
function safeToolCall(toolName, args) {
  try {
    return Use(MCP, 'client_id', (client) => {
      // Errors are properly propagated
      return client.CallTool(toolName, args);
    });
    // client.__release() is still called even if an error occurs
  } catch (error) {
    console.error('Tool call failed:', error.message);
    return { error: error.message };
  }
}
```

### Example 4: Manual Resource Management

For complex scenarios where `Use()` doesn't fit:

```javascript
function complexWorkflow(customerId) {
  const mcp = new MCP('customer');

  try {
    // Step 1: Read customer
    const customer = mcp.ReadResource(`customers://${customerId}`);

    // Step 2: Some complex logic...
    if (customer.status === 'inactive') {
      return null; // Early return
    }

    // Step 3: Update customer
    const result = mcp.CallTool('update_customer', {
      id: customerId,
      lastAccess: new Date().toISOString()
    });

    return result;
  } finally {
    // Always release resources
    mcp.Release();
  }
}
```

## API Methods

### Constructor

- `new MCP(clientId: string)` - Creates a new MCP client instance

### Properties

- `id: string` - The client ID

### Tool Methods

- `ListTools(cursor?: string): ListToolsResponse` - List all available tools
- `CallTool(name: string, arguments?: object): CallToolResponse` - Call a single tool
- `CallTools(toolCalls: ToolCall[]): CallToolsResponse` - Call multiple tools sequentially
- `CallToolsParallel(toolCalls: ToolCall[]): CallToolsResponse` - Call multiple tools in parallel

### Resource Methods

- `ListResources(cursor?: string): ListResourcesResponse` - List all available resources
- `ReadResource(uri: string): ReadResourceResponse` - Read a resource by URI
- `SubscribeResource(uri: string): Promise<void>` - Subscribe to resource updates
- `UnsubscribeResource(uri: string): Promise<void>` - Unsubscribe from resource updates

### Prompt Methods

- `ListPrompts(cursor?: string): ListPromptsResponse` - List all available prompts
- `GetPrompt(name: string, arguments?: object): GetPromptResponse` - Get a prompt template

### Sample Methods

- `ListSamples(itemType: "tool"|"resource", itemName: string): ListSamplesResponse` - List samples for a tool or resource
- `GetSample(itemType: "tool"|"resource", itemName: string, index: number): SampleData` - Get a specific sample by index

### Connection Methods

- `Connect(options?: ConnectionOptions): Promise<void>` - Connect to MCP server with optional options
- `Initialize(): Promise<InitializeResponse>` - Initialize the MCP session
- `Initialized(): Promise<void>` - Mark the session as initialized
- `Disconnect(): Promise<void>` - Disconnect from MCP server
- `IsConnected(): boolean` - Check if connected to MCP server
- `State(): ConnectionState` - Get current connection state
- `Info(): ClientInfo` - Get client information

### Logging Methods

- `SetLogLevel(level: "debug"|"info"|"warn"|"error"): Promise<void>` - Set the log level

### Request Management Methods

- `CancelRequest(requestID: string|number): Promise<void>` - Cancel an ongoing request

### Progress Tracking Methods

- `CreateProgress(total: number): Promise<number>` - Create a progress token and return it
- `UpdateProgress(token: number, progress: number): Promise<void>` - Update progress for a token

### Meta Info Methods

- `GetMetaInfo(): MetaInfo` - Get metadata about the client

### Event Handler Methods

- `OnEvent(eventType: string, handler: string, ...args): void` - Register event handler
- `OnNotification(method: string, handler: string, ...args): void` - Register notification handler
- `OnError(handler: string, ...args): void` - Register error handler

**Important**: Due to V8 context thread-safety limitations, JavaScript function callbacks are **NOT supported**. Only Yao process handlers are supported.

### Resource Management Methods

- `Release()` - Manually release Go resources (required when not using `Use()`)
- `__release()` - Internal method called automatically by `Use()` or V8 GC (do not call directly)

## Best Practices

1. **Use `Use()` by default** - It's cleaner and safer than manual resource management
2. **Handle errors with try-catch** - Wrap `Use()` calls when you need error handling
3. **Nest `Use()` calls** - For multiple MCP clients, nest them naturally
4. **Use manual `try-finally` only when needed** - For complex control flow or explicit lifetime control
5. **Never forget to release** - If not using `Use()`, always call `Release()` in a `finally` block

## Notes

- The MCP client must be loaded in Go before creating a JavaScript instance
- All methods are synchronous in the current implementation
- Errors are thrown as JavaScript exceptions
- `Use()` ensures resources are released even when errors occur
- When using `Use()`, the callback return value becomes the return value of `Use()`
- The `__release()` method is internal - use `Release()` for manual cleanup or `Use()` for automatic cleanup
