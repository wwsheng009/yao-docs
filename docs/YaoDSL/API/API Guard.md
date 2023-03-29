# API Guard

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
