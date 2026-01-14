# Yao Model Definition Reference

## Overview

Models in Yao define database table structures using JSON/JSONC format with `.mod.yao`, `.mod.json`, or `.mod.jsonc` extensions.

## File Location

### Application Models

Located in `models/` directory:

```
app/
├── models/
│   ├── user.mod.yao
│   ├── order.mod.yao
│   └── product/
│       └── item.mod.yao
```

### Assistant Models

Located in assistant's `models/` directory:

```
assistants/
└── expense/
    ├── package.yao
    ├── models/
    │   ├── setting.mod.yao
    │   ├── expense.mod.yao
    │   └── voucher.mod.yao
    └── src/
        └── index.ts
```

## Model Structure

```json
{
  "name": "Model Name",
  "label": "Display Label",
  "description": "Model description",
  "tags": ["tag1", "tag2"],
  "table": {
    "name": "table_name",
    "comment": "Table comment"
  },
  "columns": [...],
  "relations": {...},
  "indexes": [...],
  "option": {
    "timestamps": true,
    "soft_deletes": true,
    "permission": true
  }
}
```

## Column Types

| Type         | Description                |
| ------------ | -------------------------- |
| `ID`         | Auto-increment primary key |
| `string`     | VARCHAR field              |
| `text`       | TEXT field                 |
| `integer`    | INT field                  |
| `bigInteger` | BIGINT field               |
| `float`      | FLOAT field                |
| `decimal`    | DECIMAL field              |
| `boolean`    | BOOLEAN field              |
| `date`       | DATE field                 |
| `datetime`   | DATETIME field             |
| `timestamp`  | TIMESTAMP field            |
| `json`       | JSON field                 |
| `enum`       | ENUM field                 |

## Column Definition

```json
{
  "name": "field_name",
  "type": "string",
  "label": "Display Label",
  "comment": "Field description",
  "length": 255,
  "nullable": true,
  "default": "default_value",
  "unique": false,
  "index": true,
  "primary": false
}
```

## Example: Setting Model

```json
{
  "name": "Expense Setting",
  "label": "Expense Setting",
  "description": "Expense system configuration per user/team",
  "tags": ["expense", "setting", "config"],
  "table": {
    "name": "expense_setting",
    "comment": "Expense system configuration per user/team"
  },
  "columns": [
    {
      "name": "id",
      "type": "ID",
      "label": "ID",
      "comment": "Primary key identifier",
      "primary": true
    },
    {
      "name": "user_id",
      "type": "string",
      "label": "User ID",
      "comment": "Owner user ID (one setting per user/team)",
      "length": 255,
      "nullable": false,
      "unique": true,
      "index": true
    },
    {
      "name": "kb_collections",
      "type": "json",
      "label": "KB Collections",
      "comment": "Knowledge base collection IDs array",
      "nullable": true
    },
    {
      "name": "default_currency",
      "type": "string",
      "label": "Default Currency",
      "comment": "Default currency code (e.g., CNY, USD)",
      "length": 10,
      "default": "CNY",
      "nullable": false
    },
    {
      "name": "is_active",
      "type": "boolean",
      "label": "Is Active",
      "comment": "Whether this setting is active",
      "default": true,
      "nullable": false,
      "index": true
    }
  ],
  "relations": {},
  "indexes": [],
  "option": {
    "timestamps": true,
    "soft_deletes": true,
    "permission": true
  }
}
```

## Options

| Option         | Description                                       |
| -------------- | ------------------------------------------------- |
| `timestamps`   | Auto-add `created_at` and `updated_at` fields     |
| `soft_deletes` | Auto-add `deleted_at` field for soft delete       |
| `permission`   | Enable permission columns for data access control |

---

## Permission System

When `option.permission` is set to `true`, the model automatically adds permission columns for data access control.

### Permission Columns

| Column             | Type   | Description                     |
| ------------------ | ------ | ------------------------------- |
| `__yao_created_by` | string | User ID who created the record  |
| `__yao_updated_by` | string | User ID who last updated record |
| `__yao_team_id`    | string | Team ID for team-based access   |
| `__yao_tenant_id`  | string | Tenant ID for multi-tenancy     |

