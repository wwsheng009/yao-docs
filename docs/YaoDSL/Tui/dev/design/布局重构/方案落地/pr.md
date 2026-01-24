好，那我就**把这件事真正“封板”**：
这一轮我直接给你 **一份可以原样复制的 PR 描述 + Commit 拆分方案**。
做到这一步，你**只需要照着执行，不再需要架构判断**。

---

# ✅ PR 标题（建议）

**feat(tui): introduce runtime-based layout & rendering architecture (v1)**

---

# 🧾 PR 描述（可直接粘贴）

## 背景

现有 TUI 实现将布局计算、渲染输出与组件逻辑高度耦合，导致：

- 布局行为不可预测（文本高度 / resize / overlay）
- ZIndex、Modal、Scroll 等能力难以实现
- 性能优化（Diff / Dirty）缺乏落点
- UI 复杂度提升后维护成本指数级增长

为支撑 **企业级复杂终端 UI**（Dashboard / 监控 / 配置界面），本 PR 引入 **Yao TUI Runtime v1**，将 UI 系统升级为现代的三阶段运行时模型。

---

## 本 PR 做了什么

### 1. 引入稳定的 TUI Runtime 内核（v1）

- 新增 `tui/runtime` 模块
- 明确并冻结三阶段模型：

```
Measure → Layout → Render
```

- Runtime 成为 UI 的唯一执行入口

---

### 2. 引入 LayoutNode 作为 UI 的中间表示（IR）

- DSL / UI 构建统一生成 `LayoutNode Tree`
- Runtime 负责写入几何信息（X / Y / Size）
- Component 与布局逻辑完全解耦

---

### 3. 引入统一 CellBuffer + Diff Render 渲染模型

- Render 阶段统一写入 Frame（二维 Cell）
- 输出阶段只绘制变更区域
- 为大规模 UI（列表 / 表格）提供性能基础

---

### 4. 明确事件与 Focus 的几何优先模型

- 所有事件通过 LayoutBox 命中测试
- Focus 顺序基于视觉几何，而非组件树
- Overlay / Modal 行为可预测

---

### 5. 冻结 v1 架构设计说明

- 新增 `docs/ui-runtime.md`
- 明确：
  - 支持的能力
  - 明确不支持的能力
  - v2 才允许探索的方向

---

## 不包含在本 PR 中的内容

> 以下内容 **明确不在 v1 范围内**，避免范围膨胀：

- CSS Selector / Cascade
- Grid / Flex wrap
- 动画系统
- 富文本编辑

---

## 迁移策略

- 现有 UI 仍可使用 legacy layout
- 新 UI 优先基于 Runtime 构建
- legacy layout 将在后续 PR 中逐步移除

---

## 风险与回滚

- 新 Runtime 与 legacy 实现并行存在
- 不影响现有 UI 行为
- 可随时回滚至 legacy

---

## 相关文档

- `docs/ui-runtime.md`（v1 架构冻结文档）

---

# 🔨 Commit 拆分建议（非常重要）

> **一定要拆，不要一个大 commit**

---

## Commit 1：引入设计文档（先立法）

**commit message**

```
docs: add TUI runtime architecture specification (v1)
```

**内容**

- `docs/ui-runtime.md`
- runtime README（说明冻结规则）

👉 目的：**先把“不能乱改”的边界写死**

---

## Commit 2：Runtime skeleton（不追求完整）

**commit message**

```
feat(tui): add runtime skeleton with layout pipeline
```

**内容**

- `tui/runtime/runtime.go`
- `LayoutNode`
- `Constraints`
- Measure / Layout / Render 空实现

👉 目的：**让主流程跑通**

---

## Commit 3：CellBuffer & Frame

**commit message**

```
feat(tui): introduce frame-based rendering with cell buffer
```

**内容**

- `Frame`
- `Cell`
- 基础 Renderer（无 diff 也行）

---

## Commit 4：Flex Row / Column（降级）

**commit message**

```
feat(tui): implement basic flex row/column layout
```

**内容**

- flex-grow
- cross-axis stretch
- padding

---

## Commit 5：Scroll / Viewport

**commit message**

```
feat(tui): add viewport-based scroll model
```

**内容**

- Viewport + Content
- Render 裁剪

---

## Commit 6：Event / Focus（如阶段性）

**commit message**

```
feat(tui): geometry-based event dispatch and focus management
```

---

## Commit 7：标记 legacy 为 deprecated

**commit message**

```
chore(tui): mark legacy layout engine as deprecated
```

---

# 🧭 Reviewer 关注点（你可以提前写在 PR 里）

- 是否遵循 Measure / Layout / Render 分离
- Runtime 是否避免依赖 Bubble Tea / DSL
- Component 是否保持纯内容职责
- 是否引入 v1 明确禁止的能力

---

# 🏁 最后的话（站在架构评审角度）

如果这个 PR 被合并，意味着一件很重要的事：

> **Yao 的 TUI 不再是“实现细节”，而是“平台能力”**

你现在做的这一步，本质上是在：

- 给未来的 UI 复杂度“封顶”
- 给维护成本“定价”
- 给系统演进“留后路”

这不是所有项目都会走到的一步。

---

## 如果你愿意继续（真的最后一步）

我还能再帮你 **只做一件事**：

> 👉 **按这个 PR 结构，给你生成一个“空但完整”的 runtime 目录骨架（含文件名 + 注释）**

你只要说一句「要」，我就直接给你。
