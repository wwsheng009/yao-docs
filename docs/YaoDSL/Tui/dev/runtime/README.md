# Yao TUI Runtime

**版本**: v1 (冻结)
**最后更新**: 2026年1月22日

## 设计目标

Yao TUI Runtime 的目标不是复刻 Web UI，
而是为 **复杂业务系统** 提供一个：

- 可预测（Predictable）
- 可组合（Composable）
- 可演进（Evolvable）

的终端 UI 运行时。

---

## 核心设计原则

### 1. 三阶段渲染模型

```
Measure → Layout → Render
```

- **Measure**：只计算尺寸，不关心位置
- **Layout**：只计算几何，不生成输出
- **Render**：只负责绘制，不参与布局决策

> ❗ 任何违反此原则的代码，视为架构缺陷

---

### 2. 单向数据流

```
State → LayoutNode → Runtime → Frame → Terminal
```

- Component 不得反向修改 Layout
- Runtime 是唯一有权修改几何的实体

---

### 3. 几何优先（Geometry-first）

- 所有交互（事件 / Focus / Scroll）
- 必须基于 **最终 LayoutBox**
- 而不是基于组件树结构

---

## 核心数据结构（v1 冻结）

### LayoutNode（UI 的中间表示）

```go
type LayoutNode struct {
    ID        string
    Type      NodeType
    Style     Style
    Props     map[string]any
    Component Component

    Parent   *LayoutNode
    Children []*LayoutNode

    // Runtime fields（Runtime 只写）
    X, Y           int
    MeasuredWidth  int
    MeasuredHeight int
}
```

### 关键约束

- DSL 只能生成 `Type / Style / Props`
- `X / Y / Measured*` 只能由 Runtime 写入

---

### Style（声明式布局意图）

```go
type Style struct {
    Width     int  // -1 auto, -2~-101 表示 2%~101%
    Height    int  // -1 auto, -2~-101 表示 2%~101%
    FlexGrow  float64
    Direction Direction // Row / Column

    Padding   Insets
    Border    Insets  // v1.1: 物理边框，占用布局空间
    ZIndex    int
    Overflow  Overflow // Visible / Hidden / Scroll

    AlignItems Align     // v1: 交叉轴对齐
    Justify    Justify   // v1: 主轴对齐
    Gap        int       // v1: 子节点间距
}
```

### v1 明确不支持

- ❌ Grid（v2）
- ❌ Wrap（v2）
- ❌ CSS Selector
- ❌ 动画系统（v2）
- ❌ 富文本编辑（v2）

### v1.1 新增特性（2026-01-22）

#### Border 支持

Border 现在作为物理空间参与布局计算：

```go
// 设置 1 字符宽度的边框
style := runtime.NewStyle().WithBorderWidth(1)

// 设置不对称边框
style := runtime.NewStyle().WithBorder(runtime.Insets{
    Top:    1,
    Right:  2,
    Bottom: 1,
    Left:   2,
})
```

Border 会：

- ✅ 占用物理空间（从父容器可用空间中扣除）
- ✅ 影响子节点可用区域
- ✅ 被计入节点的总尺寸中

#### 百分比支持

Width/Height 现在支持百分比：

```go
// 50% 宽度
style := runtime.NewStyle().WithWidthPercent(50)

// 100% 高度
style := runtime.NewStyle().WithHeightPercent(100)
```

百分比编码：

- 负值 `-2` 到 `-101` 表示 `2%` 到 `101%`
- 在 measure 阶段自动解析为父容器约束的百分比

---

### BoxConstraints（约束系统）

```go
type BoxConstraints struct {
    MinWidth, MaxWidth   int
    MinHeight, MaxHeight int
}

func (bc BoxConstraints) IsTight() bool {
    return bc.MinWidth == bc.MaxWidth && bc.MinHeight == bc.MaxHeight
}

func (bc BoxConstraints) Constrain(width, height int) (int, int) {
    w := clamp(width, bc.MinWidth, bc.MaxWidth)
    h := clamp(height, bc.MinHeight, bc.MaxHeight)
    return w, h
}

func (bc BoxConstraints) Loosen() BoxConstraints {
    return BoxConstraints{
        MinWidth:  0,
        MaxWidth:  bc.MaxWidth,
        MinHeight: 0,
        MaxHeight: bc.MaxHeight,
    }
}
```

---

### Runtime 接口（对外唯一入口）

