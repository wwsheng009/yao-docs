# Yao TUI 布局重构详细实施计划

## 概述

本文档旨在提供 Yao TUI 布局重构的详细实施计划，基于现有设计文档（`ui-runtime.md`、`TODO.md`、`重构方案.md`）和当前代码库状态。重构的核心目标是引入**三阶段渲染模型（Measure → Layout → Render）**，建立**严格的模块边界**，并创建一个**可预测、可组合、可演进**的终端 UI 运行时。

## 当前状态分析 (As-Is)

### 现有架构

```
tui/
├── layout/                    # 当前布局引擎
│   ├── engine.go             # 布局引擎实现
│   ├── renderer.go           # 渲染器
│   ├── types.go              # 布局类型定义
│   └── builder.go            # 布局构建器
├── core/                     # 核心类型定义
│   ├── types.go              # 组件接口、事件、消息类型
│   └── bindings.go           # 绑定相关
├── components/               # UI 组件实现
├── model.go                  # Bubble Tea Model
├── render_engine.go          # 渲染引擎
└── ... (其他文件)
```

### 现有布局引擎特点

1. **单阶段布局计算**：`Engine.Layout()` 方法直接计算坐标和尺寸
2. **混合渲染策略**：Flex 布局使用 lipgloss 拼接，Absolute 布局使用 rune buffer
3. **缺乏明确边界**：布局引擎直接依赖 Bubble Tea 和组件实例
4. **有限的约束系统**：支持基础的 AvailableWidth/Height，但没有完整的 BoxConstraints

### 优势与挑战

- **优势**：已有基础的 Flex、Grid、Absolute 布局能力；组件系统相对完善
- **挑战**：缺乏三阶段分离；渲染策略不统一；模块耦合度高

## 重构目标 (To-Be)

### 目标架构

```
tui/
├── runtime/                  # 新：稳定内核（v1 冻结）
│   ├── runtime.go           # Runtime 接口
│   ├── layout/              # 布局计算
│   │   ├── measure.go       # 测量阶段
│   │   ├── flex.go          # Flexbox 算法
│   │   ├── grid.go          # Grid 算法（v2）
│   │   └── scroll.go        # 滚动/视口处理
│   ├── render/              # 渲染后端
│   │   ├── buffer.go        # 虚拟画布（CellBuffer）
│   │   ├── diff.go          # 差异渲染
│   │   └── renderer.go      # 渲染器实现
│   ├── event/               # 事件系统
│   │   ├── hittest.go       # 点击测试
│   │   └── dispatch.go      # 事件分发
│   └── focus/               # 焦点管理
│       └── focus.go         # 焦点管理器
├── ui/                      # 上层 UI（可频繁修改）
│   ├── components/          # 组件实现（迁移后）
│   ├── layouts/             # 布局组件（Row、Column 等）
│   └── dsl/                 # DSL 构建器
├── legacy/                  # 旧实现（逐步废弃）
│   └── layout/              # 当前 layout 包移动至此
└── tea/                     # Bubble Tea 适配层
    └── model.go             # 适配器（替换现有 model.go）
```

### 核心设计原则

1. **三阶段渲染模型**：Measure → Layout → Render 严格分离
2. **单向数据流**：State → LayoutNode → Runtime → Frame → Terminal
3. **几何优先**：所有交互基于最终 LayoutBox，而非组件树结构
4. **模块边界**：严格禁止跨层依赖（runtime 不依赖 tea/ui；ui 不实现布局算法）

## 模块边界定义（必须强制执行）

### runtime 层（核心）

- ✅ **允许**：纯布局算法、几何计算、虚拟画布、差异渲染
- ❌ **禁止**：依赖 Bubble Tea、依赖 DSL、依赖具体组件、依赖 lipgloss
- **职责**：将 LayoutNode 转换为几何位置，生成 Frame

### ui 层（表现层）

- ✅ **允许**：依赖 runtime、实现组件渲染逻辑、使用 DSL 构建器
- ❌ **禁止**：实现布局算法、实现 buffer/diff 逻辑、直接操作几何
- **职责**：提供组件实现，将业务逻辑映射到 UI

