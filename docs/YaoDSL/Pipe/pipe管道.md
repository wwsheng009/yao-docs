# pipe

pipe 是一种高级的流程控制机制，与 flow 类似但功能更加强大。pipe 通过不同类型的节点来实现各种功能，特别增强了客户端执行和人机交互的能力。

pipe 的核心设计结构如下：
::: v-pre

- 一个 pipe 由多个 node（节点）组成，每个 node 可以包含多个子节点，形成层级结构。
- 每个 node 都有其输入和输出：
  - 使用 `$in[0]，$in[1]...` 来获取节点的输入数据
  - 使用 `$out[0]，$out[1]...` 来设置节点的输出数据
- pipe 支持多种类型的节点，每种类型都有其特定的功能：
  :::
  - Process：调用 Yao 处理器，执行预定义的处理逻辑
  - Switch：根据条件判断执行不同的分支节点
  - AI：调用 AI 处理器，支持智能对话和处理
  - User Input：等待用户输入，支持多种交互界面（CLI、Web 等）
  - EOF：结束节点，标记流程终止

节点类型会根据配置自动推断，无需显式指定。具体规则如下：

- 配置了 prompts，就会自动的识别为 AI 节点。
- 配置了 process，就会自动的识别为 Process 节点。
- 配置了 switch，就会自动的识别为 Switch 节点。使用 switch 配置不同的条件来触发不同的执行分支，也可以使用 goto 来改变执行顺序。如果需要跳转到特定的节点，可以使用`goto` 声明。而`"goto": "EOF"`会直接结束节点执行。
- 配置了 ui，就会自动的识别为 user-input 节点。UI 类型需要是`cli, web, app, wxapp`中的一种

## 类型定义

```go
// Pipe the pipe
type Pipe struct {
	  ID        string
	  Name      string    `json:"name"`
	  Nodes     []Node    `json:"nodes"`
	  Label     string    `json:"label,omitempty"`
	  Hooks     *Hooks    `json:"hooks,omitempty"`
	  Output    any       `json:"output,omitempty"`    // the pipe output expression
	  Input     Input     `json:"input,omitempty"`     // the pipe input expression
	  Whitelist Whitelist `json:"whitelist,omitempty"` // the process whitelist
	  Goto      string    `json:"goto,omitempty"`      // goto node name / EOF

	  parent    *Pipe            // the parent pipe
	  namespace string           // the namespace of the pipe
	  mapping   map[string]*Node // the mapping of the nodes Key:name Value:index
}

// Hooks the Hooks
type Hooks struct {
	  Progress string `json:"progress,omitempty"`
}

// Node the pip node
type Node struct {
	  Name     string           `json:"name"`
	  Type     string           `json:"type,omitempty"`     // user-input, ai, process, switch, request
	  Label    string           `json:"label,omitempty"`    // Display
	  Process  *Process         `json:"process,omitempty"`  // Yao Process
	  Prompts  []Prompt         `json:"prompts,omitempty"`  // AI prompts
	  Model    string           `json:"model,omitempty"`    // AI model name (optional)
	  Options  map[string]any   `json:"options,omitempty"`  // AI or Request options (optional)
	  Request  *Request         `json:"request,omitempty"`  // Http Request
	  UI       string           `json:"ui,omitempty"`       // The User Interface cli, web, app, wxapp ...
	  AutoFill *AutoFill        `json:"autofill,omitempty"` // Autofill the user input with the expression
	  Switch   map[string]*Pipe `json:"case,omitempty"`     // Switch
	  Input    Input            `json:"input,omitempty"`    // the node input expression
	  Output   any              `json:"output,omitempty"`   // the node output expression
	  Goto     string           `json:"goto,omitempty"`     // goto node name / EOF

	  index int // the index of the node
}

// Whitelist the Whitelist
type Whitelist map[string]bool

// Input the input
type Input []any

// Args the args
type Args []any

// Data data for the template
type Data map[string]interface{}

// ResumeContext the resume context
type ResumeContext struct {
	  ID    string `json:"__id"`
	  Type  string `json:"__type"`
	  UI    string `json:"__ui"`
	  Input Input  `json:"input"`
	  Node  *Node  `json:"node"`
	  Data  Data   `json:"data"`
}

// AutoFill the autofill
type AutoFill struct {
	  Value  any    `json:"value"`
	  Action string `json:"action,omitempty"`
}

// Case the switch case section
type Case struct {
	  Input  Input  `json:"input,omitempty"`  // $in
	  Output any    `json:"output,omitempty"` // $out
	  Nodes  []Node `json:"nodes,omitempty"`  // $out
}

// Prompt the switch
type Prompt struct {
	  Role    string `json:"role,omitempty"`
	  Content string `json:"content,omitempty"`
}

// Process the switch
type Process struct {
	  Name string `json:"name"`
	  Args Args   `json:"args,omitempty"`
}

// Request the request
type Request struct{}

// ChatCompletionChunk the chat completion chunk
type ChatCompletionChunk struct {
	  ID                string      `json:"id"`
	  Object            string      `json:"object"`
	  Created           int64       `json:"created"`
	  Model             string      `json:"model"`
	  SystemFingerprint interface{} `json:"system_fingerprint"`
	  Choices           []struct {
		  Index        int         `json:"index"`
		  Delta        DeltaStruct `json:"delta"`
		  Logprobs     interface{} `json:"logprobs"`
		  FinishReason interface{} `json:"finish_reason"`
	  } `json:"choices"`
}

// DeltaStruct the delta struct
type DeltaStruct struct {
	  Content string `json:"content"`
}

```

