# Yao TUI 双向尺寸协商机制实现总结

## 📋 概述

Yao TUI 框架已成功实现双向尺寸协商机制，解决了原有静态预测布局的问题，提供更智能、更准确的自适应布局能力。

## ✅ 已实现功能

### 1. Measurable 接口

- 在 `tui/core/types.go` 中定义了 `Measurable` 接口
- 允许组件向布局引擎报告其理想尺寸
- 支持组件与布局引擎的智能交互

```go
type Measurable interface {
    // 根据父容器提供的最大约束，返回组件理想的大小
    Measure(maxWidth, maxHeight int) (width, height int)
}
```

### 2. 组件实现

- **Table 组件**: 实现了 `Measure` 方法，根据列宽和行数计算理想尺寸
- **Viewport 组件**: 实现了 `Measure` 方法，根据内容计算理想尺寸
- **Text 组件**: 实现了垂直/水平对齐选项

### 3. 智能测量函数

- **measureChildWidth**: 使用 `runewidth.StringWidth()` 和 `ansi.Strip()` 正确处理中文字符和 ANSI 转义符
- **measureChildHeight**: 改进文本换行计算逻辑

### 4. 两阶段布局计算

- **约束传递阶段**: 父节点向子节点传递可用空间约束
- **响应计算阶段**: 子节点根据约束返回理想尺寸
- **最终调整**: 根据响应调整实际布局

### 5. Flex 布局增强

- **Shrink 属性**: 实现了 `flex-shrink` 功能，空间不足时按比例收缩
- **ExpandMode**: 修复了背景色填充问题，确保视觉一致性
- **Grow/Stretch**: 完善了弹性增长和拉伸对齐逻辑

### 6. SetSize 通知机制

- 在布局计算完成后，主动调用组件的 `SetSize` 方法
- 通知组件其实际分配的尺寸
- 组件可根据新尺寸更新内部状态

## 📊 技术细节

### 依赖库

- `github.com/mattn/go-runewidth`: 正确计算中文等宽字符宽度
- `github.com/charmbracelet/x/ansi`: 处理 ANSI 转义符

### 关键文件

- `tui/core/types.go`: Measurable 接口定义
- `tui/layout/engine.go`: 布局引擎核心逻辑
- `tui/components/table.go`: Table 组件实现
- `tui/components/viewport.go`: Viewport 组件实现
- `tui/render_engine.go`: 渲染引擎

## 🧪 测试覆盖

- Measurable 接口测试
- 中文/ANSI 处理测试
- Flex 布局测试
- Shrink/Grow 功能测试

## 📐 布局属性

### Flex 布局属性

- `direction`: `row` | `column`
- `alignItems`: `start` | `center` | `end` | `stretch`
- `justifyContent`: `start` | `center` | `end` | `space-around`
- `grow`: 弹性增长系数
- `shrink`: 弹性收缩系数
- `padding`: 内边距

### 组件属性

- `verticalAlign`: `top` | `center` | `bottom`
- `horizontalAlign`: `left` | `center` | `right`

## 🌐 国际化支持

- **中文字符**: 使用 `runewidth.StringWidth()` 正确计算视觉宽度
- **ANSI 转义符**: 使用 `ansi.Strip()` 剥离格式符后计算尺寸
- **多语言**: 支持各种 Unicode 字符集

## 🚀 使用优势

1. **更精确的布局**: 组件主动报告理想尺寸，避免静态预测误差
2. **更好的自适应**: 根据内容动态调整布局
3. **国际化友好**: 正确处理多语言字符
4. **性能优化**: 减少不必要的重绘和计算
5. **向前兼容**: 未实现 Measurable 的组件保持原有行为

## 📚 示例应用

参见 `examples/tui/adaptive-layout/` 目录下的示例应用，展示了双向尺寸协商机制的完整功能。

## 🧩 架构图

```
┌─────────────────┐
│   组件实现      │
│  (Measurable)   │
└─────────┬───────┘
          │ Measure(maxW, maxH)
          ▼
┌─────────────────┐
│  布局引擎       │
│  (双向协商)     │
└─────────┬───────┘
          │ 提供约束
          ▼
┌─────────────────┐
│   渲染输出      │
│  (ExpandMode)   │
└─────────────────┘
```

## 📄 许可证

MIT License
