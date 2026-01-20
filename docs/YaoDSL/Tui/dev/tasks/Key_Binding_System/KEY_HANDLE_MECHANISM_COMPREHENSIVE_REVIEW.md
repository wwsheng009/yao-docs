# TUI快捷键处理机制完整审查报告

## 一、当前架构分析

### 1.1 消息处理流程

```
用户按键
    ↓
Model.Update(msg)
    ↓
MessageHandlers["tea.KeyMsg"]
    ↓
handleKeyPress(msg)
    ├─ 检查 Ctrl+C (系统级)
    ├─ 有焦点？
    │   ├─ 是：分发给焦点组件
    │   │   ├─ 返回 Handled？
    │   │   │   ├─ 是
    │   │   │   │   ├─ 是全局导航键？
    │   │   │   │   │   └─ 是：执行全局导航（优先）
    │   │   │   │   │   └─ 否：返回组件结果
    │   │   │   │   └─ 否：继续
    │   │   └─ 否：继续
    │   └─ 否：跳过组件分发
    ├─ 检查全局导航键？
    │   └─ 是：执行全局导航
    ├─ 执行全局绑定
    └─ 完成
```

### 1.2 关键函数分析

#### handleKeyPress (model.go:391-418)

```go
func (m *Model) handleKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    // 1. Ctrl+C 强制退出
    if msg.Type == tea.KeyCtrlC {
        return m, tea.Quit
    }

    // 2. 有焦点时分发给组件
    if m.CurrentFocus != "" {
        updatedModel, cmd, handled := m.dispatchMessageToComponent(m.CurrentFocus, msg)
        if handled {
            // 组件处理了消息
            if m.isGlobalNavigationKey(msg) {
                // 但全局导航键优先级更高
                return m.handleGlobalNavigation(msg)
            }
            return updatedModel, cmd
        }
        m = updatedModel.(*Model)
    }

    // 3. 全局导航键作为备用
    if m.isGlobalNavigationKey(msg) {
        return m.handleGlobalNavigation(msg)
    }

    // 4. 全局 bindings
    return m.handleBoundActions(msg)
}
```

#### isGlobalNavigationKey (model.go:421-424)

```go
func (m *Model) isGlobalNavigationKey(msg tea.KeyMsg) bool {
    return msg.Type == tea.KeyTab || msg.Type == tea.KeyShiftTab ||
        (msg.Type == tea.KeyEsc && m.CurrentFocus != "")
}
```

**问题**：

- Tab/ShiftTab **无条件**作为全局导航键
- ESC 只有在有焦点时才是全局导航键

#### handleGlobalNavigation (model.go:427-449)

```go
func (m *Model) handleGlobalNavigation(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    switch msg.Type {
    case tea.KeyTab:
        return m.handleTabNavigation()
    case tea.KeyShiftTab:
        m.focusPrevComponent()
        return m, nil
    case tea.KeyEsc:
        if m.CurrentFocus != "" {
            m.clearFocus()
            // 执行ESC绑定
            key := msg.String()
            if m.Config.Bindings != nil {
                if action, ok := m.Config.Bindings[key]; ok {
                    return m.executeBoundAction(&action, key)
                }
            }
            return m, nil
        }
    }
    return m, nil
}
```

#### handleBoundActions (model.go:564-587)

```go
func (m *Model) handleBoundActions(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    key := msg.String()

    // 单字符键
    if len(msg.Runes) == 1 {
        char := string(msg.Runes[0])
        if action, ok := m.Config.Bindings[char]; ok {
            return m.executeBoundAction(&action, char)
        }
    }

    // 完整键名
    if action, ok := m.Config.Bindings[key]; ok {
        return m.executeBoundAction(&action, key)
    }

    return m, nil
}
```

## 二、发现的问题

### 2.1 严重问题

#### 问题1：Tab键冲突

**描述**：

- `loader.go:198` 默认绑定：`tab` → `tui.focus.next`
- `isGlobalNavigationKey` 将Tab无条件视为全局导航键
- 导致：Tab永远触发组件切换，无法覆盖

**代码位置**：

