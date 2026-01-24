# TUI 组件自治设计改进方案

## 问题分析

当前 TUI 框架对组件状态干涉过度，导致：

1. **焦点状态三重冗余**
   - `Model.CurrentFocus` - Model 层追踪
   - `Component.props.Focused` - 组件内部状态
   - `ComponentInstance.LastFocusState` - 注册表追踪

2. **强制状态修正**
   - `validateAndCorrectFocusState()` - 强制修正所有组件
   - `setFocus()` 中强制调用 `SetFocus()`
   - `dispatchMessageToComponent()` 处理后强制检查

3. **违反封装原则**
   - Model 直接操作组件内部状态
   - 组件无法自己决定何时获得/失去焦点
   - 状态同步复杂且容易出错

---

## 设计原则

1. **组件自治原则**：组件拥有自己状态的完全控制权
2. **Model 职责单一**：Model 只负责消息路由，不了解组件内部实现
3. **事件驱动**：组件间通过事件通信，而不是直接调用方法
4. **去中心化**：移除中心的"焦点管理者"，让组件自己请求焦点

---

## 改进后的架构

### 1. 简化的焦点管理

```go
// Model 只追踪谁是"当前接收键盘的组件"，不管理组件内部状态
type Model struct {
    CurrentFocus string  // 当前键盘消息的目标组件ID（只读信息）
    // 移除 LastFocusState 和所有强制 SetFocus 的代码
}
```

### 2. 焦点请求机制（替代 setFocus）

组件使用**消息**请求焦点：

```go
// 核心事件类型
const (
    EventFocusRequest   = "FOCUS_REQUEST"   // 组件请求焦点
    EventFocusLost      = "FOCUS_LOST"      // 组件失去焦点
    EventFocusGranted   = "FOCUS_GRANTED"   // 焦点被授予
    EventFocusChanged   = "FOCUS_CHANGED"   // 焦点变化通知（用于UI更新）
)

//组件请求焦点（通过消息）
func (c *ListComponent) RequestFocus() tea.Cmd {
    return func() tea.Msg {
        return core.TargetedMsg{
            TargetID: "model",  // 发送给 Model
            InnerMsg: core.FocusRequestMsg{
                RequesterID: c.id,
                Reason: "USER_INTERACTION",
            },
        }
    }
}
```

### 3. 简化的消息路由

```go
func (m *Model) handleKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    // 捕获阶段：退出键
    if msg.Type == tea.KeyCtrlC {
        return m, tea.Quit
    }

    // 路由阶段：发送给焦点组件
    if m.CurrentFocus != "" {
        return m.dispatchMessageToComponent(m.CurrentFocus, msg)
    }

    // 默认：不处理
    return m, nil
}

func (m *Model) dispatchMessageToComponent(componentID string, msg tea.Msg) (tea.Model, tea.Cmd) {
    comp, exists := m.Components[componentID]
    if !exists {
        return m, nil
    }

    // 直接转发，不检查或修改组件状态
    newModel, cmd := comp.Instance.UpdateMsg(msg)
    m.Components[componentID].Instance = newModel

    return m, cmd
}
```

### 4. 组件焦点自主控制

```go
func (c *ListComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 组件自己决定何时响应键盘

    // 如果没有焦点，忽略键盘消息（除非是焦点请求）
    if keyMsg, ok := msg.(tea.KeyMsg); ok && !c.props.Focused {
        // 组件自己决定是否处理，Model 不干涉
        if keyMsg.Type != tea.KeyTab && keyMsg.Type != tea.KeyEnter {
            return c, nil, core.Ignored
        }
    }

    // 委托给 bubbles list
    var cmds []tea.Cmd
    c.model, cmd := c.model.Update(msg)
    if cmd != nil {
        cmds = append(cmds, cmd)
    }

    // ESC 键：组件自己决定是否释放焦点
    if keyMsg, ok := msg.(tea.KeyMsg); ok && keyMsg.Type == tea.KeyEsc {
        if c.props.Focused {
            c.props.Focused = false  // 组件自己管理状态
            cmds = append(cmds, core.PublishEvent(c.id, core.EventFocusLost, nil))
        }
    }

    return c, tea.Batch(cmds...), core.Handled
}
```

### 5. 焦点自动切换（通过事件）

