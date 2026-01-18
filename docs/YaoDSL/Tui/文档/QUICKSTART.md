# TUI 快速开始指南

5 分钟快速入门 Yao TUI 引擎。

---

## 前提条件

- Go >= 1.21
- Yao 项目已安装
- 终端支持 256 色或 TrueColor

---

## 步骤 1: 安装依赖

```bash
# 进入 tui 目录
cd tui

# 安装依赖（首次运行）
go mod download

# 验证依赖
go mod verify
```

---

## 步骤 2: 创建第一个 TUI

在项目根目录创建 `tuis/hello.tui.yao`:

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
    "q": {
      "process": "tui.quit"
    }
  }
}
```

**说明**：

- `data`：定义初始状态数据
- `layout`：定义 UI 布局和组件
- `bindings`：定义键盘快捷键
- `{{title}}`：表达式语法，绑定到 state 中的 title

---

## 步骤 3: 运行 TUI

```bash
# 启动 TUI
yao tui hello
```

你应该看到：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hello Yao TUI!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

欢迎使用终端界面

按 'q' 退出
```

---

## 步骤 4: 添加交互功能

### 4.1 创建交互式 TUI

创建 `tuis/counter.tui.yao`:

```json
{
  "name": "计数器",
  "data": {
    "count": 0
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "计数器: {{count}}"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "按 + 增加, 按 - 减少, 按 r 重置"
        }
      }
    ]
  },
  "bindings": {
    "+": {
      "script": "scripts/tui/counter",
      "method": "increment"
    },
    "-": {
      "script": "scripts/tui/counter",
      "method": "decrement"
    },
    "r": {
      "script": "scripts/tui/counter",
      "method": "reset"
    },
    "q": {
      "process": "tui.quit"
    }
  }
}
```

### 4.2 创建脚本文件

创建 `scripts/tui/counter.ts`:

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
    console.log('reset called without context');
    return;
  }

  ctx.tui.SetState('count', 0);
}
```

运行：

```bash
yao tui counter
```

### 4.3 使用 Input 组件

创建 `tuis/form.tui.yao`:

```json
{
  "name": "表单示例",
  "data": {
    "name": "",
    "email": ""
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "用户注册"
        }
      },
      {
        "type": "input",
        "id": "nameInput",
        "bind": "name",
        "props": {
          "placeholder": "请输入用户名",
          "prompt": "> "
        }
      },
      {
        "type": "input",
        "id": "emailInput",
        "bind": "email",
        "props": {
          "placeholder": "请输入邮箱",
          "prompt": "> "
        }
      },
      {
        "type": "text",
        "props": {
          "content": "当前值: name={{index($, 'name-input')}}, email={{index($, 'email-input')}}"
        }
      }
    ]
  },
  "bindings": {
    "q": {
      "process": "tui.quit"
    },
    "ctrl+r": {
      "process": "tui.refresh"
    }
  }
}
```

---

## 步骤 5: 使用 Table 组件

创建 `tuis/users.tui.yao`:

```json
{
  "name": "用户列表",
  "data": {
    "title": "用户管理",
    "users": [
      { "id": 1, "name": "Alice", "email": "alice@example.com" },
      { "id": 2, "name": "Bob", "email": "bob@example.com" },
      { "id": 3, "name": "Charlie", "email": "charlie@example.com" }
    ]
  },
  "onLoad": {
    "process": "tui.refresh"
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "{{title}} - {{len(users)}} 位用户"
        }
      },
      {
        "type": "table",
        "id": "userTable",
        "bind": "users",
        "props": {
          "columns": [
            { "key": "id", "title": "ID", "width": 8 },
            { "key": "name", "title": "名称", "width": 20 },
            { "key": "email", "title": "邮箱", "width": 30 }
          ],
          "focused": true,
          "showBorder": true
        }
      }
    ]
  },
  "bindings": {
    "q": {
      "process": "tui.quit"
    },
    "r": {
      "process": "models.user.Get",
      "onSuccess": "users"
    }
  }
}
```

**Table 组件特性**：

- 支持键盘导航（上下箭头、Page Up/Down）
- 支持行选择
- 支持自定义样式
- 支持分页（通过数据绑定）

---

## 步骤 6: 使用 Menu 组件

创建 `tuis/menu.tui.yao`:

```json
{
  "name": "菜单示例",
  "data": {
    "currentMenu": "主菜单"
  },
  "layout": {
    "direction": "vertical",
    "children": [
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
            },
            {
              "title": "设置",
              "value": "settings",
              "action": {
                "script": "scripts/tui/settings",
                "method": "open"
              }
            },
            {
              "title": "退出",
              "value": "quit",
              "action": {
                "process": "tui.quit"
              }
            }
          ]
        }
      }
    ]
  }
}
```

**Menu 组件特性**：

- 支持子菜单（Enter/右箭头进入，左箭头返回）
- 支持菜单项禁用
- 支持自定义动作
- 支持键盘导航（上下箭头）

---

## 步骤 7: 使用 Chat 组件

创建 `tuis/chat.tui.yao`:

```json
{
  "name": "AI 聊天",
  "data": {
    "title": "AI 助手",
    "messages": [
      {
        "role": "assistant",
        "content": "你好！我是你的 AI 助手，有什么可以帮助你的吗？"
      }
    ]
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
        "type": "chat",
        "id": "chatComponent",
        "bind": "messages",
        "props": {
          "showInput": true,
          "inputPlaceholder": "输入消息...",
          "enableMarkdown": true,
          "glamourStyle": "dark"
        }
      }
    ]
  }
}
```

**Chat 组件特性**：

- 支持 Markdown 渲染（Glamour）
- 支持用户/助手消息区分
- 支持消息历史
- 支持流式消息（通过事件系统）

---

## 步骤 8: 嵌套布局

创建 `tuis/layout.tui.yao`:

```json
{
  "name": "嵌套布局示例",
  "layout": {
    "direction": "horizontal",
    "children": [
      {
        "type": "layout",
        "direction": "vertical",
        "children": [
          {
            "type": "header",
            "props": {
              "title": "左侧栏"
            }
          },
          {
            "type": "menu",
            "props": {
              "title": "菜单",
              "items": [
                { "title": "选项1", "value": "opt1" },
                { "title": "选项2", "value": "opt2" }
              ]
            }
          }
        ]
      },
      {
        "type": "layout",
        "direction": "vertical",
        "children": [
          {
            "type": "header",
            "props": {
              "title": "右侧栏"
            }
          },
          {
            "type": "text",
            "props": {
              "content": "主内容区域"
            }
          }
        ]
      }
    ]
  }
}
```

---

## 常用命令

```bash
# 运行 TUI
yao tui <id>

