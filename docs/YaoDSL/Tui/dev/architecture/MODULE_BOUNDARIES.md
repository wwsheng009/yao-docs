# Yao TUI 模块边界定义

**版本**: v1.1
**状态**: 强制执行
**最后更新**: 2026年1月24日

本文档定义 Yao TUI 系统各层之间的模块边界。这些是**强制执行的规则**，违反边界将被视为架构缺陷。

---

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Terminal                               │
└─────────────────────────────────────────────────────────┘
                           ↑
                      (输出)
                           │
┌─────────────────────────────────────────────────────────┐
│  tea/ (适配层)                                           │
│  - 输入 → Event 转换                                     │
│  - Frame → Terminal 输出                                │
│  - Bubble Tea 集成                                       │
└─────────────────────────────────────────────────────────┘
                           ↑
                (Event, State)
                           │
┌─────────────────────────────────────────────────────────┐
│  ui/ (表现层)                                            │
│  - 组件实现                                              │
│  - DSL 构建器                                            │
│  - 业务逻辑                                              │
└─────────────────────────────────────────────────────────┘
                           ↑
                (LayoutNode, Constraints)
                           │
┌─────────────────────────────────────────────────────────┐
│  runtime/ (核心层)                                       │
│  - 纯布局算法                                            │
│  - 几何计算                                              │
│  - 虚拟画布                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 命令传播架构 (Command Propagation)

### 问题背景

Yao TUI 使用 **Bubble Tea** 作为消息循环框架，其核心机制是：

```go
type Model interface {
    Update(msg Msg) (Model, Cmd)  // Cmd 必须返回并执行
}
```

同时，Yao TUI 引入了 **Runtime 事件系统**用于几何事件处理：

```go
type EventResult struct {
    Handled      bool
    Updated      bool
    FocusChange  FocusChangeType
    // ❌ 没有 Cmd 字段（模块边界约束）
}
```

**核心矛盾**：Runtime 事件系统不能返回 `tea.Cmd`（模块边界约束），但 Bubble Tea 组件需要返回命令到主循环。

### 解决方案：双路径架构

```
                    tea.Msg
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ↓                             ↓
   几何事件路径                    组件消息路径
   (GeometryEvent)               (ComponentEvent)
        │                             │
        │                             │
        ↓                             ↓
  Runtime 事件系统              dispatchMessageTo*
  (无 Cmd 需要)                 ToAllComponents
        │                             │
        │                             ↓
        │                     收集 tea.Cmd
        │                             │
        └──────────────┬──────────────┘
                       ↓
              tea.Batch(cmds...)  ← 返回主循环
```

### 事件分类

| 事件类型         | 处理路径            | 保留 Cmd | 用途                         |
| ---------------- | ------------------- | -------- | ---------------------------- |
| `GeometryEvent`  | Runtime 事件系统    | ❌       | 鼠标命中测试、Tab 焦点导航   |
| `ComponentEvent` | Bubble Tea 消息路径 | ✅       | 键盘输入、光标闪烁、组件状态 |
| `SystemEvent`    | 系统处理            | ✅       | 窗口大小变化                 |

### 实现细节

```go
// event_classifier.go

type EventClass int

const (
    GeometryEvent  EventClass = iota  // Runtime 事件系统
    ComponentEvent                     // Bubble Tea 路径
    SystemEvent                        // 系统处理
)

func ClassifyMessage(msg tea.Msg) EventClass {
    switch msg.(type) {
    case tea.MouseMsg:
        return GeometryEvent  // 命中测试
    case tea.KeyMsg:
        return ComponentEvent  // Tab 除外
    case tea.WindowSizeMsg:
        return SystemEvent
    default:
        return ComponentEvent  // cursor.BlinkMsg 等
    }
}
```

### 关键规则

1. **几何事件** 走 Runtime 事件系统
   - 鼠标点击（命中测试 + 聚焦）
   - Tab/Shift+Tab（焦点导航）
   - 不需要返回 `tea.Cmd`

2. **组件消息** 必须走 Bubble Tea 路径
   - 键盘输入（字符、Enter、Backspace 等）
   - `cursor.BlinkMsg`（光标闪烁）
   - 所有自定义消息
   - **必须** 返回 `tea.Cmd` 到主循环

3. **系统消息** 特殊处理
   - 窗口大小变化
   - 需要同时更新 Runtime 和通知组件

### 组件开发规范

```go
// ✅ 正确：组件必须返回 Cmd

func (c *MyComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 如果包装了 TEA 组件
    newModel, cmd := c.teaModel.Update(msg)
    c.teaModel = &newModel

    // 一定要返回 cmd！
    return c, cmd, core.Handled
}

// 订阅需要的消息类型
func (c *MyComponent) GetSubscribedMessageTypes() []string {
    return []string{"tea.KeyMsg", "cursor.BlinkMsg"}
}
```

