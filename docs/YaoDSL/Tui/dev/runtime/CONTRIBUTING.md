# Yao TUI Runtime - Contributing Guide

## 简介

本文档是 **Yao TUI Runtime v1** 的贡献指南。由于 Runtime 是整个 TUI 系统的核心内核，任何修改都必须极其谨慎。

**核心原则**：

1. ⚠️ **Runtime v1 API 已冻结**，不允许破坏性修改
2. 🧱 **严格遵守模块边界**，禁止跨层依赖
3. 🧪 **测试先行**，任何修改必须有完整测试覆盖
4. 📊 **性能敏感**，必须监控性能影响

---

## 开发前必读

### 1. 理解三阶段渲染模型

在修改任何代码前，请确保完全理解：

1. **Measure 阶段**：只计算尺寸，不设置位置
2. **Layout 阶段**：只分配坐标，不修改尺寸
3. **Render 阶段**：只绘制，不做布局决策

详见 `README.md` 的"核心设计原则"章节。

### 2. 理解模块边界

### runtime 层（当前所在）

- ✅ **允许**：纯布局算法、几何计算、虚拟画布、差异渲染
- ❌ **禁止**：依赖 Bubble Tea、依赖 DSL、依赖具体组件、依赖 lipgloss（Render 模块除外）

### ui 层（禁止从 runtime 调用）

- Runtime 不应该依赖或导入 `tui/ui/*`
- Runtime 不应该知道具体组件的存在

### tea 层（禁止从 runtime 调用）

- Runtime 不应该导入 `tea "github.com/charmbracelet/bubbletea"`

### legacy 层（禁止从 runtime 调用）

- Runtime 应该与 legacy 实现完全解耦

### 3. 理解 v1 功能范围

**v1 包含**：

- Three-Phase Render（Measure → Layout → Render）
- Flexbox 简化版（Row/Column, Flex-Grow, 基础对齐）
- BoxConstraints 系统
- 虚拟画布（CellBuffer）
- Z-Index 支持
- 基础事件系统（HitTest）
- 焦点管理

**v1 明确不包含**：

- ❌ Grid 布局（v2）
- ❌ Wrap（自动换行）（v2）
- ❌ 百分比单位（v2）
- ❌ CSS 级联（v2）
- ❌ 动画系统（v2）
- ❌ 富文本编辑（v2）

---

## 修改准则

### 添加新功能

**原则**：新功能通过扩展示有接口或添加新接口，而非修改现有接口。

#### ✅ 正确示例：添加新接口

```go
// 在 runtime/flex.go 中添加新方法
func (e *Engine) LayoutFlexWithBasis(node *LayoutNode, c BoxConstraints) Size {
    // 新功能：支持 flex-basis
    // 不影响现有方法
}
```

#### ❌ 错误示例：修改现有函数签名

```go
// ❌ 破坏性修改
func (e *Engine) Measure(node *LayoutNode, c BoxConstraints, useBasis bool) Size {
    // 添加了新参数，破坏了现有调用
}
```

---

### 修复 Bug

**原则**：Bug 修复不应该改变 API 或行为边界。

#### ✅ 正确示例

```go
// 修复计算错误，但不改变接口
func (e *Engine) measureFlexRow(node *LayoutNode, c BoxConstraints) Size {
    // 修复算法错误
    // 输入输出接口不变
    return Size{...}
}
```

#### ❌ 错误示例：通过改变 API 修复问题

```go
// ❌ 破坏性修复
func (e *Engine) Measure(node *LayoutNode, c BoxConstraints) (Size, error) {
    // 返回 error，原有调用需要修改
}
```

---

### 性能优化

**原则**：性能优化不能改变 API 行为。

#### ✅ 正确示例

```go
func (e *Engine) measure(node *LayoutNode, c BoxConstraints) Size {
    // 添加缓存，逻辑不变
    if size, ok := e.cache.Get(node, c); ok {
        return size
    }
    // ... 原有逻辑
    e.cache.Set(node, c, size)
    return size
}
```

---

## 测试要求

### 测试覆盖率

所有 Runtime 代码的测试覆盖率必须 **> 90%**。

运行测试：

```bash
go test ./tui/runtime -v -cover
```

### 必需的测试类型

#### 1. 单元测试

- 每个公开函数必须有测试
- 边界条件必须覆盖
- 错误路径必须测试

#### 2. 集成测试

- 三阶段流程测试（Measure → Layout → Render）
- 完整布局渲染测试
- 与 Bubble Tea 集成测试（在 tea/ 层）

#### 3. 性能测试

- 关键算法必须有基准测试
- 优化前后性能对比

示例：

```go
func BenchmarkFlexMeasure(b *testing.B) {
    engine := NewEngine(nil)
    node := createTestNode()
    c := BoxConstraints{MaxWidth: 100, MaxHeight: 100}

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        engine.Measure(node, c)
    }
}
```

#### 4. 黄金文件测试

- 对于布局计算，使用黄金文件测试
- 确保修改不会意外改变布局结果

示例：

```go
func TestFlexLayoutGolden(t *testing.T) {
    golden := filepath.Join("testdata", "flex_layout.golden")
    result := runFlexLayout()

    if updateGolden {
        t.Logf("Updating golden file: %s", golden)
        os.WriteFile(golden, []byte(result), 0644)
        return
    }

    expected, err := os.ReadFile(golden)
    if err != nil {
        t.Fatal(err)
    }

    if string(expected) != result {
        t.Errorf("Layout output does not match golden file")
    }
}
```

---

## 代码审查清单

在提交 Pull Request 前，请确保：

### 功能完整性

- [ ] 代码实现了承诺的功能
- [ ] 所有测试通过
- [ ] 没有引入新的 TODO 或 FIXME

### 模块边界

