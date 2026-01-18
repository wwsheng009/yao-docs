# TUI JavaScript/TypeScript 脚本集成指南

## 概述

TUI 引擎集成了 V8 JavaScript/TypeScript 运行时，允许开发者使用 JS/TS 脚本处理复杂的交互逻辑。此功能提供了强大的状态管理和事件处理能力，使 TUI 应用更加动态和响应式。

## 核心概念

### TUI JavaScript 对象

当脚本执行时，TUI 引擎会将一个上下文对象作为第一个参数传递给脚本函数。该上下文对象包含一个 `tui` 子对象，提供以下方法：

- **上下文访问**: `ctx.tui`
  - `ctx` 是传递给每个脚本函数的第一个参数
  - `tui` 是 `ctx` 对象的一个属性，提供对 TUI 功能的访问

**示例**:

```javascript
// 脚本函数接收 ctx 对象作为第一个参数
function myScript(ctx, additionalParam) {
  // 通过 ctx.tui 访问 TUI 功能
  const count = ctx.tui.GetState('count');

  // 更新状态
  ctx.tui.SetState('count', count + 1);
}
```

### 访问方式

**全局变量**: `ctx` （通过 V8Go 注入）

在早期的版本中，TUI 对象可能作为全局变量直接访问，但推荐的访问方式是通过上下文对象：

```javascript
// 推荐方式：通过 ctx.tui 访问
function myFunction(ctx) {
  ctx.tui.GetState('key');
}

// 如果需要调试，可以检查全局作用域
function debugFunction(ctx) {
  console.log('Available globals:', Object.keys(this));
  // 可能看到 'ctx' 和其他可能的变量
}
```

### 属性

#### `ctx.tui.id`

- **类型**: `string`
- **描述**: 当前 TUI 配置的名称

#### `ctx.tui.width` / `ctx.tui.height`

- **类型**: `number`
- **描述**: 当前终端窗口尺寸
- **注意**: 这些值在窗口大小变化事件后更新

## API 方法详解

### 状态管理

#### `ctx.tui.GetState([key])`

- **参数**:
  - `key` (可选): 字符串，状态键名。支持点符号访问嵌套属性（如 `"user.name"`）
- **返回**: 对应的状态值，如果未提供键则返回整个状态对象
- **描述**: 获取当前状态值
- **示例**:

  ```javascript
  // 获取单个状态值
  const count = ctx.tui.GetState('count');

  // 获取嵌套状态值
  const userName = ctx.tui.GetState('user.name');

  // 获取所有状态
  const allState = ctx.tui.GetState();
  ```

#### `ctx.tui.SetState(key, value[, targetID[, response]])`

- **参数**:
  - `key`: 字符串，状态键名
  - `value`: 任意类型，要设置的值
  - `targetID` (可选): 字符串，目标组件 ID（用于定向消息）
  - `response` (可选): 字符串，响应类型（`"handled"`, `"ignored"`, `"broadcast"`）
- **描述**: 设置单个状态值并触发 UI 更新
- **响应类型**:
  - `"handled"` (默认): 组件已处理并截获，消息停止分发
  - `"ignored"`: 组件不感兴趣，消息应继续传递
  - `"broadcast"`: 消息继续传递给所有组件
- **示例**:

  ```javascript
  // 设置简单值
  ctx.tui.SetState('count', 5);

  // 设置对象
  ctx.tui.SetState('user', { name: 'John', age: 30 });

  // 设置嵌套值（整个对象会被替换）
  ctx.tui.SetState('user.profile', { city: 'New York' });

  // 定向设置到特定组件
  ctx.tui.SetState('input1', 'new value', 'comp1', 'handled');
  ```

#### `ctx.tui.UpdateState(newStateObject[, targetID[, response]])`

- **参数**:
  - `newStateObject`: 对象，包含多个状态键值对
  - `targetID` (可选): 字符串，目标组件 ID（用于定向消息）
  - `response` (可选): 字符串，响应类型
