# TUI (Terminal User Interface) 使用指南

## 概述

TUI (Terminal User Interface) 是一个强大的终端用户界面引擎，允许开发者使用 JSON/YAML 配置文件和 JavaScript/TypeScript 脚本来构建动态的终端应用程序。

## 模板语法

TUI 使用 expr-lang 作为表达式引擎，支持强大的数据绑定和表达式计算。

### 基本数据插值

使用双大括号 `{{ }}` 进行数据绑定：

```json
{
  "props": {
    "title": "欢迎, {{user.name}}!",
    "count": "总数: {{count}}"
  }
}
```

### 内置函数

#### `len(array|object|string)`

获取数组、对象或字符串的长度：

```json
"content": "项目数量: {{len(items)}}"
```

#### `index(object, key)`

从对象中获取指定键的值：

```json
"content": "总计: {{index(stats, 'total')}}"
```

**重要注意事项**：

- 当键名包含特殊字符（如连字符 `-`、点号 `.` 等）时，需要使用 `index` 函数来安全访问
- 不能直接使用 `{{key-name}}` 语法，因为这会被解释为运算表达式（如 `key - name`）

**错误示例**：

```json
// 错误：会被解释为减法运算
"content": "用户名: {{username-input}}"
```

**正确示例**：

```json
// 正确：使用 index 函数访问包含连字符的键
"content": "用户名: {{index($, 'username-input')}}"
"content": "邮箱: {{index($, 'email-input')}}"
"content": "密码: {{index($, 'password-input')}}"
```

其中 `$` 代表根上下文（当前状态对象）。

#### 三元运算符

支持条件表达式：

```json
"content": "{{count > 0 ? '有项目' : '无项目'}}"
```

#### `True(value)`

将值转换为布尔值：

```json
"content": "{{True(isActive)}}"
```

#### `False(value)`

布尔值取反：

```json
"content": "{{False(isDisabled)}}"
```

#### `Empty(value)`

检查值是否为空：

```json
"content": "{{Empty(errorMessage)}}"
```

### 表达式示例

```json
{
  "props": {
    "title": "用户: {{user.name}}, 年龄: {{user.age}}, 项目数: {{len(items)}}",
    "status": "{{count > 0 ? '活跃' : '非活跃'}}",
    "userStatus": "{{index($, 'username-input')}}"
  }
}
```

### 复杂数据类型处理

#### 数组访问

对于数组中的数据，可以使用索引：

```json
{
  "data": {
    "items": [
      { "name": "Item 1", "value": 100 },
      { "name": "Item 2", "value": 200 }
    ]
  },
  "props": {
    "firstItem": "第一个项目: {{items.0.name}}",
    "firstValue": "第一个值: {{items.0.value}}"
  }
}
```

#### 嵌套对象

支持嵌套对象访问：

```json
{
  "data": {
    "user": {
      "profile": {
        "name": "Alice",
        "city": "New York"
      }
    }
  },
  "props": {
    "userName": "用户名: {{user.profile.name}}",
    "userCity": "城市: {{user.profile.city}}"
  }
}
```

#### 数据扁平化

TUI 引擎会自动将嵌套数据扁平化，支持两种访问方式：

**方式 1：使用点符号**

```json
"user.profile.name" // 访问嵌套属性
```

**方式 2：使用扁平化键**

```json
"user.profile.name" // 平铺化后的键
```

对于包含特殊字符的键，始终使用 `index` 函数：

```json
"index($, 'username-input')" // 访问 username-input
```

## 组件系统

TUI 支持多种组件类型：

### 核心组件

#### Header 组件

显示标题栏：

```json
{
  "type": "header",
  "props": {
    "title": "我的应用"
  }
}
```

#### Text 组件

显示静态文本：

```json
{
  "type": "text",
  "props": {
    "content": "欢迎使用 TUI 引擎"
  }
}
```

#### Input 组件

单行文本输入框，支持焦点管理：

```json
{
  "type": "input",
  "id": "usernameInput",
  "props": {
    "placeholder": "请输入用户名",
    "prompt": ">",
    "color": "#FFFFFF",
    "background": "#1E1E2E"
  }
}
```

#### Table 组件

数据表格，支持行选择和键盘导航：

```json
{
  "type": "table",
  "id": "userTable",
  "bind": "users",
  "props": {
    "columns": [
      { "key": "id", "title": "ID", "width": 10 },
      { "key": "name", "title": "名称", "width": 20 },
      { "key": "email", "title": "邮箱", "width": 30 }
    ],
    "focused": true,
    "showBorder": true
  }
}
```