```go
type Runtime interface {
    Layout(root *LayoutNode, c Constraints) LayoutResult
    Render(result LayoutResult) Frame
    Dispatch(ev Event)
    FocusNext()
}
```

---

## 三阶段渲染流程

### Measure 阶段

```go
func (r *RuntimeImpl) measure(node *LayoutNode, c BoxConstraints) Size {
    // 1. 叶子节点：调用组件的 Measure 方法
    if len(node.Children) == 0 {
        if measurable, ok := node.Component.(Measurable); ok {
            return measurable.Measure(c)
        }
        return Size{Width: 0, Height: 0}
    }

    // 2. 容器节点：递归测量子节点
    var childSizes []Size
    for _, child := range node.Children {
        size := r.measure(child, childConstraints(c, node.Style))
        childSizes = append(childSizes, size)
    }

    // 3. 根据布局算法聚合尺寸
    return r.aggregateSizes(node, childSizes, c)
}
```

**关键规则**：

- ✅ 可以计算并存储 MeasuredWidth/Height
- ❌ 不能修改 X/Y
- ❌ 不能访问父容器的位置信息

---

### Layout 阶段

```go
func (r *RuntimeImpl) layout(node *LayoutNode, x, y int) {
    // 设置当前节点位置
    node.X = x
    node.Y = y

    // 根据布局算法分配子节点位置
    if node.Style.Direction == DirectionRow {
        r.layoutRow(node, x, y)
    } else {
        r.layoutColumn(node, x, y)
    }
}
```

**关键规则**：

- ✅ 可以分配 X/Y 坐标
- ✅ 可以计算 Bound（位置 + 尺寸）
- ❌ 不能修改 MeasuredWidth/Height
- ❌ 不能生成任何输出

---

### Render 阶段

```go
func (r *RuntimeImpl) render(root *LayoutNode) Frame {
    buffer := NewCellBuffer(r.width, r.height)

    // 按 Z-Index 排序
    nodes := flatten(root)
    sort.Sort(byZIndex(nodes))

    // 绘制到缓冲区
    for _, node := range nodes {
        r.drawNode(buffer, node)
    }

    return Frame{Buffer: buffer}
}
```

---

## Flexbox 算法

### 增强型 Flexbox（v1 简化版）

Yao TUI Runtime 实现了一个简化的 Flexbox 算法，专注于企业级 TUI 的核心需求。

### 支持的特性

#### v1（当前版本）

- ✅ Direction: Row / Column
- ✅ Flex-Grow: 比例分配剩余空间
- ✅ Justify: Start / Center / End / Space-Between / Space-Around / Space-Evenly
- ✅ AlignItems: Start / Center / End / Stretch
- ✅ Padding: 内边距
- ✅ Border: 边框（v1.1，物理占位）
- ✅ Gap: 子节点间距
- ✅ 百分比: Width/Height 百分比（v1.1）

#### v2（未来版本）

- 🔄 Flex-Shrink: 空间不足时的收缩（部分实现）
- 🔄 Flex-Basis: 初始尺寸
- 🔄 AlignSelf: 单独对齐
- 🔄 Wrap: 自动换行

---

## 虚拟画布

### CellBuffer

```go
type Cell struct {
    Char   rune
    Style  lipgloss.Style
    ZIndex int
    NodeID string // 用于点击测试
}

type CellBuffer struct {
    Cells  [][]Cell
    Width  int
    Height int
}

func (b *CellBuffer) SetContent(x, y int, z int, char rune, style lipgloss.Style, nodeID string)
func (b *CellBuffer) String() string
```

### Z-Index 支持

渲染引擎按 Z-Index 从小到大依次绘制，支持：

- ✅ Modal 覆盖主布局
- ✅ Popup / Tooltip
- ✅ 绝对定位元素正确层叠
- ✅ 透明度（通过 lipgloss.Style）

---

## 事件系统（几何优先）

### HitTest

```go
func (r *RuntimeImpl) HitTest(x, y int) *LayoutNode {
    // 基于 LayoutBox 而非组件树结构
    // 考虑 Z-Index，返回最上层节点
}
```

### 事件分发

```go
func (r *RuntimeImpl) Dispatch(ev Event) {
    node := r.HitTest(ev.X, ev.Y)
    if node != nil && node.Component != nil {
        node.Component.Update(ev)
    }
}
```

---

## 焦点管理

### 焦点管理器