- **描述**: 批量更新多个状态值并触发 UI 更新
- **最佳实践**: 使用 `UpdateState` 批量更新相关状态，减少 UI 重绘次数
- **示例**:

  ```javascript
  // 批量更新状态
  ctx.tui.UpdateState({
    count: 10,
    title: 'New Title',
    user: { name: 'Jane', age: 25 }
  });

  // 带响应类型的批量更新
  ctx.tui.UpdateState({ status: 'updated' }, null, 'broadcast');
  ```

### Action 执行

#### `ctx.tui.ExecuteAction(actionDefinition[, targetID[, response]])`

- **参数**:
  - `actionDefinition`: 对象，定义要执行的动作
  - `targetID` (可选): 字符串，目标组件 ID
  - `response` (可选): 字符串，响应类型
- **描述**: 执行一个动作（可能是 Process 或 Script）
- **Action 结构**:
  ```typescript
  {
    process?: string;    // Yao Process 名称
    script?: string;    // 脚本文件路径
    method?: string;    // 脚本方法名
    args?: any[];       // 参数数组
    onSuccess?: string; // 成功回调状态键
    onError?: string;   // 错误回调状态键
  }
  ```
- **示例**:

  ```javascript
  // 执行另一个脚本
  ctx.tui.ExecuteAction({
    script: 'scripts/tui/helper',
    method: 'doSomething'
  });

  // 执行 Process
  ctx.tui.ExecuteAction({
    process: 'models.user.save',
    args: [userId, userData]
  });

  // 带参数的 Action
  ctx.tui.ExecuteAction(
    {
      process: 'api.getData',
      args: [{ limit: 10 }],
      onSuccess: 'data'
    },
    null,
    'handled'
  );
  ```

### UI 控制

#### `ctx.tui.Refresh()`

- **描述**: 强制刷新 UI
- **示例**:
  ```javascript
  // 手动触发 UI 刷新
  ctx.tui.Refresh();
  ```

#### `ctx.tui.Quit()`

- **描述**: 退出 TUI 应用
- **示例**:
  ```javascript
  // 退出应用
  ctx.tui.Quit();
  ```

#### `ctx.tui.Interrupt()`

- **描述**: 中断 TUI 应用
- **示例**:
  ```javascript
  // 中断应用
  ctx.tui.Interrupt();
  ```

#### `ctx.tui.Suspend()`

- **描述**: 暂停 TUI 应用
- **示例**:
  ```javascript
  // 暂停应用
  ctx.tui.Suspend();
  ```

#### `ctx.tui.ClearScreen()`

- **描述**: 清除屏幕内容
- **示例**:
  ```javascript
  // 清屏
  ctx.tui.ClearScreen();
  ```

#### `ctx.tui.EnterAltScreen()`

- **描述**: 进入备用屏幕模式
- **示例**:
  ```javascript
  // 进入备用屏幕
  ctx.tui.EnterAltScreen();
  ```

#### `ctx.tui.ExitAltScreen()`

- **描述**: 退出备用屏幕模式
- **示例**:
  ```javascript
  // 退出备用屏幕
  ctx.tui.ExitAltScreen();
  ```

#### `ctx.tui.ShowCursor()`

- **描述**: 显示光标
- **示例**:
  ```javascript
  // 显示光标
  ctx.tui.ShowCursor();
  ```

#### `ctx.tui.HideCursor()`

- **描述**: 隐藏光标
- **示例**:
  ```javascript
  // 隐藏光标
  ctx.tui.HideCursor();
  ```

### 焦点管理

#### `ctx.tui.SetFocus(componentID)`

- **参数**:
  - `componentID`: 字符串，组件 ID
- **描述**: 设置焦点到指定组件
- **示例**:
  ```javascript
  // 设置焦点到特定组件
  ctx.tui.SetFocus('input1');
  ctx.tui.SetFocus('table1');
  ```

#### `ctx.tui.FocusNextInput([targetID])`

- **参数**:
  - `targetID` (可选): 字符串，目标组件 ID
- **描述**: 聚焦下一个输入组件
- **示例**:

  ```javascript
  // 聚焦下一个输入
  ctx.tui.FocusNextInput();

  // 聚焦到指定组件
  ctx.tui.FocusNextInput('input2');
  ```

