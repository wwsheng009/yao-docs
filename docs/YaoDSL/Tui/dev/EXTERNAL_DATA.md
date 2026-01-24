# TUI 外部数据传入功能说明

## 概述

TUI 现在支持在启动时通过命令行参数传入外部 JSON 数据，使用与 `yao run` 相同的 `::` 语法。

## 使用方法

### 1. 简单的 JSON 对象

```bash
# 使用 :: 前缀传入 JSON 字符串
yao tui myapp :: '{"title":"External Title","count":42}'
```

在 TUI 配置中，这些数据会自动合并到 `data` 字段中：

```yaml
# tuis/myapp.tui.yao
name: 'My App'
data:
  title: 'Default Title' # 将被外部数据覆盖
  count: 0 # 将被外部数据覆盖
layout:
  direction: vertical
  children:
    - type: header
      props:
        title: '{{title}}' # 显示 "External Title"
    - type: text
      props:
        content: 'Count: {{count}}' # 显示 "Count: 42"
```

### 2. 嵌套的 JSON 对象

```bash
yao tui myapp :: '{"user":{"id":123,"name":"John"},"items":["a","b","c"]}'
```

在 TUI 中可以通过点号访问嵌套数据：

```yaml
layout:
  direction: vertical
  children:
    - type: text
      props:
        content: 'User: {{user.name}} (ID: {{user.id}})'
    - type: list
      bind: 'items'
```

### 3. 多个 :: 参数

```bash
# 多个 :: 参数会合并（后面的会覆盖前面的）
yao tui myapp :: '{"foo":"bar"}' :: '{"baz":"qux"}'
```

### 4. 转义 :: 前缀

```bash
# 如果需要传递以 :: 开头的字符串，使用 \:: 转义
yao tui myapp \::test-string
```

转义的字符串会被存储在 `_args` 数组中：

```go
// 在 TUI 中可以通过 {{_args}} 访问
```

### 5. 普通字符串参数

```bash
# 普通字符串参数也会存储在 _args 数组中
yao tui myapp arg1 arg2
```

```yaml
# 在 TUI 中
data:
  _args: ['arg1', 'arg2']
```

## 数据优先级

当外部数据与静态配置冲突时，优先级如下（从低到高）：

1. **静态配置 data** (`.tui.yao` 文件中的 `data` 字段)
2. **:: JSON 参数** (外部 JSON 数据，优先级最高)

```bash
# 示例：
yao tui myapp :: '{"dataKey":"external"}'
```

结果：`dataKey` 的值为 `"external"`，覆盖静态配置中的值。

## 完整示例

### 创建 TUI 配置文件

**文件：`tuis/hello.tui.yao`**

```yaml
{
  'name': 'Hello TUI',
  'data':
    { 'title': 'Hello World', 'message': 'This is a TUI app', 'items': [] },
  'layout':
    {
      'direction': 'vertical',
      'children':
        [
          {
            'type': 'header',
            'props': { 'title': '{{title}}', 'align': 'center' }
          },
          { 'type': 'text', 'props': { 'content': '{{message}}' } },
          {
            'type': 'text',
            'props': { 'content': 'Total items: {{len(items)}}' }
          },
          {
            'type': 'list',
            'bind': 'items',
            'props': { 'height': 15, 'showTitle': true }
          },
          { 'type': 'text', 'props': { 'content': "Press 'q' to quit" } }
        ]
    },
  'bindings':
    { 'q': { 'process': 'tui.quit' }, 'ctrl+c': { 'process': 'tui.quit' } }
}
```

### 使用外部数据启动

```bash
# 使用默认数据
yao tui hello

# 覆盖标题
yao tui hello :: '{"title":"Custom Title"}'

# 覆盖消息和添加项目
yao tui hello :: '{"message":"Welcome to my app","items":[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]}'

# 多个数据片段
yao tui hello :: '{"message":"Multiple params"}' :: '{"items":[{"id":1},{"id":2},{"id":3}]}'
```

### 结合 onLoad Process

你可以在 `onLoad` 中使用传入的数据：

**文件：`tuis/data-example.tui.yao`**

```yaml
{
  'name': 'Data Example',
  'data': { 'userId': 0, 'apiEndpoint': '/api/data' },
  'onLoad':
    {
      'process': 'tui.loadUserData',
      'args': ['{{userId}}', '{{apiEndpoint}}']
    },
  'layout':
    {
      'direction': 'vertical',
      'children':
        [
          { 'type': 'header', 'props': { 'title': 'User Data' } },
          { 'type': 'text', 'props': { 'content': 'User ID: {{userId}}' } },
          {
            'type': 'text',
            'props': { 'content': 'Data loaded from: {{apiEndpoint}}' }
          }
        ]
    }
}
```

**文件：`scripts/tui/data-loader.js`**

```javascript
/**
 * Load user data from API
 * @param {string} tuiID - TUI ID
 * @param {number} userId - User ID from external data
 * @param {string} endpoint - API endpoint from external data
 */
function LoadUserData(tuiID, userId, endpoint) {
  // 模拟 API 调用
  const userData = {
    id: userId,
    name: 'User ' + userId,
    email: 'user' + userId + '@example.com'
  };

  // 更新 TUI 状态
  const model = tui.GetModel(tuiID);
  if (model) {
    model.UpdateState({
      userData: userData,
      loadedAt: new Date().toISOString()
    });
  }

  return userData;
}
```

**使用方式：**

