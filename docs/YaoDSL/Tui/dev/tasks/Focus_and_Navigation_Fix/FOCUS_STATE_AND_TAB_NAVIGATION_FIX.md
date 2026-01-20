# 组件焦点状态与Tab导航修复文档

## 概述

本文档记录了对TUI组件系统中**焦点状态检查**和**Tab导航处理**的全面修复，确保所有交互组件能够正确处理无焦点状态，并且Tab键能够在组件间正确切换。

## 修复背景

在修复ESC键导致q键失效问题后，发现需要系统性地检查所有交互组件的焦点状态管理：

1. **焦点状态不一致**：组件失去焦点后仍然`Handled`所有按键
2. **Tab导航冲突**：部分组件在失焦后仍处理Tab键，阻止组件间切换

## 修复的组件列表

### 1. Input组件 (input.go)

**修复内容**：

- 在`UpdateMsg`方法开头添加焦点检查
- Tab键返回`Ignored`以允许全局导航

```go
case tea.KeyMsg:
    // 如果input没有焦点，忽略所有按键消息
    if !w.model.Focused() {
        return w, nil, core.Ignored
    }
    // ... 原有处理逻辑
```

**影响范围**：

- 文本输入框失焦后，字符输入不再消耗按键
- Tab键可以切换到下一个组件

### 2. Textarea组件 (textarea.go)

**修复内容**：

- 添加焦点状态检查
- Tab键返回`Ignored`

```go
case tea.KeyMsg:
    // 如果textarea没有焦点，忽略所有按键消息
    if !w.model.Focused() {
        return w, nil, core.Ignored
    }
    // ... 原有处理逻辑
```

**影响范围**：

- 多行文本框失焦后，不响应输入
- Tab键切换到下一个组件

### 3. Chat组件 (chat.go)

**修复内容**：

- 检查`TextInput`的焦点状态
- Tab键默认返回`Ignored`

```go
case tea.KeyMsg:
    // 如果chat输入没有焦点，忽略所有按键消息
    if !w.model.TextInput.Focused() {
        return w, nil, core.Ignored
    }
    // ... 原有处理逻辑
```

**注意**：Chat组件的Tab处理比较特殊，因为它内部管理了完整的消息发送流程，但失焦时仍会忽略。

### 4. Menu组件 (menu.go)

**修复内容**：

- 添加`focused`字段检查
- Tab键返回`Ignored`

```go
case tea.KeyMsg:
    // 如果menu没有焦点，忽略所有按键消息
    if !w.model.focused {
        return w, nil, core.Ignored
    }
    // ...
    case tea.KeyTab:
        return w, nil, core.Ignored
```

**说明**：Menu基于`list.Model`，内部维护`focused`布尔字段。

### 5. Form组件 (form.go)

**修复内容**（两处）：

- `FormModel.UpdateMsg`：添加焦点检查，Tab返回`Ignored`
- `FormComponentWrapper.UpdateMsg`：添加焦点检查

```go
case tea.KeyMsg:
    // 如果form没有焦点，忽略所有按键消息
    if !w.model.focused {
        return w, nil, core.Ignored
    }
    // ...
    case tea.KeyTab:
        // 让Tab冒泡到handleKeyPress进行组件导航
        return m, nil, core.Ignored
```

**重要变更**：

- **之前**：Tab键返回`Handled`并在Form内部切换字段
- **修复后**：Tab键返回`Ignored`，由全局处理组件间切换
- **影响**：Form内部的字段导航现在需要使用其他键（如上下箭头）

### 6. List组件 (list.go)

**修复内容**：

- 添加焦点检查（使用`props.Focused`）
- Tab键返回`Ignored`

```go
case tea.KeyMsg:
    // 如果list没有焦点，忽略所有按键消息
    if !w.model.props.Focused {
        return w, nil, core.Ignored
    }
    // ...
    case tea.KeyTab:
        // 让Tab冒泡到handleKeyPress进行组件导航
        return w, nil, core.Ignored
```

**说明**：List组件的焦点状态存储在`props.Focused`中。

### 7. Table组件 (table.go)

**修复内容**：

- 已有焦点检查（使用`Model.Focused()`）
- 添加Tab键特殊处理

```go
case tea.KeyMsg:
    // 如果table没有焦点，忽略键盘导航事件
    if !w.model.Model.Focused() {
        return w, nil, core.Ignored
    }
    // ...
    case tea.KeyTab:
        // 让Tab冒泡到handleKeyPress进行组件导航
        return w, nil, core.Ignored
```

**说明**：Table组件使用Bubble Tea的`table.Model`，它提供了`Focused()`方法。

### 8. CRUD组件 (crud.go)

**修复内容**：

