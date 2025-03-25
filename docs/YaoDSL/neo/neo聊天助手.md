# 内置 neo 聊天服务

## 特性

- 开箱即用的聊天服务
- 支持上下文对话

## 配置

### 配置 openai key

连接 OPENAI 需要设置 openai key，在环境变量中设置访问 key。

| 变量名称   | 说明                                                             | 示例     |
| ---------- | ---------------------------------------------------------------- | -------- |
| OPENAI_KEY | OPENAI API KEY, 可在连接器中更换变量名。 启用 Neo 或 AIGC 必须。 | `sk-xxx` |

### 配置代理

如果需要使用代理，需要配置环境变量 https_proxy,支持使用 socket 代理或是 http 代理。

HTTPS_PROXY="socks5://0.0.0.0:10808"

### 配置 openai connector

openai 连接器可以参考[aigc 处理器](../AIGC/aigc%E5%A4%84%E7%90%86%E5%99%A8.md)

### 配置 数据库 connector

数据连接器配置[连接器](../Connector/连接器.md)

### 配置 neo

Neo 助手配置文件`neo/neo.yml`，这个配置文件的路径与文件名是固定的。

```yaml
connector: copilot-tencent
use: 'neo' # default assistannt
guard: 'scripts.auth.token.Check'

store:
  connector: 'default' #用于指定数据存储方法的连接器名称，默认为应用数据库连接器
  user_field: 'user_id' #用户ID字段名称，默认为"user_id"
  prefix: 'yao_neo_' #数据库表名前缀，将自动创建带有前缀的三个表：+_history,+_chat,+_assistant
  max_size: 100 #最大存储大小限制
  ttl: 3600 #生存时间（秒）

# Setting RAG settings
rag:
  engine: #向量数据库引擎设置
    dirver: '' #qdrant -> 向量存储驱动，目前仅支持qdrant，为空表示不使用RAG
    options: #使用$ENV.ENV_NAME获取环境变量
      host: ''
      api_key: 'sr-'
      port: 80

  vectorizer: #文本向量化设置，使用$ENV.ENV_NAME获取环境变量
    dirver: '' #openai -> embeddings驱动，目前仅支持openai
    options:
      model: 'text-embedding-ada-002' #openai的默认模型
      api_key: 'sr-'

  upload: #文件上传设置
    async: false
    allowed_types: ['image/jpeg', 'image/png', 'image/jpg']
    chunk_size: 1024
    chunk_overlap: 256
  index_prefix: 'yao_neo_'

vision:
  storage:
    driver: 'local' #local -> 本地存储, s3 -> s3存储
    options: #本地存储选项
      path: './storage/vision' #本地存储所需的路径
      compression: true #是否压缩图片
      base_url: '' #文件下载的基础URL
      preview_url: '' #文件预览URL

    # options:  #s3 storage options
    #   expiration: ""
    #   endpoint: ""
    #   region: "auto"
    #   key: ""
    #   secret: ""
    #   bucket: ""
    #   prefix: ""
    #   compression: true

  model:
    driver: 'openai' #openai -> openai视觉模型
    options:
      model: 'openai/clip-vit-base-patch32'
      api_key: 'sr-'
      compression: true
      prompt: ''

# prepare: "scripts.vector.Match"
prompts:
  - role: system
    content: |
      - You are pretending to be YAO's AI assistant and your name is Neo.
      - Answer my questions in Chinese from now on.

option: #options for chatting with the assistant
  temperature: 0.8

create: 'scripts.neo.neo.Create' #创建助手的函数，用于选择assistant

prepare: 'scripts.neo.neo.prepare' #助手的准备函数，不再使用，使用assistant代替
write: 'scripts.neo.neo.write' #助手的写入函数，不再使用，使用assistant代替

allows:
  - 'http://127.0.0.1:8000'
  - 'http://127.0.0.1:5099'
  - 'http://localhost:5099'
  - 'http://localhost:8000'

# 连接器的额外配置
connectors:
  doubao: # 指定的连接器配置
    tools: true #模型是否原生支持Function Call功能,
```

### 配置 app.yao

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

## 测试代码

官方已提供了测试样例

```sh
https://github.com/YaoApp/yao-dev-app

https://github.com/YaoApp/yao-init

```

## Yao 后端

### 配置类型与说明

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

## yao api 响应处理过程

### 登录认证

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

### 聊天会话

openai 的接口请求是没有记忆聊天的历史的，这里需要使用本地数据库表保存上一次的聊天信息，在下一次的接口请求中把之前的聊天信息也带上，形成了聊天会话的效果。

本地数据库表的配置名称是`conversation.table`。数据库表如果不存在，会自动的创建。

### 聊天信息钩子

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

### 命令

如果消息中包含了处理命令，还会检查并调用本地命令处理器。
