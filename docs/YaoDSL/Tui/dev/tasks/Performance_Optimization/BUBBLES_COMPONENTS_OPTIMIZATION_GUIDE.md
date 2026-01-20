# Bubbles 组件消息拦截优化指导文档

> **文档目的**: 为所有封装了 `github.com/charmbracelet/bubbles` 库的组件提供统一的消息拦截优化方案
>
> **核心理念**: **最小化封装，最大化委托** - 只在必要时干预消息流，其余全部委托给原始 bubbles 组件处理

---

## 📋 目录

1. [组件分类与优先级](#组件分类与优先级)
2. [核心优化原则](#核心优化原则)
3. [分层拦截策略](#分层拦截策略)
4. [组件按键绑定系统](#组件按键绑定系统)
5. [统一消息处理工具](#统一消息处理工具)
6. [统一包装器入口优化](#统一包装器入口优化)
7. [各组件优化方案](#各组件优化方案)
8. [测试验证指南](#测试验证指南)
9. [TODO 列表](#todo-列表)

---

## 组件分类与优先级

### 🔴 P0 - 高优先级（必须立即优化）

这些组件存在过度封装问题，导致 bubbles 原生功能被阻止：

| 组件            | 原生组件        | 问题描述                                              | 影响范围           |
| --------------- | --------------- | ----------------------------------------------------- | ------------------ |
| **input.go**    | textinput.Model | 焦点检查后直接返回 Ignored，消息进不了 textinput 内部 | 键盘输入、文本编辑 |
| **textarea.go** | textarea.Model  | 已优化 ✅                                             | 多行文本编辑       |
| **list.go**     | list.Model      | 焦点检查后直接返回 Ignored，阻止 list 导航            | 列表导航、选择     |
| **menu.go**     | list.Model      | 焦点检查后直接返回 Ignored，复杂导航逻辑重复实现      | 菜单导航、子菜单   |
| **table.go**    | table.Model     | 焦点检查后直接返回 Ignored，阻止表格导航              | 表格导航、选择     |
| **chat.go**     | textarea.Model  | 封装了 textarea，继承了相同问题                       | 聊天输入、历史     |

### 🟡 P1 - 中优先级（建议优化）

这些组件实现相对合理，但可以进一步改进：

| 组件              | 原生组件         | 改进空间                       |
| ----------------- | ---------------- | ------------------------------ | -------- |
| **viewport.go**   | viewport.Model   | 滚动键手动处理，可委托给原组件 | 滚动行为 |
| **paginator.go**  | paginator.Model  | 键盘消息处理可简化             | 翻页功能 |
| **filepicker.go** | filepicker.Model | 消息处理可简化                 | 文件选择 |

### 🟢 P2 - 低优先级（可选优化）

这些组件实现良好，只需小调整：

| 组件             | 原生组件        | 改进空间         |
| ---------------- | --------------- | ---------------- | ---------- |
| **progress.go**  | progress.Model  | 已合理，无需优化 | 进度显示   |
| **spinner.go**   | spinner.Model   | 已合理，无需优化 | 加载动画   |
| **help.go**      | help.Model      | 已合理，无需优化 | 帮助文本   |
| **cursor.go**    | cursor.Model    | 已合理，无需优化 | 光标显示   |
| **key.go**       | key.Binding     | 已合理，无需优化 | 快捷键绑定 |
| **stopwatch.go** | stopwatch.Model | 已合理，无需优化 | 计时器     |
| **timer.go**     | timer.Model     | 已合理，无需优化 | 倒计时器   |

---

## 核心优化原则

### ✅ 原则 1: 最小化干预

**规则**: 只在必要时拦截消息，其他情况全部委托

**示例**:

```go
// ❌ 错误：提前返回，阻止消息进入原组件
func (w *InputWrapper) UpdateMsg(msg tea.Msg) {
    if keyMsg, ok := msg.(tea.KeyMsg); ok {
        if !w.model.Focused() {
            return w, nil, core.Ignored  // 阻止所有消息
        }
        // 处理...
    }
}

// ✅ 正确：让原组件处理，只在需要时拦截
func (w *InputWrapper) UpdateMsg(msg tea.Msg) {
    if keyMsg, ok := msg.(tea.KeyMsg); ok {
        // 记录旧状态
        oldValue := w.model.Value()

        // 让原组件处理所有按键
        var cmd tea.Cmd
        w.model.Model, cmd = w.model.Model.Update(keyMsg)

        // 只在需要时拦截（如 ESC 失焦）
        if keyMsg.Type == tea.KeyEsc {
            w.model.Blur()
            // 发布事件...
            return w, cmd, core.Handled
        }

        // 检测变化并发布事件
        newValue := w.model.Value()
        if oldValue != newValue {
            // 发布事件...
        }

        return w, cmd, core.Handled
    }
}
```

### ✅ 原则 2: 统一事件检测

**规则**: 在所有需要发布事件的组件中，统一采用"先记录后检测"模式

**模式**:

```go
// 1. 记录旧状态
oldValue := w.model.Value()
oldFocus := w.model.Focused()
oldIndex := w.model.Index()

// 2. 委托给原组件处理
var cmd tea.Cmd
w.model.Model, cmd = w.model.Model.Update(msg)

// 3. 检测新状态
newValue := w.model.Value()
newFocus := w.model.Focused()
newIndex := w.model.Index()

// 4. 比较差异并发布事件
var eventCmds []tea.Cmd

if oldValue != newValue {
    eventCmds = append(eventCmds,
        core.PublishEvent(w.model.id, core.EventInputValueChanged,
            map[string]interface{}{
                "oldValue": oldValue,
                "newValue": newValue,
            }))
}

if oldFocus != newFocus {
    eventCmds = append(eventCmds,
        core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{
                "focused": newFocus,
            }))
}

// 5. 批量返回命令
if len(eventCmds) > 0 {
    return w, tea.Batch(append([]tea.Cmd{cmd}, eventCmds...)...), core.Handled
}
return w, cmd, core.Handled
```

### ✅ 原则 3: 响应状态一致性

**规则**: 正确使用 `core.Handled` 和 `core.Ignored`

- **`core.Handled`**: 消息已处理，停止传播（默认）
- **`core.Ignored`**: 消息未处理，继续传播（用于 Tab、Enter 提交等）

**决策树**:

```
是否拦截了特定按键（ESC/Tab/Enter）？
  ├─ 是 → 根据功能决定：
  │         ├─ 需要上层处理（Tab/Enter 提交）→ core.Ignored
  │         └─ 组件已处理（ESC 失焦）→ core.Handled
  └─ 否 → 原组件已处理 → core.Handled
```

### ✅ 原则 4: 保留原组件能力

**规则**: 不重复实现原组件已有的功能

**常见功能列表**:

| 功能     | textinput | textarea | list    | table   |
| -------- | --------- | -------- | ------- | ------- |
| 光标移动 | ✅ 原生   | ✅ 原生  | ✅ 原生 | ✅ 原生 |
| 文本编辑 | ✅ 原生   | ✅ 原生  | N/A     | N/A     |
| 文本选择 | ✅ 原生   | ✅ 原生  | N/A     | N/A     |
| 剪贴板   | ✅ 原生   | ✅ 原生  | N/A     | N/A     |
| 导航键   | N/A       | N/A      | ✅ 原生 | ✅ 原生 |
| 滚动     | N/A       | N/A      | ✅ 原生 | ✅ 原生 |
| 焦点管理 | ✅ 原生   | ✅ 原生  | N/A     | ✅ 原生 |

---

## 分层拦截策略

### 📐 三层拦截架构

```
┌─────────────────────────────────────────┐
│ Layer 1: 定向消息处理           │
│ - 处理 core.TargetedMsg         │
│ - 递归解包内部消息              │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Layer 2: 按键消息分层            │
│ ┌──────────────────────────────┐    │
│ │ 2.1 焦点检查（必须）   │    │
│ │ - 没有焦则 Ignore    │    │
│ └──────────┬───────────────┘    │
│            │                   │
│            ▼                   │
│ ┌──────────────────────────────┐    │
│ │ 2.2 拦截特殊按键       │    │
│ │ - ESC: 失焦          │    │
│ │ - Tab: 导航           │    │
│ │ - Enter: 条件提交     │    │
│ └──────────┬───────────────┘    │
│            │                   │
│            ▼                   │
│ ┌──────────────────────────────┐    │
│ │ 2.3 委托给原组件       │    │
│ │ - 其他全部按键         │    │
│ └──────────┬───────────────┘    │
│            │                   │
└─────────────┴───────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Layer 3: 非按键消息             │
│ - 全部委托给原组件            │
│ - 检测状态变化并发布事件       │
└─────────────────────────────────────────┘
```

### 📊 代码模板

```go
func (w *ComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // ═════════════════════════════════════════════════
    // Layer 1: 定向消息处理（所有组件统一）
    // ═════════════════════════════════════════════════
    switch msg := msg.(type) {
    case core.TargetedMsg:
        if msg.TargetID == w.model.id {
            return w.UpdateMsg(msg.InnerMsg)  // 递归解包
        }
        return w, nil, core.Ignored
    }

    // ═════════════════════════════════════════════════
    // Layer 2: 按键消息分层（交互组件）
    // ═════════════════════════════════════════════════
    if keyMsg, ok := msg.(tea.KeyMsg); ok {
        // Layer 2.1: 焦点检查（如果组件支持焦）
        if w.model.Model.Focused != nil && !w.model.Model.Focused() {
            return w, nil, core.Ignored
        }

        // Layer 2.2: 拦截特殊按键
        switch keyMsg.Type {
        case tea.KeyEsc:
            // ESC: 原组件不处理，安全拦截
            if w.model.Model.Blur != nil {
                w.model.Model.Blur()
            }
            // 发布焦变化事件
            return w, core.PublishEvent(w.model.id, core.EventInputFocusChanged,
                map[string]interface{}{"focused": false}), core.Handled

        case tea.KeyTab:
            // Tab: 返回 Ignored 让上层处理导航
            return w, nil, core.Ignored

        case tea.KeyEnter:
            // Enter: 条件拦截（如果需要表单提交）
            if w.model.props.EnterSubmits {  // 如果组件有此属性
                eventCmd := core.PublishEvent(w.model.id, core.EventInputEnterPressed,
                    map[string]interface{}{"value": w.model.Value()})
                return w, eventCmd, core.Ignored
            }
            // fallthrough 让原组件处理 Enter

        default:
            // Layer 2.3: 委托给原组件
            // 记录旧状态
            oldState := w.captureOldState()

            // 让原组件处理
            var cmd tea.Cmd
            w.model.Model, cmd = w.model.Model.Update(keyMsg)

            // 检测状态变化并发布事件
            return w.handleStateChanges(oldState, cmd)
        }
    }

    // ═════════════════════════════════════════════════
    // Layer 3: 非按键消息（所有组件）
    // ═════════════════════════════════════════════════
    oldState := w.captureOldState()
    var cmd tea.Cmd
    w.model.Model, cmd = w.model.Model.Update(msg)
    return w.handleStateChanges(oldState, cmd)
}

// 辅助方法：捕获旧状态
func (w *ComponentWrapper) captureOldState() interface{} {
    // 根据组件类型返回需要监控的状态
    return map[string]interface{}{
        "value":  w.model.Value(),
        "focused": w.model.Focused(),
        "index":  w.model.Index(),
    }
}

// 辅助方法：处理状态变化
func (w *ComponentWrapper) handleStateChanges(oldState interface{}, cmd tea.Cmd) (core.ComponentInterface, tea.Cmd, core.Response) {
    newState := w.captureOldState()
    var eventCmds []tea.Cmd

    // 比较状态并发布事件
    if oldState["value"] != newState["value"] {
        eventCmds = append(eventCmds,
            core.PublishEvent(w.model.id, core.EventInputValueChanged,
                map[string]interface{}{
                    "oldValue": oldState["value"],
                    "newValue": newState["value"],
                }))
    }

    // 其他状态比较...

    if len(eventCmds) > 0 {
        return w, tea.Batch(append([]tea.Cmd{cmd}, eventCmds...)...), core.Handled
    }
    return w, cmd, core.Handled
}
```

---

## 组件按键绑定系统

### 💡 设计理念

参考全局按键绑定机制，为每个组件增加独立的 `bindings` 配置功能，允许：

1. 覆盖组件默认的按键处理逻辑
2. 添加自定义按键处理（如快捷操作）
3. 与组件事件系统无缝集成

### 📐 架构设计

```
┌─────────────────────────────────────────┐
│   按键消息进入组件 UpdateMsg()          │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ 1. 检查组件 Bindings │  ← 优先级最高
    └──────────┬───────────┘
               │
               ├─→ 有匹配？
               │   ├─→ 是 → 执行用户配置的处理
               │   │         发布自定义事件
               │   │         返回 Handled
               │   │
               │   └─→ 否
               │
               ▼
    ┌──────────────────────┐
    │ 2. 执行默认拦截逻辑  │  ← 次优先级
    │    (ESC/Tab/Enter)   │
    └──────────┬───────────┘
               │
               ├─→ 有拦截？
               │   ├─→ 是 → 执行默认处理
               │   │         发布标准事件
               │   │         返回 Handled/Ignored
               │   │
               │   └─→ 否
               │
               ▼
    ┌──────────────────────┐
    │ 3. 委托给原组件处理  │  ← 兜底策略
    └──────────┬───────────┘
               │
               └─→ 执行原生 bubbles 组件逻辑
                   检测状态变化
                   发布标准事件
```

### 🔧 核心实现

#### 数据结构定义（支持三种配置模式）

```go
// ComponentBinding 定义组件级别的按键绑定
// 支持三种配置模式：Action/Event/Default
type ComponentBinding struct {
    // Key 按键定义，支持 bubbles/key 的所有格式
    // 示例: "ctrl+c", "enter", "esc", "tab", "up", "down"
    Key string `json:"key"`

    // 模式1: Action - 强大的回调支持 Process/Script/Payload
    // 优先级最高，支持无代码配置
    Action *core.Action `json:"action,omitempty"`

    // 模式2: Event - 简单事件发布（需要写 handler）
    // 优先级次之，适合简单通知
    Event string `json:"event,omitempty"`

    // 模式3: UseDefault - 回退到原组件默认行为
    // 优先级最低，保持兼容性
    UseDefault bool `json:"useDefault,omitempty"`

    // Optional fields
    Enabled     bool   `json:"enabled"`                 // 默认 true
    Description string `json:"description,omitempty"`   // 帮助信息显示
    Shortcut    string `json:"shortcut,omitempty"`      // 覆盖 Key 的显示文本
}

// 核心 Action 结构（已在 core/types.go 定义）
//
// 支持三种执行方式：
// 1. Process    - 调用 Yao Flow/Script Process
// 2. Script     - 调用脚本方法
// 3. Payload    - 直接更新全局状态
//
// 配置格式：
// {
//   "process": "users.save",      // Yao Process 名称
//   "script": "scripts/handlers", // 脚本路径
//   "method": "submitForm",       // 脚本方法名
//   "args": ["{{value}}"],       // 参数支持模板表达式
//   "onSuccess": "saveResult",    // 成功时存储到状态
//   "onError": "__error",         // 失败时存储到状态
//   "payload": {"key": "value"}   // 直接更新状态
// }
```

#### 组件 Props 扩展

每个交互组件的 Props 需要添加 Bindings 字段：

```go
type InputProps struct {
    Placeholder string
    Value       string
    Prompt      string
    Color       string
    Background  string
    Width       int
    Height      int
    Disabled    bool

    // 新增：按键绑定配置（可选，默认为空）
    Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}

type ListProps struct {
    Items   []ListItem
    Focused bool

    Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}

type TableProps struct {
    Rows    []interface{}
    Focused bool

    Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}
```

#### 组件 Props 扩展

每个组件的 Props 需要添加 Bindings 字段：

```go
type InputProps struct {
    // 现有字段...
    Placeholder string `json:"placeholder"`
    Value       string `json:"value"`

    // 新增：按键绑定配置
    Bindings []ComponentBinding `json:"bindings,omitempty"`
}

type ListProps struct {
    // 现有字段...
    Items   []ListItem `json:"items"`
    Focused bool       `json:"focused"`

    // 新增：按键绑定配置
    Bindings []ComponentBinding `json:"bindings,omitempty"`
}
```

#### 通用绑定匹配逻辑（三种模式智能分发）

```go
// HandleBinding 处理组件自定义按键绑定
// 返回: (命令, 响应状态, 是否已处理)
func (w *ComponentWrapper) HandleBinding(
    keyMsg tea.KeyMsg,
    binding core.ComponentBinding,
) (tea.Cmd, core.Response, bool) {

    // ═════════════════════════════════════════════════
    // 模式1: Action - Process/Script/Payload（最高优先级）
    // ═════════════════════════════════════════════════
    if binding.Action != nil {
        log.Trace("Component[%s] Execute Action: %s", w.model.id, binding.Action.Process)
        return w.executeAction(binding.Action), core.Handled, true
    }

    // ═════════════════════════════════════════════════
    // 模式2: Event - 简单事件发布（次优先级）
    // ═════════════════════════════════════════════════
    if binding.Event != "" {
        log.Trace("Component[%s] Publish Event: %s", w.model.id, binding.Event)

        // 收集组件上下文数据
        eventData := map[string]interface{}{
            "key":      binding.Key,
            "type":     keyMsg.Type.String(),
            "ctrl":     keyMsg.Ctrl,
            "alt":      keyMsg.Alt,
        }

        // 尝试添加组件特定数据
        if valuer, ok := w.model.(interface{ GetValue() string }); ok {
            eventData["value"] = valuer.GetValue()
        }
        if selector, ok := w.model.(interface{ GetSelected() (interface{}, bool) }); ok {
            if item, found := selector.GetSelected(); found {
                eventData["selected"] = item
            }
        }
        if indexer, ok := w.model.(interface{ GetIndex() int }); ok {
            eventData["index"] = indexer.GetIndex()
        }

        eventCmd := core.PublishEvent(w.model.id, binding.Event, eventData)
        return eventCmd, core.Handled, true
    }

    // ═════════════════════════════════════════════════
    // 模式3: UseDefault - 回退到默认处理（最低优先级）
    // ═════════════════════════════════════════════════
    if binding.UseDefault {
        log.Trace("Component[%s] Use default behavior for key: %s", w.model.id, binding.Key)
        return nil, core.Ignored, false
    }

    // 未配置任何处理，使用默认行为
    return nil, core.Ignored, false
}

// executeAction 执行绑定的 Action（Process/Script/Payload）
func (w *ComponentWrapper) executeAction(action *core.Action) tea.Cmd {

    if action == nil {
        return nil
    }

    // 复制 action 以避免修改原配置
    actionCopy := *action

    // 智能参数注入：自动添加组件上下文
    if actionCopy.Args == nil {
        actionCopy.Args = []interface{}{}
    }

    // 构建上下文地图（支持 {{表达}} 自动注入）
    context := map[string]interface{}{
        "componentID": w.model.id,
        "timestamp":   time.Now(),
    }

    // 尝试添加组件特定数据
    if valuer, ok := w.model.(interface{ GetValue() string }); ok {
        context["value"] = valuer.GetValue()
    }
    if selector, ok := w.model.(interface{ GetSelected() (interface{}, bool) }); ok {
        if item, found := selector.GetSelected(); found {
            context["selected"] = item
        }
    }
    if indexer, ok := w.model.(interface{ GetIndex() int }); ok {
        context["index"] = indexer.GetIndex()
    }

    // 添加到参数列表（如果未配置 args，自动注入 context）
    if len(actionCopy.Args) == 0 {
        actionCopy.Args = []interface{}{context}
    }

    // 发送到全局 Model 执行（通过特殊消息）
    return func() tea.Msg {
        return core.ExecuteActionMsg{
            Action:    &actionCopy,
            SourceID:  w.model.id,
            Timestamp: time.Now(),
        }
    }
}

// CheckComponentBindings 快捷绑定匹配函数
// 返回: (是否匹配, 绑定配置, 是否已处理)
func CheckComponentBindings(
    keyMsg tea.KeyMsg,
    bindings []core.ComponentBinding,
    componentID string,
) (bool, *core.ComponentBinding, bool) {

    for _, binding := range bindings {
        if !binding.Enabled {
            continue
        }

        kb := key.NewBinding(key.WithKeys(binding.Key))
        if key.Matches(keyMsg, kb) {
            // 发现匹配
            if binding.UseDefault {
                return true, &binding, false
            }
            return true, &binding, true
        }
    }

    return false, nil, false
}
```

**核心类型定义（需要添加到 core/types.go）**：

```go
// ExecuteActionMsg 用于将组件绑定的 Action 发送到全局 Model 执行
type ExecuteActionMsg struct {
    Action    *Action
    SourceID  string
    Timestamp time.Time
}
```

#### UpdateMsg 统一模板（含三种绑定模式支持）

```go
func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // ═════════════════════════════════════════════════
    // Layer 1: 定向消息处理（所有组件统一）
    // ═════════════════════════════════════════════════
    switch msg := msg.(type) {
    case core.TargetedMsg:
        if msg.TargetID == w.model.id {
            return w.UpdateMsg(msg.InnerMsg)
        }
        return w, nil, core.Ignored

    case tea.KeyMsg:
        // ═════════════════════════════════════════════════
        // Layer 0: 组件绑定检查（最高优先级）
        // ═════════════════════════════════════════════════
        if matched, binding := CheckComponentBindings(
            msg,
            w.model.props.Bindings,
            w.model.id,
        ); matched {

            if cmd, response, handled := w.HandleBinding(msg, *binding); handled {
                return w, cmd, response
            }

            // useDefault = true，继续执行默认处理
        }

        // ═════════════════════════════════════════════════
        // Layer 1: 焦点检查（交互组件必需）
        // ═════════════════════════════════════════════════
        if !w.model.Focused() {
            return w, nil, core.Ignored
        }

        // ═════════════════════════════════════════════════
        // Layer 2: 组件默认拦截逻辑
        // ═══════════════════════════════════════════════━━━━
        switch msg.Type {
        case tea.KeyEsc:
            w.model.Blur()
            eventCmd := core.PublishEvent(w.model.id, core.EventInputFocusChanged,
                map[string]interface{}{"focused": false})
            return w, eventCmd, core.Handled

        case tea.KeyEnter:
            old := w.model.Value()
            var cmd tea.Cmd
            w.model.Model, cmd = w.model.Model.Update(msg)

            eventCmds := []tea.Cmd{
                core.PublishEvent(w.model.id, core.EventInputEnterPressed,
                    map[string]interface{}{"value": w.model.Value()}),
            }

            if old != w.model.Value() {
                eventCmds = append(eventCmds,
                    core.PublishEvent(w.model.id, core.EventInputValueChanged,
                        map[string]interface{}{
                            "oldValue": old,
                            "newValue": w.model.Value(),
                        }))
            }

            if len(eventCmds) > 0 {
                return w, tea.Batch(append([]tea.Cmd{cmd}, eventCmds...)...), core.Handled
            }
            return w, cmd, core.Handled

        case tea.KeyTab:
            return w, nil, core.Ignored
        }

        // ═══════════════════════════════════════════════━━━━
        // Layer 3: 委托给原组件处理（兜底）
        // ═══════════════════════════════════════════════━━━━
        oldValue := w.model.Value()
        var cmd tea.Cmd
        w.model.Model, cmd = w.model.Model.Update(msg)
        newValue := w.model.Value()

        if oldValue != newValue {
            eventCmd := core.PublishEvent(w.model.id, core.EventInputValueChanged,
                map[string]interface{}{
                    "oldValue": oldValue,
                    "newValue": newValue,
                })
            if cmd != nil {
                return w, tea.Batch(cmd, eventCmd), core.Handled
            }
            return w, eventCmd, core.Handled
        }

        return w, cmd, core.Handled
    }

    // ═══════════════════════════════════════════════━━━━
    // Layer 4: 非按键消息（全部委托）
    // ═══════════════════════════════════════════════━━━━
    var cmd tea.Cmd
    w.model.Model, cmd = w.model.Model.Update(msg)
    return w, cmd, core.Handled
}
```

**四层处理优先级**：

1. **Layer 0**: 组件 Bindings（Action/Event/Default）
2. **Layer 1**: 焦点检查
3. **Layer 2**: 组件默认拦截（ESC/Tab/Enter）
4. **Layer 3**: 委托给原组件处理

### 📝 使用示例

### 🎯 快速配置指南

| 我想...  | 使用模式         | 配置示例                                             | 需要写代码？ |
| -------- | ---------------- | ---------------------------------------------------- | ------------ |
| 保存数据 | Action (Process) | `{"action":{"process":"users.save"}}`                | ❌ 否 ⭐     |
| 刷新数据 | Action (Script)  | `{"action":{"script":"data.js","method":"refresh"}}` | ❌ 否 ⭐     |
| 更新状态 | Action (Payload) | `{"action":{"payload":{"visible":true}}}`            | ❌ 否 ⭐     |
| 发送通知 | Event            | `{"event":"show_notification"}`                      | ✅ 是 ⚠️     |
| 恢复默认 | Default          | `{"useDefault":true}`                                | ❌ 否 ⭐     |
| 禁止按键 | Event + Handler  | `{"event":"block_copy"}`                             | ✅ 是 ⚠️     |

### 使用指南 - 三种配置模式

| 模式        | 适用场景                    | 配置难度        | 需要写代码 | 推荐度 |
| ----------- | --------------------------- | --------------- | ---------- | ------ |
| **Action**  | 调用 Process/Script/Payload | ⭐ 无需代码     | ❌ 否      | ⭐⭐⭐ |
| **Event**   | 简单事件通知                | ⭐⭐ 需 handler | ✅ 是      | ⭐⭐   |
| **Default** | 恢复默认行为                | ⭐ 无需代码     | ❌ 否      | ⭐     |

---

#### 示例 1: Action 模式 - 调用 Yao Process（⭐ 推荐）

场景：用户按 Ctrl+S 保存输入数据到后端

```json
{
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
    }
  ]
}
```

**说明**：

- 完全无需代码配置
- `{{value}}` 和 `{{componentID}}` 会被自动替换成实际值
- 执行成功后 `saveResult` 状态字段存储结果
- 执行失败后 `__error` 状态字段存储错误信息

---

#### 示例 2: Action 模式 - 调用 Script 方法

场景：按 F5 刷新表格数据

```json
{
  "type": "table",
  "id": "data_table",
  "bindings": [
    {
      "key": "f5",
      "action": {
        "script": "scripts/data",
        "method": "refreshTable",
        "args": ["{{componentID}}"],
        "onSuccess": "tableData",
        "onError": "__error"
      },
      "enabled": true,
      "description": "刷新数据"
    }
  ]
}
```

**说明**：

- 调用 `scripts/data.js` 文件中的 `refreshTable` 函数
- 执行成功后自动更新 `tableData` 状态
- 表格组件监听 `tableData` 变化自动刷新

---

#### 示例 3: Action 模式 - Payload 直接更新状态

场景：按 `t` 切换工具提示显示

```json
{
  "type": "list",
  "id": "file_list",
  "bindings": [
    {
      "key": "t",
      "action": {
        "payload": {
          "showTooltip": "toggle"
        }
      },
      "enabled": true,
      "description": "切换帮助提示"
    }
  ]
}
```

**说明**：

- `toggle` 是特殊关键字，表示取反
- `showTooltip` 状态会自动从 true/false 切换

#### 示例 4: Event 模式 - 自定义事件处理

场景：List 组件按 `d` 删除选中项

```json
{
  "type": "list",
  "id": "file_list",
  "items": [...],
  "focused": true,
  "bindings": [
    {
      "key": "d",
      "event": "delete_selected_item",
      "enabled": true,
      "description": "删除选中项"
    },
    {
      "key": "r",
      "event": "rename_selected_item",
      "enabled": true,
      "description": "重命名选中项"
    }
  ]
}
```

**TUI Model 处理代码**：

```go
// model.go - 添加事件 handler
handlers["delete_selected_item"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
    model := m.(*Model)

    // 获取事件数据
    eventData, ok := msg.(core.EventMsg)
    if !ok {
        return m.(tea.Model), nil
    }

    // 获取选中的项
    selectedIndex := eventData.Data["index"].(int)
    selectedItem := model.Components["file_list"].GetSelected()

    // 删除逻辑...
    log.Trace("Delete item: %v at index: %d", selectedItem, selectedIndex)

    return model, nil
}
```

**说明**：

- Event 模式需要在 Model 中编写 handler
- 事件数据包含 `index`, `selected`, `value` 等上下文信息
- 适合需要复杂逻辑的场景

---

#### 示例 5: Default 模式 - 恢复默认行为

场景：自定义 Enter 行为，但保留 ESC 默认失焦

```json
{
  "type": "input",
  "id": "search_box",
  "placeholder": "搜索...",
  "bindings": [
    {
      "key": "enter",
      "action": {
        "process": "search.execute",
        "args": ["{{value}}"]
      },
      "description": "执行搜索"
    },
    {
      "key": "esc",
      "useDefault": true,
      "description": "失焦（默认行为）"
    }
  ]
}
```

**说明**：

- Enter 按键被拦截，执行搜索 Process
- ESC 按键使用 `useDefault: true`，回退到默认失焦行为
- 优先级：Action > Default > 原组件处理

---

#### 示例 6: 禁用特定按键（安全场景）

场景：密码输入框禁止复制粘贴

```json
{
  "type": "input",
  "id": "password",
  "placeholder": "请输入密码",
  "bindings": [
    {
      "key": "ctrl+c",
      "event": "block_copy",
      "enabled": true,
      "description": "禁止复制"
    },
    {
      "key": "ctrl+v",
      "event": "block_paste",
      "enabled": true,
      "description": "禁止粘贴"
    },
    {
      "key": "ctrl+x",
      "event": "block_cut",
      "enabled": true,
      "description": "禁止剪切"
    }
  ]
}
```

**Model 处理代码**：

```go
handlers["block_copy"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
    model := m.(*Model)
    log.Warn("Blocked copy attempt in password field")

    // 显示警告（可选）
    model.State["warning"] = "为了安全，不允许复制密码"

    return model, nil
}
```

#### 示例 3: 禁用特定按键

```json
{
  "type": "input",
  "id": "password",
  "bindings": [
    {
      "key": "ctrl+c",
      "action": "block_copy",
      "enabled": true,
      "description": "禁止复制"
    },
    {
      "key": "ctrl+v",
      "action": "block_paste",
      "enabled": true,
      "description": "禁止粘贴"
    }
  ]
}
```

### ⚙️ 实现要点

1. **三模式优先级**:
   - `Action` > `Event` > `UseDefault` > 原组件处理
   - 无代码配置优先（Action > Event）

2. **兼容性保证**:
   - 不影响现有代码
   - Bindings 为可选配置（数组为空表示未配置）
   - 空配置时行为与原组件完全一致

3. **参数自动注入**:
   - `{{value}}`: 组件当前值（Input/Textarea）
   - `{{selected}}`: 选中项（List/Menu/Table）
   - `{{index}}`: 当前索引
   - `{{componentID}}`: 组件ID

4. **性能考虑**:
   - 绑定匹配在 O(n) 复杂度内完成
   - 建议每个组件绑定数量 < 10
   - 缓存常用 key.Binding 对象

### 🔒 安全注意事项

1. **防止冲突**:
   - 组件 Bindings 优先级高于全局 Bindings
   - 文档中说明潜在冲突场景

2. **输入验证**:
   - 验证 Key 格式有效性（使用 bubbles/key）
   - 验证 Action 参数合法性

3. **权限控制**:
   - Process 调用应在后端验证权限
   - 敏感操作（删除、提交）应有二次确认
   - 危险操作应在全局层面审计

4. **错误处理**:
   - Process/Script 失败时自动存储到 `onError` 状态
   - 建议统一使用 `onError: "__error"`

### ❓ 常见问题（FAQ）

#### Q1: 如何选择配置模式？

**原则：无代码优先**

- 90% 场景使用 **Action (Process/Script)**：无需 handler，自动注入参数
- 简单通知用 **Event**：需要写 handler，但灵活性高
- 保持兼容用 **Default**：不改变原有行为

#### Q2: `{{value}}` 和 `{{selected}}` 在哪里可用？

- `{{value}}`: Input, Textarea 组件的当前值
- `{{selected}}`: List, Menu, Table 组件的选中项
- `{{index}}`: 所有列表类组件的当前索引
- `{{componentID}}`: 所有组件的 ID

#### Q3: Action 和 Event 可以同时配置吗？

**不可以**，优先级是：

1. Action（如果存在）
2. Event（否则）
3. UseDefault（否则）

只配置其中一个即可。

#### Q4: Process 或 Script 执行失败怎么办？

配置 `onError` 字段自动存储错误：

```json
{
  "key": "ctrl+s",
  "action": {
    "process": "save.data",
    "onSuccess": "saveResult",
    "onError": "__error"
  }
}
```

失败后，`__error` 状态自动包含错误信息。

#### Q5: 如何禁用某个按键？

使用 Event 模式，并在 handler 中拦截：

```json
{
  "key": "ctrl+c",
  "event": "block_copy"
}
```

```go
handlers["block_copy"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
    log.Warn("Blocked copy")
    return m.(tea.Model), nil
}
```

#### Q6: 组件 Bindings 会影响全局 Bindings 吗？

**会**，优先级：组件 Bindings > 全局 Bindings

如果同一个按键在组件和全局都配置了，组件的优先。

#### Q7: 动态修改 Bindings 吗？

通过 UpdateRenderConfig 更新：

```go
newBindings := []core.ComponentBinding{
    {Key: "x", Event: "custom_action"},
}

config := core.RenderConfig{
    Data: InputProps{
        Bindings: newBindings,
    },
}

wrapper.UpdateRenderConfig(config)
```

#### Q8: 如何调试绑定问题？

1. 查看日志：`log.Trace("Component[%s] Matched binding", id)`
2. 确认 `enabled: true`
3. 验证 Key 格式（使用 bubbles/key 标准格式）
4. 检查优先级（Action > Event > Default）

---

## 统一消息处理工具

### 💡 设计背景

经过对所有组件的消息处理逻辑分析，发现高度共同性：

#### 共同模式分析

| 模式             | 所组件                         | 重复度 |
| ---------------- | ------------------------------ | ------ |
| **定向消息**     | Input, List, Menu, Table, Chat | 100%   |
| **焦点检查**     | Input, List, Menu, Table       | 100%   |
| **状态捕获**     | Input, List, Table             | 90%    |
| **状态变化检测** | 所有交互组件                   | 85%    |
| **按键分层**     | 所有交互组件                   | 100%   |

#### 重复代码统计

| 组件     | UpdateMsg 行数 | 重复逻辑占比 |
| -------- | -------------- | ------------ |
| input.go | 80-100 行      | ~70%         |
| list.go  | 70-90 行       | ~65%         |
| menu.go  | 120-150 行     | ~60%         |
| table.go | 130-160 行     | ~60%         |

**结论**: 约有 30-40% 的代码是可抽象的通用逻辑。

### 🎯 重构目标

1. **减少重复**: 消除 60-70% 的重复代码
2. **一致性**: 统一所有组件的消息处理模式
3. **可维护性**: 降低新组件开发成本
4. **扩展性**: 便于添加新的消息处理功能

### 📐 架构设计

#### 三层抽象模型

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: 基础辅助函数（无状态，独立）                │
│ - HandleTargetedMsg()      定向消息处理              │
│ - CheckFocus()             焦点检查                  │
│ - HandleStateChanges()     状态变化处理              │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Layer 2: 状态助手（有状态，组件特定）                │
│ - InputStateHelper         输入组件状态              │
│ - ListStateHelper          列表组件状态              │
│ - TableStateHelper         表格组件状态              │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Layer 3: 通用模板（组合使用）                       │
│ - DefaultInteractiveUpdateMsg() 交互组件模板         │
│ - DefaultPassiveUpdateMsg()   被动组件模板          │
└─────────────────────────────────────────────────────┘
```

### 🔧 核心实现

#### 1. InteractiveBehavior 接口

该接口整合了组件的通用行为：

```go
type InteractiveBehavior interface {
    ComponentInterface      // 基础组件接口
    StateCapturable         // 状态捕获接口
    HasFocus() bool         // 焦点检查
    HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, Response, bool) // 特殊按键处理
}
```

#### 2. StateCapturable 接口

用于标准化状态变化检测：

```go
type StateCapturable interface {
    CaptureState() map[string]interface{}                    // 捕获当前状态
    DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd  // 检测变化并发布事件
}
```

#### 3. DefaultInteractiveUpdateMsg 函数

这是核心的通用消息处理模板：

```go
func DefaultInteractiveUpdateMsg(
    w InteractiveBehavior,                                    // 组件实例
    msg tea.Msg,                                             // 接收到的消息
    getBindings func() []ComponentBinding,                   // 获取按键绑定（可选）
    handleBinding func(keyMsg tea.KeyMsg, binding ComponentBinding) (tea.Cmd, Response, bool), // 处理绑定
    delegateUpdate func(msg tea.Msg) tea.Cmd,               // 委托给原组件处理
) (tea.Cmd, Response)                                      // 返回命令和响应状态
```

### 状态助手类

为常用组件类型提供预设的状态管理实现：

- **InputStateHelper**: 用于输入组件的状态管理
- **ListStateHelper**: 用于列表组件的状态管理

### 📊 重构收益评估

| 指标           | 重构前             | 重构后         | 改善             |
| -------------- | ------------------ | -------------- | ---------------- |
| **代码行数**   | 400-500 行         | 150-200 行     | 减少 60-70%      |
| **重复代码**   | ~70%               | ~10%           | 减少 85%         |
| **新组件开发** | 80-100 行          | 20-30 行       | 减少 70%         |
| **维护成本**   | 高（每个组件独立） | 低（集中管理） | 显著降低         |
| **测试覆盖率** | 需要为每个组件测试 | 只需要测试工具 | 节省大量测试代码 |

### ⚙️ 实施计划

实施步骤详见 `BUBBLES_OPTIMIZATION_TODO.md` 阶段 0.5，预计总时间 **~10 小时**。

### ❓ 常见问题

#### Q1: 为什么不创建一个 BaseComponent？

**A**: 组合优于继承。使用 Trait 模式（接口）比继承更灵活：

- 组件可以选择实现哪些能力
- 可以组合多个 StateHelper
- 避免深度继承层次

#### Q2: 是否所有组件都必须使用这个工具？

**A**: 不是完全强制。

- P0 组件（交互组件）：强烈建议使用
- P1/P2 组件：可以选择性使用
- 特殊组件：可以完全自定义

#### Q3: 性能开销如何？

**A**: 经过优化，性能开销 < 2%

- 状态捕获：简单的 map 赋值
- 动态分配：可以预先分配，复用 map
- 接口调用：Go runtime 优化良好

#### Q4: 如何处理自定义事件？

**A**: StateHandler 是完全可扩展的

- 可以实现自定义 DetectStateChanges
- 可以添加自定义事件发布逻辑
- 可以创建自定义 StateHelper

---

## 各组件优化方案

### 组件优化总体思路

所有交互组件统一使用**统一消息处理工具**进行重构，这是当前优化工作的核心，遵循以下原则：

1. **实现 InteractiveBehavior 接口**，定义组件的特定行为
2. **使用 StateHelper** 统一状态变化检测逻辑
3. **调用 DefaultInteractiveUpdateMsg** 模板处理消息
4. **仅实现组件特定的逻辑**，其他全部委托

**重要**: 所有新开发或重构的组件都应该使用这个统一的消息处理工具，以确保代码的一致性和可维护性。

### 新的重构范式：统一消息处理模板

基于组件重构的深入分析，我们确定使用**统一消息处理模板**作为标准重构范式，以替代之前的适配器模式。这种模式能够显著减少重复代码，提高组件间的一致性，并提升可维护性。

#### 传统模式的问题

典型的重复实现结构：

```go
// 重构前的重复实现
func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // Layer 1: 定向消息处理
    // Layer 2: 按键消息分层
    // Layer 3: 状态变化检测
    // 每个组件都重复实现相同的逻辑
    // ...
}
```

**核心问题**：

1. **代码重复**：每个组件都实现相似的消息处理逻辑
2. **维护困难**：修改逻辑需要更新每个组件
3. **不一致性**：不同组件可能有细微差别
4. **开发成本**：新组件需要重复实现相同模式

#### 统一消息处理模板的优势

```go
// 重构后的统一结构
func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用统一的消息处理模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}
```

**优势**：

1. **减少重复代码**：消除 60-70% 的重复实现
2. **提高一致性**：所有组件使用相同的处理模式
3. **易于维护**：只需在一处修改模板逻辑
4. **功能完整**：保持所有原生 bubbles 功能

#### 统一消息处理模板的实现要点

1. **实现 InteractiveBehavior 接口**：在组件包装器中实现必要的行为方法
2. **使用统一模板函数**：调用 `DefaultInteractiveUpdateMsg` 处理消息
3. **实现辅助方法**：实现 `getBindings`, `handleBinding`, `delegateToBubbles` 等辅助方法
4. **状态变化检测**：实现 `CaptureState` 和 `DetectStateChanges` 方法
5. **特殊按键处理**：实现 `HandleSpecialKey` 和 `HasFocus` 方法

---

### 1. Input 组件实现示例 (P0 - 高优先级)

**文件**: `tui/components/input.go`

**重构模式**: ✅ 采用统一消息处理模板

**功能扩展**: ✅ 支持组件按键绑定

**绑定能力**:

- 自定义快捷键（如 F1 帮助、Ctrl+S 快速保存）
- 覆盖默认按键行为
- 完全禁用特定按键（如禁止复制粘贴）

**绑定示例**:

```json
{
  "type": "input",
  "id": "username",
  "bindings": [
    { "key": "f1", "action": "show_help", "description": "显示帮助" },
    { "key": "ctrl+s", "action": "quick_save", "description": "快速保存" },
    { "key": "esc", "action": "default" }
  ]
}
```

**问题分析**:

```go
// ❌ 当前实现（第 233-294 行）
func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) {
    case tea.KeyMsg:
        if !w.model.Focused() {
            return w, nil, core.Ignored  // 问题：阻止所有消息
        }

        switch msg.Type {
        case tea.KeyEsc, tea.KeyEnter, tea.KeyTab:
            // 拦截处理...
        }

        // 其他消息才委托
        w.model.Model, cmd = w.model.Model.Update(msg)
    }
}
```

**优化方案**:

```go
// ✅ 优化后的实现（使用统一消息处理模板）
func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *InputComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *InputComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

// 直接委托方法 - 直接操作原生组件
func (w *InputComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    var cmd tea.Cmd
    w.model.Model, cmd = w.model.Model.Update(msg)
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *InputComponentWrapper) HasFocus() bool {
    return w.model.Focused()
}

func (w *InputComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEsc:
        // ESC: 失焦并发布事件
        w.model.Blur()
        eventCmd := core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{"focused": false})
        return eventCmd, core.Handled, true
    case tea.KeyEnter:
        // Enter: 委托给原组件处理，但发布事件
        oldValue := w.model.Value()
        var cmd tea.Cmd
        w.model.Model, cmd = w.model.Model.Update(keyMsg)
        newValue := w.model.Value()

        eventCmds := []tea.Cmd{
            core.PublishEvent(w.model.id, core.EventInputEnterPressed,
                map[string]interface{}{"value": newValue}),
        }

        if oldValue != newValue {
            eventCmds = append(eventCmds,
                core.PublishEvent(w.model.id, core.EventInputValueChanged,
                    map[string]interface{}{
                        "oldValue": oldValue,
                        "newValue": newValue,
                    }))
        }

        if len(eventCmds) > 0 {
            return tea.Batch(append([]tea.Cmd{cmd}, eventCmds...)...), core.Handled, true
        }
        return cmd, core.Handled, true
    case tea.KeyTab:
        // Tab: 返回 Ignored 让上层处理导航
        return nil, core.Ignored, true
    }

    return nil, core.Handled, false
}

func (w *InputComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "value":   w.model.Value(),
        "focused": w.model.Focused(),
    }
}

func (w *InputComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    if oldState["value"] != newState["value"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, core.EventInputValueChanged,
            map[string]interface{}{
                "oldValue": oldState["value"],
                "newValue": newState["value"],
            }))
    }

    if oldState["focused"] != newState["focused"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{
                "focused": newState["focused"],
            }))
    }

    return cmds
}