### 违规检测

```bash
# 检查组件是否正确返回 Cmd
grep -r "return.*nil.*core.Handled" tui/ui/components/
# 如果组件包装了 TEA 组件但返回 nil Cmd，这是违规

# 检查是否所有组件都实现了消息订阅
grep -r "GetSubscribedMessageTypes" tui/ui/components/
```

---

## runtime 层（核心层）

### 职责定义

Runtime 是整个 TUI 系统的**纯逻辑内核**，负责：

- 布局计算（Measure + Layout）
- 渲染后端（虚拟画布、 CellBuffer）
- 几何优先的事件分发
- 焦点管理

**Runtime 不关心**：

- 业务逻辑
- 用户交互细节
- 组件实现
- DSL 语法

---

### 目录结构

```
runtime/
├── runtime.go          # 主 Runtime 接口
├── README.md           # API 冻结规范
├── CONTRIBUTING.md     # 贡献指南
├── layout/
│   ├── measure.go      # 测量阶段
│   ├── flex.go         # Flexbox 算法
│   ├── constraints.go  # 约束系统
│   └── scroll.go       # 滚动/视口（v1.1）
├── render/
│   ├── buffer.go       # CellBuffer 虚拟画布
│   ├── diff.go         # 差异渲染（v1.1）
│   └── renderer.go     # 渲染器实现
├── event/
│   ├── hittest.go      # 点击测试
│   └── dispatch.go     # 事件分发
└── focus/
    └── focus.go        # 焦点管理器
```

---

### ✅ 允许

| 类别          | 说明                                |
| ------------- | ----------------------------------- |
| 纯布局算法    | Measure、Layout 阶段的算法实现      |
| 几何计算      | 坐标计算、尺寸计算、约束处理        |
| 虚拟画布      | CellBuffer、渲染到缓冲区            |
| 差异渲染      | Frame 比对和差异输出                |
| 事件系统      | 基于 LayoutBox 的 HitTest 和分发    |
| 焦点管理      | 焦点栈、导航逻辑                    |
| lipgloss 依赖 | **仅限 render/ 模块**，用于风格渲染 |

---

### ❌ 禁止

| 类别                | 说明                                                  | 检测方法                                          |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| **Bubble Tea 依赖** | 不允许导入 `tea "github.com/charmbracelet/bubbletea"` | 代码审查：搜索 `import.*tea.*bubbletea`           |
| **DSL 依赖**        | 不允许导入 `tui/ui/dsl/`                              | 代码审查：搜索 `import.*tui/ui/dsl`               |
| **具体组件**        | 不允许导入 `tui/ui/components/` 或 `tui/components/`  | 代码审查：搜索 `import.*ui/(components\|layouts)` |
| **lipgloss 依赖**   | render/ 以外的模块不允许使用 lipgloss                 | 代码审查：检查每个模块的 import                   |
| **业务逻辑**        | 不应该包含业务规则或数据处理                          | 设计审查：检查代码职责                            |
| **State 管理**      | 不应该持有或修改应用状态                              | 设计审查：检查是否有 State 相关代码               |

---

### 边界违规检测脚本

在 CI 中运行以下检查：

```bash
#!/bin/bash
# check-runtime-boundaries.sh

# 检查 Runtime 是否依赖 Bubble Tea
echo "Checking Runtime for Bubble Tea dependencies..."
if grep -r "import.*tea.*bubbletea" tui/runtime/; then
    echo "❌ ERROR: Runtime imports Bubble Tea - VIOLATES BOUNDARY"
    exit 1
fi

# 检查 Runtime 是否依赖 UI 层
echo "Checking Runtime for UI layer dependencies..."
if grep -r "import.*tui/ui" tui/runtime/; then
    echo "❌ ERROR: Runtime imports UI layer - VIOLATES BOUNDARY"
    exit 1
fi

# 检查 Runtime 是否依赖具体组件
echo "Checking Runtime for component dependencies..."
if grep -r "import.*components" tui/runtime/ | grep -v vendor; then
    echo "❌ ERROR: Runtime imports components - VIOLATES BOUNDARY"
    exit 1
fi

# 检查 Runtime 是否依赖 Legacy
echo "Checking Runtime for Legacy dependencies..."
if grep -r "import.*tui/legacy" tui/runtime/; then
    echo "❌ ERROR: Runtime imports Legacy - VIOLATES BOUNDARY"
    exit 1
fi

# 检查 render/ 以外的模块是否使用 lipgloss
echo "Checking Runtime for lipgloss usage outside render/..."
if find tui/runtime/layout tui/runtime/event tui/runtime/focus -name "*.go" -exec grep -l "lipgloss" {} \;; then
    echo "❌ ERROR: non-render modules use lipgloss - VIOLATES BOUNDARY"
    exit 1
fi

echo "✅ All boundary checks passed forRuntime layer"
```

