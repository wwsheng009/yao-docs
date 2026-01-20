# Cursor Component Test Configurations

这个目录包含用于测试 Yao TUI 项目中优化后的 cursor 组件的配置文件。

## 测试配置文件列表

### 1. cursor-helper.tui.yao

**功能**: 测试 CursorHelper 工具类的基本功能

**测试内容**:

- Input 组件集成 CursorHelper
- 动态切换 cursor 闪烁模式 (blink/static/hide)
- 动态更改 cursor 字符 (|/█/▏)
- 实时显示 cursor 设置
- 多个输入组件和 textarea 组件

**快捷键**:

- `c` - 切换 cursor 模式
- `s` - 循环 cursor 字符
- `tab` - 切换焦点
- `q` - 退出

### 2. form-cursor.tui.yao

**功能**: 测试 Form 组件的统一 cursor 管理

**测试内容**:

- Form 组件统一管理所有输入字段的 cursor 设置
- 多个 form 实例的 cursor 控制
- 动态更新所有字段的 cursor 模式和字符
- Form 注册和管理输入字段
- 个人信息和联系信息的表单

**快捷键**:

- `m` - 切换 cursor 模式
- `c` - 循环 cursor 字符
- `f1` - 焦点到第一个 form
- `f2` - 焦点到第二个 form
- `tab` - 切换焦点
- `q` - 退出

### 3. cursor-animation.tui.yao

**功能**: 测试 cursor 闪烁速度和动画

**测试内容**:

- 不同闪烁速度的 cursor (200ms/530ms/1000ms)
- Static cursor 对比
- 动态调整闪烁速度
- 不同 cursor 字符的视觉效果
- 快速/普通/慢速/静态 四种速度

**快捷键**:

- `s` - 循环闪烁速度
- `c` - 循环 cursor 字符
- `m` - 切换 cursor 模式
- `v` - 切换可见性
- `tab` - 切换字段
- `q` - 退出

### 4. multi-cursor.tui.yao

**功能**: 测试多个字段使用不同 cursor 设置

**测试内容**:

- 6 个独立的输入字段，每个有不同的 cursor 设置
- 不同背景色区分字段
- Blink + pipe
- Blink + block
- Static + underline
- Static + block
- Textarea 也要支持 cursor
- 实时显示每个字段的 cursor 状态

**快捷键**:

- `tab` - 循环切换字段
- `shift+tab` - 反向切换
- `q` - 退出

### 5. cursor-accessibility.tui.yao

**功能**: 测试 cursor 的无障碍功能

**测试内容**:

- 4 种无障碍配置预设
- Standard Mode: 普通闪烁, | 字符
- High Visibility Mode: 慢速闪烁, █ 块字符
- Static Mode: 无闪烁, █ 块字符
- Minimal Mode: 慢闪烁, 薄线字符
- 动态切换无障碍配置

**快捷键**:

- `1` - 标准模式
- `2` - 高可见度模式
- `3` - 静态模式
- `4` - 精简模式
- `tab` - 切换字段
- `q` - 退出

## 测试覆盖范围

### CursorHelper 功能测试

- ✅ 创建 CursorHelper 实例
- ✅ 设置和获取 cursor 模式
- ✅ 设置和获取 cursor 字符
- ✅ 控制可见性
- ✅ 闪烁速度控制

### Input 组件集成测试

- ✅ Input 组件集成 CursorHelper
- ✅ CursorMode 属性 (blink/static/hide)
- ✅ CursorChar 属性 (自定义字符)
- ✅ 动态更新 cursor 设置
- ✅ SetCursorMode() 方法
- ✅ SetCursorChar() 方法
- ✅ 获取 CursorHelper 实例

### Textarea 组件集成测试

- ✅ Textarea 组件支持 cursor 配置
- ✅ 与 Input 组件相同的 cursor 功能

### Form 组件统一管理测试

- ✅ Form 统一管理所有字段
- ✅ SetCursorMode() 应用到所有字段
- ✅ SetCursorChar() 应用到所有字段
- ✅ RegisterInputField() 注册字段
- ✅ GetInputField() 获取字段

### 多字段独立测试

- ✅ 多个字段使用不同 cursor 设置
- ✅ 字段间独立管理
- ✅ 互不冲突

### 无障碍功能测试

- ✅ 标准模式配置
- ✅ 高可见度模式配置
- ✅ 静态模式配置
- ✅ 精简模式配置
- ✅ 配置动态切换

## 运行测试

### 运行单个测试

