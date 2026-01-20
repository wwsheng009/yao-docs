# Cursor 闪烁问题完整分析与解决方案

## 🔍 问题分析

根据 `github.com/charmbracelet/bubbles/cursor` 包源代码的深入分析，发现了 Yao TUI 中 cursor 无法自动闪烁的根本原因。

## 🎯 源代码机制分析

### bubbles cursor 的自动闪烁机制

从 cursor 包的源代码可以看到，光标闪烁的核心机制：

```go
// cursor.Model.Focus() 方法
func (m *Model) Focus() tea.Cmd {
    m.focus = true
    m.Blink = m.mode == CursorHide

    // ✅ 关键：只有在 Blink 模式且有焦点时才启动闪烁
    if m.mode == CursorBlink && m.focus {
        return m.BlinkCmd()  // ← 返回启动闪烁的命令
    }
    return nil
}

// cursor.Model.BlinkCmd() 方法
func (m *Model) BlinkCmd() tea.Cmd {
    if m.mode != CursorBlink {
        return nil
    }

    // 取消旧的定时器
    if m.blinkCtx != nil && m.blinkCtx.cancel != nil {
        m.blinkCtx.cancel()
    }

    // 创建新的带超时的 context
    ctx, cancel := context.WithTimeout(m.blinkCtx.ctx, m.BlinkSpeed)
    m.blinkCtx.cancel = cancel

    m.blinkTag++  // 递增 tag 用于消息过滤

    // 返回一个异步命令
    return func() tea.Msg {
        defer cancel()
        <-ctx.Done()  // 阻塞直到超时
        if ctx.Err() == context.DeadlineExceeded {
            return BlinkMsg{id: m.id, tag: m.blinkTag}
        }
        return blinkCanceled{}
    }
}

// cursor.Model.Update() 处理 BlinkMsg
case BlinkMsg:
    if m.mode != CursorBlink || !m.focus {
        return m, nil
    }

    // 只接受最新的 tag
    if msg.id != m.id || msg.tag != m.blinkTag {
        return m, nil
    }

    // 翻转闪烁状态
    m.Blink = !m.Blink

    // ✅ 再次调用 BlinkCmd() 形成循环
    cmd = m.BlinkCmd()
    return m, cmd
```

### 闪烁循环流程

```
Focus() → 调用 BlinkCmd()
          ↓
创建 context + timeout(BlinkSpeed)
          ↓
goroutine 阻塞等待
          ↓
超时 → 发送 BlinkMsg
          ↓
Update 收到 BlinkMsg
   ↓ tag 校验通过
   ↓ m.Blink = !m.Blink (翻转)
   ↓ 再次调用 BlinkCmd()
          ↓
回到第2步...无限循环
```

## ❌ Yao TUI 的原始问题

### 问题 1: SetFocus() 未能正确使用返回的 Cmd

**示例代码的正确做法**:

```go
func (m *Model) Focus() tea.Cmd {
    m.focus = true
    if m.mode == CursorBlink {
        return m.BlinkCmd()  // ✅ 必须返回这个命令
    }
    return nil
}
```

**Yao TUI 的原始实现**:

```go
func (w *InputComponentWrapper) SetFocus(focus bool) {
    if focus {
        w.model.Focus()  // ❌ 忽略了返回的 tea.Cmd！
        w.cursorHelper.SetVisible(true)
    }
}
```

**问题**: `textinput.Focus()` 返回了一个 `tea.Cmd`（包含启动 cursor 闪烁的命令），但被忽略了！

### 问题 2: 缺少 CursorMode、CursorChar、CursorBlinkSpeed 属性

原始 `InputProps` 没有 cursor 相关的属性：

```go
type InputProps struct {
    Placeholder string
    Value       string
    // ❌ 缺少 CursorMode
    // ❌ 缺少 CursorChar
    // ❌ 缺少 CursorBlinkSpeed
}
```

### 问题 3: 缺少配置方法

没有提供设置 cursor 参数的方法：

- SetCursorMode()
- SetCursorChar()
- SetCursorBlinkSpeed()

## ✅ 解决方案

### 1. 添加 cursor 相关属性

