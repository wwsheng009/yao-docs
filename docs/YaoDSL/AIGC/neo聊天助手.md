# 内置 neo 聊天服务

## 适用版本

0.10.3 或以上

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

openai 连接器可以参考[aigc 处理器](aigc%E5%A4%84%E7%90%86%E5%99%A8.md)

### 配置 数据库 connector

在使用 Neo 过程中，会产生聊天历史记录。通过设置数据库连接器，可以把 neo 聊天历史保存在别的数据库中。

如果是把会话数据操作在默认的数据库连接中，可以不配置连接器，或是设置`connector=default`。

在 Yao 启动初始化时，Yao 自动在数据库中初始化一张数据库表。

连接 mysql 配置

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "MySQL 8.0 TEST",
  "type": "mysql",
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
        "primary": true
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

连接 sqlite 配置

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "SQLite TEST",
  "type": "sqlite3",
  "options": {
    "file": "$ENV.SQLITE_DB"
  }
}
```

### 配置 neo

Neo 助手配置文件`neo/neo.yml`，这个配置文件的路径与文件名是固定的。

```yaml
# 配置openai connector
connector: gpt-3_5-turbo
# 自定义聊天token认证处理器，处理器一定要返回参数__sid
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

# 当用户请求到达API接口后，使用这个hook修改用户的请求信息后再发送到openai,接收用户请求的消息，并返回新的消息
# 如果有聊天的历史，在这里也可以获取到。
prepare: 'scripts.neo.Prepare'

# 收到openai的回复后进行调整回复的消息后再返回到客户端
write: 'scripts.neo.Write'

prompts:
  - role: system
    content: |
      - Your name is Neo.
      - Your are a AI assistant of YAO

option:
  temperature: 1.2

# 跨域设置，访问域名的白名单
allows:
  - 'http://127.0.0.1:8000'
  - 'http://127.0.0.1:5099'
  - 'http://localhost:8000'
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

### yao api 响应处理过程

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
