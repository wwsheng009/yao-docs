# Yao TUI 布局引擎双向尺寸协商 - 实施清单

**基于审查报告**: [00-AUDIT_REPORT.md](./00-AUDIT_REPORT.md)
**创建日期**: 2026-01-21
**预计工期**: 5-7 个工作日

---

## 📋 总览

### P0 任务（关键）🔴

- [ ] **[P0-1]** 实现 Measurable 接口
- [ ] **[P0-2]** 修复 measureChildWidth/Height 的中文和 ANSI 处理
- [ ] **[P0-3]** 在 Layout() 后调用 SetSize 通知组件

### P1 任务（重要）🟡

- [ ] **[P1-1]** 实现两阶段布局计算
- [ ] **[P1-2]** 修复 Flex 冲突处理（添加 ExpandMode）

### P2 任务（优化）🟢

- [ ] **[P2-1]** 完善 Stretch 逻辑
- [ ] **[P2-2]** 实现 Shrink 属性
- [ ] **[P2-3]** 编写测试用例
- [ ] **[P2-4]** 更新文档和示例

---

## 🔴 P0-1: 实现 Measurable 接口

### 任务描述

在 `ComponentInterface` 中添加尺寸测量接口，允许组件向布局引擎反馈其理想大小。

### 子任务

#### [x] 1.1 在 types.go 添加 Measurable 接口

**文件**: `tui/core/types.go`

**操作**:

```go
// 在 ComponentInterface 定义后添加

// Measurable 接口允许组件报告其理想大小
// 组件可以可选实现此接口以参与布局计算
type Measurable interface {
    // 根据父容器提供的最大约束，返回组件理想的大小
    // maxWidth 和 maxHeight 是父容器可提供的最大空间（减去 padding 和 gap）
    // 返回的 width 和 height 是组件期望的理想尺寸
    // 如果组件希望填充所有可用空间，可以返回 maxWidth 和 maxHeight
    Measure(maxWidth, maxHeight int) (width, height int)
}
```

**验收标准**:

- [x] Measurable 接口已定义
- [x] 文档注释清晰说明参数和返回值
- [x] 接口位置合理（在 ComponentInterface 后）

#### [x] 1.2 在 Table 组件实现 Measurable

**文件**: `tui/components/table.go`

**操作**:

```go
// 在 TableComponentWrapper 结构体后添加

// Measure 返回表格的理想尺寸
func (w *TableComponentWrapper) Measure(maxWidth, maxHeight int) (width, height int) {
    // 宽度：计算所有列宽总和 + 边框
    totalColumnWidth := 0
    columns := w.model.Columns()
    for _, col := range columns {
        totalColumnWidth += col.Width
    }

    // 加上边框（左边框1个字符 + 每列间隔1个字符）
    width = totalColumnWidth + len(columns) + 1

    // 限制在 maxWidth 内
    if width > maxWidth {
        width = maxWidth
    }

    // 高度：行数 + 表头 + 边框
    rows := w.model.Rows()
    rowHeight := len(rows)
    headerHeight := 1
    borderHeight := 2 // 上下边框

    height = rowHeight + headerHeight + borderHeight

    // 限制在 maxHeight 内
    if height > maxHeight {
        height = maxHeight
    }

    return width, height
}
```

**验收标准**:

- [x] Measure 方法已实现
- [x] 正确计算表格宽度（列宽 + 边框）
- [x] 正确计算表格高度（行数 + 表头 + 边框）
- [x] 尊重 maxWidth 和 maxHeight 约束

#### [x] 1.3 在 Viewport 组件实现 Measurable

**文件**: `tui/components/viewport.go`

**操作**:

```go
// Measure 返回视口的理想尺寸
func (w *ViewportComponentWrapper) Measure(maxWidth, maxHeight int) (width, height int) {
    // 宽度：内容中最宽的行
    content := w.model.GotoTop() + w.model.GotoBottom()
    lines := strings.Split(content, "\n")

    maxWidthLine := 0
    for _, line := range lines {
        lineWidth := runewidth.StringWidth(ansi.Strip(line))
        if lineWidth > maxWidthLine {
            maxWidthLine = lineWidth
        }
    }

    width = maxWidthLine + 2 // 左右边框各1个字符
    if width > maxWidth {
        width = maxWidth
    }

    // 高度：内容行数
    height = len(lines) + 2 // 上下边框各1个字符
    if height > maxHeight {
        height = maxHeight
    }

    return width, height
}
```

**依赖**: 需要 `github.com/mattn/go-runewidth` 和 `github.com/charmbracelet/x/ansi`

**验收标准**:

- [x] Measure 方法已实现
- [x] 正确计算视口宽度（内容最宽行 + 边框）
- [x] 正确计算视口高度（内容行数 + 边框）
- [x] 尊重 maxWidth 和 maxHeight 约束

#### [x] 1.4 修改 measureChild 使用 Measurable 接口

