# table 最小化配置

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

**注意**

需要注意的是，使用最小化配置时，关联的模型需要需要有过滤器 filter 的设置。

也即是，需要确保在模型的字段定义中至少有一个字段的属性 index/unique/primary 设置成 true,会自动生成 filter。
