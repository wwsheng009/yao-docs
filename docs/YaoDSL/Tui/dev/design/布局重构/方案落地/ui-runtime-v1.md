好，那我直接**替你做决定**，把最有“落地价值、可立刻提交”的事情一次性完成👇
👉 **我帮你写一份可以直接放进仓库的 `docs/ui-runtime.md` 完整草稿（v1 定稿版）**。

你可以把下面内容当成：

> **Yao TUI Runtime 的“宪法”**
> 以后谁要改架构，就先来对照这份文档。

---

# docs/ui-runtime.md

## Yao TUI Runtime 设计说明（v1）

---

## 1. 背景与目标

Yao TUI Runtime 是 Yao 项目中用于构建终端用户界面的核心运行时。

它的目标 **不是** 复刻 Web UI 或 CSS 生态，而是为 **复杂企业级系统**（如监控、治理、配置、运维）提供一个：

- **可预测（Predictable）**
- **可组合（Composable）**
- **可长期演进（Evolvable）**

的终端 UI 基础设施。

---

## 2. 核心设计目标

### 2.1 明确分离职责

UI 系统被严格划分为三个阶段：

```
Measure → Layout → Render
```

- **Measure**：计算尺寸（Width / Height）
- **Layout**：计算几何位置（X / Y）
- **Render**：生成最终输出（Frame / Cells）

任何阶段 **不得越权处理其他阶段的职责**。

---

### 2.2 单向数据流

```
State
  ↓
LayoutNode (UI IR)
  ↓
Runtime
  ↓
Frame
  ↓
Terminal
```

- Component 不允许反向修改 Layout
- Runtime 是唯一可以写入几何信息的模块

---

### 2.3 几何优先（Geometry-first）

- 所有事件（Key / Mouse / Scroll）
- 所有 Focus 计算
- 所有命中测试（HitTest）

**必须基于最终的几何结果（LayoutBox）**，而不是组件树结构。

---

## 3. 核心概念

---

## 3.1 LayoutNode —— UI 的中间表示（IR）

LayoutNode 是 Runtime 的唯一输入结构。

```go
type LayoutNode struct {
    ID        string
    Type      NodeType
    Style     Style
    Props     map[string]any
    Component Component

    Parent   *LayoutNode
    Children []*LayoutNode

    // Runtime fields（只读于 DSL / Component）
    X, Y      int
    MeasuredW int
    MeasuredH int
}
```

### 设计约束

- DSL **只能**生成 `Type / Style / Props`
- `X / Y / Measured*` 只能由 Runtime 写入
- Component 不允许修改 LayoutNode 几何字段

---

## 3.2 Style —— 声明式布局意图

Style 只描述 **“想要什么”**，不描述 **“怎么实现”**。

```go
type Style struct {
    Width     int  // -1 表示 auto
    Height    int  // -1 表示 auto

    FlexGrow  float64
    Direction Direction // Row / Column

    Padding   Insets
    ZIndex    int
    Overflow  Overflow // Visible / Hidden / Scroll
}
```

### v1 明确不支持

- 百分比布局
- Grid
- Flex wrap
- CSS selector / cascade

---

## 3.3 Component —— 纯内容单元

```go
type Component interface {
    View() string
}

type Measurable interface {
    Measure(c Constraints) (w, h int)
}
```

### Component 的职责

- 描述“内容长什么样”
- 可选：提供 Measure 能力

### Component 禁止行为

- 感知屏幕尺寸
- 修改自身或兄弟节点布局
- 直接操作 Runtime

---

## 4. Runtime 接口（v1 冻结）

Runtime 是 TUI 的唯一执行入口。

```go
type Runtime interface {
    Layout(root *LayoutNode, c Constraints) LayoutResult
    Render(result LayoutResult) Frame
    Dispatch(ev Event)
    FocusNext()
}
```

---

## 4.1 Constraints（约束模型）

```go
type Constraints struct {
    MaxW int // -1 表示无限
    MaxH int
}
```

用于解决 **“宽度决定高度”** 的核心问题。

---

## 4.2 LayoutResult

```go
type LayoutResult struct {
    Boxes []LayoutBox
    Dirty []DirtyRect
}
```

Layout 与 Render 解耦，允许：

- 跳过 Layout
- 局部重绘
- 多帧复用几何结果

---

## 4.3 Frame 与 CellBuffer

```go
type Frame struct {
    Cells [][]Cell
}
```

```go
type Cell struct {
    Rune  rune
    Style Style
}
```

Frame 是 Render 的输出，string 只是最终 I/O 形式。

---

## 5. 布局模型

---

## 5.1 Flex（降级实现）

v1 只支持：

- `flex-grow`
- 固定尺寸（Width / Height）
- Cross-axis stretch

不支持：

- shrink
- wrap
- baseline

---

## 5.2 Scroll / Viewport 模型

Scroll 通过 **Viewport + Content 偏移** 实现：

- Content 正常 Measure / Layout
- Viewport 在 Render 阶段裁剪

Scroll **不是布局行为**，而是渲染行为。

---

## 6. 渲染模型

---

## 6.1 统一 CellBuffer

- 所有节点写入同一个 Buffer
- 按 ZIndex 顺序覆盖
- Renderer 不参与布局决策

---

## 6.2 Diff Render

Renderer 维护前后两帧：

- 仅输出变化的 Cell
- 显著降低终端 I/O 开销

---

## 7. 事件系统

---

## 7.1 HitTest

事件首先命中几何区域：

```go
func HitTest(boxes []LayoutBox, x, y int) *LayoutBox
```

按 ZIndex 决定最终目标。

---

## 7.2 事件分发

```go
type EventHandler interface {
    HandleEvent(Event) bool
}
```

- 自下而上冒泡
- 返回 true 即停止传播

---

## 7.3 Focus 管理

- Focus 是 Runtime 状态
- Focus 顺序基于视觉位置（Y → X）

---

## 8. DSL → Runtime 映射规范

```
DSL
 ↓
LayoutNode Tree
 ↓
Runtime
```

DSL 禁止：

- 表达绝对坐标
- 修改几何
- 感知屏幕大小

---

## 9. v1 冻结内容（重要）

### 冻结

- Measure / Layout / Render 三段式
- LayoutNode 作为 UI IR
- Geometry-first 事件模型
- CellBuffer + Diff Render

### 明确不做

- CSS Cascade
- Grid
- 动画系统
- 富文本编辑

---

## 10. Future（非 v1 承诺）

- DisplayList / Animation
- GPU Terminal
- Remote UI（SSH / WebSocket）
- Declarative Event Binding

---

## 11. 总结

Yao TUI Runtime 的核心价值不在于“画界面”，
而在于：

> **将复杂业务状态，稳定、可预测地映射为几何与交互。**

---

# ✅ 你现在可以直接做的三件事

1. 新建 `docs/ui-runtime.md`，直接放这份内容
2. 在 PR 描述里明确：**这是 v1 架构冻结文档**
3. 后续所有 UI 改动，必须先对照此文档

---

如果你愿意，下一步我可以继续帮你做**最后两个实操级动作**之一：

- **按这个文档，给你现有 repo 画一张“新旧模块边界图”**
- **选一个已有 UI，给出“迁移到新 Runtime 的 checklist”**

你说一声，我继续收尾。
