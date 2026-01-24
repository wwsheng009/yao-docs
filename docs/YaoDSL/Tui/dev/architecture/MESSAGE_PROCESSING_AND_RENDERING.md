# TUI 消息处理与渲染机制

## 一、问题原因回顾

### 1.1 初始问题

- **焦点管理和键盘事件失效**：Tab 键无法切换焦点，字符输入无响应
- **界面刷新问题**：只有按 Enter 键界面才会刷新，其他按键不触发刷新
- **光标闪烁停止**：修复刷新问题后，光标停止闪烁

### 1.2 根本原因

#### 问题1：焦点列表为空

```go
// runtimeFocusList 只在 renderWithRuntime() 中填充
// 但初始渲染前就按 Tab 键，导致列表为空
func (m *Model) runtimeFocusNext() tea.Cmd {
    focusList := m.runtimeFocusList
    if len(focusList) == 0 {  // 初始时为空！
        return nil
    }
}
```

**修复**：添加 `getFocusableComponentIDs()` 作为后备

```go
if len(focusList) == 0 {
    focusList = m.getFocusableComponentIDs()
}
```

#### 问题2：渲染缓存过度激进

```go
func (m *Model) needsRender() bool {
    if m.lastRenderedOutput == "" || m.forceRender {
        return true
    }
    // 检查 Runtime engine dirty
    // 检查组件状态变化
    return false  // 默认返回缓存！
}
```

消息流程：

1. 用户输入字符 → `forceRender=true` 被设置
2. `View()` 渲染并重置 `forceRender=false`
3. 组件返回 `cursor.BlinkMsg` 命令
4. Bubble Tea 执行命令，`Update(cursor.BlinkMsg)` 被调用
5. `needsRender()` 返回 `false`（因为 `forceRender` 已重置）
6. 返回缓存的输出，**界面不刷新**

**修复**：添加 `messageReceived` 标志跟踪用户交互

```go
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg.(type) {
    case tea.KeyMsg, tea.MouseMsg:
        m.messageReceived = true  // 用户交互消息
    }
}

func (m *Model) needsRender() bool {
    if m.messageReceived {
        return true
    }
    // ... 其他检查
}
```

#### 问题3：光标闪烁消息被跳过

`cursor.BlinkMsg` 是高频消息，不应设置 `messageReceived`，否则会导致闪烁。

**修复**：当有焦点组件时总是渲染

```go
func (m *Model) needsRender() bool {
    if m.CurrentFocus != "" {
        return true  // 焦点组件需要渲染以显示光标
    }
}
```

---

## 二、消息处理逻辑

### 2.1 消息分类架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Update(msg)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  ClassifyMessage(msg) │
                └───────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐       ┌──────────┐       ┌──────────┐
   │Geometry │       │Component │       │ System   │
   │ Event   │       │ Event    │       │ Event    │
   └─────────┘       └──────────┘       └──────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
  Runtime事件系统    dispatchMessageToAllComponents  WindowSizeMsg
  (无Cmd返回)              (保留Cmd传播)             (特殊处理)
```

**事件类型定义** (`tui/event_classifier.go`):

```go
type EventClass int

const (
    GeometryEvent  EventClass = iota  // 鼠标点击、命中测试 → Runtime
    ComponentEvent                    // 键盘输入、光标闪烁 → Bubble Tea
    SystemEvent                       // 窗口大小变化 → 特殊处理
)

func ClassifyMessage(msg tea.Msg) EventClass {
    switch msg.(type) {
    case tea.MouseMsg:
        return GeometryEvent
    case tea.KeyMsg:
        return ComponentEvent  // 包括 Tab、Enter、字符输入
    case tea.WindowSizeMsg:
        return SystemEvent
    default:
        return ComponentEvent  // cursor.BlinkMsg 等
    }
}
```

### 2.2 双路径消息处理

```
                     Update(msg)
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
  handleGeometryEvent          handleComponentMessage
  (Runtime事件系统)               (Bubble Tea路径)
         │                               │
         │                          ┌────┴────┐
         │                          │         │
         ▼                          ▼         ▼
  ┌──────────┐              MessageHandlers  dispatchMessageToAllComponents
  │ Runtime  │                     │         │
  │ Event    │                     ▼         ▼
  │ System   │              handleKeyPress  组件更新 + Cmd收集
  └──────────┘                     │         │
         │                          └─────────┘
         │                               │
         └───────────────────────────────┴───────────────────┐
                                                           │
                                                           ▼
                                                    (tea.Model, tea.Cmd)
