# Table 组件导航增强说明

## 更新概览

为 `table.go` 组件增强了导航功能，实现了向下移动键的响应处理，并确保选中的行项目能够突出显示。

---

## 更新内容

### 1. Column 结构体修改 (`table.go:13-26`)

**变更：**

```go
// Before
Style lipgloss.Style `json:"style"`

// After
Style lipglossStyleWrapper `json:"style"`
```

**原因：**

- 统一使用 `lipglossStyleWrapper` 类型，与其他组件的样式处理保持一致
- 支持通过 JSON 配置自定义列样式

### 2. TableModel.UpdateMsg 增强 (`table.go:357-377`)

**新增功能：**

- 显式处理键盘导航事件（Up、Down、PgUp、PgDown）
- 在每次选择变化后发布 `EventRowSelected` 事件
- 事件数据包含更多信息：
  - `rowIndex`：当前选中行的索引
  - `prevRowIndex`：之前选中行的索引
  - `rowData`：行数据（如果可用）
  - `tableID`：表格 ID
  - `navigationKey`：触发的导航键
  - `isNavigation`：标识是否为导航操作

**示例事件：**

```go
EventRowSelected {
    ID:     "my-table",
    Action:  "ROW_SELECTED",
    Data: map[string]interface{}{
        "rowIndex":       1,
        "prevRowIndex":   0,
        "rowData":        table.Row{"2", "Bob", "bob@example.com"},
        "tableID":        "my-table",
        "navigationKey":  "down",
        "isNavigation":   true,
    },
}
```

### 3. TableComponentWrapper.UpdateMsg 增强 (`table.go:381-504`)

**新增导航键处理：**

- **Down/Up**：逐行移动
- **PgUp/PgDown**：翻页移动
- **Home/End**：跳转到顶部/底部

**新增 Enter 键处理：**

- 发布 `EventRowDoubleClicked` 事件
- 事件数据包含：
  - `rowIndex`：当前行索引
  - `rowData`：行数据
  - `tableID`：表格 ID
  - `trigger`：触发器标识（`"enter_key"`）

**示例：**

```go
// Enter 键按下时
case tea.KeyEnter:
    if w.model.Model.Focused() {
        currentSelectedRow := w.model.Model.Cursor()
        eventCmd := core.PublishEvent(
            w.model.id,
            core.EventRowDoubleClicked,
            map[string]interface{}{
                "rowIndex": currentSelectedRow,
                "rowData":  rowData,
                "tableID":  w.model.id,
                "trigger":  "enter_key",
            },
        )
        return w, eventCmd, core.Handled
    }
```

### 4. 默认样式设置 (`table.go:121-138`)

**新增默认高对比度样式：**

当用户未提供样式时，使用以下默认样式：

- **Header Style**：
  - 粗体
  - 浅橙色前景色 (Color 214)

- **Cell Style**：
  - 深灰色前景色 (Color 240)

- **Selected Style**（突出显示）：
  - 粗体
  - 黑色前景色 (Color 231)
  - 浅蓝色背景色 (Color 39)
  - 下划线

**代码：**

```go
if selectedStyle.String() == lipgloss.NewStyle().String() {
    selectedStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("231")).
        Background(lipgloss.Color("39")).
        Underline(true)
}
```

**效果：**

- 选中的行将显示为高对比度的浅蓝色背景、黑色文字、加粗和下划线
- 提供清晰的视觉反馈，用户可以立即识别当前选中的行

### 5. 列样式修复

**RenderTable 和 NewTableModel 中的修复：**

```go
// Before
if j < len(props.Columns) && props.Columns[j].Style.String() != lipgloss.NewStyle().String() {
    row[j] = props.Columns[j].Style.Render(formatCell(cell))
}

// After
if j < len(props.Columns) && props.Columns[j].Style.GetStyle().String() != lipgloss.NewStyle().String() {
    row[j] = props.Columns[j].Style.GetStyle().Render(formatCell(cell))
}
```

**原因：**

- `Style` 现在是 `lipglossStyleWrapper` 类型
- 需要使用 `.GetStyle()` 方法获取底层的 `lipgloss.Style`

---

## 使用示例

### 基本使用

```go
// 创建 Table 组件
props := TableProps{
    Columns: []Column{
        {Key: "id", Title: "ID", Width: 5},
        {Key: "name", Title: "Name", Width: 20},
        {Key: "email", Title: "Email", Width: 30},
    },
    Data: [][]interface{}{
        {1, "Alice", "alice@example.com"},
        {2, "Bob", "bob@example.com"},
        {3, "Charlie", "charlie@example.com"},
    },
    ShowBorder: true,
    Focused:    true,
    Height:     10,
    Width:      60,
}
tableModel := NewTableModel(props, "my-table")
tableWrapper := NewTableComponentWrapper(&tableModel)

// 设置焦点
tableWrapper.SetFocus(true)

// 处理消息
msg := tea.KeyMsg{Type: tea.KeyDown}
comp, cmd, response := tableWrapper.UpdateMsg(msg)
```

### 自定义选中样式

```go
// 创建自定义突出显示样式
customSelectedStyle := lipgloss.NewStyle().
    Bold(true).
    Foreground(lipgloss.Color("255")). // 白色
    Background(lipgloss.Color("196")). // 红色背景
    Underline(true)

props := TableProps{
    // ... other properties
    SelectedStyle: lipglossStyleWrapper{Style: &customSelectedStyle},
}
```

