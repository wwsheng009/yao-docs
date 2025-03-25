# yao 应用中的 sse 函数

SSE函数是Yao应用中用于处理服务器发送事件(Server-Sent Events)的一组函数。主要包括ssEvent、cancel两个函数，其中最常用的是ssEvent函数，它可以在服务器端向客户端发送实时消息。这些函数通常在text/stream类型的API请求中使用，能够实现服务器向客户端的单向实时数据推送。ssEvent函数接收两个参数：事件名称（通常使用'message'）和要发送的数据内容。需要注意的是，这些函数必须在API关联的处理函数中直接使用，不能通过间接调用的方式使用。

在 yao 应用的 js 脚本中，有几个与 sse 相关的处理函数。

## 函数 ssEvent

适用于所有的`text/stream` api 请求

在 js 脚本中可以使用 ssEvent 函数向客户端发送 sse 事件。这个函数在底层调用了 gin 的 SSEvent 函数。函数接收两个参数：

- event,事件名称，字符串，一般默认情况下使用 message,使用 eventsource 的情况下会触发浏览器中的 onmessage 事件。
- data,消息内容，任意数据

具体请参考：

[使用服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F)

## 函数 cancel

适用于所有的`text/stream` api 请求

js 中的 cancel 函数实际上会调用 go 中的 context 的函数，取消请求连接。

```go
ctx, cancel := context.WithCancel(context.Background())
```

需要注意的是在调用 ssEvent 与 cancel 时，需要在 api 关联的处理函数里直接使用，不能在 api 函数里通过调用处理器间接调用。
比如 api 定义如下，那么 ssEvent 函数需要在处理器`scripts.chatweb.process`或是其直接调用的 js 函数中调用，而不能在处理`scripts.chatweb.process`中通过`Process("")`间接调用。原因是 ssEvent 是一个特定函数，只在固定的 streamHandle 的函数上下文中才会的生效。

```json
{
  "path": "/chat-process",
  "method": "POST",
  "guard": "scripts.security.CheckChatKey",
  "process": "scripts.chatweb.handler",
  "in": [":payload"],
  "out": {
    "status": 200,
    "type": "text/event-stream; charset=utf-8"
  }
}
```

示例：

```js
function handler(payload) {
  // console.log("payload:", payload)
  if (payload == null) {
    return 0;
  }
  const content = payload.replace(/^data:/, '');
  if (typeof ssEvent === 'function') {
    ssEvent('data', content);
  } else {
    console.print(content);
  }
  return 1;
}
```
