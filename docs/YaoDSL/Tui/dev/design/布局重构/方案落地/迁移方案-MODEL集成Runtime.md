# TUI Runtime 迁移方案 - Model 集成

**版本**: 1.0
**状态**: 草案
**创建日期**: 2026-01-23
**目标**: 将 Runtime 无缝集成到现有 Model，不破坏任何现有功能

---

## 一、迁移目标与原则

### 1.1 核心目标

1. **保持功能完整性**：所有现有功能必须继续工作
2. **渐进式迁移**：允许 Legacy 和 Runtime 并存
3. **遵守边界规则**：严格遵循 `MODULE_BOUNDARIES.md` 的规定

### 1.2 设计原则（来自设计文档）

```
Measure → Layout → Render

State → LayoutNode → Runtime → Frame → Terminal
```

**几何优先**：所有事件、Focus、HitTest 必须基于 LayoutBox

**模块边界**：

- Runtime 不得依赖 Bubble Tea
- Runtime 不得依赖具体组件
- Runtime 不得依赖 DSL
- 只有 render/ 模块可以使用 lipgloss

---

## 二、现有功能清单（必须保留）

| 功能模块                  | 当前实现                           | 迁移策略                           |
| ------------------------- | ---------------------------------- | ---------------------------------- |
| **变量替换** (`{{expr}}`) | `expression_resolver.go`           | 保留在 Model，与 Runtime 解耦      |
| **Props 解析**            | `props_resolver.go` + `PropsCache` | 保留在 Model，Runtime 不感知       |
| **Tea 消息机制**          | `message_handlers.go`              | Model 层处理，转换为 Runtime Event |
| **快捷键管理**            | `components/key.go`                | 组件层处理，不受影响               |
| **焦点管理**              | `focus_manager.go`                 | 逐步迁移到 `runtime.FocusManager`  |
| **状态管理**              | `StateMu + State`                  | 保留在 Model，Runtime 不感知       |
| **EventBus**              | `core/`                            | 保留在 Model，Runtime 不感知       |

---

## 三、架构设计

### 3.1 新的 Model 结构

```go
package tui

import (
    tea "github.com/charmbracelet/bubbletea"
    "github.com/yaoapp/yao/tui/core"
    "github.com/yaoapp/yao/tui/runtime"
)

type Model struct {
    // ========== 现有字段（保留不变） ==========
    Config                     *Config
    State                      map[string]interface{}
    StateMu                    sync.RWMutex
    Components                 map[string]*core.ComponentInstance
    ComponentInstanceRegistry  *ComponentInstanceRegistry
    EventBus                   *core.EventBus
    Program                    *tea.Program
    MessageHandlers            map[string]core.MessageHandler
    MessageSubscriptionManager *MessageSubscriptionManager
    Bridge                     *Bridge
    CurrentFocus               string

    // ========== Runtime 集成（新增） ==========
    // Runtime 负责布局和渲染，不感知业务逻辑
    RuntimeEngine              *runtime.RuntimeImpl
    RuntimeRoot                *runtime.LayoutNode  // Runtime 的 LayoutNode 树根

    // ========== 兼容层（临时） ==========
    UseRuntime                 bool                  // 切换开关
    Renderer                   *layout.Renderer     // Legacy（逐步废弃）
    LayoutEngine               *layout.Engine       // Legacy（逐步废弃）
    LayoutRoot                 *layout.LayoutNode   // Legacy（逐步废弃）

    // ========== 运行时状态 ==========
    Width                      int
    Height                     int
    Ready                      bool

    // ========== 内部缓存 ==========
    exprCache                  *ExpressionCache
    propsCache                 *PropsCache
    logLevel                   string
}
```

### 3.2 调用流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Bubble Tea Loop                          │
│                   (tea.Program)                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Model.Update()                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. 捕获阶段：tea.KeyMsg, tea.WindowSizeMsg          │   │
│  │ 2. 分发阶段：dispatchMessageToComponent()           │   │
│  │ 3. 冒泡阶段：MessageHandlers                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Model.View()                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ if UseRuntime {                                      │   │
│  │     // Runtime 路径                                    │   │
│  │     result := RuntimeEngine.Layout(RuntimeRoot, ...)  │   │
│  │     frame := RuntimeEngine.Render(result)            │   │
│  │     return frame.String()                            │   │
│  │ } else {                                              │   │
│  │     // Legacy 路径（兼容）                              │   │
│  │     return Renderer.Render()                         │   │
│  │ }                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、详细迁移步骤

