# select 控件动态搜索

这里有一个[bug](../../../%E6%BA%90%E4%BB%A3%E7%A0%81/Xgen/xgen%20remoteSearch.md)。

xpath:`edit.props.xProps.$search`,

```json
{
  "上级类目": {
    "bind": "parent_id",
    "edit": {
      "type": "Select",
      "props": {
        "xProps": {
          "$search": {
            "process": "scripts.category.Search",
            "query": {
              "key": "id",
              "id": "{{id}}"
            }
          }
        }
      }
    }
  }
}
```
