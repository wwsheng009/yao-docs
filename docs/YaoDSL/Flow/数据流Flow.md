# 数据流规范

数据流(`Flow`)用来编排数据查询逻辑，可以作为处理 (`process`) 来使用，引用方式为 `flows.<数据流名称>` 。

## 1 命名规范

数据流描述文件是以 **小写英文字母** + `.flow.json` 扩展名命名的 JSON 文本文件, `<name>.flow.json`;
结果处理脚本文件是以 `数据流名称` + `.` + `脚本名称` + `.js` 扩展名，命名的 JavaScript 脚本文件 `<name>.<script>.js` 。

| 文件夹 (相对数据流根目录) | 文件名         | 数据流名称           | Process (在 API /Flow 中引用) |
| ------------------------- | -------------- | -------------------- | ----------------------------- |
| /                         | name.flow.json | `name`               | `flows.name`                  |
| /group                    | name.flow.json | `group.name`         | `flows.group.name`            |
| /group1/group2            | name.flow.json | `group1.group2.name` | `flows.group1.group2.name`    |

## 2 文档结构

数据流编排文档，由基础信息、查询节点和输出结果构成。

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [],
  "output": {}
}
```

| 字段        | 类型                | 说明                                   | 必填项 |
| ----------- | ------------------- | -------------------------------------- | ------ |
| label       | String              | 数据流呈现名称，用于开发平台呈现       | 是     |
| version     | String              | 版本号，用于依赖关系校验和开发平台呈现 | 是     |
| description | String              | 数据流介绍，用于开发平台呈现           | 否     |
| nodes       | Array<Object Node\> | 查询节点                               | 是     |
| output      | Object              | 输出结果定义                           | 是     |

## 2.1 查询节点 `nodes`

```json
{
  "nodes": [
    {
      "name": "manus",
      "process": "models.manu.get",
      "args": [
        {
          "select": ["id", "name", "short_name"],
          "limit": 20,
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "name", "value": "{{$in.0}}", "op": "like" }
          ]
        }
      ],
      "outs": ["{{$out.manus}}", "{{$out.manu_ids}}"]
    }
  ]
}
```

一个数据流编排(`Flow`)可以有多个查询节点, 每个查询节点，可以调用一个处理器(`process`), 可以指定结果处理脚本和返回值，在查询节点用可以引用上下文信息

`Object Node` 数据结构

:::v-pre
| 字段 | 类型 | 说明 | 必填项 |
| ------- | -------------- | ----------------------------------------------------------------------------------------- | ------ |
| name | String | 查询节点名称 | 是 |
| process | String | 调用处理器 `process` | 是 |
| args | Array<Any\> | 处理器参数表.可以引用输入输出或上下文数据 | 是 |
| outs | Array<String\> | 查询节点结果输出.使用 `{{$out}}` 引用处理器返回结果。如不设置，返回值等于处理器返回结果。 | 否 |
| next | Object Next | 当查询结果符合设定条件时跳转至指定查询节点(**尚未实现**) | 否 |
:::

## 2.2 输出结果 `output`

```json
{
  "output": {
    "foo": "{{$in}}",
    "bar": {
      "node1": "{{$res.node1.0}}",
      "node2": "{{$res.node2.0}}",
      "node3": "{{$res.node3}}"
    },
    "data": "{{$res}}",
    "ping": "pong"
  }
}
```

:::v-pre
可以根据业务需要，自由定义数据流(`Flow`)的输出结果。 可以使用 `{{$in}}` 引用数据流(`Flow`)调用时传入的参数、使用 `{{$res}}` 引用各个查询节点返回值。
:::

## 3 上下文数据引用

:::v-pre
数据流(`Flow`)可以在全局引用传参(`{{$in}}`)和 各查询节点返回值 `{{$res}}`。查询节点内 `outs` 数组中，可以引用处理器 (`process`) 的返回值 `{{out}}`。
:::

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [
    {
      "name": "manus",
      "process": "models.manu.get",
      "args": [
        {
          "select": ["id", "name", "short_name"],
          "limit": 20,
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "name", "value": "{{$in.0}}", "op": "like" }
          ]
        }
      ],
      "script": "rank",
      "outs": ["{{$out.manus}}", "{{$out.manu_ids}}"]
    },
    {
      "name": "github",
      "process": "plugins.user.github",
      "args": [
        "{{$res.users.0}}",
        "{{$res.manus}}",
        "{{$in.0}}",
        "{{$in.1}}",
        "{{$in.2}}",
        "{{hello(:$res.users, 'id', 0.618, 10)}}",
        "foo",
        1
      ]
    }
  ],
  "output": {
    "params": "{{$in}}",
    "data": {
      "manus": "{{$res.manus.0}}",
      "github": "{{$res.github}}"
    }
  }
}
```

