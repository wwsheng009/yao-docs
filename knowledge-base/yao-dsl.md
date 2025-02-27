# yao-dsl

<!-- YAO-DOC-MERGE-PROCESSED -->

## AI代理

### AI助手

通过配置Function Tool与Prompt Template，可以让AI模型变成一个AI助手。

在Yao中可以使用AI代理来完成一些复杂的任务，例如：

- 调用第三方API
- 调用本地的工具

### Function Call

#### 函数调用的工作原理

如需使用函数调用功能，您需要向模型提示添加描述编程接口的结构化查询数据（称为函数声明）。函数声明提供 API 函数的名称，说明其用途、支持的所有参数以及这些参数的说明。将查询中的函数声明列表传递给模型后，模型会分析函数声明和查询的其余部分，以确定如何使用声明的 API 来响应请求。

然后，模型会返回一个 OpenAPI 兼容架构中的对象，其中指定了如何调用一个或多个已声明的函数，以便回答用户的问题。然后，您可以采用建议的函数调用参数，调用实际 API，获取响应，并将该响应提供给用户或执行进一步操作。请注意，模型实际上并不会调用声明的函数。而是使用返回的架构对象参数来调用该函数。Gemini API 还支持并行函数调用，其中模型会根据单个请求推荐多个 API 函数调用。

#### 函数声明

在提示中实现函数调用时，您需要创建一个 tools 对象，其中包含一个或多个 function declarations。您可以使用 JSON 定义函数，具体而言，使用 OpenAPI 架构格式的部分子集。单个函数声明可以包含以下参数：

- name（字符串）：API 调用中函数的唯一标识符。
- description（字符串）：全面说明函数的用途和功能。
- parameters（对象）：定义函数所需的输入数据。
- type（字符串）：指定整体数据类型，例如 object。
- properties（对象）：列出各个参数，每个参数均包含：
- type（字符串）：参数的数据类型，例如 string、integer、boolean。
- description（字符串）：清楚地说明参数的用途和预期格式。
- required（数组）：一个字符串数组，用于列出函数运行所必需的参数名称。

#### 函数声明的最佳实践

在将函数集成到请求中时，准确定义函数至关重要。每个函数都依赖于特定参数，这些参数可指导其行为并与模型互动。以下列表提供了有关在 functions_declarations 数组中定义各个函数参数的指南。

name：使用清晰、描述性强的名称，不含空格、英文句点 (.) 或短划线 (-) 字符。请改用下划线 (\_) 字符或驼峰式命名法。

description：提供详细、清晰且具体的函数说明，并根据需要提供示例。例如，使用 find theaters based on location and optionally movie title that is currently playing in theaters. 取代 find theaters。避免使用过于宽泛或模糊的说明。

properties > type：使用强类型参数来减少模型幻觉。例如，如果参数值来自有限集，请使用 enum 字段，而不是在说明中列出值（例如"type": "enum", "values": ["now_playing", "upcoming"]）。如果参数值始终是整数，请将类型设置为 integer，而不是 number。

properties > description：提供具体的示例和限制。 例如，使用 The city and state, e.g. San Francisco, CA or a zip code e.g. 95616 取代 the location to search。

### 调用第三方API

### 定义一个助手

助手需要定义在Assistant目录下，一个Assistant目录下可以有多个助手，每个目录对应一个Assistant。

目录结构如下：

- assets：存放助手所需的资源文件，例如图片、音频、视频等,在Prompt中使用@assets/文件名.文件类型来引用。
- package.yao：助手配置文件，定义助手的名称、描述、工具等。
- prompts.yml：助手提示文件，定义助手的提示词。
- src：助手源码文件，定义助手的业务逻辑。
- tools.yao：助手工具文件，定义助手的工具。

```sh
assistants
├── chat
│   ├── assets
│   ├── package.yao
│   ├── prompts.yml
│   ├── src
│   │   └── index.ts
│   └── tools.yao
├── model
│   ├── assets
│   │   └── yao.md
│   ├── package.yao
│   ├── prompts.yml
│   └── src
│       └── index.ts
├── neo
│   ├── assets
│   ├── package.yao
│   ├── prompts.yml
│   └── src
│       └── index.ts
└── schema
    ├── assets
    │   ├── model_rules.md
    │   └── yao.md
    ├── package.yao
    ├── prompts.yml
    └── src
        └── index.ts
```

#### 助手配置文件Package.json

助手定义可以有多种方式，通过文件进行配置，也可以保存在数据库中。

助手配置文件定义了助手的名称、描述、工具等。

助手配置文件(package.yao)是一个JSON格式的文件,用于定义助手的基本信息和配置参数。主要包含以下字段:

| 字段名       | 类型     | 说明                   |
| ------------ | -------- | ---------------------- |
| name         | string   | 助手名称,用于显示      |
| type         | string   | 类型,固定为"assistant" |
| description  | string   | 助手描述               |
| assistant_id | string   | 助手ID,唯一标识符      |
| mentionable  | boolean  | 是否可以被提及(@)      |
| automated    | boolean  | 是否为自动化助手       |
| readonly     | boolean  | 是否只读               |
| built_in     | boolean  | 是否为内置助手         |
| sort         | number   | 排序值                 |
| path         | string   | 助手目录路径           |
| connector    | string   | 使用的AI模型连接器     |
| created_at   | string   | 创建时间               |
| tags         | string[] | 标签列表               |
| options      | object   | AI模型参数配置         |
| avatar       | string   | 头像URL，在Xgen中显示  |
| prompts      | string   | 提示词配置文件路径     |

其中options字段包含以下AI模型相关的参数:

| 参数名            | 类型   | 说明                           |
| ----------------- | ------ | ------------------------------ |
| temperature       | number | 温度参数,控制输出的随机性(0-1) |
| max_tokens        | number | 最大输出token数                |
| top_p             | number | 核采样阈值                     |
| frequency_penalty | number | 频率惩罚系数                   |
| presence_penalty  | number | 存在惩罚系数                   |

示例配置如下:

```json
{
  "name": "model-assistant",
  "type": "assistant",
  "description": "This is a test assistant",
  "assistant_id": "model",
  "mentionable": true,
  "automated": false,
  "readonly": false,
  "built_in": false,
  "sort": 0,
  "path": "model",
  "connector": "deepseek-reasoner",
  "created_at": "2022-02-22T14:00:00.000Z",
  "tags": ["test"],
  "options": {
    "temperature": 0.7,
    "max_tokens": 8192,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  },
  "avatar": "https://cdn.pixabay.com/photo/2016/08/20/05/38/avatar-1606916_960_720.png",
  "prompts": ""
}
```

#### Prompt配置文件Prompts.yml

助手提示文件(prompts.yml)是一个YAML格式的文件,用于定义助手的提示词。主要包含以下字段:

| 字段名  | 类型   | 说明                                                     |
| ------- | ------ | -------------------------------------------------------- |
| role    | string | 角色类型,可选值: system/user/assistant，可以配置多个提示 |
| name    | string | 提示词名称,用于标识不同的提示词                          |
| content | string | 提示词内容,支持多行文本和引用assets目录下的文件          |

示例配置如下:

```yaml
- role: system
  name: documentation
  content: |
    - you are an AI assistant that translates the given DSL definition into a Yao model definition.
    - @assets/yao.md
```

#### src/index.ts

助手源码文件(src/index.ts)是一个TypeScript格式的文件,用于定义助手的业务逻辑。主要包含以下钩子函数:

- Create: 助手被第一次调用时触发
- Done: 聊天结束触发
- Fail: 聊天出错触发

##### Create

Create钩子函数用于在助手被第一次调用时触发数:

```ts
/**
 * user request -> [Create hook] -> openai
 *
 * called before the chat with openai.
 *
 * @param context The context object containing session information and other relevant data.
 * @param input The input message array.
 * @param writer A payload object containing additional options or data.
 * @returns A response object containing the next action, input messages, and output data.
 */

export function Create(
  context: neo.Context,
  input: neo.Message[],
  option: { [key: string]: any }
): neo.ResHookInit | null | string {}
```

##### Done

```ts
/**
 * called only once, when the call openai api done,open ai return messages
 *
 * @param context context info
 * @param input input messages
 * @param output messages
 * @param writer for response
 * @returns
 */
function Done(
  context: neo.Context,
  input: neo.ChatMessage[],
  output: neo.ChatMessage[]
): neo.ResHookDone | null {
  // case 1 return null,no change
  // return null
  return null;
  // case 2 return object
  return {
    next: {
      action: 'action1', //set to 'exit' to exit stream,only set it when you want to exit the process
      payload: {}
    }
    // output: output //change the output message
  };
}
```

##### Fail

```ts
/**
 * called every time when the call openai api failed,open ai return error messages
 *
 * @param context context info
 * @param input input messages
 * @param output output messages
 * @returns {next,input,output}
 */
function Fail(
  context: neo.Context,
  input: neo.Message[]
): neo.ResHookFail | null {
  // case 1 return null,no change
  // return null
  return null;
  // case 2 return object
  return {
    // output: output,
    // most important, return error message
    // error: 'error message'
  };
}
```

## 回调函数

### Agent中使用钩子函数

在钩子函数中可以使用以下的函数或是对象来实现回调函数：

在回调函数中，有以下的全局对象：

- assistant: 助手对象
- context: 上下文对象
- Plan: 计划对象。
- Send: 给前端Stream发送消息的函数
- Call: 调用其它脚本的函数

### 对象说明

```ts

/**
 * 创建并返回一个计划对象
 * @param planId 计划ID
 * @returns 计划对象
 */
export declare function Plan(planId:string): Plan;

type Method:string;//同一个脚本中的方法名称
type Process:string;//yao处理器
type Callback {//yao处理器回调，同时配置回调函数名和回调函数参数
    name:string;
    args:any[];
}
/**
 * 回调助手，并传入回调函数
 * @param assistantId 助手ID
 * @param input 输入,常用的是用户的提问。
 * @param callback 回调函数,接收4种类型的参数
 * 1. Function: 普通函数
 * 2. Callback: 对象,对象的name属性为回调函数名,args属性为回调函数参数
 * 3. Method: 方法,当前脚本中的方法名称
 * 4. Process: 处理器,调用其它处理器，处理器名称需要包含"."
 * @options 选项,调用聊天模型时的选项，比如temperature,top_p等参数
 */
export declare function Call(assistantId:string,input:string,callback:null|Function|Callback|Method|Process,options:{[key:string]:any}): void;

```

Message类型定义

```ts
/**
 * Message 消息对象
 */
interface Message {
  /** 消息ID */
  id?: string;
  /** 文本内容 */
  text?: string;
  /** 消息类型: error, text, plan, table, form, page, file, video, audio, image, markdown, json等 */
  type?: string;
  /** 类型相关的属性 */
  props?: Record<string, any>;
  /** 标记消息是否完成 */
  done?: boolean;
  /** 标记是否为新消息 */
  new?: boolean;
  /** 标记是否为增量消息 */
  delta?: boolean;
  /** 会话动作列表 */
  actions?: Action[];
  /** 文件附件列表 */
  attachments?: Attachment[];
  /** 消息角色: user, assistant, system等 */
  role?: string;
  /** 消息名称 */
  name?: string;
  /** 助手ID (当role为assistant时) */
  assistant_id?: string;
  /** 助手名称 (当role为assistant时) */
  assistant_name?: string;
  /** 助手头像 (当role为assistant时) */
  assistant_avatar?: string;
  /** 消息提及列表 (当role为user时) */
  mentions?: Mention[];
  /** 消息数据 */
  data?: Record<string, any>;
  /** 消息是否待处理 */
  pending?: boolean;
  /** 消息是否隐藏 (不在UI和历史记录中显示) */
  hidden?: boolean;
  /** 消息是否需要重试 */
  retry?: boolean;
  /** 消息是否静默 (不在UI和历史记录中显示) */
  silent?: boolean;
  /** 工具调用ID */
  tool_call_id?: string;
  /** 函数调用列表 */
  tool_calls?: FunctionCall[];
}

/**
 * 提及对象
 */
interface Mention {
  /** 助手ID */
  assistant_id: string;
  /** 名称 */
  name: string;
  /** 头像 */
  avatar?: string;
}

/**
 * 附件对象
 */
interface Attachment {
  /** 文件名 */
  name?: string;
  /** 文件URL */
  url?: string;
  /** 文件描述 */
  description?: string;
  /** 文件类型 */
  type?: string;
  /** 内容类型 */
  content_type?: string;
  /** 文件大小(字节) */
  bytes?: number;
  /** 创建时间戳 */
  created_at?: number;
  /** 文件ID */
  file_id?: string;
  /** 会话ID */
  chat_id?: string;
  /** 助手ID */
  assistant_id?: string;
}

/**
 * 动作对象
 */
interface Action {
  /** 动作名称 */
  name?: string;
  /** 动作类型 */
  type: string;
  /** 动作载荷 */
  payload?: any;
}
```

回调函数示例：

```ts

/**
 * 示例回调函数
 * @param msg 消息对象
 * @param args 其他参数,如果使用处理器定义，则args为处理器定义的参数
 */
function exampleCallback(msg: Message,..args:any[]) {
    console.log('收到消息:', msg.Text);
}

/**
 * 使用回调函数的示例
 */
function useCallbackExample() {
    // 使用普通函数作为回调
    Call('neo', '你好', exampleCallback);

    // 使用对象形式的回调
    Call('neo', '你好', {
        name: 'exampleCallback',
        args: [] // 如果回调函数不需要参数，可以留空数组
    });

    // 使用当前脚本中的方法作为回调
    Call('neo', '你好', 'exampleCallback');

    // 使用处理器作为回调
    Call('neo', '你好', '处理器名称.方法名称');
}

```

### 测试

```js
function callback(msg:) {}

function test() {
  Call('neo', '你好', 'callback');
  Call('neo', '你好', function () {
    console.log('回调函数');
  });
}
```

## aigc 处理器

aigc 处理器是在 Yao 中实现的直接与 OpenAI 接口交互的处理器。通过配置 OpenAI 连接器与请求规则，可以将 OpenAI 接口转换成 Yao 处理器，从而与其它 Yao 功能无缝串联。

### 适用版本

0.10.3 或以上

### 主要功能

- 支持多种 OpenAI 模型配置
- 灵活的提示词系统
- 环境变量配置，安全性高
- 支持代理设置
- 可与其他 Yao 功能集成

### 使用步骤

在connectors目录创建OpenAI 连接器配置文件。

### 配置 openai 请求规则

在 app 目录下创建`aigcs`子目录（如果不存在）,在子目录下创建 ai 访问配置文件。

配置文件：`aigcs\translate.ai.yml`

这个示例使用了配置的 `gpt-3_5-turbo` 连接器。`prompts` 字段用于设置与 OpenAI 模型的初始化指令，不同模型可能需要不同格式的提示词。以下是一个翻译助手的配置示例，使用 GPT-3.5-Turbo 模型：

```yaml
## Translate to English
## yao run aigcs.translate 你好
name: Translate
connector: gpt-3_5-turbo
prompts:
  - role: system
    content: |
      - Translate the given question into English.
      - Do not explain your answer, and do not use punctuation.
      - Do not add your own punctuation marks.
      - eg: if I say "你好" reply me "Hello" only

optional:
  autopilot: true
```

### 配置网络代理

如果无法直接访问 openai,可以在环境变量中配置网络代理。

```bash
## https请求代理
HTTPS_PROXY="http://0.0.0.0:10809"
https_proxy="http://0.0.0.0:10809"

## http请求代理
HTTP_PROXY="http://0.0.0.0:10809"
http_proxy="http://0.0.0.0:10809"
```

### 测试 aigcs 处理器

处理器的固定前缀为`aigcs`，参数与处理器 ID 与其它 yao 处理器类似。

aigc 处理器只适用于单个请求，对话功能需要使用 neo。

```sh
yao run aigcs.translate 你好
```

### openai 相关的其它处理器

- openai.tiktoken 计算接口 token
- openai.embeddings Embedding 接口
- openai.chat.completions 聊天接口
- openai.audio.transcriptions 语音翻译接口

### 测试代码

官方已提供了测试样例

```sh
https://github.com/YaoApp/yao-dev-app
```

## chatgpt3 中角色的设置

在调用 chatgpt api 接口时，如果是使用到模型 gpt-3.5-turbo 或是 3.5 以上版本，api 的消息中可设置一个角色字段`role`。

角色`role`有三个值:user/system/assistant

user，表示消息内容是用户请求。将 role 设置为"user"可以帮助 ChatGPT 区分对话中的角色。这样，ChatGPT 可以更好地理解用户的输入，并以更适当的方式进行回应。此外，当 ChatGPT 需要请求更多信息时，它可以更明确地指出用户需要提供什么信息。在多轮对话中，设置角色还可以帮助 ChatGPT 跟踪对话历史记录，以便更准确地回答后续的问题。因此，将角色设置为"user"可以提高 ChatGPT 的对话质量和效率。

```json
{
  "messages": [{ "role": "user", "content": "tell me a joke" }]
}
```

system，表示此命令是系统指令，非对话内容。设置 ChatGPT 对话中的 role 属性为 system 可以使其在对话中扮演系统角色，即扮演自动回复和处理请求的角色。这意味着当用户在对话中发送消息时，ChatGPT 将会使用预定义的规则和逻辑来生成自动回复，而不是直接响应用户的消息。通过这种方式，ChatGPT 可以为用户提供快速且准确的反馈，从而提高用户体验和对话的效率。同时，系统角色还可以用来处理各种类型的请求和任务，例如查询数据库或执行操作。因此，设置 ChatGPT 对话中的 role 属性为 system 是实现自动化对话和任务处理的重要步骤。

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "tell me a joke"
    },
    {
      "role": "system",
      "content": "You are an assistant that speaks like Shakespeare."
    }
  ]
}
```

assistant，所有 ai 回复的消息的角色都是 assistant。

```json
{
  "id": "chatcmpl-87n798n6bv4678",
  "object": "chat.completion",
  "created": 1683212418,
  "model": "gpt-3.5-turbo-0301",
  "usage": {
    //chat模式没有，只有complete模式才有
    "prompt_tokens": 12,
    "completion_tokens": 18,
    "total_tokens": 30
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "why did the chicken cross the road"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

### gpt 接口交互

stream 模式下的数据格式：

原始数据：

```json
{
  "data": {
    "id": "chatcmpl-8KLHFd0wez62XH6UOxs2mGV0JUD68",
    "object": "chat.completion.chunk",
    "created": 1699859041,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
      { "index": 0, "delta": { "content": "吗" }, "finish_reason": null }
    ]
  }
}
```

如果是结束,固定返回以下内容

```md
data: [DONE]
```

可以把聊天内容理解为 json 数据

返回的第一条数据：

```json
{
  "data": {
    "id": "chatcmpl-8KLRrq4mHgncUN0OSF4QQ1DSOsfJ4",
    "object": "chat.completion.chunk",
    "created": 1699859699,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
      {
        "index": 0,
        "delta": {
          "role": "assistant", //角色
          "content": ""
        },
        "finish_reason": null
      }
    ]
  }
}
```

正常对话内容：

```json
{
  "data": {
    "id": "chatcmpl-8KLHFd0wez62XH6UOxs2mGV0JUD68", //每次聊天的会话标识
    "object": "chat.completion.chunk", //对象类型
    "created": 1699859041, //创建时间
    "model": "gpt-3.5-turbo-0613", //模型
    "choices": [
      {
        "index": 0,
        "delta": { "content": "吗" }, //增量
        "finish_reason": null
      }
    ]
  }
}
```

如果是结束，在最后一条消息也会有不同数据。`finish_reason`等于`stop`

```json
{
  "data": {
    "id": "chatcmpl-8KLHFd0wez62XH6UOxs2mGV0JUD68",
    "object": "chat.completion.chunk",
    "created": 1699859041,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
      { "index": 0, "delta": {}, "finish_reason": "stop" } //结束原因
    ]
  }
}
```

## neo api 接口

yao 本身已经内置了 neo ai 聊天接口。

### 聊天请求

`/api/__yao/neo`，请求方法：`get`,URL 参数：`content`,`context`,`token`。token 是 jwt 认证参数。

请求示例：

```json
{
  "content": "Hello!",

  "context": {
    "namespace": "Table-Page-ddic.model",
    "stack": "Table-Page-ddic.model",
    "pathname": "/x/Table/ddic.model",
    "formdata": {},
    "field": { "name": "", "bind": "" },
    "config": {},
    "signal": ""
  }
}
```

```js
const es = new EventSource(
  `${neo_api}?content=${encodeURIComponent(
    message.text
  )}&context=${encodeURIComponent(
    JSON.stringify(message.context)
  )}&token=${encodeURIComponent(getToken())}${studio_token}`
);
```

返回是 ss 异步消息。返回消息结构：

返回消息都会被组装成`data: 消息\n\n`的格式，跟 chatgpt 的一致。其中消息内容又可以拆分成 json 数据。

返回消息还会在 http 头上设置内容格式：`("Content-Type", "text/event-stream;charset=utf-8")`

```json
{
  "text": "", //文本
  "error": "", //错误
  "done": false, //已完成
  "confirm": false, //前端需要确认
  "command": {
    //
    "id": "id",
    "name": "",
    "request": ""
  },
  "actions": [
    //触发前端的操作
    {
      "name": "",
      "type": "",
      "payload": {},
      "next": "'"
    }
  ]
}
```

### 聊天历史记录

`/api/__yao/neo/history`，请求方法：`get`,返回：

```json
{
  "data": [{}] //历史记录
}
```

### 获取命令列表

`/api/__yao/neo/commands`，请求方法：`get`,返回：

```json
[
  {
    "name": "",
    "description": "",
    "args": "",
    "stack": "",
    "path": ""
  }
]
```

### 执行命令

`/api/__yao/neo/`，请求方法：`post`,请求内容：

```json
{
  "cmd": "ExitCommandMode"
}
```

返回:

```json
{ "code": 200, "message": "success" }
```

### sse 事件流的标准格式。

[使用服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F)

```json
{
  "event": "update",
  "data": { "id": 123, "message": "New update received" },
  "id": 456,
  "retry": 5000
}
```

规范中规定了下面这些字段：

`event` - 一个用于标识事件类型的字符串。如果指定了这个字符串，浏览器会将具有指定事件名称的事件分派给相应的监听器；网站源代码应该使用 addEventListener() 来监听指定的事件。如果一个消息没有指定事件名称，那么 onmessage 处理程序就会被调用。

`data` - 消息的数据字段。当 EventSource 接收到多个以 data: 开头的连续行时，会将它们连接起来，在它们之间插入一个换行符。末尾的换行符会被删除。
数据可以有多行，每行以 `\n` 符号分隔。换行符必须用 `\n` 来表示，不能使用 `\r\n`。在前端使用 EventSource 处理时，前缀会被自动的处理掉，并保留文本消息。除了发送 data，还可以发送 event/id/retry 字段。

如果在服务端发送的数据中包含`\n`换行符,比如消息`YHOO\n+2\n\10`，那么在浏览器中收到的信息会是这样：

```json
event:message
data: YHOO
data: +2
data: 10
```

最后一行必须有两个`\n `表示数据结束,使用两个换行符来分隔前后的消息

`id` - 当前消息的 id, 事件 ID，会成为当前 EventSource 对象的内部属性“最后一个事件 ID”的属性值。

`retry`
重新连接的时间。如果与服务器的连接丢失，浏览器将等待指定的时间，然后尝试重新连接。这必须是一个整数，以毫秒为单位指定重新连接的时间。如果指定了一个非整数值，该字段将被忽略。

所有其他的字段名都会被忽略。

## Neo 命令

在最新的代码中，yao 实现了 neo 命令模式。

Neo 命令模式，是指在用户与 Neo 助手聊天过程中切入到业务操作模式，在命令模式下，用户可以向 Yao 发出业务操作指令，Yao 会响应指令并作出合适的响应，在这过程中 Yao 会调用 ChatGPT 进行消息处理与回复。比如，用户在 neo 聊天框中输入处理命令"帮我生成 10 条测试数据"，yao 就调用 ChatGPT 智能的生成 10 条测试数据。

优势与特点：

- 对用户友好，对用户来说，不再需要记住具体的功能菜单入口，只需要在聊天框中自然的描述他的想法。
- Yao 融合了命令与聊天功能，ChatGPT 与 yao 无缝集成，在聊天的过程上随时可以调用后端命令。
- 交互性好，前后端的接口使用 SSE 技术，信息的及时性有保证，并且集成了上下文对话功能。
- 扩展性好，yao 把命令的定义接口留给用户，用户可以根据自己的实际需求扩展自己的功能。

整个 neo 命令的执行流程如下：

- ->定义命令
- ->调用命令模板处理器 prepare,读取用户配置的提示词模板
- ->格式化提示词
- ->调用 ChatGPT API 接口
- ->检查返回聊天消息
- ->从聊天消息中解析出处理器参数
- ->让用户确认\[可选\]
- ->调用数据回调处理器，可以在处理器向前端写入预览消息
- ->浏览器执行 Action(刷新界面)

### 配置

#### 定义命令

一个 Neo 命令需要包含以下的内容。

- process 回调处理器，处理 ai 返回的数据,在用户确认后调用的处理器或是直接执行的处理器。
- actions 定义，在 xgen 界面上的回调操作。
- prepare 处理器，准备与 ai 交互的提示词，尽可能准确的描述的你的目的。

定义 Neo 命令的方法是在目录/neo 下创建后缀为`.cmd.yml`配置文件。

示例：

`/neo/table/data.cmd.yml`

```yaml
## Generate test data for the table

##
## yao run neo.table.Data 帮我生成20条测试数据

## 命令的名称 用于匹配用户的提示请求
name: Generate test data for the table
## neo 命令的快捷引用方式，比如在neo助手中输入/data,直接引用这个命令，这样的好处是更快更准确的引用命令
use: data
## 连接器定义
connector: gpt-3_5-turbo
## 用户确认后再执行，或是无需确认，直接执行的处理器。
process: scripts.table.Data
## 处理器的参数类型与说明
args:
  - name: data # name 用于筛选ChatGPT返回的json数据,并作为处理器的参数
    type: Array
    description: The data sets to generate
    required: true # 表示参数是必须的，如果不存在会报错
    default: []
## 命令执行成功后，在xgen上执行的回调命令，比如这里数据生成后，在xgen界面上自动刷新。
actions:
  - name: TableSearch
    type: 'Table.search'
    payload: {}

## 命令执行的准备处理器
prepare:
  # 在before阶段，处理器可以根据xgen传入的上下文参数生成与ai交互的命令
  before: scripts.table.DataBefore
  # 在after阶段，把ai返回的数据进行格式化处理，在处理器里可以输出到xgen neo助手对话框界面。
  after: scripts.table.DataAfter
  option:
    temperature: 0.8

  # 与ChatGPT交互的提示词，角色是system
  prompts:
    - role: system
      # prepare.before处理器返回的json数据{template:''}
      content: '{{ template }}'

    - role: system
      # prepare.before处理器返回的json数据{explain:''}
      content: '{{ explain }}'

    #让gpt不要解析结果内容，并返回指定的数据内容
    - role: system
      content: |
        - According to my description, according to the template given to you, generate a similar JSON data.
        - The Data is what I want to generate by template.
        - Reply to me with a message in JSON format only: {"data": "<Replace it with the test data generated by the template>"}
        - Do not explain your answer, and do not use punctuation.
## 命令的描述 用于匹配用户的提示请求
description: |
  Generate test data for the table

optional:
  #命令是否需要用户确认，会在neo助手上显示"执行"按钮
  confirm: true
  autopilot: true
```

### 配置聊天 api guard

参考![](../docs/YaoDSL/AIGC/neo聊天助手.md)

### neo 助手初始化过程

- 检查内置的聊天记录表是否存在，如果不存在创建新表，默认的表名是 yao_neo_conversation。这个表可以在 neo.yml 配置文件中进行修改。
- 初始化聊天机器人的驱动，模型根据 neo.yml 配置的 connector，默认是使用 ChatGPT 的 gpt-3_5-turbo 模型。
- 加载用户的命令列表`*.cmd.yml, *.cmd.yaml`到内存中。

#### API 响应用户请求

- api guard 中解析出`__sid`作为聊天上下文 id。
- 根据 sid 查找用户的聊天历史，查找表 yao_neo_conversation，聊天历史可以通过配置控制长度。如果是新的会话，聊天历史会是空的。
- 在聊天消息历史中合并用户最新的提问内容,比如，“帮我生成一条数据”
- 根据用户最后的输入消息中是否包含了命令，使用 ChatGPT 进行检查。

### 命令模式与聊天模式

#### 命令模式

默认情况下，Neo 助手是处于聊天模式，用户与 Neo 的对话基于 ChatGPT 文本处理。

当用户的消息模糊匹配到后端配置的命令列表，或是使用精确命令时，会进入"命令对话模式"。在这个模式中，所有的用户对话都会作为命令的上下文。

> 在 Neo 助手界面上，会显示一个"退出"按钮。

比如发消息让 AI 生成模型。"/module 请生成销售订单模型"。YAO 会匹配到创建模型的命令，直接进入命令交互模式。首先 AI 会返回一个初步的处理结果。但是你对这个结果还想进行修正或是作补充,你可以再向 AI 发送消息

"请增加总金额字段"

这时候，因为还在命令模式中，AI 会在继续在之前的结果上进行补充。

退出命令模式后就会再次进入聊天模式。

> 在 Neo 助手界面上，点击"退出"按钮,退出命令模式。

用户命令的匹配过程如下：

#### 检查请求与命令匹配与过滤。

neo 助手的每一次请求都会携带两个当前界面组件的信息。`path` 与 `stack` 属性。path 是 neo 助手发送命令时界面的 url 地址，stack 是 xgen 界面组件在界面上的层次关系。

```json
{ "Stack": "Table-Page-pet", "Path": "/x/Table/pet" }
```

命令的模糊匹配

这两个参数会跟所有 cmd.yml 中配置的 path 与 stack 属性进行比较。可以使用通配符`*`,命令中如果没有配置两个参数是匹配所有请求。

把所有的匹配到的命令列表的名称 name 与描述 description，还有用户的请求消息一起提交给 ChatGPT 作判断。如果匹配成功，返回处理命令 cmd 的 id。

所以，一个命令是否匹配的上，取决于 3 个因素

- cmd.yml 中配置的`path`与`stack`属性与请求中的`path`与`stack`属性的匹配度。
- cmd.yml 中名称与描述与用户请求消息的匹配度。
- ChatGPT 的判断。

命令的精确匹配

完全使用 ChatGPT 来匹配命令有可能会失败。如果需要精确匹配，可以在命令中配置 Use 属性，这样就能直接在聊天对话框中使用 Use 命令，比如配置了`Use:data`在聊天中就能使用`/data 生成数据`定位命令。

命令的名称只能包含大小写字母。聊天消息可以是只包含命令`/Command` 或是聊天消息以命令作为前缀`/Command `，命令后需要有空格。

#### 命令执行过程

成功匹配到命令后，会进入命令处理环节。

- 准备与 ChatGPT 交互的提示词。

  - 调用处理器 prepareBefore，获取用户定义的模板内容，返回的内容用于填充 prepare.prompts。

    ```js
    /**
     * Command neo.table.data
     * Prepare Hook: Before
     * @param {*} context  上下文，包含stack/path
     * @param {*} messages 聊天消息历史
     */
    function DataBefore(context, messages) {
      // console.log("DataBefore:", context, messages);
      context = context || { stack: '-', path: '-' };
      messages = messages || [];
      const { path } = context;
      if (path === undefined) {
        done('Error: path not found.\n');
        return false;
      }

      const tpl = Templates[path];
      if (tpl === undefined) {
        done(`Error: ${path} template not found.\n`);
        return false;
      }

      ssWrite(`Found the ${path} generate rules\n`);
      return { template: tpl.data, explain: tpl.explain };
    }
    ```

  - 处理器 prepareBefore 返回的内容与命令定义中的`cmd.prepare`属性中的 prompt 模板进行合并成新的提示模板。这里可以使用`{{}}`语法绑定。
  - 提示模板中所有的的提示词的角色都会被设置成`system`，而用户提问消息的角色会被设置成`user`，Yao 结合两部分的内容后，向 ChatGPT 提交请求，并返回请求结果。
  - 调用后继处理器 prepareAfter。后继处理的作用是检查，格式化 ChatGPT 返回的消息。如果有必要也可以使用全局函数 ssWrite 写入 neo 助手的聊天对话框。

  示例：

  ```js
  /**
   * Command neo.table.data
   * Prepare Hook: After
   * @param {*} content ChatGPT返回消息
   */
  function DataAfter(content) {
    // console.log("DataAfter:", content);
    const response = JSON.parse(content);
    const data = response.data || [];
    if (data.length > 0) {
      // Print data preview
      //ssWrite向客户端发送sse消息
      ssWrite(`\n`);
      ssWrite(`| name | type | status | mode | stay | cost | doctor_id |\n`);
      ssWrite(`| ---- | ---- | ------ | ---- | ---- | ---- | --------- |\n`);
      data.forEach((item) => {
        message = `| ${item.name} |  ${item.type} |  ${item.status} | ${item.mode} | ${item.stay} | ${item.cost} | ${item.doctor_id}|\n`;
        ssWrite(message);
      });
      ssWrite(`  \n\n`);

      //返回新的消息
      return response;
    }

    throw new Exception('Error: data is empty.', 500);
  }
  ```

  - 校验 ChatGPT 返回的数据并生成处理器参数。经过上面 ChatGPT 与后继处理器的处理后，得到一个初步的结果，这些结果将会作为命令处理器的参数。在这一步里会根据配置的命令参数配置进行参数检查。参数`Command.Args`配置了哪些参数是必输项，参数名是什么，根据参数名筛选上面返回的结果作为命令处理器的参数。

  ```js
  // validate the args
  if req.Command.Args != nil && len(req.Command.Args) > 0 {
  	for _, arg := range req.Command.Args {
  		v, ok := data[arg.Name]
  		if arg.Required && !ok {
  			err := fmt.Errorf("\nMissing required argument: %s", arg.Name)
  			return nil, err
  		}

  		// @todo: validate the type
  		args = append(args, v)
  	}
  }
  ```

  - 如果配置了`Command.Optional.Confirm`，说明这个命令是需要用户进行确认的，Yao 会给用户返回一个确认的指令，等用户确认后再执行操作。这里比较绕，它的操作是把前面操作得到的结果作为参数与处理器再次封装一个 json 数据，返回给浏览器客户端，等用户确认后再把 json 数据提交到 yao 后端执行。整个动作会被定义成一个新的名称为`ExecCommand`的`Action`。这个`Action`的默认类型会被设置成`Service.__neo`，用户确认命令后，会调用一个 Yao 的内部的服务方法`Service.__neo`。

  ```go
    //yao/neo/command/request.go
    // confirm the command
    func (req *Request) confirm(args []interface{}, cb func(msg *message.JSON) int) {

      payload := map[string]interface{}{
        "method": "ExecCommand",
        "args": []interface{}{
          req.id,
          req.Command.Process,
          args,
          map[string]interface{}{"stack": req.ctx.Stack, "path": req.ctx.Path},
        },
      }

      msg := req.msg().
        Action("ExecCommand", "Service.__neo", payload, "").
        Confirm().
        Done()

      if req.Actions != nil && len(req.Actions) > 0 {
        for _, action := range req.Actions {
          msg.Action(action.Name, action.Type, action.Payload, action.Next)
        }
      }

      cb(msg)
    }

  ```

  像这种需要用户确认命令的场景,为什么不直接调用 process,而是需要中间多一层 service 函数。因为在 xgen 上是无法直接调用后端的 process 处理器，需要使用 service 函数（云函数）作为中间层。

- 如果配置了其它的`Command.Actions`，将会合并在一起，并通过 sse 全局函数发送到客户端。

#### 用户确认命令

经过上面的处理，在 xgen 的 neo 助手界面上会显示提示消息："消息包含业务指令，是否执行？"。当用户点击执行后，会依次调用上面配置的 actions。

- 调用 action `Service.__neo`，服务端的`Service.__neo`方法会调用`Command.Process`，处理用户数据。
- 调用用户自定义的 action，比如`Table.search`,刷新 table 界面，显示最新的 table 数据。

- 如果没有配置`Command.Optional.Confirm`，说明这个命令是可以直接在后台执行，不需要用户确认。Yao 会直接调用处理器`req.Command.Process`进行处理。

#### 处理器执行

如果是直接执行的处理器，可以在 actions 里绑定处理器返回的内容。

```yaml
process: studio.html.Page
actions:
  - name: Redirect to the generated page
    type: 'Common.historyPush'
    payload:
      pathname: '{{ iframe }}' #绑定处理器studio.html.Page返回的内容
      public: false
```

### 示例代码

```sh

git clone https://github.com/YaoApp/yao-neo-dev.git

git clone https://github.com/YaoApp/yao-dev-app.git
```

### 注意点

整个命令的定义过程与步骤内容比较多。

- ai 并不一定一次就能百分百匹配到命令，可以使用 Use 属性解决这个问题。
- ai 返回的结果不一定十分准确，解决方法是，1 使用准确的提示词，2 让用户确认内容，3 脚本检测并加工处理内容。
- 提示词设置需要一些技巧与遵循一定的规则。

## 内置 neo 聊天服务

### 适用版本

0.10.3 或以上

### 特性

- 开箱即用的聊天服务
- 支持上下文对话

### 配置

#### 配置 openai key

连接 OPENAI 需要设置 openai key，在环境变量中设置访问 key。

| 变量名称   | 说明                                                             | 示例     |
| ---------- | ---------------------------------------------------------------- | -------- |
| OPENAI_KEY | OPENAI API KEY, 可在连接器中更换变量名。 启用 Neo 或 AIGC 必须。 | `sk-xxx` |

#### 配置代理

如果需要使用代理，需要配置环境变量 https_proxy,支持使用 socket 代理或是 http 代理。

HTTPS_PROXY="socks5://0.0.0.0:10808"

#### 配置 openai connector

openai 连接器可以参考![](../docs/YaoDSL/AIGC/aigc处理器.md)

#### 配置 数据库 connector

数据连接器配置![](../docs/YaoDSL/Connector/连接器.md)

#### 配置 neo

Neo 助手配置文件`neo/neo.yml`，这个配置文件的路径与文件名是固定的。

```yaml
## 配置openai connector
connector: gpt-3_5-turbo
## 自定义聊天token认证处理器，处理器一定要返回参数__sid
guard: 'scripts.guard.Chat'

conversation:
  # 聊天会话保存连接器，默认default
  connector: default
  #   保存会话的表，默认yao_neo_conversation，自动初始化
  table: yao_neo_conversation
  #   跟open ai聊天时的最大历史数量，默认20
  max_size: 10
  #   历史会话的最大保存时间，单位秒，默认3600
  ttl: 3600

command:
  # neo命令解析连接器定义，如果没有配置会使用neo connector
  parser: gpt-3_5-turbo

## 当用户请求到达API接口后，使用这个hook修改用户的请求信息后再发送到openai,接收用户请求的消息，并返回新的消息
## 如果有聊天的历史，在这里也可以获取到。
prepare: 'scripts.neo.Prepare'

## 收到openai的回复后进行调整回复的消息后再返回到客户端
write: 'scripts.neo.Write'

prompts:
  - role: system
    content: |
      - Your name is Neo.
      - Your are a AI assistant of YAO

option:
  temperature: 1.2

## 跨域设置，访问域名的白名单
allows:
  - 'http://127.0.0.1:8000'
  - 'http://127.0.0.1:5099'
  - 'http://localhost:8000'
```

#### 配置 app.yao

配置路径`optional.neo.api`。neo 可以单独布署成一个服务或是与业务应用布署在一起。

如果把 neo 助手服务单独布署成一个服务。需要设置 api 的全路径地址。

api 访问地址：`http://host:port/api/__yao/neo，`路径`api/__yao/neo`是固定的，写死在源代码里`/service/service.go`。

```json
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "http://localhost:5099/api/__yao/neo" }
  }
}
```

集成配置，如果 neo 跟你的业务应用放在一起，只需要配置`/neo`，因为`yao`默认的内置前缀是`/api/__yao`。

```json
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "/neo" }
  }
}
```

设置`"studio": true`后可以在处理器时调用 studio 处理器，比如用来生成 dsl 文件等操作。

```jsonc
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "/neo", "studio": true }
  }
}
```

### 测试代码

官方已提供了测试样例

```sh
https://github.com/YaoApp/yao-dev-app

https://github.com/YaoApp/yao-init

```

### Yao 后端

#### 配置类型与说明

```go
// DSL AI assistant
type DSL struct {
	ID                  string                    `json:"-" yaml:"-"`
	Name                string                    `json:"name,omitempty"`
	Use                 string                    `json:"use,omitempty"`
	Guard               string                    `json:"guard,omitempty"`
	Connector           string                    `json:"connector"`
	ConversationSetting conversation.Setting      `json:"conversation" yaml:"conversation"`
	Option              map[string]interface{}    `json:"option"`
	Prepare             string                    `json:"prepare,omitempty"`
	Prompts             []aigc.Prompt             `json:"prompts,omitempty"`
	Allows              []string                  `json:"allows,omitempty"`
	Command             Command                   `json:"command,omitempty"`
	AI                  aigc.AI                   `json:"-" yaml:"-"`
	Conversation        conversation.Conversation `json:"-" yaml:"-"`
}

// Setting the conversation config
type Setting struct {
	Connector string `json:"connector,omitempty"`
	Table     string `json:"table,omitempty"`
	MaxSize   int    `json:"max_size,omitempty" yaml:"max_size,omitempty"`
	TTL       int    `json:"ttl,omitempty" yaml:"ttl,omitempty"`
}

// Answer the answer interface
type Answer interface {
	Stream(func(w io.Writer) bool) bool
	Status(code int)
	Header(key, value string)
}

// Command setting
type Command struct {
	Parser string `json:"parser,omitempty"`
}

```

### yao api 响应处理过程

#### 登录认证

聊天 token 认证处理器 guard,它的作用是从 token 中解析出用户的上下文 id,如果是在 xgen 框架中使用，这个 token 会自动的带上，如果是别的外部调用，需要手动处理。最重要的是`__sid`,这个参数可以作为与 ai 对接的上下文关联会话标识 session id。而`__global`参数是在生成 jwt 令牌时插入的数据。

> 令牌的生成请参考处理器`utils.jwt.Make`

```js
function Chat(path, params, query, payload, headers) {
  query = query || {};
  token = query.token || '';
  token = token[0] || '';
  token = token.replace('Bearer ', '');
  if (token == '' || token.length == 0) {
    throw new Exception('No token provided', 403);
  }

  let data = Process('utils.jwt.Verify', token);
  return { __sid: data.sid, __global: data.data };
}
```

#### 聊天会话

openai 的接口请求是没有记忆聊天的历史的，这里需要使用本地数据库表保存上一次的聊天信息，在下一次的接口请求中把之前的聊天信息也带上，形成了聊天会话的效果。

本地数据库表的配置名称是`conversation.table`。数据库表如果不存在，会自动的创建。

#### 聊天信息钩子

通过配置处理器`prepare`,可以在发送数据给 openai 接口之前，读取本地的向量数据库或是其它的额外处理。

这个处理器需要返回以下结构的信息

```json
[
  {
    "role": "system", //角色一般会设置成system，代表是一个提示信息
    "content": ""
  },
  {
    "role": "system",
    "content": ""
  }
]
```

#### 命令

如果消息中包含了处理命令，还会检查并调用本地命令处理器。

## openai 处理器

yao 内置了以下几个与 openai 相关的处理器：

- openai.audio.transcriptions，转换文本成语音。
- openai.chat.completions，聊天接口，支持异步 sse。
- openai.embeddings，调用"text-embedding-ada-002"，把文本转换成向量。
- openai.tiktoken， 计算 token。

### 配置 openai 连接器

使用 openai 之前需要先配置连接器.

比如说需要在 connectors 目录下创建一个配置文件`gpt-3_5-turbo.conn.yao`.

openai 连接器类型定义:`\gou\connector\openai\openai.go`

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "Model gpt-3.5-turbo",
  "type": "openai", //必须是openai
  "options": {
    "model": "gpt-3.5-turbo", //必填
    "key": "$ENV.OPENAI_TEST_KEY", //必填
    "Proxy": "" //可选配置，默认是https://api.openai.com，如果用了openai的代理网站，可以在这里配置,
  }
}
```

### 聊天处理器

处理器：`openai.chat.completions`。

使用聊天处理器可以快速方便的请求 openai 接口。并且处理器还支持异步调用，可以在 api 接口中应用。

`yao\openai\process.go`

#### 参数

至少要有两个参数

- connector,connector 配置 id，类型 string
- messages,消息,类型为 json 数组,
- options,选项,类型为 json,可以加入 openai 模型的微调参数。
- callback,回调函数，类型为 golang 函数或是 js 函数,回调函数的参数是返回的是聊天内容文本。如果存在回调函数，可以用于 ss 异步消息场景。

![](../docs/YaoDSL/AIGC/chatgpt模型中角色的作用.md)

处理器示例：

```js
const connectorId = 'gpt-3_5-turbo';

const messages = [
  { role: 'system', content: 'you are ai assistant' },
  { role: 'user', content: 'Write an article about internet' }
];
const options = { max_tokens: 2 };

//方法一
Process('openai.chat.completions', connectorId, messages);

//方法二
Process('openai.chat.completions', connectorId, messages, options);

//方法三
Process(
  'openai.chat.completions',
  connectorId,
  message,
  options,
  function (chatMessage) {
    console.log('ai message:', chatMessage);

    ssEvent('messages', content); //如果在api接口处理中，可以使用ssEvent向api接口写入ss消息
  }
);
```

## yao 应用中的 sse 函数

在 yao 应用的 js 脚本中，有几个与 sse 相关的处理函数。

### 函数 ssEvent

适用于所有的`text/stream` api 请求

在 js 脚本中可以使用 ssEvent 函数向客户端发送 sse 事件。这个函数在底层调用了 gin 的 SSEvent 函数。函数接收两个参数：

- event,事件名称，字符串，一般默认情况下使用 message,使用 eventsource 的情况下会触发浏览器中的 onmessage 事件。
- data,消息内容，任意数据

```js
c.SSEvent('message', msg);
```

具体请参考：

[使用服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F)

### 函数 cancel

适用于所有的`text/stream` api 请求

js 中的 cancel 函数实际上会调用 go 中的 context 的函数，取消请求连接。

```go
ctx, cancel := context.WithCancel(context.Background())
```

需要注意的是在调用 ssEvent 与 cancel 时，需要在 api 关联的处理函数里直接使用，不能在 api 函数里通过调用处理器间接调用。
比如 api 定义如下，那么 ssEvent 函数需要在处理器`scripts.chatweb.process`或是其直接调用的 js 函数中调用，而不能在处理`scripts.chatweb.process`中通过`Process("")`间接调用。原因是 ssEvent 是一个特定函数，只在固定的 streamHandle 的函数上下文中才会的生效。

```json
{
  "path": "/chat-process",
  "method": "POST",
  "guard": "scripts.security.CheckChatKey",
  "process": "scripts.chatweb.process",
  "in": [":payload"],
  "out": {
    "status": 200,
    "type": "text/event-stream; charset=utf-8"
  }
}
```

### 函数 ssWrite

只有 neo 请求中生效。

在与 neo 助手的交互过程中通过 sse 向浏览器写入文本数据,参考下面的数据结构中`message.text`。

### 函数 done

只有 neo 请求中生效。

在与 neo 助手的交互过程中向浏览器写入`message.done=true`的标识,注意并不是写入标准的 SSE 消息`data: [DONE]`，结束此次的会话。

ssWrite 与 done 函数的返回的数据结构如下：

```go
// Message the message
type Message struct {
	Text    string                 `json:"text,omitempty"`
	Error   string                 `json:"error,omitempty"`
	Done    bool                   `json:"done,omitempty"`
	Confirm bool                   `json:"confirm,omitempty"`
	Command *Command               `json:"command,omitempty"`
	Actions []Action               `json:"actions,omitempty"`
	Data    map[string]interface{} `json:"-,omitempty"`//调用自定义js脚本后返回的结果
}

// Action the action
type Action struct {
	Name    string      `json:"name,omitempty"`
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
	Next    string      `json:"next,omitempty"`
}

// Command the command
type Command struct {
	ID      string `json:"id,omitempty"`
	Name    string `json:"name,omitempty"`
	Reqeust string `json:"request,omitempty"`
}
```

### 解析 sse 消息

```ts
interface SSEParsedData {
  events: string[];
  data: string;
}

/**
 * 转换sse消息，获取sse消息体中的data 数据，可能的格式有：
 * event: message
 * data:
 *
 * event: message
 * data: :
 * data:
 * data:
 *
 * @param sseMessage sse消息，有可能会有多行
 */
function parseSSEMessage(sseMessage: string): SSEParsedData {
  const parsedData: SSEParsedData = {
    events: [],
    data: ''
  };

  let lines = sseMessage.split('\n');
  let currentType: 'event' | 'data' | null = null;
  let previousType: 'event' | 'data' | null = null;

  for (let line of lines) {
    if (line.startsWith('event:')) {
      currentType = 'event';
      parsedData.events.push(line.substring('event:'.length).trim());
    } else if (line.startsWith('data:')) {
      if (previousType === 'data') {
        parsedData.data += '\n'; // 加入换行符，只有在连续的data行之间
      }
      currentType = 'data';
      let data = line.substring('data:'.length).trim();
      if (data === '[DONE]') {
        //结束标识
        break;
      }
      parsedData.data += data;
    }
    previousType = currentType; // 更新前一个类型
  }

  return parsedData;
}
```

## API 守卫 Guard

可以把 api guard 理解成 api 请求拦截器。比如用户身份验证，额外信息获取判断等。

### `API DSL` 定义

```go
// HTTP http 协议服务
type HTTP struct {
    Name        string `json:"name"`
    Version     string `json:"version"`
    Description string `json:"description,omitempty"`
    Group       string `json:"group,omitempty"`
    Guard       string `json:"guard,omitempty"`
    Paths       []Path `json:"paths,omitempty"`
}

// Path HTTP Path
type Path struct {
    Label       string   `json:"label,omitempty"`
    Description string   `json:"description,omitempty"`
    Path        string   `json:"path"`
    Method      string   `json:"method"`
    Process     string   `json:"process"`
    Guard       string   `json:"guard,omitempty"`
    In          []string `json:"in,omitempty"`
    Out         Out      `json:"out,omitempty"`
}
```

`HTTP`定义中的字段说明：

- `api`是一个两级的结构
- `Group`会转换成`go gin`的组
- `Guard`会作为默认的`guard`
- `Paths`是下级的配置
- `Path.Guard`是`api`访问守卫

如果`Path.Guard`没有设置，会使用`HTTP.Guard`，如果`HTTP.Guard`都没有设置`Guard`，使用系统默认的`guard`："bearer-jwt"。没有设置是指没有设置这个字段的值，而不是设置为空字符串。

如果`Path.Guard`的值为“-”，则为公开`api`.

`api guard`是用来进行`api`请求拦截,如果`api`中的`guard`不为"-"，就会进行处理拦截,注意即使`guard`等于""也会被拦截。
下级的`guard`会继承上一级的`guard`

```json
"guard": "-"//不要拦截
"guard": "bearer-jwt" //单个内置的拦截
"guard": "bearer-jwt,scripts.pet.Guard"//多个拦截，可以使用其它的处理器
```

yao 内置常用的中间件:

```go
// Guards middlewares
var Guards = map[string]gin.HandlerFunc{
	"bearer-jwt":       guardBearerJWT,   // Bearer JWT
  "query-jwt":        guardQueryJWT,    // Get JWT Token from query string  "__tk"
	"cross-origin":     guardCrossOrigin, // Cross-Origin Resource Sharing
	"table-guard":      table_v0.Guard,   // Table Guard ( v0.9 table)
	"widget-table":     table.Guard,      // Widget Table Guard
	"widget-list":      list.Guard,       // Widget List Guard
	"widget-form":      form.Guard,       // Widget Form Guard
	"widget-chart":     chart.Guard,      // Widget Chart Guard
	"widget-dashboard": dashboard.Guard,  // Widget Dashboard Guard
}
```

API 接口配置示例：

```json
{
  "name": "宠物",
  "version": "1.0.0",
  "description": "宠物接口",
  "guard": "bearer-jwt", //默认守卫
  "group": "pet",
  "paths": [
    {
      "path": "/search",
      "method": "GET",
      "guard": "-", //公开api
      "process": "models.pet.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/save",
      "method": "POST",
      "guard": "", //使用默认的bearer-jwt
      "process": "models.pet.Save",
      "query": [":payload"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

### 源代码分析

`gou/api.http.go`

```go
// 加载特定中间件
func (http HTTP) guard(handlers *[]gin.HandlerFunc, guard string, defaults string) {

    if guard == "" {
        guard = defaults
    }

    // if guard != "-" && guard != "in-process" {
    if guard != "-" {
        guards := strings.Split(guard, ",")
        for _, name := range guards {
            name = strings.TrimSpace(name)
            if handler, has := HTTPGuards[name]; has {
                *handlers = append(*handlers, handler)
            }
        }
    }
}
```

### 全局变量

**注意**：适用 0.10.3 版本。

设置 `__global` 变量
`__global` 变量是一个全局的 context 变量，在 http 请求的生命周期中所有的处理器都可以使用。

`api\http.go`

```go
v := process.Run()
if data, ok := v.(map[string]interface{}); ok {
  if sid, ok := data["__sid"].(string); ok {
    c.Set("__sid", sid)
  }

  if global, ok := data["__global"].(map[string]interface{}); ok {
    c.Set("__global", global)
  }
}
```

在 golang 代码中引用全局变量，适用于插件或是使用直接引用 gou 库进行开发。

```go
// 处理器定义
type Handler func(process *Process) interface{}

func processTest(process *Process) interface{} {
	return map[string]interface{}{
		"group":  process.Group,
		"method": process.Method,
		"id":     process.ID,
		"args":   process.Args,
		"sid":    process.Sid,
		"global": process.Global,
	}
}
```

在 js 脚本中引用全局变量

```js
function test() {
  //这里的DATA是全局对象。
  //ROOT boolean 是否超级权限脚本，比如studio脚本
  //SID 使用 Session start 设置的SID
  const { SID, ROOT, DATA } = __yao_data;

  //__yao_data也是一个可写的对象，比如设置ROOT后可在脚本中调用studio处理器。
  __yao_data = { ROOT: true };
}
```

### 自定义`guard`处理器

可自定义`guard`,`guard`处理器的参数有:

- 1 `api`路径
- 2 `api`参数对象
- 3 `query`参数对象
- 4 `body`请求`payload`，如果是 application/json,是对象，其它是字符串
- 5 `header`请求抬头

```go
args := []interface{}{
    c.FullPath(),          // api path
    params,                // api params
    c.Request.URL.Query(), // query string
    body,                  // payload
    c.Request.Header,      // Request headers
}
```

在`js`函数里定义一个`guard`,自定义的 guard 处理器接收 5 个参数,如果发现数据异常，直接返回 Exception.

```js
/**
 * Custom guard
 * @param {*} api path 完整的请求地址
 * @param {*} api params 所有的参数化的值
 * @param {*} query string 请求?后的对象值
 * @param {*} payload 请求正文
 * @param {*} Request headers http头部信息
 */
function Guard(path, params, query, payload, headers) {
  isTest = headers['Unit-Test'] ? headers['Unit-Test'] : [];
  if (isTest[0] == 'yes') {
    throw new Exception('Unit-test throw', 418);
  }

  //  query对象格式
  //   "query:"
  // {
  //     "key": [
  //         "xxx"
  //     ],
  //     "name": [
  //         "xx"
  //     ]
  // }
}
```

### Table/Form 中使用 Guard

guard 不但可以用于一般的 api 目录下直接配置的 api 请求，还可以配置在 table/form 中的 bind 节点的请求函数中。
action 节点还可以配置默认的 guard

```json
{
  "name": "::Pet Admin",
  "config": { "full": true },
  "action": {
    "guard": "",
    "bind": { "model": "pet", "option": { "withs": { "doctor": {} } } },
    "search": { "process": "scripts.pet.Search", "default": [null, 1, 15] },
    "get": { "guard": "bearer-jwt,scripts.pet.Guard" }
  }
}
```

## 服务器端会话 session 保持

### 使用会话 session 保持登录状态

在 Yao 中可以使用 session 保持登录状态,yao 会自动在客户端和服务器端同步 session。

操作步骤：

- 在用户登录处理器中设置 session，在登录成功后,调用 `session.set('user', user)` 将用户信息保存到 session 中。yao 内置的登录处理器已经实现了这一步，如果需要自定义登录逻辑,也要设置 session。

- 在其它需要检查登录状态的地方,通过 `session.get('user')` 获取用户信息。如果获取不到,则表示未登录。这里还有一个前提条件，就是 http api 需要开启登录认证，`"guard": "bearer-jwt"`。

### 与 session 相关的 process 定义

`/data/projects/yao/yao-app-sources/gou/process.go`
session 有以下的处理器:

- ~~session.start~~,如果在一个 flow 调用了 session.start,在这个调用的节点后的所有 flow 节点都能使用 session 的 sid
- session.get，可以指定不同的 sid
- ssseion.set，可以指定 sid，还有超时时间
- session.setmany，有三种调用方法
- session.dump,可以在第一个参数指定不同的 SID，比如 session.dump x1

在 flow 中使用 session
当使用 Session start 设置 SID 时,整个 Flow 都使用了同一个 sid
![yao-api-session](../docs/YaoDSL/API/session/yao_session_flow中使用会话.jpg)

```go
    if node.Process != "" {
        process := NewProcess(node.Process, args...).WithGlobal(flow.Global).WithSID(flow.Sid)
        resp = process.Run()

        // 当使用 Session start 设置SID时
        // 设置SID (这个逻辑需要优化)
        if flow.Sid == "" && process.Sid != "" {
            flow.WithSID(process.Sid)
        }
    }
```

### 案例：自定义登录过程，使用 session 在 flow 中保存用户的信息

session 信息处理流转图

![session 信息处理流转图](../docs/流程图/png/yao_session_用户登录流程会话.drawio.png)

用户登录后，会生成一个会话 id，使用这个 id 生成 token,在服务器的 session 保存用户 id 与用户的相关信息。

用户登录校验，检查用户的 flow 定义,第一步需要检查用户的用户名与密码是否正确

```json
{
  "label": "Password Login",
  "version": "1.0.0",
  "description": "Password Login",
  "nodes": [
    {
      "name": "Validate Captcha",
      "process": "xiang.helper.CaptchaValidate",
      "args": ["{{$captcha.id}}", "{{$captcha.code}}"]
    },
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "password"],
          "wheres": [{ "column": "mobile", "value": "?:$mobile" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Validate Passwor",
      "process": "xiang.helper.PasswordValidate",
      "args": ["{{$password}}", "{{$res.User.0.password}}"]
    },
    {
      "name": "Response",
      "process": "flows.login.Token",
      "args": ["{{$res.User.0.id}}"]
    }
  ],
  "output": "{{$res.Response}}"
}
```

给这次正确的登录生成会话 ID，并在 token 里包含上 sid,在这里可选的操作是在 session 中保存会话信息。

session.start 调用后，后面的 session 方法可以取到内部的 sid.session.start 会自动的让\_sid 在 flow 的内部保存

login token 会返回到客户端，客户端在访问 API 时自动的把 token 带上。

```json
{
  "label": "Token",
  "version": "1.0.0",
  "description": "JWT Token",
  "nodes": [
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "name", "user_id", "open_id", "union_id"],
          "wheres": [{ "column": "id", "value": "?:$in.0" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Menu",
      "process": "flows.xiang.menu",
      "args": ["{{$res.User.0.id}}"]
    },
    {
      "name": "SID",
      "process": "session.start"
    },
    {
      "name": "JWT",
      "process": "utils.jwt.Make",
      "args": [
        "{{$res.User.0.id}}",
        {},
        {
          "timeout": 3600,
          "sid": "{{$res.SID}}"
        }
      ]
    },
    {
      "name": "Set User Data",
      "process": "session.set",
      "args": ["user", "{{$res.User.0}}"]
    },
    {
      "name": "Set User ID",
      "process": "session.set",
      "args": ["user_id", "{{$res.User.0.id}}"]
    }
  ],
  "output": {
    "sid": "{{$res.SID}}",
    "user": "{{$res.User.0}}",
    "menus": "{{$res.Menu}}",
    "token": "{{$res.JWT.token}}",
    "expires_at": "{{$res.JWT.expires_at}}"
  }
}
```

### 在 table 的 action 定义中使用 session

在 table 的 action 定义中可以使用“$.”作为前缀引用 session 信息。
调用 API 里怎么知道是哪个用户，并且在 table 绑定的 search 函数里还可直接调用户的会话信息。

实现的原理：

```go
// `yao/widgets/action/process.go`
// Session $.user.id $.user_id
    v := strings.TrimSpace(valueStr)
    if strings.HasPrefix(v, "$.") {
        name := strings.TrimLeft(v, "$.")
        namer := strings.Split(name, ".")

        val, err := session.Global().ID(sid).Get(namer[0])

        if err != nil {
            exception.New("Get %s %s", 500, v, err.Error()).Throw()
            return nil
        }

        // $.user_id
        if len(namer) == 1 {
            log.Trace("[Session] %s %v", v, val)
            return val
        }

        // $.user.id
        mapping := any.Of(val).MapStr().Dot()
			val = mapping.Get(strings.Join(namer[1:], "."))
			log.Trace("[Session] %s %v", v, val)
			return val
		}

```

答案在于 api 每次调用都携带的 token,在经过 api 的 bearer-jwt guard 处理后，http 的 上下文 context 自动保存了对应的 context id，后面的 process 根据 sid 可以找到对应的 session

### JS 脚本中使用 Session

经过上面的处理，在 js 脚本中可以直接调用处理器`session.get`与`session.dump`获取会话相关的信息。

```js
const ses = Process('session.dump');
console.log('session:', ses);
const user = Process('session.get', 'user');
console.log('user:', user);
```

### 版本变更

在 0.10.3 版本以后，`session.start`不再可用。需要使用处理器`utils.str.UUID`先生成唯一的标识 ID，在使用处理器`session.set`与`session.get`的时候在最后一个参数放入 sid。

```js
const sessionId = Process('utils.str.UUID');

Process('session.set', 'user', userPayload, timeout, sessionId);
Process('session.set', 'token', jwt.token, timeout, sessionId);
Process('session.set', 'user_id', user.id, timeout, sessionId);
```

## 在 api 中使用变量引用上下文变量

在 api 中使用变量引用上下文变量

### 传入 API 接口中引用会话变量

```json
{
  "path": "/session/in",
  "method": "GET",
  "process": "models.user.Find",
  "in": ["$session.id", ":params"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

### API 接口返回值中引用会话变量

在 api 接口定义中，在输出节点`out`的`headers`节点或是 `body`节点使用`{{}}`或是`?:`引用返回的对象，

> 小技巧，通过在 gou 项目中查找 share.Bind 方法的调用可以看到哪些代码可以使用变量绑定功能。

返回值绑定示例,

处理器`flows.user.info`返回一个 json 结构数据`{}`

```json
{
  "type": "text/json",
  "content": "hello",
  "agent": "edge/chrome"
}
```

api 定义：

```json
{
  "path": "/session/flow",
  "method": "GET",
  "process": "flows.user.info",
  "in": [],
  "out": {
    "status": 200,
    "headers": {
      "Content-Type": "{{type}}",
      "User-Agent": "?:agent"
    },
    "body": "{{content}}"
  }
}
```

## API 接口

Yao 当前支持 RESTFul API/Stream API，用于数据归集对接、即时通信、IoT 等类型的项目。

### 命名规范

业务接口描述文件是以 **小写英文字母** + `.协议名称` + `.json` 扩展名命名的 JSON 文本文件, `<name>.<protocol>.json`;

| 文件夹 (相对业务接口根目录) | 文件名         | 接口名称             | API 类型            |
| --------------------------- | -------------- | -------------------- | ------------------- |
| /                           | name.http.json | `name`               | `http` RESTFul API  |
| /group                      | name.http.json | `group.name`         | `http` RESTFul API  |
| /group1/group2              | name.http.json | `group1.group2.name` | `http` RESTFul API  |
| /                           | name.mqtt.json | `name`               | `mqtt` MQTT API     |
| /group                      | name.mqtt.json | `group.name`         | `mqtt` MQTT API     |
| /group1/group2              | name.mqtt.json | `group1.group2.name` | `mqtt` MQTT API     |
| /                           | name.sock.json | `name`               | `sock` Socket API   |
| /group                      | name.sock.json | `group.name`         | `sock` Socket API   |
| /group1/group2              | name.sock.json | `group1.group2.name` | `sock` Socket API   |
| /                           | name.ws.json   | `name`               | `ws` WEB Socket API |
| /group                      | name.ws.json   | `group.name`         | `ws` WEB Socket API |
| /group1/group2              | name.ws.json   | `group1.group2.name` | `ws` WEB Socket API |

### 各协议规范文档

| 协议名称 | 文档地址 |
| -------- | -------- |
| http     |          |

### RESTFul API

```json
{
  "name": "系统接口",
  "version": "1.0.0",
  "description": "系统接口API",
  "group": "system",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/info",
      "method": "GET",
      "guard": "-",
      "process": "models.user.Find",
      "in": ["$param.id", ":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

一个 `http` 协议的接口(`API`)文档，可以定义一组 API，可以在每个 API 中绑定一个处理器(`process`), 系统自动调用处理器，返回处理器调用结果；

| 字段        | 类型                 | 说明                                                                         | 必填项 |
| ----------- | -------------------- | ---------------------------------------------------------------------------- | ------ |
| name        | String               | API 呈现名称，用于开发平台呈现                                               | 是     |
| version     | String               | 版本号，用于依赖关系校验和开发平台呈现                                       | 是     |
| description | String               | API 介绍，用于开发平台呈现                                                   | 否     |
| group       | String               | API 分组名称，访问时作为 API 路由前缀目录。 `/api/<group>/<path>`            | 是     |
| guard       | String               | API 全局中间件，多个用 "," 分割。除特别声明，组内所有 API 都将使用全局中间件 | 否     |
| paths       | Array\<Object Path\> | API 列表。具体查看 `Object Path` 数据结构                                    | 是     |

#### `Object Path` 数据结构

API 将通过路由 `/api/<group>/<path>`访问, 请求成功响应 `out` 中定义的状态码、Content-Type 和处理器(`process`)返回值， 请求失败响应异常状态码和 JSON 格式的错误消息 [查看异常规范](#异常规范)。

| 字段    | 类型            | 说明                                                                                                                                   | 必填项 |
| ------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| path    | String          | API 路由名称。完整路由地址为 `/api/<group>/<path>` ，变量使用 `:` 声明，如 `/api/user/find/:id`, 可以使用 `$param.id` 访问路由请求参数 | 是     |
| method  | String          | 请求类型。许可值 `GET`、`POST`、`PUT`、`DELETE`、 `HEAD`、`OPTIONS`、`Any`. 其中 `Any` 将响应任何类型的请求                            | 是     |
| guard   | String          | API 中间件. 如不设置，默认使用全局中间件。如不希望使用全局中间件，可将数值设置为 `-` 。                                                | 否     |
| process | String          | 调用处理器 `process`                                                                                                                   | 是     |
| in      | Array\<String\> | 请求参数表，将作为 `process` 的输入参数(`args`)。可以引用传入参数，可以为空数组 [查看输入参数](#输入参数)                              | 是     |
| out     | Object Out      | 请求响应结果定义。 具体查看 `Object Out` 数据结构                                                                                      | 是     |
| err     | Object Out      | 自定义调用失败时的响应结果。 **尚未实现**                                                                                              | 否     |

#### `Object Out` 数据结构

| 字段    | 类型            | 说明                          | 必填项 |
| ------- | --------------- | ----------------------------- | ------ |
| status  | integer         | 请求响应状态码                | 是     |
| type    | String          | 请求响应 Content Type         | 是     |
| headers | Array\<String\> | 请求响应 Headers **尚未实现** | 否     |

#### 输入参数

`in` 中定义的参数表，将作为处理器的输入参数。支持使用 `:param` 、 `:payload` 、`$param.字段名称` 等变量，绑定请求参数。

##### 数值

| 数值         | 说明                                |
| ------------ | ----------------------------------- |
| `"'字符串'"` | 字符串格式数值, 单引号使用 `\` 转义 |
| `"数字"`     | 数字格式数值                        |

##### 变量

| 变量                  | 类型               | 说明                                                                                                        |
| --------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `":body"`             | string             | Request Body                                                                                                |
| `":fullpath"`         | string             | 路由完整路径                                                                                                |
| `":payload"`          | \[key:String\]:Any | 如果 Request Content-Type 为 `application/json` ，视为 `Reqest Body` 为 JSON。返回解码后的 Key-Value Object |
| `":query"`            | \[key:String\]:Any | URL-encoded Query String 解析后的数值                                                                       |
| `":form"`             | \[key:String\]:Any | POST form                                                                                                   |
| `":query-param"`      | Object QueryParam  | 解析 URL-encoded Query String，返回 QueryParam `查看数据结构(../../model#3-查询参数-queryparam)`            |
| `"$form.字段名称"`    | String             | POST form 字段数值                                                                                          |
| `"$param.字段名称"`   | String             | 路由变量数值                                                                                                |
| `"$query.字段名称"`   | String             | URL-encoded Query String 字段数值                                                                           |
| `"$payload.字段名称"` | Any                | payload 字段数值，支持多级访问。如 `$payload.user.name` , `$payload.manus.0.name`                           |
| `"$session.字段名称"` | Any                | Session 会话字段数，支持多级访问。如 $session.user.name , $session.manus.0.name 值                          |
| `"$file.字段名称"`    | Object File        | 上传临时文件结构                                                                                            |

`Object File` 数据结构

| 字段     | 类型                           | 说明                      |
| -------- | ------------------------------ | ------------------------- |
| name     | String                         | 文件名                    |
| tempfile | String                         | 临时文件地址              |
| size     | Integer                        | 文件大小                  |
| header   | \[key:String\]:Array\<String\> | MIME-style header mapping |

###### URL Query String 与 QueryParam 对照表

| Query String                                                      | QueryParam                                                                                                                                                      | 说明                                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| select=field1,field2                                              | `{"select":["field1","field2"]}`                                                                                                                                | 选择字段                                                                            |
| with=rel1,rel2                                                    | `{"withs":{"rel1":{}, "rel2":{}}}`                                                                                                                              | 关联关系                                                                            |
| rel1.select=field1,field2                                         | `{"withs":{"rel1":{"select":["field1", "field2"]}}}`                                                                                                            | 关联模型选择字段. 规范为 **关联关系.select**                                        |
| where.status.eq=enabled                                           | `{"wheres":[{"column":"status", "op":"eq", "method":"where", "value":"enabled"}]}`                                                                              | Where 查询条件. 规范为 **where.字段名称.匹配关系**                                  |
| where.mother.friends.status.eq=enabled                            | `{"wheres":[{"rel":"user_mother_friends","column":"status", "op":"eq", "method":"where", "value":"enabled"}]}`                                                  | 指定关联模型字段 规范为 **where.关系名称.关联模型名称.字段名称.匹配关系**           |
| group.types.where.type.eq=admin&group.types.orwhere.type.eq=staff | `{"wheres":[{"wheres":[{"column":"type", "op":"eq", "method":"where", "value":"admin"}]},{"column":"type", "op":"eq", "method":"orwhere", "value":"staff"}]}]}` | Where 分组查询，一般用于 orwhere. 规范为 **group.分组名称.where.字段名称.匹配关系** |
| order=id.desc,name                                                | `{"orders":[{"column":"id","option":"desc"}, {"column":"name"}]}`                                                                                               | 排序条件. 规范为 **字段名称.排序方式** 多个用","分割                                |

#### 异常规范

```json
{
  "code": 500,
  "message": "ID=12的数据不存在",
  "context": {
    "field": "id"
  }
}
```

| 字段    | 类型    | 说明           |
| ------- | ------- | -------------- |
| code    | Integer | 错误码         |
| message | String  | 错误描述       |
| context | Any     | 异常上下文信息 |

##### HTTP Response 状态码

返回状态与错误码一致，如 HTTP Response 状态码为 **400~599** 则视为程序处理异常。

##### 错误码定义

错误码含义，基本与 HTTP 协议状态码含义一致，便于 RESTFul API 编写、统一异常处理和工程师理解错误码含义。

| 错误码  | 适用场景                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| 400~499 | 因输入数据错误，导致程序运行失败                                                                                  |
| 500~599 | 因服务端资源不足或程序错误异常，导致程序运行失败                                                                  |
| 400     | 因输入数据不符合要求, 导致程序运行失败。应在上下文数据中描述具体不符合要求的数据字段。                            |
| 401     | 因尚未登录, 导致程序运行失败。                                                                                    |
| 403     | 因访问权限不足, 导致程序运行失败。应在上下文数据中描述具体权限要求信息。                                          |
| 404     | 因查询资源不存在, 导致程序运行失败。应在上下文数据中描述资源名称和数据 ID。                                       |
| 413     | 因输入数据越界，导致程序运行失败。                                                                                |
| 500     | 因服务端异常，导致程序运行失败。应在上下文数据中描述具体错误数据。例如: 因磁盘空间不足等原因导致的，文件写入失败. |
| 503     | 服务器暂时无法访问，导致程序运行失败。比如: MySQL server has gone away!                                           |
| 504     | 因连接超时，导致程序运行失败。比如: MySQL server connect timeout!                                                 |

**新增错误码：**

根据程序需要，可以增加错误码定义，新增错误码必须符合以下规范:

① 必须区分用户输入错误和服务端错误。

② 用户输入错误码范围必须在 418~420,432~450,452~499 之间。

③ 服务端错误码范围必须在 512~599 之间。

参考文档：[Hypertext Transfer Protocol (HTTP) Status Code Registry
](http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)

#### 完整示例

完整示例可以查阅 [examples](#完整示例)

```json
{
  "name": "用户接口",
  "version": "1.0.0",
  "description": "用户API",
  "group": "user",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/login",
      "method": "POST",
      "guard": "-",
      "process": "plugins.user.Login",
      "in": ["$payload.mobile", "$payload.password", "$payload.captcha"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/ping",
      "method": "GET",
      "guard": "-",
      "process": "plugins.user.Login",
      "in": ["$payload.mobile", "$payload.password", "$payload.captcha"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/find/:id",
      "method": "GET",
      "guard": "-",
      "process": "models.user.Find",
      "in": ["$param.id", ":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/search",
      "method": "GET",
      "guard": "-",
      "process": "models.user.Paginate",
      "in": [":params", "$query.page", "$query.pagesize"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/info/:id",
      "method": "GET",
      "process": "models.user.Find",
      "in": ["$param.id", ":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

## API 预定义变量

在 API 定义中，可使用以下的内置的 `key` 引用 API 请求中的对象。

| 变量                   | 类型                 | 说明                                                                               |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `:fullpath`            | `string`             | 路由完整路径                                                                       |
| `:payload`             | `[key:String]:Any`   | 如果 Request Content-Type 为 application/json ，视为 Reqest Body 为 JSON           |
| `:query`               | `[key:String]:Any`   | URL-encoded Query String 解析后的数值                                              |
| `:form`                | `[key:String]:Any`   | POST form                                                                          |
| `:query-param/:params` | `Object ,QueryParam` | 解析 URL-encoded Query String，返回 QueryParam。可以直接使用在模型处理器中         |
| `$form.字段名称`       | `String`             | POST form 中的查询参数                                                             |
| `$param.字段名称`      | `String`             | 路由变量数值,在 url 中使用变量匹配的变量，比如/:name/data/setting 中的 name        |
| `$query.字段名称`      | `String`             | URL-encoded Query String,URL 中的查询参数                                          |
| `$payload.字段名称`    | `Any`                | payload 字段数值，支持多级访问。如 $payload.user.name , $payload.manus.0.name      |
| `$session.字段名称`    | `Any`                | Session 会话字段数，支持多级访问。如 $session.user.name , $session.manus.0.name 值 |
| `$file.字段名称`       | `Object File`        | 上传临时文件结构                                                                   |

`session`的设置逻辑可参考![](..%5Cdocs%5CYaoDSL%5CAPI%5C自定义用户登陆login%20api.md)

需要特别关注`:query-param/:params`，yao 框架会根据 url 中的查询条件转换成 QueryParam 对象。

以下类型的处理器或是对应的封装处理器均支持传入 QueryParam 查询参数：

`Find, Get, Paginate, UpdateWhere, DeleteWhere, DestroyWhere`

封装处理器：

- yao.table.Get,搜索数据，返回数组
- yao.table.Search，对应的是 Paginate 处理器,在搜索数据时，进行分页处理
- yao.table.Find，根据 id 读取数据，返回对象
- yao.table.UpdateWhere
- yao.table.DeleteWhere
- yao.list.Find,查找一条数据
- yao.form.Find,form 查找一条数据
- models.model_id.find
- models.model_id.get
- models.model_id.pagnate
- models.model_id.UpdateWhere
- models.model_id.DeleteWhere
- models.model_id.DestroyWhere

即是所有使用 queryparam 对象类型的处理器都可以直接在 http api 定义中进行引用,具体请参考：
![](../docs/YaoDSL/Query/QueryParam语法.md)

源代码：

- `gou/api.http.go` 可根据自己的需求增加其它的变量引用

## Yao service 服务 API

在 app 的 services 目录下创建一个 js 文件。

比如新建文件：`schema.js`，在 js 中创建一个新的函数 getTables。

```js
function getTables() {
  const list = Process('schemas.default.Tables');
  const tables = list.map((table) => {
    return { item: table };
  });
  return { rows: tables };
}
```

service 服务的调用方法：

按照以下的请求格式来调用服务。

```sh
##   跟studio的service不同，services不需要跨域
curl -X POST http://127.0.0.1:5099/api/__yao/app/service/schema \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <Studio JWT>' \
-d '{ "args":[],"method":"getTables"}'
```

服务的请求地址：`http://127.0.0.1:5099/api/__yao/app/service/` 这是固定的前缀,后面跟上自己定义的服务名`schema`。

请求方法是 post。

在 post 参数中按以下格式传入处理器的参数与方法。

args 是指处理器的参数列表，按顺序进行传递，method 是指 schema.js 中的 js 函数名

```json
{ "args": [], "method": "getTables" }
```

### 总结

service 服务的优点:

- 不需要创建新的 api 定义
- 方便直接使用 yao 的处理器

缺点：

- 只能使用 post 请求

## yao stream api 接口

### 适用版本

0.10.3 或以上

### 配置

在配置 api 接口时，在 out 节点里设置`text/event-stream`作为 type 字段的前缀,这个接口的服务端处理器将会使用 stream 流式处理。**注意流式处理器的类型必须是 js 脚本，比如 scripts.xxx.xx**。在流处理器(js 脚本中)里可以使用两个全局函数`ssEvent/cancel`。

- ssEvent 在服务器端脚本里向流发送数据。
- cancel 在服务器脚本里调用，取消请求。

```json
{
  "path": "/ask-stream",
  "method": "POST",
  "guard": "-",
  "process": "scripts.ai.stream.Call",
  "in": [":payload"],
  "out": {
    "status": 200,
    "type": "text/event-stream; charset=utf-8"
  }
}
```

流式处理器向客户端请求发送实时消息。

如果要配合浏览器的 EventSource.onmessage 事件处理，一定要是发送 ssEvent('message')事件。

```js
function collect(content) {
  // 客户端会接收到事件"event:message"
  ssEvent('message', content);
  // console.log(`content:${content}`);
}
```

### 示例代码

xgen react 使用 EventSource 的示例
`xgen-v1.0/packages/xgen/layouts/components/Neo/hooks/useEventStream.ts`

`yao-chatgpt` 的 vue 使用 fetch 函数进行 api 调用示例：`front-end\src\chatpgt.ts`

yao-chatgpt 0.10.3 分支

```sh
git clone https://github.com/wwsheng009/yao-chatgpt.git

cd yao-chatgpt && git checkout 0.10.3
```

```js
export function post<T = any>({
  url,
  data,
  headers,
  onDownloadProgress,
}: HttpOption) {
  const p = new Promise<Response<T>>((resolve, reject) => {
    // return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...headers,
      },
      body: JSON.stringify({
        stream: true,
        ...data,
      }),
    })
      .then((response) => {
        const reader = response.body?.getReader();
        function readStream() {
          if (reader) {
            reader
              .read()
              .then(({ value, done }) => {
                const data = new TextDecoder().decode(value);
                // console.log(`data :${data}`);
                // console.log(`done:${done}`);
                if (!done) {
                  const lines = data.split("\n\n");
                  for (const key in lines) {
                    const line = lines[key];
                    if (line.startsWith("event:session_id\ndata:")) {
                      let sesseion_id = line.substring(
                        "event:session_id\ndata:".length
                      );
                      onDownloadProgress?.({ sesseion_id: sesseion_id });
                    } else {
                      // 有可能有nil值，还不知是哪里来的
                      if (!line.includes("event:messages")) {
                        continue;
                      }
                      let newLines = line.replace(/event:messages\n/g, "");
                      newLines = newLines.replace(/data:/g, "");
                      onDownloadProgress?.({ message: newLines });
                    }
                  }

                  return readStream();
                } else {
                  // eslint-disable-next-line no-console
                  console.log("done");
                  resolve({
                    data: { data: "" },
                    message: "",
                    status: 200,
                  } as unknown as Response<T>);
                }
              })
              .catch((error) => {
                reject(error);
              });
          }
        }
        return readStream();
      })
      .catch((error) => {
        reject(error);
      });
  });
  return p;
  // return Promise.resolve({ data: '' } as Response<T>)
}
```

## yao http.Stream 处理器

yao http.Stream 用于进行异步 sse 请求。

### 适用版本

0.10.3 或以上

### 使用方法

使用 处理器`http.Stream` 向服务端发出请求时需要进行异步响应处理。与其它 http 处理器不一样的地方在于第三个参数需要是一个回调函数(js 函数)。

```js
http.Stream('POST', url, handler, RequestBody, null, {
  Accept: 'text/event-stream; charset=utf-8',
  'Content-Type': 'application/json',
  Authorization: `Bearer ` + setting.api_token
});
```

回调处理器，处理函数要与上面的请求函数在同一个 js 文件里。

```js
function handler(payload) {
  const lines = payload.split('\n\n');
  for (const line of lines) {
    if (line === '') {
      continue;
    }
    if (line === 'data: [DONE]') {
      return 0;
    } else if (line.startsWith('data:')) {
      const myString = line.substring(5);
      try {
        let message = JSON.parse(myString);
        if (message) {
          reply = message;
          let content = message.choices[0]?.delta?.content;
          // console.log(`content:${content}`);

          if (content) {
            g_message += content;
            collect(content);
          }
        }
      } catch (error) {
        ssEvent('errors', error.Error());
        return -1;
      }
    } else {
      console.log('unexpected', line);
    }
  }
  //异常，返回-1
  //正常返回1，默认
  //中断返回0
  return 1;
}
```

### 示例代码

yao-chatgpt 0.10.3 分支

```sh
git clone https://github.com/wwsheng009/yao-chatgpt.git

cd yao-chatgpt && git checkout 0.10.3
```

## 刷新 token

### 概述

在基于 JWT 的认证系统中，token 刷新是一个重要的功能，它可以在用户 token 即将过期时，无需重新登录就能获取新的 token。本文将详细介绍如何在 Yao 中实现 token 刷新功能。

### 实现原理

1. 客户端在检测到 token 即将过期时，调用刷新 token 接口
2. 服务端通过 guard 验证当前 token 的有效性
3. 验证通过后，根据当前会话信息生成新的 token
4. 同时更新服务器端的 session 信息

### API 定义

在 API 配置文件中定义刷新 token 的接口：

```json
{
  "name": "用户接口",
  "version": "1.0.0",
  "description": "用户接口",
  "group": "user",
  "paths": [
    {
      "path": "/token/refresh",
      "guard": "bearer-jwt",
      "method": "POST",
      "process": "scripts.guard.TokenRefresh",
      "in": [],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

### Token 刷新处理器

实现 token 刷新的处理逻辑：

```js
/**
 * 刷新Token
 * @returns {object} 返回新的JWT token信息
 */
function TokenRefresh() {
  // 从当前会话获取用户信息
  const user = Process('session.Get', 'user');
  const id = user.id;

  // 获取当前会话ID
  const sid = Process('session.ID');

  // 生成新的JWT token
  const jwt = Process(
    'utils.jwt.Make',
    id, // 用户ID
    {}, // 自定义数据载荷
    {
      timeout: 3600, // token有效期(秒)
      sid: sid // 会话ID
    }
  );

  // 更新会话信息
  Process('session.Set', 'user_id', id);
  Process('session.Set', 'user', user);

  return jwt;
}
```

### Token 验证

可以自定义 token 验证逻辑，实现更灵活的 token 校验：

```js
/**
 * 自定义token验证
 * @param {string} path - API路径
 * @param {object} params - API参数
 * @param {object} query - 查询参数
 * @param {object|string} payload - 请求体数据
 * @param {object} headers - 请求头
 * @returns {object} 返回会话信息
 */
function ValidateToken(path, params, query, payload, headers) {
  // 获取并处理token
  query = query || {};
  let token = query.token || '';
  token = token[0] || '';
  token = token.replace('Bearer ', '');

  // 验证token是否存在
  if (token == '' || token.length == 0) {
    throw new Exception('No token provided', 403);
  }

  // 验证token有效性
  let data = Process('utils.jwt.Verify', token);

  // data.data 是jwt.make的第二个参数中的自定义数据
  // data.sid 是会话ID

  // 返回会话信息
  return {
    __sid: data.sid, // 会话ID
    __global: data.data // 全局数据
  };
}
```

### 最佳实践

1. **合理设置 token 有效期**：

   - 主 token 设置较短的有效期（如 1 小时）
   - 刷新 token 设置较长的有效期（如 7 天）

2. **安全性考虑**：

   - 刷新 token 接口必须使用 HTTPS
   - 验证当前 token 的有效性
   - 可以维护一个 token 黑名单，用于已注销的 token

3. **错误处理**：

   - token 失效时返回合适的状态码（如 401）
   - 提供清晰的错误信息
   - 客户端收到 401 时跳转到登录页面

4. **并发处理**：
   - 处理多个客户端同时刷新 token 的情况
   - 可以使用滑动窗口机制避免频繁刷新

## YAO API DSL 定义

### API 定义的目录结构

YAO 所有 API 定义在`apis`目录下，api 定义文件的后缀名建议使用`.http.yao`,这是一种与`jsonc`相同的文件格式，在文档中可以使用注释的`json`文件格式。

api 层级关系可以可以使用子目录来表示。例如：

```shell
apis
├── odata
│   ├── v2
│   │   └── service.http.yao
│   └── v4
│       └── service.http.yao
├── proxy.http.yao
```

### 1. API 定义的信息

YAO API 采用两级结构定义，以下是一个完整的 API 配置示例：

#### 1.1 第一级结构

在第一级中，定义了 API 的基本信息，包括名称、版本、描述、分组和认证方式等信息。如果未指定`group`，则使用文件目录作为分组。如果未指定`guard`，则该 API 为公开 API，无需认证即可调用。

#### 1.2 第二级结构

在第二级中，定义了 API 的具体路径、请求方法、处理函数等信息。`paths`数组中包含每个 API 的详细配置。第二级中的 guard 优先级高于第一级的 guard。在 process 中可以调用所有 yao 格式的处理器。在 in 中可以指定请求参数，可以是路径参数、查询参数或请求体。在 out 中可以定义响应格式，包括 HTTP 状态码和响应类型等信息。

以下是 API 定义的示例，在创建 api 文件定义时，可以参考以下内容：

```json
{
  "name": "chart config", // API名称
  "version": "1.0.0", // API版本
  "description": "Api for the chart config", // API描述
  "group": "", // API分组，默认为文件目录
  "guard": "bearer-jwt", // 认证方式
  "paths": [
    // API路径配置
    {
      "label": "chart config", // API名称
      "description": "chart config", // API描述
      "path": "/config", // API请求路径
      "method": "POST", // API请求方法
      "process": "scripts.amis.chart.getChartUseConfig", // 处理函数
      "in": [":payload"], // 请求参数，此处为请求体
      "out": {
        // 响应格式
        "status": 200, // HTTP状态码
        "type": "application/json" // 响应类型
      }
    },
    {
      "label": "echart data", // API名称
      "description": "echart data", // API描述
      "path": "/data/:id", // API请求路径，包含路径参数
      "method": "GET", // API请求方法
      "guard": "scripts.auth.token.CheckToken", // 自定义认证方式
      "process": "scripts.amis.chart.getChartById", // 处理函数
      "in": ["$param.id", ":query"], // 请求参数，包含路径参数和查询参数
      "out": {
        // 响应格式
        "status": 200, // HTTP状态码
        "type": "application/json" // 响应类型
      }
    }
  ]
}
```

### 引用传入的参数

在`path`中的`in`传入参数中可以使用以下的引用变量：

| 变量           | 类型                  | 说明                               |
| -------------- | --------------------- | ---------------------------------- |
| `:payload`     | `map[string]any`      | 请求体(JSON)                       |
| `:query`       | `map[string]string[]` | 查询参数                           |
| `:form`        | `map[string]string[]` | POST 表单                          |
| `:body`        | `string`              | 原始请求体                         |
| `:fullpath`    | `string`              | 完整的请求路径                     |
| `:headers`     | `map[string]string[]` | 请求头                             |
| `:params`      | `map[string]string[]` | 路径参数                           |
| `:query-param` | `map[string]string[]` | 查询参数（同 `:query`）            |
| `:multi-parts` | `map[string]string[]` | 多部分表单数据                     |
| `:path`        | `string`              | 请求路径                           |
| `:host`        | `string`              | 请求的主机名                       |
| `:schema`      | `string`              | 请求的协议（如 `http` 或 `https`） |
| `:remote-host` | `string`              | 远程主机地址                       |
| `:ip`          | `string`              | 客户端 IP 地址                     |
| `$form.*`      | `any`                 | 表单字段值                         |
| `$param.*`     | `any`                 | 路径参数值                         |
| `$query.*`     | `any`                 | 查询参数值                         |
| `$payload.*`   | `any`                 | 请求体中的字段值                   |
| `$session.*`   | `any`                 | 会话数据                           |
| `$header.*`    | `any`                 | 请求头中的字段值                   |
| `$file.*`      | `File`                | 上传的文件对象                     |

#### 1.1 路径参数

使用`$param.参数名`获取路径中的参数，例如：

```json
{
  "path": "/data/:id",
  "in": ["$param.id"] // 获取路径中的id参数
}
```

#### 1.2 查询参数

使用`:query`获取 URL 查询参数：

```json
{
  "in": [":query"] // 获取所有查询参数
}
```

#### 1.3 请求体

使用`:payload`获取请求体内容：

```json
{
  "in": [":payload"] // 获取POST请求体
}
```

#### 1.4 自定义 Guard

可以在路径级别指定自定义 Guard：

```json
{
  "guard": "scripts.auth.token.CheckToken" // 使用自定义的token检查
}
```

可自定义`guard`,`guard`处理器的参数有:

- 1 `api`路径
- 2 `api`参数对象
- 3 `query`参数对象
- 4 `body`请求`payload`，如果是 application/json,是对象，其它是字符串
- 5 `header`请求抬头

示例：在`js`函数里定义一个`guard`,自定义的 guard 处理器接收 5 个参数,如果发现数据异常，直接返回 Exception.

```js
/**
 * Custom guard
 * @param {*} api path 完整的请求地址
 * @param {*} api params 所有的参数化的值
 * @param {*} query string 请求?后的对象值
 * @param {*} payload 请求正文
 * @param {*} Request headers http头部信息
 */
function Guard(path, params, query, payload, headers) {
  isTest = headers['Unit-Test'] ? headers['Unit-Test'] : [];
  if (isTest[0] == 'yes') {
    throw new Exception('Unit-test throw', 418);
  }

  //  query对象格式
  //   "query:"
  // {
  //     "key": [
  //         "xxx"
  //     ],
  //     "name": [
  //         "xx"
  //     ]
  // }
}
```

#### 1.5 输出格式

自定义输出格式：

```json
{
  "out": {
    "status": 200,
    "type": "text/html", //设置输出类型格式
    "body": "<h1>Hello, World!</h1>",
    "headers": {}
  }
}
```

更灵活的输出格式，在 header 与 body 中可以使用`{{}}`绑定处理器返回的内容。`Content-Type`是一个非常重要的参数，一定要设置。

```json
{
  "out": {
    "status": 200,
    "body": "{{content}}", //定义返回的body内容
    "headers": { "Content-Type": "{{type}}" } //自定义返回的headers内容
  }
}
```

#### 跳转

如果需要跳转到其它地址，可以使用`redirect`字段。由于定义了`redirect`，此路由会在调用处理器后，直接跳转到其它地址，而不会返回响应。

```json
{
  "out": {
    "redirect": {
      "code": 301, //默认是301
      "location": "" //跳转新地址
    }
  }
}
```

### 请求方法 (HTTP Methods)

YAO API 支持以下 HTTP 请求方法：

- **GET**: 用于获取资源。GET 请求应该只用于读取数据，而不应该产生副作用。
- **POST**: 用于创建新资源或提交数据。POST 请求通常用于表单提交或上传文件。
- **PUT**: 用于更新现有资源或替换资源。PUT 请求通常用于更新整个资源。
- **DELETE**: 用于删除资源。DELETE 请求用于删除指定的资源。
- **PATCH**: 用于部分更新资源。PATCH 请求通常用于更新资源的某些字段，而不是整个资源。
- **HEAD**: 类似于 GET 请求，但只返回响应头，不返回响应体。HEAD 请求通常用于检查资源是否存在或获取资源的元数据。
- **OPTIONS**: 用于获取服务器支持的 HTTP 方法。OPTIONS 请求通常用于跨域请求的预检请求。
- **ANY**: 用于匹配任何 HTTP 方法。ANY 请求可以处理 GET、POST、PUT、DELETE 等所有 HTTP 方法。

#### 示例

以下是一些常见的 HTTP 方法使用示例：

##### GET 请求

```json
{
  "path": "/data/:id",
  "method": "GET",
  "process": "scripts.data.getDataById",
  "in": ["$param.id"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

### 2. API Guard

API Guard 用于请求拦截，支持身份验证、权限检查等功能。

- 支持多级继承，Path.Guard > HTTP.Guard > 系统默认("bearer-jwt")
- 特殊值"-"表示公开 API
- 支持多个 Guard 组合："bearer-jwt,scripts.pet.Guard"

内置 Guard 列表：

```go
var Guards = map[string]gin.HandlerFunc{
    "bearer-jwt":       guardBearerJWT,   // Bearer JWT
    "query-jwt":        guardQueryJWT,    // 从查询参数获取JWT
    "cross-origin":     guardCrossOrigin, // 跨域处理
    "table-guard":      table_v0.Guard,   // 表格Guard
    "widget-table":     table.Guard,      // 表格组件Guard
    "widget-list":      list.Guard,       // 列表组件Guard
    "widget-form":      form.Guard,       // 表单组件Guard
    "widget-chart":     chart.Guard,      // 图表组件Guard
    "widget-dashboard": dashboard.Guard,  // 仪表盘组件Guard
}
```

### 3. 内置服务 API

在 Yao 中，提供了一些可以直接调用的内置 API 接口。这些接口的调用方式与普通 API 相同，但它们的参数和路径已经被固定，无需手动指定。

#### 3.1 内置服务

- **POST `/api/__yao/app/service/:name`**: 调用 services 目录下的 JS 文件。
- **GET `/api/__yao/app/setting`**: 获取当前应用的配置信息。
- **POST `/api/__yao/app/setting`**: 更新当前应用的配置信息。
- **GET `/api/__yao/app/menu`**: 获取当前应用的菜单信息。
- **GET `/api/__yao/app/icons/:name`**: 获取图标信息。
- **POST `/api/__yao/app/setup`**: 应用初始化。
- **POST `/api/__yao/app/check`**: 应用检查。

#### 自动加载的 API

如果用户定义了特定的资源（如 tables, forms, lists, charts），系统会自动加载相应的 API。

##### neo

api 前缀：`/api/__yao/neo`

##### sui

api 前缀：`/api/__yao/sui`

##### widget

api 前缀：`/api/widget/<ID>`

##### 登录

- 管理员登录 api 前缀：`/api/__yao/login/admin`
- 用户登录 api 前缀：`/api/__yao/login/user`

##### Dashboard 定义

当用户定义了 dashboard 时，定义文件需要保存在目录`dashboard`目录下，每一个`dashboard`对应的 API 将会被加载：

- `/api/__yao/dashboard/:id/data`: 获取仪表盘数据。
- `/api/__yao/dashboard/:id/setting`: 获取仪表盘设置。
- `/api/__yao/dashboard/:id/component/:xpath/:method`: xpath 为组件的 xpath，method 为组件的方法。

##### Tables 定义

当用户定义了 tables 时，定义文件需要保存在目录`tables`目录下，每一个`table`对应的 API 将会被加载：

- `/api/__yao/table/:id/search`: 搜索数据。
- `/api/__yao/table/:id/get`: 获取数据。
- `/api/__yao/table/:id/find/:primary`: 根据主键查找数据。
- `/api/__yao/table/:id/save`: 保存数据。
- `/api/__yao/table/:id/create`: 创建数据。
- `/api/__yao/table/:id/insert`: 插入数据。
- `/api/__yao/table/:id/update/:primary`: 根据主键更新数据。
- `/api/__yao/table/:id/update/in`: 批量更新数据。
- `/api/__yao/table/:id/update/where`: 根据条件更新数据。
- `/api/__yao/table/:id/delete/:primary`: 根据主键删除数据。
- `/api/__yao/table/:id/delete/in`: 批量删除数据。
- `/api/__yao/table/:id/delete/where`: 根据条件删除数据。
- `/api/__yao/table/:id/upload/:xpath/:method`: 上传文件。
- `/api/__yao/table/:id/download/:field`: 下载文件。

##### Forms 定义

当用户定义了 forms 时，定义文件需要保存在目录`forms`目录下，每一个`form`对应的 API 将会被加载：

- `/api/__yao/form/:id/find/:primary`: 根据主键查找数据。
- `/api/__yao/form/:id/save`: 保存数据。
- `/api/__yao/form/:id/create`: 创建数据。
- `/api/__yao/form/:id/update/:primary`: 根据主键更新数据。
- `/api/__yao/form/:id/delete/:primary`: 根据主键删除数据。
- `/api/__yao/form/:id/upload/:xpath/:method`: 上传文件。
- `/api/__yao/form/:id/download/:field`: 下载文件。

##### Lists 定义

当用户定义了 lists 时，定义文件需要保存在目录`lists`目录下，每一个`list`对应的 API 将会被加载：

- `/api/__yao/list/:id/get`: 获取数据。
- `/api/__yao/list/:id/save`: 保存数据。
- `/api/__yao/list/:id/upload/:xpath/:method`: 上传文件。
- `/api/__yao/list/:id/download/:field`: 下载文件。

##### Charts 定义

当用户定义了 charts 时，以下 API 将会被加载：

- `/api/__yao/chart/:id/data`: 获取图表数据。

##### Service API

访问前缀： `/api/__yao/app/service/:name`

在 Yao 中，你可以通过定义服务（Service）来创建 API。服务文件需要保存在`services/`目录下，并以`.js`或是`.ts`形式存在。

#### 示例：获取表结构信息

在 services 目录下创建 js 文件定
义服务：

```js
// schema.js
function getTables() {
  const list = Process('schemas.default.Tables');
  return { rows: list.map((table) => ({ item: table })) };
}
```

- 调用方式：
- 请求方法：post
- 请求地址：`http://127.0.0.1:5099/api/__yao/app/service/schema`
- 请求参数：

```json
{
  "args": [], // 参数列表
  "method": "getTables" // 调用的方法名，即是在js文件中定义的函数名
}
```

```sh
curl -X POST http://127.0.0.1:5099/api/__yao/app/service/schema \
-H 'Content-Type: application/json' \
-d '{ "args":[],"method":"getTables"}'
```

### 4. Stream API

此类型的 API 支持流式数据的传输，比如各种语言模型的流式调用。

支持流式 API，在 out.type 中指定`text/event-stream`：

```json
{
  "path": "/ask-stream",
  "method": "POST",
  "process": "scripts.ai.stream.Call",
  "out": {
    "type": "text/event-stream; charset=utf-8"
  }
}
```

服务端使用`ssEvent`发送数据：

```js
function collect(content) {
  ssEvent('message', content);
}
```

#### 示例

可以在 Yao 中使用 处理器`http.Stream`调用其它 AI 服务，然后再向客户端输出内容，相当于一个 ai 代理服务器，需要注意的是向 AI 服务端发出请求时需要进行异步响应处理。与其它 http 处理器不一样的地方在于第三个参数需要是一个回调函数(js 函数)。

```js
http.Stream('POST', url, handler, RequestBody, null, {
  Accept: 'text/event-stream; charset=utf-8',
  'Content-Type': 'application/json',
  Authorization: `Bearer ` + setting.api_token
});
```

比如这里是调用 openai 的 api，然后通过回调函数将数据流式传输给客户端。另外需要注意处理函数要与上面的请求函数在同一个 js 文件里。

```js
function handler(payload) {
  const lines = payload.split('\n\n');
  for (const line of lines) {
    if (line === '') {
      continue;
    }
    if (line === 'data: [DONE]') {
      return 0;
    } else if (line.startsWith('data:')) {
      const myString = line.substring(5);
      try {
        let message = JSON.parse(myString);
        if (message) {
          reply = message;
          let content = message.choices[0]?.delta?.content;
          // console.log(`content:${content}`);

          if (content) {
            g_message += content;
            ssEvent('message', content);
          }
        }
      } catch (error) {
        ssEvent('errors', error.Error());
        return -1;
      }
    } else {
      console.log('unexpected', line);
    }
  }
  //异常，返回-1
  //正常返回1，默认
  //中断返回0
  return 1;
}
```

### 5. 文件上传下载

文件上传：

```json
{
  "path": "/upload",
  "method": "POST",
  "process": "fs.system.Upload",
  "in": ["$file.file"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

文件下载：

```json
{
  "path": "/download",
  "method": "GET",
  "process": "fs.system.Download", //内置的下载处理器
  "in": ["$query.name"],
  "out": {
    "status": 200,
    "body": "{{content}}",
    "headers": { "Content-Type": "{{type}}" }
  }
}
```

## 文件上传下载功能

当在 api 中的传入参数中使用了`$file.file`引用符，yao 框架会把上传的文件保存成临时文件。并返回一个文件数据结构为 UploadFile 的对象。

这个第二个`.file` 就是在文件上传时的的元数据中的`name`。

通常来说，在浏览器上传时的请求格式是这样的,其中的`name="file"`就对应上面的`$file.file`，如果是其它类型的，就使用不同的`name`进行引用。比如其它的像`image`,`video`。

```txt
------WebKitFormBoundaryyNSuPN4V37SH3V5y
Content-Disposition: form-data; name="file"; filename="baner01.png"
Content-Type: image/png

------WebKitFormBoundaryyNSuPN4V37SH3V5y--
```

当文件上传到服务器后，文件会先存在在一个服务器的临时目录，比如说 linux 下是`/temp`目录。并且文件名会是生成的唯一名称。并且返回一个描述文件信息的对象。

```json
{
  "name": "文件名",
  "tempFile": "临时文件名",
  "size": "文件大小",
  "mimeType": "文件类型"
}
```

```go
type UploadFile struct {
    Name     string               `json:"name"`
    TempFile string               `json:"tempFile"`
    Size     int64                `json:"size"`
    Header   textproto.MIMEHeader `json:"mimeType"`
}
```

在 apis 目录定义一个新的文件上传下载接口:

```json
{
  "name": "存储接口",
  "version": "1.0.0",
  "description": "存储接口API",
  "group": "storage",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/upload",
      "method": "POST",
      "process": "fs.system.Upload",
      "in": ["$file.file"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/download",
      "method": "GET",
      "guard": "-",
      "process": "fs.system.Download",
      "in": ["$query.name"],
      "out": {
        "status": 200,
        "body": "{{content}}",
        "headers": { "Content-Type": "{{type}}" }
      }
    }
  ]
}
```

### 文件处理器

yao 内置了几个与文件上传下载相关的处理器：

- fs.system.Upload，把文件从临时目录写入到应用目录下，并以当天的目录创建一个子目录，并返回文件名，这个文件名也是一个自动生成的唯一的文件名。

- fs.system.Download，读取应用目录下的文件，并通过 http 接口返回。文件的 mime 信息会自动根据文件进行判断。这个接口会返回以下的消息,需要注意的是 mimetype 并不是上传的类型，因为并没有保存到数据库中，只是根据文件本身的信息头作判断，有可能会有误差。
  ```json
  {
    "content": "文件内容",
    "type": "mime-type"
  }
  ```

另外也可以使用 js 函数自定义文件上传功能。

```js
//scripts.file.upload
function upload(file) {
  // "map[mimeType:map[Content-Disposition:[form-data; name=\"file\"; filename=\"blob\"]
  // Content-Type:[image/png]] name:blob size:108505
  // tempFile:C:\\Users\\USER\\AppData\\Local\\Temp\\upload2241272960\\file-2567307823]"

  // 这里不能直接使用处理器fs.system.Upload，因为经过js桥接后，数据结构已经变化。
  // https://github.com/wwsheng009/gou/commit/7fafef2100057343024e6fbe7728fd7d58cb28c9

  // 读取临时文件
  const f = Process('fs.system.ReadFile', file.tempFile);

  const ts = Process('utils.now.Timestampms');
  // 自定义文件路径
  const fn = `/data/${ts}`;
  // 写入文件
  Process('fs.system.WriteFile', fn, f, '0644');
  // 返回文件下载地址，这个地址也可以自定义，需要配合api中的下载地址定义
  return `/yao-api/download?name=${fn}`;
}
```

下载地址：

```sh
http://dev.com:5099/yao-api/download?name=test.png
```

文件下载测试页面。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Download PNG File Example</title>
  </head>
  <body>
    <h1>Download PNG File Example</h1>
    <p>Click the link below to download a PNG file in a new window:</p>
    <a
      href="http://dev.com:5099/yao-api/download?name=test.png"
      download
      target="_blank"
      >Download PNG File</a
    >
  </body>
</html>
```

## 自定义用户登陆 API

### 使用 Flow 自定义登录 API

- 第一步，检查动态验证码，如果是接口调用，这一步可以省略
- 第二步，读取用户的 ID 与密码
- 第三步，检查用户密码
- 第四步，生成 token

示例：`flows\login\password.flow.json`

```json
{
  "label": "Login",
  "version": "1.0.0",
  "description": "Login",
  "nodes": [
    {
      "name": "Validate Captcha",
      "process": "xiang.helper.CaptchaValidate",
      "args": ["{{$captcha.id}}", "{{$captcha.code}}"]
    },
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "password"],
          "wheres": [{ "column": "mobile", "value": "?:$mobile" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Validate Passwor",
      "process": "xiang.helper.PasswordValidate",
      "args": ["{{$password}}", "{{$res.User.0.password}}"]
    },
    {
      "name": "Response",
      "process": "flows.login.Token",
      "args": ["{{$res.User.0.id}}"]
    }
  ],
  "output": "{{$res.Response}}"
}
```

### Token 设置

用户名密码校验成功后，可以根据用户 id 可以读取用户的菜单或是权限设置。

- 第一步，读取用户信息
- 第二步，生成 token
- 第三步，设置全局会话（Session）信息，可使用处理器`session.set`设置变量

示例：`demo-crm\flows\login\token.flow.json`

```json
{
  "label": "Token",
  "version": "1.0.0",
  "description": "JWT Token",
  "nodes": [
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "name", "user_id", "open_id", "union_id"],
          "wheres": [{ "column": "id", "value": "?:$in.0" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Menu",
      "process": "flows.xiang.menu",
      "args": ["{{$res.User.0.id}}"]
    },
    {
      "name": "SID",
      "process": "session.start"
    },
    {
      "name": "JWT",
      "process": "utils.jwt.Make",
      "args": [
        "{{$res.User.0.id}}",
        {},
        {
          "timeout": 3600,
          "sid": "{{$res.SID}}"
        }
      ]
    },
    {
      "name": "Set User Data",
      "process": "session.set",
      "args": ["user", "{{$res.User.0}}"]
    },
    {
      "name": "Set User ID",
      "process": "session.set",
      "args": ["user_id", "{{$res.User.0.id}}"]
    }
  ],
  "output": {
    "sid": "{{$res.SID}}",
    "user": "{{$res.User.0}}",
    "menus": "{{$res.Menu}}",
    "token": "{{$res.JWT.token}}",
    "expires_at": "{{$res.JWT.expires_at}}"
  }
}
```

0.10.3 版本后，不能再使用`session.start`。使用 js 脚本会更好。

```js
/**
 * vben 登录接口
 * yao run scripts.login.Password '::{"username":"test@yao.com","password":"A123456p+"}'
 * @param {*} payload
 * @returns
 */
function Password(payload) {
  const { username, password } = payload;

  const q = new Query();
  const user = q.First({
    debug: true,
    select: ['id', 'name', 'password'],
    wheres: [
      {
        field: 'name',
        value: username
      },
      { or: true, field: 'email', value: username }
    ],
    from: '$admin.user',
    limit: 1
  });

  if (!user) {
    return Process('scripts.return.Error', '', '400', '用户不存在');
  }

  try {
    const password_validate = Process(
      'utils.pwd.Verify',
      password,
      user.password
    );
    if (password_validate !== true) {
      return Process('scripts.return.Error', '', '400', '密码不正确');
    }
  } catch (error) {
    return Process('scripts.return.Error', '', '400', '密码不正确');
  }
  const timeout = 60 * 60;
  const sessionId = Process('utils.str.UUID');
  let userPayload = { ...user };
  delete userPayload.password;
  const jwtOptions = {
    timeout: timeout,
    sid: sessionId
  };
  const jwtClaims = { user_name: user.name };
  const jwt = Process('utils.jwt.Make', user.id, jwtClaims, jwtOptions);
  Process('session.set', 'user', userPayload, timeout, sessionId);
  Process('session.set', 'token', jwt.token, timeout, sessionId);
  Process('session.set', 'user_id', user.id, timeout, sessionId);

  return Process('scripts.return.Success', {
    sid: sessionId,
    user: userPayload,
    menus: Process('flows.app.menu'),
    token: jwt.token,
    expires_at: jwt.expires_at
  });
}
```

辅助脚本，封装返回的数据格式
//scripts/return.js

```js
//scripts.return.Success
function Success(data) {
  return {
    code: 0,
    message: 'ok',
    type: 'success',
    result: data
  };
}
//scripts.return.Error "密码不正确","403","密码不正确"
function Error(data, code, message) {
  let vcode = code;
  let vmessage = message;
  if (code == undefined) {
    vcode = -1;
  }
  if (message == undefined) {
    vmessage = 'error';
  }
  return {
    code: vcode,
    message: vmessage,
    type: 'error',
    result: data
  };
}
```

## 超级用户权限

在普通脚本中，通过设置全局变量，启用超级用户脚本权限，超级权限可以读写 dsl 文件目录。

权限很大，谨慎使用。

```js
//0.10.3
__yao_data = { ROOT: true };

const result = Studio('unit.test.process', 'foo', 99, 0.618);

function WriteFile() {
  var fs = new FS('dsl');
  return fs.WriteFile('%s', '%s', 0644);
}
```

读取超级用户权限

```js
return {
  ...result,
  __yao_global: __yao_data['DATA'], //全局数据,等于res["Global"]
  __yao_sid: __yao_data['SID'], //等于res["Sid"]
  __YAO_SU_ROOT: __yao_data['ROOT'] //是否超级权限
};
```

## 配置 Redis 保持会话

Yao 默认是把会话保存在 yao 的内存中的。当服务重启后，会话信息会丢失，可以使用 redis 保存会话。

在 yao 中配置 reids 需要调用环境变量文件.env。

主要是把配置项 YAO_SESSION_STORE 从`redis`修改成`redis`。

```sh
YAO_SESSION_STORE="redis"
#可选，默认本地
YAO_SESSION_HOST="127.0.0.1"
#可选，默认6379
YAO_SESSION_PORT="6379"
#可选
YAO_SESSION_PASSWORD=
#可选
YAO_SESSION_USERNAME=

## 可选，默认是1
YAO_SESSION_DB
```

具体定义：

```go
// \yao\config\types.go
// Session 会话服务器
type Session struct {
	Store    string `json:"store,omitempty" env:"YAO_SESSION_STORE" envDefault:"file"`    // The session store. redis | file
	File     string `json:"file,omitempty" env:"YAO_SESSION_FILE"`                        // The file path
	Host     string `json:"host,omitempty" env:"YAO_SESSION_HOST" envDefault:"127.0.0.1"` // The redis host
	Port     string `json:"port,omitempty" env:"YAO_SESSION_PORT" envDefault:"6379"`      // The redis port
	Password string `json:"password,omitempty" env:"YAO_SESSION_PASSWORD"`                // The redis password
	Username string `json:"username,omitempty" env:"YAO_SESSION_USERNAME"`                // The redis username
	DB       string `json:"db,omitempty" env:"YAO_SESSION_DB" envDefault:"1"`             // The redis username
	IsCLI    bool   `json:"iscli,omitempty" env:"YAO_SESSION_ISCLI" envDefault:"false"`   // Command Line Start
}
```

### redis 操作。

```sh
## 先选择数据库

127.0.0.1:6379[1]> CONFIG GET databases
1) "databases"
2) "16"

## 先选择数据库，要不看不到数据
127.0.0.1:6379> select 1
OK

127.0.0.1:6379[1]> KEYS *
1) "yao:session:3UrNkP0WSrYnW1_quzKzmddGnWCUG67o0W3pXCPorAU=:user"
2) "yao:session:3UrNkP0WSrYnW1_quzKzmddGnWCUG67o0W3pXCPorAU=:user_id"
3) "yao:session:3UrNkP0WSrYnW1_quzKzmddGnWCUG67o0W3pXCPorAU=:issuer"

```

## mongo

### 在environment中配置mongo连接信息

基本配置：

```json
"name": "mongo",
"label": "mongo",
"version": "1.0.0",
"type": "mongo"
"options": {
  "hosts": [{
    "host": "mongo",
    "port": 27017,//默认
    "user": "",//required
    "pass": ""//required
  }],
  "params": {},
  "user": "",
  "db": "",
  "timeout": 10000
}
```

### 配置项支持引用环境变量配置：

```json
"name": "mongo",
"label": "mongo",
"version": "1.0.0",
"type": "mongo"
"options": {
  "hosts": [{
    "host": "$ENV.MONGO_HOST",
    "port": "$ENV.MONGO_PORT",
    "user": "$ENV.MONGO_USER",
    "pass": "$ENV.MONGO_PASS"
  }],
  "params": {},
  "user": "",
  "db": "$ENV.MONGO_DB",
  "timeout": "$ENV.MONGO_TIMEOUT"
}
```

在目录 `connectors` 下创建一个 `Products.conn.yao` 文件，内容如下。需要特别注意有部分的设置：

- 数据库名称配置。这需要在`options`里配置的 db 名，需要和 mongodb 里配置的 db 名一致。

- Collection 名称的配置，它的配置名称是`connector`配置文件的 ID。在这个示例中它的 ID 是`Products`,取`.mongo.yao`前面的信息。这里的 `Products` 对应 mongodb 中的 `collection`.`Products` 名称。如果在数据库中 Collection 不存在，会自动的创建。

- 用户名密码，需要设置数据库访问的用户名密码，这个是必须要设置的，不能使用空用户名或是空密码。

如果有多个 collection,每一个 collection 创建一个配置文件。

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "Mongo TEST",
  "type": "mongo",
  "options": {
    "db": "odataserver", //配置数据库名称
    "hosts": [
      {
        "host": "$ENV.MONGO_TEST_HOST",
        "port": "$ENV.MONGO_TEST_PORT",
        "user": "$ENV.MONGO_TEST_USER",
        "pass": "$ENV.MONGO_TEST_PASS"
      }
    ],
    "params": { "maxPoolSize": 20, "w": "majority" } //配置其它参数
  }
}
```

在环境变量文件.env 中配置连接信息

```sh
MONGO_TEST_HOST=127.0.0.1
MONGO_TEST_PORT=27017
MONGO_TEST_USER="admin"
MONGO_TEST_PASS="admin"
```

另外需要注意的是，这里的 mongodb 是用于 key-value 的存储，YAO 会自动的为`Collection`创建一个`key`的**唯一**索引。保存的数据结构为以下结构,所以`Collection`数据结构中一定要有一个唯一的 key 值。

```json
{
  "key": "",
  "value": ""
}
```

所以它只适用于 key-value 数据结构，并不适用于其它的结构数据保存。

## OPENAI连接器

### 配置 OPENAI 连接器。

在应用目录下的 connectors 目录中创建连接器配置文件，配置文件的后缀为`.conn.yao`。

> 0.10.3 以上的版本可以支持 jsonc 的格式的配置文件,后缀为.jsonc 或是.yao，即可以在 json 文本中写入注释。

`connectors/gpt-3_5-turbo.conn.yao`

**类型一定要设置成 openai**

```json
{
  "version": "1.0.0", //版本
  "label": "Model gpt-3.5-turbo", //说明
  "type": "openai", //类型一定是openai
  "options": {
    "model": "gpt-3.5-turbo",
    "key": "$ENV.OPENAI_KEY",
    "proxy": "$ENV.OPENAI_AIP_HOST"
  }
}
```

配置文件中最重要的是 options 中的配置项：

- `model`：OpenAI 语言模型，如 gpt-3.5-turbo、gpt-4 等。在配置文件中使用 `$ENV.` 语法引用环境变量，如 `$ENV.OPENAI_MODEL`

- `key`：OpenAI API 密钥。强烈建议使用环境变量配置，避免密钥泄露。在配置文件中使用 `$ENV.` 语法引用环境变量，如 `$ENV.OPENAI_KEY`

- `proxy`：API 代理地址。默认为 api.openai.com，如果需要使用代理服务，可以在这里配置。同时，如果需要使用 openai 类型的代理，使用此字段来配置基本 url。比如：`http://URL_ADDRESS/v1`

以上三个配置项都支持使用环境变量（`$ENV.<ENV_NAME>`），这样可以更好地管理敏感信息，避免意外泄露。特别是 API 密钥，建议使用环境变量配置。

```go

// DSL the connector DSL
type DSL struct {
	ID      string                 `json:"-"`
	Type    string                 `json:"type"`
	Name    string                 `json:"name,omitempty"`
	Label   string                 `json:"label,omitempty"`
	Version string                 `json:"version,omitempty"`
	Options map[string]interface{} `json:"options,omitempty"`
}

// Options the redis connector option
type Options struct {
	Proxy string `json:"proxy,omitempty"`//如果不是使用https://api.openai.com，可以在这里设置openai的访问地址
	Model string `json:"model,omitempty"`//openai模型
	Key   string `json:"key"`//openai 接口访问密钥
}
```

### 示例：

```json
{
  "label": "Model v3",
  "type": "openai",
  "options": {
    "model": "deepseek-r1-distill-llama-70b",
    "key": "$ENV.BAILIAN_KEY",
    "proxy": "https://dashscope.aliyuncs.com/compatible-mode/v1"
  }
}
```

连接 deepseek。

```json
{
  "label": "Model v3",
  "type": "openai",
  "options": {
    "model": "deepseek-reasoner", //可以使用$ENV.DEEPSEEK_MODEL替换
    "key": "$ENV.DEEPSEEK_KEY",
    "proxy": "https://api.deepseek.com"
  }
}
```

## redis连接器

### 在environment中配置redis连接信息

redis主要是用于保存会话信息。

```sh
YAO_SESSION_STORE="redis"
YAO_SESSION_HOST="redis"
YAO_SESSION_PORT="6379"
YAO_SESSION_PASSWORD=
YAO_SESSION_USERNAME=
```

### 在connectors中配置redis连接信息

配置项如下：

```json
{
  "name": "redis",
  "label": "redis",
  "version": "1.0.0",
  "type": "redis",
  "options": {
    "host": "redis",
    "port": 6379, //默认
    "user": "",
    "pass": "",
    "timeout": 10000, //默认5
    "db": "" //默认0
  }
}
```

配置项支持引用环境变量配置：

```json
{
  "name": "redis",
  "label": "redis",
  "version": "1.0.0",
  "type": "redis",
  "options": {
    "host": "$ENV.YAO_SESSION_HOST",
    "port": "$ENV.YAO_SESSION_PORT",
    "user": "$ENV.YAO_SESSION_USERNAME",
    "pass": "$ENV.YAO_SESSION_PASSWORD",
    "timeout": "$ENV.YAO_SESSION_TIMEOUT",
    "db": "$ENV.YAO_SESSION_DB"
  }
}
```

## 不同数据库连接配置

### 支持的数据库列表

- sqlite
- mysql
- postgres 隐藏的支持的数据库
- hdb SAP HANA[定制数据库]

最常用的是 mysql 与 sqlite，在 xgen 配置界面上也只能找到这两个。

yao 针对于 mysql 与 sqlite 在源代码上会有一些优化。比如使用 mysql 作为数据库，可以在查询中使用 json 查询表达式。

数据库的默认连接配置需要配置环境变量 `YAO_DB_DRIVER` 与 `YAO_DB_PRIMARY`.

- `YAO_DB_DRIVER` 数据库类型
- `YAO_DB_PRIMARY` 数据库 dsn 连接字符串

一般会把这两个环境变量写在文件.env 里。

Yao 引擎在系统初始化时会把连接配置存入到全局连接池中，作为应用程序的默认连接。为了与其它的 connector 作区别，这个默认数据库的配置的名称是`default`.

#### 读写分离

数据库的读写分离是通过配置环境变量来实现的。比如像 mysql 数据库，可以配置两个数据库进行主分复制的架构设置，主库用于用户的写入操作。从库用于用户的查询操作，用于减轻数据库压力。

主从数据库的数据库类型`YAO_DB_DRIVER`需要是一样的。比如都是 MYSQL.

同时，`YAO_DB_PRIMARY`与`YAO_DB_SECONDARY`都支持配置多个数据库连接配置，使用|分割。

当在执行写入，删除，更新操作时，需要使用支持可写的主库连接。当在 Query 中进行数据查询时，会优先使用从库连接。如果不存在主库，会使用从库连接。不能两个都没有配置。

如果主库或是从库存在多个数据库连接，会随机选择一个连接。

不同的数据库的环境变量示例：

#### sqlite

```sh
YAO_DB_DRIVER="sqlite3"
YAO_DB_PRIMARY="db/yao.db"
```

#### mysql

```sh
YAO_DB_DRIVER=mysql
YAO_DB_PRIMARY="root:123456@tcp(172.18.3.234:33306)/yao_ai?charset=utf8mb4&parseTime=True&loc=Local"
```

#### postgres

不再 yao setup 界面里，但是 xun 是支持 pg 的。

```sh
YAO_DB_DRIVER=postgres
YAO_DB_PRIMARY="postgres://xun:123456@db-server:5096/xun?sslmode=disable&search_path=xun"
```

#### hdb

sap hana database,这个是本人作的适配器，不在官方版本中。

```sh
YAO_DB_DRIVER=hdb
YAO_DB_PRIMARY="hdb://HANA_READONLY:Hana@readonly123@172.18.3.30:30015?defaultSchema=HANA_READONLY"
```

### 通过 connector 配置

在一个 yao 应用中，除了上面使用环境变量设置默认的连接外，还可以使用 `connector` 设置其它的数据库连接。

在应用目录 connectors 目录下创建配置。

sqlite3 connector 配置文件`connectors/sqlite3.conn.json`

```json
{
  "version": "1.0.0",
  "label": "SQLite TEST",
  "type": "sqlite3",
  "options": {
    "file": "$ENV.SQLITE_DB"
  }
}
```

mysql connector 配置文件`connectors/mysql.conn.json`

设置主库，在 connector 的配置中把 host 的 primary 设置为 true,比如`options.hosts[0].primary`设置 true。

数据库连接可以设置多个，如果存在多个连接，使用时会随机挑选一个。

注意：需要同时配置主库与从库连接。

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "MySQL 8.0 TEST",
  "type": "mysql", //类型，官方只支持支持sqlite3,mysql,扩展支持postgres,hdb
  "version": "8.0.26",
  "options": {
    "db": "test",
    "charset": "utf8mb4",
    "parseTime": true,
    "hosts": [
      {
        "host": "$ENV.MYSQL_TEST_HOST",
        "port": "$ENV.MYSQL_TEST_PORT",
        "user": "$ENV.MYSQL_TEST_USER",
        "pass": "$ENV.MYSQL_TEST_PASS",
        "primary": true //主库
      },
      {
        "host": "$ENV.MYSQL_TEST_HOST",
        "port": "$ENV.MYSQL_TEST_PORT",
        "user": "$ENV.MYSQL_TEST_USER",
        "pass": "$ENV.MYSQL_TEST_PASS"
      }
    ]
  }
}
```

connector 配置文件支持使用环境变量来配置用户密码等敏感的信息。

### 读写分离

yao 支持多个数据库连接，通过配置 `connector` 来实现读写分离。

同时 `connector` 配置也是支持读写分离的配置，参考上面的`YAO_DB_PRIMARY`与`YAO_DB_SECONDARY`进行`connector`配置。

- 在 flows 的 query 查询中,在 flows 定义中可以使用 `engine` 指定不同的数据库`connector`连接,而一般是使用 default 连接，default 连接是指环境变量中配置的数据库。

`flows/tests/session.flow.yao`

```json
{
  "name": "Session",
  "version": "1.0.0",
  "description": "Session TestFlow",
  "nodes": [
    {
      "name": "User",
      "engine": "query-test",
      "query": {
        // "debug": true,
        "select": ["id", "name", "type"],
        "from": "$user",
        "wheres": [{ ":id": "用户ID", "=": "?:$res.ID" }],
        "first": true
      }
    }
  ],
  "output": {
    "User": "{{$res.User}}"
  }
}
```

- jsapi，在 jsapi 中可以在初始化 Query 对象时指定不同的 `connector`,默认为空时将使用 default 连接。

```js
var query = new Query('default'); //可以指定不同的数据库connector
var money_count = query.Get({
  wheres: [{ ':deleted_at': '删除', '=': null }],
  select: [':SUM(total_money) as num'],
  from: 'account'
});
```

> query 查询默认是使用的从库的只读连接，如果没有从库配置，就会使用默认的主库连接配置。

### migrate 命令使用不同的 `connector`

yao 可以在 model 定义中配置 `connector` 连接不同的数据库。针对一个模型设置不同的 `connector` 会在执行 `migrate` 时把数据库创建在别的数据库中。

注意读写分离是针对整个数据库，而不是针对某个表。默认的数据库连接只有一个，这里可以可以配置上面的 js 中 Query 对象的 engine 来指定不同的数据库连接。或是使用 flow 的 engine 指定不同的数据库连接。

`mod.json`

```json
{
  "name": "test",
  "connector": "mysql",
  "table": {
    "name": "test"
  },
  "columns": [{
    ...
  }]
}
```

### 总结

- 在 Yao 中，支持多数据库连接配置,使用`connector`来配置。也支持主从库配置，使用 primary 与 second 来区别。
- 在 Yao 中，支持同一类型数据库，也即是同一类型的`connector`读写分离。
- 主从库配置的两个连接的数据库数据结构上是一致的。那些需要同时写入与读取的表需要在两个数据库中同时存在才可以。
- 读写分离是按 SQL 的执行方式来区分的。比如读取数据会使用从库，而写入就必须需要在主库中执行。当一个`connector`配置了从库，读取分离是自动在程序中根据 sql 的操作自动处理。
- 在 Yao 中，默认的`connector`是数据库`YAO_DB_DRIVER` 与 `YAO_DB_PRIMARY`的配置。
- 需要注意读写分离与`connector`的区别，一个是连接不同的数据库，另外一个是在同一个数据库源中设置读写分离。
- 数据库`migrate`操作默认是只针对主数据库，并不会影响从库，如果需要特别的把一个表结构同步到从为，需要在`model`定义中配置`connector`。
- 如果两个数据库的表数据库不一样,可以理解为异构数据库，不要使用主从库配置。而是使用`connector`配置，并在`flow`中使用`engine`指定不同的`connector`，或是在 JSAPI 中使用`Query`对象的`engine`指定不同的`connector`。

## 连接器

连接器有以下类型：

- ![](../docs/YaoDSL/Connector/数据库连接器.md)
- ![](../docs/YaoDSL/Connector/redis.md)
- ![](../docs/YaoDSL/Connector/mongo.md)
- ![](../docs/YaoDSL/Connector/OpenAI连接器.md)
- MoAPI连接器

## 数据流规范

数据流(`Flow`)用来编排数据查询逻辑，可以作为处理 (`process`) 来使用，引用方式为 `flows.<数据流名称>` 。

### 1 命名规范

数据流描述文件是以 **小写英文字母** + `.flow.json` 扩展名命名的 JSON 文本文件, `<name>.flow.json`;
结果处理脚本文件是以 `数据流名称` + `.` + `脚本名称` + `.js` 扩展名，命名的 JavaScript 脚本文件 `<name>.<script>.js` 。

| 文件夹 (相对数据流根目录) | 文件名         | 数据流名称           | Process (在 API /Flow 中引用) |
| ------------------------- | -------------- | -------------------- | ----------------------------- |
| /                         | name.flow.json | `name`               | `flows.name`                  |
| /group                    | name.flow.json | `group.name`         | `flows.group.name`            |
| /group1/group2            | name.flow.json | `group1.group2.name` | `flows.group1.group2.name`    |

### 2 文档结构

数据流编排文档，由基础信息、查询节点和输出结果构成。

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [],
  "output": {}
}
```

| 字段        | 类型                | 说明                                   | 必填项 |
| ----------- | ------------------- | -------------------------------------- | ------ |
| label       | String              | 数据流呈现名称，用于开发平台呈现       | 是     |
| version     | String              | 版本号，用于依赖关系校验和开发平台呈现 | 是     |
| description | String              | 数据流介绍，用于开发平台呈现           | 否     |
| nodes       | Array<Object Node\> | 查询节点                               | 是     |
| output      | Object              | 输出结果定义                           | 是     |

### 2.1 查询节点 `nodes`

```json
{
  "nodes": [
    {
      "name": "manus",
      "process": "models.manu.get",
      "args": [
        {
          "select": ["id", "name", "short_name"],
          "limit": 20,
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "name", "value": "{{$in.0}}", "op": "like" }
          ]
        }
      ],
      "outs": ["{{$out.manus}}", "{{$out.manu_ids}}"]
    }
  ]
}
```

一个数据流编排(`Flow`)可以有多个查询节点, 每个查询节点，可以调用一个处理器(`process`), 可以指定结果处理脚本和返回值，在查询节点用可以引用上下文信息

`Object Node` 数据结构

:::v-pre
| 字段 | 类型 | 说明 | 必填项 |
| ------- | -------------- | ----------------------------------------------------------------------------------------- | ------ |
| name | String | 查询节点名称 | 是 |
| process | String | 调用处理器 `process` | 是 |
| args | Array<Any\> | 处理器参数表.可以引用输入输出或上下文数据 | 是 |
| outs | Array<String\> | 查询节点结果输出.使用 `{{$out}}` 引用处理器返回结果。如不设置，返回值等于处理器返回结果。 | 否 |
| next | Object Next | 当查询结果符合设定条件时跳转至指定查询节点(**尚未实现**) | 否 |
:::

### 2.2 输出结果 `output`

```json
{
  "output": {
    "foo": "{{$in}}",
    "bar": {
      "node1": "{{$res.node1.0}}",
      "node2": "{{$res.node2.0}}",
      "node3": "{{$res.node3}}"
    },
    "data": "{{$res}}",
    "ping": "pong"
  }
}
```

:::v-pre
可以根据业务需要，自由定义数据流(`Flow`)的输出结果。 可以使用 `{{$in}}` 引用数据流(`Flow`)调用时传入的参数、使用 `{{$res}}` 引用各个查询节点返回值。
:::

### 3 上下文数据引用

:::v-pre
数据流(`Flow`)可以在全局引用传参(`{{$in}}`)和 各查询节点返回值 `{{$res}}`。查询节点内 `outs` 数组中，可以引用处理器 (`process`) 的返回值 `{{out}}`。
:::

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [
    {
      "name": "manus",
      "process": "models.manu.get",
      "args": [
        {
          "select": ["id", "name", "short_name"],
          "limit": 20,
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "name", "value": "{{$in.0}}", "op": "like" }
          ]
        }
      ],
      "script": "rank",
      "outs": ["{{$out.manus}}", "{{$out.manu_ids}}"]
    },
    {
      "name": "github",
      "process": "plugins.user.github",
      "args": [
        "{{$res.users.0}}",
        "{{$res.manus}}",
        "{{$in.0}}",
        "{{$in.1}}",
        "{{$in.2}}",
        "{{hello(:$res.users, 'id', 0.618, 10)}}",
        "foo",
        1
      ]
    }
  ],
  "output": {
    "params": "{{$in}}",
    "data": {
      "manus": "{{$res.manus.0}}",
      "github": "{{$res.github}}"
    }
  }
}
```

#### 变量

:::v-pre
| 变量 | 类型 | 说明 | 使用范围 | 示例 |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `{{$in}}` | Array<Any\> | 数据流调用时传入的参数表, 支持使用数组下标访问指定参数, 例如： `{{$in.0}}` 第 1 个参数, `{{$in.1}}` 第 2 个参数, | `nodes[n].args`, `nodes[n].outs`, `output` | `{{$in}}`, `{{$in.0}}`,`{{$in.0.name}}` |
| `{{$res}}` | \[key:String\]:Any | 查询节点返回值(`nodes[n].outs`) 映射表, 支持使用查询节点名称访问特定查询节点返回值。例如 `{{$res.node1.0}}` node1 的第一返回值。 | `nodes[n].args`, `nodes[n].outs`, `output` | `{{$res}}`, `{{$res.node1.0.name}}`, `{{$res.node2.manu_id}}` |
| `{{out}}` | Any | 查询节点的处理器(`process`)返回值，支持使用 `.` 应用 Object /Array 数值 | `nodes[n].outs` | `{{out}}`, `{{out.name}}`, `{{out.0}}` |
:::

#### Helper 函数

:::v-pre
可以在 `nodes[n].args`, `nodes[n].outs`, `output` 中使用 `Helper` 函数。调用方法为 `{{method(args...)}}` 参数表支持使用变量 写法为 `:$res.node1`, 字符串使用单引号 `'`，例如: `{{hello(:$res.users, 'id', 0.618, 10)}}`

Helper 函数表

| 函数    | 参数表                       | 返回值                   | 示例                          |
| ------- | ---------------------------- | ------------------------ | ----------------------------- |
| `pluck` | `row: Array`, `name: String` | `Array` 指定字段数值集合 | `{{pluck(:$res.user, 'id')}}` |

:::

### 5 外部引用

数据流(`Flow`) 可以作为处理，在其他数据流(`Flow`)或服务接口(`API`)中调用。处理器引用方式为 `flows.数据流名称`

#### 5.1 在其他数据流(Flow)中调用

```json
{
  "nodes": [
    {
      "name": "github",
      "process": "flows.github",
      "args": ["{{$in.1}}", "{{$in.2}}", "foo", 1],
      "script": "count",
      "outs": ["$out.args", "$out.plugin"]
    }
  ]
}
```

#### 5.2 在服务接口(API)中调用

```json
{
  "path": "/latest/:day",
  "method": "GET",
  "process": "flows.latest",
  "in": ["$param.day"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

### 6 完整示例

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [
    {
      "name": "manus",
      "process": "models.manu.get",
      "args": [
        {
          "select": ["id", "name", "short_name"],
          "limit": 20,
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "name", "value": "{{$in.0}}", "op": "like" }
          ]
        }
      ],
      "outs": ["{{$out.manus}}", "{{$out.manu_ids}}"]
    },
    {
      "name": "users",
      "process": "models.user.paginate",
      "args": [
        {
          "select": ["id", "name", "extra", "resume"],
          "withs": {
            "manu": { "query": { "select": ["name", "short_name"] } },
            "addresses": {
              "query": { "select": ["province", "city", "location"] }
            }
          },
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "manu_id", "value": "{{$res.manus.1}}", "op": "in" }
          ]
        },
        1,
        20
      ],
      "outs": ["{{$out.data}}"]
    },
    {
      "name": "github",
      "process": "plugins.user.github",
      "args": [
        "{{$res.users.0}}",
        "{{$res.manus}}",
        "{{$in.0}}",
        "{{$in.1}}",
        "{{$in.2}}",
        "{{pluck(:$res.users, 'id', 0.618, 10)}}",
        "foo",
        1
      ]
    }
  ],
  "output": {
    "params": "{{$in}}",
    "data": {
      "manus": "{{$res.manus.0}}",
      "users": "{{$res.users.0}}",
      "count": "{{$res.count}}"
    }
  }
}
```

## 流程控制

    数据流用来编排处理器的调用逻辑，支持使用 flows对查询节点数据处理，JS数据流处理适用于较为复杂的业务逻辑。

`flows`处理器为我们提供完整的数据流处理,可以提供数据处理器一套流程， 数据流可以作为处理器使用，命名空间为 flows.<处理器名称>查询节点可以引用除自身以外的其他数据流。

### 上下文数据引用

:::v-pre

- 可在全局使用 `{{$in}}` 变量访问调用时的传入参数;
- 可在全局使用 `{{$res}}` 变量访问各点返回值；
- 可在节点使用 `{{$out}}` 变量访问处理器返回值； `outs` 用于字段声明当前节点的返回值, 如不声明返回处理器的运行结果。
- `output` 字段用于声明数据流的输出结果, 如不声明返回所有节点的运行结果。

| 变量       | 类型               | 说明                                                                                                                             | 使用范围                                   | 示例                                                          |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `{{$in}}`  | array<any\>        | 作为处理器被调用时传入的参数表, 支持使用数组下标访问指定参数, 例如： `{{$in.0}}` 第 1 个参数, `{{$in.1}}` 第 2 个参数,           | `nodes[*].args`, `nodes[*].outs`, `output` | `{{$in}}`, `{{$in.0}}`,`{{$in.0.name}}`                       |
| `{{$res}}` | \[key:string\]:any | 查询节点返回值(`nodes[*].outs`) 映射表, 支持使用查询节点名称访问特定查询节点返回值。例如 `{{$res.node1.0}}` node1 的第一返回值。 | `nodes[*].args`, `nodes[*].outs`, `output` | `{{$res}}`, `{{$res.node1.0.name}}`, `{{$res.node2.manu_id}}` |
| `{{$out}}` | any                | 查询节点的处理器(`process`)返回值，支持使用 `.` 访问 Object /Array 数值                                                          | `nodes[*].outs`                            | `{{out}}`, `{{out.name}}`, `{{out.0}}`                        |

:::

### 内置的流程控制处理器

| 处理器            | 别名                | 说明               |
| ----------------- | ------------------- | ------------------ |
| xiang.flow.For    | xiang.helper.For    | 遍历数据           |
| xiang.flow.Each   | xiang.helper.Each   | 遍历数据           |
| xiang.flow.Case   | xiang.helper.Case   | Case 流程控制      |
| xiang.flow.IF     | xiang.helper.IF     | IF 流程控制        |
| xiang.flow.Return | xiang.helper.Return | 返回输入数据       |
| xiang.flow.Throw  | xiang.helper.Throw  | 抛出异常并结束程序 |

### 示例代码:

#### Case 流程控制示例

以下示例展示了如何使用 Case 流程控制进行条件判断，包括单条件和多条件 OR 逻辑的使用场景：

```json
{
  "label": "Case流程控制示例",
  "version": "1.0.0",
  "description": "演示Case流程控制的使用方法",
  "nodes": [
    {
      "name": "条件判断",
      "process": "xiang.flow.Case",
      "args": [
        {
          "name": "多条件OR逻辑",
          "when": [
            { "用户": "张三", "=": "李四" },
            { "or": true, "用户": "李四", "=": "李四" }
          ],
          "process": "flows.处理A",
          "args": ["world"]
        },
        {
          "name": "单条件判断",
          "when": [{ "用户": "张三", "=": "张三" }],
          "process": "flows.处理B",
          "args": ["foo"]
        }
      ]
    }
  ]
}
```

在上面的示例中：

1. 第一个条件判断使用了 OR 逻辑：

   - 检查 `用户` 是否等于 `李四`
   - 或者检查 `用户` 是否等于 `李四`
   - 如果任一条件满足，则执行 `flows.处理A`

2. 第二个条件判断使用了单一条件：
   - 检查 `用户` 是否等于 `张三`
   - 如果条件满足，则执行 `flows.处理B`

条件判断会按顺序执行，当遇到第一个条件满足时，将执行对应的处理器并返回结果。

#### 在`flows`里面使用 `xiang.flow.IF`

```json
{
  "label": "测试flows",
  "version": "1.0.0",
  "description": "测试flows",
  "nodes": [
    {
      "name": "检查数据",
      "process": "xiang.flow.IF",
      "args": [
        {
          "name": "忽略处理",
          "when": [{ "忽略处理": "{{$res}}", "is": "notnull" }],
          "process": "xiang.flow.Throw",
          "args": ["忽略处理", 400]
        }
      ]
    }
  ]
}
```

#### IF 流程控制示例

以下示例展示了如何使用 IF 流程控制进行条件判断，包括单条件和多条件 OR 逻辑的使用场景：

```json
{
  "label": "IF流程控制示例",
  "version": "1.0.0",
  "description": "演示IF流程控制的使用方法",
  "nodes": [
    {
      "name": "条件判断",
      "process": "xiang.flow.IF",
      "args": [
        {
          "name": "多条件OR逻辑",
          "when": [
            { "用户": "张三", "=": "李四" },
            { "or": true, "用户": "李四", "=": "李四" }
          ],
          "process": "flows.处理A",
          "args": ["world"]
        },
        {
          "name": "单条件判断",
          "when": [{ "用户": "张三", "=": "张三" }],
          "process": "flows.处理B",
          "args": ["foo"]
        }
      ]
    }
  ]
}
```

在上面的示例中：

1. 第一个条件判断使用了 OR 逻辑：

   - 检查 `用户` 是否等于 `李四`
   - 或者检查 `用户` 是否等于 `李四`
   - 如果任一条件满足，则执行 `flows.处理A`

2. 第二个条件判断使用了单一条件：
   - 检查 `用户` 是否等于 `张三`
   - 如果条件满足，则执行 `flows.处理B`

条件判断会按顺序执行，当遇到第一个条件满足时，将执行对应的处理器并返回结果。

#### Each 流程控制示例

Each 流程控制支持以下数据类型的遍历：

1. 整数类型（int、uint 及其变体）：将遍历从 0 到该数值的范围
2. 数组/切片类型：遍历数组中的每个元素
3. Map 类型：遍历映射中的键值对
4. 结构体类型：将结构体转换为 Map 后遍历其字段

以下示例展示了不同数据类型的遍历用法：

```json
{
  "label": "Each流程控制示例",
  "version": "1.0.0",
  "description": "演示Each流程控制的使用方法",
  "nodes": [
    {
      "name": "遍历整数范围",
      "process": "xiang.flow.Each",
      "args": [
        5,
        {
          "process": "flows.处理数值",
          "args": ["::key", "::value"]
        }
      ]
    },
    {
      "name": "遍历数组",
      "process": "xiang.flow.Each",
      "args": [
        ["A", "B", "C", "D"],
        {
          "process": "flows.处理数组元素",
          "args": ["::key", "::value"]
        }
      ]
    },
    {
      "name": "遍历对象",
      "process": "xiang.flow.Each",
      "args": [
        {
          "name": "张三",
          "age": 18,
          "city": "北京"
        },
        {
          "process": "flows.处理对象属性",
          "args": ["::key", "::value"]
        }
      ]
    },
    {
      "name": "遍历结构体",
      "process": "xiang.flow.Each",
      "args": [
        {
          "ID": 1,
          "Name": "产品A",
          "Price": 99.9,
          "Status": "active"
        },
        {
          "process": "flows.处理结构体字段",
          "args": ["::key", "::value"]
        }
      ]
    }
  ]
}
```

在上面的示例中：

1. 遍历整数范围示例：

   - 遍历从 0 到 4 的整数范围
   - 对每个数值调用 flows.处理数值 处理器
   - ::key 和 ::value 都是当前的遍历数值

2. 遍历数组示例：

   - 遍历一个字符串数组 ["A", "B", "C", "D"]
   - 对每个元素调用 flows.处理数组元素 处理器
   - ::key 为当前索引，::value 为当前元素值

3. 遍历对象示例：

   - 遍历一个包含用户信息的对象
   - 对每个属性调用 flows.处理对象属性 处理器
   - ::key 为属性名，::value 为属性值

4. 遍历结构体示例：
   - 结构体会被转换为 Map 后进行遍历
   - 对每个字段调用 flows.处理结构体字段 处理器
   - ::key 为字段名，::value 为字段值

#### For 流程控制示例

以下示例展示了如何使用 For 流程控制进行数值范围遍历：

```json
{
  "label": "For流程控制示例",
  "version": "1.0.0",
  "description": "演示For流程控制的使用方法",
  "nodes": [
    {
      "name": "数值遍历",
      "process": "xiang.flow.For",
      "args": [
        0,
        5,
        {
          "process": "flows.处理数值",
          "args": ["::key", "::value"]
        }
      ]
    }
  ],
  "output": {
    "示例说明": "For流程控制会遍历从0到4（不包含5）的数值",
    "遍历变量": {
      "key": "当前遍历的索引值，如0,1,2,3,4",
      "value": "与key相同，值为当前遍历的索引值"
    }
  }
}
```

在上面的示例中：

1. For 流程控制接收三个参数：

   - 第一个参数：起始值（包含）
   - 第二个参数：结束值（不包含）
   - 第三个参数：处理器配置

2. 示例将遍历 0 到 4 的数值：

   - `::key` 和 `::value` 都是当前的遍历索引值
   - 对每个数值调用 flows.处理数值 处理器
   - 处理器会收到两个相同的参数，例如当遍历到 2 时，两个参数都是 2

3. 实际应用场景：
   - 批量处理固定数量的任务
   - 生成指定范围的数值序列
   - 执行特定次数的操作

## 编写数据流

    数据流用来编排处理器的调用逻辑，支持使用 JavaScirpt 对查询节点数据处理，适用于较为复杂的业务逻辑。
    数据流可以作为处理器使用，命名空间为flows.<处理器名称>；查询节点可以引用除自身以外的其他数据流。
    本章节介绍的编排方法也可用于数据看板、分析图表和数据大屏。

### 数据流描述

使用数据流实现添加一组测试数据。

编写数据流描述文件， `fake.flow.json`，`user.flow.json`，`pet.flow.json`，并放置在应用的 `flows` 目录中。

**描述文件内容:**

fake.flow.json:

```json
{
  "label": "添加测试数据",
  "version": "1.0.0",
  "description": "添加测试数据",
  "nodes": [
    { "name": "用户", "process": "flows.user" },
    { "name": "宠物", "process": "flows.pet" }
  ],
  "output": "DONE"
}
```

user.flow.json:

```json
{
  "label": "用户测试数据",
  "version": "1.0.0",
  "description": "用户测试数据初始化",
  "nodes": [
    {
      "name": "清空默认管理员",
      "process": "models.xiang.user.DestroyWhere",
      "args": [{ "wheres": [{ "column": "status", "value": "enabled" }] }]
    },
    {
      "name": "添加新的管理员",
      "process": "models.xiang.user.EachSave",
      "args": [
        [
          {
            "name": "管理员",
            "type": "admin",
            "email": "yao@iqka.com",
            "password": "A123456p+",
            "key": "8304925176",
            "secret": "XMTdNRVigbgUiAPdiJCfaWgWcz2PaQXw",
            "status": "enabled"
          }
        ]
      ]
    }
  ],
  "output": "{{$res.添加新的管理员}}"
}
```

提示：xiang.user 为内建数据模型，数据表名称为 xiang_user, 用于存放系统管理员账号。

pet.flow.json:

```json
{
  "label": "添加宠物数据",
  "version": "1.0.0",
  "description": "添加宠物数据",
  "nodes": [
    {
      "name": "添加宠物数据",
      "process": "models.pet.Inset",
      "args": [
        ["sn", "name", "type", "desc"],
        [
          ["400001", "球球", "狗", "新成员"],
          ["400002", "旺财", "狗", "新成员"]
        ]
      ]
    }
  ],
  "output": "{{$res.添加宠物数据}}"
}
```

**运行数据流**

```bash
yao run flows.fake
```

### 上下文数据引用

:::v-pre

- 可在全局使用 `{{$in}}` 变量访问调用时的传入参数;
- 可在全局使用 `{{$res}}` 变量访问各点返回值；
- 可在节点使用 `{{$out}}` 变量访问处理器返回值； `outs` 用于字段声明当前节点的返回值, 如不声明返回处理器的运行结果。
- `output` 字段用于声明数据流的输出结果, 如不声明返回所有节点的运行结果。

| 变量       | 类型               | 说明                                                                                                                             | 使用范围                                   | 示例                                                          |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `{{$in}}`  | array<any\>        | 作为处理器被调用时传入的参数表, 支持使用数组下标访问指定参数, 例如： `{{$in.0}}` 第 1 个参数, `{{$in.1}}` 第 2 个参数,           | `nodes[*].args`, `nodes[*].outs`, `output` | `{{$in}}`, `{{$in.0}}`,`{{$in.0.name}}`                       |
| `{{$res}}` | \[key:string\]:any | 查询节点返回值(`nodes[*].outs`) 映射表, 支持使用查询节点名称访问特定查询节点返回值。例如 `{{$res.node1.0}}` node1 的第一返回值。 | `nodes[*].args`, `nodes[*].outs`, `output` | `{{$res}}`, `{{$res.node1.0.name}}`, `{{$res.node2.manu_id}}` |
| `{{$out}}` | any                | 查询节点的处理器(`process`)返回值，支持使用 `.` 访问 Object /Array 数值                                                          | `nodes[*].outs`                            | `{{out}}`, `{{out.name}}`, `{{out.0}}`                        |

:::
提示：如果参数表只有一个参数，且数据类型为映射表 [key:string]:any，则可以通过键名 $in.键名 直接访问输入数据。例如，传入参数为 {"name": "张三"} 时，可以使用 $in.name，访问 "张三" 这个值。

使用数据流查询一组数据。

编写数据流描述文件 `latest.flow.json`，并放置在应用的 `flows` 目录中。

**描述文件内容:**

```json
{
  "label": "查询最新数据",
  "version": "1.0.0",
  "description": "查询系统最新数据",
  "nodes": [
    {
      "name": "宠物",
      "process": "models.pet.Get",
      "args": [
        {
          "select": ["id", "name", "kind", "created_at"],
          "wheres": [{ "column": "kind", "value": "{{$in.0}}" }],
          "orders": [{ "column": "created_at", "option": "desc" }],
          "limit": 10
        }
      ]
    },
    {
      "name": "用户",
      "process": "models.xiang.user.Get",
      "args": [
        {
          "select": ["id", "name", "created_at"],
          "wheres": [{ "column": "status", "value": "enabled" }],
          "orders": [{ "column": "created_at", "option": "desc" }],
          "limit": 1
        }
      ],
      "outs": ["{{$out.0.id}}", "{{$out.0.name}}", "{{$out.0.created_at}}"]
    },
    {
      "name": "打印数据",
      "process": "utils.fmt.Println",
      "args": ["{{$res.宠物}}", "{{$res.用户}}"]
    }
  ],
  "output": {
    "节点返回值": "{{$res}}",
    "参数表": "{{$in}}",
    "宠物列表": "{{$res.宠物}}",
    "用户": "{{$res.用户}}"
  }
}
```

**运行数据流**

```bash
yao run flows.latest 猫
```

---

author: Vincent Wang
contributors: [AbbetWang]

---

## 在 Yao 中使用 MySQL 与 SQLITE

`MYSQL`与`SQLITE`数据库在某些场景有不一致的风险,开发与生产最好使用同一类型的数据库。

### Switch 控件

`Switch`控件在两个数据库下使用需要差异化的配置。

![](../docs/YaoDSL/Xgen/Xgen控件/Switch控件.md)

### 时间格式化函数

MYSQL 使用`DATE_FORMAT`函数

```json
{
  "name": "入库",
  "engine": "xiang",
  "query": {
    "debug": true,
    "select": [
      ":DATE_FORMAT(uptime, '%Y年%m月%d日') as day",
      ":COUNT(id) as 数量"
    ],
    "wheres": [
      { ":uptime": "日期", ">=": "?:$res.日期.from" },
      { ":uptime": "日期", "<=": "?:$res.日期.to" },
      { ":type": "类型", "<=": "入库" }
    ],
    "from": "record",
    "groups": ["day"]
  }
}
```

SQLITE 使用`strftime`函数格式化日期

```json
{
  "name": "入库",
  "engine": "xiang",
  "query": {
    "debug": true,
    "select": [
      ":strftime(uptime, '%Y年%m月%d日') as day",
      ":COUNT(id) as 数量"
    ],
    "wheres": [
      { ":uptime": "日期", ">=": "?:$res.日期.from" },
      { ":uptime": "日期", "<=": "?:$res.日期.to" },
      { ":type": "类型", "<=": "入库" }
    ],
    "from": "record",
    "groups": ["day"]
  }
}
```

### 本文目的为了说明 aes 加解密在 yao 中是如何实现的。

#### model 文件如下

我们只看 mobile 列，很明显 crypt 的属性是"AES",代表该字段进行 AES 加解密。（注：在 yao 中这些过程是自动的，根据源码得知只有在 mysql 中才能生效）

```json
{
  "name": "用户",
  "table": {
    "name": "xiang_user",
    "comment": "用户表",
    "engine": "InnoDB"
  },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "手机号",
      "name": "mobile",
      "type": "string",
      "length": 50,
      "comment": "手机号",
      "index": true,
      "nullable": true,
      "crypt": "AES",
      "validations": [
        {
          "method": "mobile",
          "args": [],
          "message": "{{input}}格式错误"
        }
      ]
    },
    {
      "label": "姓名",
      "name": "name",
      "type": "string",
      "length": 80,
      "comment": "姓名",
      "index": true,
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "minLength",
          "args": [2],
          "message": "{{label}}至少需要2个字"
        },
        {
          "method": "maxLength",
          "args": [40],
          "message": "{{label}}不能超过20个字"
        }
      ]
    },
    {
      "label": "状态",
      "comment": "用户状态 enabled 有效, disabled 无效",
      "name": "status",
      "type": "enum",
      "default": "enabled",
      "option": ["enabled", "disabled"],
      "index": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "enum",
          "args": ["enabled", "disabled"],
          "message": "{{input}}不在许可范围, {{label}}应该为 enabled/disabled"
        }
      ]
    }
  ],
  "relations": {},
  "values": [
    {
      "name": "用户",
      "mobile": "13900001111",
      "status": "enabled"
    }
  ],
  "indexes": [
    {
      "comment": "类型手机号唯一",
      "name": "type_mobile_unique",
      "columns": ["type", "mobile"],
      "type": "unique"
    }
  ],
  "option": { "timestamps": true, "soft_deletes": true }
}
```

#### 实现方法

在新增和修改数据时，会调用 mysql 的内置函数 AES_ENCRYPT。

在读取数据时，会调用 mysql 的内置函数 AES_DECRYPT。

AES_ENCRYPT 和 AES_DECRYPT 是 MySQL 中的两个函数，用于加密和解密数据。它们使用 AES 算法（Advanced Encryption Standard）对数据进行加密和解密。
这些函数需要一个密钥来进行加密和解密。以下是使用 AES_ENCRYPT 和 AES_DECRYPT 的示例：

```sql
-- 加密
SELECT AES_ENCRYPT('mytext', 'mykey');

-- 解密
SELECT AES_DECRYPT('encryptedtext', 'mykey');

```

在上面的示例中，'mytext'是要加密的文本，'encryptedtext'是要解密的加密文本，'mykey'是用于加密和解密的密钥。

在 yao 中，密钥默认是空字符串，通过 YAO_DB_AESKEY 环境变量可以进行设置。

此外，在 yao 中，保存到数据库中的字段会使用 HEX 函数进行转码，所以在数据表中看到的数据，并不是真正的密文，使用 UNHEX 函数转码后才是真正的密文。

## Yao 模型定义指南

### 概述

Yao 模型是 Yao 框架中用于定义业务数据结构的基础组件。通过模型定义，您可以：

1. 描述数据结构（字段类型、关系等）
2. 定义数据验证规则
3. 配置数据库表结构
4. 建立模型间的关系
5. 设置默认值和业务规则

### 文件结构

在 Yao 中，模型配置文件需要保存在应用目录的子目录 `models` 下，如果不存在此目录，需要手工创建。文件命名通常遵循 `modelname.yao` 的格式。如果模型的名称为 `user`，则文件名为 `user.yao`。

模型文件的名称建议使用小写，如果存在下划线或是驼峰的名称，建议使用创建多层目录。比如 `my_name` 模型建议的文件名是 `my/name.yao`，`autoCar` 模型建议的文件名为 `auto/car.yao`。

每一个模型文件在 yao 框架加载后会以文件路径与文件组成一个唯一的标识符，在程序中可以通过这个唯一标识符来引用模型。例如：

- `models/user.yao` 这个文件的模型标识为 `user`。
- `models/my/name.yao` 这个文件的模型标识为 `my.name`。
- `models/auto/car.yao` 这个文件的模型标识为 `auto.car`。

### 文件格式

Yao 中模型定义总是以 `json` 格式编写，如果文件的后缀名是`.jsonc`或是`.yao`，则可以在文件中使用注释。

以下是系统内置模型的示例：

```json
{
  "name": "用户",
  "table": {
    "name": "admin_user",
    "comment": "用户表",
    "engine": "InnoDB"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID"
    },
    {
      "label": "类型",
      "name": "type",
      "type": "enum",
      "option": ["super", "admin", "staff", "user", "robot"],
      "comment": "账号类型 super 超级管理员,admin 管理员, staff 员工, user 用户, robot 机器人",
      "default": "user",
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "enum",
          "args": ["super", "admin", "staff", "user", "robot"],
          "message": "{{input}}不在许可范围, {{label}}应该为 super/admin/staff/user/robot"
        }
      ]
    }
    // 更多字段...
  ],
  "relations": {},
  "values": [
    {
      "name": "管理员",
      "type": "super",
      "email": "xiang@iqka.com",
      "mobile": null,
      "password": "A123456p+",
      "status": "enabled",
      "extra": {
        "sex": "男"
      }
    }
  ],
  "option": {
    "timestamps": true,
    "soft_deletes": true
  }
}
```

### 在 yao 中定义业务模型

在 Yao 中，定义一个业务模型涉及以下几个关键部分：

1. **模型元数据 (`ModelDSL`)**

   - 包括模型的基本信息，如模型名称、描述、数据表选项等。
   - 例如，模型名称 (`name`)、数据表定义 (`table`) 等。

2. **字段定义 (`columns`)**

   - 这些是模型中的具体字段，每个字段包含类型、长度、是否可为空、默认值、校验规则等。
   - 字段类型可以是 `string`, `integer`, `float`, `enum`, `json` 等。

3. **索引定义 (`indexes`)**

   - 定义数据表中的索引，提高查询效率。

4. **映射关系定义 (`relations`)**

   - 定义模型与其他模型之间的关系，如 `hasOne`, `hasMany`, `hasOneThrough` 等。

5. **默认数据 (`values`)**

   - 定义模型的默认数据记录。

6. **配置选项 (`option`)**
   - 包括是否启用时间戳 (`timestamps`)、软删除 (`soft_deletes`) 等配置项。

这个定义包括了模型的名称、数据表信息、字段定义（包括类型、验证规则等）、默认数据以及配置选项。

### Yao 模型字段定义

在 yao 中编写模型配置文件时，列的配置类型可以使用以下的类型设置，这些类型一般会直接翻译成数据库类型。

#### Yao 模型定义中的可使用字段：

| 字段名      | 类型                           | 是否必填项 | 说明                     | 示例                                    |
| ----------- | ------------------------------ | ---------- | ------------------------ | --------------------------------------- |
| name        | string                         | 是         | 字段名称，用于数据库列名 | `"name": "username"`                    |
| label       | string                         | 是         | 字段显示名称             | `"label": "用户名"`                     |
| type        | string                         | 是         | 字段类型                 | `"type": "string"`                      |
| title       | string                         | 否         | 字段标题，用于显示       | `"title": "用户登录名"`                 |
| description | string                         | 否         | 字段描述                 | `"description": "用于系统登录的用户名"` |
| comment     | string                         | 否         | 数据库表字段注释         | `"comment": "用户名，唯一标识"`         |
| length      | number                         | 否         | 字段长度                 | `"length": 255`                         |
| precision   | number                         | 否         | 数字字段精度             | `"precision": 10`                       |
| scale       | number                         | 否         | 数字字段小数位数         | `"scale": 2`                            |
| nullable    | boolean                        | 否         | 是否允许为空             | `"nullable": true`                      |
| option      | list                           | 否         | 枚举类型选项             | `"option": ["A", "B", "C"]`             |
| default     | String&#124;Integer&#124;Float | 否         | 字段默认值               | `"default": "guest"`                    |
| default_raw | string                         | 否         | 数据库函数默认值         | `"default_raw": "NOW()"`                |
| generate    | string                         | 否         | 自动生成值类型           | `"generate": "UUID"`                    |
| crypt       | string                         | 否         | 加密存储方式             | `"crypt": "AES"`                        |
| index       | boolean                        | 否         | 是否创建索引             | `"index": true`                         |
| unique      | boolean                        | 否         | 是否唯一约束             | `"unique": true`                        |
| primary     | boolean                        | 否         | 是否主键                 | `"primary": true`                       |
| origin      | any                            | 否         | 保留字段                 | 未使用                                  |

#### 字符串类型

1. **string**

   - 描述：可变长度字符串
   - 默认长度：200
   - 示例：
     ```json
     {
       "name": "username",
       "type": "string",
       "length": 100,
       "comment": "用户登录名"
     }
     ```

2. **char**
   - 描述：固定长度字符串
   - 必须指定长度
   - 示例：
     ```json
     {
       "name": "status_code",
       "type": "char",
       "length": 2,
       "comment": "状态代码"
     }
     ```

#### 长文本类型

1. **text**

   - 描述：普通文本，最大长度约 65,535 字符
   - 示例：
     ```json
     {
       "name": "description",
       "type": "text",
       "comment": "产品描述"
     }
     ```

2. **mediumText**

   - 描述：中等长度文本，最大长度约 16,777,215 字符
   - 示例：
     ```json
     {
       "name": "content",
       "type": "mediumText",
       "comment": "文章内容"
     }
     ```

3. **longText**
   - 描述：长文本，最大长度约 4,294,967,295 字符
   - 示例：
     ```json
     {
       "name": "log_data",
       "type": "longText",
       "comment": "系统日志"
     }
     ```

#### 二进制类型

1. **binary**
   - 描述：二进制数据
   - 必须指定长度
   - 示例：
     ```json
     {
       "name": "file_data",
       "type": "binary",
       "length": 1024,
       "comment": "文件数据"
     }
     ```

#### 日期与时间类型

1. **date**

   - 描述：日期（YYYY-MM-DD）
   - 示例：
     ```json
     {
       "name": "birthday",
       "type": "date",
       "comment": "出生日期"
     }
     ```

2. **datetime**

   - 描述：日期时间（YYYY-MM-DD HH:MM:SS）
   - 示例：
     ```json
     {
       "name": "created_at",
       "type": "datetime",
       "comment": "创建时间"
     }
     ```

3. **datetimeTz**

   - 描述：带时区的日期时间
   - 示例：
     ```json
     {
       "name": "updated_at",
       "type": "datetimeTz",
       "comment": "更新时间（带时区）"
     }
     ```

4. **time**

   - 描述：时间（HH:MM:SS）
   - 示例：
     ```json
     {
       "name": "start_time",
       "type": "time",
       "comment": "开始时间"
     }
     ```

5. **timestamp**
   - 描述：时间戳
   - 示例：
     ```json
     {
       "name": "last_login",
       "type": "timestamp",
       "comment": "最后登录时间"
     }
     ```

#### 数字类型

1. **有符号整数**

   - tinyInteger：-128 到 127
   - smallInteger：-32,768 到 32,767
   - integer：-2,147,483,648 到 2,147,483,647
   - bigInteger：-9,223,372,036,854,775,808 到 9,223,372,036,854,775,807
   - 示例：
     ```json
     {
       "name": "age",
       "type": "tinyInteger",
       "comment": "用户年龄"
     }
     ```

2. **无符号整数**

   - unsignedTinyInteger：0 到 255
   - unsignedSmallInteger：0 到 65,535
   - unsignedInteger：0 到 4,294,967,295
   - unsignedBigInteger：0 到 18,446,744,073,709,551,615
   - 示例：
     ```json
     {
       "name": "views",
       "type": "unsignedInteger",
       "comment": "浏览次数"
     }
     ```

3. **浮点数**
   - float：单精度浮点数
   - double：双精度浮点数
   - decimal：高精度小数
   - 示例：
     ```json
     {
       "name": "price",
       "type": "decimal",
       "precision": 10,
       "scale": 2,
       "comment": "商品价格"
     }
     ```

#### 布尔类型

- 描述：true/false 值
- 示例：
  ```json
  {
    "name": "is_active",
    "type": "boolean",
    "default": true,
    "comment": "是否激活"
  }
  ```

#### 特殊类型

1. **json**

   - 描述：JSON 格式数据
   - 示例：
     ```json
     {
       "name": "preferences",
       "type": "json",
       "comment": "用户偏好设置"
     }
     ```

2. **uuid**

   - 描述：通用唯一标识符
   - 示例：
     ```json
     {
       "name": "user_uuid",
       "type": "uuid",
       "comment": "用户唯一标识"
     }
     ```

3. **enum**
   - 描述：枚举类型
   - 需要指定 option 列表
   - 示例：
     ```json
     {
       "name": "status",
       "type": "enum",
       "option": ["pending", "approved", "rejected"],
       "comment": "审批状态"
     }
     ```

### 高级字段配置

#### 1. 字段默认值

Yao 支持多种默认值设置方式：

1. **静态默认值**

   ```json
   {
     "name": "status",
     "type": "string",
     "default": "active"
   }
   ```

2. **数据库函数默认值**

   ```json
   {
     "name": "created_at",
     "type": "datetime",
     "default_raw": "NOW()"
   }
   ```

3. **自动生成值**
   ```json
   {
     "name": "uuid",
     "type": "string",
     "generate": "UUID"
   }
   ```

#### 2. 字段加密

对于密码字段，可以使用内置的加密方式来存储敏感信息，例如：

```json
{
  "name": "password",
  "type": "string",
  "crypt": "AES",
  "comment": "加密存储的密码"
}
```

支持的加密方式：

- AES：高级加密标准,只适用于`mysql`数据库
- PASSWORD：单向哈希加密

#### 3. 字段索引

1. **普通索引**

   ```json
   {
     "name": "email",
     "type": "string",
     "index": true
   }
   ```

2. **唯一索引**

   ```json
   {
     "name": "username",
     "type": "string",
     "unique": true
   }
   ```

3. **复合索引**
   在模型配置的 `indexes` 部分定义：
   ```json
   {
     "indexes": [
       {
         "name": "idx_user_status",
         "columns": ["user_id", "status"],
         "unique": false
       }
     ]
   }
   ```

#### 4. 字段验证

Yao 提供了强大的字段验证功能：

1. **基本验证**

   ```json
   {
     "name": "age",
     "type": "integer",
     "validations": [
       {
         "method": "min",
         "args": [18],
         "message": "年龄必须大于18岁"
       }
     ]
   }
   ```

2. **复杂验证**
   ```json
   {
     "name": "password",
     "type": "string",
     "validations": [
       {
         "method": "minLength",
         "args": [8],
         "message": "密码至少8个字符"
       },
       {
         "method": "pattern",
         "args": ["[A-Z]+"],
         "message": "密码必须包含大写字母"
       }
     ]
   }
   ```

### Yao 模型字段校验

有以下的校验方法列表：
yao/yao-app-sources/gou/validation.go

```go
	"typeof":     // 校验数值类型 string, integer, float, number, datetime, timestamp,bool
	"min":        // 最小值
	"max":        // 最大值
	"enum":       // 枚举型
	"pattern":    // 正则匹配
	"minLength":  // 最小长度
	"maxLength":  // 最大长度
	"email":      // 邮箱地址
	"mobile":     // 手机号
```

#### 类型判断，参数是允许的数据类型：string, integer, float, number, datetime, timestamp

```json
{
  "validations": [
    {
      "method": "typeof",
      "args": ["string"],
      "message": "::{{input}} Error, {{label}} should be string"
    }
  ]
}
```

#### 枚举判断，参数是可能的枚举列表

```json
{
  "validations": [
    {
      "method": "enum",
      "args": ["enabled", "disabled"],
      "message": "::{{input}} Error, {{label}} should be enabled/disabled"
    }
  ]
}
```

#### 邮箱地址/电话号码，不需要参数

```json
{
  "validations": [
    {
      "method": "email",
      "args": [],
      "message": "{{input}} should be email"
    },
    {
      "method": "mobile",
      "args": [],
      "message": "{{input}} should be mobile"
    }
  ]
}
```

#### 最小值，最大值判断

```json
{
  "validations": [
    {
      "method": "min",
      "args": [0],
      "message": "{{label}}应大于等于0"
    },
    {
      "method": "max",
      "args": [10],
      "message": "{{label}}应小于等于10"
    }
  ]
}
```

#### 最小长度，最大长度判断

```json
{
  "validations": [
    {
      "method": "minLength",
      "args": [6],
      "message": "{{label}} Error"
    },
    {
      "method": "maxLength",
      "args": [18],
      "message": "{{label}} Error"
    }
  ]
}
```

#### 正则判断，参数是正则表达式，可以替代邮件地址，电话号码的校验

```json
[
  {
    "method": "pattern",
    "args": ["[0-9]+"],
    "message": "{{label}}应该至少包含一个数字"
  },
  {
    "method": "pattern",
    "args": ["[A-Z]+"],
    "message": "{{label}}应该至少包含一个大写字母"
  },
  {
    "method": "pattern",
    "args": ["[a-z]+"],
    "message": "{{label}}应该至少包含一个小写字母"
  },
  {
    "method": "pattern",
    "args": ["[@#$&*]+"],
    "message": "{{label}}应该至少包含一个符号"
  },
  {
    "method": "pattern",
    "args": ["^(\\d{18})|(\\d{14}X)$"],
    "message": "{{label}}身份证格式错误"
  },
  {
    "method": "pattern",
    "args": ["^[0-9A-Za-z@#$&*]{8}$"],
    "message": " {{label}}应该由8位，大小写字母、数字和符号构成"
  },
  {
    "method": "pattern",
    "args": ["^[0-9A-Za-z@#$&*]{32}$"],
    "message": "{{label}}应该由32位，大小写字母、数字和符号构成"
  }
]
```

#### 用户名检验

```json
{
  "label": "姓名",
  "name": "name",
  "type": "string",
  "length": 80,
  "comment": "姓名",
  "index": true,
  "validations": [
    {
      "method": "typeof",
      "args": ["string"],
      "message": "{{input}}类型错误, {{label}}应该为字符串"
    },
    {
      "method": "minLength",
      "args": [2],
      "message": "{{label}}至少需要2个字"
    },
    {
      "method": "maxLength",
      "args": [40],
      "message": "{{label}}不能超过20个字"
    }
  ]
}
```

#### 密码检验

```json
{
  "label": "登录密码",
  "name": "password",
  "type": "string",
  "length": 256,
  "comment": "登录密码",
  "crypt": "PASSWORD",
  "index": true,
  "validations": [
    {
      "method": "typeof",
      "args": ["string"],
      "message": "{{input}}类型错误, {{label}}应该为字符串"
    },
    {
      "method": "minLength",
      "args": [6],
      "message": "{{label}}应该由6-18位，大小写字母、数字和符号构成"
    },
    {
      "method": "maxLength",
      "args": [18],
      "message": "{{label}}应该由6-18位，大小写字母、数字和符号构成"
    },
    {
      "method": "pattern",
      "args": ["[0-9]+"],
      "message": "{{label}}应该至少包含一个数字"
    },
    {
      "method": "pattern",
      "args": ["[A-Z]+"],
      "message": "{{label}}应该至少包含一个大写字母"
    },
    {
      "method": "pattern",
      "args": ["[a-z]+"],
      "message": "{{label}}应该至少包含一个小写字母"
    },
    {
      "method": "pattern",
      "args": ["[@#$&*]+"],
      "message": "{{label}}应该至少包含一个符号"
    }
  ]
}
```

### Yao 模型中的关联关系

理解两个模型之间的关联关系的关键点在于理解模型中的`relations`定义。特别是这两个字段：

- `key` 用于关联映射 (关联数据模型.key = 当前数据模型.foreign)
- `foreign` 用于关联映射 (关联数据模型.key = 当前数据模型.foreign)

定义两个测试模型：

- user model:

```json
{
  "name": "用户",
  "table": { "name": "user", "comment": "用户表" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID", "comment": "ID" },
    {
      "label": "供应商",
      "name": "supplier_id",
      "type": "bigInteger",
      "index": true,
      "comment": "供应商ID"
    },
    {
      "label": "姓名",
      "name": "name",
      "type": "string",
      "index": true,
      "comment": "用户姓名"
    },
    {
      "label": "APPID",
      "name": "app_id",
      "type": "string",
      "length": 10,
      "index": true,
      "comment": "用户姓名"
    }
  ],
  "relations": {
    "one_supplier": {
      "key": "id",
      "foreign": "supplier_id",
      "model": "supplier",
      "type": "hasOne"
    },
    "many_suppliers": {
      "key": "user_id",
      "foreign": "id",
      "model": "supplier",
      "type": "hasMany"
    },
    "apps": {
      "key": "app_id",
      "foreign": "app_id",
      "model": "supplier",
      "type": "hasMany"
    }
  },
  "values": [
    { "id": 1, "supplier_id": 1, "name": "张无忌", "app_id": "123" },
    { "id": 2, "supplier_id": 1, "name": "李光富", "app_id": "456" },
    { "id": 3, "supplier_id": 2, "name": "李木婷", "app_id": "789" },
    { "id": 4, "supplier_id": 2, "name": "赵长青", "app_id": "012" }
  ]
}
```

- supplier model:

```json
{
  "name": "供应商",
  "table": { "name": "supplier", "comment": "供应商表" },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "comment": "ID"
    },
    {
      "label": "名称",
      "name": "name",
      "type": "string",
      "index": true,
      "comment": "供应商名称"
    },
    {
      "label": "APPID",
      "name": "app_id",
      "type": "string",
      "length": 10,
      "index": true,
      "comment": "应用标识"
    },
    {
      "label": "USERID",
      "name": "user_id",
      "type": "bigInteger",
      "length": 10,
      "index": true,
      "comment": "用户姓名"
    }
  ],
  "relations": {
    "users": {
      "key": "supplier_id",
      "foreign": "id",
      "model": "user",
      "type": "hasMany"
    }
  },
  "values": [
    { "id": 1, "name": "象传智慧", "app_id": "456", "user_id": 1 },
    { "id": 2, "name": "Yao App Engine", "app_id": "456", "user_id": 1 }
  ]
}
```

下面从`user`模型看关联关系的定义：

#### 一个用户对应多个供应商

```sh
yao run models.user.Find 1 '::{"withs":{"many_suppliers":{}}}'
```

`user.mod.json`关联关系定义：

```json
{
  "many_suppliers": {
    "key": "user_id",
    "foreign": "id",
    "model": "supplier",
    "type": "hasMany"
  }
}
```

等于筛选条件：`user.id == suppliers.user_id`，`suppliers.user_id`保存了对模型`user.id`的引用。按这个条件可以找到用户对应的多个供应商。使用`hasMany`比较合适

```sh
yao run models.user.Find 1 '::{"withs":{"one_supplier":{}}}'
```

返回结果是数组。

```json
{
  "app_id": "123",
  "id": 1,
  "many_suppliers": [
    {
      "app_id": "456",
      "id": 1,
      "name": "象传智慧",
      "user_id": 1
    },
    {
      "app_id": "456",
      "id": 2,
      "name": "Yao App Engine",
      "user_id": 1
    }
  ],
  "name": "张无忌",
  "supplier_id": 1
}
```

#### 一个用户对应一个供应商

```sh
yao run models.user.Find 1 '::{"withs":{"one_supplier":{}}}'
```

`user.mod.json`关联关系定义：

```json
{
  "one_supplier": {
    "key": "id",
    "foreign": "supplier_id",
    "model": "supplier",
    "type": "hasOne"
  }
}
```

等于筛选条件：`user.supplier_id == supplier.id`。由于 supplier.id 是主键，只可能会有一条记录存在，所有使用 hasOne 比较合适。

结果：只会返回一个供应商。

```json
{
  "app_id": "123",
  "id": 1,
  "name": "张无忌",
  "one_supplier": {
    "app_id": "456",
    "id": 1,
    "name": "象传智慧",
    "user_id": 1
  },
  "supplier_id": 1
}
```

#### 非主键关连关系。

除了使用两个模型的主键来定义模型的关联关系外，还可以使用模型中的非关键字段来定义关系。

模型`user`与`supplier`中都定义了一个`app_id`的字段。

```sh
yao run models.user.Find 2 '::{"withs":{"apps":{}}}'

```

关联关系定义。等于筛选条件：`user.app_id == supplier.app_id`。

```json
{
  "apps": {
    "key": "app_id",
    "foreign": "app_id",
    "model": "supplier",
    "type": "hasMany"
  }
}
```

等于筛选条件`user.app_id == supplier.app_id`,非主键关联，设置类型为`hasMany`。

output:

```sh
{
    "app_id": "456",
    "id": 2,
    "name": "李光富",
    "supplier_id": 1,
    "suppliers": [
        {
            "app_id": "456",
            "id": 1,
            "name": "象传智慧"
        },
        {
            "app_id": "456",
            "id": 2,
            "name": "Yao App Engine"
        }
    ]
}
```

#### 关联关系总结

通过对比一对一与一对多关系的定义发现，灵活的使用`relations.key`与`relations.foreign`。可以达到不同的效果。

如何实现一个供应商对应多个用户呢？在模型`supplier`中定义关联关系即可。

### 最佳实践

1. **命名规范**

   - 使用小写字母和下划线命名表和字段
   - 保持命名一致性（如 created_at 而不是 create_time）
   - 避免使用保留字作为字段名

2. **字段设计**

   - 为每个字段添加注释（comment）
   - 合理设置字段长度（length）
   - 使用合适的字段类型（如 enum 代替字符串表示固定值）
   - 为常用查询字段添加索引

3. **关系设计**

   - 明确关系类型（hasOne/hasMany）
   - 添加外键约束
   - 考虑级联操作（cascade）

4. **性能优化**

   - 避免过度索引
   - 合理使用默认值
   - 考虑数据分区（partitioning）

5. **安全性**

   - 对敏感字段加密（crypt）
   - 使用强验证规则
   - 限制字段长度防止溢出

6. **可维护性**
   - 保持模型文件简洁
   - 使用合理的默认值
   - 添加必要的验证规则

### 常见问题与解决方案

1. **字段类型不匹配**

   - 症状：数据插入失败或查询结果异常
   - 解决方案：检查字段类型定义，确保与数据库类型一致

2. **关系查询失败**

   - 症状：关联查询返回空或错误
   - 解决方案：检查 relations 配置，确保 key 和 foreign 正确

3. **验证规则不生效**

   - 症状：无效数据被插入
   - 解决方案：检查 validations 配置，确保规则正确

4. **性能问题**
   - 症状：查询缓慢
   - 解决方案：添加适当索引，优化查询条件

### 快速参考指南

#### 常用字段类型速查表

| 类型     | 说明      | 示例                                        |
| -------- | --------- | ------------------------------------------- |
| string   | 字符串    | `"type": "string", "length": 255`           |
| integer  | 整数      | `"type": "integer"`                         |
| float    | 浮点数    | `"type": "float"`                           |
| boolean  | 布尔值    | `"type": "boolean"`                         |
| date     | 日期      | `"type": "date"`                            |
| datetime | 日期时间  | `"type": "datetime"`                        |
| json     | JSON 数据 | `"type": "json"`                            |
| enum     | 枚举值    | `"type": "enum", "option": ["A", "B", "C"]` |

#### 常用验证规则速查表

| 规则    | 说明       | 示例                                        |
| ------- | ---------- | ------------------------------------------- |
| typeof  | 类型验证   | `"method": "typeof", "args": ["string"]`    |
| min     | 最小值     | `"method": "min", "args": [0]`              |
| max     | 最大值     | `"method": "max", "args": [100]`            |
| enum    | 枚举验证   | `"method": "enum", "args": ["A", "B"]`      |
| pattern | 正则表达式 | `"method": "pattern", "args": ["^[A-Z]+$"]` |
| email   | 邮箱格式   | `"method": "email"`                         |
| mobile  | 手机号格式 | `"method": "mobile"`                        |

#### 常用关系类型速查表

| 类型          | 说明               | 示例                      |
| ------------- | ------------------ | ------------------------- |
| hasOne        | 一对一             | `"type": "hasOne"`        |
| hasMany       | 一对多             | `"type": "hasMany"`       |
| belongsTo     | 属于               | `"type": "belongsTo"`     |
| hasOneThrough | 通过中间表的一对一 | `"type": "hasOneThrough"` |

#### 常用配置选项

| 选项         | 说明       | 示例                   |
| ------------ | ---------- | ---------------------- |
| timestamps   | 自动时间戳 | `"timestamps": true`   |
| soft_deletes | 软删除     | `"soft_deletes": true` |
| engine       | 数据库引擎 | `"engine": "InnoDB"`   |
| charset      | 字符集     | `"charset": "utf8mb4"` |

### 模型迁移

Yao 提供了强大的模型迁移功能，可以自动同步模型定义到数据库结构。以下是迁移相关的重要概念和操作：

#### 迁移命令

| 命令                           | 说明                     |
| ------------------------------ | ------------------------ |
| `yao migrate`                  | 执行所有未应用的迁移     |
| `yao migrate --reset`          | 重置，删帖所有表后再执行 |
| `yao migrate -n model --reset` | 指定模型进行表应用变更   |

### 模型对应的处理器

当一个模型被定义后，Yao 会自动为其生成一系列处理器（Process），用于执行 CRUD 操作。这些处理器的命名规则遵循一定的模式：`models.<模型ID>.<方法名>`。 例如，对于名为 `category` 的模型，其创建记录的处理器为 `models.category.create`。

下面是一些常见的处理器及其参数表：

备注：**`<ID>` 为 `Model Widget ID`**

| 处理器                           | 参数表                                      | 返回值                     | 说明                                                                                                    |
| -------------------------------- | ------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| models.<ID\>.Find                | `<主键值>,<查询条件>`                       | 单条记录                   | 查询单条记录 [示例](#find)                                                                              |
| models.<ID\>.Get                 | `<主键值>,<查询条件>`                       | 记录数组                   | 根据条件查询, 不分页 [示例](#get)                                                                       |
| models.<ID\>.Paginate            | `<查询条件>,<当前页码>, <每页显示记录数>`   | 分页信息和记录数组         | 根据条件查询, 分页 [示例](#paginate)                                                                    |
| models.<ID\>.Create              | `<记录>`                                    | 新记录主键值               | 创建单条记录, 返回新创建记录 ID [示例](#create)                                                         |
| models.<ID\>.Update              | `<主键值>,<记录>`                           | null                       | 更新单条记录 [示例](#update)                                                                            |
| models.<ID\>.Save                | `<记录>`                                    | 记录主键值                 | 保存单条记录, 不存在创建记录, 存在更新记录, 返回记录 ID [示例](#save)                                   |
| models.<ID\>.Delete              | `<主键值>`                                  | null                       | 删除单条记录(标记删除) [示例](#delete)                                                                  |
| models.<ID\>.Destroy             | `<主键值>`                                  | null                       | 删除单条记录(真删除) [示例](#destroy)                                                                   |
| models.<ID\>.Insert              | `<字段名称数组>, <二维记录值数组>`          | 成功插入行数               | 插入多条记录, 返回插入行数 [示例](#insert)                                                              |
| models.<ID\>.UpdateWhere         | `<查询条件>,<记录>`                         | 成功更新行数               | 根据条件更新记录, 返回更新行数 [示例](#updatewhere)                                                     |
| models.<ID\>.DeleteWhere         | `<查询条件>`                                | 成功删除行数               | 根据条件删除数据, 返回删除行数(标记删除) [示例](#deletewhere)                                           |
| models.<ID\>.DestroyWhere        | `<查询条件>`                                | 成功删除行数               | 根据条件删除数据, 返回删除行数(真删除) [示例](#destroywhere)                                            |
| models.<ID\>.EachSave            | `<记录数组>, <记录(共有字段)>`              | 创建或更新的记录主键值数组 | 保存多条记录, 不存在创建记录, 存在更新记录, 返回记录 ID 集合 [示例](#eachsave)                          |
| models.<ID\>.EachSaveAfterDelete | `<主键值数组>,<记录数组>, <记录(共有字段)>` | 创建或更新的记录主键值数组 | 删除一组给定 ID 的记录后，保存多条记录, 不存在创建, 存在更新, 返回 ID 集合 [示例](#eachsaveafterdelete) |

### 创建数据

#### Create

创建单条记录, 返回新创建记录的主键。

处理器：`models.模型标识.Create`。

- 参数 1：数据记录，示例：`{"name": "用户创建","manu_id": 2,"type": "user"}`

返回新创建的记录 ID。

示例：

```js
const id = Process('models.category.create', {
  parent_id: 1,
  name: '英语'
});
return id;
```

#### Insert

一次性插入多条数据记录，返回插入行数。如果单纯是插入数据，方法 Insert 会比 EachSave 快。

处理器：`models.模型标识.Insert`。

- 参数 1：字段清单集合，一维数组。
- 参数 2：数据记录集合，二维数组。

返回插入行数。

示例：

```javascript
function Insert() {
  return Process(
    'models.category.insert',
    ['parent_id', 'name'],
    [
      [1, '语文'],
      [1, '地理']
    ]
  );
}
```

通常需要配合处理器`utils.arr.split`进行处理。

```js
const data = [
  { parent_id: 1, name: '语文' },
  { parent_id: 1, name: '地理' }
];

// 把对象数组拆分为列数组与值数组
const { columns, values } = Process('utils.arr.split', data);

return Process('models.category.insert', columns, values);
```

### 更新数据

#### Update

根据主键 id 更新单条数据记录。

处理器：`models.模型标识.Update`。

- 参数 1：模型主键 id。
- 参数 2：数据记录, 示例：`{"balance": 200}`。

成功返回`null`。

示例：

```javascript
function Update() {
  return Process('models.category.update', 9, {
    parent_id: 1,
    name: '英语'
  });
}
```

#### UpdateWhere

根据条件更新数据记录, 返回更新行数。

处理器：`models.模型标识.UpdateWhere`。

- 参数 1：查询条件。
- 参数 2：数据记录。

返回更新行数。

示例：

```javascript
function UpdateWhere() {
  return Process(
    'models.category.updatewhere',
    {
      wheres: [{ column: 'parent_id', value: 1 }]
    },
    {
      name: '数学'
    }
  );
}
```

#### Save

创建或更新单条记录。如数据记录中包含 id 则更新，不包含 id 则创建记录；返回创建或更新的记录 ID。

处理器：`models.模型标识.Save`。

- 参数 1：数据记录，示例：`{"name": "用户创建","manu_id": 2,"type": "user"}`。

返回创建或更新的记录 ID。

示例：

```javascript
function Save() {
  return Process('models.category.save', {
    parent_id: 1,
    name: '语文'
  });
}
```

#### EachSave

批量创建或是更新多条记录, 不包含主键字段则创建记录, 存在更新记录。

处理器：`models.模型标识.EachSave`。

- 参数 1：必填项，待保存数据记录集合。
- 参数 2：可选项，共有字段，写入时合并到到每条数据记录；若字段数值为 `$index` 将替换为数据记录集合的 index。

返回创建或更新的记录 ID 集合。

示例：

```js
const ids = Process(
  'models.user.EachSave',
  [{ id: 101, name: '张三' }, { name: '李四' }],
  { manu_id: 2, balance: '$index' }
);
//[101, 107]
return ids;
```

注：每次保存都会调用一次数据库操作。

#### EachSaveAfterDelete

删除并保存数据，删除给定 ID 的记录后，保存多条记录数据, 不包含主键字段则创建记录, 存在更新记录, 返回记录 ID 集合 ，返回创建或更新的记录 ID 集合。

处理器：`models.模型标识.EachSaveAfterDelete`。

- 参数 1：必填项，删除的记录 ID 集合。
- 参数 2：必填项，待保存数据记录集合。
- 参数 3：可选项，共有字段，写入时合并到到每条数据记录；若字段数值为 `$index` 将替换为数据记录集合的 index。

返回创建或更新的记录 ID 集合。

示例：

```js
const ids = Process(
  'models.user.EachSaveAfterDelete',
  [1, 2, 3],
  [{ id: 101, name: '张三' }, { name: '李四' }],
  { manu_id: 2, balance: '$index' }
);
//[101, 107]
return ids;
```

### 删除数据

#### Delete

根据 id 删除数据，如模型定义时未开启 `soft_deletes` 则真删除数据记录。

处理器：`models.模型标识.Delete`。

- 参数 1：数据记录 id。

成功返回`null`。

示例：

```javascript
function deletes() {
  return Process('models.category.delete', 10);
}
```

#### DeleteWhere

根据条件删除数据。

如模型定义时未开启 `soft_deletes` 则真删除数据记录。

处理器：`models.模型标识.DeleteWhere`。

- 参数 1：查询条件, 示例：`{"wheres":[{"column":"name", "value":"张三"}]}`。

返回删除行数。

```javascript
function Deletewhere() {
  return Process('models.category.deletewhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}
```

#### Destroy

根据主键 id 真删除单条数据记录。

处理器：`models.模型标识.Destroy`。

- 参数 1：模型主键 id。

成功返回`null`。

示例：

```javascript
function Destroy() {
  return Process('models.category.destroy', 9);
}
```

#### DestroyWhere

根据条件真删除数据。

处理器：`models.模型标识.DestroyWhere`。

- 参数 1：查询条件，示例：`{"wheres":[{"column":"name", "value":"张三"}]}`。

返回删除行数。

示例：

```javascript
function Destroywhere() {
  return Process('models.category.destroywhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}
```

### 查找数据

#### find

根据主键 id 查询单条记录。

处理器：`models.模型标识.Find`。

- 参数 1：模型主键。
- 参数 2：查询条件。

返回数据记录对象。

AES 字段自动解密。 关联模型作为一个独立字段，字段名称为关联关系名称； hasOne 关联为数据记录 Object , hasMany 关联为数据记录数组 Array\<Object\>,如果存在多个 hasMany 有会异常。

示例：

```javascript
function Find() {
  return Process('models.user.find', 1, {
    withs: { manu: {}, mother: {}, addresses: {} }
  });
}
```

#### get

根据条件查询数据记录, 返回符合条件的结果集。相关于 SQL 中的 select,使用比较频繁的处理器。

处理器：`models.模型标识.Get`。

- 参数 1，查询条件, 示例：`{"wheres":[{"column":"name", "value":"张三"}],"withs":{"manu":{}}}`，查询条件使用是 ![](../docs/YaoDSL/Query/QueryParam语法.md) 结构。

返回符合条件的的数据记录（Key-Value 结构 Object)集合。AES 字段自动解密。 关联模型作为一个独立字段，字段名称为关联关系名称； hasOne 关联为数据记录 Object , hasMany 关联为数据记录数组 Array\<Object\>。

需要注意：如果存在多个 hasMany 有会异常。

示例：

```javascript
function Get() {
  return Process('models.category.get', {
    wheres: [{ column: 'parent_id', value: null }]
  });
}
```

这个处理器返回的结果类型是数组，所以只搜索每一条数据时可以这样使用

```js
//直接返回[0],而不会报错
return Process('models.ai.setting.Get', {
  wheres: [
    {
      Column: 'default',
      Value: true
    },
    {
      Column: 'deleted_at',
      Value: null
    }
  ]
})[0];

//使用解构的方法
const [user] = Process('models.admin.user.get', {
  wheres: [
    { column: 'mobile', value: account },
    { column: 'status', value: '启用' },
    { method: 'orwhere', column: 'email', value: account }
  ],
  limit: 1
});
```

#### Paginate

根据条件查询数据记录, 返回带有分页信息的数据对象。

处理器：`models.模型标识.Paginate`。

- 参数 1：查询条件。
- 参数 2：当前页码。
- 参数 3：每页记录数量。

返回带有分页信息的数据对象，**Object Paginate 数据结构**：

| 字段     | 类型                | 说明                          |
| -------- | ------------------- | ----------------------------- |
| data     | Array\<Object Row\> | 数据记录集合                  |
| next     | Integer             | 下一页，如没有下一页返回 `-1` |
| prev     | Integer             | 上一页，如没有上一页返回 `-1` |
| page     | Integer             | 当前页码                      |
| pagesize | Integer             | 每页记录数量                  |
| pagecnt  | Integer             | 总页数                        |
| total    | Integer             | 总记录数                      |

示例：

```javascript
/**
 * 用户数据分页查询函数
 * 演示如何使用Yao的models.user.Paginate处理器进行分页数据查询
 *
 * @returns {Object} 返回带有分页信息的用户数据对象，包含数据集合和分页信息
 */
function Paginate() {
  return Process(
    'models.user.Paginate', // 调用user模型的Paginate处理器
    {
      select: ['id', 'name', 'mobile', 'status', 'extra'], // 指定需要查询的字段列表
      withs: {
        manu: {}, // 关联查询制造商信息
        mother: {}, // 关联查询母公司信息
        addresses: {} // 关联查询地址信息
      },
      wheres: [
        { column: 'status', value: 'enabled' } // 查询条件：仅查询状态为"enabled"的用户
      ],
      limit: 2 // 限制结果集中的记录数量为2条
    },
    1, // 当前页码：第1页
    2 // 每页记录数量：每页2条记录
  );
}
```

### 总结

此文档介绍了 Yao 模型的定义，还有模型数据操作的处理器。

## 数据处理器与钩子（Data Processors and Hooks）

### 概述

Yao 是一个低代码开发框架，提供了丰富的数据处理能力。本文档详细介绍了 Yao 在模型数据读取与处理方面提供的处理器（Processors）与 API 入口，以及相关的钩子（Hooks）机制。

数据处理器是 Yao 框架中用于操作数据的函数集合，而钩子则允许开发者在数据处理的不同阶段插入自定义逻辑。

### 核心概念

- **处理器（Processor）**：预定义的函数，用于执行特定操作（如查询、创建、更新等）
- **模型（Model）**：对应数据库表的结构定义
- **钩子（Hook）**：在数据处理前后执行的自定义函数，分为 `before` 和 `after` 两种
- **MODEL_ID**：模型的唯一标识符，用于在处理器中引用特定模型

### 模型处理器（Model Processors）

操作模型相当于操作数据库表，每个操作都需要指定模型的 ID（MODEL_ID）。下面按功能分类列出所有模型处理器：

#### 查询操作

```javascript
// 示例：按ID查询用户
const user = Process('models.user.find', 1); // 查询ID为1的用户
```

- **models.MODEL_ID.find**：按主键ID查询单条记录

  - 参数：主键值
  - 返回：单条记录对象

- **models.MODEL_ID.get**：根据条件查询多条记录，不分页

  - 参数：查询条件、字段选择等
  - 返回：记录数组

- **models.MODEL_ID.paginate**：根据条件查询，支持分页

  - 参数：页码、每页数量、查询条件等
  - 返回：分页结果对象（包含数据和分页信息）

- **models.MODEL_ID.selectoption**：获取字段的选项列表，常用于前端下拉菜单
  - 参数：字段名、查询条件等
  - 返回：选项数组

#### 创建与更新操作

```javascript
// 示例：创建新用户
const userId = Process('models.user.create', { name: '张三', age: 25 });
```

- **models.MODEL_ID.create**：创建单条记录

  - 参数：记录数据对象
  - 返回：新创建记录的ID

- **models.MODEL_ID.update**：更新单条记录

  - 参数：主键值、更新数据对象
  - 返回：更新后的记录ID

- **models.MODEL_ID.save**：保存单条记录（不存在则创建，存在则更新）

  - 参数：记录数据对象（需包含主键）
  - 返回：记录ID

- **models.MODEL_ID.insert**：批量一次性保存多条记录

  - 参数：记录数据对象数组
  - 返回：操作影响的行数

- **models.MODEL_ID.updatewhere**：根据条件批量更新记录

  - 参数：查询条件、更新数据对象
  - 返回：更新的行数

- **models.MODEL_ID.eachsave**：批量逐条保存记录

  - 参数：记录数据对象数组
  - 返回：保存的记录ID数组

- **models.MODEL_ID.eachsaveafterdelete**：先删除指定ID的记录，再批量保存
  - 参数：要删除的ID数组、要保存的记录数组
  - 返回：保存的记录ID数组

#### 删除操作

```javascript
// 示例：删除用户
Process('models.user.delete', 1); // 软删除ID为1的用户
```

- **models.MODEL_ID.delete**：软删除单条记录（标记删除）

  - 参数：主键值
  - 返回：删除结果

- **models.MODEL_ID.destroy**：硬删除单条记录（物理删除）

  - 参数：主键值
  - 返回：删除结果

- **models.MODEL_ID.deletewhere**：根据条件软删除记录

  - 参数：查询条件
  - 返回：删除的行数

- **models.MODEL_ID.destroywhere**：根据条件硬删除记录
  - 参数：查询条件
  - 返回：删除的行数

#### 模型管理操作

- **models.MODEL_ID.migrate**：将模型配置同步到数据库（创建或更新表结构）

  - 参数：是否强制删除表数据
  - 返回：迁移结果

- **models.MODEL_ID.load**：从文件或源代码加载模型配置

  - 参数：配置路径或对象
  - 返回：加载结果

- **models.MODEL_ID.reload**：重新加载模型配置

  - 参数：无
  - 返回：加载结果

- **models.MODEL_ID.read**：读取模型元信息

  - 参数：无
  - 返回：模型配置信息

- **models.MODEL_ID.exists**：检查模型是否存在
  - 参数：无
  - 返回：布尔值

### 表单处理器（Form Processors）

表单处理器用于处理与表单相关的数据操作。表单处理器的第一个参数始终是表单ID。值得注意的是，同一个模型可以对应多个不同的表单配置。

> **重要提示**：在表单处理器中，`before` 钩子函数的返回值必须是数组类型。

#### 数据操作处理器

```javascript
// 示例：通过表单创建用户
Process('yao.form.create', 'user', { name: '李四', age: 30 });
```

- **yao.form.create**：创建记录

  - 对应：`models.<MODEL_ID>.Create`
  - 钩子：`before:create`, `after:create`

- **yao.form.delete**：删除记录

  - 对应：`models.<MODEL_ID>.Delete`
  - 钩子：`before:delete`, `after:delete`

- **yao.form.find**：查询单条记录

  - 对应：`models.<MODEL_ID>.Find`
  - 钩子：`before:find`, `after:find`

- **yao.form.save**：保存记录

  - 对应：`models.<MODEL_ID>.Save`
  - 钩子：`before:save`, `after:save`

- **yao.form.update**：更新记录
  - 对应：`models.<MODEL_ID>.Update`
  - 钩子：`before:update`, `after:update`

#### 文件处理器

- **yao.form.upload**：文件上传处理
- **yao.form.download**：文件下载处理

#### UI与配置处理器

- **yao.form.xgen**：生成表单的前端配置
- **yao.form.setting**：读取表单设置
- **yao.form.component**：处理表单组件的操作

#### 配置管理处理器

- **yao.form.load**：从文件或源代码加载表单配置
- **yao.form.reload**：重新加载表单配置
- **yao.form.unload**：从内存中卸载表单配置
- **yao.form.read**：读取表单配置
- **yao.form.exists**：检查表单配置是否存在

#### 表单API端点

表单对应的RESTful API端点列表：

| API路径                                        | 说明           |
| ---------------------------------------------- | -------------- |
| `/api/__yao/form/:id/setting`                  | 获取表单设置   |
| `/api/__yao/form/:id/component/:xpath/:method` | 操作表单组件   |
| `/api/__yao/form/:id/upload/:xpath/:method`    | 表单文件上传   |
| `/api/__yao/form/:id/download/:field`          | 表单文件下载   |
| `/api/__yao/form/:id/find/:primary`            | 按主键查询记录 |
| `/api/__yao/form/:id/save`                     | 保存记录       |
| `/api/__yao/form/:id/create`                   | 创建记录       |
| `/api/__yao/form/:id/insert`                   | 批量插入记录   |
| `/api/__yao/form/:id/delete/:primary`          | 删除记录       |

### 表格处理器（Table Processors）

表格处理器用于处理与表格相关的数据操作。表格处理器的第一个参数始终是表格ID。同一个模型可以对应多个不同的表格配置。

> **重要提示**：在表格处理器中，`before` 钩子函数的返回值必须是数组类型。

#### 创建操作处理器

```javascript
// 示例：通过表格批量创建记录
Process('yao.table.insert', 'users', [
  { name: '王五', age: 28 },
  { name: '赵六', age: 32 }
]);
```

- **yao.table.create**：创建单条记录

  - 对应：`models.<MODEL_ID>.Create`
  - 钩子：`before:create`, `after:create`

- **yao.table.save**：保存单条记录

  - 对应：`models.<MODEL_ID>.Save`
  - 钩子：`before:save`, `after:save`

- **yao.table.insert**：批量插入记录
  - 对应：`models.<MODEL_ID>.Insert`
  - 钩子：`before:insert`, `after:insert`

#### 查询操作处理器

```javascript
// 示例：表格搜索
const results = Process('yao.table.search', 'users', {
  page: 1,
  pagesize: 20,
  where: [['age', '>', 25]]
});
```

- **yao.table.find**：按主键查询单条记录

  - 对应：`models.<MODEL_ID>.Find`
  - 钩子：`before:find`, `after:find`

- **yao.table.get**：按条件查询多条记录

  - 对应：`models.<MODEL_ID>.Get`
  - 钩子：`before:get`, `after:get`

- **yao.table.search**：分页查询
  - 对应：`models.<MODEL_ID>.Paginate`
  - 钩子：`before:search`, `after:search`

#### 更新操作处理器

- **yao.table.update**：更新单条记录

  - 对应：`models.<MODEL_ID>.Update`
  - 钩子：`before:update`, `after:update`

- **yao.table.updatein**：按ID列表批量更新记录

  - 内部调用：`models.<MODEL_ID>.UpdateWhere`
  - 参数1：主键值（单个或逗号分隔的多个）
  - 钩子：`before:update-in`, `after:update-in`

- **yao.table.updatewhere**：按条件更新记录
  - 对应：`models.<MODEL_ID>.UpdateWhere`
  - 钩子：`before:update-where`, `after:update-where`

#### 删除操作处理器

- **yao.table.delete**：删除单条记录

  - 对应：`models.<MODEL_ID>.Delete`
  - 钩子：`before:delete`, `after:delete`

- **yao.table.deletein**：按ID列表批量删除

  - 内部调用：`models.<MODEL_ID>.DeleteWhere`
  - 钩子：`before:delete-in`, `after:delete-in`

- **yao.table.deletewhere**：按条件删除记录
  - 对应：`models.<MODEL_ID>.DeleteWhere`
  - 钩子：`before:delete-where`, `after:delete-where`

#### 特殊功能处理器

- **yao.table.setting**：读取表格设置
- **yao.table.download**：下载文件（注意：文件后缀名有白名单限制）
- **yao.table.export**：导出数据到Excel文件

  - 可指定每次读取的数据量
  - 支持按查询条件筛选导出数据

- **yao.table.component**：读取XGen组件的实际值
- **yao.table.upload**：处理文件上传
- **yao.table.xgen**：读取表格的XGen UI配置

#### 配置管理处理器

- **yao.table.load**：从文件或源代码加载表格配置
- **yao.table.reload**：重新加载表格配置
- **yao.table.unload**：从内存中卸载表格配置
- **yao.table.read**：读取表格配置
- **yao.table.exists**：检查表格配置是否存在

#### 表格API端点

表格对应的RESTful API端点列表：

| API路径                                         | 说明                 |
| ----------------------------------------------- | -------------------- |
| `/api/__yao/table/:id/setting`                  | 获取表格设置         |
| `/api/__yao/table/:id/component/:xpath/:method` | 操作表格组件         |
| `/api/__yao/table/:id/upload/:xpath/:method`    | 表格文件上传         |
| `/api/__yao/table/:id/download/:field`          | 表格文件下载         |
| `/api/__yao/table/:id/search`                   | 分页查询             |
| `/api/__yao/table/:id/get`                      | 按条件查询（不分页） |
| `/api/__yao/table/:id/find/:primary`            | 按主键查询记录       |
| `/api/__yao/table/:id/save`                     | 保存记录             |
| `/api/__yao/table/:id/create`                   | 创建记录             |
| `/api/__yao/table/:id/insert`                   | 批量插入记录         |
| `/api/__yao/table/:id/update/:primary`          | 更新单条记录         |
| `/api/__yao/table/:id/update/in`                | 按ID列表批量更新     |
| `/api/__yao/table/:id/update/where`             | 按条件更新           |
| `/api/__yao/table/:id/delete/:primary`          | 删除单条记录         |
| `/api/__yao/table/:id/delete/in`                | 按ID列表批量删除     |
| `/api/__yao/table/:id/delete/where`             | 按条件删除           |

### 钩子函数的使用

钩子函数是在数据操作前后执行的自定义处理逻辑。Yao提供了两种类型的钩子：

1. **before钩子**：在数据操作前执行，可用于数据验证、转换等
2. **after钩子**：在数据操作后执行，可用于后处理、触发其他操作等

#### 示例：表单钩子函数

```javascript
// 用户表单的before:create钩子
function BeforeCreate(payload) {
  // 处理输入数据
  if (!payload.password) {
    payload.password = '默认密码';
  }

  // 重要：必须返回数组
  return [payload];
}

// 用户表单的after:create钩子
function AfterCreate(id, payload) {
  // 创建后的操作，如发送通知
  Process('scripts.notification.send', id, '用户创建成功');
  return id;
}
```

#### 钩子函数注意事项

- `before` 钩子的返回值必须是数组类型
- 钩子函数可以通过配置文件中的 `hooks` 节点进行定义
- 钩子可用于实现数据验证、权限检查、数据转换等功能

### 总结

Yao 框架提供了丰富的数据处理能力，通过处理器和钩子机制，可以灵活地实现各种数据操作和业务逻辑。开发者可以根据不同的场景选择适合的处理器，并使用钩子函数扩展自定义功能。

## 数据模型

### 目录

- [1. 概述](#1-概述)
- [2. 命名规范](#2-命名规范)
- [3. 文档结构](#3-文档结构)
  - [3.1 基础信息](#31-基础信息)
  - [3.2 数据表](#32-数据表-table)
  - [3.3 字段定义](#33-字段定义-columns)
  - [3.4 索引定义](#34-索引定义-indexes)
  - [3.5 关系映射](#35-关系映射-relations)
  - [3.6 默认数据](#36-默认数据-values)
  - [3.7 配置选项](#37-配置选项-option)
- [4. 查询参数](#4-查询参数-queryparam)
- [5. 处理器](#5-处理器process)
- [6. 完整示例](#6-完整示例)

### 1. 概述

Yao 数据模型是应用的核心组件，它使系统能够：

- **自动数据迁移**：根据模型定义创建和更新数据库表结构
- **元数据原子操作**：提供标准化的数据操作方法
- **数据校验**：基于模型定义进行输入数据的合法性验证
- **自动管理后台**：生成数据管理界面

数据模型将操作方法映射为处理器(`process`)，可在数据流（`Flow`）和接口(`API`)中直接调用。对于使用`golang`开发的业务插件，可通过`Gou`包访问模型方法。

### 2. 命名规范

数据模型使用**小写英文字母**命名的JSON文件：`<name>.mod.json`

| 文件位置        | 文件名        | 模型名称             | 处理器调用方式                        |
| --------------- | ------------- | -------------------- | ------------------------------------- |
| /               | name.mod.json | `name`               | `models.name.<process>`               |
| /group/         | name.mod.json | `group.name`         | `models.group.name.<process>`         |
| /group1/group2/ | name.mod.json | `group1.group2.name` | `models.group1.group2.name.<process>` |

### 3. 文档结构

数据模型定义文件包含以下主要部分：

```json
{
  "name": "用户", // 模型中文名称
  "table": {}, // 数据表定义
  "columns": [], // 字段定义
  "indexes": [], // 索引定义
  "relations": {}, // 关系映射
  "values": [], // 默认数据
  "option": {} // 配置选项
}
```

| 字段      | 类型                  | 说明         | 必填 |
| --------- | --------------------- | ------------ | ---- |
| name      | String                | 模型中文名称 | ✓    |
| table     | Object                | 数据表定义   | ✓    |
| columns   | Array\<Object\>       | 字段定义     | ✓    |
| indexes   | Array\<Object\>       | 索引定义     | ✓    |
| relations | \[key:String\]:Object | 关系映射     | ✗    |
| values    | Array\<Object\>       | 默认数据     | ✗    |
| option    | Object                | 配置选项     | ✗    |

#### 3.1 基础信息

基础信息用于描述模型的元数据，便于在开发平台中管理和检索。

```json
{
  "name": "用户",
  "version": "1.0.0",
  "description": "网站用户元数据模型",
  "author": "开发者姓名",
  "email": "developer@example.com",
  "license": "MIT"
}
```

| 字段        | 类型   | 说明                                                          | 必填 |
| ----------- | ------ | ------------------------------------------------------------- | ---- |
| name        | String | 中文名称                                                      | ✓    |
| version     | String | 遵循[语义化版本](https://semver.org/spec/v2.0.0.html)的版本号 | ✓    |
| description | String | 详细介绍                                                      | ✗    |
| author      | String | 作者                                                          | ✗    |
| email       | String | 联系方式                                                      | ✗    |
| license     | String | 共享协议                                                      | ✗    |
| homepage    | String | 官网                                                          | ✗    |
| tun         | String | 象传智慧共享仓库地址，如`microcity/petstore/user`             | ✗    |

#### 3.2 数据表 `table`

定义模型对应的数据库表结构。

```json
{
  "table": {
    "name": "user", // 表名
    "comment": "用户表", // 表注释
    "engine": "InnoDB" // 数据表引擎(MySQL)
  }
}
```

| 字段    | 类型   | 说明                                      | 必填 |
| ------- | ------ | ----------------------------------------- | ---- |
| name    | String | 数据表名称                                | ✓    |
| comment | String | 数据表注释                                | ✗    |
| engine  | String | 表引擎(MySQL)，可选值：`InnoDB`、`MyISAM` | ✗    |

#### 3.3 字段定义 `columns`

字段定义包含模型的各个属性及其验证规则。

```json
{
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID"
    },
    {
      "label": "用户名",
      "name": "username",
      "type": "string",
      "length": 50,
      "comment": "登录用户名",
      "nullable": false,
      "unique": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "用户名必须是字符串"
        },
        {
          "method": "minLength",
          "args": [3],
          "message": "用户名至少需要3个字符"
        }
      ]
    }
  ]
}
```

##### 字段基本属性

| 字段        | 类型            | 说明                                | 必填 |
| ----------- | --------------- | ----------------------------------- | ---- |
| name        | String          | 字段名称                            | ✓    |
| type        | String          | 字段类型                            | ✓    |
| label       | String          | 显示名称                            | ✓    |
| comment     | String          | 字段注释                            | ✗    |
| length      | Integer         | 字段长度(适用于string等类型)        | ✗    |
| precision   | Integer         | 数值总位数(适用于float等)           | ✗    |
| scale       | Integer         | 小数位位数(适用于float等)           | ✗    |
| option      | Array\<String\> | 枚举类型选项                        | ✗    |
| default     | 任意            | 默认值                              | ✗    |
| default_raw | String          | 原始默认值(支持SQL函数)             | ✗    |
| nullable    | Boolean         | 是否可为空(默认false)               | ✗    |
| index       | Boolean         | 是否为索引(默认false)               | ✗    |
| unique      | Boolean         | 是否为唯一索引(默认false)           | ✗    |
| primary     | Boolean         | 是否为主键(默认false)               | ✗    |
| crypt       | String          | 加密方式，可选值：`AES`、`PASSWORD` | ✗    |
| validations | Array\<Object\> | 验证规则                            | ✗    |

##### 字段类型对照表

| 类型      | 说明       | 参数             | MySQL对应类型                  |
| --------- | ---------- | ---------------- | ------------------------------ |
| string    | 字符串     | length           | VARCHAR(length)                |
| text      | 文本       | -                | TEXT                           |
| integer   | 整型       | -                | INT                            |
| ID/id     | 自增长整型 | -                | BIGINT UNSIGNED AUTO_INCREMENT |
| float     | 浮点数     | precision, scale | FLOAT(precision,scale)         |
| decimal   | 精确小数   | precision, scale | DECIMAL(precision,scale)       |
| boolean   | 布尔型     | -                | BOOLEAN                        |
| enum      | 枚举型     | option           | ENUM(option...)                |
| date      | 日期       | -                | DATE                           |
| datetime  | 日期时间   | -                | DATETIME                       |
| timestamp | 时间戳     | -                | TIMESTAMP                      |
| json/JSON | JSON数据   | -                | JSON                           |

> 完整字段类型列表请参考文档后面的详细说明

##### 数据验证规则

验证规则用于在数据创建和更新时检查字段值的合法性。

```json
{
  "validations": [
    {
      "method": "typeof", // 验证方法
      "args": ["string"], // 方法参数
      "message": "必须是字符串" // 错误提示
    }
  ]
}
```

| 验证方法  | 参数         | 说明         | 示例                                               |
| --------- | ------------ | ------------ | -------------------------------------------------- |
| typeof    | [类型]       | 检查数据类型 | `{"method":"typeof", "args":["integer"]}`          |
| min       | [最小值]     | 最小值检查   | `{"method":"min", "args":[0]}`                     |
| max       | [最大值]     | 最大值检查   | `{"method":"max", "args":[100]}`                   |
| enum      | [选项...]    | 枚举值检查   | `{"method":"enum", "args":["enabled","disabled"]}` |
| pattern   | [正则表达式] | 正则匹配     | `{"method":"pattern", "args":["^1[3-9]\\d{9}$"]}`  |
| minLength | [长度]       | 最小长度     | `{"method":"minLength", "args":[6]}`               |
| maxLength | [长度]       | 最大长度     | `{"method":"maxLength", "args":[18]}`              |
| email     | []           | 邮箱格式     | `{"method":"email", "args":[]}`                    |
| mobile    | [地区]       | 手机号格式   | `{"method":"mobile", "args":["cn"]}`               |

错误消息支持模板变量：

- `{{input}}` - 用户输入的值
- `{{label}}` - 字段标签

##### 字段加密

支持两种加密方式保护敏感数据：

| 加密方式 | 说明                                     | 可逆性 |
| -------- | ---------------------------------------- | ------ |
| AES      | AES加密(需设置环境变量`XIANG_DB_AESKEY`) | 可逆   |
| PASSWORD | 密码哈希加密                             | 不可逆 |

#### 3.4 索引定义 `indexes`

索引用于提高查询性能和保证数据唯一性。

```json
{
  "indexes": [
    {
      "name": "user_email_mobile_unique", // 索引名称
      "type": "unique", // 索引类型
      "columns": ["email", "mobile"], // 索引字段
      "comment": "用户邮箱和手机号唯一" // 索引说明
    }
  ]
}
```

| 字段    | 类型            | 说明                                               | 必填 |
| ------- | --------------- | -------------------------------------------------- | ---- |
| name    | String          | 索引名称(建议格式：字段1*字段2*...\_索引类型)      | ✓    |
| type    | String          | 索引类型：`index`、`unique`、`primary`、`fulltext` | ✓    |
| columns | Array\<String\> | 索引字段名称列表(顺序有关)                         | ✓    |
| comment | String          | 索引注释                                           | ✗    |

#### 3.5 关系映射 `relations`

关系映射定义模型之间的关联关系，支持一对一、一对多、多对多等多种映射方式。

```json
{
  "relations": {
    "profile": {
      // 关联名称
      "type": "hasOne", // 关系类型
      "model": "user_profile", // 关联模型
      "key": "user_id", // 关联模型的关联字段
      "foreign": "id", // 当前模型的关联字段
      "query": {
        // 默认查询参数
        "select": ["avatar", "bio"]
      }
    }
  }
}
```

##### 关系类型

| 关系类型       | 说明       | 用途                 |
| -------------- | ---------- | -------------------- |
| hasOne         | 一对一关系 | 用户-资料、产品-详情 |
| hasMany        | 一对多关系 | 用户-订单、文章-评论 |
| hasOneThrough  | 跨表一对一 | 复杂的间接关联       |
| hasManyThrough | 跨表一对多 | 用户-角色-权限       |

##### 关系定义字段

| 字段    | 类型            | 说明             | 必填         |
| ------- | --------------- | ---------------- | ------------ |
| type    | String          | 关系类型         | ✓            |
| model   | String          | 关联模型名称     | ✓ (简单关系) |
| key     | String          | 关联模型关联字段 | ✓ (简单关系) |
| foreign | String          | 当前模型关联字段 | ✓ (简单关系) |
| query   | Object          | 默认查询参数     | ✗            |
| links   | Array\<Object\> | 多表关联定义     | ✓ (跨表关系) |

##### 实际应用示例

**一对一关系(hasOne):**

```json
{
  "manu": {
    "type": "hasOne",
    "model": "manu",
    "key": "id",
    "foreign": "manu_id",
    "query": { "select": ["name", "short_name"] }
  }
}
```

**一对多关系(hasMany):**

```json
{
  "addresses": {
    "type": "hasMany",
    "model": "address",
    "key": "user_id",
    "foreign": "id",
    "query": {
      "select": ["province", "city", "location"],
      "limit": 20
    }
  }
}
```

#### 3.6 默认数据 `values`

定义模型的初始数据，在首次迁移时自动插入。

```json
{
  "values": [
    {
      "name": "管理员",
      "email": "admin@example.com",
      "password": "Admin@123",
      "type": "admin",
      "status": "enabled"
    }
  ]
}
```

#### 3.7 配置选项 `option`

定义模型的全局配置参数。

```json
{
  "option": {
    "timestamps": true, // 自动添加时间戳字段
    "soft_deletes": true // 启用软删除
  }
}
```

| 选项         | 类型    | 说明                                         |
| ------------ | ------- | -------------------------------------------- |
| timestamps   | Boolean | 添加`created_at`和`updated_at`字段并自动维护 |
| soft_deletes | Boolean | 添加`deleted_at`字段实现软删除功能           |

### 4. 查询参数 `QueryParam`

查询参数用于在关系定义和API调用中描述数据过滤、排序和关联查询条件。

```json
{
  "select": ["id", "name", "mobile"], // 查询字段
  "wheres": [
    // 查询条件
    { "column": "status", "value": "enabled" }
  ],
  "orders": [
    // 排序条件
    { "column": "id", "option": "desc" }
  ],
  "withs": {
    // 关联查询
    "profile": { "select": ["avatar"] }
  },
  "limit": 10, // 返回记录数
  "page": 1, // 页码
  "pagesize": 20 // 每页记录数
}
```

#### 查询条件格式

```json
{
  "wheres": [
    {
      "column": "status", // 字段名
      "value": "enabled", // 匹配值
      "op": "eq", // 操作符(可选,默认eq)
      "method": "where" // 方法(可选,默认where)
    },
    {
      "rel": "profile", // 关联模型名
      "column": "is_verified", // 关联模型字段
      "value": true
    },
    {
      "wheres": [
        // 分组条件(OR)
        { "column": "name", "value": "%张%", "op": "like" },
        { "method": "orwhere", "column": "name", "value": "%李%", "op": "like" }
      ]
    }
  ]
}
```

#### 常用操作符

| 操作符  | 说明       | SQL等价             |
| ------- | ---------- | ------------------- |
| eq      | 等于(默认) | `field = value`     |
| like    | 模糊匹配   | `field LIKE value`  |
| gt      | 大于       | `field > value`     |
| ge      | 大于等于   | `field >= value`    |
| lt      | 小于       | `field < value`     |
| le      | 小于等于   | `field <= value`    |
| in      | 包含       | `field IN (values)` |
| null    | 为空       | `field IS NULL`     |
| notnull | 不为空     | `field IS NOT NULL` |

### 5. 处理器(`process`)

数据模型自动生成以下处理器，可在API和Flow中使用：

| 处理器       | 调用方式                     | 功能                              |
| ------------ | ---------------------------- | --------------------------------- |
| find         | `models.模型名.find`         | 查询单条记录                      |
| get          | `models.模型名.get`          | 按条件查询(不分页)                |
| paginate     | `models.模型名.paginate`     | 按条件查询(分页)                  |
| create       | `models.模型名.create`       | 创建单条记录                      |
| update       | `models.模型名.update`       | 更新单条记录                      |
| save         | `models.模型名.save`         | 保存记录(存在则更新,不存在则创建) |
| delete       | `models.模型名.delete`       | 删除单条记录(软删除)              |
| destroy      | `models.模型名.destroy`      | 删除单条记录(物理删除)            |
| insert       | `models.模型名.insert`       | 批量插入记录                      |
| updatewhere  | `models.模型名.updatewhere`  | 按条件更新记录                    |
| deletewhere  | `models.模型名.deletewhere`  | 按条件删除记录(软删除)            |
| destroywhere | `models.模型名.destroywhere` | 按条件删除记录(物理删除)          |
| eachsave     | `models.模型名.eachsave`     | 批量保存记录                      |

### 6. 完整示例

以下是一个完整的用户模型定义示例：

```json
{
  "name": "用户",
  "table": {
    "name": "user",
    "comment": "用户信息表",
    "engine": "InnoDB"
  },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "用户名",
      "name": "username",
      "type": "string",
      "length": 50,
      "unique": true,
      "comment": "登录用户名",
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{label}}必须是字符串"
        },
        {
          "method": "minLength",
          "args": [3],
          "message": "{{label}}长度至少为3个字符"
        }
      ]
    },
    {
      "label": "密码",
      "name": "password",
      "type": "string",
      "length": 256,
      "comment": "登录密码",
      "crypt": "PASSWORD",
      "validations": [
        {
          "method": "pattern",
          "args": [
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
          ],
          "message": "{{label}}必须包含大小写字母、数字和特殊字符，且长度不少于8位"
        }
      ]
    },
    {
      "label": "状态",
      "name": "status",
      "type": "enum",
      "option": ["active", "inactive", "banned"],
      "default": "inactive",
      "comment": "用户状态",
      "index": true
    }
  ],
  "indexes": [
    {
      "name": "username_status_index",
      "comment": "用户名和状态联合索引",
      "columns": ["username", "status"],
      "type": "index"
    }
  ],
  "relations": {
    "profile": {
      "type": "hasOne",
      "model": "user_profile",
      "key": "user_id",
      "foreign": "id"
    },
    "orders": {
      "type": "hasMany",
      "model": "order",
      "key": "user_id",
      "foreign": "id",
      "query": { "limit": 10 }
    }
  },
  "values": [
    {
      "username": "admin",
      "password": "Admin@123",
      "status": "active"
    }
  ],
  "option": {
    "timestamps": true,
    "soft_deletes": true
  }
}
```

## 数据模型关联

### 基本概念

Yao DSL支持两种数据模型关联类型：

- **hasOne**：一对一关联，表示当前模型的一条记录对应关联模型的一条记录
- **hasMany**：一对多关联，表示当前模型的一条记录对应关联模型的多条记录

通过使用**withs**参数，可以在查询时同时获取关联数据，避免多次查询，提高效率。

### 实例说明

以下我们通过供应商(`supplier`)和用户(`user`)两个模型演示关联关系：

- 一个用户对应一家供应商 (用户 -> 供应商 = hasOne)
- 一家供应商有多个用户 (供应商 -> 用户 = hasMany)

### 数据结构设计

#### 供应商模型 (`supplier`)

**字段结构**：

| 字段 | 标签 | 说明       |
| ---- | ---- | ---------- |
| id   | ID   | 主键       |
| name | 名称 | 供应商名称 |

**示例数据**：

| ID  | 名称           |
| --- | -------------- |
| 1   | 象传智慧       |
| 2   | Yao App Engine |

#### 用户模型 (`user`)

**字段结构**：

| 字段        | 标签          | 说明               |
| ----------- | ------------- | ------------------ |
| id          | ID            | 主键               |
| supplier_id | 所属供应商 ID | 外键，关联供应商表 |
| name        | 姓名          | 用户姓名           |

**示例数据**：

| ID  | supplier_id | name   |
| --- | ----------- | ------ |
| 1   | 1           | 张无忌 |
| 2   | 1           | 李光富 |
| 3   | 2           | 李木婷 |
| 4   | 2           | 赵长青 |

### 模型定义文件

#### 供应商模型定义 (`supplier.mod.json`)

```json
{
  "name": "供应商",
  "table": { "name": "supplier", "comment": "供应商表" },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "comment": "ID"
    },
    {
      "label": "名称",
      "name": "name",
      "type": "string",
      "index": true,
      "comment": "供应商名称"
    }
  ],
  "relations": {
    "users": {
      "name": "users", // 关联名称，查询时通过此名称引用
      "type": "hasMany", // 关系类型：一对多
      "model": "user", // 关联的模型名称
      "key": "supplier_id", // 关联模型中的关联字段
      "foreign": "id", // 当前模型中的关联字段
      "query": { "select": ["id", "name"] } // 默认查询字段
    }
  },
  "values": [
    { "id": 1, "name": "象传智慧" },
    { "id": 2, "name": "Yao App Engine" }
  ]
}
```

#### 用户模型定义 (`user.mod.json`)

```json
{
  "name": "用户",
  "table": { "name": "user", "comment": "用户表" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID", "comment": "ID" },
    {
      "label": "供应商",
      "name": "supplier_id",
      "type": "bigInteger",
      "index": true,
      "comment": "供应商ID"
    },
    {
      "label": "姓名",
      "name": "name",
      "type": "string",
      "index": true,
      "comment": "用户姓名"
    }
  ],
  "relations": {
    "supplier": {
      "name": "supplier", // 关联名称，查询时通过此名称引用
      "type": "hasOne", // 关系类型：一对一
      "model": "supplier", // 关联的模型名称
      "key": "id", // 关联模型中的关联字段
      "foreign": "supplier_id", // 当前模型中的关联字段
      "query": { "select": ["id", "name"] } // 默认查询字段
    }
  },
  "values": [
    { "id": 1, "supplier_id": 1, "name": "张无忌" },
    { "id": 2, "supplier_id": 1, "name": "李光富" },
    { "id": 3, "supplier_id": 2, "name": "李木婷" },
    { "id": 4, "supplier_id": 2, "name": "赵长青" }
  ]
}
```

### 数据表创建

使用以下命令创建数据表：

```bash
yao migrate
```

### 关联关系声明详解

关联关系通过模型定义中的 `relations` 对象声明，支持多个映射关系。

#### 关联关系对象字段说明

| 字段    | 类型   | 必填 | 说明                                            |
| ------- | ------ | ---- | ----------------------------------------------- |
| name    | string | 是   | 关联名称，查询时的引用标识符                    |
| type    | string | 是   | 关系类型：`hasOne`(一对一) 或 `hasMany`(一对多) |
| model   | string | 是   | 关联模型名称                                    |
| key     | string | 是   | 关联模型中用于关联的字段名称                    |
| foreign | string | 是   | 当前模型中用于关联的字段名称                    |
| query   | object | 否   | 关联模型的默认查询条件，可在实际查询时重载      |

### hasOne 关联使用示例

hasOne 表示"拥有一个"关系，如用户拥有一个供应商的关联。

#### 基本查询

查询用户并同时获取供应商信息：

```bash
## 查询ID为1的用户及其供应商信息
yao run models.user.Find 1 '::{"withs":{ "supplier": {} }}'

## 查询所有用户及其供应商信息
yao run models.user.Get '::{"withs":{ "supplier": {} }}'
```

#### 指定关联字段

```bash
## 仅查询供应商的name字段
yao run models.user.Find 1 '::{"withs":{ "supplier": {"query":{ "select":["name"] }} }}'
```

#### 按关联字段条件筛选

```bash
## 查询供应商名称为"Yao App Engine"的用户
yao run models.user.Get '::{"withs":{ "supplier": {} }, "wheres":[{"rel":"supplier", "column":"name", "value":"Yao App Engine" }]}'
```

#### JavaScript中使用关联查询

```javascript
function test() {
  var user = Process('models.user.get', {
    withs: {
      supplier: {
        // 关联供应商表
        query: {
          select: ['name', 'id'] // 指定查询字段
        }
      }
    },
    wheres: [{ column: 'supplier_id', value: 1, op: '=' }], // 查询条件
    orders: [{ column: 'id', option: 'desc' }], // 排序条件
    limit: 1 // 限制返回条数
  });
}
```

### hasMany 关联使用示例

hasMany 表示"拥有多个"关系，如供应商拥有多个用户的关联。

#### 基本查询

```bash
## 查询ID为1的供应商及其所有用户
yao run models.supplier.Find 1 '::{"withs":{ "users": {} }}'

## 查询所有供应商及其所有用户
yao run models.supplier.Get '::{"withs":{ "users": {} }}'
```

#### 指定关联字段

```bash
## 仅查询用户的name字段
yao run models.supplier.Find 1 '::{"withs":{ "users": { "query":{"select":["name"] }} }}'
```

#### 关联数据筛选

```bash
## 查询名为"张无忌"的用户所属的供应商
yao run models.supplier.Find 1 '::{"withs":{ "users": { "wheres":[{"column":"name", "value":"张无忌"}] } }}'
```

### 嵌套关联查询

关联关系支持嵌套查询，可以通过多层 `withs` 参数实现。

#### 多层嵌套示例

```bash
## 查询供应商及其用户，同时查询用户的供应商信息（形成循环引用）
yao run models.supplier.Find 1 '::{"withs":{ "users": { "withs": {"supplier":{} } } }}'

## 查询所有供应商的嵌套数据
yao run models.supplier.Get '::{"withs":{ "users": { "withs": {"supplier":{} } } }}'
```

### 注意事项

1. 嵌套查询可能导致数据量过大，请谨慎使用深层嵌套
2. 关联查询会增加数据库负担，请只查询必要字段
3. 复杂的关联查询建议在后端处理而非直接通过API查询

通过合理使用数据模型关联，可以大幅简化数据查询逻辑，提高开发效率。

## 模型删除数据 (Model Delete)

### 概述

Yao 提供了多种删除数据的方法，支持单条记录删除和批量删除，同时兼容软删除(Soft Delete)和永久删除(Hard Delete)两种模式。本文档详细介绍各种删除方式的特点、参数和使用场景。

### 删除方法概览

| 方法名称     | 功能描述         | 支持软删除 | 使用场景                   |
| ------------ | ---------------- | ---------- | -------------------------- |
| Delete       | 删除单条记录     | ✅ 支持    | 需要保留删除记录的单条删除 |
| Destroy      | 永久删除单条记录 | ❌ 不支持  | 彻底清除数据的单条删除     |
| DeleteWhere  | 条件批量删除     | ✅ 支持    | 需要保留删除记录的批量删除 |
| DestroyWhere | 条件批量永久删除 | ❌ 不支持  | 彻底清除数据的批量删除     |

### 软删除机制

#### 软删除说明

软删除不会真正从数据库中移除数据，而是通过添加删除时间标记（默认字段名`deleted_at`）来标识记录已被"删除"。这些被标记的记录在常规查询中不会被检索到，但仍然保存在数据库中，可以在需要时恢复。

#### 配置软删除

在模型 JSON 定义中启用软删除功能：

```json
{
  "option": {
    "soft_deletes": true // 开启软删除功能
  }
}
```

### 基本用法详解

#### Delete 方法

用于删除单条记录，支持软删除。

**参数说明：**

- 参数1：记录ID或主键值

**返回值：**

- 成功：返回被删除记录的条数（通常为1）
- 失败：抛出异常

**示例代码：**

```javascript
// 通过 ID 删除单条记录
function deleteRecord() {
  // 删除ID为10的记录
  return Process('models.category.delete', 10);
}

// 通过变量传入ID
function deleteById(id) {
  return Process('models.category.delete', id);
}
```

#### Destroy 方法

用于永久删除单条记录，不支持恢复。

**参数说明：**

- 参数1：记录ID或主键值

**返回值：**

- 成功：返回被删除记录的条数（通常为1）
- 失败：抛出异常

**示例代码：**

```javascript
// 永久删除指定 ID 的记录
function destroyRecord() {
  // 永久删除ID为9的记录
  return Process('models.category.destroy', 9);
}

// 在事务中使用永久删除
function destroyWithTransaction(id) {
  const q = new Query();

  // 开始事务
  q.Run({
    sql: {
      stmt: 'START TRANSACTION;'
    }
  });

  let success = true;
  let result;

  try {
    // 执行其他操作...

    // 永久删除记录
    result = Process('models.category.destroy', id);

    // 继续其他操作...
  } catch (err) {
    success = false;
    console.log('永久删除操作失败:', err.message);
  }

  // 根据操作结果提交或回滚
  if (success) {
    q.Run({
      sql: {
        stmt: 'COMMIT;'
      }
    });
    return result;
  } else {
    q.Run({
      sql: {
        stmt: 'ROLLBACK;'
      }
    });
    return { success: false, message: '操作失败，已回滚' };
  }
}
```

#### DeleteWhere 方法

用于条件批量删除记录，支持软删除。

**参数说明：**

- 参数1：查询条件对象，格式为 `{ wheres: [...] }`

**返回值：**

- 成功：返回被删除记录的条数
- 失败：抛出异常

**示例代码：**

```javascript
// 简单条件批量删除
function deleteBySimpleCondition() {
  return Process('models.category.deletewhere', {
    wheres: [
      { column: 'parent_id', value: 4 },
      { column: 'status', value: 'inactive' }
    ]
  });
}

// 使用多种操作符的条件删除
function deleteWithOperators() {
  return Process('models.category.deletewhere', {
    wheres: [
      { column: 'created_at', op: '<', value: '2023-01-01' },
      { column: 'view_count', op: '<=', value: 10 }
    ]
  });
}
```

#### DestroyWhere 方法

用于条件批量永久删除记录，不支持恢复。

**参数说明：**

- 参数1：查询条件对象，格式为 `{ wheres: [...] }`

**返回值：**

- 成功：返回被删除记录的条数
- 失败：抛出异常

**示例代码：**

```javascript
// 条件批量永久删除
function destroyByCondition() {
  return Process('models.category.destroywhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}

// 组合条件永久删除
function destroyWithMultipleConditions() {
  return Process('models.category.destroywhere', {
    wheres: [
      { column: 'status', value: 'archived' },
      { column: 'updated_at', op: '<', value: '2022-01-01' }
    ]
  });
}
```

### 高级用法

#### 复杂条件删除

使用多种条件组合和逻辑操作符实现复杂的删除逻辑。

```javascript
// 使用复杂条件和逻辑操作符
function complexDelete() {
  return Process('models.category.deletewhere', {
    wheres: [
      { column: 'parent_id', op: '>', value: 4 },
      { column: 'created_at', op: '<', value: '2023-01-01' },
      { method: 'or', column: 'status', value: 'archived' },
      {
        method: 'where',
        wheres: [
          { column: 'view_count', op: '<', value: 100 },
          { column: 'is_public', value: true }
        ]
      }
    ]
  });
}
```

#### 嵌套条件删除

使用嵌套条件实现更复杂的逻辑组合。

```javascript
// 使用嵌套条件组合
function nestedConditionDelete() {
  return Process('models.category.deletewhere', {
    wheres: [
      { column: 'status', value: 'published' },
      {
        method: 'where',
        wheres: [
          { method: 'or', column: 'view_count', op: '<', value: 10 },
          { method: 'or', column: 'comment_count', op: '=', value: 0 }
        ]
      }
    ]
  });
}
```

#### 关联删除

删除记录时同时处理关联数据。

```javascript
// 删除分类时同时删除相关书籍
function deleteWithRelated() {
  return Process('models.category.destroywhere', {
    wheres: [{ column: 'id', value: 1 }],
    withs: ['books'] // 同时删除关联的书籍
  });
}

// 删除前检查关联数据
function safeDeleteWithCheck() {
  // 先查询是否有关联数据
  const hasRelated = Process('models.category.find', 1, {
    withs: { books: { select: ['id'], limit: 1 } }
  });

  // 判断是否有关联书籍
  if (hasRelated.books && hasRelated.books.length > 0) {
    throw new Error('该分类下有关联书籍，请先删除或转移书籍');
  }

  // 安全删除
  return Process('models.category.delete', 1);
}
```

### 常见模式与最佳实践

#### 事务中的删除操作

在事务中执行删除操作，确保数据一致性。

```javascript
// 在事务中执行多个删除操作
function transactionalDelete() {
  const q = new Query();

  // 开始事务
  q.Run({
    sql: {
      stmt: 'START TRANSACTION;'
    }
  });

  let hasError = false;
  let categoryResult, tagsResult;

  try {
    // 删除分类
    categoryResult = Process('models.category.delete', 5);

    // 相关数据清理
    tagsResult = Process('models.tag.deletewhere', {
      wheres: [{ column: 'category_id', value: 5 }]
    });
  } catch (err) {
    hasError = true;
    console.log('删除操作失败:', err.message);
  }

  // 根据操作结果提交或回滚事务
  if (hasError) {
    q.Run({
      sql: {
        stmt: 'ROLLBACK;'
      }
    });
    return { success: false, message: '删除操作失败，已回滚' };
  } else {
    q.Run({
      sql: {
        stmt: 'COMMIT;'
      }
    });
    return { success: true, category: categoryResult, tags: tagsResult };
  }
}

// 使用事务进行批量操作的另一个示例
function batchDeleteWithTransaction(ids) {
  const q = new Query();

  // 开始事务
  q.Run({
    sql: {
      stmt: 'START TRANSACTION;'
    }
  });

  let success = true;
  const results = [];

  // 循环删除多个记录
  for (const id of ids) {
    try {
      const result = Process('models.category.delete', id);
      results.push({ id: id, result: result });
    } catch (err) {
      success = false;
      results.push({ id: id, error: err.message });
      break;
    }
  }

  // 根据操作结果提交或回滚
  if (success) {
    q.Run({
      sql: {
        stmt: 'COMMIT;'
      }
    });
    console.log('所有删除操作已提交');
  } else {
    q.Run({
      sql: {
        stmt: 'ROLLBACK;'
      }
    });
    console.log('由于错误，所有删除操作已回滚');
  }

  return { success: success, results: results };
}
```

#### 批量删除与分页处理

处理大量数据删除时的分页处理模式。

```javascript
// 分批删除大量数据
function batchDeleteInChunks() {
  const pageSize = 100;
  let page = 1;
  let totalDeleted = 0;

  // 循环分批删除
  while (true) {
    // 查询一批数据
    const records = Process('models.category.paginate', {
      wheres: [{ column: 'status', value: 'archived' }],
      page: page,
      pagesize: pageSize
    });

    if (!records.data || records.data.length === 0) {
      break; // 没有更多数据，退出循环
    }

    // 提取ID列表
    const ids = records.data.map((item) => item.id);

    // 批量删除
    const result = Process('models.category.destroywhere', {
      wheres: [{ column: 'id', op: 'in', value: ids }]
    });

    totalDeleted += result;
    page++;

    // 可选：添加延迟，减轻数据库压力
    // Process('utils.sleep', 1000); // 暂停1秒
  }

  return totalDeleted;
}
```

### 错误处理与调试

```javascript
// 带错误处理的删除操作
function safeDelete(id) {
  try {
    const result = Process('models.category.delete', id);
    return { success: true, count: result };
  } catch (err) {
    console.log('删除失败:', err.message);
    return { success: false, error: err.message };
  }
}

// 调试模式删除（先查询后删除）
function debugDelete(id) {
  // 先查询记录是否存在
  const record = Process('models.category.find', id);
  if (!record) {
    return { success: false, message: '记录不存在' };
  }

  console.log('准备删除记录:', JSON.stringify(record));

  // 执行删除
  const result = Process('models.category.delete', id);
  return { success: true, deletedRecord: record, result: result };
}
```

### 软删除恢复操作

```javascript
// 恢复软删除的记录
function restoreDeleted(id) {
  // 查询包含已删除记录的数据
  const record = Process('models.category.find', id, {
    with_trashed: true // 包含已软删除的记录
  });

  if (!record) {
    return { success: false, message: '记录不存在' };
  }

  // 检查记录是否被软删除
  if (!record.deleted_at) {
    return { success: false, message: '记录未被删除' };
  }

  // 恢复记录（将 deleted_at 设为 null）
  const result = Process('models.category.save', {
    id: id,
    deleted_at: null
  });

  return { success: true, result: result };
}

// 使用自定义条件查询已删除记录
function queryDeletedRecords() {
  return Process('models.category.get', {
    wheres: [
      { column: 'status', value: 'archived' },
创建文件： `modesl/category.yao`

      { column: 'deleted_at', op: 'notnull' } // 明确查询已软删除的记录
    ]
  });
}
```

### 完整模型定义示例

```json
{
  "name": "书籍分类",
  "table": {
    "name": "category",
    "comment": "书籍分类表"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "comment": "主键",
      "primary": true
    },
    {
      "label": "分类名称",
      "name": "name",
      "type": "string",
      "length": 50,
      "comment": "分类名称",
      "nullable": false,
      "index": true
    },
    {
      "label": "父分类ID",
      "name": "parent_id",
      "type": "integer",
      "comment": "父分类ID，顶级分类为0",
      "default": 0
    },
    {
      "label": "状态",
      "name": "status",
      "type": "string",
      "comment": "状态：published-已发布，draft-草稿，archived-已归档",
      "default": "published"
    },
    {
      "label": "排序",
      "name": "sort",
      "type": "integer",
      "comment": "排序值，越小越靠前",
      "default": 100
    }
  ],
  "relations": {
    "books": {
      "type": "hasMany",
      "model": "book",
      "key": "category_id",
      "foreign": "id"
    }
  },
  "option": {
    "timestamps": true,
    "soft_deletes": true
  },
  "values": [
    { "id": 1, "name": "技术", "parent_id": 0 },
    { "id": 2, "name": "文学", "parent_id": 0 }
  ]
}
```

### 注意事项

1. **软删除特性**：

   - 软删除记录实际上仍然保存在数据库中，只是设置了`deleted_at`不为null
   - 常规查询不会检索软删除的记录，需要使用自定义条件查询
   - 软删除记录占用数据库空间，长期积累可能影响性能

2. **永久删除风险**：

   - Destroy相关方法执行的是真正的DELETE操作，数据无法恢复
   - 建议在执行永久删除前进行确认或数据备份
   - 生产环境中谨慎使用批量永久删除

3. **批量删除注意事项**：

   - 大量数据批量删除可能导致数据库锁定和性能问题
   - 建议使用事务并考虑分批处理
   - 批量删除前先估算影响范围，例如使用count方法

4. **关联数据处理**：

   - 删除记录前应考虑关联数据的处理策略
   - 设置适当的外键约束或在代码中处理关联
   - 可以使用事务确保关联数据一致性

5. **性能优化**：
   - 删除大量数据考虑使用原生SQL或分批处理
   - 定期清理软删除数据可以优化数据库性能
   - 为常用查询条件字段添加适当的索引

### 相关主题

- 模型查询：用于在删除前查询数据
- 模型关联：了解关联数据的处理方式
- 数据库事务：确保数据一致性
- 模型钩子：在删除前后执行自定义逻辑

## 新增数据 save，create，insert

数据模型内置了新增/创建处理器， 这些处理器可用于服务接口(`API`)和数据流(`Flow`)数据新增/创建功能。

### 新建模型

新增`models/category.mod.json`文件,写入以下内容:

```json
{
  "name": "书籍分类",
  "table": {
    "name": "category",
    "comment": "书籍分类"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "comment": "ID",
      "primary": true
    },
    {
      "label": "父级id",
      "name": "parent_id",
      "type": "integer",
      "nullable": true
    },
    {
      "label": "分类名称",
      "name": "name",
      "type": "string",
      "length": 128,
      "index": true
    }
  ],
  "relations": {
    "book": {
      "type": "hasMany",
      "model": "book",
      "key": "category_id",
      "foreign": "id",
      "query": {}
    },
    "parent": {
      "type": "hasOne",
      "model": "category",
      "key": "id",
      "foreign": "parent_id",
      "query": {}
    }
  },
  "option": {
    "timestamps": true,
    "soft_deletes": true
  },
  "values": [
    {
      "id": 1,
      "parent_id": null,
      "name": "文史类"
    },
    {
      "id": 2,
      "parent_id": 1,
      "name": "历史"
    },
    {
      "id": 3,
      "parent_id": 1,
      "name": "古诗"
    },
    {
      "id": 4,
      "parent_id": null,
      "name": "理工类"
    },
    {
      "id": 5,
      "parent_id": 4,
      "name": "数学"
    },
    {
      "id": 6,
      "parent_id": 4,
      "name": "物理"
    }
  ]
}
```

### Save 新增`scripts/test.js`

```javascript
function Save() {
  return Process('models.category.save', {
    parent_id: 1,
    name: '语文'
  });
}
```

### Cearte 新增:

```javascript
function Create() {
  return Process('models.category.create', {
    parent_id: 1,
    name: '英语'
  });
}
```

### Insert 批量新增:

```javascript
function Insert() {
  return Process(
    'models.category.insert',
    ['parent_id', 'name'],
    [
      [1, '语文'],
      [1, '地理']
    ]
  );
}
```

执行 `yao run scripts.test.Save`和`yao run scripts.test.Create`

## 更新数据 save，update，updatewhere

数据模型内置了多种更新处理器，可用于服务接口(`API`)和数据流(`Flow`)中实现数据更新功能。主要包括以下几种更新方式：

- `save`: 保存单条记录，如果记录存在则更新，不存在则创建
- `update`: 更新单条记录，根据主键ID更新
- `updatewhere`: 批量更新记录，根据条件更新多条记录

这些处理器支持关联数据的更新，并会自动处理时间戳、软删除等特性。

### 示例：

#### 新建模型

##### 新增`models/category.mod.json`文件,写入以下内容:

```json
{
  "name": "书籍分类",
  "table": {
    "name": "category",
    "comment": "书籍分类"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "comment": "ID",
      "primary": true
    },
    {
      "label": "父级id",
      "name": "parent_id",
      "type": "integer",
      "nullable": true
    },
    {
      "label": "分类名称",
      "name": "name",
      "type": "string",
      "length": 128,
      "index": true
    }
  ],
  "relations": {
    "book": {
      "type": "hasMany",
      "model": "book",
      "key": "category_id",
      "foreign": "id",
      "query": {}
    },
    "parent": {
      "type": "hasOne",
      "model": "category",
      "key": "id",
      "foreign": "parent_id",
      "query": {}
    }
  },
  "option": {
    "timestamps": true,
    "soft_deletes": true
  },
  "values": [
    {
      "id": 1,
      "parent_id": null,
      "name": "文史类"
    },
    {
      "id": 2,
      "parent_id": 1,
      "name": "历史"
    },
    {
      "id": 3,
      "parent_id": 1,
      "name": "古诗"
    },
    {
      "id": 4,
      "parent_id": null,
      "name": "理工类"
    },
    {
      "id": 5,
      "parent_id": 4,
      "name": "数学"
    },
    {
      "id": 6,
      "parent_id": 4,
      "name": "物理"
    }
  ]
}
```

#### Save 传入 id 则为保存`scripts/test.js`

```javascript
function Save() {
  return Process('models.category.save', {
    id: 6,
    parent_id: 1,
    name: '语文'
  });
}
```

#### Update 更新,第一个参数为 id，第二个参数为更新对象:

```javascript
function Update() {
  return Process('models.category.update', 9, {
    parent_id: 1,
    name: '英语'
  });
}
```

#### UpdateWhere 批量更新

```javascript
function UpdateWhere() {
  return Process(
    'models.category.updatewhere',
    {
      wheres: [{ column: 'parent_id', value: 1 }]
    },
    {
      name: '数学'
    }
  );
}
```

执行以下命令测试更新功能：

```bash
## 测试保存功能
yao run scripts.test.Save

## 测试批量更新
yao run scripts.test.UpdateWhere

## 测试单条更新
yao run scripts.test.Update
```

### 高级用法

#### 1. 关联数据更新

可以在更新时同时更新关联数据：

```javascript
function SaveWithRelation() {
  return Process('models.category.save', {
    id: 6,
    name: '编程语言',
    // 同时更新关联的图书数据
    book: [
      { name: 'Python入门', status: 1 },
      { name: 'JavaScript高级编程', status: 1 }
    ]
  });
}
```

#### 2. 条件更新示例

使用复杂条件进行批量更新：

```javascript
function UpdateWithCondition() {
  return Process(
    'models.category.updatewhere',
    {
      wheres: [
        { column: 'parent_id', value: 4 },
        { method: 'orWhere', column: 'name', value: '%语言%', op: 'like' }
      ]
    },
    {
      status: 0,
      updated_at: new Date().toISOString()
    }
  );
}
```

#### 3. 更新钩子

可以通过定义钩子函数来在更新前后执行自定义逻辑：

```javascript
// hooks/category.js
function BeforeUpdate(payload) {
  // 更新前的处理
  payload.data.updated_by = Process('session.get', 'user_id');
  return payload;
}

function AfterUpdate(payload) {
  // 更新后的处理
  Process('models.log.create', {
    action: 'update',
    model: 'category',
    data: payload
  });
  return payload;
}
```

## pipe

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

### 类型定义

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

### 创建 pipe

#### 创建 pipe 定义

创建一个 pipe 定义，创建 pipe 的方法有两种，一种是直接在目录 pipes 下面创建 pipe 的定义。第二种方法是调用处理器`pipe.create`或是`pipe.createwith`创建并立即执行 pipe,注意这两个处理器创建的 pipe 并不会保存在缓存中，这个跟上面的方法是有区别的。

- `pipes/cli/translator.pip.yao`
- `pipes/web/translator.pip.yao`

这种直接由文件创建的 pipe 会在系统启动时自动加载。但时并不会立即执行，需要调用处理器`pipe.run`或是`pipe.resume`来执行。

使用处理器来调用 pipe.

- pipe.run <pipe_id>
- pipe.resume <pipe_id>
- pipe.resumewith <pipe_id>
- pipe.close <pipe_id>

使用以下的处理器来调用 pipe：
::: v-pre

- `yao run pipes.<Widget.ID> [args...]`,如果用户打断了 pipe 的执行，会返回一个 pipe context id。可以使用这个 id 进行 pipe 的恢复执行。
- `yao run pipe.run <pipe.id> [...args]`
- `yao run pipe.Resume <Context.ID> [args...]`
- `yao run pipe.ResumeWith <Context.ID> '::{"foo":"bar"}' [args...]`
  :::

#### 动态的创建并执行 pipe

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

### 变量引用

在 pipe 中，变量引用遵循以下规则：

#### 节点内部变量

- `$in[index]`：引用节点的输入变量，index 从 0 开始
- `$out[index]`：引用节点的输出变量，index 从 0 开始

#### 节点间变量引用

- 可以通过节点名称引用其他节点的输出，如 `node_name.field_name`
- 在 output 配置中：
  - 可以使用 `$input` 引用 pipe 的输入数据
  - 可以使用 `$out` 引用当前节点的输出
  - 不能使用 `$in` 关键字

#### 全局变量

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

### user-input 节点

当类型为 UI 的节点配置成 cli 类型时，适合于在使用 yao run 命令执行 pipe。遇到 cli 节点时，会变成一个交互界面，程序会等待用户输入。用户退出交互时，需要单独输入一行`exit()`的命令。继续执行其它节点。

当类型不是 cli，而是 web ,会返回一个 resume context，类型为`ResumeContext`,用户可以根据这个 `context.ID` 在下一次调用来恢复执行。比如在 web 端时，会返回一个 resume context,用户可以根据这个上下文信息在下一次请求调用处理器`pipe.Resume context.ID`继续执行。

由于 pipe 是根据 id 保存在内存中。所有 web 请求都会共用一套 pipe,如果是多个人使用，pipe.id 需要根据用户 ID 来区分，这样才能保证不同用户的请求不会互相影响。

## 计划组件

Plan 提供了灵活的任务编排系统，具有共享状态管理和信号控制功能。

### 特性

- 任务排序和并行执行
- 任务间共享状态管理
- 任务生命周期控制（暂停/恢复/停止）
- 基于信号的任务通信
- 可配置的状态检查间隔
- 线程安全操作
- 资源清理管理

### 核心概念

#### Plan

Plan 是一个具有共享状态空间的任务集合。它管理任务的执行顺序和生命周期。

#### Task

Task 是一个工作单元，具有以下特性：

- 可以访问共享状态
- 可以响应控制信号
- 可以与同一顺序的其他任务并行执行
- 可以报告其状态并存储任务特定数据

#### 共享空间

共享空间提供了一个线程安全的存储机制，用于任务之间共享数据和通信。

### API 参考

#### Plan 创建

```typescript
class Plan {
  constructor(id: string) {
    // 初始化计划
  }
}
```

### 类型定义

```typescript
/**
 * 计划或任务的状态
 */
export type PlanStatus =
  | 'created' //初始状态
  | 'running' //任务执行中
  | 'paused' //任务暂停
  | 'completed' //任务成功完成
  | 'failed' //任务执行失败
  | 'destroyed' //任务已终止
  | 'unknown';

/**
 * Plan 类
 */
export declare class Plan {
  /**
   * @param plan_id - 计划ID
   */
  constructor(plan_id: string);

  /**
   * 订阅计划
   * @param key - 要订阅的键
   * @param subscribe_fn - 计划变更时执行的函数
   * @param subscribe_args - 传递给订阅函数的参数,The rest of the arguments are the arguments to the process
   */
  Subscribe(key: string, subscribe_fn: string, ...subscribe_args: any[]): void;

  /**
   * 添加任务到计划
   *
   * will Trigger the TaskStarted signal "TaskStarted"
   * @param task_id - 任务ID
   * @param order - 任务顺序
   * @param task_process - 要执行的任务处理函数,如果是在assitant中，可以直接传入函数。
   * @param task_args - 传递给任务的参数
   */
  Add(
    task_id: string,
    order: number,
    task_process: string,
    ...task_args: any[]
  ): void;

  /**
   * 同步运行计划
   */
  Run(): void;

  /**
   * 释放计划,清空共享空间
   */
  Release(): void;

  /**
   * 获取计划状态和每个任务的状态
   */
  Status(): {
    plan: PlanStatus;
    tasks: Record<string, PlanStatus>;
  };

  /**
   * 获取任务状态
   */
  TaskStatus(task_id: string): PlanStatus;

  /**
   * 获取或设置任务数据，如果未提供数据则返回当前数据，否则设置数据并返回之前的数据
   */
  TaskData(task_id: string, data?: any): any;

  /**
   * 从共享空间获取值
   */
  Get(key: string): any;

  /**
   * 在共享空间中设置值
   */
  Set(key: string, value: any): void;

  /**
   * 从共享空间删除值
   */
  Del(key: string): void;

  /**
   * 清空共享空间
   */
  Clear(): void;
}
```

### 示例

```typescript
import { Plan, time } from '@yao/runtime';

function Test() {
  const namespace = 'scripts.runtime.api.plan';

  //same id with same namespace,will be the same plan
  //同一个id,多次new Plan,会返回同一个plan
  const plan = new Plan('test-plan');
  // 订阅任务的变化
  plan.Subscribe('TaskStarted', `${namespace}.TaskStarted`, 'foo');
  plan.Subscribe('TaskCompleted', `${namespace}.TaskCompleted`, 'foo');
  // 订阅共享空间的变化
  plan.Subscribe('some-key', `${namespace}.SomeKey`, 'bar');

  plan.Add('task-1', 1, `${namespace}.Task1`, 'foo1');
  plan.Add('task-2', 1, `${namespace}.Task2`, 'foo2');
  plan.Add('task-3', 2, `${namespace}.Task3`, 'foo3');
  plan.Add('task-4', 2, `${namespace}.Task4`, 'foo4');
  // 运行计划
  plan.Run();
  // 释放计划,资源，也会触发subscribe事件。
  plan.Release();
  return 'Done';
}

function Task1(plan_id: string, task_id: string, foo: string) {
  const plan = new Plan(plan_id);

  // 更新共享数据，will trigger the SomeKey signal
  plan.Set('some-key', `foo-${foo}`);
  time.Sleep(200);
  const ts = new Date().getTime();
  return ts;
}

function Task2(plan_id: string, task_id: string, foo: string) {
  time.Sleep(300);
  const ts = new Date().getTime();
  return ts;
}

function Task3(plan_id: string, task_id: string, foo: string) {
  const plan = new Plan(plan_id);
  const some = plan.Get('some-key');

  // 更新共享数据
  plan.Set('some-key', `bar-${foo}`);
  time.Sleep(400);
  const ts = new Date().getTime();
  return { ts: ts, shared: some };
}

function Task4(plan_id: string, task_id: string, foo: string) {
  const plan = new Plan(plan_id);
  time.Sleep(500);
  const some = plan.Get('some-key');
  const ts = new Date().getTime();
  return { ts: ts, shared: some };
}

function SomeKey(plan_id: string, key: string, data: any, foo: string) {
  const plan = new Plan(plan_id);
  const ts = new Date().getTime();
  console.log(`SomeKey ${plan_id} ${key} ${JSON.stringify(data)} ${foo} ${ts}`);
  console.log(plan.Status());
}

function TaskStarted(plan_id: string, key: string, data: any, foo: string) {
  const ts = new Date().getTime();
  console.log(
    `TaskStarted ${plan_id} ${key} ${JSON.stringify(data)} ${foo} ${ts}`
  );
}

function TaskCompleted(plan_id: string, key: string, data: any, foo: string) {
  const ts = new Date().getTime();
  console.log(
    `TaskCompleted ${plan_id} ${key} ${JSON.stringify(data)} ${foo} ${ts}`
  );
}
```

### 最佳实践

1. **错误处理**: 始终检查计划操作返回的错误。
2. **信号处理**: 在长时间运行的任务中实现适当的信号处理。
3. **资源清理**: 使用 `stop()` 正确清理资源。
4. **上下文使用**: 在任务实现中尊重上下文取消。
5. **共享状态**: 使用共享空间进行任务通信，而不是外部变量。

### 线程安全

计划组件设计为线程安全：

- 所有计划操作都是同步的
- 共享空间操作受互斥锁保护
- 信号通道是缓冲的，以防止阻塞

### 事件触发

内置事件：

- TaskCompleted：当任务完成时触发
- TaskError：当任务发生错误时触发
- TaskStarted：当任务被添加到计划时触发
- Released：当共享空间中的所有数据被删除时触发

## golang grpc 插件模板

插件使用`grpc`通讯协议。`yao`框架已经把大部分的`grpc`调用逻辑封装好了。插件只需要实现一个`Exec`方法即可。

### 创建插件

下面以一个简单的例子来说明如何编写一个插件。

在应用的根目录或外部目录创建目录`plugins`,再在`plugins`下面创建`demo`目录。这个目录实际上是一个独立的 golang 项目，只需要在`main.go`中实现`Exec`方法即可。

```sh
mkdir -p plugins/demo
touch plugins/demo/main.go
```

代码模板：`plugins/demo/main.go`

```go
package main

//插件模板
import (
	"encoding/json"
	"io"
	"os"
	"path"

	"github.com/hashicorp/go-hclog"
	"github.com/yaoapp/kun/grpc"
)

// 定义插件类型，包含grpc.Plugin
type DemoPlugin struct{ grpc.Plugin }

// 设置插件日志到单独的文件
func (demo *DemoPlugin) setLogFile() {
	var output io.Writer = os.Stdout
	//开启日志
	logroot := os.Getenv("GOU_TEST_PLG_LOG")
	if logroot == "" {
		logroot = "./logs"
	}
	if logroot != "" {
		logfile, err := os.OpenFile(path.Join(logroot, "plugin.log"), os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
		if err == nil {
			output = logfile
		}
	}
	demo.Plugin.SetLogger(output, grpc.Trace)
}

// 插件执行需要实现的方法
// 参数name是在调用插件时的方法名，比如调用插件demo的Hello方法是的规则是plugins.demo.Hello时。
//
// 注意：name会自动的变成小写
//
// args参数是一个数组，需要在插件中自行解析。判断它的长度与类型，再转入具体的go类型。
//
// Exec 插件入口函数
func (demo *DemoPlugin) Exec(name string, args ...interface{}) (*grpc.Response, error) {
	demo.Logger.Log(hclog.Trace, "plugin method called", name)
	demo.Logger.Log(hclog.Trace, "args", args)
	var v = make(map[string]interface{})
	switch name {
	case "hello":
		if len(args) < 1 {
			v = map[string]interface{}{"code": 400, "message": "参数不足，需要一个参数"}
			break
		}
		code, ok := args[0].(string)
		if !ok {
			v = map[string]interface{}{"code": 400, "message": "参数的类型需要是字符串", "args": args}
		} else {
			v = map[string]interface{}{"name": "Hello", "value": code}
			v["x1"] = map[string]interface{}{"name": "Hello", "value": code}
		}

	default:
		v = map[string]interface{}{"name": name, "args": args}
	}
	//输出前需要转换成字节
	bytes, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	//设置输出数据的类型
	//支持的类型：map/interface/string/integer,int/float,double/array,slice
	return &grpc.Response{Bytes: bytes, Type: "map"}, nil
}

// 生成插件时函数名修改成main
func main() {

	plugin := &DemoPlugin{}
	plugin.setLogFile()
	grpc.Serve(plugin)
}

// 调试时开启，需要直接调试时修改成main
func debug() {

	plugin := &DemoPlugin{}
	plugin.setLogFile()
	// grpc.Serve(plugin) 不要使用server
	plugin.Exec("hello", "world")//普通的go程序，用于开发调试
}

```

### 插件构建

生成的插件文件的后缀名需要是.so 或是.dll。

```bash
## 切换到插件目录
cd plugins/demo

## 初始化项目
go mod init main

## 下载依赖
go mod tidy

## 构建制品 linux/macox
go build -o ../demo.so .

## 构建制品 windows
## go build -o ../demo.dll .

## linux/macox 增加执行权限
chmod +x ../demo.so

## 切换到yoa应用目录
cd ../../

## 测试插件功能
yao run plugins.demo.Hello "World"

```

## Yao 插件

Yao 插件使用了 grpc 的调用方式。

可以使用 golang 语言或是其它的支持 grpc 的开发语言给 yao 开发插件。

### 插件机制

在 Yao 主程序中通过使用 grpc 的方式调用外部插件。grpc 的调用过程经过封装后，插件开发者不需要完整实现整个 grpc 的处理过程，只需要在外部插件的 main.go 中实现插件的处理逻辑即可。在插件的功能会暴露成 Yao 的处理器接口。

版本要求：0.10.3 及以上

### 插件目录设置

在最新的 0.10.3 版本代码中，可以在环境变量或是配置文件中指定插件的外部目录，可以在多个项目中共用同一个插件。

环境变量配置项：`YAO_EXTENSION_ROOT`

```go
type Config struct {
	ExtensionRoot string   `json:"extension_root,omitempty" env:"YAO_EXTENSION_ROOT" envDefault:""` // Plugin, Wasm root PATH, Default is <YAO_ROOT> (<YAO_ROOT>/plugins <YAO_ROOT>/wasms)
}
```

比如需要创建一个名称为 plugin1 的插件,假设这个插件目录结构如下：

```sh
Home
└─ yao
	└─ projects
		└─ ExtensionRoot		// 插件主目录
			└─ plugins			// 必须的目录
				└─ plugin1		// 插件目录
					├── main.go // 插件入口
					└── go.mod  // 插件配置文件

```

需要在`.env`文件中设置环境变量 YAO_EXTENSION_ROOT，指向插件目录。如果配置值为空，即是使用 yao 应用的目录。

```sh
YAO_EXTENSION_ROOT="/Home/yao/projects/ExtensionRoot"
```

### grpc 协议定义：

主要有两个参数：请求与响应，在请求中有 name 与 payload,name 即是处理器名称的后缀部分，payload 是处理器参数，数据格式为 json 文件字节。

响应时需要把返回值转换成字节数据。同时需要指定返回的数据类型 type,yao 会根据返回类型对数据进行反系列化处理。

```sh
syntax = "proto3";
package proto;
option go_package = "./";

message Request {
    string name = 1;
    bytes payload = 2;
}

message Response {
    bytes response = 1;
    string type = 2;
}

service Model {
    rpc Exec( Request ) returns ( Response );
}
```

### 工作原理

在 yao 应用启动时会，扫描插件目录，如果存在.dll 或是.so 文件，会执行这个文件。这个文件必须是可执行文件，虽然后缀名是 dll 或是 so。

插件程度需要启动一个 grpc 服务,并监听一个不重复的 tcp 端口，不能跟其它的 tcp 端口有冲突。另外插件还可以使用 socket 文件的方式具体查看 grpc 插件的的文档[go-plugin](https://github.com/hashicorp/go-plugin)。

yao 应用框架在这里扮演的角色是简化插件的使用流程，让开发者专注于业务逻辑的开发。如果是使用 golang 语言开发，只需要编写对应的处理逻辑的代码，grpc 的启动，插件管理已经封装处理好。

插件示例项目：

### golang 语言：

- [在插件中调用 yao 框架](https://github.com/wwsheng009/yao-plugin-go)
- [在插件中实现 http 请求](https://github.com/wwsheng009/yao-chatgpt/tree/main/plugins/httpx)
- [获取主机的进程或是 os 信息](https://github.com/wwsheng009/yao-plugin-psutil)
- [执行本地或是远程命令](https://github.com/wwsheng009/yao-plugin-command)
- [邮件客户端](https://github.com/wwsheng009/yao-plugin-email)
- ![](../docs/YaoDSL/Plugin/飞书自定义登录.md)

### Rust 语言

- [yao-plugin-rust](https://github.com/wwsheng009/yao-plugin-rust)

### paython

- [yao-plugin-python](https://github.com/wwsheng009/yao-plugin-python)

### nodejs

- [yao-plugin-nodejs](https://github.com/wwsheng009/yao-plugin-nodejs)

### 脚本语言开发

在使用 python 或是 nodejs 脚本语言作插件开发时，还需要实现另外一个 proto 的接口,用于结束 grpc 服务。

```sh
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

syntax = "proto3";
package plugin;
option go_package = "./plugin";

message Empty {
}

// The GRPCController is responsible for telling the plugin server to shutdown.
service GRPCController {
    rpc Shutdown(Empty) returns (Empty);
}
```

在使用脚本语言作为插件时，不能直接调用脚本文件，而是需要一个中间件作为启动器，这个中间件的功能是通过命令的方式调用脚本文件。
比如说在启动 python 插件时就需要以下的命令作为启动器。可以使用 go 编写或是其它能编译成二进制的语言编写。因为 yao 只会有插件目录下查找后缀是 .dll 或是.so 文件

```go
package main

import (
	"fmt"
	"os"
	"os/exec"
)

func main() {
	cmd := exec.Command("plugins/venv/Scripts/python", "plugins/myplugin.py")

	// cmd.Dir = ""
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Start()
	if err != nil {
		fmt.Printf("Start exited with error: %s\n", err.Error())
		os.Exit(1)
	}

	err = cmd.Wait()
	if err != nil {
		fmt.Printf("Wait with error: %s\n", err.Error())
		os.Exit(1)
	}
}

```

### 测试

```sh
yao run plugins.xx.xx

```

### 注意

yao 使用的是`https://github.com/hashicorp/go-plugin`,它的工作原理是在插件启动时会获取标准输出的第一行数据作为通讯协议。

所以，在插件中输出日志不要使用`console.log`或是`print`等函数，而是把日志输出到日志文件中。

## 编写 GRPC 插件

以下内容来源于官方文档

### 编写插件

新建一个 `feishu.go`，实现飞书登录逻辑。

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"

	jsoniter "github.com/json-iterator/go"
	"github.com/yaoapp/kun/any"
	"github.com/yaoapp/kun/grpc"
)

// Feishu
type Feishu struct{ grpc.Plugin }

const appid = "cli_a107a"
const secret = "uRzTSIxWXuA3MqX"

// Exec 读取
func (feishu *Feishu) Exec(name string, args ...interface{}) (*grpc.Response, error) {
	var v interface{}

	switch name {
	case "authurl":
        // 在处理器，传入的是可变数量的参数，需要自行进行参数检查
		if len(args) < 1 {
			v = map[string]interface{}{"code": 400, "message": "缺少回调地址参数", "args": args}
			break
		}
		if len(args) < 2 {
			v = map[string]interface{}{"code": 400, "message": "缺少回调状态参数", "args": args}
			break
		}
		url, ok := args[0].(string)
		if !ok {
			v = map[string]interface{}{"code": 400, "message": "回调地址数据类型错误", "args": args}
		}

		state, ok := args[1].(string)
		if !ok {
			v = map[string]interface{}{"code": 400, "message": "状态参数数据类型错误", "args": args}
		}
		v = AuthURL(url, state)
		break

	case "authback":
		if len(args) < 1 {
			v = map[string]interface{}{"code": 400, "message": "缺少预授权码参数", "args": args}
			break
		}
		if len(args) < 2 {
			v = map[string]interface{}{"code": 400, "message": "缺少回调状态参数", "args": args}
			break
		}

		code, ok := args[0].(string)
		if !ok {
			v = map[string]interface{}{"code": 400, "message": "预授权码数据类型错误", "args": args}
		}

		state, ok := args[1].(string)
		if !ok {
			v = map[string]interface{}{"code": 400, "message": "状态参数数据类型错误", "args": args}
		}

		v = AuthBack(code, state)
		break

	default:
		v = map[string]interface{}{"name": name, "args": args}
	}
	bytes, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	return &grpc.Response{Bytes: bytes, Type: "map"}, nil
}

func main() {
	var output io.Writer = os.Stdout
	plugin := &Feishu{}
	plugin.SetLogger(output, grpc.Trace)
	grpc.Serve(plugin)
}

// AuthURL 登录地址
func AuthURL(redirect string, state string) map[string]interface{} {
	api := fmt.Sprintf(
		"https://open.feishu.cn/open-apis/authen/v1/index?redirect_uri=%s&app_id=%s&state=%s",
		url.QueryEscape(redirect),
		appid,
		state,
	)
	return map[string]interface{}{"url": api}
}

// AuthBack 请求回调
func AuthBack(code string, state string) map[string]interface{} {
	data, err := userToken(code)
	if err != nil {
		return map[string]interface{}{"code": 400, "message": err.Error()}
	}
	return data
}

func appToken() (string, error) {
	body, err := jsoniter.Marshal(map[string]interface{}{
		"app_id":     appid,
		"app_secret": secret,
	})
	if err != nil {
		return "", err
	}

	url := "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err = ioutil.ReadAll(resp.Body) // response body is []byte
	if err != nil {
		return "", err
	}

	res := map[string]interface{}{}
	err = jsoniter.Unmarshal(body, &res)
	if err != nil {
		return "", err
	}

	if res["msg"] != "ok" {
		return "", fmt.Errorf("tenant_access_token 接口返回失败 %s", res["msg"])
	}

	return res["tenant_access_token"].(string), nil

}

// Post 发起请求
func userToken(code string) (map[string]interface{}, error) {

	content, err := jsoniter.Marshal(map[string]interface{}{
		"grant_type": "authorization_code",
		"code":       code,
	})
	if err != nil {
		return nil, err
	}

	url := "https://open.feishu.cn/open-apis/authen/v1/access_token"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(content))
	if err != nil {
		return nil, err
	}

	token, err := appToken()
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body) // response body is []byte

	res := map[string]interface{}{}
	err = jsoniter.Unmarshal(body, &res)
	if err != nil {
		return nil, err
	}

	if res["msg"] != "success" {
		return nil, fmt.Errorf("access_token 接口返回失败 %s", res["msg"])
	}

	return any.Of(res["data"]).MapStr(), nil
}
```

**编译制品**

```bash
go build -o ./feishu.so .
chmod +x ./feishu.so
```

### 使用插件

将插件制品 `feishu.so` 复制到应用 `plugins` 目录

**运行调试**

```bash
yao run plugins.feishu.AuthURL "https://127.0.0.1:5099/xiang/login/user?from=feishu" "login"
```

### 在 scripts 中使用插件

```js
Process('plugins.feishu.AuthURL', redirect, state);
```

## Query flow 绑定变量

在`flow`中使用`query`,并在`query`里引用传入参数或是其它节点的结果时，需要使用前缀\?\: ，而不是`{ {$} }`,因为`{ {} }`代表是的`mysql`中的`json`
注意：只有`sql`中的绑定值才能使用变量，比如`where`条件中的`value`,`like`等。绑定关系是`flow`加载时已经确定好的，不能在运行时进行修改。

```json
{
  "label": "::SAP DATA Fields",
  "version": "1.0.0",
  "description": "GET SAP DataFields",
  "nodes": [
    {
      "name": "dd02t",
      "engine": "xiang",
      "query": {
        "debug": true,
        "select": ["*"],
        "from": "SAPHANADB.DD03VT",
        "wheres": [
          {
            ":DDLANGUAGE": "语言",
            "=": "1"
          },
          {
            ":TABNAME": "表名",
            "like": "?:$in.0"
          }
        ],
        "limit": 100
      }
    }
  ],
  "output": "{{$res}}"
}
```

源代码学习：`gou/query/gou/expression.go`

```go
// parseExpField 解析字段
func (exp *Expression) parseExpField(s string) error {

    // 绑定动态数值
    if strings.HasPrefix(s, "?:") {
        if err := exp.parseExpBindings(); err != nil {
            return err
        }
        return nil
    }
}
```

:::v-pre
`?:`理解为`sql`中的`?`参数，不过`?:`是动态的`SQL`绑定参数，可以绑定`flow`中的`in`参数,这个跟一般的`flow`传入绑定参数`{{$in}}`是两个不同的东西。
:::
比如下面的`flow`定义中，希望动态修改`wheres`条件中的`op`。这是无效的操作，`YAO`框架只会解析字段`value`对应的动态参数，而不会解析其它字段的动态参数。

```json
{
  "label": "类目列表",
  "version": "1.0.0",
  "description": "类目列表",
  "nodes": [
    {
      "name": "类目",
      "engine": "xiang",
      "query": {
        "debug": true,
        "select": [
          "category.id",
          "category.name",
          "category.parent_id",
          "category.category_sn",
          "parent.name as parent_name"
        ],
        "from": "category",
        "wheres": [
          {
            "field": "category.name",
            "op": "?:$in.0.wheres.0.op", // 无效
            "value": "?:$in.0.wheres.0.value" // 有效
          }
        ],
        "limit": 1000
      }
    }
  ],
  "output": { "data": "{{$res.类目树}}" }
}
```

## Flow 处理器与 JSAPI 的区别

### Flows 中查询数据

如果是`Flow`节点定义中的节点里使用`query`中的`sql`指定`sql.stmt`。那么`sql`执行后不会返回结果集。

比如以下的 flow 定义并不会返回想要的数据结果集，而是只会返回一个 locker 对象。

示例：`flows/test1.flow.json`

```json
{
  "name": "Test Select By Statement",
  "nodes": [
    {
      "name": "data",
      "engine": "default",
      "query": {
        "sql": {
          "stmt": "SELECT id,name FROM yao_demo_pet WHERE id = ?",
          "args": ["$in.0"]
        }
      },
      "outs": ["{{$out}}"]
    }
  ],
  "output": "{{$res.data}}"
}
```

测试结果：

```sh
--------------------------------------
[
    {
        "Locker": {}
    }
]
--------------------------------------
```

正确的方法是使用`Flow`中的`query`对象。

示例：`flows/test2.flow.json`

```json
{
  "name": "Test Select",
  "nodes": [
    {
      "name": "data",
      "engine": "default",
      "query": {
        "debug": true,
        "select": ["id", "name"],
        "wheres": [{ ":id": "id", "op": "eq", "value": "?:$in.0" }],
        "from": "yao_demo_pet"
      }
    }
  ],
  "output": "{{$res.data}}"
}
```

```sh
yao run flows.test2 1

args[0]: 1
--------------------------------------
scripts.test.Test2 返回结果
--------------------------------------
[
    {
        "id": 1,
        "name": "Cookie"
    }
]
--------------------------------------
```

这两者有什么区别？

当在 flow 中定义了 `query` 类型的节点后，实际上会解析并统一调用`Query.Run`入口方法。在这个处理方法里，会根据节点配置判断:

- 如果存在`sql`配置，执行 SQL 命令。注意：如果在这里写了获取数据的 select sql 并不会返回数据。
- 如果没有存在`sql`配置，执行 Get 方法，返回数据结果集。
- 如果配置 First 选项，会获取 select 结果的第一条。
- 如果配置了 Page 或是 PageSize，返回分页数据。

源代码学习：`/gou/query/gou/query.go`

```go
// Run 执行查询根据查询条件返回结果
func (gou Query) Run(data maps.Map) interface{} {

    if gou.Page != nil || gou.PageSize != nil {
        return gou.Paginate(data)
    } else if gou.QueryDSL.First != nil {
        return gou.First(data)
    } else if gou.SQL == nil {
        return gou.Get(data) //query节点配置，返回查询数据
    }
    // flow中有定义sql.stmt时会执行以下的逻辑

    sql, bindings := gou.prepare(data)
    qb := gou.Query.New()
    qb.SQL(sql, bindings...)

    // Debug模式 打印查询信息
    if gou.Debug {
        fmt.Println(sql)
        utils.Dump(bindings)
    }

    res, err := qb.DB().Exec(sql, bindings...)//sql.stmt在这里执行了,注意select sql不会返回值。
    if err != nil {
        exception.New("数据查询错误 %s", 500, err.Error()).Throw()
    }
    return res
}
```

### 使用 `jsapi` 执行 SQL 语句

但是我们可以在`jsapi`中直接使用`sql.stmt`语句读取数据。下面的代码是两种不同的读取方法，获取的结果是一样的。

示例：`scripts/test.js`

```js
function Test1(id) {
  const query = new Query('default');
  //use statement
  const data = query.Get({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}

function Test2(id) {
  const query = new Query();
  //use select object
  const data = query.Get({
    select: ['id', 'name'],
    wheres: [{ ':id': 'id', op: 'eq', value: id }],
    from: 'yao_demo_pet',
    limit: 10
  });
  return data;
}
```

返回同样的结果：

```sh
--------------------------------------
[
    {
        "id": 1,
        "name": "Cookie"
    }
]
--------------------------------------
```

为什么在`JS API`中可以使用`stmt`读取数据。实际上，Yao 在`jsapi`中调用 jsapi 的 get 方法时的处理逻辑跟调用`flow`节点是不一样的。

JSAPI 中调用`query.Get`方法时，会直接调用 Gou 模块的`Query.Get`方法，而不是调用`Query.Run`方法。所以即使是在 Get 方法中使用原始的 select sql 语句，也是可以读取到数据。

`/gou/runtime/yao/objects/query.go`

```go
func (obj *QueryOBJ) runQueryGet(iso *v8go.Isolate, info *v8go.FunctionCallbackInfo, param *v8go.Value) (data interface{}, err error) {
	defer func() { err = exception.Catch(recover()) }()
	dsl, input, err := obj.getQueryDSL(info, param)
	if err != nil {
		msg := fmt.Sprintf("Query: %s", err.Error())
		log.Error(msg)
		return nil, err
	}
	data = dsl.Get(input)//js script get call gou.Query.Get
	return obj.response(iso, info, data), err
}

```

当执行`query.Get`方法时，调用的`gou.Query.Get`方法。

```go
// call by js query Query
// Get 执行查询并返回数据记录集合
func (gou Query) Get(data maps.Map) []share.Record {

	res := []share.Record{}
	sql, bindings := gou.prepare(data)
	qb := gou.Query.New()
	gou.SetOffset(qb, data)
	gou.SetLimit(qb, data)

	qb.SQL(sql, bindings...)

	// Debug模式 打印查询信息
	if gou.Debug {
		fmt.Println(sql)
		utils.Dump(bindings)
	}

	rows := qb.MustGet()//重要的区别，即例是stmt语言，也会返回数据。

	// 处理数据
	for _, row := range rows {
		res = append(res, gou.format(row))
	}

	return res
}
```

回到开头，为什么在`Flow`中不能使用`stmt`获取到`select`的结果集，而在`jsapi`中却可以。原因是在`flow`中使用`sql.stmt`等于调用`jsapi`中的`query.Run`方法,用程序来验证一下。

**反过来说，jsapi 的 Run 方法的处理逻辑跟调用 Flow 处理器是一样的。**

示例：`scripts/test.js`

```js
function Test3(id) {
  const query = new Query('default');
  //use query.Run
  const data = query.Run({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}
```

这里获取的结果等于使用`Flow.query.stmt`

```sh
--------------------------------------
{
    "Locker": {}
}
--------------------------------------
```

### 总结

Yao Flow 处理器的功能在 JSAPI 中可以使用 query.Run 方法进行替换。

JSAPI 中`Query.Get`方法可以使用`sql.stmt`，使用原始的 SQL 语句来读取数据。这一点，flow 处理器是无法作到的。

JSAPI 会比 Flow 更灵活，建议使用 JSAPI。

感谢群友"明"。

## jsapi

在 JSAPI 中的参数需要使用 QueryDSL 的语法。

**注意：Where 条件的定义不要跟 QueryParam 搞混了**

### Get 方法

执行 sql 查询,使用 select 参数，返回结果集。

```js
function Get() {
  var query = new Query('query-test');
  var data = query.Get({
    select: ['id', 'name'],
    from: 'queryobj_test'
  });
  return data;
}
```

执行 sql 查询，使用 sql 参数查询原始的 select 语句，返回结果集。

```js
function Test1(id) {
  const query = new Query('default');
  //use statement
  const data = query.Get({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}
```

### First 方法

执行查询，读取每一行数据。

```js
function First() {
  var query = new Query('query-test');
  var data = query.First({
    select: ['id', 'name'],
    from: 'queryobj_test'
  });
  return data;
}
```

### Paginate 方法

分页查询

```js
function Paginate() {
  var query = new Query('query-test');
  var data = query.Paginate({
    select: ['id', 'name'],
    from: 'queryobj_test'
  });
  return data;
}
```

### Run 方法

执行 sql 查询，返回所有的结果，这里跟 GET 方法是一样的。同样这个 Run 方法也等同于定义并调用 Flow 处理器。

```js
function Run() {
  var query = new Query('query-test');
  var data = query.Run({
    select: ['id', 'name'],
    from: 'queryobj_test',
    limit: 1
  });
  return data;
}
```

错误的用法，在 Run 方法中不要使用`sql.stmt`,不会返回数据。

```js
function Test3(id) {
  const query = new Query('default');
  //use query.Run
  const data = query.Run({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}
```

## QueryDSL

Gou Query DSL(Domain Specific Language) 用来描述数据查询条件，适用基于数据库实现的数据分析引擎。

QueryDSL 是 yao 的一个非常重要的功能，一定要掌握。

### QueryDSL 结构定义

Query DSL(Domain Specific Language) 用来描述数据查询条件以及数据结构，适用基于数据库实现的数据分析引擎。

### Object QueryDSL 数据结构

| 字段      | 类型                      | 说明                                                                                                                                         | 必填项 |
| --------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| select    | Array\<Field Expression\> | 选择字段列表                                                                                                                                 | 是     |
| from      | String                    | 查询数据表名称或数据模型                                                                                                                     | 否     |
| wheres    | Array\<Object Where\>     | 数据查询条件                                                                                                                                 | 否     |
| orders    | Array\<Object Order\>     | 排序条件                                                                                                                                     | 否     |
| offset    | Int                       | 记录开始位置                                                                                                                                 | 否     |
| limit     | Int                       | 读取数据的数量                                                                                                                               | 否     |
| page      | Int                       | 分页查询当前页面页码                                                                                                                         | 否     |
| pagesize  | Int                       | 每页读取记录数量                                                                                                                             | 否     |
| data-only | Bool                      | 设定为 `true`, 查询结果为 Array\<Object Record\>; 默认为 `false`, 查询结果为 Array\<Object Paginate\>, 仅在设定 `page` 或 `pagesize`时有效。 | 否     |
| groups    | Array\<Object Group\>     | 聚合字段和统计层级设置。                                                                                                                     | 否     |
| havings   | Array\<Object Having\>    | 聚合查询结果筛选, 仅在设定 `groups` 时有效。                                                                                                 | 否     |
| unions    | Array\<Object QueryDSL\>  | 联合查询。多个查询将结果合并为一张表                                                                                                         | 否     |
| query     | Object QueryDSL           | 子查询。按 QueryDSL 描述查询逻辑，生成一张二维数据表或数值。                                                                                 | 否     |
| joins     | Array\<Object Join\>      | 表连接。连接数据量较大的数据表时 **不推荐使用**。                                                                                            | 否     |
| sql       | Object SQL                | SQL 语句。**非必要，勿使用**。                                                                                                               | 否     |
| comment   | String                    | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                                                                                   | 否     |
| withs     | Object                    | 关联关系现。                                                                                                                                 | 否     |

go 类型声明

```go
// QueryDSL Gou Query Domain Specific Language
type QueryDSL struct {
	Select   []Expression `json:"select"`              // 查询字段列表
	From     *Table       `json:"from,omitempty"`      // 查询数据表名称或数据模型
	Wheres   []Where      `json:"wheres,omitempty"`    // 数据查询条件
	Orders   Orders       `json:"orders,omitempty"`    // 排序条件
	Groups   *Groups      `json:"groups,omitempty"`    // 聚合条件
	Havings  []Having     `json:"havings,omitempty"`   // 聚合查询结果筛选条件
	First    interface{}  `json:"first,omitempty"`     // 限定读取单条数据
	Limit    interface{}  `json:"limit,omitempty"`     // 限定读取记录的数量
	Offset   interface{}  `json:"offset,omitempty"`    // 记录开始位置
	Page     interface{}  `json:"page,omitempty"`      // 分页查询当前页面页码
	PageSize interface{}  `json:"pagesize,omitempty"`  // 每页读取记录的数量
	DataOnly interface{}  `json:"data-only,omitempty"` // 设定为 true, 查询结果为 []Record; 设定为 false, 查询结果为 Paginate
	Unions   []QueryDSL   `json:"unions,omitempty"`    // 联合查询
	SubQuery *QueryDSL    `json:"query,omitempty"`     // 子查询
	Alias    string       `json:"name,omitempty"`      // 子查询别名
	Joins    []Join       `json:"joins,omitempty"`     // 表连接
	SQL      *SQL         `json:"sql,omitempty"`       // SQL语句
	Comment  string       `json:"comment,omitempty"`   // 查询条件注释
	Debug    bool         `json:"debug,omitempty"`     // 是否开启调试(开启后计入查询日志)
}
```

### Object Where 数据结构

特别需要注意的是字段表达式是`field`，不是`column`,这里跟 `QueryParam` 是不一样的。

| 字段    | 类型                  | 说明                                                                         | 必填项 |
| ------- | --------------------- | ---------------------------------------------------------------------------- | ------ |
| field   | Field Expression      | 字段表达式，不支持设置别名 `as`                                              | 是     |
| value   | Any                   | 匹配数值。如果数据类型为 `Field Expression`, 用 `{}` 包括，如 `{updated_at}` | 否     |
| op      | String                | 匹配关系运算符。许可值 `=`,`like`,`in`,`>` 等，默认为 `=`                    | 否     |
| or      | Bool                  | `true` 查询条件逻辑关系为 `or`, 默认为 `false` 查询条件逻辑关系为 `and`      | 否     |
| wheres  | Array\<Object Where\> | 分组查询。用于 `condition 1` `and` ( `condition 2` OR `condition 3`) 的场景  | 否     |
| query   | Object QueryDSL       | 子查询；如设定 `query` 则忽略 `value` 数值。                                 | 否     |
| comment | String                | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                   | 否     |

### 在`Flow`中使用`QueryDsl`

使用`debug=true`调试 sql

### 在`JsAPI`中使用`QueryDsl`

在 jsapi 中使用 query 的方法是构建一个新的 Query 对象。构建 Query 对象时可以传入 Engine id 使用不同数据库的 connector,默认是`default`。
query 对象有以下的方法：

- Get，执行查询并返回数据记录集合，不分页，这里也可以使用 stmt 来读取数据库数据。
- Paginate，执行查询并返回带分页信息的数据记录数组。
- First,执行查询并返回一条数据记录。
- Run,执行查询根据查询条件返回结果,调用的是 db.exec 不能返回数据记录,与 flow 中使用 stmt 效果一样。

定义 Query 对象

```js
// var query = new Query("engine")
// query.Get({"select":["id"], "from":"user", "limit":1})
// query.Paginate({"select":["id"], "from":"user"})
// query.First({"select":["id"], "from":"user"})
// query.Run({"stmt":"show version"})
function query() {
  const query = new Query();
  //等于
  const query = new Query('default');
  //另外一个connector
  const query = new Query('pg-connect');
}
```

使用 stmt 读取数据

```js
function Test1(id) {
  const query = new Query('default');
  //use statement
  const data = query.Get({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}
```

使用`debug:true`调试 sql。转换后的 sql 会打印在控制台上。

```javascript
function DD() {
  let qb = new Query();
  return qb.Get({
    debug: true,
    select: ['id', 'name', 'name as label', 'id as value', 'parent_id'],
    wheres: [{ ':deleted_at': '删除', '=': null }],
    from: 'category',
    limit: 1000
  });
}
```

使用 query 简化语法读取数据

在示例项目中经常看到类似的代码：`{ ":deleted_at": "删除", "=": null }`。条件字段使用`:`作为前缀是一种简化写法。等于`{"field":"deleted_at","comment":"删除","op":"=","value":null}`,字段名`deleted_at`,备注是`删除`。操作符是`=`,值是`null`,转换成 sql`where deleted_at = null`。

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: ['id as value', 'name as label'],
    from: 'company'
  });
  return res;
}
```

非简化写法

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    wheres: [{ field: 'deleted_at', comment: '删除', op: '=', value: null }],
    select: ['id as value', 'name as label'],
    from: 'company'
  });
  return res;
}
```

使用数据库函数，使用特定数据库的函数后，代码不再适用所有数据库。

```js
function Data(params) {
  var query = new Query();
  var project = query.Get({
    wheres: [{ ":deleted_at": "删除", "=": null }],
    select: [":COUNT(id) as num"],
    from: "project",
  });
```

在 `from`字段中可以使用前缀`$`引用 model，会自动的解析成表名。

```javascript
function test(id) {
  var query = new Query();
  var data = query.Get({
    select: ['id', 'name', 'kind', 'created_at'],
    from: '$pet',
    wheres: [{ ':kind': '类型', '=': id }],
    orders: 'created_at desc',
    limit: 10
  });
}
```

使用 Paginate 翻页查询。

```js
const qb = new Query();
var res = qb.Paginate({
  debug: true,
  select: [
    'stock.id',
    'stock.uptime',
    'stock.stock',
    ":DATE_FORMAT(stock.uptime, '%Y年%m月%d日 %H:%i:%s') as day",
    'sku.id as sku_id',
    'sku.specs$ as sku_specs',
    'sku.stock as sku_stock',
    'material.id as material_id',
    'material.name as material_name',
    'category.id as category_id',
    'category.name as category_name',
    'warehouse.id as warehouse_id',
    'warehouse.name as warehouse_name'
  ],
  from: 'stock',
  joins: [
    { left: true, from: 'sku', key: 'sku.id', foreign: 'stock.sku_id' },
    {
      left: true,
      from: 'warehouse',
      key: 'warehouse.id',
      foreign: 'stock.warehouse_id'
    },
    {
      left: true,
      from: 'material',
      key: 'material.id',
      foreign: 'sku.material_id'
    },
    {
      left: true,
      from: 'category',
      key: 'category.id',
      foreign: 'material.category_id'
    }
  ],
  wheres: wheres,
  orders: 'stock.uptime desc',
  pagesize: pagesize,
  page: page
});
```

构建树形结构，jsapi 相对于 flow 定义更加灵活，可以动态的构建查询条件。

```js
function Tree(data) {
  var wheres = data.wheres;

  console.log(wheres);
  var search = [{ ':plan.deleted_at': '删除', '=': null }];
  for (var i in wheres) {
    if (wheres[i].column == 'name') {
      search.push({
        ':plan.name': '名称',
        like: '%' + wheres[i].value + '%'
      });
    }
    if (wheres[i].column == 'project_id') {
      search.push({
        ':plan.project_id': '项目',
        in: [wheres[i].value]
      });
    }
  }

  var query = new Query();
  var cate = query.Get({
    debug: true,
    select: [
      'plan.id',
      'plan.users',
      'plan.project_id',
      'plan.user_id',
      'plan.order',
      'plan.name',
      'plan.plan_sn',
      'plan.type',
      'plan.total_number',
      'plan.status',
      'plan.total_money',
      'plan.start_time',
      'plan.end_time',
      'plan.actual_time',
      'plan.parent_id',
      'plan.progress',
      'plan.department',
      'project.name as project_name' //关联表字段
    ],
    wheres: search,
    from: 'plan',
    joins: [
      {
        left: true,
        from: 'project as project',
        key: 'project.id',
        foreign: 'plan.project_id'
      }
    ],
    limit: 1000
  });
  for (var j in cate) {
    if (cate[j].users) {
      var temp = JSON.parse(cate[j].users);
      cate[j].users = temp.join(',');
    }
    if (cate[j].department) {
      var temp2 = JSON.parse(cate[j].department);
      cate[j].department = temp2.join(',');
    }
  }
  res = Process('xiang.helper.ArrayTree', cate, {
    parent: 'parent_id',
    empty: null
  });
  var data = {
    data: res
  };
  return data;
}
```

### Object Where 数据结构

| 字段    | 类型                  | 说明                                                                         | 必填项 |
| ------- | --------------------- | ---------------------------------------------------------------------------- | ------ |
| field   | Field Expression      | 字段表达式，不支持设置别名 `as`                                              | 是     |
| value   | Any                   | 匹配数值。如果数据类型为 `Field Expression`, 用 `{}` 包括，如 `{updated_at}` | 否     |
| op      | String                | 匹配关系运算符。许可值 `=`,`like`,`in`,`>` 等，默认为 `=`                    | 否     |
| or      | Bool                  | `true` 查询条件逻辑关系为 `or`, 默认为 `false` 查询条件逻辑关系为 `and`      | 否     |
| wheres  | Array\<Object Where\> | 分组查询。用于 `condition 1` `and` ( `condition 2` OR `condition 3`) 的场景  | 否     |
| query   | Object QueryDSL       | 子查询；如设定 `query` 则忽略 `value` 数值。                                 | 否     |
| comment | String                | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                   | 否     |

### 查询方法

| 查询方法 | 说明                                  |
| -------- | ------------------------------------- |
| where    | WHERE 字段 = 数值, WHERE 字段 >= 数值 |
| orwhere  | ... OR WHERE 字段 = 数值              |

### 匹配关系运算符

| 运算符    | 说明                             |
| --------- | -------------------------------- |
| `=`       | 默认值 等于 WHERE 字段 = 数值    |
| `>`       | 大于 WHERE 字段 > 数值           |
| `>=`      | 大于等于 WHERE 字段 >= 数值      |
| `<`       | 小于 WHERE 字段 < 数值           |
| `<=`      | 小于等于 WHERE 字段 <= 数值      |
| `like`    | 匹配 WHERE 字段 like 数值        |
| `match`   | 模糊匹配 WHERE 字段 match 数值   |
| `null`    | 为空 WHERE 字段 IS NULL          |
| `notnull` | 不为空 WHERE 字段 IS NOT NULL    |
| `in`      | 列表包含 WHERE 字段 IN (数值...) |

| 匹配关系 | 说明                             |
| -------- | -------------------------------- |
| eq       | 默认值 等于 WHERE 字段 = 数值    |
| like     | 匹配 WHERE 字段 like 数值        |
| gt       | 大于 WHERE 字段 > 数值           |
| ge       | 大于等于 WHERE 字段 >= 数值      |
| lt       | 小于 WHERE 字段 < 数值           |
| le       | 小于等于 WHERE 字段 <= 数值      |
| null     | 为空 WHERE 字段 IS NULL          |
| notnull  | 不为空 WHERE 字段 IS NOT NULL    |
| in       | 列表包含 WHERE 字段 IN (数值...) |
| ne       | 不等于                           |

### 在 SELECT 语句中使用的聚合函数

| 函数             | 参数表                                  | 说明                   | SELECT 示例                                              | 数值                        |
| ---------------- | --------------------------------------- | ---------------------- | -------------------------------------------------------- | --------------------------- |
| SUM()            | [`Field Expression`]                    | 求和                   | `:SUM(amount)` , `:SUM(DISTINCT amount)`                 | `350`, `250`                |
| COUNT()          | [`Field Expression`]                    | 记录行数               | `:COUNT(id)`,`:COUNT(amount)`, `:COUNT(DISTINCT amount)` | `4`,`4`, `2`                |
| AVG()            | [`Field Expression`]                    | 平均数                 | `:AVG(amount)`, `:AVG(DISTINCT amount)`                  | `87.5000`, `125.0000`       |
| MIN()            | [`Field Expression`]                    | 最小值                 | `:MIN(amount)`                                           | `50`                        |
| MAX()            | [`Field Expression`]                    | 最大值                 | `:MAX(amount)`                                           | `200`                       |
| STDDEV_POP()     | [`Field Expression`]                    | 总体标准差             | `:STDDEV_POP(amount)`                                    | `64.9519052838329`          |
| STDDEV_SAMP()    | [`Field Expression`]                    | 样品标准差             | `:STDDEV_SAMP(amount)`                                   | `75`                        |
| VAR_POP()        | [`Field Expression`]                    | 总体方差               | `:VAR_POP(amount)`                                       | `4218.75`                   |
| VAR_SAMP()       | [`Field Expression`]                    | 样品方差               | `:VAR_SAMP(amount)`                                      | `5625`                      |
| JSON_ARRAYAGG()  | [`Field Expression`]                    | 合并为一个 JSON Array  | `:JSON_ARRAYAGG(amount)`                                 | `[50, 50, 50, 200]`         |
| JSON_OBJECTAGG() | [`Field Expression`,`Field Expression`] | 合并为一个 JSON Object | `:JSON_OBJECTAGG(city,price)`                            | `{"上海": 200, "北京": 50}` |

### 版本变更

在 0.10.3 后，engine 不能再使用`xiang`，应该使用`default`或是空值。

## `QueryParam`与`QueryDSL`差异

### 重要的区别

`QueryParam`与`QueryDSL`是两个不同的对象，两者的 wheres 条件的语法是不一样的，不要搞混了。

重要区别：

- `QueryDSL`中的`wheres`使用`field`来定义列名，使用`op`定义损失和方法，或条件使用`{or:true}`表示。
- `QueryParam`中的`wheres`使用`column`来定义列名，使用`method`定义操作方法，或条件使用`"method":"orwhere"`。

应用场景：

- `QueryDSL`用在 Flow/jsapi 中定义描述数据查询条件。
- `QueryParam`主要用于转换`url api`中的查询参数。

#### 操作符不一样。

需要注意的是，在`QueryParam`或是`url`使用的操作符跟`query dsl`中不一样，在`query dsl`中是使用以下操作符。

- "="
- ">"
- ">="
- "<"
- "<="
- "<>"
- "like"
- "match"
- "in"
- "is"

而在`QueryParam`或是`url`中只能使用以下操作符。

- eq
- gt
- lt
- ge
- le
- like
- match
- in
- null
- notnull

因为 url 中 不能包含特符号。

#### QueryParam 不能在 where 条件中使用简化语法，QueryDSL 可以。

QueryDSL 示例：

在这里的 where 条件没有使用`field`来定义字段，而是采用了一种简化的表示方式。

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    //deleted_at是字段
    //=是操作符
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: ['id as value', 'name as label'],
    from: 'company'
  });
  return res;
}
```

#### QueryParam 不能使用数据库函数，QueryDSL 可以。

在 queryParam 里的 select 只能使用数据库表的列名，不能使用函数或是 as 别名。

#### QueryParam 可以在数据模型处理器中使用,QueryDSL 不可以。

数据模型处理器 Find, Get, Paginate, UpdateWhere, DeleteWhere, DestroyWhere 均支持传入 QueryParam 查询参数

### 使用建议

- 在 flow 定义中使用 `QueryDSL`
- 在 Js Query 对象中使用 `QueryParam`

- 在调用模型或是`form/table`处理器时使用`QueryParam`。

### 示例

QueryDSL

```json
{
  "wheres": [
    { "field": "created_at", "op": ">=", "value": "2020-01-01" },
    { "field": "created_at", "op": "<=", "value": "{'2020-12-31'}" },
    { "field": "created_at", "op": "<=", "value": "{updated_at}" },
    {
      "wheres": [
        { "field": "type", "value": 1 },
        { "or": true, "field": "type", "value": 2 } //表示或
      ]
    },
    {
      "comment": "限定范围: 仅列出有效厂商",
      "field": "manu_id",
      "op": "in",
      "query": {
        "select": ["id"],
        "from": "$manu",
        "wheres": [{ "field": "status", "value": "enabled" }]
      }
    }
  ]
}
```

## QueryParam 语法

### QueryParam 使用场景

QueryParam 的其中一个典型的场景是直接转换 url 中的查询参数。

比如有以下的 url 请求，url 的格式是按 query-param 的格式进行组装。

![](../docs/YaoDSL/Query/在url中使用QueryParam.md)

```bash
GET /api/user/paginate?withs=manu,mother,addresses&where.status.eq=enabled&&select=id,name,mobile,status,extra&page=1&pagesize=2

```

创建一个 api 定义。在这个 api 定义中，可以使用`:query-param`或是`:params`直接解析 url 参数并转换成处理器的查询参数。

```json
{
  "path": "/search",
  "method": "GET",
  "guard": "-", //公开api
  "process": "models.pet.Paginate",
  "in": [":query-param", "$query.page", "$query.pagesize"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

另外一个场景是在调用模型处理器时，可以使用 QueryParam 构建复杂的查询参数。

数据模型处理器 Find, Get, Paginate, UpdateWhere, DeleteWhere, DestroyWhere 均支持传入查询参数 Object QueryParam，对读取记录范围进行限定。

```js
return Process(
  'models.user.Paginate',
  {
    select: ['id', 'name', 'mobile', 'status', 'extra'],
    withs: { manu: {}, mother: {}, addresses: {} },
    wheres: [{ column: 'status', value: 'enabled' }],
    limit: 2
  },
  1,
  2
);
```

更复杂的 QueryParam 定义。

```json
{
  "select": ["id", "name", "mobile", "status"],
  "withs": {
    "manu": { "query": ["name", "short_name", "status"] },
    "addresses": {}
  },
  "wheres": [
    { "column": "status", "value": "enabled" },
    { "rel": "manu", "column": "status", "value": "enabled" },
    {
      "wheres": [
        { "column": "name", "value": "%张三%", "op": "like" },
        {
          "method": "orwhere",
          "column": "name",
          "value": "%李四%",
          "op": "like"
        }
      ]
    }
  ],
  "orders": [
    { "column": "id", "option": "desc" },
    { "rel": "manu", "column": "name" }
  ],
  "limit": 2
}
```

`QueryParam` typescript 语法定义。

```ts
/**QueryParam 数据查询器参数 */
export interface QueryParam {
  /**备注【管理字段】 */
  comment?: string;
  /**模型名称 */
  model?: string;
  /**表格名称 */
  table?: string;
  /**别名 */
  alias?: string;
  /**导出数据时的前缀 */
  export?: string;
  /**选择字段清单*/
  select?: string[];
  /**查询条件*/
  wheres?: QueryWhere[];
  /**排序条件*/
  orders?: QueryOrder[];
  /**限制返回记录条目*/
  limit?: number;
  /**当前页码*/
  page?: number;
  /**每页显示记录数量*/
  pagesize?: number;
  /**读取关联模型*/
  withs?: { [key: string]: QueryWith }; //Map<string, QueryWith>;
}

/**QueryOrder Order 查询排序 */
export interface QueryOrder {
  /**如按关联模型的字段排序，则填写关联模型名称*/
  rel?: string;
  /**字段名称*/
  column: string;
  /**排序方式， `desc`, `asc`, 默认为 `asc`*/
  option?: string;
}
/**
 *  QueryWhere Where 查询条件
 */
export interface QueryWhere {
  /**如按关联模型的字段查询，则填写关联模型名称 */
  rel?: string;
  /**字段名称*/
  column?: string;
  /**匹配数值*/
  value?: any;
  /**查询方法 `where`,`orwhere`, `wherein`, `orwherein`... 默认为 `where`,
   *
   *| 查询方法 | 说明                                  |
   *| -------- | ------------------------------------- |
   *| where    | WHERE 字段 = 数值, WHERE 字段 >= 数值 |
   *| orwhere  | ... OR WHERE 字段 = 数值              |
   */
  method?: string;
  /**默认为 `eq`
   *
   *| 匹配关系 | 说明                             |
   *| -------- | -------------------------------- |
   *| eq       | 默认值 等于 WHERE 字段 = 数值    |
   *| like     | 匹配 WHERE 字段 like 数值        |
   *| match    | 匹配 WHERE 字段 全文检索 数值    |
   *| gt       | 大于 WHERE 字段 > 数值           |
   *| ge       | 大于等于 WHERE 字段 >= 数值      |
   *| lt       | 小于 WHERE 字段 < 数值           |
   *| le       | 小于等于 WHERE 字段 <= 数值      |
   *| null     | 为空 WHERE 字段 IS NULL          |
   *| notnull  | 不为空 WHERE 字段 IS NOT NULL    |
   *| in       | 列表包含 WHERE 字段 IN (数值...) |
   *| ne       | 不等于匹配值                     |
   */
  op?: string;
  /**分组查询 */
  wheres?: QueryWhere[];
}

/**With relations 关联查询 */
export interface QueryWith {
  name?: string;
  query?: QueryParam;
}
```

**注意不是 QueryDSL**，特别是 where 条件的语法的差异。

Query DSL 示例:

```json
{
  "comment": "统计各行业最高分",
  "select": ["industries@", "city", ":MAX(score) as high_score"],
  "from": "service",
  "wheres": [
    { ":created_at": "创建时间", ">=": "2021-01-01" },
    { ":created_at": "创建时间", "<=": "{'2021-12-31'}" },
    { ":updated_at": "更新时间", "is": "null" },
    {
      "wheres": [
        { ":type": "类型", "=": 1 },
        { "or:type": "或类型", "=": 2 }
      ]
    }
  ],
  "orders": "high_score desc",
  "limit": 100,
  "groups": ["industries@", "city"]
}
```

### 复杂的 withs 条件

withs 子查询也是一个 queryParam 类型的结构。

在这里实现一个复杂的子表查询条件。

```json
function getField(entity, field) {
  const [row] = Process("models.sys.entity.get", {
    wheres: [
      {
        column: "name",
        value: entity,
      },
    ],
    withs: {
      fields: {
        query: { //这里注意要增加一个query节点
          wheres: [
            {
              column: "name",
              value: field,
            },
          ],
        },
      },
    },
  });

  if (row.fields.length) {
    return row.fields[0];
  }
  return {};
}
```

## Yao 在 url 请求中使用 QueryParam 查询语法

`QueryParam`可以理解为查询参数，用于构建数据查询条件。使用结构化的思维把 url 参数转换成`SQL`查询条件。是`Yao`应用开发中使用比较频繁的对象，需要掌握理解。

`QueryParam`的主要使用场景是转换`url api`中的查询参数为数据库`sql`条件。一个`QueryParam`对象代表了一个 url 查询请求对象。

`QueryParam`的源代码学习：`/gou/query.url.go`

比如下面的`url`包含了一个`where`查询条件：`http://localhost:5099/api/pet/search?where.kind.match=狗`

`url`的查询参数`where.kind.match=狗`会被解析成以下的`where`条件`kind = 狗`,这是一个最简单的使用例子。`QueryParam`还可以包含其它复杂的使用方法。

### 源代码学习

`QueryParam`结构定义：

```go
type QueryParam struct {
    Model    string          `json:"model,omitempty"` //关联模型
    Table    string          `json:"table,omitempty"` //关联表
    Alias    string          `json:"alias,omitempty"` //别名
    Export   string          `json:"export,omitempty"` // 导出前缀
    Select   []interface{}   `json:"select,omitempty"` // string | dbal.Raw
    Wheres   []QueryWhere    `json:"wheres,omitempty"` // where条件列表
    Orders   []QueryOrder    `json:"orders,omitempty"` // 排序
    Limit    int             `json:"limit,omitempty"` //限制
    Page     int             `json:"page,omitempty"` //翻页
    PageSize int             `json:"pagesize,omitempty"`//页数据大小
    Withs    map[string]With `json:"withs,omitempty"`//关联表查询
}
```

`QueryParam`对象有一个重要的方法`NewQuery()`，这个方法会根据传入结构体的参数组合成一个查询堆栈：`stack`，

```go
// gou/query.go
// NewQuery 新建查询栈
func (param QueryParam) NewQuery() *QueryStack {
    return param.Query(nil)
}
```

在源代码：`gou/query.url.go`中的函数`URLToQueryParam`会把`url`转换成`QueryParam`对象中的`select,order,where|orwhere|wherein|orwherein,group,with,select`。

- `select`查询字段
- `order` 排序
- `where` where 条件
- `group` 分组
- `with` 关联查询
- `.select` 关联查询字段

```go
const reURLWhereStr = "(where|orwhere|wherein|orwherein)\\.(.+)\\.(eq|gt|lt|ge|le|like|match|in|null|notnull)"

var reURLWhere = regexp.MustCompile("^" + reURLWhereStr + "$")
var reURLGroupWhere = regexp.MustCompile("^group\\.([a-zA-Z_]{1}[0-9a-zA-Z_]+)\\." + reURLWhereStr + "$")

// URLToQueryParam url.Values 转换为 QueryParams
func URLToQueryParam(values url.Values) QueryParam {
    param := QueryParam{
        Withs:  map[string]With{},
        Wheres: []QueryWhere{},
    }

    whereGroups := map[string][]QueryWhere{}
    for name := range values {
        if name == "select" {
            param.setSelect(values.Get(name))
            continue
        } else if name == "order" {
            param.setOrder(name, values.Get(name))
            continue
        } else if reURLWhere.MatchString(name) {
            param.setWhere(name, getURLValue(values, name))
            continue
        } else if strings.HasPrefix(name, "group.") {
            param.setGroupWhere(whereGroups, name, getURLValue(values, name))
            continue
        } else if name == "with" {
            param.setWith(values.Get(name))
            continue
        } else if strings.HasSuffix(name, ".select") {
            param.setWithSelect(name, values.Get(name))
            continue
        }
    }

    // WhereGroups
    for _, wheres := range whereGroups {
        param.Wheres = append(param.Wheres, QueryWhere{
            Wheres: wheres,
        })
    }
    return param
}
```

函数`URLToQueryParam`返回的是一个结构对象。在`api`里可以通过`:params`，或是使用`:query-param`把 url 中查询参数转换成`QueryParam`对象。

```json
{
  "paths": [
    {
      "path": "/search",
      "method": "GET",
      "process": "models.user.Get",
      "in": [":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

## 复杂数据查询

###

本章节详细介绍基于数据模型处理器和 Query DSL 两种数据查询方式。建议在阅读前学习关系型数据库基础知识，了解 SQL 语法，可以编写基本的 SQL 语句。

### 使用 Model 处理器查询

数据模型处理器 `Find`, `Get`, `Paginate`, `UpdateWhere`, `DeleteWhere`, `DestroyWhere` 均支持传入查询参数 `Object QueryParam`，对读取记录范围进行限定。

Object QueryParam:

JSON 描述:

```json
{
  "select": ["id", "name", "mobile", "status"],
  "withs": {
    "manu": { "query": ["name", "short_name", "status"] },
    "addresses": {}
  },
  "wheres": [
    { "column": "status", "value": "enabled" },
    { "rel": "manu", "column": "status", "value": "enabled" },
    {
      "wheres": [
        { "column": "name", "value": "%张三%", "op": "like" },
        {
          "method": "orwhere",
          "column": "name",
          "value": "%李四%",
          "op": "like"
        }
      ]
    }
  ],
  "orders": [
    { "column": "id", "option": "desc" },
    { "rel": "manu", "column": "name" }
  ],
  "limit": 2
}
```

引擎解析后的 SQL:

```sql
SELECT
  `user`.`id`,`user`.`name`,`user`.`mobile`,`user`.`status`,
  `user_manu`.`name` AS `user_manu_name`,
  `user_manu`.`short_name` AS `user_manu_short_name` ,
  `user_manu`.`status` AS `user_manu_status`
FROM `user` AS `user`
LEFT JOIN `manu` AS `user_manu` ON `user_manu`.`id` = `user`.`manu_id`
WHERE  `user`.`status` = 'enabled'
AND `user_manu`.`status` = 'enabled'
AND (
   `user`.`name` like '%张三%' OR `user`.`name` like '%李四%'
)
ORDER BY `user`.`id` desc, `user_manu`.`name` asc
LIMIT 2
```

数据结构说明:

**QueryParam**

| 字段     | 类型                             | 说明             | 必填项 |
| -------- | -------------------------------- | ---------------- | ------ |
| select   | Array<String\>                   | 选择字段清单     | 否     |
| wheres   | Array<Object Where\>             | 查询条件         | 否     |
| orders   | Array<Object Order\>             | 排序条件         | 否     |
| limit    | Integer                          | 返回记录条目     | 否     |
| page     | Integer                          | 当前页码         | 否     |
| pagesize | Integer                          | 每页显示记录数量 | 否     |
| withs    | `[key:String]:Object QueryParam` | 读取关联模型     | 否     |

**Object Where**

| 字段   | 类型                 | 说明                                          | 必填项 |
| ------ | -------------------- | --------------------------------------------- | ------ |
| rel    | String               | 如按关联模型的字段查询，则填写关联模型名称    | 否     |
| column | String               | 字段名称                                      | 否     |
| method | String               | 查询方法 `where`,`orwhere` 默认为 `where`     | 否     |
| op     | String               | 匹配关系 `eq`,`like`,`in`,`gt` 等 默认为 `eq` | 否     |
| value  | Any                  | 匹配数值                                      | 否     |
| wheres | Array<Object Where\> | 分组查询                                      | 否     |

| 查询方法 | 说明                                  |
| -------- | ------------------------------------- |
| where    | WHERE 字段 = 数值, WHERE 字段 >= 数值 |
| orwhere  | ... OR WHERE 字段 = 数值              |

| 匹配关系 | 说明                             |
| -------- | -------------------------------- |
| eq       | 默认值 等于 WHERE 字段 = 数值    |
| like     | 匹配 WHERE 字段 like 数值        |
| match    | 匹配 WHERE 字段 全文检索 数值    |
| gt       | 大于 WHERE 字段 > 数值           |
| ge       | 大于等于 WHERE 字段 >= 数值      |
| lt       | 小于 WHERE 字段 < 数值           |
| le       | 小于等于 WHERE 字段 <= 数值      |
| null     | 为空 WHERE 字段 IS NULL          |
| notnull  | 不为空 WHERE 字段 IS NOT NULL    |
| in       | 列表包含 WHERE 字段 IN (数值...) |
| ne       | 不等于匹配值                     |

**Object Order**

| 字段   | 类型   | 说明                                       | 必填项 |
| ------ | ------ | ------------------------------------------ | ------ |
| rel    | String | 如按关联模型的字段排序，则填写关联模型名称 | 否     |
| column | String | 字段名称                                   | 否     |
| option | String | 排序方式， `desc`, `asc`, 默认为 `asc`     | 否     |

### 使用 Query DSL 查询

Query DSL 可以在数据流中使用，一般用于数据分析统计等更为复杂的场景。

对数据表 `service` (见下表)分析， 统计各行业最高分。

| id  | industries       | city | score | created_at          | updated_at |
| --- | ---------------- | ---- | ----- | ------------------- | ---------- |
| 1   | ["旅游", "教育"] | 北京 | 99    | 2021-10-03 13:40:52 | NULL       |
| 2   | ["旅游", "教育"] | 上海 | 68    | 2021-10-03 13:40:52 | NULL       |
| 3   | ["旅游", "教育"] | 北京 | 92    | 2021-10-03 13:40:52 | NULL       |
| 4   | ["旅游", "教育"] | 上海 | 87    | 2021-10-03 13:40:52 | NULL       |
| 5   | ["旅游", "教育"] | 北京 | 71    | 2021-10-03 13:46:06 | NULL       |

Query DSL 示例:

JSON 描述：

```json
{
  "comment": "统计各行业最高分",
  "select": ["industries@", "city", ":MAX(score) as high_score"],
  "from": "service",
  "wheres": [
    { ":created_at": "创建时间", ">=": "2021-01-01" },
    { ":created_at": "创建时间", "<=": "{'2021-12-31'}" },
    { ":updated_at": "更新时间", "is": "null" },
    {
      "wheres": [
        { ":type": "类型", "=": 1 },
        { "or:type": "或类型", "=": 2 }
      ]
    }
  ],
  "orders": "high_score desc",
  "limit": 100,
  "groups": ["industries@", "city"]
}
```

引擎解析后的 `SQL语句` 为 (MySQL 8):

```sql

SELECT `@industries`.`industries`,`city`, MAX(`score`) AS `high_score`
FROM `service`
JOIN JSON_TABLE(`service`.`industries`, '$[*]' columns (`industries` varchar(50) path '$') ) as `@industries`
WHERE `created_at` >= '2021-01-01'
  AND `created_at` <= '2021-12-31'
  AND `updated_at` IS NULL
  AND ( `type` = 1 OR `type` = 2)
GROUP BY `@industries`.`industries`, `city`
ORDER BY `high_score` DESC

```

返回结果:

| industries | city | high_score |
| ---------- | ---- | ---------- |
| 旅游       | 北京 | 99         |
| 教育       | 北京 | 99         |
| 旅游       | 上海 | 87         |
| 教育       | 上海 | 87         |

### 在 Flow 中使用

:::v-pre
在数据流中，可以使用 `{{$in}}` 或 `?:$in` 接收参数， `{{$res}}` 或 `?:$res` 引用节点查询结果。

提示：在数据流中通过 {{$xxx}} 或 ?:$xxx
使用变量写法等效。
:::

#### 使用模型处理器

```json
{
  "label": "查询最新数据",
  "version": "1.0.0",
  "description": "查询系统最新数据",
  "nodes": [
    {
      "name": "宠物",
      "process": "models.pet.Get",
      "args": [
        {
          "select": ["id", "name", "kind", "created_at"],
          "wheres": [{ "column": "kind", "value": "{{$in.0}}" }],
          "orders": [{ "column": "created_at", "option": "desc" }],
          "limit": 10
        }
      ]
    }
  ],
  "output": "{{$res.宠物}}"
}
```

#### 使用 Query DSL

```json
{
  "label": "查询最新数据",
  "version": "1.0.0",
  "description": "查询系统最新数据",
  "nodes": [
    {
      "name": "宠物",
      "engine": "xiang",
      "query": {
        "select": ["id", "name", "kind", "created_at"],
        "from": "$pet",
        "wheres": [{ ":kind": "类型", "=": "?:$in.0" }],
        "orders": "created_at desc",
        "limit": 10
      }
    }
  ],
  "output": "{{$res.宠物}}"
}
```

### 在 Script 中使用

```javascript
function test(id) {
  var query = new Query();
  var data = query.Get({
    name: '宠物',
    engine: 'xiang',
    query: {
      select: ['id', 'name', 'kind', 'created_at'],
      from: '$pet',
      wheres: [{ ':kind': '类型', '=': id }],
      orders: 'created_at desc',
      limit: 10
    }
  });
}
```

### 在数据表格中使用

在数据表格中，可以使用 `filter` 传递查询参数。查询参数通过 `URL Query String` 传递给数据表格接口。

指定查询参数名称：

```json
{
  "name": "宠物",
  "version": "1.0.0",
  "decription": "宠物管理表格",
  "bind": { "model": "pet" },
  "apis": {},
  "columns": {},
  "filters": {
    "关键词": {
      "label": "关键词",
      "bind": "where.name.match",
      "input": { "type": "input", "props": { "placeholder": "请输入关键词" } }
    }
  },
  "list": {
      "filters": ["关键词"],
      ...
  },
  "edit": {}
}
```

在点击界面搜索按钮时，系统向表格 `search` API 请求数据，并传入 `bind` 中声明的参数名和用户填写数值:

```bash
GET /api/xiang/table/pet?where.name.match=xxx
```

## 使用 Query DSL 查询数据

Query DSL(Domain Specific Language) 用来描述数据查询条件，适用基于数据库实现的数据分析引擎，如 `Xu` 等。

### 1. 文档结构

数据查询的数据类型为 `Object QueryDSL`，通过 `select`, `wheres` 等字段描述查询条件，解析器将其转换为对应的 `SQL语句`。

数据表 `service` :

| id  | industries       | city | score | created_at          | updated_at |
| --- | ---------------- | ---- | ----- | ------------------- | ---------- |
| 1   | ["旅游", "教育"] | 北京 | 99    | 2021-10-03 13:40:52 | NULL       |
| 2   | ["旅游", "教育"] | 上海 | 68    | 2021-10-03 13:40:52 | NULL       |
| 3   | ["旅游", "教育"] | 北京 | 92    | 2021-10-03 13:40:52 | NULL       |
| 4   | ["旅游", "教育"] | 上海 | 87    | 2021-10-03 13:40:52 | NULL       |
| 5   | ["旅游", "教育"] | 北京 | 71    | 2021-10-03 13:46:06 | NULL       |

Query DSL:

```json
{
  "comment": "统计各行业最高分",
  "select": ["@industries", "city", ":MAX(score) as high_score"],
  "from": "service",
  "wheres": [
    { "field": "created_at", "op": ">=", "value": "2021-01-01" },
    { "field": "created_at", "op": "<=", "value": "{'2021-12-31'}" },
    { "field": "{updated_at}", "op": "null" },
    {
      "wheres": [
        { "field": "type", "value": 1 },
        { "or": true, "field": "type", "value": 2 }
      ]
    }
  ],
  "orders": [{ "field": "high_score", "sort": "desc" }],
  "limit": 100,
  "groups": ["@industries", "city"]
}
```

解析后的 `SQL语句` 为 (MySQL 8):

```sql
SELECT `@industries`.`industries`,`city`, MAX(`score`) AS `high_score`
FROM `service`
JOIN JSON_TABLE(`service`.`industries`, '$[*]' columns (`industries` varchar(50) path '$') ) as `@industries`
WHERE `created_at` >= '2021-01-01'
  AND `created_at` <= '2021-12-31'
  AND `updated_at` IS NULL
  AND ( `type` = 1 OR `type` = 2)
GROUP BY `@industries`.`industries`, `city`
ORDER BY `high_score` DESC
```

返回结果:

| industries | city | high_score |
| ---------- | ---- | ---------- |
| 旅游       | 北京 | 99         |
| 教育       | 北京 | 99         |
| 旅游       | 上海 | 87         |
| 教育       | 上海 | 87         |

#### Object QueryDSL 数据结构

| 字段      | 类型                      | 说明                                                                                                                                         | 必填项 |
| --------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| select    | Array\<Field Expression\> | 选择字段列表                                                                                                                                 | 是     |
| from      | String                    | 查询数据表名称或数据模型                                                                                                                     | 否     |
| wheres    | Array\<Object Where\>     | 数据查询条件                                                                                                                                 | 否     |
| orders    | Array\<Object Order\>     | 排序条件                                                                                                                                     | 否     |
| offset    | Int                       | 记录开始位置                                                                                                                                 | 否     |
| limit     | Int                       | 读取数据的数量                                                                                                                               | 否     |
| page      | Int                       | 分页查询当前页面页码                                                                                                                         | 否     |
| pagesize  | Int                       | 每页读取记录数量                                                                                                                             | 否     |
| data-only | Bool                      | 设定为 `true`, 查询结果为 Array\<Object Record\>; 默认为 `false`, 查询结果为 Array\<Object Paginate\>, 仅在设定 `page` 或 `pagesize`时有效。 | 否     |
| groups    | Array\<Object Group\>     | 聚合字段和统计层级设置。                                                                                                                     | 否     |
| havings   | Array\<Object Having\>    | 聚合查询结果筛选, 仅在设定 `groups` 时有效。                                                                                                 | 否     |
| unions    | Array\<Object QueryDSL\>  | 联合查询。多个查询将结果合并为一张表                                                                                                         | 否     |
| query     | Object QueryDSL           | 子查询。按 QueryDSL 描述查询逻辑，生成一张二维数据表或数值。                                                                                 | 否     |
| joins     | Array\<Object Join\>      | 表连接。连接数据量较大的数据表时 **不推荐使用**。                                                                                            | 否     |
| sql       | Object SQL                | SQL 语句。**非必要，勿使用**。                                                                                                               | 否     |
| comment   | String                    | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                                                                                   | 否     |

#### 1.1 选择字段 `select`

`select` 用来描述选择字段列表，数据类型为字段表达式字符串数组 `Array<Field Expression>` ，支持数据表字段名称、常量和函数；可以使用 `as` 对字段设置别名，别名视为主表字段名称，可在 `wheres`, `order`, `having` 中直接使用。

```json
{
  "select": [
    "name",
    "short_name as short",
    "*mobile",
    ":MAX(score) as high_score",
    "$extra",
    "$extra.sex as sex",
    "@prices",
    "@prices[0] as price",
    "@addresses[0].id as address_id",
    "t2.name as t2_name",
    "t2.short_name as t2_short",
    "0.618 as 黄金分割",
    "'enable' as 状态"
  ]
}
```

[查看字段表达式文档](#2-字段表达式-Field-Expression)

#### 1.2 选择数据表 `from`

`form` 用来指定查询数据表名称或数据模型，数据类型为 `String`；

| 示例         | 表达式                  | 说明                                                                                                          |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `goods`      | `数据表名称`            | 在 `goods` 数据表中查询                                                                                       |
| `goods as g` | `数据表名称 as 别名`    | 在 `goods` 数据表中查询, 设置别名为 `g`, `g.字段名称` 与 `goods.字段名称` 等价                                |
| `$user`      | `$数据模型名称`         | 在数据模型 `models.user` 关联的数据表(`xxx`)中查询，设置别名为 `user`, `user.字段名称` 与 `xxx.字段名称` 等价 |
| `$user as u` | `$数据模型名称 as 别名` | 在数据模型 `models.user` 关联的数据表(`xxx`)中查询， 设置别名为 `u`, `u.字段名称` 与 `xxx.字段名称` 等价      |

**说明**

- 可以使用 `$` 标识符，指定数据模型绑定的数据表。
- 可以使用 `as` 对数据表设置别名，别名支持中文，在表连接、字段引用等场景可以使用别名代替数据表名称。
- 如设置子查询 `query`([文档](#1.8.1%20用于%20SELECT%20场景))，解释器优先响应子查询逻辑，忽略 `from` 设定。 `query`和`from` 必填其一。

#### 1.3 查询条件 `wheres`

`wheres` 用于描述数据查询条件，数据结构为 `Array<Object Where>`。

Gou Query DSL:

```json
{
  "wheres": [
    { "field": "created_at", "op": ">=", "value": "2020-01-01" },
    { "field": "created_at", "op": "<=", "value": "{'2020-12-31'}" },
    { "field": "created_at", "op": "<=", "value": "{updated_at}" },
    {
      "wheres": [
        { "field": "type", "value": 1 },
        { "or": true, "field": "type", "value": 2 }
      ]
    },
    {
      "comment": "限定范围: 仅列出有效厂商",
      "field": "manu_id",
      "op": "in",
      "query": {
        "select": ["id"],
        "from": "$manu",
        "wheres": [{ "field": "status", "value": "enabled" }]
      }
    }
  ]
}
```

解析后的 `SQL语句` 为:

```sql
  WHERE `created_at` >=  '2020-01-01'
    AND `created_at` <=  '2020-12-31'
    AND `created_at` <=  `updated_at`
    AND (
      `type` = 1 OR `type` = 2
    )
    AND `manu_id` IN (SELECT `id` FROM `manu` WHERE `status` = 'enabled' )
```

##### Object Where 数据结构

| 字段    | 类型                  | 说明                                                                                         | 必填项 |
| ------- | --------------------- | -------------------------------------------------------------------------------------------- | ------ |
| field   | Field Expression      | 字段表达式，不支持设置别名 `as`                                                              | 是     |
| value   | Any                   | 匹配数值。如果数据类型为 `Field Expression`, 用 `{}` 包括，如 `{updated_at}`                 | 否     |
| op      | String                | 匹配关系运算符。许可值 `=`,`like`,`in`,`>` 等，默认为 `=`                                    | 否     |
| or      | Bool                  | `true` 查询条件逻辑关系为 `or`, 默认为 `false` 查询条件逻辑关系为 `and`                      | 否     |
| wheres  | Array\<Object Where\> | 分组查询。用于 `condition 1` `and` ( `condition 2` OR `condition 3`) 的场景                  | 否     |
| query   | Object QueryDSL       | 子查询；如设定 `query` 则忽略 `value` 数值。 [查看子查询文档](#1.8.1%20用于%20SELECT%20场景) | 否     |
| comment | String                | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                                   | 否     |

###### 匹配关系运算符

| 运算符    | 说明                             |
| --------- | -------------------------------- |
| `=`       | 默认值 等于 WHERE 字段 = 数值    |
| `>`       | 大于 WHERE 字段 > 数值           |
| `>=`      | 大于等于 WHERE 字段 >= 数值      |
| `<`       | 小于 WHERE 字段 < 数值           |
| `<=`      | 小于等于 WHERE 字段 <= 数值      |
| `like`    | 匹配 WHERE 字段 like 数值        |
| `match`   | 模糊匹配 WHERE 字段 match 数值   |
| `null`    | 为空 WHERE 字段 IS NULL          |
| `notnull` | 不为空 WHERE 字段 IS NOT NULL    |
| `in`      | 列表包含 WHERE 字段 IN (数值...) |

#### 1.4 排序条件 `orders`

`orders` 用于描述数据排序条件，数据结构为 `Array<Object Order>`。

Gou Query DSL:

```json
{
  "orders": [
    { "comment": "更新时间倒叙", "field": "updated_at", "sort": "desc" },
    { "field": "manu.created_at" }
  ]
}
```

解析后的 `SQL语句` 为:

```sql
  ORDER BY `updated_at` DESC, `manu`.`created_at` ASC
```

##### 1.4.1 Object Order 数据结构

| 字段    | 类型             | 说明                                                       | 必填项 |
| ------- | ---------------- | ---------------------------------------------------------- | ------ |
| field   | Field Expression | 字段表达式，不支持设置别名 `as`                            | 是     |
| sort    | String           | 排序方式，许可值 `asc`, `desc`, 默认值为 `asc`             | 否     |
| comment | String           | 排序条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。 | 否     |

##### 1.4.2 排序条件语法糖 `orders syntactic sugar`

如果排序条件简单且易于理解，可使用 `Array<Field Expression>` 结构描述； 亦可使用 `Field Expression` 类型描述，多个用 `,` 分割。

以下描述方法解析结果相同：

###### 完整描述

```json
{
  "orders": [
    { "comment": "更新时间倒叙", "field": "updated_at", "sort": "desc" },
    { "field": "manu.created_at" }
  ]
}
```

###### 使用 `Array<String>`

```json
{
  "orders": [
    { "comment": "更新时间倒叙", "field": "updated_at", "sort": "desc" },
    "manu.updated_at"
  ]
}
```

```json
{
  "orders": ["updated_at desc", "manu.updated_at"]
}
```

###### 多个 `Field Expression` 用 `,` 分割

```json
{
  "orders": "updated_at desc, manu.updated_at asc"
}
```

```json
{
  "orders": "updated_at desc, manu.updated_at"
}
```

#### 1.5 数量限定 `limit`, `offset`, `page`, `pagesize`, `data-only`

使用 `limit`, `offset` 或 `page`, `pagesize` 限定记录范围。`page` 和 `pagesize` 根据查询条件自动分页。

##### 从第 20 条开始，读取 50 条数据

Gou Query DSL:

```json
{
  "select": ["id", "name"],
  "from": "manu",
  "offset": 20,
  "limit": 50
}
```

解析后的 `SQL语句` 为(MySQL 示例):

```sql
  SELECT `id`, `name` FROM `manu` LIMIT 20,50
```

##### 每页 50 条数据，从第 1 页开始读取

通过 `page` 和 `pagesize` 限定记录范围，QueryDSL 默认返回值包含分页信息, 可以通过设置 `data-only` 不返回分页信息。

Gou Query DSL:

```json
{
  "select": ["id", "name"],
  "from": "manu",
  "page": 1,
  "pagesize": 50
}
```

解析后的 `SQL语句` 为(MySQL 示例):

```sql
  -- 执行第一次查询, 查询记录总数
  SELECT count(`id`) as `total` FROM `manu`
  -- 解析器根据 total, page 和 pagesize 计算 offset 和 limit
  -- 执行第二次查询
  SELECT `id`, `name` FROM `manu` LIMIT 50
```

##### 数量限定设置

| 字段      | 类型 | 说明                                                                                                                                                                 | 必填项 |
| --------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| offset    | Int  | 记录开始位置。默认为从头开始。                                                                                                                                       | 否     |
| limit     | Int  | 从开始位置起，读取数据的条目。 默认为 `0`，不限定。                                                                                                                  | 否     |
| page      | Int  | 分页查询当前页面页码， 默认为 `1`                                                                                                                                    | 否     |
| pagesize  | Int  | 每页读取记录数量。 若仅设定 `page` 数值，`pagesize` 默认为 `15`。                                                                                                    | 否     |
| data-only | Bool | 仅在设定 `page` 或 `pagesize` 时有效。设定为 `true`, 默认为 `false`, 查询结果为[带分页信息的数据记录数组 Object Paginate](#从第%2020%20条开始，读取%2050%20条数据)。 | 否     |

#### 1.6 数据聚合 `groups`, `havings`

在 `groups` 中定义数据聚合方式，Group 数据结构为 `Array<Object Group>`。

| 字段    | 类型                   | 说明                   | 必填项 |
| ------- | ---------------------- | ---------------------- | ------ |
| groups  | Array\<Object Group\>  | 聚合字段和统计层级设定 | 否     |
| havings | Array\<Object Having\> | 聚合查询结果筛选       | 否     |

**Object Group 数据结构**

| 字段    | 类型             | 说明                                                       | 必填项 |
| ------- | ---------------- | ---------------------------------------------------------- | ------ |
| field   | Field Expression | 字段表达式，不支持设置别名 `as`                            | 是     |
| rollup  | String           | 同时返回多层级统计结果，对应聚合字段数值的名称。           | 否     |
| comment | String           | 聚合条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。 | 否     |

##### 1.6.1 使用示例

###### 数据表

数据表 `service` :

| id  | city | kind   | amount |
| --- | ---- | ------ | ------ |
| 1   | 北京 | 云主机 | 50     |
| 2   | 北京 | 云主机 | 50     |
| 3   | 北京 | 云存储 | 50     |
| 4   | 上海 | 云主机 | 200    |

###### 聚合统计 `group`

Gou Query DSL:

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": [
    { "field": "kind", "comment": "按类型统计" },
    { "field": "city", "comment": "按城市统计" }
  ]
}
```

解析后的 `SQL语句` 为(MySQL):

```sql
  SELECT
    `kind` AS `类型`,
    `city` AS `城市`,
    SUM(`amount`) AS `数量`
  FROM `service`
  GROUP BY `kind`, `city`
```

查询结果为:

| 类型   | 城市 | 数量 |
| ------ | ---- | ---- |
| 云主机 | 北京 | 100  |
| 云存储 | 北京 | 50   |
| 云主机 | 上海 | 200  |

###### 多层级聚合统计 `rollup`

Gou Query DSL:

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": [
    { "field": "kind", "rollup": "所有类型", "comment": "按类型统计" },
    { "field": "city", "comment": "按城市统计" }
  ]
}
```

解析后的 `SQL语句` 为(MySQL):

```sql
  SELECT
    IF(GROUPING(`kind`), '所有类型', `kind`)  AS `类型`,
    `city` AS `城市`,
    SUM(`amount`) AS `数量`
  FROM `service`
  GROUP BY `kind`, `city` WITH ROLLUP
```

查询结果为:

| 类型         | 城市     | 数量 |
| ------------ | -------- | ---- |
| 云主机       | 上海     | 200  |
| 云主机       | 北京     | 100  |
| 云主机       | **NULL** | 300  |
| 云存储       | 北京     | 50   |
| 云存储       | **NULL** | 50   |
| **所有类型** | **NULL** | 350  |

Gou Query DSL:

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": [
    { "field": "kind", "rollup": "所有类型", "comment": "按类型统计" },
    { "field": "city", "rollup": "所有城市", "comment": "按城市统计" }
  ]
}
```

解析后的 `SQL语句` 为(MySQL):

```sql
  SELECT
    IF(GROUPING(`kind`), '所有类型', `kind`)  AS `类型`,
    IF(GROUPING(`city`), '所有城市', `city`) AS `城市`,
    SUM(`amount`) AS `数量`
  FROM `service`
  GROUP BY `kind`, `city` WITH ROLLUP
```

查询结果为:

| 类型         | 城市         | 数量 |
| ------------ | ------------ | ---- |
| 云主机       | 上海         | 200  |
| 云主机       | 北京         | 100  |
| 云主机       | **所有城市** | 300  |
| 云存储       | 北京         | 50   |
| 云存储       | **所有城市** | 50   |
| **所有类型** | **所有城市** | 350  |

##### 1.6.2 聚合函数 `aggregate functions`

聚合函数按特定算法，对一组数据记录统计，返回一个数值，一般用于聚合查询。

###### 数据表

| id  | city | kind   | amount |
| --- | ---- | ------ | ------ |
| 1   | 北京 | 云主机 | 50     |
| 2   | 北京 | 云主机 | 50     |
| 3   | 北京 | 云存储 | 50     |
| 4   | 上海 | 云主机 | 200    |

###### 聚合函数表

| 函数             | 参数表                                  | 说明                   | SELECT 示例                                              | 数值                        |
| ---------------- | --------------------------------------- | ---------------------- | -------------------------------------------------------- | --------------------------- |
| SUM()            | [`Field Expression`]                    | 求和                   | `:SUM(amount)` , `:SUM(DISTINCT amount)`                 | `350`, `250`                |
| COUNT()          | [`Field Expression`]                    | 记录行数               | `:COUNT(id)`,`:COUNT(amount)`, `:COUNT(DISTINCT amount)` | `4`,`4`, `2`                |
| AVG()            | [`Field Expression`]                    | 平均数                 | `:AVG(amount)`, `:AVG(DISTINCT amount)`                  | `87.5000`, `125.0000`       |
| MIN()            | [`Field Expression`]                    | 最小值                 | `:MIN(amount)`                                           | `50`                        |
| MAX()            | [`Field Expression`]                    | 最大值                 | `:MAX(amount)`                                           | `200`                       |
| STDDEV_POP()     | [`Field Expression`]                    | 总体标准差             | `:STDDEV_POP(amount)`                                    | `64.9519052838329`          |
| STDDEV_SAMP()    | [`Field Expression`]                    | 样品标准差             | `:STDDEV_SAMP(amount)`                                   | `75`                        |
| VAR_POP()        | [`Field Expression`]                    | 总体方差               | `:VAR_POP(amount)`                                       | `4218.75`                   |
| VAR_SAMP()       | [`Field Expression`]                    | 样品方差               | `:VAR_SAMP(amount)`                                      | `5625`                      |
| JSON_ARRAYAGG()  | [`Field Expression`]                    | 合并为一个 JSON Array  | `:JSON_ARRAYAGG(amount)`                                 | `[50, 50, 50, 200]`         |
| JSON_OBJECTAGG() | [`Field Expression`,`Field Expression`] | 合并为一个 JSON Object | `:JSON_OBJECTAGG(city,price)`                            | `{"上海": 200, "北京": 50}` |

##### 1.6.3 聚合结果筛选 `havings`

在 `wheres` 中不能筛选聚合结果数据，如需对聚合查询结果进行筛选，可以使用 `havings` 实现, 数据结构为 `Array<Object Having>`

Gou Query DSL:

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": [
    { "field": "kind", "rollup": "所有类型", "comment": "按类型统计" },
    { "field": "city", "rollup": "所有城市", "comment": "按城市统计" }
  ],
  "havings": [
    { "field": "类型", "value": "云主机", "comment": "在聚合结果中筛选云主机" },
    {
      "havings": [
        { "field": "数量", "op": "=", "value": 100, "comment": "数量等于100" },
        { "or": true, "field": "数量", "value": 300, "comment": "或300的记录" }
      ]
    }
  ]
}
```

解析后的 `SQL语句` 为(MySQL):

```sql
  SELECT
    IF(GROUPING(`kind`), '所有类型', `kind`)  AS `类型`,
    IF(GROUPING(`city`), '所有城市', `city`) AS `城市`,
    SUM(`amount`) AS `数量`
  FROM `service`
  GROUP BY `kind`, `city` WITH ROLLUP
  HAVING `类型` = '云主机' AND (`数量` = 100 OR `数量` = 300)
```

查询结果为:

| 类型   | 城市     | 数量 |
| ------ | -------- | ---- |
| 云主机 | 北京     | 100  |
| 云主机 | 所有城市 | 300  |

**Object Having 数据结构**

| 字段    | 类型                   | 说明                                                                                         | 必填项 |
| ------- | ---------------------- | -------------------------------------------------------------------------------------------- | ------ |
| field   | Field Expression       | 字段表达式，不支持设置别名 `as`                                                              | 是     |
| value   | Any                    | 匹配数值。如果数据类型为 `Field Expression`, 用 `{}` 包括，如 `{updated_at}`                 | 否     |
| op      | String                 | 匹配关系运算符。许可值 `=`,`like`,`in`,`>` 等，默认为 `=`                                    | 否     |
| or      | Bool                   | `true` 查询条件逻辑关系为 `or`, 默认为 `false` 查询条件逻辑关系为 `and`                      | 否     |
| havings | Array\<Object Having\> | 分组查询。用于 `condition 1` `and` ( `condition 2` OR `condition 3`) 的场景                  | 否     |
| query   | Object QueryDSL        | 子查询；如设定 `query` 则忽略 `value` 数值。 [查看子查询文档](#1.8.1%20用于%20SELECT%20场景) | 否     |
| comment | String                 | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                                   | 否     |

##### 1.6.4 数据聚合语法糖 `groups syntactic sugar`

###### 1.6.4.1 Groups 简写

在通常情况下，只需指定聚合字段即可，可使用 `Array<Field Expression>` 结构描述； 亦可使用 `Field Expression` 类型描述，多个用 `,` 分割。

以下描述解析结果相同。

`完整描述`

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": [
    { "field": "kind", "comment": "按类型统计" },
    { "field": "city", "comment": "按城市统计" }
  ]
}
```

`简化为 Array<Field Expression>`

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": ["kind", { "field": "city", "comment": "按城市统计" }]
}
```

`简化为 Field Expression`

```json
{
  "select": ["kind as 类型", "city as 城市", ":SUM(amount) as 数量"],
  "from": "service",
  "groups": "kind,city"
}
```

###### 1.6.4.2 JSON Array 字段聚合

在对 `JSON Array` 字段聚合查询时，需要先连接 JSON Table，再对连接后的数据表进行聚合查询。可以简写为直接按 JSON Array 字段聚合。

数据表 `service` :

| id  | city | kind   | industries(JSON Array) | pricing(JSON Array\<Object\>)                                 | amount |
| --- | ---- | ------ | ---------------------- | ------------------------------------------------------------- | ------ |
| 1   | 北京 | 云主机 | `["教育","医疗"]`      | `[{"id":1, "name":"按月付费"},{"id":2, "name":"按年付费"}]`   | 50     |
| 2   | 北京 | 云主机 | `["艺术","医疗"]`      | `[{"id":1, "name":"按月付费"},{"id":3, "name":"一次性付费"}]` | 50     |
| 3   | 北京 | 云存储 | `["教育","制造"]`      | `[{"id":2, "name":"按年付费"},{"id":3, "name":"一次性付费"}]` | 50     |
| 4   | 上海 | 云主机 | `["能源","汽车"]`      | `[{"id":1, "name":"按月付费"}]`                               | 200    |

Query DSL:

```json
{
  "select": [
    "@industries as 行业",
    "@pricing[*].name as 计费方式",
    ":SUM(amount) as 数量"
  ],
  "from": "service",
  "groups": [
    { "field": "行业", "rollup": "全部行业" },
    { "field": "计费方式", "rollup": "所有计费方式" }
  ]
}
```

解析后的 `SQL语句` (MySQL8):

```sql
SELECT
  IF(GROUPING(`行业`), '全部行业', `行业`)  AS `行业`,
  IF(GROUPING(`计费方式`), '所有计费方式', `计费方式`) AS `计费方式`,
  SUM(`amount`) AS `数量`
FROM `service`
  JOIN JSON_TABLE(`service`.`industries`, '$[*]' columns (`行业` varchar(50) path '$') ) as industries
  JOIN JSON_TABLE(`service`.`pricing`, '$[*]' columns (`计费方式` varchar(50) path '$.name') ) as pricing
GROUP by `行业`, `计费方式` WITH ROLLUP
```

返回结果:

| 行业     | 计费方式     | 数量 |
| -------- | ------------ | ---- |
| 制造     | 一次性付费   | 50   |
| 制造     | 按年付费     | 50   |
| 制造     | 所有计费方式 | 100  |
| 医疗     | 一次性付费   | 50   |
| 医疗     | 按年付费     | 50   |
| 医疗     | 按月付费     | 100  |
| 医疗     | 所有计费方式 | 200  |
| 教育     | 一次性付费   | 50   |
| 教育     | 按年付费     | 100  |
| 教育     | 按月付费     | 50   |
| 教育     | 所有计费方式 | 200  |
| 汽车     | 按月付费     | 200  |
| 汽车     | 所有计费方式 | 200  |
| 能源     | 按月付费     | 200  |
| 能源     | 所有计费方式 | 200  |
| 艺术     | 一次性付费   | 50   |
| 艺术     | 按月付费     | 50   |
| 艺术     | 所有计费方式 | 100  |
| 全部行业 | 所有计费方式 | 1000 |

#### 1.7 联合查询 `unions`

可以在 `unions` 中将多个查询将结果合并成为一张结构相同数据表进行查询，可用于数据统计、分页展示等场景。

`unions` 数据结构为 `Array<Object QueryDSL>`

Gou Query DSL:

```json
{
  "unions": [
    {
      "comment": "20只宠物猫",
      "select": ["id", "name"],
      "from": "cat",
      "limit": 20
    },
    {
      "comment": "20条宠物狗",
      "select": ["id", "name"],
      "from": "dog",
      "limit": 20
    },
    {
      "comment": "20条观赏鱼",
      "select": ["id", "name"],
      "from": "fish",
      "limit": 20
    }
  ],
  "limit": 10,
  "orders": "id"
}
```

解释为 `SQL 语句` (MySQL):

```sql
 (SELECT `id`, `name` FROM `cat` LIMIT 20)
 UNION ALL (SELECT `id`, `name` FROM `dog` LIMIT 20)
 UNION ALL (SELECT `id`, `name` FROM `fish` LIMIT 20)
 ORDER BY `id`
 LIMIT 10
```

#### 1.8 子查询 `query`

可以通过描述 `query` 动态生成一张二维数据表或数值，在该数据表上查询或应用用于 WHERE, HAVING 查询条件。用于 SELECT 子查询场景时，必须设定别名，如设置 `query`, 则 `from` 失效。 `query` 数据结构为 `QueryDSL`。

##### 1.8.1 用于 SELECT 场景

Gou Query DSL:

```json
{
  "select": ["id", "name"],
  "query": {
    "comment": "通过子查询生成一张新数据表(必须设置别名)",
    "select": ["id", "short_name as name"],
    "from": "manu as m",
    "limit": 50
  },
  "orders": "id",
  "limit": 20
}
```

解析后的 `SQL语句` :

```sql
SELECT `id`, `name`
FROM (
  SELECT `id`, `short_name` as `name` FROM `manu` LIMIT 50
) AS `m`
ORDER BY `id` ASC
LIMIT 50
```

##### 1.8.2 用于 WHERE 场景

Gou Query DSL:

```json
{
  "select": ["id", "name"],
  "form": "service",
  "wheres": [
    {
      "field": "manu_id",
      "op": "in",
      "query": {
        "comment": "查询查询厂商ID数组",
        "select": ["id"],
        "from": "manu"
      }
    }
  ],
  "orders": "id",
  "limit": 20
}
```

解析后的 `SQL语句` :

```sql
SELECT `id`, `name`
FROM `service`
WHERE `manu_id` IN (
  SELECT `id` FROM `manu`
)
ORDER BY `id` ASC
LIMIT 50
```

##### 1.8.3 用于 HAVING 场景

Gou Query DSL:

```json
{
  "select": ["id", "name", ":COUNT(`id`) as 数量"],
  "form": "service",
  "groups": "id",
  "havings": [
    {
      "field": "数量",
      "op": "=",
      "query": {
        "select": ["1"]
      }
    }
  ]
}
```

解析后的 `SQL语句` :

```sql
SELECT `id`, `name`, COUNT(`id`) as 数量
FROM `service`
GROUP BY `id`
HAVING `数量` = ( SELECT 1 )
LIMIT 50
```

#### 1.9 表连接(不推荐) `joins`

连接两张数据量较大的数据表，非常消耗服务器资源，且查询低效。对于数据统计分析等场景，应该使用数仓或数据分析引擎，根据业务场景设置业务数据结构、清洗归集逻辑和查询逻辑，最终归集为一张**宽表**，在宽表中进行统计查询。数据量较大的应用，推荐使用[象传智慧](https://www.iqka.com) `Xu` 数据分析引擎。

`joins` 数据结构为 `Array<Object Join>` [查看数据结构](#Object%20Join%20数据结构)

Gou Query DSL:

```json
{
  "select": ["id", "name", "manu.name as manu_name"],
  "form": "service",
  "joins": [
    {
      "left": true,
      "from": "manu",
      "key": "id",
      "foreign": "service.manu_id"
    }
  ]
}
```

解析后的 `SQL语句` :

```sql
SELECT `service`.`id`, `service`.`name`, `manu`.`name` as `manu_name`
FROM `service`
LEFT JOIN `manu` ON `manu`.`id` = `service`.`manu_id`
```

查询结果为:

| id  | name           | manu_name                        |
| --- | -------------- | -------------------------------- |
| 1   | 腾讯云主机 CVM | 北京云道天成科技有限公司         |
| 2   | 腾讯云磁盘     | 北京云道天成科技有限公司         |
| 3   | 阿里主机       | 象传高新（北京）数字科技有限公司 |
| 4   | UCloud 云主机  | 象传智数（北京）软件科技有限公司 |
| 5   | adfasdf        | 北京云道天成科技有限公司         |

##### Object Join 数据结构

| 字段    | 类型   | 说明                                                             | 必填项 |
| ------- | ------ | ---------------------------------------------------------------- | ------ |
| from    | String | 连接表名称，与 Object QueryDSL `from`相同。                      | 是     |
| key     | String | 关联连接表字段名称                                               | 是     |
| foreign | String | 关联目标表字段名称(需指定表名或别名)                             | 是     |
| left    | Bool   | `true` 连接方式为 `LEFT JOIN`, 默认为 `false` 连接方式为 `JOIN`  | 否     |
| right   | Bool   | `true` 连接方式为 `RIGHT JOIN`, 默认为 `false` 连接方式为 `JOIN` | 否     |

#### 1.10 SQL 语句(谨慎使用) `sql`

**非必要，勿使用** 除非无法使用 Query DSL 描述查询逻辑，不要直接编写 SQL 语句。直接编写 SQL 语句将加大应用程序维护难度；增加系统信息泄露安全风险；因查询逻辑不可控，可能造成数据库或数仓宕机；数据迁移、数据库、数仓、数据分析引擎升级，**也可导致查询语句不可用**。

Gou Query DSL:

```json
{
  "sql": {
    "stmt": "SELECT `id`, `name` FROM `service` WHERE id = ?",
    "args": [1]
  }
}
```

解析后的 `SQL语句` :

```sql
SELECT `id`, `name` FROM `service` WHERE id = 1
```

**Object SQL 数据结构**

| 字段 | 类型         | 说明     | 必填项 |
| ---- | ------------ | -------- | ------ |
| stmt | String       | SQL 语句 | 是     |
| args | Array\<Any\> | 参数表   | 否     |

### 2. 字段表达式 `Field Expression`

字段表达式可以用于 `select` 、`wheres`、`order`、`group` 等场景；字段表达式数据类型为 `String`，可以为主表字段名称、关联表字段名称、常量、函数等。

#### 2.1 表达式

##### 主表字段

| 类型                      | 表达式语法                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 主表字段                  | `字段名称`                                                                                                              |
| AES 加密字段              | `*字段名称`                                                                                                             |
| JSON Object 字段          | `$字段名称`, `$字段名称.key`                                                                                            |
| JSON Array 字段           | `@字段名称`, `@字段名称[n]` n 为数组下标                                                                                |
| JSON Array\<Object\> 字段 | `@字段名称`, `$字段名称[n]` n 为数组下标, `@字段名称[n].key` n 为数组下标,`@字段名称[*].key` 返回 `Object.Key` 一维数组 |

##### 关联表字段

| 类型                      | 表达式语法                                                                                                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 关联表字段                | `关联表名称(或别名).字段名称`                                                                                                                                                                        |
| AES 加密字段              | `关联表名称(或别名).*字段名称`                                                                                                                                                                       |
| JSON Object 字段          | `关联表名称(或别名).$字段名称`, `关联表名称(或别名).$字段名称.key`                                                                                                                                   |
| JSON Array 字段           | `关联表名称(或别名).@字段名称`, `关联表名称(或别名).@字段名称[n]` n 为数组下标                                                                                                                       |
| JSON Array\<Object\> 字段 | `关联表名称(或别名).@字段名称`, `关联表名称(或别名).@字段名称[n]` n 为数组下标, `关联表名称(或别名).@字段名称[n].key` n 为数组下标, `关联表名称(或别名).@字段名称[*].key` 返回 `Object.Key` 一维数组 |

##### 函数

| 类型 | 表达式语法                                |
| ---- | ----------------------------------------- |
| 函数 | `:函数名称(参数表...)` 参数为`字段表达式` |

##### 常量

| 类型       | 表达式语法   |
| ---------- | ------------ |
| 整型常量   | `整型值`     |
| 浮点型常量 | `浮点型值`   |
| 字符串常量 | `'字符串值'` |

##### 别名

| 类型   | 表达式语法                    | 返回值         |
| ------ | ----------------------------- | -------------- |
| 主表   | `字段名称 as 别名`            | `{"别名":...}` |
| 关联表 | `数据表名称.字段名称 as 别名` | `{"别名":...}` |

**说明**

- 字段可以为主表字段名称、关联表字段名称、常量、函数等；关联表字段，需指定关联表名称 `关联表名称.字段名称`。
- 使用 `$` 标识符指定 `JSON Object` 字段。
- 使用 `@` 标识符指定 `JSON Array` 字段。
- 使用 `*` 标识符指定 `AES加密` 字段。
- 使用 `:` 标识符调用数据库提供的查询函数。
- 整型和浮点型常量可以直接使用；如 `1`, `0.618`。
- 使用 `'` 声明选择字段为字符串，如字符串中包含 `'`、`"`或 `\` 使用转义符 `\`转义；如 `北京` 写作 `'北京'`, `北京'"\通州区` 写作 `'北京\'\"\\通州区'`。
- 可以使用 `as` 设置别名，别名支持中文，如设置别名 `select` 查询结果以别名为键值、`wheres`,`order` 等可以视为主表字段使用。如 `name as 姓名`, `short_name as short`, `0.618 as 黄金分割`。

#### 2.2 表达式示例

##### 主表示例

| 示例                               | 记录值                                                      | 返回值                     | 说明                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `"name"`                           | `{"name":"云道天成"}`                                       | `{"name":"云道天成"}`      | 选择 `name` 字段                                                                                                             |
| `"short_name as short"`            | `{"short_name":"象传智慧"}`                                 | `{"short":"象传智慧"}`     | 选择 `short_name` 字段, 返回值字段命名为 `short`                                                                             |
| `"*mobile"`                        | `{"mobile":"B3FE5501344A312773A88160297C34C4"}`             | `{"mobile":"13111119999"}` | 选择 `AES 加密` 字段 `mobile`, 返回解密后的数值 **字段类型必须为 ASE 加密**                                                  |
| `"$extra"`                         | `{"extra":{"sex":"男"}}`                                    | `{"extra":{"sex":"男"}}`   | 选择 `JSON Object` 字段 `extra`, 返回解析后的 Object **字段类型必须为 JSON**                                                 |
| `"$extra.sex as sex"`              | `{"extra":{"sex":"男"}}`                                    | `{"sex":"男"}`             | 选择 `JSON Object` 字段 `extra` key = `sex` 的数值, 返回值字段命名为 `sex` **字段类型必须为 JSON**                           |
| `"@prices"`                        | `{"prices":[100,200,300]}`                                  | `{"prices":[100,200,300]}` | 选择 `JSON Array` 字段 `prices`, 返回解析后的 Array **字段类型必须为 JSON**                                                  |
| `"@prices[0] as price"`            | `{"prices":[100,200,300]}`                                  | `{"price":100}`            | 选择 `JSON Array` 字段 `prices` index = 0 的数值, 返回值字段命名为 `price` **字段类型必须为 JSON**                           |
| `"@addresses[0].id as address_id"` | `{"addresses":[{id:1,"city":"北京"},{id:2,"city":"上海"}]}` | `{"address_id":1}`         | 选择 `JSON Array<Object>` 字段 `addresses` index = 0, key = `id`的数值, 返回值字段命名为`address_id` **字段类型必须为 JSON** |

##### 关联表示例

| 示例                                  | 记录值(数据表 t2)                                           | 返回值                     | 说明                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `"t2.name"`                           | `{"name":"象传高新"}`                                       | `{"name":"象传高新"}`      | 选择连接表(`join`) `t2` 的 `name` 字段                                                                                                |
| `"t2.*mobile"`                        | `{"mobile":"B3FE5501344A312773A88160297C34C4"}`             | `{"mobile":"13111119999"}` | 选择 `t2` 的 `AES 加密` 字段 `mobile`, 返回解密后的数值 **字段类型必须为 ASE 加密**                                                   |
| `"t2.short_name as short"`            | `{"short_name":"象传应用引擎"}`                             | `{"short":"象传应用引擎"}` | 选择连接表(`join`) `t2` 的, 返回值字段命名为 `short`                                                                                  |
| `"t2.$extra.sex as sex"`              | `{"extra":{"sex":"男"}}`                                    | `{"sex":"男"}`             | 选择表`t2` 的 `JSON Object` 字段 `extra` key = `sex` 的数值, 返回值字段命名为 `sex` **字段类型必须为 JSON**                           |
| `"t2.@prices[0] as price"`            | `{"prices":[100,200,300]}`                                  | `{"price":100}`            | 选择表`t2` 的 `JSON Array` 字段 `prices` index = 0 的数值, 返回值字段命名为 `price` **字段类型必须为 JSON**                           |
| `"t2.@addresses[0].id as address_id"` | `{"addresses":[{id:1,"city":"北京"},{id:2,"city":"上海"}]}` | `{"address_id":1}`         | 选择表`t2` 的 `JSON Array<Object>` 字段 `addresses` index = 0, key = `id`的数值, 返回值字段命名为`address_id` **字段类型必须为 JSON** |

##### 函数示例

| 示例                          | 记录值                          | 返回值               | 说明                                                                |
| ----------------------------- | ------------------------------- | -------------------- | ------------------------------------------------------------------- |
| `":MAX(score) as high_score"` | `{"score":100},{"score":99}...` | `{"high_score":100}` | 使用函数 `MAX` 统计`score`字段最大值, 返回值字段命名为 `high_score` |

##### 常量示例

| 示例                       | 记录值 | 返回值                    | 说明                                                                    |
| -------------------------- | ------ | ------------------------- | ----------------------------------------------------------------------- |
| `"1 as price"`             | -      | `{"price":1}`             | 选择整型常量 `1`, 返回值命名为 `price`                                  |
| `"0.618 as price"`         | -      | `{"price":0.618}`         | 选择浮点型常量 `0.618`, 返回值命名为 `price`                            |
| `"'北京' as city"`         | -      | `{"city":"北京"}`         | 选择字符串常量 `北京`, 返回值命名为 `city`                              |
| `"'北京\"\'通州' as town"` | -      | `{"town":"北京\"\'通州"}` | 选择字符串常量 `北京"'通州`, `"`和`'`使用 `\`转义。 返回值命名为 `town` |
| `"'0.618' as str"`         | -      | `{"str":"0.618"}`         | 选择字符串常量 `0.618`, 返回值命名为 `str`                              |

### 3. 查询结果

#### 3.1 数据记录数组 `Array<Object Record>`

```json
[
  {
    "id": 2,
    "name": "象传高新（北京）数字科技有限公司"
  },
  {
    "id": 3,
    "name": "象传智慧（北京）软件科技有限公司"
  }
]
```

#### 3.2 带分页信息的数据记录数组 `Object Paginate`

```json
{
  "data": [
    {
      "id": 2,
      "name": "象传高新（北京）数字科技有限公司"
    },
    {
      "id": 3,
      "name": "象传智慧（北京）软件科技有限公司"
    }
  ],
  "next": 2,
  "page": 1,
  "pagecnt": 2,
  "pagesize": 2,
  "prev": -1,
  "total": 3
}
```

| 字段     | 类型                   | 说明                          |
| -------- | ---------------------- | ----------------------------- |
| data     | Array\<Object Record\> | 数据记录集合                  |
| next     | Integer                | 下一页，如没有下一页返回 `-1` |
| prev     | Integer                | 上一页，如没有上一页返回 `-1` |
| page     | Integer                | 当前页码                      |
| pagesize | Integer                | 每页记录数量                  |
| pagecnt  | Integer                | 总页数                        |
| total    | Integer                | 总记录数                      |

#### 3.3 数据记录数据结构 `Object Record`

Object Record 数据结构为:`[key:String]Any`

```json
{
  "id": 2,
  "link": {
    "label": "象传智慧",
    "url": "https://www.iqka.com"
  },
  "logo": null,
  "name": "象传高新（北京）数字科技有限公司",
  "rank": 9999999,
  "short_name": "象传高新",
  "status": "enabled",
  "summary": null,
  "type": "服务商",
  "updated_at": null
}
```

## 使用缓存

缓存（cache），是每个系统必不可少的一个功能，我们可以使用 Yao 自带的缓存功能，来进行一些临时数据存储

缓存可以使用lru,redis,mongo三种方式来实现。

### 使用LRU缓存

Store 使用缓存，新增文件`stores/cache.lru.json`：

应用目录结构:

```bash
├── apis        # 用于存放接口描述文件
├── models        # 用于存放数据模型描述文件
├── db
└── stores    #用于存放缓存目录
└── app.json
```

编写代码`cache.lru.json`：

```js
{
  "name": "LRU Cache",
  "description": "LRU缓存",
  "type": "lru",
  "option": { "size": 102400 }
}

```

在任意 JS 文件中使用缓存，Set 设置缓存，Get 获取缓存数据，新建`scripts/test.js`

```js
function cacheOperation() {
  var cache = new Store('cache');

  cache.Set('key', 'for bar .....');

  var cache_info = cache.Get('key');
  return cache_info;
}
```

运行 `yao run scripts.test.cacheOperation`

### 使用Redis缓存

需要配置redis数据库连接，参考![](../docs/YaoDSL/Connector/redis.md)
Store 使用缓存，新增文件`stores/cache.redis.json`：

编写代码`cache.redis.json`：

```json
{
  "name": "redis Cache",
  "description": "redis缓存",
  "connector": "redis"
}
```

### 使用Mongo缓存

需要配置mongo数据库连接，参考![](../docs/YaoDSL/Connector/mongo.md)

新增文件`stores/cache.mongo.json`：

编写代码`cache.mongo.json`：

```json
{
  "name": "redis Cache",
  "description": "redis缓存",
  "connector": "mongo"
}
```

### Store处理器

Store 的使用主要是通过处理器来处理：

Store 处理器的语法是`stores.[StoreID].set`,这里的 storeid 即是上面文件` product.mongo.yao`的 ID 部分。即是`product`。

```js
//设置值
Process('stores.product.Set', 'key1', 'value');

// redis支持超时配置
Process('stores.product.Set', 'key1', 'value', ttl);

//读取值
Process('stores.product.Get', 'key1');

//删除值
Process('stores.product.Del', 'key1');

//读取并删除
Process('stores.product.GetDel', 'key1');

//检查是否存在
Process('stores.product.Has', 'key1');

//获取长度
Process('stores.product.Len');

//获取所有key
Process('stores.product.Keys');

//清空
Process('stores.product.clear');
```

## sui

在 0.10.4 版本中，yao 主程序中增加一个新的创建前端界面的工具。在程序的名称为 sui。

它的工作原理是使用模板技术，结合 yao 独特的处理器调用方式生成 html 页面。用户访问的页面内容类似于 SSR 技术生成，并不是动态的页面内容。适合于博客，公司网站。

### sui 的功能介绍

- 有模板定义
- 有模板语法
- 支持调用后端处理器
- ssr 页面生成

### 程序流程

- 定义 sui 模板定义。

- 定义模板，静态页面配置。

- 在模板中生成页面的过程中，调用 yao 处理器，通过处理器获取动态数据。

- 生成前端页面。

### 使用设计器

- 页面设计器读取页面配置信息。

- 用户使用编辑器定义模板，上传资源，定义模板中的数据来源【使用处理器】。

- 页面编辑，页面预览。

- 编译模板，发布并生成页面。

- 用户访问，根据请求的路由信息，读取页面源代码，并且页面关联的处理器读取数据填充模板。最后输出页面。

### SUI 工作原理

- 用户定义模板与页面组件，此时的模板还不能直接使用。

- 运行`yao sui build`命令，编译用户编写的模板，生成前端模板。

- 运行`yao start`命令，启动 yao 主程序。后端服务会根据路由信息，读取页面源代码，并且页面关联的处理器读取数据填充模板。最后输出页面。

## SUI 开发套件提供了 3 个命令工具

### 构建单一文件

可以使用以下命令进行页面构建。

- `yao sui build <sui> <template> -d [data] -D`
- `yao sui build <sui> <template> --data [data] --debug`

数据参数 `-d [data]` 为可选参数，数据格式为 json,在命令行里输入时需要加上`::`作为前缀，比如 json 对象需要使用格式：`::{}`。还可以使用调试参数 debug，简写为：`-D`。

执行命令时需要指定`sui id`与`template id`,比如`yao sui build <sui> <template> [data]`,`sui`是指 sui 配置 id,`template`是指模板 id,

### 实时编译

模板文件变化时自动构建，使用参数`-d`指定会话数据。

- `yao sui watch <sui> <template> --data [data]`
- `yao sui watch <sui> <template> -d [data]`

### 翻译

在模板的子目录`__locales`下需要有对应的文件夹。

语言文件：

全局配置文件`/data/blogs/website/__locales/<language_id>/__global.yml`

某一页面对应的语言配置文件`/data/blogs/website/__locales/<language_id>/<page_route>.yml`

- `yao sui trans <sui> <template> --data [data] --locales "zh-CN" --deubg true`
- `yao sui trans <sui> <template> -d [data] -l "zh-CN" -D`

参数`--locales`支持同时多个语言，以`,`隔开,比如`zh-CN,en-US`

### 示例

比如有以下目录结构

```sh
├── suis
│   └── demo.sui.yao                //sui配置文件
├── data
│   └── demo_sui_tpl
│       └── website                 //template_id
│           ├── __assets            //引用assets目录下的文件需要使用语法@assets/,yao会自动编译成对应的目录
│           │   └── css
│           │       └── tailwind.min.css
│           ├── __document.html     //共用的html框架文件，比如在这里引用其它的js/css
│           └── index               //每一下页面需要使用单独的目录
│               └── index.html      //用户需要编辑的文件，html文件或是其它文件都需要与文件名同名
├── public
│   ├── demo
│   │   ├── assets                  //复制的assets目录
│   │   │   └── css
│   │   │       └── tailwind.min.css
│   │   └── index.sui               //编译输出内容,不需要修改
│   └── index.html
```

文件`demo.sui.yao`配置内容

```json
{
  "name": "demo",
  "storage": {
    "driver": "local", //存储方式
    "option": {
      "root": "/demo_sui_tpl" //模板位置，目录/data/demo_sui_tpl
    }
  },
  "public": {
    "root": "/demo", //访问路由，输出文件的目录/public/demo
    "remote": "/",
    "index": "/index", //前端访问入口地址
    "matcher": ""
  }
}
```

### watch 命令

当源文件有变化时，会自动的进行编译。

```sh
[root@thinkbook14 sui-dev-app]# yao sui watch demo website
-----------------------
Public Root: /public/demo
   Template: /demo_sui_tpl/website
    Session: {}
-----------------------
Watching...
Press Ctrl+C to exit
Building...  Success (12ms)
Building...  Success (6ms)
Building...  Success (7ms)
Building...  Success (8ms)
```

## SUI 页面自动插入的内容

### 自动注入的脚本

在 sui 页面编译过程中，会自动的在页面中插入一些内容。

- 全局数据。

- 组件关连的脚本。

- 全局 js 对象。
  为了方便用户操作页面，sui 页面会自动的注入一些全局对象。

#### Yao 对象

用于操作页面的一些 API。比如获取 Token，获取 Cookie，设置 Cookie，删除 Cookie，序列化数据等。

```ts
/**
 * Yao Object
 * @param {*} host
 */
function Yao(host) {}

/**
 * Get API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Get = async function (path, params, headers) {};

/**
 * Post API
 * @param {*} path
 * @param {*} data
 * @param {*} params
 * @param {*} headers
 */
Yao.prototype.Post = async function (path, data, params, headers) {};

/**
 * Download API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Download = async function (path, params, savefile, headers) {};

/**
 *
 * Fetch API
 * @param {*} method
 * @param {*} path
 * @param {*} params
 * @param {*} data
 * @param {*} headers
 */
Yao.prototype.Fetch = async function (
  method,
  path,
  params,
  data,
  headers,
  isblob
) {};
/** 获取Token */
Yao.prototype.Token = function () {};
/** 获取Cookie */
Yao.prototype.Cookie = function (cookieName) {};
/** 设置Cookie */
Yao.prototype.SetCookie = function (cookieName, cookieValue, expireDays) {};
/** 删除Cookie */
Yao.prototype.DeleteCookie = function (cookieName) {};

/**
 * Serialize To Query String
 * @param {*} obj
 * @returns
 */
Yao.prototype.Serialize = function (obj) {};
```

使用方法：

```js
const yao = new Yao();
const token = yao.Token();
const cookie = yao.Cookie('cookieName');
yao.SetCookie('cookieName', 'cookieValue', 7);
yao.DeleteCookie('cookieName');
const data = yao.Serialize({ key: 'value' });

const rest = await yao.Get('/api/path', params, headers);
const rest = await yao.Post('/api/path', { key: 'value' }, params, headers);
// savefile filename to save
await yao.Download('/api/path', params, savefile, headers);
```

#### Dom 操作

Query SUI 组件选择器

```ts
function $Query(selector: string | Element): __Query {
  return new __Query(selector);
}
```

用于操作页面 DOM 的对象。

```ts
/**
 * Class for DOM manipulation and traversal.
 */
class __Query {
  /**
   * The selector or element used for querying.
   */
  selector: string | Element | NodeListOf<Element> | undefined = '';
  /**
   * All matched elements or null.
   */
  elements: NodeListOf<Element> | null = null;
  /**
   * Create a query instance.
   */
  element: Element | null = null;

  /**
   * Create a query instance.
   */
  constructor(selector: string | Element | NodeListOf<Element>) {
    if (typeof selector === 'string') {
      this.selector = selector;
      this.elements = document.querySelectorAll(selector);
      if (this.elements.length > 0) {
        this.element = this.elements[0];
      }
    } else if (selector instanceof NodeList) {
      this.elements = selector;
      if (this.elements.length > 0) {
        this.element = this.elements[0];
      }
    } else {
      this.element = selector;
    }

    this.selector = selector;
  }
  /**
   * Get the current element.
   */
  elm(): Element | null {
    return this.element;
  }

  /**
   * Get all matched elements.
   */
  elms(): NodeListOf<Element> | null {
    return this.elements;
  }

  /**
   * Find child elements by selector.
   */
  find(selector: string): __Query | null {
    const elm = this.element?.querySelector(selector);
    if (elm) {
      return new __Query(elm);
    }
    return null;
  }

  findAll(selector: string): __Query | null {
    const elms = this.element?.querySelectorAll(selector);
    if (elms) {
      return new __Query(elms);
    }
    return null;
  }

  /**
   * Find the closest matching ancestor.
   */
  closest(selector: string): __Query | null {
    const elm = this.element?.closest(selector);
    if (elm) {
      return new __Query(elm);
    }
    return null;
  }

  /**
   * Add event listener.
   */
  on(event: string, callback: (event: Event) => void): __Query {
    if (!this.element) {
      return this;
    }
    this.element.addEventListener(event, callback);
    return this;
  }

  //根组件
  $$() {
    if (!this.element) {
      return null;
    }
    const root = this.element.closest('[s\\:cn]');
    if (!root) {
      return null;
    }

    // @ts-ignore
    return $$(root);
  }
  /**
   * Iterate over elements.
   */
  each(callback: (element: __Query, index: number) => void) {
    if (!this.elements) {
      return;
    }
    this.elements.forEach((element, index) => {
      callback(new __Query(element), index);
    });
    return;
  }

  /**
   * Get the associated store.
   */
  store() {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }

    // @ts-ignore
    return new __sui_store(this.element);
  }

  /**
   * Get an attribute value.
   */
  attr(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    return this.element.getAttribute(key);
  }

  /**
   * Get data-attribute value.
   */
  data(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    return this.element.getAttribute('data:' + key);
  }

  /**
   * Get JSON data.
   */
  json(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    const v = this.element.getAttribute('json:' + key);
    if (!v) {
      return null;
    }
    try {
      return JSON.parse(v);
    } catch (e) {
      console.error(`Error parsing JSON for key ${key}: ${e}`);
      return null;
    }
  }

  /**
   * Get a property value.
   */
  prop(key) {
    if (!this.element || typeof this.element.getAttribute !== 'function') {
      return null;
    }
    const k = 'prop:' + key;
    const v = this.element.getAttribute(k);
    const json = this.element.getAttribute('json-attr-prop:' + key) === 'true';
    if (json && v) {
      try {
        return JSON.parse(v);
      } catch (e) {
        console.error(`Error parsing JSON for prop ${key}: ${e}`);
        return null;
      }
    }
    return v;
  }

  /**
   * Check if the element has a class.
   */
  hasClass(className) {
    return this.element?.classList.contains(className);
  }

  /**
   * Toggle classes.
   */
  toggleClass(className) {
    const classes = Array.isArray(className)
      ? className
      : className?.split(' ');
    classes?.forEach((c) => {
      const v = c.replace(/[\n\r\s]/g, '');
      if (v === '') return;
      this.element?.classList.toggle(v);
    });
    return this;
  }

  /**
   * Remove classes.
   */
  removeClass(className) {
    const classes = Array.isArray(className)
      ? className
      : className?.split(' ');
    classes?.forEach((c) => {
      const v = c.replace(/[\n\r\s]/g, '');
      if (v === '') return;
      this.element?.classList.remove(v);
    });
    return this;
  }

  /**
   * Add classes.
   */
  addClass(className) {
    const classes = Array.isArray(className)
      ? className
      : className?.split(' ');
    classes?.forEach((c) => {
      const v = c.replace(/[\n\r\s]/g, '');
      if (v === '') return;
      this.element?.classList.add(v);
    });
    return this;
  }

  /**
   * Get or set inner HTML.
   */
  html(html?: string): __Query | string {
    if (html === undefined) {
      return this.element?.innerHTML || '';
    }
    if (this.element) {
      this.element.innerHTML = html;
    }
    return this;
  }
}
```

#### SUI 组件选择器

```ts
/**
 * Dom Object
 * @param {*} selector 选择器,html元素或是组件，
 * @returns Sui 组件
 */
function $$(selector) {
  let elm: HTMLElement | null = null;
  if (typeof selector === 'string') {
    elm = document.querySelector(selector);
  }

  if (selector instanceof HTMLElement) {
    elm = selector;
  }

  if (elm) {
    const cn = elm.getAttribute('s:cn');
    if (cn && cn != '' && typeof window[cn] === 'function') {
      const component = new window[cn](elm);
      //elm ,html元素，
      //yao component组件对象，每一个组件都会有对应的js对象,会在编译的过程中自动生成。
      return new __sui_component(elm, component);
    }
  }
  return null;
}
```

这里会有点复杂，组件中包含了不同的对象，比如状态，事件处理，属性，方法等。

```ts
/**
 * 创建一个sui组件对象
 * @param {*} elm 组件的html元素
 * @param {*} component 组件对象，用户通常需要自定义组件对象的处理函数，与组件同名的js或是ts文件。
 * @returns sui组件对象
 */
function __sui_component(elm, component) {
  this.root = elm;

  // 读取与保存组件的状态数据
  // $$(dropdown).store.Get("selected")
  this.store = new __sui_store(elm); //保存组件的数据

  // 父组件传入的属性
  this.props = new __sui_props(elm); //保存组件的属性

  //组件的事件处理，使用Set方法来触发事件处理函数。
  this.state = component ? new __sui_state(component) : {}; //保存组件的状态

  const __self = this;

  //封装 html 对象
  this.$root = new __Query(this.root);

  this.find = function (selector) {
    // @ts-ignore
    return new __Query(__self.root).find(selector);
  };
  // 查找组件的子组件
  // 示例： $$(input).query("[input-element]").setAttribute("placeholder", placeholder);
  this.query = function (selector) {
    return __self.root.querySelector(selector);
  };
  // 查找组件的子组件列表
  this.queryAll = function (selector) {
    return __self.root.querySelectorAll(selector);
  };
  // 触发组件事件
  this.emit = function (name, data) {
    const event = new CustomEvent(name, { detail: data });
    __self.root.dispatchEvent(event);
  };
  // 渲染组件
  this.render = function (name, data, option) {
    // @ts-ignore
    const r = new __Render(__self, option);
    return r.Exec(name, data);
  };
}

/**
 * 组件的状态处理，组件通过回调函数进行响应处理，如果在组件中定义了watch对象，则会自动调用watch中的函数。
 *
 * 把事件向传到父组件中，父组件可以通过watch对象来监听组件的状态变化。
 *
 * @param {*} component yao sui组件对象，用户通常需要自定义组件对象的处理函数，与组件同名的js或是ts文件。
 */
function __sui_state(component) {
  this.handlers = component.watch || {}; //组件需要在组件对象中定义watch对象，用于监听组件状态的变化。
  //当组件状态发生变化时，会自动调用组件对象中的watch对象中的函数。
  this.Set = async function (key, value, target) {
    const handler = this.handlers[key];
    //target对象默认是当前组件对象，如果target对象是组件对象，则使用组件对象中的root对象【html对象】。
    target = target || component.root;
    if (handler && typeof handler === 'function') {
      const stateObj = {
        target: target,
        stopPropagation: function () {
          target.setAttribute('state-propagation', 'true');
        }
      };
      // Call the state change handler，watch中的函数会有两个参数，第一个参数是新的值，第二个参数是状态对象，可以理解成事件对象。
      await handler(value, stateObj);
      // 默认情况下会向上传播状态变化，除非在watch中的函数中调用了stateObj.stopPropagation()函数。
      const isStopPropagation = target
        ? target.getAttribute('state-propagation') === 'true'
        : false;
      if (isStopPropagation) {
        return;
      }

      let parent = component.root.parentElement?.closest(`[s\\:cn]`);
      if (parent == null) {
        return;
      }

      // Dispatch the state change custom event to parent component
      const event = new CustomEvent('state:change', {
        detail: { key: key, value: value, target: component.root }
      });
      parent.dispatchEvent(event);
    }
  };
}

/**
 * 组件的读取，只读取props:开头的属性。当一个组件被其它组件使用时，
 * 在编译过程中，会把上级的属性并且以`props`为前缀的复制到子组件中。
 * 所以这些属性都是只读的，不能修改。
 *
 * @param {*} elm 组件的html元素
 * @returns
 */
function __sui_props(elm) {
  this.Get = function (key) {
    if (!elm || typeof elm.getAttribute !== 'function') {
      return null;
    }
    const k = 'prop:' + key;
    const v = elm.getAttribute(k);
    const json = elm.getAttribute('json-attr-prop:' + key) === 'true';
    if (json) {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    }
    return v;
  };

  this.List = function () {
    const props = {};
    if (!elm || typeof elm.getAttribute !== 'function') {
      return props;
    }

    const attrs = elm.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (attr.name.startsWith('prop:')) {
        const k = attr.name.replace('prop:', '');
        const json = elm.getAttribute('json-attr-prop:' + k) === 'true';
        if (json) {
          try {
            props[k] = JSON.parse(attr.value);
          } catch (e) {
            props[k] = null;
          }
          continue;
        }
        props[k] = attr.value;
      }
    }
    return props;
  };
}
```

#### Store 对象

用于存储页面数据的对象。

```ts
/**
 * 组件的状态处理，利用组件的属性来保存组件的数据
 *
 * @param {*} elm 组件的html元素
 * @returns
 *
 */
function __sui_store(elm) {
  elm = elm || document.body;

  this.Get = function (key) {
    return elm.getAttribute('data:' + key);
  };
  //把数据保存在组件的html元素中
  this.Set = function (key, value) {
    elm.setAttribute('data:' + key, value);
  };

  this.GetJSON = function (key) {
    const value = elm.getAttribute('json:' + key);
    if (value && value != '') {
      try {
        const res = JSON.parse(value);
        return res;
      } catch (e) {
        const message = e.message || e || 'An error occurred';
        console.error(`[SUI] Event Handler Error: ${message}`, elm);
        return null;
      }
    }
    return null;
  };

  this.SetJSON = function (key, value) {
    elm.setAttribute('json:' + key, JSON.stringify(value));
  };

  //后端的数据会通过这个属性传输到前端。
  //组件需要在后端脚本【组件同名的.backend.ts】中BeforeRender方法中设置组件的数据。
  this.GetData = function () {
    return this.GetJSON('__component_data') || {};
  };
}
```

Store 选择器

```ts
function $Store(elm) {
  if (!elm) {
    return null;
  }

  if (typeof elm === 'string') {
    elm = document.querySelectorAll(elm);
    if (elm.length == 0) {
      return null;
    }
    elm = elm[0];
  }
  // @ts-ignore
  return new __sui_store(elm);
}
```

sui lib 内容，主要是 js 脚本。

语言翻译，多语言，在 js 脚本中可以使用`__m`进行翻译。

```html
<script type="text/javascript">
  let __sui_locale = {};
  try {
  	__sui_locale = %s;
  } catch (e) { __sui_locale = {}  }

  function __m(message, fmt) {
  	if (fmt && typeof fmt === "function") {
  		return fmt(message, __sui_locale);
  	}
  	return __sui_locale[message] || message;
  }
</script>
```

全局对象：\_\_sui_data 保存了页面的全局数据。包含请求的对象，cookie，主题，语言，时区，payload，参数，url 等。

加载事件处理，处理`s:ready`事件。

```html
<script name="imports" type="json">
  []
</script>

<script type="text/javascript">
  try {
    var __sui_data = {
      $query: { x: ['1223'] },
      $cookie: {
        TOKEN:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic2lkIjoiMWYzZTMxNjQtYjM1ZS00MWU4LTkwZGUtNjZkOWM1ZjgxOTMxIiwiZGF0YSI6e30sImF1ZCI6IllhbyBQcm9jZXNzIHV0aWxzLmp3dC5NYWtlIiwiZXhwIjoxNzEwOTU3OTUwLCJqdGkiOiIxIiwiaWF0IjoxNzEwOTI5MTUwLCJpc3MiOiJ4aWFuZzoxIiwibmJmIjoxNzEwOTI5MTUwLCJzdWIiOiJVc2VyIFRva2VuIn0.P3pTPWn9jF__3vjo9-u7m66j9H_1IcC2zLNMCi4V8BE'
      },
      $theme: null,
      $locale: null,
      $timezone: '+08:00',
      $payload: null,
      $param: {},
      $url: {
        host: 'localhost:5099',
        domain: 'localhost',
        path: '/demo/index',
        scheme: 'http',
        url: 'http://localhost:5099/demo/index'
      },
      $direction: 'ltr'
    };
  } catch (e) {
    console.log('init data error:', e);
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      document.querySelectorAll('[s\\:ready]').forEach(function (element) {
        const method = element.getAttribute('s:ready');
        const cn = element.getAttribute('s:cn');
        if (method && typeof window[cn] === 'function') {
          try {
            window[cn](element);
          } catch (e) {
            const message = e.message || e || 'An error occurred';
            console.error(`[SUI] ${cn} Error: ${message}`);
          }
        }
      });
    } catch (e) {}
  });
</script>
```

### 事件处理

函数`__sui_event_init`会在页面加载完成后调用，初始化绑定页面及组件的事件。

在组件中，使用`s:event-xxxx`属性来绑定事件。

在组件中使用`s:data-xxxx`属性,`s:json-xxxx`属性来设置事件的数据。

也可以在组件中使用`data:xxx`属性,`json:xxxx`属性来设置事件的数据。

```html
<li
  s:for="categories"
  class="
      px-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-200
      hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer
      border-b-2
      {{ item.name == articles.category ? 'text-primary-500 dark:text-primary-400  border-primary-500 dark:border-primary-400' : 'border-transparent ' }}
    "
  s:data-category="{{ item.name }}"
  s:on-click="LoadCategory"
  category
>
  {{ item.name }}
</li>
```

在`.backend.ts`中，编写事件响应处理函数。

```ts
/**
 * When category is changed, load articles
 * @param event 浏览器事件
 * @param data 组件的关联数据
 * @prram detail 事件关联的数据
 */
self.LoadCategory = async function (
  event: MouseEvent,
  data: EventData,
  detail: {
    rootElement: HtmlElement; //即是本组件
    targetElement: HtmlElement; // 点击的元素,事件源
  }
) {
  // Active and inactive class
  const active =
    'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400';
  const inactive = 'border-transparent';

  // Prevent default behavior ( href redirect )
  event.preventDefault();

  // Get category and store it
  const category = data.category || null;
  self.store.Set('category', category);

  // Change item style
  $Query('[category]').each((el) => {
    el.removeClass(active).addClass(inactive);
    // Current category
    if ($Store(el.element as HTMLElement).Get('category') === category) {
      el.removeClass(inactive).addClass(active);
    }
  });

  // Load articles
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);

  // Render articles
  await self.render('articles', { articles });
};
```

示例 2：

```ts
/**
 *  When the item is clicked, raise the item-click event and toggle the selected state
 * @param event
 * @param data
 * @param detail
 * @returns
 */
self.onItemClick = (
  event: Event,
  data: Record<string, any>,
  detail: Record<string, any>
) => {
  debugger;
  event.stopPropagation();
  const item = data.item || {};
  const props = self.store.GetData(); //这里是取的`.backend.ts`中函数`BeforeRender`返回对象。
  const mode = props.mode || 'single';

  // Single mode select the item
  if (mode == 'single') {
    unselectAllItems();
    selectItem(detail.targetElement);
    self.root.dispatchEvent(new CustomEvent('item-click', { detail: item }));
    return;
  }

  // Multiple mode item has been selected
  if (item.selected) {
    unselectItem(detail.targetElement);
    self.root.dispatchEvent(
      new CustomEvent('item-click', { detail: { ...item, selected: false } })
    );
    return;
  }

  // Multiple mode item unselected
  selectItem(detail.targetElement);
  self.root.dispatchEvent(
    new CustomEvent('item-click', { detail: { ...item, select: true } })
  );
  return;
};
```

```ts
/**
 * 事件处理
 * @param event 浏览器原始事件
 * @param dataKeys 在组件中使用data:xxxx属性定义的属性，使用self.store.Get()/Set()可以访问或是设置组件的data数据。
 * @param jsonKeys 在组件中使用json:xxxx属性定义的属性, 使用self.store.GetJSON()/SetJSON()可以访问或是设置组件的json数据。
 * @param target 事件源,HTML元素，比如组件中的某一个按钮或是html元素
 * @param root SUI组件所在的根元素，HTML元素
 * @param handler 在`.backend.ts`中定义的事件响应处理函数
 * @returns
 */
function __sui_event_handler(
  event,
  dataKeys,
  jsonKeys,
  target,
  root,
  handler: Function
) {
  const data = {};
  target = target || null;
  if (target) {
    dataKeys.forEach(function (key) {
      const value = target.getAttribute('data:' + key);
      data[key] = value;
    });
    jsonKeys.forEach(function (key) {
      const value = target.getAttribute('json:' + key);
      data[key] = null;
      if (value && value != '') {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          const message = e.message || e || 'An error occurred';
          console.error(`[SUI] Event Handler Error: ${message} `, target);
        }
      }
    });
  }
  // 用户定义的事件处理函数
  handler &&
    handler(event, data, {
      rootElement: root,
      targetElement: target
    });
}

/**
 * 事件初始化
 * @param elm 页面的根元素
 * @returns
 */
function __sui_event_init(elm: Element) {
  /**
   * 绑定事件
   * @param eventElm 事件源
   * @returns
   */
  const bindEvent = (eventElm) => {
    const cn = eventElm.getAttribute('s:event-cn') || '';
    if (cn == '') {
      console.error('[SUI] Component name is required for event binding', elm);
      return;
    }

    // Data keys
    // 收集用户定义的事件
    const events: Record<string, string> = {};
    //收集data:xxxx属性
    //收集json:xxxx属性
    const dataKeys: string[] = [];
    const jsonKeys: string[] = [];
    for (let i = 0; i < eventElm.attributes.length; i++) {
      if (eventElm.attributes[i].name.startsWith('data:')) {
        dataKeys.push(eventElm.attributes[i].name.replace('data:', ''));
      }
      if (eventElm.attributes[i].name.startsWith('json:')) {
        jsonKeys.push(eventElm.attributes[i].name.replace('json:', ''));
      }
      if (eventElm.attributes[i].name.startsWith('s:on-')) {
        const key = eventElm.attributes[i].name.replace('s:on-', '');
        events[key] = eventElm.attributes[i].value;
      }
    }

    // Bind the event
    for (const name in events) {
      const bind = events[name];
      if (cn == '__page') {
        const handler = window[bind];
        const root = document.body;
        const target = eventElm;
        eventElm.addEventListener(name, (event) => {
          __sui_event_handler(event, dataKeys, jsonKeys, target, root, handler);
        });
        continue;
      }
      //如果是子组件，需要找到它的父组件
      const component = eventElm.closest(`[s\\:cn=${cn}]`);
      if (typeof window[cn] !== 'function') {
        console.error(`[SUI] Component ${cn} not found`, eventElm);
        return;
      }

      // @ts-ignore
      const comp = new window[cn](component);
      const handler = comp[bind];
      const root = comp.root;
      const target = eventElm;
      eventElm.addEventListener(name, (event) => {
        __sui_event_handler(event, dataKeys, jsonKeys, target, root, handler);
      });
    }
  };

  //查询所有包含s:event属性的元素
  const eventElms = elm.querySelectorAll('[s\\:event]');
  //查询所有包含s:event-jit属性的元素
  const jitEventElms = elm.querySelectorAll('[s\\:event-jit]');
  eventElms.forEach((eventElm) => bindEvent(eventElm));
  jitEventElms.forEach((eventElm) => bindEvent(eventElm));
}
```

### 浏览器渲染

在浏览器中，无刷新更新的方法。

通过调用 api，传入上下文数据，返回页面的 html 代码。

组件需要设置属性：`s:render="name"`。

```ts
/**
 * SUI Render
 * @param component
 * @param name
 */
async function __sui_render(
  component: Component | string,
  name: string,
  data: Record<string, any>,
  option?: RenderOption
): Promise<string> {
  const comp = // 获取组件，可以传入组件名称
    // sui_component
    (typeof component === 'object' ? component : $$(component)) as Component;

  if (comp == null) {
    console.error(`[SUI] Component not found: ${component}`);
    return Promise.reject('Component not found');
  }

  const elms = comp.root.querySelectorAll(`[s\\:render=${name}]`);
  if (!elms.length) {
    console.error(`[SUI] No element found with s:render=${name}`);
    return Promise.reject('No element found');
  }

  // Set default options
  option = option || {};
  option.replace = option.replace === undefined ? true : option.replace;
  option.showLoader =
    option.showLoader === undefined ? false : option.showLoader;
  option.withPageData =
    option.withPageData === undefined ? false : option.withPageData;

  // Prepare loader
  let loader = `<span class="sui-render-loading">Loading...</span>`;
  if (option.showLoader && option.replace) {
    if (typeof option.showLoader === 'string') {
      loader = option.showLoader;
    } else if (option.showLoader instanceof HTMLElement) {
      loader = option.showLoader.outerHTML;
    }
    elms.forEach((elm) => (elm.innerHTML = loader));
  }

  // Prepare data
  let _data = comp.store.GetData() || {};
  if (option.withPageData) {
    // @ts-ignore
    _data = { ..._data, ...__sui_data };
  }

  // get s:route attribute
  const elm = comp.root.closest('[s\\:route]');
  const routeAttr = elm ? elm.getAttribute('s:route') : false;
  const root = document.body.getAttribute('s:public') || '';
  const route = routeAttr ? `${root}${routeAttr}` : window.location.pathname;
  option.component = (routeAttr && comp.root.getAttribute('s:cn')) || '';

  const url = `/api/__yao/sui/v1/render${route}`;
  const payload = { name, data: _data, option };

  // merge the user data
  if (data) {
    for (const key in data) {
      payload.data[key] = data[key];
    }
  }
  const headers = {
    'Content-Type': 'application/json',
    Cookie: document.cookie
  };

  // Native post request to the server
  try {
    const body = JSON.stringify(payload);
    const response = await fetch(url, { method: 'POST', headers, body: body });
    const text = await response.text();
    if (!option.replace) {
      return Promise.resolve(text);
    }

    // Set the response text to the elements
    elms.forEach((elm) => {
      elm.innerHTML = text;
      try {
        // 重新初始化新生成的组件的事件
        __sui_event_init(elm);
      } catch (e) {
        const message = e.message || 'Failed to init events';
        Promise.reject(message);
      }
    });

    return Promise.resolve(text);
  } catch (e) {
    //Set the error message
    elms.forEach((elm) => {
      elm.innerHTML = `<span class="sui-render-error">Failed to render</span>`;
      console.error('Failed to render', e);
    });
    return Promise.reject('Failed to render');
  }
}

class __Render {
  comp = null;
  option = null;
  constructor(comp, option) {
    this.comp = comp;
    this.option = option;
  }
  async Exec(name, data): Promise<string> {
    // @ts-ignore
    return __sui_render(this.comp, name, data, this.option);
  }
}
```

使用示例：

用法选择不同的分类，会重新加载文章列表。此时界面不需要更新。

```ts
/**
 * When category is changed, load articles
 * @param event
 * @param data
 */
self.LoadCategory = async function (event: MouseEvent, data: EventData) {
  // Active and inactive class
  const active =
    'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400';
  const inactive = 'border-transparent';

  // Prevent default behavior ( href redirect )
  event.preventDefault();

  // Get category and store it
  const category = data.category || null;
  self.store.Set('category', category);

  // Change item style
  $Query('[category]').each((el) => {
    el.removeClass(active).addClass(inactive);
    // Current category
    if ($Store(el.element as HTMLElement).Get('category') === category) {
      el.removeClass(inactive).addClass(active);
    }
  });

  // Load articles
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);

  // Render articles
  await self.render('articles', { articles });
};
```

## 使用 builder 创建 sui 页面

**此功能已被停用**

创建一个空的目录，进入目录，执行 yao start

```sh
mkdir sui-demo
cd sui-demo

yao start
```

yao 会自动的初始化一个模板项目工程文件，并且打开默认的 5099 端口让用户配置数据库连接。

### aigc 配置

如果页面中有标签属性`"aigc-enabled"=true`,可以使用 ai 来帮助生成页面。

要启用 ai 生成页面，需要以下的配置。

修改应用目录下的 app.yao 配置文件，增加以下的配置。

```json
{
  "moapi": {
    "secret": "sk-",
    "mirrors": ["api.openai.com"]
  }
}
```

如果页面里包含以下页面，在设计器的右边会显示一个小图标。点击图标，输入 prompt。

```html
<div aigc-enabled="true">aigc</div>
```

比如输入。

```md
你是一个 tailwind 专家，给我生成一个用户登录界面,居中，手机显示时全屏。
```

### 使用命令

打印数据：
`http://localhost:5099/signup/wechat?__sui_print_data`，`__sui_print_data` 带这个 Query 参数访问的时候能看到读取的数据

### 使用 vscode

可以选择 vscode 作为页面编辑工具。

实时编译，使用`yao sui watch` 监控模板目录，当页面内容有变化时，自动构建所有页面，这个跟 builder 上的"发布所有页面"的功能是一样的。

```sh
yao sui watch  "<sui id>" "<template>" -d '::{sessiong data}'

yao sui watch "blog" "website" -d '::{}'
```

## 使用 sui 搭建博客网站

使用 sui 之前需要先了解下 sui 的整体框架与处理流程：

框架：

在设计时，sui 有三层结构：sui->template->page。

- sui，可以配置多套 sui 页面。

- template,每个 sui 又可以配置多个模板，比如按主题样式，配置蓝色，灰色等。

- page,在每套模板中可以创建多个页面，页面之间可以进行引用。

处理流程：

- 定义 sui
- 创建模板目录
- 创建页面目录

- 构建
- 预览
- 发布

### 目录结构

首先需要在应用目录的`suis`目录下创建一个 sui 配置定义文件,配置文件后缀名可以是`*.sui.yao", "*.sui.jsonc", "*.sui.json`。其中`.yao`,`.jsonc` 是 json 的变种，可以增加注释。

在 sui 配置文件中定义的模板的存储方式与模板存储位置

`/suis/blog.sui.yao`

```json
{
  "name": "blog",
  "guard": "guard", //
  "storage": {
    "driver": "local", //存储方式
    "option": {
      "root": "/blogs" //模板位置,如果没有配置，默认是/data/sui/templates
    }
  },
  "public": {
    "root": "/blog", //访问路由
    "remote": "/",
    "index": "/index", //前端访问入口地址
    "matcher": "" //目录正则匹配表达式，如果没有配置，则是完全匹配
  },
  "cache_store": "" //缓存配置
}
```

比如在配置文件里配置了`"root": "/blogs" `与`"driver": "local"`。下一步就需要在应用的 data 目录下创建模板文件目录与相关的文件。

官方后期应该会有页面编辑器配合使用。但是如果不用编辑器，也是可以直接使用这套模板工具的。

每一套 sui 下面可以有多套模板,比如这里的模板是 website,每一个模板都是一个独立目录。

```sh
├data目录
├── blogs                           # 对应sui的配置
│   └── website                     # 每一套sui下面可以有多套模板,比如这里的模板是website,每一个模板都是一个独立目录。
│       ├── article                 # article页面模板
│       │   ├── article.config
│       │   ├── article.html
│       │   ├── article.js
│       │   └── article.json
│       ├── __assets                # 页面开发过程中引用的资源
│       │   ├── css                 # css文件，比如放入tailwind的css
│       │   ├── dark
│       │   ├── fonts
│       │   ├── images
│       │   ├── js
│       │   ├── libs
│       │   ├── light
│       │   ├── main.js
│       ├── __blocks               # 编辑器中定义的布局
│       │   ├── ColumnsTwo
│       │   ├── export.json
│       │   ├── Hero
│       │   ├── Section
│       │   └── Table
│       ├── __components          # 在编辑器器中页面可以使用的组件
│       │   ├── Box
│       │   ├── Card
│       │   └── Nav
│       ├── __data.json           # 全局数据定义，在页面中使用$global来引用
│       ├── __document.html       # 模板页面
│       ├── template.json         # 模板配置
│       ├── __build.backend.ts         # 构建时的ts文件
│       ├── __build.backend.js         # 模板配置
│       ├── __global.backend.ts        # 模板配置
│       ├── __global.backend.js         # 模板配置
│       ├── index                 # 页面模板index
│       │   ├── index.config
│       │   ├── index.css
│       │   ├── index.html
│       │   ├── index.ts
│       │   ├── index.js
│       │   ├── index.backend.ts    #后台执行处理器的脚本文件
│       │   ├── index.backend.js
│       │   └── index.json
│       ├── __locales            # 多语言支持
│       │   ├── ar
│       │   ├── zh-cn
│       │   └── zh-tw
│       ├── __services
│       │   ├── article.ts
│       │   └── __pages
│       ├── website.json         # 模板全局配置
│       └── __yao
│           ├── core.ts
│           └── types.ts
```

上面目录中的`acticle`与`index`的目录可以理解为`acticle.html`与`index.html`页面的构建临时目录,其它的带有`__`下划线的目录都是辅助目录。

### 重要的文件

`__document.html` 是页面的最外层模板文档，可以用于整个页面应用的框架。 在这个文档中会通过变量`{{ __page }}`来引用具体的页面，在用户访问时，会根据不同的路由替换不同的页面。

```html
<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth" dir="ltr">

<head>
  <meta charset="UTF-8" />
  <title>
    Yao Sui Page
  </title>
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="description" content="Tailwind CSS Saas & Software Landing Page Template" />
  <meta name="keywords"
    content="yao, application, tailwind css" />
  <meta name="author" content="Shreethemes" />
  <meta name="website" content="https://shreethemes.in" />
  <meta name="email" content="support@shreethemes.in" />
  <meta name="version" content="2.0.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  </link>

  <!-- favicon -->

  <!-- CSS -->

  <!-- Main Css -->

  <link rel="stylesheet" href="@assets/css/tailwind.min.css" />
</head>

<body>
{{ __page }}
<!-- JAVASCRIPTS -->

</body>

</html>
```

#### template.json

示例：

```json
{
  "name": "Yao Official Website",
  "description": "The official website of Yao.",
  "themes": [
    { "label": "Light", "value": "light" },
    { "label": "Dark", "value": "dark" }
  ],
  "locales": [
    { "label": "English", "value": "en-us", "default": true },
    { "label": "简体中文", "value": "zh-cn" },
    { "label": "繁體中文", "value": "zh-hk" },
    { "label": "日本語", "value": "ja-jp" }
  ],
  "translator": "scripts.translator.Default",
  "scripts": {
    "before:build": [
      { "type": "process", "content": "scripts.build.Before" },
      {
        "type": "command",
        "content": "npx tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
      }
    ],
    "after:build": [{ "type": "process", "content": "scripts.build.After" }],

    "build:complete": [
      { "type": "process", "content": "scripts.build.Complete" }
    ]
  }
}
```

```go
// Template is the struct for the template
type Template struct {
	Version      int              `json:"version"` // 模板版本
	ID           string           `json:"id"` // 模板ID
	Name         string           `json:"name"`// 模板名称
	Descrption   string           `json:"description"`// 模板描述
	Screenshots  []string         `json:"screenshots"`// 模板截图
	Themes       []SelectOption   `json:"themes"`// 主题 可以使处理器`yao run sui.theme.get sui_id template_id`获取
	Locales      []SelectOption   `json:"locales"`// 语言
	Scripts      *TemplateScirpts `json:"scripts,omitempty"`// 模板脚本
	Translator   string           `json:"translator,omitempty"`// 翻译器
}

// SelectOption is the struct for the select option
type SelectOption struct {
	Label   string `json:"label"`
	Value   string `json:"value"`
	Default bool   `json:"default"`
}

// TemplateScirpts is the struct for the template scripts
type TemplateScirpts struct {
	BeforeBuild   []*TemplateScript `json:"before:build,omitempty"`   // Run before build
	AfterBuild    []*TemplateScript `json:"after:build,omitempty"`    // Run after build
	BuildComplete []*TemplateScript `json:"build:complete,omitempty"` // Run build complete
}

// TemplateScript is the struct for the template script
type TemplateScript struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}
```

页面模板相关文件，这里是与`index`相关的文件

```sh
├── index                 # 页面模板index
│   ├── index.config      # page mock配置
│   ├── index.css         # 样式
│   ├── index.html        # page 源代码
│   ├── index.js          # js脚本
│   └── index.json        # 模板相关数据定义，可以配置处理器调用
```

还可以使用`[]`的语法进行正则模糊匹配路由中带有参数[数字字母]的访问路径，比如`/1a/test`,`/2d/test`。

```sh
├── [123]                 # 页面模板index
│   ├── index.config      # page mock配置
│   ├── index.css         # 样式
│   ├── index.html        # page 源代码
│   ├── index.js          # js脚本
│   └── index.json        # 模板相关数据定义，可以配置处理器调用
```

### 模板语法

当定义好模板后，需要使用数据来进行填充。数据有多个来源：

- 用户请求 request 中的参数。
- 全局变量`$global`,取的值是模板目录下的`__data.json`文件中定义的对象，如果没有此文件，会选择页面的关联变量。此部分的数据是静态的，不可再修改。
- 页面的关联变量，同名的页面对应的配置文件：`<page>.json`中的定义的对象，这里可以使用处理器实时获取数据。
- 页面中的`Set`标签配置的数据。

#### 引用

在页面的源代码中可以使用`{{}}`双括号来表示动态引用变量，可以引用的变量有：

引用可以放在元素属性或是元素值。

在属性中替换：

```html
<img src="{{ article.img }}" />
```

在文本节点替换：

```html
<p>{{ article.description }}</p>
```

可以在模板中引用的全局对象：

```js
data['$payload'] = r.Payload;
data['$query'] = r.Query;
data['$param'] = r.Params;
data['$cookie'] = cookies;
data['$url'] = r.URL; //请求地址
data['$theme'] = r.Theme; //主题
data['$locale'] = r.Locale; //语言
data['$timezone'] = GetSystemTimezone(); //时区
data['$direction'] = 'ltr';
data['$global']; //其它全局对象，从<page>.json文件复制而来。
```

#### 引用请求中的对象

- 引用 query 对象

使用`$query.<key>`引用 url query 查询中的对象。

```json
{
  "value": "$query.<key>" //引用query中的内容
}
```

- 引用 http.url 请求对象

```json
{
  "path": "$url.path",
  "host": "$url.host",
  "domain": "$url.domain",
  "scheme": "$url.scheme"
}
```

- 其它的请求对象

其它的以`$header.`,`$param.`,`$payload.`为开头的对象。

#### 循环

与其它的页面开发技术类似，使用三个关键字实现循环输出语法：

- `s:for`, 引用需要循环数据，要求是数组格式的数据，可以是在数组中包含复杂的对象。
- `s:for-item`,设置循环中的 key 字段，默认值是`item`。
- `s:for-index`,设置索引字段,默认值是`index`。
- `s:if`,可以在循环中使用`s:if`控制条目是否显示,表达式需要返回 true 才会生效。

```html
<!-- Replace the code below with your actual post data -->
<li s:for="articles.data" s:for-item="article" s:for-index="idx" s:if="idx==1">
  <div class="bg-white shadow-md rounded-lg p-4">
    <p class="text-gray-600 mb-4">{{ article.description }}</p>
  </div>
</li>
```

#### 条件

使用条件可以控制页面元素的显示与隐藏。对应的命令有：`s:if`,`s:elif`,`s:else`

```html
<section>
  <h1 class="text-3xl font-bold mb-4">Yao Blog Post List</h1>
  <ul
    class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    <!-- Replace the code below with your actual post data -->
    <li s:for="articles.data" s:for-item="article" s:for-index="idx">
      <div class="bg-white shadow-md rounded-lg p-4">
        <img
          s:if="article.img != ''"
          src="{{ article.img }}"
          alt="Post Image"
          class="object-cover rounded-md"
        />
        <a
          href="{{ article.url }}"
          target="_blank"
          class="text-xl text-blue-500 font-semibold mb-2"
          >{{ article.title }}</a
        >
        <p class="text-gray-600 mb-4">{{ article.description }}</p>
        <a
          href="{{ article.url }}"
          target="_blank"
          class="text-blue-500 font-semibold"
          >Read More</a
        >
      </div>
    </li>
    <!-- Repeat the above code for each post -->
  </ul>
</section>
<!-- JAVASCRIPTS -->
```

#### 原始值

在没有使用这个指令时，所有的模板绑定的变量值在输出前都会被进行 url 编码处理。

使用`s:raw`指令输出子原元素的 html 原始值,比如把博客的内容保存在数据库中，在渲染时直接输出博客的内容。

**注意：用户需要注意处理 s:raw 的原始信息，避免出现 xss 的攻击漏洞**

```html
<p s:raw="true">{{post.content}}</p>
```

#### 页面引用

使用 page 标签引用其它页面，`is="/xxx"`,这里的 `xxx` 是同一套模板中的其它页面地址。有`is`属性标定的元素会作为子组件进行处理。

子组件也是一个单独的组件，但是组件的数据与主页面共享。

```html
<page is="/footer">
  <slot is="link"> Link </slot>
  <slot is="item"> Item </slot>

  <!-- jit 组件 -->
  <div is="link2">{{xxx}}</div>
  <div is="link3" p2="[{xxx}]"></div>
  <div is="link4" p1="{%xxx%}"></div>
</page>
```

#### 插槽

当使用页面引用功能时，需要解决另外一个问题，就是向子页面传递属性与插槽。

比如有两个页面：
主页面：main.html,子页面 item.html，它们的定义是：

`main.html` 主页面引用了子页面`item`,并且传递了属性`index`，两个 slot 配置：`link/item`

```html
<div class="bg-blue-700">
  <page is="/item" active="index">
    <slot is="link1"> Link Slot</slot>
    <slot is="item"> Item Slot</slot>
  </page>
</div>
```

`item.html`,在子页面中：

- 使用`[{$prop.<prop>}]`来引用父页面传递的属性值。

```html
<div class="flex">
  <div
    class="[{ $prop.active=='index' ? 'text-white' : 'text-blue-200' }] w-10"
  >
    <a href="/index">介绍</a>
  </div>

  <div
    class="[{ $prop.active=='signin' ? 'text-white' : 'text-blue-200' }] w-10"
  >
    <a href="/index">登录</a>
  </div>
</div>
```

- 使用`[{}]`语法来接收父页面传递的 slot 配置。

```html
<div class="text-blue-200">[{link}]</div>

<div class="text-red-200">[{item}]</div>
```

### 组件导入

组件导入的功能跟子页面引用一样的，但是使用了不同的语法描述。

```html
<import s:as="Anchor" s:from="/flowbite/components/anchor"></import>

<Anchor
  href="{{ '/docs/' + item.link }}"
  color="{{ $param.name == item.link ? 'primary' : 'dark' }}"
  class="mb-2 {{ $param.name == item.link ? 'active' : '' }}"
>
  <span class="font-bold text-sm"> {{ item.title }} </span>
</Anchor>
```

### 模板变量引用

上面的 html 模板文件中的变量来自另外一个文件中的定义。比如首页的页面的目录是`index`,对应的变量定义文件为`index/index.json`。

先看看数据定义文件中的内容，在这里包含了处理器调用，静态数量定义，数组定义。

没有使用`$`作为前缀的是静态数量定义。

- key 以`$`作为开始，调用后端处理或是 Yao 处理器
- key 没有以`$`作为开始，一般变量
- 子对象是一个数组，如果`$query.`,`$url.`,`$header.`作为前缀,说明是引用值。

```json
{
  "$articles": "scripts.article.Search", //key有$前缀，说明是处理器
  "$showImage": {
    //有$前缀，说明是处理器，不需要设置__exec=true
    "process": "scripts.article.ShowImage",
    "args": ["$query.show"]
  },
  "length": 20,
  "array": [
    "item-1",
    "$scripts.article.Setting", //有$前缀，说明是处理器
    { "$images": "scripts.article.Images" }, //有$前缀，说明是处理器
    {
      //在数组中，没办法设置$,需要使用__exec=true
      "process": "scripts.article.Thumbs",
      "args": ["$query.show"],
      "__exec": true
    }
  ],
  "input": { "data": "hello world" },
  "url": { "path": "$url.path" } //不是处理器，也可以替换绑定变量
}
```

#### 调用 Yao 处理器

比如上面的`$articles`就对应变量定义中的以下部分，它定义了一个文章列表的变量，而这个变量的值是过调用 yao 的处理器的返回值。Key 或是 Value 以`$`开头说明需要调用 Yao 处理器并返回数据。

```json
{
  "$articles": "scripts.blog.site.getPostList", //方式一
  "articles": "$scripts.blog.site.getPostList" //方式二，两种方式都可以
}
```

处理器的调用方式也有两种：1，隐式参数传递，直接配置成`key:value`的形式

##### 使用 request 对象作为处理器的参数。

```json
{
  "$articles": "scripts.blog.site.getPostList" //方式一,隐式参数传递request对象
}
```

没有显式的指定处理器参数 args,会有一个默认的参数 request,request 对象定义：

```ts
/**
 * Namespace defining types and interfaces for SUI Templating Engine.
 */
export declare namespace sui {
  /**
   * Represents a request structure in the Sui framework.
   */
  export interface Request {
    /** The HTTP method of the request, e.g., "GET" or "POST". */
    method: string;
    /** The root URL for accessing assets, optional. */
    asset_root?: string;
    /** The referer URL, indicating the source of the request. */
    referer?: string;
    /** Payload data sent with the request. */
    payload?: Record<string, any>;
    /** Query parameters in the request URL as key-value pairs. */
    query?: Record<string, string[]>;
    /** Path parameters extracted from the URL. */
    params?: Record<string, string>;
    /** Headers included in the request as key-value pairs. */
    headers?: Record<string, string[]>;
    /** The body of the request, containing any payload data. */
    body?: any;
    /** Details about the request URL. */
    url?: URL;
    /** Session ID for the request, optional. */
    sid?: string;
    /** The theme preference associated with the request, optional. */
    theme?: string;
    /** The locale setting for the request, optional. */
    locale?: string;
  }

  /**
   * Represents the structure of a request URL in the Sui framework.
   */
  export interface URL {
    /** The host of the request, e.g., "www.example.com". */
    host?: string;
    /** The domain of the request, e.g., "example.com". */
    domain?: string;
    /** The path of the request, e.g., "/path/to/route". */
    path?: string;
    /** The scheme of the request, e.g., "http" or "https". */
    scheme?: string;
    /** The full URL of the request. */
    url?: string;
  }
}
```

##### 显式参数传递

处理器调用还有另外一种形式，配置成`key:object`的方式，显式参数传递。

在处理器中，可以通过变量的方法引用 url 参数，类似于 api 定义与使用方法。

可以使用`$query`引用 url 查询参数。

- `$query` url 请求参数
- `$header` url header 中的变量
- `$param` url 请求参数
- `$payload` post 请求中的 payload

```json
{
  "articles": {
    "process": "scripts.article.Thumbs", //process处理器名称，必要的设置
    "args": ["$query.show"], //处理器参数
    "__exec": true //设置`__exec=true`来说明此对象是一个处理器调用。
  }
}
```

```json
{
  "$object": {
    "process": "scripts.demo.process",
    "args": ["$header.key"]
  }
}
```

```json
{
  "object": {
    "process": "scripts.demo.process",
    "args": ["$header.key"],
    "__exec": true
  }
}
```

另外可以引用其它对象。

```js
// $query
// $url.path
// $url.host
// $url.domain
// $url.scheme
// $header
// $param.
// $payload
```

```go
{
		"param":   r.Params,//object,url请求参数
		"query":   r.Query,//object url查询请求参数
		"payload": map[string]interface{}{},//post请求的payload
		"header":  r.Headers,//object 请求header信息
		"theme":   r.Theme,//string主题信息
		"locale":  r.Locale,//string 本地化信息
		"url":     r.URL.Map(),//url对象。
}

```

URL 子对象定义

```go
{
	Host   string `json:"host,omitempty"`
	Domain string `json:"domain,omitempty"`
	Path   string `json:"path,omitempty"`
	Scheme string `json:"scheme,omitempty"`
	URL    string `json:"url,omitempty"`
}
```

#### 调用后端脚本

如果处理器的名称以`@`开头，并且存在后台脚本，会调用后台页面关联的`.backend.ts` 脚本。ts/js 脚本的优先级会比一般的处理器的优先级要高。

组件与关联脚本存放在同一个目录下，逻辑会比较清晰。

比如存在`index/index.backend.js`文件，文件内容如下：

```js
function myscript(args) {}
```

定义模式。

```json
{
  "articles": {
    "process": "@myscript", //process处理器名称，必要的设置
    "args": ["$query.show"], //处理器参数
    "__exec": true //设置`__exec=true`来说明此对象是一个处理器调用。
  }
}
```

简洁模式，默认使用 request 对象作为参数。

```json
{
  "$catalog": "@Catalog"
}
```

此时函数的参数是 request 对象。

```ts
function Catalog(r: sui.Request) {
  const route = parseRoute(r);
  const ignoreCache = r.query?.refresh?.[0] === 'true' || false;
  return GetCatalog(route.root, route.name, route.locale, ignoreCache);
}
```

### 使用 Set 数据

在模板中，可以使用`s:set` 或是`set` 标签,属性`value`来设置页面数据。这部分代码会在编译后保存，但是在页面输出时，set 配置数据被读取后，会删除`s:set`标签内容。它的作用跟页面关联的`json`配置文件作用一样。

比如，以下的页面配置也会应用到模板中。

```html
...

<!-- 简单类型数据 -->
<s:set name="weight" value="{% weight %}"></s:set>
<s:set name="icon" value="{% icon %}"></s:set>
<!-- json object 对象 -->
<s:set
  name="sizes"
  value="{{ {
          'xs': 'text-xs',
          'sm': 'text-sm',
          'base': 'text-base',
          'lg': 'text-lg',
          'xl': 'text-xl',
          'none': ''
      } }}"
></s:set>

<!-- 在模板中，可以使用set name来引用set中的配置数据 -->
<a
  id="{{ id }}"
  name="{{ name }}"
  title="{{ title }}"
  class="cursor-pointer hover:transition hover:duration-200 hover:ease-in-out
          {{ icon != '' ? 'flex items-center justify-start' : 'inline-block' }}
          {{ size != '' ? sizes[size] : sizes.base }}
      "
  href="{{ href }}"
  target="{{ target != '' ? target : '_self' }}"
  button
>
  <i s:if="icon != ''" class="material outlined me-1"> {{icon}} </i>
  <children></children>
</a>
```

### 组件事件处理

为了响应页面上的组件的事件，比如用户的点击事件等。

在`.backend.ts`文件中定义事件处理函数。

在页面上使用`s:on-`来绑定事件处理函数。

```html
<li
  s:for="categories"
  class="
      px-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-200
      hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer
      border-b-2
      {{ item.name == articles.category ? 'text-primary-500 dark:text-primary-400  border-primary-500 dark:border-primary-400' : 'border-transparent ' }}
    "
  s:data-category="{{ item.name }}"
  s:on-click="LoadCategory"
  category
>
  {{ item.name }}
</li>
```

```ts
/**
 * When category is changed, load articles
 * @param event
 * @param data
 */
self.LoadCategory = async function (event: MouseEvent, data: EventData) {
  // Active and inactive class
  const active =
    'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400';
  const inactive = 'border-transparent';

  // Prevent default behavior ( href redirect )
  event.preventDefault();

  // Get category and store it
  const category = data.category || null;
  self.store.Set('category', category);

  // Change item style
  $Query('[category]').each((el) => {
    el.removeClass(active).addClass(inactive);
    // Current category
    if ($Store(el.element as HTMLElement).Get('category') === category) {
      el.removeClass(inactive).addClass(active);
    }
  });

  // Load articles
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);

  // Render articles
  await self.render('articles', { articles });
};
```

### 设计器使用 mock 数据

在页面目录可以使用 config 文件来配置预览页面的请求参数。

```json
{
  "title": "Home Page | {{ $global.title }}",
  "mock": {
    "method": "GET",
    "query": {
      "post_id": ["2"]
    }
  }
}
```

Page 请求 Mock 完整类型定义：

```go
type PageMock struct {
	Method  string                 `json:"method,omitempty"`
	Referer string                 `json:"referer,omitempty"`
	Payload map[string]interface{} `json:"payload,omitempty"`
	Query   url.Values             `json:"query,omitempty"`
	Params  map[string]string      `json:"params,omitempty"`
	Headers url.Values             `json:"headers,omitempty"`
	Body    interface{}            `json:"body,omitempty"`
	Sid     string                 `json:"sid,omitempty"`
}
```

### 前端访问入口地址脚本

为了增强组件在浏览器的交互功能，可以在同一个目录下创建一个同名的 js 或是 ts 文件。如果是 ts 脚本会自动的编译成 js 文件。

```sh
├── index                 # 页面模板index
│   ├── index.config      # page mock配置
│   ├── index.css         # 样式
│   ├── index.html        # page 源代码
│   ├── index.js          # js脚本
│   ├── index.ts          # ts脚本,优先级比js高
│   └── index.json        # 模板相关数据定义，可以配置处理器调用
```

js 文件有以下的作用。

针对于组件进行增强处理，比如一个组件元素有属性"s:cn"的标识，说明是一个 html 组件。此时会在查找带有`script[name=imports]`标签的脚本。

有脚本中编写的代码会以固定的模析编译成一与组件关联的 js 脚本。

每一个组件的代码都会在页面加载时自动执行。

```js
// 组件的定义,comp_name是组件唯一的名称。
function comp_name(component){

  // 这里会自动的引用在`.backend.ts`文件中定义的常量对象Constants。可以理解为前后端共享的变量。
  // 在前端的js代码中可以使用self.Constants进行引用
  this.Constants = {};

  this.root = %s;//component 或是document.body,
	const __self = this;

  this.store = new __sui_store(this.root);//组件数据读取与设置

	this.state = new __sui_state(this);//事件处理

  this.props = new __sui_props(this.root);//读取组件的属性

  //把html对象转换成Query对象
	this.$root = new __Query(this.root);//组件选择器

  //查找html组件，返回Query对象
	this.find = function (selector) {
		return new __Query(__self.root).find(selector);
	};
  //查找html组件
	this.query = function (selector) {
		return __self.root.querySelector(selector);
	}
  //查找html组件
	this.queryAll = function (selector) {
		return __self.root.querySelectorAll(selector);
	}
  //远程渲染
	this.render = function(name, data, option) {
		const r = new __Render(__self, option);
  		return r.Exec(name, data);
	};
  //事件分发
	this.emit = function (name, data) {
		const event = new CustomEvent(name, { detail: data });
		__self.root.dispatchEvent(event);
	};

	//%s,用户的在backend.ts中定义的代码。在组件js中可以使用上面定义的函数与定义。

	if (this.root.getAttribute("initialized") != 'true') {
		__self.root.setAttribute("initialized", 'true');
		__self.root.addEventListener("state:change", function (event) {
			const name = this.getAttribute("s:cn");
			const target = event.detail.target;
			const key = event.detail.key;
			const value = event.detail.value;
			const component = new window[name](this);//this是指当前的函数
			const state = new __sui_state(component);
			state.Set(key, value, target)
		});
    // 只运行一次的初始化函数
		__self.once && __self.once();
	}

}
```

#### `BeforeRender`Hook,在页面渲染前的处理事件钩子。

在 js 文件中定义一个函数，函数返回对象。

```js
//请求对象的定义
// type Request struct {
//     Method    string                 `json:"method"`
//     AssetRoot string                 `json:"asset_root,omitempty"`
//     Referer   string                 `json:"referer,omitempty"`
//     Payload   map[string]interface{} `json:"payload,omitempty"`
//     Query     url.Values             `json:"query,omitempty"`
//     Params    map[string]string      `json:"params,omitempty"`
//     Headers   url.Values             `json:"headers,omitempty"`
//     Body      interface{}            `json:"body,omitempty"`
//     URL       ReqeustURL             `json:"url,omitempty"`
//     Sid       string                 `json:"sid,omitempty"`
//     Theme     any                    `json:"theme,omitempty"`
//     Locale    any                    `json:"locale,omitempty"`
//     Script    *Script                `json:"-"`
// }

//props表示是html元素中的"prop:"设置
function BeforeRender(request,props){

  retrun {
    "k":v
  }
}

```

#### sui 页面 guard

每一个 sui 页面可以设置页面对应的配置，`<page>.config`,这是一个 json 文件，它的定义结构如下：

```go

type PageConfig struct {
	PageSetting `json:",omitempty"`
	Mock        *PageMock           `json:"mock,omitempty"`
	Rendered    *PageConfigRendered `json:"rendered,omitempty"`
}
type PageConfigRendered struct {
	Title string `json:"title,omitempty"`
	Link  string `json:"link,omitempty"`
}
// PageSetting is the struct for the page setting
type PageSetting struct {
	Title       string   `json:"title,omitempty"`
	Guard       string   `json:"guard,omitempty"` //配置页面请求时的认证处理器，比如scripts.page.guard
	CacheStore  string   `json:"cache_store,omitempty"`
	Cache       int      `json:"cache,omitempty"`
	Root        string   `json:"root,omitempty"`
	DataCache   int      `json:"data_cache,omitempty"`
	Description string   `json:"description,omitempty"`
	SEO         *PageSEO `json:"seo,omitempty"`
}
type PageSEO struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Keywords    string `json:"keywords,omitempty"`
	Image       string `json:"image,omitempty"`
	URL         string `json:"url,omitempty"`
}

```

在 sui 请求中，可以设置 guard 来处理每一个页面的请求处理器的认证。可以使用以下 4 种 guard。可以使用这几种内置方法中的一种来保护需要认证才能查看的页面，或是使用自定义的 guard,但是同一时间不能像 api 接口那样同时使用多个 guard。

```go
// Guards middlewares
var Guards = map[string]func(c *Request) error{
	"bearer-jwt":   guardBearerJWT,   // Bearer JWT
	"query-jwt":    guardQueryJWT,    // Get JWT Token from query string  "__tk"
	"cookie-jwt":   guardCookieJWT,   // Get JWT Token from cookie "__tk"
	"cookie-trace": guardCookieTrace, // Set sid cookie
}
```

guard 跳转如果 guard 中有分号，那么分号的第二部分会是 guard 检查失败后跳转的地址，`guard=cookie-jwt:redirect-url`，比如说是登录认证页面。

自定义的 guard 处理器，除了使用内置的 guard,还可以开发自定义的处理器,推荐使用 js 脚本来处理，可以使用额外的处理功能。

guard 处理器可以使用以下的参数：

```go
	args := []interface{}{
		r.URL,     // page url
		r.Params,  // page params
		r.Query,   // query string
		r.Payload, // payload
		r.Headers, // Request headers
	}
```

如果是在 sui guard 环境中使用脚本处理器，比如`scripts.xxx`,那么可以在 js 脚本中使用以下的特有的 js 函数对象。

- 函数 SetSid 设置全局对象\_\_sid
- 函数 SetGlobal，设置全局对象\_\_global
- 函数 Redirect(code,url)，跳转到特定的地址。
- 函数 Abort(),退出请求
- 函数 Cookie(name),获取特定 cookie
- 函数 SetCookie(name,value,maxAge,path,domain,secure,httpOnly)，设置 cookie

### 页面访问

访问方法:`<host>:<port>:/<root>/<page_index>`,比如这里的页面访问方法：`http://localhost:5099/blog/index`。

**注意** 目前是调整了 yao 的路径处理代码才能使用

### 示例源代码

在 yao-admin-admin 项目中实现了简单的博客[yao-amis-admin](https://github.com/wwsheng009/yao-amis-admin)。

### 调试模式

在页面请求时，添加`__debug=true`参数 或是是`__sui_print_data=true`参数，会开启调试模式。调试模式会禁用页面缓存。浏览器会自动的在控制台输入页面数据`console.log(__sui_data)`。

### 禁用缓存

- 在页面请求时，添加 `__sui_disable_cache=true`参数，会禁用页面缓存。
- 请求抬头中包含配置项 `Cache-Control = "no-cache"` 同样会禁用缓存。
- 页面请求时，添加`__debug=true`参数，会开启调试模式。调试模式会禁用页面缓存。

## 异步任务

### 概述

异步任务是一种用于处理耗时操作、消耗大量资源或容易出错的逻辑的机制。它可以将这些操作从请求主流程中剥离出来，异步执行，从而提高系统的响应速度和稳定性。

#### 使用场景

- 耗时的数据处理操作
- 资源密集型任务（如图片处理）
- 第三方服务调用（如发送邮件）
- 批量数据导入导出
- 需要重试机制的操作

例如：新用户注册成功后发送欢迎邮件，可以将发送邮件的操作作为异步任务执行，这样可以让用户更快地得到注册响应，同时避免邮件发送失败影响主流程。

#### 工作机制

异步任务的工作机制如下：

1. 在程序内部维护一个可重复调用的任务池
2. 当向任务池中加入新的任务时，任务会进入等待状态
3. 系统会根据配置的工作进程数（worker_nums）来并发处理任务
4. 任务执行过程中可以实时反馈进度
5. 支持失败重试机制

### 任务配置

在应用的 `tasks` 目录下创建任务定义配置文件（如：`tasks/example.yao`）：

```json
{
  "name": "示例任务",
  "worker_nums": 10,
  "attempts": 3,
  "attempt_after": 200,
  "timeout": 2,
  "size": 1000,
  "process": "scripts.task.Send",
  "event": {
    "next": "scripts.task.NextID",
    "add": "scripts.task.OnAdd",
    "success": "scripts.task.OnSuccess",
    "error": "scripts.task.OnError",
    "progress": "scripts.task.OnProgress"
  }
}
```

#### 配置参数说明

| 参数           | 说明                     | 是否必填 |
| -------------- | ------------------------ | -------- |
| name           | 任务名称                 | 是       |
| worker_nums    | 任务池中工作进程数量     | 是       |
| attempts       | 失败重试次数             | 是       |
| attempt_after  | 重试间隔（毫秒）         | 是       |
| timeout        | 任务超时时间（秒）       | 是       |
| size           | 任务队列大小             | 是       |
| process        | 任务处理器               | 是       |
| event.next     | 生成任务唯一ID的处理器   | 否       |
| event.add      | 添加任务时的回调处理器   | 否       |
| event.success  | 任务成功时的回调处理器   | 否       |
| event.error    | 任务失败时的回调处理器   | 否       |
| event.progress | 任务进度更新的回调处理器 | 否       |

#### 事件处理器说明

##### event.next

- **触发时机**：每次添加新任务时，用于生成任务的唯一标识
- **参数**：无
- **返回值**：number 类型，表示任务ID
- **使用场景**：
  - 需要自定义任务ID生成规则
  - 需要保证任务ID的全局唯一性
  - 需要使用特定格式的任务ID

##### event.add

- **触发时机**：任务被成功添加到任务池后
- **参数**：
  - id: number - 任务ID
- **使用场景**：
  - 记录任务创建日志
  - 更新任务相关的业务状态
  - 发送任务创建通知

##### event.success

- **触发时机**：任务执行成功后
- **参数**：
  - id: number - 任务ID
  - res: any - 任务执行结果
- **使用场景**：
  - 处理任务执行结果
  - 更新相关业务状态
  - 发送成功通知
  - 触发后续业务流程

##### event.error

- **触发时机**：任务执行失败时（包括重试后仍然失败）
- **参数**：
  - id: number - 任务ID
  - err: Error - 错误信息
- **使用场景**：
  - 记录错误日志
  - 发送失败告警
  - 执行补偿逻辑
  - 更新任务状态

##### event.progress

- **触发时机**：任务执行过程中调用 Progress 处理器时
- **参数**：
  - id: number - 任务ID
  - current: number - 当前进度
  - total: number - 总进度
  - message: string - 进度信息
- **使用场景**：
  - 更新任务进度显示
  - 记录执行过程日志
  - 实时反馈任务状态

#### 事件处理器示例

```javascript
/**
 * 生成任务唯一ID
 * @returns {number} 任务ID
 */
function NextID() {
  // 使用时间戳和随机数生成唯一ID
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random}`);
}

/**
 * 任务添加时的回调
 * @param {number} id 任务ID
 */
function OnAdd(id) {
  // 记录任务创建日志
  console.log(`Task #${id} created at ${new Date().toISOString()}`);

  // 更新任务状态
  Process('models.task.save', {
    id: id,
    status: 'created',
    created_at: new Date().toISOString()
  });
}

/**
 * 任务成功回调
 * @param {number} id 任务ID
 * @param {any} res 任务结果
 */
function OnSuccess(id, res) {
  // 更新业务状态
  Process('models.task.save', {
    id: id,
    status: 'completed',
    result: res,
    completed_at: new Date().toISOString()
  });

  // 发送成功通知
  Process('scripts.notification.send', {
    type: 'task_complete',
    task_id: id,
    result: res
  });
}

/**
 * 任务失败回调
 * @param {number} id 任务ID
 * @param {Error} err 错误信息
 */
function OnError(id, err) {
  // 记录错误日志
  console.error(`Task #${id} failed: ${err.message}`);

  // 更新任务状态
  Process('models.task.save', {
    id: id,
    status: 'failed',
    error: err.message,
    failed_at: new Date().toISOString()
  });

  // 发送失败告警
  Process('scripts.notification.send', {
    type: 'task_error',
    task_id: id,
    error: err.message,
    level: 'error'
  });
}

/**
 * 任务进度更新回调
 * @param {number} id 任务ID
 * @param {number} current 当前进度
 * @param {number} total 总进度
 * @param {string} message 进度信息
 */
function OnProgress(id, current, total, message) {
  // 计算进度百分比
  const percentage = Math.floor((current / total) * 100);

  // 更新任务进度
  Process('models.task.save', {
    id: id,
    progress: percentage,
    progress_message: message,
    updated_at: new Date().toISOString()
  });

  // 记录进度日志
  if (percentage % 10 === 0) {
    // 每完成10%记录一次
    console.log(`Task #${id}: ${percentage}% completed - ${message}`);
  }
}
```

### 任务处理器

在 `scripts` 目录下创建任务处理脚本（如：`scripts/task.js`）：

```javascript
// 如果是在响应api请求时，不要在脚本里使用全局变量
// 可以考虑使用session保存全局唯一的id
var id = 1024;

/**
 * 生成任务唯一ID
 * @returns {number} 任务ID
 */
function NextID() {
  id = id + 1;
  console.log(`NextID: ${id}`);
  return id;
}

/**
 * 任务处理器
 * @param {number} task_id 任务ID
 * @param {...any} args 任务参数
 */
function Send(task_id, ...args) {
  console.log(args);

  // 任务处理逻辑
  const current = 1;
  const total = 100;

  // 更新任务进度
  Progress(
    'tasks.task.process',
    task_id,
    current,
    total,
    `Progress ${current}/${total}`
  );

  return { message: 'ok' };
}

/**
 * 任务添加时的回调
 * @param {number} id 任务ID
 */
function OnAdd(id) {
  console.log(`OnAdd: #${id}`);
}

/**
 * 任务进度更新回调
 * @param {number} id 任务ID
 * @param {number} current 当前进度
 * @param {number} total 总进度
 * @param {string} message 进度信息
 */
function OnProgress(id, current, total, message) {
  console.log(`OnProgress: #${id} ${message} ${current}/${total}`);
}

/**
 * 任务成功回调
 * @param {number} id 任务ID
 * @param {any} res 任务结果
 */
function OnSuccess(id, res) {
  console.log(`OnSuccess: #${id} ${JSON.stringify(res)}`);
}

/**
 * 任务失败回调
 * @param {number} id 任务ID
 * @param {Error} err 错误信息
 */
function OnError(id, err) {
  console.log(`OnError: #${id} ${err}`);
}
```

### 任务处理流程

1. 添加任务

   - 使用 `tasks.[task_id].add` 处理器添加任务
   - 可传入任务处理器所需的参数
   - 返回任务ID（成功）或0（失败）

2. 任务状态更新

   - 使用 `tasks.[task_id].progress` 处理器更新任务进度
   - 在任务处理器内部调用
   - 会触发 event.progress 回调

3. 查询任务状态
   - 使用 `tasks.[task_id].get` 处理器获取任务状态
   - 返回任务的详细信息：
     ```javascript
     {
       id: task_id,
       status: '', // "WAITING"/"RUNNING"/"SUCCESS"/"FAILURE"
       current: number, // 当前进度
       total: number, // 总进度
       message: string, // 进度信息
       response: any // 任务结果
     }
     ```

### 使用示例

```javascript
function task() {
  for (let i = 1; i < 100; i++) {
    const task_id = Process('tasks.test.add', '任务-' + i);
    if (task_id === 0) {
      console.log('添加任务失败');
      continue;
    }
    console.log(`添加任务成功：${task_id}`);
  }
}
```

### 最佳实践

1. 任务设计

   - 将耗时操作从主流程中剥离
   - 任务应该是独立且原子的
   - 考虑任务的幂等性

2. 资源管理

   - 根据服务器资源合理设置 worker_nums
   - 设置合适的任务超时时间
   - 控制任务队列大小

3. 错误处理

   - 实现完善的重试机制
   - 记录详细的错误日志
   - 设置合理的重试间隔

4. 监控告警
   - 监控任务队列大小
   - 监控任务执行时间
   - 监控失败率和重试情况

## 计划任务

计划任务即是定时作业，用于在指定的时间自动执行特定的处理器或异步任务。

利用任务计划功能，可以将任何 DSL 脚本、Flows 安排在某个最方便的时间运行。任务计划在每次系统启动的时候启动并在后台运行。
当我们需要在服务器上定时执行一些重复性的事件时使用的，可以通过计划任务程序来运行准备好的 DSL 脚本在某个特定的时间运行。

### 配置

创建定时作业配置文件`./schedules/mail.sch.yao`,配置文件需要保存在目录`schedules`,配置文件后缀名为：`sch.yao`,`sch.jsonc`, `sch.json`

计划任务支持两种调度方式，如果两个配置同时存在，优先使用异步任务。

- 直接调用处理器：适用于执行时间较短的简单任务
- 调用异步任务：如果是长时间耗时任务，建议使用异步任务，避免阻塞其他计划任务的执行

#### 基本配置项

| 配置项   | 说明                                                          | 是否必填 |
| -------- | ------------------------------------------------------------- | -------- |
| name     | 计划任务名称                                                  | 是       |
| process  | 要执行的处理器                                                | 是       |
| schedule | Cron 表达式，定义任务执行时间                                 | 是       |
| task     | 异步任务 ID，如果要以异步任务方式执行，需要填写对应的 task ID | 否       |
| args     | 处理器参数或异步任务参数                                      | 否       |

#### 配置示例

##### 示例 1：每 5 分钟执行一次的邮件接收任务

```json
{
  "name": "receive mail",
  "process": "scripts.app.email.client.receive",
  "schedule": "0/5 * * * *",
  "task": "",
  "args": []
}
```

##### 示例 2：每天凌晨 1 点执行的数据备份任务（使用异步任务）

```json
{
  "name": "database backup",
  "process": "",
  "schedule": "0 1 * * *",
  "task": "backup",
  "args": ["main_db"]
}
```

##### 示例 3：工作日每小时执行的数据同步任务

```json
{
  "name": "sync data",
  "process": "scripts.sync.data",
  "schedule": "0 * * * 1-5",
  "args": []
}
```

### Cron 表达式说明

表达式的文档参考：https://pkg.go.dev/github.com/robfig/cron/v3@v3.0.0

Cron 表达式由 5 个空格分隔的字段组成：

| 字段名称 | 是否必填 | 允许的值        | 允许的特殊字符 |
| -------- | -------- | --------------- | -------------- |
| 分钟     | 是       | 0-59            | \* / , -       |
| 小时     | 是       | 0-23            | \* / , -       |
| 日期     | 是       | 1-31            | \* / , - ?     |
| 月份     | 是       | 1-12 或 JAN-DEC | \* / , -       |
| 星期     | 是       | 0-6 或 SUN-SAT  | \* / , - ?     |

#### 特殊字符说明

- `*`：表示任意值
- `/`：步进值，如 \*/5 表示每 5 个单位
- `,`：列举值，如 1,3,5 表示 1、3、5 这三个值
- `-`：范围值，如 1-5 表示 1 到 5 的所有值
- `?`：用于日期和星期字段，表示不指定具体值

#### 常用表达式示例

- `0 * * * *` - 每小时整点执行
- `*/15 * * * *` - 每 15 分钟执行一次
- `0 0 * * *` - 每天午夜 0 点执行
- `0 8-18 * * 1-5` - 工作日上午 8 点到下午 6 点整点执行
- `0 0 1 * *` - 每月 1 号 0 点执行

### 最佳实践

1. 合理安排执行时间

   - 避免在业务高峰期执行耗时任务
   - 将数据备份等重要任务安排在系统负载较低的时段

2. 异常处理

   - 在处理器中实现完善的错误处理机制
   - 记录任务执行日志，便于问题排查

3. 资源管理

   - 评估任务的资源消耗
   - 合理分配并发任务数量
   - 对于耗时任务，建议使用异步任务方式执行

4. 监控和维护
   - 定期检查任务执行状态和日志
   - 及时清理过期的任务配置
   - 对关键任务设置监控告警

### 调试方法

1. 使用日志

   ```javascript
   function taskHandler(...args) {
     console.log('Task started', args);
     try {
       // 任务处理逻辑
       console.log('Task completed');
     } catch (err) {
       console.error('Task failed:', err);
       throw err;
     }
   }
   ```

2. 手动触发测试

   - 可以通过处理器直接调用任务逻辑进行测试
   - 使用较小的测试数据验证任务逻辑

3. 环境隔离
   - 在开发环境中使用较高的执行频率进行测试
   - 在生产环境中使用正常的执行频率

## Promise

### 在 Yao 中使用 js Promise

```sh
git clone https://github.com/YaoApp/gou-dev-app.git
```

`/gou-dev-app/scripts/runtime/promise.js`

```js
/**
 * test promise all
 * yao run scripts.runtime.promise.All
 */
function All() {
  const func_a = new Promise(async (resolve, reject) => {
    console.log('func_a start');
    for (var i = 0; i < 10; i++) {
      await sleep(100);
    }
    console.log('func_a end');
    resolve('func_a');
  });

  const func_b = new Promise(async (resolve, reject) => {
    console.log('func_b start');
    for (var i = 0; i < 5; i++) {
      await sleep(100);
    }
    console.log('func_b end');
    resolve('func_b');
  });

  Promise.all([func_a, func_b]).then((values) => {
    console.log(`result: ${values}`);
  });
}

/**
 * test promise race
 * yao run scripts.runtime.promise.Race
 */
function Race() {
  let done = false;

  const func_a = new Promise(async (resolve, reject) => {
    console.log('func_a start');
    for (var i = 0; i < 10; i++) {
      if (done) {
        return resolve('func_a');
      }
      await sleep(100);
    }
    console.log('func_a end');
    done = true;
    resolve('func_a');
  });

  const func_b = new Promise(async (resolve, reject) => {
    console.log('func_b start');
    for (var i = 0; i < 5; i++) {
      if (done) {
        return resolve('func_a');
      }
      await sleep(100);
    }
    console.log('func_b end');
    done = true;
    resolve('func_b');
  });

  Promise.race([func_a, func_b]).then((value) => {
    console.log(`result: ${value}`);
  });
}

/**
 * test promise any
 * yao run scripts.runtime.promise.Any
 */
function Any() {
  let done = false;

  const func_a = new Promise(async (resolve, reject) => {
    console.log('func_a start');
    for (var i = 0; i < 10; i++) {
      if (done) {
        return resolve('func_a');
      }
      await sleep(100);
    }
    console.log('func_a end');
    done = true;
    resolve('func_a');
  });

  const func_b = new Promise(async (resolve, reject) => {
    console.log('func_b start');
    for (var i = 0; i < 5; i++) {
      if (done) {
        return resolve('func_b');
      }
      await sleep(100);
    }
    console.log('func_b end');
    done = true;
    resolve('func_b');
  });

  Promise.any([func_a, func_b]).then((value) => {
    console.log(`result: ${value}`);
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    time.Sleep(ms);
    resolve();
  });
}
```

## 使用 npm 库

如果在 yao 应用中能引用 npm 开发库，将大大的提高 yao 应用中 js 脚本扩展性。可以直接利用很多现有的 npm 库。

### 前提要求：

package.json 需要使用 `npm` 或是 `yarn` 安装而不是 `pnpm`，原因是 `pnpm` 使用了软链接进行开发包缓存，目前 esbuild 无法正常工作。

yao 内置 esbuild 编译是使用的格式`FormatIIFE`，不是 esm 也不是 commonjs。原因是每一个入口文件都是一个模块，所有导入的模块都会编译入单一文件。

这里的说的操作并不是 yao 官方发布的功能，只是个人研究学习，不保证功能的稳定性。

### 限制条件

- 只能使用 js 纯算法库，如果在库中使用了 nodejs 的内置对象，并不能在 yao 中使用，因为 yao 的 js 引擎并不直接支持这些操作。
- 不要使用异步操作，yao 的 js 引擎使用的是 v8go，是嵌入到 golang 中的对象，只在单线程中运行。
- 脚本中不能判断 windows，process，global，self 对象。yao 中并没有这些对象。
- 如果需要操作文件，网络请求，可以使用 yao 本身的内置对象，比如 FS，http，Store，Process 等等。
- 不能使用 async/await，yao 的处理器都是同步执行的，不支持异步执行函数 Promise。

演示：

```sh
## 使用yarn
yarn add @zxcvbn-ts/core
yarn add dayjs
yarn add es-toolkit
yarn add lodash-es
yarn add radash
```

```js
import { Process } from '@yaoapps/client';
import { default as countBy } from 'lodash-es/countBy.js';
import { default as keyBy } from 'lodash-es/keyBy';

import dayjs from 'dayjs';
import { zxcvbn } from '@zxcvbn-ts/core';

import { keys } from 'radash';

import { sum } from 'es-toolkit';

/**
 * yao run scripts.tests.lodash.test
 */
function test() {
  console.log(countBy([6.1, 4.2, 6.3], Math.floor));
  // => { '4': 1,'6': 2 }
  console.log(countBy(['one', 'two', 'three'], 'length'));
  const data = Process('models.admin.user.get', {});
  console.log(keyBy(data, 'email'));
  console.log(dayjs('2018-08-08'));
  console.log(dayjs().add(1, 'year')); //'2018-08-08'));
  console.log(zxcvbn('12#133%&*3').score);
  console.log(keys(data[0]));
  console.log(sum([1, 2, 3]));
}
```

### 支持导入的工具库

- md5，支持，计算 md5。
- lodash，支持，Lodash 是一个一致性、模块化、高性能的 JavaScript 实用工具库。
- lodash-es，支持
- underscore，支持，主要集中在数组和对象的处理上。
- futil-js，支持
- moment，支持
- dayjs，支持。
- radash，支持，radash 同时支持 cjs 与 esm，程序会根据`package.json`配置优先使用`module`配置入口。
- @zxcvbn-ts，支持。
- cytoscape，支持 headless 模式
- mathjs，支持
- crossfilter，支持，https://github.com/square/crossfilter
- d3，支持
- pandas-js，支持
- tidy.js，支持
- ramda，支持。https://ramda.cn/
- @mathigon/fermat，支持
- @mathigon/euclid，支持
- dataflow-api，支持，https://github.com/vega/dataflow-api,JavaScript API for dataflow processing using the vega-dataflow reactive engine. Perform common database operations (sorting,filtering,aggregation,window calculations) over JavaScript objects.

### 部分支持

- es-toolkit，部分支持，比如不能使用 debounce 函数因为缺少 setTimeout 函数，文档参考：https://github.com/toss/es-toolkit/tree/main/docs/reference
- zebras，封装了 ramda，只支持导入算法库

### 不支持的

- crypto-js，不支持导入。这是一个 cjs 项目，里面需要引用浏览器或是 nodejs 的本地功能，也有，无法导入。
- danfojs/danfojs-node，不支持导入，里面判断了全局对象
- dataframe-js，无法导入，无法解析 child_process/fs/url/http/https 对象
- papaparse，无法导入，使用 stream 对象。
- @tensorflow/tfjs，不支持，需要绑定 nodejs
- apache-arrow，不支持，依赖 nodejs stream 对象。
- sql.js，不支持，依赖 fs 对象。
- nodejs-polars，不支持，依赖 nodejs 对象
- arquero，不支持，依赖 TextDecoder
- data-forge，不支持，使用 stream 对象。

### 测试项目

https://github.com/wwsheng009/yao-typescript-demo

需要注意的是在以下代码中，pd 与 Series 分两次导入。事实上 pd.Series 与 Series 是两个不同的类型

```js
import pd from 'pandas-js';
import { Series, DataFrame } from 'pandas-js';

// 这里会出错，提示类型出错，原因是yao在处理import语句上是每一行import都会复制一次库代码。
// 两次导入对象会在不同的命名空间中，应该要避免这种操作。
//
// TypeError: series must be a Series!
df.set('Salary', new Series([50000, 60000, 70000]));

df.set('Salary', new pd.Series([50000, 60000, 70000]));
```

### 建议

不要使用功能库 lodash，而是使用它的替代库`lodash-es`，只导入有需要的库，减少编译文件的大小。

### yao 源代码调整

初步调整：
https://github.com/wwsheng009/gou/commit/0ec6d9f57b7a168f1699878d378112479065acd3
重构优化代码：
https://github.com/wwsheng009/gou/commit/b276cc134ffc6e5c7454fda09784fdafa91c2e1c

### 原理

调整 Yao 内部 esbuild 编译器的处理逻辑，增加加载`node_modules`目录的代码的功能。

通过 esbuild on-load 事件加载其它的引用的代码：https://esbuild.github.io/plugins/#on-load

### 总结

通过调整 esbuild 的加载逻辑，可以模仿 nodejs 加载 npm 的各种 package。此特性的确是比较方便代码的利用。但是由于 yao 使用 v8go 只是作为一个嵌入式的 js 解析器，在功能与复杂性上不能与 nodejs 相比，同时强制使用 npm 包也会出现很多兼容性的问题，需要比较有经验才能处理。

## 使用 ts 的注意事项

### ts 使用

yao 可以使用 ts 脚本进行编程，这类会更好的利用编辑器进行智能提示。

比如先在目录`/scripts/__types/yao.ts`文件中创建对下内容。

```ts
export function Process(name: string, ...args: any): any {
  return null;
}

export function Exception(message: string, code: number, ...args: any) {}

export class FS {
  constructor(name: string) {}

  ReadFileBase64(...args): string {
    return '';
  }

  WriteFileBase64(...args) {}

  ExtName(path: string): string {
    return '';
  }
}

export const time = {
  Sleep(ms: number) {}
};
```

在`scripst/demo.ts`文件中编辑以下内容。

```ts
import { Exception, time } from './__types/yao';
```

在编辑器中就会找到类型对应类型定义。

### 注意事项

需要注意的是,如果导入模块或是文件名满足以下条件，yao 引擎会把导入语句作注释处理，不会导入模块中的对象，因此只能在这些模块中定义 yao 内置对象的 ts 类型声明,不要定义自定义的函数对象，对象。

- 导入的文件或是模块有以下后缀`"/yao.ts", "/yao", "/gou", "/gou.ts"`。

- 导入模块有以下前缀`"@yao", "@yaoapps", "@yaoapp", "@gou"`。

### 使用 tsconfig.json 文件

可以在应用根目录下配置 tsconfig.json 文件。注意，配置文件不支持 include 语法。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "paths": {
      "@yao/*": ["./scripts/.types/*"],
      "@lib/*": ["./scripts/runtime/ts/lib/*"]
    },
    "lib": ["ESNEXT", "DOM"]
  }
}
```

在 ts 文件中可以使用前缀导入类型或是对象。yao 引擎在执行脚本时，把简写路径替换成文件全路径。

**注意：**，普通对象，非 yao 内置对象不要定义在后缀是`"/yao.ts", "/yao", "/gou", "/gou.ts"`的模块、文件中,前缀是`"@yao", "@yaoapps", "@yaoapp", "@gou"`的模块、文件中。因为此类模块、文件并不会在运行时导入 js 引擎。

```ts
/**
 * Demo Data
 */
import { Exception } from '@yao/yao'; //特殊后缀或是前缀，事实上不会导入模型

import { Myname2 } from '@lib/data'; //普通模块与文件，会解析到具体的文件路径。

/**
 * Demo Data
 */
function Data() {
  Exception('2', 2, 3);
  console.log(Myname2);
  return Myname2;
}
```

### 最佳实践

在文件`scripts/__types/yao`中定义 yao 内置对象的类型说明。

```ts
export function Process(name: string, ...args: any): any {
  return null;
}

export function Exception(message: string, code: number, ...args: any) {}

export class FS {
  constructor(name: string) {}

  ReadFileBase64(...args): string {
    return '';
  }

  WriteFileBase64(...args) {}

  ExtName(path: string): string {
    return '';
  }
}

export const time = {
  Sleep(ms: number) {}
};
```

引用 yao 内置对象类型

```ts
import { Process, Exception } from './__types/yao';
import { FS } from './__types/yao';
```

## 使用 typescript 进行开发

使用 typescript 可以进行类型约束，在开发复杂的大型应用时会非常有用。

### 前提条件

请使用 yao 0.10.4 最新的开发版本。

使用 ts 脚本进行开发，而不是 js 脚本。

### 说明

yao 引擎并不直接支持 ts/js 的调试。折衷的方式是使用 nodejs 进行调试与测试，工作原理是在使用 nodejs 作调试时，yao 应用作为一个 web 服务器，代理了客户端的调试对象请求。

具体方法如下：

### 配置

准备工作：

应用目录下 typescript 配置文件`tsconfig.json`。

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "target": "ES2022",
    "paths": {
      "@yao/*": ["./scripts/__types/*"],
      "@lib/*": ["./scripts/runtime/ts/lib/*"]
    },
    "lib": ["ESNEXT", "DOM"],
    "outDir": "dist",
    "skipLibCheck": true,
    "sourceMap": true
  }
}
```

应用目录下 nodejs 项目管理文件`package.json`。
特别注意的是在安装 yao-node-client 时使用包别名。
对应的命令：`pnpm i "@yaoapps/client@npm:yao-node-client" -D`

如果需要 yao 的类型说明，还可以加上`yao-app-ts-types`,`pnpm i "@yaoapps/types@npm:yao-app-ts-types" -D`

```json
{
  "name": "yao-init",
  "type": "commonjs",
  "version": "1.0.0",
  "description": "yao application for nodejs usage",
  "main": "index.js",
  "scripts": {},
  "keywords": [],
  "author": "vincentwwsheng@gmail.com",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^22.5.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0"
  },
  "dependencies": {
    "@yaoapps/client": "npm:yao-node-client@^1.1.2",
    "@yaoapps/types": "npm:yao-app-ts-types@^1.0.8"
  }
}
```

执行以下命令安装依赖

```sh
pnpm i
```

yao 内置对象类型配置文件`scripts/__type/yao.ts`

```ts
import {
  Process,
  Exception,
  $L,
  FS,
  http,
  log,
  Query,
  Store,
  Studio,
  WebSocket
} from '@yaoapps/client';

export {
  Process,
  Exception,
  $L,
  FS,
  http,
  log,
  Query,
  Store,
  Studio,
  WebSocket
};
```

API 代理接口配置文件：`apis/proxy.http.json`

```json
{
  "name": "代理yao的请求",
  "version": "1.0.0",
  "description": "调试本地yao js脚本",
  "group": "",
  "guard": "-",
  "paths": [
    {
      "guard": "scripts.security.CheckAccessKey",
      "path": "/call",
      "method": "POST",
      "process": "scripts.jsproxy.Server",
      "in": [":payload"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

API 代理接口处理功能文件源代码`scripts/jsproxy.ts`，代理 nodejs 的接口请求。

```ts
//代理js api请求
import { Store, Studio, WebSocket } from './__types/yao';
import { Exception, Process, Query } from './__types/yao';
import { $L, FS, http, log } from './__types/yao';

/**
 * api 代理服务，可以放在yao应用下
 * @param {object} payload
 * @returns
 */
export function Server(payload: {
  type: string;
  method: string;
  engine?: string;
  args?: any;
  space?: any;
  key?: any;
  value?: any;
  url?: string | URL;
  protocols?: string;
  message?: any;
}) {
  // console.log("request received");
  // console.log(payload);
  // log.Info("debug served called");
  // log.Info(payload);

  let resp = {
    code: 200 as number,
    message: '' as string,
    // error: null as Error, //undefined不会出现在返回json key中
    data: null as any
  };
  try {
    const type = payload.type;
    const method = payload.method;
    const args = payload.args;
    const space = payload.space; //"dsl","script","system"
    const engine = payload.engine;
    let localParams = [];
    if (Array.isArray(args)) {
      localParams = args;
    } else {
      localParams.push(args);
    }
    switch (type) {
      case 'Process':
        resp.data = Process(method, ...localParams);
        break;
      case 'Studio':
        // @ts-ignore
        __YAO_SU_ROOT = true;
        resp.data = Studio(method, ...localParams);
        break;
      case 'Query':
        if (engine) {
          const query = new Query(engine);
          //@ts-ignore
          resp.data = query[method](args);
        } else {
          const query = new Query();
          //@ts-ignore
          resp.data = query[method](args);
        }
        break;
      case 'FileSystem':
        const fs = new FS(space);
        //@ts-ignore
        resp.data = fs[method](...args);
        break;
      case 'Store':
        const cache = new Store(space);
        if (method == 'Set') {
          resp.data = cache.Set(payload.key, payload.value);
        } else if (method == 'Get') {
          resp.data = cache.Get(payload.key);
        }
        break;
      case 'Http':
        //@ts-ignore
        resp.data = http[method](...args);
        break;
      case 'Log':
        //@ts-ignore
        log[method](...args);
        resp.data = {};
        break;
      case 'WebSocket':
        //目前yao只是实现了push一个方法，也是ws服务连接后push一条信息
        const ws = new WebSocket(payload.url, payload.protocols);
        if (method == 'push') {
          ws.push(payload.message);
          resp.data = {};
        }
        break;
      case 'Translate':
        resp.data = $L(payload.message);
        break;
      default:
        resp.code = 500;
        resp.message = `不支持的方法调用${type}`;
    }
  } catch (error) {
    resp.code = error.code || 500;
    resp.message = error.message || '接口调用异常';
  }
  return resp;
}
```

接口检查文件`scripts/security.ts`，用于代理 api 权限检查。

```ts
import { Exception, Process } from './__types/yao';

/**
 * api guard
 * @param {string} path api path
 * @param {map} params api path params
 * @param {map} queries api queries in url query string
 * @param {object|string} payload json object or string
 * @param {map} headers request headers
 */
export function CheckAccessKey(
  path: string,
  params: any,
  queries: { [x: string]: any[] },
  payload: any,
  headers: { [x: string]: any }
) {
  var token;
  let auth = headers['Authorization'];
  if (auth) {
    token = auth[0].replace('Bearer ', '');
  }
  token = token || (queries['token'] && queries['token'][0]);
  if (!token) {
    error();
  }
  let access_key = Process('yao.env.get', 'YAO_API_ACCESS_KEY');
  if (!access_key) {
    throw new Exception('YAO_API_ACCESS_KEY Not set', 403);
  }
  if (access_key !== token) {
    error();
  }
}

function error() {
  throw new Exception('Not Authorized', 403);
}
```

环境变量配置文件`.env`。需要配置环境变量，要不然 nodejs 程序会报错。

```sh
YAO_APP_PROXY_ENDPOINT=http://localhost:5099/api/proxy/call
YAO_API_ACCESS_KEY="1234"
```

### YAO 内置对象的引用方法

在 ts 脚本文件中使用以下的语法引用 yao 内置对象的类型声明。

```ts
//使用别名
import { Process } from '@yao/yao';
//或者
import { Store, Studio, WebSocket } from './__types/yao';
import { Exception, Process, Query } from './__types/yao';
import { $L, FS, http, log } from './__types/yao';
```

### 编辑器准备

在调试之前，还需要进行代码编辑器设置，在这里使用的代码编辑器是 vscode。

`.vscode/lanch.json`

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${file}",
      "runtimeArgs": [
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "preLaunchTask": "tsc: build - tsconfig.json",
      "cwd": "${workspaceFolder}",
      "outFiles": [
        //"sourceMap": true
        "${workspaceFolder}/dist/**/*.js"
      ]
    }
  ]
}
```

### 调试

调试时直接选择需要调试的文件，点击 vscode 左边的调试按钮进行调用。

### 单元测试

使用 ts-jest 测试工具配置单元测试。

安装 ts-jest。

```sh
pnpm i --save-dev jest ts-jest @types/jest
```

ts-jest 的使用参考：https://blog.csdn.net/gitblog_00725/article/details/141150601

Jest 的配置文件:`jest.config.js`如下：

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // 可选择其他环境，如jsdom for browser-like tests
  roots: ['<rootDir>/src'], // 指定查找源码的根目录
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // 处理为ESM模块的扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest' // 配置ts-jest转译器
  },
  coverageDirectory: '<rootDir>/coverage', // 覆盖率报告存放位置
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts'] // 指定覆盖率收集规则
};
```

更新 package.json 文件：

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

### Eslint 安装

vscode 编辑器可以安装 jest 单元测试插件。使用 eslint9.0 进行语法检查。

```sh
pnpm add eslint @eslint/js globals typescript-eslint eslint-plugin-vue @stylistic/eslint-plugin
```

执行以下命令初始 eslint 配置文件。

```sh
npx eslint --init
```

另外在 vscode 中也可以 prettier 进行 ts 文件格式化。

```sh
pnpm install --save-dev --save-exact prettier
pnpm install --save-dev eslint-plugin-prettier eslint-config-prettier
```

配置文件`eslint.config.mjs`：

```js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  {
    ignores: ['node_modules', 'dist', 'public'],
  },

  /** js推荐配置 */
  pluginJs.configs.recommended,
  /** ts推荐配置 */
  ...tseslint.configs.recommended,
  // stylistic.configs.customize({
  //   indent: 2,
  //   quotes: 'double',
  //   semi: true,
  //   jsx: false,
  //   braceStyle: '1tbs',
  //   arrowParens: 'always',
  // }),
  {
    plugins:{
      '@stylistic': stylistic
    }
  }

  /**
   * javascript 规则
   */
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-console': 'error',
    },
  },
  { languageOptions: { globals: globals.browser } },
  /**
   * typescript 规则
   */
  {
    files: ['**/*.{ts}'],
    rules: {},
  },
  /**
   * prettier 配置
   * 会合并根目录下的prettier.config.js 文件
   * @see https://prettier.io/docs/en/options
   */
  eslintPluginPrettierRecommended,
];
```

配置文件`prettier.config.js`：

```js
// prettier.config.js
/**
 * @type {import('prettier').Config}
 * @see https://www.prettier.cn/docs/options.html
 */
module.exports = {
  // 一行最多 80 字符
  printWidth: 80,
  // 使用 4 个空格缩进
  tabWidth: 2,
  // 不使用 tab 缩进，而使用空格
  useTabs: false,
  // 行尾需要有分号
  semi: true,
  // 使用单引号代替双引号
  singleQuote: true,
  // 对象的 key 仅在必要时用引号
  quoteProps: 'as-needed',
  // jsx 不使用单引号，而使用双引号
  jsxSingleQuote: false,
  // 末尾使用逗号
  trailingComma: 'all',
  // 大括号内的首尾需要空格 { foo: bar }
  bracketSpacing: true,
  // jsx 标签的反尖括号需要换行
  jsxBracketSameLine: false,
  // 箭头函数，只有一个参数的时候，也需要括号
  arrowParens: 'always',
  // 每个文件格式化的范围是文件的全部内容
  rangeStart: 0,
  rangeEnd: Infinity,
  // 不需要写文件开头的 @prettier
  requirePragma: false,
  // 不需要自动在文件开头插入 @prettier
  insertPragma: false,
  // 使用默认的折行标准
  proseWrap: 'preserve',
  // 根据显示样式决定 html 要不要折行
  htmlWhitespaceSensitivity: 'css',
  // 换行符使用 lf
  endOfLine: 'auto',
  experimentalTernaries: false,
  bracketSameLine: false,
  vueIndentScriptAndStyle: false,
  singleAttributePerLine: false
};
```

参考：https://juejin.cn/post/7402696141495779363

**需要注意的是：在单元测试或是调试开始之前需要启动 yao 应用。**

完整的参考项目地址：https://github.com/wwsheng009/yao-init

## js 后台异步执行作业

当在 js 脚本需要执行一个很耗时的作业时，需要在不打断这个作业的情况下，异步检查它的执行状态。

js 后台异步执行作业对象`Job`，它有三个方法：

- Pending 状态检查回调函数
- Data 读取作业完成后的数据
- Cancel 取消作业

### 对象定义

```js
// 定义新的后台作业，参数1是处理器的名称，剩余的是处理器的参数。
// 作业会使用golang 的协程进行调用执行
let job = new Job('scripts.image.Post', url, payload, headers);

// 作业状态检查器。
//当作业在执行过程中会不断的检查作业状态，如果作业还没完成，就会不断的调用回调函数。
//作业的状态回调方法Pending,方法的参数1必须是函数
job.Pending(function () {});

//可以在回调函数中使用 return false 打断状态检查。
job.Pending(function () {
  return false;
});

//读取作业完成后返回的数据，成功后删除作业
//比如在这里是取的处理器`scripts.image.Post`的返回数量
let image = job.Data();

//取消作业
job.Cancle();
```

示例代码：

```sh
git clone https://github.com/YaoApp/yao-dev-app
```

`yao-dev-app\scripts\image.js`，使用 job 调用耗时的 ai 生成图片 api。

```js
/**
 * yao run scripts.image.PostAsync /sdapi/v1/txt2img '::{"width":512,"height":512,"steps":5,"prompt":"maltese puppy"}'
 * @param {*} api
 * @param {*} payload
 * @param {*} cb
 */
function PostAsync(api, payload, cb) {
  let cfg = setting();
  let headers = { Authorization: `Basic ${btoa(cfg.user + ':' + cfg.pass)}` };
  let url = `${cfg.host}${api}`;
  let job = new Job('scripts.image.Post', url, payload, headers);
  cb =
    cb ||
    function (progress, err) {
      if (err) {
        console.log(`Error: ${err}`);
        return false;
      }
      console.log(progress);
    };

  url = `${cfg.host}/sdapi/v1/progress`;
  job.Pending(() => {
    time.Sleep(200);
    let response = http.Get(url, null, headers);
    if (response.code != 200) {
      let err = newException(response.data, response.code);
      cb(null, err.message);
      return false;
    }
    cb(response.data.progress);
  });

  let image = job.Data();
  return image;
}

/**
 * scripts.image.Post
 */
function Post(url, payload, headers) {
  let response = http.Post(url, payload, null, null, headers);
  if (response.code != 200) {
    throw newException(response.data, response.code);
  }

  let images = response.data.images || [];
  if (images.length == 0) {
    log.Error(`SD API response error`);
    throw new Exception(`SD API response error`, response.code || 500);
  }

  return images[0];
}
```

## 在 js 脚本中报错的方法

### 使用 JS 标准的 Error 对象

```js
function testException() {
  throw new Error('hello');
}
```

报错结果：

```json
{
  "code": 500,
  "message": "amis.curd.curdTemplate Error: 模型:书本不存在\n    at getModelDefinition (scripts/amis/lib.js:22:17)\n    at getFilterFormFields (scripts/amis/lib.js:272:23)\n    at curdTemplate (scripts/amis/curd.js:16:20)"
}
```

### 对象 Exception

使用 Yao 特定的对象 Exception，会被 Yao 框架捕获。只有一个参数时，异常代码会设置成 500。

```js
function testException() {
  throw new Exception('hello');
}
```

可以在第二个参数指定异常代码。

```js
function testException() {
  throw new Exception('hello', 403);
}
```

转换成错误对象

```json
{ "code": 500, "message": "模型:书本不存在" }
```

区别：

使用 Exception 得到的异常信息会更友好，在 api 接口调用中信息显示更友好。

使用 Error 会得到更具体的 js 堆栈信息，开发时会更好。

在开发代码时可以先把 Exception 设置成 Error，最后再注释掉。

```js
let Exception = Error;
throw new Exception(`模型:${modelName}不存在`);
```

异常测试：

```js
var test = () => {
  var res = 1;
  try {
    throw new Exception('hello', 404);
  } catch (e) {
    res = {
      isError: e instanceof Error,
      message: e.message, //一定要使用e.message获取错误文本
      code: e.code, //404
      name: e.name //name的格式是：Exception|<code>
    };
  }
  return res;
};
test();
```

## 在 Yao 中使用外部 js 库

在 Yao 中调用外部 JavaScript 库有点麻烦。Yao 运行时使用 v8go 环境,所以在 Node.js 中使用的库不能直接在 Yao 中直接使用。

需要注意的是：在 yao 中无法使用 nodejs 中的 fs/envents/util 等模块。如果开发库中涉及到相关的功能，此库无法使用。检查的方法是在库中是否包含了 require("fs")等语句。

所以外部 js 库只能是一些纯 JavaScript 库，比如 lodash/big.js 等。无法使用 jquery。

解决方法是打包 JS。

### 使用 ESBUILD

安装

```sh
npm install --save-dev --save-exact esbuild

## 使用yarn
yarn add  -D esbuild
```

打包命令,找到入口文件。

```json
{
  "esbuild": "esbuild src/index.ts --bundle --platform=node --target=node10.4  --outfile=dist/out.js"
}
```

将 src/index.ts 文件打包成一个 Node.js 模块，并将其输出到 dist/out.js 文件中。

步骤：

将 src/index.ts 文件转换为 JavaScript 代码。这里直接支持编辑 ts 文件。

将生成的 JavaScript 代码打包成一个 Node.js 模块。

将打包后的 Node.js 模块输出到 dist/out.js 文件中。

--bundle 选项表示将输出文件打包成一个单文件模块格式（如 CommonJS 或 ESM），而不是作为一个单独的文件。这通常用于构建用于在浏览器中运行的代码。

--platform=node 选项表示使用 Node.js 作为目标平台。

--target=node10.4 选项表示将代码兼容到 Node.js 10.4 版本。这通常用于构建兼容旧版本 Node.js 的代码。

--outfile=dist/out.js 选项表示将生成的输出文件命名为 dist/out.js，并将其放在 dist 目录中。

### rollup

先下载 js 库项目的源代码。再在 js 项目中安装 rollup 工具。

用户使用 npm 安装了几个 Rollup 插件。以下是每个插件的简要说明：

- **rollup** 是 Rollup 的核心包。必须安装 Rollup 才能使用任何插件。
- **@rollup/plugin-alias** 允许您为模块导入路径创建别名。这对于创建更短、更易于阅读的导入路径非常有用。
- **@rollup/plugin-commonjs** 允许 Rollup 使用 CommonJS 模块，这是 Node.js 和许多其他库使用的一种模块格式。
- **@rollup/plugin-json** 允许 Rollup 将 JSON 文件作为模块使用。
- **@rollup/plugin-node-resolve** 帮助 Rollup 在类似 Node.js 的`node_modules`目录中查找模块依赖项。
- **@rollup/plugin-typescript** 允许 Rollup 将 TypeScript 文件作为模块使用。

```sh
npm install -D rollup
npm install -D @rollup/plugin-alias
npm install -D @rollup/plugin-commonjs
npm install -D @rollup/plugin-json
npm install -D @rollup/plugin-node-resolve
npm install -D @rollup/plugin-typescript
```

创建 rollup 配置文件`rollup.config.mjs`。

```js
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';

const __dirname = path.resolve();

// 命令行定义环境变量，在脚本中可以直接获取
// console.log(process.env.TEST);

export default {
  input: './lib/index.js',
  output: {
    file: './dist/bound.esm.js',
    sourcemap: false,
    format: 'esm'
  },

  plugins: [
    nodeResolve({ preferBuiltins: true }),
    json(),
    //路径别名
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src')
        }
      ]
    }),
    typescript({ module: 'commonjs' }),
    commonjs({ include: 'node_modules/**' })
  ],
  external: [] //不要打包的库匹配
};
```

如果是 `typescript` 项目，配置 `tsconfig.json`,后执行`tsc`命令。

输出 esm 模块

```json
{
  "compilerOptions": {
    "outDir": "lib",
    "allowJs": true,
    "module": "ESNext",
    "target": "ESNext",
    "declaration": false,
    "sourceMap": false,
    "newLine": "lf",
    "moduleResolution": "nodenext",
    "lib": ["ES2015", "ES2016", "ES2017"]
  },
  "include": ["src"],
  "exclude": ["lib", "node_modules"]
}
```

package.json 增加编译脚本命令

```json
{
  "scripts": {
    "build": "tsc",
    "rollupJs": "rimraf dist && rollup -c rollup.config.mjs"
  }
}
```

将打包出来的文件中的导出语句修改成`module.exports `

```js
// export {}
module.exports = {};
```

有可能一些全局函数不可用，这些函数是浏览器专用，直接设置空函数。

```js
let clearTimeout = function () {};
let setTimeout = function () {};
```

复制文件到 yao 项目的 scripts 目录。

在别的文件中引用库，使用`Require`进行引用。注意`Require`中的 R 是大写。

```js
const { defaultParser } = Require('bound');
```

测试 js 库：

https://github.com/Soontao/odata-v4-parser.git

## 小心字节处理

### 字节处理

在 yao 中使用 js 处理字节数组时需要小心.

这个脚本不正常，如果在 js 脚本中读取了字节数组,并把字节数组作为 json 对象的属性返回时，将得不到你想要的结果，比如这里读取的图片内容，在 API 中输出时会显示一系列的数组，而不是字节码。

```js
function Download() {
  let fs = new FS('system');

  const buf = fs.ReadFileBuffer('/upload/1/20231115/微信图片.png');
  //
  return {
    content: buf,
    type: 'image/png'
  };
}
```

这个脚本正常，可以直接返回字节数组，没有包含在对象中。

```js
function Download() {
  let fs = new FS('system');

  const buf = fs.ReadFileBuffer(
    '/upload/1/20231115/微信图片_20220601141654.png'
  );
  return buf;
}
```

问题在原因在于，在 yao 中把 js 对象转换成 go 对象时，使用的是 js 的 json.marshal 与 go 的 jsoniter.Unmarshal。这个转换过程中，js 的字节 uint32 数组会转换成 float64 的数组。最后导致数据结构发生变化。

`/gou/runtime/v8/bridge/bridge.go`

```go
func goValueParse(value *v8go.Value, v interface{}) (interface{}, error) {

	data, err := value.MarshalJSON()
	if err != nil {
		return nil, err
	}

	ptr := &v
    // 字节数组类型发生变化。
	err = jsoniter.Unmarshal(data, ptr)
	if err != nil {
		fmt.Printf("---\n%s\n---\n", data)
		return nil, err
	}

	return *ptr, nil
}
```

### 替代方案

使用 flow，来操作文件的下载读取。

```json
{
  "label": "下载文件",
  "version": "1.0.0",
  "description": "下载文件",
  "nodes": [
    {
      "name": "filename",
      "process": "scripts.system.file.getFileName",
      "args": ["{{$in.0}}"]
    },
    {
      "name": "下载文件",
      "process": "fs.system.Download",
      "args": ["{{$res.filename}}"]
    }
  ],
  "output": "{{$res.下载文件}}"
}
```

### 总结

避免在 js 脚本中与 golang 之间进行大量的字节转换操作，比如读取转换文件。针对于类似的场景处理方案最好是使用 golang 的程序进行处理，避免使用脚本进行转换。同时 bytes 在转换过程也会消耗大量的内存，转换过程中也是按字节进行赋值处理。

## 自定义 Widget

使用自定义 Widget 实现动态表单。

_只适用于 0.10.3 以前的版本_

重点看这一句话。

> **Widget 支持开发者自定义**，可基于自身业务逻辑特征，自定义 DSL, 快速复制各种通用功能。本文将通过自定义 Widget 的方式，实现一套云表格系统。

重点就是自定义 Widget。

Yao 本身整个系统的逻辑是基于一套自定义的 DSL 构建起来的平台。我们需要编写符合 Yao 定义的规则的 DSL 配置文件，Yao 引擎才会识别，加载，运行。比如要生成数据库表，需要在 models 目录编写 mod.json,如果需要显示表格，需要在 tables 目录编写 table Widget DSL 文件，如果需要显示表单，需要在 forms 目录编写 form Widget DSL 文件。要完成一个模型的 curd 操作，至少需要编写三个文件:model,form,table。而使用自定义 Widget，只需要定义一个配置文件，就能快速生成动态表单。

Yao 平台已经实现了自定义 Widget 引擎，用户使用自定义 Widget 还需要完成以下的工作：

- 自定义 Widget 配置文件，自定义 Widget 的定义规则由用户创建，可以是任何合法的 JSON 文件。
- 自定义 Widget 解析逻辑，用户需要编写代码把自定义 Widget 转换成符合 Yao Widget 对象。

自定义 Widget 的作用有哪些：

- 通过一份配置文件生成多个 Yao 模型对象，简化工作流程，减少工作量。
- 自定义 Widget 配置源码不限来源，除了可以写在配置文件里，还可以保存在数据库里。

使用场景：

- 使用表单设计器，把自定义 Widget 配置写入到数据库，实现原文中说的云端表格，调查问卷等。

### 自定义 Widget 的技术原理

Yao 是如何实现上面所述的功能。

要完成自定义 Widget 转换成 Yao Widget 需要处理以下的事项：

- 读取自定义的 Widget 源码，在脚本 compile.js 中实现。
- 把自定义 Widget DSL 转换成 Yao Widget DSL。在脚本 export.js 中实现。
- 提供 widget 工具函数，在脚本 process.js 中实现

Yao 引擎实现了一个简单的 Widget 编译器。使用编译器加载源代码进行处理，最后生成 Yao Widget。

整个 widgets 处理分三个阶段：

- 从 js,json 文件中加载 Widget 的定义。从配置文件中加载 Widget 的定义，创建 Widget 实例。
- 初始化 Widget 处理器。
- Widget 实例初始化，加载自定义的 Widget 定义，编译源代码，输出 Yao Widget。

下面使用源代码进行实践，使用逻辑流程图加强理解。

- [自定义 Widget 演示项目源代码](https://github.com/YaoApp/demo-widget)

- [流程图在线查看](https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=yao_widget.drawio#Uhttps%3A%2F%2Fraw.githubusercontent.com%2Fwwsheng009%2Fyao-docs%2Fmain%2Fdocs%2F%25E6%25B5%2581%25E7%25A8%258B%25E5%259B%25BE%2Fdrawio%2Fyao_widget.drawio)

### 阶段一 加载 Widget 定义。

在程序启动阶段

- Yao 调用`widget.Load(cfg)`，源码：`/data/projects/Yao/Yao-app-sources/Yao/engine/load.go`。

- 调用 `/Yao-app-sources/gou/widget/widget.go`中的 load

- 加载配置文件 widgets.json
- 加载 widgets 目录下的 js 脚本文件
- 加载 process.js 中的 Export 函数导出的函数,并注册为 Yao 处理器
- 注册 export.js 中的 Apis 接口

这里容易混淆的地方是，process.js 中的 Export 与 export.js。

- process.js 的函数用于注册 Yao 处理器。注册的函数可以在 export.js 中调用，也可以在其它地方使用。process.js 中的 Export 是一个配置函数，暴露函数接口。

- export.js 的函数用于转换自定义 Widget 成 Yao Widget，用于处理 Widget 转换逻辑。

- 在 export.js 可以使用 process.js 中的函数，反过来就不行。

#### 加载配置

Yao 会扫描 widgets 下所有的目录，每一个子目录都是一个 widget 实例。

比如有一个目录为 dyform,那这个自定义 Widget 实例就是 dyform。

加载每一个自定义 Widget 目录下的配置文件`widget.json`，解析文件的配置项。重要的配置项有：

- `root` 自定义 Widget DSL 文件保存路径(相对于项目根目录)，每一个实例都是独立的。
- `extension` 自定义 Widget 文件扩展名,默认为`.json`
- `modules` 需要进行自定义 Widget 转换的模块列表,每个实例都可以配置转换哪些模块，如 model, table 等。模块的转换实现逻辑在 export.js 中定义，函数需要实现从定义 Widget 会转换成 Yao widget 的具体逻辑。 最后输出的 widget DSL 与保存在项目目录中的 DSL 文件等效。

#### 加载脚本文件

加载 Widget 实例目录下的所有 js 文件到 v8 引擎中。必须有`compile.js`，`export.js`，`process.js`三个 js 脚本文件。

- `compile.js`，用于编译自定义的 Widget DSL，完成源码到 DSL 的转换。

- `export.js`，用于转换自定义 Widget DSL 成 Yao Widget。可以调用 process.js 中的方法处理 DSL 对象。

- `process.js`，用于注册全局处理器。

- `<其它>.js`加载 Widget 实例目录中的其它 js 文件，属于辅助 js 函数。

比如有一个 js 文件名为 helper.js,会加载为处理器，名称为：`dyform.scripts.helper.方法名`，只能在 js 中使用，不是 process。

但是目前没有看到有调用的地方。

helper.js 命名格式

```go
// /Yao-app-sources/gou/widget/scripts.go:84
name := fmt.Sprintf("%s.scripts.%s", w.Name, InstName(root, basename))

```

#### 阶段二 加载注册处理器

把 process.js 的函数注册为标准的 Yao Process 处理器。函数注册后就是标准的处理器，可以在 export.js 中被调用。

调用格式：`widgets.INSTANCE.METHOD`，`widgets`是固定的分类，INSTANCE 是 Widget 实例名称，METHOD 是 Widget 实例目录下 process.js 文件中的 js 函数。

> process.js 的 Export 函数是一个导出配置函数，它的作用是定义在 process.js 中哪些函数可以被注册。

```js
//process.js

/**
 * Export processes，需要返回一个字典对象。
 */
function Export() {
  return { Model: 'Model', Table: 'Table', Save: 'Save', Delete: 'Delete' };
}
```

#### 源代码学习

当用户调用处理器`widgets.INSTANCE.METHOD`时,会在全局对象`WidgetCustomHandlers`中查找`WidgetCustomHandlers['INSTANCE']`的处理器。

另外有一个全局默认的方法`widgets.INSTANCE.reload`,用于重加载 widget 配置。

```go
// /Yao-app-sources/gou/process.go
case "widgets":
	//查找 widget 实例 instance
	if widgetHanlders, has := WidgetCustomHandlers[strings.ToLower(process.Class)]; has {
		//查找方法
		if handler, has := widgetHanlders[strings.ToLower(process.Method)]; has {
			process.Name = strings.ToLower(process.Name)
			process.Handler = handler
			return
		}
	}
	process.Name = strings.ToLower(process.Name)
	//有默认的配置方法。
	handler, has := WidgetHandlers[strings.ToLower(process.Method)]
	if !has {
		exception.New("Widget: %s %s does not exist", 404, process.Name, process.Method).Throw()
	}
	process.Handler = handler
	return
```

保存 Widget 处理器的全局变量 WidgetCustomHandlers:

- `WidgetCustomHandlers['dyform']['Model']`
- `WidgetCustomHandlers['dyform']['Table']`
- `WidgetCustomHandlers['dyform']['Save']`
- `WidgetCustomHandlers['dyform']['Delete']`

```go
// /Yao-app-sources/gou/widget.go
func customProcessRegister() widget.ProcessRegister {
	return func(widget, name string, handler func(args ...interface{}) interface{}) error {
		widget = strings.ToLower(widget)
		name = strings.ToLower(name)
		log.Info("[Widget] Register Process widgets.%s.%s", widget, name)
		if _, has := WidgetCustomHandlers[widget]; !has {
			WidgetCustomHandlers[widget] = map[string]ProcessHandler{}
		}

		WidgetCustomHandlers[widget][name] = func(process *Process) interface{} {
			return handler(process.Args...)
		}
		return nil
	}
}

```

在处理器里调用 Widget 实例方法时，实际上是在这里回调 process.js 脚本中的方法。

`widgets.<INSTANCE NAME>.<FUNCTION NAME>`

```go
// /Yao-app-sources/gou/widget/register.go

for name, methodAny := range resp {
	if method, ok := methodAny.(string); ok {
		w.ProcessRegister(w.Name, name, func(args ...interface{}) interface{} {
			value, err := w.ProcessExec(method, args...)
			if err != nil {
				exception.New(err.Error(), 500).Throw()
				return nil
			}
			return value
		})
	}
}
```

### 阶段三 加载 Widget 实例

`/Yao-app-sources/Yao/widget/widget.go`。

```go
for _, path := range paths {

	if !path.IsDir() {
		continue
	}

	name := path.Name()
	if _, err := os.Stat(filepath.Join(dir, name, "widget.json")); errors.Is(err, os.ErrNotExist) {
		// path/to/whatever does not exist
		continue
	}
	//widget定义加载
	w, err := gou.LoadWidget(filepath.Join(dir, name), name, register)
	if err != nil {
		return err
	}

	// widget实例加载
	// Load instances
	err = w.Load()
	if err != nil {
		return err
	}
}
```

#### 源代码转换 compile.js

`compile.js` 负责获取自定义 DSL 的源代码。

Yao 框架通过加载配置 DSL 文件后，就能创建出 Widget 实例。

##### Step1

自定义 DSL 文件来源默认是在 widget.json 配置的 root 目录下的所有的 json 文件。json 文件会自动加载。

也可以自定义 DSL 源码来源，比如保存在数据库中。这时就需要实现 compile.js 中的 Source 方法。Yao 框架会调用实例对应 compile.js 中的 Source 方法获取自定义 Widget DSL 的源代码。这里需要返回一个字典对象。字典对象的 key 就是 widget 实例名称，字典对象中的 Value 是 Widget 实例的 DSL 源代码，需要转换成 JS 对象。

##### Step2

无论是默认的 json 文件配置或是自定义的来源，Yao 框架调用 compile.js 中的 Compile 方法。在这里可以对 DSL 模型进一步的修正，Compile 方法的输入值是 js 对象，Yao 框架已经自动的作了转换。

##### Step3

Yao 框架根据 widget.json 配置的 modules 列表，调用 export.js 中的 DSL 转换方法，把自定义的 DSL 转换成 Yao DSL，并注入系统。

到这里自定义的 DSL 处理完成，Widget 实例在 Yao 系统中可用。

最后 Yao 框架调用 compile.js 中的 Onload 方法。

```js
/**
 * The DSL compiler.
 * Translate the customize DSL to Models, Processes, Flows, Tables, etc.
 */

/**
 * Source 自定义源代码来源
 * Where to get the custom source of DSL
 */
function Source() {
  var sources = {};
  const tpl = '';
  DSL = JSON.parse(tpl);
  sources[instance] = DSL;

  return sources;
}

/**
 * Compile
 * Translate or extend the customize DSL
 * @param {*} DSL
 */
function Compile(name, DSL) {
  return DSL;
}

/**
 * OnLoad
 * When the widget instance are loaded, the function will be called.
 * For preparing the sources the widget need.
 * @param {DSL} DSL
 */
function OnLoad(name, DSL) {
  log.Info('[Widget] dyform %s loaded', name);
}

/**
 * Migrate 未使用
 * When the migrate command executes, the function will be called
 * @param {DSL} DSL
 * @param {bool} force
 */
function Migrate(DSL, force) {}
```

#### 解析配置，DSL 转换

自定义的 Widget 需要转换成 Yao Widget 后才能被 Yao 平台识别，所以需要进行 Widget 转换处理与注册 Widget 的操作。

在`Yao-app-sources/Yao/widget/widget.go`中，Yao 把 Widget 资源加载入口函数暴露给 gou 引擎。

gou 引擎可以调用 Yao 的资源注册函数，把 Yao Widget 对象注册到全局资源池中。

```go
// Yao-app-sources/Yao/widget/widget.go

func moduleRegister() widget.ModuleRegister {
	return widget.ModuleRegister{
		"Apis": func(name string, source []byte) error {
			//注入
			_, err := gou.LoadAPIReturn(string(source), name)
			log.Trace("[Widget] Register api %s", name)
			if err != nil {
				log.Error("[Widget] Register api %s %v", name, err)
			}
			return err
		},
		"Models": func(name string, source []byte) error {
			//注入
			_, err := gou.LoadModelReturn(string(source), name)
			log.Trace("[Widget] Register model %s", name)
			if err != nil {
				log.Error("[Widget] Register model %s %v", name, err)
			}
			return err
		},
		"Tables": func(name string, source []byte) error {
			log.Trace("[Widget] Register table %s", name)
			//注入
			_, err := table.LoadTable(string(source), name)
			if err != nil {
				log.Error("[Widget] Register table %s %v", name, err)
			}
			return nil
		},
		"Tasks": func(name string, source []byte) error {
			log.Trace("[Widget] Register task %s", name)
			//注入
			_, err := gou.LoadTask(string(source), name)
			if err != nil {
				log.Error("[Widget] Register task %s %v", name, err)
			}
			return nil
		},
		"Schedules": func(name string, source []byte) error {
			log.Trace("[Widget] Register schedule %s", name)
			//注入
			_, err := gou.LoadSchedule(string(source), name)
			if err != nil {
				log.Error("[Widget] Register schedule %s %v", name, err)
			}
			return nil
		},
	}
}
```

框架会根据 Widget 配置文件`widget.Yao`里的`modules`属性配置调用对应的 js 转换函数。

```go
// /Yao-app-sources/gou/widget/instance.go
// Register modules
if w.Modules != nil {
	for _, module := range w.Modules {
		err = w.RegisterModule(module, name, DSL)
		if err != nil {
			return err
		}
	}
}
```

可配置的对象列表有`["Apis", "Models", "Tables", "Tasks", "Schedules"]`。这些对象就是 Yao Widget DSL 的内置类型。

- Apis API 定义
- Models 模型列表
- Tables 表格列表
- Tasks 任务
- Schedules 计划

gou 引擎根据你的`modules`配置在脚本 export.js 文件里找到对应的 js 函数。

比如`Apis`,就找 export.js 中的函数`function Apis(name, DSL){}`。找到函数并调用函数，最后调用上面 Yao 的回调函数,把 Widget 加载到全局对象。

以下的各个函数的方法定义，输入值是自定义 widget 实例名称与自定义 Widget 实例 DSL 配置，输出值是 Yao Widget DSL 对象。

```js
/**
 * Export Apis
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns 返回一个api DSL定义对象
 */
function Apis(name, DSL) {
  // /Yao-app-sources/gou/api.types.go
  // HTTP http 协议服务
  return {};
}

/**
 * Export Models 注册model的回调函数。
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Models(name, DSL) {
  // /Yao-app-sources/gou/model.types.go MetaData
  return {
    table: { name: 'dyform' },
    columns: [
      { label: 'DYFORM ID', name: 'id', type: 'ID' },
      { label: 'SN', name: 'sn', type: 'string', length: 20, unique: true }
    ],
    indexes: []
  };
}

// /**
//  * Export Flows 不支持
//  * @param {string} name widget实例名称，
//  * @param {string} DSL 自定义DSL
//  * @returns
//  */
// function Flows(name, DSL) {
//   return {};
// }

/**
 * Export Tables
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Tables(name, DSL) {
  // /Yao-app-sources/Yao/table/table.go
  // 返回Table对象
  return {};
}

/**
 * Export Tasks
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Tasks(name, DSL) {
  // /Yao-app-sources/gou/task.go
  return {};
}

/**
 * Export Schedules
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Schedules(name, DSL) {
  // /Yao-app-sources/gou/schedule.go Schedule定义
  return {};
}
```

### 总结

自定义 Widget 与 Studio 一脉相承。Yao 使用自定义 Widget 进行功能扩展让整个平台非常的灵活，保留了很好扩展性。

使用 JSON 作为配置文件，看似不方便，但却是最灵活的处理方式。

## 自定义 widget 升级版

在 0.10.3 版本后，widget 进行了重构。

在 yao 的框架中已经实现了以下内置的 widget:

- app
- chart
- dashboard
- import
- table
- form
- list

自定义 widget 的思路是按照 widget 的思路使用 js 脚本进行功能扩展，用户可以使用 json 文件定义自己的 dsl。

处理过程：

- 配置自定义 widget 的元配置信息，比如储存，加载，转换。

- 配置自定义 widget 的源代码 DSL 处理器与接口等配置信息

### 配置自定义 widget 的元配置信息

元信息保存了一个自定义 widget 的加载与及处理器信息。

自定义的 widget 的元信息定义文件需要存放在应用目录子目录 widgets 下，文件后缀名需要是`*.wid.yao, *.wid.json, *.wid.jsonc`。

widget 的类型定义有以下这些内容：

- name 名称
- description 描述
- path 路径
- extensions 扩展
- remote 远程配置
- loader 加载器，加载 DSL 定义的自定义的加载器
- process 处理器，API 的回调函数
- api 定义
- Instances DSL，每一种自定义的 widget 中都会根据配置加载所有的 DSL 定义

```go
type DSL struct {
	ID          string            `json:"-"`
	File        string            `json:"-"`
	Instances   sync.Map          `json:"-"`//
	FS          FS                `json:"-"`
	Name        string            `json:"name,omitempty"`
	Description string            `json:"description,omitempty"`
	Path        string            `json:"path,omitempty"`
	Extensions  []string          `json:"extensions,omitempty"`//DSL源文件扩展名列表
	Remote      *RemoteDSL        `json:"remote,omitempty"`//远程加载连接配置
	Loader      LoaderDSL         `json:"loader"`
	Process     map[string]string `json:"process,omitempty"`
	API         *api.HTTP         `json:"api,omitempty"`
}

// RemoteDSL is the remote widget DSL
type RemoteDSL struct {
	Connector string `json:"connector,omitempty"`
	Table     string `json:"table,omitempty"`
	Reload    bool   `json:"reload,omitempty"`
}
// LoaderDSL is the loader widget DSL
type LoaderDSL struct {
	Load   string `json:"load,omitempty"`
	Reload string `json:"reload,omitempty"`
	Unload string `json:"unload,omitempty"`
}
```

保存 widget DSL 原始配置有两种方式：

#### 从本地文件加载。

从本地文件系统加载需要两个配置项，path【保存自定义 widget 的目录路径】与 extension【自定义 widget 配置文件的扩展名】。

比如在应用目录下使用目录 dyforms 保存自定义 widget，需要以下的配置。

DSL 文件内容只支持这几种格式：yao/json/jsonc/yaml/yam。

```json
  // DSL Source  from application path: dyforms/feedback.form.yao
  "path": "dyforms",
  "extensions": ["*.form.yao"],//如果没有配置，默认使用： "*.yao", "*.json", "*.jsonc"
```

#### 从远程数据库表中加载

如果同时配置了远程连接器与本地配置，会优先使用远程连接器。

- connector，配置数据库连接器，需要是一个数据库的连接器，不配置的话会使用 default。
- table,保存源代码的表名。
- reload，是否使用重载功能，配置 true 会调用 reload 处理器。

保存源代码的数据库表需要两个字段：`file`,`source`。如果不指定 table 名称，会自动的根据 `widget_id` 配置一个表名 `widget_id` 命名的表`__yao_dsl_[widget_id]`。

这个保存源代码的表如果不存在，在 yao 启动的时候自动的创建，不需要手工干预。

- 字段`file`保存文件名，后缀名需要是 `yao/json/jsonc/yaml/yam`其中的一种。

- 保存`source`源代码，内容只支持这几种格式：`yao/json/jsonc/yaml/yam`。

```jsonc
  // Remote storage options (optional) - set "reload" to true to reload when DSL is updated (calls the Reload loader)
  // If remote storage is set, DSL is loaded from remote storage; otherwise, it is loaded locally.
  // If connector is default or not set, using the default database connection
  // If table not set, the default name is __yao_dsl_<Widget ID>
  "remote": { "connector": "default", "table": "dsl_iform", "reload": true },

```

#### 加载 widget DSL 实例

在上面读取了本地目录路径或是数据库的连接信息后，就会加载 widget 的 DSL 的源代码。

_需要注意的是，本地文件或是数据库中的源代码都只是原始的源代码信息，还不是最后的 DSL 定义。_

比如从目录 dyforms 下读取所有的后缀为`*.form.yao`文件。

```json
  // DSL Source  from application path: dyforms/feedback.form.yao
  "path": "dyforms",
  "extensions": ["*.form.yao"],
```

从数据库表 `dsl_iform` 中读取所有的实例定义。

```jsonc
  // Remote storage options (optional) - set "reload" to true to reload when DSL is updated (calls the Reload loader)
  // If remote storage is set, DSL is loaded from remote storage; otherwise, it is loaded locally.
  // If connector is default or not set, using the default database connection
  // If table not set, the default name is __yao_dsl_<Widget ID>
  "remote": { "connector": "default", "table": "dsl_iform", "reload": true },

```

#### DSL 实例加载器

在 Yao 加载 dsl 源代码后，还需要调用定义的处理器来进一步转换成 DSL 实例，通常 DSL 会使用 JSON 保存。

widget DSL 实例的加载还可以配置额外的三个处理器：

- load,加载处理，参数：【DSL 实例 ID，DSL 源代码】,注意不是 widget id，返回 dsl 定义。需要实现这个处理器来把源代码转换成 DSL 定义。

- reload,重加载处理，参数：【DSL 实例 ID，DSL 源代码，旧的实例定义】，返回新的 dsl 定义。当使用远程存储时，并且实现了这个方法，会自动的调用。

- unload,卸载处理，参数：【DSL 实例 ID】。卸载前的检查处理。

yao 并没有默认的实现，所以 load 与 reload 一定要实现。

```json
{
  // Widget DSL loader
  "loader": {
    "load": "scripts.dyform.Load",
    "reload": "scripts.dyform.Reload",
    "unload": "scripts.dyform.Unload"
  }
}
```

对应的 js 定义。

```js
/**
 * Dyform Loader: load
 * @param {*} id
 * @param {*} source
 * @returns
 */
function Load(id, source) {
  let dsl = source || {};
  dsl['id'] = id;
  return dsl;
}

/**
 * Dyform Loader: reload
 * @param {*} id
 * @param {*} source
 * @param {*} dsl
 * @returns
 */
function Reload(id, source, dsl) {
  let newDSL = source || {};
  newDSL['id'] = id;
  newDSL['tests.reload'] = typeof dsl === 'object';
  return newDSL;
}

/**
 * Dyform Loader: unload
 * @param {*} id
 */
function Unload(id) {
  if (id == undefined || id == null) {
    throw new Exception('id is required');
  }
}
```

比如定义文件名称为`feedback/new.form.yao`,对应的 DSL ID 为`feedback.new`,即是 DSL ID 是根据文件名进行处理的。

_不管理是保存在本地目录还是数据库，这个文件名一定要按 yao 的命名规则进行处理。_

#### dsl 源代码处理 API

widget 定义对应的实例源代码还可以通过两个处理器进行操作。

注意：只能针对于保存在数据库里的源代码进行操作，不能删除或是保存本地目录下的 dsl 定义文件。

保存 widget 源代码，处理器：widget.save，处理参数：

- name,widget 配置名称，即是在 widgets 目录下的配置名称，比如 dyform.wid.yao 对应的 widget 配置名就是 dyform
- file,widget 实例名称[文件名称],比如 feedback/website.form.jsonc
- source,源代码

删除 widget 源代码，处理器：widget.remove，处理参数：

- name,widget 配置名称，即是在 widgets 目录下的配置名称，比如 dyform.wid.yao 对应的 widget 配置名就是 dyform
- file,widget 实例名称[文件名称],比如 feedback/website.form.jsonc

在加载完 widget 的实例后还需要注册数据处理的处理器与 api。

### 注册 widget 处理器

处理器用于处理自定义 widget 的数据保存与读取等操作。

处理器的配置是一个映射表，这个表中所有的配置都会注册成这个 widget 的处理器。比如说下面的配置里的`setting`会注册成`widgets.[widget].[setting]`。而键配置是处理器名称，配置值是处理器的回调函数。调用`widgets.[widget].[method]`时会调用配置中对应的 js 脚本`scripts.*`。

比如下面的处理器 `widgets.[widget_id].Setting` 用于读取保存在文件或是数据库中的 widget 实例的配置，调用这个处理器会调用脚本`scripts.dyform.Setting`。

```json
{
  // Custom Widget handlers
  "process": {
    "setting": "scripts.dyform.Setting", //外部调用的处理器名称为 widgets.iform.Setting
    "find": "scripts.dyform.Find", // widgets.iform.Find
    "save": "scripts.dyform.Save", // widgets.iform.Save
    "delete": "scripts.dyform.Delete", // widgets.iform.Delete
    "cancel": "scripts.dyform.Cancel" // widgets.iform.Cancel
  }
}
```

这里的配置的处理器的名称没有限制。但是处理器的参数有以下的要求：

至少要有一个参数。

第一个参数是 `widget_id`,`widget_id` 一定是有效的 id，Yao 框架根据 id 找到对应的 widget 实例。

最后一个参数是 widget 对应的 dsl 定义。

这里示例只实现了读取 dsl setting 的操作，其它函数的都需要根据自己的具体需求进行扩展。

```js
/**
 * @process widgets.dyform.Setting
 * @args [id, dsl]
 */
function Setting(id, dsl) {
  dsl = dsl || {};
  dsl['tests.id'] = id;
  return dsl;
}
```

### 注册 WIDGET API

通过注册 api，可以把与自定义 widget 相关的功能暴露出来作为接口使用。

在这里配置的 api 会作为特定 `widget_id` 的处理接口，注册的 api 地址会统一加上前缀。

比如以下的接口定义就作了自定义表单的增删改查功能的定义。

注意：下面的配置的处理器`widgets.*` 只是一个示例，还要根据实际的需要修改成其它的处理。

```json
{
  // Custom Widget API
  // In production, if the API is changed, the service needs to be restarted.
  "api": {
    "guard": "bearer-jwt",
    "paths": [
      {
        "path": "/:id/setting", // GET /api/__yao/widget/dyform/feedback/setting
        "method": "GET",
        "process": "widgets.dyform.Setting",
        "in": ["$param.id"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/find/:primary", // GET /api/__yao/widget/dyform/feedback/find/1?select=id,name
        "method": "GET",
        "process": "widgets.dyform.Find",
        "in": ["$param.id", "$param.primary", ":query-param"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/save/:primary", // POST /api/__yao/widget/dyform/feedback/save/1
        "method": "POST",
        "process": "widgets.dyform.Save",
        "in": ["$param.id", "$param.primary", ":payload"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/cancel/:primary", // POST /api/__yao/widget/dyform/feedback/cancel/1
        "method": "POST",
        "process": "widgets.dyform.Cancel",
        "in": ["$param.id", "$param.primary", ":payload"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/delete/:primary", // POST /api/__yao/widget/dyform/feedback/delete/1
        "method": "POST",
        "process": "widgets.dyform.Delete",
        "in": ["$param.id", "$param.primary"],
        "out": { "status": 200, "type": "application/json" }
      }
    ]
  }
}
```

注册 API 后就可以通过 api 读取 widget 的定义，或是调用其它的功能。

api 的格式是`/api/__yao/widget/[WIDGET_ID]/[DSL_ID]/setting`,WIDGET_ID 是指自定义的 widget 配置 ID，DSL_ID 是指自定义 WIDGET 对应的 DSL 实例,可以理解为文件 ID。

比如读取 amis 中的实例 crud-list：`/api/__yao/wdiget/amis/crud-list/setting`

### 总结

新版本的 dyform 实现相比旧版的 dyform 逻辑上会更加清晰。但是只是进行了处理器处理与 API 加载，没有注册自定义 dsl 的 model/table/form 等操作。

可以调用以下的处理器把自定义的 DSL 转换成 YAO 标准模型，并加载到模型缓存或是生成数据库表。

- models.\<MODEL_ID\>.load，参数：【文件名，源代码】，加载模型定义到内存
- models.\<MODEL_ID\>.migrate，参数：【强制升级】，把模型定义映射到数据库

其它的界面设置可以参考 setting 处理器与 api，动态的根据参数输出不同的配置。

源代码位置：`\yao\widget`

### 测试案例：

https://github.com/YaoApp/yao-dev-app

## yao 应用引擎模板

注意：0.10.2 与 0.10.3 引擎并不兼容，所以使用的模板也不一样。

### 菜单

菜单的数据格式不一样。可以对比以下两个文件
0.10.2 的菜单输出是一个数组
0.10.3 的菜单输出是一个对象

### form/table dsl 不一样

2 个版本中的 form/table dsl 中的 action 对象结构不一样

### 模板使用

0.10.2 的请直接使用官方的模板

```sh
mkdir your-app
cd your-app
yao start
```

0.10.3 的请使用以下模板

```sh
git clone https://github.com/wwsheng009/yao-init
yao start
```

## Chart 钩子函数

替换 Chart 的默认处理器,可自定义 Chart 处理的过程

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程。

### action

- setting 默认处理器 "yao.chart.Setting"
- component 默认处理器 "yao.chart.Component"
- data 默认处理器 "yao.chart.Data"

```json
{
  "action": {
    "data": {
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

### Hook:

使用 hook 函数可以增强 Chart 的处理过程，比如 data 处理器使用默认的处理器，使用 before 与 after 处理器增强默认处理器的行为。

- before:data
- after:data

比如：

```json
{
  "action": {
    "after:data": "scripts.demo.AfterData",
    "before:data": "scripts.demo.BeforeData"
  }
}
```

### hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。

## 分析图表

分析图表(`Chart`) 主要用于编排数据统计分析查询逻辑，支持使用 JavaScript 脚本处理各查询节点结果，可在数据管理后台直接查阅分析图表，亦可作为处理器 (`process`) 来使用，引用方式为 `charts.<分析图表名称>`。分析图表(`Chart`)支持基于 `ElasticSearch` 、`MySQL` 实现的数据分析引擎用于各种业务场景。

数据看板、数据大屏页面亦可采用同样方式编写。

### 1 命名规范

分析图表描述文件是以 **小写英文字母** + `.chart.json` 扩展名命名的 JSON 文本文件, `<name>.chart.json`;
结果处理脚本文件是以 `分析图表名称` + `.` + `脚本名称` + `.js` 扩展名，命名的 JavaScript 脚本文件 `<name>.<script>.js` 。

数据看板扩展名为 `.kan.json`, 数据大屏扩展名为 `.scr.json`

| 文件夹 (相对分析图表根目录) | 文件名          | 分析图表名称         | 脚本名称 | Process (在 API /Flow 中引用) | API 路由地址                                   |
| --------------------------- | --------------- | -------------------- | -------- | ----------------------------- | ---------------------------------------------- |
| /                           | name.chart.json | `name`               |          | `charts.name`                 | `/api/xiang/chart/name/查询接口`               |
| /                           | name.count.js   | `name`               | `count`  | -                             | -                                              |
| /group                      | name.chart.json | `group.name`         |          | `charts.group.name`           | `/api/xiang/chart/group.name/查询接口`         |
| /group                      | name.count.js   | `gorup.name`         | `count`  | -                             | -                                              |
| /group1/group2              | name.chart.json | `group1.group2.name` |          | `charts.group1.group2.name`   | `/api/xiang/chart/group1.group2.name/查询接口` |
| /group1/group2              | name.count.js   | `group1.group2.name` | `count`  | -                             | -                                              |

### 2 文档结构

分析图表编排文档由基础信息、查询节点、输出数据和分析页面渲染参数构成。 [查看完整示例](#3%20完整示例)

```json
{
  "lang": "gou",
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [],
  "output": {},
  "apis": {},
  "filters": {},
  "page": {}
}
```

| 字段        | 类型                         | 说明                                                                                                                                        | 必填项 |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| lang        | String                       | 数据查询条件描述语言。 许可值 `gou` 适用基于数据库实现的数据分析引擎。`tai` 适用基于 ElasticSearch 实现的分析引擎(单独挂载)。 默认值为`gou` | 是     |
| label       | String                       | 分析图表呈现名称，用于开发平台呈现                                                                                                          | 是     |
| version     | String                       | 版本号，用于依赖关系校验和开发平台呈现                                                                                                      | 是     |
| description | String                       | 分析图表介绍，用于开发平台呈现                                                                                                              | 否     |
| nodes       | Array<Object Node\>          | 查询节点                                                                                                                                    | 是     |
| output      | Object \| `String`           | 输出结果定义, 同业务逻辑编排(`flow`) `output`                                                                                               | 是     |
| apis        | \[key:String\]:Object API    | 分析图表查询 API， 可通过设置同 `key` 设置关闭接口、设置鉴权方式和默认值选项。                                                              | 否     |
| filters     | \[key:String\]:Object Filter | 查询过滤器设置。 同数据表格(`talbe`) `fliters`。                                                                                            | 否     |
| page        | Object Page                  | 分析图表查询页设置。                                                                                                                        | 是     |

#### 2.1 查询节点 `nodes`

```json
{
  "nodes": [
    {
      "name": "行业分布",
      "query": {
        "model": "service",
        "select": ["city", ":COUNT(id) as cnt", "@industries.$ as industry"],
        "wheres": [
          { "column": "created_at", "value": "{{$query.from}}", "op": "ge" },
          { "column": "created_at", "value": "{{$query.to}}", "op": "le" }
        ],
        "order": ["cnt.desc"],
        "limit": 100,
        "group": ["@industries.$", "city"]
      }
    },
    {
      "name": "计费方式",
      "query": {
        "model": "service",
        "select": ["city", ":COUNT(id) as cnt", "@price_options.$ as option"],
        "wheres": [
          { "column": "created_at", "value": "{{$query.from}}", "op": "ge" },
          { "column": "created_at", "value": "{{$query.to}}", "op": "le" }
        ],
        "order": ["cnt.desc"],
        "limit": 100,
        "group": ["@price_options.$", "city"]
      }
    },
    {
      "name": "合并结果",
      "process": "xiang.chart.MergeData",
      "args": [
        ["城市", "行业", "计费"],
        {
          "行业": { "key": "city", "values": "{{$res.行业分布[*].industry}}" },
          "计费": { "key": "city", "values": "{{$res.计费方式[*].option}}" }
        }
      ]
    }
  ]
}
```

一个分析图表查询编排(`Chart`)可以有多个查询节点, 每个查询节点，也写设置对应数据引擎的 `query` 查询参数， 也可以调用一个处理器(`process`), 可以指定结果处理脚本和返回值，在查询节点用可以引用上下文信息。上下文数据引用、结果处理脚本具体与与业务逻辑编排(`Flow`)一致.

`Object Node` 数据结构

| 字段    | 类型           | 说明                                                                                                                                    | 必填项 |
| ------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| name    | String         | 查询节点名称                                                                                                                            | 是     |
| query   | Query DSL      | 查询语言 [查看完整说明](#3%20完整示例)                                                                                                  | 否     |
| process | String         | 调用处理器 `process` `query` 与 `process` 任选其一。 如同时存在忽略 `process` 设置。                                                    | 否     |
| args    | Array<Any\>    | 处理器参数表.可以引用输入输出或上下文数据，与 `flow` 相同。 [查看完整说明](#3%20完整示例)                                               | 否     |
| script  | String         | 结果处理脚本，支持 ES5，与 `flow` 相同。 [查看完整说明](#3%20完整示例)                                                                  | 否     |
| outs    | Array<String\> | 查询节点结果输出.使用 `{{$out}}` 引用处理器返回结果，与 `flow` 相同。如不设置，返回值等于处理器返回结果。 [查看完整说明](#3%20完整示例) | 否     |
| next    | Object Next    | 当查询结果符合设定条件时跳转至指定查询节点(**尚未实现**)                                                                                | 否     |

### 数据分析查询语法 `Query DSL`

| 数据分析引擎 | 说明                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `gou`        | Gou Query DSL(Domain Specific Language) 用来描述数据查询条件，适用基于数据库实现的数据分析引擎。      |
| `tai`        | Tai Query DSL(Domain Specific Language) 用来描述数据查询条件，适用基于 ElasticSearch 的数据分析引擎。 |

#### 2.2 查询页 `page`

```json
{
  "page": {
    "primary": "城市",
    "layout": {
      "filters": [
        { "name": "开始时间", "width": 6 },
        { "name": "结束时间", "width": 6 }
      ],
      "charts": [
        { "type": "line", "props": {} },
        { "type": "bar", "props": {} }
      ]
    }
  }
}
```

##### 布局 (`layout`)

| 字段      | 类型                                     | 说明               |
| --------- | ---------------------------------------- | ------------------ |
| `charts`  | Array<Object Render \| String \>         | 可使用的图表组件   |
| `filters` | Array<Object FilterInstance \| String \> | 可呈现的查询过滤器 |

###### Object FilterInstance 数据结构

| 字段  | 类型    | 说明                                                | 必填项 |
| ----- | ------- | --------------------------------------------------- | ------ |
| name  | String  | 字段名称。必须已在查询过滤器方式(`filters`)中定义。 | 是     |
| width | Integer | 列宽度。使用栅格系统，有效值 `1`-`24`。默认值为 `6` | 否     |

#### 2.3 分析图表查询接口 `apis`

分析图表默认开启数据和配置查询接口， 可通过设置同 `key` 设置关闭接口、设置鉴权方式和默认值选项。

```json
{
  "apis": {
    "data": {
      "disable": true,
      "guard": "bearer-jwt",
      "default": {}
    },
    "setting": {
      "guard": "-",
      "default": {}
    }
  }
}
```

| 字段    | 类型   | 说明                                                                                    | 必填项 |
| ------- | ------ | --------------------------------------------------------------------------------------- | ------ |
| disable | Bool   | 关闭接口。 `true` 关闭接口                                                              | 否     |
| guard   | String | 接口鉴权中间件, 多个用 `,` 分割， 设置为 `-` 不设置鉴权中间件, 不设置继承默认鉴权方式。 | 否     |
| default | Object | 参数表默认值, `{"from":"2021-08-28"}`                                                   | 否     |

##### 接口列表

| 管理接口(`key`) | 请求方式 | 路由(相对) | 说明                                                                 |
| --------------- | -------- | ---------- | -------------------------------------------------------------------- |
| data            | `GET`    | `/data`    | 返回查询结果 [查看完整说明](#3%20完整示例)                           |
| setting         | `GET`    | `/setting` | 读取分析图表配置信息, 用于前端界面渲染 [查看完整说明](#3%20完整示例) |

### 3 完整示例

完整示例保存在 examples 目录，[查看完整示例](#3%20完整示例)

```json
{
  "lang": "gou",
  "label": "指标对比",
  "version": "1.0.0",
  "decription": "指标对比",
  "nodes": [
    {
      "name": "行业分布",
      "process": "models.service.get",
      "query": {
        "select": ["city", ":COUNT(id) as cnt", "@industries.$ as industry"],
        "wheres": [
          { "column": "created_at", "value": "{{$query.from}}", "op": "ge" },
          { "column": "created_at", "value": "{{$query.to}}", "op": "le" }
        ],
        "order": ["cnt.desc"],
        "limit": 100,
        "group": ["@industries.$", "city"]
      }
    },
    {
      "name": "计费方式",
      "process": "models.service.get",
      "query": {
        "select": ["city", ":COUNT(id) as cnt", "@price_options.$ as option"],
        "wheres": [
          { "column": "created_at", "value": "{{$query.from}}", "op": "ge" },
          { "column": "created_at", "value": "{{$query.to}}", "op": "le" }
        ],
        "order": ["cnt.desc"],
        "limit": 100,
        "group": ["@price_options.$", "city"]
      }
    },
    {
      "name": "合并结果",
      "process": "xiang.chart.MergeData",
      "args": [
        ["城市", "行业", "计费"],
        {
          "行业": { "key": "city", "values": "{{$res.行业分布[*].industry}}" },
          "计费": { "key": "city", "values": "{{$res.计费方式[*].option}}" }
        }
      ]
    }
  ],
  "output": "{{$res.合并结果}}",
  "apis": {
    "data": {
      "guard": "-"
    },
    "setting": {
      "guard": "-"
    }
  },
  "filters": {},
  "page": {
    "primary": "城市",
    "layout": {
      "filters": [
        { "name": "开始时间", "width": 6 },
        { "name": "结束时间", "width": 6 }
      ],
      "charts": [
        { "type": "line", "props": {} },
        { "type": "bar", "props": {} }
      ]
    }
  }
}
```

## 图表类型

[官方文档](https://yaoapps.com/components/%E5%9B%BE%E8%A1%A8/Bar)

### 图表类型

- Bar 柱状图
- Funnel 漏斗图
- Line 折线图
- LineBar 折线图
- Bar 折柱混合图
- Number 数字卡片
- NumberChart 数字图表
- Pie 百分比
- Table 嵌入表格

#### Bar 柱状图

```json
{
  "状态分布": {
    "bind": "datasource_status",
    "view": {
      "type": "Bar",
      "props": {
        "height": 240,
        "nameKey": "status",
        "axisLabel": { "interval": 0, "fontSize": 12 },
        "series": [
          {
            "valueKey": "count",
            "type": "bar",
            "colorBy": "data",
            "itemStyle": { "borderRadius": 6 },
            "splitLine": { "show": false },
            "axisLabel": { "show": false }
          }
        ]
      }
    }
  }
}
```

数据:

```json
{
  "datasource_status": [
    { "status": "已查看", "count": 3 },
    { "status": "治疗中", "count": 12 },
    { "status": "已治愈", "count": 9 }
  ]
}
```

#### Funnel 漏斗图

```json
{
  "访客情况": {
    "bind": "visit_condition",
    "view": {
      "type": "Funnel",
      "props": {
        "nameKey": "name",
        "series": [
          {
            "valueKey": "value",
            "top": 48
          }
        ]
      }
    }
  }
}
```

数据:

```json
{
  "visit_condition": [
    { "value": 60, "name": "到店" },
    { "value": 40, "name": "电话咨询" },
    { "value": 20, "name": "网上提问" },
    { "value": 30, "name": "多次消费" },
    { "value": 100, "name": "一次消费" }
  ]
}
```

#### Line 折线图

```json
{
  "收入_折线图": {
    "bind": "income",
    "link": "/x/Table/pet",
    "view": {
      "type": "Line",
      "props": {
        "cardStyle": { "padding": 0 },
        "type": "line",
        "chartHeight": 120,
        "prefix": "¥",
        "decimals": 2,
        "nameKey": "date",
        "valueKey": "value"
      }
    }
  }
}
```

数据:

```json
{
  "income": [
    { "value": 40300, "date": "2022-1-1" },
    { "value": 50800, "date": "2022-2-1" },
    { "value": 31300, "date": "2022-3-1" },
    { "value": 48800, "date": "2022-4-1" },
    { "value": 69900, "date": "2022-5-1" },
    { "value": 37800, "date": "2022-6-1" }
  ]
}
```

#### Bar 折柱混合图

```json
{
  "综合消费": {
    "bind": "datasource_cost",
    "view": {
      "type": "LineBar",
      "props": {
        "height": 240,
        "nameKey": "name",
        "axisLabel": { "interval": 0, "fontSize": 12 },
        "series": [
          {
            "valueKey": "stay",
            "type": "line",
            "smooth": true,
            "symbolSize": 8,
            "itemStyle": { "borderRadius": 6 },
            "splitLine": { "show": false },
            "axisLabel": { "show": false }
          },
          {
            "valueKey": "cost",
            "type": "bar",
            "itemStyle": { "borderRadius": 6 },
            "splitLine": { "show": false },
            "axisLabel": { "show": false }
          }
        ]
      }
    }
  }
}
```

数据:

```json
{
  "datasource_cost": [
    { "name": "毛毛", "stay": 3, "cost": 2000 },
    { "name": "阿布", "stay": 6, "cost": 4200 },
    { "name": "咪咪", "stay": 7, "cost": 6000 },
    { "name": "狗蛋", "stay": 1, "cost": 1000 }
  ]
}
```

#### Number

Number 类型的图形有两种显示形式，如果数据类型是数字，只会显示一个数字。

如果数据类型是对象，那么会显示当前数量 current 与之前数量 prev

```json
{
  "宠物数量": {
    "bind": "pet_count",
    "link": "/x/Table/peakalert",
    "view": {
      "type": "Number",
      "props": { "unit": "个" }
    }
  },
  "宠物数量_上月": {
    "bind": "prev_pet_count",
    "link": "/x/Table/pet",
    "view": {
      "type": "Number",
      "props": {
        "cardStyle": { "padding": 0 },
        "unit": "个",
        "prev_title": "上月数据"
      }
    }
  }
}
```

数据:

```json
{
  "pet_count": 54,
  "prev_pet_count": { "current": 54, "prev": 45 }
}
```

#### NumberChart 数字图表

```json
{
  "支出": {
    "bind": "cost",
    "link": "/x/Table/pet",
    "view": {
      "type": "NumberChart",
      "props": {
        "chartHeight": 150,
        "color": "red",
        "prefix": "¥",
        "decimals": 2,
        "nameKey": "date",
        "valueKey": "value"
      }
    }
  }
}
```

数据:

```json
{
  "cost": [
    { "value": 28100, "date": "2022-1-1" },
    { "value": 23000, "date": "2022-2-1" },
    { "value": 29300, "date": "2022-3-1" },
    { "value": 26700, "date": "2022-4-1" },
    { "value": 26400, "date": "2022-5-1" },
    { "value": 31200, "date": "2022-6-1" }
  ]
}
```

#### Pie 百分比

```json
{
  "类型排布": {
    "bind": "datasource_type",
    "link": "/x/Table/demo.pet",
    "view": {
      "type": "Pie",
      "props": {
        "nameKey": "type",
        "series": [
          {
            "valueKey": "count",
            "roseType": "area",
            "radius": [10, 100],
            "center": ["60%", "50%"],
            "itemStyle": { "borderRadius": 6 }
          }
        ]
      }
    },
    "refer": {
      "type": "Table",
      "props": {
        "columns": [
          { "title": "类型", "dataIndex": "type" },
          { "title": "数量", "dataIndex": "count" }
        ]
      }
    }
  }
}
```

数据:

```json
{
  "datasource_type": [
    { "type": "猫猫", "count": 18 },
    { "type": "狗狗", "count": 6 },
    { "type": "其他", "count": 3 }
  ]
}
```

#### Table 嵌入表格

```json

```

数据:

```json
{}
```

## Dashboard 钩子函数

替换 Dashboard 的默认处理器,可自定义 Dashboard 处理的过程

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程。

### action

- setting 默认处理器 "yao.dashboard.Setting"
- component 默认处理器 "yao.dashboard.Component"
- data 默认处理器 "yao.dashboard.Data"

```json
{
  "action": {
    "data": {
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

### Hook:

使用 hook 函数可以增强 Dashboard 的处理过程，比如 data 处理器使用默认的处理器，使用 before 与 after 处理器增强默认处理器的行为。

- before:data
- after:data

比如：

```json
{
  "action": {
    "after:data": "scripts.demo.AfterData",
    "before:data": "scripts.demo.BeforeData"
  }
}
```

### hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。

## AI 表单

探索 AI 与业务集成的使用场景。

### 配置

在 neo 的配置文件中，可以通过 prepare/write 处理器进行拦截 neo 的提问与回复。

```yaml
connector: openai.gpt-4
guard: 'scripts.guard.Chat'

conversation:
  connector: default
  table: yao_neo_conversation
  max_size: 10
  ttl: 3600

command:
  parser: openai.gpt-3_5-turbo

## 这个地方可以进行拦截用户的提问
prepare: 'scripts.neo.Prepare'

## 拦截机器人回复
write: 'scripts.neo.Write'

option:
  temperature: 0.6

allows:
  - 'http://127.0.0.1:5099'
  - 'http://localhost:5099'
```

### 智能表格

在 xgen 中可以使用 action 可以给 neo 设置不同的指令上下文，让 neo 可以与具体的业务数据进行关联。

典型的应用是根据用户上传的文档进行本地数据库进行搜索。

```json
{
  "title": "提问",
  "icon": "icon-send",
  "showWhenAdd": true,
  "showWhenView": true,
  "action": [
    {
      "name": "提问",
      "type": "Common.emitEvent",
      "payload": {
        "key": "app/setNeoVisible",
        "value": {
          "visible": true,
          "placeholder": "输入你的问题，我会优先从文件中搜索作答",
          "signal": {
            "name": "DocumentQuestion",
            "id": "{{id}}",
            "from": "admin.query"
          }
        }
      }
    }
  ]
}
```

在 Neo prepare 处理器中进行拦截，根据不同的指令进行不同的操作。

比如这里搜索文档内容后再给 AI 提问，在聊天窗口中自然就会包含本地知识的内容。

```ts
function Prepare(context: ChatContext, messages: ChatMessage[]): ChatMessage[] {
  const { namespace, signal, field } = context;
  if (namespace === "Form-Page-expert" && field?.bind === "description") {
    return autoDescribe(context, messages);
  }

  switch (signal?.name) {
    case "AskExpert":
      return askExpert(context, messages);

    //
    case "DocumentQuestion":
      return DocumentQuestion(context, messages);

    case "AutoInput":
      return autoInput(context, messages);
  }

```

### 智能表单

如果是在表单界面使用 neo 助手，还可以进行智能表单的设置。

首先需要在表单中编辑控件中增加 ai 属性

```json
{
  "fields": {
    "form": {
      "介绍": {
        "bind": "description",
        "edit": {
          "props": {
            "rows": 5,
            // ai属性
            "ai": {
              "placeholder": "输入一些关于专家的介绍信息，我会帮助你优化"
            }
          },
          "type": "TextArea"
        },
        "view": { "props": {}, "type": "" }
      }
    }
  }
}
```

在表单编辑时，就会显示一个弹出对话框。

当用户输入提问的问题后会触发事件：`app/getField`，

```js
window.$app.Event.emit('app/getField', {
  name: item.name, //字段名称，表单字段名称
  bind: item.bind, //字段绑定的对象，数据库字段
  text: target.value, //用户的提问
  config: item //当前字段配置
});
```

在 neo 接收到提问后会向后端发出 ai 请求。

```ts
useEffect(() => {
  if (!messages.length) return;

  const latest_message = messages.at(-1)!;

  if (latest_message.is_neo) return;

  getData(latest_message);
}, [messages]);
```

在后端，可以在 neo.write 消息处理器拦截机器人回复，并返回自定义的 action 操作指令。

比如，这里就能给表单设置不同的值。并且通过 action `Common.emitEvent` 进行回调 xgen 界面的功能。

```ts
function WriteAutoInput(
  context: ChatContext, // 上下文信息
  messages: ChatMessage[], // 历史消息
  response: ResponseMessage, // 机器人的回复流
  content?: string // 完整的回复内容
): ResponseMessage[] {
  const { namespace, signal } = context;
  if (content === undefined) {
    return [response];
  }

  if (response.done) {
    try {
      const data: Record<string, any> = JSON.parse(content);
      response.actions = [
        {
          name: 'Test',
          type: 'Common.emitEvent',
          payload: {
            key: `${namespace}/setFieldsValue`,
            value: data
          }
        }
      ];

      response.confirm = true;
      return [response];
    } catch (error) {
      console.log(`Error:`, error.message, content);
      return [response];
    }
  }

  return [response];
}
```

在 Xgen 中，Neo 接收到这些命令后就会执行，比如上面的操作命令就会调用 form.setFieldsValue 方法把后端返回的 data 数据设置到表单中。

## form 的一些使用技巧

![](../docs/Studio/自动生成table_form定义文件.md)

### form 最小化配置

只需要以下最小的配置，即可在`xgen`上使用`form`.字段与控件的配置会根据`model`中的配置自动生成

```json
{
  "name": "用户",
  "action": {
    "bind": {
      "model": "<MODEL_ID>",
      "option": {
        "withs": { "<RELATETION_ID>": {} }
      }
    }
  }
}
```

### 给 form 增加常用的三个按钮

文件配置路径:`layout.actions`,注意替换<MODEL_ID>

```json
{
  "layout": {
    "actions": [
      {
        "title": "返回",
        "icon": "icon-arrow-left",
        "showWhenAdd": true,
        "showWhenView": true,
        "action": [
          {
            "name": "CloseModal",
            "type": "Common.closeModal",
            "payload": {}
          }
        ]
      },
      {
        "title": "保存",
        "icon": "icon-check",
        "style": "primary",
        "showWhenAdd": true,
        "action": [
          {
            "name": "Submit",
            "type": "Form.submit",
            "payload": {}
          },
          {
            "name": "Back",
            "type": "Common.closeModal",
            "payload": {}
          }
        ]
      },
      {
        "icon": "icon-trash-2",
        "style": "danger",
        "title": "Delete",
        "action": [
          {
            "name": "Confirm",
            "type": "Common.confirm",
            "payload": {
              "title": "确认删除",
              "content": "删除后不可撤销！"
            }
          },
          {
            "name": "Delete",
            "payload": {
              "model": "<MODEL_ID>"
            },
            "type": "Form.delete"
          },
          {
            "name": "Back",
            "type": "Common.closeModal",
            "payload": {}
          }
        ]
      }
    ]
  }
}
```

## 单据参考创建

demo 请参考：[单据参考创建](https://github.com/wwsheng009/yao-demo-form-ref-create)

业务场景：根据单据类型 A 创建单据类型 B，单据 B 的部分值参考单据 A。

xgen 在表单与表格/表单与表单之间只有通过字段 id 进行串联。

要实现上述的业务需求有两个办法

- 修改现在有的 xgen 框架代码。

- 使用表单的 hook 函数。

### 方法一，修改方法如下：

修改 xgen 框架的源代码，增加处理自定义数据的逻辑。这个办法的优点是数据只会在前端上传输，缺点是修改的代码升级困难，需要自己作版本管理。

https://github.com/wwsheng009/xgen/commit/3adb3e00d60c9d7b2e8f9a535d2bd9a97a6c00eb

https://github.com/wwsheng009/xgen/commit/77a0646dbd4a06ebd756bb4b2d973c0eb14a8883

#### 配置 action

在`payload.Form.data`里配置自定义的数据

```json
{
  "action": [
    {
      "payload": {
        "Form": {
          "model": "so",
          "type": "edit",
          "data": {
            "pet_name": "{{name}}",
            "total_amount": "{{cost}}"
          }
        }
      },
      "name": "Submit",
      "type": "Common.openModal"
    }
  ],
  "title": "参考创建销售订单",
  "icon": "icon-plus-circle"
}
```

### 方法二，使用表单 Hook 函数

创建一个新的 form 定义文件,在新 Form 里定义 hook 函数进行数据处理。

优点是不需要调整 xgen 框架的代码。只需要在后端写脚本处理即可。缺点是多一次网络调用。

[so2.form](forms/so2.form.json)

```json
{
  "name": "so",
  "action": {
    "bind": {
      "model": "so",
      "option": {
        "withs": {}
      }
    },
    "find": {
      "process": "scripts.so.Find"
    },
    "save": {
      "process": "scripts.so.Save"
    }
  }
}
```

[so.js](scripts/so.js)

```js
/**
 * 根据id找到pet的对象，返回so2 form的默认值
 * @param {number} id pet的id
 * @returns
 */
function Find(id) {
  const pet = Process('models.pet.Find', id, null);
  //或是其它对象值
  return { pet_name: pet['name'] };
}
/**
 * 永远创建新对象
 * @param {object} payload 表单的数据
 * @returns
 */
function Save(payload) {
  delete payload['id']; //这里的id是pet的id
  return Process('models.so.Save', payload);
}
```

### 配置 action

```json
{
  "action": [
    {
      "payload": {
        "Form": {
          "model": "so2",
          "type": "edit"
        }
      },
      "name": "Submit",
      "type": "Common.openModal"
    }
  ],
  "title": "参考销售订单",
  "icon": "icon-arrow-right"
}
```

## 在 Form 里嵌套 List 控件

### `List`控件与`Table`控件的区别

- `List`是一个纯前端的组件，数据来源于`value`属性,可以直接使用`Form`的`withs`关联表的数据，而`Table`的数据来源需要从服务器上读取。
- `List`在`Form`里可进行/新增/删除/修改,而`Table`不能新增数据。

### Step1 定义 List

在`/lists`目录下新增一个`List`类型的定义，文件名格式是`plan_item.list.json`。

`LIST DSL`在结构上大致与`Table`一样。需要配置`fields.list`,`layout.list.columns`

```json
{
  "action": {
    "bind": {
      "model": "plan.item"
    }
  },
  "layout": {
    "list": {
      "columns": [
        { "name": "单品", "width": 8 },
        { "name": "计划数量", "width": 8 },
        { "name": "入库数量", "width": 8 }
      ]
    }
  },
  "fields": {
    "list": {
      "id": {
        "bind": "id",
        "edit": {
          "props": { "placeholder": "请输入 ID" },
          "type": "InputNumber"
        },
        "view": { "props": {}, "type": "Text" }
      },
      "单品": {
        "bind": "sku_id",
        "edit": {
          "props": {
            "itemProps": {
              "rules": [{ "required": true }]
            },
            "xProps": {
              "$remote": {
                "process": "yao.component.SelectOptions",
                "query": {
                  "model": "material.sku",
                  "label": "sku_sn",
                  "value": "id"
                }
              }
            }
          },
          "type": "Select"
        }
      },
      "入库数量": {
        "bind": "amount",
        "edit": {
          "props": {
            "placeholder": "只读字段",
            "disabled": true
          },
          "type": "InputNumber"
        },
        "view": { "props": {}, "type": "Text" }
      },
      "计划数量": {
        "bind": "amount_plan",
        "edit": {
          "props": {
            "itemProps": {
              "rules": [{ "required": true }]
            },
            "min": 0
          },
          "type": "InputNumber"
        },
        "view": { "props": {}, "type": "Text" }
      }
    }
  }
}
```

### Step2 Form 配置

在`Form`的配置文件中加一个字段配置。

字段的编辑控件的类型需要设置为`List`。

编辑属性里需要把`name`设置成上面配置`list`的名称。

字段绑定的字段的类型需要是`json`,比如这里绑定的字段`items`的类型需要是一个`json list`。

可选配置`"showLabel": true`,`List`控件里的字段显示标签

```jsonc
{
  "fields": {
    "form": {
      "物资清单": {
        "bind": "items",
        "edit": {
          "type": "List",
          "props": {
            "name": "plan_item", //重要
            "showLabel": true
          }
        }
      }
    }
  }
}
```

完成以上的操作，就可以在 Form 看到一个列表控件。控件中的行项目可以拖动调整顺序。

![list in form](../docs/YaoDSL/Xgen/Form/images/xgen-form-list.png)

### Step3 保存数据。

你可能会遇到这个问题

![](..%5Cdocs%5C源代码%5CXgen%5Cxgen%20List控件保存数据时数据被清空.md)

`List`控件的数据保存操作需要在`Form`的`Hook`里进行拦截处理。

在`Form`里使用`save`事件的`Hook`

`/yao-wms/forms/plan.form.json`

```json
{
  "name": "计划",
  "action": {
    "bind": {
      "model": "plan",
      "option": {
        "withs": {
          "items": {}
        }
      }
    },
    "save": {
      "process": "scripts.plan.Save" //保存在这里
    },
    "before:delete": "scripts.plan.BeforeDeletePlan" //删除在这里
  }
}
```

处理脚本：`/yao-wms/scripts/plan.js`，详细逻辑请查注释。

如果是`Form`与`List`控件的数据是主从表关系，需要考虑联动删除与保存逻辑。

```js
/**自定义保存数据函数 */
function Save(data) {
  //先保存主表，获取id后再保存从表
  var id = Process('models.plan.Save', data);
  AfterSave(id, data);
}

/**
 * 更新 Items
 */
function AfterSave(id, payload) {
  var items = payload.items || {};
  var deletes = items.delete || [];
  //当有删除项目时,数据保存在items.data里
  //如果没有删除项目,项目items
  var data = items.data || items || [];

  if (data.length > 0 || deletes.length > 0) {
    // 忽略实际数据 ( 通过 record 计算获取)
    for (var i in data) {
      delete data[i].amount;
      if (typeof data[i].id === 'string' && data[i].id.startsWith('_')) {
        //新增项目，在前端会生成唯一字符串,
        //由于后台使用的自增长ID，不需要生成的唯一字符串，由数据库生成索引
        delete data[i].id;
      }
    }

    // 保存物品清单
    var res = Process('models.plan.item.EachSaveAfterDelete', deletes, data, {
      plan_id: id
    });
    if (res.code && res.code > 300) {
      console.log('Plan:AfterSave Error:', res);
      return id;
    }
  }

  // 生成计划标签
  var plan_sn = payload['plan_sn'];
  if (!plan_sn) {
    return Process('models.plan.Save', { id: id, plan_sn: MakeSN(id) });
  }

  return id;
}

/**
 * 生成计划标签 (1+id)
 * 标签: 类目(6)-SKU(8)-**计划(6)**-Item(9)
 *      100001 20000001 000000 400000001
 */
function MakeSN(id) {
  var sn = id.toString();
  return sn.padStart(6, '0');
}
```

#### 数据删除

数据的删除需要考虑表格数据批量删除与表单单个删除。

```js
/**
 * 关联表删除
 * before Delete Plan
 * @param {number} id Plan id
 */
function BeforeDeletePlan(id) {
  // console.log("delete Plan with id:", id);
  let rows = Process('models.plan.item.DeleteWhere', {
    wheres: [{ column: 'plan_id', value: id }]
  });

  //remembe to return the id in array format
  return [id];
}

/**
 * 关联表批量删除
 * before Delete Plan Batch
 * @param {array} param0 Plan object
 */
function BeforeDeletePlanIn({ wheres }) {
  let array = wheres[0].value || [];
  array.forEach((element) => {
    BeforeDeletePlan(element);
  });

  return array;
}
```

### 完整的例子

请查看项目源代码:[yao-wms](https://github.com/wwsheng009/yao-wms)

## 在`Form`里显示子表

可在以`Form`显示子表内容，可惜无法在子表里增加新条目。

- 配置字段的类型为:`type:Table`
- 配置字段属性`edit.props.model`为`Table`的标识
- 配置表的筛选条件`edit.props.query`

```json
{
  "fileds": {
    "form": {
      "消息列表": {
        "edit": {
          "props": {
            "model": "chat.message_simple",
            "query": {
              "select": "id,prompt,completion,request_total_time",
              "where.conversation_id.eq": "{{id}}"
            }
          },
          "type": "Table"
        }
      }
    }
  }
}
```

效果：
![table_in_form](../docs/YaoDSL/Xgen/Form/table_in_form.png)

如果需要在`Form`里增加新内容，可以使用`List`控件。

## Form 钩子函数

替换 Form 的默认处理器,可自定义 form 处理的过程,

钩子函数分两类：一类是完全替换整个功能，另外一类是不修改内置功能，而是进行补丁。

第一类，比如要创建一个用户主数据记录，yao 本身就内置了一个处理器`yao.form.save`,用于把数据保存到数据库中。如果不需要把数据保存到数据库，而是把数据通过 http 接口传输到另外一个系统时，可以通过配置`action.save`来设置一个自定义的`action`处理器。

### action

| 操作      | 默认处理器         | 参数                                   |
| --------- | ------------------ | -------------------------------------- |
| setting   | yao.form.Setting   | form_id, xpath, method, query          |
| component | yao.form.Component | form_id, xpath, method, payload        |
| upload    | yao.form.Upload    | form_id, xpath, method, file           |
| download  | yao.form.Download  | form_id, field_name, query_name, token |
| find      | yao.form.Find      | form_id, primary_key                   |
| save      | yao.form.Save      | form_id, payload                       |
| create    | yao.form.Create    | form_id, payload                       |
| update    | yao.form.Update    | form_id, primary_key, payload          |
| delete    | yao.form.Delete    | form_id, payload                       |

```json
{
  "action": {
    "find": {
      "process": "", //处理器名称，必选
      "bind": "", //处理器名称,同process【可选】
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。【可选】
      "default": [] //默认参数值【可选】
    }
  }
}
```

第二类需求，在把数据保存到数据库之后或是之前，进行数据处理，可以使用`before`或是`after` `action`处理器。

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程，所以当需要错误处理时，最好选择第一类钩子函数进行增强处理。

### Hook:

使用 hook 函数可以增强 Form 的处理过程，比如 find 处理器使用默认的处理器，使用 before 与 after 处理器增强默认处理器的行为。

- before:find
- after:find
- before:save
- after:save
- before:create
- after:create,传入参数是记录创建后的主键值，一般是 autoid
- before:delete
- after:delete
- before:update
- after:update

比如：

```json
{
  "action": {
    "after:find": "scripts.license.AfterFind",
    "before:delete": "scripts.license.BeforeDelete"
  }
}
```

### hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致,由于 yao 处理器的特殊性，返回值如果不是 null,都需要返回数组。

```js
function beforeSave(payload) {
  if (!payload.public_key && !payload.private_key) {
    const keyObj = Process('plugins.license.create');
    payload.public_key = keyObj.public_key;
    payload.private_key = keyObj.private_key;
    payload.key_hash = keyObj.key_hash;
  }

  return [payload]; //返回数组
}
```

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。

## hook 的参数

`Table/Form`都可以使用`hook`来增强功能

### before:save

`before hook`与`after hook`的`xpath`在`action`节点下

`forms/record/total.form.json`

```json
{
  "name": "记录",
  "action": {
    "bind": {
      "model": "record"
    },
    "before:save": "scripts.record.BeforeSave",
    "after:save": "scripts.record.AfterSave"
  }
}
```

`before:save`的输入参数是`payload`,输出是包含`payload`的数组

```js
/** 数据保存之间调用 */
function BeforeSave(payload) {
  // 输出数组,为下一个处理器save作准备,格式一定是数组
  return [payload];
}
```

### save

`Save`处理器的说明如下，第一个参数是结构体，不是数组,使用`[<记录>]`的形式是因为所有的处理器的调用用时的参数形式都是数组，在调用具体脚本函数时，参数列表会自动的解构。

`models.<ID>.Save	[<记录>]	记录主键值	保存单条记录, 不存在创建记录, 存在更新记录, 返回记录 ID 示例 查看`

```js
/**
 * Save Hook函数
 * payload 需要保存的记录结构
 * 返回保存的数据的id
 * */
function Save(payload) {
  // 自定义的处理逻辑

  // 可以返回id或是返回数组[id]
  return id;
}
```

### after:save

`save`只会返回一个保存后的`id`,可以在`aftersave`中根据 id 把数据读取出来

```js
/**
 * 数据保存之后
 * id,接收Save方法返回的id
 * 返回id
 * */
function AfterSave(id) {
  // read the saved record
  var payload = Process('models.<模型名称>.Find', id, {});

  // 可以增加其它筛选条件
  var payload = Process('models.<模型名称>.Find', id, {
    select: ['id', 'name', 'user_sn', 'photo', 'status']
  });

  // 一般都返回id
  return id;
}
```

### form hook

form hook before / after 的源代码

`/yao/widgets/hook/hook.go`

## List 钩子函数

替换 List 的默认处理器

### action

- setting 默认处理器 "yao.list.Setting"
- component 默认处理器 "yao.list.Component"
- upload 默认处理器 "yao.list.Upload"
- download 默认处理器 "yao.list.Download"
- get 默认处理器 "yao.list.Get"
- save 默认处理器 "yao.list.Save"

```json
{
  "action": {
    "get": {
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

### Hook:

- before:get
- after:get ""
- before:save
- after:save

比如：

```json
{
  "action": {
    "after:find": "scripts.license.AfterFind",
    "before:delete": "scripts.license.BeforeDelete"
  }
}
```

### hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。

## neo 嵌入业务流程指令

## 适用版本

0.10.3 或以上

### 配置

#### api 配置

如果是在 yao 中配置 api 接口。需要按以下的格式进行配置。

字段`type`一定要包含`text/event-stream`

```json
{
  "path": "/my/neo",
  "method": "POST",
  "guard": "-",
  "process": "scripts.ai.stream.chat",
  "in": [":payload"],
  "out": {
    "status": 200,
    "type": "text/event-stream; charset=utf-8"
  }
}
```

#### 配置 app.yao

neo 需要使用 sse 接口的配置。

在应用配置文件 app.yao 中增加以下的 api 接口配置。
这里的 api 接口可以使用外部的 api 地址或是内部的 api 地址。

注意：地址`api/__yao/neo`是 yao 内嵌的 neo api,

- 外部地址：`http://localhost:5099/api/my/neo`
- 内部地址会自动补全 api 前缀:`my/neo`

```json
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "my/neo" }
  }
}
```

#### 处理器

在 api 对应的处理器需要按以下的语法返回消息。

全局函数`ssEvent`是一个 yao 特有的 sse 流消息处理函数。

- 参数一是 sse 指令，这里一定要使用`message`,xgen 才会识别。
- 参数二是业务指令或是消息。

`scripts/ai/stream.js`

```js
function chat() {
  ssEvent('message', {
    // 在xgen neo中执行的命令
    actions: [
      {
        name: 'SearchTable',
        type: 'Table.search',
        payload: {}
      },
      {
        name: 'HistoryPush',
        type: 'Comman.historyPush',
        payload: {
          pathname: '/x/Form/hero/1/edit'
        }
      }
    ],
    confirm: true, //会提示消息包含业务指令，是否执行？
    done: true //确认此次对话已经完成
  });

  //
  //   发送其它消息
  ssEvent('message', { text: 'hello wolrd' });
}
```

### 指令

neo 指令也是 action。但是不同的指令在不同的场景中有不同的作用。

共用的 action:

- Common.historyPush 可以用于打开新的链接
- Common.historyBack
- Common.confirm 提示
- Service. 所有的 service 函数
- Studio. 所有的 stuio 函数，开发环境有效

### 与 Table/Form 页面关联。

如果在 form 表单页面或是 table 表格页面使用 neo。以下特定的 action 可以生效。

在 Table 显示页面使用 neo 助手可以使用以下的 action:

- Table.search
- ~~Table.save~~ 无法使用
- ~~Table.delete~~ 无法使用

在 form 页面使用 neo 助手可以使用以下的 action。

- Form.find
- Form.submit
- Form.delete
- Form.fullscreen form 全屏显示
- Common.openModal
- Common.closeModal

## Table 钩子函数

可使用以下的配置替换 table 的默认处理器

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程。

通过指定 API 处理器，在不绑定数据模型的情况下，在数据表格中使用其他的数据源。

### action

- setting
- component
- upload
- download
- search
- get
- find
- save
- create
- insert
- delete
- delete-in
- delete-where
- update
- update-in
- update-where

```json
{
  "action": {
    "get": {
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

### Hook:

可以使用 Hooks 处理表格 API 输入输出数据。Hook 分为 `before` 和 `after` 两类， before hook，在 API 调用前运行，可以用来处理传入参数，after hook，在 API 调用后运行，可用来处理查询结果。

在描述数据表格时，在 `hooks` 字段，声明 **Hook 关联的处理器**，例如：

使用 Before Hook 锁定搜索条件，过滤掉 `search` API 越界输入。

使用 After Hook 处理表单提交数据，保存历史数据。

- before:find
- after:find
- before:search
- after:search
- before:get
- after:get
- before:save
- after:save
- before:create
- after:create
- before:delete
- after:delete
- before:insert
- after:insert
- before:delete-in
- after:delete-in
- before:delete-where
- after:delete-where
- before:update-in
- after:update-in
- before:update-where
- after:update-where

比如：

```json
{
  "action": {
    "after:find": "scripts.license.AfterFind",
    "before:delete": "scripts.license.BeforeDelete"
  }
}
```

### hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。

## `tableA`跳转到`FormB`

通过使用类型`Common.historyPush`的`Action`实现关连 form 的跳转。form 的显示都需要一个`id`来关连。在 form 打开时会根据`id`抓取相关`form`的具体信息。

```json
{
  "layout": {
    "table": {
      "operation": {
        "actions": [
          {
            "icon": "category-outline",
            "action": [
              {
                "name": "HistoryPush",
                "payload": {
                  "pathname": "/x/Form/material.category/{{category.id}}/view"
                },
                "type": "Common.historyPush"
              }
            ],
            "title": "查看分类",
            "width": 3
          }
        ]
      }
    }
  }
}
```

## 根据条件禁用`Table_Form Action`按钮

设置`action.disabled`属性，`action.disabled.bind`是绑定记录的值，`action.disabled.value`是`action`禁用条件,有以下两种情况。

- 当`action.disabled.value`的类型是数组时，`value`的值包含`action.disabled.bind`的值时，`action`按钮被禁用。

- 当`action.disabled.value`的类型不是数组时，`value`的值等于`action.disabled.bind`的值时，`action`按钮被禁用。

比如以下的代码，当记录的`id`是 1 或是 2 时，`action`按钮被禁用。

```json
{
  "operation": {
    "fold": false,
    "width": 60,
    "actions": [
      {
        "title": "查看",
        "icon": "icon-eye",
        "disabled": {
          "bind": "{{id}}",
          "value": ["1", "2"]
        }
      }
    ]
  }
}
```

## 在 Table 上使用 Tab 控件

在`form.json`中配置路径为`layout.form.sections[0].columns[0].tabs`

`tabs`跟`column`同级别。在`tabs`中可以嵌套`columns`

```jsonc
{
  "layout": {
    "form": {
      "props": {},
      "sections": [
        {
          "title": "基础信息",
          "desc": "宠物的一些基本信息",
          "columns": [
            {
              "width": 24,
              "tabs": [
                {
                  "title": "Base",
                  "columns": [
                    {
                      "name": "名称",
                      "width": 12
                    }
                  ]
                },
                {
                  "title": "More",
                  "columns": [
                    {
                      "name": "状态",
                      "width": 12
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

## 在 table 中设置字段只读

只需要把`fields`中的字段对应的编辑控件`edit`删除掉，只保留`view`配置。

```json
{
  "fields": {
    "table": {
      "创建时间": {
        "bind": "created_at",
        "view": { "props": { "format": "YYYY-MM-DD HH:mm:ss" }, "type": "Text" }
      },
      "更新时间": {
        "bind": "updated_at",
        "view": { "props": { "format": "YYYY-MM-DD HH:mm:ss" }, "type": "Text" }
      }
    }
  }
}
```

## table 的一些使用技巧

![](../docs/Studio/自动生成table_form定义文件.md)

### 常见问题

Q:在`fields`节点配置了字段，无法在界面上显示。

A:需要在`layout.table.columns中增加对应字段`

## 增加查看，编辑，删除按钮

需要先增加模型对应的`form`配置文件

配置路径:`layout.table.operation.actions`,注意替换<MODEL_ID>

```json
{
  "layout": {
    "table": {
      "operation": {
        "actions": [
          {
            "icon": "icon-eye",
            "title": "查看",
            "action": [
              {
                "name": "OpenModal",
                "payload": {
                  "Form": {
                    "model": "<MODEL_ID>",
                    "type": "view"
                  }
                },
                "type": "Common.openModal"
              }
            ]
          },
          {
            "icon": "icon-edit-2",
            "title": "编辑",
            "action": [
              {
                "name": "OpenModal",
                "payload": {
                  "Form": {
                    "model": "<MODEL_ID>",
                    "type": "edit"
                  }
                },
                "type": "Common.openModal"
              }
            ]
          },
          {
            "icon": "icon-trash-2",
            "style": "danger",
            "title": "Delete",
            "action": [
              {
                "name": "Confirm",
                "type": "Common.confirm",
                "payload": {
                  "title": "确认删除",
                  "content": "删除后不可撤销！"
                }
              },
              {
                "name": "Delete",
                "payload": {
                  "model": "<MODEL_ID>"
                },
                "type": "Table.delete"
              }
            ]
          }
        ]
      }
    }
  }
}
```

## `Table`搜索默认条件

设置 Table 分页搜索的默认条件。

方法一，设置`action.search.default`。

`search`是指 Table 搜索接口的处理器的配置，而`default`是配置处理器的默认参数列表，`default`配置项的类型是一个数组，数组内容对应着相关处理器的参数。可以理解为配置处理器的默认参数列表。

比如这里的`search`对应的处理器是`yao.table.search`,它的参数是`[queryParam,page,pagesize]`，
这里的第一个参数类型是 QueryParam。

```json
{
  "action": {
    "search": {
      "default": [
        {
          "wheres": [
            {
              "column": "type",
              "op": "in",
              "value": ["入库", "进入"]
            }
          ]
        }
      ]
    }
  }
}
```

同理也可以设置其它的处理器默认参数。

- setting
- component
- upload
- download
- search
- get
- find
- save
- create
- insert
- delete
- delete-in
- delete-where
- update
- update-in
- update-where

方法二，设置`action.bind.option`

```json
{
  "action": {
    "bind": {
      "option": {
        "wheres": [
          {
            "column": "type",
            "op": "in",
            "value": "入库,进入"
          }
        ]
      }
    }
  }
}
```

### `Table`默认排序

```json
{
  "$schema": "https://raw.githubusercontent.com/wwsheng009/yao-app-ts-types/main/json-schemas/0.10.3/table.json",
  "name": "Hero List",
  "action": {
    "bind": {
      "model": "hero",
      "option": {}
    },
    "search": {
      "default": [
        {
          "orders": [
            { "column": "defense", "option": "asc" },
            { "column": "name", "option": "desc" }
          ]
        }
      ]
    }
  }
}
```

## table 最小化配置

只需要以下最小的配置，即可在`xgen`上使用`table`.字段与控件的配置会根据`model`中的配置自动生成。

`action.bind.option.form`的配置会自动的增加创建按钮与`table`行项目中的三个常用按钮

```json
{
  "name": "用户",
  "action": {
    "bind": {
      "model": "<MODEL_ID>",
      "option": {
        "withs": { "<RELATETION_ID>": {} },
        "form": "<FORM_ID>"
      }
    }
  }
}
```

**注意**

需要注意的是，使用最小化配置时，关联的模型需要需要有过滤器 filter 的设置。

也即是，需要确保在模型的字段定义中至少有一个字段的属性 index/unique/primary 设置成 true,会自动生成 filter。

## 在`table`界面上增加创建按钮

需要先增加相关的`form`配置文件。

方法一,在绑定节点使用 form 选项,配置路径:
xpath:"action.bind.option.form".

```json
{
  "action": {
    "bind": {
      "model": "user",
      "option": {
        "withs": { "supplier": {} },
        "form": "user"
      }
    }
  }
}
```

方法二,手动配置路径:`layout.filter.actions`,注意替换\<FORMID\>。不要使用 layout.header.actions,配置了也没效。

```json
{
  "layout": {
    "filter": {
      "actions": [
        {
          "action": [
            {
              "name": "HistoryPush",
              "payload": {
                "pathname": "/x/Form/<FORMID>/0/edit"
              },
              "type": "Common.historyPush"
            }
          ],
          "icon": "icon-plus",
          "title": "::Create",
          "width": 3
        }
      ]
    }
  }
}
```

## 数据表格

### 1. 命名规范

数据表格描述文件是以 **小写英文字母** 命名的 JSON 文本文件 `<name>.tab.json`

| 文件夹 (相对应用模型根目录) | 文件名        | 表格名称             | API 路由地址                                   |
| --------------------------- | ------------- | -------------------- | ---------------------------------------------- |
| /                           | name.tab.json | `name`               | `/api/xiang/table/name/管理接口`               |
| /group/                     | name.tab.json | `gorup.name`         | `/api/xiang/table/group.name/管理接口`         |
| /group1/group2/             | name.tab.json | `gorup1.gorup2.name` | `/api/xiang/table/group1.group2.name/管理接口` |

### 2. 文档结构

数据表格文档，由表格基础信息、数据模型绑定、业务结构映射表、字段映射表、过滤器映射表、列表页、编辑页、批量插入页和详情页构成。

```json
{
  "name": "云服务库",
  "version": "1.0.0",
  "bind": {},
  "apis": {},
  "columns": {},
  "filters": {},
  "list": {},
  "edit": {},
  "view": {},
  "insert": {}
}
```

| 字段    | 类型                         | 说明                                                                                                                                 | 必填项 |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| name    | String                       | 数据表格名称                                                                                                                         | 是     |
| version | String                       | 版本号，用于依赖关系校验和开发平台呈现                                                                                               | 是     |
| bind    | Object Bind                  | 绑定数据模型。                                                                                                                       | 否     |
| hooks   | \[key:String\]:String        | 数据表格 Hook                                                                                                                        | 否     |
| apis    | \[key:String\]:Object API    | 数据管理 API 设置。如设置绑定数据模型，自动根据模型信息生成数据管理 API， 可通过设置同 `key` 的配置信息，覆盖自动生成的 API。        | 否     |
| columns | \[key:String\]:Object Column | 字段呈现方式设置。 如设置绑定数据模型，自动根据字段类型信息设置关联组件，可通过设置同 `key` 的配置信息，覆盖自动生成的关联组件信息。 | 否     |
| filters | \[key:String\]:Object Filter | 查询过滤器设置。 如设置绑定数据模型，自动根据索引和字段信息设置关联组件，可通过设置同 `key` 的配置信息，覆盖自动生成的关联组件信息。 | 否     |
| list    | Object Page                  | 列表页设置。                                                                                                                         | 是     |
| edit    | Object Page                  | 编辑页设置。                                                                                                                         | 是     |
| view    | Object Page                  | 查看页设置。                                                                                                                         | 否     |
| insert  | Object Page                  | 批量录入页设置。                                                                                                                     | 否     |

#### 2.1 基础信息

```json
{
  "name": "用户",
  "title": "可信云云服务库 | 数据管理",
  "decription": "可信云云服务库"
}
```

| 字段       | 类型   | 说明                                       | 必填项 |
| ---------- | ------ | ------------------------------------------ | ------ |
| name       | String | 数据表格名称, 可用于开发平台中呈现         | 是     |
| title      | String | 打开数据表格页面时，浏览器栏呈现的页面标题 | 否     |
| decription | String | 数据表格介绍, 可用于开发平台中呈现         | 否     |

#### 2.2 绑定数据模型 `bind`

可以通过设置 `model` 和 `withs`, 实现数据表格与数据模型绑定。绑定后，应用引擎将根据数据模型定义，生成 `apis`, `columns` 和 `fliters` 配置，如需要特殊声明，添加同 `key` 的特殊配置信息即可。也可在 `columns`, `fliters` 新增字段用于各页面呈现。

```json
{
  "bind": {
    "model": "service",
    "withs": {
      "manu": {
        "query": {
          "select": ["id", "name", "short_name", "status"]
        }
      },
      "kind": {
        "query": {
          "select": ["id", "name"]
        }
      }
    }
  }
}
```

| 字段  | 类型                       | 说明                  | 必填项 |
| ----- | -------------------------- | --------------------- | ------ |
| model | String                     | 绑定数据模型名称      | 是     |
| withs | \[key:String\]:Object With | 数据模型关联查询设置. | 否     |

#### 2.3 数据表格管理接口 `apis`

数据表格将提供增删改查等接口，通过这些接口完成数据管理操作。如设置绑定数据模型，自动根据模型信息生成数据管理 API， 可通过设置同 `key` 的配置信息，覆盖自动生成的 API, API 输入输出数据结构需与原接口保持一致。

##### Object API 数据结构

```json
{
  "apis": {
    "search": {
      "process": "models.service.Paginate",
      "guard": "bearer-jwt",
      "default": [
        {
          "withs": {
            "manu": {
              "query": {
                "select": ["id", "name", "short_name", "status"]
              }
            }
          }
        },
        null,
        15
      ]
    },
    "find": {
      "process": "models.service.Find",
      "default": [
        null,
        {
          "withs": {
            "manu": {
              "query": {
                "select": ["id", "name", "short_name", "status"]
              }
            }
          }
        }
      ]
    },
    "管理接口(key) ": {
      "process": "处理器名称",
      "guard": "-",
      "default": []
    }
  }
}
```

| 字段    | 类型        | 说明                                                                                    | 必填项 |
| ------- | ----------- | --------------------------------------------------------------------------------------- | ------ |
| process | String      | 绑定处理器 (`process`) 输入输出数据结构需与原接口保持一致                               | 是     |
| guard   | String      | 接口鉴权中间件, 多个用 `,` 分割， 设置为 `-` 不设置鉴权中间件, 不设置继承默认鉴权方式。 | 否     |
| default | Array<Any\> | 参数表默认值, 如没有默认值可以设置为 `null`, 如 `[null, null, 15]`                      | 否     |

##### 接口列表

| 管理接口(`key`) | 请求方式 | 路由(相对)      | 说明                                   |
| --------------- | -------- | --------------- | -------------------------------------- |
| search          | `GET`    | `/search`       | 按条件查询, 分页。                     |
| find            | `GET`    | `/find`         | 按主键查询单条记录。                   |
| save            | `POST`   | `/save`         | 保存单条记录，存在更新，不存在创建。   |
| delete          | `POST`   | `/delete`       | 按主键删除单条记录。                   |
| insert          | `POST`   | `/insert`       | 批量新增记录。                         |
| delete-where    | `POST`   | `/delete/where` | 批量删除符合条件的记录。               |
| delete-in       | `POST`   | `/delete/in`    | 批量删除指定一组主键的的数据记录。     |
| update-where    | `POST`   | `/update/where` | 批量更新符合条件的记录。               |
| update-in       | `POST`   | `/update/in`    | 批量更新指定一组主键的的数据记录。     |
| quicksave       | `POST`   | `/quicksave`    | 保存多条记录，存在更新，不存在创建。   |
| setting         | `GET`    | `/setting`      | 读取数据表格配置信息, 用于前端界面渲染 |

#### 2.4 字段呈现方式 `columns`

可以对字段设定在列表呈现 (`view`)、列表编辑 (`edit`)和编辑表单(`form`)中的呈现方式， 字段自由添加，可在各页面呈现设置中使用。如设置绑定数据模型，自动根据数据模型字段名称、字段类型生成对应呈现， 可通过设置同 `key` 的配置信息，覆盖自动生成的呈现信息。字段呈现方式映射表，可从 `setting` 接口中读取。

```json
{
  "columns": {
    "name": {
      "label": "服务名称",
      "view": {
        "type": "label",
        "props": {
          "value": ":name"
        }
      },
      "edit": {
        "type": "input",
        "props": {
          "value": ":name"
        }
      },
      "form": {
        "type": "input",
        "props": {
          "value": ":name"
        }
      }
    },
    "manu.name": {
      "label": "厂商名称",
      "view": {
        "type": "label",
        "props": {
          "value": ":manu.name"
        }
      }
    },
    "所属厂商": {
      "label": "所属厂商",
      "view": {
        "name": "label",
        "props": {
          "value": ":manu.short_name"
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":manu.id",
          "searchable": true,
          "remote": {
            "api": "/api/manu/get",
            "query": {
              "select": ["id", "name"],
              "keyword": "where_name_like"
            }
          }
        }
      }
    }
  }
}
```

##### Object Column 数据结构

| 字段  | 类型          | 说明                                                          | 必填项 |
| ----- | ------------- | ------------------------------------------------------------- | ------ |
| label | String        | 字段呈现的字段名称                                            | 是     |
| view  | Object Render | 列表或查看页面，阅读状态时的使用的组件及属性, 默认为 `label`  | 否     |
| edit  | Object Render | 列表或查看页面，编辑状态时的使用的组件及属性 , 默认为 `input` | 否     |
| form  | Object Render | 编辑页面，使用的组件及属性，默认为 `input`                    | 否     |

#### 2.5 查询过滤器 `fliters`

可以通过设置查询过滤器，添加数据查询条件呈现。 查询过滤器自由添加，可在列表页面呈现设置中使用。如设置绑定数据模型，自动根据数据模型索引名称、字段信息生成对应配置， 可通过设置同 `key` 的配置信息，覆盖自动生成的配置信息。查询过滤器映射表，可从 `setting` 接口中读取。

```json
{
  "filters": {
    "关键词": {
      "label": "关键词",
      "bind": "where.name.like",
      "input": {
        "type": "input",
        "props": {
          "placeholder": "请输入关键词"
        }
      }
    },
    "所属厂商": {
      "label": "厂商",
      "bind": "where.manu_id.in",
      "input": {
        "type": "select",
        "props": {
          "searchable": true,
          "multiple": true,
          "placeholder": "请选择所属厂商",
          "remote": {
            "api": "/api/manu/get",
            "query": {
              "select": ["id", "name"],
              "keyword": "where.name.like",
              "limit": 500
            }
          }
        }
      }
    }
  }
}
```

##### Object Filter 数据结构

| 字段  | 类型          | 说明                                                                                         | 必填项 |
| ----- | ------------- | -------------------------------------------------------------------------------------------- | ------ |
| label | String        | 过滤器显示名称                                                                               | 是     |
| bind  | String        | 绑定的查询条件 URL Query String 字段名称, 如 `where.manu_id.in` (用作 `search` API 查询参数) | 是     |
| input | Object Render | 查询内容输入组件, 默认为 `input`                                                             | 否     |

#### 2.6 列表页 `list`

```json
{
  "list": {
    "primary": "id",
    "layout": {
      "columns": [
        { "name": "服务名称", "width": 6 },
        { "name": "所属厂商", "width": 6 },
        { "name": "服务类型", "width": 4 }
      ],
      "filters": [
        { "name": "关键词", "width": 6 },
        { "name": "所属厂商", "width": 6 }
      ]
    },
    "actions": {
      "create": {
        "type": "button",
        "props": {
          "label": "新建服务"
        }
      },
      "view": {},
      "edit": {},
      "import": {},
      "update": {},
      "delete": {},
      "insert": {},
      "updateWhere": {},
      "deleteWhere": {},
      "updateSelect": {},
      "deleteSelect": {},
      "pagination": {
        "type": "",
        "props": {
          "pages": true,
          "prev": true,
          "next": true
        }
      },
      "setting": {}
    }
  }
}
```

##### 布局 (`layout`)

| 字段      | 类型                                     | 说明               |
| --------- | ---------------------------------------- | ------------------ |
| `columns` | Array<Object ColumnInstance \| String \> | 数据列表可呈现的列 |
| `filters` | Array<Object FilterInstance \| String \> | 可呈现的查询过滤器 |

###### Object ColumnInstance 数据结构

| 字段  | 类型    | 说明                                                | 必填项 |
| ----- | ------- | --------------------------------------------------- | ------ |
| name  | String  | 字段名称。必须已在字段呈现方式(`columns`)中定义。   | 是     |
| width | Integer | 列宽度。使用栅格系统，有效值 `1`-`24`。默认值为 `6` | 否     |

###### Object FilterInstance 数据结构

| 字段  | 类型    | 说明                                                | 必填项 |
| ----- | ------- | --------------------------------------------------- | ------ |
| name  | String  | 字段名称。必须已在查询过滤器方式(`filters`)中定义。 | 是     |
| width | Integer | 列宽度。使用栅格系统，有效值 `1`-`24`。默认值为 `6` | 否     |

##### 功能 (`actions`)

| 名称           | 说明                     |
| -------------- | ------------------------ |
| `create`       | 新建数据记录按钮         |
| `view`         | 查看数据记录详情按钮     |
| `edit`         | 修改数据记录表单按钮     |
| `import`       | 导入数据记录按钮         |
| `export`       | 导出数据记录按钮         |
| `update`       | 更新单条字段按钮         |
| `delete`       | 删除单条记录按钮         |
| `insert`       | 批量插入按钮             |
| `deleteWhere`  | 按条件批量删除按钮       |
| `updateWhere`  | 按条件批量更新按钮       |
| `deleteSelect` | 批量删除选中数据记录按钮 |
| `updateSelect` | 批量更新选中数据记录按钮 |
| `pagination`   | 分页器                   |
| `setting`      | 数据表配置按钮           |

#### 2.7 编辑页 `edit`

```json
{
  "edit": {
    "primary": "id",
    "layout": {
      "groups": [
        {
          "title": "基础信息",
          "description": "",
          "columns": [
            { "name": "服务名称", "width": 6 },
            { "name": "所属厂商", "width": 6 },
            { "name": "服务类型", "width": 6 },
            { "name": "状态", "width": 6 },
            { "name": "rank", "width": 6 }
          ]
        },
        {
          "title": "数据标签",
          "description": "",
          "columns": ["服务领域", "计费方式", "行业覆盖"]
        }
      ]
    },
    "actions": {
      "cancel": {},
      "save": {
        "type": "button",
        "props": {
          "label": "保存"
        }
      },
      "delete": {}
    }
  }
}
```

##### 布局 (`layout`)

| 字段     | 类型                 | 说明                 | 必填项 |
| -------- | -------------------- | -------------------- | ------ |
| `groups` | Array<Object Group\> | 编辑表单字段分组列表 | 是     |

**Object Group 数据结构**

| 字段          | 类型                                     | 说明               | 必填项 |
| ------------- | ---------------------------------------- | ------------------ | ------ |
| `title`       | String                                   | 分组名称           | 否     |
| `description` | String                                   | 分组介绍           | 否     |
| `columns`     | Array<Object ColumnInstance \| String \> | 数据列表可呈现的列 | 是     |

##### 功能 (`actions`)

| 名称     | 说明         |
| -------- | ------------ |
| `cancel` | 取消编辑按钮 |
| `save`   | 保存数据按钮 |
| `delete` | 删除数据按钮 |

#### 2.8 查看页 `view`

本版不做实现

#### 2.9 批量录入页 `insert`

本版不做实现

### 3. Object Render 数据结构

```json
{
  "type": "select",
  "props": {
    "value": "{{manu_id}}",
    "searchable": true,
    "remote": {
      "api": "/api/manu/get",
      "query": {
        "select": ["id", "name"],
        "keyword": "where.name.like"
      }
    }
  }
}
```

| 字段       | 类型         | 说明                                                                                       | 必填项 |
| ---------- | ------------ | ------------------------------------------------------------------------------------------ | ------ |
| type       | String       | 使用的组件名称                                                                             | 是     |
| props      | Object<Any\> | 组件属性，具体查看对应组件文档。属性参数中可以使用 `字符串`、`数字` 和 `变量`。            | 否     |
| components | Array<Any\>  | 复合组件，引用原子组件名称或描述。 `["计费方式", "行业覆盖", {"name":"姓名", "props":{}}]` | 否     |

**在属性(`props`) 中使用变量**
:::v-pre
可以在属性(`props`)中可以使用 `{{字段名称}}` 或 `:字段名称` 引用当前记录数据，支持使用 `.` 访问 `Object` 或 `Array` 类型数据，如 `{{字段名称.foo.bar}}`、`{{字段名称.0.foo}}`、`:字段名称.foo.bar`、`:字段名称.0.foo`
:::

### 4. Object Page 数据结构

```json
{
  "edit": {
    "primary": "id",
    "layout": {
      "groups": [
        {
          "title": "数据标签",
          "description": "",
          "columns": ["服务领域", "计费方式", "行业覆盖"]
        }
      ]
    },
    "actions": {
      "cancel": {},
      "save": {
        "type": "button",
        "props": {
          "label": "保存"
        }
      },
      "delete": {}
    }
  }
}
```

| 字段    | 类型                                        | 说明                                                         | 必填项 |
| ------- | ------------------------------------------- | ------------------------------------------------------------ | ------ |
| primary | String                                      | 主键字段名称                                                 | 是     |
| layout  | \[key:String\]:Any                          | 页面布局可选配置项，每个页面不同，在具体页面中定义。         | 是     |
| actions | \[key:String\]:\[key:String\]:Object Render | 页面可用功能呈现方式映射表，每个页面不同，在具体页面中定义。 | 否     |
| option  | \[key:String\]:Any                          | 页面配置信息，根据需要自由定义。API Setting 原样返回。       | 否     |

### 5. 完整示例

完整示例保存在 examples 目录

```json
{
  "name": "云服务库",
  "version": "1.0.0",
  "decription": "可信云云服务库",
  "bind": {
    "model": "service",
    "withs": {
      "manu": {
        "query": {
          "select": ["id", "name", "short_name", "status"]
        }
      },
      "kind": {
        "query": {
          "select": ["id", "name"]
        }
      }
    }
  },
  "apis": {
    "search": {
      "process": "models.service.Paginate",
      "default": [
        {
          "withs": {
            "manu": {
              "query": {
                "select": ["id", "name", "short_name", "status"]
              }
            },
            "kind": {
              "query": {
                "select": ["id", "name"]
              }
            }
          },
          "wheres": [{ "column": "status", "value": "enabled" }]
        },
        null,
        15
      ]
    },
    "find": {
      "process": "models.service.Find",
      "default": [
        null,
        {
          "withs": {
            "manu": {
              "query": {
                "select": ["id", "name", "short_name", "status"]
              }
            },
            "kind": {
              "query": {
                "select": ["id", "name"]
              }
            }
          }
        }
      ]
    }
  },
  "columns": {
    "服务名称": {
      "label": "服务名称",
      "view": {
        "type": "label",
        "props": {
          "value": ":name"
        }
      },
      "edit": {
        "type": "input",
        "props": {
          "value": ":name"
        }
      }
    },
    "所属厂商": {
      "label": "所属厂商",
      "view": {
        "name": "label",
        "props": {
          "value": ":manu.short_name"
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":manu.id",
          "searchable": true,
          "remote": {
            "api": "/api/manu/get",
            "query": {
              "select": ["id", "name"],
              "keyword": "where_name_like"
            }
          }
        }
      }
    },
    "服务类型": {
      "label": "服务类型",
      "view": {
        "name": "label",
        "props": {
          "value": ":kind.name"
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":kind.id",
          "tree": true,
          "searchable": true,
          "remote": {
            "api": "/api/kind/tree",
            "query": {
              "select": ["id", "name"],
              "keyword": "where_name_like"
            }
          }
        }
      }
    },
    "服务领域": {
      "label": "服务领域",
      "view": {
        "name": "tags",
        "props": {
          "value": ":fields"
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":fields",
          "searchable": true,
          "inputable": true,
          "multiple": true,
          "options": [
            { "label": "视频会议", "value": "视频会议" },
            { "label": "即时通信", "value": "即时通信" },
            { "label": "客服管理", "value": "客服管理" },
            { "label": "财务管理", "value": "财务管理" },
            { "label": "客户关系管理", "value": "客户关系管理" },
            { "label": "营销管理", "value": "营销管理" },
            { "label": "办公自动化", "value": "办公自动化" },
            { "label": "ERP", "value": "ERP" },
            { "label": "人力", "value": "人力" },
            { "label": "采购", "value": "采购" },
            { "label": "供应链", "value": "供应链" },
            { "label": "企业网盘", "value": "企业网盘" },
            { "label": "邮件服务", "value": "邮件服务" },
            { "label": "电子合同", "value": "电子合同" },
            { "label": "安全工具", "value": "安全工具" },
            { "label": "舆情分析", "value": "舆情分析" },
            { "label": "行业应用", "value": "行业应用" },
            { "label": "其他", "value": "其他" }
          ]
        }
      }
    },
    "计费方式": {
      "label": "计费方式",
      "view": {
        "name": "tags",
        "props": {
          "value": ":fields"
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":price_options",
          "multiple": true,
          "options": [
            { "label": "按年订阅", "value": "按年订阅" },
            { "label": "按月订阅", "value": "按月订阅" },
            { "label": "按量计费", "value": "按量计费" },
            { "label": "私有化部署", "value": "私有化部署" },
            { "label": "其他", "value": "其他" }
          ]
        }
      }
    },
    "行业覆盖": {
      "label": "行业覆盖",
      "view": {
        "name": "tags",
        "props": {
          "value": ":industries"
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":industries",
          "inputable": true,
          "multiple": true,
          "options": [
            { "label": "房地产", "value": "房地产" },
            { "label": "旅游", "value": "旅游" },
            { "label": "教育", "value": "教育" },
            { "label": "互联网", "value": "互联网" },
            { "label": "其他", "value": "其他" }
          ]
        }
      }
    },
    "状态": {
      "label": "状态",
      "view": {
        "name": "tags",
        "props": {
          "value": ":status",
          "options": [
            { "label": "开启", "value": "enabled", "color": "primary" },
            { "label": "关闭", "value": "disabled", "color": "danger" }
          ]
        }
      },
      "edit": {
        "type": "select",
        "props": {
          "value": ":status",
          "options": [
            { "label": "开启", "value": "enabled" },
            { "label": "关闭", "value": "disabled" }
          ]
        }
      }
    },
    "创建时间": {
      "label": "创建时间",
      "view": {
        "name": "label",
        "props": {
          "value": ":created_at",
          "datetime-format": "YYYY年MM月DD日 @hh:mm:ss"
        }
      }
    },
    "更新时间": {
      "label": "更新时间",
      "view": {
        "name": "label",
        "props": {
          "value": ":update_at",
          "datetime-format": "YYYY年MM月DD日 @hh:mm:ss"
        }
      }
    },
    "查询排序": {
      "label": "查询排序",
      "view": {
        "type": "label",
        "props": {
          "value": ":rank"
        }
      },
      "edit": {
        "type": "input",
        "props": {
          "value": ":rank",
          "type": "number"
        }
      }
    }
  },
  "filters": {
    "关键词": {
      "label": "关键词",
      "bind": "where.name.like",
      "input": {
        "type": "input",
        "props": {
          "placeholder": "请输入关键词"
        }
      }
    },
    "所属厂商": {
      "label": "厂商",
      "bind": "where.manu_id.in",
      "input": {
        "type": "select",
        "props": {
          "searchable": true,
          "multiple": true,
          "placeholder": "请选择所属厂商",
          "remote": {
            "api": "/api/manu/get",
            "query": {
              "select": ["id", "name"],
              "keyword": "where_name_like"
            }
          }
        }
      }
    },
    "服务类型": {
      "label": "类型",
      "bind": "where.kind_id.in",
      "input": {
        "type": "select",
        "props": {
          "tree": true,
          "searchable": true,
          "multiple": true,
          "placeholder": "请选择所属类型",
          "remote": {
            "api": "/api/kind/tree",
            "query": {
              "select": ["id", "name"],
              "keyword": "where_name_like"
            }
          }
        }
      }
    }
  },
  "list": {
    "primary": "id",
    "layout": {
      "columns": [
        { "name": "服务名称", "width": 6 },
        { "name": "所属厂商", "width": 6 },
        { "name": "服务类型", "width": 4 },
        { "name": "状态", "width": 4 },
        { "name": "服务领域", "width": 4 },
        { "name": "计费方式", "width": 4 },
        { "name": "创建时间", "width": 6 },
        { "name": "更新时间", "width": 6 }
      ],
      "filters": [
        { "name": "关键词", "width": 6 },
        { "name": "所属厂商", "width": 6 },
        { "name": "服务类型", "width": 4 }
      ]
    },
    "actions": {
      "create": {
        "type": "button",
        "props": {
          "label": "新建服务",
          "icon": "fas fa-plus"
        }
      },
      "view": {},
      "edit": {},
      "import": {},
      "update": {},
      "delete": {},
      "insert": {},
      "updateWhere": {},
      "deleteWhere": {},
      "updateSelect": {},
      "deleteSelect": {},
      "pagination": ["pages", "prev", "next"],
      "setting": {}
    }
  },
  "edit": {
    "primary": "id",
    "layout": {
      "fieldset": [
        {
          "title": "基础信息",
          "description": "",
          "columns": [
            { "name": "服务名称", "width": 6 },
            { "name": "所属厂商", "width": 6 },
            { "name": "服务类型", "width": 6 },
            { "name": "状态", "width": 6 },
            { "name": "rank", "width": 6 }
          ]
        },
        {
          "title": "数据标签",
          "description": "",
          "columns": ["服务领域", "计费方式", "行业覆盖"]
        }
      ]
    },
    "actions": {
      "cancel": {},
      "save": {
        "type": "button",
        "props": {
          "label": "保存"
        }
      },
      "delete": {}
    }
  },
  "insert": {},
  "view": {}
}
```

## xgen 可用命令列表

通用命令

- Common.openModal 打开一个弹出对话框
- Common.closeModal 关闭对话框
- Common.historyPush 跳转地址
- Common.historyBack 返回
- Common.confirm 弹出确认
- Common.refetch 重新读取
- Common.reload 重加载
- Common.reloadMenu 重新加载菜单配置
- Common.showMessage 显示信息
- Common.emitEvent 触发其它事件

调用页面

- Table.search 调用某一个表搜索页面
- Table.save 保存数据
- Table.delete 删除一条数据

调用表单页面

- Form.find 调用某个表单，显示数据
- Form.submit 表单提交数据
- Form.delete 表单删除数据
- Form.fullscreen 全屏显示

直接调用后端命令

- Service. 调用后端 service 命令
- Studio. 调用后端 studio 命令

### Common.openModal

```json
{
  "action": [
    {
      "payload": {
        "Form": {
          "model": "so",
          "type": "edit",
          "data": {
            "pet_name": "{{name}}",
            "total_amount": "{{cost}}"
          }
        }
      },
      "name": "Submit",
      "type": "Common.openModal"
    }
  ],
  "title": "参考创建销售订单",
  "icon": "icon-plus-circle"
}
```

### Common.closeModal

关闭当前打开的对话框

```json
{
  "name": "closeModal",
  "type": "Common.closeModal"
}
```

### Common.confirm

```json
{
  "name": "Confirm",
  "type": "Common.confirm",
  "payload": {
    "title": "确认删除",
    "content": "删除后不可撤销！"
  }
}
```

### Form.delete

```json
{
  "name": "Delete",
  "payload": {
    "model": "<MODEL_ID>"
  },
  "type": "Form.delete"
}
```

### Form.submit

提交当前表单数据

```json
{
  "name": "Submit",
  "type": "Form.submit",
  "payload": {}
}
```

### Form.delete

删除当前表单数据

```json
{
  "name": "Delete",
  "type": "Form.delete"
}
```

### Form.find

刷新当前表单数据

```json
{
  "name": "Find",
  "type": "Form.find"
}
```

### Form.fullscreen

全屏显示当前表单

```json
{
  "name": "fullscreen",
  "type": "Form.fullscreen"
}
```

### Common.showMessage

显示消息，类型可以是 'success' 'warning' 'error'

```json
{
  "name": "message",
  "type": "Common.showMessage",
  "payload": {
    "type": "success",
    "content": "刷新成功"
  }
}
```

### Common.emitEvent

调用 xgen 框架中注册的事件

其中 key 需要使用到命名空间，命名空间的作用是保证控件能唯一定位到事件，防止错误调用事件。

#### Neo

比如事件注册示例：`window.$app.Event.on('app/getContext', getContext)`。

- app/getContext,给 neo 组手设置当前命令上下文

当 xgen 界面发生切换时，自动的调用，比如打开不同的 form/table 界面，把当前的 table 或是 form 信息传递给 neo 助手。

```ts
const [context, setContext] = useState<App.Context>({
  namespace: '',
  primary: '',
  data_item: {}
});
```

- app/getField,设置 neo 设置当前控件绑定字段信息

在使用 ai 智能表单时，会自动的触发这个事件，目的是把 ai 表单相关的信息，比如绑定的是哪一个控件，控件的相关配置传到后端。

```ts
const [field, setField] = useState<App.Field>({
  name: '',
  bind: '',
  config: {} as Common.FieldDetail
});
```

- app/setNeoVisible,调用 neo 聊天窗口或是隐藏聊天窗口，传入聊天占位符与 signal。

通常在 xgen 前端的 form 或是 table action 中调用。

```ts
const setNeoVisible = useMemoizedFn((v) => {
  if (v) {
    setVisible(v.visible);
    //
    setChatContext({ placeholder: v.placeholder, signal: v.signal });
  } else {
    setVisible(true);
  }
});
```

使用示例：给 neo 助手设置不同的上下文，赋予不同的角色。同时还需要后端的 neo prepare 处理器进行配合。

```json
{
  "actions": [
    {
      "action": [
        {
          "name": "数字化身",
          "type": "Common.emitEvent",
          "payload": {
            "key": "app/setNeoVisible",
            "value": {
              "visible": true,
              "placeholder": "我是{{name}}的数字分身，你可以向我提问",
              "signal": {
                "name": "AskExpert",
                "id": "{{id}}",
                "expert": "{{name}}"
              }
            }
          }
        }
      ],
      "icon": "icon-at-sign",
      "showWhenAdd": false,
      "hideWhenEdit": true,
      "showWhenView": true,
      "title": "数字化身"
    },
    {
      "action": [
        {
          "name": "智能输入",
          "type": "Common.emitEvent",
          "payload": {
            "key": "app/setNeoVisible",
            "value": {
              "visible": true,
              "placeholder": "输入专家的关键信息, 我会帮你自动填写",
              "signal": { "name": "AutoInput", "id": "{{id}}" }
            }
          }
        }
      ],
      "icon": "icon-send",
      "showWhenAdd": true,
      "showWhenView": false,
      "title": "智能输入"
    }
  ]
}
```

#### app

- app/getAppInfo,用户登录后自动调用事件，从后端获取应用的基础信息。
- app/getUserMenu,重新加载用户菜单，由 action Common.reloadMenu 调用，也可以直接调用。
- app/updateMenuStatus,更新当前菜单的状态，当路由切换时自动调用。

#### Chart/Dashboard

命名空间规则： `Dashboard-${parent}-${model}`

- ${namespace}/search
- ${namespace}/refetch

#### Form

Form 的命名空间规则是`Form-${parent}-${model}`,比如`/forms/export.form.yao`对应的命名空间`Form-Page-expert`,父级是 Page 对象。

- ${namespace}/fullscreen
- ${namespace}/find
- ${namespace}/save
- ${namespace}/delete
- ${namespace}/back
- ${namespace}/refetch
- ${namespace}/submit
- ${namespace}/setFieldsValue，动态的给表单设置字段值
- ${namespace}/${item.bind}/unloading 取消当前加载状态，`item.bind`是 form 中的控件，实际是上调用 ai 控件的加载状态，需要配置 ai 智能表单进行使用。

- ${namespace}/form/actions/done

#### Table

Table 的命名空间规则是`Table-${parent}-${model}`,比如`/forms/export.form.yao`对应的命名空间`Table-Page-expert`,父级是 Page 对象。

也有可能是:

- `Table-Model-expert`,在弹出对话框中
- `Table-Dashboard-expert`,在 Dashboard 中
- `Table-Form-expert`,在表单中

- ${namespace}/search
- ${namespace}/save
- ${namespace}/delete
- ${namespace}/batchDelete
- ${namespace}/batchUpdate
- ${namespace}/refetch

#### Step

- ${namespace}/save

#### Modes

- global.stack.pop
- global.stack.remove

基础使用,在 payload 中传目标事件的 key 与 value。

```json
{
  "name": "数字化身",
  "type": "Common.emitEvent",
  "payload": {
    "key": "app/setNeoVisible", //event key
    "value": {} //event parameters
  }
}
```

示例：调用 Neo

signal 会作为 neo 请求 context 的一部分传到后端。

```json
{
  "name": "数字化身",
  "type": "Common.emitEvent",
  "payload": {
    "key": "app/setNeoVisible",
    "value": {
      "visible": true,
      "placeholder": "我是{{name}}的数字分身，你可以向我提问",
      "signal": {
        "name": "AskExpert",
        "id": "{{id}}",
        "expert": "{{name}}"
      }
    }
  }
}
```

对应的 neo 预处理处理器。

```ts
function Prepare(context: ChatContext, messages: ChatMessage[]): ChatMessage[] {
  const { namespace, signal, field } = context;
  if (namespace === 'Form-Page-expert' && field?.bind === 'description') {
    return autoDescribe(context, messages);
  }

  switch (signal?.name) {
    case 'AskExpert':
      return askExpert(context, messages);

    case 'DocumentQuestion':
      return DocumentQuestion(context, messages);

    case 'AutoInput':
      return autoInput(context, messages);
  }
}
```

neo context 的定义

```js
{
    namespace: context.namespace,//命名空间
    stack,
    pathname,
    formdata: context.data_item,
    field: { name: v.name, bind: v.bind },//字段信息
    config: v.config,
    signal: chat_context.signal//用户输入的任何对象
}
```

### Servcie

在 action 中调用 service 函数

```json
{
  "action": [
    {
      "name": "CreatePse",
      "payload": {
        "args": ["{{id}}"], //使用{{}}的语法传入参数
        "method": "create"
      },
      "type": "Service.pse" //类型为service，pse对应services/pse.js文件
    },
    {
      "name": "message",
      "type": "Common.refetch", //重新加载内容
      "payload": {}
    },
    {
      "name": "message",
      "type": "Common.showMessage",
      "payload": {
        "type": "[[$CreatePse.create_pse.result]]", //使用[[$name]]引用前面的action返回结果
        "content": "[[$CreatePse.create_pse.result]]"
      }
    }
  ],
  "icon": "icon-arrow-left",
  "showWhenAdd": true,
  "title": "创建pse文件"
}
```

js 文件`services/pse.js`

```js
function create(id) {
  return Process('flows.sapsso.pse', id);
}
```

### Common.historyPush

historyPush 的 payload 参数定义如下：

```ts
interface HistoryPush {
  pathname: string; //需要跳转的地址
  search?: any; //类型为对象，搜索参数，即是query参数
  public?: boolean; //是否公共网址，默认是在spa hash地址
  refetch?: boolean; //刷新页面
  withFilterQuery?: boolean; //是否使用筛选查询参数,只对列表界面的filter中的action生效，查询参数会接收筛选器的参数值
}
```

```json
{
  "action": [
    {
      "name": "exportCrt",
      "payload": {
        "pathname": "/api/sapsso/exportcrt.crt",
        "public": true,
        "search": {
          "id": "{{id}}"
        }
      },
      "type": "Common.historyPush"
    }
  ],
  "showWhenAdd": true,
  "title": "导出crt文件"
}
```

## Xgen 多语言支持

### 多语言配置使用

语言包分全局语言包与特定类型`DSL`语言包。两种语言包的功能一样，但是作用域不一样。
全局语言包在目录应用`langs`目录。特定类型的`DSL`语言包在语言包对应语言目录的子目录下

示例：

- `/data/app/langs/zh-cn/global.yml` 全局语言包文件
- `/data/app/langs/zh-cn/models/pet.mod.yml` Model pet 语言包
- `/data/app/langs/zh-cn/models/user/pet.mod.yml` Model user.pet 语言包
- `/data/app/langs/zh-cn/tables/pet.mod.yml` Table pet 语言包

语言包的作用主要是用于`xgen`框架，当然也可以使用`api`函数进行调用，读取相关的界面配置。相关的处理器有`（yao.table.Setting/yao.form.Setting）`

### 源代码分析：

如果`DSL`配置文件里的配置有包含`$L()`的表达式时，说明配置对象是一个需要翻译的文本对象。在输出到界面之前，程序会针对这类对象进行多语言翻译。

可以修改环境变量`YAO_LANG`变换多语言翻译项目，可选项有`en-us/zh-cn/zh-hk`
如果处理器中包含语言设置时，会覆盖默认值。

- `yao/widgets/form/action.go`，在 json 中配置的前缀会转换成$L()表达式
- `yao/i18n/i18n.go`
- `gou/lang/lang.go` 处理多语言的过程
- `yao/fields/model.trans.json` 在模型定义文件中有较多的使用场景

### 在`js`函数里可以直接使用`$L()`函数处理多语言描述

```js
function Bar(...args) {
  return {
    message: $L('Another yao application') + ' (Cloud Function: foo.Bar)',
    args: args
  };
}
```

### 在`json`配置文件中使用多语言

如果在`DSL`配置文件中需要翻译文本，在文本内容前面加上前缀::
适用范围是`api`文件，`model`文件，`table`文件，`form`文件，`app.json`文件

```json
{
  "name": "::Pet",
  "table": { "name": "pet", "comment": "$L(Pet) Table" },
  "columns": [
    { "name": "id", "comment": "ID", "type": "ID" },
    {
      "name": "name",
      "comment": "::Pet Name",
      "type": "string",
      "length": 80,
      "index": true,
      "nullable": true
    }
  ]
}
```

## 使用富文本控件

**需要使用 0.10.3 版本的 Yao 程序**

首先需要配置字段的编辑属性，把`type`设置成`RichText`

```json
{
  "描述2": {
    "bind": "desc",
    "edit": {
      "type": "RichText",
      "props": {
        "UploadByFileApi": "/api/file/UploadByFileApi",
        "UploadByUrlApi": "/api/file/UploadByUrlApi"
      }
    }
  }
}
```

如果需要设置上传图片，还需要定义三个 Api。

- 一个是用来在编辑器里选择图片用的。
- 另外一个是当你粘贴图片时，会自动的上传图片用的。
- 最后一个是下载图片用的。

在`apis`目录下创建一个`api`定义文件

文件：`/apis/file.http.json`

```json
{
  "name": "文件上传",
  "version": "1.0.0",
  "description": "文件上传",
  "guard": "-",
  "group": "",
  "paths": [
    {
      "path": "/UploadByFileApi",
      "method": "POST",
      "process": "flows.image",
      "in": ["$file.image"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/UploadByUrlApi",
      "method": "POST",
      "process": "flows.image2",
      "in": ["$payload.url"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/downloadfile",
      "method": "GET",
      "process": "fs.system.Download",
      "in": ["$query.name"],
      "out": {
        "status": 200,
        "Headers": {
          "Content-Type": "{{type}}"
        },
        "body": "{{content}}"
      }
    }
  ]
}
```

为了上传处理图片，还需要定义两个流程处理器`flows.image`,`flows.image2`。

`flows.image`的功能是上传本地电脑上的图片，并返回文件地址

文件：`/flows/image.flow.json`

```json
{
  "label": "upload file",
  "version": "1.0.0",
  "description": "upload image file",
  "nodes": [
    {
      "name": "upload",
      "process": "fs.system.upload",
      "script": "format",
      "args": ["{{$in.0}}"]
    }
  ],
  "output": {
    "success": 1,
    "file": {
      "url": "{{$res.upload}}"
    }
  }
}
```

还需要一个脚本返回上传的文件下载地址：

文件：`/flows/image.format.js`

```js
function main(args, out, res) {
  return `/api/file/downloadfile?name=${out}`;
}
```

复制粘贴图片时调用的`image2.flow.json`。这里直接返回了`url`地址。

注意只支持复制粘贴互联网的图片地址，要是本地图片，需要自己手动上传图片。

`/flows/image2.flow.json`

```json
{
  "label": "upload file",
  "version": "1.0.0",
  "description": "upload image file",
  "nodes": [],
  "output": {
    "success": 1,
    "file": {
      "url": "{{$in.0}}"
    }
  }
}
```

#### 富文本控件生成的内容转换成 HTML

`Yao`富文本控件`RichText`内部封装了[`editorjs`](https://github.com/editor-js)。控件保存的内容的格式是`Json`数组，数组中每一行数据都是一个对象，对象在单独的类型与内容。

如果我们的需求是把`edjtorjs`控件生成的内容转换成`html`格式内容，有一个现成的组件能帮我们实现。插件的源代码地址：
https://github.com/pavittarx/editorjs-html

插件的功能逻辑比较简单，主要是循环查找`json`数组中的`block`对象，再根据规则替换成文本。对源代码作下简单的处理，转换成`Yao`处理器。

<!-- 处理器源代码如下：![](../docs/YaoDSL/Xgen/Xgen控件/RichText富文本控件/EdJsParser.js) -->

## Switch 控件

### 问题

比如，在模型中有字段的配置如下,你会发现，如果使用提`mysql`数据库，这个控件是无法使用的。

```json
{
  "name": "online",
  "label": "是否在线",
  "type": "boolean",
  "default": false,
  "index": true
}
```

### WHY

- 在使用`sqlite3`作为数据库时，`Switch`控件的值需要设置成`true/false`。

> sqlite 作为数据库时，`golang`中的`sqlite3`驱动会自动作数据转换。数据库表的字段数据类型是`boolean`,在数据库表里保存的数据是`0`或`1`。更新数据时在 `sql`语句中却需要使用 `true`,与 `false` 来更新数据。而数据从数据库中读取出来后会自动转换成 `true` 与 `false`.

- 在使用 mysql 作为数据库时，`Switch`控件的值需要设置成`1/0`。

> 在使用 `mysql` 作为数据库源时，`model` 中字段为 `boolean` 类型的字段生成的 `mysql` 数据库字段类型是 `tinyint(1)`。数据的保存与读取不会自动的转换，`0/1`。

`Switch`控件默认的值是`false`或`true`。

如果在`tab.json`中定义字段中使用默认的字段绑定显示设置，即是在`fields.table`中不显式的定义控件属性，这时框架会自动生成字段定义，这个生成的定义只适用于 `sqlite3` 数据库。如果切换成 `mysql` 的数据后，显示就会异常。差不多也算是一个 bug。

### 解决方法

解决方法是，如果是使用的`mysql`数据库，在`fields.table`中替换显式的定义控件属性，`checkedValue=1`，`unCheckedValue=0`

使用 MYSQL 数据库时的配置：

```json
{
  "是否在线": {
    "bind": "online",
    "view": {
      "type": "Switch",
      "props": {
        "checkedChildren": "是",
        "checkedValue": 1,
        "unCheckedChildren": "否",
        "unCheckedValue": 0
      }
    }
  }
}
```

使用`SQLITE`数据库时的配置：

```json
{
  "是否在线": {
    "bind": "online",
    "view": {
      "type": "Switch",
      "props": {
        "checkedChildren": "是",
        "checkedValue": true,
        "unCheckedChildren": "否",
        "unCheckedValue": false
      }
    }
  }
}
```

## xgen 组件 Upload 在 List 下视频样式错乱-by AbbetWang

当我们需要上传文件时，要使用到此组件。

看源码是支持视频的
https://github.com/YaoApp/xgen/blob/a81e91cf95a91bbdaa48050bd2f928849f7d0ce2/packages/xgen/components/edit/Upload/types.ts

```ts
filetype: 'image' | 'file' | 'video';
```

### 主要记录一下在 list 下的问题

目前由于 shadow-root 的原因，List 下的视频上传组件样式会发生错乱
[shadow-root](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)

### 魔法修改方法

修改 xgen 源码，重新打包编译

xgen

[源码位置](https://github.com/YaoApp/xgen/blob/main/packages/xgen/components/base/PureList/components/Styles/common.lsss)

更换成以下样式

```css
:host {
  .xgen-form-item {
    width: 100%;
    margin-bottom: 12px;
  }

  .sortable-ghost {
    opacity: 0;
  }

  .form_item_upload_wrap {
    padding-top: 11px;
    padding-left: 10px;
  }

  .form_item_upload_wrap .xgen-upload-select-picture-card,
  .form_item_upload_wrap .xgen-upload-list-picture-card-container {
    width: 83px;
    height: 83px;
  }

  .video .form_item_upload_wrap .xgen-upload-select-picture-card,
  .video .form_item_upload_wrap .xgen-upload-list-picture-card-container {
    width: 300px;
    height: 160px;
  }

  .video .upload_video_wrap:hover .icon_delete {
    display: flex;
  }

  .video .upload_video_wrap .video {
    width: 100%;
    height: 160px;
    border-radius: 6px;
    object-fit: fill;
  }

  .video .upload_video_wrap .icon_delete {
    right: -1px;
    bottom: -1px;
    z-index: 1;
    display: none;
    width: 27px;
    height: 27px;
    border-top-left-radius: 6px;
    border-bottom-right-radius: 6px;
    background-color: #fff;
    color: #000;
    cursor: pointer;
  }

  .video .upload_video_wrap .icon_delete:hover {
    background-color: var(--color_danger);
  }

  .video .upload_video_wrap .icon_delete:hover .icon {
    color: #fff;
  }

  .video .upload_video_wrap .icon_delete .icon {
    color: var(--color_danger);
    font-size: 15px;
  }

  .xgen-upload.xgen-upload-select-picture-card,
  .xgen-upload-list-picture-card-container {
    margin-right: 11px;
    margin-bottom: 11px;
  }

  .form_item_upload_wrap .btn_upload_wrap {
    display: flex;
    flex-direction: column;
  }

  .form_item_upload_wrap .btn_upload_wrap.file {
    align-items: center;
    flex-direction: row;
  }

  .form_item_upload_wrap .btn_upload_wrap.file.has_data {
    margin-bottom: 12px;
  }

  .form_item_upload_wrap .btn_upload_wrap.file .desc {
    margin-top: 0;
    margin-left: 9px;
  }

  .form_item_upload_wrap .btn_upload_wrap.one_file {
    justify-content: center;
    height: 150px;
  }

  .form_item_upload_wrap .btn_upload_wrap .desc {
    margin-top: 6px;
  }

  .form_item_upload_wrap .xgen-upload-list-picture .xgen-upload-list-item,
  .form_item_upload_wrap .xgen-upload-list-picture-card .xgen-upload-list-item {
    overflow: hidden;
    padding: 0;
    border-color: var(--color_border);
  }

  .form_item_upload_wrap
    .xgen-upload-list-picture-card
    .xgen-upload-list-item-thumbnail {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form_item_upload_wrap
    .xgen-upload-list-picture-card
    .xgen-upload-list-item-thumbnail,
  .form_item_upload_wrap
    .xgen-upload-list-picture-card
    .xgen-upload-list-item-thumbnail
    img {
    opacity: 1;
    object-fit: cover;
  }
}
```

重新打包编译。

## Xgen 登录界面邮件电话校验规则

前端 xgen 登录 Form 有邮箱电话的校验。校验使用 regex 正则

源代码位置：`/xgen-v1.0/packages/xgen/utils/reg/index.ts`

```js
export const reg_email = new RegExp(
  /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
);

export const reg_mobile = new RegExp(/^1[3|4|5|8|9][0-9]\d{4,8}$/);
```

## xgen 自定义远程控件

通过自定义远程控件，可以在一定程序上扩展`xgen`的展现能力。它的原理是使用的`react`的远程加载控件功能。

自定义的远程控件会存在在服务器上，在`table`或是`form`中配置控件类型为`"public/"`,这一类型的控件会在界面初始化时远程加载

### 操作过程

在应用的目录下创建目录`components`，每一个控件单独占用一个子目录，比如创建一个新的控件`Test`,目录结构如下：

```sh
components/Test/index.tsx
components
        Test
            index.tsx
```

在`index.tsx`文件里编写控件的实现逻辑，只要是`react`控件即可

```ts
interface IProps {
  __value: string;
}

const Index = (props: IProps) => {
  const { __value } = props;
  if (!__value) return <span>-</span>;

  return <span style={{ color: 'red' }}>{__value}</span>;
};

export default Index;
```

开发环境准备`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "skipLibCheck": true,
    "lib": ["ESNEXT", "DOM"],
    "moduleResolution": "Node",
    "declaration": true,
    "emitDeclarationOnly": true,
    "strict": true,
    "outDir": "public/components",
    "suppressImplicitAnyIndexErrors": true,
    "baseUrl": ".",
    "esModuleInterop": true,
    "paths": { "@/*": ["./components/*"] },
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "jsx": "react-jsx"
  },
  "include": ["components"]
}
```

`rollup`配置`rollup.common.ts`

需要注意的是这里的配置项

配置中的`input`是指需要打包的文件的路径，所有需要打包的控件都写入`external`,配置的是控件的外部依赖项，在后面还要处理

由于`xgen`中动态引用控件使用的是`systemjs`,所以这里的`rollup`的打包输出格式也使用`systemjs`

```ts
import { defineConfig } from 'rollup';

import { nodeResolve } from '@rollup/plugin-node-resolve';

export const plugins = [nodeResolve()];

export default defineConfig({
  input: ['components/Test/index.tsx', 'components/A/index.ts'],
  output: {
    dir: 'public/components',
    preserveModules: true,
    format: 'systemjs'
  },
  external: ['antd', 'react', 'react-dom', 'react/jsx-runtime'],

  // When using tsyringe, this item needs to be set
  context: 'false'
});
```

`rollup`开发打包配置`rollup.dev.ts`

```ts
import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';

import config, { plugins } from './rollup.common';

export default defineConfig({
  ...config,
  plugins: [...plugins, swc()]
});
```

`rollup`生成打包配置,`rollup.build.ts`
生成生产库，最小化文件

```ts
import { defineConfig } from 'rollup';
import del from 'rollup-plugin-delete';
import { defineRollupSwcMinifyOption, minify, swc } from 'rollup-plugin-swc3';

import config, { plugins } from './rollup.common';

export default defineConfig({
  ...config,
  plugins: [
    ...plugins,
    swc(),
    minify(
      defineRollupSwcMinifyOption({
        compress: { drop_console: false }
      })
    ),
    del({ targets: 'dist/*' })
  ]
});
```

为了让控件能成功编译，还需要在配置文件`package.json`里增加打包操作,注意，这里增加了`antd`控件库的依赖

```json
{
  "name": "xgen-dev-app",
  "version": "1.0.0",
  "description": "",
  "keywords": [],
  "author": "Wendao",
  "license": "Apache-2.0",
  "scripts": {
    "dev": "rollup --config rollup.dev.ts --configPlugin swc3 -w",
    "build": "rollup --config rollup.build.ts --configPlugin swc3"
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.0.1",
    "@swc/core": "^1.3.23",
    "@types/react": "^18.0.26",
    "@types/react-dom": "^18.0.9",
    "rollup": "^3.7.5",
    "rollup-plugin-delete": "^2.0.0",
    "rollup-plugin-swc3": "^0.8.0"
  },
  "dependencies": {
    "antd": "4.24.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### 远程控件的原理

`xgen`在加载控件时会判断控件名称是否以`"public/"`为前缀，如果是的话，会作为远程控件加载。

控件的动态加载,`packages/xgen/components/x/index.tsx`

```ts
import { message } from 'antd';
import { lazy, Suspense, useMemo } from 'react';

import type { Global } from '@/types';

type ComponentsType = 'base' | 'edit' | 'view' | 'chart' | 'group' | 'optional';

interface IProps {
  type: ComponentsType;
  name: string;
  props: Global.AnyObject;
}

const Index = ({ type, name, props }: IProps) => {
  const Component = useMemo(() => {
    if (name.startsWith('public/')) {
      const { origin } = window.location;
      const component_name = name.replace('public/', '');

      return lazy(() =>
        // @ts-ignore
        System.import(`${origin}/components/${component_name}/index.js`).catch(
          () => {
            message.error(
              `Component is not exist, type:'${type}' name:'${name}'`,
            );
          },
        ),
      );
    }

    return lazy(() =>
      import(`@/components/${type}/${name}`).catch(() => {
        message.error(`Component is not exist, type:'${type}' name:'${name}'`);
      }),
    );
  }, [type, name]);

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  );
};

export default window.$app.memo(Index);
```

由于增加了`antd`控件库，还需要修改`xgen`的另外一个地方,要不然会提示错误，如果引用了其它库，也需要在这里作映射。

```ts
//packages/xgen/utils/preset/system_modules.ts
import React from 'react';
import ReactDom from 'react-dom';
import ReactDomClient from 'react-dom/client';
import JsxRuntime from 'react/jsx-runtime';
import * as antd from 'antd'; //为了方便导入所有的控件

System.set('app:react', { default: React, __useDefault: true });
System.set('app:react/jsx-runtime', { ...JsxRuntime });
System.set('app:react-dom', { default: ReactDom, __useDefault: true });
System.set('app:react-dom/client', {
  default: ReactDomClient,
  __useDefault: true
});

System.set('app:antd', { ...antd }); //注册所有的antd控件

System.addImportMap({
  imports: {
    react: 'app:react',
    'react/jsx-runtime': 'app:react/jsx-runtime',
    'react-dom': 'app:react-dom',
    'react-dom/client': 'app:react-dom/client',
    antd: 'app:antd' //增加antd外部依赖的映射,只有这样，生成的远程控件才能找到对应的控件
  }
});
```

这里为了方便，把`antd`所有的控件都注入框架。如果需要考虑性能问题，需要单独注入组件库。

### 演示项目

[yao-chatgpt](https://github.com/wwsheng009/yao-chatgpt/tree/main/components)

## 使用 Hook 转换日期控件的值

界面上的日期控件的格式是"YYYY-MM-DD hh:mm:ss"，即使是只选当前日期，也会把当前的时间带入后台。

如果数据库字段的值是只有日期"YYYY-MM-DD"或是时间为"YYYY-MM-DD 00:00:00"时，关联搜索会失败。

使用`Hook`可以处理这个问题

```js
/**
 * 搜索 Hook, 处理日期条件
 */
function BeforeSearch(query, page, pagesize) {
  //   console.log("old search:", query.wheres);
  query = query || {};
  wheres = query.wheres || [];
  for (const i in wheres) {
    const where = wheres[i] || {};
    if (where.column == 'day' && where.value) {
      // url的查询
      where.value = where.value.replaceAll('"', '');
      const value = new Date(where.value).toISOString().split('T')[0];
      query.wheres[i].value = `${value} 00:00:00`;
    }
  }
  return [query, page, pagesize];
}
```

## 图片控件配置

### `model`字段设置

在相关的`model`中设置字段类型为`json`，

```json
{
  "label": "照片",
  "name": "photo",
  "type": "json",
  "nullable": true
}
```

### 图片显示与编辑

在`table/form`定义中设置图片相关的控件属性。

注意:在`form`里，需要同时设置`view/edit`属性

```json
{
  "图片": {
    "bind": "images",
    "edit": {
      "type": "Upload",
      "compute": "Upload",
      "props": {
        "filetype": "image",
        "$api": {
          "process": "fs.system.Upload"
        }
      }
    },
    "view": {
      "type": "Image",
      "compute": "Download",
      "props": {
        "style": {
          "width": 36,
          "height": 36,
          "borderRadius": "50%"
        }
      }
    }
  }
}
```

## select 控件动态搜索

这里有一个![](..%5Cdocs%5C源代码%5CXgen%5Cxgen%20remoteSearch.md)。

xpath:`edit.props.xProps.$search`,

```json
{
  "上级类目": {
    "bind": "parent_id",
    "edit": {
      "type": "Select",
      "props": {
        "xProps": {
          "$search": {
            "process": "scripts.category.Search",
            "query": {
              "key": "id",
              "id": "{{id}}"
            }
          }
        }
      }
    }
  }
}
```

## 文件上传

控件绑定的字段对应的模型的字段类型需要是`json`

文件上传的控件类型是`Upload`,文件类型`filetype`支持三种:`video`,`image`,`file`

```json
{
  "下载地址": {
    "view": {
      "type": "A",
      "compute": "Download",
      "props": {}
    },
    "edit": {
      "type": "Upload",
      "compute": "Upload",
      "props": {
        "filetype": "file",
        "$api": {
          "process": "fs.system.Upload"
        }
      }
    },
    "bind": "url"
  }
}
```

## 禁用编辑类的控件

在某些场景下，编辑类的控件需要设置成只读取状态,设置控件的属性`disabled:true`

```json
{
  "实际数量": {
    "bind": "amount",
    "edit": {
      "props": {
        "placeholder": "请输入 实际数量",
        "disabled": true
      },
      "type": "InputNumber"
    },
    "view": { "props": {}, "type": "Text" }
  }
}
```

## 菜单配置

`0.10.3`版本`Xgen`管理页面上的菜单`DSL`结构如下:

```json
{
  "items": [
    {
      "icon": "icon-gitlab",
      "id": 1,
      "name": "英雄管理",
      "path": "/x/Table/hero",
      "badge": 6,
      "children": [
        {
          "id": 10001,
          "name": "自由页面",
          "path": "/x/Dashboard/test",
          "badge": 16
        }
      ]
    }
  ],
  "setting": [
    {
      "icon": "icon-book",
      "id": 1,
      "name": "通讯录",
      "path": "/x/Table/book",
      "badge": 100,
      "children": [
        {
          "id": 10002,
          "name": "通讯录",
          "path": "/x/Table/book"
        }
      ]
    }
  ]
}
```

菜单可以设置嵌套显示，子菜单项配置在菜单项目的`children`属性上。

```json
{
  "icon": "icon-gitlab",
  "id": 1,
  "name": "英雄管理",
  "path": "/x/Table/hero",
  "badge": 6,
  "children": [
    {
      "id": 10001,
      "name": "自由页面",
      "path": "/x/Dashboard/test",
      "icon": "icon-gitlab",
      "badge": 16
    }
  ]
}
```

### 菜单上显示未读数据

配置菜单项目的`badge`属性。适用于主菜单与子菜单，在主菜单上，如果数量超过 100，会显示 99+。
有主菜单上显示红色，在子菜单上显示灰色。

```json
{
  "items": [
    {
      "icon": "icon-gitlab",
      "id": 1,
      "name": "英雄管理",
      "path": "/x/Table/hero",
      "badge": 6,
      "children": [
        {
          "id": 10001,
          "name": "自由页面",
          "path": "/x/Dashboard/test",
          "icon": "icon-gitlab",
          "badge": 16
        }
      ]
    }
  ]
}
```

### 在菜单上显示未读提示

配置主菜单项目的`dot`属性为`true`,在图标的右上角显示一个小红点。

```json
{
  "icon": "icon-airplay",
  "id": 3,
  "name": "airplay",
  "path": "/x/Form/hero/0/edit",
  "dot": true
}
```

### 使用图标

如果不想使用图标也可以在`icon`字段写上文本

#### `feather icon`

`feather icon` 以`icon-`作为前缀。示例：

- icon-star

图标查找的网址：<https://feathericons.com/>

#### material design icon

图标支持以`-filled`/`-filled`样式作为后缀,示例：

- `star-filled`
- `star-outline`

图标查找地址：<https://fonts.google.com/icons?icon.set=Material+Icons。>

## 显示视频

xgen 视频的显示存在 bug: https://github.com/YaoApp/yao/issues/371

修正处理

```js
// /xgen-v1.0/packages/xgen/knife/yao/getFileSrc.ts

import getToken from './getToken';

const Index = (name: string) => {
  //这里加个判断，因为在上传视频其间这个name是一个对象，而不是字符串
  if (typeof name !== 'string') {
    return;
  }
  if (name.startsWith('http')) return name;

  return `${name}&token=${getToken()}`;
};

export default Index;
```

### 模型配置

模型字段配置类型为 json

```json
{
  "label": "video",
  "type": "json",
  "nullable": true,
  "name": "video"
}
```

### 列表配置

配置字段的 edit 属性 `"filetype": "video"`

```json
{
  "video": {
    "view": {
      "props": {},
      "type": "Image",
      "compute": "Download"
    },
    "edit": {
      "type": "Upload",
      "compute": "Upload",
      "props": {
        "maxCount": 100,
        "filetype": "video",
        "$api": {
          "process": "fs.system.Upload"
        }
      }
    },
    "bind": "video"
  }
}
```

### 表单配置

表单的字段一定要配置 view 属性，并加上`"compute": "Download"`,才能正确的获取视频的下载地址

```json
{
  "video": {
    "view": {
      "props": {},
      "type": "Image",
      "compute": "Download"
    },
    "edit": {
      "props": {
        "maxCount": 100,
        "filetype": "video",
        "$api": {
          "process": "fs.system.Upload"
        }
      },
      "type": "Upload",
      "compute": "Upload"
    },
    "bind": "video"
  }
}
```

## 设置控件的必输，使用编辑控件的配置属性`itemProps`

```json
{
  "名称": {
    "bind": "name",
    "edit": {
      "props": {
        "itemProps": {
          "rules": [{ "required": true }]
        },
        "placeholder": "请输入 名称"
      },
      "type": "Input"
    },
    "view": {
      "type": "Text"
    }
  }
}
```

## 远程 select 控件

`Tag`,`Select`,`AutoComplete`控件可以使用固定的 options 选项，也可以使用数据库表中的数据作为选项。

- `props.xProps`表示这是一个云属性，后端定义，前端调用,默认配置可以省略。
- `props.xProps.$remote`表示这是云属性中的一个远程`api`定义,比如 select 控件，需要定义`$remote`属性。
- `props.xProps.$remote.query`会转换成前端`xgen`框架的`url`查询参数，可以使用`{{id}}`变量绑定语法

```json
{
  "类目": {
    "bind": "category_id",
    "view": {
      "type": "Tag",
      "props": {
        "xProps": {
          "$remote": {
            "process": "yao.component.SelectOptions"
          }
        },
        "query": {
          "from": "material.category",
          "labelField": "name",
          "valueField": "id"
        }
      }
    },
    "edit": {
      "type": "Select",
      "props": {
        "placeholder": "请输入 类目",
        "xProps": {
          "$remote": {
            "process": "yao.component.SelectOptions"
          }
        },
        "query": {
          "from": "material.category",
          "labelField": "name",
          "valueField": "id"
        }
      }
    }
  }
}
```

可以加上查询条件,`wheres`可以是一个数组，也可以是一个对象。

```json
{
  "类目": {
    "edit": {
      "type": "Select",
      "props": {
        "placeholder": "请输入 类目",
        "xProps": {
          //默认配置可以省略
          "$remote": {
            "process": "yao.component.SelectOptions"
          }
        },
        "query": {
          //调用处理器使用的参数
          "from": "material.category",
          "labelField": "name",
          "valueField": "id",
          "wheres": [
            {
              "column": "id",
              "op": "ne",
              "value": "[[ $id ]]" //数据引用，前端的输入条件
            }
          ],
          "limit": "2",
          "params": {
            //查询参数,可以使用{{id}}变量绑定前端数据
            "id": "{{id}}",
            "status": "enabled"
          }
        }
      }
    }
  }
}
```

数据引用，分为两种情况：

- 输出值引用：`[[ $id ]]`，表示引用当前数据的`id`字段值。
- 筛选条件数值引用：`[[ $selected ]]`，表示引用当前数据的`selected`字段值。
  比如下面的例子，`wheres`中使用了`orwhere`条件，`value`的值是`[[ $selected ]]`，表示引用当前数据的`

```json
{
  "labelField": "name",
  "valueField": "id",
  "iconField": "status",
  "from": "category",
  "wheres": [
    { "column": "name", "value": "[[ $keywords ]]", "op": "match" },
    {
      "method": "orwhere",
      "column": "id",
      "op": "in",
      "value": "[[ $selected ]]" //数据引用，前端的输入条件
    }
  ],
  "limit": 20,
  "labelFormat": "[[ $name ]]-[[ $status ]]", //输出替换
  "valueFormat": "[[ $id ]]", //输出替换
  "iconFormat": "[[ $status ]]" //输出替换
}
```

远程控件本身带有数据缓存功能，第一次读取数据后会在浏览器本地缓存。如果不需要缓存功能，需要在`app.json`里设置选项`optional.remoteCache`为`false`

```json
{
  "xgen": "1.0",
  "name": "智慧仓库管理平台",
  "short": "智慧仓库",
  "version": "0.10.3",
  "description": "智慧仓库管理平台",
  "adminRoot": "admin",
  "optional": {
    "remoteCache": false
  },
  "menu": {
    "process": "flows.app.menu",
    "args": []
  }
}
```

默认情况下，如果`Tag`控件绑定的字段值是字符串，而不是列表。只会显示`Value`。为了让单个值也能搜索`option`中的标签值，需要增强`Tag`控件：

https://github.com/wwsheng009/xgen/blob/main/packages/xgen/components/view/Tag/index.tsx

### 源代码

`xProps`解析源代码`/yao-app-sources/yao/widgets/component/props.go`

处理器`yao.component.selectoptions`源代码：`yao-app-sources/yao/widgets/component/process.go`

### 其它远程控件

在 props 中以`$`开头的属性，都是远程属性。远程属性的作用是在前端调用后端的处理器，获取数据。远程属性需要一个 process 属性，指定处理器的名称。可以使用 query 属性，指定处理器的参数。

这些远程属性在浏览器会转换成`api`函数，调用的时机需要看`xgen`框架中的源代码配置。

```json
{
  "Flow Builder": {
    "bind": "flow_dsl",
    "edit": {
      "type": "FlowBuilder",
      "props": {
        "ai": { "placeholder": "帮我制作一个 XXX 功能..." },
        "height": 500, // min-height should be more than 300, default is 300

        // The flow builder component is built on top of react-flow, a library for building node-based applications.
        // It will display the attribution by default at the right bottom corner. You can remove it by setting `removeAttribution` to `true`.
        // If you’re considering removing the attribution, you should be aware of the license agreement, follow the next link to learn more.
        // https://reactflow.dev/learn/troubleshooting/remove-attribution
        "removeAttribution": false,

        // execute interface
        // The execute API is to execute the flow data. It will be called when the user clicks the run button or your custom calls the execute method.
        "$execute": {
          "process": "scripts.flow.Execute",
          "query": { "id": "{{ id }}" }
        },

        // presets interface
        "$presets": {
          "process": "scripts.flow.BuilderPresets",
          "query": { "id": "{{ id }}" }
        },

        // setting interface
        "$setting": {
          "process": "scripts.flow.BuilderSetting",
          "query": { "id": "{{ id }}" }
        }
      }
    }
  }
}
```

## xgen 登录请求过程

当用户打开登录页面时，xgen 会向服务器 POST 一个请求`/api/__yao/app/setting`，获取应用的配置信息。这个 api 请求是不需要认证的，一般来说会在登录前调用这个接口地址。

调用接口一般传入三个参数：

- sid 会话 id，客户端生成的唯一字符串，可以是唯一加当前时间。作为请求参数
- lang,语言
- time,当前时间

```json
{ "sid": "temp_sid", "lang": "浏览器当前语言", "time": "当前时间" }
```

服务器收到请求后，会生成一个临时的会话，会话的 id 使用传入的 sid。并把语言设置与 sid 关联起来。在用户登录系统时，也会把 temp_sid 传入登录请求中。

在后端处理请求时，默认会使用处理器`yao.app.xgen`。同时还可使用处理器`yao.app.Setting`,或是使用自定义的处理器,在`app.yao`配置文件里配置`setting`节点。

处理器`yao.app.xgen`的处理流程：

- 读取应用配置文件，配置文件：app.yao/app.jsonc/app.json，只要存在一个就可以。

- 读取用户或是管理员的登录配置文件

- 合并两个文件的配置

应用配置文件的结构如下，其中语言可以通过环境变量配置默认值。Token 与 Optional 可以自定义配置。

```go

type DSL struct {
	Name        string      `json:"name,omitempty"`//
	Short       string      `json:"short,omitempty"`
	Version     string      `json:"version,omitempty"`
	Description string      `json:"description,omitempty"`
	Theme       string      `json:"theme,omitempty"`
	Lang        string      `json:"lang,omitempty"`
	Sid         string      `json:"sid,omitempty"`//当前会话ID
	Logo        string      `json:"logo,omitempty"`
	Favicon     string      `json:"favicon,omitempty"`
	Menu        MenuDSL     `json:"menu,omitempty"`
	AdminRoot   string      `json:"adminRoot,omitempty"`//管理后台的入口，默认是/admin，也可以修改成其它的
	Optional    OptionalDSL `json:"optional,omitempty"`
	Token       OptionalDSL `json:"token,omitempty"`
	Setting     string      `json:"setting,omitempty"` // 自定义的返回应用信息。默认是yao.app.xgen
	Setup       string      `json:"setup,omitempty"`   // setup process
}

```

配置示例：

```json
{
  "xgen": "1.0",
  "name": "::Demo Application",
  "short": "::Demo",
  "description": "::Another yao application",
  "version": "1.0.1",
  "setup": "scripts.demo.Data",
  "adminRoot": "admin",
  "optional": {
    "hideNotification": true,
    "hideSetting": false,
    "neo": { "api": "/neo", "studio": true }
  },
  "menu": { "process": "flows.app.menu", "args": ["demo"] }
}
```

用户或是登录配置文件会在 logins 目录下。

- 管理员配置文件名是`admin.login.yao`
- 普通用户配置文件名是`user.login.yao`

登录配置文件结构定义：

```go

// DSL the login DSL
type DSL struct {
	ID              string               `json:"id,omitempty"`
	Name            string               `json:"name,omitempty"`
	Action          ActionDSL            `json:"action,omitempty"`
	Layout          LayoutDSL            `json:"layout,omitempty"`
	ThirdPartyLogin []ThirdPartyLoginDSL `json:"thirdPartyLogin,omitempty"`
}

// ActionDSL the login action DSL
type ActionDSL struct {
	Process string        `json:"process,omitempty"`//重要，用户登录处理器，默认是yao.login.Admin
	Args    []interface{} `json:"args,omitempty"`//登录器接收的http接口参数
}

// LayoutDSL the login page layoutDSL
type LayoutDSL struct {
	Entry   string `json:"entry,omitempty"`//登录成功后的跳转地址，需要注意的是只能是在xgen的菜单地址
	Captcha string `json:"captcha,omitempty"`//获取验证码图片的地址
	Cover   string `json:"cover,omitempty"`//封面图片地址
	Slogan  string `json:"slogan,omitempty"`//标语
	Site    string `json:"site,omitempty"`//显示的站点地址
}

// ThirdPartyLoginDSL the thirdparty login url
type ThirdPartyLoginDSL struct {
	Title string `json:"title,omitempty"`//标题
	Href  string `json:"href,omitempty"`//登录地址
	Icon  string `json:"icon,omitempty"`//登录页面显示的图标地址
	Blank bool   `json:"blank,omitempty"`//是否跳转到新窗口
}

```

配置文件示例：

管理员配置文件：

```json
{
  "name": "::Admin Login",
  "action": {
    "process": "yao.login.Admin",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/Chart/dashboard",
    "captcha": "yao.utils.Captcha",
    "cover": "/assets/images/login/cover.svg",
    "slogan": "::Make Your Dream With Yao App Engine",
    "site": "https://yaoapps.com"
  },
  "thirdPartyLogin": [
    {
      "title": "微信登录",
      "href": "https://baidu.com",
      "icon": "/assets/logo_wechat.png",
      "blank": true
    },
    {
      "title": "飞书登录",
      "href": "https://google.com",
      "icon": "/assets/logo_feishu.png",
      "blank": false
    }
  ]
}
```

用户配置文件：

```json
{
  "name": "::User Login",
  "action": {
    "process": "scripts.user.Login",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/Table/pet",
    "captcha": "yao.utils.Captcha",
    "cover": "/assets/images/login/cover.svg",
    "slogan": "::Make Your Dream With Yao App Engine",
    "site": "https://yaoapps.com/doc"
  }
}
```

后端根据配置会返回以下的配置信息。login 配置信息经过合并处理，验证码是返回的获取地址而不是处理器名称。

```json
{
  "apiPrefix": "__yao",
  "description": "Another yao application",
  "favicon": "/api/__yao/app/icons/app.ico",
  "lang": "zh-cn",
  "login": {
    "admin": {
      "captcha": "/api/__yao/login/admin/captcha?type=digit",
      "layout": {
        "site": "https://yaoapps.com?from=instance-admin-login",
        "slogan": "Chat with AI"
      },
      "login": "/api/__yao/login/admin"
    },
    "entry": {
      "admin": "/x/Table/demo.table",
      "user": "/x/Table/pet"
    },
    "user": {
      "captcha": "/api/__yao/login/user/captcha?type=digit",
      "layout": {
        "site": "https://yaoapps.com/?from=instance-user-login",
        "slogan": "梦想让我们与众不同"
      },
      "login": "/api/__yao/login/user"
    }
  },
  "logo": "/api/__yao/app/icons/app.png",
  "mode": "development",
  "name": "Demo Application",
  "optional": {
    "hideNotification": true,
    "hideSetting": false,
    "remoteCache": false
  },
  "sid": "Mb69Gat02A8pwKOIOnoF61698890200884",
  "theme": "",
  "token": {}
}
```

当用户登录成功后，xgen 框架会在浏览器端写入以下的存储内容：

localStorage

- xgen:avatar
- xgen:current_nav
- xgen:user
- xgen:login_url
- xgen:menu_key_path
- xgen:token_storage
- xgen:menus
- xgen:menu
- xgen:temp_sid
- xgen:remote_cache
- xgen:xgen_theme
- xgen:paths

### xgen:avatar

用户头像，自动在前端生成，使用的开发包是 react-nice-avatar。页面刷新后会自动生成。

```json
{
  "type": "Object",
  "value": {
    "sex": "man",
    "faceColor": "#AC6651",
    "earSize": "small",
    "eyeStyle": "circle",
    "noseStyle": "short",
    "mouthStyle": "peace",
    "shirtStyle": "hoody",
    "glassesStyle": "none",
    "hairColor": "#77311D",
    "hairStyle": "thick",
    "hatStyle": "none",
    "hatColor": "#D2EFF3",
    "eyeBrowStyle": "up",
    "shirtColor": "#F4D150",
    "bgColor": "#FFEBA4"
  }
}
```

### xgen:xgen_theme

主题,有两种,light 与 dark。可以为空。

```json
{ "type": "String", "value": "light" }
```

### xgen:current_nav

```json
{ "type": "Number", "value": "0" }
```

### xgen:user

用户信息，从数据器上返回。

```json
{
  "type": "Object",
  "value": {
    "email": "xiang@iqka.com",
    "extra": { "sex": "男" },
    "id": 1,
    "mobile": null,
    "name": "管理员",
    "status": "enabled",
    "type": "admin"
  }
}
```

### xgen:login_url

登录时的浏览器地址

```json
{ "type": "String", "value": "/" }
```

### xgen:token_storage

```json
{ "type": "String", "value": "sessionStorage" }
```

### xgen:menu_key_path

```json
{ "type": "Array", "value": [] }
```

### xgen:menus

服务器返回的用户菜单配置

```json
{
  "type": "Object",
  "value": {
    "items": [
      {
        "blocks": 0,
        "icon": "icon-activity",
        "id": 1,
        "name": "数据模型",
        "parent": null,
        "path": "/x/Chart/dashboard",
        "visible_menu": 0
      }
    ],
    "setting": [
      {
        "children": [{ "id": 10002, "name": "系统设置", "path": "/setting" }],
        "icon": "icon-settings",
        "id": 999999,
        "name": "设置",
        "path": "/setting"
      }
    ]
  }
}
```

### xgen:menu

xgen:menus 中的 items 子对象。

```json
{
  "type": "Array",
  "value": [
    {
      "blocks": 0,
      "icon": "icon-activity",
      "id": 1,
      "name": "数据模型",
      "parent": null,
      "path": "/x/Chart/dashboard",
      "visible_menu": 0
    }
  ]
}
```

### xgen:temp_sid

```json
{ "type": "String", "value": "ff9BOlHWGGpJrlOcwTQe_1698885330896" }
```

### xgen:remote_cache

```json
{ "type": "Boolean", "value": "false" }
```

### xgen:paths

```json
{ "type": "Array", "value": ["Table-Page-demo.table"] }
```

## xgen 远程 onChange 事件

当我们需要在 xgen 界面上响应编辑控件的值变化事件时，需要设置控件中的远程 onChange 事件。

使用 onChange 事件能增强 xgen 的用户交互功能，xgen 本身是一个集成在 yao 中的前端项目，在不修改前端项目的源代码的前提下，需要自定义的界面交互功能，可以使用 远程 onChange 事件。事件不但可以修改表单结构的值，还可以修改界面的配置。比如动态的显示隐藏界面元素。

演示：通过字段选项值修改界面的布局。

![](../docs/YaoDSL/Xgen/images/form_on_change_event.gif)

哪些地方可以用 onChange 事件：

- form 表单控件字段，目前只有 form 的字段能使用。
- list 不可用，虽然在 yao 服务器端预留了配置位，但是在 xgen 并没有处理。
- dashboard 不可用，虽然在 yao 服务器端预留了配置位，但是在 xgen 并没有处理。

### 配置

Form 表单控件配置属性`edit.props["$on:change"]`。

这个属性有两个参数：

- `process`处理器，任何合法的 yao 处理器都可以。
- `query`调用处理器时的查询附加参数。

```json
{
  "住院天数": {
    "bind": "stay",
    "edit": {
      "type": "Input",
      "props": {
        "$on:change": {
          "process": "scripts.event.OnChange",
          "query": { "extra": "开发者定义数据" }
        }
      }
    }
  }
}
```

### 事件响应处理。

需要注意的是这里配置的 onChange 事件会调用服务端的处理，不只是发生在浏览器上的，它会发起 http 请求，并等待服务器返回。

当前端输入类型的控件的值有变化时就会调用远程 onChange 事件。

onChange 处理器的输入输出参数如下：

输入参数是一个对象，有以下的属性：

- key 字段名称
- value 新数值
- isOnload 所有 form 字段的旧值，如果是 form 加载触发的调用（form 配置 onLoadSync 属性），这个参数的值是 undefined。
- params 开发者定义数据，这个参数是配置在`on:change.query`里的参数，可以配置其它参数

返回值也是一个对象，它有两个属性：

- data 返回 form 表单值对象。
- setting 返回 xgen form/list/table 的配置 dsl 对象。

可以单独返回`data`，也可以单据返回界面配置`setting`，也可以直接返回空对象，什么也不修改。

注意，一定要返回一个对象，即使是空对象。

```js
/**
 * Debug
 * @param {*} query
 */
function OnChange(query) {
  query = query || {};
  isOnLoad = query.isOnload; //保存所有form字段旧值,这里的命名有点误导
  key = query.key; // 字段名称
  params = query.params; // 开发者定义数据
  value = query.value; //新值

  //一般会在原来数据的基础下进行修改更新
  let data = { ...query, cost: 1000 }; // 更新消费金额数据, 消费金额
  //读取form配置
  let setting = Process('yao.form.Setting', 'hero'); // 根据新数值生成配置信息;
  setting['fields']['form']['位置']['edit']['props']['options'] = [
    {
      label: '上单',
      value: '上单'
    },
    {
      label: '中单',
      value: '中单'
    },
    {
      label: '打野',
      value: '打野'
    }
  ];
  // 错误检测
  if (setting && setting.code && setting.message) {
    throw new Exception(setting.message, 500);
  }

  return {
    data: data, // 更新消费金额数据, 消费金额
    setting: setting
  };
}
```

### 源代码学习：

form 表单字段 onChange 事件。

`/xgen-v1.0/packages/xgen/components/base/PureForm/hooks/useOnValuesChange.ts`

函数 useOnValuesChange 会作为 form 的 onValuesChangeg 事件处理器。当 form 的字段有值发生变化时，就会回调这个函数。函数会先设置浏览器里的 form 字段的值，然后再调用远程处理函数。

```js
// useOnValuesChange
export default (
	onChangeHook: Required<FormType.Setting>['hooks']['onChange'],
	setData: IPropsPureForm['setData'],
	setSetting: IPropsPureForm['setSetting']
) => {
      return useMemoizedFn(async (v, isOnLoad?: boolean) => {
            if (!onChangeHook) return

            setData(v)//先设置本地form的值

		const key = Object.keys(v)[0]
		const value = v[key]

		if (!(key in onChangeHook)) return

		const [err, res] = await to<{ data: Global.AnyObject; setting: FormType.Setting }>(
			axios.post(onChangeHook[key].api, { key, value, params: onChangeHook[key]?.params, isOnLoad })
		)

		if (err) return

		if (res.setting) setSetting(res.setting)//如果返回界面设置，变更显示界面
		if (res.data && Object.keys(res.data).length) setData(res.data)//如果远程函数返回新值，设置新值
	})
}
```

### Form 加载时触发事件

在表单中使用 onChange 事件时，还可以使用配置 onLoadSync 来控制是否在界面加载时就调用远程 onChange 事件。`layout.form.props.onLoadSync=true时`，form 在加载时就会调用所有字段的 onChange 事件。但是处理器参数 isOnLoad 会是 undefined。

```js
useLayoutEffect(() => {
  setFieldsValue(data);

  if (!Object.keys(data).length) return;
  if (!onLoadSync) return;

  Object.keys(data).map((key) => onValuesChange({ [key]: data[key] }), true);
}, [data, onLoadSync]);
```

## 在字段中使用计算功能

### 使用 Compute

组件`table/form/filter`可以使用字段的`compute`功能在数据显示前或是输入后进行拦截处理。

一般有两个使用场景：

- 数据输出之前需要在字段的 view 属性里设置`compute`属性,在数据输出之前会调用处理方法。
- 数据输入之后需要在字段的 edit 属性里设置`compute`属性，在用户输入数据之后会调用处理方法。

```json
{
  "图集": {
    "bind": "images",
    "view": { "type": "Image", "compute": "ImagesView", "props": {} },
    "edit": {
      "type": "Upload",
      "compute": "ImagesEdit",
      "props": {
        "api": "/api/__yao/upload_test",
        "filetype": "image",
        "maxCount": 6
      }
    }
  }
}
```

`compute`属性定义如下：

源代码路径：`yao/widgets/component/compute.go`

```go
type Compute struct {
    Process string `json:"process"`
    Args    []CArg `json:"args,omitempty"`
}

// CArg compute interface{}
type CArg struct {
    IsExp bool
    key   string
    value interface{}
}
```

如果`compute`属性的值类型是字符串，会自动的转换成`处理器`名称，并给`处理器`传入 4 个参数。

```go
//第一个参数是字段的值。
// ["$C(value)", "$C(props)", "$C(type)","$C(id)","$C(path)"]
var defaults = []CArg{
    {IsExp: true, key: "value", value: nil},//控件的值，
    {IsExp: true, key: "props", value: nil},//属性
    {IsExp: true, key: "type", value: nil},//类型
    {IsExp: true, key: "id", value: nil},//数据的id
    {IsExp: true, key: "path", value: nil},//配置路径xpath
}
```

### 参数的传值

传入值：

调用 `Compute` 实际上是在调用处理器,参数的数量可变的，类型也没限制。

参数里可以使用表达式引用变量或是常量。

在参数中可使用表达式`$()`引用变量，也可以直接使用常量。非常的灵活。

```go

 "Concat": []byte(`{
     "process": "Concat",
     "args": ["$C(row.type)", "\\::", "$C(value)", "-", "$C(row.status)"]
 }`),
 "Mapping": []byte(` {
     "process": "Mapping",
     "args": [
       "$C(value)",
       { "0": "checked", "1": "curing", "2": "cured" }
     ]
 }`),
 "MappingOnline": []byte(`{
     "process": "scripts.compute.MappingOnline",
     "args": ["$C(value)", "$C(props.mapping)"]
 }`),

```

返回值：**Compute 处理器的返回值会赋予字段**。

`view/edit`中的`compute`处理器可以在表达式中引用以下的变量:

- row， 引用整行用户传入的单条数据结构对象，可以使用点号引用嵌套对象。
- value， 引用当前字段的值
- id，引用行 id
- path，引用属性路径，比如：fields.table.创建时间
- props，同时还可以访问字段配置的 view 下所有的属性

**注意**：`Compute`无法处理嵌套的关联表子对象：

### 内置处理器

yao 系统里有几个内置的处理器

`yao/widgets/component/handlers.go`

- Get，直接返回当前字段的值，可引用不同路径的值
- Trim，去除前后空格
- Hide，不返回值，相当于隐藏了值，在数据库里有，但是没有显示
- Concat，拼接多个值
- Download，返回文件的下载地址
- Upload，上传文件并返回下载路径

除了内置的处理，可以使用其它任何合法的 yao 处理器。

示例

```json
{
  "别名": {
    "bind": "name_new",
    "view": {
      "type": "Text",
      "compute": {
        "process": "Concat",
        "args": ["$C(row.name)", "-", "$C(row.status)"]
      },
      "props": {}
    },
    "edit": {
      "type": "Input",
      "props": { "placeholder": "请输入宠物名称" }
    }
  }
}
```

`Compute`的调用顺序与生命周期

```js
// Life-Circle: Compute Filter → Before Hook → Compute Edit → Run Process → Compute View → After Hook

// 筛选控件的Compute
// Execute Compute Filter On:  Search, Get, Find

// 编辑控件的Compute
// Execute Compute Edit On:    Save, Create, Update, UpdateWhere, UpdateIn, Insert

// 查看控件的Compute
// Execute Compute View On:    Search, Get, Find
```

## `Yao`应用默认用户名

默认的后台登录地址：http://127.0.0.1:5099/xiang/login/admin

系统初始化后的用户名密码

> 用户名: xiang@iqka.com
> 密码: A123456p+

## 菜单

在 0.10.3 版本中，菜单的结构如下。返回数据结构需要有两个节点`items`与`setting`。

```json
{
  "items": [
    {
      "icon": "icon-activity",
      "name": "图表",
      "path": "/x/Chart/dashboard"
    },
    {
      "icon": "icon-book",
      "name": "表格",
      "path": "/x/Table/pet",
      "children": [
        {
          "icon": "icon-book",
          "name": "宠物列表",
          "path": "/x/Table/pet"
        }
      ]
    },
    {
      "icon": "icon-clipboard",
      "name": "表单",
      "path": "/x/Form/pet/0/edit",
      "children": [
        {
          "icon": "icon-clipboard",
          "name": "创建宠物",
          "path": "/x/Form/pet/0/edit"
        }
      ]
    }
  ],
  "setting": [
    {
      "icon": "icon-settings",
      "name": "设置",
      "path": "/setting",
      "children": [
        {
          "name": "系统设置",
          "path": "/setting"
        }
      ]
    }
  ]
}
```

## Array 转树形结构

处理器`xiang.helper.ArrayTree`或是`utils.arr.Tree`，传入有父子节点关系的对象数组，返回转换后树形结构数据。转换后的子节点的数据保存在`children`属性中，可嵌套。

典型的应用是转换保存在数据库中的菜单数据成 JSON 对象。

- 参数 1： 记录集合
- 参数 2： 数据转换配置项，配置项定义：

```go
// ArrayTreeOption Array转树形结构参数表
type ArrayTreeOption struct {
	Key      string      `json:"id"`       // 主键名称, 默认为 id
	Empty    interface{} `json:"empty"`    // Top节点 parent 数值, 默认为 0
	Parent   string      `json:"parent"`   // 父节点字段名称, 默认为 parent
	Children string      `json:"children"` // 子节点字段名称, 默认为 children
}

```

一般会设置`empty=null`与`parent`，表示如果这个`parent`对应的字段如果是空值说明是树顶点。

示例

```js
res = Process('xiang.helper.ArrayTree', cate, {
  parent: 'parent_id',
  empty: null
});
```

删除空对象

```js
function removeEmpty(obj) {
  for (var prop in obj) {
    if (obj[prop] === null || obj[prop] === undefined) {
      delete obj[prop];
    } else if (typeof obj[prop] === 'object') {
      removeEmpty(obj[prop]);
      if (Array.isArray(obj[prop]) && obj[prop].length === 0) {
        delete obj[prop];
      } else if (Object.keys(obj[prop]).length === 0) {
        delete obj[prop];
      }
    }
  }
  return obj;
}
```

## log 打印调试信息

Log 打印调试信息，方便定位问题。

### 示例

log 打印位置 `logs/application.log` 打印日志:

```javascript
log.Error('%v', foo);
log.Info('foo');
```

输出以下信息:

```
time="2022-08-25T10:00:28Z" level=error msg=foo
time="2022-08-25T10:00:28Z" level=info msg=foo

```

## 会话数据

用户会话数据处理器

| 处理器           | 说明             | 文档 |
| ---------------- | ---------------- | ---- |
| session.Start    | 启用会话         |      |
| session.ID       | 读取会话 ID      |      |
| session.Get      | 读取会话变量     |      |
| session.Set      | 设置会话变量     |      |
| session.MultiSet | 批量设置会话变量 |      |
| session.Dump     | 返回所有会话数据 |      |

设置 Session 的值，新建`flows/session.flow.json`,args 的三个参数分别对应：session 的 key，session 的值，过期时间

```json
{
  "label": "session",
  "version": "1.0.0",
  "description": "session",
  "nodes": [
    {
      "name": "SID",
      "process": "session.start"
    },
    {
      "name": "设置会话数据",
      "process": "session.set",
      "args": ["user", "123456", 28800]
    }
  ],
  "output": "success"
}
```

设置好 session 后，可以使用`Process("session.Get", "user")`来获取对应的值

## 使用处理器

Yao 内建数据原子操作、网络请求、流程控制等一系列的处理器。这些处理器可以在数据接口、数据表格、数据图表、数据流等场景下使用，可以实现80% 的业务逻辑处理需求。

处理器支持使用数据流、JS脚本、GRPC插件编写。

### 处理器

处理器是完成特定功能的函数 `Process( ...args:any[] ) any`, 由处理器名称、参数表和返回值构成。处理器包含以下类型：

| 处理器                 | 说明                                       |
| ---------------------- | ------------------------------------------ |
| xiang.\*.\*            | 内建处理器                                 |
| models.<模型名称\>.\*  | 内建处理器，数据模型原子操作               |
| flows.<数据流名称\>    | 内建处理器，通过数据流编写的处理器         |
| scripts.<脚本名称\>.\* | 内建处理器，通过 JavaScript 脚本编写处理器 |
| plugins.<插件名称\>.\* | 通过 GRPC 插件编写处理器                   |
| session.\*             | 系统内建，会话数据处理器                   |

注意：应用引擎内建处理器命名空间为 **xiang** ,
防止在命令行使用时与
**yao** 混淆。 **xiang** 是应用引擎的内部研发代号, 名称源自周易
**《象传》[xiàng zhuàn]**
，用来解释卦辞爻辞，取观测万象，预测趋势之意。

### 使用方式

#### 在命令行中使用

可以使用 `run` 命令，运行处理器 `yao run <process> [args...]`。

```bash
yao run models.pet.Get '::{}'
```

#### 在 API 中使用

在 API 中指定 `process` 设置处理器。 `query` 设置处理器的参数表。

```json
{
  ...
  "paths": [
    {
      "path": "/search",
      "method": "GET",
      "process": "models.pet.Paginate",
      "query": [":query-param", "$query.page", "$quey.pagesize"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
  ...
}
```

#### 在数据流节点中使用

在数据流节点中通过 `process` 指定处理器， `args` 传入处理器参数表。

```json
{
  ...
  "nodes": [
    {
      "name": "宠物",
      "process": "models.pet.Find",
      "args": [1, { "select": ["id","name"] }]
    },
    {
      "name": "打印",
      "process": "yao.sys.Print",
      "args": ["{{$res.宠物}}"]
    }
  ]
  ...
}
```

同样方式也可以用在看板、大屏、图表的数据流节点上。

```json
{
  ...
  "nodes": [
    {
      "name": "类型汇总",
      "process": "flows.stat.kind",
       "args": [["狗","猫"]]
    }
  ]
  ...
}
```

#### 在数据表格中使用

使用 `process` 重载表格数据读取逻辑

```json
{
  ...
  "apis": {
    "search": {
      "process": "flows.pet.latest"
    },
    "find": {
      "process": "flows.pet.find"
    }
  }
  ...
}
```

用作表格 `Hook` ，处理上下文数据

```json
{
  ...
  "hooks": {
    "after:search": "flows.pet.fliter.data",
    "after:find": "flows.pet.fliter.row"
  }
  ...
}
```

用作表格 `Guard` ，处理验证逻辑，在 table 的`apis`中写入以下内容：

```json
{
  ...
  "apis": {
    "save": {
      "guard": "bearer-jwt,scripts.user.login"
    },
    "delete": {
      "guard": "bearer-jwt"
    }
  },
  ...
}
```

`scripts/user.js`内容,能够打印出请求的 url 路径，参数，以及请求头部，配合`Exception` 能够做到验证某些数据或者权限

```javascript
function login(path, params, query, payload, headers) {
  console.log([path, params, query, payload, headers]);
  throw new Exception('未登录', 403);
}
```

## 加密解密

加密解密处理器，参考文档 <a href="https://github.com/YaoApp/yao/blob/main/crypto/crypto.go">对照表</a>

| 处理器                 | 说明                                                              | 使用方法                                                  |
| ---------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| yao.crypto.hmac        | 使用 SHA1 加密，自带 base64 加密                                  | Process("yao.crypto.hmac", "SHA1", value, key, "base64"); |
| encoding.base64.Encode | 使用 base64 加密                                                  | Process("encoding.base64.Encode", str);                   |
| encoding.base64.Decode | 使用 base64 解密                                                  | Process("encoding.base64.Decode", str);                   |
| yao.crypto.hash        | 使用各种加密方法 ，第一个参数可填写：MD4，MD5 ，SHA1 ，SHA256 ... | Process("yao.crypto.hash", "SHA1", str);                  |
|                        |

## yao 处理器列表

- aigcs.\<AIGC_ID\>.\<METHOD\>
- flows.\<FLOW_ID\>.\<METHOD\>
- plugins.\<PLUGIN_ID\>.\<METHOD\>
- scripts.\<SCRIPT_ID\>.\<METHOD\>
- studio.\<STUDIO_ID\>.\<METHOD\>
- widgets.\<WIDGET_ID\>.\<METHOD\>

## 加密

- crypto.hash
- crypto.hmac
- yao.wework.decrypt

### 编码

- encoding.base64.decode
- encoding.base64.encode
- encoding.hex.decode
- encoding.hex.encode
- encoding.json.decode
- encoding.json.encode

### 文件处理

fs 处理器在设计是支持多种 ID 的，但是直接使用处理器调用只支持 system。

默认的 TYPE 是 system,

- fs.system.basename
- fs.system.chmod
- fs.system.copy
- fs.system.dirname
- fs.system.download
- fs.system.exists
- fs.system.extname
- fs.system.isdir
- fs.system.isfile
- fs.system.islink
- fs.system.mimetype
- fs.system.mkdir
- fs.system.mkdirall
- fs.system.mkdirtemp
- fs.system.mode
- fs.system.modtime
- fs.system.move
- fs.system.readdir
- fs.system.readfile
- fs.system.readfilebuffer
- fs.system.remove,删除文件或目录
- fs.system.removeall,删除文件或目录(含目录下文件或目录)
- fs.system.size
- fs.system.upload
- fs.system.writefile
- fs.system.writefilebuffer

也可以使用 Js 脚本进行文件操作。

#### System

`/data/app/scripts/test.js`

```js
function ReadFile() {
  let fs = new FS('system');
  let data = fs.ReadFile('/f1.txt'); // /data/app/data/f1.txt
  return data;
}

function WriteFile() {
  let fs = new FS('system');
  let length = fs.WriteFile('/f2.txt', 'hello', 0644); // /data/app/data/f2.txt
  return length;
}
```

如果需要使用 dsl 或是 script 处理的文件处理器需要使用 js 脚本。

#### DSL

**需要在 studio 目录下**

`/data/app/studio/test.js`

```js
function ReadFile() {
  let fs = new FS('dsl');
  let data = fs.ReadFile('/models/f1.mod.yao'); // /data/app/models/f1.mod.yao
  return data;
}

function WriteFile() {
  let fs = new FS('dsl');
  let data = `{
    name: "用户",
    table: { name: "f1" },
    columns: [{ label: "ID", name: "id", type: "ID" }],
  }`;
  let length = fs.WriteFile('/models/f2.mod.yao', data, 0644); //  /data/app/models/f2.mod.yao
  return length;
}
```

#### Script

**需要在 studio 目录下**

`/data/app/studio/test2.js`

```js
function ReadFile() {
  let fs = new FS('script');
  let data = fs.ReadFile('/f1.js'); // /data/app/scripts/f1.js
  return data;
}

function WriteFile() {
  let fs = new FS('script');
  let script = `
    function Foo() {
      return "Bar"
    }
  `;
  let length = fs.WriteFile('/models/f2.js', script, 0644); // /data/app/scripts/f2.js
  return length;
}
```

### http 处理

- http.delete,参数：`[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`
- http.get,参数：`[<URL>, <Query (可选)>, <Headers (可选)>]`
- http.head,参数：`[<URL>, <Payload (可选)>, <Query (可选)>, <Headers (可选)>]`
- http.patch,参数：`[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`
- http.post,参数:`[<URL>, <Payload (可选)>, <Files (可选)>, <Query(可选)>, <Headers (可选)>]`
- http.put,参数：`[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`
- http.send,参数：`[<METHOD>, <URL>, <Payload (可选)>,<Query (可选)>, <Headers (可选)>,<Files(可选)>]`
- http.stream,参数：`[<METHOD>, <URL>, <Handler procsss name>,<Payload (可选)>, <Query (可选)>, <Headers (可选)>]`

### 模型相关

操作模型，相当于操作表数据，需要有 model id。

- models.\<MODEL_ID\>.find
- models.\<MODEL_ID\>.get
- models.\<MODEL_ID\>.paginate
- models.\<MODEL_ID\>.selectoption

- models.\<MODEL_ID\>.create
- models.\<MODEL_ID\>.update
- models.\<MODEL_ID\>.save
- models.\<MODEL_ID\>.delete
- models.\<MODEL_ID\>.destroy
- models.\<MODEL_ID\>.insert,批量一次性保存
- models.\<MODEL_ID\>.updatewhere
- models.\<MODEL_ID\>.deletewhere，按条件软件删除
- models.\<MODEL_ID\>.destroywhere,按条件硬删除
- models.\<MODEL_ID\>.eachsave,批量逐条保存
- models.\<MODEL_ID\>.eachsaveafterdelete

- models.\<MODEL_ID\>.migrate，更新模型配置到数据库，可强制删除表数据
- models.\<MODEL_ID\>.load，从文件配置或是源代码中加载模型配置
- models.\<MODEL_ID\>.reload，重新加载模型的文件配置
- models.\<MODEL_ID\>.read,读取模型的元信息
- models.\<MODEL_ID\>.exists,检查模型是否存在

### openai 相关

- openai.audio.transcriptions
- openai.chat.completions
- openai.embeddings
- openai.tiktoken

### 计划

- schedules.\<ID\>.start
- schedules.\<ID\>.stop

### 数据库表处理

SCHEMA_ID 默认是 default，比如获取所有的表名处理器`schemas.default.tables`

- schemas.\<SCHEMA_ID\>.columnadd
- schemas.\<SCHEMA_ID\>.columnalt
- schemas.\<SCHEMA_ID\>.columndel
- schemas.\<SCHEMA_ID\>.create
- schemas.\<SCHEMA_ID\>.drop
- schemas.\<SCHEMA_ID\>.indexadd
- schemas.\<SCHEMA_ID\>.indexdel
- schemas.\<SCHEMA_ID\>.tablecreate
- schemas.\<SCHEMA_ID\>.tablediff
- schemas.\<SCHEMA_ID\>.tabledrop
- schemas.\<SCHEMA_ID\>.tableexists
- schemas.\<SCHEMA_ID\>.tableget
- schemas.\<SCHEMA_ID\>.tablerename
- schemas.\<SCHEMA_ID\>.tables
- schemas.\<SCHEMA_ID\>.tablesave

### 会话处理

在 api 主动中有经过用户验证的处理后才会有会话信息

- session.dump
- session.get
- session.id
- session.set
- session.setmany

- ssl.sign
- ssl.verify

### 存储

- stores.\<ID\>.clear
- stores.\<ID\>.del
- stores.\<ID\>.get
- stores.\<ID\>.getdel
- stores.\<ID\>.has
- stores.\<ID\>.keys
- stores.\<ID\>.len
- stores.\<ID\>.set

### 任务

- tasks.\<TASK_ID\>.add
- tasks.\<TASK_ID\>.get
- tasks.\<TASK_ID\>.progress

### 工具类

- utils.app.inspect
- utils.app.ping

#### 数组操作

- utils.arr.column
- utils.arr.get
- utils.arr.indexes
- utils.arr.keep
- utils.arr.mapset
- utils.arr.pluck
- utils.arr.split
- utils.arr.tree
- utils.arr.unique

兼容旧版本

- xiang.helper.arraycolumn
- xiang.helper.arrayget
- xiang.helper.arrayindexes
- xiang.helper.arraykeep
- xiang.helper.arraymapset
- xiang.helper.arraypluck
- xiang.helper.arraysplit
- xiang.helper.arraytree
- xiang.helper.arrayunique

#### 验证码

- utils.captcha.make
- utils.captcha.verify

#### 环境变量

- utils.env.get
- utils.env.getmany
- utils.env.setmany

#### 流程控制

- utils.flow.case
- utils.flow.each
- utils.flow.for
- utils.flow.if
- utils.flow.return
- utils.flow.throw

- utils.fmt.print

#### jwt

- utils.jwt.make
- utils.jwt.verify

#### 对象操作

- utils.map.array
- utils.map.del
- utils.map.delmany
- utils.map.get
- utils.map.keys
- utils.map.set
- utils.map.values
- utils.tree.flatten

兼容旧版本

- xiang.helper.mapdel
- xiang.helper.mapget
- xiang.helper.mapkeys
- xiang.helper.mapmultidel
- xiang.helper.mapset
- xiang.helper.maptoarray
- xiang.helper.mapvalues

#### 时间日期

- utils.now.date
- utils.now.datetime
- utils.now.time
- utils.now.timestamp
- utils.now.timestampms
- utils.time.sleep

#### 密码

- utils.pwd.verify

#### 字符串

- utils.str.concat
- utils.str.hex
- utils.str.join
- utils.str.joinpath
- utils.str.uuid

### widget 处理

操作 widgets,读取所有已加载的 widget 的属性列表，包含自定义的 widget。

- widget.actions
- widget.apis
- widget.fields
- widget.filters
- widget.models

### 操作自定义 widget

处理器：widget.remove，删除 widget 源代码，处理参数：

- name,widget 配置名称，比如 dyform/iform
- file,widget 实例名称[文件名称],比如 feedback/website

处理器：widget.save，保存 widget 源代码，处理参数：

- name,widget 配置名称，比如 dyform/iform
- file,widget 实例名称[文件名称],比如 feedback/website
- source,源代码

### yao 相关

- yao.app.check
- yao.app.icons
- yao.app.menu
- yao.app.service
- yao.app.setting
- yao.app.setup
- yao.app.xgen

- yao.component.selectoptions
- yao.crypto.hash
- yao.crypto.hmac
- yao.crypto.weworkdecrypt

- yao.env.get
- yao.env.multiget
- yao.env.multiset
- yao.env.set
- yao.expression.selectoption
- yao.expression.trimspace
- yao.sys.sleep

#### 大屏显示

- yao.dashboard.component
- yao.dashboard.data
- yao.dashboard.setting
- yao.dashboard.xgen

#### 图表

- yao.chart.component
- yao.chart.data
- yao.chart.setting
- yao.chart.xgen

#### 导入 excel

- yao.import.data
- yao.import.datasetting
- yao.import.mapping
- yao.import.mappingsetting
- yao.import.run
- yao.import.setting

#### 列表显示

- yao.list.component
- yao.list.download
- yao.list.save
- yao.list.setting
- yao.list.upload
- yao.list.xgen

#### 表单数据处理

- yao.form.component
- yao.form.create
- yao.form.delete
- yao.form.download
- yao.form.find
- yao.form.load
- yao.form.save
- yao.form.setting
- yao.form.update
- yao.form.upload
- yao.form.xgen

#### 表格处理

- yao.table.component
- yao.table.create
- yao.table.delete
- yao.table.deletein
- yao.table.deletewhere
- yao.table.download，下载文件，注意有后缀名白名单
- yao.table.export
- yao.table.find
- yao.table.get
- yao.table.insert
- yao.table.save
- yao.table.search
- yao.table.setting,读取表格设置
- yao.table.update
- yao.table.updatein，按 id 列表删除，参数 1 为单一主键或是多个主键以逗号拼接
- yao.table.updatewhere，按条件删除
- yao.table.upload，文件上传
- yao.table.xgen，读取表格配置的 xgen ui 配置
- yao.table.load，从文件或是源代码加载表格配置
- yao.table.reload，重新加载表格配置
- yao.table.unload，从内存中卸载表格配置
- yao.table.read，读取表格配置
- yao.table.exists，检查表格配置是否存在

#### 登录相关

- yao.login.admin
- yao.utils.captcha
- yao.utils.captchavalidate

### 旧版兼容

- utils.env.Get
- utils.env.GetMany
- utils.env.SetMany
- utils.env.Set
- xiang.flow.case
- xiang.flow.each
- xiang.flow.for
- xiang.flow.if
- xiang.flow.return
- xiang.flow.sleep
- xiang.flow.throw
- xiang.helper.captcha
- xiang.helper.captchavalidate
- xiang.helper.case
- xiang.helper.each
- xiang.helper.envget
- xiang.helper.envmultiget
- xiang.helper.envmultiset
- xiang.helper.envset
- xiang.helper.for
- xiang.helper.hextostring
- xiang.helper.if
- xiang.helper.jwtmake -> utils.jwt.Make
- xiang.helper.jwtvalidate

- xiang.helper.passwordvalidate
- xiang.helper.print
- xiang.helper.return
- xiang.helper.strconcat
- xiang.helper.throw
- xiang.import.data
- xiang.import.datasetting
- xiang.import.mapping
- xiang.import.mappingsetting
- xiang.import.run
- xiang.import.setting
- xiang.main.appfilecontent
- xiang.main.favicon
- xiang.main.filecontent
- xiang.main.inspect
- xiang.main.ping
- xiang.sys.inspect
- xiang.sys.ping
- utils.fmt.Println
- xiang.sys.sleep

## 应用引擎

应用引擎相关处理器。

| 处理器            | 说明             | 文档 |
| ----------------- | ---------------- | ---- |
| utils.app.Ping    | 返回版本信息     |      |
| utils.app.inspect | 返回应用系统信息 |      |
| utils.fmt.Println | 在控制台打印数据 |      |
| utils.env.Get     | 读取环境变量     |      |
| utils.env.Set     | 设置环境变量     |      |
| utils.env.GetMany | 批量读取环境变量 |      |
| utils.env.SetMany | 批量设置环境变量 |      |

### utils.app.Ping

返回版本信息

`yao run utils.app.Ping`

**参数表**

无

**返回值**

```json
{
  "engine": "yao",
  "version": "0.9.0"
}
```

### utils.app.inspect

返回应用配置信息

`yao run utils.app.inspect`

**参数表**

无

**返回值**

```json
{
  "BUILDNAME": "yao",
  "CONFIG": {
    "app": "/gou",
    "data_root": "/gou/data",
    "db": {
      "driver": "sqlite3",
      "primary": ["./db/yao.db"]
    },
    "host": "0.0.0.0",
    "lang": "en-us",
    "log": "/gou/logs/application.log",
    "log_local_time": true,
    "log_max_age": 7,
    "log_max_backups": 3,
    "log_max_size": 100,
    "log_mode": "TEXT",
    "mode": "production",
    "port": 5099,
    "root": "/gou",
    "runtime": {
      "contextTimeout": 200,
      "defaultTimeout": 200,
      "heapAvailableSize": 524288000,
      "heapSizeLimit": 1518338048,
      "heapSizeRelease": 52428800,
      "import": true,
      "maxSize": 100,
      "minSize": 10,
      "mode": "standard"
    },
    "session": {
      "db": "1",
      "host": "127.0.0.1",
      "port": "6379",
      "store": "file"
    },
    "studio": {
      "studio_port": 5077,
      "studio_secret": "FA5D9D6D89200900186A1A5644274CA26FF970C86F36AC4810C0EAEB521496EC"
    }
  },
  "VERSION": "0.10.4 DEV"
}
```

### utils.fmt.Println

在控制台打印数据

`yao run utils.fmt.Println hello '::{"foo":"bar"}' world`

**参数表**

| 参数      | 类型 | 必填项 | 说明         |
| --------- | ---- | ------ | ------------ |
| args[0]   | any  | 是     | 打印的变量   |
| args[...] | any  | 否     | 打印的变量 n |

**返回值**

无

### utils.env.Get

读取环境变量

`yao run utils.env.Get PATH`

**参数表**

| 参数    | 类型   | 必填项 | 说明         |
| ------- | ------ | ------ | ------------ |
| args[0] | string | 是     | 环境变量名称 |

**返回值**

string

```json
"/usr/data/opt/bin"
```

### utils.env.Set

设置环境变量

`yao run utils.env.Set FOO BAR`

**参数表**

| 参数    | 类型   | 必填项 | 说明         |
| ------- | ------ | ------ | ------------ |
| args[0] | string | 是     | 环境变量名称 |
| args[1] | string | 是     | 环境变量数值 |

**返回值**

无

### utils.env.GetMany

读取多个环境变量

`yao run utils.env.GetMany PATH USER SHELL`

**参数表**

| 参数    | 类型   | 必填项 | 说明         |
| ------- | ------ | ------ | ------------ |
| args[0] | string | 是     | 环境变量名称 |

**返回值**

[key:string]string

```json
{
  "PATH": "/usr/local/opt/bin",
  "SHELL": "/bin/bash",
  "USER": "max"
}
```

### utils.env.SetMany

设置多个环境变量

`yao run utils.env.SetMany '::{"FOO":"BAR", "HELLO":"WORLD"}'`

**参数表**

| 参数    | 类型   | 必填项 | 说明         |
| ------- | ------ | ------ | ------------ |
| args[0] | string | 是     | 环境变量名称 |

**返回值**

无

## 数据图表

数据看板、分析图表、数据大屏相关处理器。

| 处理器              | 说明                                                                                 | 参数说明                                                                   |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| yao.chart.setting   | 读取图表配置信息，用于前端界面渲染。通过图表的 Action.Setting 配置执行相应处理器。   | -                                                                          |
| yao.chart.xgen      | 生成图表的前端配置数据。支持传入自定义数据和权限排除项，用于生成最终的图表展示配置。 | data: object 自定义数据<br>excludes: array 权限排除项                      |
| yao.chart.component | 执行图表组件相关的查询操作。用于处理图表中特定组件的数据获取需求。                   | xpath: string 组件路径<br>method: string 方法名<br>query?: object 查询参数 |
| yao.chart.data      | 获取图表数据。通过图表的 Action.Data 配置执行相应处理器，返回图表所需的数据结果。    | -                                                                          |

### 使用示例

#### 在图表 DSL 中配置处理器

```json
{
  "action": {
    "data": {
      "process": "scripts.stat.daily",
      "default": ["$G.TODAY"]
    },
    "setting": {
      "process": "scripts.chart.setting"
    }
  }
}
```

#### 在数据流中使用

```json
{
  "nodes": [
    {
      "name": "图表数据",
      "process": "yao.chart.Data",
      "args": ["sales-chart"]
    }
  ]
}
```

## 数据处理

本文档介绍了 Yao DSL 中的数据处理器，主要包含以下几类处理器：

1. 数组操作处理器

   - 提供了丰富的数组操作功能，如获取指定索引数据、数组索引、数据记录合并、数据分解、字段提取等
   - 支持数组排重、树形结构转换、数据过滤等高级操作

2. 映射表操作处理器

   - 提供了映射表(Map)的基本操作，包括获取/设置值、删除键、批量删除等
   - 支持获取键值信息、转换为数组、合并映射表等功能

3. 验证码处理器

   - 支持生成图形验证码和音频验证码
   - 提供验证码校验功能

4. 其他工具处理器
   - 字符串连接
   - 密码校验
   - JWT 令牌的生成和校验

每类处理器都提供了详细的使用示例，可以通过 Process() 函数调用这些处理器来实现相应的数据处理功能。

| 处理器               | 说明                                                            | 文档 |
| -------------------- | --------------------------------------------------------------- | ---- |
| utils.arr.get        | 返回指定索引数据                                                |      |
| utils.arr.indexes    | 返回数组索引。                                                  |      |
| utils.arr.pluck      | 将多个数据记录集合，合并为一个数据记录集合                      |      |
| utils.arr.split      | 将多条数记录集合，分解为一个 fields:[]string 和 values: [][]any |      |
| utils.arr.column     | 返回多条数据记录，指定字段数值。                                |      |
| utils.arr.keep       | 仅保留指定键名的数据                                            |      |
| utils.arr.tree       | 转换为树型结构                                                  |      |
| utils.arr.unique     | 数组排重                                                        |      |
| utils.arr.mapset     | 数组映射设定数值                                                |      |
| utils.map.keys       | 返回映射表的键                                                  |      |
| utils.map.values     | 返回映射表的数值                                                |      |
| utils.map.array      | 映射转换为 KeyValue 数组                                        |      |
| utils.map.get        | 返回映射表给定键的值                                            |      |
| utils.map.set        | 设定键值,返回映射表给定键的值                                   |      |
| utils.map.del        | 删除给定键, 返回映射表                                          |      |
| utils.map.delmany    | 删除一组给定键, 返回映射表                                      |      |
| utils.map.merge      | 合并两个映射表                                                  |      |
| utils.str.Concat     | 连接字符串                                                      |      |
| utils.captcha.Make   | 读取图形/音频验证码                                             |      |
| utils.captcha.Verify | 校验图形/音频验证码                                             |      |
| utils.pwd.Verify     | 校验密码                                                        |      |
| utils.jwt.Make       | 制作 JWT                                                        |      |
| utils.jwt.Verify     | 校验 JWT                                                        |      |

### 数组操作处理器示例

#### 基本操作

```javascript
// 获取数组指定索引的数据
const item = Process('utils.arr.get', array, 1);

// 获取数组的索引
const indexes = Process('utils.arr.indexes', array);

// 将多个数据记录集合合并为一个数据记录集合
const columns = ['name', 'short_name'];
const pluckData = { name: '阿里云计算有限公司', short_name: '阿里云' };
const plucked = Process('utils.arr.pluck', columns, pluckData);

// 将多条记录集合分解为字段名数组和值数组
const records = [
  { name: '阿里云计算有限公司', short_name: '阿里云' },
  { name: '世纪互联蓝云', short_name: '上海蓝云' }
];
const [fields, values] = Process('utils.arr.split', records);
// 输出: [["name","short_name"],["阿里云计算有限公司","阿里云"],["世纪互联蓝云","上海蓝云"]]

// 获取多条数据记录中指定字段的值
const columnValues = Process('utils.arr.column', records, 'name');

// 仅保留指定键名的数据
const keeps = ['name'];
const filteredRecords = Process('utils.arr.keep', records, keeps);

// 数组排重
const uniqueRecords = Process('utils.arr.unique', records);

// 为数组中的所有记录设置指定键值
const updatedRecords = Process('utils.arr.mapset', records, 'status', 'active');

// 转换为树形结构
const treeSettings = {
  parent: 'parent_id', // 父级字段名
  id: 'id', // 主键字段名
  children: 'children' // 子级字段名
};
const tree = Process('utils.arr.tree', records, treeSettings);
```

### 映射表操作处理器示例

#### 基本操作

```javascript
// 获取映射表中指定键的值
const value = Process('utils.map.get', record, 'key');

// 设置映射表中指定键的值
const updatedRecord = Process('utils.map.set', record, 'key', 'value');

// 删除映射表中指定键
const recordAfterDel = Process('utils.map.del', record, 'key');

// 批量删除映射表中的多个键
const recordAfterDelMany = Process('utils.map.delmany', record, [
  'key1',
  'key2'
]);
```

#### 映射表信息获取

```javascript
// 获取映射表所有键名
const keys = Process('utils.map.keys', record);

// 获取映射表所有值
const values = Process('utils.map.values', record);

// 将映射表转换为键值对数组
const array = Process('utils.map.array', record);

// 合并两个映射表
const mergedRecord = Process('utils.map.merge', record1, record2);
```

### 验证码处理器示例

#### 生成验证码

```javascript
// 生成图形验证码
const captcha = Process('utils.captcha.Make', {
  width: '240',
  height: '80',
  lenght: '6',
  type: 'math',
  background: '#FFFFFF',
  lang: 'zh'
});

// 生成音频验证码
const audioCaptcha = Process('utils.captcha.Make', {
  type: 'audio',
  lang: 'zh'
});
```

#### 校验验证码

```javascript
// 校验验证码
const isValid = Process('utils.captcha.Verify', '验证码ID', '用户输入的验证码');
if (isValid) {
  console.log('验证码正确');
} else {
  console.log('验证码错误');
}
```

## 数据导入

数据导入功能用于导入 excel 文件到数据库中。

### 前提条件

- 导入的文件需要是 Excel 文件，后缀名为`.xlsx`。
- excel 文件中的第一行作为数据表头，第二行开始数据作为数据内容。
- 在运行处理器之前需要把文件上传到服务器上，并保存到 data 目录下。

### 处理过程

- 加载导入配置文件，提前配置数据导入的映射关系与处理器，此一步由程序员或是管理员配置。
- 加载数据，用户调用导入数据处理器，读取数据文件，进行数据导入。
- 数据清洗，根据导入配置文件中的配置调用脚本处理器进行数据校验或是处理。
- 保存数据。

### 数据准备

首先准备一个名称为`sku.xlsx`Excel 文件，文件内容如下,保存到目录 data 下，文件访问路径：`/data/sku.xlsx`。

| 物资名称 | 规格型号 | 预警库存 | 类目 | 单位 |
| -------- | -------- | -------- | ---- | ---- |
| 测试     | X,x1,x2  | 10       | 成品 | KG   |
| 测试 2   | X,x1,x2  | 10       | 成品 | KG   |

### 创建模型配置

创建一个模型配置`/models/material/sku.mod.json`，生成对应的数据库表，用于保存导入的数据。

```json
{
  "name": "物资单品",
  "table": {
    "name": "sku",
    "comment": "物资单品"
  },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "物资",
      "name": "material_id",
      "type": "bigInteger",
      "index": true,
      "comment": "所属物资"
    },
    {
      "label": "编码",
      "name": "sku_sn",
      "type": "string",
      "length": 32,
      "nullable": true,
      "unique": true,
      "comment": "SKU编码"
    },
    {
      "label": "单位",
      "name": "unit",
      "type": "string",
      "nullable": true,
      "comment": "计量单位"
    },
    {
      "label": "单价",
      "name": "price",
      "type": "decimal",
      "index": true,
      "nullable": true,
      "comment": "无税单价"
    },
    {
      "label": "税率",
      "name": "tax_rate",
      "type": "decimal",
      "index": true,
      "nullable": true,
      "comment": "税率"
    },
    {
      "label": "含税单价",
      "name": "tax_price",
      "type": "decimal",
      "index": true,
      "nullable": true,
      "comment": "含税单价"
    },
    {
      "label": "列账单价",
      "name": "fin_price",
      "type": "decimal",
      "index": true,
      "nullable": true,
      "comment": "列账单价"
    },
    {
      "label": "规格",
      "name": "specs",
      "type": "json",
      "nullable": true,
      "comment": "规格数值(KEY-VALUE)"
    },
    {
      "label": "预警库存",
      "name": "stock",
      "type": "bigInteger",
      "index": true,
      "default": 100,
      "comment": "预警库存"
    },
    { "label": "图片", "name": "images", "type": "json", "nullable": true },
    { "label": "介绍", "name": "detail", "type": "text", "nullable": true },
    {
      "label": "状态",
      "name": "status",
      "type": "enum",
      "default": "在产",
      "option": ["在产", "停产"],
      "index": true,
      "comment": "状态: 在产, 停产"
    }
  ],
  "relations": {
    "material": {
      "type": "hasOne",
      "model": "material",
      "key": "id",
      "foreign": "material_id",
      "query": {
        "withs": { "category": {}, "supplier": {} }
      }
    }
  },
  "option": { "timestamps": true, "soft_deletes": true }
}
```

### 配置规则制定

在使用数据导入之前需要作一些配置,在应用目录 imports 下创建一个文件，文件名格式为：`<导入规则>.json`，例如：`sku.json`。后缀名也可以是`yao`,`jsonc`。
配置规则包含以下的内容：

- 配置导入数据的处理器。
- 配置每一列数据的校验与更新的处理器。
- 配置模型字段与 exceel 文件中的字段的映射关系。

```json
{
  "title": "导入单品",
  "process": "scripts.imports.run.SKU",
  "output": "scripts.imports.run.SKUOUTPUT",
  "columns": [
    {
      "label": "物资名称",
      "name": "name",
      "match": ["物资名称", "物资", "名称", "material", "name"],
      "rules": [
        "scripts.imports.validate.Require",
        "scripts.imports.validate.Len"
      ]
    },
    {
      "label": "规格型号",
      "name": "specs",
      "match": ["规格型号", "规格", "型号", "specs"],
      "rules": ["scripts.imports.validate.Specs"]
    },
    {
      "label": "预警库存",
      "name": "stock",
      "match": ["预警库存", "库存预警", "stock"],
      "rules": [
        "scripts.imports.validate.Require",
        "scripts.imports.validate.Int"
      ]
    },
    {
      "label": "类目",
      "name": "category",
      "match": ["类目", "category", "类型"],
      "rules": [
        "scripts.imports.validate.Require",
        "scripts.imports.validate.Len"
      ]
    },
    {
      "label": "单位",
      "name": "unit",
      "match": ["单位", "包装", "unit"],
      "rules": ["scripts.imports.validate.Require"]
    }
  ],
  "option": {
    "chunkSize": 200,
    "mappingPreview": "auto",
    "dataPreview": "auto"
  },
  "rules": {
    "scripts.imports.validate.Require": "必填项验证",
    "scripts.imports.validate.Len": "长度校验",
    "scripts.imports.validate.Int": "数字校验",
    "scripts.imports.validate.Specs": "规格校验"
  }
}
```

配置文件具体说明如下：

```ts
export namespace YaoImport {
  /**数据导入器 */
  export interface Importer {
    /**版本【管理字段】 */
    version?: string;
    /**描述【管理字段】 */
    decription?: string;
    /**备注【管理字段】 */
    comment?: string;
    /**导入名称*/
    title?: string;
    /**处理器名称*/
    process: string;
    /**The process import output*/
    output?: string;
    /**字段列表，此字段是必须选项*/
    columns: Column[];
    /**导入配置项*/
    option?: Option;
    /**许可导入规则,配置用途，配置规则对应的名称或是说明*/
    rules?: { [key: string]: string };
  }

  /**导入字段定义 */
  export interface Column {
    /**字段标签 */
    label: string;
    /**模型字段名称 */
    name: string;
    /**字段名称(原始值),不需要配置*/
    field?: string;
    /**匹配建议 */
    match?: string[];
    /**清洗规则定义 */
    rules?: string[];
    /**是否可以为空 */
    nullable?: boolean;
    /**是否为主键 */
    primary?: boolean;
  }

  /**导入配置项定 */
  export interface Option {
    /**使用已匹配过的模板 */
    useTemplate?: boolean;
    /**默认数据模板链接 */
    templateLink?: string;
    /**每次处理记录数量,默认500条一次 */
    chunkSize?: number;
    /**显示字段映射界面方式 auto 匹配模板失败显示, always 一直显示, never 不显示 */
    mappingPreview?: string;
    /**数据预览界面方式 auto 有异常数据时显示, always 一直显示, never 不显示 */
    dataPreview?: string;
  }

  /**字段映射表*/
  export interface Mapping {
    /**数据表名称 */
    sheet: string;
    /**第一列的位置,一般是0 */
    colStart: number;
    /**第一行的位置，一般是0,会自动的跳过标题行 */
    rowStart: number;
    /**字段数据列表 */
    data: Binding[];
    /**是否自动匹配,未使用 */
    autoMatching: boolean;
    /**是否通过已传模板匹配,未使用 */
    templateMatching: boolean;
  }

  /** 数据绑定*/
  export interface Binding {
    /**Column中配置的字段名称 */
    label: string;
    /**模型字段名称 */
    field: string;
    /**EXCEL中Sheet表的字段名称 */
    name: string;
    /**源关联字段坐标 A1,B1,C1,D1*/
    axis: string;
    /**示例数据 */
    value: string;
    /**具体每一个字段对应的清洗规则，处理器列表 */
    rules: string[];
  }
}
```

#### 校验处理

```js
/**
 * 校验或是更新传入参数数值，用户可以检查数据是否合法，或是更新数据。
 * @param {*} value，当前字段值
 * @param {*} row，当前行数据
 * @returns {boolean} 返回数据组行数据表示成功更新，返回false表示此次检查失败，并不会更新数据。
 */
function Int(value, row) {
  if (parseInt(value) > 0) {
    return row;
  }
  return false;
}
```

### 处理列表

| 处理器                      | 说明             | 新版处理器                | 文档                          |
| --------------------------- | ---------------- | ------------------------- | ----------------------------- |
| xiang.import.Run            | 导入数据         | yao.import.Run            | [查看](#导入数据)             |
| xiang.import.Data           | 数据预览         | yao.import.Data           | [查看](#预览数据)             |
| xiang.import.Setting        | 查询导入配置     | yao.import.Setting        | [查看](#查询导入配置)         |
| xiang.import.DataSetting    | 查询数据预览配置 | yao.import.DataSetting    | [查看](#数据预览配置)         |
| xiang.import.Mapping        | 查询字段映射     | yao.import.Mapping        | [查看](#查询字段映射)         |
| xiang.import.MappingSetting | 查询字段映射配置 | yao.import.MappingSetting | [查看](#获取字段映射配置规则) |

### 查询字段映射

参数：

- `name`: 映射名称
- `file`: 文件路径

```sh
yao run yao.import.Mapping 'sku' "sku.xlsx"

```

返回具体某一个 excel 表中每一个字段的映射关系。

```json
{
  "autoMatching": true,
  "colStart": 1,
  "data": [
    {
      "axis": "A1",
      "field": "name",
      "label": "物资名称",
      "name": "物资名称",
      "rules": [
        "scripts.imports.validate.Require",
        "scripts.imports.validate.Len"
      ],
      "value": "测试"
    },
    {
      "axis": "B1",
      "field": "specs",
      "label": "规格型号",
      "name": "规格型号",
      "rules": ["scripts.imports.validate.Specs"],
      "value": "X,x1,x2"
    },
    {
      "axis": "C1",
      "field": "stock",
      "label": "预警库存",
      "name": "预警库存",
      "rules": [
        "scripts.imports.validate.Require",
        "scripts.imports.validate.Int"
      ],
      "value": "10"
    },
    {
      "axis": "D1",
      "field": "category",
      "label": "类目",
      "name": "类目",
      "rules": [
        "scripts.imports.validate.Require",
        "scripts.imports.validate.Len"
      ],
      "value": "成品"
    },
    {
      "axis": "E1",
      "field": "unit",
      "label": "单位",
      "name": "单位",
      "rules": ["scripts.imports.validate.Require"],
      "value": "KG"
    }
  ],
  "rowStart": 1,
  "sheet": "Sheet1",
  "templateMatching": false
}
```

### 获取字段映射配置规则

此处理器的功能主要是获取导入配置中每个字段的映射规则在前端的配置，主要用于前端界面的配置。
参数说明：

- `name`：导入规则的名称，用于查找对应的导入配置文件。
- `filename`：Excel 文件路径，用于查找对应的映射关系。

```sh
yao run yao.import.MappingSetting 'sku' "sku.xlsx"
```

返回结果：

```json
{
  "columns": {
    "字段名称": {
      "edit": {},
      "form": {},
      "label": "字段名称",
      "view": {
        "props": {
          "value": ":label"
        },
        "type": "label"
      }
    },
    "数据源": {
      "edit": {
        "props": {
          "options": [
            {
              "label": "物资名称",
              "value": "A1"
            },
            {
              "label": "规格型号",
              "value": "B1"
            },
            {
              "label": "预警库存",
              "value": "C1"
            },
            {
              "label": "类目",
              "value": "D1"
            },
            {
              "label": "单位",
              "value": "E1"
            }
          ],
          "value": ":axis"
        },
        "type": "select"
      },
      "form": {},
      "label": "数据源",
      "view": {
        "props": {
          "value": ":name"
        },
        "type": "label"
      }
    },
    "数据示例": {
      "edit": {},
      "form": {},
      "label": "数据示例",
      "view": {
        "props": {
          "value": ":value"
        },
        "type": "label"
      }
    },
    "清洗规则": {
      "edit": {
        "props": {
          "mode": "multiple",
          "options": [
            {
              "label": "数字校验",
              "value": "scripts.imports.validate.Int"
            },
            {
              "label": "长度校验",
              "value": "scripts.imports.validate.Len"
            },
            {
              "label": "必填项验证",
              "value": "scripts.imports.validate.Require"
            },
            {
              "label": "规格校验",
              "value": "scripts.imports.validate.Specs"
            }
          ],
          "value": ":rules"
        },
        "type": "select"
      },
      "form": {},
      "label": "清洗规则",
      "view": {
        "props": {
          "value": ":rules"
        },
        "type": "tag"
      }
    }
  },
  "filters": {},
  "list": {
    "layout": {
      "columns": [
        {
          "name": "字段名称"
        },
        {
          "name": "数据源"
        },
        {
          "name": "清洗规则",
          "width": 300
        },
        {
          "name": "数据示例"
        }
      ]
    },
    "option": {
      "operation": {
        "hideEdit": true,
        "hideView": true,
        "width": 0
      }
    },
    "primary": "field"
  }
}
```

### 预览数据

使用 `yao.import.Data` 处理器可以预览 Excel 文件的数据内容。
参数说明：

- `name`：导入规则的名称，用于查找对应的导入配置文件。
- `filename`：Excel 文件路径，用于查找对应的映射关系。
- `page`: 分页参数，用于分页查询数据,当前第几页。
- `size`: 每页显示的数据量。
- `mapping`: 导入映射关系，用于将 Excel 中的数据映射到数据库中的字段。

```sh
yao run yao.import.Data "sku" "sku.xlsx" 0 10 "null"
```

返回数据：

```json
{
  "data": [
    {
      "__effected": true,
      "category": "成品",
      "id": 1,
      "name": "测试",
      "specs": "X,x1,x2",
      "stock": "10",
      "unit": "KG"
    },
    {
      "__effected": true,
      "category": "成品",
      "id": 2,
      "name": "测试2",
      "specs": "X,x1,x2",
      "stock": "10",
      "unit": "KG"
    }
  ],
  "next": 2,
  "page": 1,
  "pagecnt": 10,
  "pagesize": 10,
  "prev": 0
}
```

### 查询导入配置

使用 `yao.import.Setting` 处理器可以查询和设置数据导入的相关配置。

```sh
yao run yao.import.Setting sku
```

返回结果：

```json
{
  "dataPreview": "auto",
  "mappingPreview": "auto",
  "templateLink": "",
  "title": "导入单品"
}
```

### 数据预览配置

使用 `yao.import.DataSetting` 数据预览表格配置，主要用于前端显示配置。

#### 参数说明

- `name`: 规则名称

#### 使用示例

```bash
## 设置预览5行数据
yao run yao.import.DataSetting sku
```

返回结果：

```json
{
  "columns": {
    "单位": {
      "edit": {},
      "form": {},
      "label": "单位",
      "view": {
        "props": {
          "value": ":unit"
        },
        "type": "label"
      }
    },
    "物资名称": {
      "edit": {},
      "form": {},
      "label": "物资名称",
      "view": {
        "props": {
          "value": ":name"
        },
        "type": "label"
      }
    },
    "类目": {
      "edit": {},
      "form": {},
      "label": "类目",
      "view": {
        "props": {
          "value": ":category"
        },
        "type": "label"
      }
    },
    "规格型号": {
      "edit": {},
      "form": {},
      "label": "规格型号",
      "view": {
        "props": {
          "value": ":specs"
        },
        "type": "label"
      }
    },
    "预警库存": {
      "edit": {},
      "form": {},
      "label": "预警库存",
      "view": {
        "props": {
          "value": ":stock"
        },
        "type": "label"
      }
    }
  },
  "filters": {},
  "list": {
    "actions": {
      "pagination": {
        "props": {
          "showTotal": true
        }
      }
    },
    "layout": {
      "columns": [
        {
          "name": "物资名称"
        },
        {
          "name": "规格型号"
        },
        {
          "name": "预警库存"
        },
        {
          "name": "类目"
        },
        {
          "name": "单位"
        }
      ]
    },
    "option": {
      "operation": {
        "checkbox": [
          {
            "status": [
              {
                "label": "有效",
                "value": true
              },
              {
                "label": "无效",
                "value": false
              }
            ],
            "value": ":__effected",
            "visible_label": false
          }
        ],
        "hideEdit": true,
        "hideView": true,
        "unfold": true,
        "width": 120
      }
    },
    "primary": "id"
  }
}
```

### 导入数据

使用 `yao.import.Run` 处理器可以将 Excel 文件数据导入到指定的数据表中。支持 .xlsx 和 .xls 格式的文件，可以设置字段映射关系和数据转换规则。

处理器会调用导入规则中的 process 处理器。用户需要在处理器处理数据的最终处理逻辑。

```js
/**
 * 导入单品数据
 * @param {array} columns,数据库字段列表,最后一个字段是"__effected"，表示是否检查成功。
 * @param {array} data,需要保存的数据，最后一个字段是true/false，true表示全部校验检查成功，false表示部分检查失败。
 * @param {string} uuid,导入数据的唯一标识，用于区分导入数据
 * @param {number} page,导入数据的页码，用于分页导入
 * @returns [failure,ignore] 导入失败的数据的数量，导入忽略的数据的数量
 */
function SKU(columns, rows, uuid, page) {
  console.log(columns, rows);

  columns = ['name', 'specs', 'stock', 'category', 'unit', '__effected'];
  rows = [
    ['测试', 'X,x1,x2', '10', '成品', 'KG', true],
    ['测试2', 'X,x1,x2', '10', '成品', 'KG', true]
  ];

  return [failure, ignore];
}
```

#### output 处理器

用户还可以配置 output 处理器，对导入的数据进行二次处理，比如对数据进行校验，或者对数据进行格式化等操作。

```js
**
 * 导入后的数据处理
 * @param {object} data 导入结果数据
 * @returns {object} 返回处理后的统计结果，包含以下字段：
 *  - total: 总记录数
 *  - success: 成功导入数量
 *  - failure: 失败数量
 *  - ignore: 忽略数量
 */
function SKUOUTPUT(data) {
  const total = data.total || 0;
  const failed = data.failure || 0;
  const ignore = data.ignore || 0;

  return {
    total: total,
    success: data.success || 0,
    failure: failed,
    ignore: ignore
  };
}

```

> **注意事项：**
>
> 1. Excel 文件需要放在应用的 data 目录下
> 2. 导入前建议先使用数据预览功能检查数据格式
> 3. 用户需要自己实现数据保存处理逻辑
> 4. 用户需要自己实现数据校验逻辑
> 5. 支持大文件分批导入

#### 错误处理

导入过程中可能遇到以下错误：

1. 文件错误

   - 文件不存在或无法访问
   - 文件格式不正确

2. 数据错误

   - 必填字段为空
   - 数据类型转换失败
   - 唯一性约束冲突
   - 外键约束失败

3. 系统错误
   - 数据库连接失败
   - 内存不足
   - 磁盘空间不足

#### 使用示例

```bash
## 基本导入示例
## 需要3个参数，第一个参数IMPORT定义，第二个参数为文件路径，第三个参数为映射关系
## 映射关系结构类型参考Mapping,如果没有传入映射关系，会自动生成映射关系。
yao run yao.import.Run "sku" "sku.xlsx" "null"

```

## 数据表格

数据表格相关处理器。

数据表格用来处理列表页面的表格布局

`tables`表格中内置了许多处理器为我们提供完整的表格数据/布局处理，命名空间为 table.<表格名称>；

| 处理器                | 说明                                     | 文档 ` |
| --------------------- | ---------------------------------------- | ------ |
| yao.table.Search      | 按条件查询, 分页。                       |        |
| yao.table.Find        | 按主键查询单条数据。                     |        |
| yao.table.Select      | 返回数据集合，匹配选择器组件数据结构。   |        |
| yao.table.Save        | 保存单条记录，指定主键更新，不指定创建。 |        |
| yao.table.Delete      | 按主键删除单条记录。                     |        |
| yao.table.Insert      | 批量新增记录。                           |        |
| yao.table.UpdateWhere | 批量更新符合条件的记录。                 |        |
| yao.table.DeleteWhere | 批量删除符合条件的记录。                 |        |
| yao.table.QuickSave   | 保存多条记录，指定主键更新，不指定创建。 |        |
| yao.table.UpdateIn    | 批量更新指定一组主键的的数据记录。       |        |
| yao.table.DeleteIn    | 批量删除指定一组主键的的数据记录。       |        |
| yao.table.Setting     | 读取数据表格配置信息, 用于前端界面渲染   |        |

## 文件处理

使用 FS 对象实现文件操作。 Yao 提供 data, app 两个空间, data 用于应用数据操作, app 用于应用级别的文件操作

### 文件处理器列表

| 处理器                     | 说明                       | 参数                                                                                    | 返回值                            |
| -------------------------- | -------------------------- | --------------------------------------------------------------------------------------- | --------------------------------- |
| fs.system.Upload           | 上传文件到应用 `data` 目录 | file: 上传的文件对象                                                                    | 上传后的文件路径                  |
| fs.system.ReadFile         | 读取文件内容               | file: 文件路径                                                                          | 文件内容(字符串)                  |
| fs.system.ReadFileBuffer   | 读取文件内容为二进制       | file: 文件路径                                                                          | 文件内容(二进制)                  |
| fs.system.WriteFile        | 写入文件内容               | file: 文件路径<br>content: 文件内容<br>perm: 权限(可选,默认 0644)                       | 写入的字节数                      |
| fs.system.WriteFileBuffer  | 写入二进制内容             | file: 文件路径<br>content: 二进制内容<br>perm: 权限(可选,默认 0644)                     | 写入的字节数                      |
| fs.system.AppendFile       | 追加文件内容               | file: 文件路径<br>content: 追加内容<br>perm: 权限(可选,默认 0644)                       | 写入的字节数                      |
| fs.system.AppendFileBuffer | 追加二进制内容             | file: 文件路径<br>content: 二进制内容<br>perm: 权限(可选,默认 0644)                     | 写入的字节数                      |
| fs.system.InsertFile       | 在指定位置插入内容         | file: 文件路径<br>offset: 插入位置<br>content: 插入内容<br>perm: 权限(可选,默认 0644)   | 写入的字节数                      |
| fs.system.InsertFileBuffer | 在指定位置插入二进制       | file: 文件路径<br>offset: 插入位置<br>content: 二进制内容<br>perm: 权限(可选,默认 0644) | 写入的字节数                      |
| fs.system.ReadDir          | 读取目录内容               | dir: 目录路径<br>recursive: 是否递归(可选,默认 false)                                   | 文件列表                          |
| fs.system.Mkdir            | 创建目录                   | dir: 目录路径<br>perm: 权限(可选,默认 0755)                                             | 无                                |
| fs.system.MkdirAll         | 递归创建目录               | dir: 目录路径<br>perm: 权限(可选,默认 0755)                                             | 无                                |
| fs.system.MkdirTemp        | 创建临时目录               | dir: 父目录(可选)<br>pattern: 目录名模式(可选)                                          | 临时目录路径                      |
| fs.system.Remove           | 删除文件或空目录           | path: 路径                                                                              | 无                                |
| fs.system.RemoveAll        | 递归删除目录               | path: 路径                                                                              | 无                                |
| fs.system.Exists           | 检查文件是否存在           | path: 路径                                                                              | bool                              |
| fs.system.IsDir            | 检查是否为目录             | path: 路径                                                                              | bool                              |
| fs.system.IsFile           | 检查是否为文件             | path: 路径                                                                              | bool                              |
| fs.system.IsLink           | 检查是否为链接             | path: 路径                                                                              | bool                              |
| fs.system.Chmod            | 修改权限                   | path: 路径<br>perm: 权限                                                                | 无                                |
| fs.system.Size             | 获取文件大小               | path: 路径                                                                              | 文件大小(字节)                    |
| fs.system.Mode             | 获取文件权限               | path: 路径                                                                              | 权限值                            |
| fs.system.ModTime          | 获取修改时间               | path: 路径                                                                              | 时间戳                            |
| fs.system.BaseName         | 获取文件名                 | path: 路径                                                                              | 文件名                            |
| fs.system.DirName          | 获取目录名                 | path: 路径                                                                              | 目录名                            |
| fs.system.ExtName          | 获取扩展名                 | path: 路径                                                                              | 扩展名                            |
| fs.system.MimeType         | 获取 MIME 类型             | path: 路径                                                                              | MIME 类型                         |
| fs.system.Move             | 移动文件或目录             | src: 源路径<br>dst: 目标路径                                                            | 无                                |
| fs.system.MoveAppend       | 移动并追加内容             | src: 源路径<br>dst: 目标路径                                                            | 无                                |
| fs.system.MoveInsert       | 移动并插入内容             | src: 源路径<br>dst: 目标路径<br>offset: 插入位置                                        | 无                                |
| fs.system.Copy             | 复制文件或目录             | src: 源路径<br>dst: 目标路径                                                            | 无                                |
| fs.system.Download         | 下载文件                   | file: 文件路径                                                                          | {content:文件内容,type:MIME 类型} |
| fs.system.Zip              | 压缩文件或目录             | src: 源路径<br>dst: 目标路径                                                            | 无                                |
| fs.system.Unzip            | 解压缩文件                 | src: 源文件<br>dst: 目标目录                                                            | 解压的文件列表                    |
| fs.system.Glob             | 按模式匹配文件             | pattern: 匹配模式                                                                       | 匹配的文件列表                    |
| fs.system.Merge            | 合并文件                   | sourceFiles: 源文件列表<br>target: 目标文件                                             | 无                                |

### 文件上传下载示例

#### 文件上传

上传文件操作，上传文件名为 file 的文件，新建`/apis/storage.http.json`代码如下：

```json
{
  "name": "存储接口",
  "version": "1.0.0",
  "description": "存储接口API",
  "group": "storage",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/upload",
      "method": "POST",
      "guard": "-",
      "process": "flows.upload",
      "in": ["$file.file"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

新建`/flows/upload.flow.json`代码如下：

```json
{
  "label": "上传文件",
  "version": "1.0.0",
  "description": "上传文件",
  "nodes": [
    {
      "name": "上传",
      "process": "fs.system.Upload",
      "args": ["{{$in.0}}"]
    }
  ],
  "output": "{{$res.上传}}"
}
```

#### 文件下载

导出 Excel 操作，新建路由文件：`/apis/utils.http.json`代码如下：

```json
{
  "name": "下载Excel",
  "version": "1.0.0",
  "description": "下载Excel",
  "group": "utils",
  "guard": "-",
  "paths": [
    {
      "guard": "-",
      "path": "/export/:name",
      "method": "GET",
      "process": "flows.utils.export",
      "in": ["$param.name"],
      "out": {
        "status": 200,
        "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "headers": {
          "Content-Disposition": "attachment;filename=导出数据.xlsx"
        }
      }
    }
  ]
}
```

新建文件：`/flows/utils/export.flow.json`代码如下：

```json
{
  "label": "下载",
  "version": "1.0.0",
  "description": "下载",
  "nodes": [
    {
      "name": "文件",
      "process": "xiang.table.Export",
      "args": ["{{$in.0}}", {}, 20]
    },
    {
      "name": "数据",
      "process": "fs.system.ReadFile",
      "args": ["{{$res.文件}}", false]
    }
  ],
  "output": "{{$res.数据.content}}"
}
```

假如有一个表格名字叫：`/tables/pet.tab.json`，导出表格的列表数据只需要请求：`/utils/export/pet`

### 文件操作示例

#### 基础文件操作

```javascript
// 创建文件系统对象
var fs = new FS('data'); // 操作应用数据目录
var fs_app = new FS('app'); // 操作应用目录

// 读写文件
var content = fs.ReadFile('/test.txt'); // 读取文件内容
var length = fs.WriteFile('/test.txt', 'Hello World', 0644); // 写入文件
var length = fs.AppendFile('/test.txt', '\nNew Line'); // 追加内容

// 二进制文件操作
var buffer = fs.ReadFileBuffer('/image.png'); // 读取二进制
var length = fs.WriteFileBuffer('/copy.png', buffer); // 写入二进制

// 文件属性
var exists = fs.Exists('/test.txt'); // 检查文件是否存在
var size = fs.Size('/test.txt'); // 获取文件大小
var time = fs.ModTime('/test.txt'); // 获取修改时间
var mime = fs.MimeType('/test.txt'); // 获取MIME类型

// 文件路径操作
var name = fs.BaseName('/path/to/file.txt'); // 获取文件名: file.txt
var dir = fs.DirName('/path/to/file.txt'); // 获取目录名: /path/to
var ext = fs.ExtName('/path/to/file.txt'); // 获取扩展名: .txt
```

#### 目录操作

```javascript
// 创建和删除目录
fs.Mkdir('/newdir'); // 创建目录
fs.MkdirAll('/path/to/newdir'); // 递归创建目录
fs.Remove('/emptydir'); // 删除空目录
fs.RemoveAll('/dir'); // 递归删除目录

// 临时目录
var tempDir = fs.MkdirTemp(); // 创建临时目录
var tempDir = fs.MkdirTemp('/base', 'prefix-*'); // 在指定目录创建临时目录

// 读取目录
var files = fs.ReadDir('/path'); // 读取目录内容
var allFiles = fs.ReadDir('/path', true); // 递归读取目录

// 目录属性
var isDir = fs.IsDir('/path'); // 检查是否为目录
var mode = fs.Mode('/path'); // 获取目录权限
```

#### 文件移动和复制

```javascript
// 移动文件
fs.Move('/source.txt', '/dest.txt'); // 移动文件
fs.MoveAppend('/source.txt', '/dest.txt'); // 移动并追加到目标
fs.MoveInsert('/source.txt', '/dest.txt', 100); // 移动并在指定位置插入

// 复制文件
fs.Copy('/source.txt', '/dest.txt'); // 复制文件
fs.Copy('/sourcedir', '/destdir'); // 复制目录
```

#### 压缩和解压

```javascript
// 压缩文件和目录
fs.Zip('/source', '/archive.zip'); // 压缩文件或目录
fs.Unzip('/archive.zip', '/extract'); // 解压文件

// 文件合并
fs.Merge(['file1.txt', 'file2.txt'], 'merged.txt'); // 合并多个文件

// 文件匹配
var matches = fs.Glob('*.txt'); // 按模式匹配文件
```

**约定**

1. 示例中约定应用根目录为 `/data/app`, 实际编写时需替换为应用根目录。
2. 使用 `<>` 标识自行替换的内容。 例如: `icon-<图标名称>`, 实际编写时应替换为: `icon-foo`, `icon-bar` ...

| 空间 | 根目录         | 说明     |
| ---- | -------------- | -------- |
| data | /data/app/data | 应用数据 |
| app  | /data/app      | 应用目录 |

源码: https://github.com/YaoApp/gou/blob/main/runtime/v8/objects/fs/fs.go

## 日期处理

## 网络请求

网络请求处理器用于发送各种 HTTP 请求，支持 GET、POST、PUT、PATCH、DELETE、HEAD 等方法。

### 处理器列表

| 处理器        | 说明                                          | 参数格式                                                                                        |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| http.Get      | 发送 HTTP GET 请求                            | `[<URL>, <Query (可选)>, <Headers (可选)>]`                                                     |
| http.Post     | 发送 HTTP POST 请求                           | `[<URL>, <Payload (可选)>, <Files (可选)>, <Query(可选)>, <Headers (可选)>]`                    |
| http.PostJSON | 发送 HTTP POST 请求，payload 为 JSON 格式数据 | `[<URL>, <Payload>, <Headers (可选)>]`                                                          |
| http.Put      | 发送 HTTP PUT 请求                            | `[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`                                    |
| http.PutJSON  | 发送 HTTP PUT 请求，payload 为 JSON 格式数据  | `[<URL>, <Payload>, <Headers (可选)>]`                                                          |
| http.Patch    | 发送 HTTP PATCH 请求                          | `[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`                                    |
| http.Delete   | 发送 HTTP DELETE 请求                         | `[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`                                    |
| http.Head     | 发送 HTTP HEAD 请求                           | `[<URL>, <Payload (可选)>, <Query(可选)>, <Headers (可选)>]`                                    |
| http.Send     | 发送任意 HTTP 请求                            | `[<METHOD>, <URL>, <Payload (可选)>, <Query (可选)>, <Headers (可选)>, <Files(可选)>]`          |
| http.Stream   | 发送流式 HTTP 请求                            | `[<METHOD>, <URL>, <Handler process name>, <Payload (可选)>, <Query (可选)>, <Headers (可选)>]` |

### 参数说明

- **URL**: 请求地址，字符串类型
- **Query**: 查询参数，支持以下格式：
  - 对象格式：`Record<string, string>`
  - 键值对数组：`[string, string][]`
  - 对象数组：`Array<Record<string, string>>`
  - 字符串：`string`
- **Payload**: 请求体数据，支持任意类型（any）
- **Headers**: 请求头，支持以下格式：
  - 单个对象：`Record<string, string>`
  - 对象数组：`Record<string, string>[]`
- **Files**: 上传文件，支持以下格式：
  - 文件映射：`Record<string, string>`，key 为文件字段名，value 为文件路径
  - 文件数组：`HttpFile[]`，用于 Send 方法的文件上传
- **METHOD**: HTTP 请求方法，如 GET、POST、PUT 等
- **Handler process name**: Stream 请求的处理器名称，回调函数需返回：
  - 1: 继续接收数据
  - 0: 停止接收
  - -1: 发生异常

#### 文件上传类型

```typescript
interface UploadFile {
  uid?: string; // 文件唯一标识（用于分片上传）
  range?: string; // 分片范围，格式：bytes start-end/total
  sync?: boolean; // 是否同步上传，默认false
  name: string; // 文件名
  tempFile: string; // 临时文件路径
  size: number; // 文件大小
  header: {
    // 文件MIME头信息
    [key: string]: string[];
  };
  error?: string; // 错误信息
}
```

### 返回值

所有 HTTP 请求处理器返回一个 HttpResponse 对象，包含以下字段：

```typescript
interface HttpResponse {
  status: number; // HTTP 状态码
  headers: {
    // 响应头
    [key: string]: string[];
  };
  data: any; // 响应体
  error?: string; // 错误信息，可选
}

// 文件上传响应
type UploadFileResponse =
  | string
  | {
      path: string; // 文件路径或URL
      progress?: {
        // 上传进度信息
        total: number; // 总字节数
        uploaded: number; // 已上传字节数
        completed: boolean; // 是否完成
      };
      uid?: string; // 文件唯一标识（用于分片上传）
      [key: string]: any; // 其他额外信息
    };
```

### 使用示例

#### 发送 GET 请求

```javascript
var response = Process('http.Get', url, params, {
  'Content-Type': 'application/json',
  Auth: 'token'
});
```

#### 发送 POST 请求

```javascript
let response = Process('http.PostJSON', url, data, {
  'Content-Type': 'application/json',
  Auth: 'token'
});
```

发送 PATCH 请求示例：`http.Send`

```json
   let response = Process("http.Send", "PATCH", url, {}, body, {
     "Content-Type": "application/json",
    "Auth": "token",
  });
```

发送 DELETE 请求示例：`http.Send`

```javascript
let response = Process('http.Send', 'DELETE', url, {}, body, {
  'Content-Type': 'application/json',
  Auth: 'token'
});
```

使用 http 对象发送 HTTP 请求，参数表与返回值与 http.\* 处理器一致

#### 发送流式请求

使用 http.Stream 处理器发送流式请求时，需要提供一个处理器函数来处理响应数据,在 handler 函数中，返回 1 表示继续接收数据，返回 0 表示停止接收，返回-1 表示异常。

```javascript
let response = Process('http.Stream', 'POST', url, 'handler', payload, {
  Accept: 'text/event-stream; charset=utf-8',
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + token
});

// 处理器函数示例
function handler(payload) {
  // 处理接收到的数据
  console.log(payload);
  return 1; // 返回1表示继续接收数据，返回0表示停止接收，返回-1表示异常
}
```

**约定**

1. 示例中约定应用根目录为 `/data/app`, 实际编写时需替换为应用根目录。
2. 使用 `<>` 标识自行替换的内容。 例如: `icon-<图标名称>`, 实际编写时应替换为: `icon-foo`, `icon-bar` ...

**示例**

**System**

`/data/app/scripts/test.js`

```javascript
function HttpTest() {
  // Get
  http.Get('http://127.0.0.1/get?foo=bar');
  http.Get('http://127.0.0.1/get?foo=bar', { hello: 'world' });
  http.Get(
    'http://127.0.0.1/get?foo=bar',
    { hello: 'world' },
    { Auth: 'Test' }
  );

  // Post
  http.Post('http://127.0.0.1/path?foo=bar');
  http.Post('http://127.0.0.1/path?foo=bar', { name: 'Lucy' });
  http.Post('http://127.0.0.1/path?foo=bar', { name: 'Lucy' }, null, {
    hello: 'world'
  });
  http.Post(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    null,
    { hello: 'world' },
    { Auth: 'Test' }
  );

  // Post File via payload 文件路径为相对路径 相对地址, 示例: `/text/foo.txt`, 绝对路径为: `/data/app/data/text/foo.txt`。
  http.Post('http://127.0.0.1/path?foo=bar', '/path/root/file');

  // Post File via files
  http.Post(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { f1: '/path/root/f1', f2: '/path/root/f2' }
  );

  // Patch
  http.Patch('http://127.0.0.1/path?foo=bar');
  http.Patch('http://127.0.0.1/path?foo=bar', { name: 'Lucy' });
  http.Patch(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' }
  );
  http.Patch(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' },
    { Auth: 'Test' }
  );

  // Put
  http.Put('http://127.0.0.1/path?foo=bar');
  http.Put('http://127.0.0.1/path?foo=bar', { name: 'Lucy' });
  http.Put(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' }
  );
  http.Put(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' },
    { Auth: 'Test' }
  );

  // Delete
  http.Delete('http://127.0.0.1/path?foo=bar');
  http.Delete('http://127.0.0.1/path?foo=bar', { name: 'Lucy' });
  http.Delete(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' }
  );
  http.Delete(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' },
    { Auth: 'Test' }
  );

  // Head
  http.Head('http://127.0.0.1/path?foo=bar');
  http.Head('http://127.0.0.1/path?foo=bar', { name: 'Lucy' });
  http.Head(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' }
  );
  http.Head(
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' },
    { Auth: 'Test' }
  );

  // Send
  http.Send('POST', 'http://127.0.0.1/path?foo=bar');
  http.Send('POST', 'http://127.0.0.1/path?foo=bar', { name: 'Lucy' });
  http.Send(
    'POST',
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' }
  );
  http.Send(
    'POST',
    'http://127.0.0.1/path?foo=bar',
    { name: 'Lucy' },
    { hello: 'world' },
    { Auth: 'Test' }
  );
}
```

## 环境变量

### Yao 命令环境变量

| 变量     | 说明                                 | 默认值 | 示例  |
| -------- | ------------------------------------ | ------ | ----- |
| YAO_LANG | 命令行语言 en-US 英语 zh-CN 简体中文 | en-US  | zh-CN |

### 应用环境变量

| 变量           | 说明                                                    | 默认值       | 示例                                                                         |
| -------------- | ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| YAO_ENV        | 运行模式 development 开发环境 <br/> production 生产环境 | production   | production                                                                   |
| YAO_ROOT       | 应用目录                                                | 当前目录 .   | /data/app                                                                    |
| YAO_HOST       | WEB 服务 HOST                                           | 0.0.0.0      | 127.0.0.1                                                                    |
| YAO_PORT       | WEB 服务端口                                            | 5099         | 5099                                                                         |
| YAO_LOG        | 应用日志文件位置                                        | 系统标准输出 | /data/app/logs/application.log                                               |
| YAO_LOG_MODE   | 日志格式 TEXT \| JSON                                   | TEXT         | JSON                                                                         |
| YAO_JWT_SECRET | JWT 密钥                                                | 默认为空     | bLp@bi!oqo-2U+hoTRUG                                                         |
| YAO_DB_DRIVER  | 数据库驱动 mysql \| sqlite3                             | sqlite3      | mysql                                                                        |
| YAO_DB_PRIMARY | 主库连接                                                | ./db/yao.db  | root:123456@tcp(db-server:3306)/yao?charset=utf8mb4&parseTime=True&loc=Local |
| YAO_DB_PRIMARY | 从库连接                                                | 空           | root:123456@tcp(db-server:3306)/yao?charset=utf8mb4&parseTime=True&loc=Local |
| YAO_DB_AESKEY  | 加密字段密钥 (MySQL Only)                               | 空           | ZLX=T&f6refeCh-ro\*r@                                                        |