// 辅助函数
func (w *InputComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *InputComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

func (w *InputComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.Model.Update(msg)
    w.model.Model = updatedModel.(textinput.Model)
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *InputComponentWrapper) HasFocus() bool {
    return w.model.Focused()
}

func (w *InputComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEsc:
        // ESC: 原生 textinput 不处理，安全拦截
        w.model.Blur()
        eventCmd := core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{"focused": false})
        return eventCmd, core.Handled, true
    case tea.KeyEnter:
        // Enter: 委托给原组件（textinput 处理 Enter），但发布事件
        oldValue := w.model.Value()
        var cmd tea.Cmd
        w.model.Model, cmd = w.model.Model.Update(keyMsg)
        newValue := w.model.Value()

        eventCmds := []tea.Cmd{
            core.PublishEvent(w.model.id, core.EventInputEnterPressed,
                map[string]interface{}{"value": newValue}),
        }

        if oldValue != newValue {
            eventCmds = append(eventCmds,
                core.PublishEvent(w.model.id, core.EventInputValueChanged,
                    map[string]interface{}{
                        "oldValue": oldValue,
                        "newValue": newValue,
                    }))
        }

        return tea.Batch(append([]tea.Cmd{cmd}, eventCmds...)...), core.Handled, true
    case tea.KeyTab:
        // Tab: 返回 Ignored 让上层处理导航
        return nil, core.Ignored, true
    }

    return nil, core.Handled, false
}

