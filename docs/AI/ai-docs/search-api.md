# Yao Agent Search API Reference

## Overview

The Agent Search system provides automatic search capabilities across multiple sources: Web, Knowledge Base (KB), and Database (DB). Search can be triggered automatically based on user intent or controlled via hooks.

## Search Types

| Type  | Description                           | Use Case                        |
| ----- | ------------------------------------- | ------------------------------- |
| `web` | Internet search via configured engine | Current events, general queries |
| `kb`  | Knowledge base semantic search        | Internal documents, policies    |
| `db`  | Database query via QueryDSL           | Structured data, records        |

## Auto Search Flow

1. **Intent Detection**: `__yao.needsearch` agent analyzes user message
2. **Search Execution**: Based on intent, executes web/kb/db searches
3. **Context Injection**: Results are injected as system message before LLM call
4. **Citation**: LLM can cite search results using `[1]`, `[2]` format

## Controlling Search in Hooks

### Disable Search

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  return {
    messages,
    search: false // Disable auto search
  };
}
```

### Enable Specific Search Types

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  return {
    messages,
    search: {
      need_search: true,
      search_types: ['kb', 'db'], // Only KB and DB, no web
      confidence: 1.0,
      reason: 'controlled by hook'
    }
  };
}
```

### Using Uses Configuration

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  return {
    messages,
    uses: {
      search: 'disabled' // Disable search completely
    }
  };
}
```

## Search Intent Structure

```typescript
interface SearchIntent {
  need_search: boolean; // Whether search is needed
  search_types: string[]; // ["web", "kb", "db"]
  confidence: number; // 0.0 - 1.0
  reason: string; // Explanation
}
```

## Assistant Search Configuration

### In package.yao

```json
{
  "search": {
    "web": {
      "provider": "bing",
      "max_results": 10
    },
    "kb": {
      "threshold": 0.7,
      "graph": true
    },
    "db": {
      "max_results": 20
    },
    "keyword": {
      "max_keywords": 5
    },
    "weights": {
      "user": 1.0,
      "hook": 0.8,
      "auto": 0.6
    },
    "citation": {
      "style": "numeric",
      "format": "[{index}]"
    }
  },

  "kb": {
    "collections": ["expense_policy", "travel_guidelines"]
  },

  "db": {
    "models": ["agents.expense.voucher", "agents.expense.expense"]
  }
}
```

## Uses Configuration

The `uses` field controls search-related tool usage:

| Field      | Values                              | Description               |
| ---------- | ----------------------------------- | ------------------------- |
| `search`   | `"disabled"`, `"<agent>"`, `"mcp:"` | Search tool configuration |
| `web`      | `"<provider>"`, `"mcp:"`            | Web search provider       |
| `keyword`  | `"builtin"`, `"<agent>"`, `"mcp:"`  | Keyword extraction        |
| `querydsl` | `"<agent>"`, `"mcp:"`               | QueryDSL generation       |
| `rerank`   | `"<agent>"`, `"mcp:"`               | Result reranking          |

## Search JSAPI (ctx.search)

The `ctx.search` object provides direct search methods in hooks:

### Single Search Methods

```typescript
// Web search
const webResult = ctx.search.Web(query, options?);

// Knowledge base search
const kbResult = ctx.search.KB(query, options?);

// Database search
const dbResult = ctx.search.DB(query, options?);
```

### Web Search Options

```typescript
ctx.search.Web('Yao App Engine', {
  limit: 10, // Max results (default: 10)
  sites: ['github.com', 'yaoapps.com'], // Restrict to sites
  time_range: 'week', // "day", "week", "month", "year"
  rerank: { top_n: 5 } // Rerank options
});
```

### KB Search Options

```typescript
ctx.search.KB('expense policy', {
  collections: ['policy', 'guidelines'], // Collection IDs
  threshold: 0.7, // Similarity threshold (0-1)
  limit: 10, // Max results
  graph: true, // Enable graph association
  rerank: { top_n: 5 } // Rerank options
});
```

### DB Search Options

```typescript
ctx.search.DB('recent expenses', {
  models: ['agents.expense.expense'], // Model IDs
  wheres: [{ column: 'status', value: 'pending' }], // Pre-filters (QueryDSL)
  orders: [{ column: 'created_at', option: 'desc' }], // Sort orders
  select: ['id', 'amount', 'description'], // Fields to return
  limit: 20, // Max results
  rerank: { top_n: 10 } // Rerank options
});
```

### Parallel Search Methods

```typescript
// All: Wait for all searches (like Promise.all)
const results = ctx.search.All([
  { type: 'web', query: 'Yao framework' },
  { type: 'kb', query: 'expense policy', collections: ['policy'] }
]);

