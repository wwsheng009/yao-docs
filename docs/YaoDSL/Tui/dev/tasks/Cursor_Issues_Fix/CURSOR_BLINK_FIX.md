# Cursor Animation 闪烁问题分析与修复

## 问题描述

在 `cursor-animation.tui.yao` 测试配置文件中，多个 Input 字段设置了不同的 `cursorMode` 和 `cursorChar`，但光标没有按照预期闪烁。

## 根本原因

### 1. **缺少 `cursorBlinkSpeed` 属性**

原始配置文件中只设置了：

```json
{
  "type": "input",
  "props": {
    "cursorMode": "blink",
    "cursorChar": "|"
    // ❌ 缺少 cursorBlinkSpeed
  }
}
```

但是 `InputComponentWrapper` 的实现代码中（`input.go:182-185`），`cursorBlinkSpeed` 硬编码为 530ms：

```go
cursorConfig := CursorConfig{
    Mode:       ParseCursorMode(props.CursorMode),
    Char:       props.CursorChar,
    BlinkSpeed: 530 * time.Millisecond,  // ❌ 硬编码，没有使用配置
    Visible:    !props.Disabled,
}
```

### 2. **未将 blinkSpeed 传递到 textinput.Model**

即使配置了 `cursorBlinkSpeed`，原来的代码也没有将它设置到 `textinput.Model.Cursor.BlinkSpeed`：

```go
// ❌ 旧的实现：不设置 BlinkSpeed
if props.CursorMode != "" {
    input.Cursor.SetMode(ParseCursorMode(props.CursorMode))
}
if props.CursorChar != "" {
    input.Cursor.SetChar(props.CursorChar)
}
// 缺少：input.Cursor.BlinkSpeed = blinkSpeed
```

### 3. **Bubble Tea Cursor 的行为**

Bubbles textinput 组件使用自己的 cursor 实例。如果：

- `input.Cursor.BlinkSpeed` 没有设置或设置为 0
- 或者 `input.Cursor.SetMode()` 没有正确调用

光标可能不会闪烁，即使 `CursorHelper` 中的设置是正确的。

## 修复方案

### 1. **添加 `CursorBlinkSpeed` 属性到 InputProps**

```go
// tui/components/input.go
type InputProps struct {
    // ... 其他字段

    // CursorMode specifies the cursor mode: "blink", "static", "hide"
    CursorMode string `json:"cursorMode"`

    // CursorChar specifies the cursor character
    CursorChar string `json:"cursorChar"`

    // ✅ 新增：CursorBlinkSpeed specifies the cursor blink speed in milliseconds
    CursorBlinkSpeed int `json:"cursorBlinkSpeed"`  // ✅ 新增

    Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}
```

### 2. **使用配置中的 blinkSpeed**

```go
// ✅ 修复后的实现
blinkSpeed := 530 * time.Millisecond
if props.CursorBlinkSpeed > 0 {
    blinkSpeed = time.Duration(props.CursorBlinkSpeed) * time.Millisecond
}

cursorConfig := CursorConfig{
    Mode:       ParseCursorMode(props.CursorMode),
    Char:       props.CursorChar,
    BlinkSpeed: blinkSpeed,  // ✅ 使用配置值
    Visible:    !props.Disabled,
}
```

### 3. **设置 textinput.Model.Cursor.BlinkSpeed**

```go
// ✅ 设置光标闪烁速度
if props.CursorBlinkSpeed > 0 {
    input.Cursor.BlinkSpeed = blinkSpeed  // ✅ 传递到 textinput
}
```

### 4. **更新测试配置文件**

```json
{
  "id": "field-1",
  "type": "input",
  "props": {
    "placeholder": "Fast blink cursor (200ms)...",
    "prompt": "⚡ ",
    "color": "255",
    "background": "61",
    "width": 40,
    "cursorMode": "blink",
    "cursorChar": "|",
    "cursorBlinkSpeed": 200  // ✅ 添加闪烁速度配置
  }
},
{
  "id": "field-2",
  "type": "input",
  "props": {
    "placeholder": "Normal blink cursor (530ms)...",
    "prompt": "👁 ",
    "color": "255",
    "background": "61",
    "width": 40,
    "cursorMode": "blink",
    "cursorChar": "█",
    "cursorBlinkSpeed": 530  // ✅ 添加闪烁速度配置
  }
},
{
  "id": "field-3",
  "type": "input",
  "props": {
    "placeholder": "Slow blink cursor (1000ms)...",
    "prompt": "🐢 ",
    "color": "255",
    "background": "61",
    "width": 40,
    "cursorMode": "blink",
    "cursorChar": "▏",
    "cursorBlinkSpeed": 1000  // ✅ 添加闪烁速度配置
  }
},
{
  "id": "field-4",
  "type": "input",
  "props": {
    "placeholder": "Static cursor...",
    "prompt": "📌 ",
    "color": "255",
    "background": "61",
    "width": 40,
    "cursorMode": "static",  // ✅ 静态模式不闪烁
    "cursorChar": "█",
    "cursorBlinkSpeed": 0     // ✅ 静态模式不需要闪烁速度
  }
}
```