### STEP 1: 创建适配层（无破坏性）

**文件**: `tui/runtime_adapter.go`（新建）

```go
package tui

import (
    "github.com/yaoapp/yao/tui/core"
    "github.com/yaoapp/yao/tui/runtime"
)

// RuntimeAdapter 将 Model 的 Component 转换为 Runtime 可用的格式
type RuntimeAdapter struct {
    model *Model
}

func NewRuntimeAdapter(model *Model) *RuntimeAdapter {
    return &RuntimeAdapter{model: model}
}

// ToRuntimeLayoutNode 将 DSL Component 转换为 runtime.LayoutNode
func (a *RuntimeAdapter) ToRuntimeLayoutNode(comp *Component) *runtime.LayoutNode {
    if comp == nil {
        return nil
    }

    // 获取组件实例
    compInst, exists := a.model.ComponentInstanceRegistry.Get(comp.ID)
    if !exists {
        return nil
    }

    // 构建 runtime.LayoutNode
    node := runtime.NewLayoutNode(
        comp.ID,
        a.mapComponentType(comp.Type),
        a.mapStyle(comp),
    )

    // 设置 Component（实现 Measurable 和 View）
    node.Component = &RuntimeComponentWrapper{
        instance: compInst.Instance,
        model:    a.model,
        compID:   comp.ID,
    }

    // 递归处理子组件
    if comp.Children != nil {
        for _, child := range comp.Children {
            childNode := a.ToRuntimeLayoutNode(&child)
            if childNode != nil {
                node.AddChild(childNode)
            }
        }
    }

    return node
}

// mapComponentType 将 TUI 组件类型映射到 Runtime NodeType
func (a *RuntimeAdapter) mapComponentType(compType string) runtime.NodeType {
    switch compType {
    case "text", "header", "footer":
        return runtime.NodeTypeText
    case "row", "flex":
        return runtime.NodeTypeRow
    case "column":
        return runtime.NodeTypeColumn
    default:
        return runtime.NodeTypeCustom
    }
}

// mapStyle 将 DSL Style 映射到 runtime.Style
func (a *RuntimeAdapter) mapStyle(comp *Component) runtime.Style {
    style := runtime.NewStyle()

    if comp.Width != nil {
        style = style.WithWidth(*comp.Width)
    }
    if comp.Height != nil {
        style = style.WithHeight(*comp.Height)
    }
    if comp.FlexGrow != nil {
        style = style.WithFlexGrow(*comp.FlexGrow)
    }
    if comp.Direction != nil {
        style = style.WithDirection(mapDirection(*comp.Direction))
    }

    // Padding
    if comp.Padding != nil {
        style = style.WithPadding(runtime.Insets{
            Top:    comp.Padding.Top,
            Right:  comp.Padding.Right,
            Bottom: comp.Padding.Bottom,
            Left:   comp.Padding.Left,
        })
    }

    // Border (v1.1)
    if comp.Border != nil {
        style = style.WithBorder(runtime.Insets{
            Top:    comp.Border.Top,
            Right:  comp.Border.Right,
            Bottom: comp.Border.Bottom,
            Left:   comp.Border.Left,
        })
    }

    // Gap
    if comp.Gap != nil {
        style = style.WithGap(*comp.Gap)
    }

    // AlignItems
    if comp.AlignItems != nil {
        style = style.WithAlignItems(mapAlign(*comp.AlignItems))
    }

    // JustifyContent
    if comp.JustifyContent != nil {
        style = style.WithJustify(mapJustify(*comp.JustifyContent))
    }

    // ZIndex
    if comp.ZIndex != nil {
        style = style.WithZIndex(*comp.ZIndex)
    }

    return style
}
```

**文件**: `tui/runtime/component_wrapper.go`（新建）

