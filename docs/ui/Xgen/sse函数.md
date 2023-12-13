# yao 应用中的 sse 函数

在 yao 应用的 js 脚本中，有几个与 sse 相关的处理函数。

## 函数 ssEvent

适用于所有的`text/stream` api 请求

在 js 脚本中可以使用 ssEvent 函数向客户端发送 sse 事件。这个函数在底层调用了 gin 的 SSEvent 函数。函数接收两个参数：

- event,事件名称，字符串，一般默认情况下使用 message,使用 eventsource 的情况下会触发浏览器中的 onmessage 事件。
- data,消息内容，任意数据

```js
c.SSEvent('message', msg);
```

具体请参考：

[使用服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F)

## 函数 cancel

适用于所有的`text/stream` api 请求

js 中的 cancel 函数实际上会调用 go 中的 context 的函数，取消请求连接。

```go
ctx, cancel := context.WithCancel(context.Background())
```

## 函数 ssWrite

只有 neo 请求中生效。

在与 neo 助手的交互过程中通过 sse 向浏览器写入文本数据,参考下面的数据结构中`message.text`。

## 函数 done

只有 neo 请求中生效。

在与 neo 助手的交互过程中向浏览器写入`message.done=true`的标识,注意并不是写入标准的 SSE 消息`data: [DONE]`，结束此次的会话。

ssWrite 与 done 函数的返回的数据结构如下：

```go
// Message the message
type Message struct {
	Text    string                 `json:"text,omitempty"`
	Error   string                 `json:"error,omitempty"`
	Done    bool                   `json:"done,omitempty"`
	Confirm bool                   `json:"confirm,omitempty"`
	Command *Command               `json:"command,omitempty"`
	Actions []Action               `json:"actions,omitempty"`
	Data    map[string]interface{} `json:"-,omitempty"`//调用自定义js脚本后返回的结果
}

// Action the action
type Action struct {
	Name    string      `json:"name,omitempty"`
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
	Next    string      `json:"next,omitempty"`
}

// Command the command
type Command struct {
	ID      string `json:"id,omitempty"`
	Name    string `json:"name,omitempty"`
	Reqeust string `json:"request,omitempty"`
}
```
