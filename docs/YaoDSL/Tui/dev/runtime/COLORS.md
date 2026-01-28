# TUI 颜色参考

本文档列出了所有支持的颜色名称和用法。

---

## 语义化颜色（推荐）

| 颜色名称    | 说明             | 适用场景       | ANSI代码 |
| ----------- | ---------------- | -------------- | -------- |
| `primary`   | 主色调（蓝色）   | 主要操作、链接 | 21       |
| `secondary` | 次要色（紫色）   | 辅助信息       | 95       |
| `success`   | 成功（绿色）     | 成功状态、确认 | 34       |
| `info`      | 信息（浅蓝）     | 提示信息       | 39       |
| `warning`   | 警告（橙色）     | 警告提示       | 208      |
| `danger`    | 危险（红色）     | 错误、危险操作 | 196      |
| `error`     | 错误（红色）     | 错误信息       | 196      |
| `critical`  | 严重错误（红色） | 严重错误       | 196      |

### UI 元素颜色

| 颜色名称     | 说明             | 适用场景         |
| ------------ | ---------------- | ---------------- |
| `foreground` | 前景色（白色）   | 主要文字         |
| `background` | 背景色（深灰）   | 组件背景         |
| `muted`      | 弱化色（灰色）   | 次要文字         |
| `border`     | 边框色（灰色）   | 边框、分隔线     |
| `header`     | 表头色（金色）   | 表格标题         |
| `row`        | 行颜色（白色）   | 表格行           |
| `alternate`  | 交替行色         | 表格交替行       |
| `hover`      | 悬停色（蓝色）   | 鼠标悬停         |
| `text`       | 文字颜色（白色） | 普通文字         |
| `textdark`   | 深色文字（黑色） | 深色背景上的文字 |
| `textlight`  | 浅色文字（白色） | 浅色背景上的文字 |
| `textmuted`  | 弱化文字（灰色） | 次要说明文字     |

---

## 基础颜色

| 颜色名称  | 说明   | 示例       |
| --------- | ------ | ---------- |
| `black`   | 黑色   | 黑色文字   |
| `red`     | 红色   | 错误、删除 |
| `green`   | 绿色   | 成功、确认 |
| `yellow`  | 黄色   | 警告       |
| `blue`    | 蓝色   | 链接、信息 |
| `magenta` | 洋红色 | 强调       |
| `cyan`    | 青色   | 信息       |
| `white`   | 白色   | 主要文字   |

---

## 亮色系

| 颜色名称                         | 说明   | 示例     |
| -------------------------------- | ------ | -------- |
| `brightblack` / `lightblack`     | 亮黑色 | 深灰背景 |
| `brightred` / `lightred`         | 亮红色 | 高亮错误 |
| `brightgreen` / `lightgreen`     | 亮绿色 | 高亮成功 |
| `brightyellow` / `lightyellow`   | 亮黄色 | 高亮警告 |
| `brightblue` / `lightblue`       | 亮蓝色 | 高亮链接 |
| `brightmagenta` / `lightmagenta` | 亮洋红 | 高亮强调 |
| `brightcyan` / `lightcyan`       | 亮青色 | 高亮信息 |
| `brightwhite` / `lightwhite`     | 亮白色 | 高亮文字 |

---

## 扩展颜色

| 颜色名称 | 说明     |
| -------- | -------- |
| `orange` | 橙色     |
| `purple` | 紫色     |
| `pink`   | 粉色     |
| `brown`  | 棕色     |
| `lime`   | 青柠色   |
| `indigo` | 靛蓝色   |
| `violet` | 紫罗兰色 |
| `gold`   | 金色     |
| `silver` | 银色     |
| `beige`  | 米色     |

---

## 主题配色方案

### Tokyo Night 配色

| 颜色名称             | 用途     |
| -------------------- | -------- |
| `tokyo-night-blue`   | 蓝色元素 |
| `tokyo-night-cyan`   | 青色元素 |
| `tokyo-night-green`  | 绿色元素 |
| `tokyo-night-yellow` | 黄色元素 |
| `tokyo-night-red`    | 红色元素 |

### Dracula 配色

| 颜色名称         | 用途     |
| ---------------- | -------- |
| `dracula-purple` | 紫色元素 |
| `dracula-pink`   | 粉色元素 |
| `dracula-red`    | 红色元素 |
| `dracula-orange` | 橙色元素 |
| `dracula-yellow` | 黄色元素 |

### Nord 配色

| 颜色名称      | 用途     |
| ------------- | -------- |
| `nord-blue`   | 蓝色元素 |
| `nord-cyan`   | 青色元素 |
| `nord-green`  | 绿色元素 |
| `nord-yellow` | 黄色元素 |
| `nord-red`    | 红色元素 |
| `nord-purple` | 紫色元素 |

---

## 使用示例

### JSON 配置示例

```json
{
  "type": "table",
  "props": {
    "headerColor": "primary",
    "headerBackground": "background",
    "cellColor": "textmuted",
    "selectedColor": "text",
    "selectedBackground": "success",
    "borderColor": "border"
  }
}
```

### Header 组件示例

```json
{
  "type": "header",
  "props": {
    "title": "应用标题",
    "color": "primary",
    "background": "background",
    "bold": true
  }
}
```

### Text 组件示例

```json
{
  "type": "text",
  "props": {
    "content": "这是一段提示信息",
    "color": "info",
    "bold": false
  }
}
```

### 按钮状态示例

```json
{
  "type": "button",
  "props": {
    "label": "确认删除",
    "color": "danger",
    "background": "background"
  }
}
```

---

## 颜色对比建议

### 深色背景推荐配色

- **背景**: `background` (235) 或 `darkgray`
- **主文字**: `text` (15) 或 `white`
- **次要文字**: `textmuted` (245) 或 `gray`
- **边框**: `border` (240) 或 `gray`
- **主要操作**: `primary` (21) 或 `blue`
- **成功状态**: `success` (34) 或 `green`
- **警告状态**: `warning` (208) 或 `orange`
- **错误状态**: `danger` (196) 或 `red`

### 浅色背景推荐配色

- **背景**: `white` (15)
- **主文字**: `textdark` (0) 或 `black`
- **次要文字**: `gray` (8)
- **边框**: `gray` (8)
- **主要操作**: `primary` (21)

---

## 注意事项

1. 颜色名称不区分大小写（但建议使用小写）
2. 同时支持数字 ANSI 代码（0-255）
3. 支持十六进制颜色（如 `#FF5733`）
4. 支持 RGB 格式（如 `rgb(255, 87, 51)`）

## 运行测试

```bash
yao run tui.demo.tuis.doc-table
```
