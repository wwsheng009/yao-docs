# 统一消息处理工具使用指南

## 概述

统一消息处理工具是一套用于简化 TUI 组件消息处理的基础设施，旨在减少重复代码、提高代码一致性，并提供标准化的组件交互模式。

## 核心概念

### 三层拦截架构

所有交互组件都遵循统一的三层拦截架构：

1. **Layer 1**: 定向消息处理 - 处理定向发送给特定组件的消息
2. **Layer 0**: 组件绑定检查 - 检查用户配置的按键绑定（最高优先级）
3. **Layer 2**: 按键消息分层 - 分为焦点检查、特殊按键拦截、委托处理等子层
4. **Layer 3**: 非按键消息处理 - 处理非按键相关的消息

### 核心接口

#### InteractiveBehavior 接口

这是所有交互组件应该实现的主要接口，整合了多个功能：

```go
type InteractiveBehavior interface {
    ComponentInterface      // 基础组件接口
    StateCapturable         // 状态捕获接口
    HasFocus() bool         // 焦点检查
    HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, Response, bool) // 特殊按键处理
}
```

#### StateCapturable 接口

用于标准化状态变化检测：

```go
type StateCapturable interface {
    CaptureState() map[string]interface{}                    // 捕获当前状态
    DetectStateChanges(oldState, newState map[string]interface{}) []tea.Cmd  // 检测变化并发布事件
}
```

## 主要组件

### 1. DefaultInteractiveUpdateMsg 函数

这是核心的通用消息处理模板，组件可以复用此函数而不是重复实现相同的逻辑：

```go
func DefaultInteractiveUpdateMsg(
    w InteractiveBehavior,                                    // 组件实例
    msg tea.Msg,                                             // 接收到的消息
    getBindings func() []ComponentBinding,                   // 获取按键绑定（可选）
    handleBinding func(keyMsg tea.KeyMsg, binding ComponentBinding) (tea.Cmd, Response, bool), // 处理绑定
    delegateUpdate func(msg tea.Msg) tea.Cmd,               // 委托给原组件处理
) (tea.Cmd, Response)                                      // 返回命令和响应状态
```

### 2. 状态助手类

为常用组件提供预设的状态捕获和变化检测实现：

- **InputStateHelper**: 用于输入组件的状态管理
- **ListStateHelper**: 用于列表组件的状态管理

### 3. 辅助函数

- **HandleTargetedMsg**: 处理定向消息
- **CheckFocus**: 统一焦点检查
- **HandleStateChanges**: 统一状态变化处理

## 使用示例

### 基本用法

```go
func (w *MyComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 使用通用模板
    cmd, response := core.DefaultInteractiveUpdateMsg(
        w,                       // 实现了 InteractiveBehavior 的组件
        msg,                     // 接收的消息
        w.getBindings,          // 获取按键绑定的函数
        w.handleBinding,        // 处理按键绑定的函数
        w.delegateToBubbles,    // 委托给底层 bubbles 组件的函数
    )

    return w, cmd, response
}
```

### 实现 InteractiveBehavior 接口

```go
// 实现焦点检查
func (w *MyComponentWrapper) HasFocus() bool {
    return w.model.Focused()
}

// 实现特殊按键处理
func (w *MyComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
    switch keyMsg.Type {
    case tea.KeyEnter:
        // 处理回车键
        cmd := core.PublishEvent(w.GetID(), "MY_CUSTOM_EVENT", nil)
        return cmd, core.Handled, true
    case tea.KeyEscape:
        // 处理ESC键
        return nil, core.Handled, true
    }

    // 未处理此按键
    return nil, core.Ignored, false
}

// 实现状态捕获
func (w *MyComponentWrapper) CaptureState() map[string]interface{} {
    return map[string]interface{}{
        "value": w.model.Value(),
        "index": w.model.Index(),
        "focus": w.model.Focused(),
    }
}

// 实现状态变化检测
func (w *MyComponentWrapper) DetectStateChanges(old, new map[string]interface{}) []tea.Cmd {
    var cmds []tea.Cmd

    if old["value"] != new["value"] {
        cmds = append(cmds, core.PublishEvent(w.GetID(), "VALUE_CHANGED", map[string]interface{}{
            "old": old["value"],
            "new": new["value"],
        }))
    }

    return cmds
}
```

## 重构收益

使用统一消息处理工具的显著收益：

1. **代码减少**: 组件的 UpdateMsg 方法从 70+ 行减少到 20-25 行
2. **一致性提升**: 所有组件使用相同的消息处理模式
3. **易于维护**: 修复 bug 只需在一个地方修改
4. **标准化**: 统一的状态变化检测和事件发布机制
5. **灵活性**: 保留了组件的自定义处理能力

## 最佳实践

1. **始终使用模板**: 尽可能复用 `DefaultInteractiveUpdateMsg` 模板
2. **状态助手**: 为常见组件类型使用预定义的状态助手
3. **分层处理**: 遵循三层架构，保持逻辑分离
4. **事件标准化**: 使用预定义的事件常量
5. **错误处理**: 在状态助手的 DetectStateChanges 中妥善处理错误

## 常见用例

### 1. 输入组件重构

```go
// 使用 InputStateHelper 简化输入组件的状态管理
stateHelper := &core.InputStateHelper{
    Valuer:      w.model,
    Focuser:     w.model,
    ComponentID: w.model.id,
}
```

### 2. 列表组件重构

```go
// 使用 ListStateHelper 简化列表组件的状态管理
stateHelper := &core.ListStateHelper{
    Indexer:     w.model,
    Selector:    w.model,
    Focused:     w.model.IsFocused(),
    ComponentID: w.model.id,
}
```

### 3. 按键绑定集成

所有组件现在都可以轻松集成按键绑定功能：

```go
// 在组件中获取绑定配置
func (w *MyComponentWrapper) getBindings() []core.ComponentBinding {
    return w.props.Bindings
}

// 处理绑定
func (w *MyComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
    cmd, response, handled := core.HandleBinding(keyMsg, binding, w.GetID())
    return cmd, response, handled
}
```

## 注意事项

1. **接口兼容性**: 确保组件正确实现所有必需的接口方法
2. **状态一致性**: 在 CaptureState 中捕获所有需要监控的状态字段
3. **事件发布**: 在 DetectStateChanges 中只发布有意义的变化事件
4. **性能考虑**: 避免在状态检测中进行昂贵的计算
5. **错误处理**: 在状态助手方法中妥善处理可能的错误情况
