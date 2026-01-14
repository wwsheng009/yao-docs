# Yao Scopes & Permission Reference

## Overview

Yao uses a scope-based permission system for API access control. Scopes define what resources and actions are accessible to different users, teams, and clients.

## Scope Naming Convention

```
resource:action:level
```

| Part       | Examples                          | Description                 |
| ---------- | --------------------------------- | --------------------------- |
| `resource` | `vouchers`, `settings`, `reports` | The resource being accessed |
| `action`   | `read`, `write`, `delete`         | The operation type          |
| `level`    | `own`, `team`, `all`              | Access level                |

### Examples

| Scope                    | Description                   |
| ------------------------ | ----------------------------- |
| `collections:read:all`   | Read all collections          |
| `collections:read:own`   | Read only own collections     |
| `collections:read:team`  | Read team collections         |
| `collections:write:own`  | Create/update own collections |
| `collections:delete:own` | Delete own collections        |
| `documents:write:all`    | Create/update any document    |

---

## Directory Structure

Scope configurations are placed in `openapi/scopes/`:

```
openapi/scopes/
├── scopes.yml           # Global configuration and default policies
├── alias.yml            # Scope aliases for simplified permission management
└── <resource>/          # Resource-specific scope definitions
    ├── collections.yml  # Collections resource scopes
    ├── documents.yml    # Documents resource scopes
    └── ...
```

---

## Configuration Files

### 1. Global Configuration (`scopes.yml`)

Defines global ACL behavior, public endpoints, and default rules:

```yaml
# Default action for unmatched API endpoints
default: deny # Options: "deny" or "allow"

# Public endpoints (accessible without authentication)
public:
  - GET /user/entry
  - GET /user/entry/captcha
  - POST /user/entry/verify

# Default endpoint rules
endpoints:
  - GET /kb/* allow
  - POST /kb/* deny
  - PUT /kb/* deny
  - DELETE /kb/* deny
```

### 2. Scope Definitions (Resource Files)

Define specific permissions for resources:

```yaml
# openapi/scopes/expense/vouchers.yml
vouchers:read:own:
  description: 'Read own vouchers'
  owner: true # Sets OwnerOnly constraint
  endpoints:
    - GET /api/expense/vouchers/own
    - GET /api/expense/vouchers/own/:id

vouchers:read:team:
  description: 'Read team vouchers'
  team: true # Sets TeamOnly constraint
  endpoints:
    - GET /api/expense/vouchers/team
    - GET /api/expense/vouchers/team/:id

vouchers:write:own:
  description: 'Create/update own vouchers'
  owner: true
  editor: true
  endpoints:
    - POST /api/expense/vouchers
    - PUT /api/expense/vouchers/:id
```

### 3. Scope Aliases (`alias.yml`)

Group related scopes for role assignment:

```yaml
# openapi/scopes/alias.yml
expense:user:
  - vouchers:read:own
  - vouchers:write:own
  - settings:read:own
  - settings:write:own

expense:team:admin:
  - vouchers:read:team
  - vouchers:write:team
  - vouchers:delete:team
  - settings:read:team
  - settings:write:team

# System root permission
system:root:
  - '*:*:*'
```

---

## Data Access Constraints

Scopes can include data constraints that are automatically applied by ACL enforcement.

### Constraint Types

| Constraint  | Scope Field | Description                         | Filter Column      |
| ----------- | ----------- | ----------------------------------- | ------------------ |
| OwnerOnly   | `owner`     | Access only records created by user | `__yao_created_by` |
| CreatorOnly | `creator`   | Access only records created by user | `__yao_created_by` |
| EditorOnly  | `editor`    | Access only records last updated    | `__yao_updated_by` |
| TeamOnly    | `team`      | Access only records in current team | `__yao_team_id`    |

### Scope Definition with Constraints

```yaml
collections:read:own:
  owner: true # Sets OwnerOnly = true
  creator: true # Sets CreatorOnly = true
  description: 'Read own collections'
  endpoints:
    - GET /kb/collections/own
    - GET /kb/collections/own/:collectionID

collections:write:own:
  owner: true
  editor: true # Sets EditorOnly = true
  description: 'Write own collections'
  endpoints:
    - POST /kb/collections/own
    - PUT /kb/collections/own/:collectionID

collections:read:team:
  team: true # Sets TeamOnly = true
  description: 'Read team collections'
  endpoints:
    - GET /kb/collections/team
    - GET /kb/collections/team/:collectionID
```

### Extra Constraints

Custom constraints can be defined using the `extra` field:

```yaml
collections:read:department:
  extra:
    department_only: true
    region: 'us-west'
  description: 'Read collections for department in specific region'
  endpoints:
    - GET /kb/collections/department
```

---

## Using Constraints in Agent Hooks

The `ctx.authorized.constraints` object contains constraint flags set by ACL enforcement:

```typescript
interface DataConstraints {
  owner_only?: boolean;
  creator_only?: boolean;
  editor_only?: boolean;
  team_only?: boolean;
  extra?: Record<string, any>;
}
```

### Applying Constraints in Queries

