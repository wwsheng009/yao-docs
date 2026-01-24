基于对 `yao/tui` 布局引擎和 `charmbracelet/bubbles` 源代码的分析，当前 TUI 自适应布局无法正确计算组件宽高的核心原因在于：**缺乏双向尺寸协商机制**。

在传统的 CSS 中，布局是“流式”的，而终端界面（TUI）的布局通常需要先确定父容器大小，再告诉子组件能用多少空间。

### 1. 核心问题分析

- ** Yao TUI 现状 (`tui/layout/engine.go`)**：
- `measureChildWidth` 和 `measureChildHeight` 试图通过预先渲染（`Render`）或根据组件类型（如 `header` 返回 80x3）来预测大小。
- 这种方式是**静态预测**，无法处理内容动态变化或需要根据剩余空间拉伸的情况。
- `layoutFlex` 虽有 `Grow` 逻辑，但在分配空间时，对于那些没有指定宽高的“内容自适应”组件，缺乏准确的测量依据。

- ** Bubbles 机制 (`bubbles/viewport/viewport.go`, `bubbles/list/list.go`)**：
- **主动适配**：`bubbles` 的组件（如 `Viewport`, `List`, `Table`）通常不“报告”自己需要多大，而是**由外部设置**其 `Width` 和 `Height` 属性。
- **内部计算**：例如 `list` 会根据传入的 `Height` 减去标题、状态栏和帮助栏的高度，动态计算出每页显示的行数（`updatePagination`）。
- **可见性裁剪**：`viewport` 通过 `YOffset` 和 `Height` 切片原始行数据，仅渲染可见部分。

### 2. 改进方案建议：引入“约束优先”的布局模型

要实现类似 CSS 的自适应功能，建议将 `yao/tui` 的布局逻辑从“测量预测”改为“**约束传递 -> 组件反馈 -> 最终调整**”。

#### A. 改进测量协议 (Refactoring `Engine.measureChild`)

不要让 `Engine` 去猜组件大小，而是引入 `core.Measurable` 接口。

```go
// tui/core/interfaces.go 建议增加
type Measurable interface {
    // 根据父容器提供的最大约束，返回组件理想的大小
    Measure(maxWidth, maxHeight int) (width, height int)
}

```

#### B. 实施“两阶段”布局计算

1. **约束下发 (Constraint Pass)**：父节点根据自身 `Bound` 减去 `Padding` 和 `Gap`，计算出给子节点的 `AvailableWidth/Height`。
2. **子节点响应**：

- 如果子组件是 `Flex: 1` (Grow)，则占满剩余空间。
- 如果子组件是 `Width: "auto"`，调用 `Measure(availW, availH)`。对于 `list` 或 `table`，它们应返回其内容所需的理想大小（例如：行数 + 标题高度）。

#### C. 借鉴 `bubbles/table` 的视口更新机制

当前 `tui/layout/renderer.go` 在渲染 Row 时只是简单的字符串拼接。对于自适应界面，应参考 `bubbles/table.go` 的 `UpdateViewport`：

- 在 `layoutNode` 计算完成后，必须调用组件实例的 `SetSize(w, h)` 方法。
- 这样组件内部（如 `viewport`）才能根据实际分配到的 `Bound.Height` 进行正确的行切片渲染。

### 3. 具体代码优化点

1. **修复 `measureChildHeight**`：
目前该方法对于 `text`类型使用`math.Ceil(float64(len(content)) / float64(width))`。这在处理中文或包含 ANSI 转义符（颜色代码）时会完全失效。

- **改进**：应使用 `github.com/mattn/go-runewidth` 计算视觉宽度，并使用 `charmbracelet/x/ansi` 处理转义字符，以获得真实的折行高度。

2. **引入 `Stretch` 逻辑 (`tui/render_engine.go`)**：
   在 `renderNodeWithBounds` 中，已经设置了 `style.Width(node.Bound.Width).Height(node.Bound.Height)`。但如果组件内部生成的字符串小于这个范围，`lipgloss` 的 `Render` 默认不会填充背景。

- **改进**：应在渲染交互式组件（如 `input`, `table`）前，显式强制组件更新其内部模型的大小，而不是仅在外部包裹样式。

3. **处理 Flex 冲突**：
   在 `layoutFlex` 中，如果多个子节点都是 `flex: 1`，且包含 `DirectionRow`，必须确保 `JoinHorizontal` 使用 `lipgloss.Expand` 或明确的宽度填充，否则会导致背景色断层或对齐失效。

### 总结方案

Yao 的布局引擎应该从“**询问子组件要多大**”转变为“**告诉子组件你只有这么大**”。

1. 布局引擎先根据 `window` 大小计算出每个节点的 `Bound`。
2. 在 `Layout()` 完成后，遍历所有节点，调用其组件实例的 `SetSize(Bound.Width, Bound.Height)`。
3. 组件根据分配到的宽高重新计算内部状态（如 `table` 的行分页）。
4. 最后执行 `Render()`。
