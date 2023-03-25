# 数据查询使用 SQL.STMT 需要注意的问题

如果是使用`query`中的`sql`指定`sql.stmt`。那么`sql`执行后不会返回结果集，因为它使用的是`sql.exec`方法

以下的使用方法是错误的。

```json
{
  "label": "查询最新数据",
  "version": "1.0.0",
  "description": "查询系统最新数据",
  "nodes": [
    {
      "name": "宠物",
      "engine": "xiang",
      "query": {
        "debug": true,
        "sql": {
          "stmt": "select \"id\" from \"address\""
        }
      }
    }
  ]
}
```

源代码学习：`yao/source/gou/query/gou/query.go`

```go
// Run 执行查询根据查询条件返回结果
func (gou Query) Run(data maps.Map) interface{} {

    if gou.Page != nil || gou.PageSize != nil {
        return gou.Paginate(data)
    } else if gou.QueryDSL.First != nil {
        return gou.First(data)
    } else if gou.SQL == nil {
        return gou.Get(data)
    }

    sql, bindings := gou.prepare(data)
    qb := gou.Query.New()
    qb.SQL(sql, bindings...)

    // Debug模式 打印查询信息
    if gou.Debug {
        fmt.Println(sql)
        utils.Dump(bindings)
    }

    res, err := qb.DB().Exec(sql, bindings...)//sql.stmt在这里执行了
    if err != nil {
        exception.New("数据查询错误 %s", 500, err.Error()).Throw()
    }
    return res
}
```
