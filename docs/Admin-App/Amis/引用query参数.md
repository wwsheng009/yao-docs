## 引用 url 中的 query 参数

如果需要在页面中引用 `url` 中的 `query` 参数，需要在 `page` 页面的 `body` 中的页面引用。不能把`__query`引用放在`page`的级别，要不然会显示`model`等于原字符串`${__query.model}`，而不是解析后的变量。

比如下面的中的引用方式：

```json
{
  "data": {
    "model": "${__query.model}"
  }
}
```

正确的方法,会引用`http://localhosts:5099/xxx?model=goods`中的`goods`

```json
{
  "type": "page",
  "body": [
    {
      "data": {
        "model": "${__query.model}"
      },
      "schemaApi": {
        "url": "/api/v1/system/schema/${model}/crud-all",
        "method": "get",
        "sendOn": "!!model"
      },
      "name": "model",
      "initFetchSchema": true,
      "type": "service",
      "body": [],
      "id": "u:5ce017fa279d",
      "messages": {}
    }
  ],
  "id": "u:568b02cd6929"
}
```

错误的方法，`model`等于它的字面量`${__query.model}`

```json
{
  "type": "page",
  "data": {
    "model": "${__query.model}"
  },
  "body": [
    {
      "schemaApi": {
        "url": "/api/v1/system/schema/${model}/crud-all",
        "method": "get",
        "sendOn": "!!model"
      },
      "name": "model",
      "initFetchSchema": true,
      "type": "service",
      "body": [],
      "id": "u:5ce017fa279d",
      "messages": {}
    }
  ],
  "id": "u:568b02cd6929"
}
```

另外也可以使用`parmas`引用`url`中的参数,比如路由配置的是`/xxx/models/create/:id`，可以使用`params.id`引用`http://localhosts:5099/xxx/models/create/mymodel`中的`mymodel`。

```json
{
  "data": "${parmas.id}"
}
```
