# SUI Reference

> SUI (Simple User Interface) - Full-stack web framework for HTML/CSS/TypeScript without build tools.

## Directory Structure

```
/templates/<template>/
├── __document.html          # Global HTML wrapper (contains {{ __page }})
├── __data.json              # Global data (accessible via $global)
├── __assets/                # Static assets (reference via @assets/)
├── __locales/               # Global i18n files (.yml)
└── pages/                   # All pages go here
    └── <page>/              # Route = folder name (can be nested: foo/bar/page)
        ├── <page>.html          # Template (filename must match folder name)
        ├── <page>.css           # Styles (auto-scoped)
        ├── <page>.ts            # Frontend script (NOT auto-compiled, use .js for runtime)
        ├── <page>.json          # Data config
        ├── <page>.config        # Page config (title, guard, cache)
        ├── <page>.backend.ts    # Server-side script
        └── __locales/           # Page-level i18n files
```

**Agent SUI** (for AI assistants):

```
/agent/template/             # Global template (shared across all assistants)
├── __document.html
├── __data.json
├── __assets/
└── pages/                   # Global pages (401, 404, etc.)
    └── <page>/

/assistants/<name>/pages/    # Assistant pages → /agents/<name>/<route>
└── <page>/                  # Can be nested: foo/bar/page → /agents/<name>/foo/bar/page
```

## Template Syntax

### Data Binding

```html
{{ name }}
<!-- Variable -->
{{ user.email }}
<!-- Nested -->
{{ title ?? 'Default' }}
<!-- Default value -->
{{ price * quantity }}
<!-- Expression -->
{{ count > 0 ? 'Yes' : 'No' }}
<!-- Ternary -->
```

### Conditionals

```html
<div s:if="{{ isActive }}">Active</div>
<div s:elif="{{ isPending }}">Pending</div>
<div s:else>Unknown</div>
```

### Loops

```html
<li s:for="{{ items }}" s:for-item="item" s:for-index="i">
  {{ i }}: {{ item.name }}
</li>
```

### Attributes

```html
<button s:attr-disabled="{{ !isValid }}">Submit</button>
<div s:raw="true">{{ htmlContent }}</div>
<s:set name="total" value="{{ price * qty }}" />
```

### Expression Functions