#### `ctx.tui.SubmitForm()`

- **描述**: 提交表单（收集所有输入值）
- **示例**:
  ```javascript
  // 提交表单
  ctx.tui.SubmitForm();
  ```

### 事件系统

#### `ctx.tui.PublishEvent(componentID, action, data)`

- **参数**:
  - `componentID`: 字符串，发布事件的组件 ID
  - `action`: 字符串，事件名称
  - `data` (可选): 任意类型，事件数据
- **描述**: 发布事件到事件总线
- **示例**:

  ```javascript
  // 发布自定义事件
  ctx.tui.PublishEvent('myComponent', 'CUSTOM_EVENT', { data: 'value' });

  // 发布标准事件
  ctx.tui.PublishEvent('table1', 'ROW_SELECTED', { rowIndex: 5 });
  ```

#### `ctx.tui.SubscribeToEvent(action, callbackFunction)`

- **参数**:
  - `action`: 字符串，要订阅的事件名称
  - `callbackFunction`: 函数，事件回调函数
- **描述**: 订阅事件，当事件触发时调用回调
- **事件消息结构**:
  ```typescript
  {
    id: string; // 触发事件的组件 ID
    action: string; // 事件名称
    data: any; // 事件数据
  }
  ```
- **示例**:

  ```javascript
  // 订阅事件
  ctx.tui.SubscribeToEvent('ROW_SELECTED', (msg) => {
    console.log('Row selected:', msg.data.rowIndex);
    // 根据选择更新 UI
    ctx.tui.SetState('selectedRow', msg.data.rowIndex);
  });

  // 订阅多个事件
  ctx.tui.SubscribeToEvent('CHAT_MESSAGE_SENT', (msg) => {
    console.log('Message sent:', msg.data.content);
  });

  ctx.tui.SubscribeToEvent('CHAT_MESSAGE_RECEIVED', (msg) => {
    console.log('Message received:', msg.data.content);
    ctx.tui.Refresh();
  });
  ```

## 文件结构

TUI 脚本遵循以下目录结构：

```
apps/
├── tui_app/
│   ├── scripts/
│   │   └── tui/          # TUI 脚本目录
│   │       ├── counter.ts
│   │       ├── form.ts
│   │       ├── todo.ts
│   │       └── utils.ts
│   └── tuis/             # TUI 配置文件
│       ├── counter.tui.yao
│       └── form.tui.yao
```

## 配置 TUI 与脚本关联

在 `.tui.yao` 配置文件中，可以通过 `bindings` 属性将按键与脚本方法关联：

```json
{
  "name": "Counter Demo",
  "data": { "count": 0 },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": { "title": "Counter: {{count}}" }
      },
      {
        "type": "text",
        "props": {
          "content": "Press '+' to increment, '-' to decrement, 'r' to reset, 'q' to quit"
        }
      }
    ]
  },
  "bindings": {
    "+": { "script": "scripts/tui/counter", "method": "increment" },
    "-": { "script": "scripts/tui/counter", "method": "decrement" },
    "r": { "script": "scripts/tui/counter", "method": "reset" }
  }
}
```

## 完整示例

### 示例 1: 计数器

**脚本文件**: `scripts/tui/counter.ts`

```typescript
/**
 * 增加计数器
 */
function increment(ctx) {
  if (!ctx) {
    console.log('increment called without context');
    return;
  }

  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count + 1);
}

/**
 * 减少计数器
 */
function decrement(ctx) {
  if (!ctx) {
    console.log('decrement called without context');
    return;
  }

  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count - 1);
}

/**
 * 重置计数器
 */
function reset(ctx) {
  if (!ctx) {
    console.log('reset called without TUI context');
    return;
  }

  ctx.tui.SetState('count', 0);
}
```

### 示例 2: 待办事项列表

**脚本文件**: `scripts/tui/todo.ts`

