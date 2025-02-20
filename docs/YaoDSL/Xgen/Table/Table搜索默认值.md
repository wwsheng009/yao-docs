# `Table`搜索默认条件

设置 Table 分页搜索的默认条件。

方法一，设置`action.search.default`。

`search`是指 Table 搜索接口的处理器的配置，而`default`是配置处理器的默认参数列表，`default`配置项的类型是一个数组，数组内容对应着相关处理器的参数。可以理解为配置处理器的默认参数列表。

比如这里的`search`对应的处理器是`yao.table.search`,它的参数是`[queryParam,page,pagesize]`，
这里的第一个参数类型是 QueryParam。

```json
{
  "action": {
    "search": {
      "default": [
        {
          "wheres": [
            {
              "column": "type",
              "op": "in",
              "value": ["入库", "进入"]
            }
          ]
        }
      ]
    }
  }
}
```

同理也可以设置其它的处理器默认参数。

- setting
- component
- upload
- download
- search
- get
- find
- save
- create
- insert
- delete
- delete-in
- delete-where
- update
- update-in
- update-where

方法二，设置`action.bind.option`

```json
{
  "action": {
    "bind": {
      "option": {
        "wheres": [
          {
            "column": "type",
            "op": "in",
            "value": "入库,进入"
          }
        ]
      }
    }
  }
}
```

## `Table`默认排序

```json
{
  "$schema": "https://raw.githubusercontent.com/wwsheng009/yao-app-ts-types/main/json-schemas/0.10.3/table.json",
  "name": "Hero List",
  "action": {
    "bind": {
      "model": "hero",
      "option": {}
    },
    "search": {
      "default": [
        {
          "orders": [
            { "column": "defense", "option": "asc" },
            { "column": "name", "option": "desc" }
          ]
        }
      ]
    }
  }
}
```