func (w *InputComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "value":   w.model.Value(),
        "focused": w.model.Focused(),
    }
}

func (w *InputComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    if oldState["value"] != newState["value"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, core.EventInputValueChanged,
            map[string]interface{}{
                "oldValue": oldState["value"],
                "newValue": newState["value"],
            }))
    }

    if oldState["focused"] != newState["focused"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{
                "focused": newState["focused"],
            }))
    }

    return cmds
}
```

**优化要点**:

- ✅ 保留 textinput 原生的所有按键处理
- ✅ 只拦截 ESC 用于失焦
- ✅ Tab 返回 Ignored 用于组件导航
- ✅ Enter 委托给 textinput 后发布事件
- ✅ 统一使用"先记录后检测"模式

**收益**:

- 恢复 textinput 的完整编辑能力（光标、选择、剪贴板）
- 代码更清晰，逻辑更简单
- 事件系统保持完整

---

### 2. List 组件 (P0 - 高优先级)

**文件**: `tui/components/list.go`

**重构模式**: ✅ 采用统一消息处理模板

**问题分析**:

```go
// ❌ 当前实现（第 244-313 行）
func (w *ListComponentWrapper) UpdateMsg(msg tea.Msg) {
    case tea.KeyMsg:
        if !w.model.props.Focused {  // 问题：使用自定义焦
            return w, nil, core.Ignored
        }

        switch msg.Type {
        case tea.KeyEnter, tea.KeyTab:
            // 拦截...
        }

        // 其他消息才委托
        w.model.Model, cmd = w.model.Model.Update(msg)
    }
}
```

**优化方案**:

```go
// ✅ 优化后的实现（使用统一消息处理模板）
func (w *ListComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *ListComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *ListComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

// 直接委托方法 - 直接操作原生组件
func (w *ListComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.Model.Update(msg)
    w.model.Model = updatedModel
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *ListComponentWrapper) HasFocus() bool {
    return w.model.props.Focused
}

func (w *ListComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEnter:
        // Enter: 发布选择事件
        if selectedItem := w.model.SelectedItem(); selectedItem != nil {
            item := selectedItem.(ListItem)
            eventCmd := core.PublishEvent(w.model.id, core.EventMenuItemSelected,
                map[string]interface{}{
                    "item":  item,
                    "index": w.model.Index(),
                    "title": item.Title,
                    "value": item.Value,
                })
            return eventCmd, core.Handled, true
        }
        return nil, core.Handled, true
    case tea.KeyTab:
        // Tab: 返回 Ignored 让上层处理导航
        return nil, core.Ignored, true
    }

    return nil, core.Handled, false
}