Context 定义,用于保存节点的执行状态。

```go

// Context the Context
type Context struct {
	  *Pipe
	  id     string
	  parent *Context // the parent context id

	  context context.Context
	  global  map[string]interface{} // $global
	  sid     string                 // $sid
	  current *Node                  // current position

	  in      map[*Node][]any    // $in the current node input value
	  out     map[*Node]any      // $out the current node output value
	  history map[*Node][]Prompt // history of prompts, this is for the AI and auto merge to the prompts of the node

	  input  []any // $input the pipe input value
	  output any   // $output the pipe output value
}

```

## 创建 pipe

### 创建 pipe 定义

创建一个 pipe 定义，创建 pipe 的方法有两种，一种是直接在目录 pipes 下面创建 pipe 的定义。第二种方法是调用处理器`pipe.create`或是`pipe.createwith`创建并立即执行 pipe,注意这两个处理器创建的 pipe 并不会保存在缓存中，这个跟上面的方法是有区别的。

- `pipes/cli/translator.pip.yao`
- `pipes/web/translator.pip.yao`

这种直接由文件创建的 pipe 会在系统启动时自动加载。但时并不会立即执行，需要调用处理器`pipe.run`或是`pipe.resume`来执行。

使用处理器来调用 pipe.

- pipe.run `<pipe_id>`
- pipe.resume `<pipe_id>`
- pipe.resumewith `<pipe_id>`
- pipe.close `<pipe_id>`

使用以下的处理器来调用 pipe：
::: v-pre

- `yao run pipes.<Widget.ID> [args...]`,如果用户打断了 pipe 的执行，会返回一个 pipe context id。可以使用这个 id 进行 pipe 的恢复执行。
- `yao run pipe.run <pipe.id> [...args]`
- `yao run pipe.Resume <Context.ID> [args...]`
- `yao run pipe.ResumeWith <Context.ID> '::{"foo":"bar"}' [args...]`
  :::

### 动态的创建并执行 pipe

可以直接通过在运行时，动态的加载 pipe 源码的方式来创建运行 pipe，主要使用到 2 个处理器。

- `pipe.create <pipe.id> [...args]`，第一个参数是 dsl 的定义，后面是输入的参数。
- `createWith <pipe.id> <global>, [...args]` 带全局变量的创建方法。参数一是 dsl 定义，第二个参数是全局变量，后面是输入的参数。全局变量的类型必须是一个字典对象。

使用示例 1：

先创建一个 pipe 的定义，这个跟文件创建的格式是一样的。调用处理器`pipe.create`。

```js
let in = ['hello world']
let input = ['hello world']

let dsl = `{
	"whitelist": ["utils.fmt.Print"],
	"name": "test",
	"label": "Test",
	"nodes": [
		{
			"name": "print",
			"process": {"name":"utils.fmt.Print", "args": "{{ $in }}"},
			"output": "print"
		}
	],
	"output": {"input": "{{ $input }}" }
}`;

Process('pipe.Create', dsl, 'hello world');
```

使用示例 2：

```js
let in = ['hello world']
let input = ['hello world']

dsl = `{
		"whitelist": ["utils.fmt.Print"],
		"name": "test",
		"label": "Test",
		"input": "{{ $global.placeholder }}",
		"nodes": [
			{
				"name": "print",
				"process": {"name":"utils.fmt.Print", "args": "{{ $in }}"},
				"output": "print"
			}
		],
		"output": {"input": "{{ $input }}" }
	}`;

Process('pipe.CreateWith', dsl, { placeholder: 'hello world' });
```

## 变量引用

在 pipe 中，变量引用遵循以下规则：

### 节点内部变量

- `$in[index]`：引用节点的输入变量，index 从 0 开始
- `$out[index]`：引用节点的输出变量，index 从 0 开始

### 节点间变量引用

- 可以通过节点名称引用其他节点的输出，如 `node_name.field_name`
- 在 output 配置中：
  - 可以使用 `$input` 引用 pipe 的输入数据
  - 可以使用 `$out` 引用当前节点的输出
  - 不能使用 `$in` 关键字

### 全局变量

- `$global.field_name`：访问全局变量
- `$sid`：获取当前会话 ID

在 nodes 中可以通过 node 的名称引用上一个 node 的输出。比如使用 user.cmd 引用上一个节点 name=user 的 output 输出。

比如有以下的节点配置，需要使用 user.cmd 或是 user.args 来引用上一个节点的输出。而不是使用 user.output.cmd 也不是 user.output.args。

节点 1 配置：

