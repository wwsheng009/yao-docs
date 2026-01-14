# Yao Assistant Structure Reference

## Overview

A Yao Assistant is a self-contained AI agent package that includes hooks, tools, models, prompts, locales, and configurations.

## Directory Structure

```
assistants/
└── {assistant_id}/
    ├── package.yao              # Required: Package manifest (assistant config)
    ├── prompts.yml              # Required: System prompts
    │
    ├── src/                     # TypeScript source files
    │   ├── index.ts             # Hooks (Create, Next)
    │   ├── tools.ts             # MCP tool implementations
    │   ├── types.d.ts           # Type definitions
    │   ├── *_test.ts            # Test files
    │   └── *.ts                 # Other scripts
    │
    ├── mcps/                    # MCP server definitions
    │   ├── tools.mcp.yao        # Tool declarations
    │   └── mapping/             # Tool input/output schemas
    │       └── tools/
    │           └── schemes/
    │               ├── {tool}.in.yao    # Input schema
    │               ├── {tool}.out.yao   # Output schema
    │               └── {tool}.jsonl     # Examples
    │
    ├── models/                  # Database models
    │   └── *.mod.yao
    │
    ├── prompts/                 # Additional prompt templates
    │   └── *.yml
    │
    ├── locales/                 # Internationalization
    │   ├── en-us.yml
    │   └── zh-cn.yml
    │
    ├── pages/                   # Custom UI pages (optional)
    │
    └── tests/                   # Test configurations
        └── ctx.json             # Test context
```

## Package Manifest (package.yao)

The `package.yao` file is the main configuration for the assistant:

```json
{
  "name": "{{ name }}",
  "type": "assistant",
  "avatar": "/assets/images/assistants/myassistant.png",
  "connector": "deepseek.v3",
  "connector_options": {
    "optional": true,
    "connectors": ["deepseek.v3", "openai.gpt-4o"],
    "filters": ["tool_calls"]
  },
  "mcp": {
    "servers": [
      {
        "server_id": "agents.{assistant_id}.tools",
        "tools": ["tool1", "tool2"]
      }
    ]
  },
  "description": "{{ description }}",
  "options": { "temperature": 0.7 },
  "public": true,
  "placeholder": {
    "title": "{{ chat.title }}",
    "description": "{{ chat.description }}",
    "prompts": ["{{ chat.prompts.0 }}", "{{ chat.prompts.1 }}"]
  },
  "tags": ["Tag1", "Tag2"],
  "modes": ["chat", "task"],
  "default_mode": "task",
  "sort": 2,
  "readonly": true,
  "automated": true,
  "mentionable": true,
  "share": "team"
}
```

### Key Fields

| Field               | Type     | Description                                   |
| ------------------- | -------- | --------------------------------------------- |
| `name`              | string   | Display name (supports i18n: `{{ name }}`)    |
| `type`              | string   | Must be `"assistant"`                         |
| `connector`         | string   | Default LLM connector ID                      |
| `connector_options` | object   | Connector fallback and filtering options      |
| `mcp`               | object   | MCP server configuration                      |
| `options`           | object   | LLM options (temperature, max_tokens, etc.)   |
| `modes`             | string[] | Supported modes: `"chat"`, `"task"`           |
| `automated`         | boolean  | Can be triggered automatically                |
| `mentionable`       | boolean  | Can be mentioned in other chats               |
| `share`             | string   | Sharing scope: `"user"`, `"team"`, `"public"` |
| `placeholder`       | object   | Chat UI placeholder content                   |

## System Prompts (prompts.yml)

The main system prompt configuration:

```yaml
- role: system
  content: |
    # Who You Are
    You are the expense reimbursement system...

    ## Your Capabilities
    - ✅ You CAN read receipt images
    - ✅ You CAN extract merchant, amount, date
    ...

    ## Operating Procedure
    1. Identify what user provided
    2. Extract required information
    3. Determine intent
    4. Call the appropriate tool
```

### Additional Prompts (prompts/\*.yml)

Separate prompt files for specific scenarios:

```yaml
# prompts/analysis.yml
- role: system
  content: |
    You are analyzing expense data...
```

## MCP Tools

### Tool Server Declaration (mcps/tools.mcp.yao)

```json
{
  "label": "My Tools",
  "description": "Tools for this assistant",
  "transport": "process",
  "capabilities": {
    "tools": { "listChanged": false }
  },
  "tools": {
    "recognize": "agents.{assistant_id}.tools.Recognize",
    "query": "agents.{assistant_id}.tools.Query"
  }
}
```

### Tool Implementation (src/tools.ts)

```typescript
// @ts-nocheck
import { agent } from '@yao/runtime';

/**
 * Recognize - Process expense recognition
 */
export function Recognize(
  params: { intent: string; vouchers: any[] },
  ctx: agent.Context
) {
  const { intent, vouchers } = params;

  // Process based on intent
  switch (intent) {
    case 'submission':
      return handleSubmission(vouchers, ctx);
    case 'query':
      return handleQuery(vouchers, ctx);
    default:
      return { error: 'Unknown intent' };
  }
}

/**
 * Query - Query expense records
 */
export function Query(params: { filters: any }, ctx: agent.Context) {
  const records = Process('models.agents.myassistant.expense.Get', {
    wheres: buildWheres(params.filters),
    limit: 20
  });
  return { records };
}
```

