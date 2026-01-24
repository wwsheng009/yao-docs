# TUI 命令传播架构设计

**版本**: v1.0
**最后更新**: 2026年1月24日
**状态**: 已实施

---

## 问题陈述

当前架构存在根本性缺陷：**Bubble Tea 的 `tea.Cmd` 无法通过 Runtime 事件系统传播**。

### 影响范围

- 所有使用 `bubbles` 组件的组件（Input, TextArea, TextEditor 等）
- 所有需要返回 `tea.Cmd` 的组件
- 导致：
  - 光标闪烁不工作（`textinput.Blink()` 丢失）
  - 聚焦命令丢失（`textinput.Focus()` 丢失）
  - 异步操作命令丢失
  - TEA 组件状态不同步

### 根本原因

```
┌─────────────────────────────────────────────────────────┐
│  问题：两套并行系统无法正确集成                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Bubble Tea 系统         │  Runtime 事件系统            │
│  ────────────────        │  ─────────────────           │
│  Update(msg) →           │  EventResult                 │
│    (Model, Cmd)          │    - Handled                 │
│    ↑ 需要返回 Cmd         │    - Updated                 │
│    │                     │    - FocusChange             │
│    └─── 当前断裂！ ───────│    ❌ 无 Cmd 字段            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**模块边界约束**：`runtime/event` 包不能导入 `tea`，因此 `EventResult` 不能包含 `tea.Cmd`。

---

## 解决方案：双路径架构

### 核心思想

将事件分为两类，使用不同的处理路径：

1. **几何事件** → Runtime 事件系统（无 Cmd）
2. **组件消息** → Bubble Tea 消息路径（保留 Cmd）

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

---

## 架构设计

### 事件分类

| 事件类型         | 处理路径            | 保留 Cmd | 用途                         |
| ---------------- | ------------------- | -------- | ---------------------------- |
| `GeometryEvent`  | Runtime 事件系统    | ❌       | 鼠标命中测试、Tab 焦点导航   |
| `ComponentEvent` | Bubble Tea 消息路径 | ✅       | 键盘输入、光标闪烁、组件状态 |
| `SystemEvent`    | 系统处理            | ✅       | 窗口大小变化                 |

### 实现文件

| 文件                           | 类型 | 说明                       |
| ------------------------------ | ---- | -------------------------- |
| `tui/event_classifier.go`      | 新建 | 事件分类逻辑               |
| `tui/event_classifier_test.go` | 新建 | 单元测试                   |
| `tui/model.go`                 | 修改 | 重构 `Update()` 使用双路径 |
| `tui/MODULE_BOUNDARIES.md`     | 更新 | 添加命令传播架构说明       |

---

## API 参考

### EventClass 类型

```go
type EventClass int

const (
    GeometryEvent  EventClass = iota  // Runtime 事件系统
    ComponentEvent                     // Bubble Tea 路径
    SystemEvent                        // 系统处理
)
```

### 事件分类函数

```go
// ClassifyMessage 对消息进行分类
func ClassifyMessage(msg tea.Msg) EventClass

// IsNavigationKey 检查是否为焦点导航键
func IsNavigationKey(msg tea.KeyMsg) bool

// ShouldDispatchToRuntime 检查是否应该通过 Runtime 事件系统分发
func ShouldDispatchToRuntime(msg tea.Msg) bool

// ShouldPreserveCommands 检查是否应该保留 tea.Cmd
func ShouldPreserveCommands(msg tea.Msg) bool
```

---

## 组件开发指南

### 正确的组件实现

```go
// ✅ 正确：组件必须返回 Cmd

type MyComponent struct {
    // 包装 bubbles 组件
    teaModel *textinput.Model
}

func (c *MyComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    // 委托给包装的组件
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

### 常见错误

```go
// ❌ 错误：丢失命令
func (c *MyComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    newModel, cmd := c.teaModel.Update(msg)
    c.teaModel = &newModel
    return c, nil, core.Handled  // ❌ 丢失了 cmd！
}

// ❌ 错误：忘记订阅消息
func (c *MyComponent) GetSubscribedMessageTypes() []string {
    return nil  // ❌ 不会收到任何消息！
}
```

---

## 测试

### 单元测试

```bash
# 运行事件分类器测试
go test -v ./tui/ -run TestClassify

# 运行导航键测试
go test -v ./tui/ -run TestIsNavigation

# 运行所有相关测试
go test -v ./tui/ -run "TestClassify|TestIsNavigation|TestShould"
```

### 集成测试

```bash
# 测试 Input 组件（使用 TEA textinput）
go test -v ./tui/ui/components/input_test.go ./tui/ui/components/input.go

# 测试完整消息循环
go test -v ./tui/ -run TestInputFromFile
```

---

## 迁移指南

### 对于现有组件

**不需要修改** - 如果组件已经：

1. 正确实现 `UpdateMsg(msg tea.Msg)` 并返回 `tea.Cmd`
2. 注册消息订阅 `GetSubscribedMessageTypes()`

### 对于新组件

```go
// 步骤 1: 包装 TEA 组件
type MyComponent struct {
    model *some.BubbleModel
}

// 步骤 2: 实现 UpdateMsg
func (c *MyComponent) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    newModel, cmd := c.model.Update(msg)
    c.model = &newModel
    return c, cmd, core.Handled  // 返回 cmd！
}

// 步骤 3: 实现消息订阅
func (c *MyComponent) GetSubscribedMessageTypes() []string {
    return []string{"tea.KeyMsg", "cursor.BlinkMsg"}
}
```

---

## 架构优势

| 优势                          | 说明               |
| ----------------------------- | ------------------ |
| ✅ 解决所有组件的命令传播问题 | 不仅仅是 Input     |
| ✅ 保持模块边界               | runtime 不依赖 tea |
| ✅ 清晰的关注点分离           | 几何 vs 组件消息   |
| ✅ 向后兼容                   | 现有组件无需修改   |
| ✅ 易于扩展                   | 新组件自动受益     |
| ✅ 类型安全                   | 编译时检查         |

---

## 相关文档

- **模块边界定义**: `tui/MODULE_BOUNDARIES.md`
- **事件分类器**: `tui/event_classifier.go`
- **事件分类器测试**: `tui/event_classifier_test.go`
- **Model 实现**: `tui/model.go`

---

## 变更日志

| 版本 | 日期       | 变更内容                 |
| ---- | ---------- | ------------------------ |
| v1.0 | 2026-01-24 | 初始版本，实施双路径架构 |

---

_最后更新: 2026年1月24日_
_作者: Yao TUI 团队_