#### Form 组件

表单组件，支持多个字段：

```json
{
  "type": "form",
  "id": "userForm",
  "props": {
    "title": "用户注册",
    "fields": [
      {
        "type": "input",
        "name": "username",
        "label": "用户名",
        "placeholder": "请输入用户名",
        "required": true
      },
      {
        "type": "input",
        "name": "email",
        "label": "邮箱",
        "placeholder": "请输入邮箱",
        "required": true
      }
    ],
    "submitLabel": "提交",
    "cancelLabel": "取消"
  }
}
```

#### Menu 组件

交互式菜单，支持子菜单：

```json
{
  "type": "menu",
  "id": "mainMenu",
  "props": {
    "title": "主菜单",
    "items": [
      {
        "title": "查看用户",
        "value": "view",
        "action": {
          "process": "tui.refresh"
        }
      },
      {
        "title": "添加用户",
        "value": "add",
        "action": {
          "script": "scripts/tui/user",
          "method": "addUser"
        }
      }
    ]
  }
}
```

#### Chat 组件

AI 聊天界面，支持 Markdown 渲染：

```json
{
  "type": "chat",
  "id": "chatComponent",
  "props": {
    "messages": [
      { "role": "user", "content": "你好" },
      { "role": "assistant", "content": "欢迎！" }
    ],
    "showInput": true,
    "inputPlaceholder": "输入消息...",
    "enableMarkdown": true
  }
}
```

### 工具组件

#### List 组件

显示列表数据：

```json
{
  "type": "list",
  "props": {
    "items": ["Item 1", "Item 2", "Item 3"]
  }
}
```

#### CRUD 组件

CRUD 操作组件：

```json
{
  "type": "crud",
  "bind": "users",
  "props": {
    "model": "user",
    "showAdd": true,
    "showEdit": true,
    "showDelete": true
  }
}
```

#### Progress 组件

显示进度条：

```json
{
  "type": "progress",
  "props": {
    "percent": 50,
    "width": 40
  }
}
```

#### Spinner 组件

加载动画：

```json
{
  "type": "spinner",
  "props": {
    "type": "dots"
  }
}
```

### 组件属性通用规则

#### 样式属性

所有组件支持以下样式属性：

```json
{
  "props": {
    "foreground": "#FF0000",      // 文字颜色
    "background": "#000000",      // 背景颜色
    "bold": true,                // 粗体
    "italic": true,               // 斜体
    "underline": true,           // 下划线
    "margin": "1 0 0 0",       // 外边距 [上 右 下 左]
    "padding": "0 1 0 1"       // 内边距
    "align": "center"             // 对齐方式
  }
}
```

#### 尺寸属性

```json
{
  "props": {
    "width": 80,
    "height": 20
  }
}
```

支持 `"flex"` 表示自动适应。

## 事件绑定

### 按键绑定

在 TUI 配置的 `bindings` 部分定义按键与动作的映射：

```json
{
  "bindings": {
    "q": { "process": "tui.quit" },
    "ctrl+c": { "process": "tui.quit" },
    "r": { "script": "scripts/tui/app", "method": "refresh" },
    "s": { "script": "scripts/tui/app", "method": "save" }
  }
}
```

### 默认绑定

TUI 引擎自动设置以下默认绑定：

| 按键               | 动作              | 描述           |
| ------------------ | ----------------- | -------------- |
| `q`, `ctrl+c`      | 退出              | 退出应用       |
| `tab`              | `tui.focus.next`  | 聚焦下一个组件 |
| `shift+tab`        | `tui.focus.prev`  | 聚焦上一个组件 |
| `enter`            | `tui.form.submit` | 提交表单       |
| `ctrl+r`, `ctrl+l` | `tui.refresh`     | 刷新 UI        |
| `ctrl+z`           | `tui.suspend`     | 暂停应用       |

### 组件动作绑定

组件也可以定义自己的动作：

```json
{
  "type": "table",
  "actions": {
    "onRowSelect": {
      "process": "ui.showDetails",
      "args": ["{{rowData}}"]
    }
  }
}
```

## 快速开始

### 1. 创建 TUI 配置

创建 `.tui.yao` 文件在 `tuis/` 目录：