// Any: Return when any succeeds with results (like Promise.any)
const results = ctx.search.Any([
  { type: 'web', query: 'latest news' },
  { type: 'kb', query: 'internal docs' }
]);

// Race: Return when any completes (like Promise.race)
const results = ctx.search.Race([
  { type: 'web', query: 'fast search' },
  { type: 'kb', query: 'cached docs' }
]);
```

### Search Result Structure

```typescript
interface SearchResult {
  type: 'web' | 'kb' | 'db';
  query: string;
  source: 'hook' | 'auto' | 'user';
  items: SearchItem[];
  error?: string;
}

interface SearchItem {
  citation_id: string; // "1", "2", etc.
  title: string;
  url: string;
  content: string;
  score: number;
}
```

### Example: Custom Search in Create Hook

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage.content as string;

  // Execute custom search
  const kbResult = ctx.search.KB(query, {
    collections: ['company_policy'],
    threshold: 0.8
  });

  if (kbResult.items?.length > 0) {
    // Inject search context
    return {
      messages,
      search: {
        need_search: false // Skip auto search
      },
      context: formatSearchResults(kbResult)
    };
  }

  return { messages };
}
```

## Search in Next Hook

Access search results in payload:

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  // Search results are already injected into messages
  // LLM response may contain citations like [1], [2]

  const { completion } = payload;
  if (completion?.content) {
    // Process LLM response with citations
    console.log('Response:', completion.content);
  }

  return null;
}
```

## KB Collection Authorization

Collections are filtered by user authorization:

```typescript
// In search execution
const allowedCollections = FilterKBCollectionsByAuth(ctx, ast.KB.Collections);
```

This ensures users only search collections they have access to.

## DB Search Authorization

Database queries automatically include authorization filters:

```typescript
// Auth where clauses are added automatically
const authWheres = BuildDBAuthWheres(ctx);
// e.g., { column: "__yao_created_by", value: user_id }
```

## Search Result Reference

```typescript
interface Reference {
  id: string; // Citation ID ("1", "2", etc.)
  type: string; // "web", "kb", "db"
  title: string; // Result title
  url: string; // Source URL
  content: string; // Snippet/content
  weight: number; // Relevance weight
  score: number; // Search score
  source: string; // Source identifier
}
```

## Loading Messages

During search, loading messages are sent to UI:

1. **Intent Detection**: "Analyzing query..."
2. **Keyword Extraction**: "Extracting keywords..."
3. **Search Execution**: "Searching..."
4. **Results**: "Found X references"

These use the `loading` message type with `done: true` to close.

## Skip Options

In test cases or hooks, skip search-related operations:

```typescript
const opts = {
  skip: {
    search: true, // Skip auto search
    keyword: true // Skip keyword extraction
  }
};
```

## Best Practices

1. **Configure collections** - Set up KB collections for domain knowledge
2. **Set thresholds** - Tune KB threshold for relevance
3. **Control via hooks** - Use Create hook to enable/disable search per request
4. **Handle citations** - LLM responses may include `[1]`, `[2]` references
5. **Test intent detection** - Verify `__yao.needsearch` works for your domain

## See Also

- [Knowledge Base API](./kb-api.md)
- [Hooks Reference](./hooks-reference.md)
- [Agent Context API](./agent-context-api.md)
