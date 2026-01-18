# API 参考

Pipe 提供了完整的 API 接口，支持运行、创建、恢复和关闭 Pipe 操作。本节详细介绍所有可用的 API。

## 概览

Pipe API 分为两类：

1. **Process API**: 通过 Yao Process 调用的接口
2. **Go API**: 直接在 Go 代码中使用的接口

## Process API

### 1. pipes.<Widget.ID>

运行已加载的 Pipe。

#### 语法

```bash
yao run pipes.<Widget.ID> [args...]
```

#### 参数

| 参数          | 类型   | 说明                       |
| ------------- | ------ | -------------------------- |
| `<Widget.ID>` | string | Pipe 的 Widget ID          |
| `[args...]`   | any    | 传递给 Pipe 的参数（可选） |

#### 返回值

根据 Pipe 的执行结果返回相应的数据。如果被用户输入节点中断，则返回 `ResumeContext` 对象。

#### 示例

```bash
# 运行名为 translator 的 Pipe
yao run pipes.translator "hello world"

# 运行带参数的 Pipe
yao run pipes.data-processor "file.csv" "output.json"

# 运行需要恢复的 Pipe
yao run pipes.interactive-flow
```

#### 返回示例

```json
// 正常执行完成
{
  "result": "translated text",
  "status": "success",
  "timestamp": 1640995200
}

// 被用户输入中断
{
  "__id": "550e8400-e29b-41d4-a716-446655440000",
  "__type": "user-input",
  "__ui": "web",
  "input": ["hello world"],
  "node": {
    "name": "get-input",
    "type": "user-input",
    "ui": "web"
  },
  "data": {
    "$global": {...},
    "$sid": "session123",
    "$input": ["hello world"]
  }
}
```

### 2. pipe.Run

运行指定的 Pipe，功能与 `pipes.<Widget.ID>` 相同。

#### 语法

```bash
yao run pipe.Run <Widget.ID> [args...]
```

#### 参数

| 参数          | 类型   | 说明                       |
| ------------- | ------ | -------------------------- |
| `<Widget.ID>` | string | Pipe 的 Widget ID          |
| `[args...]`   | any    | 传递给 Pipe 的参数（可选） |

#### 示例

```bash
yao run pipe.Run translator "hello world"
yao run pipe.Run data-processor "input.csv"
```

### 3. pipe.Create

从 DSL 字符串创建并运行 Pipe。

#### 语法

```bash
yao run pipe.Create <DSL> [args...]
```

#### 参数

| 参数        | 类型   | 说明                       |
| ----------- | ------ | -------------------------- |
| `<DSL>`     | string | Pipe 的 DSL 配置字符串     |
| `[args...]` | any    | 传递给 Pipe 的参数（可选） |

#### 示例

```bash
# 简单 DSL
yao run pipe.Create 'name: "test"; nodes: [{name: "node1", process: {name: "utils.hello"}}]'

# 复杂 DSL（建议使用文件）
yao run pipe.Create "$(cat pipe-config.json)"

# 带参数
yao run pipe.Create "$dsl_content" "arg1" "arg2"
```

#### DSL 示例

```json
{
  "name": "quick-pipe",
  "label": "快速管道",
  "nodes": [
    {
      "name": "input",
      "ui": "cli",
      "label": "请输入："
    },
    {
      "name": "process",
      "process": {
        "name": "utils.echo",
        "args": ["{{ $in[0] }}"]
      }
    }
  ]
}
```

### 4. pipe.CreateWith

从 DSL 字符串创建并运行 Pipe，同时设置全局数据。

#### 语法

```bash
yao run pipe.CreateWith <DSL> '<GlobalData>' [args...]
```

#### 参数

| 参数           | 类型   | 说明                       |
| -------------- | ------ | -------------------------- |
| `<DSL>`        | string | Pipe 的 DSL 配置字符串     |
| `<GlobalData>` | string | JSON 格式的全局数据        |
| `[args...]`    | any    | 传递给 Pipe 的参数（可选） |

#### 示例