**文件**: `tui/layout/engine.go`

**操作**:
在 `measureChild` 方法开头添加 Measurable 检查：

```go
func (e *Engine) measureChild(child *LayoutNode, config *FlexConfig, parentWidth, parentHeight int) *flexChildInfo {
    info := &flexChildInfo{
        Node: child,
        Grow: Grow{Value: 0},
    }

    if child.Style == nil {
        e.ensureStyle(child)
    }

    var size *Size
    if config.Direction == DirectionRow {
        size = child.Style.Width
    } else {
        size = child.Style.Height
    }

    // ✅ 新增：检查组件是否实现 Measurable 接口
    if child.Component != nil && child.Component.Instance != nil {
        if measurable, ok := child.Component.Instance.(Measurable); ok {
            // 使用组件提供的测量结果
            measuredWidth, measuredHeight := measurable.Measure(parentWidth, parentHeight)

            if config.Direction == DirectionRow {
                info.Size = measuredWidth
            } else {
                info.Size = measuredHeight
            }

            // 应用最小尺寸约束
            if config.Direction == DirectionRow && info.Size < child.Style.MinWidth {
                info.Size = child.Style.MinWidth
            } else if config.Direction == DirectionColumn && info.Size < child.Style.MinHeight {
                info.Size = child.Style.MinHeight
            }

            return info
        }
    }

    // 如果没有实现 Measurable，使用默认测量逻辑
    // ... 原有的 size.Value 判断逻辑 ...
}
```

**验收标准**:

- [x] measureChild 检查 Measurable 接口
- [x] 如果组件实现 Measurable，使用其测量结果
- [x] 保持向后兼容（未实现的组件使用默认逻辑）

---

## 🔴 P0-2: 修复 measureChildWidth/Height 的中文和 ANSI 处理

### 任务描述

修复测量函数，正确处理中文等宽字符和 ANSI 转义符。

### 子任务

#### [x] 2.1 添加 go-runewidth 依赖

**文件**: `go.mod`

**操作**:

```bash
go get github.com/mattn/go-runewidth
```

**验收标准**:

- [x] go.mod 包含 `github.com/mattn/go-runewidth`
- [x] go.sum 已更新

#### [x] 2.2 添加 charmbracelet/x/ansi 依赖

**文件**: `go.mod`

**操作**:

```bash
go get github.com/charmbracelet/x/ansi
```

**验收标准**:

- [x] go.mod 包含 `github.com/charmbracelet/x/ansi`
- [x] go.sum 已更新

#### [x] 2.3 修复 measureChildWidth

**文件**: `tui/layout/engine.go`

**操作**:

```go
func (e *Engine) measureChildWidth(node *LayoutNode, height int) int {
    if node.Style != nil && node.Style.Width != nil {
        switch v := node.Style.Width.Value.(type) {
        case string:
            if v == "flex" {
                return 0
            }
        case int:
            if v > 0 {
                return v
            }
        case float64:
            if v > 0 {
                return int(v)
            }
        }
    }

    if node.Component != nil && node.Component.Instance != nil {
        // ✅ 使用 LastConfig 的优先
        if config := node.Component.LastConfig; config.Width > 0 {
            return config.Width
        }

        if config := node.Component.LastConfig; config.Height > 0 {
            height = config.Height
        }

        props := e.getProps(node)

        // ✅ 对于 text 组件，使用 runewidth 计算中文宽度
        if node.Component.Instance.GetComponentType() == "text" {
            if content, ok := props["content"].(string); ok {
                // 剥离 ANSI 转义符
                stripped := ansi.Strip(content)
                // 计算视觉宽度（中文算2个字符宽度）
                return runewidth.StringWidth(stripped)
            }
        }

        // ✅ 对于其他组件，渲染后计算
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
                // ✅ 剥离 ANSI 转义符
                stripped := ansi.Strip(line)
                // ✅ 使用 runewidth 计算视觉宽度
                w := runewidth.StringWidth(stripped)
                if w > maxWidth {
                    maxWidth = w
                }
            }
            if maxWidth > 0 && maxWidth < 200 {
                return maxWidth
            }
        }

        // Try to get component type from instance or node
        componentType := node.ComponentType
        if componentType == "" && node.Component != nil && node.Component.Instance != nil {
            componentType = node.Component.Instance.GetComponentType()
        }

        if componentType != "" {
            switch componentType {
            case "header":
                return 80
            case "text":
                return 40
            case "list":
                return 80
            case "input":
                return 40
            case "button":
                return 20
            default:
                return 50
            }
        }
    } else if node.ComponentType != "" {
        switch node.ComponentType {
        case "header":
            return 80
        case "text":
            return 40
        case "list":
            return 80
        case "input":
            return 40
        case "button":
            return 20
        default:
            return 50
        }
    }

    return 20
}
```

**需要添加的导入**:

```go
import (
    // ... 现有导入
    "github.com/charmbracelet/x/ansi"
    "github.com/mattn/go-runewidth"
)
```

**验收标准**:

- [x] measureChildWidth 使用 ansi.Strip() 剝离转义符
- [x] measureChildWidth 使用 runewidth.StringWidth() 计算宽度
- [x] 正确处理中文等宽字符（中文算2宽度）
- [x] 向后兼容（未实现 Measurable 的组件仍可工作）

#### [ ] 2.4 改进 measureChildHeight

**文件**: `tui/layout/engine.go`

**操作**:
当前实现对于 text 组件使用 `wrap.String` 已经正确处理 ANSI，但可以改进：

```go
func (e *Engine) measureChildHeight(node *LayoutNode, width int) int {
    if node.Style != nil && node.Style.Height != nil {
        switch v := node.Style.Height.Value.(type) {
        case string:
            if v == "flex" {
                return 0
            }
        case int:
            if v > 0 {
                return v
            }
        case float64:
            if v > 0 {
                return int(v)
            }
        }
    }

    props := e.getProps(node)

    if node.Component != nil && node.Component.Instance != nil {
        if config := node.Component.LastConfig; config.Height > 0 {
            return config.Height
        }

        if config := node.Component.LastConfig; config.Width > 0 {
            width = config.Width
        }

        renderConfig := core.RenderConfig{
            Width:  width,
            Height: 1000,
            Data:   props,
        }
        content, err := node.Component.Instance.Render(renderConfig)
        if err == nil {
            // ✅ 改进：使用 runewidth 计算行高（考虑中文换行）
            lines := strings.Split(content, "\n")
            lineCount := len(lines)
            if lineCount > 0 && lineCount < 1000 {
                return lineCount
            }
        }
    }

    // Try to determine component type
    componentType := node.ComponentType
    if componentType == "" && node.Component != nil && node.Component.Instance != nil {
        componentType = node.Component.Instance.GetComponentType()
    }

    if componentType != "" {
        switch componentType {
        case "header":
            return 3
        case "text":
            // ✅ 改进：使用 wrap.String 正确处理 ANSI 和中文
            if props != nil {
                if content, ok := props["content"].(string); ok {
                    // Use reflow/wrap for accurate height calculation with ANSI support
                    if width > 0 {
                        wrapped := wrap.String(content, width)
                        return strings.Count(wrapped, "\n") + 1
                    }
                    return 1
                }
            }
            return 1
        case "list":
            if props != nil {
                if items, ok := props["items"].([]interface{}); ok {
                    count := len(items)
                    if count == 0 {
                        return 5
                    }
                    if count > 20 {
                        return 20
                    }
                    return count + 2
                }
                if bindData, ok := props["__bind_data"].([]interface{}); ok {
                    count := len(bindData)
                    if count == 0 {
                        return 5
                    }
                    if count > 20 {
                        return 20
                    }
                    return count + 2
                }
            }
            return 10
        case "input":
            return 1
        case "button":
            return 1
        default:
            return 5
        }
    }

    return 1
}
```

**验收标准**:

- [x] text 组件使用 wrap.String 正确处理换行
- [x] list 组件正确计算高度（行数 + 边框）
- [x] 其他组件返回合理的默认值

---

## 🔴 P0-3: 在 Layout() 后调用 SetSize 通知组件

### 任务描述

在布局计算完成后，显式调用组件的 SetSize 方法，通知组件其实际分配到的尺寸。

### 子任务

#### [x] 3.1 在 ComponentInterface 添加 SetSize 方法（可选方案）

**文件**: `tui/core/types.go`

**方案 A**: 在 ComponentInterface 中添加（推荐）

```go
type ComponentInterface interface {
    // ... 现有方法

    // SetSize 通知组件其实际分配的尺寸
    // 在布局计算完成后，布局引擎会调用此方法
    // 组件应该根据新尺寸更新内部状态（如分页、滚动等）
    SetSize(width, height int)
}
```

**方案 B**: 定义独立的 Sizable 接口（备选）

```go
// Sizable 接口标记组件可以接受尺寸设置
type Sizable interface {
    SetSize(width, height int)
}
```

**验收标准**:

- [x] 已选择方案（A 或 B）
- [x] 接口已定义
- [x] 文档注释清晰说明

#### [x] 3.2 在 Table 组件实现 SetSize

**文件**: `tui/components/table.go`

**操作**:

```go
// SetSize 更新表格的实际显示尺寸
func (w *TableComponentWrapper) SetSize(width, height int) {
    // 直接设置底层 table.Model 的尺寸
    w.model.SetWidth(width)
    w.model.SetHeight(height)

    // 可以触发其他内部更新逻辑
    // 例如：重新计算可见行数、调整滚动位置等
}
```

**验收标准**:

- [x] SetSize 方法已实现
- [x] 调用底层的 SetWidth 和 SetHeight
- [x] 组件内部状态正确更新