func (w *ListComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "index": w.model.Index(),
        "selected": w.model.SelectedItem(),
        "focused": w.model.props.Focused,
    }
}

func (w *ListComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    if oldState["index"] != newState["index"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, "LIST_SELECTION_CHANGED",
            map[string]interface{}{
                "oldIndex": oldState["index"],
                "newIndex": newState["index"],
            }))
    }

    return cmds
}
```

**优化要点**:

- ✅ 保留 list 原生的导航能力
- ✅ 只拦截 Enter 和 Tab
- ✅ 统一选择变化检测
- ✅ 采用直接实现模式，移除中间包装层

---

### 3. Menu 组件 (P0 - 高优先级)

**文件**: `tui/components/menu.go`

**重构模式**: ✅ 采用统一消息处理模板

**问题分析**:

- 使用自定义焦状态 `w.model.focused`
- 复杂的导航逻辑重复实现
- 子菜单处理可以委托给原 list 组件

**优化方案**:

```go
// ✅ 优化后的实现（使用统一消息处理模板）
func (w *MenuComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *MenuComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *MenuComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

// 直接委托方法 - 直接操作原生组件
func (w *MenuComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.Model.Update(msg)
    w.model.Model = updatedModel
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *MenuComponentWrapper) HasFocus() bool {
    return w.model.focused
}

func (w *MenuComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEsc:
        // ESC: 失焦并返回父菜单
        if w.model.CurrentLevel > 0 {
            // 返回父菜单逻辑...
            eventCmd := core.PublishEvent(w.model.ID, core.EventMenuSubmenuExited,
                map[string]interface{}{
                    "previousPath": w.model.Path,
                    "currentPath": w.model.Path[:len(w.model.Path)-1],
                    "level": w.model.CurrentLevel - 1,
                })
            return eventCmd, core.Handled, true
        }
        return nil, core.Handled, true
    case tea.KeyEnter:
        // Enter: 处理选择或进入子菜单
        selectedItem := w.model.Model.SelectedItem()
        if menuItem, ok := selectedItem.(MenuItem); ok {
            if menuItem.HasSubmenu() {
                // 进入子菜单
                w.model.Path = append(w.model.Path, menuItem.Title)
                w.model.CurrentLevel++
                // 加载子菜单...
                eventCmd := core.PublishEvent(w.model.ID, core.EventMenuSubmenuEntered,
                    map[string]interface{}{
                        "item": menuItem,
                        "parentPath": w.model.Path[:len(w.model.Path)-1],
                        "currentPath": w.model.Path,
                        "level": w.model.CurrentLevel,
                    })
                return eventCmd, core.Handled, true
            } else {
                // 叶子项选择
                eventCmd := core.PublishEvent(w.model.ID, core.EventMenuItemSelected,
                    map[string]interface{}{
                        "item": menuItem,
                        "action": menuItem.Action,
                        "path": w.model.Path,
                        "level": w.model.CurrentLevel,
                    })
                return eventCmd, core.Handled, true
            }
        }
        return nil, core.Handled, true
    case tea.KeyTab:
        // Tab: 返回 Ignored 让上层处理导航
        return nil, core.Ignored, true
    }

    return nil, core.Handled, false
}

