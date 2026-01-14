# Yao Process API Reference

## Overview

The `Process` function is the core mechanism for calling Yao built-in processes and model operations from JavaScript/TypeScript code.

## Model Processes

### Query Records

```typescript
// Get records with query parameters
const records = Process('models.{ModelID}.Get', {
  select: ['id', 'name', 'status'],
  wheres: [{ column: 'status', value: 'active' }],
  limit: 10
});

// Find a single record by ID
const record = Process('models.{ModelID}.Find', id, {
  select: ['id', 'name']
});

// Paginate records
const result = Process(
  'models.{ModelID}.Paginate',
  { wheres: [{ column: 'status', value: 'active' }] },
  1, // page
  20 // pageSize
);
```

### Query Parameters

```typescript
interface QueryParam {
  select?: string[]; // Fields to select
  wheres?: Where[]; // WHERE conditions
  orders?: Order[]; // ORDER BY clauses
  limit?: number; // LIMIT
  offset?: number; // OFFSET
  withs?: Record<string, With>; // Relations to load
}

interface Where {
  column: string;
  value?: any;
  op?: '=' | '>' | '<' | '>=' | '<=' | '!=' | 'like' | 'in' | 'not in';
  method?: 'where' | 'orwhere';
}

interface Order {
  column: string;
  option?: 'asc' | 'desc';
}
```

### Create/Update/Delete

```typescript
// Create a new record
const id = Process('models.{ModelID}.Create', {
  name: 'New Record',
  status: 'active'
});

// Update a record
Process('models.{ModelID}.Update', id, {
  status: 'inactive'
});

// Save (create or update)
const id = Process('models.{ModelID}.Save', {
  id: existingId, // Optional, creates new if not provided
  name: 'Record Name'
});

// Delete a record
Process('models.{ModelID}.Delete', id);

// Delete with conditions
Process('models.{ModelID}.DeleteWhere', {
  wheres: [{ column: 'status', value: 'deleted' }]
});
```

## Assistant Model Naming Convention

For models defined in assistant's `models/` directory, the model ID follows this pattern:

```
agents.{assistant_id}.{model_name}
```

### Examples

| Assistant ID    | Model File               | Model ID                   |
| --------------- | ------------------------ | -------------------------- |
| `expense`       | `models/setting.mod.yao` | `agents.expense.setting`   |
| `expense`       | `models/voucher.mod.yao` | `agents.expense.voucher`   |
| `tests.mcpload` | `models/foo.mod.yao`     | `agents.tests.mcpload.foo` |

### Table Name Prefix

Assistant models automatically get a table name prefix:

```
agents_{assistant_id}_
```

For example, if `setting.mod.yao` defines `table.name = "expense_setting"`, the actual table name becomes:

```
agents_expense_expense_setting
```

## Example: Check Setting Record

```typescript
function checkSettingRecord(ownerID: string): boolean {
  try {
    const records = Process('models.agents.expense.setting.Get', {
      select: ['id'],
      wheres: [{ column: 'user_id', value: ownerID }],
      limit: 1
    });

    return Array.isArray(records) && records.length > 0;
  } catch (e) {
    console.log(`checkSettingRecord error: ${e}`);
    return false;
  }
}
```

## See Also

- [Agent Context API](./agent-context-api.md)
- [Model Definition](./model-definition.md)
- [Knowledge Base API](./kb-api.md)