```go
// loader.go:198
setMissingBinding(cfg.Bindings, "tab", core.Action{Process: "tui.focus.next"})

// model.go:421
func (m *Model) isGlobalNavigationKey(msg tea.KeyMsg) bool {
    return msg.Type == tea.KeyTab ||  // ← 无条件
        msg.Type == tea.KeyShiftTab ||
        (msg.Type == tea.KeyEsc && m.CurrentFocus != "")
}
```

**影响**：

- 无法将Tab用于其他用途
- 与绑定系统冲突

#### 问题2：ESC双重处理

**描述**：
`handleGlobalNavigation`中ESC清除焦点后执行绑定，但后续不会再进入`handleBoundActions`，所以不会双重处理。但如果逻辑改变，可能出现问题。

**当前实际流程**：

```
ESC (有焦点)
    ↓
组件返回 Ignored
    ↓
handleGlobalNavigation
    ├─ clearFocus()
    ├─ 检查ESC绑定 ← 执行这里
    └─ return (不会继续到handleBoundActions)
```

**潜在问题**：

- 如果将来修改流程可能出现重复执行

#### 问题3：无焦点时Tab的行为不一致

**描述**：

- 默认绑定：`tab` → `tui.focus.next`
- 实际行为：Tab触发组件切换（忽略绑定）
- 用户无法禁用Tab导航

**期望**：

- 无焦点时，Tab应该检查绑定
- 如果没有绑定，才做默认的焦点切换

### 2.2 中等问题

#### 问题4：焦点切换逻辑不完整

**描述**：
`handleTabNavigation`只处理顺序切换，没有考虑：

- 反向切换（Shift+Tab）
- 无焦点时的切换时机

**代码位置**：

```go
// model.go:452-483
func (m *Model) handleTabNavigation() (tea.Model, tea.Cmd) {
    // 总是切换到下一个，无考虑Shift+Tab
    nextIndex := (currentIndex + 1) % len(focusableIDs)
    m.setFocus(focusableIDs[nextIndex])
}
```

#### 问题5：组件返回Handled的消息仍可能触发全局导航

**描述**：
即使组件返回`Handled`，全局导航键（如Tab/ESC）仍然优先

```go
if handled {
    if m.isGlobalNavigationKey(msg) {
        // 组件已Handled，但全局导航键仍然生效
        return m.handleGlobalNavigation(msg)
    }
}
```

这可能不是预期行为。

### 2.3 轻微问题

#### 问题6：缺乏焦点切换的显式切换机制

**描述**：
只有Tab/ShiftTab可以切换焦点，没有：

- 数字键快速切换
- 特定键切换到特定组件类型

#### 问题7：焦点切换没有循环边界标记

**描述**：
循环切换时没有明确指示已到边界

### 2.4 潜在的风险

#### 风险1：消息循环死锁

**描述**：
如果组件处理消息后又发布相同类型的消息（如KeyEvent），可能导致无限循环

**当前保护**：

- 组件只能返回`Cmd`，不能直接调用`Update`
- 较安全

#### 风险2：焦点状态不一致

**描述**：

- Model层：`m.CurrentFocus`
- 组件层：各种`focused`字段
- 两者可能不同步

**示例**：

```go
// Menu组件返回Handled但没有Blur
case tea.KeyEsc:
    return w, nil, core.Handled  // ← Model不清除焦点
```

## 三、完整修复方案

### 3.1 重新设计决策树

```
按键事件
    ↓
优先级1：系统强制
    ├─ Ctrl+C → 立即退出
    └─ 继续
    ↓
优先级2：特殊功能键（无条件）
    ├─ F1-F12 → 绑定或默认
    └─ 继续
    ↓
优先级3：焦点存在性检查
    ├─ 无焦点 → 跳过组件处理，到优先级5
    └─ 有焦点 → 继续
    ↓
优先级4：组件处理（有焦点时）
    ├─ 分发给焦点组件
    ├─ 组件返回 Ignored → 到优先级6
    ├─ 组件返回 Handled → 检查是否为强制全局键
    │   ├─ 是（ESC）→ 执行ESC特殊流程
    │   └─ 否 → 结束
    └─ 继续
    ↓
优先级5：全局导航键（无焦点或有焦点但组件未处理）
    ├─ 有Tab绑定？→ 执行绑定
    ├─ 无Tab绑定？→ 切换焦点
    ├─ 有Shift+Tab绑定？→ 执行绑定
    ├─ 无Shift+Tab绑定？→ 反向切换焦点
    └─ 继续
    ↓
优先级6：全局绑定（兜底）
    ├─ 检查所有键绑定
    └─ 继续
    ↓
优先级7：默认处理
    └─ 忽略
```

