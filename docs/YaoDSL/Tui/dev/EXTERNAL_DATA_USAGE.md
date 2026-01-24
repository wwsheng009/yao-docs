# TUI 外部数据传入功能 - 使用说明

## 修改说明

根据 `cmd/run.go` 的实现，外部数据传入的语法已更新为：

**重要变更**：`::` 前缀必须在引号包裹的 JSON 字符串**内部**，而不是在引号外面。

### ❌ 之前的（错误）语法

```bash
yao tui myapp :: '{"key":"value"}'     # 错误！:: 在引号外面
```

### ✅ 正确的语法

```bash
yao tui myapp '::{"key":"value"}'     # 正确！:: 在引号内部，作为 JSON 的一部分
```

## 使用方法

### 1. 简单 JSON 对象

```bash
# 正确：:: 在引号内部
yao tui myapp '::{"title":"External Title","count":42}'

# Windows PowerShell / Git Bash（使用双引号）
yao tui myapp '::{\"title\":\"External Title\",\"count\":42}'
```

### 2. 嵌套 JSON 对象

```bash
yao tui myapp '::{\"user\":{\"id\":123,\"name\":\"John\"},\"items\":[\"a\",\"b\"]}'
```

### 3. 多个 JSON 参数

```bash
# 多个参数会合并（后面的覆盖前面的）
yao tui myapp '::{\"foo\":\"bar\"}' '::{\"baz\":\"qux\"}'
```

### 4. 转义 :: 前缀

```bash
# 如果你需要传递以 :: 开头的字符串（不作为 JSON 解析）
yao tui myapp '\::test-string'

# 这会被存储在 _args 数组中作为 ":test-string"（去掉了转义的反斜杠）
```

### 5. 普通字符串参数

```bash
# 普通字符串会被存储在 _args 数组中
yao tui myapp arg1 arg2
```

## 数据优先级

当外部数据与静态配置冲突时：

1. **静态配置 data** (`.tui.yao` 文件中的 `data` 字段) - 最低
2. **:: JSON 参数** (外部 JSON 数据) - 最高

**示例：**

```yaml
# tuis/myapp.tui.yao
name: 'My App'
data:
  title: 'Default Title'
  count: 0
```

```bash
# 覆盖 title 和 count
yao tui myapp '::{\"title\":\"External\",\"count\":100}'

# 结果：
# - title: "External" (外部数据覆盖)
# - count: 100 (外部数据覆盖)
```

## TUI List 功能

`yao tui list` 命令已更新，现在会自动将 TUI 列表数据传递给 `__yao.tui-list` TUI 界面。

### 数据传递

当执行 `yao tui list` 时：

1. 获取所有已加载的 TUI 配置：`tui.List()`
2. 准备 TUI 项目数据结构：
   ```json
   {
     "id": "tui-id",
     "name": "TUI Name",
     "command": "yao tui tui-id",
     "description": "Description (optional)"
   }
   ```
3. 将数据合并到 `__yao.tui-list` 的 `cfg.Data` 中：
   - `items`: TUI ID 数组（用于 list 组件绑定的 `bind: items`）
   - `tuiItems`: 完整的项目对象数组
   - `tuiList`: TUI ID 数组的副本
   - `totalCount`: TUI 总数

### TUI List 配置结构

`__yao.tui-list` 配置：

```yaml
{
  "name": "TUI List",
  "data": {
    "title": "Available TUI Configurations",
    "description": "Select a TUI to run",
    "items": []  ← 这里会被自动填充
  },
  "layout": {
    "children": [
      {
        "type": "list",
        "bind": "items",  ← 绑定到动态填充的 items
        "props": {
          "height": 20,
          "showTitle": true,
          "showFilter": true
        }
      }
    ]
  }
}
```

### 使用示例

```bash
# 使用 TUI 界面列出所有 TUI
yao tui list

# 使用文本输出
yao tui list --text
```

## 数据合并规则

### 浅合并（当前实现）

对于嵌套对象，是整体替换而非深度合并：

```json
// 静态配置：
{
  "config": {
    "backgroundColor": "default",
    "textColor": "white",
    "fontSize": 14
  }
}

// 外部数据：
{
  "config": {
    "backgroundColor": "blue"
  }
}

// 结果：
{
  "config": {
    "backgroundColor": "blue"  // 仅保留 backgroundColor，丢失 textColor 和 fontSize
  }
}
```

### 多参数合并

```bash
yao tui myapp '::{\"a\":1,\"b\":2}' '::{\"b\":20,\"c\":3}'

# 结果：
{
  "a": 1,
  "b": 20,  // 后面的参数覆盖前面的
  "c": 3
}
```

## 运行时更新

除了启动时传入数据，你也可以在运行时通过消息机制更新：

### 方式1：使用 Program.Send

```javascript
function UpdateTUIState(tuiID, newState) {
  const model = tui.GetModel(tuiID);
  if (model && model.Program) {
    // 更新单个键
    model.Program.Send({
      type: 'StateUpdateMsg',
      key: 'myKey',
      value: 'newValue'
    });

    // 批量更新
    model.Program.Send({
      type: 'StateBatchUpdateMsg',
      updates: {
        key1: 'value1',
        key2: 'value2'
      }
    });
  }
}
```

### 方式2：通过 Bridge 通道

```javascript
function SendToTUI(tuiID, message) {
  const model = tui.GetModel(tuiID);
  if (model && model.Bridge) {
    model.Bridge.Send(message);
  }
}
```

## 调试

### 详细输出