```go
package runtime

import (
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui/core"
)

// ComponentWrapper 包装现有组件，使其兼容 Runtime
type ComponentWrapper struct {
    instance core.ComponentInterface
    model    interface{} // Model 接口（避免循环依赖）
    compID   string
}

var _ Measurable = (*ComponentWrapper)(nil)

// Measure 实现测量接口
// 注意：这里需要调用组件的 Measure 方法（如果存在）
func (w *ComponentWrapper) Measure(c BoxConstraints) Size {
    // 尝试获取组件的 Measure 实现
    if measurable, ok := w.instance.(interface{
        Measure(minW, maxW, minH, maxH int) (int, int)
    }); ok {
        width, height := measurable.Measure(c.MinWidth, c.MaxWidth, c.MinHeight, c.MaxHeight)
        return Size{Width: width, Height: height}
    }

    // 默认尺寸
    return Size{Width: c.MaxWidth, Height: 1}
}

// View 返回组件的渲染内容
func (w *ComponentWrapper) View() string {
    // 调用组件的 Render 方法
    // 这里需要从 Model 获取解析后的 Props
    props := w.resolveProps()
    config := core.RenderConfig{
        Data:   props,
        Width:  0, // Runtime 会设置
        Height: 0,
    }

    result, _ := w.instance.Render(config)
    return result
}

func (w *ComponentWrapper) resolveProps() map[string]interface{} {
    // 通过 Model 的 resolveProps 方法获取解析后的 Props
    // 这里需要定义一个最小接口来避免循环依赖
    type PropsResolver interface {
        ResolveProps(id string) map[string]interface{}
    }

    if resolver, ok := w.model.(PropsResolver); ok {
        return resolver.ResolveProps(w.compID)
    }
    return make(map[string]interface{})
}
```

### STEP 2: 修改 Model.Init() 使用 Runtime

**文件**: `tui/model.go`（修改）

```go
func (m *Model) Init() tea.Cmd {
    log.Trace("TUI Init: %s", m.Config.Name)

    // ========== 初始化 Runtime ==========
    if m.UseRuntime {
        // 初始化 Runtime Engine
        m.RuntimeEngine = runtime.NewRuntime(m.Width, m.Height)

        // 构建 Runtime LayoutNode 树
        adapter := NewRuntimeAdapter(m)
        m.RuntimeRoot = adapter.ToRuntimeLayoutNode(m.Config.Root)

        log.Trace("TUI Init: Runtime initialized with root node %s", m.RuntimeRoot.ID)
    } else {
        // ========== Legacy 初始化 ==========
        componentCmds := m.InitializeComponents()
        // ... 现有逻辑
    }

    // ========== 通用逻辑 ==========
    var cmds []tea.Cmd

    // 执行 onLoad 动作
    if m.Config.OnLoad != nil {
        cmds = append(cmds, m.executeAction(m.Config.OnLoad))
    }

    // 自动聚焦
    if m.Config.AutoFocus != nil && *m.Config.AutoFocus {
        focusableIDs := m.getFocusableComponentIDs()
        if len(focusableIDs) > 0 {
            cmds = append(cmds, func() tea.Msg {
                return core.FocusFirstComponentMsg{}
            })
        }
    }

    if len(cmds) == 0 {
        return nil
    }

    return tea.Batch(cmds...)
}
```

### STEP 3: 修改 Model.Update() 集成 Runtime 事件

**文件**: `tui/model.go`（修改）

```go
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    // ========== 捕获阶段：系统级消息 ==========
    switch msg := msg.(type) {
    case tea.MouseMsg:
        return m, nil
    case tea.KeyMsg:
        if msg.Type == tea.KeyCtrlC {
            return m, tea.Quit
        }
    case tea.WindowSizeMsg:
        m.Width = msg.Width
        m.Height = msg.Height
        m.Ready = true

        // 更新 Runtime 尺寸
        if m.UseRuntime && m.RuntimeEngine != nil {
            m.RuntimeEngine.UpdateDimensions(msg.Width, msg.Height)
        } else if m.LayoutEngine != nil {
            m.LayoutEngine.UpdateWindowSize(msg.Width, msg.Height)
        }
    }

    // ========== 分发阶段：消息路由 ==========
    msgType := getMsgTypeName(msg)

    if msgType == "TargetedMsg" {
        if handler, exists := m.MessageHandlers[msgType]; exists {
            return handler(m, msg)
        }
    }

    // ========== 冒泡阶段：全局处理器 ==========
    if handler, exists := m.MessageHandlers[msgType]; exists {
        return handler(m, msg)
    }

    // ========== 后备：广播到所有组件 ==========
    return m.dispatchMessageToAllComponents(msg)
}
```

### STEP 4: 修改 Model.View() 使用 Runtime 渲染

**文件**: `tui/model.go`（修改）

