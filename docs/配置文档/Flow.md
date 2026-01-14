# Flow 配置文档

## 概述

Flow(数据流)是 YaoDSL 中用于编排数据查询逻辑的配置文件。数据流可以作为处理器在其他数据流或服务接口中调用，为系统提供了一套灵活的数据处理流程控制机制。

## 命名规范

### 文件命名

- **数据流描述文件**: 以小写英文字母 + `.flow.json` 扩展名命名，格式为 `【name】.flow.json`
- **结果处理脚本文件**: 以 `数据流名称.脚本名称.js` 格式命名

### 命名空间规则

| 文件夹 (相对数据流根目录) | 文件名         | 数据流名称           | Process 引用方式           |
| ------------------------- | -------------- | -------------------- | -------------------------- |
| /                         | name.flow.json | `name`               | `flows.name`               |
| /group                    | name.flow.json | `group.name`         | `flows.group.name`         |
| /group1/group2            | name.flow.json | `group1.group2.name` | `flows.group1.group2.name` |

## 文档结构

数据流编排文档由基础信息、查询节点和输出结果构成:

```json
{
  "label": "最新信息",
  "version": "1.0.0",
  "description": "最新信息",
  "nodes": [],
  "output": {}
}
```

| 字段        | 类型               | 说明                                   | 必填项 |
| ----------- | ------------------ | -------------------------------------- | ------ |
| label       | String             | 数据流呈现名称，用于开发平台呈现       | 是     |
| version     | String             | 版本号，用于依赖关系校验和开发平台呈现 | 是     |
| description | String             | 数据流介绍，用于开发平台呈现           | 否     |
| nodes       | Array[Object Node] | 查询节点列表                           | 是     |
| output      | Object             | 输出结果定义                           | 是     |

## 查询节点 (nodes)

### 基本结构

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

### Node 数据结构

:::v-pre

| 字段    | 类型          | 说明                                                                                       | 必填项 |
| ------- | ------------- | ------------------------------------------------------------------------------------------ | ------ |
| name    | String        | 查询节点名称                                                                               | 是     |
| process | String        | 调用的处理器(process)                                                                      | 是     |
| args    | Array<Any>    | 处理器参数表，可以引用输入输出或上下文数据                                                 | 是     |
| outs    | Array<String> | 查询节点结果输出，使用 `{{$out}}` 引用处理器返回结果。如不设置，返回值等于处理器返回结果。 | 否     |
| next    | Object Next   | 当查询结果符合设定条件时跳转至指定查询节点(**尚未实现**)                                   | 否     |

:::

## 输出结果 (output)

### 基本结构

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

`output` 字段用于声明数据流的输出结果，如不声明则返回所有节点的运行结果。可以根据业务需要自由定义输出结构。

## 上下文数据引用

### 变量类型

:::v-pre
| 变量 | 类型 | 说明 | 使用范围 | 示例 |
| ---------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `{{$in}}` | array<any> | 数据流调用时传入的参数表，支持使用数组下标访问指定参数，例如: `{{$in.0}}` 第1个参数，`{{$in.1}}` 第2个参数 | `nodes[*].args`, `nodes[*].outs`, `output` | `{{$in}}`, `{{$in.0}}`, `{{$in.0.name}}` |
| `{{$res}}` | [key:string]:any | 查询节点返回值(`nodes[*].outs`) 映射表，支持使用查询节点名称访问特定查询节点返回值。例如 `{{$res.node1.0}}` node1 的第一返回值。 | `nodes[*].args`, `nodes[*].outs`, `output` | `{{$res}}`, `{{$res.node1.0.name}}`, `{{$res.node2.manu_id}}` |
| `{{$out}}` | any | 查询节点的处理器(`process`)返回值，支持使用 `.` 访问 Object /Array 数值 | `nodes[*].outs` | `{{out}}`, `{{out.name}}`, `{{out.0}}` |

