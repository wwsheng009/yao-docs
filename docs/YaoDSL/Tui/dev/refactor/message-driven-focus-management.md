# 完全消息驱动的焦点管理重构

## 问题背景

在之前的实现中，TUI 框架存在直接调用组件方法的情况，这违反了消息驱动的设计原则：

- ActionMsg 处理器中直接调用 `model.setFocus()` 和 `model.clearFocus()`
- FocusFirstComponentMsg 处理器中直接调用 `model.setFocus()`
- `focusNextInput()` 和 `focusPrevInput()` 不返回 tea.Cmd

这种做法导致：

1. **绕过了消息机制** - 直接调用方法会绕过 tea.Cmd 的处理流程
2. **违反统一架构** - 焦点变化应该和其他状态变化一样通过消息传递
3. **难以追踪** - 直接调用使得消息流不清晰
4. **破坏了组件自治** - 组件应该完全通过消息来管理状态

## 重构目标

实现**完全消息驱动**的焦点管理：

- ✅ 所有焦点变化都通过 tea.Cmd 触发
- ✅ 框架不直接调用组件方法
- ✅ 组件通过 FocusMsg 自主管理焦点状态
- ✅ 统一的消息流：KeyMsg → Dispatch → Component → FocusMsg → UpdateMsg

## 具体修改

### 1. ActionMsg 处理器（message_handlers.go）

**修改前：**

```go
case core.EventFocusNext:
    // Move focus to next input component
    model.focusNextInput()
case core.EventFocusPrev:
    // Move focus to previous input component
    model.focusPrevInput()
case core.EventFocusChanged:
    // Update focus based on data
    if data, ok := actionMsg.Data.(map[string]interface{}); ok {
        if focused, ok := data["focused"].(bool); ok && focused {
            model.setFocus(actionMsg.ID)
        } else {
            model.clearFocus()
        }
    }
return model, nil  // ❌ 命令被忽略
```

**修改后：**

```go
case core.EventFocusNext:
    // Move focus to next input component via message-driven approach
    return model, model.focusNextInput()  // ✅ 返回命令
case core.EventFocusPrev:
    // Move focus to previous input component via message-driven approach
    return model, model.focusPrevInput()  // ✅ 返回命令
case core.EventFocusChanged:
    // NOTE: Focus changes should be driven by FocusMsg, not ActionMsg
    log.Trace("TUI: EventFocusChanged is deprecated, use FocusMsg instead")
    // Legacy compatibility (return commands)
    if data, ok := actionMsg.Data.(map[string]interface{}); ok {
        if focused, ok := data["focused"].(bool); ok && focused {
            return model, model.setFocus(actionMsg.ID)  // ✅ 返回命令
        } else {
            return model, model.clearFocus()  // ✅ 返回命令
        }
    }
    return model, nil
```

**关键变化：**

- `EventFocusNext`/`EventFocusPrev` 现在返回 tea.Cmd
- `EventFocusChanged` 也返回 tea.Cmd（虽然是遗留代码）
- 添加了 deprecated 注释，说明应该使用 FocusMsg

### 2. FocusFirstComponentMsg 处理器（message_handlers.go）

**修改前：**

```go
if len(focusableIDs) > 0 && model.Config.AutoFocus != nil && *model.Config.AutoFocus {
    // Set focus to the first focusable component
    model.setFocus(focusableIDs[0])  // ❌ 直接调用
    model.AutoFocusApplied = true
    log.Trace("TUI: Auto-focus to first focusable component: %s", focusableIDs[0])
}
return model, nil  // ❌ 命令被忽略
```

**修改后：**

```go
if len(focusableIDs) > 0 && model.Config.AutoFocus != nil && *model.Config.AutoFocus {
    // Set focus to the first focusable component via message-driven approach
    model.AutoFocusApplied = true
    log.Trace("TUI: Auto-focus to first focusable component: %s", focusableIDs[0])
    return model, model.setFocus(focusableIDs[0])  // ✅ 返回命令
}
return model, nil
```

**关键变化：**

- 先设置 AutoFocusApplied 标记
- 返回 `model.setFocus()` 的命令，让框架处理

### 3. focusNextInput() 方法（focus_manager.go）

**修改前：**

```go
func (m *Model) focusNextInput() {  // ❌ 不返回命令
    // ... 查找逻辑 ...
    // Use setFocus which handles focus change via TargetedMsg
    m.setFocus(nextFocus)  // ❌ 直接调用，命令丢失
}
```

**修改后：**

