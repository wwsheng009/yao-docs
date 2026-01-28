# Input组件直接实现重构方案

## 核心理念

**直接实现 > 适配器模式**

让`InputComponentWrapper`直接实现所有需要的接口，而不是通过适配器来桥接。

## 重构后结构

```
InputComponentWrapper (*InputComponentWrapper)
    ├── model textinput.Model    // 直接使用原生组件
    ├── props InputProps         // 组件属性
    ├── id string                // 组件ID
    ├── bindings []core.ComponentBinding
    └── // 直接实现所有必要接口，无需适配器
```

## 直接实现的优势

1. **零适配器开销**：没有额外的对象创建
2. **代码更清晰**：逻辑集中在一个地方
3. **性能最优**：最少的方法调用层级
4. **维护简单**：只有一个实现源头

## 具体实现方案

### 第一步：分析需要实现的接口

`InputComponentWrapper`需要直接实现：

- `core.Valuer` (GetValue方法)
- `core.Focuser` (Focused, SetFocus方法)
- `core.ComponentInterface` (各种组件方法)
- `ComponentWrapper` (GetModel, GetID等方法)

### 第二步：直接在Wrapper中实现

```go
type InputComponentWrapper struct {
    model textinput.Model        // 直接使用原生组件
    props InputProps
    id string
    bindings []core.ComponentBinding
    // 不需要stateHelper中的适配器引用
}

// 直接实现core.Valuer接口
func (w *InputComponentWrapper) GetValue() string {
    return w.model.Value()  // 直接调用原生方法
}

// 直接实现core.Focuser接口
func (w *InputComponentWrapper) Focused() bool {
    return w.model.Focused()  // 直接调用原生方法
}

func (w *InputComponentWrapper) SetFocus(focus bool) {
    if focus {
        w.model.Focus()
    } else {
        w.model.Blur()
    }
}

// 直接实现ComponentInterface方法
func (w *InputComponentWrapper) GetID() string {
    return w.id  // 直接返回自己的字段
}

func (w *InputComponentWrapper) GetComponentType() string {
    return "input"
}

func (w *InputComponentWrapper) View() string {
    return w.model.View()  // 直接调用原生方法
}

// 直接实现ComponentWrapper方法
func (w *InputComponentWrapper) GetModel() interface{} {
    return w.model  // 直接返回原生组件
}
```

### 第三步：重构构造函数

```go
func NewInputComponentWrapper(props InputProps, id string) *InputComponentWrapper {
    // 直接创建原生组件
    input := textinput.New()

    // 应用配置
    applyTextInputConfig(&input, props)

    // 直接创建wrapper，无需适配器
    return &InputComponentWrapper{
        model:    input,
        props:    props,
        id:       id,
        bindings: props.Bindings,
        // 不需要stateHelper或者让它直接引用wrapper本身
    }
}
```

### 第四步：更新stateHelper使用

```go
// 如果还需要stateHelper，让它直接使用wrapper
func NewInputComponentWrapper(props InputProps, id string) *InputComponentWrapper {
    input := textinput.New()
    applyTextInputConfig(&input, props)

    wrapper := &InputComponentWrapper{
        model:    input,
        props:    props,
        id:       id,
        bindings: props.Bindings,
    }

    // stateHelper直接使用wrapper作为实现者
    wrapper.stateHelper = &core.InputStateHelper{
        Valuer:      wrapper,  // wrapper自己实现Valuer接口
        Focuser:     wrapper,  // wrapper自己实现Focuser接口
        ComponentID: id,
    }

    return wrapper
}
```

## 完整示例代码

```go
package components

import (
    "fmt"
    "github.com/charmbracelet/bubbles/textinput"
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui/tea/core"
)

type InputComponentWrapper struct {
    model textinput.Model
    props InputProps
    id    string
    bindings []core.ComponentBinding
    stateHelper *core.InputStateHelper
}

// 直接实现所有必要接口，无需适配器

// core.Valuer interface
func (w *InputComponentWrapper) GetValue() string {
    return w.model.Value()
}

// core.Focuser interface
func (w *InputComponentWrapper) Focused() bool {
    return w.model.Focused()
}

func (w *InputComponentWrapper) SetFocus(focus bool) {
    if focus {
        w.model.Focus()
    } else {
        w.model.Blur()
    }
}

// core.ComponentInterface interface
func (w *InputComponentWrapper) Init() tea.Cmd {
    return nil
}

func (w *InputComponentWrapper) View() string {
    return w.model.View()
}

func (w *InputComponentWrapper) GetID() string {
    return w.id
}

func (w *InputComponentWrapper) GetComponentType() string {
    return "input"
}

func (w *InputComponentWrapper) Render(config core.RenderConfig) (string, error) {
    return w.model.View(), nil
}

// ComponentWrapper interface
func (w *InputComponentWrapper) GetModel() interface{} {
    return w.model
}

func (w *InputComponentWrapper) PublishEvent(sourceID, eventName string, payload map[string]interface{}) tea.Cmd {
    return core.PublishEvent(sourceID, eventName, payload)
}

func (w *InputComponentWrapper) ExecuteAction(action *core.Action) tea.Cmd {
    return func() tea.Msg {
        return core.ExecuteActionMsg{
            Action:    action,
            SourceID:  w.id,
            Timestamp: time.Now(),
        }
    }
}

// 构造函数 - 直接实现，无需适配器
func NewInputComponentWrapper(props InputProps, id string) *InputComponentWrapper {
    input := textinput.New()
    applyTextInputConfig(&input, props)

    wrapper := &InputComponentWrapper{
        model:    input,
        props:    props,
        id:       id,
        bindings: props.Bindings,
    }

    // stateHelper直接使用wrapper自身
    wrapper.stateHelper = &core.InputStateHelper{
        Valuer:      wrapper,
        Focuser:     wrapper,
        ComponentID: id,
    }

    return wrapper
}

// 辅助函数保持不变
func applyTextInputConfig(input *textinput.Model, props InputProps) {
    if props.Placeholder != "" {
        input.Placeholder = props.Placeholder
    }
    if props.Value != "" {
        input.SetValue(props.Value)
    }
    if props.Prompt != "" {
        input.Prompt = props.Prompt
    }

    style := lipgloss.NewStyle()
    if props.Color != "" {
        style = style.Foreground(lipgloss.Color(props.Color))
    }
    if props.Background != "" {
        style = style.Background(lipgloss.Color(props.Background))
    }
    input.TextStyle = style
    input.PlaceholderStyle = style

    if props.Width > 0 {
        input.Width = props.Width
    }

    if props.Disabled {
        input.Blur()
    } else {
        input.Focus()
    }
}
```

## 优势对比

### 适配器模式 vs 直接实现

| 方面         | 适配器模式                      | 直接实现              |
| ------------ | ------------------------------- | --------------------- |
| 对象数量     | 3个 (wrapper + adapter + model) | 2个 (wrapper + model) |
| 方法调用层级 | 3层 (wrapper → adapter → model) | 2层 (wrapper → model) |
| 代码复杂度   | 高 (需要维护适配器)             | 低 (逻辑集中)         |
| 性能         | 较差 (额外调用开销)             | 最优 (直接调用)       |
| 维护成本     | 高 (多处需要同步)               | 低 (单一实现源)       |

## 实施建议

1. **渐进式重构**：先让Wrapper实现核心接口，再逐步替换其他引用
2. **保持向后兼容**：确保现有API调用不受影响
3. **充分测试**：特别是状态管理和事件处理部分
4. **性能验证**：对比重构前后的性能指标

这种直接实现的方式更加简洁高效，符合Go语言的设计哲学。
