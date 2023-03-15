table 与 form 常用 action 配置

table 创建按钮
xpath:layout.filter.actions

```json
    "actions": [
        {
          "action": [
            {
              "name": "HistoryPush",
              "payload": {
                "pathname": "/x/Form/ai.chatlog/0/edit"
              },
              "type": "Common.historyPush"
            }
          ],
          "icon": "icon-plus",
          "title": "::Create",
          "width": 3
        }
      ]
```

form/table

给 form 增加常用的三个按钮

xpath:layout.actions

```json
"actions": [
  {
    "title": "返回",
    "icon": "icon-arrow-left",
    "showWhenAdd": true,
    "showWhenView": true,
    "action": [
      {
        "name": "CloseModal",
        "type": "Common.closeModal",
        "payload": {}
      }
    ]
  },
  {
    "title": "保存",
    "icon": "icon-check",
    "style": "primary",
    "showWhenAdd": true,
    "action": [
      {
        "name": "Submit",
        "type": "Form.submit",
        "payload": {}
      },
      {
        "name": "Back",
        "type": "Common.closeModal",
        "payload": {}
      }
    ]
  },
  {
    "action": [
      {
        "name": "Delete",
        "payload": {
          "model": "ai.chatlog"
        },
        "type": "Form.delete"
      }
    ],
    "confirm": {
      "desc": "请确认删除，删除后数据无法恢复",
      "title": "确认"
    },
    "icon": "icon-trash-2",
    "style": "danger",
    "title": "Delete"
  }
]
```
