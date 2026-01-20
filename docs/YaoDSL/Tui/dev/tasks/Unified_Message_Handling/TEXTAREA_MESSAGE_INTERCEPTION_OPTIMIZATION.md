# Textarea 组件消息拦截优化设计

## 优化目标

在保留消息拦截功能的同时，最大化利用 `bubbles/textarea` 的原生功能。

## 核心设计原则

### 1. 分层拦截策略

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: 定向消息处理 (TargetedMsg)              │
│ - 检查消息是否针对此组件                           │
│ - 递归处理内部消息                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: 按键消息分层处理 (KeyMsg)               │
│   ├─ Layer 2.1: 焦点检查                          │
│   │     - 无焦点：返回 Ignored                        │
│   │     - 有焦点：继续处理                            │
│   │                                               │
│   ├─ Layer 2.2: 拦截特殊按键                     │
│   │     ├─ ESC: 失焦（原始 textarea 不处理）      │
│   │     ├─ Tab: 导航（原始 textarea 不处理）      │
│   │     └─ Enter: 条件拦截（EnterSubmits）       │
│   │                                               │
│   └─ Layer 2.3: 其他按键委托给原生组件          │
│         - 光标移动（上下左右、Home/End）            │
│         - 文本编辑（输入、删除）                     │
│         - 复制粘贴（Ctrl+V、Ctrl+C）              │
│         - 所有其他按键功能                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: 非按键消息委托给原生组件                │
│ - 鼠标消息、剪贴板消息等                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. 关键设计决策

#### 2.1 焦点检查（必须保留）

```go
// Layer 2.1: Focus check (MUST keep)
if !w.model.Focused() {
    return w, nil, core.Ignored
}
```

**为什么必须保留**：

- 允许全局快捷键（如 `q` 退出）在组件无焦点时工作
- 防止键盘事件泄漏到无焦点的组件
- 符合 TUI 系统的焦点管理机制

#### 2.2 ESC 拦截（安全）

**原因**：原始 `bubbles/textarea` **不处理** ESC 键

```go
case tea.KeyEsc:
    // 原始 textarea 不处理 ESC，我们可以安全拦截
    oldFocus := w.model.Focused()
    w.model.Blur()
    newFocus := w.model.Focused()

    if oldFocus != newFocus {
        eventCmd := core.PublishEvent(w.model.id, core.EventInputFocusChanged, map[string]interface{}{
            "focused": newFocus,
        })
        return w, eventCmd, core.Handled
    }
    return w, nil, core.Handled
```

#### 2.3 Tab 拦截（安全）

**原因**：原始 `bubbles/textarea` **不处理** Tab 键

```go
case tea.KeyTab:
    // 原始 textarea 不处理 Tab，我们可以安全拦截用于导航
    return w, nil, core.Ignored
```

#### 2.4 Enter 条件拦截（灵活）

**原因**：原始 `bubbles/textarea` 默认用 Enter 插入换行

```go
case tea.KeyEnter:
    // 条件拦截：只有当 EnterSubmits=true 时才拦截
    if w.model.props.EnterSubmits {
        // 拦截用于表单提交
        eventCmd := core.PublishEvent(w.model.id, core.EventInputEnterPressed, map[string]interface{}{
            "value": w.model.Value(),
        })
        return w, eventCmd, core.Ignored
    }
    // EnterSubmits=false，fallthrough 让原始 textarea 处理
    fallthrough
```

#### 2.5 其他按键完全委托（最大化原生功能）

**关键代码**：

```go
default:
    // Layer 2.3: All other keys - delegate to original textarea
    oldValue := w.model.Value()
    oldFocus := w.model.Focused()

    // 让原始 textarea 处理这个按键
    var cmd tea.Cmd
    w.model.Model, cmd = w.model.Model.Update(keyMsg)

    // 检测状态变化并发布事件
    newValue := w.model.Value()
    newFocus := w.model.Focused()

    // ... 发布事件 ...

    return w, cmd, core.Handled
```

