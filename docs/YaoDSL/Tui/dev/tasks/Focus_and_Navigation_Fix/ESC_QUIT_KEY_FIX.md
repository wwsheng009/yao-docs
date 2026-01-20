# ESC键与全局快捷键冲突问题修复文档

## 问题描述

在TUI应用中，当用户在Input/Textarea组件中按ESC键失去焦点后，紧接着按`q`键（绑定了quit操作）无法退出应用程序，导致用户体验问题。

**复现步骤**：

1. 输入组件获得焦点
2. 按下ESC键（组件失去焦点）
3. 按下`q`键（期望退出应用）
4. 应用没有退出，`q`键被"吞掉"了

## 问题排查过程

### 1. 检查ESC键处理流程

查看代码发现ESC键的处理是正常的：

```go
// input.go:249-258
case tea.KeyEsc:
    w.model.Blur()  // 失去焦点
    cmds = append(cmds, core.PublishEvent(...))
    return w, nil, core.Ignored  // 返回Ignored
```

ESC键正确地：

- 调用`Blur()`失去焦点
- 发布焦点变化事件
- 返回`Ignored`（让消息冒泡到全局处理层）

### 2. 检查全局快捷键绑定

```go
// loader.go:196
setMissingBinding(cfg.Bindings, "q", core.Action{Process: "tui.quit"})
```

`q`键确实被绑定到了`handleBoundActions`方法处理退出逻辑。

### 3. 检查消息分发流程

问题出在`handleKeyPress`的消息处理逻辑中：

```go
// model.go:398-407
if m.CurrentFocus != "" {
    updatedModel, cmd, handled := m.dispatchMessageToComponent(m.CurrentFocus, msg)
    if handled {
        // Component handled the message
        if m.isGlobalNavigationKey(msg) {
            return m.handleGlobalNavigation(msg)  // ESC等会走这里
        }
        return updatedModel, cmd  // 其他按键直接返回，不会检查全局绑定！
    }
}
```

### 4. 发现根本原因

查看Input组件的`UpdateMsg`方法：

```go
// input.go:244-289
case tea.KeyMsg:
    // ESC返回Ignored，但其他所有按键...
    switch msg.Type {
    case tea.KeyEsc:
        return w, nil, core.Ignored
    // ...
    }

    // 所有一次字符键（包括q）都被处理并返回Handled
    w.model.Model, cmd = w.model.Model.Update(msg)
    return w, cmd, core.Handled  // ← 吞掉了消息！
```

**关键问题**：即使组件已经`Blur()`失去焦点，只要它仍然在`Components`映射中存在，后续的所有按键消息仍然会分发给它并且返回`Handled`，导致全局快捷键永远无法触发。

## 根本原因分析

### 架构设计

TUI的消息处理采用了三层架构：

```
1. Capture Phase（捕获层）
   └─ 检查系统级快捷键（Ctrl+C等）

2. Dispatch Phase（分发层）
   ├─ 分发给当前焦点组件
   └─ 组件返回Handled/Ignored

3. Bubble Phase（冒泡层）
   ├─ 全局导航键（ESC、Tab等）
   ├─ 全局快捷键绑定
   └─ 默认处理
```

### 逻辑漏洞

关键问题在于`model.go:398-407`的逻辑：

```go
if m.CurrentFocus != "" {
    updatedModel, cmd, handled := m.dispatchMessageToComponent(m.CurrentFocus, msg)
    if handled {
        // 只检查ESC、Tab等全局导航键
        if m.isGlobalNavigationKey(msg) {
            return m.handleGlobalNavigation(msg)
        }
        // 其他Handled的消息直接返回，不检查全局绑定！
        return updatedModel, cmd
    }
}
```

这个逻辑假设：

- 如果组件`Handled`了消息，说明是组件特有的行为
- 只有`Ignored`的消息才需要检查全局绑定

但实际上：

- Input组件对**所有**按键都返回`Handled`（包括普通的字符输入）
- 即使blur后，它仍然返回`Handled`
- 这导致`q`这样的全局快捷键被组件层拦截

### 焦点状态管理

