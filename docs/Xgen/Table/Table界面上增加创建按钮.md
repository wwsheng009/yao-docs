# 在`table`界面上增加创建按钮

需要先增加相关的`form`配置文件。

方法一,在绑定节点使用 form 选项,配置路径:
xpath:"action.bind.option.form".

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

方法二,手动配置路径:`layout.filter.actions`,注意替换\<FORMID\>。不要使用 layout.header.actions,配置了也没效。

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