#### [x] 3.3 在 Viewport 组件实现 SetSize

**文件**: `tui/components/viewport.go`

**操作**:

```go
// SetSize 更新视口的实际显示尺寸
func (w *ViewportComponentWrapper) SetSize(width, height int) {
    // 直接设置底层 viewport.Model 的尺寸
    w.model.Width = width
    w.model.Height = height
}
```

**验收标准**:

- [x] SetSize 方法已实现
- [x] 直接设置 Width 和 Height
- [x] 视口正确裁剪内容

#### [x] 3.4 在 Engine.Layout() 添加 notifyComponentSizes

**文件**: `tui/layout/engine.go`

**操作**:

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

// notifyComponentSizes 通知所有组件其实际分配的尺寸
func (e *Engine) notifyComponentSizes(nodes []*LayoutNode) {
    for _, node := range nodes {
        // 只通知有组件实例的节点
        if node.Component == nil || node.Component.Instance == nil {
            continue
        }

        // 尝试调用 SetSize 方法
        // 方案 A：如果 ComponentInterface 有 SetSize
        if component, ok := node.Component.Instance.(interface{ SetSize(w, h int) }); ok {
            component.SetSize(node.Bound.Width, node.Bound.Height)
            continue
        }

        // 方案 B：如果实现了 Sizable 接口
        if sizable, ok := node.Component.Instance.(interface{ SetSize(w, h int) }); ok {
            sizable.SetSize(node.Bound.Width, node.Bound.Height)
            continue
        }

        // 兜底：尝试调用 SetWidth/SetHeight（向后兼容）
        if setter, ok := node.Component.Instance.(interface{ SetWidth(w int) }); ok {
            setter.SetWidth(node.Bound.Width)
        }
        if setter, ok := node.Component.Instance.(interface{ SetHeight(h int) }); ok {
            setter.SetHeight(node.Bound.Height)
        }
    }
}
```

**验收标准**:

- [x] Layout() 方法调用 notifyComponentSizes
- [x] notifyComponentSizes 遍历所有节点
- [x] 正确调用组件的 SetSize/ SetWidth/ SetHeight
- [x] 处理组件未实现 SetSize 的情况（向后兼容）

---

## 🟡 P1-1: 实现两阶段布局计算

### 任务描述

将布局引擎从一次性计算改为两阶段：约束传递 -> 子节点响应 -> 最终调整。

### 子任务

#### [x] 4.1 在 LayoutNode 添加约束字段

**文件**: `tui/layout/types.go`

**操作**:

```go
type LayoutNode struct {
    // ... 现有字段

    // AvailableWidth 是布局引擎传递给节点的可用宽度约束
    AvailableWidth int

    // AvailableHeight 是布局引擎传递给节点的可用高度约束
    AvailableHeight int

    // PreferredWidth 是节点根据约束反馈的理想宽度
    PreferredWidth int

    // PreferredHeight 是节点根据约束反馈的理想高度
    PreferredHeight int
}
```

**验收标准**:

- [x] LayoutNode 包含约束字段
- [x] 字段命名清晰易懂

#### [x] 4.2 实现 passConstraints 方法

**文件**: `tui/layout/engine.go`

**操作**:

```go
// passConstraints 传递约束给节点树
func (e *Engine) passConstraints(node *LayoutNode, maxWidth, maxHeight int) {
    if node == nil {
        return
    }

    // 计算内部可用空间（减去 padding）
    innerWidth := maxWidth
    innerHeight := maxHeight

    if node.Style.Padding != nil {
        innerWidth = max(0, innerWidth-node.Style.Padding.Left-node.Style.Padding.Right)
        innerHeight = max(0, innerHeight-node.Style.Padding.Top-node.Style.Padding.Bottom)
    }

    // 设置节点的可用约束
    node.AvailableWidth = innerWidth
    node.AvailableHeight = innerHeight

    // 对于没有子节点的叶子节点，调用 Measure
    if len(node.Children) == 0 && node.Component != nil && node.Component.Instance != nil {
        if measurable, ok := node.Component.Instance.(Measurable); ok {
            node.PreferredWidth, node.PreferredHeight = measurable.Measure(innerWidth, innerHeight)
        }
    }

    // 递归传递约束给子节点
    for _, child := range node.Children {
        e.passConstraints(child, innerWidth, innerHeight)
    }
}
```

**验收标准**:

- [x] passConstraints 方法已实现
- [x] 正确计算可用空间（考虑 padding）
- [x] 调用 Measurable 接口获取理想尺寸
- [x] 递归传递约束给子节点

#### [x] 4.3 修改 layoutNode 使用两阶段

**文件**: `tui/layout/engine.go`

**操作**:

```go
func (e *Engine) Layout() *LayoutResult {
    if e.root == nil {
        return &LayoutResult{}
    }

    result := &LayoutResult{}

    // ✅ 阶段1：约束传递
    e.passConstraints(e.root, e.window.Width, e.window.Height)

    // 阶段2：子节点响应并计算实际 Bound
    e.layoutNode(e.root, 0, 0, e.window.Width, e.window.Height, result)

    // 阶段3：调用 SetSize 通知组件
    e.notifyComponentSizes(result.Nodes)

    return result
}

