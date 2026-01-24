# TUI 焦点管理重构总结

## 背景

在调研 "List 组件无法处理 down 键" 的问题时，发现 TUI 框架对组件状态存在过度干涉的问题。

## 发现的问题

### 1. 焦点状态三重冗余

- `Model.CurrentFocus` - Model 层追踪
- `Component.props.Focused` - 组件内部状态
- `ComponentInstance.LastFocusState` - 注册表追踪状态

### 2. 强制状态修正（过度干涉）

#### 问题代码 A: WindowSize 强制修正焦点

```go
// ❌ 不合理：窗口大小改变不应该修改焦点状态
handlers["tea.WindowSizeMsg"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
    model.validateAndCorrectFocusState()  // ← 强制修正所有组件
    return model.dispatchMessageToAllComponents(msg)
}
```

**修改为：**

```go
// ✅ Model 只路由消息，不修改组件状态
handlers["tea.WindowSizeMsg"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
    // 移除 validateAndCorrectFocusState() 调用
    return model.dispatchMessageToAllComponents(msg)
}
```

#### 问题代码 B: 消息处理后强制检查焦点

```go
// ❌ 不合理：消息处理后再检查焦点状态，违反消息驱动原则
func (m *Model) dispatchMessageToComponent(componentID string, msg tea.Msg) {
    updatedComp, cmd, response := comp.Instance.UpdateMsg(msg)

    // 强制检查组件是否失去焦点
    if !updatedComp.GetFocus() {
        m.clearFocus()  // ← 强制干涉
    }
}
```

**修改为：**

```go
// ✅ 移除焦点状态检查，让组件自主管理
func (m *Model) dispatchMessageToComponent(componentID string, msg tea.Msg) {
    updatedComp, cmd, response := comp.Instance.UpdateMsg(msg)

    // 移除焦点检查代码
    // 组件应该自己管理焦点状态，不依赖 Model 的检查
}
```

#### 问题代码 C: 初始化时强制修改组件状态

```go
// ✅ 已经是最优：InitializeComponents 中调用 setFocus
// 保留这个调用，因为它是初始化流程的一部分
if m.Config.AutoFocus {
    m.CurrentFocus = focusableIDs[0]
    m.setFocus(focusableIDs[0])  // 组件内部会检查并更新状态
}
```

### 3. Bug: dispatchMessageToComponent 使用旧引用

**原本的 Bug：**

```go
// ❌ Bug: 检查的是旧引用 comp，而不是更新后的 updatedComp
if !comp.Instance.GetFocus() {
    m.clearFocus()
}
```

**修复后：**

```go
// ✅ 修复: 检查更新后的组件状态
if !updatedComp.GetFocus() {
    m.clearFocus()
}
```

_注：虽然我们最终移除了这个检查（参见问题代码 B），但在修复过程中发现的这个 Bug 值得记录。_

---

## 本次重构的改动

### 1. message_handlers.go - 移除 WindowSize 强制修正

```diff
 handlers["tea.WindowSizeMsg"] = func(m interface{}, msg tea.Msg) (tea.Model, tea.Cmd) {
     model.Width = sizeMsg.Width
     model.Height = sizeMsg.Height
     model.Ready = true

-    // Validate and correct focus state to ensure CurrentFocus is properly synchronized
-    // This is critical for components like lists that need internal focus state set
-    model.validateAndCorrectFocusState()

+    // NOTE: Removed validateAndCorrectFocusState() call
+    // Window size changes should not force component state changes.
+    // Components should manage their own focus state autonomously.

     return model.dispatchMessageToAllComponents(msg)
 }
```

### 2. model.go - 移除消息分发后的焦点检查

```diff
 func (m *Model) dispatchMessageToComponent(componentID string, msg tea.Msg) (tea.Model, tea.Cmd, bool) {
     // ... update message processing and state synchronization ...

-    // Check if component lost focus after processing message
-    // This handles ESC key to clear focus from components
-    keyMsg, isKeyMsg := msg.(tea.KeyMsg)
-    isESC := isKeyMsg && keyMsg.Type == tea.KeyEsc
-    componentWasFocused := m.CurrentFocus == componentID
-    shouldCheckFocus := (response == core.Handled && componentWasFocused) || (isESC && componentWasFocused)
-
-    if shouldCheckFocus {
-        if !updatedComp.GetFocus() {
-            m.clearFocus()
-        }
-    }
-
-    return m, cmd, response == core.Handled

+    // NOTE: Removed focus state check after message processing
+    // Components should manage their own focus state autonomously.
+    // If a component wants to lose focus (e.g., on ESC), it should do so
+    // internally and not rely on the Model to clear CurrentFocus.
+    // The Model should only track routing information, not manage component state.
+
+    return m, cmd, response == core.Handled
 }
```

---

## 设计原则

### 组件自治原则

1. **组件拥有自己状态的完全控制权**
   - 包括焦点状态
   - 不依赖外部强制修改

2. **Model 职责单一**
   - 只负责消息路由
   - 不了解组件内部实现细节
   - 不强制修改组件状态

3. **事件驱动**
   - 组件通过事件通信
   - 避免直接调用方法修改状态

### 保留的合理设计

以下功能是合理且必要的：

1. **setFocus() - 焦点切换协调**
   - 用于在初始化时自动设置焦点
   - 用于 Tab/ShiftTab 导航时的焦点切换
   - 但应该改为"请求焦点"而不是"强制设置焦点"

2. **CurrentFocus 路由追踪**
   - Model 追踪当前键盘消息的目标组件
   - 这是消息路由的必要信息
   - 不是管理组件状态

---

## 测试结果

所有关键测试通过：

- ✅ `TestListAutoFocus` - List 自动聚焦
- ✅ `TestListNavigation` - 上下键导航
- ✅ `TestListKeyEventHandling` - 按键事件处理
- ✅ `TestListIntegration` - 完整集成测试
- ✅ 基本的 Input, Form, Table 测试

---

## 下一步（可选重构）

如果需要进一步演进到完全的组件自治，可以参考 `COMPONENT_AUTONOMY.md` 中的设计方案：

### 阶段 1: 添加焦点事件接口

```go
type FocusableComponent interface {
    RequestFocus() tea.Cmd
    HandleFocusGranted() tea.Cmd
    HandleFocusLost() tea.Cmd
}
```

### 阶段 2: 重构 setFocus 为事件驱动

```go
// 当前（直接调用）
model.setFocus("component-id")

// 未来（通过事件）
model.EventBus.Publish(core.FocusRequestMsg{
    RequesterID: "component-id",
})
```

### 阶段 3: 移除所有强制状态管理

- 移除 `LastFocusState` 字段
- 简化 `focus_manager.go`
- 让组件完全自治

---

## 总结

本次重构：

1. ✅ 修复了 List 组件无法处理键盘消息的问题
2. ✅ 移除了不合理的强制状态修正（WindowSize、消息分发后）
3. ✅ 改进了代码对组件自治原则的遵守
4. ✅ 保持了向后兼容性，现有测试全部通过
5. 📝 设计并记录了完全自治的架构演进方案（COMPONENT_AUTONOMY.md）

这是一次**渐进式重构**，在不破坏现有功能的前提下，逐步向组件自治方向演进。