```typescript
/**
 * 添加新的待办事项
 */
function addItem(ctx, item) {
  if (!ctx || !item) {
    console.log('addItem called with invalid parameters');
    return;
  }

  // 获取当前待办事项列表
  const todos = ctx.tui.GetState('todos') || [];

  // 添加新项目
  todos.push({
    id: Date.now(),
    text: item,
    completed: false
  });

  // 更新状态
  ctx.tui.UpdateState({ todos: todos });
}

/**
 * 切换待办事项完成状态
 */
function toggleItem(ctx, id) {
  if (!ctx || id === undefined) {
    console.log('toggleItem called with invalid parameters');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const updatedTodos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  ctx.tui.SetState('todos', updatedTodos);
}

/**
 * 删除待办事项
 */
function deleteItem(ctx, id) {
  if (!ctx || id === undefined) {
    console.log('deleteItem called with invalid parameters');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const filteredTodos = todos.filter((todo) => todo.id !== id);

  ctx.tui.SetState('todos', filteredTodos);
}

/**
 * 清除所有已完成的待办事项
 */
function clearCompleted(ctx) {
  if (!ctx) {
    console.log('clearCompleted called without TUI context');
    return;
  }

  const todos = ctx.tui.GetState('todos') || [];
  const activeTodos = todos.filter((todo) => !todo.completed);

  ctx.tui.SetState('todos', activeTodos);
}
```

### 示例 3: 表单处理

**脚本文件**: `scripts/tui/form.ts`

```typescript
/**
 * 验证表单
 */
function validateForm(ctx) {
  if (!ctx) {
    return;
  }

  const name = ctx.tui.GetState('name-input');
  const email = ctx.tui.GetState('email-input');

  const errors = {};

  if (!name || name.trim().length === 0) {
    errors['name'] = 'Name is required';
  }

  if (!email || !email.includes('@')) {
    errors['email'] = 'Invalid email';
  }

  if (Object.keys(errors).length > 0) {
    ctx.tui.SetState('errors', errors);
    return false;
  }

  ctx.tui.SetState('errors', null);
  return true;
}

/**
 * 提交表单
 */
function submitForm(ctx) {
  if (!ctx) {
    console.log('submitForm called without context');
    return;
  }

  // 验证表单
  if (!validateForm(ctx)) {
    return;
  }

  // 收集表单数据
  const formData = {
    name: ctx.tui.GetState('name-input'),
    email: ctx.tui.GetState('email-input'),
    timestamp: Date.now()
  };

  // 执行 Process 保存数据
  ctx.tui.ExecuteAction({
    process: 'models.user.create',
    args: [formData],
    onSuccess: 'submitResult'
  });
}

/**
 * 重置表单
 */
function resetForm(ctx) {
  if (!ctx) {
    return;
  }

  ctx.tui.UpdateState({
    'name-input': '',
    'email-input': '',
    errors: null,
    submitResult: null
  });
}
```

### 示例 4: 表格行选择处理

**脚本文件**: `scripts/tui/table.ts`

```typescript
/**
 * 订阅表格行选择事件
 */
function handleRowSelection(ctx) {
  if (!ctx) {
    return;
  }

  ctx.tui.SubscribeToEvent('ROW_SELECTED', (msg) => {
    console.log('Row selected:', msg.data.rowIndex);
    console.log('Row data:', msg.data.rowData);

    // 更新状态以显示选中行的详细信息
    ctx.tui.UpdateState({
      selectedRow: msg.data.rowIndex,
      selectedData: msg.data.rowData
    });

    // 刷新 UI
    ctx.tui.Refresh();
  });
}

/**
 * 初始化表格
 */
function initTable(ctx) {
  if (!ctx) {
    return;
  }

  // 设置事件订阅
  handleRowSelection(ctx);
}
```

### 示例 5: 聊天集成

**脚本文件**: `scripts/tui/chat.ts`