```bash
yao tui myapp '::{\"key\":\"value\"}' --verbose
```

输出示例：

```
TUI external data[1]: parsed 1 keys
  key: value
Merged 1 external data keys into TUI configuration
Starting TUI: myapp
Running TUI: myapp (My App)
External data loaded with 1 keys
```

### 调试模式

```bash
yao tui myapp '::{\"debug\":true}' --debug
```

## 完整示例

### 示例 1：启动时传入简单数据

**配置文件**：`tuis/hello.tui.yao`

```yaml
{
  'name': 'Hello TUI',
  'data': { 'title': 'Hello World', 'message': 'Welcome' },
  'layout':
    {
      'direction': 'vertical',
      'children':
        [
          { 'type': 'header', 'props': { 'title': '{{title}}' } },
          { 'type': 'text', 'props': { 'content': '{{message}}' } }
        ]
    }
}
```

**命令**：

```bash
# 使用默认数据
yao tui hello

# 覆盖数据
yao tui hello '::{\"title\":\"Custom Title\",\"message\":\"Custom Message\"}'
```

### 示例 2：传入列表数据

```bash
yao tui myapp '::{
  \"title\":\"My List\",
  \"items\":[\"a\",\"b\",\"c\",\"d\",\"e\"]
}'
```

### 示例 3：结合 onLoad Process

**配置**：

```yaml
{
  'name': 'Data Loader',
  'data': { 'userId': 0, 'endpoint': '/api/data' },
  'onLoad':
    { 'process': 'load.userData', 'args': ['{{userId}}', '{{endpoint}}'] }
}
```

**命令**：

```bash
yao tui data-loader '::{\"userId\":123,\"endpoint\":\"/api/users/123\"}'
```

Process 会接收到：`[123, "/api/users/123"]`

## 常见问题

### Q: 为什么 :: 要在引号里面？

**A**: 这样与 `yao run` 命令保持一致。`::` 是 JSON 字符串的一部分，表示 "接下来的内容是 JSON 数据"。

### Q: 在 Windows 上如何使用？

**A**: 在 PowerShell 或 Git Bash 中：

**PowerShell:**

```powershell
yao tui myapp '::{\"title\":\"Test\"}'
```

**Git Bash (在 Windows 上):**

```bash
# 单引号内可以正常使用双引号
yao tui myapp '::{"title":"Test"}'

# 如果需要转义双引号
yao tui myapp '::{\"title\":\"Test\"}'
```

**CMD:**

```cmd
yao tui myapp "::{\"title\":\"Test\"}"
```

### Q: 如何传递包含换行符的字符串？

**A**: 使用转义：

```bash
yao tui myapp '::{\"message\":\"Line 1\\nLine 2\"}'
```

### Q: 如何传递大型 JSON？

**A**: 当前建议使用进程从文件加载：

```javascript
// scripts/load-from-file.js
function LoadFromFile(tuiID, filePath) {
  import * as fs from 'fs';

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const model = tui.GetModel(tuiID);
  if (model) {
    model.UpdateState(data);
  }

  return data;
}
```

### Q: TUI List 功能如何工作？

**A**: `yao tui list` 会：

1. 加载所有 TUI 配置
2. 提取每个 TUI 的信息（ID、名称、描述）
3. 将数据注入到 `__yao.tui-list` TUI 的 `data.items` 中
4. 启动 TUI 界面（使用 list 组件）
5. 用户可以选择一个 TUI，按 Enter 执行命令

## 技术细节

### 参数解析流程

1. **参数检查**：检查参数是否以 `::` 开头
2. **JSON 解析**：如果以 `::` 开头，解析为 JSON 对象
3. **数据合并**：将解析的数据合并到 `externalData` map
4. **配置注入**：将 `externalData` 合并到 TUI 配置的 `Data` 字段
5. **模型创建**：使用合并后的配置创建 TUI 模型

### 代码示例

```go
// cmd/tui/tui.go
var externalData map[string]interface{}
for i, arg := range args {
    if i == 0 {
        continue // 跳过 tuiID
    }

    // 检查是否为 JSON（:: 前缀在引号内）
    if strings.HasPrefix(arg, "::") {
        jsonStr := strings.TrimPrefix(arg, "::")
        var v map[string]interface{}
        jsoniter.Unmarshal([]byte(jsonStr), &v)

        // 合并数据
        if externalData == nil {
            externalData = v
        } else {
            for k, val := range v {
                externalData[k] = val  // 后面的覆盖前面的
            }
        }
    } else if strings.HasPrefix(arg, "\\::") {
        // 转义处理 ⇒ "::" + 去掉 "\\::"
        literalStr := "::" + strings.TrimPrefix(arg, "\\::")
        // 存储到 _args...
    }
}

// 注入到配置
if cfg.Data == nil {
    cfg.Data = make(map[string]interface{})
}
for k, v := range externalData {
    cfg.Data[k] = v  // 外部数据覆盖静态数据
}
```

## 总结

1. **语法要求**：`::` 必须在引号包裹的 JSON 字符串内部
2. **示例**：`yao tui myapp '::{"key":"value"}'`
3. **数据优先级**：外部 JSON 数据 > 静态配置
4. **多参数支持**：多个 `::` 参数会合并（后面的覆盖前面的）
5. **TUI List**：自动将 TUI 列表传递给 `__yao.tui-list` 界面

这个实现与 `yao run` 命令的行为保持一致，用户熟悉 `yao run` 的使用方式后可以轻松地使用 `yao tui` 的外部数据功能。
