# DSL 语法

> ⚠️ **重要**: Pipe DSL 使用 **JSON 格式**，不是 YAML！
>
> 📖 查看 [JSON 格式说明](./JSON-格式说明.md) 了解详细的转换指南

Pipe 使用 JSON 格式的 DSL (Domain Specific Language) 来定义流程配置。本节详细介绍 Pipe DSL 的语法结构。

## 基本结构

```json
{
  "name": "string",           // Pipe 名称（必需）
  "label": "string",         // Pipe 显示标签（可选）
  "nodes": [Node],           // 节点列表（必需）
  "input": Input,            // Pipe 级输入表达式（可选）
  "output": any,             // Pipe 级输出表达式（可选）
  "goto": "string",          // 跳转节点名（可选）
  "hooks": Hooks,            // 钩子配置（可选）
  "whitelist": Whitelist     // Process 白名单（可选）
}
```

## 节点定义

### Node 结构

```json
{
  "name": "string",           // 节点名称（必需）
  "type": "string",           // 节点类型（可选，自动推断）
  "label": "string",          // 节点显示标签（可选）
  "input": Input,             // 节点输入表达式（可选）
  "output": any,              // 节点输出表达式（可选）
  "goto": "string",            // 跳转目标（可选）

  // 以下是各种节点的特定配置
  "process": Process,         // Yao Process 节点配置
  "prompts": [Prompt],        // AI 节点提示词
  "model": "string",          // AI 模型名称
  "options": {},              // AI/Request 选项
  "ui": "string",             // 用户界面类型
  "autofill": AutoFill,       // 自动填充配置
  "switch": {}                // Switch 节点配置
}
```

## 节点类型

### 1. Process 节点

用于执行 Yao Process 的节点，是最常用的节点类型之一。

#### 基本配置

```json
{
  "name": "calculate",
  "type": "process", // 可选，会自动推断
  "label": "数据计算",
  "process": {
    "name": "math.calculate", // Process 名称（必需）
    "args": ["{{ $in[0] }}", "{{ $in[1] }}"] // Process 参数（可选）
  },
  "input": ["{{ $global.a }}", "{{ $global.b }}"], // 节点输入（可选）
  "output": "{{ $out }}" // 节点输出（可选）
}
```

### 2. AI 节点

用于调用大语言模型的节点，支持多种 AI 模型和流式响应。

#### 基本配置

```json
{
  "name": "translate",
  "type": "ai", // 可选，会自动推断
  "label": "AI 翻译",
  "model": "gpt-3.5-turbo", // 模型名称（可选）
  "connector": "openai-connector", // AI 连接器 ID（可选）
  "prompts": [
    // 提示词列表（必需）
    {
      "role": "system",
      "content": "你是一个专业的翻译助手"
    },
    {
      "role": "user",
      "content": "请将以下内容翻译成英文：{{ $in[0] }}"
    }
  ],
  "options": {
    // AI 选项（可选）
    "temperature": 0.7,
    "max_tokens": 1000
  },
  "output": "{{ $out.choices[0].message.content }}"
}
```

#### AI 节点配置项详解

**connector 配置**

`connector` 字段用于指定使用自定义的 AI 连接器：

- **connector (string, 可选)**: AI 连接器 ID
  - 如果配置了 `connector`，则使用指定的连接器
  - 如果未配置，则使用默认的 moapi 服务
  - 连接器需要在 Yao 的 connector 配置中预先定义

```json
// 使用自定义连接器
{
  "name": "custom-ai",
  "connector": "openai-connector",  // 使用指定的连接器
  "prompts": [
    {
      "role": "system",
      "content": "你是一个 AI 助手"
    },
    {
      "role": "user",
      "content": "{{ $in[0] }}"
    }
  ]
}

// 使用默认 moapi 服务
{
  "name": "default-ai",
  "model": "gpt-3.5-turbo",  // 不配置 connector，使用默认服务
  "prompts": [
    {
      "role": "system",
      "content": "你是一个 AI 助手"
    },
    {
      "role": "user",
      "content": "{{ $in[0] }}"
    }
  ]
}
```

**model 配置**