- **不需要修改**，因为它是组合组件

**原因**：

- CRUD组件只是一个路由组件，根据内部状态将消息分发给子组件（Table或Form）
- 子组件（Table、Form）已经包含了正确的焦点检查
- `SetFocus`方法会将焦点委托给当前活动子组件

```go
func (c *CRUDComponent) SetFocus(focus bool) {
    switch c.State {
    case StateList:
        if c.Table != nil {
            c.Table.SetFocus(focus)
        }
    case StateEditing, StateCreating:
        if c.Form != nil {
            c.Form.SetFocus(focus)
        }
    // ...
}
```

## Tab键处理流程

### 修复前的流程

```
用户按Tab键
    ↓
Model.handleKeyPress()
    ↓
检查焦点组件 ✓
    ↓
dispatchMessageToComponent()
    ↓
组件返回 Handled × 阻止冒泡
    ↓
全局Tab导航无法执行
```

### 修复后的流程

```
用户按Tab键
    ↓
Model.handleKeyPress()
    ↓
检查焦点组件 ✓
    ↓
dispatchMessageToComponent()
    ↓
组件检查焦点状态 = false
    ↓
返回 Ignored ✓
    ↓
检查全局导航键 isGlobalNavigationKey(Tab) = true
    ↓
执行 handleTabNavigation() ✓
    ↓
切换到下一个组件
```

## 焦点状态管理规范

### 组件层面的焦点状态

所有交互组件必须实现以下标准：

#### 1. 焦点字段

```go
type ComponentModel struct {
    focused bool    // 方式1：直接字段
    // 或
    Model bubblesTextModel  // 方式2：使用底层组件的Focused()
}
```

#### 2. SetFocus方法

```go
func (m *ComponentModel) SetFocus(focus bool) {
    m.focused = focus
    // 或
    if focus {
        m.Model.Focus()
    } else {
        m.Model.Blur()
    }
}
```

#### 3. UpdateMsg焦点检查

```go
func (m *ComponentModel) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 第一优先级：检查焦点状态
        if !m.focused {
            return m, nil, core.Ignored
        }
        // 第二优先级：特殊键处理
        switch msg.Type {
        case tea.KeyTab:
            return m, nil, core.Ignored
        case tea.KeyEsc:
            // ...
        }
        // 第三优先级：常规处理
        // ...
    }
    // 非按键消息处理...
}
```

### Model层面的焦点管理

```go
// model.go
type Model struct {
    CurrentFocus string  // 当前焦点组件ID
    Components   map[string]*core.ComponentInstance
}

func (m *Model) setFocus(componentID string) {
    // 清除旧焦点
    if m.CurrentFocus != "" {
        if comp, ok := m.Components[m.CurrentFocus]; ok {
            comp.Instance.SetFocus(false)
        }
    }
    // 设置新焦点
    m.CurrentFocus = componentID
    if comp, ok := m.Components[componentID]; ok {
        comp.Instance.SetFocus(true)
    }
}
```

## 全局导航键设计

### 定义

```go
// model.go:421
func (m *Model) isGlobalNavigationKey(msg tea.KeyMsg) bool {
    return msg.Type == tea.KeyTab ||
           msg.Type == tea.KeyShiftTab ||
           (msg.Type == tea.KeyEsc && m.CurrentFocus != "")
}
```

### 优先级

```
优先级1：系统级（Ctrl+C）
优先级2：组件焦点检查（Input.Focused()等）
优先级3：全局导航键（Tab/Shift+Tab/ESC）
优先级4：全局快捷键绑定
优先级5：默认处理
```

## 消息处理完整流程

```
用户按键
    ↓
Model.Update()
    ↓
handleKeyPress()
    ├─ Ctrl+C → tea.Quit (最高优先级)
    └─ 检查 CurrentFocus
        ├─ 有焦点 → dispatchMessageToComponent()
        │   ├─ 组件检查focused = false → 返回Ignored
        │   └─ 组件检查focused = true → 处理并返回Handled/Ignored
        └─ 无焦点 → 跳过组件分发
    ↓
检查 isGlobalNavigationKey()
    ├─ Tab → handleTabNavigation() → 切换到下一个组件 ✓
    ├─ Shift+Tab → focusPrevComponent() ✓
    └─ ESC (有焦点) → clearFocus() ✓
    ↓
handleBoundActions()
    ├─ 'q' → tui.quit → tea.Quit ✓
    └─ 其他绑定...
```

## 组件焦点检查总结

