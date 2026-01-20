# TUI Test Index

## 所有测试配置文件快速索引

## 按组件类型索引

### 核心组件（9个）

| 组件         | 文件               | 描述                            | 键绑定  |
| ------------ | ------------------ | ------------------------------- | ------- |
| **Header**   | `header.tui.yao`   | 标题栏测试 - 对齐、颜色、宽度   | q       |
| **Text**     | `text.tui.yao`     | 文本显示测试 - 对齐、样式       | q       |
| **Input**    | `input.tui.yao`    | 单行输入测试 - 占位符、值绑定   | q       |
| **Textarea** | `textarea.tui.yao` | 多行输入测试 - 滚动、字符计数   | c, l, q |
| **Table**    | `table.tui.yao`    | 数据表格测试 - 列、数据、分页   | r, q    |
| **Form**     | `form.tui.yao`     | 表单测试 - 字段、验证、提交     | q       |
| **Menu**     | `menu.tui.yao`     | 菜单测试 - 菜单项、子菜单、导航 | q       |
| **Chat**     | `chat.tui.yao`     | AI聊天测试 - 消息、Markdown渲染 | q       |
| **Viewport** | `viewport.tui.yao` | 滚动视图测试 - 内容、滚动       | q       |

### 工具组件（13个）

| 组件           | 文件                 | 描述                          | 键绑定             |
| -------------- | -------------------- | ----------------------------- | ------------------ |
| **List**       | `list.tui.yao`       | 列表测试 - 静态列表、反转     | r, q               |
| **CRUD**       | `crud.tui.yao`       | CRUD操作测试 - 增删改查       | n, e, d, q         |
| **Progress**   | `progress.tui.yao`   | 进度条测试 - 百分比、增减     | +, -, r, q         |
| **Spinner**    | `spinner.tui.yao`    | 加载动画测试 - 类型、开关     | s, t, q            |
| **Paginator**  | `paginator.tui.yao`  | 分页器测试 - 页码、导航       | ←, →, Home, End, q |
| **Timer**      | `timer.tui.yao`      | 定时器测试 - 倒计时、增减时间 | s, r, +, -, q      |
| **Stopwatch**  | `stopwatch.tui.yao`  | 秒表测试 - 计时、计次         | s, r, l, q         |
| **Help**       | `help.tui.yao`       | 帮助组件测试 - 快捷键显示     | h, q               |
| **Cursor**     | `cursor.tui.yao`     | 光标测试 - 显示、样式         | v, s, q            |
| **Key**        | `key.tui.yao`        | 键显示测试 - 快捷键、绑定     | k, q               |
| **FilePicker** | `filepicker.tui.yao` | 文件选择器测试 - 目录、文件   | ., q               |
| **Footer**     | `footer.tui.yao`     | 页脚测试 - 文本、对齐         | q                  |

### 布局测试（2个）

| 布局       | 文件                     | 描述                         | 组件                         |
| ---------- | ------------------------ | ---------------------------- | ---------------------------- |
| **Nested** | `layouts/nested.tui.yao` | 嵌套布局测试 - 侧边栏+主内容 | Header, Menu, Text, Progress |
| **Grid**   | `layouts/grid.tui.yao`   | 网格布局测试 - 2x2网格       | Header, Text, Menu, Progress |

### 交互式场景（4个）

| 场景             | 文件                               | 描述                      | 功能         |
| ---------------- | ---------------------------------- | ------------------------- | ------------ |
| **Multi-Form**   | `interactive/multi-form.tui.yao`   | 多字段表单 - 多个输入字段 | 6个字段+验证 |
| **Wizard**       | `interactive/wizard.tui.yao`       | 向导式表单 - 多步骤流程   | 3个步骤+进度 |
| **Split Screen** | `interactive/split-screen.tui.yao` | 分屏显示 - 双独立面板     | 左右面板     |
| **Event System** | `advanced/events.tui.yao`          | 事件系统测试 - 发布/订阅  | 事件表+日志  |

### 高级场景（2个）

| 场景               | 文件                         | 描述                    | 组件数量                  |
| ------------------ | ---------------------------- | ----------------------- | ------------------------- |
| **Dashboard**      | `advanced/dashboard.tui.yao` | 完整仪表板 - 统计+活动  | Header, Text, Table, Menu |
| **All Components** | `all-components.tui.yao`     | 所有组件展示 - 组件合集 | 6+个组件                  |

