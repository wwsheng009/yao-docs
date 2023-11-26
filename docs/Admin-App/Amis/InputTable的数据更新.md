# InputTable setValue 更新

在使用 InputTable 时，如果通过使用`setValue`方法来更新表数据时，有时会发现，值更新了，但是界面没有更新。

比如这里使用 Button 来设置全选，点击按钮后并不生效。

```json
{
  "type": "button",
  "label": "全选",
  "onEvent": {
    "click": {
      "actions": [
        {
          "actionType": "custom",
          "script": "debugger;event.data.columns.forEach(col => {col.checked = true});\n\n"
        },
        {
          "componentId": "model_columns",
          "actionType": "setValue",
          "args": {
            "value": "${event.data.columns}"
          }
        }
      ]
    }
  }
}
```

有两个方法，一个是先清空值，再设置值，但是界面会闪烁。

```json
{
  "type": "button",
  "label": "全选",
  "onEvent": {
    "click": {
      "actions": [
        {
          "actionType": "custom",
          "script": "debugger;event.data.columns.forEach(col => {col.checked = true});\n\n"
        },
        {
          "componentId": "model_columns",
          "actionType": "clear"
        },
        {
          "componentId": "model_columns",
          "actionType": "setValue",
          "args": {
            "value": "${event.data.columns}"
          }
        }
      ]
    }
  }
}
```

二是可以配置`"canAccessSuperData": true` 同时配置 `"strictMode": false` 开启此特性，如下，配置了该配置项后，界面值会自动更新。

https://baidu.github.io/amis/zh-CN/components/form/input-table#%E8%8E%B7%E5%8F%96%E7%88%B6%E7%BA%A7%E6%95%B0%E6%8D%AE

方法二使用起来有点异常，有些数据会更新失败。需要手动更新行项目触发更新。