```go
// Tab 键自动切换焦点
func HandleTabNavigation(m *Model) (tea.Cmd, core.Response, bool) {
    focusableIDs := m.getFocusableComponentIDs()
    if len(focusableIDs) == 0 {
        return nil, core.Ignored, false
    }

    // 找到当前焦点位置
    currentIndex := -1
    for i, id := range focusableIDs {
        if id == m.CurrentFocus {
            currentIndex = i
            break
        }
    }

    // 通知当前组件失去焦点
    if currentIndex >= 0 {
        m.Components[m.CurrentFocus].Instance.UpdateMsg(
            core.TargetedMsg{
                TargetID: m.CurrentFocus,
                InnerMsg: FocusLostMsg{},
            }
        )
    }

    // 计算下一个焦点
    nextIndex := (currentIndex + 1) % len(focusableIDs)
    m.CurrentFocus = focusableIDs[nextIndex]

    // 通知新组件获得焦点
    return tea.Batch(
        func() tea.Msg {
            return TargetedMsg{
                TargetID: m.CurrentFocus,
                InnerMsg: FocusGrantedMsg{},
            }
        },
    ), core.Handled, true
}
```

---

## 移除的代码

### 1. 删除 focus_manager.go 中的强制方法

```go
// ❌ 删除这些方法
func (m *Model) setFocus(componentID string) { }
func (m *Model) clearFocus() { }
func (m *Model) updateInputFocusStates() { }
func (m *Model) validateAndCorrectFocusState() { }
func (m *Model) focusNextInput() { }
func (m *Model) focusPrevInput() { }
```

### 2. 删除 ComponentInstance.LastFocusState

```go
type ComponentInstance struct {
    ID         string
    Type       string
    Instance   ComponentInterface
    LastConfig RenderConfig
    // ❌ 删除 LastFocusState bool
}
```

### 3. 初始化时不要强制修改焦点

```go
// ❌ 修改前
func (m *Model) InitializeComponents() []tea.Cmd {
    // ...
    if m.Config.AutoFocus {
        m.CurrentFocus = focusableIDs[0]
        m.updateInputFocusStates()  // ❌ 强制修改组件状态
    }
}

// ✅ 修改后
func (m *Model) InitializeComponents() []tea.Cmd {
    // ...
    if m.Config.AutoFocus {
        m.CurrentFocus = focusableIDs[0]
        // ✅ 通过事件通知组件，不强制修改状态
        return append(cmds, func() tea.Msg {
            return core.TargetedMsg{
                TargetID: m.CurrentFocus,
                InnerMsg: core.FocusGrantedMsg{},
            }
        })
    }
}
```

---

## 迁移步骤

### 阶段 1：添加事件接口（不破坏现有代码）

1. 添加新的事件类型
2. 组件添加 `HandleFocusLost()` 和 `HandleFocusGranted()` 方法
3. 保留旧的 `SetFocus()` 方法（标记为 deprecated）

### 阶段 2：逐步移除强制调用

1. `InitializeComponents` 改用事件
2. 消息处理器删除 `validateAndCorrectFocusState` 调用
3. Tab/ShiftTab 改用事件通信

### 阶段 3：清理遗留代码

1. 删除 `focus_manager.go` 中的状态管理方法
2. 删除 `LastFocusState` 字段
3. 简化 message_handlers.go

---

## 好处

1. **组件自主**：组件完全控制自己的状态，包括焦点
2. **职责清晰**：Model 只负责路由，不了解组件实现
3. **易于测试**：组件可以独立测试，不依赖 Model 的状态管理
4. **更灵活**：不同组件可以有自己独特的焦点策略
5. **减少 Bug**：不需要维护三重状态的同步

---

## 示例：完全自治的 List 组件

```go
type ListComponent struct {
    model      list.Model
    props      ListProps
    id         string
    wantsFocus bool  // 内部焦点状态，完全自主管理
}

func (c *ListComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 如果组件没有焦点，只响应 Tab（请求焦点）
        if !c.wantsFocus {
            if msg.Type == tea.KeyTab || msg.Type == tea.KeyEnter {
                c.wantsFocus = true  // 自己决定获取焦点
                return c, func() tea.Msg {
                    return core.EventFocusChanged{
                        ComponentID: c.id,
                        Focused:     true,
                    }
                }, core.Handled
            }
            return c, nil, core.Ignored
        }

        // 有焦点，处理导航键
        switch msg.Type {
        case tea.KeyDown, tea.KeyUp, tea.KeyEnter:
            c.model, _ = c.model.Update(msg)
            return c, nil, core.Handled
        case tea.KeyEsc:
            c.wantsFocus = false  // 自己决定释放焦点
            return c, func() tea.Msg {
                return core.EventFocusChanged{
                    ComponentID: c.id,
                    Focused:     false,
                }
            }, core.Handled
        case tea.KeyTab:
            c.wantsFocus = false  // 让给下一个组件
            return c, nil, core.Ignored  // 让 Model 处理切换
        }
    }

    return c, nil, core.Ignored
}

func (c *ListComponent) GetFocus() bool {
    return c.wantsFocus  // 直接读取内部状态
}
```

这样的组件完全自治，不依赖 Model 的状态管理！