TUI有两个层面的焦点状态：

1. **Model层面**：`m.CurrentFocus` - 当前获取焦点的组件ID
2. **组件层面**：组件内部的状态，如`textinput.Focused()`

在`ESC`处理中：

```go
// component层面
w.model.Blur()  // textinput内部状态变为unfocused

// Model层面
m.clearFocus()  // m.CurrentFocus = ""
```

但问题在于：**组件层面blur后，Input的`UpdateMsg`仍然处理所有按键并返回Handled**。

## 修复方案

### 核心思路

在Input/Textarea/Chat等输入组件的`UpdateMsg`方法中，**检查当前焦点状态**：

```go
case tea.KeyMsg:
    // 关键修复：如果组件没有焦点，忽略所有按键
    if !w.model.Focused() {
        return w, nil, core.Ignored
    }

    // 焦点状态下的正常处理逻辑...
```

这样即使组件收到消息，也会在组件层面返回`Ignored`，让消息冒泡到全局快捷键处理层。

### 修复代码

#### Input组件 (input.go:247-250)

```go
case tea.KeyMsg:
    // 如果input没有焦点，忽略所有按键消息
    // 这样允许全局绑定（如 'q' 退出）生效
    if !w.model.Focused() {
        return w, nil, core.Ignored
    }

    // 原有焦点处理逻辑...
```

#### Textarea组件 (textarea.go:275-278)

```go
case tea.KeyMsg:
    // 如果textarea没有焦点，忽略所有按键消息
    if !w.model.Focused() {
        return w, nil, core.Ignored
    }

    // 原有焦点处理逻辑...
```

#### Chat组件 (chat.go:445-449)

```go
case tea.KeyMsg:
    // 如果chat输入没有焦点，忽略所有按键消息
    if !w.model.TextInput.Focused() {
        return w, nil, core.Ignored
    }

    // 原有焦点处理逻辑...
```

### 修复后的消息流程

```
用户按q键
    ↓
Model.handleKeyPress()
    ↓
检查 m.CurrentFocus == "" ✓ (ESC已清除焦点)
    ↓
跳过组件分发（直接到下一步）
    ↓
检查全局导航键？No
    ↓
执行 handleBoundActions()
    ↓
q → tui.quit → tea.Quit ✓ 成功退出
```

如果按修复前逻辑，流程会是：

```
用户按q键
    ↓
Model.handleKeyPress()
    ↓
检查 m.CurrentFocus == "" ✓
    ↓
但组件仍然存在于映射中（如果分发的话）
    ↓
组件返回 Handled × 阻止了绑定检查
    ↓
应用无法退出
```

## 架构原理说明

### 消息响应机制

Bubble Tea使用消息驱动架构：

1. **Model.Update()**: 主入口，接收所有消息
2. **Component.UpdateMsg()**: 组件层面的消息处理
3. **Response类型**:
   - `Handled`: 组件已处理，停止冒泡
   - `Ignored`: 组件未处理，继续冒泡
4. **tea.Cmd**: 异步命令，用于返回新消息

### 焦点管理

TUI的焦点管理涉及多个层面：

#### 1. Model层焦点 (model.go)

```go
type Model struct {
    CurrentFocus string  // 当前焦点组件ID
    Components   map[string]*core.ComponentInstance
    // ...
}

func (m *Model) setFocus(componentID string) {
    m.CurrentFocus = componentID
    if comp, exists := m.Components[componentID]; exists {
        comp.Instance.SetFocus(true)  // 调用组件层面
    }
    // 发布事件...
}

func (m *Model) clearFocus() {
    if comp, exists := m.Components[m.CurrentFocus]; exists {
        comp.Instance.SetFocus(false)
    }
    m.CurrentFocus = ""
    // 发布事件...
}
```

#### 2. 组件层焦点 (input.go等)

```go
// InputModel内部使用bubbletea的textinput
type InputModel struct {
    textinput.Model  // 有Focused()、Focus()、Blur()方法
    // ...
}

func (m *InputModel) SetFocus(focus bool) {
    if focus {
        m.Model.Focus()
    } else {
        m.Model.Blur()
    }
}
```