```go
func (m *Model) View() string {
    if !m.Ready {
        return "Initializing..."
    }

    // ========== Runtime 路径 ==========
    if m.UseRuntime {
        return m.renderWithRuntime()
    }

    // ========== Legacy 路径（兼容） ==========
    return m.renderLayout()
}

// renderWithRuntime 使用 Runtime 渲染
func (m *Model) renderWithRuntime() string {
    if m.RuntimeEngine == nil || m.RuntimeRoot == nil {
        return "Runtime not initialized"
    }

    // 创建约束
    constraints := runtime.BoxConstraints{
        MinWidth:  m.Width,
        MaxWidth:  m.Width,
        MinHeight: m.Height,
        MaxHeight: m.Height,
    }

    // Phase 1 & 2: Measure + Layout
    result := m.RuntimeEngine.Layout(m.RuntimeRoot, constraints)

    // Phase 3: Render
    frame := m.RuntimeEngine.Render(result)

    // 转换为字符串输出
    return frame.String()
}
```

### STEP 5: 集成焦点管理

**文件**: `tui/runtime/focus_integration.go`（新建）

```go
package runtime

import (
    "github.com/yaoapp/yao/tui/core"
)

// FocusIntegration 提供焦点管理功能给 Model 使用
type FocusIntegration struct {
    runtime *RuntimeImpl
}

func NewFocusIntegration(rt *RuntimeImpl) *FocusIntegration {
    return &FocusIntegration{runtime: rt}
}

// UpdateFocusable 根据 LayoutResult 更新可聚焦组件列表
func (fi *FocusIntegration) UpdateFocusable(result LayoutResult) []string {
    var focusableIDs []string

    for _, box := range result.Boxes {
        if box.Node != nil && box.Node.Component != nil {
            // 检查组件是否可聚焦
            if wrapper, ok := box.Node.Component.(*ComponentWrapper); ok {
                if fi.isFocusable(wrapper.instance) {
                    focusableIDs = append(focusableIDs, box.Node.ID)
                }
            }
        }
    }

    return focusableIDs
}

// HitTest 执行点击测试
func (fi *FocusIntegration) HitTest(x, y int, result LayoutResult) *LayoutBox {
    // 按 Z-Index 逆序查找（从最上层开始）
    for i := len(result.Boxes) - 1; i >= 0; i-- {
        box := result.Boxes[i]
        if x >= box.X && x < box.X+box.W && y >= box.Y && y < box.Y+box.H {
            return &box
        }
    }
    return nil
}

func (fi *FocusIntegration) isFocusable(comp interface{}) bool {
    // 检查组件是否实现 FocusableInterface
    type FocusableChecker interface {
        IsFocusable() bool
    }

    if checker, ok := comp.(FocusableChecker); ok {
        return checker.IsFocusable()
    }

    // 默认：根据组件类型判断
    // 这里需要从组件获取类型信息
    return false
}
```

### STEP 6: 事件转换层

**文件**: `tui/runtime/event_adapter.go`（新建）

```go
package tui

import (
    tea "github.com/charmbracelet/bubbletea"
    "github.com/yaoapp/yao/tui/runtime"
)

// EventAdapter 将 Bubble Tea 消息转换为 Runtime 事件
type EventAdapter struct {
    model *Model
}

func NewEventAdapter(model *Model) *EventAdapter {
    return &EventAdapter{model: model}
}

// ConvertToRuntimeEvent 将 Bubble Tea KeyMsg 转换为 Runtime Event
func (a *EventAdapter) ConvertToRuntimeEvent(msg tea.KeyMsg, layoutResult *runtime.LayoutResult) runtime.Event {
    // 获取焦点组件
    focusID := a.model.CurrentFocus

    // 获取焦点组件的 LayoutBox
    var focusBox *runtime.LayoutBox
    if layoutResult != nil {
        for _, box := range layoutResult.Boxes {
            if box.Node != nil && box.Node.ID == focusID {
                focusBox = &box
                break
            }
        }
    }

    return runtime.Event{
        Type:     "key",
        Data:     msg,
        TargetID: focusID,
        Box:      focusBox,
    }
}

// ConvertMouseToRuntimeEvent 将 Bubble Tea MouseMsg 转换为 Runtime Event
func (a *EventAdapter) ConvertMouseToRuntimeEvent(msg tea.MouseMsg, layoutResult *runtime.LayoutResult) runtime.Event {
    // 执行 HitTest
    var targetBox *runtime.LayoutBox
    var targetID string

    if layoutResult != nil {
        for _, box := range layoutResult.Boxes {
            if msg.X >= box.X && msg.X < box.X+box.W && msg.Y >= box.Y && msg.Y < box.Y+box.H {
                targetBox = &box
                targetID = box.Node.ID
                break
            }
        }
    }

    return runtime.Event{
        Type:     "mouse",
        Data:     msg,
        TargetID: targetID,
        Box:      targetBox,
        X:        msg.X,
        Y:        msg.Y,
    }
}
```

