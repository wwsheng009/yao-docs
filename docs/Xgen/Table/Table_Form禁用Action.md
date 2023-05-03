# 根据条件禁用`Table_Form Action`按钮

设置`action.disabled`属性，`action.disabled.bind`是绑定记录的值，`action.disabled.value`是`action`禁用条件,有以下两种情况。

- 当`action.disabled.value`的类型是数组时，`value`的值包含`action.disabled.bind`的值时，`action`按钮被禁用。

- 当`action.disabled.value`的类型不是数组时，`value`的值等于`action.disabled.bind`的值时，`action`按钮被禁用。

比如以下的代码，当记录的`id`是 1 或是 2 时，`action`按钮被禁用。

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