These columns are automatically added during migration when `permission: true` is set.

### AccessScope

The `AccessScope` structure is used to filter data based on permission columns:

```typescript
interface AccessScope {
  CreatedBy: string; // Maps to __yao_created_by
  UpdatedBy: string; // Maps to __yao_updated_by
  TeamID: string; // Maps to __yao_team_id
  TenantID: string; // Maps to __yao_tenant_id
}
```

### Using Permission in Agent Hooks

In agent hooks, use `ctx.authorized` to get the current user/team context and apply permission filters:

```typescript
function Create(ctx, messages) {
  const authorized = ctx.authorized;
  if (!authorized) {
    throw new Error('Unauthorized');
  }

  // Get owner ID (team takes priority)
  const ownerID = authorized.team_id || authorized.user_id;

  // Query with permission filter
  const records = Process('models.agents.expense.setting.Get', {
    select: ['id', 'name', 'status'],
    wheres: [
      { column: '__yao_created_by', value: authorized.user_id }
      // Or for team-based access:
      // { column: "__yao_team_id", value: authorized.team_id }
    ]
  });

  return { messages };
}
```

### Creating Records with Permission

When creating records, include permission columns to enable access control:

```typescript
function createRecord(ctx, data) {
  const authorized = ctx.authorized;

  // Prepare data with permission fields
  const record = {
    ...data,
    __yao_created_by: authorized.user_id,
    __yao_updated_by: authorized.user_id,
    __yao_team_id: authorized.team_id || null,
    __yao_tenant_id: authorized.tenant_id || null
  };

  return Process('models.agents.expense.voucher.Create', record);
}
```

### Updating Records with Permission

When updating records, update the `__yao_updated_by` field:

```typescript
function updateRecord(ctx, id, data) {
  const authorized = ctx.authorized;

  const record = {
    ...data,
    __yao_updated_by: authorized.user_id
  };

  Process('models.agents.expense.voucher.Update', id, record);
}
```

---

## Data Access Constraints

The OpenAPI ACL system provides data access constraints that work with permission columns.

### Constraint Types

| Constraint    | Description                                   | Filter Column      |
| ------------- | --------------------------------------------- | ------------------ |
| `OwnerOnly`   | Access only records created by current user   | `__yao_created_by` |
| `CreatorOnly` | Access only records created by current user   | `__yao_created_by` |
| `EditorOnly`  | Access only records last updated by user      | `__yao_updated_by` |
| `TeamOnly`    | Access only records belonging to current team | `__yao_team_id`    |

### Using Constraints in Agent Context

The `ctx.authorized.constraints` object contains constraint flags set by ACL enforcement:

```typescript
interface DataConstraints {
  owner_only?: boolean; // Only access owner's data
  creator_only?: boolean; // Only access creator's data
  editor_only?: boolean; // Only access editor's data
  team_only?: boolean; // Only access team's data
  extra?: Record<string, any>; // Custom constraints
}
```

### Applying Constraints in Queries

```typescript
function getRecords(ctx) {
  const authorized = ctx.authorized;
  const constraints = authorized.constraints || {};

  // Build where clauses based on constraints
  const wheres = [];

  if (constraints.owner_only || constraints.creator_only) {
    wheres.push({ column: '__yao_created_by', value: authorized.user_id });
  }

  if (constraints.editor_only) {
    wheres.push({ column: '__yao_updated_by', value: authorized.user_id });
  }

  if (constraints.team_only && authorized.team_id) {
    wheres.push({ column: '__yao_team_id', value: authorized.team_id });
  }

  return Process('models.agents.expense.voucher.Get', {
    select: ['id', 'name', 'amount'],
    wheres: wheres
  });
}
```

---

## Complete Permission Example

### Model with Permission

