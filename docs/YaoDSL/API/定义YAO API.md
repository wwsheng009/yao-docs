# YAO API

## 目录

- [1. API 定义](#1-api-定义)
  - [1.1 第一级结构](#11-第一级结构)
  - [1.2 第二级结构](#12-第二级结构)
- [2. 请求方法](#请求方法)
- [3. 参数引用](#引用传入的参数)
  - [3.1 路径参数](#31-路径参数)
  - [3.2 查询参数](#32-查询参数)
  - [3.3 请求体](#33-请求体)
- [4. API Guard](#4-api-guard)
- [5. 内置服务 API](#5-内置服务-api)
- [6. Stream API](#6-stream-api)
- [7. 文件上传下载](#7-文件上传下载)
- [8. 最佳实践](#8-最佳实践)
- [9. 常见问题](#9-常见问题)
- [10. 版本记录](#10-版本记录)

## 目录结构

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
└── v1
    ├── admin
    │   ├── account.http.yao
    │   ├── dept.http.yao
    │   ├── menu.http.yao
    │   └── user.http.yao
    ├── amis.http.yao
    ├── app
    │   ├── cmd.http.yao
    │   ├── monitor.http.yao
    │   └── system.http.yao
    ├── blog.http.yao
    ├── chart.http.yao
    ├── fs.http.yao
    └── system
        ├── meta
        │   ├── api.http.yao
        │   ├── icon.http.yao
        │   ├── model.http.yao
        │   └── table.http.yao
        ├── model.http.yao
        ├── schema.http.yao
        ├── tree.http.yao
        └── util.http.yao
```

## 1. API 定义

YAO API 采用两级结构定义，以下是一个完整的 API 配置示例：

### 1.1 第一级结构

在第一级中，定义了 API 的基本信息，包括名称、版本、描述、分组和认证方式等信息。如果未指定`group`，则使用文件目录作为分组。如果未指定`guard`，则该 API 为公开 API，无需认证即可调用。

### 1.2 第二级结构

在第二级中，定义了 API 的具体路径、请求方法、处理函数等信息。`paths`数组中包含每个 API 的详细配置。第二级中的 guard 优先级高于第一级的 guard。在 process 中可以调用所有 yao 格式的处理器。在 in 中可以指定请求参数，可以是路径参数、查询参数或请求体。在 out 中可以定义响应格式，包括 HTTP 状态码和响应类型等信息。

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

## 引用传入的参数

API 中可使用以下预定义变量：

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

### 1.1 路径参数

使用`$param.参数名`获取路径中的参数，例如：

```json
{
  "path": "/data/:id",
  "in": ["$param.id"] // 获取路径中的id参数
}
```

### 1.2 查询参数

使用`:query`获取 URL 查询参数：

```json
{
  "in": [":query"] // 获取所有查询参数
}
```

### 1.3 请求体

使用`:payload`获取请求体内容：

```json
{
  "in": [":payload"] // 获取POST请求体
}
```

### 1.4 自定义 Guard

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

### 1.5 输出格式

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

### 跳转

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

## 请求方法 (HTTP Methods)

YAO API 支持以下 HTTP 请求方法：

- **GET**: 用于获取资源。GET 请求应该只用于读取数据，而不应该产生副作用。
- **POST**: 用于创建新资源或提交数据。POST 请求通常用于表单提交或上传文件。
- **PUT**: 用于更新现有资源或替换资源。PUT 请求通常用于更新整个资源。
- **DELETE**: 用于删除资源。DELETE 请求用于删除指定的资源。
- **PATCH**: 用于部分更新资源。PATCH 请求通常用于更新资源的某些字段，而不是整个资源。
- **HEAD**: 类似于 GET 请求，但只返回响应头，不返回响应体。HEAD 请求通常用于检查资源是否存在或获取资源的元数据。
- **OPTIONS**: 用于获取服务器支持的 HTTP 方法。OPTIONS 请求通常用于跨域请求的预检请求。
- **ANY**: 用于匹配任何 HTTP 方法。ANY 请求可以处理 GET、POST、PUT、DELETE 等所有 HTTP 方法。

### 示例

以下是一些常见的 HTTP 方法使用示例：

#### GET 请求

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

## 2. API Guard

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

## 3. 内置服务 API

在 Yao 中，提供了一些可以直接调用的内置 API 接口。这些接口的调用方式与普通 API 相同，但它们的参数和路径已经被固定，无需手动指定。

### 3.1 内置服务

- **POST `/api/__yao/app/service/:name`**: 调用 services 目录下的 JS 文件。
- **GET `/api/__yao/app/setting`**: 获取当前应用的配置信息。
- **POST `/api/__yao/app/setting`**: 更新当前应用的配置信息。
- **GET `/api/__yao/app/menu`**: 获取当前应用的菜单信息。
- **GET `/api/__yao/app/icons/:name`**: 获取图标信息。
- **POST `/api/__yao/app/setup`**: 应用初始化。
- **POST `/api/__yao/app/check`**: 应用检查。

### 自动加载的 API

如果用户定义了特定的资源（如 tables, forms, lists, charts），系统会自动加载相应的 API。

#### neo

api 前缀：`/api/__yao/neo`

#### sui

api 前缀：`/api/__yao/sui`

#### widget

api 前缀：`/api/widget/<ID>`

#### 登录

- 管理员登录 api 前缀：`/api/__yao/login/admin`
- 用户登录 api 前缀：`/api/__yao/login/user`

#### Dashboard 定义

当用户定义了 dashboard 时，定义文件需要保存在目录`dashboard`目录下，每一个`dashboard`对应的 API 将会被加载：

- `/api/__yao/dashboard/:id/data`: 获取仪表盘数据。
- `/api/__yao/dashboard/:id/setting`: 获取仪表盘设置。
- `/api/__yao/dashboard/:id/component/:xpath/:method`: xpath 为组件的 xpath，method 为组件的方法。

#### Tables 定义

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

#### Forms 定义

当用户定义了 forms 时，定义文件需要保存在目录`forms`目录下，每一个`form`对应的 API 将会被加载：

- `/api/__yao/form/:id/find/:primary`: 根据主键查找数据。
- `/api/__yao/form/:id/save`: 保存数据。
- `/api/__yao/form/:id/create`: 创建数据。
- `/api/__yao/form/:id/update/:primary`: 根据主键更新数据。
- `/api/__yao/form/:id/delete/:primary`: 根据主键删除数据。
- `/api/__yao/form/:id/upload/:xpath/:method`: 上传文件。
- `/api/__yao/form/:id/download/:field`: 下载文件。

#### Lists 定义

当用户定义了 lists 时，定义文件需要保存在目录`lists`目录下，每一个`list`对应的 API 将会被加载：

- `/api/__yao/list/:id/get`: 获取数据。
- `/api/__yao/list/:id/save`: 保存数据。
- `/api/__yao/list/:id/upload/:xpath/:method`: 上传文件。
- `/api/__yao/list/:id/download/:field`: 下载文件。

#### Charts 定义

当用户定义了 charts 时，以下 API 将会被加载：

- `/api/__yao/chart/:id/data`: 获取图表数据。

#### Service API

访问前缀： `/api/__yao/app/service/:name`

在 Yao 中，你可以通过定义服务（Service）来创建 API。服务文件需要保存在`services/`目录下，并以`.js`或是`.ts`形式存在。

### 示例：获取表结构信息

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

## 4. Stream API

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

### 示例

可以在 Yao 中使用 处理器`http.Stream`调用其它 AI 服务，然后再向客户端输出内容，相当于一个 ai 代理服务器，需要注意的是向 AI 服务端发出请求时需要进行异步响应处理。与其它 http 处理器不一样的地方在于第三个参数需要是一个回调函数(js 函数)。

```js
http.Stream('POST', url, handler, RequestBody, null, {
  Accept: 'text/event-stream; charset=utf-8',
  'Content-Type': 'application/json',
  Authorization: `Bearer ` + setting.api_token,
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

## 5. 文件上传下载

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