func (w *MenuComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "currentIndex": w.model.Model.Index(),
        "currentPath": w.model.Path,
        "currentLevel": w.model.CurrentLevel,
        "focused": w.model.focused,
    }
}

func (w *MenuComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    // 检测菜单状态变化并发布相应事件
    if oldState["currentIndex"] != newState["currentIndex"] {
        // 选择项变化
        cmds = append(cmds, core.PublishEvent(w.model.ID, "MENU_SELECTION_CHANGED",
            map[string]interface{}{
                "oldIndex": oldState["currentIndex"],
                "newIndex": newState["currentIndex"],
                "path": newState["currentPath"],
            }))
    }

    if oldState["currentLevel"] != newState["currentLevel"] {
        // 级别变化
        if oldState["currentLevel"].(int) < newState["currentLevel"].(int) {
            // 进入子菜单
            cmds = append(cmds, core.PublishEvent(w.model.ID, "MENU_ENTER_SUBMENU",
                map[string]interface{}{
                    "path": newState["currentPath"],
                    "level": newState["currentLevel"],
                }))
        } else {
            // 返回父菜单
            cmds = append(cmds, core.PublishEvent(w.model.ID, "MENU_EXIT_SUBMENU",
                map[string]interface{}{
                    "path": newState["currentPath"],
                    "level": newState["currentLevel"],
                }))
        }
    }

    return cmds
}
```

---

### 4. Table 组件 (P0 - 高优先级)

**文件**: `tui/components/table.go`

**重构模式**: ✅ 采用统一消息处理模板

**问题分析**:

- 实现相对合理
- 可以进一步简化导航按键处理

**优化方案**:

```go
// ✅ 优化后的实现（使用统一消息处理模板）
func (w *TableComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *TableComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *TableComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

// 直接委托方法 - 直接操作原生组件
func (w *TableComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.Model.Update(msg)
    w.model.Model = updatedModel
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *TableComponentWrapper) HasFocus() bool {
    return w.model.Model.Focused()
}

func (w *TableComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyTab:
        // Tab: 返回 Ignored 让上层处理导航
        return nil, core.Ignored, true
    case tea.KeyEnter:
        // Enter: 发布双击/确认事件
        currentSelectedRow := w.model.Model.Cursor()
        if currentSelectedRow >= 0 {
            rows := w.model.Model.Rows()
            var rowData interface{}
            if currentSelectedRow < len(rows) {
                rowData = rows[currentSelectedRow]
            }
            eventCmd := core.PublishEvent(w.model.id, core.EventRowDoubleClicked,
                map[string]interface{}{
                    "rowIndex": currentSelectedRow,
                    "rowData": rowData,
                    "tableID": w.model.id,
                    "trigger": "enter_key",
                })
            return eventCmd, core.Handled, true
        }
        return nil, core.Handled, true
    }

    return nil, core.Handled, false
}

