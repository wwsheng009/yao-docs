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

Header 节点或是 Body 节点都能过“\{{\}\}”或是"\?\:"引用返回的对象，
小技巧，通过在 gou 项目中查找 share.Bind 方法的调用可以看到哪些代码可以使用变量绑定功能。

```json
{
  "path": "/session/flow",
  "method": "GET",
  "process": "flows.user.info",
  "in": [],
  "out": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "User-Agent": "?:会话信息.id"
    }
  }
}
```

返回值绑定示例：

```go
path = gou.Path{
        Label:       "Download",
        Description: "Download",
        Path:        "/:id/download/:field",
        Method:      "GET",
        Process:     "yao.table.Download",
        In:          []string{"$param.id", "$param.field", "$query.name", "$query.token"},
        Out: gou.Out{
            Status:  200,
            Body:    "{{content}}",
            Headers: map[string]string{"Content-Type": "{{type}}"},
        },
    }
```