---

## 五、组件接口适配

### 5.1 组件需要实现的新接口

```go
// 组件需要实现以下接口之一：

// 1. Measurable - 测量接口
type Measurable interface {
    Measure(minW, maxW, minH, maxH int) (width, height int)
}

// 2. View - 渲染接口（替代 Render）
type ViewComponent interface {
    View() string
}

// 3. Focusable - 可聚焦接口（可选）
type Focusable interface {
    IsFocusable() bool
    SetFocus(bool)
}

// 4. EventAware - 事件感知接口（可选）
type EventAware interface {
    HandleEvent(event Event) bool
}
```

### 5.2 现有组件的适配方式

**方式 1：包装器（推荐）**

```go
// 不修改现有组件，通过包装器适配
type InputComponentWrapper struct {
    input *input.Input
}

func (w *InputComponentWrapper) Measure(minW, maxW, minH, maxH int) (int, int) {
    // 使用 input 的尺寸
    return maxW, 1  // 输入框通常是单行
}

func (w *InputComponentWrapper) View() string {
    return w.input.View()
}
```

**方式 2：逐步迁移**

```go
// 在现有组件中添加新方法
type InputModel struct {
    // ... 现有字段
}

// 保留旧方法
func (m *InputModel) Render(config core.RenderConfig) (string, error) {
    // ... 现有实现
}

// 添加新方法
func (m *InputModel) Measure(minW, maxW, minH, maxH int) (int, int) {
    return maxW, 1
}

func (m *InputModel) View() string {
    // 复用 Render 逻辑
    result, _ := m.Render(core.RenderConfig{})
    return result
}
```

---

## 六、变量替换机制的保持

### 6.1 Runtime 不感知变量替换

**关键原则**：变量替换（`{{expr}}`）完全在 Model 层处理，Runtime 只接收解析后的值。

```go
// Model.ResolveProps() 仍然负责变量替换
func (m *Model) resolveProps(comp *Component) map[string]interface{} {
    // ... 现有的表达式解析逻辑
    // 完全保留
}

// Runtime 通过 ComponentWrapper 获取解析后的 Props
func (w *ComponentWrapper) resolveProps() map[string]interface{} {
    if resolver, ok := w.model.(PropsResolver); ok {
        return resolver.ResolveProps(w.compID)
    }
    return nil
}
```

### 6.2 PropsCache 的保持

```go
// PropsCache 仍然在 Model 层工作
type PropsCache struct {
    cache map[string]*CacheEntry
    mu    sync.RWMutex
}

func (m *Model) resolveProps(comp *Component) map[string]interface{} {
    // 使用缓存
    if m.propsCache != nil {
        // ... 缓存逻辑
    }
    // ... 解析逻辑
}
```

---

## 七、快捷键管理的保持

### 7.1 快捷键处理保持不变

```go
// 快捷键绑定仍然在组件层处理
// Runtime 不感知快捷键

// 在 message_handlers.go 中处理
func (m *Model) handleKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    // 1. 检查全局快捷键
    if m.Config.KeyBindings != nil {
        if action, ok := m.Config.KeyBindings.Match(msg); ok {
            return m, m.executeAction(action)
        }
    }

    // 2. 转发到焦点组件
    if m.CurrentFocus != "" {
        return m.dispatchMessageToComponent(m.CurrentFocus, msg)
    }

    return m, nil
}
```

### 7.2 组件级快捷键

```go
// 组件内部仍然使用 bubbles/key
type KeyModel struct {
    binding key.Binding
}

// 组件的 UpdateMsg 处理快捷键
func (m *KeyModel) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 处理快捷键
        switch {
        case key.Matches(msg, m.binding.Keys()):
            // 执行动作
            return m, nil, core.Handled
        }
    }
    return m, nil, core.Ignored
}
```

---

## 八、迁移顺序与测试策略

### 8.1 渐进式迁移顺序