```go
type FocusManager struct {
    nodes    []*LayoutNode    // 所有可聚焦节点
    focused  []*LayoutNode    // 当前聚焦栈
}

func (fm *FocusManager) FocusNext()
func (fm *FocusManager) FocusPrev()
func (fm *FocusManager) FocusByDirection(dir Direction)
```

### 键盘导航

- Tab / Shift+Tab: 焦点切换
- 箭头键: 方向导航
- Escape: 焦点清除

---

## 性能优化

### 差异渲染

```go
func (r *RuntimeImpl) RenderDiff(prevFrame, currFrame Frame) string {
    // 对比两个 Frame，只输出变化部分
    // 大幅减少终端 I/O
}
```

### 脏矩形

```go
func (r *RuntimeImpl) MarkDirty(node *LayoutNode) {
    // 标记节点及其子节点为脏
    // 只重新计算和绘制受影响区域
}
```

### 测量缓存

```go
type MeasureCache struct {
    cache map[string]Size
}

func (mc *MeasureCache) Get(node *LayoutNode, c BoxConstraints) (Size, bool)
func (mc *MeasureCache) Set(node *LayoutNode, c BoxConstraints, size Size)
```

---

## 模块边界（强制执行）

### runtime（核心层）

#### 允许

- ✅ 纯布局算法（Flex、Constraint）
- ✅ 几何计算
- ✅ 虚拟画布（CellBuffer）
- ✅ 差异渲染
- ✅ 事件分发（基于几何）
- ✅ 焦点管理

#### 禁止

- ❌ **禁止依赖 Bubble Tea**
- ❌ **禁止依赖 DSL**
- ❌ **禁止依赖具体组件**
- ❌ **禁止依赖 lipgloss**（Render 模块除外）

**原则**: Runtime 是纯逻辑内核

---

### ui（表现层）

#### 允许

- ✅ 可以依赖 runtime
- ✅ 可以使用 Runtime API
- ✅ 组件实现
- ✅ DSL 构建器

#### 禁止

- ❌ **不允许写布局算法**
- ❌ **不允许写 buffer / diff 逻辑**
- ❌ **不允许直接操作几何**

**原则**: UI 是 Runtime 的客户端

---

### tea（适配层）

#### 唯一职责

- 输入 → Event 转换
- Frame → Terminal 输出

---

## v2 未来方向

这些功能明确写明 **不在 v1 范围内**：

- DisplayList / 动画系统
- Declarative Event Binding
- GPU Terminal（WezTerm / Kitty）
- Remote UI（SSH / WebSocket）
- Grid 布局（v1 只支持 Flex）
- Wrap（自动换行）
- CSS Cascade（级联样式）

---

## API 冻结规则

### v1 API 稳定性

以下接口在 v1 发布后不允许破坏性修改：

1. **Runtime 接口**
2. **LayoutNode 结构**
3. **BoxConstraints 系统**
4. **Style 结构（v1 字段）**
5. **Measurable 接口**

### 扩展策略

- 新功能通过新接口/新方法添加
- 使用组合而非修改现有结构
- 遗弃字段通过注释标记，不直接删除

---

## 常见错误

### ❌ 错误 1：在 Measure 中计算位置

```go
// 错误示例
func (r *RuntimeImpl) measure(node *LayoutNode, c BoxConstraints) Size {
    node.X = calculateX() // ❌ Measure 不应该设置位置
    return size
}
```

### ❌ 错误 2：让 Component 知道 Scroll

```go
// 错误示例
func (c *ListComponent) Measure(c BoxConstraints) Size {
    available := parent.AvailableHeight - scrollOffset // ❌ Component 不应该知道滚动
    return availableSize
}
```

### ❌ 错误 3：Runtime 依赖具体组件

```go
// 错误示例
import "github.com/yaoapp/yao/tui/ui/components/list" // ❌ Runtime 不应该导入具体组件

type RuntimeImpl struct {
    listComponent *list.List // ❌ 违反边界
}
```

---

## 贡献指南

### 修改 Runtime 前必须：

1. ✅ 阅读 `CONTRIBUTING.md`
2. ✅ 确认修改不违反模块边界
3. ✅ 确保修改可向后兼容
4. ✅ 添加/更新测试
5. ✅ 运行性能基准 tests

### Pull Request 要求：

- 清晰的动机描述
- 设计文档引用
- 测试覆盖率 >90%
- 无性能回归

---

## 参考资料

### 设计文档

- `ui-runtime.md` - 核心设计文档
- `重构方案.md` - 技术细节
- `TODO.md` - 实施计划

### 实现文档