```typescript
/**
 * 发送聊天消息
 */
function sendMessage(ctx) {
  if (!ctx) {
    return;
  }

  // 订阅消息接收事件
  ctx.tui.SubscribeToEvent('CHAT_MESSAGE_RECEIVED', (msg) => {
    console.log('AI response:', msg.data.content);
  });

  // 订阅消息发送事件
  ctx.tui.SubscribeToEvent('CHAT_MESSAGE_SENT', (msg) => {
    console.log('Message sent:', msg.data.content);
  });
}

/**
 * 处理用户输入
 */
function handleUserInput(ctx, message) {
  if (!ctx || !message) {
    return;
  }

  // 添加用户消息到聊天
  ctx.tui.PublishEvent('chatComponent', 'CHAT_MESSAGE_SENT', {
    role: 'user',
    content: message
  });

  // 调用 AI Process
  ctx.tui.ExecuteAction({
    process: 'ai.chat',
    args: [message],
    onSuccess: 'aiResponse'
  });
}
```

## 事件系统详解

### 标准事件类型

| 事件名称                | 描述         | 数据字段                                                          |
| ----------------------- | ------------ | ----------------------------------------------------------------- |
| `FORM_SUBMIT_SUCCESS`   | 表单提交成功 | `formID`, `timestamp`                                             |
| `FORM_SUBMIT`           | 表单提交     | `formID`, `data`                                                  |
| `FORM_CANCEL`           | 表单取消     | `formID`, `reason`                                                |
| `FORM_VALIDATION_ERROR` | 表单验证错误 | `formID`, `errors`                                                |
| `ROW_SELECTED`          | 行选中       | `rowIndex`, `rowData`, `tableID`, `navigationKey`, `isNavigation` |
| `ROW_DOUBLE_CLICKED`    | 行双击       | `rowIndex`, `rowData`, `tableID`, `trigger`                       |
| `CELL_EDITED`           | 单元格编辑   | `rowIndex`, `columnKey`, `oldValue`, `newValue`                   |
| `NEW_ITEM_REQUESTED`    | 新项目请求   | `itemType`, `data`                                                |
| `ITEM_DELETED`          | 项目删除     | `itemID`, `data`                                                  |
| `ITEM_SAVED`            | 项目保存     | `itemID`, `data`                                                  |
| `FOCUS_CHANGED`         | 焦点变化     | `focused`                                                         |
| `FOCUS_NEXT`            | 焦点到下一个 | -                                                                 |
| `FOCUS_PREV`            | 焦点到上一个 | -                                                                 |
| `TAB_PRESSED`           | Tab 键按下   | -                                                                 |
| `ESCAPE_PRESSED`        | Esc 键按下   | -                                                                 |
| `MENU_ITEM_SELECTED`    | 菜单项选中   | `item`, `action`, `path`, `level`                                 |
| `MENU_ACTION_TRIGGERED` | 菜单动作触发 | `item`, `action`, `path`, `level`                                 |
| `MENU_NAVIGATE`         | 菜单导航     | `direction`, `key`                                                |
| `MENU_SUBMENU_ENTERED`  | 进入子菜单   | `item`, `parentPath`, `currentPath`, `level`                      |
| `MENU_SUBMENU_EXITED`   | 退出子菜单   | `previousPath`, `currentPath`, `level`                            |
| `INPUT_VALUE_CHANGED`   | 输入值变化   | `oldValue`, `newValue`                                            |
| `INPUT_FOCUS_CHANGED`   | 输入焦点变化 | `focused`                                                         |
| `INPUT_ENTER_PRESSED`   | 输入回车键   | `value`                                                           |
| `CHAT_MESSAGE_SENT`     | 聊天消息发送 | `role`, `content`                                                 |
| `CHAT_MESSAGE_RECEIVED` | 聊天消息接收 | `role`, `content`                                                 |
| `CHAT_TYPING_STARTED`   | 聊天输入开始 | -                                                                 |
| `CHAT_TYPING_STOPPED`   | 聊天输入停止 | -                                                                 |
| `DATA_LOADED`           | 数据加载     | `source`, `data`                                                  |
| `DATA_REFRESHED`        | 数据刷新     | `source`, `data`                                                  |
| `DATA_FILTERED`         | 数据过滤     | `filters`, `data`                                                 |
| `UI_RESIZED`            | UI 大小变化  | `width`, `height`                                                 |
| `UI_THEME_CHANGED`      | UI 主题变化  | `theme`                                                           |

### 事件订阅模式

