# ESC键全局绑定优先级处理文档

## 概述

本文档描述了ESC键在与输入控件交互时的处理行为，重点说明**ESC键在取消焦点后会执行全局绑定**的特性。

## 功能说明

当用户在输入控件（Input、Textarea等）中按下ESC键时：

1. **第一阶段**：组件内部处理
   - 输入控件失去焦点（Blur）
   - 清除组件内部输入状态
   - 返回`Ignored`让消息冒泡

2. **第二阶段**：全局处理
   - Model检测到ESC键是全局导航键
   - 执行`clearFocus()`清除全局焦点状态
   - **检查ESC的全局绑定**（新增）
   - 如果存在ESC绑定，执行对应操作（如退出）

## 实现原理

### 组件层处理

输入组件返回`Ignored`，让ESC消息继续冒泡：

```go
// input.go:254-263
case tea.KeyEsc:
    w.model.Blur()
    // 发布焦点变化事件
    cmds = append(cmds, core.PublishEvent(
        w.model.id,
        core.EventInputFocusChanged,
        map[string]interface{}{"focused": false}
    ))
    return w, nil, core.Ignored  // 关键：返回Ignored让消息冒泡
```

### Model层处理

`handleGlobalNavigation`在清除焦点后检查ESC绑定：

```go
// model.go:426-441
func (m *Model) handleGlobalNavigation(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    switch msg.Type {
    case tea.KeyTab:
        return m.handleTabNavigation()
    case tea.KeyShiftTab:
        m.focusPrevComponent()
        return m, nil
    case tea.KeyEsc:
        if m.CurrentFocus != "" {
            m.clearFocus()  // 清除焦点
            // 新增：执行ESC的全局绑定
            key := msg.String()
            if m.Config.Bindings != nil {
                if action, ok := m.Config.Bindings[key]; ok {
                    return m.executeBoundAction(&action, key)
                }
            }
            return m, nil
        }
    }
    return m, nil
}
```

## ESC全局绑定配置

### 默认绑定

在`loader.go`中配置默认的ESC绑定：

```go
// 可以添加ESC到退出绑定
setMissingBinding(cfg.Bindings, "esc", core.Action{Process: "tui.quit"})
```

### 自定义绑定

在TUI配置中可以自定义ESC的行为：

```yaml
# config.yaml
bindings:
  esc:
    process: "tui.quit"  # ESC键退出应用
  # 或者
  esc:
    process: "custom.action"  # 自定义操作
```

## 消息处理流程

### 原有流程（不执行全局绑定）

```
用户按ESC键
    ↓
输入组件处理
    ├─ Blur()
    └─ 返回 Ignored
    ↓
handleGlobalNavigation()
    ├─ clearFocus()
    └─ return (结束)
    ↓
ESC被消耗，不执行任何操作
```

### 新流程（执行全局绑定）

```
用户按ESC键
    ↓
输入组件处理
    ├─ Blur()
    └─ 返回 Ignored
    ↓
handleGlobalNavigation()
    ├─ clearFocus()  ✓
    ├─ 检查ESCBinding
    │   └─ 存在 → executeBoundAction()  ✓ 新增
    │   └─ 不存在 → 继续处理
    └─ handleBoundActions()
        └─ 再次检查ESC绑定（如果上面未找到）
    ↓
执行对应操作（如退出）
```

## 使用场景

### 场景1：ESC键退出应用

用户在输入框中输入内容后想退出：

```
用户操作流程：
1. 输入框有焦点，输入内容
2. 按ESC键
   - 输入框失去焦点
   - 自动执行退出操作
3. 应用退出
```

### 场景2：ESC键取消表单编辑

```yaml
bindings:
  esc:
    process: 'form.cancel'
```

```
用户操作流程：
1. 表单Input有焦点
2. 按ESC键
   - Input失去焦点
   - 执行form.cancel流程
   - 可能弹出确认对话框或直接取消
```

### 场景3：ESC键返回上级菜单

```yaml
bindings:
  esc:
    process: 'menu.back'
```

```
用户操作流程：
1. 输入框有焦点
2. 按ESC键
   - Input失去焦点
   - 菜单返回上一级
```