> **提示**: 如果参数表只有一个参数，且数据类型为映射表 [key:string]:any，则可以通过键名 `$in.键名` 直接访问输入数据。例如，传入参数为 `{"name": "张三"}` 时，可以使用 `$in.name` 访问 `"张三"` 这个值。
> :::

### Helper 函数

:::v-pre
可以在 `nodes[n].args`、`nodes[n].outs`、`output` 中使用 Helper 函数。调用方法为 `{{method(args...)}}`，参数表支持使用变量写法为 `:$res.node1`，字符串使用单引号 `'`，例如: `{{hello(:$res.users, 'id', 0.618, 10)}}`

| 函数    | 参数表                       | 返回值                   | 示例                          |
| ------- | ---------------------------- | ------------------------ | ----------------------------- |
| `pluck` | `row: Array`, `name: String` | `Array` 指定字段数值集合 | `{{pluck(:$res.user, 'id')}}` |

:::

## 流程控制

数据流提供内置的流程控制处理器，用于实现复杂的数据处理逻辑:

### 内置流程控制处理器

| 处理器            | 别名                | 说明                    |
| ----------------- | ------------------- | ----------------------- |
| xiang.flow.For    | xiang.helper.For    | 遍历数据(指定数值范围)  |
| xiang.flow.Each   | xiang.helper.Each   | 遍历数据(数组/对象/Map) |
| xiang.flow.Case   | xiang.helper.Case   | Case 流程控制           |
| xiang.flow.IF     | xiang.helper.IF     | IF 流程控制             |
| xiang.flow.Return | xiang.helper.Return | 返回输入数据            |
| xiang.flow.Throw  | xiang.helper.Throw  | 抛出异常并结束程序      |

### IF/CASE 流程控制

支持单条件和多条件 OR 逻辑的条件判断:

```json
{
  "label": "IF流程控制示例",
  "version": "1.0.0",
  "description": "演示IF流程控制的使用方法",
  "nodes": [
    {
      "name": "条件判断",
      "process": "xiang.flow.IF",
      "args": [
        {
          "name": "多条件OR逻辑",
          "when": [
            { "用户": "张三", "=": "李四" },
            { "or": true, "用户": "李四", "=": "李四" }
          ],
          "process": "flows.处理A",
          "args": ["world"]
        },
        {
          "name": "单条件判断",
          "when": [{ "用户": "张三", "=": "张三" }],
          "process": "flows.处理B",
          "args": ["foo"]
        }
      ]
    }
  ]
}
```

### Each 流程控制

支持遍历多种数据类型: 整数、数组/切片、Map、结构体:

```json
{
  "label": "Each流程控制示例",
  "version": "1.0.0",
  "description": "演示Each流程控制的使用方法",
  "nodes": [
    {
      "name": "遍历数组",
      "process": "xiang.flow.Each",
      "args": [
        ["A", "B", "C", "D"],
        {
          "process": "flows.处理数组元素",
          "args": ["::key", "::value"]
        }
      ]
    }
  ]
}
```

- `::key`: 当前索引或属性名
- `::value`: 当前元素值或属性值

### For 流程控制

遍历指定数值范围:

```json
{
  "label": "For流程控制示例",
  "version": "1.0.0",
  "description": "演示For流程控制的使用方法",
  "nodes": [
    {
      "name": "数值遍历",
      "process": "xiang.flow.For",
      "args": [
        0,
        5,
        {
          "process": "flows.处理数值",
          "args": ["::key", "::value"]
        }
      ]
    }
  ]
}
```

For 流程控制接收三个参数:

1. 起始值(包含)
2. 结束值(不包含)
3. 处理器配置

## 外部引用

数据流可以作为处理器，在其他数据流或服务接口中调用。处理器引用方式为 `flows.数据流名称`

### 在数据流中调用

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

### 在服务接口(API)中调用

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

## 完整示例

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

## 运行数据流

```bash
yao run flows.<数据流名称> [参数...]
```

例如:

```bash
yao run flows.latest 猫
```