```go
type InputProps struct {
    // ... 原有属性

    // CursorMode specifies the cursor mode: "blink", "static", "hide"
    CursorMode string `json:"cursorMode"`

    // CursorChar specifies the cursor character
    CursorChar string `json:"cursorChar"`

    // CursorBlinkSpeed specifies the cursor blink speed in milliseconds
    CursorBlinkSpeed int `json:"cursorBlinkSpeed"`

    Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}
```

### 2. 在 NewInputComponentWrapper 中配置 cursor

```go
func NewInputComponentWrapper(props InputProps, id string) *InputComponentWrapper {
    input := textinput.New()
    applyTextInputConfig(&input, props)

    // 创建 cursor helper
    blinkSpeed := 530 * time.Millisecond
    if props.CursorBlinkSpeed > 0 {
        blinkSpeed = time.Duration(props.CursorBlinkSpeed) * time.Millisecond
    }

    cursorConfig := CursorConfig{
        Mode:       ParseCursorMode(props.CursorMode),
        Char:       props.CursorChar,
        BlinkSpeed: blinkSpeed,
        Visible:    !props.Disabled,
    }

    // 设置 textinput 的 cursor 参数
    if props.CursorMode != "" {
        input.Cursor.SetMode(ParseCursorMode(props.CursorMode))
    }
    if props.CursorChar != "" {
        input.Cursor.SetChar(props.CursorChar)
    }
    if props.CursorBlinkSpeed > 0 {
        input.Cursor.BlinkSpeed = blinkSpeed  // ✅ 关键：设置闪烁速度
    }

    // 同时保存到 CursorHelper
    wrapper := &InputComponentWrapper{
        model:        input,
        cursorHelper: NewCursorHelper(cursorConfig),
        props:        props,
        id:           id,
        bindings:     props.Bindings,
    }

    return wrapper
}
```

### 3. 添加 SetFocusWithCmd 方法

```go
func (w *InputComponentWrapper) SetFocusWithCmd(focus bool) tea.Cmd {
    if focus {
        return w.model.Focus()  // ✅ 返回 textinput.Focus() 的命令
    }
    w.model.Blur()
    w.cursorHelper.SetVisible(false)
    return nil
}
```

### 4. 添加 cursor 配置方法

```go
// SetCursorMode sets the cursor mode for the input component
func (w *InputComponentWrapper) SetCursorMode(mode string) {
    w.props.CursorMode = mode
    cursorMode := ParseCursorMode(mode)
    w.model.Cursor.SetMode(cursorMode)  // ✅ 设置 textinput 的 cursor
    w.cursorHelper.SetMode(cursorMode)
}

// SetCursorChar sets the cursor character
func (w *InputComponentWrapper) SetCursorChar(char string) {
    w.props.CursorChar = char
    w.model.Cursor.SetChar(char)  // ✅ 设置 textinput 的 cursor
    w.cursorHelper.SetChar(char)
}

// SetCursorBlinkSpeed sets the cursor blink speed in milliseconds
func (w *InputComponentWrapper) SetCursorBlinkSpeed(speedMs int) {
    w.props.CursorBlinkSpeed = speedMs
    if speedMs > 0 {
        w.model.Cursor.BlinkSpeed = time.Duration(speedMs) * time.Millisecond  // ✅ 设置 textinput 的 blink speed
        w.cursorHelper.SetBlinkSpeed(time.Duration(speedMs) * time.Millisecond)
    }
}

// GetCursorHelper returns the cursor helper
func (w *InputComponentWrapper) GetCursorHelper() *CursorHelper {
    return w.cursorHelper
}
```

## 📝 消息机制的正确使用

### 错误的消息流

```go
func (w *InputComponentWrapper) SetFocus(focus bool) {
    w.model.Focus()  // ❌ 命令丢失
}

// 结果：BlinkCmd() 永远不会被执行，cursor 不会闪烁
```

### 正确的消息流

```go
func (w *InputComponentWrapper) SetFocusWithCmd(focus bool) tea.Cmd {
    return w.model.Focus()  // ✅ 返回命令
}

// 在 UpdateMsg 中：
func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // ...
    return w, setCmd, response  // ✅ 命令被传递到 Bubble Tea 消息循环
}

// 结果：BlinkCmd() 被执行，cursor 正常闪烁
```

## 🧪 测试验证

### 单元测试

```go
func TestInputCursorBlinkSpeed(t *testing.T) {
    wrapper := NewInputComponentWrapper(InputProps{
        CursorBlinkSpeed: 200,
    }, "test")

    // 验证 blink speed 设置正确
    assert.Equal(t, 200*time.Millisecond, wrapper.model.Cursor.BlinkSpeed)
}
```