### tea 层（适配层）

- ✅ **允许**：输入 → Event 转换、Frame → Terminal 输出、Bubble Tea 集成
- ❌ **禁止**：布局计算、组件实现、业务逻辑
- **职责**：桥接 Bubble Tea 和 Runtime

### legacy 层（旧实现）

- ✅ **允许**：逐步迁移期间共存
- ❌ **禁止**：新增功能、修复复杂 bug（除非阻塞迁移）
- **职责**：临时兼容，逐步废弃

## 分阶段实施计划（6周路线图）

### Phase 0：准备阶段（1-2天）

**目标**：建立基础设施和边界定义

#### 任务清单

1. **创建目录结构**
   - [ ] 创建 `tui/runtime/` 目录及子目录（layout/, render/, event/, focus/）
   - [ ] 创建 `tui/ui/` 目录及子目录（components/, layouts/, dsl/）
   - [ ] 创建 `tui/legacy/` 目录，移动现有 `tui/layout/` 到 `tui/legacy/layout/`
   - [ ] 创建 `tui/tea/` 目录

2. **文档与规范**
   - [ ] 将 `ui-runtime.md` 核心内容复制到 `tui/runtime/README.md` 并冻结
   - [ ] 创建 `tui/runtime/CONTRIBUTING.md` 明确 API 冻结规则
   - [ ] 创建 `tui/MODULE_BOUNDARIES.md` 定义模块边界

3. **构建系统更新**
   - [ ] 更新 `go.mod` 和构建脚本确保新目录结构可用
   - [ ] 设置 CI 检查模块边界违规

### Phase 1：最小 Runtime 工作（1周）

**目标**：能渲染一个 Text 组件，建立三阶段流程

#### 任务清单

1. **核心数据结构**
   - [ ] 实现 `runtime.LayoutNode`（与 legacy 保持兼容）
   - [ ] 实现 `runtime.BoxConstraints` 系统
   - [ ] 实现 `runtime.Style`（v1 简化版）
   - [ ] 定义 `runtime.Measurable` 接口

2. **三阶段引擎**
   - [ ] 实现 `runtime.Runtime` 接口（Layout, Render, Dispatch, FocusNext）
   - [ ] 实现 `measure` 阶段：计算尺寸，忽略位置
   - [ ] 实现 `layout` 阶段：计算几何，不生成输出
   - [ ] 实现 `render` 阶段：绘制到虚拟画布，生成 Frame

3. **虚拟画布**
   - [ ] 实现 `render.CellBuffer` 支持 Z-Index
   - [ ] 实现基础 `render.Renderer` 输出 Frame
   - [ ] 实现 `Frame.String()` 方法供 Bubble Tea 使用

4. **Text 组件适配**
   - [ ] 创建 `ui/components/text.go` 实现 `Measurable` 接口
   - [ ] 适配现有 Text 组件到新 Runtime
   - [ ] 测试 Text 组件通过 Runtime 渲染

5. **集成测试**
   - [ ] 创建端到端测试：DSL → LayoutNode → Runtime → Frame
   - [ ] 验证三阶段分离原则
   - [ ] 确保现有测试不破坏

### Phase 2：Flex + Scroll 支持（1-2周）

**目标**：Dashboard 可用，支持基本布局和滚动

#### 任务清单

1. **Flexbox 算法**
   - [ ] 实现 `runtime/layout/flex.go` 基础算法（Row/Column）
   - [ ] 支持 `flex-grow` 分配（v1 简化：无 shrink/basis）
   - [ ] 实现主轴对齐（Start, Center, End）
   - [ ] 实现交叉轴对齐（Start, Center, End, Stretch）

2. **Padding 支持**
   - [ ] 在约束传递中集成 Padding
   - [ ] 确保测量阶段考虑 Padding
   - [ ] 验证 Padding 在渲染阶段生效

3. **Scroll/Viewport**
   - [ ] 实现 `runtime/layout/scroll.go` 滚动计算
   - [ ] 支持 `overflow: scroll` 样式
   - [ ] 实现视口裁剪（在渲染阶段）
   - [ ] 创建 Scrollable 组件接口