```json
{
  "name": "Expense Voucher",
  "table": { "name": "expense_voucher" },
  "columns": [
    { "name": "id", "type": "ID", "primary": true },
    { "name": "title", "type": "string", "length": 255 },
    { "name": "amount", "type": "decimal", "precision": 10, "scale": 2 },
    { "name": "status", "type": "string", "length": 50, "default": "draft" }
  ],
  "option": {
    "timestamps": true,
    "soft_deletes": true,
    "permission": true
  }
}
```

### Agent Hook with Permission Filter

```typescript
function Next(ctx, payload) {
  const authorized = ctx.authorized;
  if (!authorized) return null;

  const constraints = authorized.constraints || {};

  // Build permission-aware query
  const wheres = [];

  // Apply constraint-based filtering
  if (constraints.team_only && authorized.team_id) {
    // Team member can see:
    // 1. Their own records
    // 2. Team records shared with team
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
  } else if (constraints.owner_only) {
    // Owner can only see their own records
    wheres.push({ column: '__yao_created_by', value: authorized.user_id });
    wheres.push({ column: '__yao_team_id', op: 'null' }); // Exclude team records
  }

  const vouchers = Process('models.agents.expense.voucher.Get', {
    select: ['id', 'title', 'amount', 'status', 'created_at'],
    wheres: wheres,
    orders: [{ column: 'created_at', option: 'desc' }],
    limit: 20
  });

  return { data: { vouchers } };
}
```

### Creating with Permission Scope

```typescript
function createVoucher(ctx, data) {
  const authorized = ctx.authorized;

  // Prepare record with permission fields
  const record = {
    title: data.title,
    amount: data.amount,
    status: 'draft',
    // Permission fields
    __yao_created_by: authorized.user_id,
    __yao_updated_by: authorized.user_id,
    __yao_team_id: authorized.team_id || null,
    __yao_tenant_id: authorized.tenant_id || null
  };

  const id = Process('models.agents.expense.voucher.Create', record);
  return { id };
}
```

---

## Model ID Convention

### Application Models

```
{relative_path_without_extension}
```

Examples:

- `models/user.mod.yao` → `user`
- `models/product/item.mod.yao` → `product.item`

### Assistant Models

```
agents.{assistant_id}.{model_name}
```

Examples:

- `assistants/expense/models/setting.mod.yao` → `agents.expense.setting`
- `assistants/expense/models/voucher.mod.yao` → `agents.expense.voucher`

## Table Name Prefix

Assistant models automatically get table name prefix:

| Assistant ID    | Original Table Name | Actual Table Name                |
| --------------- | ------------------- | -------------------------------- |
| `expense`       | `expense_setting`   | `agents_expense_expense_setting` |
| `tests.mcpload` | `foo`               | `agents_tests_mcpload_foo`       |

## Best Practices

### 1. Always Enable Permission for User Data

```json
{
  "option": {
    "timestamps": true,
    "soft_deletes": true,
    "permission": true
  }
}
```

### 2. Check Authorization Before Operations

```typescript
function safeOperation(ctx) {
  const authorized = ctx.authorized;
  if (!authorized || !authorized.user_id) {
    throw new Error('Unauthorized: user_id required');
  }
  // Proceed with operation...
}
```

### 3. Use Appropriate Constraint Level

| Scenario                   | Constraint  | Description                 |
| -------------------------- | ----------- | --------------------------- |
| Personal settings          | `OwnerOnly` | Only user can access        |
| Team shared resources      | `TeamOnly`  | All team members can access |
| User-created, team-visible | Both        | Creator owns, team can view |

### 4. Handle Team vs Personal Context

```typescript
function getOwnerID(ctx) {
  const authorized = ctx.authorized;
  // Team takes priority for team-based applications
  return authorized.team_id || authorized.user_id;
}

function isTeamContext(ctx) {
  return !!ctx.authorized?.team_id;
}
```

---

## See Also

- [Scopes & Permission](./scopes-permission.md) - Scope-based permission and ACL
- [Process API](./process-api.md) - Model CRUD operations
- [Agent Context API](./agent-context-api.md) - Context and authorization
- [Knowledge Base API](./kb-api.md) - KB with permission support