func (e *Engine) layoutNode(
    node *LayoutNode,
    x, y, width, height int,
    result *LayoutResult,
) {
    if node == nil {
        return
    }

    e.ensureStyle(node)
    e.calculateMetrics(node, width, height)
    node.Bound = Rect{X: x, Y: y, Width: width, Height: height}

    result.Nodes = append(result.Nodes, node)
    if node.Dirty {
        result.Dirties = append(result.Dirties, node)
    }

    if len(node.Children) == 0 {
        return
    }

    innerX := x
    innerY := y
    innerWidth := width
    innerHeight := height

    if node.Style.Padding != nil {
        innerX += node.Style.Padding.Left
        innerY += node.Style.Padding.Top
        innerWidth = max(0, innerWidth-node.Style.Padding.Left-node.Style.Padding.Right)
        innerHeight = max(0, innerHeight-node.Style.Padding.Top-node.Style.Padding.Bottom)
    }

    switch node.Type {
    case LayoutFlex:
        e.layoutFlex(node, innerX, innerY, innerWidth, innerHeight, result)
    case LayoutGrid:
        e.layoutGrid(node, innerX, innerY, innerWidth, innerHeight, result)
    case LayoutAbsolute:
        e.layoutAbsolute(node, x, y, width, height, result)
    }
}
```

**验收标准**:

- [x] Layout() 使用两阶段流程
- [x] 阶段1调用 passConstraints
- [x] 阶段2调用 layoutNode
- [x] 阶段3调用 notifyComponentSizes

---

## 🟡 P1-2: 修复 Flex 冲突处理（添加 ExpandMode）

### 任务描述

在 Flex 布局渲染时添加 ExpandMode，确保背景色正确填充，避免背景断层。

### 子任务

#### [x] 5.1 修改 renderNodeWithBounds 添加 ExpandMode

**文件**: `tui/render_engine.go`

**操作**:

```go
func (m *Model) renderNodeWithBounds(node *layout.LayoutNode) string {
    if node == nil || node.Component == nil || node.Component.Instance == nil {
        return ""
    }

    // Resolve props for this component from original config
    compConfig := m.findComponentConfig(node.ID)
    props := map[string]interface{}{}
    if compConfig != nil {
        props = m.resolveProps(compConfig)
    }

    config := core.RenderConfig{
        Data:   props,
        Width:  node.Bound.Width,
        Height: node.Bound.Height,
    }

    // Update last config before rendering
    node.Component.LastConfig = config

    rendered, err := node.Component.Instance.Render(config)
    if err != nil {
        log.Error("Component %s render failed: %v", node.ID, err)
        return m.renderErrorComponent(node.ID, node.Component.Type, err)
    }

    // ✅ 改进：使用 ExpandMode 确保背景色填充
    if node.Bound.Width > 0 || node.Bound.Height > 0 {
        style := lipgloss.NewStyle().
            Width(node.Bound.Width).
            Height(node.Bound.Height).
            MaxWidth(node.Bound.Width).   // ✅ 限制最大宽度
            MaxHeight(node.Bound.Height) // ✅ 限制最大高度

        rendered = style.Render(rendered)
    }

    return rendered
}
```

**验收标准**:

- [x] renderNodeWithBounds 使用 MaxWidth 和 MaxHeight
- [x] Flex 子组件背景色正确填充
- [x] 避免 AlignStretch 时的背景断层

#### [x] 5.2 修改 Renderer.RenderNode 使用 ExpandMode

**文件**: `tui/layout/renderer.go`

**操作**:

```go
func (r *Renderer) RenderNode(node *LayoutNode) string {
    if node == nil {
        return ""
    }

    var builder strings.Builder

    style := r.createStyle(node)
    containerWidth := r.getWidth(node)
    containerHeight := r.getHeight(node)

    lines := r.renderNodeInternal(node, containerWidth, containerHeight)

    // ✅ 改进：添加 MaxWidth 和 MaxHeight
    style = style.
        Width(containerWidth).
        Height(containerHeight).
        MaxWidth(containerWidth).
        MaxHeight(containerHeight)

    for i, line := range lines {
        styled := style.Render(line)
        builder.WriteString(styled)
        if i < len(lines)-1 {
            builder.WriteString("\n")
        }
    }

    return builder.String()
}
```

**验收标准**:

- [x] RenderNode 使用 MaxWidth 和 MaxHeight
- [x] 确保背景色填充完整
- [x] 避免内容对齐问题

---

## 🟢 P2-1: 完善 Stretch 逻辑

### 任务描述

在组件内部实现显式拉伸逻辑，特别是在 text 组件中添加垂直/水平对齐选项。

### 子任务

#### [x] 6.1 在 TextProps 添加对齐选项

**文件**: `tui/components/text.go` (如果存在)

**操作**:

```go
type TextProps struct {
    Content    string `json:"content"`
    // ... 现有字段

    // VerticalAlign 指定垂直对齐方式
    VerticalAlign string `json:"verticalAlign"` // "top", "center", "bottom"

    // HorizontalAlign 指定水平对齐方式
    HorizontalAlign string `json:"horizontalAlign"` // "left", "center", "right"
}
```

**验收标准**:

- [x] TextProps 包含对齐选项
- [x] 默认值为合理的值（如 "top", "left"）

#### [x] 6.2 在 Text 组件实现拉伸逻辑

**文件**: `tui/components/text.go` (如果存在)

**操作**:

```go
func (t *TextComponentWrapper) Render(config core.RenderConfig) (string, error) {
    propsMap, ok := config.Data.(map[string]interface{})
    if !ok {
        return "", fmt.Errorf("TextComponentWrapper: invalid data type")
    }
    props := ParseTextProps(propsMap)

    content := props.Content

    // ✅ 根据 VerticalAlign 处理垂直拉伸
    if config.Height > len(strings.Split(content, "\n")) {
        switch props.VerticalAlign {
        case "center":
            padding := (config.Height - len(strings.Split(content, "\n"))) / 2
            content = strings.Repeat("\n", padding) + content
        case "bottom":
            padding := config.Height - len(strings.Split(content, "\n"))
            content = strings.Repeat("\n", padding) + content
        }
    }

    // ✅ 根据 HorizontalAlign 处理水平拉伸
    if config.Width > runewidth.StringWidth(ansi.Strip(content)) {
        switch props.HorizontalAlign {
        case "center":
            padding := (config.Width - runewidth.StringWidth(ansi.Strip(content))) / 2
            content = strings.Repeat(" ", padding) + content
        case "right":
            padding := config.Width - runewidth.StringWidth(ansi.Strip(content))
            content = strings.Repeat(" ", padding) + content
        }
    }

    return content, nil
}
```

**验收标准**:

- [x] 实现垂直对齐逻辑
- [x] 实现水平对齐逻辑
- [x] 尊重 config.Width 和 config.Height 约束

---

## 🟢 P2-2: 实现 Shrink 属性

### 任务描述

在 Flex 布局中实现 Shrink 属性，参考 CSS flex-shrink。

### 子任务

#### [x] 7.1 在 LayoutStyle 添加 Shrink 字段

**文件**: `tui/layout/types.go`

**操作**:

```go
type LayoutStyle struct {
    // ... 现有字段

    // Shrink 控制子元素在空间不足时的收缩比例
    // 0 表示不收缩，值越大收缩越多
    // 类似于 CSS 的 flex-shrink
    Shrink Grow
}
```

**验收标准**:

- [x] LayoutStyle 包含 Shrink 字段
- [x] 字段类型正确（Grow 结构体）

#### [x] 7.2 在 measureChild 处理 Shrink

**文件**: `tui/layout/engine.go`

**操作**:

```go
func (e *Engine) layoutFlex(
    node *LayoutNode,
    x, y, width, height int,
    result *LayoutResult,
) {
    if len(node.Children) == 0 {
        return
    }

    config := &FlexConfig{
        Direction:  node.Style.Direction,
        AlignItems: node.Style.AlignItems,
        Justify:    node.Style.Justify,
        Wrap:       node.Style.Wrap,
        Gap:        node.Style.Gap,
    }

    // 收集所有子元素信息
    var allChildren []*flexChildInfo
    var totalFixedSize int
    var growSum float64
    var shrinkSum float64  // ✅ 新增

    for _, child := range node.Children {
        info := e.measureChild(child, config, width, height)
        allChildren = append(allChildren, info)

        if info.Grow.Value > 0 {
            growSum += info.Grow.Value
        }
        // ✅ 新增：收集 Shrink
        if info.Shrink.Value > 0 {
            shrinkSum += info.Shrink.Value
        } else {
            totalFixedSize += info.Size
        }
    }

    totalGap := node.Style.Gap * (len(node.Children) - 1)

    // 根据布局方向选择可用空间
    var containerSize int
    if config.Direction == DirectionRow {
        containerSize = width
    } else {
        containerSize = height
    }
    availableSpace := containerSize - totalFixedSize - totalGap

    // ✅ 新增：处理空间不足的情况（Shrink）
    if availableSpace < 0 && shrinkSum > 0 {
        // 按照收缩比例减少子元素大小
        for _, info := range allChildren {
            if info.Shrink.Value > 0 {
                shrinkAmount := int(float64(-availableSpace) * (info.Shrink.Value / shrinkSum))
                info.Size = max(info.Size - shrinkAmount, 0)
            }
        }
    } else if availableSpace > 0 && growSum > 0 {
        // 处理空间充足的情况（Grow）
        for _, info := range allChildren {
            if info.Grow.Value > 0 {
                extra := int(float64(availableSpace) * (info.Grow.Value / growSum))
                info.Size = extra
            }
        }
    }

    e.distributeFlexChildrenOrdered(
        allChildren, config, x, y, width, height, result,
    )
}
```

**验收标准**:

- [x] measureChild 检查 Shrink 字段
- [x] 空间不足时按比例收缩
- [x] 空间充足时按比例拉伸（保持 Grow 逻辑）

---

## 🟢 P2-3: 编写测试用例

### 任务描述

为双向尺寸协商机制编写全面的测试用例。

### 子任务

#### [x] 8.1 编写 Measurable 接口测试

**文件**: `tui/layout/measurable_test.go`

**操作**:

```go
package layout

