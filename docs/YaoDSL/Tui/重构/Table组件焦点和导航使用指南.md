# Table 组件焦点和导航使用指南

## 问题描述

表格行项目高亮显示正常，但使用快捷键无法上下切换，显示输出也有问题。

## 根本原因

Table 组件在**没有获得焦点**时不会响应键盘导航事件。默认情况下，表格的 `Focused` 属性为 `false`，导致所有键盘事件被忽略并返回 `core.Ignored` 响应。

## 解决方案

### 1. 初始化时设置焦点

创建 TableModel 时，通过 `TableProps.Focused` 属性设置初始焦点：

```go
package main

import (
    "github.com/charmbracelet/bubbletea"
    "github.com/yaoapp/yao/tui/components"
)

type MyModel struct {
    table *components.TableComponentWrapper
}

func NewMyModel() MyModel {
    // 创建表格属性
    props := components.TableProps{
        Columns: []components.Column{
            {Key: "name", Title: "Name", Width: 20},
            {Key: "age",  Title: "Age",  Width: 10},
        },
        Data: [][]interface{}{
            {"Alice", 25},
            {"Bob",   30},
            {"Charlie", 35},
        },
        Focused:    true,  // ✅ 关键：启用初始焦点
        ShowBorder: true,
    }

    // 创建 TableModel
    tableModel := components.NewTableModel(props, "my-table")

    // 包装为 ComponentInterface
    wrapper := components.NewTableComponentWrapper(&tableModel)

    return MyModel{
        table: wrapper,
    }
}
```

### 2. 动态切换焦点

在运行时，使用 `SetFocus` 方法切换焦点：

```go
func (m MyModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg {
    case tea.KeyMsg:
        switch msg.Type {
        case tea.KeyTab:
            // Tab 键切换焦点
            m.table.SetFocus(true)  // 获取焦点
            return m, nil
        case tea.KeyEscape:
            // Escape 键释放焦点
            m.table.SetFocus(false)  // 释放焦点
            return m, nil
        }

        // 让表格处理自己的消息
        _, cmd, response := m.table.UpdateMsg(msg)
        if response == core.Handled {
            return m, cmd
        }
    }

    return m, nil
}
```

### 3. 多组件焦点管理

当有多个交互组件时，需要正确管理焦点状态：

```go
type MyModel struct {
    table *components.TableComponentWrapper
    input *components.InputComponentWrapper
    form  *components.FormComponentWrapper

    // 当前焦点组件的 ID
    focusedComponent string
}

func (m MyModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg {
    case tea.KeyMsg:
        switch msg.Type {
        case tea.KeyTab:
            // Tab 键循环切换焦点
            components := []struct {
                name string
                comp core.ComponentInterface
            }{
                {"table", m.table},
                {"input", m.input},
                {"form",  m.form},
            }

            // 找到当前焦点索引
            currentIndex := -1
            for i, c := range components {
                if c.name == m.focusedComponent {
                    currentIndex = i
                    break
                }
            }

            // 切换到下一个组件
            nextIndex := (currentIndex + 1) % len(components)

            // 释放旧焦点
            if currentIndex >= 0 {
                components[currentIndex].comp.SetFocus(false)
            }

            // 设置新焦点
            components[nextIndex].comp.SetFocus(true)
            m.focusedComponent = components[nextIndex].name

            return m, nil
        }

        // 让当前焦点的组件处理消息
        var focusedComp core.ComponentInterface
        switch m.focusedComponent {
        case "table":
            focusedComp = m.table
        case "input":
            focusedComp = m.input
        case "form":
            focusedComp = m.form
        }

        if focusedComp != nil {
            _, cmd, response := focusedComp.UpdateMsg(msg)
            if response == core.Handled {
                return m, cmd
            }
        }
    }

    return m, nil
}
```

## 导航键支持

Table 组件支持的导航键：

| 按键         | 功能         | 事件                    |
| ------------ | ------------ | ----------------------- |
| `↓` / `Down` | 向下移动一行 | `EventRowSelected`      |
| `↑` / `Up`   | 向上移动一行 | `EventRowSelected`      |
| `PgDown`     | 向下翻页     | `EventRowSelected`      |
| `PgUp`       | 向上翻页     | `EventRowSelected`      |
| `Enter`      | 确认选择     | `EventRowDoubleClicked` |

## 高亮样式

当选中行时，表格会自动应用高亮样式。默认样式为：

```go
// 默认选中样式
selectedStyle = lipgloss.NewStyle().
    Bold(true).
    Foreground(lipgloss.Color("231")). // 白色文字
    Background(lipgloss.Color("39")). // 浅蓝色背景
    Underline(true)
```

### 自定义选中样式

通过 `TableProps.SelectedStyle` 自定义：

```go
props := components.TableProps{
    // ... 其他属性 ...
    SelectedStyle: components.lipglossStyleWrapper{
        Style: lipgloss.NewStyle().
            Bold(true).
            Foreground(lipgloss.Color("16")).  // 深蓝色文字
            Background(lipgloss.Color("220")). // 黄色背景
            Underline(false),
    },
}
```

