---
name: pipe
description: Configuration guide for Yao Pipe, a logic orchestration mechanism for complex flows, human-machine interaction, and AI tasks.
license: Complete terms in LICENSE.txt
---

Pipe 是 Yao 引擎中用于处理复杂逻辑编排的机制，特别适用于需要人机交互（User Input）或 AI 多轮对话的场景，它是 Flow 的一种替代方案，支持上下文挂起与恢复。

以下是详细的配置说明文档：

# Yao Pipe (管道) 配置与使用指南

Pipe (管道) 是一种基于 JSON/YAML 的 DSL，用于定义应用程序的逻辑流程。与传统的 Flow 不同，Pipe 设计之初就考虑了长流程、人机交互（CLI/Web）以及基于大模型的复杂任务编排。

## 1\. 文件存放与命名

Pipe 文件通常存放在项目的 `pipes` 目录下。

- **路径**: `<project_root>/pipes/`
- **扩展名**: `.pip.yao` 或 `.pipe.yao`
- **ID 生成**: 文件路径即为 Pipe 的 ID。例如 `pipes/cli/translator.pip.yao` 的 ID 为 `pipes.cli.translator`。

## 2\. DSL 根结构

Pipe 的根对象包含流程的基本信息、安全白名单、钩子以及核心的节点列表。

```json
{
  "name": "AI Translator",
  "label": "AI 翻译助手",
  "hooks": { "progress": "scripts.pipe.onProgress" },
  "whitelist": ["utils.json.Validate", "utils.fmt.Print", "utils.app.Ping"],
  "nodes": [ ... ],
  "output": { ... },
  "input": [ ... ]
}
```

### 字段说明

- **name** (String): 管道名称。
- **nodes** (Array): 流程节点列表，这是 Pipe 的核心。
- **hooks** (Object): 钩子配置，例如 `progress` 用于定义进度回调脚本。
- **whitelist** (Array): 安全白名单。在 Pipe 中调用的 Yao Process (处理器) 必须在此列表中声明，否则会报错。
  - 支持 **精确匹配**：例如 `utils.fmt.Print`
  - 支持 **前缀通配符**：例如 `utils.*` 会匹配 `utils.validate_age`、`utils.fmt.Print` 等
  - 支持 **glob 通配符**（`* ? []`）：例如 `*.fmt.*` 可以匹配 `utils.fmt.Print`
  - 特别说明：如果 `whitelist` 是空数组（`[]`），视为 **不限制**（等同未配置白名单）
- **input** (Array): 定义 Pipe 启动时的输入参数结构。
- **output** (Any): 定义 Pipe 执行结束后的最终返回值表达式。

## 3\. 节点 (Nodes) 配置详解

Pipe 通过 `nodes` 数组顺序执行逻辑。每个节点根据其属性不同，被解析为不同的类型。

### 通用属性

所有节点都支持以下字段：

- **name** (String): **必填**，节点唯一标识符。
- **label** (String): 节点显示名称。
- **input** (Array): 节点的输入参数表达式。
- **output** (Any): 节点的输出处理表达式。
- **goto** (String): 流程控制，指定下一个节点的名称或 `EOF` (结束)。

### 3.1 用户输入节点 (User Input Node)

用于暂停当前流程，等待用户（通过 CLI、Web 等）输入数据。

**识别条件**: 包含 `ui` 字段。

```json
{
  "name": "user",
  "label": "输入命令",
  "ui": "cli",
  "autofill": { "value": "{{ $in[0].placeholder }}", "action": "exit" },
  "output": { "cmd": "{{$out[0]}}", "args": "{{$out[1:]}}" }
}
```

- **ui**: 界面类型，支持 `cli`, `web`, `app`, `wxapp`。
- **autofill**: 自动填充配置，常用于测试或默认行为。

### 3.2 处理器节点 (Yao Process Node)

用于调用 Yao 引擎内置的处理器（如数据库操作、工具函数等）。

**识别条件**: 包含 `process` 字段。

```json
{
  "name": "print",
  "process": {
    "name": "utils.fmt.Print",
    "args": "{{ translate }}"
  }
}
```

- **process.name**: 调用的处理器名称（需在根配置的 `whitelist` 中声明）。
- **process.args**: 传递给处理器的参数列表。

### 3.3 AI 节点 (AI Node)

用于调用大语言模型进行生成或对话。

**识别条件**: 包含 `prompts` 字段。

```json
{
  "name": "translate",
  "model": "gpt-3.5-turbo",
  "prompts": [
    { "role": "system", "content": "You are a translator." },
    { "role": "user", "content": "{{ $in[0] }}" }
  ]
}
```

