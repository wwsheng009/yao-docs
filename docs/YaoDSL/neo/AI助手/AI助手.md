# AI代理

## AI助手

通过配置Function Tool与Prompt Template，可以让AI模型变成一个AI助手。

在Yao中可以使用AI代理来完成一些复杂的任务，例如：

- 调用第三方API
- 调用本地的工具

## Function Call

通过Json定义声明给告知本地工具函数的作用与参数，AI模型在处理过程中返回调用本地工具函数的参数与函数名。

### 函数声明

创建一个 tools 对象，包含一个或多个 function declarations。使用 JSON 定义函数。单个函数声明可以包含以下参数：

- name（字符串）：API 调用中函数的唯一标识符。
- description（字符串）：全面说明函数的用途和功能。
- parameters（对象）：定义函数所需的输入数据。
- type（字符串）：指定整体数据类型，例如 object。
- properties（对象）：列出各个参数，每个参数均包含：
- type（字符串）：参数的数据类型，例如 string、integer、boolean。
- description（字符串）：清楚地说明参数的用途和预期格式。
- required（数组）：一个字符串数组，用于列出函数运行所必需的参数名称。

### 函数声明的最佳实践

在将函数集成到请求中时，准确定义函数至关重要。每个函数都依赖于特定参数，这些参数可指导其行为并与模型互动。以下列表提供了有关在 functions_declarations 数组中定义各个函数参数的指南。

name：使用清晰、描述性强的名称，不含空格、英文句点 (.) 或短划线 (-) 字符。请改用下划线 (\_) 字符或驼峰式命名法。

description：提供详细、清晰且具体的函数说明，并根据需要提供示例。例如，使用 find theaters based on location and optionally movie title that is currently playing in theaters. 取代 find theaters。避免使用过于宽泛或模糊的说明。

properties > type：使用强类型参数来减少模型幻觉。例如，如果参数值来自有限集，请使用 enum 字段，而不是在说明中列出值（例如"type": "enum", "values": ["now_playing", "upcoming"]）。如果参数值始终是整数，请将类型设置为 integer，而不是 number。

properties > description：提供具体的示例和限制。 例如，使用 The city and state, e.g. San Francisco, CA or a zip code e.g. 95616 取代 the location to search。

## 调用第三方API

## 定义一个助手

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

### 助手配置文件Package.json

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
  // 助手名称,用于显示
  "name": "model-assistant",

  // 类型,固定为"assistant"
  "type": "assistant",

  // 助手描述
  "description": "This is a test assistant",

  // 助手ID,唯一标识符
  "assistant_id": "model",

  // 是否可以被提及(@)
  "mentionable": true,

  // 是否为自动化助手
  "automated": false,

  // 是否只读，如果通过文件配置的方式，readonly=true
  "readonly": false,

  // 是否为内置助手
  "built_in": false,

  // 排序值
  "sort": 0,

  // 助手目录路径
  "path": "model",

  // 使用的AI模型连接器
  "connector": "deepseek-reasoner",

  // 创建时间
  "created_at": "2022-02-22T14:00:00.000Z",

  // 标签列表
  "tags": ["test"],

  // AI模型参数配置
  "options": {
    // 温度参数,控制输出的随机性(0-1)
    "temperature": 0.7,

    // 最大输出token数
    "max_tokens": 8192,

    // 核采样阈值
    "top_p": 1,

    // 频率惩罚系数
    "frequency_penalty": 0,

    // 存在惩罚系数
    "presence_penalty": 0
  },

  // 头像URL，在Xgen中显示
  "avatar": "https://cdn.pixabay.com/photo/2016/08/20/05/38/avatar-1606916_960_720.png",

  // 提示词内容
  "prompts": ""
}
```

### Prompt配置文件Prompts.yml

助手提示文件(prompts.yml)是一个YAML格式的文件,用于定义助手的提示词。主要包含以下字段:

| 字段名  | 类型   | 说明                                                     |
| ------- | ------ | -------------------------------------------------------- |
| role    | string | 角色类型,可选值: system/user/assistant，可以配置多个提示 |
| name    | string | 提示词名称,用于标识不同的提示词                          |
| content | string | 提示词内容,支持多行文本和引用assets目录下的文件          |

示例配置如下,可以使用`@assets/`引用assets目录的文件，一般都是提示词内容

```yaml
- role: system
  name: documentation
  content: |
    - you are an AI assistant that translates the given DSL definition into a Yao model definition.
    - @assets/yao.md