### 3.2 修复代码

#### 修复1：移除Tab默认绑定

```go
// loader.go:198 (修改前)
setMissingBinding(cfg.Bindings, "tab", core.Action{Process: "tui.focus.next"})

// 修改后：移除此行或改为可选
// Tab/ShiftTab作为原生导航键，不需要绑定
```

#### 修复2：重构isGlobalNavigationKey

```go
// 新增：原生导航键定义（不依赖绑定系统）
var nativeNavigationKeys = map[tea.KeyType]bool{
    tea.KeyTab:      true,
    tea.KeyShiftTab: true,
}

// 两种模式：
// 1. 原生模式：Tab始终是导航键
const ModeNativeNavigation = "native"
// 2. 绑定模式：Tab可以绑定到其他操作
const ModeBindableNavigation = "bindable"

// 全局导航键检查
func (m *Model) isGlobalNavigationKey(msg tea.KeyMsg) bool {
    // ESC只在有焦点时作为全局导航键
    if msg.Type == tea.KeyEsc && m.CurrentFocus != "" {
        return true
    }

    // Tab/ShiftTab根据模式决定
    if m.Config.NavigationMode == "" {
        m.Config.NavigationMode = ModeNativeNavigation // 默认原生模式
    }

    switch m.Config.NavigationMode {
    case ModeNativeNavigation:
        return nativeNavigationKeys[msg.Type]
    case ModeBindableNavigation:
        // 不作为原生导航键，由绑定系统处理
        return false
    default:
        return nativeNavigationKeys[msg.Type]
    }
}
```

#### 修复3：重构handleKeyPress

```go
func (m *Model) handleKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    // 优先级1：系统强制退出
    if msg.Type == tea.KeyCtrlC {
        return m, tea.Quit
    }

    // 优先级2：特殊功能键（无条件）
    if m.isFunctionKey(msg) {
        return m.handleBoundActions(msg)
    }

    // 优先级3：焦点存在性检查
    hasFocus := m.CurrentFocus != ""

    // 优先级4：组件处理（有焦点时）
    if hasFocus {
        updatedModel, cmd, handled := m.dispatchMessageToComponent(m.CurrentFocus, msg)
        if handled {
            // 组件已处理，检查是否为强制全局键
            if m.isForceGlobalKey(msg) {
                return m.handleGlobalNavigationWithFocus(msg)
            }
            return updatedModel, cmd
        }
        m = updatedModel.(*Model)
    }

    // 优先级5：原生导航键
    if m.isNativeNavigationKey(msg) {
        return m.handleNativeNavigation(msg, hasFocus)
    }

    // 优先级6：全局绑定
    return m.handleBoundActions(msg)
}

// 辅助函数
func (m *Model) isFunctionKey(msg tea.KeyMsg) bool {
    // F1-F12, F13-F24等
    return msg.Type >= tea.KeyF1 && msg.Type <= tea.KeyF24
}

func (m *Model) isForceGlobalKey(msg tea.KeyMsg) bool {
    // ESC总是可以触发全局流程（即使组件Handled）
    return msg.Type == tea.KeyEsc
}

func (m *Model) handleGlobalNavigationWithFocus(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    switch msg.Type {
    case tea.KeyEsc:
        m.clearFocus()
        // 执行ESC绑定（如果存在）
        key := msg.String()
        if m.Config.Bindings != nil {
            if action, ok := m.Config.Bindings[key]; ok {
                return m.executeBoundAction(&action, key)
            }
        }
        return m, nil
    }
    return m, nil
}

func (m *Model) handleNativeNavigation(msg tea.KeyMsg, hadFocus bool) (tea.Model, tea.Cmd) {
    switch msg.Type {
    case tea.KeyTab:
        // 检查是否有绑定
        key := msg.String()
        if m.Config.Bindings != nil {
            if action, ok := m.Config.Bindings[key]; ok {
                return m.executeBoundAction(&action, key)
            }
        }
        // 无绑定，执行默认导航
        return m.handleTabNavigation()
    case tea.KeyShiftTab:
        // 检查是否有绑定
        key := msg.String()
        if m.Config.Bindings != nil {
            if action, ok := m.Config.Bindings[key]; ok {
                return m.executeBoundAction(&action, key)
            }
        }
        // 无绑定，执行反向导航
        return m, tea.Cmd{func() tea.Msg {
            m.focusPrevComponent()
            return nil
        }}
    }
    return m, nil
}
```