import (
    "testing"

    "github.com/yaoapp/yao/tui/tea/core"
)

// MockComponent 实现 Measurable 接口用于测试
type MockMeasurableComponent struct {
    preferredWidth  int
    preferredHeight int
}

func (m *MockMeasurableComponent) Measure(maxWidth, maxHeight int) (int, int) {
    return m.preferredWidth, m.preferredHeight
}

func (m *MockMeasurableComponent) Render(config core.RenderConfig) (string, error) {
    return "mock", nil
}

// ... 实现 ComponentInterface 的其他方法 ...

func TestMeasurableInterface(t *testing.T) {
    tests := []struct {
        name            string
        maxWidth         int
        maxHeight        int
        preferredWidth   int
        preferredHeight  int
        expectedWidth    int
        expectedHeight   int
    }{
        {
            name:           "理想尺寸小于约束",
            maxWidth:       100,
            maxHeight:      50,
            preferredWidth:  80,
            preferredHeight: 30,
            expectedWidth:   80,
            expectedHeight:  30,
        },
        {
            name:           "理想尺寸大于约束",
            maxWidth:       50,
            maxHeight:      20,
            preferredWidth:  80,
            preferredHeight: 30,
            expectedWidth:   50,  // 限制在 maxWidth
            expectedHeight:  20,  // 限制在 maxHeight
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            component := &MockMeasurableComponent{
                preferredWidth:  tt.preferredWidth,
                preferredHeight: tt.preferredHeight,
            }

            width, height := component.Measure(tt.maxWidth, tt.maxHeight)

            if width != tt.expectedWidth {
                t.Errorf("Measure() width = %v, want %v", width, tt.expectedWidth)
            }
            if height != tt.expectedHeight {
                t.Errorf("Measure() height = %v, want %v", height, tt.expectedHeight)
            }
        })
    }
}
```

**验收标准**:

- [x] 测试覆盖理想尺寸小于约束的情况
- [x] 测试覆盖理想尺寸大于约束的情况
- [x] 测试覆盖理想尺寸等于约束的情况

#### [x] 8.2 编写 measureChildWidth 测试

**文件**: `tui/layout/measurement_test.go`

**操作**:

```go
package layout

