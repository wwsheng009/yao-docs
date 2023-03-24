# form 的一些使用技巧

[使用`Studio`脚本生成`Form`配置](../Studio/%E8%87%AA%E5%8A%A8%E7%94%9F%E6%88%90table_form%E5%AE%9A%E4%B9%89%E6%96%87%E4%BB%B6.md)

## form 最小化配置

只需要以下最小的配置，即可在`xgen`上使用`form`.字段与控件的配置会根据`model`中的配置自动生成

```json
{
  "name": "用户",
  "action": {
    "bind": {
      "model": "<MODEL_ID>",
      "option": {
        "withs": { "<RELATETION_ID>": {} }
      }
    }
  }
}
```

## 给 form 增加常用的三个按钮

文件配置路径:`layout.actions`,注意替换<MODEL_ID>

```json
{
  "layout": {
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
  }
}
```