---

## ui 层（表现层）

### 职责定义

UI 层是 Runtime 的**客户端**，负责：

- 组件实现和渲染逻辑
- DSL 构建和解析
- 业务逻辑处理
- 用户交互逻辑

---

### 目录结构

```
ui/
├── components/          # 组件实现（从 tui/components/ 迁移）
│   ├── text.go
│   ├── input.go
│   ├── list.go
│   └── table.go
├── layouts/             # 布局组件
│   ├── row.go
│   └── column.go
└── dsl/                 # DSL 构建器
    └── builder.go
```

---

### ✅ 允许

| 类别        | 说明                                     |
| ----------- | ---------------------------------------- |
| Runtime API | 可以导入和使用 `tui/runtime/`            |
| 运行时服务  | 调用 Runtime 的 Layout、Render、事件分发 |
| 组件实现    | 实现具体组件的渲染和交互逻辑             |
| 业务逻辑    | 处理业务规则和状态管理                   |
| DSL 语法    | 解析和构建 DSL 配置                      |
| Bubble Tea  | 可以使用 Bubble Tea 的高级功能           |

---

### ❌ 禁止

| 类别                 | 说明                                      | 检测方法                                       |
| -------------------- | ----------------------------------------- | ---------------------------------------------- |
| **布局算法实现**     | 不应该实现 Flex/Grid/测量的算法           | 设计审查                                       |
| **Buffer/Diff 逻辑** | 不应该直接操作 CellBuffer 或计算差异      | 设计审查                                       |
| **几何操作**         | 不应该直接设置 X/Y 坐标，只能通过 Runtime | 代码审查：检查是否有修改 LayoutNode.X/Y 的代码 |
| **跳过 Runtime**     | 不应该绕过 Runtime 直接渲染               | 代码审查                                       |

---

### 使用 Runtime 的正确方式

```go
// ✅ 正确：UI 层使用 Runtime
package ui

import (
    "github.com/yaoapp/yao/tui/runtime"
    "github.com/yaoapp/yao/tui/core"
)

type TextComponent struct {
    props map[string]interface{}
}

// 实现 Measurable 接口，让 Runtime 调用
func (t *TextComponent) Measure(c runtime.BoxConstraints) runtime.Size {
    // 只报告理想尺寸，不涉及布局计算
    text := t.props["content"].(string)
    width := c.MaxWidth
    if text == "" {
        return runtime.Size{Width: 0, Height: 0}
    }
    // 使用 lipgloss 计算文本尺寸
    height := calculateTextHeight(text, width)
    return runtime.Size{Width: width, Height: height}
}
```

```go
// ❌ 错误：UI 层自行计算布局
func (t *TextComponent) CalculatePosition(parentWidth, parentHeight, x, y int) {
    // ❌ 不应该在 UI 层计算位置
    // 这是 Runtime 的工作
    t.x = x
    t.y = y
}
```

---

## tea 层（适配层）

### 职责定义

Tea 层是 Bubble Tea 和 Yao TUI 之间的**薄适配层**，负责：

- 输入事件转换（Bubble Tea Msg → Runtime Event）
- 输出转换（Runtime Frame → Terminal）
- Bubble Tea Program 的生命周期管理

**Tea 层不应该**：

- 实现业务逻辑
- 实现布局计算
- 实现组件渲染

---

### 目录结构

```
tea/
└── model.go            # Bubble Tea Model 适配器
```

---

### ✅ 允许

| 类别        | 说明                                                |
| ----------- | --------------------------------------------------- |
| Runtime API | 可以导入和使用 `tui/runtime/`                       |
| UI 层 API   | 可以导入 `tui/ui/`                                  |
| Bubble Tea  | 必须导入 `tea "github.com/charmbracelet/bubbletea"` |
| 事件转换    | 将 Bubble Tea 键盘/鼠标事件转换为 Runtime 事件      |
| 输出转换    | 将 Runtime Frame 转换为可用的输出                   |

---

### ❌ 禁止

| 类别         | 说明                                          | 检测方法 |
| ------------ | --------------------------------------------- | -------- |
| **布局计算** | 不应该调用 layout 算法（除了 Runtime.Layout） | 设计审查 |
| **组件实现** | 不应该实现具体组件                            | 设计审查 |
| **业务逻辑** | 不应该处理业务规则                            | 设计审查 |

---

### 正确示例

