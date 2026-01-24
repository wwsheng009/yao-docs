好，那我们**真正进入“最后一公里”**：
这一轮我不再扩散新概念，而是**把前面所有讨论收敛成「可以直接落地 + 可以写进仓库」的最终成果**。

你可以把这一轮当成：

> **Yao TUI 内核 v1 的“定稿评审”**

---

# 🎯 本轮目标（非常明确）

1. **给你一份可以直接放进 repo 的《Yao TUI Runtime 设计说明》核心内容**
2. **给出一个完整、闭环的实例：DSL → LayoutNode → Runtime → Frame**
3. **明确 v1 必须冻结的内容 & 明确 v2 才允许碰的内容**

这一步做完，你这个方向就**不会再发散**了。

---

## 一、Yao TUI Runtime 的“官方设计说明（精简版）”

下面这部分内容，你可以**几乎原封不动写进 `docs/ui-runtime.md`**。

---

## 1️⃣ 设计目标（Design Goals）

> Yao TUI Runtime 的目标不是复刻 Web UI，
> 而是为 **复杂业务系统** 提供一个：
>
> - 可预测（Predictable）
> - 可组合（Composable）
> - 可演进（Evolvable）
>
> 的终端 UI 运行时。

---

## 2️⃣ 核心设计原则（必须写清楚）

### 2.1 三阶段渲染模型

```text
Measure → Layout → Render
```

- **Measure**：只计算尺寸，不关心位置
- **Layout**：只计算几何，不生成输出
- **Render**：只负责绘制，不参与布局决策

> ❗ 任何违反此原则的代码，视为架构缺陷

---

### 2.2 单向数据流

```text
State → LayoutNode → Runtime → Frame → Terminal
```

- Component 不得反向修改 Layout
- Runtime 是唯一有权修改几何的实体

---

### 2.3 几何优先（Geometry-first）

- 所有交互（事件 / Focus / Scroll）
- 必须基于 **最终 LayoutBox**
- 而不是基于组件树结构

---

## 二、核心数据结构（冻结）

下面这些结构，**v1 发布后不允许破坏性修改**。

---

## 1️⃣ LayoutNode（UI 的中间表示）

```go
type LayoutNode struct {
    ID        string
    Type      NodeType
    Style     Style
    Props     map[string]any
    Component Component

    Parent   *LayoutNode
    Children []*LayoutNode

    // Runtime fields
    X, Y           int
    MeasuredW      int
    MeasuredH      int
}
```

### 关键约束

- DSL 只能生成 `Type / Style / Props`
- `X / Y / Measured*` 只能由 Runtime 写入

---

## 2️⃣ Style（声明式布局意图）

```go
type Style struct {
    Width     int  // -1 auto
    Height    int  // -1 auto
    FlexGrow  float64
    Direction Direction // Row / Column

    Padding   Insets
    ZIndex    int
    Overflow  Overflow // Visible / Hidden / Scroll
}
```

❌ v1 明确不支持：

- 百分比
- Grid
- Wrap
- CSS Selector

---

## 3️⃣ Runtime 接口（对外唯一入口）

```go
type Runtime interface {
    Layout(root *LayoutNode, c Constraints) LayoutResult
    Render(result LayoutResult) Frame
    Dispatch(ev Event)
    FocusNext()
}
```

---

## 三、完整闭环示例（这是最重要的部分）

下面我们走一遍 **从 DSL 到屏幕输出** 的完整链路。

---

## 1️⃣ 示例 DSL（JSON / Yao DSL）

```json
{
  "type": "column",
  "children": [
    { "type": "header", "props": { "title": "SAP Monitor" } },
    {
      "type": "row",
      "style": { "flex": 1 },
      "children": [
        { "type": "sidebar", "style": { "width": 20 } },
        {
          "type": "column",
          "style": { "flex": 1 },
          "children": [
            { "type": "text", "props": { "value": "System Status" } },
            {
              "type": "list",
              "style": { "flex": 1, "overflow": "scroll" }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 2️⃣ DSL → LayoutNode（构建 IR）

```go
func BuildNode(d DSLNode) *LayoutNode {
    node := &LayoutNode{
        ID:    uuid.New().String(),
        Type:  d.Type,
        Style: ParseStyle(d.Style),
        Props: d.Props,
    }

    node.Component = CreateComponent(node.Type, node.Props)

    for _, c := range d.Children {
        child := BuildNode(c)
        child.Parent = node
        node.Children = append(node.Children, child)
    }

    return node
}
```

📌 **这里没有任何布局逻辑**

---

## 3️⃣ Runtime.Layout（计算几何）

```go
result := runtime.Layout(root, Constraints{
    MaxW: termWidth,
    MaxH: termHeight,
})
```

输出：

```go
type LayoutResult struct {
    Boxes []LayoutBox
    Dirty []DirtyRect
}
```

---

## 4️⃣ Runtime.Render（生成 Frame）

```go
frame := runtime.Render(result)
```

```go
type Frame struct {
    Cells [][]Cell
}
```

---

## 5️⃣ Frame → Terminal

```go
terminal.DrawDiff(frame)
```

---

## 四、v1 必须冻结的内容（非常重要）

### ✅ v1 冻结

- Measure / Layout / Render 三段式
- LayoutNode 作为 IR
- Geometry-first 事件模型
- CellBuffer + Diff Render

---

### ❌ v1 明确不做

- CSS Cascade
- Grid Layout
- 动画系统
- 富文本编辑

> 这些 **写进文档，明确拒绝**

---

## 五、v2 才允许探索的方向（留好口子）

你可以在文档最后加一个「Future」章节：

- DisplayList / Animation
- Declarative Event Binding
- GPU Terminal（WezTerm / Kitty）
- Remote UI（SSH / WebSocket）

---

## 六、站在“项目负责人”的最终评价

我用一句非常实在的话收尾：

> **你现在这套方案，已经不是“技术可不可行”的问题**
> **而是“是否值得作为 Yao 的长期核心能力”的问题**

而从：

- 你的业务背景（SAP / 运维 / 监控）
- Yao 的定位（企业级、低代码、治理系统）
- 终端 UI 的现实需求

👉 **这是一个高度匹配、且很难被替代的方向**

---

## 最后一个问题（也是唯一一个）

你更希望我下一步做哪一件 **“可直接提交到仓库”** 的事情？

1️⃣ **直接帮你写一份 `docs/ui-runtime.md` 完整草稿**
2️⃣ **按你当前 repo 结构，给出目录级重构建议（含文件名）**
3️⃣ **选一个现有 Yao UI，给出“迁移到新 Runtime”的实操步骤清单**

你选一个，我直接帮你把“最后一块砖”砌上去。
