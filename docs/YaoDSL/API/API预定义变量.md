# API 预定义变量

在 API 定义中，可使用以下的内置的 `key` 引用 API 请求中的对象。

| 变量                   | 类型                 | 说明                                                                               |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `:fullpath`            | `string`             | 路由完整路径                                                                       |
| `:payload`             | `[key:String]:Any`   | 如果 Request Content-Type 为 application/json ，视为 Reqest Body 为 JSON           |
| `:query`               | `[key:String]:Any`   | URL-encoded Query String 解析后的数值                                              |
| `:form`                | `[key:String]:Any`   | POST form                                                                          |
| `:query-param/:params` | `Object ,QueryParam` | 解析 URL-encoded Query String，返回 QueryParam。可以直接使用在模型处理器中         |
| `$form.字段名称`       | `String`             | POST form 中的查询参数                                                             |
| `$param.字段名称`      | `String`             | 路由变量数值,在 url 中使用变量匹配的变量，比如/:name/data/setting 中的 name        |
| `$query.字段名称`      | `String`             | URL-encoded Query String,URL 中的查询参数                                          |
| `$payload.字段名称`    | `Any`                | payload 字段数值，支持多级访问。如 $payload.user.name , $payload.manus.0.name      |
| `$session.字段名称`    | `Any`                | Session 会话字段数，支持多级访问。如 $session.user.name , $session.manus.0.name 值 |
| `$file.字段名称`       | `Object File`        | 上传临时文件结构                                                                   |

`session`的设置逻辑可参考[自定义用户登录 API](./%E8%87%AA%E5%AE%9A%E4%B9%89%E7%94%A8%E6%88%B7%E7%99%BB%E9%99%86login%20api.md)

需要特别关注`:query-param/:params`，yao 框架会根据 url 中的查询条件转换成 QueryParam 对象。

以下类型的处理器或是对应的封装处理器均支持传入 QueryParam 查询参数：

`Find, Get, Paginate, UpdateWhere, DeleteWhere, DestroyWhere`

封装处理器：

- yao.table.Get
- yao.table.Search，对应的是 Paginate 处理器
- yao.table.Find
- yao.table.UpdateWhere
- yao.table.DeleteWhere
- yao.list.Find
- yao.form.Find
- models.model_id.find
- models.model_id.get
- models.model_id.pagnate
- models.model_id.UpdateWhere
- models.model_id.DeleteWhere
- models.model_id.DestroyWhere

即是所有使用 queryparam 对象类型的处理器都可以直接在 http api 定义中进行引用,具体请参考：
[QueryParam 语法](../Query/QueryParam%E8%AF%AD%E6%B3%95.md)

源代码：

- `gou/api.http.go` 可根据自己的需求增加其它的变量引用
