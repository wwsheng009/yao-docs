# 组件按键绑定系统使用指南

## 概述

组件按键绑定系统允许开发者为TUI组件定义自定义按键映射，提供统一的按键处理机制。该系统支持三种不同的处理模式：Action、Event和Default。

## 配置结构

### ComponentBinding 结构

```go
type ComponentBinding struct {
    Keys       []string `json:"key"`           // 触发绑定的按键组合
    Action     *Action  `json:"action,omitempty"` // Action模式：执行操作
    Event      string   `json:"event,omitempty"`  // Event模式：触发事件
    UseDefault bool     `json:"useDefault,omitempty"` // Default模式：使用默认行为
    Enabled    bool     `json:"enabled,omitempty"`    // 是否启用
    Description string  `json:"description,omitempty"` // 描述信息
}
```

### Action 结构

```go
type Action struct {
    Process   string      `json:"process,omitempty"`   // 进程名称
    Script    string      `json:"script,omitempty"`    // 脚本路径
    Method    string      `json:"method,omitempty"`    // 方法名（配合Script使用）
    Payload   interface{} `json:"payload,omitempty"`   // 直接有效载荷
    Args      []string    `json:"args,omitempty"`      // 参数列表
    OnSuccess string      `json:"onSuccess,omitempty"` // 成功回调
    OnError   string      `json:"onError,omitempty"`   // 错误回调
}
```

## 使用模式

### 1. Action 模式

Action模式允许执行三种不同类型的操作：

#### Process 模式（推荐）

直接调用服务器端进程，无需编写额外代码：

```json
{
  "key": "ctrl+s",
  "action": {
    "process": "users.save",
    "args": ["{{value}}", "{{componentID}}"],
    "onSuccess": "saveResult",
    "onError": "__error"
  },
  "description": "保存到服务器"
}
```

#### Script 模式

调用外部脚本中的方法：

```json
{
  "key": "f5",
  "action": {
    "script": "scripts/data",
    "method": "refreshTable",
    "args": ["{{componentID}}"],
    "onSuccess": "tableData",
    "onError": "__error"
  },
  "description": "刷新数据"
}
```

#### Payload 模式

直接发送有效载荷到全局状态：

```json
{
  "key": "t",
  "action": {
    "payload": {
      "showTooltip": "toggle"
    }
  },
  "description": "切换帮助提示"
}
```

### 2. Event 模式

Event模式触发指定事件，需要在模型中编写相应的处理器：

```json
{
  "key": "d",
  "event": "delete_item",
  "description": "删除选中项"
}
```

在模型中处理事件：

```go
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case core.EventMsg:
        if msg.Name == "delete_item" {
            // 处理删除逻辑
            return m, nil
        }
    }
    // ... 其他消息处理
}
```

### 3. Default 模式

Default模式让组件恢复到其默认行为：

```json
{
  "key": "esc",
  "useDefault": true,
  "description": "失焦（默认行为）"
}
```

## 在组件中使用

### 为组件添加绑定

在组件的Props结构中添加Bindings字段：

```go
type InputProps struct {
    // ... 其他字段
    Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}
```

### 在Update方法中集成

在组件的Update方法中集成按键绑定检查：

```go
func (c *InputComponent) Update(msg tea.Msg) (InputComponent, tea.Cmd) {
    var cmds []tea.Cmd

    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 检查组件绑定
        bindingResult := core.CheckComponentBindings(c.Props.Bindings, msg.String())
        if bindingResult != nil {
            // 处理绑定结果
            cmd := core.HandleBinding(bindingResult, c.GetID())
            if cmd != nil {
                cmds = append(cmds, cmd)
            }
        }

        // 如果没有匹配的绑定或绑定不使用默认行为，则继续默认处理
        if bindingResult == nil || !bindingResult.UseDefault {
            // 默认输入处理逻辑
        }
    }

    return c, tea.Batch(cmds...)
}
```

## 特殊变量

系统支持以下特殊变量，可在参数中使用：

- `{{value}}` - 当前组件值
- `{{componentID}}` - 组件ID
- `{{selected}}` - 选中的项目（适用于列表/表格组件）

## 安全考虑

对于敏感组件（如密码输入框），可以使用按键绑定阻止某些操作：

```json
{
  "key": "ctrl+c",
  "event": "block_copy",
  "description": "禁止复制"
},
{
  "key": "ctrl+v",
  "event": "block_paste",
  "description": "禁止粘贴"
}
```

## 完整示例

以下是一个完整的配置示例：

```json
{
  "input_example": {
    "type": "input",
    "id": "username",
    "placeholder": "请输入用户名",
    "bindings": [
      {
        "key": "ctrl+s",
        "action": {
          "process": "users.save",
          "args": ["{{value}}", "{{componentID}}"],
          "onSuccess": "saveResult",
          "onError": "__error"
        },
        "enabled": true,
        "description": "保存到服务器"
      },
      {
        "key": "f1",
        "event": "show_help",
        "enabled": true,
        "description": "显示帮助"
      }
    ]
  }
}
```

## 最佳实践

1. **优先使用Process模式**：对于简单的服务端操作，使用Process模式是最简洁的方式
2. **合理使用Default模式**：当需要保留组件原有行为时，使用Default模式
3. **添加描述**：为每个绑定添加清晰的描述，便于维护
4. **启用控制**：使用Enabled字段控制绑定是否生效
5. **安全考虑**：对敏感输入组件禁用复制粘贴等操作