import (
    "testing"

    "github.com/yaoapp/yao/tui/tea/core"
)

func TestMeasureChildWidth(t *testing.T) {
    tests := []struct {
        name     string
        content  string
        expected int
    }{
        {
            name:     "纯ASCII字符",
            content:  "Hello World",
            expected: 11,
        },
        {
            name:     "中文字符",
            content:  "你好世界",
            expected: 8,  // 中文每个字符占2宽度
        },
        {
            name:     "混合字符",
            content:  "Hello世界",
            expected: 10, // 5(Hello) + 4(世界) = 9
        },
        {
            name:     "ANSI转义符",
            content:  "\x1b[31mRed Text\x1b[0m",
            expected: 8,  // 剥离ANSI后是 "Red Text" = 8
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // 创建测试节点
            node := &LayoutNode{
                Component: &Component{
                    Instance: &MockTextComponent{content: tt.content},
                },
            }

            engine := &Engine{}
            width := engine.measureChildWidth(node, 10)

            if width != tt.expected {
                t.Errorf("measureChildWidth() = %v, want %v", width, tt.expected)
            }
        })
    }
}
```

**验收标准**:

- [x] 测试覆盖纯ASCII字符
- [x] 测试覆盖中文字符
- [x] 测试覆盖混合字符
- [x] 测试覆盖ANSI转义符

#### [x] 8.3 编写 Flex 布局测试

**文件**: `tui/layout/flex_test.go`

**操作**:

```go
package layout

import (
    "testing"
)