### 3.3 添加配置选项

```go
// types.go
type Config struct {
    // ... 现有字段

    // NavigationMode 定义Tab/ShiftTab的行为
    // "native": Tab始终导航（默认）
    // "bindable": Tab可以用绑定覆盖
    NavigationMode string

    // TabCycles 定义Tab是否循环
    TabCycles bool

    // FirstFocusOnStart 定义启动时是否自动聚焦第一个组件
    FirstFocusOnStart bool
}
```

### 3.4 焦点切换增强

```go
// 添加循环控制
func (m *Model) handleTabNavigation() (tea.Model, tea.Cmd) {
    log.Trace("Tab pressed, cycling focus between components, current focus: %s", m.CurrentFocus)

    focusableIDs := m.getFocusableComponentIDs()
    if len(focusableIDs) == 0 {
        log.Trace("No focusable components found")
        return m, nil
    }

    // 无焦点：聚焦第一个
    if m.CurrentFocus == "" {
        m.setFocus(focusableIDs[0])
        log.Trace("Focused to first component: %s", focusableIDs[0])
        return m, nil
    }

    // 查找当前焦点位置
    currentIndex := -1
    for i, id := range focusableIDs {
        if id == m.CurrentFocus {
            currentIndex = i
            break
        }
    }

    // 当前焦点不在列表中（可能被移除）
    if currentIndex == -1 {
        m.setFocus(focusableIDs[0])
        log.Trace("Current focus not found, focusing to first: %s", focusableIDs[0])
        return m, nil
    }

    // 切换焦点（考虑是否循环）
    var nextFocus string
    if m.Config.TabCycles {
        // 循环模式
        nextIndex := (currentIndex + 1) % len(focusableIDs)
        nextFocus = focusableIDs[nextIndex]
    } else {
        // 非循环模式
        if currentIndex < len(focusableIDs)-1 {
            nextFocus = focusableIDs[currentIndex+1]
        } else {
            // 已到最后一个，不切换
            log.Trace("Already at last focusable component, not cycling")
            return m, nil
        }
    }

    m.setFocus(nextFocus)
    log.Trace("Focused to next component: %s (index %d)", nextFocus, currentIndex+1)

    return m, nil
}

// 反向导航
func m.focusPrevComponent() {
    focusableIDs := m.getFocusableComponentIDs()
    if len(focusableIDs) == 0 {
        return
    }

    // 无焦点：聚焦最后一个
    if m.CurrentFocus == "" {
        m.setFocus(focusableIDs[len(focusableIDs)-1])
        return
    }

    // 查找当前位置
    currentIndex := -1
    for i, id := range focusableIDs {
        if id == m.CurrentFocus {
            currentIndex = i
            break
        }
    }

    // 切换到上一个
    var prevFocus string
    if m.Config.TabCycles {
        // 循环模式
        prevIndex := (currentIndex - 1 + len(focusableIDs)) % len(focusableIDs)
        prevFocus = focusableIDs[prevIndex]
    } else {
        // 非循环模式
        if currentIndex > 0 {
            prevFocus = focusableIDs[currentIndex-1]
        } else {
            // 已到第一个，不切换
            log.Trace("Already at first focusable component, not cycling")
            return
        }
    }

    m.setFocus(prevFocus)
}
```

### 3.5 添加快捷切换机制

```go
// 添加数字键快速切换（可选）
func (m *Model) handleKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
    // ... 现有逻辑

    // 数字键快速切换（Alt+1-9）
    if msg.Alt && len(msg.Runes) == 1 {
        char := msg.Runes[0]
        if char >= '1' && char <= '9' {
            index := int(char - '1')
            focusableIDs := m.getFocusableComponentIDs()
            if index < len(focusableIDs) {
                m.setFocus(focusableIDs[index])
                log.Trace("Alt+%d focused to component: %s", index+1, focusableIDs[index])
                return m, nil
            }
        }
    }

    // ... 继续处理
}
```

