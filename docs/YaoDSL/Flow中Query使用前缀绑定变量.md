# Query flow 中使用前缀绑定变量

在`flow`中使用`query`,并在`query`里引用传入参数或是其它节点的结果时，需要使用前缀\?\: ，而不是`{ {$} }`,因为`{ {} }`代表是的`mysql`中的`json`
注意：只有`sql`中的绑定值才能使用变量，比如`where`条件中的`value`,`like`等。绑定关系是`flow`加载时已经确定好的，不能在运行时进行修改。

```json
{
  "label": "::SAP DATA Fields",
  "version": "1.0.0",
  "description": "GET SAP DataFields",
  "nodes": [
    {
      "name": "dd02t",
      "engine": "xiang",
      "query": {
        "debug": true,
        "select": ["*"],
        "from": "SAPHANADB.DD03VT",
        "wheres": [
          {
            ":DDLANGUAGE": "语言",
            "=": "1"
          },
          {
            ":TABNAME": "表名",
            "like": "?:$in.0"
          }
        ],
        "limit": 100
      }
    }
  ],
  "output": "{{$res}}"
}
```

源代码学习：`gou/query/gou/expression.go`

```go
// parseExpField 解析字段
func (exp *Expression) parseExpField(s string) error {

    // 绑定动态数值
    if strings.HasPrefix(s, "?:") {
        if err := exp.parseExpBindings(); err != nil {
            return err
        }
        return nil
    }
}
```

`?:`理解为`sql`中的`?`参数，不过`?:`是动态的`SQL`绑定参数，可以绑定`flow`中的`in`参数,这个跟一般的`flow`传入绑定参数`{{$in}}`是两个不同的东西。

比如下面的`flow`定义中，希望动态修改`wheres`条件中的`op`。这是无效的操作，`YAO`框架只会解析字段`value`对应的动态参数，而不会解析其它字段的动态参数。

```json
{
  "label": "类目列表",
  "version": "1.0.0",
  "description": "类目列表",
  "nodes": [
    {
      "name": "类目",
      "engine": "xiang",
      "query": {
        "debug": true,
        "select": [
          "category.id",
          "category.name",
          "category.parent_id",
          "category.category_sn",
          "parent.name as parent_name"
        ],
        "from": "category",
        "wheres": [
          {
            "field": "category.name",
            "op": "?:$in.0.wheres.0.op", // 无效
            "value": "?:$in.0.wheres.0.value" // 有效
          }
        ],
        "limit": 1000
      }
    }
  ],
  "output": { "data": "{{$res.类目树}}" }
}
```
