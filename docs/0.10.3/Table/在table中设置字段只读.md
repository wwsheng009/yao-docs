# 在 table 中设置字段只读

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
