下面是一个业务模型的描述文件模板，基于这个模板，生成销售订单模型，只输出 json 内容，不需要解释

```json
{
  "name": "物资-模型名称",
  "table": { "name": "数据库表名", "comment": "模型备注" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID", "comment": "数据库表主键" },
    {
      "label": "厂商",
      "name": "supplier_id",
      "type": "bigInteger",
      "comment": "所属厂商",
      "nullable": true
    },
    {
      "label": "名称",
      "name": "name",
      "type": "string",
      "length": 200,
      "index": true,
      "unique": true
    },
    {
      "label": "类目",
      "name": "category_id",
      "type": "integer",
      "comment": "所属类目-外键字段",
      "nullable": true
    },
    {
      "label": "图片-图片类型使用json",
      "name": "images",
      "type": "json",
      "nullable": true
    },
    {
      "label": "介绍-长文本使用text",
      "name": "detail",
      "type": "text",
      "nullable": true
    }
  ],
  "relations": {
    "category": {
      "type": "hasOne",
      "model": "category",
      "key": "id",
      "foreign": "category_id",
      "query": {
        "select": ["id", "name", "parent_id", "category_sn"]
      }
    },
    "supplier": {
      "type": "hasOne",
      "model": "supplier",
      "key": "id",
      "foreign": "supplier_id",
      "query": {
        "select": ["id", "name", "short", "sn"]
      }
    }
  },
  "option": { "timestamps": true, "soft_deletes": true }
}
```
