table 与 form 常用 action 配置

table 创建按钮

注意替换<FORMID>
xpath:layout.filter.actions,不要使用 layout.header.actions,配置了也没效

```json
"actions": [
    {
      "action": [
        {
          "name": "HistoryPush",
          "payload": {
            "pathname": "/x/Form/<FORMID>/0/edit"
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

table action
xpath:layout.table.operation.actions
注意替换<MODEL_ID>

```json

"actions": [
   {
     "action": [
       {
         "name": "OpenModal",
         "payload": {
           "Form": {
             "model": "<MODEL_ID>",
             "type": "view"
           }
         },
         "type": "Common.openModal"
       }
     ],
     "icon": "icon-eye",
     "title": "查看"
   },
   {
     "action": [
       {
         "name": "OpenModal",
         "payload": {
           "Form": {
             "model": "<MODEL_ID>",
             "type": "edit"
           }
         },
         "type": "Common.openModal"
       }
     ],
     "icon": "icon-edit-2",
     "title": "编辑"
   },
   {
     "action": [
      {
        "name": "Confirm",
        "type": "Common.confirm",
        "payload": {
          "title": "确认删除",
          "content": "删除后不可撤销！"
        }
      },
       {
         "name": "Delete",
         "payload": {
           "model": "<MODEL_ID>"
         },
         "type": "Table.delete"
       }
     ],
     "icon": "icon-trash-2",
     "style": "danger",
     "title": "Delete"
   }
]
```

form

给 form 增加常用的三个按钮

xpath:layout.actions
注意替换<MODEL_ID>

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
    "icon": "icon-trash-2",
    "style": "danger",
    "title": "Delete",
    "action": [
      {
        "name": "Confirm",
        "type": "Common.confirm",
        "payload": {
          "title": "确认删除",
          "content": "删除后不可撤销！"
        }
      },
      {
        "name": "Delete",
        "payload": {
          "model": "<MODEL_ID>"
        },
        "type": "Form.delete"
      },
      {
          "name": "Back",
          "type": "Common.closeModal",
          "payload": {}
      }
    ]
  }
]
```
