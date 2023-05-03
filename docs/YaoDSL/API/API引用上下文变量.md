# 在 api 中使用变量引用上下文变量

在 api 中使用变量引用上下文变量

## 传入 API 接口中引用会话变量

```json
{
  "path": "/session/in",
  "method": "GET",
  "process": "models.user.Find",
  "in": ["$session.id", ":params"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

## API 接口返回值中引用会话变量

在 api 接口定义中，在输出节点`out`的`headers`节点或是 `body`节点使用`{{}}`或是`?:`引用返回的对象，

> 小技巧，通过在 gou 项目中查找 share.Bind 方法的调用可以看到哪些代码可以使用变量绑定功能。

返回值绑定示例,

处理器`flows.user.info`返回一个 json 结构数据`{}`

```json
{
  "type": "text/json",
  "content": "hello",
  "agent": "edge/chrome"
}
```

api 定义：

```json
{
  "path": "/session/flow",
  "method": "GET",
  "process": "flows.user.info",
  "in": [],
  "out": {
    "status": 200,
    "headers": {
      "Content-Type": "{{type}}",
      "User-Agent": "?:agent"
    },
    "body": "{{content}}"
  }
}
```