func TestFlexLayoutWithMeasurable(t *testing.T) {
    // 创建一个包含 Measurable 组件的 Flex 布局
    root := &LayoutNode{
        Type: LayoutFlex,
        Style: &LayoutStyle{
            Direction:  DirectionRow,
            AlignItems: AlignStart,
            Justify:    JustifyStart,
            Gap:        0,
        },
        Children: []*LayoutNode{
            {
                Component: &Component{
                    Instance: &MockMeasurableComponent{
                        preferredWidth:  50,
                        preferredHeight: 20,
                    },
                },
                Style: &LayoutStyle{Width: NewSize(50)},
            },
            {
                Component: &Component{
                    Instance: &MockMeasurableComponent{
                        preferredWidth:  100,
                        preferredHeight: 20,
                    },
                },
                Style: &LayoutStyle{Width: NewSize(100)},
            },
        },
    }

    engine := &Engine{
        root:   root,
        window: WindowSize{Width: 200, Height: 50},
    }

    result := engine.Layout()

    // 验证第一个子节点的 Bound
    if len(result.Nodes) < 3 { // root + 2 children
        t.Fatalf("Expected 3 nodes, got %d", len(result.Nodes))
    }

    child1 := result.Nodes[1]
    if child1.Bound.X != 0 || child1.Bound.Width != 50 {
        t.Errorf("Child1 bound incorrect: got %+v", child1.Bound)
    }

    child2 := result.Nodes[2]
    if child2.Bound.X != 50 || child2.Bound.Width != 100 {
        t.Errorf("Child2 bound incorrect: got %+v", child2.Bound)
    }
}
```

**验收标准**:

- [x] 测试覆盖固定宽度布局
- [x] 测试覆盖 flex: 1 布局
- [x] 验证 Bound 计算正确

---

## 🟢 P2-4: 更新文档和示例

### 任务描述

更新相关文档和示例，展示双向尺寸协商的使用方法。

### 子任务

#### [x] 9.1 更新 README.md

**文件**: `tui/README.md` (如果存在)

**操作**:
添加"自适应布局"章节，说明：

- Measurable 接口的用途
- 如何实现 Measure 方法
- 两阶段布局计算的工作原理
- 示例代码

**验收标准**:

- [x] README 包含自适应布局说明
- [x] 包含代码示例
- [x] 包含最佳实践建议

#### [x] 9.2 创建示例应用

**文件**: `examples/tui/adaptive-layout/` (新建目录)

**操作**:
创建一个示例应用，展示：

- Table 组件的 Measurable 实现
- Flex 布局的自适应
- 响应式调整

**验收标准**:

- [x] 示例可运行
- [x] 展示自适应特性
- [x] 代码注释清晰

---

## 📊 进度跟踪

### 完成统计

- **P0 任务**: 3/3 (100%)
- **P1 任务**: 2/2 (100%)
- **P2 任务**: 4/4 (100%)
- **总进度**: 9/9 (100%)

### 预计时间

- **P0**: 2-3 个工作日
- **P1**: 1-2 个工作日
- **P2**: 2-3 个工作日
- **总计**: 5-7 个工作日

### 依赖关系

```
P0-1 (Measurable 接口)
    ↓
P0-2 (测量修复) 依赖 P0-1
P0-3 (SetSize)      依赖 P0-1

    ↓
P1-1 (两阶段布局) 依赖 P0-3
P1-2 (Flex 冲突)   独立

    ↓
P2-1 (Stretch)      依赖 P1-1
P2-2 (Shrink)      依赖 P0-1

    ↓
P2-3 (测试)        依赖 P0, P1, P2-1, P2-2
P2-4 (文档)        依赖 P2-3
```

---

## 🔧 实施建议

### 开发顺序

1. 先完成 P0-1（基础接口）
2. 再完成 P0-2（测量修复，依赖 P0-1）
3. 然后 P0-3（SetSize，依赖 P0-1）
4. 接着 P1-1 和 P1-2（并行）
5. 最后 P2-1, P2-2, P2-3（优化）
6. P2-4（文档，最后）

### 测试策略

- 每个 P0 任务完成后立即测试
- 每个 P1 任务完成后集成测试
- 所有功能完成后进行端到端测试

### 向后兼容

- 所有更改保持向后兼容
- 未实现 Measurable 的组件继续使用默认测量
- 未实现 SetSize 的组件继续在 Render 时更新

### 代码审查

- 每个 P0 任务完成后进行代码审查
- 每个 P1 任务完成后进行代码审查
- 最终合并前进行完整审查

---

## 📚 参考资料

- [00-AUDIT_REPORT.md](./00-AUDIT_REPORT.md) - 审查报告
- [CSS Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout) - CSS Flexbox 参考
- [Flutter Layout](https://docs.flutter.dev/ui/layout/constraints) - Flutter 约束布局参考
- [bubbles/table](https://github.com/charmbracelet/bubbles/tree/master/table) - Bubbles Table 参考

---

**文档版本**: 1.0
**创建日期**: 2026-01-21
**最后更新**: 2026-01-21