### 基础示例（5个）

| 示例             | 文件                 | 描述                     | 难度   |
| ---------------- | -------------------- | ------------------------ | ------ |
| **Hello**        | `hello.tui.yao`      | Hello World - 最简单示例 | ⭐     |
| **Counter**      | `counter.tui.yao`    | 计数器 - 基础交互        | ⭐⭐   |
| **Todo**         | `todo.tui.yao`       | 待办事项 - CRUD示例      | ⭐⭐⭐ |
| **Calculator**   | `calculator.tui.yao` | 计算器 - 完整功能        | ⭐⭐⭐ |
| **Nested State** | `nested.tui.yao`     | 嵌套状态 - 数据扁平化    | ⭐⭐   |

## 按功能索引

### 数据绑定

- `header.tui.yao` - 标题绑定
- `text.tui.yao` - 内容绑定
- `input.tui.yao` - 值绑定
- `table.tui.yao` - 数据绑定
- `menu.tui.yao` - 列表绑定

### 表达式使用

- `header.tui.yao` - `{{title}}`
- `text.tui.yao` - `{{len(items)}}`
- `counter.tui.yao` - `{{count > 0 ? 'Positive' : 'Zero'}}`
- `table.tui.yao` - `{{index($, 'user')}}`

### 样式测试

- `header.tui.yao` - 颜色、背景、对齐
- `text.tui.yao` - 粗体、斜体、下划线
- `table.tui.yao` - 边框、单元格样式
- `chat.tui.yao` - Markdown渲染

### 交互功能

- `input.tui.yao` - 焦点管理
- `menu.tui.yao` - 键盘导航
- `table.tui.yao` - 行选择
- `form.tui.yao` - 表单提交

### 动态更新

- `counter.tui.yao` - 状态更新
- `chat.tui.yao` - 消息追加
- `progress.tui.yao` - 进度更新
- `spinner.tui.yao` - 动画切换

## 按复杂度索引

### 简单（⭐）

适合初学者的基础示例：

- `hello.tui.yao` - 最简单的TUI
- `header.tui.yao` - 单个组件
- `text.tui.yao` - 文本显示

### 中等（⭐⭐）

需要了解基础概念：

- `counter.tui.yao` - 状态管理
- `input.tui.yao` - 输入组件
- `menu.tui.yao` - 菜单导航
- `table.tui.yao` - 表格显示
- `progress.tui.yao` - 进度条
- `spinner.tui.yao` - 加载动画

### 复杂（⭐⭐⭐）

需要深入了解框架：

- `todo.tui.yao` - CRUD完整流程
- `chat.tui.yao` - 流式+Markdown
- `form.tui.yao` - 多字段表单
- `interactive/multi-form.tui.yao` - 复杂表单
- `interactive/wizard.tui.yao` - 向导流程
- `advanced/dashboard.tui.yao` - 多组件集成

## 快速查找

### 按组件查找

**我想测试Header组件**

```bash
yao tui header
```

**我想测试Table组件**

```bash
yao tui table
```

**我想测试所有组件**

```bash
yao tui all-components
```

### 按功能查找

**我想学习状态管理**

```bash
yao tui counter
yao tui todo
```

**我想学习表达式**

```bash
yao tui table
yao tui nested
```

**我想学习布局**

```bash
yao tui layouts/nested
yao tui layouts/grid
```

**我想学习事件**

```bash
yao tui advanced/events
```

## 测试检查清单

在发布新代码前，运行以下测试：

### 核心功能

- [x] `hello.tui.yao` - 基础渲染
- [x] `counter.tui.yao` - 状态更新
- [x] `input.tui.yao` - 输入处理
- [x] `menu.tui.yao` - 菜单导航
- [x] `table.tui.yao` - 表格显示
- [x] `form.tui.yao` - 表单提交

### 组件库

- [x] 所有核心组件（9个）
- [x] 所有工具组件（13个）
- [x] 所有布局测试（2个）
- [x] 所有交互场景（4个）

### 高级功能

- [x] `chat.tui.yao` - AI流式
- [x] `advanced/dashboard.tui.yao` - 仪表板
- [x] `advanced/events.tui.yao` - 事件系统
- [x] `all-components.tui.yao` - 组件集合

