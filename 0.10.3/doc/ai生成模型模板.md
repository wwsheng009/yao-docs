## chatgpt 生成模型的提示词模板

我们来学习一个新的基于 DSL 的低代码平台，DSL 使用 JSON 格式文件描述模型的属性。我给你提供一个模型的模板内容，你基于我提供的模板生成对应的模型。
下面是数据模型的简单实例：

```json
{
  "name": "物资",
  "table": { "name": "material", "comment": "物资" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "厂商",
      "name": "supplier_id",
      "type": "bigInteger",
      "comment": "所属厂商",
      "index": true,
      "nullable": true
    },
    {
      "label": "名称",
      "name": "name",
      "type": "string",
      "length": 200,
      "unique": true
    },
    {
      "label": "类目",
      "name": "category_id",
      "type": "integer",
      "comment": "所属类目",
      "index": true,
      "nullable": true
    },
    { "label": "图片", "name": "images", "type": "json", "nullable": true },
    { "label": "介绍", "name": "detail", "type": "text", "nullable": true }
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

基于以上的模板，生成图书管理系统中所有的模型