- [ ] 没有从 runtime 导入 `tui/ui/*`
- [ ] 没有从 runtime 导入 `tea "github.com/charmbracelet/bubbletea"`
- [ ] 没有从 runtime 导入具体组件

### API 稳定性

- [ ] 没有修改现有公开接口的函数签名
- [ ] 没有删除或重命名字段
- [ ] 新功能通过新方法或新接口添加

### 测试

- [ ] 测试覆盖率 > 90%
- [ ] 所有边界情况已测试
- [ ] 有性能基准测试（如适用）

### 文档

- [ ] 更新了 API 文档
- [ ] 添加了代码注释
- [ ] 更新了 README（如需要）

### 性能

- [ ] 运行了性能基准测试
- [ ] 没有明显的性能回归
- [ ] 考虑了缓存和优化机会

---

## 常见错误模式

### ❌ 错误 1：Measure 阶段设置位置

```go
// 错误
func (e *Engine) measure(node *LayoutNode, c BoxConstraints) Size {
    node.X = 0  // ❌ Measure 不应该设置位置
    size := calculate(node)
    return size
}

// 正确
func (e *Engine) measure(node *LayoutNode, c BoxConstraints) Size {
    size := calculate(node)
    // ❌ 不设置 X/Y
    return size
}
```

### ❌ 错误 2：Layout 阶段修改尺寸

```go
// 错误
func (e *Engine) layout(node *LayoutNode, x, y int) {
    node.MeasuredWidth = 100  // ❌ Layout 不应该修改尺寸
    node.X = x
    node.Y = y
}

// 正确
func (e *Engine) layout(node *LayoutNode, x, y int) {
    node.X = x
    node.Y = y
    // ❌ 不修改 MeasuredWidth/Height
}
```

### ❌ 错误 3：Runtime 依赖具体组件

```go
// 错误
package runtime

import "github.com/yaoapp/yao/tui/ui/components/list"  // ❌ 违反边界

type Engine struct {
    list *list.List  // ❌ 不应该持有具体组件
}
```

### ❌ 错误 4：Runtime 依赖 Bubble Tea

```go
// 错误
package runtime

import tea "github.com/charmbracelet/bubbletea"  // ❌ Runtime 不应该依赖 Bubble Tea

func HandleMessage(msg tea.Msg) {  // ❌ Runtime 不应该处理 Bubble Tea 消息
    // ...
}
```

### ❌ 错误 5：破坏性 API 修改

```go
// 错误：添加新参数
func (e *Engine) Measure(node *LayoutNode, c BoxConstraints, useCache bool) Size {
    // 所有现有调用都需要修改
}

// 正确：添加新方法
func (e *Engine) MeasureWithCache(node *LayoutNode, c BoxConstraints) Size {
    // 新方法，不影响现有调用
}
```

---

## 提交流程

### 1. 创建 Feature 分支

```bash
git checkout -b feature/runtime-feature-name
```

### 2. 开发和测试

```bash
# 在 runtime/ 目录开发
cd tui/runtime

# 运行测试
go test ./... -v -cover

# 运行基准测试
go test ./... -bench=. -benchmem
```

### 3. 更新文档

- 更新 `README.md`（如果添加新功能）
- 更新相关 Go 文档注释
- 更新 `详细TODO list.md`（如果完成相关任务）

### 4. 提交

```bash
git add .
git commit -m "runtime: add feature description"
```

提交消息格式：

- `runtime: feat: add flex-basis support`
- `runtime: fix: correct padding calculation in measure`
- `runtime: perf: add measurement cache`

### 5. 创建 Pull Request

- 引用相关 Issue 或设计文档
- 描述变更动机
- 展示测试结果
- 展示性能对比（如适用）

---

## 发布流程

### v1 版本规则

Runtime v1 采用语义化版本：

- **MAJOR**: 破坏性 API 变更（v1 期间禁止）
- **MINOR**: 向后兼容的新功能
- **PATCH**: Bug 修复

### v1 发布检查清单

- [ ] 所有 API 冻结
- [ ] 完整文档
- [ ] 测试覆盖率 > 90%
- [ ] 性能基准建立
- [ ] 迁移指南完成

---

## 问题反馈

### 报告 Bug

1. 提供最小复现代码
2. 说明预期行为和实际行为
3. 提供相关日志或错误信息
4. 标注受影响的版本

### 功能请求

1. 描述功能用途
2. 提供使用场景
3. 说明为什么应该在 Runtime 层（而不是 UI 层）
4. 考虑 v1 与 v2 的划分

### 设计讨论

重大功能变更需要先讨论：

1. 创建设计文档 PR
2. 在 Issue 中讨论
3. 获得团队同意后实施

---

## 维护者指南

### 审核 Pull Request

1. **检查模块边界**
   - 搜索 `import.*tui/ui`
   - 搜索 `import.*tea.*bubbletea`
   - 搜索 `import.*tui/legacy`

2. **检查 API 破坏性**
   - 对比修改前后的函数签名
   - 检查删除的字段或函数

3. **检查测试**
   - 确认测试覆盖率 > 90%
   - 运行完整测试套件

4. **检查性能**
   - 运行基准测试
   - 对比性能变化

5. **检查文档**
   - 确认文档更新
   - 确认代码注释清晰

---

## 参考资料

- **核心设计文档**: `tui/docs/design/布局重构/方案落地/ui-runtime.md`
- **实施计划**: `tui/docs/design/布局重构/方案落地/详细TODO list.md`
- **技术细节**: `tui/docs/design/布局重构/技术细节/重构方案.md`
- **Runtime README**: `tui/runtime/README.md`

---

## 许可

Yao TUI Runtime 遵循项目的开源许可证。

---

_最后更新: 2026年1月22日_
_版本: v1.0_
