# API 接口

Yao 当前支持 RESTFul API/Stream API，用于数据归集对接、即时通信、IoT 等类型的项目。

## 命名规范

业务接口描述文件是以 **小写英文字母** + `.协议名称` + `.json` 扩展名命名的 JSON 文本文件, `<name>.<protocol>.json`;

| 文件夹 (相对业务接口根目录) | 文件名         | 接口名称             | API 类型            |
| --------------------------- | -------------- | -------------------- | ------------------- |
| /                           | name.http.json | `name`               | `http` RESTFul API  |
| /group                      | name.http.json | `group.name`         | `http` RESTFul API  |
| /group1/group2              | name.http.json | `group1.group2.name` | `http` RESTFul API  |
| /                           | name.mqtt.json | `name`               | `mqtt` MQTT API     |
| /group                      | name.mqtt.json | `group.name`         | `mqtt` MQTT API     |
| /group1/group2              | name.mqtt.json | `group1.group2.name` | `mqtt` MQTT API     |
| /                           | name.sock.json | `name`               | `sock` Socket API   |
| /group                      | name.sock.json | `group.name`         | `sock` Socket API   |
| /group1/group2              | name.sock.json | `group1.group2.name` | `sock` Socket API   |
| /                           | name.ws.json   | `name`               | `ws` WEB Socket API |
| /group                      | name.ws.json   | `group.name`         | `ws` WEB Socket API |
| /group1/group2              | name.ws.json   | `group1.group2.name` | `ws` WEB Socket API |

## 各协议规范文档

| 协议名称 | 文档地址 |
| -------- | -------- |
| http     |          |

## RESTFul API