| 组件     | 焦点字段/方法         | 焦点检查位置   | Tab处理       |
| -------- | --------------------- | -------------- | ------------- |
| Input    | `Focused()`           | UpdateMsg开头  | Ignored       |
| Textarea | `Focused()`           | UpdateMsg开头  | Ignored       |
| Chat     | `TextInput.Focused()` | UpdateMsg开头  | (默认Handled) |
| Menu     | `focused` (bool)      | UpdateMsg开头  | Ignored       |
| Form     | `focused` (bool)      | UpdateMsg开头  | Ignored       |
| List     | `props.Focused`       | UpdateMsg开头  | Ignored       |
| Table    | `Model.Focused()`     | UpdateMsg开头  | Ignored       |
| CRUD     | (不适用)              | (路由到子组件) | (子组件处理)  |

## 测试验证

### 基础测试用例

1. **单组件测试**
   - Input焦点 → 输入字符 → 显示正常 ✓
   - Input失焦 → 输入字符 → 无响应 ✓
   - 失焦后按q → 应用退出 ✓

2. **Tab导航测试**
   - Input焦点 → Tab → 切换到Table ✓
   - Table焦点 → Tab → 切换到下一个 ✓
   - 最后一个组件焦点 → Tab → 循环到第一个 ✓

3. **ESC测试**
   - Input焦点 → ESC → 失焦 ✓
   - 失焦后按q → 退出正常 ✓

4. **多组件场景**
   - Input → Tab → Table → Enter → CRUD进入编辑状态 → Tab → Form字段导航(使用上下箭头) ✓

### 特殊场景

1. **Form组件**
   - Form焦点 → 上/下箭头 → 字段间导航 ✓
   - Form焦点 → Tab → 切换到下一个组件（不再是字段导航）⚠️ (行为变更)

2. **CRUD组件**
   - List状态 → Tab → 切换组件 ✓
   - 编辑状态 → 呼叫 → Form处理 ✓

   ⚠️ **注意**：Form的Tab行为已从**字段导航**改为**组件导航**，可能影响现有用户体验。

## 潜在影响

### 行变更影响

#### Form组件Tab导航

**变更前**：

- Tab在Form字段间循环

**变更后**：

- Tab切换到下一个组件
- 字段导航需要使用上/下箭头

**原因**：

- 统一Tab导航为组件切换
- 避免组件内部处理阻止全局Tab导航

**建议**：

- 如果需要在Form内保留Tab字段导航，可以实现Shift+Tab或组合键

#### CRUD状态切换

**无影响**：

- CRUD的Tab行为由当前活动的子组件决定
- Table和Form都已正确处理

## 最佳实践建议

### 1. 创建新组件时

```go
func (c *NewComponentWrapper) UpdateMsg(msg tea.Msg) (...) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 1. 第一原则：检查焦点状态
        if !hasFocus() {
            return c, nil, core.Ignored
        }
        // 2. 第二原则：Tab键全局处理
        if msg.Type == tea.KeyTab {
            return c, nil, core.Ignored
        }
        // 3. ESC键特殊处理
        if msg.Type == tea.KeyEsc {
            // 清除焦点逻辑...
            return c, nil, core.Ignored
        }
        // 4. 其他按键正常处理...
    }
}
```

### 2. 调试技巧

```go
log.Trace("Component UpdateMsg: type=%s, focused=%t, currentFocus=%s",
          getMsgTypeName(msg), c.focused, model.CurrentFocus)
```

### 3. 确保焦点同步

```go
func (m *Model) setFocus(id string) {
    // 1. 清除旧焦点
    if m.CurrentFocus != "" {
        if c := m.Components[m.CurrentFocus]; c != nil {
            c.Instance.SetFocus(false)
        }
    }
    // 2. 设置新焦点
    m.CurrentFocus = id
    if c := m.Components[id]; c != nil {
        c.Instance.SetFocus(true)
    }
    // 3. 发布事件
    m.EventBus.Publish(core.ActionMsg{
        ID: id,
        Action: core.EventFocusChanged,
        Data: map[string]interface{}{"focused": true},
    })
}
```

## 相关文档

- [ESC_QUIT_KEY_FIX.md](./ESC_QUIT_KEY_FIX.md) - ESC键与全局快捷键冲突问题修复
- [AGENTS.md](../../AGENTS.md) - Yao开发指南与测试命令
- [ARCHITECTURE.md](../ARCHITECTURE.md) - TUI架构文档

## 修改的文件

1. `tui/components/input.go` - 添加焦点检查
2. `tui/components/textarea.go` - 添加焦点检查
3. `tui/components/chat.go` - 添加焦点检查
4. `tui/components/menu.go` - 添加焦点检查和Tab处理
5. `tui/components/form.go` - 添加焦点检查，修改Tab处理（两处）
6. `tui/components/list.go` - 添加焦点检查和Tab处理
7. `tui/components/table.go` - 添加Tab处理