```typescript
function getRecords(ctx) {
  const authorized = ctx.authorized;
  const constraints = authorized?.constraints || {};

  const wheres = [];

  // Owner-only access
  if (constraints.owner_only || constraints.creator_only) {
    wheres.push({ column: '__yao_created_by', value: authorized.user_id });
  }

  // Editor-only access
  if (constraints.editor_only) {
    wheres.push({ column: '__yao_updated_by', value: authorized.user_id });
  }

  // Team-only access
  if (constraints.team_only && authorized.team_id) {
    wheres.push({ column: '__yao_team_id', value: authorized.team_id });
  }

  // Extra constraints
  if (constraints.extra?.department_only) {
    // Apply department filter
  }

  return Process('models.agents.expense.voucher.Get', {
    select: ['id', 'name', 'amount'],
    wheres: wheres
  });
}
```

### Team-Based Access Pattern

```typescript
function getTeamRecords(ctx) {
  const authorized = ctx.authorized;
  const constraints = authorized?.constraints || {};

  if (constraints.team_only && authorized.team_id) {
    // Team member can see:
    // 1. Their own records
    // 2. Team records shared with team
    return Process('models.agents.expense.voucher.Get', {
      wheres: [
        {
          wheres: [
            { column: '__yao_created_by', value: authorized.user_id },
            {
              column: '__yao_team_id',
              value: authorized.team_id,
              method: 'orwhere'
            }
          ]
        }
      ]
    });
  }

  return [];
}
```

---

## ACL Enforcement Flow

The ACL system enforces permissions through multiple layers:

```
Request → Client Check → Token Scope Check → Team/User Check → Access Granted
```

### Enforcement Stages

| Stage  | Description                        |
| ------ | ---------------------------------- |
| Client | OAuth client permission check      |
| Scope  | Token scope validation             |
| Team   | Team permission check (if team_id) |
| Member | Team member permission check       |
| User   | User permission check (if user_id) |

### How Constraints Are Applied

1. ACL enforcement validates the request against scopes
2. If validation passes, constraints are extracted from matched endpoint
3. Constraints are stored in `ctx.authorized.constraints`
4. API handlers read constraints and apply data filters

---

## Wildcard Scopes

Wildcard scopes allow flexible permission matching:

```yaml
system:root:
  - '*:*:*' # Matches everything

blog:admin:
  - 'posts:*:*' # Matches all post operations
  - 'comments:*:*' # Matches all comment operations

kb:read:
  - 'collections:read:*' # Matches collections:read:all, collections:read:own, etc.
```

### Matching Rules

| Pattern        | Matches                        |
| -------------- | ------------------------------ |
| `*:*:*`        | Any scope                      |
| `posts:*:*`    | Any action and level for posts |
| `posts:read:*` | Any level for posts read       |

**Note**: Use wildcards sparingly and only for system-level access.

---

## Complete Example

### Scope Definition

```yaml
# openapi/scopes/expense/vouchers.yml
vouchers:read:own:
  description: 'Read own vouchers'
  owner: true
  endpoints:
    - GET /api/expense/vouchers/own
    - GET /api/expense/vouchers/own/:id

vouchers:read:team:
  description: 'Read team vouchers'
  team: true
  endpoints:
    - GET /api/expense/vouchers/team
    - GET /api/expense/vouchers/team/:id

vouchers:write:own:
  description: 'Create/update own vouchers'
  owner: true
  editor: true
  endpoints:
    - POST /api/expense/vouchers
    - PUT /api/expense/vouchers/:id

vouchers:delete:own:
  description: 'Delete own vouchers'
  owner: true
  endpoints:
    - DELETE /api/expense/vouchers/:id
```

### Scope Aliases

```yaml
# openapi/scopes/alias.yml
expense:user:
  - vouchers:read:own
  - vouchers:write:own

expense:team:member:
  - vouchers:read:team
  - vouchers:write:own

expense:team:admin:
  - vouchers:read:team
  - vouchers:write:team
  - vouchers:delete:team
```

### Agent Hook Implementation

```typescript
function Next(ctx, payload) {
  const authorized = ctx.authorized;
  if (!authorized) return null;

  const constraints = authorized.constraints || {};
  const wheres = [];

  // Apply constraint-based filtering
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
  } else if (constraints.owner_only) {
    wheres.push({ column: '__yao_created_by', value: authorized.user_id });
    wheres.push({ column: '__yao_team_id', op: 'null' });
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

---

## Best Practices

### 1. Use Consistent Naming

```yaml
# Good: resource:action:level pattern
vouchers:read:own
vouchers:write:team
settings:delete:all

# Bad: inconsistent naming
read_vouchers
voucherWrite
```

### 2. Set Appropriate Constraints

| Scenario                   | Constraint  | Description                 |
| -------------------------- | ----------- | --------------------------- |
| Personal settings          | `OwnerOnly` | Only user can access        |
| Team shared resources      | `TeamOnly`  | All team members can access |
| User-created, team-visible | Both        | Creator owns, team can view |

### 3. Use Aliases for Role Management

```yaml
# Group related scopes
expense:viewer:
  - vouchers:read:own
  - reports:read:own

expense:editor:
  - vouchers:read:own
  - vouchers:write:own
  - reports:read:own
```

### 4. Apply Constraints in All Handlers

```typescript
// Always check constraints before returning data
function safeQuery(ctx) {
  const constraints = ctx.authorized?.constraints || {};

  if (constraints.owner_only) {
    // Filter by owner
  } else if (constraints.team_only) {
    // Filter by team
  }
  // Never return unfiltered data
}
```

---

## See Also

- [Model Definition](./model-definition.md) - Permission columns and AccessScope
- [Agent Context API](./agent-context-api.md) - Authorization and constraints
- [Process API](./process-api.md) - Model CRUD operations