4. **Z-Index 与层叠**
   - [ ] 在 `CellBuffer` 中完善 Z-Index 支持
   - [ ] 实现层叠上下文（Stacking Context）
   - [ ] 支持 Modal 覆盖主布局

5. **布局组件迁移**
   - [ ] 创建 `ui/layouts/row.go` 和 `ui/layouts/column.go`
   - [ ] 迁移现有 Flex 布局组件到新系统
   - [ ] 测试复杂嵌套布局

6. **性能基准**
   - [ ] 对比新旧布局引擎性能
   - [ ] 确保无性能回归

### Phase 3：事件 + Focus 系统（1周）

**目标**：完全交互支持，键盘导航

#### 任务清单

1. **几何优先事件系统**
   - [ ] 实现 `runtime/event/hittest.go` 点击测试
   - [ ] 基于 LayoutBox 映射事件坐标
   - [ ] 实现 `runtime/event/dispatch.go` 事件分发

2. **焦点管理**
   - [ ] 实现 `runtime/focus/focus.go` 焦点管理器
   - [ ] 支持 Tab/Shift+Tab 导航
   - [ ] 支持箭头键导航（方向感知）
   - [ ] 集成现有 FocusRegistry

3. **组件交互适配**
   - [ ] 更新所有可交互组件支持新事件系统
   - [ ] 迁移现有焦点逻辑到 Runtime
   - [ ] 确保向后兼容性

4. **键盘快捷键**
   - [ ] 统一键盘事件处理
   - [ ] 支持全局快捷键
   - [ ] 测试无障碍导航

### Phase 4：性能优化（1周）

**目标**：支持大型 UI，无性能瓶颈

#### 任务清单

1. **差异渲染**
   - [ ] 实现 `runtime/render/diff.go` 差异计算
   - [ ] 比较 Frame 变化，最小化输出
   - [ ] 集成到渲染流水线

2. **脏矩形优化**
   - [ ] 跟踪布局变化区域（Dirty Rect）
   - [ ] 只重绘受影响区域
   - [ ] 减少 lipgloss 调用次数

3. **虚拟列表支持**
   - [ ] 实现 `ui/components/virtual_list.go`
   - [ ] 支持大数据集滚动
   - [ ] 集成到 Runtime 滚动系统

4. **内存优化**
   - [ ] 分析并优化 CellBuffer 内存使用
   - [ ] 实现对象池减少 GC 压力
   - [ ] 性能剖析和基准测试

### Phase 5：迁移完成（1周）

**目标**：完全切换到新 Runtime，删除旧代码

#### 任务清单

1. **组件全面迁移**
   - [ ] 迁移所有剩余组件到新 Runtime
   - [ ] 确保 100% 测试覆盖率
   - [ ] 更新所有示例和文档

2. **旧代码删除**
   - [ ] 删除 `tui/legacy/layout/` 目录
   - [ ] 删除所有旧布局引擎引用
   - [ ] 清理不再使用的接口

3. **API 稳定化**
   - [ ] 冻结 `runtime` v1 API
   - [ ] 编写完整的 API 文档
   - [ ] 创建迁移指南

4. **最终验收**
   - [ ] 运行完整测试套件
   - [ ] 性能回归测试
   - [ ] 发布公告和更新日志

## 详细任务分解

### 关键数据结构实现细节

#### LayoutNode（统一中间表示）

```go
type LayoutNode struct {
    // 标识
    ID        string
    Type      NodeType  // "text", "row", "column", "custom"

    // 样式（声明式）
    Style     Style
    Props     map[string]any

    // 组件引用（可选）
    Component Component

    // 树结构
    Parent   *LayoutNode
    Children []*LayoutNode

    // Runtime 字段（只写）
    X, Y           int      // 最终位置（由 Runtime 写入）
    MeasuredWidth  int      // 测量宽度（由 Runtime 写入）
    MeasuredHeight int      // 测量高度（由 Runtime 写入）

    // 内部状态
    dirty    bool
    cacheKey string
}
```

#### BoxConstraints（约束系统）