SUI uses [Expr](https://expr-lang.org/) v1.17. Custom functions:

| Function   | Example                           |
| ---------- | --------------------------------- |
| `P_(...)`  | `{{ P_('models.user.Find', 1) }}` |
| `True(v)`  | `{{ True(user) }}`                |
| `False(v)` | `{{ False(error) }}`              |
| `Empty(v)` | `{{ Empty(items) }}`              |

Common Expr functions: `len()`, `filter()`, `map()`, `find()`, `count()`, `sum()`, `first()`, `last()`, `contains()`, `upper()`, `lower()`, `trim()`, `split()`, `join()`

## Components

**Every page is a component.** Use `is` attribute to embed:

```html
<!-- Direct usage -->
<div is="/card" title="My Card"><p>Content</p></div>

<!-- With import alias (case-sensitive!) -->
<import s:as="Card" s:from="/card" />
<Card title="My Card"><p>Content</p></Card>
```

### Slots

```html
<!-- Component: /modal/modal.html -->
<div class="modal">
  <slot name="header"></slot>
  <children></children>
  <slot name="footer"></slot>
</div>

<!-- Usage -->
<div is="/modal">
  <slot name="header"><h2>Title</h2></slot>
  <p>Body content</p>
  <slot name="footer"><button>OK</button></slot>
</div>
```

## Events

```html
<button
  s:on-click="HandleClick"
  s:data-id="{{ item.id }}"
  s:json-item="{{ item }}"
>
  Click
</button>
```

**Direct style** (simple pages):

```typescript
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#myForm') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Handle submission
  });
});
```

**Component style** (interactive pages):

```typescript
import { $Backend, Component, EventData } from '@yao/sui';

const self = this as Component;

self.HandleClick = async (event: Event, data: EventData) => {
  const id = data.id; // from s:data-id
  const item = data.item; // from s:json-item
  await $Backend().Call('Delete', id);
};

// State watchers
self.watch = {
  count: (value: number) => {
    self.root.querySelector('.count')!.textContent = String(value);
  }
};
```

## Backend Script

**`<page>.backend.ts`**:

> **⚠️ Important Notes:**
>
> - Backend scripts do NOT support ES Module `export` syntax. Simply define functions directly.
> - `$param`, `$query` etc. are NOT available as global variables. Access via `request` parameter.

```typescript
// Constants available in frontend
const __sui_constants = { API_URL: '/api' };

// Helper functions exported to frontend
const __sui_helpers = ['formatDate'];
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString();
}

// Called before render (data merged with page data)
function BeforeRender(
  request: Request,
  props?: Record<string, any>
): Record<string, any> {
  return {
    user: Process('session.Get', 'user'),
    items: Process('models.item.Get', { limit: 10 })
  };
}

// API methods (callable from frontend as $Backend().Call("GetItems", ...))
// Backend automatically adds "Api" prefix - frontend calls without it
function ApiGetItems(page: number, request: Request): any {
  return Process('models.item.Paginate', { page, pageSize: 10 });
}
```

### Data Binding Methods (Called from `.json`)

Use `@MethodName` in `.json` to call backend functions. **Request is appended as the last argument:**

| Call Source                  | Function Name   | Example Call                    |
| ---------------------------- | --------------- | ------------------------------- |
| Frontend `$Backend().Call()` | `ApiMethodName` | `$Backend().Call("MethodName")` |
| `.json` data binding         | `MethodName`    | `"$data": "@MethodName"`        |
| Before render                | `BeforeRender`  | Automatic                       |

**Example:**

```json
{
  "$record": "@GetRecord",
  "$items": { "process": "@GetItems", "args": ["active", 20] }
}
```

```typescript
// "$record": "@GetRecord" → receives (request)
function GetRecord(request: Request): any {
  const id = request.params.id; // Access route params via request!
  return Process('models.record.Find', id);
}

// { "process": "@GetItems", "args": ["active", 20] } → receives ("active", 20, request)
function GetItems(status: string, limit: number, request: Request): any[] {
  return Process('models.item.Get', {
    wheres: [{ column: 'status', value: status }],
    limit: limit
  });
}
```

> **Common Mistake:** `$param.id` does NOT work in backend scripts. Use `request.params.id`.

## Data Sources

### Built-in Variables

| Variable     | Description                               |
| ------------ | ----------------------------------------- |
| `$query`     | URL query params                          |
| `$param`     | Route params                              |
| `$payload`   | POST body                                 |
| `$cookie`    | Cookies                                   |
| `$url`       | URL info (.path, .host, .domain, .scheme) |
| `$theme`     | Current theme ('light' or 'dark')         |
| `$locale`    | Current locale (e.g., 'zh-CN', 'en-US')   |
| `$direction` | Text direction ('ltr' or 'rtl')           |
| `$global`    | From `__data.json`                        |
| `$auth`      | OAuth info (if guard="oauth")             |

### Page Data (`<page>.json`)

```json
{
  "title": "Page Title",
  "$users": "models.user.Get",
  "$user": { "process": "models.user.Find", "args": ["$param.id"] }
}
```

## Frontend API

```typescript
import { $Backend, Component } from '@yao/sui';

const self = this as Component;

// Backend call (calls ApiGetUsers in backend, without "Api" prefix)
const users = await $Backend().Call('GetUsers');

// Render target
await self.render('userList', { users });

// Component query
const card = $$('#my-card');
card.query('.title');
card.queryAll('.item');

// OpenAPI client
const api = new OpenAPI({ baseURL: '/api' });
const res = await api.Get<User[]>('/users');
if (api.IsError(res)) {
  console.error(res.error);
}

// File upload
const fileApi = new FileAPI(api);
await fileApi.Upload(file, { path: 'uploads' }, (p) =>
  console.log(p.percentage)
);
```

## i18n (Internationalization)

### Server-Side Translation (s:trans)

`s:trans` is **server-side rendered**. The translation happens when the page is generated on the server. To apply locale changes, the page must be reloaded.

```html
<span s:trans>Hello World</span>
```

### Dynamic Translation ({{ '::text' }})

For text inside attributes or dynamic content:

```html
<input placeholder="{{ '::Enter your name' }}" />
```

### Locale Files

Locale files can be placed at:

1. **Page-level**: `<page>/__locales/zh-cn.yml` (highest priority)
2. **Template-level**: `__locales/zh-cn.yml`

**File format:**

```yaml
messages:
  Hello World: 你好世界
  Welcome: 欢迎
  Enter your name: 请输入您的姓名

script_messages:
  'Confirm?': '确定吗？'
```

### Locale Detection

SUI reads locale from the `locale` HTTP cookie. To change locale and have `s:trans` reflect the change, you must:

1. Set the `locale` cookie
2. Reload the page

```javascript
// Set locale cookie and reload
document.cookie = 'locale=zh-CN;path=/;max-age=31536000';
location.reload();
```

## Theming

### CSS Variables

Define CSS variables in your global stylesheet. Use `data-theme` attribute for theme switching:

```css
:root {
  --color_primary: #3371fc;
  --color_bg: #ffffff;
  --color_text: #1f2937;
}

[data-theme='dark'] {
  --color_primary: #4580ff;
  --color_bg: #0a0a0a;
  --color_text: #f3f4f6;
}
```

### Using Theme in Templates

```html
<html lang="{{ $locale }}" data-theme="{{ $theme }}">
  <body data-theme="{{ $theme }}" dir="{{ $direction }}">
    {{ __page }}
  </body>
</html>
```

### Theme Switching

Theme can be switched client-side by changing the `data-theme` attribute:

```javascript
document.documentElement.setAttribute('data-theme', 'dark');
```

## Routing

### Dynamic Routes

Use `[param]` folders for dynamic route segments:

```
/pages/users/[id]/           → /users/123      → $param.id = "123"
/pages/posts/[slug]/         → /posts/hello    → $param.slug = "hello"
/pages/[category]/[id]/      → /news/456       → $param.category = "news", $param.id = "456"
```

### URL Rewriting (app.yao)

SUI requires URL rewriting to map URLs to `.sui` files. Configure in `app.yao`:

```json
{
  "public": {
    "rewrite": [
      { "^\\/assets\\/(.*)$": "/assets/$1" },
      { "^\\/users\\/([^\\/]+)$": "/users/[id].sui" },
      { "^\\/posts\\/([^\\/]+)\\/edit$": "/posts/[id]/edit.sui" },
      { "^\\/(.*)$": "/$1.sui" }
    ]
  }
}
```

**Rules:**

- Processed top-to-bottom, first match wins
- Place specific routes before general ones
- Catch-all `/$1.sui` must be last
- Use `([^\\/]+)` to match a single segment

### Route Parameters Access

| Context        | Method              | Example                         |
| -------------- | ------------------- | ------------------------------- |
| HTML Template  | `{{ $param.id }}`   | `<h1>{{ $param.id }}</h1>`      |
| `.json` Config | `"$param.id"`       | `"userId": "$param.id"`         |
| Backend Script | `request.params.id` | `const id = request.params.id;` |
| Frontend       | DOM data attribute  | `el.dataset.id`                 |

## Assets Reference

Use `@assets/` prefix to reference files in `__assets/` directory:

```html
<link rel="stylesheet" href="@assets/css/styles.css" />
<script src="@assets/js/app.js"></script>
<img src="@assets/images/logo.png" />
```

## TypeScript in Frontend

**Important:** Frontend `.ts` files are NOT automatically compiled. For runtime JavaScript:

1. Use `.js` files directly, OR
2. Use `.ts` for type checking during development, but ensure there's a compiled `.js` for runtime

**Type Declarations:**

For global JavaScript APIs (like custom libraries), create `.d.ts` files and reference them:

```typescript
/// <reference path="../../__assets/js/my-lib.d.ts" />
import { Component } from '@yao/sui';

const self = this as Component;
// Now TypeScript knows about global types
```

## CUI Integration

When SUI pages are embedded in CUI via `/web/` routes:

```typescript
// Helper: Send action to CUI parent
const sendAction = (name: string, payload?: any) => {
  window.parent.postMessage(
    { type: 'action', message: { name, payload } },
    window.location.origin
  );
};

// Show notification
sendAction('notify.success', { message: 'Done!' });

// Navigate
sendAction('navigate', { route: '/agents/my-app/detail', title: 'Details' });

// Receive context from CUI
window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin) return;
  if (e.data.type === 'setup') {
    const { theme, locale } = e.data.message;
    document.documentElement.setAttribute('data-theme', theme);
  }
});
```

**Actions:** `navigate`, `navigate.back`, `notify.success/error/warning/info`, `app.menu.reload`, `modal.open/close`, `table.search/refresh`, `form.submit/reset`, `event.emit`, `confirm`

## Commands

```bash
yao sui build <sui> [template]     # Build
yao sui build <sui> [template] -D  # Debug mode
yao sui watch <sui> [template]     # Watch
yao sui build agent                # Build Agent SUI
yao sui trans <sui> <template>     # Extract translations
```

## Common Pitfalls

### 1. s:trans Not Updating After Locale Change

`s:trans` is server-side rendered. Changing locale via JavaScript only affects `localStorage`/cookies but doesn't re-render the page. **Solution:** Reload the page after changing locale.

### 2. Locale Cookie vs localStorage

SUI server reads locale from the `locale` HTTP cookie, not `localStorage`. If you only set `localStorage`, server-side translations won't work. **Solution:** Always set the `locale` cookie when changing locale.

### 3. TypeScript Files Not Working at Runtime

Frontend `.ts` files are for development type checking only. They are not compiled at runtime. **Solution:** Use `.js` files with JSDoc comments for type hints, or ensure `.ts` files are compiled.

### 4. Missing Global Data

Global data from `__data.json` is accessed via `$global`, not directly. **Example:** `{{ $global.title }}` not `{{ title }}` (unless title is also in page data).

### 5. Asset Paths

Always use `@assets/` prefix for assets in `__assets/` directory. Relative paths won't work correctly across different routes.

## Quick Examples

### Simple Page

**`/home/home.html`**:

```html
<div class="home">
  <h1>{{ title }}</h1>
  <ul>
    <li s:for="{{ items }}" s:for-item="item">{{ item.name }}</li>
  </ul>
  <div s:if="{{ Empty(items) }}">No items</div>
</div>
```

**`/home/home.backend.ts`**:

```typescript
function BeforeRender(request: Request): Record<string, any> {
  return {
    title: 'My Page',
    items: Process('models.item.Get', { limit: 10 })
  };
}

function ApiAddItem(name: string, request: Request): any {
  return Process('models.item.Create', { name });
}
```

**`/home/home.ts`**:

```typescript
import { $Backend, Component } from '@yao/sui';

const self = this as Component;

self.AddItem = async (event: Event) => {
  const input = self.root.querySelector('input') as HTMLInputElement;
  await $Backend().Call('AddItem', input.value);
  location.reload();
};
```

### Page Config

**`/home/home.config`**:

```json
{
  "title": "Home",
  "guard": "bearer-jwt",
  "cache": 3600,
  "dataCache": 60
}
```