```typescript
// 简单订阅
ctx.tui.SubscribeToEvent('ROW_SELECTED', (msg) => {
  console.log('Row selected:', msg.data.rowIndex);
});

// 带取消的订阅（高级用法）
// 注意：当前版本中取消功能需要额外实现
// 这是一个示例模式
const unsubscribe = ctx.tui.SubscribeToEvent('ROW_SELECTED', handler);
// 取消订阅
// unsubscribe();
```

### 事件发布模式

```typescript
// 发布简单事件
ctx.tui.PublishEvent('table1', 'ROW_SELECTED', {
  rowIndex: 5
});

// 发布带复杂数据的事件
ctx.tui.PublishEvent('form1', 'FORM_VALIDATION_ERROR', {
  formID: 'form1',
  errors: {
    email: 'Invalid email format',
    password: 'Password too short'
  }
});
```

## 最佳实践

### 1. 错误处理

始终检查 `ctx` 对象是否可用：

```javascript
function myFunction(ctx, param) {
  if (!ctx) {
    console.error('Function called without context');
    return;
  }

  // 继续执行逻辑
  ctx.tui.SetState('key', param);
}
```

### 2. 状态管理

使用 `UpdateState` 批量更新相关状态，减少 UI 重绘次数：

```javascript
// 好的做法
ctx.tui.UpdateState({
  user: newUser,
  lastUpdated: Date.now(),
  status: 'updated'
});

// 避免频繁单个更新
ctx.tui.SetState('user', newUser);
ctx.tui.SetState('lastUpdated', Date.now());
ctx.tui.SetState('status', 'updated');
```

### 3. 事件清理

如果组件被销毁或重新创建，确保清理事件订阅：

```typescript
// 保存取消函数的引用
let unsubscribeFunctions = [];

function setupEventHandlers(ctx) {
  const unsub1 = ctx.tui.SubscribeToEvent('EVENT1', handler1);
  const unsub2 = ctx.tui.SubscribeToEvent('EVENT2', handler2);

  unsubscribeFunctions = [unsub1, unsub2];
}

function cleanupEventHandlers() {
  // 清理所有订阅
  // 注意：取消功能需要额外实现
}
```

### 4. 性能考虑

- 避免在脚本中执行长时间运行的操作
- 对于异步操作，考虑使用 Process 系统
- 合理使用状态更新，避免不必要的 UI 重绘
- 调试时使用 `console.log` 而不是频繁的状态更新

### 5. TypeScript 类型

如果使用 TypeScript，建议定义类型：

```typescript
declare namespace Yao {
  interface Context {
    tui: TUI;
  }

  interface TUI {
    id: string;
    width: number;
    height: number;
    GetState(key?: string): any;
    SetState(key: string, value: any): void;
    UpdateState(updates: Record<string, any>): void;
    ExecuteAction(action: Action): void;
    Refresh(): void;
    Quit(): void;
    Interrupt(): void;
    Suspend(): void;
    ClearScreen(): void;
    EnterAltScreen(): void;
    ExitAltScreen(): void;
    ShowCursor(): void;
    HideCursor(): void;
    FocusNextInput(targetID?: string): void;
    SubmitForm(): void;
    PublishEvent(componentID: string, action: string, data?: any): void;
    SubscribeToEvent(
      action: string,
      callback: (msg: EventMessage) => void
    ): void;
    SetFocus(componentID: string): void;
  }

  interface Action {
    process?: string;
    script?: string;
    method?: string;
    args?: any[];
    onSuccess?: string;
    onError?: string;
    payload?: Record<string, any>;
  }

  interface EventMessage {
    id: string;
    action: string;
    data?: any;
  }
}
```

## 故障排除

### 常见问题

**1. 脚本无法访问 `tui` 对象**

- 确保脚本是通过 TUI 引擎执行的
- 检查绑定配置是否正确
- 确认脚本文件路径正确

**2. 状态更新不生效**

- 确保使用了 `tui.SetState` 或 `tui.UpdateState`
- 检查是否有 JavaScript 错误阻止了执行
- 使用 `console.log` 调试状态变化

