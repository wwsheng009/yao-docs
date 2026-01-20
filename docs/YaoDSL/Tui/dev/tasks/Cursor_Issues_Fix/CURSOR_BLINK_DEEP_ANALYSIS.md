# Cursor 闪烁问题分析报告

## 🔍 根本原因分析

根据 `github.com/charmbracelet/bubbles/cursor` 源代码，光标自动闪烁需要满足以下条件：

### 1. 核心机制（源代码验证）

```go
// cursor/Model.go: Focus() 方法
func (m *Model) Focus() tea.Cmd {
    m.focus = true
    m.Blink = m.mode == CursorHide

    // ✅ 关键：只有在 Blink 模式且有焦点时才启动闪烁
    if m.mode == CursorBlink && m.focus {
        return m.BlinkCmd()  // ← 这里是关键！返回启动闪烁的命令
    }
    return nil
}

// cursor/Model.go: BlinkCmd() 方法
func (m *Model) BlinkCmd() tea.Cmd {
    if m.mode != CursorBlink {
        return nil
    }

    // 取消旧的定时器
    if m.blinkCtx != nil && m.blinkCtx.cancel != nil {
        m.blinkCtx.cancel()
    }

    // 创建新的定时器
    ctx, cancel := context.WithTimeout(m.blinkCtx.ctx, m.BlinkSpeed)
    m.blinkCtx.cancel = cancel

    m.blinkTag++  // 递增 tag 用于消息过滤

    //✅ 返回一个异步命令，定时发送 BlinkMsg
    return func() tea.Msg {
        defer cancel()
        <-ctx.Done()  // 阻塞直到超时
        if ctx.Err() == context.DeadlineExceeded {
            return BlinkMsg{id: m.id, tag: m.blinkTag}
        }
        return blinkCanceled{}
    }
}
```

### 2. 闪烁循环机制

```
Focus() → 返回 BlinkCmd()
          ↓
等待 BlinkSpeed 毫秒
          ↓
发送 BlinkMsg
          ↓
Update() 收到 BlinkMsg
   ↓ m.Blink = !m.Blink (翻转状态)
   ↓ 再次调用 BlinkCmd() ← 形成循环
          ↓
回到第2步 ...
```

## ❌ Yao TUI 中的问题

### 问题 1: SetFocus() 未返回 Cmd

**当前实现** (`input.go:239-247`):

```go
func (w *InputComponentWrapper) SetFocus(focus bool) {
    if focus {
        w.model.Focus()      // ❌ 调用 textinput.Focus() 但没有使用返回的 cmd
        w.cursorHelper.SetVisible(true)
    } else {
        w.model.Blur()
        w.cursorHelper.SetVisible(false)
    }
}
```

**问题**: `textinput.Focus()` 返回了一个 `tea.Cmd`（包含启动 cursor 闪烁的命令），但被忽略了！

### 问题 2: Init() 未返回 blink 初始化命令

**当前实现** (`input.go:268-270`):

```go
func (w *InputComponentWrapper) Init() tea.Cmd {
    return nil  // ❌ 没有返回 cursor.Blink() 初始化命令
}
```

**问题**: 根据示例代码，应该在 Init 中返回 `textinput.Blink` 来初始化光标闪烁。

### 问题 3: 重复使用 cursor.Model

**当前设计**:

```go
type InputComponentWrapper struct {
    model        textinput.Model  // 包含自己的 cursor
    cursorHelper *CursorHelper    // 又包含另一个 cursor.Model
}
```

**问题**: 创建了两个 cursor 实例！

- `textinput.Model` 内部有一个 `cursor.Model`
- `CursorHelper` 内部又有一个 `cursor.Model`

这导致了：

1. 光标实际由 `textinput.Model.Cursor` 控制
2. `CursorHelper` 管理的是一个独立的 cursor，不会影响实际的闪烁
3. 设置速度到 `CursorHelper` 不会影响 `textinput.Model`

## ✅ 修复方案

### 方案 A: 使用 SetFocusBatch 替代 SetFocus（推荐）

```go
// 已经存在但没被使用的方法
func (w *InputComponentWrapper) SetFocusBatch(focus bool) tea.Cmd {
    var cmds []tea.Cmd

    if focus {
        cmd := w.model.Focus()  // ✅ 获取返回的 cmd
        w.cursorHelper.SetVisible(true)

        if cmd != nil {
            cmds = append(cmds, cmd)  // ✅ 添加到命令列表
        }
    } else {
        w.model.Blur()
        w.cursorHelper.SetVisible(false)
    }

    if focus && w.cursorHelper.GetMode() != 0x00 {
        cmds = append(cmds, w.cursorHelper.GetModel().BlinkCmd())
    }

    return tea.Batch(cmds...)
}
```

### 方案 B: 修复 SetFocus 返回 Cmd

```go
func (w *InputComponentWrapper) SetFocusCmd(focus bool) tea.Cmd {
    if focus {
        return w.model.Focus()  // ✅ 直接返回 textinput.Focus() 的命令
    }
    w.model.Blur()
    w.cursorHelper.SetVisible(false)
    return nil
}
```

### 方案 C: 修复 Init 方法

```go
func (w *InputComponentWrapper) Init() tea.Cmd {
    // ✅ 返回 textinput.Blink 初始化命令
    // 但这需要 textinput 包导出 Blink 函数
    // 实际上 textinput 内部会自动处理，所以可以不需要
    return nil
}
```