```
Phase 1: 基础设施（无破坏）
    └── 创建 runtime_adapter.go
    └── 创建 component_wrapper.go
    └── 添加 Model.UseRuntime 开关

Phase 2: 组件适配
    └── 文本组件适配（最简单）
    └── 输入组件适配
    └── 列表组件适配
    └── 表格组件适配

Phase 3: 消息处理集成
    └── 集成 Tea 消息到 Runtime Event
    └── 集成焦点管理

Phase 4: 渲染集成
    └── 替换 View() 方法
    └── 集成 Frame.String() 输出

Phase 5: 清理
    └── 移除 Legacy 代码
    └── 更新文档
```

### 8.2 测试策略

```go
// 双路径测试：确保 Legacy 和 Runtime 结果一致
func TestDualPathRendering(t *testing.T) {
    // 创建相同配置
    cfg := createTestConfig()

    // Legacy 路径
    legacyModel := NewModel(cfg, nil)
    legacyModel.UseRuntime = false
    legacyView := legacyModel.View()

    // Runtime 路径
    runtimeModel := NewModel(cfg, nil)
    runtimeModel.UseRuntime = true
    runtimeView := runtimeModel.View()

    // 验证结果一致（忽略 ANSI 代码差异）
    assertViewsEqual(t, legacyView, runtimeView)
}

// 变量替换测试
func TestVariableSubstitutionWithRuntime(t *testing.T) {
    cfg := &Config{
        Data: map[string]interface{}{
            "username": "testuser",
        },
        Root: &Component{
            Type: "text",
            Props: map[string]interface{}{
                "content": "Hello, {{username}}!",
            },
        },
    }

    model := NewModel(cfg, nil)
    model.UseRuntime = true
    model.Ready = true
    model.Width = 80
    model.Height = 24

    view := model.View()
    assert.Contains(t, view, "Hello, testuser!")
}

// 焦点管理测试
func TestFocusManagementWithRuntime(t *testing.T) {
    cfg := createMultiInputConfig()

    model := NewModel(cfg, nil)
    model.UseRuntime = true

    // 初始化
    cmd := model.Init()
    // 执行初始化命令...

    // 验证焦点切换
    initialFocus := model.CurrentFocus

    // 模拟 Tab 键
    model.Update(tea.KeyMsg{Type: tea.KeyTab})

    newFocus := model.CurrentFocus
    assert.NotEqual(t, initialFocus, newFocus)
}
```

---

## 九、回滚策略

### 9.1 功能开关

```go
// 在配置中添加开关
type Config struct {
    // ... 现有字段

    // Runtime 开关（默认 false，逐步启用）
    UseRuntime *bool `json:"useRuntime"`
}

// 在 NewModel 中读取配置
func NewModel(cfg *Config, program *tea.Program) *Model {
    model := &Model{
        // ... 现有初始化
    }

    // 读取开关
    if cfg.UseRuntime != nil {
        model.UseRuntime = *cfg.UseRuntime
    } else {
        // 默认使用 Legacy
        model.UseRuntime = false
    }

    return model
}
```

### 9.2 运行时切换

```go
// 允许运行时切换（调试用）
func (m *Model) SwitchToRuntime() {
    if !m.UseRuntime {
        m.UseRuntime = true
        m.initializeRuntime()
        log.Info("Switched to Runtime engine")
    }
}

func (m *Model) SwitchToLegacy() {
    if m.UseRuntime {
        m.UseRuntime = false
        m.initializeLegacy()
        log.Info("Switched to Legacy engine")
    }
}
```

---

## 十、检查清单

### 10.1 边界检查

- [ ] Runtime 不导入 Bubble Tea
- [ ] Runtime 不导入具体组件
- [ ] Runtime 不导入 DSL
- [ ] 只有 render/ 模块使用 lipgloss
- [ ] Model 处理变量替换
- [ ] Model 处理 Props 解析
- [ ] Model 处理 Tea 消息

### 10.2 功能检查

- [ ] 变量替换 `{{expr}}` 正常工作
- [ ] Props 解析正常工作
- [ ] Tea 消息机制正常工作
- [ ] 快捷键管理正常工作
- [ ] 焦点切换正常工作
- [ ] 状态管理正常工作
- [ ] EventBus 正常工作

### 10.3 性能检查

- [ ] 渲染性能不降低
- [ ] 内存使用不显著增加
- [ ] 布局计算时间可接受

---

## 十一、后续优化

### 11.1 Runtime 增强（v2）

- Grid 布局
- Wrap 换行
- 动画系统

### 11.2 性能优化

- Diff 渲染
- 脏区域标记
- 测量缓存

---

_本文档是活文档，随着迁移进展持续更新_