## 优先级说明

### 按键处理优先级层次

```
优先级1：系统级最高优先级
    Ctrl+C → tea.Quit (强制退出)

优先级2：组件焦点状态
    Input.Focused() = false → 返回Ignored

优先级3：全局导航键
    ESC (有焦点) → handleGlobalNavigation()
    ├─ clearFocus()
    ├─ 检查ESC全局绑定  ← 新增行为
    └─ 执行绑定或继续

优先级4：全局快捷键绑定
    handleBoundActions()
    └─ 再次检查所有绑定

优先级5：默认处理
    return m, nil
```

### ESC键特殊处理

ESC键的处理是**两阶段检查绑定**：

```go
// 第一阶段：handleGlobalNavigation中（优先）
case tea.KeyEsc:
    if m.CurrentFocus != "" {
        m.clearFocus()
        // 检查ESC绑定（第1次）
        if action, ok := m.Config.Bindings["esc"]; ok {
            return m.executeBoundAction(&action, "esc")
        }
    }

// 第二阶段：handleBoundActions中（兜底）
// 如果上面没找到，这里会再次检查
```

这种设计确保：

1. 组件失焦后立即执行ESC操作
2. 即使第一阶段没找到，第二阶段也会兜底检查

## 与其他键的区别

### Tab键

```go
// Tab只做导航，不执行其他操作
case tea.KeyTab:
    return m.handleTabNavigation()  // 仅切换焦点
```

### Enter键

```go
// Enter在全局绑定中单独处理
case tea.KeyEnter:
    // 可能触发表单提交
    // 但不会在clearFocus后执行绑定
```

### ESC键（特殊）

```go
// ESC清除焦点后执行绑定操作
case tea.KeyEsc:
    m.clearFocus()
    // 执行全局绑定  ← 这是ESC的独特行为
    return m.executeBoundAction(...)
```

## 禁用ESC全局绑定

如果不希望ESC在清除焦点后执行操作，可以通过配置：

### 方式1：不配置ESC绑定

```yaml
bindings:
  # 不添加esc绑定，ESC只清除焦点
```

### 方式2：明确设置为空

```yaml
bindings:
  esc:
    process: '' # 空操作
```

## 边界情况处理

### 1. 无焦点时按ESC

```go
// 无焦点时ESC不会被识别为全局导航键
isGlobalNavigationKey :=
    (msg.Type == tea.KeyEsc && m.CurrentFocus != "")

// 所以ESC会直接走handleBoundActions
```

### 2. 多个焦点组件

```
Input焦点 → ESC → clearFocus() → 执行ESC绑定 ✓
再次按ESC → 无焦点 → 检查ESC绑定 ✓ (可能再次执行)
```

### 3. ESC在非输入组件中

```
Table焦点 → ESC → clearFocus() → 执行ESC绑定 ✓
Menu焦点 → ESC → 返回Handled (不冒泡) ×
```

**说明**：不同组件对ESC的处理不同：

- Input/Textarea/Chat: 返回Ignored，触发全局处理
- Menu: 返回Handled，阻止全局处理
- Table/Form: 返回Ignored，触发全局处理

## 测试验证

### 测试用例1：ESC退出应用

```go
func TestESCQuitAfterInput(t *testing.T) {
    cfg := &Config{
        Bindings: map[string]core.Action{
            "esc": {Process: "tui.quit"},
        },
    }
    model := NewModel(cfg, nil)

    // 设置焦点到Input
    model.setFocus("test-input")

    // 按ESC
    msg := tea.KeyMsg{Type: tea.KeyEsc}
    updatedModel, cmd := model.handleKeyPress(msg)

    // 验证：焦点已清除
    assert.Equal(t, "", updatedModel.(*Model).CurrentFocus)

    // 验证：执行了退出命令
    assert.NotNil(t, cmd)
}
```

### 测试用例2：ESC没有绑定时

