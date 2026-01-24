# 自适应布局示例

这个示例展示了 Yao TUI 框架的双向尺寸协商机制如何实现智能的自适应布局。

## 🚀 功能特点

- **双向尺寸协商**: 组件与布局引擎智能交互，协商最优尺寸
- **中文支持**: 正确处理中文字符宽度
- **ANSI 转义符**: 正确解析和渲染 ANSI 颜色代码
- **Flex 布局**: 弹性布局系统，支持 grow/shrink 属性
- **Stretch 对齐**: 支持垂直和水平拉伸对齐

## 🏗️ 技术架构

### Measurable 接口

组件可以通过实现 `Measurable` 接口向布局引擎报告其理想尺寸：

```go
type Measurable interface {
    // 根据父容器提供的最大约束，返回组件理想的大小
    Measure(maxWidth, maxHeight int) (width, height int)
}
```

### 两阶段布局计算

1. **约束传递阶段**: 父节点向子节点传递可用空间约束
2. **响应计算阶段**: 子节点根据约束返回理想尺寸，父节点据此计算最终布局

### 智能测量函数

- `measureChildWidth`: 使用 `runewidth.StringWidth()` 正确计算中文字符宽度
- `measureChildHeight`: 使用 `ansi.Strip()` 剥离 ANSI 转义符后再计算

## 📋 示例内容

这个示例包含：

1. **顶部标题**: 居中对齐的文本组件
2. **表格组件**: 实现了 `Measurable` 接口，根据数据量自适应尺寸
3. **视口组件**: 根据内容自适应高度，支持中文显示

## 🧪 运行示例

```bash
# 进入示例目录
cd examples/tui/adaptive-layout

# 运行示例
go run main.go
```

## 📐 布局属性

### Flex 布局属性

- `direction`: `row` | `column`
- `alignItems`: `start` | `center` | `end` | `stretch`
- `justifyContent`: `start` | `center` | `end` | `space-between`
- `grow`: 弹性增长系数
- `shrink`: 弹性收缩系数

### 组件属性

- `verticalAlign`: `top` | `center` | `bottom`
- `horizontalAlign`: `left` | `center` | `right`

## 🌐 Unicode 和 ANSI 支持

示例展示了框架如何正确处理：

- **中文字符**: 使用 `go-runewidth` 库计算字符视觉宽度
- **ANSI 转义符**: 使用 `charmbracelet/x/ansi` 库处理颜色和格式

## 🎯 使用场景

双向尺寸协商机制特别适用于：

- 数据驱动的表格组件
- 内容长度不确定的文本组件
- 需要精确尺寸控制的复杂布局
- 国际化应用（支持多语言）

## 📄 许可证

MIT License
