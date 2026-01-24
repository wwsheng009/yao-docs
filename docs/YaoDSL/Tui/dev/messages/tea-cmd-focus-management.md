# 完全使用 tea 消息机制的焦点管理

## 核心改进

移除 EventBus 依赖，完全使用 Bubble Tea 的消息机制来进行焦点管理。

## 为什么这样做

1. **避免双重消息系统**
   - EventBus tea.Msg → 独立的消息路由和管理
   - 造成架构冗余，增加复杂度

2. **统一消息流**
   - 所有消息（包括焦点事件）都通过 tea.Cmd → tea.Msg → Update()
   - 更清晰的消息传递路径

3. **符合 Bubble Tea 设计哲学**
   - Model.Update() 是中心的消息处理机制
   - 使用 Cmd 来触发状态变化

## 架构对比

### Before (EventBus)

```go
// setFocus 发布到 EventBus
func (m *Model) setFocus(componentID string) {
    m.CurrentFocus = componentID
    m.EventBus.Publish(core.ActionMsg{  // ← 使用 EventBus
        ID: componentID,
        Action: core.EventFocusChanged,
        Data: map[string]interface{}{"focused": true},
    })
}

// 组件必须监听 EventBus
comp.Subscribe(EventFocusChanged, func(msg ActionMsg) {
    comp.SetFocus(msg.Data["focused"].(bool))
})
```

问题：

- 需要维护 EventBus 订阅/取消订阅
- 消息流不统一，部分走 tea.Msg，部分走 EventBus
- 难以追踪消息来源

### After (tea.Cmd)

```go
// setFocus 返回 tea.Cmd
func (m *Model) setFocus(componentID string) tea.Cmd {
    oldFocus := m.CurrentFocus
    m.CurrentFocus = componentID

    var cmds []tea.Cmd

    // 发送 FocusLost 给旧组件
    if oldFocus != "" {
        cmds = append(cmds, func() tea.Msg {
            return core.TargetedMsg{
                TargetID: oldFocus,
                InnerMsg: core.FocusMsg{
                    Type:   core.FocusLost,
                    Reason: "TAB_NAVIGATE",
                    ToID:   componentID,
                },
            }
        })
    }

    // 发送 FocusGranted 给新组件
    cmds = append(msgs, func() tea.Msg {
        return core.TargetedMsg {
            TargetID: componentID,
            InnerMsg: core.FocusMsg{
                Type:     core.FocusGranted,
                Reason:   "TAB_NAVIGATE",
                FromID:   oldFocus,
            },
        }
    })

    return tea.Batch(cmds...)
}

// 在 Model.Update() 中自动处理
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case core.TargetedMsg:
        // TargetedMsg 会被自动路由到正确的组件
        // 组件通过 UpdateMsg() 处理
    }
}
```

好处：

- ✅ 统一的消息流
- ✅ 自动消息路由和优先级
- ✅ 清晰的消息来源追踪
- ✅ 符合 Bubble Tea 最佳实践

## 消息类型

### FocusMsg

定义在 `core/types.go`:

```go
type FocusType int

const (
    FocusGranted FocusType = iota // 组件获得焦点
    FocusLost                     // 组件失去焦点
)

type FocusMsg struct {
    Type   FocusType // FocusGranted or FocusLost
    Reason string    // "TAB_NAVIGATE", "USER_ESC", "AUTO_FOCUS", etc.
    FromID string    // 失去焦点的组件 ID (FocusGranted 时)
    ToID   string    // 获得焦点的组件 ID (FocusLost 时)
}
```

### TargetedMsg + FocusMsg

组合使用进行精确的消息投递：

```go
// 发送给特定组件
return core.TargetedMsg{
    TargetID: "component-id",
    InnerMsg: core.FocusMsg{
        Type:   core.FocusLost,
        Reason: "TAB_NAVIGATE",
        ToID:   "new-component-id",
    },
}
```

## Focus Flow

### Tab/ShiftTab 切换焦点

```
User presses Tab
    ↓
Model.Update()
    ↓
handleKeyPress() 或 handleNativeNavigation()
    ↓
focusNextComponent() 调用 setFocus()
    ↓
setFocus() 返回 tea.Cmd 包含两个消息:
    1. TargetedMsg{oldId, FocusMsg{FocusLost}}
    2. TargetedMsg{newId, FocusMsg{FocusGranted}}
    ↓
tea.Batch() 执行命令
    ↓
Model.Update() 再次调用
    ↓
dispatchMessageToComponent() 路由消息
    ↓
1. 旧组件 UpdateMsg() 收到 FocusMsg(FocusLost)
    → 调用 SetFocus(false)
2. 新组件 UpdateMsg() 收到 FocusMsg(FocusGranted)
    → 调用 SetFocus(true)
```