支持的模型名称取决于具体的 AI 服务配置：

```json
// OpenAI 模型
{"model": "gpt-4"}
{"model": "gpt-3.5-turbo"}
{"model": "gpt-4-turbo"}

// 其他模型（取决于配置）
{"model": "claude-3"}
{"model": "gemini-pro"}
```

**prompts 配置**

支持多轮对话的提示词数组：

- 每个提示词包含 `role` 和 `content` 字段
- `role` 可选值: `system`, `user`, `assistant`
- `content` 支持表达式插值

**options 配置**

常用的 AI 选项：

```json
{
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 0.9,
    "frequency_penalty": 0.5,
    "presence_penalty": 0.5,
    "stream": true
  }
}
```

### 3. Switch 节点

用于条件分支的节点，根据条件表达式选择执行不同的子流程。

#### 基本配置

```json
{
  "name": "router",
  "type": "switch", // 可选，会自动推断
  "label": "路由选择",
  "switch": {
    "{{ $in[0] > 10 }}": {
      // 条件表达式
      "name": "high-branch", // 分支名称
      "input": ["{{ $in[0] }}"], // 分支输入（可选）
      "nodes": [
        // 分支节点（可选）
        {
          "name": "handle-high",
          "process": {
            "name": "process.high",
            "args": ["{{ $in[0] }}"]
          }
        }
      ],
      "output": "{{ $out }}" // 分支输出（可选）
    },
    "{{ $in[0] > 5 }}": {
      "name": "medium-branch",
      "nodes": [
        {
          "name": "handle-medium",
          "process": {
            "name": "process.medium"
          }
        }
      ]
    },
    "default": {
      // 默认分支
      "name": "low-branch",
      "nodes": [
        {
          "name": "handle-low",
          "process": {
            "name": "process.low"
          }
        }
      ]
    }
  }
}
```

### 4. User Input 节点

用于与用户交互的节点，支持多种界面类型。

#### 基本配置

```json
{
  "name": "get-input",
  "type": "user-input", // 可选，会自动推断
  "ui": "cli", // 界面类型
  "label": "请输入内容：", // 提示标签
  "autofill": {
    // 自动填充（可选）
    "value": "{{ $global.default_value }}",
    "action": "exit" // 自动动作
  },
  "input": ["{{ $global.prompt }}"], // 节点输入（可选）
  "output": "{{ $out }}" // 节点输出（可选）
}
```

## 配置项详解

### Whitelist (白名单)

限制可执行的 Yao Process，提高安全性。

```json
// 数组格式
{
  "whitelist": ["math.*", "utils.*", "user.validate"]
}

// 或者对象格式
{
  "whitelist": {
    "math.calculate": true,
    "utils.format": true
  }
}
```

### Hooks (钩子)

定义执行过程中的钩子函数。

```json
{
  "hooks": {
    "progress": "hooks.report" // 进度报告钩子
  }
}
```

### Input/Output 表达式

使用 `{{ }}` 语法的表达式进行数据绑定。

```json
// Pipe 级输入
{
  "input": ["{{ $global.user_id }}", "{{ $input[0] }}"]
}

// Pipe 级输出
{
  "output": {
    "result": "{{ $out }}",
    "timestamp": "{{ now() }}",
    "user": "{{ $global.user }}"
  }
}

// 节点级输入
{
  "input": ["{{ $global.api_key }}", "{{ $in[0] }}"]
}

// 节点级输出
{
  "output": "{{ $out.data }}"
}
```

### Goto 跳转

控制执行流程的跳转。

```json
// 跳转到指定节点
{
  "goto": "next-node"
}

// 条件跳转
{
  "goto": "{{ $in[0] ? 'success' : 'error' }}"
}

// 结束流程
{
  "goto": "EOF"
}
```

## 数据类型

### Input 类型

支持多种输入数据格式：

```json
// 数组格式
{
  "input": ["value1", "{{ $global.value2 }}", 123]
}

// 字符串格式（单值）
{
  "input": "{{ $global.single_value }}"
}
```

### Args 类型

Process 参数的多种格式：

