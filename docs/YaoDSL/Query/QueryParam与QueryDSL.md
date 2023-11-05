# `QueryParam`与`QueryDSL`差异

## 重要的区别

`QueryParam`与`QueryDSL`是两个不同的对象，两者的 wheres 条件的语法是不一样的，不要搞混了。

重要区别：

- `QueryDSL`中的`wheres`使用`field`来定义列名，使用`op`定义损失和方法，或条件使用`{or:true}`表示。
- `QueryParam`中的`wheres`使用`column`来定义列名，使用`method`定义操作方法，或条件使用`"method":"orwhere"`。

应用场景：

- `QueryDSL`用在 Flow/jsapi 中定义描述数据查询条件。
- `QueryParam`主要用于转换`url api`中的查询参数。

### 操作符不一样。

需要注意的是，在`QueryParam`或是`url`使用的操作符跟`query dsl`中不一样，在`query dsl`中是使用以下操作符。

- "="
- ">"
- ">="
- "<"
- "<="
- "<>"
- "like"
- "match"
- "in"
- "is"

而在`QueryParam`或是`url`中只能使用以下操作符。

- eq
- gt
- lt
- ge
- le
- like
- match
- in
- null
- notnull

因为 url 中 不能包含特符号。

### QueryParam 不能在 where 条件中使用简化语法，QueryDSL 可以。

QueryDSL 示例：

在这里的 where 条件没有使用`field`来定义字段，而是采用了一种简化的表示方式。

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    //deleted_at是字段
    //=是操作符
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: ['id as value', 'name as label'],
    from: 'company',
  });
  return res;
}
```

### QueryParam 不能使用数据库函数，QueryDSL 可以。

在 queryParam 里的 select 只能使用数据库表的列名，不能使用函数或是 as 别名。

### QueryParam 可以在数据模型处理器中使用,QueryDSL 不可以。

数据模型处理器 Find, Get, Paginate, UpdateWhere, DeleteWhere, DestroyWhere 均支持传入 QueryParam 查询参数

## 使用建议

- 在 flow 定义中使用 `QueryDSL`
- 在 Js Query 对象中使用 `QueryParam`

- 在调用模型或是`form/table`处理器时使用`QueryParam`。

## 示例

QueryDSL

```json
{
  "wheres": [
    { "field": "created_at", "op": ">=", "value": "2020-01-01" },
    { "field": "created_at", "op": "<=", "value": "{'2020-12-31'}" },
    { "field": "created_at", "op": "<=", "value": "{updated_at}" },
    {
      "wheres": [
        { "field": "type", "value": 1 },
        { "or": true, "field": "type", "value": 2 } //表示或
      ]
    },
    {
      "comment": "限定范围: 仅列出有效厂商",
      "field": "manu_id",
      "op": "in",
      "query": {
        "select": ["id"],
        "from": "$manu",
        "wheres": [{ "field": "status", "value": "enabled" }]
      }
    }
  ]
}
```
