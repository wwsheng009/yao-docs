# Key Component 扩展使用指南

## 概述

Key组件已扩展支持两种模式：

- **单键模式 (Single Mode)**：显示单个按键绑定（原有功能）
- **批量模式 (Batch Mode)**：显示多个按键绑定（新功能）

---

## 单键模式 (原有功能)

### 配置示例

```json
{
  "type": "key",
  "id": "quitKey",
  "props": {
    "keys": ["q", "ctrl+c"],
    "description": "Quit",
    "color": "#212",
    "width": 80
  }
}
```

### 渲染输出

```
q - Quit
```

### 支持的字段

| 字段          | 类型       | 默认值      | 说明                      |
| ------------- | ---------- | ----------- | ------------------------- |
| `keys`        | `[]string` | `[]`        | 按键组合列表              |
| `description` | `string`   | `""`        | 按键描述                  |
| `shortcut`    | `string`   | `""`        | 快捷键显示文本            |
| `color`       | `string`   | `""`        | 文本颜色（hex或命名颜色） |
| `background`  | `string`   | `""`        | 背景颜色                  |
| `bold`        | `bool`     | `false`     | 粗体                      |
| `italic`      | `bool`     | `false`     | 斜体                      |
| `underline`   | `bool`     | `false`     | 下划线                    |
| `width`       | `int`      | `0`（自动） | 宽度                      |
| `height`      | `int`      | `0`（自动） | 高度                      |
| `enabled`     | `bool`     | `true`      | 是否启用                  |

---

## 批量模式 (新功能)

### 配置示例

```json
{
  "type": "key",
  "id": "keyDisplay",
  "props": {
    "bindings": [
      { "key": "q", "action": "Quit" },
      { "key": "r", "action": "Refresh" },
      { "key": "h", "action": "Help" },
      { "key": "Tab", "action": "Next Input" }
    ],
    "showLabels": true,
    "color": "#212",
    "width": 80
  }
}
```

### 渲染输出

```
q - Quit
r - Refresh
h - Help
Tab - Next Input
```

### 支持的字段

| 字段         | 类型           | 默认值 | 说明                     |
| ------------ | -------------- | ------ | ------------------------ |
| `bindings`   | `[]KeyBinding` | `[]`   | 按键绑定数组             |
| `showLabels` | `bool`         | `true` | 是否显示动作标签         |
| `spacing`    | `int`          | `2`    | 绑定之间的间距（空格数） |
| 其他样式字段 | -              | -      | 与单键模式相同           |

### KeyBinding 结构

```go
type KeyBinding struct {
    Key     string `json:"key"`     // 按键名称
    Action  string `json:"action"`  // 动作描述
    Enabled bool   `json:"enabled"` // 是否启用
}
```

---

## 完整配置示例

### 单键模式完整示例

```json
{
  "name": "Single Key Example",
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "Application Help",
          "align": "center"
        }
      },
      {
        "type": "key",
        "id": "quitKey",
        "props": {
          "keys": ["q"],
          "description": "Quit the application",
          "color": "#FF5555",
          "bold": true
        }
      },
      {
        "type": "key",
        "id": "refreshKey",
        "props": {
          "keys": ["r", "ctrl+r"],
          "description": "Refresh data",
          "color": "#50FA7B",
          "bold": true
        }
      }
    ]
  }
}
```

### 批量模式完整示例

```json
{
  "name": "Batch Key Example",
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "Available Key Shortcuts",
          "align": "center"
        }
      },
      {
        "type": "key",
        "id": "keyDisplay",
        "props": {
          "bindings": [
            { "key": "q", "action": "Quit", "enabled": true },
            { "key": "r", "action": "Refresh", "enabled": true },
            { "key": "h", "action": "Help", "enabled": true },
            { "key": "Tab", "action": "Next Input", "enabled": true },
            { "key": "Shift+Tab", "action": "Previous Input", "enabled": true }
          ],
          "showLabels": true,
          "color": "#8BE9FD",
          "spacing": 1,
          "bold": true
        }
      }
    ]
  }
}
```

### 混合使用示例

```json
{
  "name": "Mixed Key Example",
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": {
          "title": "Key Bindings",
          "align": "center"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "Global Shortcuts:"
        }
      },
      {
        "type": "key",
        "id": "globalKeys",
        "props": {
          "bindings": [
            { "key": "q", "action": "Quit" },
            { "key": "r", "action": "Refresh" }
          ],
          "showLabels": true,
          "color": "#50FA7B"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "Navigation:"
        }
      },
      {
        "type": "key",
        "id": "navKeys",
        "props": {
          "bindings": [
            { "key": "Tab", "action": "Next" },
            { "key": "Shift+Tab", "action": "Previous" }
          ],
          "showLabels": true,
          "color": "#8BE9FD"
        }
      },
      {
        "type": "text",
        "props": {
          "content": "Quick Actions:"
        }
      },
      {
        "type": "key",
        "id": "quickKey",
        "props": {
          "keys": ["h"],
          "description": "Show Help",
          "color": "#FFB86C",
          "bold": true
        }
      }
    ]
  }
}
```