- **prompts**: 对话历史与提示词，支持变量替换。
- **model**: (可选) 指定使用的 AI 模型。
- **options**: (可选) AI 调用的额外参数（如 temperature）。

### 3.4 分支节点 (Switch Node)

用于实现条件判断逻辑。

**识别条件**: 包含 `switch` (在 DSL 中写作 `case`) 字段。

```json
{
  "name": "switch",
  "case": {
    "user.cmd == 'translate'": {
      "input": "{{ user.args[0] }}",
      "nodes": [ ... ],
      "goto": "print"
    },
    "user.cmd == 'exit'": { "goto": "EOF" },
    "default": { "goto": "help" }
  }
}
```

- **case**: 一个 Map，Key 为条件表达式，Value 为子 Pipe 配置。
- **子 Pipe**: 每个 case 内部可以拥有自己的 `nodes`、`input`、`output` 和 `goto`。

## 4\. 上下文与变量引用

在 Pipe 的执行过程中，可以使用 `{{ }}` 语法引用上下文变量：

- **`{{ $in }}`**: 当前节点的输入数据。
- **`{{ $out }}`**: 上一个节点执行后的原始输出。
- **`{{ node_name }}`**: 引用特定节点的输出结果 (例如 `{{ translate.Chinese }}`)。
- **`{{ $global }}`**: 全局变量映射。
- **`{{ $sid }}`**: 当前会话 ID。

## 5\. 运行与调试

### CLI 运行

可以通过 `yao run` 命令直接执行 Pipe：

```bash
yao run pipes.cli.translator
```

如果 Pipe 执行过程中遇到 `User Input` 节点，它会挂起并等待交互（如果在 CLI 模式下会提示输入）。

### 在代码中调用

Yao 提供了 Go API 来操作 Pipe：

- **`pipes.<ID>`**: 像调用普通 Process 一样调用 Pipe。
- **`pipe.Run(id, args...)`**: 运行指定 ID 的 Pipe。
- **`pipe.Resume(context_id, args...)`**: 当 Pipe 因用户输入挂起时，使用此方法恢复执行并传入用户输入的数据。
- **`pipe.Close(context_id)`**: 强制关闭一个挂起的 Pipe 上下文。

## 6\. 配置示例 (基于 Translator)

以下是一个整合了 AI 翻译功能的 Pipe 配置示例：

```json
{
  "name": "AI Translator",
  "whitelist": ["utils.json.Validate", "utils.fmt.Print"],
  "nodes": [
    {
      "name": "user",
      "label": "获取用户输入",
      "ui": "cli",
      "output": { "cmd": "{{$out[0]}}", "content": "{{$out[1]}}" }
    },
    {
      "name": "logic_switch",
      "case": {
        "user.cmd == 'translate'": {
          "nodes": [
            {
              "name": "ai_translate",
              "prompts": [
                {
                  "role": "system",
                  "content": "Translate the following to Chinese."
                },
                { "role": "user", "content": "{{ user.content }}" }
              ]
            },
            {
              "name": "output_result",
              "process": {
                "name": "utils.fmt.Print",
                "args": "{{ ai_translate }}"
              }
            }
          ]
        },
        "default": { "goto": "EOF" }
      }
    }
  ]
}
```

继续深入探讨 Yao 引擎的技术细节。

在上一份指南中，介绍了 Pipe 的基础使用。现在将深入 **Yao 引擎源码 (`pipe/types.go` 和 `pipe/pipe.go`)**，从数据结构和解析逻辑的层面，详细剖析 Pipe 支持的节点类型及其底层配置原理。

Pipe 的节点解析逻辑主要集中在 `pipe.go` 的 `_build` 方法中。引擎并不要求你显式指定节点的 `type`，而是根据你提供的**特征字段**来自动推断节点类型。

以下是基于源码分析的 **5 种节点类型** 及其深度配置说明：

### 1\. 处理器节点 (Yao Process Node)

这是最基础的节点，用于执行具体的业务逻辑或工具函数。

- **识别依据**: 存在 `process` 字段。
- **Go 结构体定义**:
  ```go
  type Process struct {
      Name string `json:"name"`           // 处理器名称，如 "utils.fmt.Print"
      Args Args   `json:"args,omitempty"` // 参数列表
  }
  ```
- **深度配置解析**:
  - **安全机制**: 在 `_build` 阶段，引擎会强制检查 `whitelist`。如果 Pipe 定义了白名单，而 `process.name` 不在其中，初始化时会直接报错。
  - **参数传递**: `args` 支持使用 `{{ $in }}` (当前节点输入) 或 `{{ $out }}` (上一节点输出) 等变量表达式进行动态注入。

