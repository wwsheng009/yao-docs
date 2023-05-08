# 内置 neo 聊天服务

## 适用版本

0.10.3-dev 或以上

## 特性

- 开箱即用的聊天服务
- 支持上下文对话
- 支持多数据库/多存储方式

## 配置

### 配置 openai connector

openai 连接器可以参考[aigc 处理器](aigc%E5%A4%84%E7%90%86%E5%99%A8.md)

### 配置 数据库 connector

支持以下的连接器：

- xun 连接器，即是数据库
- redis
- mongo
- weaviate

如果是把会话数据操作在默认的数据库连接中，可以不配置连接器。

使用 xun 驱动的数据库时，会自动的初始化一张数据库表。

### 配置 neo

配置文件`neo/neo.yml`

```yaml
# 配置openai connector
connector: gpt-3_5-turbo
# 自定义聊天token认证处理器，处理器一定要返回参数__sid
guard: 'scripts.guard.Chat'

conversation:
  # 聊天会话保存连接器，默认default
  connector: default
  #   保存会话的表，默认yao_neo_conversation
  table: yao_neo_conversation
  #   跟open ai聊天时的最大历史数量，默认20
  max_size: 10
  #   历史会话的最大保存时间，单位秒，默认3600
  ttl: 3600

command:
  parser: gpt-3_5-turbo

prompts:
  - role: system
    content: |
      - Your name is Neo.
      - Your are a AI assistant of YAO

option:
  temperature: 1.2

# 跨域设置
allows:
  - 'http://127.0.0.1:8000'
  - 'http://127.0.0.1:5099'
  - 'http://localhost:8000'
```

配置类型与说明

```go
// DSL AI assistant
type DSL struct {
	ID                  string                 `json:"-" yaml:"-"`
	Name                string                 `json:"name,omitempty"`
	Guard               string                 `json:"guard,omitempty"`
	Connector           string                 `json:"connector"`
	ConversationSetting conversation.Setting   `json:"conversation" yaml:"conversation"`
	Option              map[string]interface{} `json:"option"`
	Prompts             []aigc.Prompt          `json:"prompts,omitempty"`
	Allows              []string               `json:"allows,omitempty"`
	AI                  aigc.AI                `json:"-" yaml:"-"`
	Conversation        Conversation           `json:"-" yaml:"-"`
	Command             Command                `json:"-" yaml:"-"`
}

// Setting the conversation config
type Setting struct {
	Connector string `json:"connector,omitempty"`
	Table     string `json:"table,omitempty"`
	MaxSize   int    `json:"max_size,omitempty" yaml:"max_size,omitempty"`
	TTL       int    `json:"ttl,omitempty" yaml:"ttl,omitempty"`
}

```

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

### 配置 app.yao

配置路径`optional.neo.api`，api 路径`api/__yao/neo`是固定的，写死在源代码里`/service/service.go`。

```json
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "http://localhost:5099/api/__yao/neo" }
  }
}
```

或是配置成`/neo`，因为`yao`默认的内置前缀是`/api/__yao`。

```json
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "/neo" }
  }
}
```

还支持使用 studio api

```jsonc
  /**
    * Admin:
    * - PATH:        {"api":"/neo"}
    * - URL:         {"api":"http://localhost:5099/api/__yao/neo"}
    *
    * Studio:
    * - Studio PATH: {"api":"/neo", "studio":true }
    * - Studio URL:  {"api":"http://localhost:5077/neo", "studio":true }
    */
```

## 测试代码

官方已提供了测试样例

```sh
https://github.com/YaoApp/yao-dev-app
```