- `measure.go` - 测量阶段实现
- `flex.go` - Flexbox 算法
- `renderer.go` - 渲染器实现
- `buffer.go` - 虚拟画布

---

## 配置示例

### 1. 侧边栏布局 (Holy Grail)

```
┌─────────────────────────────────┐
│ Header                          │
├──────┬──────────────────────────┤
│      │                          │
│ Side │     Main Content          │
│ bar  │                          │
│      │                          │
├──────┴──────────────────────────┤
│ Footer                          │
└─────────────────────────────────┘
```

```yaml
layout:
  direction: column
  children:
    - type: header
      height: 3

    - type: layout
      direction: row
      flexGrow: 1
      children:
        - type: sidebar
          width: 20 # 固定宽度
        - type: main
          flexGrow: 1 # 占据剩余空间

    - type: footer
      height: 1
```

### 2. 卡片网格 (使用 Flex 组合)

```
┌────────┬────────┬────────┐
│ Card 1 │ Card 2 │ Card 3 │
├────────┼────────┼────────┤
│ Card 4 │ Card 5 │ Card 6 │
└────────┴────────┴────────┘
```

```yaml
layout:
  direction: column
  children:
    - type: row
      height: 10
      children:
        - type: card
          width: flex
        - type: card
          width: flex
        - type: card
          width: flex

    - type: row
      height: 10
      children:
        - type: card
          width: flex
        - type: card
          width: flex
        - type: card
          width: flex
```

### 3. 表单布局

```
┌─────────────────────────────┐
│ 用户注册                    │
│                             │
│ 用户名: [_____________]  *   │
│ 邮箱:   [_____________]  *   │
│ 密码:   [_____________]  *   │
│                             │
│    [取消]  [注册]           │
└─────────────────────────────┘
```

```yaml
layout:
  direction: column
  padding: [2, 4, 2, 4]
  gap: 1
  children:
    - type: text
      content: '用户注册'
      style: { bold: true, underline: true }

    - type: field
      props: { label: '用户名', placeholder: '输入用户名' }

    - type: field
      props: { label: '邮箱', placeholder: 'user@example.com' }

    - type: field
      props: { label: '密码', placeholder: '********' }

    - type: layout
      direction: row
      justifyContent: center
      gap: 2
      children:
        - type: button
          props: { label: '取消' }
        - type: button
          props: { label: '注册', style: { background: '#080' } }
```

### 4. 仪表板布局

```
┌─────────────────────────────────┐
│  系统仪表板    [刷新] [退出]     │
├────────┬────────────────────────┤
│        │  💰 Revenue             │
│ Menu   │  👥 Users              │
│        │  📦 Orders             │
│        │  ⭐ Satisfaction       │
├────────┴────────────────────────┤
│ 状态: Online | Ping: 14ms        │
└─────────────────────────────────┘
```

```yaml
layout:
  direction: column
  children:
    - type: header
      height: 3
      props: { title: '系统仪表板' }

    - type: layout
      direction: row
      flexGrow: 1
      children:
        - type: sidebar
          width: 20
          props: { borderRight: true }

        - type: layout
          direction: column
          flexGrow: 1
          gap: 1
          children:
            - type: layout
              direction: row
              height: 5
              children:
                - type: metric-card
                  width: flex
                - type: metric-card
                  width: flex

    - type: footer
      height: 1
      props: { text: '状态: Online | Ping: 14ms' }
```

### 5. 居中模态框

```
┌─────────────────────────────────┐
│                         ┌─────┐  │
│                         │Modal│  │
│                         │     │  │
│                         └─────┘  │
└─────────────────────────────────┘
```

```yaml
# 覆盖层容器
layout:
  direction: column
  alignItems: center
  justifyContent: center
  style: { background: '#00000088' } # 半透明背景
  children:
    - type: modal
      width: 40
      height: 15
      style:
        background: '#fff'
        color: '#000'
        zIndex: 100
      children:
        - type: text
          content: '确认删除？'
          align: center
        - type: text
          content: ''
        - type: layout
          direction: row
          justifyContent: center
          gap: 2
          children:
            - type: button
              props: { label: '取消' }
            - type: button
              props: { label: '确认' }
```

### 6. 响应式布局 (百分比)

```yaml
# 左侧 30%，右侧 70%
layout:
  direction: row
  children:
    - type: sidebar
      style:
        widthPercent: 30    # -30 编码为百分比

    - type: main
      flexGrow: 1

# 或者使用固定 + 自适应
layout:
  direction: row
  children:
    - type: sidebar
      width: 20           # 固定 20 列

    - type: main
      flexGrow: 1         # 占据剩余空间
```

