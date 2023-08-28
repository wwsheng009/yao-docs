# 配置 Redis 保持会话

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

# 可选，默认是1
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

## redis 操作。

```sh
# 先选择数据库

127.0.0.1:6379[1]> CONFIG GET databases
1) "databases"
2) "16"

# 先选择数据库，要不看不到数据
127.0.0.1:6379> select 1
OK

127.0.0.1:6379[1]> KEYS *
1) "yao:session:3UrNkP0WSrYnW1_quzKzmddGnWCUG67o0W3pXCPorAU=:user"
2) "yao:session:3UrNkP0WSrYnW1_quzKzmddGnWCUG67o0W3pXCPorAU=:user_id"
3) "yao:session:3UrNkP0WSrYnW1_quzKzmddGnWCUG67o0W3pXCPorAU=:issuer"

```
