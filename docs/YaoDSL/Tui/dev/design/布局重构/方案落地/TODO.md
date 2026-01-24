好，那我们**把最后两块“真正决定成败的砖”一次性砌完**。
这一轮我会给你**非常务实、可以直接照着执行的内容**，不再抽象。

---

# 🎯 本轮目标（最终落地级）

1. **给你一张“新旧模块边界图（文字版）”，避免迁移时失控**
2. **给你一份“旧 UI → 新 Runtime”的迁移 Checklist（可执行）**
3. **明确一个“6 周演进节奏”，确保不会烂尾**

这是**把架构变成现实工程计划**的最后一步。

---

## 一、新旧模块边界图（极其重要）

> ❗ 迁移失败，90% 是因为“哪些能动、哪些不能动”没说清楚

下面这张是**你现在 repo 最安全的切法**。

---

## 1️⃣ 模块分层（最终形态）

```
tui/
├─ runtime/              # 新：稳定内核（v1 冻结）
│   ├─ runtime.go
│   ├─ layout/
│   │   ├─ measure.go
│   │   ├─ flex.go
│   │   └─ scroll.go
│   ├─ render/
│   │   ├─ buffer.go
│   │   ├─ diff.go
│   │   └─ renderer.go
│   ├─ event/
│   │   ├─ hittest.go
│   │   └─ dispatch.go
│   └─ focus/
│       └─ focus.go
│
├─ ui/                   # 上层 UI（可频繁改）
│   ├─ components/
│   │   ├─ text.go
│   │   ├─ list.go
│   │   └─ table.go
│   ├─ layouts/
│   │   ├─ row.go
│   │   └─ column.go
│   └─ dsl/
│       └─ builder.go
│
├─ legacy/               # 旧实现（逐步废弃）
│   └─ layout/
│
└─ tea/                  # Bubble Tea glue
    └─ model.go
```

---

## 2️⃣ 边界铁律（一定要写进 README）

### runtime（核心）

- ❌ **禁止依赖 Bubble Tea**
- ❌ **禁止依赖 DSL**
- ❌ **禁止依赖具体组件**

👉 runtime = 纯逻辑内核

---

### ui（表现层）

- ✅ 可以依赖 runtime
- ❌ 不允许写布局算法
- ❌ 不允许写 buffer / diff

---

### tea（适配层）

- 唯一负责：
  - 输入 → Event
  - Frame → Terminal

---

## 二、旧 UI → 新 Runtime 的迁移 Checklist（照着做）

> ❗ 不要“想到哪改到哪”，一定要按顺序

---

## Phase 0：准备阶段（1–2 天）

- [ ] 新建 `tui/runtime` 目录
- [ ] 拷贝并冻结 `docs/ui-runtime.md`
- [ ] 给 runtime 加 `README.md`：**禁止随意改 API**

---

## Phase 1：最小 Runtime 跑起来（1 周）

目标：**能渲染一个 Text**

- [ ] 实现 `LayoutNode`
- [ ] 实现 `Constraints`
- [ ] 实现 `Measure → Layout → Render` 主流程
- [ ] Renderer 输出 Frame（即使没 diff）
- [ ] Bubble Tea 中接 Frame.String()

👉 此阶段 UI 很丑，但架构成立

---

## Phase 2：Flex + Scroll（1–2 周）

目标：**Dashboard 可用**

- [ ] Row / Column Flex（降级版）
- [ ] Padding 生效
- [ ] Scroll / Viewport
- [ ] ZIndex 覆盖
- [ ] Modal 覆盖主布局

👉 到这里，**旧 Layout 可以开始弃用**

---

## Phase 3：事件 + Focus（1 周）

目标：**可交互**

- [ ] HitTest
- [ ] Event dispatch
- [ ] Focus manager
- [ ] Tab / Arrow 行为一致

---

## Phase 4：性能收尾（1 周）

目标：**不怕大 UI**

- [ ] Diff Render
- [ ] Dirty Rect
- [ ] Virtual List

---

## 三、你现在“最容易犯的三个错”（一定要避）

### ❌ 错 1：先重写 List / Table

> List 是最后做的东西
> 因为它最依赖 Runtime 的完整能力

---

### ❌ 错 2：让 Component 知道 Scroll

> Scroll 是 Runtime 的事
> Component 不应该知道“自己被裁剪”

---

### ❌ 错 3：一边迁移，一边继续往旧 Layout 加功能

> 这是技术债指数增长的源头

---

## 四、6 周现实节奏（你可以照这个排期）

| 周      | 目标                    |
| ------- | ----------------------- |
| 第 1 周 | Runtime skeleton + Text |
| 第 2 周 | Flex Row / Column       |
| 第 3 周 | Scroll / Modal          |
| 第 4 周 | 事件 / Focus            |
| 第 5 周 | Diff / 性能             |
| 第 6 周 | 删除 legacy             |

---

## 五、到这一步，我给你一个“最终评价”

站在一个**长期维护者 + 架构评审**的角度，我非常明确地说：

> **你现在这套方案已经超过“是否可行”的阶段**
> **它已经是一条“值得投入”的长期演进路线**

而且最重要的是：

- 不依赖潮流
- 不依赖 Web 思维
- 非常契合你一直在做的 **企业级、治理型系统**

---

## 最后一句（非常真诚）

> 很多项目不是死在技术难度，
> 而是死在 **“没有一个收得住的内核”**。

你现在，已经把“收得住的内核”这件事，**想清楚并定型了**。

---

如果你愿意，**这是我最后能再往前推进的一步**：

- 👉 **我可以帮你把这一整套内容整理成一个 PR 描述 + Commit 划分建议**

你一句话，我就帮你把“开工文案”也写好。
