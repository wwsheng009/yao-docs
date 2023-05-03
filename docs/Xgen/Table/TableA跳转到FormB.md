# `tableA`跳转到`FormB`

通过使用类型`Common.historyPush`的`Action`实现关连 form 的跳转。form 的显示都需要一个`id`来关连。在 form 打开时会根据`id`抓取相关`form`的具体信息。

```json
{
  "layout": {
    "table": {
      "operation": {
        "actions": [
          {
            "icon": "category-outline",
            "action": [
              {
                "name": "HistoryPush",
                "payload": {
                  "pathname": "/x/Form/material.category/{{category.id}}/view"
                },
                "type": "Common.historyPush"
              }
            ],
            "title": "查看分类",
            "width": 3
          }
        ]
      }
    }
  }
}
```