**3. 嵌套状态访问失败**

- 使用点符号（如 `user.profile.name`）
- 确保中间对象存在
- 考虑使用扁平化键名

**4. 事件订阅不工作**

- 检查事件名称是否正确
- 确保回调函数签名正确
- 验证事件是否被正确发布

**5. 上下文未定义**

- 确保函数第一个参数名为 `ctx`
- 使用 `if (!ctx)` 检查上下文
- 添加适当的错误处理

### 调试技巧

```javascript
// 在脚本中添加调试信息
function myFunction(ctx) {
  console.log('Function called with ctx:', !!ctx);

  if (ctx) {
    console.log('TUI ID:', ctx.tui.id);
    console.log('Current state:', ctx.tui.GetState());
  }
}

// 检查特定状态值
function debugState(ctx) {
  const value = ctx.tui.GetState('myKey');
  console.log('myKey value:', value);
}

// 测试事件系统
function testEvents(ctx) {
  ctx.tui.PublishEvent('test', 'TEST_EVENT', { data: 'test' });

  ctx.tui.SubscribeToEvent('TEST_EVENT', (msg) => {
    console.log('Test event received:', msg);
  });
}
```

## 进阶主题

### 与 Process 系统集成

脚本可以调用 Yao Process 系统来执行数据库操作、API 调用等：

```javascript
function saveUserData(ctx, userId, data) {
  // 通过 TUI 执行 Process
  ctx.tui.ExecuteAction({
    process: 'models.user.save',
    args: [userId, data]
  });
}

function loadUsers(ctx) {
  ctx.tui.ExecuteAction({
    process: 'models.user.list',
    args: [{ limit: 50 }],
    onSuccess: 'users'
  });
}
```

### 动态 UI 更新

利用状态绑定和表达式实现动态 UI：

```javascript
function updateStatus(ctx, status) {
  ctx.tui.UpdateState({
    status: status,
    lastUpdate: new Date().toISOString()
  });

  // 强制刷新 UI
  ctx.tui.Refresh();
}

function toggleEditMode(ctx) {
  const currentMode = ctx.tui.GetState('mode') || 'view';
  const newMode = currentMode === 'view' ? 'edit' : 'view';

  ctx.tui.SetState('mode', newMode);
}
```

### 组件间通信

使用事件系统实现组件间通信：

```javascript
// 在一个组件中发布事件
function publishSelection(ctx, id) {
  ctx.tui.PublishEvent('table1', 'ROW_SELECTED', {
    rowIndex: id,
    timestamp: Date.now()
  });
}

// 在另一个组件中订阅事件
function subscribeToSelection(ctx) {
  ctx.tui.SubscribeToEvent('ROW_SELECTED', (msg) => {
    console.log('Selection changed:', msg.data.rowIndex);

    // 更新详情面板
    ctx.tui.ExecuteAction({
      process: 'ui.loadDetails',
      args: [msg.data.rowData]
    });
  });
}
```

### 复杂状态管理

对于复杂的应用状态，考虑使用状态机模式：

```javascript
// 定义状态
const STATE_IDLE = 'idle';
const STATE_LOADING = 'loading';
const STATE_SUCCESS = 'success';
const STATE_ERROR = 'error';

function fetchData(ctx) {
  // 设置加载状态
  ctx.tui.UpdateState({
    fetchState: STATE_LOADING,
    error: null
  });

  try {
    // 执行获取操作
    ctx.tui.ExecuteAction({
      process: 'api.getData',
      onSuccess: 'data',
      onError: 'fetchError'
    });
  } catch (e) {
    ctx.tui.UpdateState({
      fetchState: STATE_ERROR,
      error: e.message
    });
  }
}

function handleFetchSuccess(ctx) {
  ctx.tui.UpdateState({
    fetchState: STATE_SUCCESS,
    error: null
  });
}

function handleFetchError(ctx, error) {
  ctx.tui.UpdateState({
    fetchState: STATE_ERROR,
    error: error.message
  });
}
```

通过这些功能，TUI 引擎提供了强大而灵活的脚本支持，使得构建复杂的终端用户界面成为可能。