### 变量

:::v-pre
| 变量 | 类型 | 说明 | 使用范围 | 示例 |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `{{$in}}` | Array<Any\> | 数据流调用时传入的参数表, 支持使用数组下标访问指定参数, 例如： `{{$in.0}}` 第 1 个参数, `{{$in.1}}` 第 2 个参数, | `nodes[n].args`, `nodes[n].outs`, `output` | `{{$in}}`, `{{$in.0}}`,`{{$in.0.name}}` |
| `{{$res}}` | \[key:String\]:Any | 查询节点返回值(`nodes[n].outs`) 映射表, 支持使用查询节点名称访问特定查询节点返回值。例如 `{{$res.node1.0}}` node1 的第一返回值。 | `nodes[n].args`, `nodes[n].outs`, `output` | `{{$res}}`, `{{$res.node1.0.name}}`, `{{$res.node2.manu_id}}` |
| `{{out}}` | Any | 查询节点的处理器(`process`)返回值，支持使用 `.` 应用 Object /Array 数值 | `nodes[n].outs` | `{{out}}`, `{{out.name}}`, `{{out.0}}` |
:::

### Helper 函数

:::v-pre
可以在 `nodes[n].args`, `nodes[n].outs`, `output` 中使用 `Helper` 函数。调用方法为 `{{method(args...)}}` 参数表支持使用变量 写法为 `:$res.node1`, 字符串使用单引号 `'`，例如: `{{hello(:$res.users, 'id', 0.618, 10)}}`

Helper 函数表

| 函数    | 参数表                       | 返回值                   | 示例                          |
| ------- | ---------------------------- | ------------------------ | ----------------------------- |
| `pluck` | `row: Array`, `name: String` | `Array` 指定字段数值集合 | `{{pluck(:$res.user, 'id')}}` |

:::

## 5 外部引用

数据流(`Flow`) 可以作为处理，在其他数据流(`Flow`)或服务接口(`API`)中调用。处理器引用方式为 `flows.数据流名称`

### 5.1 在其他数据流(Flow)中调用

```json
{
  "nodes": [
    {
      "name": "github",
      "process": "flows.github",
      "args": ["{{$in.1}}", "{{$in.2}}", "foo", 1],
      "script": "count",
      "outs": ["$out.args", "$out.plugin"]
    }
  ]
}
```

### 5.2 在服务接口(API)中调用

```json
{
  "path": "/latest/:day",
  "method": "GET",
  "process": "flows.latest",
  "in": ["$param.day"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

## 6 完整示例

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [
    {
      "name": "manus",
      "process": "models.manu.get",
      "args": [
        {
          "select": ["id", "name", "short_name"],
          "limit": 20,
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "name", "value": "{{$in.0}}", "op": "like" }
          ]
        }
      ],
      "outs": ["{{$out.manus}}", "{{$out.manu_ids}}"]
    },
    {
      "name": "users",
      "process": "models.user.paginate",
      "args": [
        {
          "select": ["id", "name", "extra", "resume"],
          "withs": {
            "manu": { "query": { "select": ["name", "short_name"] } },
            "addresses": {
              "query": { "select": ["province", "city", "location"] }
            }
          },
          "orders": [{ "column": "created_at", "option": "desc" }],
          "wheres": [
            { "column": "status", "value": "enabled" },
            { "column": "manu_id", "value": "{{$res.manus.1}}", "op": "in" }
          ]
        },
        1,
        20
      ],
      "outs": ["{{$out.data}}"]
    },
    {
      "name": "github",
      "process": "plugins.user.github",
      "args": [
        "{{$res.users.0}}",
        "{{$res.manus}}",
        "{{$in.0}}",
        "{{$in.1}}",
        "{{$in.2}}",
        "{{pluck(:$res.users, 'id', 0.618, 10)}}",
        "foo",
        1
      ]
    }
  ],
  "output": {
    "params": "{{$in}}",
    "data": {
      "manus": "{{$res.manus.0}}",
      "users": "{{$res.users.0}}",
      "count": "{{$res.count}}"
    }
  }
}
```