```bash
# 设置全局数据
yao run pipe.CreateWith "$dsl_content" '{"user_id": 123, "is_admin": true}'

# 合并全局数据
yao run pipe.CreateWith "$dsl_content" '{"api_key": "secret123"}' "arg1"
```

#### GlobalData 格式

```json
{
  "user_id": 123,
  "username": "admin",
  "is_admin": true,
  "api_key": "secret123",
  "config": {
    "timeout": 30,
    "retry_count": 3
  }
}
```

### 5. pipe.Resume

恢复被中断的 Pipe 执行。

#### 语法

```bash
yao run pipe.Resume <Context.ID> [args...]
```

#### 参数

| 参数           | 类型   | 说明                                 |
| -------------- | ------ | ------------------------------------ |
| `<Context.ID>` | string | 上下文 ID（从 `ResumeContext` 获取） |
| `[args...]`    | any    | 用户输入的数据                       |

#### 示例

```bash
# 恢复执行，提供用户输入
yao run pipe.Resume "550e8400-e29b-41d4-a716-446655440000" "user input data"

# 多参数输入
yao run pipe.Resume "context-id" "param1" "param2" "param3"
```

#### 完整流程示例

```bash
# 1. 启动 Pipe（被用户输入中断）
context=$(yao run pipe.Create "$dsl" "initial_data")
context_id=$(echo "$context" | jq -r '.__id')

# 2. 获取用户输入
read -p "请输入: " user_input

# 3. 恢复执行
result=$(yao run pipe.Resume "$context_id" "$user_input")
echo "$result"
```

### 6. pipe.ResumeWith

恢复被中断的 Pipe 执行，同时更新全局数据。

#### 语法

```bash
yao run pipe.ResumeWith <Context.ID> '<GlobalData>' [args...]
```

#### 参数

| 参数           | 类型   | 说明                |
| -------------- | ------ | ------------------- |
| `<Context.ID>` | string | 上下文 ID           |
| `<GlobalData>` | string | JSON 格式的全局数据 |
| `[args...]`    | any    | 用户输入的数据      |

#### 示例

```bash
# 恢复并更新全局数据
yao run pipe.ResumeWith "context-id" '{"new_value": "updated"}' "user input"

# 合并全局数据
yao run pipe.ResumeWith "context-id" '{"status": "completed"}' "result"
```

### 7. pipe.Close

关闭指定上下文的 Pipe。

#### 语法

```bash
yao run pipe.Close <Context.ID>
```

#### 参数

| 参数           | 类型   | 说明              |
| -------------- | ------ | ----------------- |
| `<Context.ID>` | string | 要关闭的上下文 ID |

#### 示例

```bash
# 关闭指定上下文
yao run pipe.Close "550e8400-e29b-41d4-a716-446655440000"

# 清理所有活跃的上下文（脚本示例）
for id in $(yao run pipe.list-contexts); do
    yao run pipe.Close "$id"
done
```

## Go API

### 1. Pipe 结构体

```go
type Pipe struct {
    ID        string
    Name      string    `json:"name"`
    Nodes     []Node    `json:"nodes"`
    Label     string    `json:"label,omitempty"`
    Hooks     *Hooks    `json:"hooks,omitempty"`
    Output    any       `json:"output,omitempty"`
    Input     Input     `json:"input,omitempty"`
    Whitelist Whitelist `json:"whitelist,omitempty"`
    Goto      string    `json:"goto,omitempty"`

    // 内部字段
    parent    *Pipe
    namespace string
    mapping   map[string]*Node
}
```

### 2. New 函数

从字节数组创建 Pipe。

```go
func New(source []byte) (*Pipe, error)
```

#### 参数

- `source []byte`: DSL 配置的字节数组

#### 返回值

- `*Pipe`: 创建的 Pipe 实例
- `error`: 错误信息

#### 示例

```go
dsl := []byte(`{
  "name": "test-pipe",
  "nodes": [
    {
      "name": "node1",
      "process": {
        "name": "utils.hello"
      }
    }
  ]
}`)

pipe, err := New(dsl)
if err != nil {
    log.Fatal(err)
}
```

### 3. NewFile 函数

从文件创建 Pipe。

```go
func NewFile(file string, root string) (*Pipe, error)
```

#### 参数

