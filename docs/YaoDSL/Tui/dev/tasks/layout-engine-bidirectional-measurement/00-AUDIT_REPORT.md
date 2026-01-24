# Yao TUI 布局引擎双向尺寸协商 - 审查报告

**日期**: 2026-01-21
**审查范围**: `yao/tui` 布局引擎和 `charmbracelet/bubbles` 源代码
**审查目标**: 确保实施双向尺寸协商机制，实现自适应布局

---

## 📋 执行摘要

当前 Yao TUI 布局引擎使用**静态预测**方式计算组件尺寸，缺乏**双向尺寸协商机制**。这导致：

1. **无法正确处理中文和 ANSI 转义符**（measureChildWidth）
2. **组件无法参与尺寸协商**（无 Measurable 接口）
3. **布局后未通知组件实际分配大小**（SetSize 未调用）
4. **两阶段约束传递未实现**（约束 -> 反馈 -> 调整）

### 核心问题

| 问题类别               | 严重性  | 状态     |
| ---------------------- | ------- | -------- |
| Measurable 接口缺失    | 🔴 严重 | 未实现   |
| 双向协商机制缺失       | 🔴 严重 | 未实现   |
| measureChildWidth 错误 | 🔴 严重 | 需修复   |
| SetSize 未被调用       | 🟡 中等 | 部分实现 |
| 两阶段布局计算         | 🟡 中等 | 未实现   |
| Stretch 逻辑           | 🟢 轻微 | 部分实现 |
| Flex 冲突处理          | 🟢 轻微 | 需优化   |

---

## ✅ 已实现的功能

### 1. Flexbox 布局系统 - 部分实现 ⚠️

**位置**: `tui/layout/engine.go:99-107, 109-168`

**已实现**:

- ✅ 支持行和列方向布局 (`DirectionRow`, `DirectionColumn`)
- ✅ 支持 gap、padding、align-items、justify-content
- ✅ 基本的 Grow (flex: 1) 逻辑（159-162行）

**缺失**:

- ❌ Shrink 逻辑未实现（174行有字段但未使用）
- ❌ 组件无法反馈理想大小

### 2. Grid 布局 - 基础实现 ✅

**位置**: `tui/layout/engine.go:409-449`

- ✅ 固定列数网格布局
- ✅ 支持间隙

### 3. 组件集成 - 基本实现 ⚠️

**Table 组件** (`tui/components/table.go`):

- ✅ 有 `SetWidth/SetHeight` 方法（300-307行）
- ✅ 在 `UpdateRenderConfig` 中使用约束（340-353行）
- ❌ 但布局引擎未主动调用 `SetSize`

**Viewport 组件** (`tui/components/viewport.go`):

- ✅ 有 `SetWidth/SetHeight` 赋值（504-514行）
- ✅ 支持 `Width` 和 `Height` 属性
- ❌ 布局引擎未主动调用

---

## ❌ 缺失的关键功能

### 1. Measurable 接口 - **未实现** 🔴

**问题描述**: 布局引擎无法询问组件需要多大空间。

**当前代码** (`tui/core/types.go:33-59`):

```go
type ComponentInterface interface {
    Render(config RenderConfig) (string, error)
    // ... 其他方法
}
```

**影响**:

- 组件无法参与尺寸协商
- 布局引擎只能"猜测"组件大小
- 自适应布局无法正确实现

**建议添加**:

```go
// Measurable 接口允许组件报告其理想大小
type Measurable interface {
    // 根据父容器提供的最大约束，返回组件理想的大小
    // maxWidth 和 maxHeight 是父容器可提供的最大空间
    // 返回的 width 和 height 是组件期望的理想尺寸
    Measure(maxWidth, maxHeight int) (width, height int)
}
```

---

### 2. 双向尺寸协商机制 - **未实现** 🔴

**问题描述**: 当前是"静态预测"，不是"约束传递"。

**当前实现** (`tui/layout/engine.go:178-232`):

```go
func (e *Engine) measureChild(child *LayoutNode, config *FlexConfig, parentWidth, parentHeight int) *flexChildInfo {
    // 问题：直接猜测组件大小，而不是给约束让组件响应
    if config.Direction == DirectionRow {
        info.Size = e.measureChildWidth(child, parentHeight)  // 静态猜测
    } else {
        info.Size = e.measureChildHeight(child, parentWidth)  // 静态猜测
    }
}
```

**问题分析**:

1. `measureChildWidth` (548-645行) 使用硬编码默认值
2. `measureChildHeight` (647-753行) 使用简单的行数计算
3. 对于 `flex: 1`，只是标记 `Grow.Value = 1`，但不知道实际能占多少空间

**应该是**:

```go
func (e *Engine) measureChildWithConstraint(
    child *LayoutNode,
    maxWidth, maxHeight int,
) (preferredWidth, preferredHeight int) {
    // 阶段1：传递约束给组件
    if measurable, ok := child.Component.Instance.(Measurable); ok {
        return measurable.Measure(maxWidth, maxHeight)
    }

    // 阶段2：如果组件不支持 Measurable，使用默认测量
    return e.measureChildDefault(child, maxWidth, maxHeight)
}
```

---

### 3. 两阶段布局计算 - **未实现** 🟡

**问题描述**: 布局引擎一次性计算 Bound，没有约束传递阶段。

**当前实现** (`tui/layout/engine.go:65-107`):

```go
func (e *Engine) layoutNode(
    node *LayoutNode,
    x, y, width, height int,
    result *LayoutResult,
) {
    // 直接设置 Bound - 没有两阶段
    node.Bound = Rect{X: x, Y: y, Width: width, Height: height}

    // 直接递归 - 没有约束传递
    if len(node.Children) == 0 {
        return
    }
    // ...
}
```

**CSS 中的两阶段布局**:

1. **约束传递 (Constraint Pass)**: 父节点传递 `availableWidth/Height` 给子节点
2. **子节点响应 (Response Pass)**: 子节点根据约束返回 `preferredWidth/Height`
3. **最终调整 (Final Pass)**: 父节点根据子节点响应调整实际分配

**建议实现**:

```go
func (e *Engine) layoutNodeTwoPass(
    node *LayoutNode,
    x, y, width, height int,
    result *LayoutResult,
) {
    // 阶段1：约束下发
    e.passConstraints(node, width, height)

    // 阶段2：子节点响应并计算实际 Bound
    e.resolveLayout(node, x, y, width, height, result)

    // 阶段3：调用 SetSize 通知组件
    e.notifyComponentSizes(node)
}

func (e *Engine) passConstraints(node *LayoutNode, maxWidth, maxHeight int) {
    // 计算可用空间（减去 padding 和 gap）
    innerWidth := maxWidth - node.PaddingWidth
    innerHeight := maxHeight - node.PaddingHeight

    // 传递约束给每个子节点
    for _, child := range node.Children {
        child.AvailableWidth = innerWidth
        child.AvailableHeight = innerHeight

        // 递归传递约束
        e.passConstraints(child, innerWidth, innerHeight)
    }
}

func (e *Engine) resolveLayout(node *LayoutNode, x, y, width, height int, result *LayoutResult) {
    // 根据子节点响应计算实际 Bound
    // 对于 flex: 1，分配剩余空间
    // 对于 auto，使用 Measure 返回的理想大小
    // 对于固定值，使用指定的大小
}
```

---

## ⚠️ 部分实现但有问题

### 4. measureChildHeight 的中文/ANSI 处理 - **部分正确** ⚠️

**当前实现** (`tui/layout/engine.go:647-753`):

```go
func (e *Engine) measureChildHeight(node *LayoutNode, width int) int {
    // 对于 text 类型
    if props != nil {
        if content, ok := props["content"].(string); ok {
            // ✅ 使用了 wrap.String
            if width > 0 {
                wrapped := wrap.String(content, width)
                return strings.Count(wrapped, "\n") + 1
            }
        }
    }
    // ...
}
```

**✅ 正确的地方**:

- 使用了 `github.com/muesli/reflow/wrap` 包
- `wrap.String` 支持 ANSI 转义符处理
- 对于 text 组件，根据宽度计算换行高度

**❌ 问题的地方**:

1. **没有使用 `github.com/mattn/go-runewidth`** 处理中文等宽字符
2. **measureChildWidth** (548-645行) **完全未处理** ANSI 转义符和中文

**measureChildWidth 的问题**:

```go
func (e *Engine) measureChildWidth(node *LayoutNode, height int) int {
    // ...
    if node.Component.Instance.GetComponentType() == "text" {
        if content, ok := props["content"].(string); ok {
            return len(content)  // ❌ 错误：未处理中文和 ANSI 转义符
        }
    }
    // ...
    content, err := node.Component.Instance.Render(renderConfig)
    if err == nil {
        lines := strings.Split(content, "\n")
        maxWidth := 0
        for _, line := range lines {
            w := len(line)  // ❌ 错误：未处理 ANSI 转义符
            if w > maxWidth {
                maxWidth = w
            }
        }
        if maxWidth > 0 && maxWidth < 200 {
            return maxWidth
        }
    }
    // ...
}
```