#### 3. 双层焦点一致性

修复前的问题是两层状态不同步：

```go
// ESC按下后
m.CurrentFocus = ""          // ✓ Model层焦点已清除
textinput.Focused() = false  // ✓ 组件层焦点已清除
但是...UpdateMsg仍然返回Handled ✗
```

修复后：

```go
// ESC按下后
m.CurrentFocus = ""
textinput.Focused() = false
UpdateMsg检查Focused() → 返回Ignored ✓
```

### 事件系统

TUI使用EventBus进行组件间通信：

```go
// core/types.go
type ActionMsg struct {
    ID     string                 // 组件ID
    Action string                 // 事件类型
    Data   map[string]interface{} // 事件数据
}

// 事件类型
EventFocusChanged     = "FOCUS_CHANGED"      // Model使用的焦点事件
EventInputFocusChanged = "INPUT_FOCUS_CHANGED" // 组件使用的焦点事件
```

注意：修复前存在事件名称不一致的问题（`EventFocusChanged` vs `EventInputFocusChanged`），但这不是导致q键失效的直接原因。

## 最佳实践建议

### 1. 组件设计原则

所有可交互组件应该遵循：

```go
func (c *Component) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 第一原则：检查焦点状态
        if !c.Focused() {
            return c, nil, core.Ignored
        }
        // ... 处理逻辑
    }
}
```

### 2. 全局快捷键优先级

```go
// model.go:391-418
func (m *Model) handleKeyPress(msg tea.KeyMsg) {
    // 1. 系统级最高优先级 (Ctrl+C)
    if msg.Type == tea.KeyCtrlC {
        return m, tea.Quit
    }

    // 2. 组件层处理
    if m.CurrentFocus != "" {
        _, _, handled := m.dispatchMessageToComponent(m.CurrentFocus, msg)
        if handled {
            // 3. 全局导航键其次
            if m.isGlobalNavigationKey(msg) {
                return m.handleGlobalNavigation(msg)
            }
            return m, cmd  // 组件处理，停止
        }
    }

    // 4. 全局导航键（无焦点时）
    if m.isGlobalNavigationKey(msg) {
        return m.handleGlobalNavigation(msg)
    }

    // 5. 全局快捷键绑定
    return m.handleBoundActions(msg)
}
```

### 3. 调试技巧

在开发过程中，可以添加trace日志：

```go
log.Trace("KeyPress: key=%s, focused=%s, handled=%v",
          msg.String(), m.CurrentFocus, handled)
```

## 测试验证

### 测试用例

1. **基本功能测试**
   - 输入组件获得焦点 → 输入字符正常显示 ✓
   - 按ESC → 组件失去焦点 ✓
   - 按q → 应用退出 ✓

2. **多组件场景**
   - Input焦点 → ESC → Tab切换到Table → ESC → q退出 ✓

3. **快捷键冲突测试**
   - 确保组件焦点状态下，输入字符正常
   - 确保组件失焦状态下，快捷键生效

### 相关测试文件

- `tui/components/input_test.go`
- `tui/input_test.go` (Model层测试)
- `tui/loader_default_bindings_test.go` (快捷键绑定测试)

## 总结

这次问题修复揭示了TUI消息处理架构中的一个常见陷阱：

**组件层面的消息处理必须与焦点状态同步**

即使组件在全局层面已经失去焦点，如果组件内部的`UpdateMsg`仍然`Handled`所有消息，就会导致全局快捷键失效。

修复方案简洁有效：在组件层面检查焦点状态，确保失焦的组件不会"吞掉"全局快捷键。这是符合Bubble Tea架构设计原则的实现方式。

## 相关文件

- `tui/model.go:391-441` - 按键处理主逻辑
- `tui/components/input.go:244-311` - Input组件消息处理
- `tui/components/textarea.go:263-311` - Textarea组件消息处理
- `tui/components/chat.go:433-491` - Chat组件消息处理
- `tui/loader.go:196` - 快捷键绑定配置
- `tui/core/types.go:415-420` - 事件发布机制
