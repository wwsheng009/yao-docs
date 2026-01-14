# Yao Knowledge Base (KB) API Reference

## Overview

The Knowledge Base API provides processes for managing document collections, documents, and semantic search capabilities. It's built on GraphRAG technology for intelligent document retrieval.

## Collection Processes

| Process                        | Description                |
| ------------------------------ | -------------------------- |
| `kb.collection.create`         | Create a new collection    |
| `kb.collection.remove`         | Remove a collection        |
| `kb.collection.get`            | Get collection details     |
| `kb.collection.exists`         | Check if collection exists |
| `kb.collection.list`           | List all collections       |
| `kb.collection.updatemetadata` | Update collection metadata |

## Document Processes

| Process                | Description              |
| ---------------------- | ------------------------ |
| `kb.documents.addfile` | Add a document from file |
| `kb.documents.addtext` | Add a document from text |
| `kb.documents.addurl`  | Add a document from URL  |

## Check Collection Exists

```typescript
// Process: kb.collection.exists
// Args[0]: collection_id (string) - Collection ID to check
// Returns: { collection_id: string, exists: boolean }

const result = Process('kb.collection.exists', 'my_collection_id');
console.log(result.exists); // true or false
```

### Example: Check KB Collection for User

```typescript
function checkKBCollection(ownerID: string): boolean {
  try {
    const collectionID = `expense_policy_${ownerID}`;
    const result = Process('kb.collection.exists', collectionID);

    return result && result.exists === true;
  } catch (e) {
    console.log(`checkKBCollection error: ${e}`);
    return false;
  }
}
```

## Create Collection

```typescript
// Process: kb.collection.create
// Args[0]: collection config object

const collection = Process('kb.collection.create', {
  collection_id: 'expense_policy_user123',
  name: 'Expense Policy',
  description: 'Company expense policies and guidelines',
  metadata: {
    owner_id: 'user123',
    type: 'policy'
  }
});
```

## Add Documents

### Add Text Document

```typescript
Process('kb.documents.addtext', {
  collection_id: 'expense_policy_user123',
  text: 'Company travel policy content...',
  metadata: {
    title: 'Travel Policy',
    category: 'travel'
  }
});
```

### Add File Document

```typescript
Process('kb.documents.addfile', {
  collection_id: 'expense_policy_user123',
  file_path: '/path/to/policy.pdf',
  metadata: {
    title: 'Expense Guidelines'
  }
});
```

### Add URL Document

```typescript
Process('kb.documents.addurl', {
  collection_id: 'expense_policy_user123',
  url: 'https://company.com/policies/expense.html',
  metadata: {
    source: 'company_website'
  }
});
```

## Collection ID Naming Convention

For user/team-specific collections, use a consistent naming pattern:

```
{purpose}_{owner_id}
```

Examples:

- `expense_policy_user123` - Personal user's expense policy
- `expense_policy_team456` - Team's expense policy
- `knowledge_base_user123` - User's general knowledge base

## Use Case: System Initialization Check

```typescript
function SystemReady(ctx: agent.Context): boolean {
  const ownerID = getOwnerID(ctx);
  if (!ownerID) return false;

  // Check if KB collection exists
  const hasKBCollection = checkKBCollection(ownerID);

  // Check if database setting exists
  const hasSettingRecord = checkSettingRecord(ownerID);

  // Both must exist for system to be ready
  return hasSettingRecord && hasKBCollection;
}

function checkKBCollection(ownerID: string): boolean {
  try {
    const collectionID = `expense_policy_${ownerID}`;
    const result = Process('kb.collection.exists', collectionID);
    return result && result.exists === true;
  } catch (e) {
    return false;
  }
}
```

## See Also

- [Agent Context API](./agent-context-api.md)
- [Process API](./process-api.md)
- [Model Definition](./model-definition.md)