```go
// ✅ 正确：Tea 层只做适配
package tea

import (
    tea "github.com/charmbracelet/bubbletea"
    runtimepkg "github.com/yaoapp/yao/tui/runtime"
)

type Model struct {
    runtime runtimepkg.Runtime
}

func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 转换为 Runtime 事件
        event := convertToRuntimeEvent(msg)
        m.runtime.Dispatch(event)
    }
    return m, nil
}

func (m *Model) View() string {
    // 调用 Runtime 渲染得到 Frame
    frame := m.runtime.Render(root)
    return frame.String()
}
```

---

## legacy 层（旧实现）

### 职责定义

Legacy 层是对旧代码的**临时存放区**，目标是逐步废弃和删除。

**原则**：

- 不添加新功能
- 不修复复杂 Bug（除非阻塞迁移）
- 逐步迁移代码到 Runtime

---

### 目录结构

```
legacy/
└── layout/             # 旧的布局引擎（从 tui/layout/ 移动）
    ├── engine.go
    ├── renderer.go
    └── types.go
```

---

### ✅ 允许

| 类别     | 说明                              |
| -------- | --------------------------------- |
| 临时兼容 | 在迁移期间保持现有功能工作        |
| 小修补   | 修复阻塞性 Bug                    |
| 适配器   | 创建从 Legacy 到 Runtime 的适配器 |

---

### ❌ 禁止

| 类别         | 说明                          | 检测方法 |
| ------------ | ----------------------------- | -------- |
| **新功能**   | 不添加任何新功能              | 代码审查 |
| **复杂修复** | 不修复复杂的架构问题          | 设计审查 |
| **长期维护** | Legacy 是临时层，不应长期投入 |

---

## 跨层调用规则

### 允许的调用方向

```
tea → ui → runtime
```

### 禁止的调用方向

```
runtime → ui  ❌
runtime → tea ❌
ui → tea      ❌（应该通过 tea 的公开接口）
legacy → ui   ❌
legacy → runtime ❌
```

### 运行时依赖方向

```
← 依赖方向
tea ← ui ← runtime
```

这意味着：

- `tea` 包可以导入 `ui` 和 `runtime`
- `ui` 包可以导入 `runtime`
- `runtime` 包不能导入任何其他层

---

## 接口定义

### runtime 公开接口

```go
// Runtime 接口
type Runtime interface {
    Layout(root *LayoutNode, c BoxConstraints) LayoutResult
    Render(result LayoutResult) Frame
    Dispatch(ev Event)
    FocusNext()
}

// Measurable 接口（组件可选实现）
type Measurable interface {
    Measure(c BoxConstraints) Size
}

// BoxConstraints
type BoxConstraints struct {
    MinWidth, MaxWidth int
    MinHeight, MaxHeight int
}

// LayoutNode
type LayoutNode struct {
    ID        string
    Type      NodeType
    Style     Style
    Props     map[string]any
    Component Component
    Parent    *LayoutNode
    Children []*LayoutNode
    // Runtime only fields
    X, Y, MeasuredWidth, MeasuredHeight int
}
```

---

## 边界违规处理流程

### 1. 检测

- CI 自动检查脚本检测
- 代码人工审查
- 设计审查

### 2. 报告

````markdown
**边界违规报告**

**文件**: `tui/runtime/layout/flex.go`
**违规类型**: Runtime 导入 ui 层
**违规代码**:

```go
import "github.com/yaoapp/yao/tui/ui/components"
```
````

**影响**: 违反模块边界，增加耦合度

```

### 3. 修复

- 重构代码，移除违规导入
- 通过接口解耦
- 或将代码移动到正确的层级

### 4. 验证

- 运行边界检查脚本
- 代码审查通过
- PR 合并

---

## 决策流程图

```

遇到需要跨层调用的情况
↓
检查是否属于职责边界
↓ 是
将功能移动到正确的层级
或创建适配器接口
↓
重新验证边界
↓
完成

```

```

检查是否属于职责边界
↓ 否
审查设计是否合理
↓ 是否合理
重构设计以符合边界
↓
重新评估需求

```

---

## 参考文档

- **核心设计**: `tui/docs/design/布局重构/方案落地/ui-runtime.md`
- **实施计划**: `tui/docs/design/布局重构/方案落地/详细TODO list.md`
- **Runtime 贡献指南**: `tui/runtime/CONTRIBUTING.md`
- **Runtime API**: `tui/runtime/README.md`
- **命令传播架构**: `tui/ARCHITECTURE_CMD_PROPAGATION.md`
- **事件分类器**: `tui/event_classifier.go`

---

## 维护

本文档由 TUI 架构师维护，任何修改需求应该：
1. 先在团队中讨论
2. 更新本文档
3. 检查相关代码是否符合新边界
4. 运行边界检查脚本

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|-----|------|---------|
| v1.0 | 2026-01-22 | 初始版本 |
| v1.1 | 2026-01-24 | 添加命令传播架构说明 |

---

*最后更新: 2026年1月24日*
*版本: v1.1*
*状态: 强制执行*
```