```go
func (m *Model) focusNextInput() tea.Cmd {  // ✅ 返回 tea.Cmd
    // ... 查找逻辑 ...
    // Use setFocus which handles focus change via TargetedMsg
    return m.setFocus(nextFocus)  // ✅ 返回命令
}
```

**关键变化：**

- 函数签名返回 `tea.Cmd`
- 返回 `m.setFocus()` 的结果，而不是直接调用

### 4. focusPrevInput() 方法（focus_manager.go）

**修改前：**

```go
func (m *Model) focusPrevInput() {  // ❌ 不返回命令
    // ... 查找逻辑 ...
    // Use setFocus which handles focus change via TargetedMsg
    m.setFocus(prevFocus)  // ❌ 直接调用，命令丢失
}
```

**修改后：**

```go
func (m *Model) focusPrevInput() tea.Cmd {  // ✅ 返回 tea.Cmd
    // ... 查找逻辑 ...
    // Use setFocus which handles focus change via TargetedMsg
    return m.setFocus(prevFocus)  // ✅ 返回命令
}
```

**关键变化：**

- 函数签名返回 `tea.Cmd`
- 返回 `m.setFocus()` 的结果，而不是直接调用

## 完全消息驱动的焦点流

### 焦点设置流程（setFocus）

```
用户按 Tab
    ↓
Model.handleKeyPress() 中的 handleTabNavigation()
    ↓
m.handleTabNavigation() 返回 (Model, tea.Cmd)
    ↓
tea.Cmd 执行 → 发送 TargetedMsg{oldId, FocusMsg{FocusLost}}
tea.Cmd 执行 → 发送 TargetedMsg{newId, FocusMsg{FocusGranted}}
    ↓
Model.Update() 接收到 TargetedMsg
    ↓
dispatchMessageToComponent() 路由到组件
    ↓
组件 UpdateMsg() → DefaultInteractiveUpdateMsg()
    ↓
handleFocusMessage() 处理 FocusMsg
    ↓
组件调用 SetFocus(true/false) 更新内部状态
```

### 焦点清除流程（clearFocus）

```
用户按 ESC
    ↓
组件 HandleSpecialKey() 返回 FocusLost 命令
    ↓
Model.Update() 返回 (Model, tea.Cmd)
    ↓
tea.Cmd 执行 → 发送 TargetedMsg{currentId, FocusMsg{FocusLost}}
    ↓
Model.Update() 接收到 TargetedMsg
    ↓
组件处理 FocusMsg → 调用 SetFocus(false)
    ↓
Model 检测到组件失焦 → CurrentFocus = ""
```

## 架构优势

### Before（直接调用）

```
❌ model.setFocus(id)  → 直接修改状态
❌ model.clearFocus()  → 直接修改状态
❌ 命令被忽略，消息流中断
```

### After（消息驱动）

```
✅ return model, model.setFocus(id)     → 完整的消息流
✅ return model, model.clearFocus()  → 完整的消息流
✅ 所有变化都通过 tea.Cmd → tea.Msg → UpdateMsg
```

## 设计原则

1. **消息驱动优先**
   - 所有状态变化都通过 tea.Cmd 触发
   - 框架不直接调用组件方法
   - 组件完全通过消息管理状态

2. **命令可组合**
   - tea.Cmd 可以组合成更复杂的命令
   - 通过 tea.Batch() 批量执行
   - 命令之间可以相互依赖

3. **组件自治**
   - 组件自己决定如何处理消息
   - 组件内部状态由组件管理
   - 框架只负责消息路由

4. **统一消息流**
   - 所有交互都通过消息
   - 清晰的消息传递路径
   - 易于调试和追踪

## 测试要点

1. **Tab 导航** - 焦点在组件间切换，每个组件收到正确的 FocusMsg
2. **ESC 失焦** - 组件通过 FocusMsg 自主失焦
3. **自动聚焦** - 初始化时第一个组件正确获得焦点
4. **命令组合** - 多个命令可以正确组合和执行
5. **消息追踪** - 每个焦点变化都有清晰的消息日志

## 总结

通过这次重构，TUI 框架实现了**完全消息驱动**的焦点管理：

✅ **移除直接调用** - 所有焦点变化都通过 tea.Cmd
✅ **统一消息流** - 焦点管理和其他状态管理使用相同机制
✅ **组件自治** - 组件通过响应 FocusMsg 管理自己的焦点状态
✅ **架构清晰** - 消息流明确，易于理解和维护

这样的设计完全符合 Bubble Tea 的消息驱动哲学，并且与 TUI 框架的整体架构保持一致。
