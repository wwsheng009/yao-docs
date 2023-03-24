# 增加查看，编辑，删除按钮

需要先增加模型对应的`form`配置文件

配置路径:`layout.table.operation.actions`,注意替换<MODEL_ID>

```json
{
  "layout": {
    "table": {
      "operation": {
        "actions": [
          {
            "icon": "icon-eye",
            "title": "查看",
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
            ]
          },
          {
            "icon": "icon-edit-2",
            "title": "编辑",
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
                "type": "Table.delete"
              }
            ]
          }
        ]
      }
    }
  }
}
```
