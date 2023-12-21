# neo api 接口

yao 本身已经内置了 neo ai 聊天接口。

## 聊天请求

`/api/__yao/neo`，请求方法：`get`,URL 参数：`content`,`context`,`token`。token 是 jwt 认证参数。

请求示例：

```json
{
  "content": "Hello!",

  "context": {
    "namespace": "Table-Page-ddic.model",
    "stack": "Table-Page-ddic.model",
    "pathname": "/x/Table/ddic.model",
    "formdata": {},
    "field": { "name": "", "bind": "" },
    "config": {},
    "signal": ""
  }
}
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
{
  "data": [{}] //历史记录
}
```

## 获取命令列表

`/api/__yao/neo/commands`，请求方法：`get`,返回：

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

```json
{
  "event": "update",
  "data": { "id": 123, "message": "New update received" },
  "id": 456,
  "retry": 5000
}
```

规范中规定了下面这些字段：

`event` - 一个用于标识事件类型的字符串。如果指定了这个字符串，浏览器会将具有指定事件名称的事件分派给相应的监听器；网站源代码应该使用 addEventListener() 来监听指定的事件。如果一个消息没有指定事件名称，那么 onmessage 处理程序就会被调用。

`data` - 消息的数据字段。当 EventSource 接收到多个以 data: 开头的连续行时，会将它们连接起来，在它们之间插入一个换行符。末尾的换行符会被删除。
数据可以有多行，每行以 `\n` 符号分隔。换行符必须用 `\n` 来表示，不能使用 `\r\n`。在前端使用 EventSource 处理时，前缀会被自动的处理掉，并保留文本消息。除了发送 data，还可以发送 event/id/retry 字段。

如果在服务端发送的数据中包含`\n`换行符,比如消息`YHOO\n+2\n\10`，那么在浏览器中收到的信息会是这样：

```json
event:message
data: YHOO
data: +2
data: 10
```

最后一行必须有两个`\n `表示数据结束,使用两个换行符来分隔前后的消息

`id` - 当前消息的 id, 事件 ID，会成为当前 EventSource 对象的内部属性“最后一个事件 ID”的属性值。

`retry`
重新连接的时间。如果与服务器的连接丢失，浏览器将等待指定的时间，然后尝试重新连接。这必须是一个整数，以毫秒为单位指定重新连接的时间。如果指定了一个非整数值，该字段将被忽略。

所有其他的字段名都会被忽略。