```go
type BoxConstraints struct {
    MinWidth, MaxWidth   int
    MinHeight, MaxHeight int
}

func (bc BoxConstraints) IsTight() bool     // 是否固定尺寸
func (bc BoxConstraints) Constrain(size Size) Size  // 应用约束
func (bc BoxConstraints) Loosen() BoxConstraints    // 放宽约束
```

#### Style（v1 简化版）

```go
type Style struct {
    Width     int         // -1 表示 auto
    Height    int         // -1 表示 auto
    FlexGrow  float64     // 0 表示不扩展
    Direction Direction   // "row" 或 "column"

    Padding   Insets      // 内边距
    ZIndex    int         // 层叠顺序
    Overflow  Overflow    // "visible", "hidden", "scroll"
}

// v1 明确不支持：百分比、Grid、Wrap、CSS 选择器
```

### 三阶段渲染实现细节

#### Measure 阶段

- **输入**：BoxConstraints
- **输出**：Size（理想尺寸）
- **规则**：
  1. 叶子组件：根据内容计算尺寸（调用 Measurable.Measure）
  2. 容器组件：递归测量子组件，根据布局算法聚合尺寸
  3. 必须忽略位置信息
  4. 可缓存结果（基于约束哈希）

#### Layout 阶段

- **输入**：父容器位置和尺寸
- **输出**：子组件位置（设置 X, Y, MeasuredWidth, MeasuredHeight）
- **规则**：
  1. 根据父容器几何分配子组件位置
  2. 考虑 Padding、对齐方式、Flex 比例
  3. 只计算几何，不生成任何输出
  4. 支持绝对定位和相对定位

#### Render 阶段

- **输入**：布局后的树
- **输出**：Frame（虚拟画布）
- **规则**：
  1. 按 Z-Index 顺序渲染
  2. 应用视口裁剪
  3. 将组件内容绘制到 CellBuffer
  4. 支持差异渲染优化

### 迁移策略

#### 组件迁移优先级

1. **基础组件**：Text、Box、Divider（简单，无交互）
2. **布局组件**：Row、Column、Flex（核心布局）
3. **交互组件**：Input、Button、Form（需要事件支持）
4. **复杂组件**：List、Table、Tree（最后迁移）

#### 兼容性保证

1. **并行运行**：新老系统可并行运行，逐步迁移
2. **适配层**：为旧组件创建 Measurable 适配器
3. **特性标志**：使用构建标志控制使用哪个引擎
4. **回滚机制**：任何阶段发现问题可回滚到前一阶段

## 测试计划

### 单元测试

- [ ] Runtime 核心算法测试（measure, layout, render）
- [ ] Flexbox 算法测试（各种对齐和分布场景）
- [ ] 约束系统测试（边界条件）
- [ ] 事件系统测试（点击测试、焦点管理）

### 集成测试

- [ ] 端到端渲染测试（DSL → Frame）
- [ ] 布局迁移测试（新旧引擎输出对比）
- [ ] 性能回归测试（基准测试套件）
- [ ] 跨平台测试（Windows/Linux/macOS）

### 验收测试

- [ ] 现有示例应用测试（确保功能完整）
- [ ] 复杂布局场景测试（Dashboard、Modal、嵌套滚动）
- [ ] 交互测试（键盘导航、焦点转移）
- [ ] 内存泄漏测试（长时间运行）

## 风险与缓解措施

### 技术风险

1. **性能倒退**
   - **缓解**：早期性能基准测试，持续监控
   - **回滚**：保留旧引擎直至性能达标

2. **API 不稳定**
   - **缓解**：严格遵循 v1 冻结策略，使用适配器模式
   - **文档**：明确的 API 变更日志

3. **迁移复杂性**
   - **缓解**：分阶段迁移，每个阶段可独立验证
   - **工具**：创建迁移辅助工具和检查脚本

### 组织风险

1. **开发资源**
   - **缓解**：明确分工，6周可完成计划
   - **优先级**：核心功能优先，增强功能后续

2. **知识传递**
   - **缓解**：详细文档、代码注释、示例
   - **培训**：重构期间定期同步进度

