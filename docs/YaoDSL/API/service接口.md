# Yao service 服务 API

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
#   跟studio的service不同，services不需要跨域
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

## 总结

service 服务的优点:

- 不需要创建新的 api 定义
- 方便直接使用 yao 的处理器

缺点：

- 只能使用 post 请求