```json
{
  "name": "我的第一个 TUI",
  "data": {
    "title": "Hello Yao TUI!",
    "message": "欢迎使用终端界面"
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "{{title}}"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "{{message}}"
        }
      }
    ]
  },
  "bindings": {
    "q": { "process": "tui.quit" }
  }
}
```

### 2. 运行 TUI

```bash
yao tui hello
```

### 3. 使用交互式组件

创建带有输入功能的 TUI：

```json
{
  "name": "交互式示例",
  "data": {
    "inputValue": "",
    "history": []
  },
  "onLoad": {
    "script": "scripts/tui/interactive",
    "method": "init"
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "输入示例"
        }
      },
      {
        "type": "input",
        "id": "mainInput",
        "bind": "inputValue",
        "props": {
          "placeholder": "请输入文本"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "输入值: {{inputValue}}"
        }
      }
    ]
  },
  "bindings": {
    "enter": {
      "script": "scripts/tui/interactive",
      "method": "handleSubmit"
    },
    "q": { "process": "tui.quit" }
  }
}
```

创建对应的脚本文件 `scripts/tui/interactive.ts`：

```typescript
function init(ctx) {
  if (!ctx) {
    return;
  }

  // 设置初始状态
  ctx.tui.SetState('inputValue', '');
  ctx.tui.SetState('history', []);
  ctx.tui.SetFocus('mainInput');
}

function handleSubmit(ctx) {
  if (!ctx) {
    return;
  }

  // 获取当前输入值
  const input = ctx.tui.GetState('inputValue');

  // 添加到历史记录
  const history = ctx.tui.GetState('history') || [];
  history.push(input);
  ctx.tui.SetState('history', history);

  // 清空输入
  ctx.tui.SetState('inputValue', '');

  // 刷新 UI
  ctx.tui.Refresh();
}
```

## JavaScript/TypeScript 脚本集成

TUI 支持使用 JavaScript/TypeScript 脚本来处理复杂逻辑。详见 [脚本集成指南](SCRIPTING_GUIDE.md)。

### 基本脚本使用

```json
{
  "bindings": {
    "i": {
      "script": "scripts/tui/counter",
      "method": "increment"
    },
    "d": {
      "script": "scripts/tui/counter",
      "method": "decrement"
    }
  }
}
```

### 脚本文件示例

`scripts/tui/counter.ts`:

```typescript
function increment(ctx) {
  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count + 1);
}

function decrement(ctx) {
  const count = ctx.tui.GetState('count') || 0;
  ctx.tui.SetState('count', count - 1);
}
```

## 高级特性

### 数据绑定

使用 `bind` 属性将整个数据对象绑定到组件：

```json
{
  "type": "table",
  "bind": "users",
  "props": {
    "columns": [
      { "key": "id", "title": "ID", "width": 8 },
      { "key": "name", "title": "名称", "width": 20 }
    ]
  }
}
```

### 条件渲染

使用表达式进行条件渲染：

```json
{
  "type": "text",
  "props": {
    "content": "{{user.isActive ? '用户在线' : '用户离线'}}"
  }
}
```

### 列表渲染

使用表达式渲染数组数据：

```json
{
  "type": "text",
  "props": {
    "content": "用户列表:\n{{range users}}{{.name}} - {{.email}}\n{{end}}"
  }
}
```

### 复杂表达式

支持多个表达式组合：

```json
{
  "props": {
    "status": "总计: {{len(items)}} 项目, 已完成: {{len(items) - len(pendingItems)}}"
  }
}
```

## 布局系统

### 方向

`direction` 属性指定子组件的排列方式：

```json
{
  "layout": {
    "direction": "vertical",  // 垂直排列
    "children": [...]
  }
}
```

可用值：`"vertical"`、`"horizontal"`

### 嵌套布局

支持无限嵌套：

```json
{
  "layout": {
    "direction": "horizontal",
    "children": [
      {
        "type": "layout",
        "direction": "vertical",
        "children": [
          { "type": "header", "props": { "title": "左栏" } },
          { "type": "text", "props": { "content": "左栏内容" } }
        ]
      },
      {
        "type": "layout",
        "direction": "vertical",
        "children": [
          { "type": "header", "props": { "title": "右栏" } },
          { "type": "text", "props": { "content": "右栏内容" } }
        ]
      }
    ]
  }
}
```

### 内边距

使用 `padding` 属性添加内边距：