```bash
# 传入 userId 和 apiEndpoint，它们会传递给 onLoad process
yao tui data-example :: '{"userId":123,"apiEndpoint":"/api/users/123"}'
```

## 实现细节

### 数据解析流程

1. **加载静态配置** (`tui.Get(tuiID)`)
2. **解析命令行参数** (`::` 前缀的参数)
   - 使用 `jsoniter.Unmarshal` 解析 JSON
   - 多个 `::` 参数会合并（后面的覆盖前面的）
   - 转义的和普通字符串存储在 `_args` 中
3. **合并外部数据到配置** (`cfg.Data`)
   - 外部数据覆盖静态配置
   - 保持静态配置中未被覆盖的字段
4. **创建 TUI Model** (`tui.NewModel(cfg, nil)`)
   - 初始状态包含合并后的 `data`

### 代码实现

参考 `cmd/tui/tui.go` 中的实现：

```go
// 解析外部数据参数（类似 run.go）
var externalData map[string]interface{}
for i, arg := range args {
    if i == 0 {
        continue // Skip tuiID
    }

    // 解析参数
    if strings.HasPrefix(arg, "::") {
        arg := strings.TrimPrefix(arg, "::")
        var v map[string]interface{}
        err := jsoniter.Unmarshal([]byte(arg), &v)
        if err != nil {
            fmt.Fprintf(os.Stderr, "Failed to parse JSON: %v\n", err)
            os.Exit(1)
        }

        // 合并外部数据
        if externalData == nil {
            externalData = v
        } else {
            for k, val := range v {
                externalData[k] = val
            }
        }
    }
    // ... 处理其他情况
}

// 合并到配置
if externalData != nil && len(externalData) > 0 {
    if cfg.Data == nil {
        cfg.Data = make(map[string]interface{})
    }
    // 外部数据覆盖静态数据
    for k, v := range externalData {
        cfg.Data[k] = v
    }
}
```

## 运行时通过消息更新数据

除了启动时传入数据，你也可以在运行时通过消息机制更新状态：

### 方式1：使用 Program.Send（从外部 goroutine）

```javascript
// 在脚本中通过 Program.Send 更新状态
function UpdateTUIState(tuiID, newState) {
  const model = tui.GetModel(tuiID);
  if (model && model.Program) {
    // 更新单个键
    model.Program.Send({
      type: 'StateUpdateMsg',
      key: 'myKey',
      value: 'newValue'
    });

    // 或批量更新
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
// Bridge 提供了异步消息通道
function SendToTUI(tuiID, message) {
  const model = tui.GetModel(tuiID);
  if (model && model.Bridge) {
    model.Bridge.Send(message);
  }
}
```

### 方式3：通过事件订阅

在组件中订阅事件：

```javascript
// 在组件初始化时
function InitComponent(comp) {
  // 订阅外部数据更新事件
  tui.Subscribe('EXTERNAL_DATA_UPDATE', (msg) => {
    // 处理数据更新
    comp.model.UpdateState(msg.Data);
  });
}
```

从外部发布事件：

```javascript
// 从其他进程或网络请求
function PublishExternalUpdate(tuiID, data) {
  const model = tui.GetModel(tuiID);
  if (model && model.EventBus) {
    model.EventBus.Publish({
      id: 'external',
      action: 'EXTERNAL_DATA_UPDATE',
      data: data
    });
  }
}
```

## 调试技巧

### 启用详细输出

```bash
yao tui myapp :: '{"key":"value"}' --verbose
```

你会看到：

```
TUI external data[1]: parsed 1 keys
  key: value
Merged 1 external data keys into TUI configuration
Starting TUI: myapp
Running TUI: myapp (My App)
External data loaded with 1 keys
```

### 启用调试模式

```bash
yao tui myapp :: '{"debug":true}' --debug
```

## 常见问题

### Q: JSON 中包含特殊字符怎么办？

A: 使用单引号包装 JSON 字符串，或使用文件存储 JSON：

```bash
# 特殊字符需要转义
yao tui myapp :: '{"message":"Line 1\\nLine 2"}'

# 或使用文件（文件方式需要额外实现）
# yao tui myapp --data=/path/to/data.json
```

### Q: 如何传递大型 JSON 数据？

A: 当前建议：

1. 将数据存储在文件中（需要额外实现 `--data` 参数）
2. 或在 `onLoad` process 中从文件/数据库加载数据

### Q: 数据合并规则是什么？

A: 外部数据直接覆盖静态配置的相同键。对于复杂对象，是浅覆盖：

```json
// 静态配置
{
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  }
}

// 外部数据
{
  "user": {
    "name": "Bob"
  }
}

// 结果
{
  "user": {
    "name": "Bob"  // 仅覆盖 name，丢失 id 和 email
  }
}
```

如需深度合并，需要在代码中实现深度合并逻辑。

### Q: 能否在运行时动态加载数据？

A: 可以，使用消息机制：

1. 从组件触发加载：调用 Process 从 API/数据库获取数据
2. 使用 `model.UpdateState()` 或 `model.SetState()` 更新状态
3. UI 会自动刷新

## 总结

TUI 外部数据传入功能提供了一种灵活的方式来初始化和动态更新 TUI 的状态：

- **启动时注入数据**：使用 `::` 语法传递 JSON 数据
- **数据覆盖规则**：外部数据优先级最高
- **运行时更新**：通过消息机制动态更新状态
- **结合 onLoad**：可以在启动时根据传入的数据执行 Process

这使得 TUI 可以更好地与外部系统集成，支持从命令行、脚本或其他服务传递数据。