```bash
# Cursor Helper 测试
yao tui cursor-helper.tui.yao

# Form Cursor 测试
yao tui form-cursor.tui.yao

# Cursor Animation 测试
yao tui cursor-animation.tui.yao

# Multi Cursor 测试
yao tui multi-cursor.tui.yao

# Cursor Accessibility 测试
yao tui cursor-accessibility.tui.yao
```

### 运行所有测试

```bash
# 从 tuis 目录运行所有 cursor 相关测试
cd yao-docs/YaoApps/tui_app/tuis
yao tui cursor-helper.tui.yao
yao tui form-cursor.tui.yao
yao tui cursor-animation.tui.yao
yao tui multi-cursor.tui.yao
yao tui cursor-accessibility.tui.yao
```

## 测试预期结果

### cursor-helper.tui.yao

- 所有输入组件应该能正常显示光标
- 按 `c` 键应该循环切换 cursor 模式
- 按 `s` 键应该循环切换 cursor 字符
- 所有字段应该同步更新 cursor 设置

### form-cursor.tui.yao

- 两个 form 的所有字段应该有统一的 cursor 设置
- 按 `m` 键应该更新所有字段的 cursor 模式
- 按 `c` 键应该更新所有字段的 cursor 字符
- `f1` 和 `f2` 可以在不同 form 间切换焦点

### cursor-animation.tui.yao

- 四个字段应该有不同的闪烁速度
- Field 1: 快速 (200ms)
- Field 2: 普通 (530ms)
- Field 3: 慢速 (1000ms)
- Field 4: 静态 (不闪烁)

### multi-cursor.tui.yao

- 六个字段应该显示不同的 cursor 设置
- 每个 field 保持独立的 cursor 配置
- tab 切换时应该能看到不同的 cursor 样式

### cursor-accessibility.tui.yao

- 按 `1` 切换到标准模式: |, 普通闪烁
- 按 `2` 切换到高可见度: █, 慢速闪烁
- 按 `3` 切换到静态模式: █, 不闪烁
- 按 `4` 切换到精简模式: ▏, 慢速闪烁

## 配置文件结构

所有测试配置文件遵循 Yao TUI 的 JSON 配置格式:

```json
{
  "name": "测试名称",
  "data": {
    // 应用数据
  },
  "layout": {
    "direction": "vertical",
    "children": [
      // 组件列表
      {
        "type": "input",
        "props": {
          "cursorMode": "blink", // cursor 模式
          "cursorChar": "|" // cursor 字符
        }
      }
    ]
  },
  "bindings": {
    // 键盘绑定
  }
}
```

## 相关文档

- [CURSOR_OPTIMIZATION.md](../../../CURSOR_OPTIMIZATION.md) - Cursor 优化详细文档
- [cursor.go](../../../tui/components/cursor.go) - Cursor 组件实现
- [input.go](../../../tui/components/input.go) - Input 组件实现
- [form.go](../../../tui/components/form.go) - Form 组件实现

## 问题反馈

如果测试中发现问题，请记录:

1. 测试文件名称
2. 具体测试步骤
3. 预期结果
4. 实际结果
5. 错误信息或异常行为

## 已知问题和修复

### Cursor 闪烁问题 (2025-01-19 修复)

**问题描述**: `cursor-animation.tui.yao` 测试中光标不闪烁

**根本原因**:

1. 缺少 `cursorBlinkSpeed` 配置属性
2. BlinkSpeed 硬编码为 530ms，无法动态配置
3. 未将 blinkSpeed 传递到 `textinput.Model Cursor`

**修复方案**:

1. 在 `InputProps` 中添加 `CursorBlinkSpeed` 属性
2. 支持动态配置闪烁速度（200ms/530ms/1000ms）
3. 将配置值传递到 `InputComponentWrapper.cursorHelper` 和 `input.Cursor.BlinkSpeed`
4. 更新所有测试配置文件

**修复细节**: 参见 [../../CURSOR_BLINK_FIX.md](../../CURSOR_BLINK_FIX.md)

**验证**:

```bash
cd tui/components
go test -run TestInputCursorBlinkSpeed -v

# 运行测试验证
cd yao-docs/YaoApps/tui_app/tuis
yao tui cursor-animation.tui.yao
```

## 更新历史

- 2025-01-19: 创建测试配置文件
  - cursor-helper.tui.yao
  - form-cursor.tui.yao
  - cursor-animation.tui.yao
  - multi-cursor.tui.yao
  - cursor-accessibility.tui.yao