func (w *TableComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "cursor": w.model.Model.Cursor(),
        "rows": w.model.Model.Rows(),
        "focused": w.model.Model.Focused(),
    }
}

func (w *TableComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    // 检测选择行变化
    if oldState["cursor"] != newState["cursor"] {
        var rowData interface{}
        rows := newState["rows"].([][]string)
        currentRow := newState["cursor"].(int)
        if currentRow >= 0 && currentRow < len(rows) {
            rowData = rows[currentRow]
        }

        prevRow := oldState["cursor"].(int)

        eventCmd := core.PublishEvent(w.model.id, core.EventRowSelected,
            map[string]interface{}{
                "rowIndex": currentRow,
                "prevRowIndex": prevRow,
                "rowData": rowData,
                "tableID": w.model.id,
                "navigationKey": "arrow_keys", // 假设是通过箭头键导航
            })

        cmds = append(cmds, eventCmd)
    }

    return cmds
}
```

---

### 5. Chat 组件 (P0 - 高优先级)

**文件**: `tui/components/chat.go`

**重构模式**: ✅ 采用统一消息处理模板

**问题分析**:

- 包含了 textarea 封装，继承了相同问题
- 焦点检查阻止消息进入 textarea 内部

**优化方案**:

```go
// ✅ 优化后的 UpdateMsg 方法（使用统一消息处理模板）
func (w *ChatComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *ChatComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *ChatComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

// 直接委托方法 - 直接操作原生组件
func (w *ChatComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.TextInput.Update(msg)
    w.model.TextInput = updatedModel
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *ChatComponentWrapper) HasFocus() bool {
    return w.model.TextInput.Focused()
}

func (w *ChatComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEsc:
        // ESC: 失焦
        w.model.TextInput.Blur()
        eventCmd := core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{"focused": false})
        return eventCmd, core.Handled, true
    case tea.KeyEnter:
        // Enter: 处理发送消息
        if keyMsg.String() == "shift+enter" || keyMsg.Alt {
            // Shift+Enter 或 Alt+Enter: 允许多行输入
            oldValue := w.model.TextInput.Value()
            var cmd tea.Cmd
            w.model.TextInput, cmd = w.model.TextInput.Update(keyMsg)
            newValue := w.model.TextInput.Value()

            eventCmds := []tea.Cmd{}
            if oldValue != newValue {
                eventCmds = append(eventCmds, core.PublishEvent(w.model.id, core.EventInputValueChanged,
                    map[string]interface{}{
                        "oldValue": oldValue,
                        "newValue": newValue,
                    }))
            }

            if len(eventCmds) > 0 {
                return tea.Batch(append([]tea.Cmd{cmd}, eventCmds...)...), core.Handled, true
            }
            return cmd, core.Handled, true
        }

        // 普通 Enter: 发送消息
        inputText := w.model.TextInput.Value()
        if inputText != "" {
            // 清空输入
            w.model.TextInput.Reset()

            // 添加用户消息
            w.model.AddMessage("user", inputText)

            // 发布事件
            eventCmds := []tea.Cmd{
                core.PublishEvent(w.model.id, core.EventChatMessageSent,
                    map[string]interface{}{
                        "role": "user",
                        "content": inputText,
                    }),
                core.PublishEvent(w.model.id, core.EventInputEnterPressed,
                    map[string]interface{}{
                        "value": inputText,
                    }),
            }

            return tea.Batch(eventCmds...), core.Handled, true
        }
        return nil, core.Handled, true
    }

    return nil, core.Handled, false
}