### 7. 带间距的表单

```yaml
layout:
  direction: column
  style:
    gap: 1 # 子元素之间 1 行间距
    padding: [2, 2, 2, 2] # 上下左右 2 行内边距
  children:
    - type: text
      content: '用户名'

    - type: input
      width: 30

    - type: text
      content: '密码'

    - type: input
      width: 30
```

### 8. 对齐方式示例

```yaml
# 主轴对齐 (justify)
layout:
  direction: row
  justifyContent: space-between  # start | center | end | space-between | space-around
  children:
    - type: text
      content: "左"
    - type: text
      content: "中"
    - type: text
      content: "右"

# 交叉轴对齐 (alignItems)
layout:
  direction: row
  alignItems: center           # start | center | end | stretch
  height: 10
  children:
    - type: text
      content: "短"
      height: 3
    - type: text
      content: "高内容"
      height: 8
    - type: text
      content: "短"
      height: 3
```

### 9. 滚动容器

```yaml
layout:
  direction: column
  children:
    - type: header
      content: '长列表'

    - type: list
      style:
        overflow: scroll # hidden | visible | scroll
      height: 15
      children:
        # 100 个项目...
```

### 10. 边框和层级

```yaml
# 带边框的面板
layout:
  style:
    borderWidth: 1        # 四周 1 字符边框
  children:
    - type: text
      content: "带边框的内容"

# 不对称边框
layout:
  style:
    border: [1, 2, 1, 0]  # 上1 右2 下1 左0
  children:
    - type: text
      content: "内容"

# 层级控制 (Z-Index)
layout:
  children:
    - type: background
      style: {zIndex: 0}

    - type: content
      style: {zIndex: 10}

    - type: modal
      style: {zIndex: 100}   # 最上层
```

---

## 常用布局模式

### 模式 1: 固定侧边栏 + 自适应主内容

```yaml
layout:
  direction: row
  children:
    - type: sidebar
      width: 20 # 固定 20 列

    - type: main
      flexGrow: 1 # 占据剩余空间
```

### 模式 2: 三列布局 (左中右)

```yaml
layout:
  direction: row
  children:
    - type: left-panel
      width: 15

    - type: center-panel
      flexGrow: 1 # 中间自适应

    - type: right-panel
      width: 15
```

### 模式 3: 顶部固定 + 内容可滚动

```yaml
layout:
  direction: column
  children:
    - type: header
      height: 3 # 固定高度

    - type: content
      flexGrow: 1
      overflow: scroll # 内容溢出时滚动
```

### 模式 4: 卡片列表

```yaml
layout:
  direction: column
  gap: 1 # 卡片间距
  children:
    - type: card
      height: 8

    - type: card
      height: 8

    - type: card
      height: 8
```

### 模式 5: 居中对齐

```yaml
layout:
  direction: column
  alignItems: center # 水平居中
  justifyContent: center # 垂直居中
  children:
    - type: modal
      width: 40
      height: 15
```

---

## 样式属性速查表

| 属性             | 类型      | 说明                   | 示例                     |
| ---------------- | --------- | ---------------------- | ------------------------ |
| `width`          | int       | 固定宽度 (列)          | `width: 20`              |
| `height`         | int       | 固定高度 (行)          | `height: 5`              |
| `flexGrow`       | float64   | 弹性增长系数           | `flexGrow: 1`            |
| `direction`      | Direction | 布局方向               | `direction: row`         |
| `padding`        | Insets    | 内边距 [上,右,下,左]   | `padding: [1,2,1,2]`     |
| `border`         | Insets    | 边框宽度 [上,右,下,左] | `border: [1,1,1,1]`      |
| `gap`            | int       | 子元素间距             | `gap: 1`                 |
| `alignItems`     | Align     | 交叉轴对齐             | `alignItems: center`     |
| `justifyContent` | Justify   | 主轴对齐               | `justifyContent: center` |
| `overflow`       | Overflow  | 溢出处理               | `overflow: scroll`       |
| `zIndex`         | int       | 渲染层级               | `zIndex: 100`            |

---

## 联系

- **维护者**: Yao TUI Team
- **问题反馈**: GitHub Issues
- **文档**: Yao Documentation Site

---

_本 README 作为 Runtime v1 的冻结规范，任何修改需经过严格评审_
