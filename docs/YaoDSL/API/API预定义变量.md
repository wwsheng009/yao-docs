# API 预定义变量

在 API 定义中，可使用以下的变量引用 API 中的对象。

| 变量                   | 类型                 | 说明                                                                                                    |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| `:fullpath`            | `string`             | 路由完整路径                                                                                            |
| `:payload`             | `[key:String]:Any`   | 如果 Request Content-Type 为 application/json ，视为 Reqest Body 为 JSON。返回解码后的 Key-Value Object |
| `:query`               | `[key:String]:Any`   | URL-encoded Query String 解析后的数值                                                                   |
| `:form`                | `[key:String]:Any`   | POST form                                                                                               |
| `:query-param/:params` | `Object ,QueryParam` | 解析 URL-encoded Query String，返回 QueryParam                                                          |
| `$form.字段名称`       | `String`             | POST form 字段数值                                                                                      |
| `$param.字段名称`      | `String`             | 路由变量数值,在 url 中使用变量匹配的变量，比如/:name/data/setting 中的 name                             |
| `$query.字段名称`      | `String`             | URL-encoded Query String 字段数值                                                                       |
| `$payload.字段名称`    | `Any`                | payload 字段数值，支持多级访问。如 $payload.user.name , $payload.manus.0.name                           |
| `$session.字段名称`    | `Any`                | Session 会话字段数，支持多级访问。如 $session.user.name , $session.manus.0.name 值                      |
| `$file.字段名称`       | `Object File`        | 上传临时文件结构                                                                                        |

`session`的设置逻辑可参考[自定义用户登录 API](%E8%87%AA%E5%AE%9A%E4%B9%89%E7%94%A8%E6%88%B7%E7%99%BB%E9%99%86API.md)

源代码：

- `gou/api.http.go` 可根据自己的需求增加其它的变量引用