- `file string`: DSL 文件路径
- `root string`: 根目录路径

#### 返回值

- `*Pipe`: 创建的 Pipe 实例
- `error`: 错误信息

#### 示例

```go
pipe, err := NewFile("pipes/translator.pip.yao", "pipes")
if err != nil {
    log.Fatal(err)
}
```

### 4. Context 相关方法

#### Create 方法

```go
func (pipe *Pipe) Create() *Context
```

创建新的执行上下文。

#### 示例

```go
ctx := pipe.Create()
```

#### With 方法

```go
func (ctx *Context) With(context context.Context) *Context
```

设置 Go context。

#### WithGlobal 方法

```go
func (ctx *Context) WithGlobal(data map[string]interface{}) *Context
```

设置全局数据。

#### WithSid 方法

```go
func (ctx *Context) WithSid(sid string) *Context
```

设置会话 ID。

#### Run 方法

```go
func (ctx *Context) Run(args ...any) any
```

运行 Pipe，遇到错误会抛出异常。

#### Exec 方法

```go
func (ctx *Context) Exec(args ...any) (any, error)
```

执行 Pipe，返回结果和错误。

#### Resume 方法

```go
func (ctx *Context) Resume(id string, args ...any) any
```

恢复执行。

### 5. 全局函数

#### Load 函数

```go
func Load(cfg config.Config) error
```

加载所有 Pipe 文件。

#### Get 函数

```go
func Get(id string) (*Pipe, error)
```

获取指定的 Pipe。

#### Set 函数

```go
func Set(id string, pipe *Pipe)
```

设置 Pipe 到注册表。

#### Remove 函数

```go
func Remove(id string)
```

移除指定的 Pipe。

#### Open 函数

```go
func Open(id string) (*Context, error)
```

打开指定 ID 的上下文。

#### Close 函数

```go
func Close(id string)
```

关闭指定 ID 的上下文。

## 完整使用示例

### 1. 基本使用

```go
package main

import (
    "fmt"
    "log"
    "github.com/yaoapp/yao/pipe"
)

func main() {
    // 1. 创建 Pipe
    dsl := `{
  "name": "hello-world",
  "label": "问候世界",
  "nodes": [
    {
      "name": "input",
      "ui": "cli",
      "label": "请输入您的名字："
    },
    {
      "name": "greet",
      "process": {
        "name": "utils.greet",
        "args": ["{{ $in[0] }}"]
      }
    },
    {
      "name": "output",
      "ui": "cli",
      "label": "问候结果：",
      "autofill": {
        "value": "{{ $out }}",
        "action": "exit"
      }
    }
  ]
}`

    pipe, err := pipe.New([]byte(dsl))
    if err != nil {
        log.Fatal(err)
    }

    // 2. 创建上下文
    ctx := pipe.Create().
        WithGlobal(map[string]interface{}{
            "language": "zh-CN",
            "format": "formal",
        }).
        WithSid("session-123")

    // 3. 执行 Pipe
    result := ctx.Run()
    fmt.Printf("Result: %v\n", result)
}
```

### 2. 流程控制示例

```go
func demonstrateFlowControl() {
    dsl := `{
  "name": "conditional-flow",
  "nodes": [
    {
      "name": "get-number",
      "ui": "cli",
      "label": "请输入一个数字："
    },
    {
      "name": "check-range",
      "switch": {
        "{{ $in[0] > 100 }}": {
          "name": "large",
          "nodes": [
            {
              "name": "handle-large",
              "process": {
                "name": "math.large_number",
                "args": ["{{ $in[0] }}"]
              }
            }
          ]
        },
        "{{ $in[0] > 10 }}": {
          "name": "medium",
          "nodes": [
            {
              "name": "handle-medium",
              "process": {
                "name": "math.medium_number",
                "args": ["{{ $in[0] }}"]
              }
            }
          ]
        },
        "default": {
          "name": "small",
          "nodes": [
            {
              "name": "handle-small",
              "process": {
                "name": "math.small_number",
                "args": ["{{ $in[0] }}"]
              }
            }
          ]
        }
      }
    }
  ]
}`

    pipe, _ := pipe.New([]byte(dsl))
    ctx := pipe.Create()

    // 第一阶段执行到用户输入
    result1 := ctx.Run()

    // 模拟用户输入并恢复
    if resumeCtx, ok := result1.(pipe.ResumeContext); ok {
        result2 := ctx.Resume(resumeCtx.ID, "25")
        fmt.Printf("Final result: %v\n", result2)
    }
}
```