### ESC 释放焦点

```
User presses ESC
    ↓
Model.Update()
    ↓
component.UpdateMsg() 处理 ESC
    → handleDefaultEscape() 调用 SetFocus(false)
    → 返回 Handled
    ↓
Model 检测到组件失去焦点
    ↓
clearFocus() 返回 tea.Cmd
    ↓
TargetedMsg{currentId, FocusMsg{FocusLost}}
    ↓
dispatchMessageToComponent() 路由
    ↓
组件再次确认失去焦点（如果还没处理）
```

## 组件如何实现

组件需要在 UpdateMsg() 中处理 FocusMsg：

```go
func (c *ListComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 处理 TargetedMsg
    if targetedMsg, ok := msg.(core.TargetedMsg); ok {
        if targetedMsg.TargetID == c.id {
            // 提取内部消息继续处理
            msg = targetedMsg.InnerMsg
        } else {
            return c, nil, core.Ignored
        }
    }

    // 处理 FocusMsg
    if focusMsg, ok := msg.(core.FocusMsg); ok {
        switch focusMsg.Type {
        case core.FocusGranted:
            c.props.Focused = true
        case core.FocusLost:
            c.props.Focused = false
        }
        return c, nil, core.Handled
    }

    // 其他消息处理...
}
```

## 优势总结

| 方面       | Before (EventBus)          | After (tea.Cmd)           |
| ---------- | -------------------------- | ------------------------- |
| 消息路由   | EventBus 订阅机制          | tea.Update() 统一路由     |
| 消息流     | 分裂（tea.Msg + EventBus） | 统一（tea.Cmd → tea.Msg） |
| 焦点同步   | 监听事件需手动管理         | 自动命令批处理            |
| 调试难度   | 需跟踪两套消息系统         | 单一消息流易于追踪        |
| 架构复杂度 | 高（双系统）               | 低（单系统）              |
| 符合框架   | ❌ 偏离 Bubble Tea         | ✅ 完全符合               |

## 迁移路径

### 阶段 1: 已完成 ✅

- [x] 定义 FocusType 和 FocusMsg
- [x] 修改 setFocus() 返回 tea.Cmd
- [x] 修改 clearFocus() 返回 tea.Cmd
- [x] InitializeComponents 使用 tea.Cmd

### 阶段 2: 组件适配

组件可以选择性地处理 FocusMsg 以获得更精细的控制：

- [ ] Input 组件处理 FocusMsg
- [ ] List 组件处理 FocusMsg
- [ ] Table 组件处理 FocusMsg
- [ ] 其他交互组件...

### 阶段 3: 清理

- [ ] 移除 EventBus 从非必要场景
- [ ] 简化/移除 ActionMsg 中的事件发布
- [ ] 文档更新

## 示例：完整的焦点切换

```
// 用户按 Tab
KeyMsg{Type: tea.KeyTab}
    ↓
// Model 生成命令
setFocus("input2")
    ↓
// 返回命令
tea.Batch(
    func() tea.Msg {
        return TargetedMsg{
            TargetID: "input1",
            InnerMsg: FocusMsg{Type: FocusLost, ToID: "input2"},
        }
    },
    func() tea.Msg {
        return TargetedMsg{
            TargetID: "input2",
            InnerMsg: FocusMsg{Type: FocusGranted, FromID: "input1"},
        }
    },
)
    ↓
// tea 执行命令并发送消息
Update(TargetedMsg{TargetID: "input1", ...})
Update(TargetedMsg{TargetID: "input2", ...})
    ↓
// 组件处理
input1.UpdateMsg(FocusMsg{FocusLost}) → SetFocus(false)
input2.UpdateMsg(FocusMsg{FocusGranted}) → SetFocus(true)
    ↓
// 完成
input1 失去焦点
input2 获得焦点
```

## 后续工作

1. **组件支持** - 让交互组件显式处理 FocusMsg
2. **性能优化** - 避免不必要的焦点状态查询
3. **文档更新** - 说明新的消息驱动架构
4. **迁移指南** - 帮助现有组件适配

---

## 总结

通过完全使用 tea 消息机制，我们：

1. **统一了架构** - 所有消息通过 tea.Cmd/tea.Msg
2. **简化了复杂度** - 移除了双重消息系统的维护负担
3. **提高了可维护性** - 更清晰的代码结构和消息流
4. **符合设计哲学** - 完全遵循 Bubble Tea 的核心原则

这是朝着真正的组件自治和清晰架构迈进的重要一步！