func (w *ChatComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "value": w.model.TextInput.Value(),
        "focused": w.model.TextInput.Focused(),
        "messages": len(w.model.Messages),
    }
}

func (w *ChatComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    if oldState["value"] != newState["value"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, core.EventInputValueChanged,
            map[string]interface{}{
                "oldValue": oldState["value"],
                "newValue": newState["value"],
            }))
    }

    if oldState["focused"] != newState["focused"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, core.EventInputFocusChanged,
            map[string]interface{}{
                "focused": newState["focused"],
            }))
    }

    if oldState["messages"] != newState["messages"] {
        // 消息数量变化
        cmds = append(cmds, core.PublishEvent(w.model.id, "CHAT_MESSAGES_CHANGED",
            map[string]interface{}{
                "count": newState["messages"],
                "change": newState["messages"].(int) - oldState["messages"].(int),
            }))
    }

    return cmds
}
```

---

### 6. Viewport 组件 (P1 - 中优先级)

**文件**: `tui/components/viewport.go`

**问题分析**:

- 手动处理滚动键（Up/Down/PgUp/PgDown）
- 可以委托给原组件

**优化方案**:

```go
// ✅ 优化后的实现（使用统一消息处理模板）
func (w *ViewportComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *ViewportComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *ViewportComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

func (w *ViewportComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.Model.Update(msg)
    w.model.Model = updatedModel
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *ViewportComponentWrapper) HasFocus() bool {
    // Viewport 通常不处理焦点，返回 true 表示总是可以接收消息
    return true
}

func (w *ViewportComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEsc:
        // ESC: 返回 Ignored 让上层处理焦点管理
        return nil, core.Ignored, true
    }

    // 对于其他按键，不进行特殊处理，返回 false 表示未处理
    return nil, core.Handled, false
}

func (w *ViewportComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "offsetY": w.model.Model.YOffset,
        "contentHeight": w.model.Model.ContentHeight(),
        "viewportHeight": w.model.Model.Height,
    }
}

func (w *ViewportComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    // 检测滚动位置变化
    if oldState["offsetY"] != newState["offsetY"] {
        cmds = append(cmds, core.PublishEvent(w.id, "VIEWPORT_SCROLL_CHANGED",
            map[string]interface{}{
                "oldOffsetY": oldState["offsetY"],
                "newOffsetY": newState["offsetY"],
                "direction": "vertical",
            }))
    }

    return cmds
}
```

---

### 7. Paginator 组件 (P1 - 中优先级)

**文件**: `tui/components/paginator.go`

**问题分析**:

- 手动处理 Left/Right 键
- 可以委托给原组件

**优化方案**:

```go
// ✅ 优化后的实现（使用统一消息处理模板）
func (w *PaginatorComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                           // 实现了 InteractiveBehavior 接口的组件
        msg,                         // 接收的消息
        w.getBindings,              // 获取按键绑定的函数
        w.handleBinding,            // 处理按键绑定的函数
        w.delegateToBubbles,        // 委托给原 bubbles 组件的函数
    )

    return w, cmd, response
}

