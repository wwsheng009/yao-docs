# API 守卫 Guard

可以把 api guard 理解成 api 请求拦截器。比如用户身份验证，额外信息获取判断等。

## `API DSL` 定义

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

## 源代码分析

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

## 全局变量

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

## 自定义`guard`处理器

可自定义`guard`,`guard`处理器的参数有:

- 1 `api`路径
- 2 `api`参数
- 3 `body`请求`payload`
- 4 `header`请求抬头

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
}
```

## Table/Form 中使用 Guard

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