### 2\. AI 节点 (AI Node)

专为大语言模型交互设计的节点，内置了对话历史管理和提示词拼接逻辑。

- **识别依据**: 存在 `prompts` 字段。
- **Go 结构体定义**:
  ```go
  Prompts  []Prompt       `json:"prompts,omitempty"`  // AI 提示词数组
  Model    string         `json:"model,omitempty"`    // 模型名称
  Options  map[string]any `json:"options,omitempty"`  // LLM 调用选项
  ```
- **深度配置解析**:
  - **Prompts**: 这是一个 `Prompt` 结构体数组，包含 `role` (system/user/assistant) 和 `content`。引擎会在运行时自动合并上下文中的 `history`。
  - **Model**: 允许覆盖默认模型，指定如 `gpt-4` 或私有模型。
  - **Options**: 直接透传给 AI Provider 的参数，例如 `temperature`, `max_tokens` 等。

### 3\. 分支节点 (Switch Node)

用于实现复杂的流控制，本质上是一个**嵌套的 Pipe 集合**。

- **识别依据**: 存在 `case` 字段 (Go 结构体中字段名为 `Switch`，但 JSON tag 为 `case`)。
- **Go 结构体定义**:
  ```go
  Switch map[string]*Pipe `json:"case,omitempty"`
  ```
- **深度配置解析**:
  - **Map 结构**: `case` 的 Key 是条件表达式（例如 `user.cmd == 'translate'`），Value 是一个完整的 `Pipe` 结构。
  - **子 Pipe 特性**: 每个分支内部是一个独立的 Pipe，拥有自己的 `nodes`, `input`, `output`。
  - **命名空间继承**: 源码显示，子 Pipe 会自动继承父 Pipe 的 `whitelist` 配置，并生成形如 `parent_id.switch_name#key` 的唯一 ID。

### 4\. 用户输入节点 (User Input Node)

这是 Pipe 区别于 Flow 的核心特性，允许流程**挂起 (Suspend)** 并等待外部输入。

- **识别依据**: 存在 `ui` 字段。
- **Go 结构体定义**:
  ```go
  UI       string    `json:"ui,omitempty"`       // 界面类型: cli, web, app, wxapp
  AutoFill *AutoFill `json:"autofill,omitempty"` // 自动填充配置
  ```
- **深度配置解析**:
  - **UI 类型检查**: 源码强制校验 `ui` 必须是 `cli`, `web`, `app`, `wxapp` 之一，否则报错。
  - **AutoFill**: 包含 `value` 和 `action`。常用于在非交互模式下（如自动化测试）自动提供输入值，避免流程无限挂起。
  - **挂起机制**: 当引擎执行到此节点时，会保存当前 `Context`（包括变量状态、执行位置）并返回一个 `ResumeContext` ID。客户端需使用此 ID 调用 `pipe.Resume` 来恢复执行。

### 5\. 请求节点 (Request Node) - _实验性/预留_

- **识别依据**: 存在 `request` 字段。
- **Go 结构体定义**:
  ```go
  type Request struct{} // 目前为空结构体
  ```
- **现状分析**:
  虽然源码 `pipe.go` 中有解析 `request` 的逻辑分支，但 `Request` 结构体目前在 `types.go` 中是**空定义**。这意味着目前你无法在 DSL 中配置具体的 HTTP URL、Method 等参数。
  _建议_: 如果需要发起 HTTP 请求，请使用 **Process Node** 并调用 `http.Get` 或 `http.Post` 等内置处理器，而不要使用 `request` 节点类型。

### 节点通用配置 (Node Common Config)

所有节点都继承自 `Node` 结构体，支持以下通用处理逻辑：

- **`input`**: 输入转换。在节点执行前，对传入的参数进行预处理。
  - _源码_: `Input Input` (`[]any`)
- **`output`**: 输出转换。在节点执行后，对结果进行筛选或格式化。
  - _源码_: `Output any`
- **`goto`**: 流程跳转。指定下一个执行的节点 Name，或者 `EOF` 结束。
  - _源码_: `Goto string`

### 总结

Yao Pipe 的节点系统是高度动态的。在编写 DSL 时，你应该根据**字段特征**来定义节点：

- 调用功能 -\> 用 `process`
- 大模型对话 -\> 用 `prompts`
- 人机交互 -\> 用 `ui`
- 逻辑判断 -\> 用 `case`