```

### src/index.ts

助手源码文件(src/index.ts)是一个TypeScript格式的文件,用于定义助手的业务逻辑。主要包含以下钩子函数:

- Create: 助手被第一次调用时触发
- Done: 聊天结束触发
- Fail: 聊天出错触发

#### Create

Create钩子函数用于在助手被第一次调用时触发数。

- 可在以此钩子函数中提出mention对象
- 修改助手id,切换不同的助手
- 修改用户输入

```ts
/**
 * user request -> [Create hook] -> openai
 *
 * called before the chat with openai.
 *
 * @param input The input message array.
 * @returns A response object containing the next action, input messages, and output data.
 */

export function Create(
  input: neo.Message[],
  option: { [key: string]: any }
): neo.ResHookInit | null | string {}
```

这个钩子函数有以下功能：

- 修改助手id,比如返回新的助手id，可以切换助手进行问题处理。

```js
return {
  assistant_id: new_assistant_id, //optional,change the assistant_id,switch the assistant for following process
  chat_id: context.chat_id //optional
};
```

- 修改AI的输入提问

```js
// input 是用户输入的问题
//
input.pop();
input.push({
  role: 'user',
  text: content,
  type: 'text'
});
return {
  input: input
};
```

#### Done

在api调用结束后触发。

可以在Done钩子函数中做以下处理：

- 处理tool工具回调处理
- 调用其它的处理器
- 修改AI的输出
- 设置下一个调用的助手，构成一个处理链。

```ts
/**
 * called only once, when the call openai api done,open ai return messages
 *
 * @param input input messages
 * @param output messages
 * @returns
 */
function Done(
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

- 调用其它的处理器
  - action: assistant,其它助手
  - action: exit,退出处理

```js
return {
  next: {
    //optional, if you want to call another action in frontend
    action: 'assistant', //call other assistant，set to 'exit' to exit process
    payload: {
      assistant_id: new_assistant_id,
      input: input, //string,对象，Message对象
      retry: 1, //重试
      options: {
        //llm options
        max_tokens: 8192
      }
    }
  }
};
```

在Done钩子函数中还可以其它的处理：[回调函数](回调函数.md)

#### Fail

当 ai 返回错误消息时触发。

```ts
/**
 * called every time when the call openai api failed,open ai return error messages
 *
 * @param input input messages
 * @param error string
 * @returns {next,input,output}
 */
function Fail(input: neo.Message[], error: string): neo.ResHookFail | null {
  // case 1 return null,no change
  // return null
  return null;

  // return error message
  return 'custom error message';

  // case 2 return object
  return {
    output: 'custom error message', //修改输出的消息
    error: 'error message' //修改输出的错误消息，最高优先级
  };
}
```

#### Retry

当Hook Done调用出错时，重试API调用。

```ts
/**
 * called every time when the call openai api failed,open ai return error messages
 *
 * @param lastInput last input messages
 * @param output output messages
 * @param errmsg error message
 * @returns {next,input,output}
 */
function Retry(
  lastInput: string
  input: neo.Message[]
  errmsg: string
): neo.ResHookFail | null {
  // case 1 return null,no change
  return null;
  // case 2 return new prompt
  return 'new prompt';
  // case 3 return next action
  return {
    next: {
      //optional, if you want to call another action in frontend
      action: 'assistant', //call other assistant，set to 'exit' to exit process
      payload: {
        assistant_id: new_assistant_id,
        input: input,//string,对象，Message对象
        retry: 1,//重试
        options: {//llm options
          max_tokens: 8192
        }
      }
    }
  };
}
```

- 返回新的用户提示词

- 调用其它的处理器
  - action: assistant,其它助手
  - action: exit,退出处理

```js
return {
  next: {
    //optional, if you want to call another action in frontend
    action: 'assistant', //call other assistant，set to 'exit' to exit process
    payload: {
      assistant_id: new_assistant_id,
      input: input, //string,对象，Message对象
      retry: 1, //重试
      options: {
        //llm options
        max_tokens: 8192
      }
    }
  }
};
```