# 调试模式
yao tui <id> --debug

# 验证配置
yao tui validate <id>

# 列出所有 TUI
yao tui list

# 重新加载 TUI
yao tui reload <id>

# 查看帮助
yao tui --help
```

---

## 键盘快捷键

### 默认快捷键

| 按键                | 动作       | 描述                   |
| ------------------- | ---------- | ---------------------- |
| `q` / `ctrl+c`      | 退出       | 退出应用               |
| `tab`               | 下一个焦点 | 切换到下一个可聚焦组件 |
| `shift+tab`         | 上一个焦点 | 切换到上一个可聚焦组件 |
| `enter`             | 提交       | 提交表单或确认选择     |
| `ctrl+r` / `ctrl+l` | 刷新       | 刷新 UI                |
| `ctrl+z`            | 暂停       | 暂停应用               |

### 组件快捷键

- **Input**: 支持文本编辑（左右箭头、Ctrl+A/E、删除等）
- **Table**: 上下箭头导航、Page Up/Down、Home/End
- **Menu**: 上下箭头选择、Enter/右箭头进入子菜单、左箭头返回

---

## 表达式快速参考

### 基本语法

```json
"content": "值: {{key}}"
"content": "长度: {{len(array)}}"
"content": "{{count > 0 ? '有项目' : '无项目'}}"
```

### 内置函数

| 函数      | 描述             | 示例                       |
| --------- | ---------------- | -------------------------- |
| `len()`   | 获取长度         | `{{len(items)}}`           |
| `index()` | 安全访问对象属性 | `{{index($, 'key-name')}}` |
| `True()`  | 布尔转换         | `{{True(isActive)}}`       |
| `False()` | 布尔取反         | `{{False(isDisabled)}}`    |
| `Empty()` | 空值检查         | `{{Empty(errorMessage)}}`  |

---

## 组件快速参考

### 核心组件

```json
// Header
{"type": "header", "props": {"title": "标题"}}

// Text
{"type": "text", "props": {"content": "内容"}}

// Input
{"type": "input", "id": "myInput", "bind": "value", "props": {"placeholder": "请输入"}}

// Table
{"type": "table", "bind": "data", "props": {"columns": [{"key": "id", "title": "ID", "width": 10}]}}

// Form
{"type": "form", "id": "myForm", "props": {"fields": [{"type": "input", "name": "username"}]}}

// Menu
{"type": "menu", "props": {"items": [{"title": "选项1", "value": "val1"}]}}

// Chat
{"type": "chat", "bind": "messages", "props": {"showInput": true, "enableMarkdown": true}}
```

---

## 下一步

1. 阅读 [架构文档](ARCHITECTURE.md) 了解设计细节
2. 查看 [使用指南](USAGE_GUIDE.md) 学习表达式语法和组件用法
3. 参考 [脚本集成指南](SCRIPTING_GUIDE.md) 了解 JavaScript/TypeScript 集成
4. 查看 [示例项目](../../YaoApps/) 学习最佳实践
5. 探索更多组件：
   - CRUD 组件：增删改查操作
   - List 组件：列表显示
   - Progress 组件：进度条
   - Spinner 组件：加载动画
   - Viewport 组件：滚动视图
   - Paginator 组件：分页器

---

## 获取帮助

- GitHub Issues: https://github.com/yaoapp/yao/issues
- Discord: https://discord.gg/yao
- 文档: https://yaoapps.com/doc

祝你使用愉快！🎉