## 事件处理示例

监听表格选择变化事件：

```go
func (m MyModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg {
    case core.ActionMsg:
        if msg.Action == core.EventRowSelected {
            // 获取选择事件数据
            data, ok := msg.Data.(map[string]interface{})
            if !ok {
                break
            }

            rowIndex := data["rowIndex"].(int)
            prevIndex := data["prevRowIndex"].(int)
            rowData := data["rowData"]
            tableID := data["tableID"].(string)
            navKey := data["navigationKey"].(string)

            fmt.Printf("Row selected: %d (from %d), key: %s\n",
                rowIndex, prevIndex, navKey)
            fmt.Printf("Row data: %v\n", rowData)
        }

        if msg.Action == core.EventRowDoubleClicked {
            // 处理双击事件（Enter 键）
            data := msg.Data.(map[string]interface{})
            rowIndex := data["rowIndex"].(int)
            trigger := data["trigger"].(string) // "enter_key"

            fmt.Printf("Row double-clicked: %d, trigger: %s\n",
                rowIndex, trigger)
        }
    }

    return m, nil
}
```

## 调试技巧

### 1. 检查焦点状态

```go
fmt.Printf("Table focused: %v\n", m.table.Model.Focused())
```

### 2. 检查当前选择

```go
cursor := m.table.Model.Cursor()
rows := m.table.Model.Rows()
if cursor >= 0 && cursor < len(rows) {
    fmt.Printf("Current row: %d, data: %v\n", cursor, rows[cursor])
}
```

### 3. 监听所有消息

```go
func (m MyModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    fmt.Printf("Received message: %T\n", msg)

    switch msg := msg {
    case tea.KeyMsg:
        fmt.Printf("Key: %s, Type: %v\n", msg.String(), msg.Type)
    }

    // ... 正常处理 ...
}
```

## 常见问题

### Q: 为什么表格不响应键盘事件？

**A**: 检查表格是否获得焦点：

```go
if !m.table.Model.Focused() {
    fmt.Println("Table is NOT focused!")
    // 调用 SetFocus(true) 来获取焦点
}
```

### Q: 为什么选择高亮但不移动？

**A**: 确保消息被正确传递。检查返回的 `Response` 值：

- `core.Handled`: 消息被处理
- `core.Ignored`: 消息被忽略（焦点未获取）
- `core.PassClick`: 点击事件被处理但允许传递

### Q: 如何禁用导航键？

**A**: 移除焦点：

```go
m.table.SetFocus(false)
```

或拦截特定按键：

```go
case tea.KeyMsg:
    if msg.Type == tea.KeyDown {
        // 忽略 Down 键
        return m, nil
    }
```

## 最佳实践

1. **始终初始化焦点**：在创建组件时明确设置 `Focused` 属性
2. **使用事件驱动**：监听 `EventRowSelected` 而不是轮询光标位置
3. **正确管理多组件**：确保同一时间只有一个组件获得焦点
4. **提供视觉反馈**：使用边框或其他样式指示当前焦点组件
5. **处理边界情况**：空表格、单行表格等特殊情况

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
    "github.com/yaoapp/yao/tui/components"
    "github.com/yaoapp/yao/tui/core"
)

type Model struct {
    table *components.TableComponentWrapper
    status string
}

func NewModel() Model {
    props := components.TableProps{
        Columns: []components.Column{
            {Key: "name", Title: "Name", Width: 20},
            {Key: "age",  Title: "Age",  Width: 10},
        },
        Data: [][]interface{}{
            {"Alice", 25},
            {"Bob",   30},
            {"Charlie", 35},
        },
        Focused:    true,
        ShowBorder: true,
    }

    tableModel := components.NewTableModel(props, "main-table")
    wrapper := components.NewTableComponentWrapper(&tableModel)

    return Model{
        table:  wrapper,
        status: "Use ↑/↓ to navigate, Enter to select",
    }
}

func (m Model) Init() tea.Cmd {
    return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg {
    case tea.KeyMsg:
        switch msg.Type {
        case tea.KeyCtrlC, tea.KeyEsc:
            return m, tea.Quit
        }

        // 让表格处理键盘事件
        _, cmd, response := m.table.UpdateMsg(msg)
        if response == core.Handled {
            return m, cmd
        }

    case core.ActionMsg:
        if msg.Action == core.EventRowSelected {
            data := msg.Data.(map[string]interface{})
            rowIndex := data["rowIndex"].(int)
            m.status = fmt.Sprintf("Selected row %d", rowIndex)
        }
        if msg.Action == core.EventRowDoubleClicked {
            data := msg.Data.(map[string]interface{})
            rowIndex := data["rowIndex"].(int)
            m.status = fmt.Sprintf("Confirmed row %d", rowIndex)
        }
    }

    return m, nil
}

func (m Model) View() string {
    status := lipgloss.NewStyle().
        Foreground(lipgloss.Color("214")).
        Render(m.status)

    return m.table.View() + "\n\n" + status
}

func main() {
    p := tea.NewProgram(NewModel())
    if _, err := p.Run(); err != nil {
        panic(err)
    }
}
```
