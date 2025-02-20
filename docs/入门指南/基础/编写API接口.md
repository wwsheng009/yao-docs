# 编写接口

使用 API DSL 将处理器与 REST API 关联, 提供给外部系统访问。

**约定**

1. 示例中约定应用根目录为 `/data/app`, 实际编写时需替换为应用根目录。
2. 示例中约定服务器地址为 `http://127.0.0.1:5099`, 实际编写时需自行替换。
3. 使用 `<>` 标识自行替换的内容。 例如: `icon-<图标名称>`, 实际编写时应替换为: `icon-foo`, `icon-bar` ...

**文件系统路由**

API 采用文件系统路由。 例如 DSL 文件名称为 `product.http.json` 则对应接口路由地址为 `http://127.0.0.1:5099/api/procuct/<path>`

| DSL 文件                              | 路由地址                                        |
| ------------------------------------- | ----------------------------------------------- |
| /data/app/apis/product.http.json      | `http://127.0.0.1:5099/api/procuct/<path>`      |
| /data/app/apis/project/task.http.json | `http://127.0.0.1:5099/api/project/task/<path>` |

## 编写 REST API

### 添加 API DSL 文件

在 `apis` 目录下, 创建一个 API DSL 文件, 关联 `models.product.Paginate` 处理器

`/data/app/apis/product.http.json`

```json
{
  "name": "产品",
  "version": "1.0.0",
  "description": "产品接口",
  "guard": "-",
  "paths": [
    {
      "path": "/search",
      "method": "GET",
      "process": "models.product.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/save",
      "method": "POST",
      "guard": "-",
      "process": "models.product.Save",
      "in": [":payload"],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

**接口调试**

```bash
curl -X POST http://127.0.0.1:5099/api/product/save \
   -H 'Content-Type: application/json' \
   -d '{ "name":"沙丘六部曲", "remark":"(美) 弗兰克·赫伯特 "}'