**修复建议**:

```go
import (
    "github.com/mattn/go-runewidth"
    "github.com/charmbracelet/x/ansi"
)

func (e *Engine) measureChildWidth(node *LayoutNode, height int) int {
    if node.Component != nil && node.Component.Instance != nil {
        props := e.getProps(node)

        // 对于 text 组件，使用 runewidth 计算中文等宽字符
        if node.Component.Instance.GetComponentType() == "text" {
            if content, ok := props["content"].(string); ok {
                // 剥离 ANSI 转义符
                stripped := ansi.Strip(content)
                // 计算视觉宽度（中文算2个字符宽度）
                return runewidth.StringWidth(stripped)
            }
        }

        // 对于其他组件，渲染后计算
        renderConfig := core.RenderConfig{
            Width:  200,
            Height: height,
            Data:   props,
        }

        content, err := node.Component.Instance.Render(renderConfig)
        if err == nil {
            lines := strings.Split(content, "\n")
            maxWidth := 0
            for _, line := range lines {
                // 剥离 ANSI 转义符
                stripped := ansi.Strip(line)
                // 计算视觉宽度
                w := runewidth.StringWidth(stripped)
                if w > maxWidth {
                    maxWidth = w
                }
            }
            if maxWidth > 0 && maxWidth < 200 {
                return maxWidth
            }
        }
    }

    // ...
}
```

---

### 5. SetSize 机制 - **未正确使用** ⚠️

**Table 组件实现** (`tui/components/table.go:299-307`):

```go
func updateTableModelDimensions(model *table.Model, width, height int) {
    if width > 0 {
        model.SetWidth(width)
    }
    if height > 0 {
        model.SetHeight(height)
    }
}
```

**Viewport 组件实现** (`tui/components/viewport.go:504-514`):

```go
func (m *ViewportModel) UpdateRenderConfig(config core.RenderConfig) error {
    if m.props.Width > 0 {
        m.Model.Width = m.props.Width
    } else if config.Width > 0 {
        m.Model.Width = config.Width  // ✅ 使用约束
    }

    if m.props.Height > 0 {
        m.Model.Height = m.props.Height
    } else if config.Height > 0 {
        m.Model.Height = config.Height
    }

    return nil
}
```

**✅ 正确的地方**:

- 组件实现了尺寸设置方法
- 在 `UpdateRenderConfig` 中使用传入的约束

**❌ 问题的地方**:

- **布局引擎在 `Layout()` 后没有显式调用 `SetSize`**
- 只在 `Render()` 时传递约束，组件可能未及时更新内部状态

**当前渲染流程** (`tui/render_engine.go:109-145`):

```go
func (m *Model) renderNodeWithBounds(node *layout.LayoutNode) string {
    // ...
    config := core.RenderConfig{
        Data:   props,
        Width:  node.Bound.Width,
        Height: node.Bound.Height,
    }

    // 更新 last config
    node.Component.LastConfig = config

    // Render 中会调用 UpdateRenderConfig
    rendered, err := node.Component.Instance.Render(config)
    // ...

    if node.Bound.Width > 0 || node.Bound.Height > 0 {
        style := lipgloss.NewStyle().
            Width(node.Bound.Width).
            Height(node.Bound.Height)

        rendered = style.Render(rendered)
    }

    return rendered
}
```

**问题**:

- `Render()` 时才传递约束，但可能太晚
- 组件内部模型（如 table 的分页）可能未及时更新
- `lipgloss` 样式包裹只是视觉拉伸，不是组件内部拉伸

**建议添加显式 SetSize 调用**:

```go
func (e *Engine) Layout() *LayoutResult {
    if e.root == nil {
        return &LayoutResult{}
    }

    result := &LayoutResult{}
    e.layoutNode(e.root, 0, 0, e.window.Width, e.window.Height, result)

    // ✅ 新增：通知组件其实际分配的大小
    e.notifyComponentSizes(result.Nodes)

    return result
}

func (e *Engine) notifyComponentSizes(nodes []*LayoutNode) {
    for _, node := range nodes {
        if node.Component != nil && node.Component.Instance != nil {
            // 尝试调用 SetSize 方法
            // 可以定义一个新接口或使用反射
            if setter, ok := node.Component.Instance.(interface{ SetSize(w, h int) }); ok {
                setter.SetSize(node.Bound.Width, node.Bound.Height)
            }
        }
    }
}
```