```json
{
  "name": "系统接口",
  "version": "1.0.0",
  "description": "系统接口API",
  "group": "system",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/info",
      "method": "GET",
      "guard": "-",
      "process": "models.user.Find",
      "in": ["$param.id", ":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

一个 `http` 协议的接口(`API`)文档，可以定义一组 API，可以在每个 API 中绑定一个处理器(`process`), 系统自动调用处理器，返回处理器调用结果；

| 字段        | 类型                 | 说明                                                                         | 必填项 |
| ----------- | -------------------- | ---------------------------------------------------------------------------- | ------ |
| name        | String               | API 呈现名称，用于开发平台呈现                                               | 是     |
| version     | String               | 版本号，用于依赖关系校验和开发平台呈现                                       | 是     |
| description | String               | API 介绍，用于开发平台呈现                                                   | 否     |
| group       | String               | API 分组名称，访问时作为 API 路由前缀目录。 `/api/<group>/<path>`            | 是     |
| guard       | String               | API 全局中间件，多个用 "," 分割。除特别声明，组内所有 API 都将使用全局中间件 | 否     |
| paths       | Array\<Object Path\> | API 列表。具体查看 `Object Path` 数据结构                                    | 是     |

### `Object Path` 数据结构

API 将通过路由 `/api/<group>/<path>`访问, 请求成功响应 `out` 中定义的状态码、Content-Type 和处理器(`process`)返回值， 请求失败响应异常状态码和 JSON 格式的错误消息 [查看异常规范](#异常规范)。

| 字段    | 类型            | 说明                                                                                                                                   | 必填项 |
| ------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| path    | String          | API 路由名称。完整路由地址为 `/api/<group>/<path>` ，变量使用 `:` 声明，如 `/api/user/find/:id`, 可以使用 `$param.id` 访问路由请求参数 | 是     |
| method  | String          | 请求类型。许可值 `GET`、`POST`、`PUT`、`DELETE`、 `HEAD`、`OPTIONS`、`Any`. 其中 `Any` 将响应任何类型的请求                            | 是     |
| guard   | String          | API 中间件. 如不设置，默认使用全局中间件。如不希望使用全局中间件，可将数值设置为 `-` 。                                                | 否     |
| process | String          | 调用处理器 `process`                                                                                                                   | 是     |
| in      | Array\<String\> | 请求参数表，将作为 `process` 的输入参数(`args`)。可以引用传入参数，可以为空数组 [查看输入参数](#输入参数)                              | 是     |
| out     | Object Out      | 请求响应结果定义。 具体查看 `Object Out` 数据结构                                                                                      | 是     |
| err     | Object Out      | 自定义调用失败时的响应结果。 **尚未实现**                                                                                              | 否     |

### `Object Out` 数据结构

| 字段    | 类型            | 说明                          | 必填项 |
| ------- | --------------- | ----------------------------- | ------ |
| status  | integer         | 请求响应状态码                | 是     |
| type    | String          | 请求响应 Content Type         | 是     |
| headers | Array\<String\> | 请求响应 Headers **尚未实现** | 否     |

### 输入参数

`in` 中定义的参数表，将作为处理器的输入参数。支持使用 `:param` 、 `:payload` 、`$param.字段名称` 等变量，绑定请求参数。

#### 数值

| 数值         | 说明                                |
| ------------ | ----------------------------------- |
| `"'字符串'"` | 字符串格式数值, 单引号使用 `\` 转义 |
| `"数字"`     | 数字格式数值                        |

#### 变量

| 变量                  | 类型               | 说明                                                                                                        |
| --------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `":body"`             | string             | Request Body                                                                                                |
| `":fullpath"`         | string             | 路由完整路径                                                                                                |
| `":payload"`          | \[key:String\]:Any | 如果 Request Content-Type 为 `application/json` ，视为 `Reqest Body` 为 JSON。返回解码后的 Key-Value Object |
| `":query"`            | \[key:String\]:Any | URL-encoded Query String 解析后的数值                                                                       |
| `":form"`             | \[key:String\]:Any | POST form                                                                                                   |
| `":query-param"`      | Object QueryParam  | 解析 URL-encoded Query String，返回 QueryParam `查看数据结构(../../model#3-查询参数-queryparam)`            |
| `"$form.字段名称"`    | String             | POST form 字段数值                                                                                          |
| `"$param.字段名称"`   | String             | 路由变量数值                                                                                                |
| `"$query.字段名称"`   | String             | URL-encoded Query String 字段数值                                                                           |
| `"$payload.字段名称"` | Any                | payload 字段数值，支持多级访问。如 `$payload.user.name` , `$payload.manus.0.name`                           |
| `"$session.字段名称"` | Any                | Session 会话字段数，支持多级访问。如 $session.user.name , $session.manus.0.name 值                          |
| `"$file.字段名称"`    | Object File        | 上传临时文件结构                                                                                            |

`Object File` 数据结构

| 字段     | 类型                           | 说明                      |
| -------- | ------------------------------ | ------------------------- |
| name     | String                         | 文件名                    |
| tempfile | String                         | 临时文件地址              |
| size     | Integer                        | 文件大小                  |
| header   | \[key:String\]:Array\<String\> | MIME-style header mapping |

##### URL Query String 与 QueryParam 对照表

| Query String                                                      | QueryParam                                                                                                                                                      | 说明                                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| select=field1,field2                                              | `{"select":["field1","field2"]}`                                                                                                                                | 选择字段                                                                            |
| with=rel1,rel2                                                    | `{"withs":{"rel1":{}, "rel2":{}}}`                                                                                                                              | 关联关系                                                                            |
| rel1.select=field1,field2                                         | `{"withs":{"rel1":{"select":["field1", "field2"]}}}`                                                                                                            | 关联模型选择字段. 规范为 **关联关系.select**                                        |
| where.status.eq=enabled                                           | `{"wheres":[{"column":"status", "op":"eq", "method":"where", "value":"enabled"}]}`                                                                              | Where 查询条件. 规范为 **where.字段名称.匹配关系**                                  |
| where.mother.friends.status.eq=enabled                            | `{"wheres":[{"rel":"user_mother_friends","column":"status", "op":"eq", "method":"where", "value":"enabled"}]}`                                                  | 指定关联模型字段 规范为 **where.关系名称.关联模型名称.字段名称.匹配关系**           |
| group.types.where.type.eq=admin&group.types.orwhere.type.eq=staff | `{"wheres":[{"wheres":[{"column":"type", "op":"eq", "method":"where", "value":"admin"}]},{"column":"type", "op":"eq", "method":"orwhere", "value":"staff"}]}]}` | Where 分组查询，一般用于 orwhere. 规范为 **group.分组名称.where.字段名称.匹配关系** |
| order=id.desc,name                                                | `{"orders":[{"column":"id","option":"desc"}, {"column":"name"}]}`                                                                                               | 排序条件. 规范为 **字段名称.排序方式** 多个用","分割                                |

### 异常规范

```json
{
  "code": 500,
  "message": "ID=12的数据不存在",
  "context": {
    "field": "id"
  }
}
```

| 字段    | 类型    | 说明           |
| ------- | ------- | -------------- |
| code    | Integer | 错误码         |
| message | String  | 错误描述       |
| context | Any     | 异常上下文信息 |

#### HTTP Response 状态码

返回状态与错误码一致，如 HTTP Response 状态码为 **400~599** 则视为程序处理异常。

#### 错误码定义

错误码含义，基本与 HTTP 协议状态码含义一致，便于 RESTFul API 编写、统一异常处理和工程师理解错误码含义。

| 错误码  | 适用场景                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| 400~499 | 因输入数据错误，导致程序运行失败                                                                                  |
| 500~599 | 因服务端资源不足或程序错误异常，导致程序运行失败                                                                  |
| 400     | 因输入数据不符合要求, 导致程序运行失败。应在上下文数据中描述具体不符合要求的数据字段。                            |
| 401     | 因尚未登录, 导致程序运行失败。                                                                                    |
| 403     | 因访问权限不足, 导致程序运行失败。应在上下文数据中描述具体权限要求信息。                                          |
| 404     | 因查询资源不存在, 导致程序运行失败。应在上下文数据中描述资源名称和数据 ID。                                       |
| 413     | 因输入数据越界，导致程序运行失败。                                                                                |
| 500     | 因服务端异常，导致程序运行失败。应在上下文数据中描述具体错误数据。例如: 因磁盘空间不足等原因导致的，文件写入失败. |
| 503     | 服务器暂时无法访问，导致程序运行失败。比如: MySQL server has gone away!                                           |
| 504     | 因连接超时，导致程序运行失败。比如: MySQL server connect timeout!                                                 |

**新增错误码：**

根据程序需要，可以增加错误码定义，新增错误码必须符合以下规范:

① 必须区分用户输入错误和服务端错误。

② 用户输入错误码范围必须在 418~420,432~450,452~499 之间。

③ 服务端错误码范围必须在 512~599 之间。

参考文档：[Hypertext Transfer Protocol (HTTP) Status Code Registry
](http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)

### 完整示例

完整示例可以查阅 [examples](#完整示例)

```json
{
  "name": "用户接口",
  "version": "1.0.0",
  "description": "用户API",
  "group": "user",
  "guard": "bearer-jwt",
  "paths": [
    {
      "path": "/login",
      "method": "POST",
      "guard": "-",
      "process": "plugins.user.Login",
      "in": ["$payload.mobile", "$payload.password", "$payload.captcha"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/ping",
      "method": "GET",
      "guard": "-",
      "process": "plugins.user.Login",
      "in": ["$payload.mobile", "$payload.password", "$payload.captcha"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/find/:id",
      "method": "GET",
      "guard": "-",
      "process": "models.user.Find",
      "in": ["$param.id", ":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/search",
      "method": "GET",
      "guard": "-",
      "process": "models.user.Paginate",
      "in": [":params", "$query.page", "$query.pagesize"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "path": "/info/:id",
      "method": "GET",
      "process": "models.user.Find",
      "in": ["$param.id", ":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```