## 成功标准

### 技术成功标准

1. ✅ 三阶段渲染模型完整实现
2. ✅ 所有现有组件迁移到新 Runtime
3. ✅ 性能不下降（或提升）
4. ✅ 测试覆盖率 >90%
5. ✅ 模块边界无违规

### 业务成功标准

1. ✅ Dashboard 应用完全可用
2. ✅ 开发体验改善（更可预测的布局）
3. ✅ 维护成本降低（清晰的架构）
4. ✅ 扩展性提升（支持未来功能）

## 现有代码迁移点

### 关键文件与对应迁移任务

#### 1. 布局引擎迁移 (`tui/layout/` → `tui/legacy/layout/`)

- **`engine.go`**：
  - 提取 `measureChild` 逻辑到 `runtime/layout/measure.go`
  - 拆分 `layoutFlex` 为 Measure 和 Layout 两个阶段
  - 保留现有 API 兼容性，创建适配器 `legacy/engine_adapter.go`
- **`renderer.go`**：
  - 迁移 CellBuffer 逻辑到 `runtime/render/buffer.go`
  - 保留现有渲染接口，逐步替换为 Runtime 渲染
- **`types.go`**：
  - 保持兼容，新增字段通过嵌入方式扩展
  - 创建转换函数 `legacyToRuntimeNode` 和 `runtimeToLegacyNode`

#### 2. 组件迁移 (`tui/components/` → `tui/ui/components/`)

- **Text 组件 (`text.go`)**：
  - 实现 `core.Measurable` 接口（已存在，需完善）
  - 更新渲染逻辑使用 Runtime 提供的几何信息
- **Flex 组件 (`flex_component.go`)**：
  - 迁移到 `ui/layouts/row.go` 和 `column.go`
  - 实现布局容器接口
- **其他组件**：
  - 按优先级逐步迁移，确保每个组件通过 `Measurable.Measure()` 报告尺寸

#### 3. 核心模型迁移 (`tui/model.go`, `tui/render_engine.go`)

- **`model.go`**：
  - 逐步替换 `LayoutEngine` 为 `runtime.Runtime`
  - 更新 `RenderLayout()` 调用新 Runtime
  - 保持 Bubble Tea 接口不变
- **`render_engine.go`**：
  - 重构为 `tea/model.go` 适配器
  - 将渲染委托给 `runtime.Renderer`
  - 处理事件分发到 Runtime

#### 4. 类型系统整合 (`tui/core/types.go`)

- **保留现有接口**：`ComponentInterface`, `Measurable`, `FocusableComponent`
- **扩展新类型**：`LayoutNode`, `BoxConstraints`, `Style` 与现有类型兼容
- **创建转换层**：确保现有组件无需重大修改即可工作

### 迁移检查清单（每个组件）

1. [ ] 组件是否实现 `Measurable` 接口？
2. [ ] `Measure()` 方法是否正确计算固有尺寸？
3. [ ] 渲染是否依赖 `RenderConfig.Width/Height` 而非自身计算位置？
4. [ ] 事件处理是否通过 Runtime 事件系统？
5. [ ] 焦点管理是否使用 Runtime 焦点管理器？

### 测试迁移策略

1. **并行测试**：新旧引擎同时运行，对比输出
2. **黄金文件测试**：保存已知正确渲染结果，确保迁移后一致
3. **性能监控**：每个迁移阶段监控性能变化
4. **回滚预案**：每个组件迁移后标记，有问题可快速回滚

## 附录

### 参考文档

1. `ui-runtime.md` - 核心设计文档
2. `TODO.md` - 原始实施计划
3. `重构方案.md` - 技术细节
4. `STEP1.md` ~ `STEP5.md` - 分步指导

### 关键决策记录

1. **v1 功能范围**：明确包含和不包含的功能
2. **模块边界**：严格的依赖规则
3. **迁移策略**：渐进式而非重写式

### 联系方式

- 项目负责人：[待补充]
- 技术负责人：[待补充]
- 文档维护：[待补充]

---

_文档版本：1.0_
_最后更新：2026年1月22日_
_状态：草稿_