```

**关键规则**：

- **Runtime 路径**：几何事件，无需返回 `tea.Cmd`
- **Bubble Tea 路径**：组件事件，必须返回 `tea.Cmd` 到主循环

### 2.3 消息处理器注册

```go
// 默认消息处理器
func GetDefaultMessageHandlersFromCore() map[string]core.MessageHandler {
    handlers := make(map[string]core.MessageHandler)

    handlers["tea.KeyMsg"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
        model := m.(*Model)
        if model.UseRuntime {
            return model.handleKeyPressWithRuntime(msg.(tea.KeyMsg))
        }
        return model.handleKeyPress(msg.(tea.KeyMsg))
    }

    handlers["tea.WindowSizeMsg"] = ...
    handlers["core.TargetedMsg"] = ...
    // ... 更多处理器
}
```

### 2.4 按键处理流程（Runtime 模式）

```
用户按键 'a'
    │
    ▼
Update(tea.KeyMsg{'a'})
    │
    ▼
handleKeyPressWithRuntime()
    │
    ├── 检查全局快捷键绑定
    ├── 处理 Tab/ShiftTab/ESC 导航键
    └── 转发到焦点组件
         │
         ▼
dispatchMessageToComponent("input1", tea.KeyMsg{'a'})
    │
    ├── InputComponentWrapper.UpdateMsg()
    ├── DefaultInteractiveUpdateMsg()
    ├── HandleStateChanges() - 检测状态变化
    └── 设置 forceRender = true
         │
         ▼
返回 (m, cursor.BlinkMsg)
    │
    ▼
Bubble Tea 执行 cursor.BlinkMsg
    │
    ▼
Update(cursor.BlinkMsg)
    │
    ▼
dispatchMessageToComponent("input1", cursor.BlinkMsg)
    │
    └── needsRender() 检查：
         - forceRender = false (已重置)
         - messageReceived = false (BlinkMsg不设置)
         - CurrentFocus = "input1" → 返回 true！
         │
         ▼
View() 渲染显示新字符 + 光标位置
```

---

## 三、界面渲染机制

### 3.1 渲染流程

```
┌─────────────────────────────────────────────────────────────┐
│                        View()                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  needsRender()  │
                   └─────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
            false                    true
                │                       │
                ▼                       ▼
        返回缓存输出              执行实际渲染
        (lastRenderedOutput)            │
                                        ▼
                               ┌─────────────────┐
                               │ renderWithRuntime│
                               │   或            │
                               │  renderLayout   │
                               └─────────────────┘
                                        │
                                        ▼
                               更新 lastRenderedOutput
                               重置 forceRender=false
                               重置 messageReceived=false
