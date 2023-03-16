# table 的一些使用技巧

## 常见问题

Q:在`fields`节点配置了字段，无法在界面上显示。

A:需要在`layout.table.columns中增加对应字段`

## table 最小化配置

只需要以下最小的配置，即可在`xgen`上使用`table`.字段与控件的配置会根据`model`中的配置自动生成。

`action.bind.option.form`的配置会自动的增加创建按钮与`table`行项目中的三个常用按钮

```json
{
  "name": "用户",
  "action": {
    "bind": {
      "model": "<MODEL_ID>",
      "option": {
        "withs": { "<RELATETION_ID>": {} },
        "form": "<FORM_ID>"
      }
    }
  }
}
```

## 在 table 中设置字段只读

只需要把`fields`中的字段对应的编辑控件`edit`删除掉，只保留`view`配置。

```json
{
  "fields": {
    "table": {
      "创建时间": {
        "bind": "created_at",
        "view": { "props": { "format": "YYYY-MM-DD HH:mm:ss" }, "type": "Text" }
      },
      "更新时间": {
        "bind": "updated_at",
        "view": { "props": { "format": "YYYY-MM-DD HH:mm:ss" }, "type": "Text" }
      }
    }
  }
}
```

## 在`table`界面上增加创建按钮

需要先增加相关的`form`配置文件

方法一,在绑定节点使用 form 选项,配置路径`action.bind.option.form`

```json
{
  "action": {
    "bind": {
      "model": "user",
      "option": {
        "withs": { "supplier": {} },
        "form": "user"
      }
    }
  }
}
```

方法二,手动配置路径:`layout.filter.actions`,注意替换<FORMID>。不要使用 layout.header.actions,配置了也没效。

```json
{
  "layout": {
    "filter": {
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
    }
  }
}
```

## 增加查看，编辑，删除按钮,需要先增加相关的`form`配置文件

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