或者在 `ComponentInterface` 中添加标准方法:

```go
type ComponentInterface interface {
    // ... 其他方法

    // SetSize 通知组件其实际分配的尺寸
    // 在布局计算完成后，布局引擎会调用此方法
    SetSize(width, height int)

    // 可选：返回组件的理想尺寸
    // 如果不实现，布局引擎使用默认测量
    Measure(maxWidth, maxHeight int) (width, height int)
}
```

---

### 6. Stretch 逻辑 - **部分实现** ⚠️

**当前实现** (`tui/layout/engine.go:303-304, 354-355`):

```go
case AlignStretch:
    e.layoutNode(childInfo.Node, childX, y, childWidth, childHeight, result)
```

**✅ 正确的地方**:

- AlignStretch 传递了完整的宽度或高度

**❌ 问题的地方**:

- 渲染时可能没有填充背景
- 组件内部可能没有拉伸

**渲染引擎** (`tui/render_engine.go:136-142`):

```go
if node.Bound.Width > 0 || node.Bound.Height > 0 {
    style := lipgloss.NewStyle().
        Width(node.Bound.Width).
        Height(node.Bound.Height)  // ✅ 设置了高度

    rendered = style.Render(rendered)
}
```

**问题**:

- `lipgloss.Style.Render()` 默认是**内容优先**，不会强制拉伸
- 对于 `<div style="height: 100px">短内容</div>`，背景色可能不填充

**解决方案**:

1. 使用 `lipgloss.ExpandMode`:

```go
style := lipgloss.NewStyle().
    Width(node.Bound.Width).
    Height(node.Bound.Height).
    MaxWidth(node.Bound.Width).  // 限制最大宽度
    MaxHeight(node.Bound.Height) // 限制最大高度

rendered = style.Render(rendered)
```

2. 或者在组件内部显式实现拉伸逻辑（推荐）

---

### 7. Flex 冲突处理 - **部分实现** ⚠️

**当前实现** (`tui/render_engine.go:99-103`):

```go
switch node.Style.Direction {
case layout.DirectionRow:
    result = lipgloss.JoinHorizontal(lipgloss.Top, children...)
} else {
    result = lipgloss.JoinVertical(lipgloss.Left, children...)
}
```

**❌ 问题**:

- 使用 `lipgloss.Top` 和 `lipgloss.Left`，没有使用 `lipgloss.ExpandMode`
- 可能导致背景色断层
- 多个 `flex: 1` 组件可能不对齐

**场景示例**:

```go
// 两个 flex: 1 的子组件
// 子组件1 内容较短
// 子组件2 内容较长
// 使用 lipgloss.JoinHorizontal 可能导致：
// 1. 子组件1 背景色不填充
// 2. 高度对齐问题
```

**建议修复**:

```go
// 为每个子组件创建带 ExpandMode 的样式
var styledChildren []string
for i, child := range children {
    style := lipgloss.NewStyle().
        Width(childWidths[i]).
        Height(height).
        MaxWidth(childWidths[i]).
        MaxHeight(height)

    styledChildren = append(styledChildren, style.Render(children[i]))
}
result = lipgloss.JoinHorizontal(lipgloss.Top, styledChildren...)
```

---

## 🎯 评估总结

| 功能点              | 实现状态    | 评分 | 关键问题                 |
| ------------------- | ----------- | ---- | ------------------------ |
| **Measurable 接口** | ❌ 未实现   | 0/10 | 组件无法反馈理想大小     |
| **双向协商机制**    | ❌ 未实现   | 1/10 | 仍使用静态预测           |
| **两阶段布局**      | ❌ 未实现   | 2/10 | 缺少约束传递阶段         |
| **中文/ANSI 处理**  | ⚠️ 部分实现 | 5/10 | measureChildWidth 未处理 |
| **SetSize 机制**    | ⚠️ 部分实现 | 4/10 | 布局引擎未调用           |
| **Stretch 逻辑**    | ⚠️ 部分实现 | 6/10 | 渲染时可能未拉伸         |
| **Flex 冲突处理**   | ⚠️ 部分实现 | 5/10 | 缺少 ExpandMode          |

### 🔴 核心问题总结

1. **缺少 Measurable 接口** - 组件无法参与尺寸协商
2. **无约束传递机制** - 布局引擎"猜测"而非"询问"
3. **SetSize 未被调用** - 组件在 Layout 后不知道分配到多大空间
4. **measureChildWidth 错误** - 不处理 ANSI 转义符和中文

