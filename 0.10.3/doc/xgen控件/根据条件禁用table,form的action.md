# Table/Form Action 控件根据记录的值禁用

设置`action.disabled`属性，`action.disabled.bind`是绑定的值，`action.disabled.value`是禁用条件。

- 当`action.disabled.value`的类型是数组并且值中包含`action.disabled.bind`的值时，`action`不可用。
- 当`action.disabled.value`的类型不是数组并且值等于`action.disabled.bind`的值时，`action`不可用。

比如以下的代码，当记录的 id 是 1 或是 2 时，action 被禁用。

```json
{
  "operation": {
    "fold": false,
    "width": 60,
    "actions": [
      {
        "title": "查看",
        "icon": "icon-eye",
        "disabled": {
          "bind": "{{id}}",
          "value": ["1", "2"]
        }
      }
    ]
  }
}
```