**保留的原生功能**：

- ✅ 光标移动：↑ ↓ ← → Home End
- ✅ 文本编辑：所有字符输入
- ✅ 删除操作：Backspace Delete Ctrl+K Ctrl+U
- ✅ 单词操作：Alt+← Alt+→ Alt+Backspace Alt+Delete
- ✅ 换行操作：Enter（当 EnterSubmits=false）
- ✅ 复制粘贴：Ctrl+V Ctrl+C
- ✅ 字符大小写转换：Alt+U Alt+L Alt+C
- ✅ 视口滚动：PageUp PageDown
- ✅ 所有其他 bubbles/textarea 提供的功能

## 消息流程示例

### 示例 1：输入字符 'a'（非焦点组件）

```
1. 用户按下 'a' 键
2. Model.handleKeyPress 检查焦点
   └─ CurrentFocus != textarea.id
3. 调用 dispatchMessageToComponent(textarea.id, tea.KeyMsg)
4. TextareaComponentWrapper.UpdateMsg()
   ├─ Layer 1: 非定向消息
   ├─ Layer 2.1: Focused() == false
   │   └─ 返回 core.Ignored
   └─ 消息继续，全局绑定可以处理
```

**结果**：全局绑定（如 `q` 退出）正常工作 ✅

### 示例 2：输入字符 'a'（焦点组件）

```
1. 用户按下 'a' 键
2. Model.handleKeyPress 检查焦点
   └─ CurrentFocus == textarea.id
3. 调用 dispatchMessageToComponent(textarea.id, tea.KeyMsg)
4. TextareaComponentWrapper.UpdateMsg()
   ├─ Layer 1: 非定向消息
   ├─ Layer 2.1: Focused() == true，继续
   ├─ Layer 2.2: 非特殊按键（ESC/Tab/Enter）
   ├─ Layer 2.3: 调用 w.model.Model.Update(keyMsg)
   │   └─ bubbles/textarea 内部处理：
   │       - 添加字符 'a' 到光标位置
   │       - 更新内部状态
   │       - 返回 cmd（可能包含光标闪烁命令）
   └─ 检测值变化：
       - oldValue: ""
       - newValue: "a"
       └─ 发布 EventInputValueChanged 事件
   └─ 返回 core.Handled
5. 消息被标记为已处理，不再继续传递
```

**结果**：字符 'a' 成功输入，值变化事件被发布 ✅

### 示例 3：按下 ESC 键（焦点组件）

```
1. 用户按下 ESC 键
2. Model.handleKeyPress 检查焦点
   └─ CurrentFocus == textarea.id
3. 调用 dispatchMessageToComponent(textarea.id, tea.KeyMsg)
4. TextareaComponentWrapper.UpdateMsg()
   ├─ Layer 1: 非定向消息
   ├─ Layer 2.1: Focused() == true，继续
   ├─ Layer 2.2: 拦截 ESC
   │   ├─ oldFocus = true
   │   ├─ w.model.Blur()
   │   ├─ newFocus = false
   │   ├─ oldFocus != newFocus，发布 EventInputFocusChanged 事件
   │   └─ 返回 core.Handled
   └─ 消息被标记为已处理
5. Model.handleKeyPress 检测到 handled，不再继续处理
```

**结果**：组件失去焦点，焦点变化事件被发布 ✅

### 示例 4：按下 Tab 键（焦点组件）

```
1. 用户按下 Tab 键
2. Model.handleKeyPress 检查焦点
   └─ CurrentFocus == textarea.id
3. 调用 dispatchMessageToComponent(textarea.id, tea.KeyMsg)
4. TextareaComponentWrapper.UpdateMsg()
   ├─ Layer 1: 非定向消息
   ├─ Layer 2.1: Focused() == true，继续
   ├─ Layer 2.2: 拦截 Tab
   │   └─ 返回 core.Ignored
   └─ 消息被标记为未处理
5. Model.handleKeyPress 检测到 ignored，继续处理
6. 调用 handleTabNavigation()
   └─ 切换焦点到下一个可聚焦组件
```

