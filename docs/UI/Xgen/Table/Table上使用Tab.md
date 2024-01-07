# 在 Table 上使用 Tab 控件

在`form.json`中配置路径为`layout.form.sections[0].columns[0].tabs`

`tabs`跟`column`同级别。在`tabs`中可以嵌套`columns`

```jsonc
{
  "layout": {
    "form": {
      "props": {},
      "sections": [
        {
          "title": "基础信息",
          "desc": "宠物的一些基本信息",
          "columns": [
            {
              "width": 24,
              "tabs": [
                {
                  "title": "Base",
                  "columns": [
                    {
                      "name": "名称",
                      "width": 12
                    }
                  ]
                },
                {
                  "title": "More",
                  "columns": [
                    {
                      "name": "状态",
                      "width": 12
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```