```json
// 数组格式
{
  "process": {
    "args": ["{{ $in[0] }}", "{{ $in[1] }}"]
  }
}

// 字符串格式
{
  "process": {
    "args": "{{ $in[0] }}"
  }
}

// 混合格式
{
  "process": {
    "args": ["fixed_value", "{{ $in[0] }}", 123]
  }
}
```

### AutoFill 类型

自动填充配置：

```json
// 简单值
{
  "autofill": "{{ $global.default_value }}"
}

// 对象格式
{
  "autofill": {
    "value": "{{ $global.default_value }}",
    "action": "exit"        // exit 或空
  }
}
```

## 表达式语法

### 基本语法

```json
// 变量引用
{
  "value": "{{ $global.var_name }}"
}

// 表达式计算
{
  "result": "{{ $in[0] + $in[1] }}"
}

// 表达式条件
{
  "result": "{{ $in[0] > 10 ? 'large' : 'small' }}"
}

// 函数调用
{
  "timestamp": "{{ now() }}"
}

// 对象访问
{
  "name": "{{ $user.name }}"
}
```

### 内置变量

| 变量               | 说明          |
| ------------------ | ------------- |
| `$global`          | 全局数据      |
| `$input`           | Pipe 输入数据 |
| `$output`          | Pipe 输出数据 |
| `$sid`             | 会话ID        |
| `$in`              | 当前节点输入  |
| `$out`             | 当前节点输出  |
| `$node.<name>.in`  | 指定节点输入  |
| `$node.<name>.out` | 指定节点输出  |

## 完整示例

```json
{
  "name": "smart-assistant",
  "label": "智能助手",
  "description": "基于 AI 的智能对话助手",

  // 全局配置
  "whitelist": ["ai.*", "user.*", "utils.*"],
  "hooks": {
    "progress": "hooks.track_progress"
  },

  // Pipe 级输入
  "input": ["{{ $global.user_id }}", "{{ $input[0] }}"],

  // Pipe 级输出
  "output": {
    "response": "{{ $out }}",
    "user": "{{ $global.user_info }}",
    "timestamp": "{{ now() }}"
  },

  // 节点定义
  "nodes": [
    // 1. 用户输入
    {
      "name": "user-input",
      "ui": "cli",
      "label": "请输入您的问题：",
      "autofill": {
        "value": "{{ $global.default_question }}"
      }
    },

    // 2. 用户信息获取
    {
      "name": "get-user",
      "process": {
        "name": "user.get_info",
        "args": ["{{ $global.user_id }}"]
      },
      "input": ["{{ $sid }}"]
    },

    // 3. 路由判断
    {
      "name": "router",
      "switch": {
        "{{ $global.user_info.is_vip == true }}": {
          "name": "vip-handler",
          "nodes": [
            {
              "name": "vip-ai",
              "prompts": [
                {
                  "role": "system",
                  "content": "你是 VIP 用户专属助手"
                },
                {
                  "role": "user",
                  "content": "{{ $in[0] }}"
                }
              ],
              "model": "gpt-4",
              "options": {
                "temperature": 0.3
              }
            }
          ]
        },
        "default": {
          "name": "normal-handler",
          "nodes": [
            {
              "name": "normal-ai",
              "prompts": [
                {
                  "role": "system",
                  "content": "你是通用助手"
                },
                {
                  "role": "user",
                  "content": "{{ $in[0] }}"
                }
              ],
              "model": "gpt-3.5-turbo"
            }
          ]
        }
      }
    },

    // 4. 结果展示
    {
      "name": "show-result",
      "ui": "cli",
      "label": "回答结果：",
      "autofill": {
        "value": "{{ $out }}"
      }
    }
  ]
}
```

## 注意事项

1. **节点名称唯一性**: 同一 Pipe 内节点名称必须唯一
2. **必需字段**: `name` 和对应的节点配置字段是必需的
3. **表达式语法**: 所有表达式使用 `{{ }}` 包裹
4. **安全限制**: Process 调用受白名单限制
5. **类型推断**: `type` 字段通常可以省略，系统会自动推断
6. **循环引用**: 避免节点间的循环引用，可能导致死循环