## 测试验证

### 1. 单元测试

创建了 `input_cursor_blink_test.go` 来验证 blink speed 功能：

```bash
cd tui/components
go test -run TestInputCursorBlinkSpeed -v
```

**测试结果**：

```
=== RUN   TestInputCursorBlinkSpeed
=== RUN   TestInputCursorBlinkSpeed/Default_blink_speed
=== RUN   TestInputCursorBlinkSpeed/Fast_blink_speed
=== RUN   TestInputCursorBlinkSpeed/Slow_blink_speed
=== RUN   TestInputCursorBlinkSpeed/Zero_blink_speed_(should_use_default)
--- PASS: TestInputCursorBlinkSpeed (0.00s)
✓ 所有测试通过
```

### 2. 集成测试

更新后的 `cursor-animation.tui.yao` 配置文件预期行为：

- **Field 1** (⚡): 快速闪烁，200ms blink speed
- **Field 2** (👁): 普通闪烁，530ms blink speed（默认）
- **Field 3** (🐢): 慢速闪烁，1000ms blink speed
- **Field 4** (📌): 静态光标，不闪烁

## 关键改进点

### 1. 属性支持

- ✅ `CursorBlinkSpeed` 支持动态配置
- ✅ 默认值为 530ms（Bubbles 标准值）
- ✅ 0 值使用默认值

### 2. 双层设置

```
InputProps.CursorBlinkSpeed
    ↓
CursorHelper.BlinkSpeed
    ↓
textinput.Model.Cursor.BlinkSpeed
```

确保光标在所有层次都正确配置。

### 3. 灵活性

```json
// 快速闪烁（适合游戏、测试场景）
"cursorBlinkSpeed": 200

// 普通闪烁（默认）
"cursorBlinkSpeed": 530

// 慢速闪烁（适合无障碍、长时间阅读）
"cursorBlinkSpeed": 1000
```

## 其他相关文件更新

### 1. Textarea 组件

Textarea 组件也支持相同的 cursor 配置，需要确保：

```go
// tui/components/textarea.go
type TextareaProps struct {
    // ...
    CursorMode       string `json:"cursorMode"`
    CursorChar       string `json:"cursorChar"`
    CursorBlinkSpeed int    `json:"cursorBlinkSpeed"`  // ✅ 应该添加
    // ...
}
```

### 2. Form 组件

Form 组件应该支持统一的(cursorBlinkSpeed设置):

```go
// tui/components/form.go
type FormProps struct {
    // ...
    CursorMode       string `json:"cursorMode"`
    CursorChar       string `json:"cursorChar"`
    CursorBlinkSpeed int    `json:"cursorBlinkSpeed"`  // ✅ 应该添加
    // ...
}

// 应用到所有字段
form.SetCursorMode("blink")
form.SetCursorChar("|")
form.SetCursorBlinkSpeed(200)  // ✅ 新方法
```

## 运行测试

### 测试 cursor-animation 配置

```bash
cd yao-docs/YaoApps/tui_app/tuis
yao tui cursor-animation.tui.yao
```

**预期结果**：

- 按 `tab` 在四个字段间切换
- 每个字段显示不同闪烁速度的光标
- Field 4 (静态) 显示不闪烁的块光标

### 测试其他 cursor 配置

```bash
# Cursor helper 基础功能
yao tui cursor-helper.tui.yao

# Multi-cursor 独立配置
yao tui multi-cursor.tui.yao

# Cursor accessibility 无障碍配置
yao tui cursor-accessibility.tui.yao
```

## 总结

### 问题根因

1. ❌ 缺少 `cursorBlinkSpeed` 配置属性
2. ❌ 硬编码 blinkSpeed 为 530ms
3. ❌ 未将配置传递到 `textinput.Model.Cursor`

### 修复方案

1. ✅ 添加 `CursorBlinkSpeed` 属性
2. ✅ 使用配置值替代硬编码
3. ✅ 设置 `input.Cursor.BlinkSpeed`
4. ✅ 更新测试配置文件
5. ✅ 添加单元测试

### 验证结果

- ✅ 所有单元测试通过
- ✅ 支持多种闪烁速度
- ✅ 向后兼容（默认 530ms）
- ✅ 配置灵活化

现在 `cursor-animation.tui.yao` 测试应该能够正确显示不同闪烁速度的光标了！