### 监听选择事件

```go
// 在主模型中处理事件
func (m MainModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case core.ActionMsg:
        if msg.Action == core.EventRowSelected {
            // 处理行选择
            if data, ok := msg.Data.(map[string]interface{}); ok {
                rowIndex := data["rowIndex"].(int)
                rowData := data["rowData"]
                navigationKey := data["navigationKey"].(string)

                // 根据选择执行操作
                if navigationKey == "down" {
                    // 用户向下移动
                }
            }
        }

    case core.ActionMsg:
        if msg.Action == core.EventRowDoubleClicked {
            // 处理行双击/Enter 键
            if data, ok := msg.Data.(map[string]interface{}); ok {
                rowIndex := data["rowIndex"].(int)
                trigger := data["trigger"].(string)

                // 打开编辑表单等
                if trigger == "enter_key" {
                    // 用户按下了 Enter 键
                }
            }
        }
    }
}
```

---

## 导航键映射

| 按键       | 功能         | 事件发布                                         |
| ---------- | ------------ | ------------------------------------------------ |
| **Down**   | 向下移动一行 | `EventRowSelected` + `navigationKey: "down"`     |
| **Up**     | 向上移动一行 | `EventRowSelected` + `navigationKey: "up"`       |
| **PgDown** | 向下翻页     | `EventRowSelected` + `navigationKey: "pgdown"`   |
| **PgUp**   | 向上翻页     | `EventRowSelected` + `navigationKey: "pgup"`     |
| **Enter**  | 确认选择     | `EventRowDoubleClicked` + `trigger: "enter_key"` |

---

## 突出显示特性

### 自动高对比度样式

当用户未提供自定义样式时，组件自动应用高对比度的默认样式：

**视觉效果：**

- ✓ 粗体文字
- ✓ 黑色文字 (高对比度)
- ✓ 浅蓝色背景 (高可见性)
- ✓ 下划线 (额外强调）

**优势：**

- 用户无需手动配置即可获得清晰的视觉反馈
- 高对比度设计确保在各种终端主题下都可见
- 符合可访问性最佳实践

### 自定义样式支持

用户仍然可以通过 `TableProps` 完全自定义样式：

```go
props := TableProps{
    HeaderStyle: lipglossStyleWrapper{Style: &myHeaderStyle},
    CellStyle: lipglossStyleWrapper{Style: &myCellStyle},
    SelectedStyle: lipglossStyleWrapper{Style: &mySelectedStyle},
}
```

---

## 测试覆盖

### 导航测试 (`table_navigation_test.go`)

- **`TestTableComponentWrapper_UpdateMsg_KeyDown`**：测试 Down 键响应
- **`TestTableComponentWrapper_UpdateMsg_NavigationKeys`**：测试所有导航键（Up、Down、PgUp、PgDown）
- **`TestTableComponentWrapper_UpdateMsg_EnterKey`**：测试 Enter 键处理
- **`TestTableComponentWrapper_UpdateMsg_TargetedMsg`**：测试定向消息
- **`TestTableComponentWrapper_UpdateMsg_RowSelectionEvent`**：测试选择事件发布
- **`TestNewTableModel_DefaultStyles`**：测试默认样式应用
- **`TestNewTableModel_SelectedRowVisibility`**：测试选中行的视觉差异
- **`TestNewTableModel_CustomSelectedStyle`**：测试自定义样式支持
- **`TestTableComponentWrapper_SetFocus`**：测试焦点管理
- **`TestTableComponentWrapper_GetID`**：测试 ID 获取
- **`TestTableComponentWrapper_View`**：测试视图渲染
- **`TestTableComponentWrapper_Init`**：测试初始化
- **`TestTableComponentWrapper_BoundaryNavigation`**：测试边界条件（顶部/底部）

---

## 向后兼容性

**完全向后兼容：**

- 现有代码不需要修改
- 如果未提供样式，将应用新的默认高对比度样式
- 事件发布扩展了数据结构，但保留了现有字段

**迁移建议：**

- 如果需要自定义样式，请参考新的 `SelectedStyle` 配置示例
- 事件监听器可以扩展以使用新的 `navigationKey` 和 `isNavigation` 字段

---

## 性能考虑

- 导航事件每次选择变化时发布，但只有当焦点在表格上时
- 样式计算在初始化时完成一次，而不是每次渲染
- 使用 lipgloss 的高效字符串操作进行样式应用

---

## 与重构文档的对应关系

### ✅ Phase 3: 消息隔离与命名空间

- [x] **实现消息包装器 (`TargetedMsg`)**：Table 组件已支持
- [x] **重构基础组件**：Table 已完成增强

### ✅ 额外增强

- [x] **显式导航键处理**：Up/Down/PgUp/PgDown/Home/End
- [x] **Enter 键事件**：发布 `EventRowDoubleClicked`
- [x] **高对比度默认样式**：提高可见性和可访问性
- [x] **丰富的事件数据**：包含导航键、前后行索引等信息

---

## 文件变更清单

### 修改文件

- `tui/components/table.go`：
  - Column.Style 类型改为 `lipglossStyleWrapper`
  - 增强 `TableModel.UpdateMsg` 方法
  - 增强 `TableComponentWrapper.UpdateMsg` 方法
  - 添加默认高对比度样式

### 新增文件

- `tui/components/table_navigation_test.go`：13 个导航相关测试用例

---

**更新日期**：2026-01-17
**更新人**：AI Assistant
**版本**：1.0