```go
func TestESCWithoutBinding(t *testing.T) {
    cfg := &Config{
        Bindings: map[string]core.Action{
            "q": {Process: "tui.quit"},  // 只有q绑定
        },
    }
    model := NewModel(cfg, nil)

    model.setFocus("test-input")

    // 按ESC
    msg := tea.KeyMsg{Type: tea.KeyEsc}
    updatedModel, cmd := model.handleKeyPress(msg)

    // 验证：焦点已清除
    assert.Equal(t, "", updatedModel.(*Model).CurrentFocus)

    // 验证：没有执行任何命令
    assert.Nil(t, cmd)
}
```

### 测试用例3：多次按ESC

```go
func TestMultipleESC(t *testing.T) {
    cfg := &Config{
        Bindings: map[string]core.Action{
            "esc": {Process: "tui.quit"},
        },
    }
    model := NewModel(cfg, nil)

    model.setFocus("test-input")

    // 第一次按ESC：失焦 + 退出
    msg := tea.KeyMsg{Type: tea.KeyEsc}
    updatedModel, cmd := model.handleKeyPress(msg)
    assert.Equal(t, "", updatedModel.(*Model).CurrentFocus)
    assert.NotNil(t, cmd)  // 退出命令

    // 第二次按ESC：无焦点，应直接执行ESC绑定
    msg = tea.KeyMsg{Type: tea.KeyEsc}
    updatedModel, cmd = model.handleKeyPress(msg)
    assert.NotNil(t, cmd)  // 再次执行退出
}
```

## 注意事项

### 1. ESC与q键的区别

| 特性     | ESC键               | q键          |
| -------- | ------------------- | ------------ |
| 焦点处理 | 自动清除焦点        | 无焦点操作   |
| 触发时机 | 有焦点时触发        | 无焦点时触发 |
| 重复按下 | 可重复执行          | 可重复执行   |
| 默认行为 | 清除焦点 + 可能退出 | 仅退出       |

### 2. ESC在组件内部的优先级

```
Input组件ESC处理：
1. Blur() - 清除组件焦点
2. 发布EventInputFocusChanged
3. 返回Ignored → 触发全局ESC处理

Table组件ESC处理：
1. 返回Ignored → 触发全局ESC处理
2. 清除焦点 + 执行ESC绑定
```

### 3. 与表单提交的区别

```
Enter键：
- Input焦点 → 触发表单提交
- 无特殊焦点处理

ESC键：
- Input焦点 → 清除焦点 + 执行ESC绑定
- 可能是取消、退出等操作
```

## 最佳实践

### 1. 配置ESC绑定

```yaml
# 推荐配置
bindings:
  # 退出应用（单次ESC）
  esc:
    process: "tui.quit"

  # 或者需要确认的退出
  esc:
    process: "modal.confirm-quit"

  # 表单场景：取消编辑
  esc:
    process: "form.cancel"
```

### 2. 组件ESC处理

```go
case tea.KeyEsc:
    // 标准模式：Blur + 返回Ignored
    w.model.Blur()
    return w, nil, core.Ignored

    // 阻止模式：返回Handled（阻止全局ESC处理）
    return w, nil, core.Handled
```

### 3. 边界情况考虑

```go
// 如果需要在某些场景禁用ESC退出
func (m *Model) checkCanQuit() bool {
    // 例如：有未保存的更改
    if m.hasUnsavedChanges() {
        return false
    }
    return true
}

func (m *Model) handleGlobalNavigation(msg tea.KeyMsg) (...) {
    case tea.KeyEsc:
        m.clearFocus()
        // 检查是否允许ESC操作
        if m.checkCanQuit() {
            if action, ok := m.Config.Bindings["esc"]; ok {
                return m.executeBoundAction(&action, "esc")
            }
        }
}
```

## 相关文档

- [ESC_QUIT_KEY_FIX.md](./ESC_QUIT_KEY_FIX.md) - ESC键与全局快捷键冲突问题修复
- [FOCUS_STATE_AND_TAB_NAVIGATION_FIX.md](./FOCUS_STATE_AND_TAB_NAVIGATION_FIX.md) - 组件焦点状态与Tab导航修复
- [AGENTS.md](../../AGENTS.md) - Yao开发指南

## 修改的文件

1. `tui/model.go:426-441` - 添加ESC全局绑定检查逻辑
