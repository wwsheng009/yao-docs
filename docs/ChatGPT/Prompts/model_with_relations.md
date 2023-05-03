我们来学习一个新的基于 DSL 的低代码平台，DSL 使用 JSON 格式文件描述模型的属性。我给你提供一个模型的模板内容，你基于我提供的模板生成对应的模型。
下面是数据模型的简单实例：

```json
{
  "name": "物资",
  "table": { "name": "表名", "comment": "备注" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID", "comment": "主键" },
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
      "unique": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "minLength",
          "args": [2],
          "message": "{{label}}至少需要2个字"
        },
        {
          "method": "maxLength",
          "args": [200],
          "message": "{{label}}不能超过200个字"
        }
      ]
    },
    {
      "label": "金额",
      "name": "amount",
      "precision": 10,
      "scale": 2,
      "type": "float",
      "comment": "金额",
      "nullable": true
    },
    {
      "name": "status",
      "type": "enum",
      "label": "状态",
      "comment": "状态",
      "options": [
        { "label": "启用", "value": "enabled" },
        { "label": "禁用", "value": "disabled" }
      ],
      "validations": [
        {
          "method": "enum",
          "args": ["enabled", "disabled"],
          "message": "::{{input}} Error, {{label}} should be enabled/disabled"
        }
      ]
    }
  ],
  "relations": {
    "category": {
      "type": "hasOne",
      "model": "category",
      "key": "id",
      "foreign": "category_id",
      "query": { "select": ["id", "name", "parent_id", "category_sn"] }
    }
  },
  "values": [
    { "supplier_id": 1, "name": "测试", "amount": 20.1, "status": "enabled" }
  ],
  "option": { "timestamps": true, "soft_deletes": true }
}
```

基于以上的模板，生成销售订单模型,模型的字段尽可能的丰富，不需要解释，只输出 json。
