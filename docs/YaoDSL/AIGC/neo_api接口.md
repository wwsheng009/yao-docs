# neo api 接口

yao 本身已经内置了 ai 聊天接口。

## 聊天请求

`/api/__yao/neo`，请求方法：`get`,参数：`content`,`context`,`token`。token 是 jwt 认证参数。

请求示例：

```text
content: Hello!

context: {"namespace":"Table-Page-ddic.model","stack":"Table-Page-ddic.model","pathname":"/x/Table/ddic.model","formdata":{},"field":{"name":"","bind":""},"config":{},"signal":""}
```

```js
const es = new EventSource(
  `${neo_api}?content=${encodeURIComponent(
    message.text,
  )}&context=${encodeURIComponent(
    JSON.stringify(message.context),
  )}&token=${encodeURIComponent(getToken())}${studio_token}`,
);
```

返回是 ss 异步消息。返回消息结构：

返回消息都会被组装成`data: 消息\n\n`的格式，跟 chatgpt 的一致。其中消息内容又可以拆分成 json 数据。

返回消息还会在 http 头上设置内容格式：`("Content-Type", "text/event-stream;charset=utf-8")`

```json
{
  "text": "", //文本
  "error": "", //错误
  "done": false, //已完成
  "confirm": false, //前端需要确认
  "command": {
    //
    "id": "id",
    "name": "",
    "request": ""
  },
  "actions": [
    //触发前端的操作
    {
      "name": "",
      "type": "",
      "payload": {},
      "next": "'"
    }
  ]
}
```

## 聊天历史记录

`/api/__yao/neo/history`，请求方法：`get`,返回：

```json
[
  {
    "name": "",
    "description": "",
    "args": "",
    "stack": "",
    "path": ""
  }
]
```

## 获取命令列表

`/api/__yao/neo/commands`，请求方法：`get`,返回：

```json
{
  "data": `history`,
  "command": []
}
```

## 执行命令

`/api/__yao/neo/`，请求方法：`post`,请求内容：

```json
{
  "cmd": "ExitCommandMode"
}
```

返回:

```json
{ "code": 200, "message": "success" }
```

## sse 事件流的标准格式。

[使用服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F)

`data:` 开头，表示消息数据，数据可以有多行，每行以 `\n` 符号分隔，最后一行必须有两个`\n `表示数据结束。换行符必须用 `\n` 来表示，不能使用 `\r\n`。在前端使用 EventSource 处理时，前缀会被自动的处理掉，并保留文本消息。除了发送 data，还可以发送 event/id/retry 字段。

```text
  event: update
  data: {"id": 123, "message": "New update received"}
  id: 456
  retry: 5000
```