```json
{
  "layout": {
    "direction": "vertical",
    "padding": [1, 2, 1, 2],  // [上, 右, 下, 左]
    "children": [...]
  }
}
```

## 错误处理

### 配置验证

确保 JSON/YAML 配置文件语法正确：

```bash
# 验证配置
yao tui validate hello

# 列出所有 TUI
yao tui list
```

### 表达式错误

如果表达式求值失败，TUI 会记录警告并显示原始字符串：

```json
{
  "props": {
    "content": "{{invalidKey}}" // 如果 key 不存在，会显示原始字符串
  }
}
```

### 脚本错误

脚本执行错误会被捕获并显示：

```json
{
  "bindings": {
    "e": {
      "script": "scripts/tui/error",
      "method": "throwError"
    }
  }
}
```

```typescript
function throwError(ctx) {
  throw new Error('This is an intentional error');
}
```

错误会显示在状态中并可以通过 `__error` 键访问。

## 调试技巧

### 启用调试模式

```bash
export YAO_TUI_DEBUG=true
yao tui hello --debug
```

### 日志输出

TUI 会输出详细的调试日志：

- 状态更新日志
- 事件触发日志
- 组件渲染日志
- 错误追踪

### 测试表达式

在开发过程中，可以使用简单的 TUI 配置测试表达式：

```json
{
  "name": "Expression Test",
  "data": {
    "testValue": 42,
    "testArray": ["a", "b", "c"],
    "testObject": { "name": "Test" }
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "text",
        "props": {
          "content": "值: {{testValue}}"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "长度: {{len(testArray)}}"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "对象: {{testObject.name}}"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "条件: {{testValue > 0 ? '大于0' : '小于等于0'}}"
        }
      }
    ]
  }
}
```

## 性能优化建议

### 避免频繁重绘

使用批量状态更新：

```typescript
// 推荐：批量更新
ctx.tui.UpdateState({
  user: newUser,
  count: newCount,
  status: 'updated'
});

// 避免：频繁单个更新
ctx.tui.SetState('user', newUser);
ctx.tui.SetState('count', newCount);
ctx.tui.SetState('status', 'updated');
```

### 使用条件渲染

避免渲染不需要的元素：

```json
{
  "type": "text",
  "props": {
    "content": "{{showMessage ? message : ''}}"
  }
}
```

### 缓存计算结果

对于复杂的表达式，考虑使用脚本预计算：

```typescript
// 在 onLoad 中预计算
function init(ctx) {
  const users = ctx.tui.GetState('users') || [];
  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length
  };

  ctx.tui.UpdateState(stats);
}
```

## 参考资源

- [架构设计](ARCHITECTURE.md) - 详细架构说明
- [脚本集成指南](SCRIPTING_GUIDE.md) - JavaScript/TypeScript 脚本使用
- [快速开始](QUICKSTART.md) - 5 分钟快速入门

## 常见问题

### Q: 如何访问嵌套对象的数据？

A: 使用点符号或 `index` 函数：

```json
"{{user.profile.name}}"
"{{index($, 'user.profile.name')}}"
```

### Q: 如何处理包含特殊字符的键？

A: 始终使用 `index` 函数：

```json
"{{index($, 'username-input')}}"
"{{index($, 'email-input')}}"
```

### Q: 如何动态更新表格数据？

A: 通过绑定数据并更新状态：

```typescript
// 脚本中更新数据
function refreshTable(ctx) {
  ctx.tui.ExecuteAction({
    process: 'models.user.list',
    onSuccess: 'users'
  });
}
```

### Q: 如何处理表单提交？

A: 使用 `tui.form.submit` process 或自定义脚本：

```typescript
function handleFormSubmit(ctx) {
  // 收集表单数据
  const formData = {
    name: ctx.tui.GetState('name-input'),
    email: ctx.tui.GetState('email-input')
  };

  // 提交到服务器
  ctx.tui.ExecuteAction({
    process: 'api.submit',
    args: [formData]
  });
}
```

### Q: 如何在组件间通信？

A: 使用事件系统：

```typescript
// 组件 A 发布事件
ctx.tui.PublishEvent('componentA', 'CUSTOM_EVENT', { data: 'value' });

// 组件 B 订阅事件
ctx.tui.SubscribeToEvent('CUSTOM_EVENT', (msg) => {
  console.log('Received:', msg.data);
});
```

通过以上功能，TUI 引擎提供了强大而灵活的配置能力，使开发者能够快速构建复杂的终端用户界面。
