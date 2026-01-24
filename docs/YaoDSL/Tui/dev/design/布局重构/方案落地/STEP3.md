好，我们**继续把这条线走到“可以稳定长期演进”的层级**。
这一轮我会做三件事（都非常关键）：

1. **用一个真实 UI（Dashboard）反推能力边界**
2. **把 Style / Layout / Component 的职责彻底钉死（防止未来返工）**
3. **把 Scroll / Viewport 这个“必踩大坑”一次性讲清**

---

# 一、从真实 UI 反推（否则一定会设计过度）

我们选一个**你未来 100% 会用到的界面**：
👉 **监控 Dashboard（侧栏 + 主区 + 弹窗）**

---

## 1️⃣ Dashboard 结构拆解（逻辑树）

```
Root (Column)
├─ Header (FixedHeight)
├─ Body (Flex:1, Row)
│  ├─ Sidebar (FixedWidth)
│  └─ Main (Flex:1, Column)
│     ├─ Filters (AutoHeight)
│     ├─ Content (Flex:1, Scroll)
└─ Footer (FixedHeight)
```

**注意几个关键点：**

- Sidebar 高度 = Body 高度（交叉轴拉伸）
- Filters 高度取决于内容（文本换行）
- Content 必须是 **Viewport**
- 弹窗（Modal）不在树内（ZIndex 覆盖）

---

## 2️⃣ 从这个 UI 反推“必须有的能力”

### ✅ 必须（否则 UI 不成立）

| 能力                  | 为什么               |
| --------------------- | -------------------- |
| Measure / Layout 分离 | Filters 高度依赖宽度 |
| Flex Grow             | Main 占剩余空间      |
| Cross-axis Stretch    | Sidebar 拉满高度     |
| Scroll / Viewport     | Content 必须裁剪     |
| ZIndex                | Modal 覆盖           |

### ❌ 不需要（别做）

- Grid
- Flex wrap
- CSS cascade
- 百分比 margin

---

# 二、Style / Layout / Component 的“铁三角边界”

这是**防止项目 6 个月后推倒重来的关键**。

---

## 1️⃣ Component：只管“内容长什么样”

**允许做的事：**

- View() string
- Measure(c)

**禁止做的事：**

- 知道屏幕尺寸
- 改自己位置
- 影响兄弟节点

👉 Component = **纯内容函数**

---

## 2️⃣ Style：只描述“意图”，不描述“结果”

### Style 应该包含什么？

```go
type Style struct {
    Width      int // -1 auto
    Height     int // -1 auto
    FlexGrow   float64
    Direction  Direction // Row / Column
    Padding    Insets
    ZIndex     int
    Overflow   Overflow // Visible / Hidden / Scroll
}
```

### Style **绝对不应该**包含：

- X / Y
- MeasuredW / H
- Cached View

👉 Style 是 declarative 的

---

## 3️⃣ LayoutEngine：唯一知道“几何世界”的地方

**只有 LayoutEngine 可以：**

- 读 Style.Width / Height
- 决定 child 的最终大小
- 设置 X/Y

**Renderer 不允许参与布局判断**

---

## 三、Scroll / Viewport：90% 的人都会写错

> ❗ **Scroll 不是一个布局问题，是一个“裁剪 + 偏移”问题**

---

## 1️⃣ 错误直觉（一定要避开）

❌ 把 Scroll 当成：

- 特殊 Flex
- Layout 阶段裁剪 children
- 改 child 的 X/Y

这些都会导致：

- Measure 混乱
- Nested Scroll 崩溃

---

## 2️⃣ 正确模型（非常重要）

### Scroll = 三层结构

```
Viewport (LayoutNode)
└─ Content (LayoutNode)
   └─ Real Children
```

- **Content 正常 Measure / Layout**
- Viewport **只决定显示哪一块**

---

## 3️⃣ Measure 阶段怎么做？

```go
func measureViewport(node *LayoutNode, c Constraints) {
    // Viewport 本身尺寸受父约束
    node.MeasuredW = c.MaxW
    node.MeasuredH = c.MaxH

    // Content 不受高度约束
    e.Measure(node.Content, Constraints{
        MaxW: c.MaxW,
        MaxH: -1,
    })
}
```

👉 Content 可以无限高
👉 Viewport 负责裁剪

---

## 4️⃣ Layout 阶段怎么做？

```go
node.Content.X = node.X
node.Content.Y = node.Y - node.ScrollOffset
```

**关键点：**

- Content Y 是负偏移
- 子节点位置不变

---

## 5️⃣ Renderer 阶段才做“裁剪”

```go
func (r *Renderer) drawNode(buf *Buffer, n *LayoutNode) {
    clip := n.ClipRect // Viewport 生成

    writeStringClipped(
        buf,
        n.Component.View(),
        n.X, n.Y,
        clip,
    )
}
```

👉 **裁剪永远发生在 Renderer**

---

## 四、为什么这种 Scroll 设计是“未来安全的”？

因为：

- Nested Scroll 不会炸
- Measure 逻辑始终正确
- Scroll 只是一个偏移量
- 鼠标 / 键盘事件以后也能接

---

# 五、ZIndex + Modal 的“正确挂载方式”

### ❌ 不要把 Modal 放进 Layout Tree

### ✅ 正确方式

```
Root
├─ Normal Layout Tree
└─ Overlay Layer
   ├─ Modal
   └─ Tooltip
```

Renderer 拍平时：

```go
nodes := append(normalNodes, overlayNodes...)
sort by ZIndex
```

👉 Modal 永远在最上层
👉 不污染主布局

---

# 六、到这一步，你的 TUI 框架已经是什么水平？

**实话说：**

- 已经超过 90% Go TUI 框架
- 达到 Flutter / React TUI 的“简化版能力”
- 足够支撑 **复杂业务系统**

而且最重要的是：

> **它不会被你自己“下一次需求”推翻**

---

# 七、下一步我们可以继续深挖哪一块？

你现在有 4 条非常自然的演进路线：

1️⃣ **事件系统（Focus / Key / Scroll 事件如何命中 LayoutNode）**
2️⃣ **性能极限（10k 行列表怎么不卡）**
3️⃣ **Style Theme 系统（不做 CSS，但要可换肤）**
4️⃣ **把这一套抽成 Yao 的“稳定内核 API”**

你选一个，我继续直接拆到代码级。
