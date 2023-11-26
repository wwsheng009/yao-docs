# `Table`搜索默认条件

设置 Table 的默认搜索条件。

方法一，设置`action.search.default`。

[QueryDSL/查询条件](https://yaoapps.com/doc/%E6%89%8B%E5%86%8C/QueryDSL/%E6%9F%A5%E8%AF%A2%E6%9D%A1%E4%BB%B6)

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