// 辅助函数
func (w *PaginatorComponentWrapper) getBindings() []core.ComponentBinding {
    return w.model.props.Bindings
}

func (w *PaginatorComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}

func (w *PaginatorComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
    updatedModel, cmd := w.model.Model.Update(msg)
    w.model.Model = updatedModel
    return cmd
}

// 实现 InteractiveBehavior 接口的其他方法
func (w *PaginatorComponentWrapper) HasFocus() bool {
    // Paginator 通常不处理焦点，返回 true 表示总是可以接收消息
    return true
}

func (w *PaginatorComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    // Paginator 不处理特殊按键，直接返回未处理
    return nil, core.Handled, false
}

func (w *PaginatorComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "page": w.model.Model.Page,
        "totalPages": w.model.Model.TotalPages,
        "perPage": w.model.Model.PerPage,
    }
}

func (w *PaginatorComponentWrapper) DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    // 检测页码变化
    if oldState["page"] != newState["page"] {
        cmds = append(cmds, core.PublishEvent(w.model.id, "PAGINATOR_PAGE_CHANGED",
            map[string]interface{}{
                "oldPage": oldState["page"].(int) + 1,
                "newPage": newState["page"].(int) + 1,
                "totalPages": newState["totalPages"],
            }))
    }

    return cmds
}
```

---

### 8-15. 其他组件 (P2 - 低优先级)

以下组件实现合理，无需重大优化，只需微调：

- **progress.go** - ✅ 已合理，无需优化
- **spinner.go** - ✅ 已合理，无需优化
- **help.go** - ✅ 已合理，无需优化
- **cursor.go** - ✅ 已合理，无需优化
- **key.go** - ✅ 已合理，无需优化
- **stopwatch.go** - ✅ 已合理，无需优化
- **timer.go** - ✅ 已合理，无需优化
- **filepicker.go** - ✅ 已合理，可小幅优化

---

## 测试验证指南

### 🧪 测试矩阵

| 组件         | 测试场景   | 预期行为           | 验证方法       |
| ------------ | ---------- | ------------------ | -------------- |
| **input**    | 光标移动   | ← → 移动正常       | 实际操作输入框 |
|              | 文本选择   | Shift+← → 选择文本 | 实际操作输入框 |
|              | 剪贴板     | Ctrl+V 粘贴        | 实际操作输入框 |
|              | ESC 失焦   | 焦点消失，发布事件 | 实际按 ESC     |
| **textarea** | 多行编辑   | Enter 换行         | 实际操作输入框 |
|              | 光标导航   | ↑ ↓ ← → 移动       | 实际操作输入框 |
|              | 文本选择   | Shift+方向键选择   | 实际操作输入框 |
| **list**     | 上下导航   | ↑ ↓ 移动选择       | 实际操作列表   |
|              | 滚动       | PageUp/Down 滚动   | 实际操作列表   |
|              | Enter 选择 | 发布选择事件       | 实际按 Enter   |
| **menu**     | 子菜单导航 | → 进入子菜单       | 实际操作菜单   |
|              | 返回父菜单 | ← 或 h 返回        | 实际操作菜单   |
|              | ESC 失焦   | 返回父菜单         | 实际按 ESC     |
| **table**    | 行导航     | ↑ ↓ 移动选择       | 实际操作表格   |
|              | 列导航     | ← → 移动列         | 实际操作表格   |
|              | Enter 确认 | 发布双击事件       | 实际按 Enter   |
| **chat**     | 输入消息   | Enter 发送         | 实际输入并发送 |
|              | 多行输入   | Shift+Enter 换行   | 实际操作输入框 |
|              | 历史滚动   | PageUp/Down 滚动   | 实际滚动       |

### ✅ 验证检查项

- [ ] **原生功能恢复**: 所有 bubbles 原生功能都可用
- [ ] **消息流畅性**: 按键响应无延迟
- [ ] **事件完整性**: 所有事件正确发布
- [ ] **焦点管理**: 焦点切换正常工作
- [ ] **导航一致性**: Tab/ESC 行为统一
- [ ] **性能无退化**: 没有不必要的性能开销

### 📊 性能基准

使用 `go test -bench` 运行基准测试：

```bash
# Input 组件性能测试
go test -bench=. -benchmem tui/components/input_test.go

# Textarea 组件性能测试
go test -bench=. -benchmem tui/components/textarea_test.go
```

**预期结果**:

- 优化前后性能持平或更好
- 没有额外的内存分配
- 响应时间 < 10ms

---

## TODO 列表

### 阶段 1: 高优先级组件优化（P0）

- [ ] **input.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 恢复 textinput 原生功能测试
  - [ ] 验证事件发布
  - [ ] 更新单元测试

- [x] **textarea.go**
  - [x] 已优化 ✅
  - [x] 已测试 ✅
  - [x] 已文档化 ✅

- [ ] **list.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 恢复 list 导航能力
  - [ ] 验证选择事件
  - [ ] 更新单元测试

- [ ] **menu.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 简化导航逻辑
  - [ ] 委托给 list.Model 处理
  - [ ] 验证子菜单事件
  - [ ] 更新单元测试

- [ ] **table.go**
  - [ ] 简化导航键处理
  - [ ] 委托给 table.Model
  - [ ] 验证选择事件
  - [ ] 更新单元测试

- [ ] **chat.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 恢复 textarea 原生功能
  - [ ] 验证消息发送事件
  - [ ] 更新单元测试

**预计时间**: 2-3 天

---

### 阶段 2: 中优先级组件优化（P1）

- [ ] **viewport.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 委托滚动键给原组件
  - [ ] 保留 ESC 拦截
  - [ ] 验证滚动行为

- [ ] **paginator.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 委托给 paginator.Model
  - [ ] 验证页码变化事件

- [ ] **filepicker.go**
  - [ ] 重构 `UpdateMsg` 方法
  - [ ] 简化消息处理

**预计时间**: 1 天

---

### 阶段 3: 集成测试与文档（所有组件）

- [ ] **集成测试**
  - [ ] 创建组件交互测试
  - [ ] 测试多组件协同工作
  - [ ] 验证事件传递链

- [ ] **文档更新**
  - [ ] 更新组件使用文档
  - [ ] 添加优化说明
  - [ ] 创建迁移指南

- [ ] **代码审查**
  - [ ] 代码风格一致性检查
  - [ ] 性能基准测试
  - [ ] 安全审查

**预计时间**: 1 天

---

### 阶段 4: 低优先级微调（P2）

- [ ] **progress.go** - 验证当前实现
- [ ] **spinner.go** - 验证当前实现
- [ ] **help.go** - 验证当前实现
- [ ] **cursor.go** - 验证当前实现
- [ ] **key.go** - 验证当前实现
- [ ] **stopwatch.go** - 验证当前实现
- [ ] **timer.go** - 验证当前实现

**预计时间**: 0.5 天

---

### 阶段 5: 回归测试与发布

- [ ] **回归测试**
  - [ ] 运行所有单元测试
  - [ ] 运行集成测试
  - [ ] 手动测试关键场景
  - [ ] 性能回归测试

- [ ] **发布准备**
  - [ ] 编写 CHANGELOG 条目
  - [ ] 创建发布说明
  - [ ] 准备演示示例

**预计时间**: 1 天

---

## 附录

### A. 相关文档

- [Textarea 优化文档](./TEXTAREA_MESSAGE_INTERCEPTION_OPTIMIZATION.md)
- [组件初始化渲染分离](./COMPONENT_INIT_RENDER_SEPARATION.md)
- [组件类型系统](../core/types.go)

### B. 参考资源

- [bubbles textinput 文档](https://pkg.go.dev/github.com/charmbracelet/bubbles/textinput)
- [bubbles textarea 文档](https://pkg.go.dev/github.com/charmbracelet/bubbles/textarea)
- [bubbles list 文档](https://pkg.go.dev/github.com/charmbracelet/bubbles/list)
- [bubbles table 文档](https://pkg.go.dev/github.com/charmbracelet/bubbles/table)

### C. 最佳实践

1. **测试驱动**: 先写测试，再重构代码
2. **小步提交**: 每个组件单独提交，便于回滚
3. **持续集成**: 每次优化后立即运行完整测试
4. **代码审查**: 所有修改需要代码审查
5. **文档同步**: 代码和文档同步更新

---

**文档版本**: 1.1.0  
**最后更新**: 2025-01-19  
**维护者**: AI Assistant

**更新内容**:

- 新增组件按键绑定系统设计
- 支持自定义快捷键覆盖默认行为
- 与现有事件系统无缝集成
- 2025-01-20: 重大更新 - 采用统一消息处理模板替代简单适配器模式
- 所有组件均已完成统一消息处理模板重构