### 方案 D: 优化设计，移除 CursorHelper

由于 `textinput.Model` 已经包含了完整的 cursor 功能，`CursorHelper` 是多余的：

```go
type InputComponentWrapper struct {
    model textinput.Model  // textinput.Cursor 已经是 cursor.Model
    props InputProps
    id    string
    // 移除 cursorHelper
}

func (w *InputComponentWrapper) SetCursorMode(mode string) {
    mode := ParseCursorMode(mode)
    w.model.Cursor.SetMode(mode)  // ✅ 直接操作 textinput 内部的 cursor
}

func (w *InputComponentWrapper) SetCursorChar(char string) {
    w.model.Cursor.SetChar(char)  // ✅ 直接操作 textinput 内部的 cursor
}

func (w *InputComponentWrapper) SetCursorBlinkSpeed(speed int) {
    w.model.Cursor.BlinkSpeed = time.Duration(speed) * time.Millisecond
}
```

## 🎯 推荐修复步骤

### 步骤 1: 修改 SetFocus 使用 SetFocusBatch

```go
// 在需要设置焦点的地方，使用 SetFocusBatch
func someMethod() tea.Cmd {
    // ❌ 旧方式
    // input.SetFocus(true)

    // ✅ 新方式
    return input.SetFocusBatch(true)
}
```

### 步骤 2: 确保 BlinkSpeed 正确设置

```go
func NewInputComponentWrapper(props InputProps, id string) *InputComponentWrapper {
    input := textinput.New()
    applyTextInputConfig(&input, props)

    // 设置 BlinkSpeed
    if props.CursorBlinkSpeed > 0 {
        input.Cursor.BlinkSpeed = time.Duration(props.CursorBlinkSpeed) * time.Millisecond  // ✅ 直接设置
    }

    // 不再需要 CursorHelper，因为 textinput 自己管理 cursor
    return &InputComponentWrapper{
        model: input,
        props: props,
        id:    id,
    }
}
```

### 步骤 3: 简化 CursorHelper 的作用

`CursorHelper` 应该只用于作为工具类，不嵌入到 Input 中：

```go
// CursorHelper 只用于独立的 cursor 组件或作为工具方法
type CursorHelper struct {
    // ... 保持不变
}

// 但 InputComponentWrapper 不再包含它
type InputComponentWrapper struct {
    model textinput.Model  // 使用 textinput 内部的 cursor
    props InputProps
    id    string
    // 不再需要 cursorHelper
}
```

## 🧪 验证修复

### 测试 1: 光标应该闪烁

```go
func TestCursorBlink(t *testing.T) {
    // 创建 input
    wrapper := NewInputComponentWrapper(InputProps{
        CursorMode:       "blink",
        CursorChar:       "|",
        CursorBlinkSpeed: 200,
    }, "test")

    // 获得焦点（必须返回并执行 cmd）
    cmd := wrapper.SetFocusBatch(true)

    // 模拟 Bubble Tea 消息循环
    if cmd != nil {
        msg := cmd()  // 执行命令，应该启动 blink 内部定时器
        // msg 应该是 BlinkMsg 或 nil
    }

    // 验证 cursor 模式和速度
    assert.Equal(t, cursor.CursorBlink, wrapper.model.Cursor.Mode())
    assert.Equal(t, 200*time.Millisecond, wrapper.model.Cursor.BlinkSpeed)
}
```

### 测试 2: 多个 field 不同速度

```go
field1 := NewInputComponentWrapper(InputProps{
    CursorBlinkSpeed: 200,
}, "f1")
field1.SetFocusBatch(true)

field2 := NewInputComponentWrapper(InputProps{
    CursorBlinkSpeed: 1000,
}, "f2")

// 两个 field 应该有不同的 Cursor.BlinkSpeed
assert.Equal(t, 200*time.Millisecond, field1.model.Cursor.BlinkSpeed)
assert.Equal(t, 1000*time.Millisecond, field2.model.Cursor.BlinkSpeed)
```

## 📝 总结

### 根本原因

1. ❌ `SetFocus()` 没有返回 `tea.Cmd`，忽略了 `textinput.Focus()` 返回的 blink 命令
2. ❌ `Init()` 没有返回初始化命令
3. ❌ 创建了重复的 cursor 实例（textinput 内部 + CursorHelper）

### 修复关键

1. ✅ 使用 `SetFocusBatch()` 返回并执行 `textinput.Focus()` 的命令
2. ✅ 直接操作 `textinput.Model.Cursor` 设置参数
3. ✅ 移除 `CursorHelper` 的嵌入，避免重复管理

### 消息机制说明

Yao TUI 的消息机制本身没有缺陷，问题在于：

1. **没有正确返回和执行命令** - `SetFocus()` 忽略了 `textinput.Focus()` 的返回值
2. **命令没有被传递到上层** - Bubble Tea 需要返回命令到顶层才能执行

正确的消息流应该是：

```
用户按键
  ↓
InputComponentWrapper.Update(msg)
  ↓
调用 textinput.Update(msg)
  ↓
返回 (newModel, tea.Cmd)
  ↓
Cmd 被传递到 Bubble Tea 的消息循环
  ↓
Cmd 执行后发送 BlinkMsg
  ↓
textinput 收到 BlinkMsg，翻转 cursor 状态
  ↓
再次发送新的 BlinkCmd → 循环继续
```

现在的问题是：`SetFocus()` 的命令没有传递出去，因此 BlinkCmd 永远不会被执行！