**结果**：焦点切换到下一个组件 ✅

### 示例 5：按下 Enter 键（EnterSubmits=true）

```
1. 用户按下 Enter 键
2. Model.handleKeyPress 检查焦点
   └─ CurrentFocus == textarea.id
3. 调用 dispatchMessageToComponent(textarea.id, tea.KeyMsg)
4. TextareaComponentWrapper.UpdateMsg()
   ├─ Layer 1: 非定向消息
   ├─ Layer 2.1: Focused() == true，继续
   ├─ Layer 2.2: 拦截 Enter
   │   ├─ EnterSubmits == true
   │   ├─ 发布 EventInputEnterPressed 事件（包含当前值）
   │   └─ 返回 core.Ignored
   └─ 消息被标记为未处理
5. Model.handleKeyPress 检测到 ignored，继续处理
6. 检测到 Enter 事件，处理表单提交逻辑
```

**结果**：表单提交逻辑被触发，不会插入换行 ✅

### 示例 6：按下 Enter 键（EnterSubmits=false）

```
1. 用户按下 Enter 键
2. Model.handleKeyPress 检查焦点
   └─ CurrentFocus == textarea.id
3. 调用 dispatchMessageToComponent(textarea.id, tea.KeyMsg)
4. TextareaComponentWrapper.UpdateMsg()
   ├─ Layer 1: 非定向消息
   ├─ Layer 2.1: Focused() == true，继续
   ├─ Layer 2.2: Enter 不满足拦截条件
   │   ├─ EnterSubmits == false
   │   └─ fallthrough 到 default
   ├─ Layer 2.3: 委托给原始 textarea
   │   ├─ 调用 w.model.Model.Update(keyMsg)
   │   │   └─ bubbles/textarea 内部处理：
   │   │       - 插入换行符
   │   │       - 移动光标到下一行
   │   │       - 更新内部状态
   │   └─ 检测值变化，发布事件
   └─ 返回 core.Handled
5. 消息被标记为已处理，不再继续传递
```

**结果**：换行被插入到 textarea，行为与原生一致 ✅

## 优化前后对比

### 优化前的问题

| 问题                                    | 代码位置         | 影响               |
| --------------------------------------- | ---------------- | ------------------ |
| ❌ 过度干预具体按键处理                 | 296-320 行       | 阻止了部分原生功能 |
| ❌ ESC/Enter/Tab 处理后直接返回 Ignored | 304, 314, 318 行 | 阻止后续处理       |
| ❌ 未充分利用 textarea 原生能力         | 整体             | 重复造轮子         |

### 优化后的改进

| 改进                  | 代码位置       | 效果                       |
| --------------------- | -------------- | -------------------------- |
| ✅ 分层清晰的消息处理 | 整个 UpdateMsg | 逻辑清晰，易于维护         |
| ✅ 最大化原生功能利用 | default 分支   | 保留所有 textarea 原生能力 |
| ✅ 灵活的 Enter 拦截  | Enter 处理     | EnterSubmits 可配置        |
| ✅ 统一的状态检测     | 所有分支       | 一致的事件发布             |
| ✅ 安全的拦截策略     | ESC/Tab/Enter  | 只拦截 textarea 不处理的键 |

## 关键优势

### 1. 最大化原生功能

- **100% 保留** `bubbles/textarea` 的所有按键处理
- 用户获得完整的编辑体验
- 无需重复实现复杂逻辑

### 2. 清晰的拦截点

- **只有 3 个拦截点**：ESC、Tab、条件 Enter
- 每个拦截点都有明确的原因和文档
- 易于理解和维护

### 3. 灵活的配置

- `EnterSubmits` 属性控制 Enter 行为
- 无需修改代码即可调整行为
- 向后兼容

### 4. 事件完整性