```

### 3.2 渲染条件判断

```go
func (m *Model) needsRender() bool {
    // 1. 首次渲染或强制渲染
    if m.lastRenderedOutput == "" || m.forceRender {
        return true
    }

    // 2. Runtime 引擎 dirty 标志
    if m.UseRuntime && m.RuntimeEngine != nil && m.RuntimeEngine.IsDirty() {
        return true
    }

    // 3. 用户交互消息
    if m.messageReceived {
        return true
    }

    // 4. 有焦点组件（光标闪烁需要）
    if m.CurrentFocus != "" {
        return true
    }

    // 5. 组件内部状态变化
    if m.hasComponentChanges() {
        return true
    }

    return false
}
```

### 3.3 渲染标志设置位置

| 标志                      | 设置位置                                             | 触发条件               | 重置位置      |
| ------------------------- | ---------------------------------------------------- | ---------------------- | ------------- |
| `forceRender`             | `dispatchMessageToComponent`, 焦点变化, 窗口大小变化 | 组件状态变化、焦点切换 | `View()` 结束 |
| `messageReceived`         | `Update()` 开始                                      | KeyMsg/MouseMsg        | `View()` 结束 |
| `RuntimeEngine.IsDirty()` | Runtime 内部                                         | 布局变化、组件更新     | `View()` 结束 |

### 3.4 渲染缓存策略

| 策略               | 适用场景  | 条件                       | 行为               |
| ------------------ | --------- | -------------------------- | ------------------ |
| **首次渲染**       | 初始化    | `lastRenderedOutput == ""` | 总是渲染           |
| **强制渲染**       | 状态变化  | `forceRender == true`      | 渲染后重置标志     |
| **Runtime 脏标记** | 布局变化  | `RuntimeEngine.IsDirty()`  | 清除 dirty 标志    |
| **用户交互**       | 按键/鼠标 | `messageReceived == true`  | 渲染后重置标志     |
| **焦点组件**       | 光标闪烁  | `CurrentFocus != ""`       | 总是渲染（不重置） |
| **组件变化**       | 内部状态  | `组件.NeedsRender()`       | 组件自行判断       |

---

## 四、界面消息相关问题与解决方案

### 4.1 问题：Tab 键无法切换焦点

**原因**：`runtimeFocusList` 在首次渲染前为空

```go
func (m *Model) runtimeFocusNext() tea.Cmd {
    focusList := m.runtimeFocusList  // 初始时为空！
    if len(focusList) == 0 {
        return nil  // 返回 nil，焦点不变
    }
}
```

**解决方案**：

```go
func (m *Model) runtimeFocusNext() tea.Cmd {
    focusList := m.runtimeFocusList
    if len(focusList) == 0 {
        // 后备方案：使用 getFocusableComponentIDs()
        focusList = m.getFocusableComponentIDs()
    }
    // ...
}
```

**文件**：`tui/model_runtime_integration.go`

### 4.2 问题：只有 Enter 键触发刷新

**原因**：渲染缓存逻辑中 `forceRender` 在首次渲染后被重置

**消息时序**：

```
T0: KeyMsg('a') → forceRender=true → View()渲染 → forceRender=false
T1: cursor.BlinkMsg → forceRender=false → View()返回缓存
```

**解决方案**：添加 `messageReceived` 标志

```go
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg.(type) {
    case tea.KeyMsg, tea.MouseMsg:
        m.messageReceived = true
    }
}
```

**文件**：`tui/model.go`

### 4.3 问题：光标停止闪烁

**原因**：`cursor.BlinkMsg` 不设置 `messageReceived`（避免闪烁），导致返回缓存

**解决方案**：有焦点组件时总是渲染

```go
func (m *Model) needsRender() bool {
    if m.CurrentFocus != "" {
        return true  // 焦点组件总是渲染
    }
}
```

**文件**：`tui/model.go`

### 4.4 问题：高频消息导致闪烁

**原因**：`cursor.BlinkMsg` 每秒触发约2次，如果总是渲染会导致闪烁

**解决方案**：区分高频消息和用户交互

```go
// 只对用户交互消息设置 messageReceived
switch msg.(type) {
case tea.KeyMsg, tea.MouseMsg:  // 不包括 cursor.BlinkMsg
    m.messageReceived = true
}
```

**文件**：`tui/model.go`

---

## 五、经验总结

### 5.1 架构设计原则

1. **模块边界清晰**：Runtime 不依赖 Bubble Tea，不返回 `tea.Cmd`
2. **双路径处理**：几何事件走 Runtime，组件事件走 Bubble Tea
3. **命令传播**：组件返回的 `tea.Cmd` 必须传回主循环

### 5.2 渲染优化策略

| 策略         | 适用场景           | 实现方式                           |
| ------------ | ------------------ | ---------------------------------- |
| **渲染缓存** | 避免不必要的重渲染 | `lastRenderedOutput`               |
| **强制渲染** | 状态变化、焦点切换 | `forceRender` 标志                 |
| **条件渲染** | 用户交互、光标闪烁 | `messageReceived` + `CurrentFocus` |
| **脏标记**   | Runtime 布局变化   | `RuntimeEngine.IsDirty()`          |

### 5.3 调试技巧

1. **消息追踪**：使用 `log.Trace` 追踪消息类型和处理路径
2. **渲染检查**：在 `View()` 中记录 `needsRender()` 的返回值和原因
3. **标志检查**：打印 `forceRender`、`messageReceived`、`CurrentFocus` 等标志状态

### 5.4 常见陷阱

1. **在错误的路径处理消息**：例如将 Tab 键路由到 Runtime 事件系统
2. **丢失命令传播**：组件返回的 `tea.Cmd` 没有传回主循环
3. **过度缓存**：缓存条件太严格，导致需要更新的界面不刷新
4. **缓存失效**：缓存条件太宽松，导致高频消息触发闪烁
5. **时序问题**：命令返回的消息在 `Update()` 和 `View()` 之间处理

### 5.5 关键代码位置

| 功能        | 文件                               | 关键方法                               |
| ----------- | ---------------------------------- | -------------------------------------- |
| 消息分类    | `tui/event_classifier.go`          | `ClassifyMessage()`                    |
| 消息路由    | `tui/model.go`                     | `Update()`, `handleComponentMessage()` |
| 焦点管理    | `tui/focus_manager.go`             | `setFocus()`, `runtimeFocusNext()`     |
| 渲染判断    | `tui/model.go`                     | `needsRender()`, `View()`              |
| 组件分发    | `tui/model.go`                     | `dispatchMessageToComponent()`         |
| 消息处理器  | `tui/message_handlers.go`          | `GetDefaultMessageHandlersFromCore()`  |
| Runtime集成 | `tui/model_runtime_integration.go` | `handleKeyPressWithRuntime()`          |

---

## 六、相关文档

- `MODULE_BOUNDARIES.md` - 模块边界定义
- `ARCHITECTURE_CMD_PROPAGATION.md` - 命令传播架构
- `MIGRATION_GUIDE.md` - 组件迁移指南
- `COMPONENT_MIGRATION_PLAN.md` - 组件迁移计划