### 3.6 焦点一致性检查

```go
// 添加焦点状态一致性验证（调试用）
func (m *Model) validateFocusState() {
    if m.CurrentFocus == "" {
        return
    }

    comp, exists := m.Components[m.CurrentFocus]
    if !exists {
        log.Warn("Focus state inconsistent: component %s not found", m.CurrentFocus)
        m.CurrentFocus = ""
        return
    }

    // 检查组件焦点状态
    switch comp.Type {
    case "input":
        if input, ok := comp.Instance.(*components.InputComponentWrapper); ok {
            if input.model.Focused() {
                return // 一致
            }
            log.Warn("Focus state inconsistent: input %s not focused", m.CurrentFocus)
        }
    case "table":
        if table, ok := comp.Instance.(*components.TableComponentWrapper); ok {
            if table.model.Model.Focused() {
                return // 一致
            }
            log.Warn("Focus state inconsistent: table %s not focused", m.CurrentFocus)
        }
    }
}
```

## 四、增强组件行为规范

### 4.1 组件UpdateMsg标准模式

```go
func (w *ComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        // 第一步：检查焦点状态（所有组件必须）
        if !checkFocus() {
            return w, nil, core.Ignored
        }

        // 第二步：特殊键处理
        switch msg.Type {
        case tea.KeyEsc:
            // ESC标准行为：blur + Ignored
            blur()
            return w, nil, core.Ignored
        case tea.KeyTab:
            // Tab标准行为：Ignored（让全局处理）
            return w, nil, core.Ignored
        case tea.KeyShiftTab:
            // Shift+Tab标准行为：Ignored（让全局处理）
            return w, nil, core.Ignored
        }

        // 第三步：组件特定处理
        // ...
    }

    // 非按键消息处理...
}
```

### 4.2 ESC处理规范

```go
// 标准模式：让全局处理ESC
case tea.KeyEsc:
    blur()
    return w, nil, core.Ignored

// 阻止模式：组件内部处理ESC（不推荐）
case tea.KeyEsc:
    blur()
    // 执行组件特定逻辑
    return w, cancelCmd, core.Handled
```

### 4.3 Tab处理规范

```go
// 推荐模式：让全局处理Tab
case tea.KeyTab:
    return w, nil, core.Ignored

// 内部Tab模式：仅在特殊组件中使用（如菜单、表格）
case tea.KeyTab:
    // 组件内部Tab处理
    return w, nil, core.Handled
```

## 五、完整测试矩阵

### 5.1 基础功能测试

| 场景      | 按键         | 初始焦点 | 组件状态      | 预期结果           | 状态      |
| --------- | ------------ | -------- | ------------- | ------------------ | --------- |
| 退出      | Ctrl+C       | 任意     | 任意          | 立即退出           | ✓         |
| 退出      | q (无焦点)   | 无       | -             | 执行退出           | ⚠️ 需验证 |
| Tab       | Tab (无焦点) | 无       | -             | 聚焦第一个         | ✓         |
| Tab       | Tab (有焦点) | Input    | Input.Handled | 切换焦点           | ⚠️ 需验证 |
| Shift+Tab | Shift+Tab    | Input    | -             | 前一个组件         | ✓         |
| ESC       | ESC (有焦点) | Input    | Input.Ignored | 失焦+可能的ESC操作 | ✓         |
| ESC       | ESC (无焦点) | 无       | -             | 检查ESC绑定        | ✓         |

### 5.2 冲突场景测试

| 场景        | 按键 | 初始焦点 | 配置              | 预期行为          | 状态        |
| ----------- | ---- | -------- | ----------------- | ----------------- | ----------- |
| Tab绑定冲突 | Tab  | Input    | tab→custom.action | 执行绑定          | ❌ 当前失败 |
| ESC重复执行 | ESC  | Input    | esc→quit          | 失焦+退出（一次） | ✓           |
| 焦点不一致  | Tab  | Input    | -                 | 焦点状态一致      | ⚠️ 需验证   |

### 5.3 边界条件测试