### Tool Input Schema (mcps/mapping/tools/schemes/recognize.in.yao)

```json
{
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "enum": ["submission", "query", "analysis", "compliance"],
      "description": "The type of expense operation"
    },
    "vouchers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "base": {
            "type": "object",
            "properties": {
              "merchant": { "type": "string" },
              "amount": { "type": "number" },
              "date": { "type": "string", "format": "date" },
              "category": { "type": "string" }
            },
            "required": ["merchant", "amount", "date", "category"]
          }
        }
      }
    }
  },
  "required": ["intent", "vouchers"]
}
```

## Hooks (src/index.ts)

```typescript
// @ts-nocheck
import { agent } from '@yao/runtime';

/**
 * Create Hook - Called before LLM call
 */
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  // Store request start time
  ctx.memory.context.Set('start_time', Date.now());

  return {
    messages,
    mcp_servers: [{ server_id: 'agents.myassistant.tools' }],
    temperature: 0.7
  };
}

/**
 * Next Hook - Called after LLM response
 */
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { completion, tools, error } = payload;

  // Calculate duration
  const duration = Date.now() - ctx.memory.context.Get('start_time');

  if (error) {
    return { data: { status: 'error', message: error } };
  }

  if (tools && tools.length > 0) {
    return {
      data: {
        status: 'success',
        tool_results: tools.map((t) => t.result),
        duration_ms: duration
      }
    };
  }

  return null; // Use standard LLM response
}
```

## Models (models/\*.mod.yao)

Models in assistant's `models/` directory are auto-loaded with special naming:

- **Model ID**: `agents.{assistant_id}.{model_name}`
- **Table prefix**: `agents_{assistant_id}_`

Example: `models/expense.mod.yao` becomes:

- Model ID: `agents.expense.expense`
- Table name: `agents_expense_expense`

See [Model Definition](./model-definition.md) for schema details.

## Locales (locales/\*.yml)

Internationalization files for the assistant:

```yaml
# locales/en-us.yml
name: 'Expense Assistant'
description: 'Smart expense management system'
chat:
  title: 'Expense Reimbursement'
  description: 'Upload receipts to submit expenses'
  prompts:
    - 'Submit a receipt'
    - 'Check my expenses'
    - 'Analyze spending'
```

```yaml
# locales/zh-cn.yml
name: '报销助手'
description: '智能费用管理系统'
chat:
  title: '费用报销'
  description: '上传发票提交报销'
  prompts:
    - '提交发票'
    - '查询报销记录'
    - '分析支出'
```

Reference in `package.yao` using `{{ key }}` syntax.

## Testing

### Test Context (tests/ctx.json)

```json
{
  "chat_id": "test-chat-id",
  "assistant_id": "expense",
  "locale": "en-us",
  "authorized": {
    "user_id": "test-user-123",
    "team_id": "test-team-456"
  },
  "metadata": {
    "mode": "test"
  }
}
```

### Test Files (src/\*\_test.ts)

```typescript
// @ts-nocheck
import { agent } from '@yao/runtime';

function TestRecognize(t: agent.T) {
  const result = Recognize(
    {
      intent: 'submission',
      vouchers: [{ base: { merchant: 'Test', amount: 100 } }]
    },
    t.ctx
  );

  t.assert.notNull(result, 'Result should not be null');
  t.assert.eq(result.status, 'success', 'Should succeed');
}
```

### Running Tests

```bash
# Run all assistant tests
yao agent test expense

# Run with specific test file
yao agent test expense --script src/tools_test.ts

# Run with verbose output
yao agent test expense -v
```

## File Naming Conventions

| File Pattern  | Purpose                 |
| ------------- | ----------------------- |
| `package.yao` | Assistant configuration |
| `prompts.yml` | Main system prompts     |
| `*.mcp.yao`   | MCP server declarations |
| `*.mod.yao`   | Model definitions       |
| `*.in.yao`    | Tool input schema       |
| `*.out.yao`   | Tool output schema      |
| `*_test.ts`   | Test files              |
| `en-us.yml`   | English locale          |
| `zh-cn.yml`   | Chinese locale          |

## Best Practices

1. **Modular Design**: Separate hooks, tools, and utilities into different files
2. **Error Handling**: Always handle errors in hooks and tools gracefully
3. **Type Safety**: Use `types.d.ts` for shared type definitions
4. **Memory Scopes**: Use `ctx.memory.context` for request data, `ctx.memory.chat` for session
5. **Tracing**: Add trace nodes for debugging and user transparency
6. **I18n**: Use locale files for all user-facing strings
7. **Tool Schemas**: Define clear input/output schemas for all tools
8. **Testing**: Write tests for all tool functions

## See Also

- [Agent Context API](./agent-context-api.md) - Context object and methods
- [Process API](./process-api.md) - Model queries and CRUD
- [Model Definition](./model-definition.md) - Database schema
- [MCP Tools](./mcp-tools.md) - Tool implementation details
- [Testing](./testing.md) - Test framework reference