## 脚本依赖

以下测试配置需要JavaScript/TypeScript脚本：

### 需要脚本的测试

| 测试文件                         | 脚本文件                    | 方法                                    |
| -------------------------------- | --------------------------- | --------------------------------------- |
| `textarea.tui.yao`               | `scripts/tui/textarea.ts`   | clear, loadSample                       |
| `list.tui.yao`                   | `scripts/tui/list.ts`       | reverse                                 |
| `progress.tui.yao`               | `scripts/tui/progress.ts`   | increase, decrease, reset               |
| `spinner.tui.yao`                | `scripts/tui/spinner.ts`    | toggle, nextType                        |
| `paginator.tui.yao`              | `scripts/tui/paginator.ts`  | nextPage, prevPage, firstPage, lastPage |
| `timer.tui.yao`                  | `scripts/tui/timer.ts`      | toggle, reset, addTime, removeTime      |
| `stopwatch.tui.yao`              | `scripts/tui/stopwatch.ts`  | toggle, reset, lap                      |
| `crud.tui.yao`                   | `scripts/tui/crud.ts`       | newItem, editItem, deleteItem           |
| `help.tui.yao`                   | `scripts/tui/help.ts`       | toggle                                  |
| `cursor.tui.yao`                 | `scripts/tui/cursor.ts`     | toggleVisible, cycleStyle               |
| `key.tui.yao`                    | `scripts/tui/key.ts`        | toggle                                  |
| `filepicker.tui.yao`             | `scripts/tui/filepicker.ts` | toggleHidden                            |
| `interactive/multi-form.tui.yao` | `scripts/tui/multi-form.ts` | submit, clear                           |
| `interactive/wizard.tui.yao`     | `scripts/tui/wizard.ts`     | next, previous                          |
| `advanced/events.tui.yao`        | `scripts/tui/events.ts`     | triggerEvent                            |

### 不需要脚本的测试

以下测试完全由配置文件驱动，不需要额外脚本：

- `hello.tui.yao`
- `header.tui.yao`
- `text.tui.yao`
- `input.tui.yao`
- `menu.tui.yao`
- `table.tui.yao`
- `form.tui.yao`
- `chat.tui.yao`
- `viewport.tui.yao`
- `footer.tui.yao`
- `layouts/nested.tui.yao`
- `layouts/grid.tui.yao`
- `interactive/split-screen.tui.yao`
- `advanced/dashboard.tui.yao`
- `all-components.tui.yao`
- `counter.tui.yao`（有脚本但可选）
- `todo.tui.yao`（有脚本但可选）
- `calculator.tui.yao`（有脚本但可选）

## 统计信息

### 总计

- **总测试文件**: 28个
- **总组件**: 22个（9核心+13工具）
- **布局测试**: 2个
- **交互场景**: 4个
- **高级场景**: 2个
- **基础示例**: 5个

### 按类型

| 类型         | 数量 |
| ------------ | ---- |
| 核心组件测试 | 9个  |
| 工具组件测试 | 13个 |
| 布局测试     | 2个  |
| 交互式场景   | 4个  |
| 高级场景     | 2个  |

### 按目录

| 目录         | 文件数                   |
| ------------ | ------------------------ |
| 根目录       | 13个                     |
| layouts/     | 2个                      |
| interactive/ | 3个                      |
| advanced/    | 2个                      |
| admin/       | 1个（dashboard.tui.yao） |

## 运行所有测试

### 快速验证

```bash
# 列出所有测试
yao tui list

# 验证所有配置
for test in $(ls *.tui.yao); do
  echo "Testing $test..."
  yao tui ${test%.tui.yao}
done
```

### 分类测试

```bash
# 测试所有核心组件
for test in header text input textarea table form menu chat viewport; do
  echo "Testing $test..."
  yao tui $test
done

# 测试所有工具组件
for test in list crud progress spinner paginator timer stopwatch help cursor key filepicker footer; do
  echo "Testing $test..."
  yao tui $test
done

# 测试所有布局
for test in layouts/nested layouts/grid; do
  echo "Testing $test..."
  yao tui $test
done
```

## 版本信息

- **TUI 版本**: v1.0.0
- **最后更新**: 2026-01-18
- **测试配置总数**: 28个
- **维护者**: Yao TUI Team