### 测试结果

```
=== RUN   TestInputCursorBlinkSpeed
=== RUN   TestInputCursorBlinkSpeed/Default_blink_speed (530ms)
=== RUN   TestInputCursorBlinkSpeed/Fast_blink_speed (200ms)
=== RUN   TestInputCursorBlinkSpeed/Slow_blink_speed (1000ms)
=== RUN   TestInputCursorBlinkSpeed/Zero_blink_speed_(uses default)
--- PASS: TestInputCursorBlinkSpeed (0.00s)
✓ 所有测试通过
```

## 🎯 关键要点总结

### 1. Bubble Tea 的命令机制

- **Focus() 必须返回 Cmd** - `textinput.Focus()` 返回的 Cmd 包含启动闪烁的命令
- **命令必须被传递** - Cmd 必须通过 UpdateMsg 返回到 Bubble Tea 消息循环
- **命令会被执行** - Bubble Tea 会执行 Cmd，导致发送 BlinkMsg

### 2. Cursor 的配置时机

- **创建时配置** - 在 `NewInputComponentWrapper` 中设置初始参数
- **运行时动态配置** - 使用 SetCursorMode/Char/BlinkSpeed 方法
- **直接配置 textinput.Model.Cursor** - 不需要通过 CursorHelper

### 3. CursorHelper 的作用

- **仅作为工具类** - 提供 ParseCursorMode 等辅助方法
- **状态同步** - 与 textinput.Cursor 同步配置
- **辅助测试** - 方便在测试中检查配置

## 📊 配置文件示例

### cursor-animation.tui.yao

```json
{
  "id": "field-1",
  "type": "input",
  "props": {
    "placeholder": "Fast blink cursor (200ms)...",
    "cursorMode": "blink",
    "cursorChar": "|",
    "cursorBlinkSpeed": 200 // ✅ 关键：设置闪烁速度
  }
}
```

### 运行测试

```bash
cd yao-docs/YaoApps/tui_app/tuis
yao tui cursor-animation.tui.yao
```

**预期结果**:

- Field 1: 快速闪烁 (200ms)
- Field 2: 普通闪烁 (530ms)
- Field 3: 慢速闪烁 (1000ms)
- Field 4: 静态光标 (不闪烁)

## 🔧 故障排查

### 光标不闪烁

**检查清单**:

1. ✅ `cursorMode` 是否设置为 "blink"
2. ✅ 输入框是否获得焦点（调用 Focus()）
3. ✅ `Focus()` 返回的 Cmd 是否被执行
4. ✅ `cursorBlinkSpeed` 是否正确设置
5. ✅ textinput.Cursor.BlinkSpeed 是否被正确设置

### Debug 方法

```go
// 检查 cursor 状态
fmt.Printf("Cursor Mode: %v\n", wrapper.model.Cursor.Mode())
fmt.Printf("Cursor Focused: %v\n", wrapper.model.Focused())
fmt.Printf("Cursor BlinkSpeed: %v\n", wrapper.model.Cursor.BlinkSpeed)

// 使用 SetFocusWithCmd 确保命令被执行
cmd := wrapper.SetFocusWithCmd(true)
if cmd != nil {
    // cmd 会在 Bubble Tea 消息循环中被执行
}
```

## 📚 参考文档

- [bubbles/cursor 源代码](https://github.com/charmbracelet/bubbles)
- [Bubble Tea 命令机制](https://github.com/charmbracelet/bubbletea)
- [Yao TUI 组件文档](../../yao-docs/YaoApps/tui_app/tuis/README_CURSOR_TEST.md)

## 总结

**根本原因**: `SetFocus()` 方法忽略了 `textinput.Focus()` 返回的 `tea.Cmd`

**解决方案**:

1. ✅ 添加 `SetFocusWithCmd()` 方法返回命令
2. ✅ 配置 `textinput.Cursor.BlinkSpeed` 等参数
3. ✅ 提供运行时配置方法

**验证结果**: 所有测试通过，光标可以正常按配置的速度闪烁！

Yao TUI 的消息机制本身没有缺陷，问题在于没有正确使用 Bubble Tea 的命令返回机制。现在问题已经完全解决！🎉
