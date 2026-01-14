# Yao Runtime API Reference

## Overview

Yao uses a V8 JavaScript runtime (powered by [gou](https://github.com/yaoapp/gou)) to execute TypeScript/JavaScript code. This document covers the core runtime APIs available in Yao scripts.

## Global Functions

### Authorized

Get the authenticated user information from the current context. This function is available when the page/script is protected by an OAuth guard.

```typescript
function Authorized(): AuthorizedInfo | null;

interface AuthorizedInfo {
  user_id?: string; // User ID
  team_id?: string; // Team ID (for team users)
  owner_id?: string; // Owner ID (may be pre-computed)
  scope?: string; // Permission scope (e.g., "read write")
  constraints?: Record<string, any>; // Additional constraints
}
```

**Usage:**

```javascript
// Get authorized info
const auth = Authorized();

if (!auth) {
  throw new Error('Not authenticated');
}

// Access user info
const userId = auth.user_id;
const teamId = auth.team_id;
const scope = auth.scope;

// Get owner ID (priority: owner_id > team_id > user_id)
function getOwnerID() {
  const auth = Authorized();
  if (!auth) return null;
  return auth.owner_id || auth.team_id || auth.user_id || null;
}
```

**Note:** This function requires the page to be protected by an OAuth guard. Configure in `.config` file:

```json
{
  "title": "Page Title",
  "guard": "oauth"
}
```

---

### Process

The most important function for calling Yao backend processes.

```typescript
function Process(name: string, ...args: any[]): any;
```

**Usage:**

```javascript
// Call a model process
const users = Process('models.user.Get', {
  select: ['id', 'name'],
  wheres: [{ column: 'status', value: 'active' }],
  limit: 10
});

// Call a flow process
const result = Process('flows.myflow', { param1: 'value1' });

// Call a script process
const data = Process('scripts.mymodule.MyFunction', arg1, arg2);
```

**Common Process Patterns:**

| Process                       | Description              |
| ----------------------------- | ------------------------ |
| `models.{model}.Get`          | Query model records      |
| `models.{model}.Find`         | Find single record by ID |
| `models.{model}.Create`       | Create new record        |
| `models.{model}.Update`       | Update record            |
| `models.{model}.Delete`       | Delete record            |
| `models.{model}.Save`         | Create or update record  |
| `flows.{flow}`                | Execute a flow           |
| `scripts.{module}.{function}` | Call a script function   |
| `plugins.{plugin}.{function}` | Call a plugin function   |

---

## Built-in Objects

### console

Standard console logging (output goes to Yao logs).

```javascript
console.log('Message', data); // Info level
console.info('Info message'); // Info level
console.warn('Warning'); // Warn level
console.error('Error', err); // Error level
console.debug('Debug info'); // Debug level
```

### log

Structured logging with format strings.

```javascript
log.Trace('Trace: %s %v', 'name', data);
log.Debug('Debug: %s', message);
log.Info('Info: %s', message);
log.Warn('Warning: %s', message);
log.Error('Error: %s', err);
log.Fatal('Fatal: %s', message); // Terminates execution
log.Panic('Panic: %s', message); // Throws panic
```

---

## http Object

HTTP client for making external API calls.

### Methods

| Method                                                           | Description         |
| ---------------------------------------------------------------- | ------------------- |
| `http.Get(url, query?, headers?)`                                | HTTP GET request    |
| `http.Post(url, payload, files?, query?, headers?)`              | HTTP POST request   |
| `http.Put(url, payload, query?, headers?)`                       | HTTP PUT request    |
| `http.Patch(url, payload, query?, headers?)`                     | HTTP PATCH request  |
| `http.Delete(url, payload?, query?, headers?)`                   | HTTP DELETE request |
| `http.Send(method, url, payload?, query?, headers?, files?)`     | Generic request     |
| `http.Stream(method, url, callback, payload?, query?, headers?)` | Streaming request   |

### Response Structure

```typescript
interface HttpResponse {
  status: number; // HTTP status code
  code: number; // Response code
  message: string; // Response message
  headers: Record<string, string[]>;
  data: any; // Response body (parsed JSON or string)
}
```

### Examples

```javascript
// GET request
const resp = http.Get(
  'https://api.example.com/users',
  { page: 1 },
  {
    Authorization: 'Bearer token'
  }
);

if (resp.status === 200) {
  const users = resp.data;
}

// POST request with JSON body
const resp = http.Post(
  'https://api.example.com/users',
  {
    name: 'John',
    email: 'john@example.com'
  },
  {},
  {},
  {
    'Content-Type': 'application/json'
  }
);

// POST with file upload
const resp = http.Post(
  'https://api.example.com/upload',
  { description: 'My file' },
  { file: '/path/to/file.pdf' }
);

// Streaming request
http.Stream(
  'POST',
  'https://api.example.com/stream',
  (data) => {
    console.log('Received chunk:', data);
    return 1; // 1 = continue, 0 = stop, -1 = error
  },
  payload,
  query,
  headers
);
```

---

## FS Object (File System)

File system operations with sandboxed access.

### Constructor

```javascript
const fs = new FS('system'); // Default file system
const fs = new FS('data'); // Data directory
```

### File Operations

```javascript
// Read file
const content = fs.ReadFile('/path/to/file.txt'); // Returns string
const buffer = fs.ReadFileBuffer('/path/to/file.txt'); // Returns Uint8Array
const base64 = fs.ReadFileBase64('/path/to/file.txt'); // Returns base64 string

// Write file
const bytes = fs.WriteFile('/path/to/file.txt', 'content');
const bytes = fs.WriteFile('/path/to/file.txt', 'content', 0o644);
fs.WriteFileBuffer('/path/to/file.txt', uint8Array);
fs.WriteFileBase64('/path/to/file.txt', base64String);

// Append to file
fs.AppendFile('/path/to/file.txt', 'more content');

// Delete file
fs.Remove('/path/to/file.txt');
fs.RemoveAll('/path/to/directory');
```

### Directory Operations

```javascript
// List directory
const files = fs.ReadDir('/path/to/dir');
const filesRecursive = fs.ReadDir('/path/to/dir', true);

// Create directory
fs.Mkdir('/path/to/dir');
fs.MkdirAll('/path/to/deep/dir');
const tempDir = fs.MkdirTemp();

// Check existence
const exists = fs.Exists('/path/to/file');
const isDir = fs.IsDir('/path');
const isFile = fs.IsFile('/path/to/file');
```

### File Info

```javascript
const name = fs.BaseName('/path/to/file.txt'); // "file.txt"
const dir = fs.DirName('/path/to/file.txt'); // "/path/to"
const ext = fs.ExtName('/path/to/file.txt'); // ".txt"
const mime = fs.MimeType('/path/to/file.txt'); // "text/plain"
const size = fs.Size('/path/to/file.txt'); // bytes
const mode = fs.Mode('/path/to/file.txt'); // file mode
const mtime = fs.ModTime('/path/to/file.txt'); // Unix timestamp
```

### File Operations

```javascript
// Copy and move
fs.Copy('/source/file.txt', '/dest/file.txt');
fs.Move('/source/file.txt', '/dest/file.txt');

// Compression
fs.Zip('/path/to/dir', '/path/to/archive.zip');
const files = fs.Unzip('/path/to/archive.zip', '/extract/to');

// Glob pattern matching
const txtFiles = fs.Glob('/path/*.txt');

// Get absolute path
const absPath = fs.Abs('/relative/path');
```

---

## Store Object (Cache/KV Store)

Key-value storage with TTL support.

### Constructor

```javascript
const cache = new Store('cache'); // Use "cache" store
```

### Basic Operations

```javascript
// Set with optional TTL (seconds)
cache.Set('key', value);
cache.Set('key', value, 3600); // Expires in 1 hour

// Get value
const value = cache.Get('key'); // Returns undefined if not found

// Check existence
const exists = cache.Has('key');

// Delete
cache.Del('key');

// Get and delete atomically
const value = cache.GetDel('key');

// Get or set (lazy loading)
const value = cache.GetSet(
  'key',
  (key) => {
    return expensiveComputation(key);
  },
  3600
);

// Collection info
const keys = cache.Keys();
const count = cache.Len();
cache.Clear();
```

### List/Array Operations

```javascript
// Push to list
cache.Push('list_key', value1, value2);

// Pop from list (by position)
const value = cache.Pop('list_key', 0); // First element
const value = cache.Pop('list_key', -1); // Last element

// Remove specific value
cache.Pull('list_key', valueToRemove);

// Remove multiple values
cache.PullAll('list_key', [value1, value2]);

// Add unique values (set behavior)
cache.AddToSet('set_key', value1, value2);

// Array access
const len = cache.ArrayLen('list_key');
const item = cache.ArrayGet('list_key', 0);
cache.ArraySet('list_key', 0, newValue);
const slice = cache.ArraySlice('list_key', 0, 10);
const page = cache.ArrayPage('list_key', 1, 20); // Page 1, 20 items
const all = cache.ArrayAll('list_key');
```

---

## Query Object

Execute QueryDSL queries directly against database engines.

### Constructor

```javascript
const query = new Query('default'); // Use default engine
const query = new Query('mongo'); // Use MongoDB engine
```

### Query Methods

```javascript
// Get all matching records
const records = query.Get({
  select: ['id', 'name', 'email'],
  from: 'users',
  wheres: [{ column: 'status', value: 'active' }],
  orders: [{ column: 'created_at', option: 'desc' }],
  limit: 100
});

// Get first matching record
const user = query.First({
  select: ['id', 'name'],
  from: 'users',
  wheres: [{ column: 'id', value: 1 }]
});

// Paginate results
const result = query.Paginate({
  select: ['id', 'name'],
  from: 'users',
  page: 1,
  pagesize: 20
});
// Returns: { data: [...], total: 100, page: 1, pagesize: 20 }

// Run raw statement
const result = query.Run({
  stmt: 'SELECT version()'
});
```

### Query Validation

```javascript
// Lint/validate DSL
const result = query.Lint('{"select":["id"], "from":"user"}');
// Returns: { valid: bool, diagnostics: [...], dsl: {...} }

// Get JSON Schema
const schema = query.Schema();
const schemaJson = query.Schema('json');

// Validate against schema
const result = query.Validate({ select: ['id'], from: 'user' });
// Returns: { valid: bool, error?: string }
```

---

## time Object

Time-related utilities.

```javascript
// Sleep for milliseconds
time.Sleep(1000); // Sleep 1 second

// Execute process after delay
time.After(5000, 'scripts.mymodule.DelayedTask', arg1, arg2);
// Runs "scripts.mymodule.DelayedTask" after 5 seconds
```

---

## Utility Functions

### $L (Localization)

Translate strings using language files.

```javascript
const translated = $L('::messages.welcome');
const greeting = $L('::messages.hello');
```

### btoa / atob

Base64 encoding/decoding.

```javascript
const encoded = btoa('Hello, World!'); // "SGVsbG8sIFdvcmxkIQ=="
const decoded = atob('SGVsbG8sIFdvcmxkIQ=='); // "Hello, World!"
```

---

## Type Conversion (Go ↔ JavaScript)

The runtime automatically converts types between Go and JavaScript:

### Go → JavaScript

| Go Type                  | JavaScript Type |
| ------------------------ | --------------- |
| `nil`                    | `null`          |
| `bool`                   | `boolean`       |
| `int`, `int32`, `int64`  | `number`        |
| `float32`, `float64`     | `number`        |
| `string`                 | `string`        |
| `[]byte`                 | `Uint8Array`    |
| `map[string]interface{}` | `object`        |
| `[]interface{}`          | `array`         |
| `error`                  | `Error`         |
| `*big.Int`               | `bigint`        |

### JavaScript → Go

| JavaScript Type  | Go Type                  |
| ---------------- | ------------------------ |
| `null`           | `nil`                    |
| `undefined`      | `bridge.Undefined`       |
| `boolean`        | `bool`                   |
| `number` (int)   | `int`                    |
| `number` (float) | `float64`                |
| `string`         | `string`                 |
| `bigint`         | `int64`                  |
| `Uint8Array`     | `[]byte`                 |
| `object`         | `map[string]interface{}` |
| `array`          | `[]interface{}`          |
| `Error`          | `error`                  |

---

## Error Handling

Errors thrown in JavaScript are converted to Go errors and vice versa.

```javascript
try {
  const result = Process('models.user.Find', 999999);
} catch (e) {
  console.error('Error:', e.message);
  // Handle error
}
```

---

## Best Practices

1. **Use Process for backend calls** - Always use `Process()` to interact with models, flows, and scripts
2. **Handle HTTP errors** - Check `resp.status` before using `resp.data`
3. **Use appropriate stores** - Use `Store` for caching, not for persistent data
4. **Sandbox awareness** - File operations are sandboxed; use appropriate FS names
5. **Type safety** - Be aware of type conversions when passing data between JS and Go

---

## See Also

- [Process API](./process-api.md) - Detailed model process documentation
- [Agent Context API](./agent-context-api.md) - Agent-specific context and memory
- [Model Definition](./model-definition.md) - Database model schemas