| 场景         | 描述            | 预期结果      | 状态      |
| ------------ | --------------- | ------------- | --------- |
| 无焦点组件   | 无focusable组件 | Tab无效       | ⚠️ 需验证 |
| 单组件       | 只有1个Input    | Tab循环或停止 | ⚠️ 需验证 |
| 组件移除     | 焦点组件被删除  | 焦点清空      | ⚠️ 需验证 |
| 快速连续按键 | 快速按Tab       | 稳定切换      | ⚠️ 需验证 |

## 六、推荐配置

### 6.1 默认配置

```go
// loader.go
func SetDefaultBindings(cfg *Config) {
    if cfg.Bindings == nil {
        cfg.Bindings = make(map[string]core.Action)
    }

    // 系统操作
    setMissingBinding(cfg.Bindings, "ctrl+c", core.Action{Process: "tui.quit"})
    setMissingBinding(cfg.Bindings, "q", core.Action{Process: "tui.quit"})

    // 原生导航键（不绑定，由代码处理）
    // Tab/ShiftTab: 原生导航

    // 功能键
    setMissingBinding(cfg.Bindings, "f1", core.Action{Process: "tui.help"})
    setMissingBinding(cfg.Bindings, "f10", core.Action{Process: "tui.quit"})

    // 其他操作
    setMissingBinding(cfg.Bindings, "ctrl+r", core.Action{Process: "tui.refresh"})
    setMissingBinding(cfg.Bindings, "ctrl+q", core.Action{Process: "tui.quit"})

    // Tab模式（默认原生）
    if cfg.NavigationMode == "" {
        cfg.NavigationMode = ModeNativeNavigation
    }

    // Tab循环（默认开启）
    if cfg.TabCycles == false {
        cfg.TabCycles = true  // 显式默认值
    }
}

// 移除Tab默认 bindings
// 移除这行：setMissingBinding(cfg.Bindings, "tab", core.Action{Process: "tui.focus.next"})
```

### 6.2 用户配置

```yaml
# 使用原生Tab导航（推荐）
navigation_mode: native
tab_cycles: true
first_focus_on_start: true

# 或使用可绑定Tab模式
navigation_mode: bindable
bindings:
  tab:
    process: "custom.action"
  shift+tab:
    process: "custom.back"
```

## 七、迁移指南

### 7.1 从旧版本迁移

如果用户已配置Tab绑定：

```yaml
# 旧配置
bindings:
  tab:
    process: "custom.action"

# 新配置
navigation_mode: bindable  # 启用可绑定模式
bindings:
  tab:
    process: "custom.action"
```

### 7.2 组件开发者迁移

所有交互组件必须：

1. 实现焦点检查
2. ESC返回Ignored
3. Tab返回Ignored（除非有特殊需求）

## 八、总结

### 8.1 关键修复点

1. **移除Tab默认绑定** - 避免冲突
2. **添加导航模式** - 支持原生/可绑定
3. **重构按键处理** - 明确优先级
4. **增强焦点切换** - 支持循环控制
5. **添加一致性验证** - 调试支持
6. **规范化组件行为** - 统一标准

### 8.2 优势

- **清晰性**：按键处理流程序明确
- **灵活性**：支持多种导航模式
- **可靠性**：焦点状态一致性保证
- **可扩展**：易于添加新功能

### 8.3 风险缓解

- Tab冲突：通过导航模式解决
- ESC重复：单一处理路径
- 焦点不一致：验证机制
- 边界条件：完整测试矩阵

### 8.4 需要实现的功能

1. 修复loader.go（移除Tab绑定）
2. 实现新的handleKeyPress逻辑
3. 添加NavigationMode配置
4. 实现循环控制
5. 添加验证函数
6. 更新文档
7. 完整测试

## 相关文档

- [ESC_QUIT_KEY_FIX.md](./ESC_QUIT_KEY_FIX.md) - ESC键修复
- [FOCUS_STATE_AND_TAB_NAVIGATION_FIX.md](./FOCUS_STATE_AND_TAB_NAVIGATION_FIX.md) - 焦点与Tab导航修复
- [ESC_GLOBAL_BINDING_PRIORITY.md](./ESC_GLOBAL_BINDING_PRIORITY.md) - ESC全局绑定优先级