---

## 高级用法

### 条件显示标签

```json
{
  "type": "key",
  "id": "minimalKeys",
  "props": {
    "bindings": [
      { "key": "q", "action": "Quit" },
      { "key": "r", "action": "Refresh" }
    ],
    "showLabels": false, // 只显示按键，不显示动作
    "color": "#6272A4"
  }
}
```

**渲染输出：**

```
q
r
```

### 自定义间距

```json
{
  "type": "key",
  "id": "spacedKeys",
  "props": {
    "bindings": [
      { "key": "q", "action": "Quit" },
      { "key": "r", "action": "Refresh" },
      { "key": "h", "action": "Help" }
    ],
    "spacing": 4, // 更大的间距
    "color": "#F1FA8C"
  }
}
```

### 禁用特定绑定

```json
{
  "type": "key",
  "id": "mixedKeys",
  "props": {
    "bindings": [
      { "key": "q", "action": "Quit", "enabled": true },
      { "key": "r", "action": "Refresh", "enabled": false }, // 禁用
      { "key": "h", "action": "Help", "enabled": true }
    ],
    "showLabels": true,
    "color": "#FF79C6"
  }
}
```

---

## 模式选择指南

### 使用单键模式当：

- 需要显示单个独立的按键提示
- 需要为不同按键使用不同样式
- 按键之间没有关联

### 使用批量模式当：

- 需要显示一组相关的按键
- 想要统一显示样式
- 需要节省配置空间
- 按键具有相似的功能类别

---

## 迁移指南

### 从多个单键组件迁移到批量模式

**迁移前：**

```json
{
  "children": [
    {
      "type": "key",
      "id": "key1",
      "props": { "keys": ["q"], "description": "Quit", "color": "#212" }
    },
    {
      "type": "key",
      "id": "key2",
      "props": { "keys": ["r"], "description": "Refresh", "color": "#212" }
    },
    {
      "type": "key",
      "id": "key3",
      "props": { "keys": ["h"], "description": "Help", "color": "#212" }
    }
  ]
}
```

**迁移后：**

```json
{
  "children": [
    {
      "type": "key",
      "id": "allKeys",
      "props": {
        "bindings": [
          { "key": "q", "action": "Quit" },
          { "key": "r", "action": "Refresh" },
          { "key": "h", "action": "Help" }
        ],
        "color": "#212"
      }
    }
  ]
}
```

---

## API 参考

### ParseKeyProps

```go
func ParseKeyProps(props map[string]interface{}) KeyProps
```

将通用属性映射转换为 KeyProps 结构。

### RenderKey

```go
func RenderKey(props KeyProps, width int) string
```

渲染 Key 组件。自动检测模式：

- 如果 `len(bindings) > 0`，使用批量模式
- 否则，使用单键模式

### NewKeyModel

```go
func NewKeyModel(props KeyProps, id string) KeyModel
```

创建 KeyModel 实例。

---

## 注意事项

1. **向后兼容性**：单键模式完全向后兼容，现有配置无需修改
2. **模式优先级**：如果同时提供了 `bindings` 和 `keys`，`bindings` 优先
3. **性能**：批量模式比多个单键组件更高效
4. **样式继承**：批量模式下所有绑定共享相同的样式设置
5. **布局**：批量模式使用垂直布局，每个绑定占一行

---

## 示例应用场景

### 帮助面板

```json
{
  "type": "key",
  "props": {
    "bindings": [
      { "key": "q", "action": "Quit" },
      { "key": "h", "action": "Show Help" },
      { "key": "r", "action": "Refresh" },
      { "key": "s", "action": "Save" }
    ],
    "showLabels": true,
    "color": "#BD93F9"
  }
}
```

### 导航提示

```json
{
  "type": "key",
  "props": {
    "bindings": [
      { "key": "Tab", "action": "Next Field" },
      { "key": "Shift+Tab", "action": "Previous Field" },
      { "key": "Enter", "action": "Submit Form" },
      { "key": "Esc", "action": "Cancel" }
    ],
    "showLabels": true,
    "color": "#8BE9FD"
  }
}
```

### 快速键提示（无标签）

```json
{
  "type": "key",
  "props": {
    "bindings": [
      { "key": "1" },
      { "key": "2" },
      { "key": "3" },
      { "key": "4" }
    ],
    "showLabels": false,
    "color": "#6272A4"
  }
}
```

---

## 总结

Key组件的扩展提供了更灵活的按键显示方式：

- ✅ 完全向后兼容
- ✅ 支持单键和批量两种模式
- ✅ 丰富的样式选项
- ✅ 可配置的间距和标签显示
- ✅ 适合各种应用场景

根据具体需求选择合适的模式，可以创建出清晰、美观的按键提示界面。