### 3. AI 集成示例

```go
func demonstrateAI() {
    dsl := `{
  "name": "ai-assistant",
  "whitelist": ["ai.*"],
  "nodes": [
    {
      "name": "user-query",
      "ui": "cli",
      "label": "请输入您的问题："
    },
    {
      "name": "ai-response",
      "prompts": [
        {
          "role": "system",
          "content": "你是一个专业的AI助手"
        },
        {
          "role": "user",
          "content": "{{ $in[0] }}"
        }
      ],
      "model": "gpt-3.5-turbo",
      "options": {
        "temperature": 0.7,
        "max_tokens": 500
      }
    },
    {
      "name": "show-response",
      "ui": "cli",
      "label": "AI 回答：",
      "autofill": {
        "value": "{{ $out.choices[0].message.content }}",
        "action": "exit"
      }
    }
  ]
}`

    pipe, _ := pipe.New([]byte(dsl))
    ctx := pipe.Create()

    result := ctx.Run()
    fmt.Printf("AI Response: %v\n", result)
}
```

### 4. 错误处理示例

```go
func demonstrateErrorHandling() {
    dsl := `{
  "name": "error-handling-demo",
  "nodes": [
    {
      "name": "validate-input",
      "process": {
        "name": "utils.validate_email",
        "args": ["{{ $in[0] }}"]
      }
    },
    {
      "name": "handle-invalid",
      "process": {
        "name": "utils.handle_error",
        "args": ["{{ $out.is_valid }}"]
      },
      "goto": "{{ $out.is_valid ? 'success' : 'error' }}"
    },
    {
      "name": "success",
      "ui": "cli",
      "label": "验证成功！"
    },
    {
      "name": "error",
      "ui": "cli",
      "label": "验证失败，请检查输入。"
    }
  ]
}`

    pipe, _ := pipe.New([]byte(dsl))
    ctx := pipe.Create()

    // 尝试执行
    result, err := ctx.Exec("invalid-email")
    if err != nil {
        fmt.Printf("Error occurred: %v\n", err)
        return
    }

    fmt.Printf("Result: %v\n", result)
}
```

## 性能考虑

### 1. 内存管理

- 及时关闭不需要的上下文：`Close(contextID)`
- 避免在全局数据中存储大量数据
- 定期清理已完成的上下文

### 2. 并发安全

- 每个 Context 是独立的，支持并发执行
- 使用 `sync.Map` 存储上下文，保证线程安全
- Switch 分支创建新的子上下文，避免竞争

### 3. 表达式优化

- 复杂表达式会被预编译，提高执行效率
- 避免在循环中使用复杂的表达式计算
- 合理使用变量缓存计算结果

## 最佳实践

### 1. 错误处理

```go
// ✅ 好的做法：使用 Exec 方法处理错误
result, err := ctx.Exec(args...)
if err != nil {
    // 处理错误
    return fmt.Errorf("pipe execution failed: %w", err)
}

// ❌ 避免：直接使用 Run 方法可能抛出异常
result := ctx.Run(args...)  // 可能 panic
```

### 2. 资源管理

```go
// ✅ 好的做法：确保资源清理
ctx := pipe.Create()
defer pipe.Close(ctx.id)

result := ctx.Run(args...)
```

### 3. 上下文配置

```go
// ✅ 好的做法：链式配置
ctx := pipe.Create().
    WithGlobal(globalData).
    WithSid(sessionID).
    With(goContext)
```

### 4. DSL 管理

```go
// ✅ 好的做法：从文件加载 DSL
pipe, err := pipe.NewFile("pipes/mypipe.pip.yao", "pipes")

// ✅ 好的做法：验证 DSL
if err := pipe.build(); err != nil {
    return fmt.Errorf("invalid DSL: %w", err)
}
```