```js
{
  "name": "user",
  "label": "Enter the command",
  "ui": "cli",
  "autofill": {
    "value": "{{ $in[0].placeholder }}",
    "action": "exit"
  },
  "output": {
    "cmd": "{{$out[0]}}",
    "args": "{{$out[1:]}}"
  }
}
```

节点 2 配置如下,使用<span v-pre>`{{user.args}}`</span>来引用上一个节点的输出。

```js
{
  "input": "{{ user.args }}",
  "nodes": [
    {
      "name": "ping",
      "process": {
        "name": "utils.app.Ping",
        "args": "{{ $in[1:] }}"
      }
    }
  ],
  "output": ["run", "{{ user  }}", "{{ ping.engine  }}", "{{ ping.version }}"],
  "goto": "print"
}
```

再看一个详细测试用例：

```js
{
  "name": "AI Translator",
  "hooks": { "progress": "scripts.pipe.onProgress" },
  "whitelist": ["utils.json.Validate", "utils.fmt.Print", "utils.app.Ping"],
  "nodes": [
    {
      "name": "user",
      "label": "Enter the command",
      "ui": "cli",
      "autofill": { "value": "{{ $in[0].placeholder }}", "action": "exit" },
      "output": { "cmd": "{{$out[0]}}", "args": "{{$out[1:]}}" }
    },
    {
      "name": "switch",
      "case": {
        "user.cmd == 'translate'": {
          "input": "{{ user.args[0] }}",
          "nodes": [
            {
              "name": "translate",
              "prompts": [
                {
                  "role": "system",
                  "content": "you will act as a translator, helping me translate the words I give you into Chinese and Arabic."
                },
                {
                  "role": "system",
                  "content": "Use the following JSON format to answer my question. {\"Chinese\":\"...\", \"Arabic\", \"...\"}"
                },
                { "role": "user", "content": "{{ $in[0] }}" }
              ]
            },
            {
              "name": "validate",
              "process": {
                "name": "utils.json.Validate",
                "args": [
                  "{{ translate }}",
                  [{ "haskey": "Chinese" }, { "haskey": "Arabic" }]
                ]
              },
              "goto": "{{ $out == false ? 'print' : 'EOF' }}"
            },
            {
              "name": "print",
              "process": {
                "name": "utils.fmt.Print",
                "args": "{{ translate }}"
              },
              "output": null
            },
            {
              "name": "user",
              "label": "Enter the words to translate",
              "ui": "cli",
              "output": { "args": "{{ $out[0] }}" },
              "autofill": { "value": "{{ translate }}" },
              "goto": "translate"
            }
          ],

          "output": ["{{ translate.Chinese }}", "{{ translate.Arabic }}"],
          "goto": "print"
        },

        "user.cmd == 'run'": {
          "input": "{{ user.args }}",
          "nodes": [
            {
              "name": "ping",
              "process": { "name": "utils.app.Ping", "args": "{{ $in[1:] }}" }
            }
          ],
          "output": ["run", "{{ ping.engine  }}", "{{ ping.version }}"],
          "goto": "print"
        },

        "user.cmd == 'print'": {
          "input": "{{ user.args }}",
          "output": ["print", "{{ user.args }}"],
          "goto": "print"
        },

        "user.cmd == 'exit'": { "goto": "EOF" },

        "default": { "goto": "help", "input": "{{ user }}" }
      }
    },
    {
      "name": "print",
      "process": { "name": "utils.fmt.Print", "args": "{{ $in }}" },
      "output": null,
      "goto": "EOF"
    },
    {
      "name": "help",
      "process": {
        "name": "utils.fmt.Print",
        "args": ["help", "{{ $in }}"]
      },
      "output": null
    }
  ],
  "output": {
    "switch": "{{ switch }}",
    "output": "{{ $output }}",
    "input": "{{ $input }}",
    "sid": "{{ $sid }}",
    "global": "{{ $global }}"
  }
}
```

它的功能如下：

1. 接收用户输入命令
2. 如果命令是`translate`,则调用 ai 翻译单词,在调用 ai 的过程中，又有子节点
   - 进行检查 ai 返回的信息。
   - 如果 ai 返回的信息符合要求，则跳转到`print`节点，打印输出结果，然后再等待用户输入，否则跳转到`EOF`节点。

3. 如果命令是`run`,则作一个 ping 的操作
4. 如果命令是`print`,则打印输出用户的输入
5. 如果命令是`exit`,则退出程序

## user-input 节点

当类型为 UI 的节点配置成 cli 类型时，适合于在使用 yao run 命令执行 pipe。遇到 cli 节点时，会变成一个交互界面，程序会等待用户输入。用户退出交互时，需要单独输入一行`exit()`的命令。继续执行其它节点。

当类型不是 cli，而是 web ,会返回一个 resume context，类型为`ResumeContext`,用户可以根据这个 `context.ID` 在下一次调用来恢复执行。比如在 web 端时，会返回一个 resume context,用户可以根据这个上下文信息在下一次请求调用处理器`pipe.Resume context.ID`继续执行。

由于 pipe 是根据 id 保存在内存中。所有 web 请求都会共用一套 pipe,如果是多个人使用，pipe.id 需要根据用户 ID 来区分，这样才能保证不同用户的请求不会互相影响。