### 📊 与 Bubbles 的对比

| 特性     | Bubbles                        | Yao TUI                | 差距        |
| -------- | ------------------------------ | ---------------------- | ----------- |
| 尺寸设置 | 由外部设置 Width/Height        | 组件有 SetWidth/Height | ✅ 已实现   |
| 内部计算 | 根据设置计算（如 list 的分页） | 部分支持               | ⚠️ 部分实现 |
| 约束感知 | 通过参数接收                   | 未实现                 | ❌ 缺失     |
| 自适应   | 主动适配                       | 静态猜测               | ❌ 缺失     |

**Bubbles 模式**:

```go
// 外部设置尺寸
list.SetWidth(80)
list.SetHeight(20)

// 内部计算
// - 减去标题高度
// - 减去状态栏高度
// - 减去帮助栏高度
// - 计算每页行数
```

**Yao TUI 应该**:

```go
// 阶段1：布局引擎传递约束
component.Measure(80, 20) -> (理想宽度, 理想高度)

// 阶段2：布局引擎计算 Bound
node.Bound = {X: 0, Y: 0, Width: 80, Height: 20}

// 阶段3：布局引擎调用 SetSize
component.SetSize(80, 20)  // 触发内部计算
```

---

## 📝 改进优先级

### P0 - 关键（必须修复）🔴

1. **实现 Measurable 接口**
   - 在 `tui/core/types.go` 添加 `Measurable` 接口
   - 在核心组件（table, viewport, list）实现该接口
   - 修改 `measureChild` 使用该接口

2. **修复 measureChildWidth/Height**
   - 添加 `github.com/mattn/go-runewidth` 依赖
   - 添加 `github.com/charmbracelet/x/ansi` 依赖
   - 在测量时剝离 ANSI 转义符
   - 使用 `runewidth.StringWidth()` 计算中文宽度

3. **在 Layout() 后调用 SetSize**
   - 修改 `Engine.Layout()` 添加 `notifyComponentSizes`
   - 在 `ComponentInterface` 添加 `SetSize(width, height int)` 方法
   - 或使用反射调用组件的 SetWidth/SetHeight

### P1 - 重要（应该修复）🟡

4. **实现两阶段布局计算**
   - 添加 `passConstraints` 方法
   - 添加 `resolveLayout` 方法
   - 修改 `layoutNode` 使用两阶段流程

5. **修复 Flex 冲突处理**
   - 在 `renderNodeWithBounds` 添加 ExpandMode
   - 使用 `MaxWidth` 和 `MaxHeight` 限制
   - 确保背景色正确填充

### P2 - 优化（可以后续）🟢

6. **完善 Stretch 逻辑**
   - 在组件内部实现显式拉伸
   - 对于 text 组件，添加垂直/水平对齐选项

7. **实现 Shrink 属性**
   - 在 `layout/types.go` 添加 Shrink 字段
   - 在 `measureChild` 处理 Shrink 逻辑
   - 参考 CSS flex-shrink

---

## 📚 参考资料

### Bubbles 组件实现参考

1. **Viewport** (`github.com/charmbracelet/bubbles/viewport`)
   - 外部设置 `Width` 和 `Height`
   - 内部根据 `YOffset` 和 `Height` 切片可见内容

2. **Table** (`github.com/charmbracelet/bubbles/table`)
   - 外部设置 `Width` 和 `Height`
   - 内部计算列宽和可见行数

3. **List** (`github.com/charmbracelet/bubbles/list`)
   - 外部设置 `Width` 和 `Height`
   - 内部计算每页显示行数（减去标题、状态、帮助）

### Go 依赖库

- `github.com/mattn/go-runewidth` - 中文等宽字符宽度计算
- `github.com/charmbracelet/x/ansi` - ANSI 转义符处理
- `github.com/muesli/reflow/wrap` - 文本换行（已使用）

### 设计模式参考

- **Flutter 布局系统**: 约束传递模型
- **React Native Flexbox**: 约束 -> 测量 -> 布局
- **CSS 布局**: 约束传递和内容适配

---

## 📅 下一步行动

1. ✅ 保存本审查报告
2. ⏳ 创建详细的 TODO 列表（01-IMPLEMENTATION_TODO.md）
3. ⏳ 实施 P0 级别的修复
4. ⏳ 实施 P1 级别的改进
5. ⏳ 编写测试用例验证修复
6. ⏳ 更新文档和示例

---

**审查人员**: AI Assistant
**审查日期**: 2026-01-21
**文档版本**: 1.0