```

```bash
curl 'http://127.0.0.1:5099/api/product/search?where.name.match=沙丘&page=1&pagesize=2'
```

### 使用 Guard

可以使用 Guard 实现 API 请求鉴权 如不希望使用 Guard, 将 `guard`字段设置为 `-`, 多个 `guard` 使用 `,` 分割。

Yao 提供 `bearer-jwt` 和 `cross-origin` Guard 用于 API JWT 鉴权和响应跨域请求。

修改 `/data/app/apis/product.http.json` DSL 文件，添加 Guard。

```json
{
  "name": "产品",
  "version": "1.0.0",
  "description": "产品接口",
  "guard": "bearer-jwt",
  "group": "product",
  "paths": [
    {
      "path": "/search",
      "guard": "-",
      "method": "GET",
      "process": "models.product.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/save",
      "method": "POST",
      "process": "models.product.Save",
      "in": [":payload"],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

**接口调试**

```bash
# 没有权限
curl -X POST http://127.0.0.1:5099/api/product/save \
   -H 'Content-Type: application/json' \
   -d '{ "name":"沙丘六部曲", "remark":"(美) 弗兰克·赫伯特 "}'
#
#  {"code":403,"message":"No permission"}
#
```

```bash
curl 'http://127.0.0.1:5099/api/product/search?where.name.match=沙丘&page=1&pagesize=2'
```

生成 JWT

```bash
yao run utils.jwt.Make 1 '::{"id":1, "name":"Admin"}' '::{"issuer":"yao"}'
```

```bash
curl -X POST http://127.0.0.1:5099/api/product/save \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer <JWT>' \
   -d '{ "name":"沙丘六部曲", "remark":"(美) 弗兰克·赫伯特 "}'
```

### 使用自定义 Guard

Guard 支持自定义，可以使用脚本自定义 Guard, 可以用于接口权限管理。

**编写 Guard 逻辑**

在 `scirpts` 目录下, 新建一个 JS 文件, 实现自定义 Guard

`/data/app/scripts/guard.js`

```javascript
/**
 * 自定义接口鉴权
 * @param  {...any} args
 */
function User(path, params, query, payload, headers) {
  log.Trace('[guard.User] path: %v', path);
  log.Trace('[guard.User] params: %v', params);
  log.Trace('[guard.User] query: %v', query);
  log.Trace('[guard.User] payload: %v', payload);
  log.Trace('[guard.User] headers: %v', headers);
  query = query || {};
  if (query.error) {
    throw new Exception('没有权限', 403);
  }
}
```

**添加自定义 Guard**

修改 `/data/app/apis/product.http.json` DSL 文件，添加 Guard。

```json
{
  "name": "产品",
  "version": "1.0.0",
  "description": "产品接口",
  "guard": "bearer-jwt",
  "group": "product",
  "paths": [
    {
      "path": "/search",
      "guard": "-",
      "method": "GET",
      "process": "models.product.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/save",
      "guard": "bearer-jwt,scripts.guard.User",
      "method": "POST",
      "process": "models.product.Save",
      "in": [":payload"],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

**接口调试**

生成 JWT

```bash
yao run utils.jwt.Make 1 '::{"id":1, "name":"Admin"}' '::{"issuer":"yao"}'
```

```bash
# 模拟没有权限
curl -X POST http://127.0.0.1:5099/api/product/save?error=1 \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer <JWT>' \
   -d '{ "name":"沙丘六部曲", "remark":"(美) 弗兰克·赫伯特 "}'
#
# {"code":403,"message":"没有权限"}
#
```

```bash
# 放行
curl -X POST http://127.0.0.1:5099/api/product/save \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer <JWT>' \
   -d '{ "name":"沙丘六部曲", "remark":"(美) 弗兰克·赫伯特 "}'
```

```bash
# 查看日志
tail -n 100 logs/application.log
```

### 处理器返回值引用

如果处理器返回值为 Map 类型, `out` 可在 out.body 和 out.headers 中引用处理器返回值。

**添加文件下载接口**

修改 `/data/app/apis/product.http.json` DSL 文件，添加 Guard。

```jsonc
{
  "name": "产品",
  "version": "1.0.0",
  "description": "产品接口",
  "guard": "bearer-jwt",
  "group": "product",
  "paths": [
    {
      "path": "/search",
      "guard": "-",
      "method": "GET",
      "process": "models.product.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/save",
      "guard": "bearer-jwt,scripts.guard.User",
      "method": "POST",
      "process": "models.product.Save",
      "in": [":payload"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/download",
      "guard": "-",
      "method": "GET",
      "process": "fs.system.Download", // 返回值为 {"content":"<文件内容>", "type":"<MIME TYPE>"}
      "in": ["$query.name"],
      "out": {
        "status": 200,
        "body": "{{content}}", // API Body 返回文件内容
        "headers": { "Content-Type": "{{type}}" } // 响应 Content-Type 设置为文件 MIME TYPE
      }
    }
  ]
}
```

**接口调试**

添加测试文件

```bash
echo '<html><strong>It works!</strong></html>' > /data/app/data/test.html
```

```bash
curl -vv http://127.0.0.1:5099/api/product/download?name=/test.html

#
# > GET http://127.0.0.1:5099/api/product/download?name=/test.html HTTP/1.1
# > Host: 127.0.0.1:5099
# > User-Agent: curl/7.84.0
# > Accept: */*
# > Proxy-Connection: Keep-Alive
# >
# * Mark bundle as not supporting multiuse
# < HTTP/1.1 200 OK
# < Content-Length: 40
# < Connection: keep-alive
# < Content-Type: text/html; charset=utf-8
# < Date: Wed, 16 Nov 2022 15:01:03 GMT
# < Keep-Alive: timeout=4
# < Proxy-Connection: keep-alive
#
```

### HTTP 重定向

通过设置 `out.redirect` 将请求重定向到指定 URL

**添加文件下载 API 接口**

修改 `/data/app/apis/product.http.json` DSL 文件，添加 Guard。

```jsonc
{
  "name": "产品",
  "version": "1.0.0",
  "description": "产品接口",
  "guard": "bearer-jwt",
  "group": "product",
  "paths": [
    {
      "path": "/search",
      "guard": "-",
      "method": "GET",
      "process": "models.product.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/save",
      "guard": "bearer-jwt,scripts.guard.User",
      "method": "POST",
      "process": "models.product.Save",
      "in": [":payload"],
      "out": { "status": 200, "type": "application/json" }
    },
    {
      "path": "/download",
      "guard": "-",
      "method": "GET",
      "process": "fs.system.Download",
      "in": ["$query.name"],
      "out": {
        "status": 200,
        "body": "{{content}}",
        "headers": { "Content-Type": "{{type}}" }
      }
    },
    {
      "path": "/redirect",
      "guard": "-",
      "method": "GET",
      "process": "utils.app.ping",
      "in": [],
      "out": {
        "status": 200,
        "redirect": { "code": 301, "location": "https://yaoapps.com" } // 重定向到 yaoapps.com
      }
    }
  ]
}
```

**接口调试**

添加测试文件

```bash
echo '<html><strong>It works!</strong></html>' > /data/app/data/test.html
```

```bash
curl -vv http://127.0.0.1:5099/api/product/redirect

# > GET http://127.0.0.1:5099/api/product/redirect HTTP/1.1
# > Host: 127.0.0.1:5099
# > User-Agent: curl/7.84.0
# > Accept: */*
# > Proxy-Connection: Keep-Alive
# >
# * Mark bundle as not supporting multiuse
# < HTTP/1.1 302 Found
# < Content-Length: 42
# < Connection: keep-alive
# < Content-Type: text/html; charset=utf-8
# < Date: Wed, 16 Nov 2022 15:10:05 GMT
# < Keep-Alive: timeout=4
# < Location: https://yaoapps.com
# < Proxy-Connection: keep-alive
```
