# 远程 select 控件

`Tag`,`Select`控件可以使用固定的 options 选项，也可以使用数据库表中的数据作为选项。

```json
{
  "类目": {
    "bind": "category_id",
    "view": {
      "type": "Tag",
      "props": {
        "placeholder": "请输入 类目",
        "xProps": {
          "$remote": {
            "process": "yao.component.SelectOptions",
            "query": {
              "model": "material.category",
              "label": "name",
              "value": "id"
            }
          }
        }
      }
    },
    "edit": {
      "type": "Select",
      "props": {
        "placeholder": "请输入 类目",
        "xProps": {
          "$remote": {
            "process": "yao.component.SelectOptions",
            "query": {
              "model": "material.category",
              "label": "name",
              "value": "id"
            }
          }
        }
      }
    }
  }
}
```

远程控件本身带有数据缓存功能，第一次读取数据后会在浏览器本地缓存。如果不需要缓存功能，需要在`app.json`里设置选项`optional.remoteCache`为`false`

```json
{
  "xgen": "1.0",
  "name": "智慧仓库管理平台",
  "short": "智慧仓库",
  "version": "0.10.3",
  "description": "智慧仓库管理平台",
  "adminRoot": "admin",
  "optional": {
    "remoteCache": false
  },
  "menu": {
    "process": "flows.app.menu",
    "args": []
  }
}
```

默认情况下，如果`Tag`控件绑定的字段值是字符串，而不是列表。只会显示`Value`。为了让单个值也能搜索`option`中的标签值，需要增强`Tag`控件：

https://github.com/wwsheng009/xgen/blob/main/packages/xgen/components/view/Tag/index.tsx