- 状态变化始终被捕获
- 事件发布统一处理
- 外部可以正确响应组件变化

### 5. 消息流控制

- `Handled`: 消息已处理，停止传递
- `Ignored`: 消息未处理，继续传递
- 正确使用 Response 枚举

## 测试建议

### 单元测试

```go
func TestTextareaWrapper_DefaultKeys(t *testing.T) {
    // 测试默认按键是否委托给原生 textarea
    wrapper := createFocusedWrapper()

    // 测试字符输入
    msg := tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}}
    updatedWrapper, cmd, response := wrapper.UpdateMsg(msg)
    assert.Equal(t, core.Handled, response)
    assert.Equal(t, "a", updatedWrapper.GetValue())
}

func TestTextareaWrapper_ESCKey(t *testing.T) {
    // 测试 ESC 拦截
    wrapper := createFocusedWrapper()

    msg := tea.KeyMsg{Type: tea.KeyEsc}
    updatedWrapper, cmd, response := wrapper.UpdateMsg(msg)

    assert.Equal(t, core.Handled, response)
    assert.False(t, updatedWrapper.HasFocus())
    // 检查是否发布了焦点变化事件
    assert.NotNil(t, cmd)
}

func TestTextareaWrapper_TabKey(t *testing.T) {
    // 测试 Tab 拦截
    wrapper := createFocusedWrapper()

    msg := tea.KeyMsg{Type: tea.KeyTab}
    _, _, response := wrapper.UpdateMsg(msg)

    assert.Equal(t, core.Ignored, response)
    // Tab 应该让上层处理导航
}

func TestTextareaWrapper_EnterKey_Submits(t *testing.T) {
    // 测试 Enter 提交模式
    props := TextareaProps{EnterSubmits: true}
    wrapper := createWrapperWithProps(props)
    wrapper.SetFocus(true)

    msg := tea.KeyMsg{Type: tea.KeyEnter}
    _, cmd, response := wrapper.UpdateMsg(msg)

    assert.Equal(t, core.Ignored, response)
    // 应该发布 Enter 事件
    assert.NotNil(t, cmd)
    // 值不应该包含换行
    assert.NotContains(t, wrapper.GetValue(), "\n")
}

func TestTextareaWrapper_EnterKey_NoSubmits(t *testing.T) {
    // 测试 Enter 非提交模式
    props := TextareaProps{EnterSubmits: false}
    wrapper := createWrapperWithProps(props)
    wrapper.SetFocus(true)

    msg := tea.KeyMsg{Type: tea.KeyEnter}
    _, _, response := wrapper.UpdateMsg(msg)

    assert.Equal(t, core.Handled, response)
    // 应该包含换行
    assert.Contains(t, wrapper.GetValue(), "\n")
}

func TestTextareaWrapper_NoFocus(t *testing.T) {
    // 测试无焦点时的行为
    wrapper := createWrapperWithProps(TextareaProps{Disabled: false})

    // 初始焦点被设置，需要手动移除
    wrapper.SetFocus(false)

    msg := tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}}
    _, _, response := wrapper.UpdateMsg(msg)

    assert.Equal(t, core.Ignored, response)
    // 值不应该改变
    assert.Equal(t, "", wrapper.GetValue())
}
```

### 集成测试

- 测试在表单中的交互
- 测试 Tab 导航
- 测试全局快捷键与组件交互
- 测试焦点切换逻辑

## 总结

本次优化成功实现了以下目标：

1. ✅ **保留消息拦截功能**：ESC、Tab、条件 Enter
2. ✅ **最大化原生功能利用**：其他按键完全委托给 textarea
3. ✅ **清晰的分层结构**：易于理解和维护
4. ✅ **灵活的配置能力**：EnterSubmits 可配置
5. ✅ **完整的事件系统**：状态变化始终被捕获

**核心理念**：**只拦截必要的，其余全部委托**。这样既保持了控制力，又充分利用了成熟组件的原生能力。
