# AI Reference: Yao Agent Development

> **Documentation for AI Coding Assistants**
>
> This folder (`ai-docs`) contains reference documentation designed specifically for AI assistants (Claude, GPT, Cursor, etc.) to understand and build Yao Agents. These documents provide structured API references, patterns, and conventions needed for agent development.

## Purpose

These documents serve as a knowledge base for AI coding assistants to:

1. **Understand Yao Agent architecture** - How assistants, hooks, and tools work together
2. **Write correct code** - API signatures, type definitions, and usage patterns
3. **Follow conventions** - Naming patterns, file structures, and best practices
4. **Debug issues** - Common patterns and error handling approaches

## Document Index

### Core APIs

| Document                                    | Description                                        |
| ------------------------------------------- | -------------------------------------------------- |
| [Agent Reference](./agent-reference.md)     | Quick reference: structure, hooks, context API     |
| [Runtime API](./runtime-api.md)             | V8 runtime globals: Process, http, FS, Store, etc. |
| [Agent Context API](./agent-context-api.md) | Context object, messaging, memory, trace, MCP APIs |
| [Hooks Reference](./hooks-reference.md)     | Create and Next hooks with execution flow          |
| [Process API](./process-api.md)             | Model queries, CRUD operations, naming conventions |

### Features

| Document                          | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| [MCP Tools](./mcp-tools.md)       | MCP tool implementation and configuration      |
| [Search API](./search-api.md)     | Auto search (web, KB, DB) and intent detection |
| [Knowledge Base API](./kb-api.md) | Collection and document management             |
| [i18n](./i18n.md)                 | Internationalization and localization          |

### Development

| Document                                        | Description                                |
| ----------------------------------------------- | ------------------------------------------ |
| [Assistant Structure](./assistant-structure.md) | Directory layout and configuration files   |
| [Model Definition](./model-definition.md)       | Database model schema and permission       |
| [Scopes & Permission](./scopes-permission.md)   | Scope-based permission and ACL enforcement |
| [Testing](./testing.md)                         | Test framework, assertions, CI integration |

### Frontend

| Document                            | Description                                       |
| ----------------------------------- | ------------------------------------------------- |
| [SUI Reference](./sui-reference.md) | SUI framework: templates, components, events, API |

## Quick Reference

### Key Concepts

```
Assistant = Hooks + Tools + Models + Prompts + Configuration
```

- **Hooks**: TypeScript functions (`Create`, `Next`) that intercept execution
- **Tools**: MCP tool implementations called by LLM
- **Models**: Database schemas with auto-migration
- **Prompts**: System/user prompt templates with context variables

### Common Tasks

#### Get User/Team ID

```typescript
const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
```

#### Query Model Data

```typescript
const records = Process('models.agents.{assistant_id}.{model}.Get', {
  select: ['id', 'name'],
  wheres: [{ column: 'status', value: 'active' }],
  limit: 10
});
```

#### Query with Permission Filter

```typescript
const authorized = ctx.authorized;
const records = Process('models.agents.expense.voucher.Get', {
  select: ['id', 'title', 'amount'],
  wheres: [
    { column: '__yao_created_by', value: authorized.user_id }
    // Or for team: { column: "__yao_team_id", value: authorized.team_id }
  ]
});
```

#### Check KB Collection

```typescript
const result = Process('kb.collection.exists', `collection_${ownerID}`);
const exists = result && result.exists === true;
```

#### Send Message to User

```typescript
// Complete message
ctx.Send({ type: 'text', props: { content: 'Hello!' } });

// Streaming message
const id = ctx.SendStream('Processing...');
ctx.Append(id, ' done!');
ctx.End(id);
```

#### Store Data Between Hooks

```typescript
// In Create hook
ctx.memory.context.Set('start_time', Date.now());

// In Next hook
const startTime = ctx.memory.context.Get('start_time');
```

### Model ID Convention

| Location                            | Model ID                 |
| ----------------------------------- | ------------------------ |
| `models/user.mod.yao`               | `user`                   |
| `assistants/expense/models/setting` | `agents.expense.setting` |

### Memory Scopes

| Namespace            | Persistence | Use Case                     |
| -------------------- | ----------- | ---------------------------- |
| `ctx.memory.user`    | Persistent  | User preferences             |
| `ctx.memory.team`    | Persistent  | Team settings                |
| `ctx.memory.chat`    | Persistent  | Chat session state           |
| `ctx.memory.context` | Request     | Temporary data between hooks |

### Permission Columns

When `option.permission: true` is set in model definition:

| Column             | Description                     |
| ------------------ | ------------------------------- |
| `__yao_created_by` | User ID who created the record  |
| `__yao_updated_by` | User ID who last updated record |
| `__yao_team_id`    | Team ID for team-based access   |
| `__yao_tenant_id`  | Tenant ID for multi-tenancy     |

### Data Access Constraints

| Constraint     | Description                      | Filter Column      |
| -------------- | -------------------------------- | ------------------ |
| `owner_only`   | Access only user's own records   | `__yao_created_by` |
| `creator_only` | Access only user-created records | `__yao_created_by` |
| `editor_only`  | Access only user-updated records | `__yao_updated_by` |
| `team_only`    | Access only team records         | `__yao_team_id`    |

## Source References

These documents are derived from the Yao source code:

- `yao/agent/context/JSAPI.md` - Complete Context API documentation
- `yao/agent/README.md` - Agent HTTP API reference
- `yao/agent/assistant/` - Assistant implementation
- `yao/agent/memory/` - Memory system implementation
- `yao/model/model.go` - Model loading and migration
- `yao/openapi/kb/` - Knowledge Base API
- `yao/openapi/oauth/acl/` - ACL enforcement and scope management
- `gou/model/scope.go` - AccessScope for permission filtering
- `gou/runtime/v8/` - V8 runtime implementation (Process, http, FS, Store, Query, etc.)

## Usage Tips for AI Assistants

1. **Start with context** - Always check `ctx.authorized` for user/team info
2. **Use Process for data** - Model operations use `Process("models.{id}.{method}", ...)`
3. **Handle errors** - Wrap Process calls in try-catch
4. **Follow naming** - Assistant models use `agents.{assistant_id}.{model}` pattern
5. **Check before create** - Use existence checks before creating resources
6. **Apply permission filters** - Use `__yao_created_by`, `__yao_team_id` columns for access control
7. **Set permission on create** - Include `__yao_created_by`, `__yao_team_id` when creating records

## Contributing

When updating these documents:

1. Keep examples concise and practical
2. Include type signatures where helpful
3. Reference source files for complex topics
4. Test code examples before documenting
