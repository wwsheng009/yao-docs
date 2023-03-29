# Yao 在 url 请求中使用查询语法 QueryParam

`QueryParam`可以理解为查询参数，用于构建数据查询条件。使用结构化的思维封装`SQL`查询条件。是`Yao`应用开发中使用比较频繁的对象，需要掌握理解。`QueryParam`的主要使用场景是转换`url api`中的查询参数为数据库`sql`条件。

[URL Query String 与 QueryParam 对照表](https://yaoapps.com/doc/%E6%89%8B%E5%86%8C/Widgets/API#URL%20Query%20String%20%E4%B8%8E%20QueryParam%20%E5%AF%B9%E7%85%A7%E8%A1%A8)

`QueryParam`的源代码学习：`/yaosource/gou/query.url.go`

比如下面的`url`包含了一个`where`查询条件：`http://localhost:5099/api/pet/search?where.kind.match=狗`

`url`的查询参数`where.kind.match=狗`会被解析成以下的`where`条件`kind = 狗`,这是一个最简单的使用例子。`QueryParam`还可以包含其它复杂的使用方法。

一个`QueryParam`对象代表了一个查询请求对象。

`QueryParam`结构定义：

```go
type QueryParam struct {
    Model    string          `json:"model,omitempty"` //关联模型
    Table    string          `json:"table,omitempty"` //关联表
    Alias    string          `json:"alias,omitempty"` //别名
    Export   string          `json:"export,omitempty"` // 导出前缀
    Select   []interface{}   `json:"select,omitempty"` // string | dbal.Raw
    Wheres   []QueryWhere    `json:"wheres,omitempty"` // where条件列表
    Orders   []QueryOrder    `json:"orders,omitempty"` // 排序
    Limit    int             `json:"limit,omitempty"` //限制
    Page     int             `json:"page,omitempty"` //翻页
    PageSize int             `json:"pagesize,omitempty"`//页数据大小
    Withs    map[string]With `json:"withs,omitempty"`//关联表查询
}
```

`QueryParam`对象有一个重要的方法`NewQuery()`，这个方法会根据传入结构体的参数组合成一个查询堆栈：`stack`，

```go
// gou/query.go
// NewQuery 新建查询栈
func (param QueryParam) NewQuery() *QueryStack {
    return param.Query(nil)
}
```

在源代码：`gou/query.url.go`中的函数`URLToQueryParam`会把`url`转换成`QueryParam`对象中的`select,order,where|orwhere|wherein|orwherein,group,with,select`,

- `select`查询字段
- `order` 排序
- `where` where 条件
- `group` 分组
- `with` 关联查询
- `.select` 关联查询字段

```go
const reURLWhereStr = "(where|orwhere|wherein|orwherein)\\.(.+)\\.(eq|gt|lt|ge|le|like|match|in|null|notnull)"

var reURLWhere = regexp.MustCompile("^" + reURLWhereStr + "$")
var reURLGroupWhere = regexp.MustCompile("^group\\.([a-zA-Z_]{1}[0-9a-zA-Z_]+)\\." + reURLWhereStr + "$")


// URLToQueryParam url.Values 转换为 QueryParams
func URLToQueryParam(values url.Values) QueryParam {
    param := QueryParam{
        Withs:  map[string]With{},
        Wheres: []QueryWhere{},
    }

    whereGroups := map[string][]QueryWhere{}
    for name := range values {
        if name == "select" {
            param.setSelect(values.Get(name))
            continue
        } else if name == "order" {
            param.setOrder(name, values.Get(name))
            continue
        } else if reURLWhere.MatchString(name) {
            param.setWhere(name, getURLValue(values, name))
            continue
        } else if strings.HasPrefix(name, "group.") {
            param.setGroupWhere(whereGroups, name, getURLValue(values, name))
            continue
        } else if name == "with" {
            param.setWith(values.Get(name))
            continue
        } else if strings.HasSuffix(name, ".select") {
            param.setWithSelect(name, values.Get(name))
            continue
        }
    }

    // WhereGroups
    for _, wheres := range whereGroups {
        param.Wheres = append(param.Wheres, QueryWhere{
            Wheres: wheres,
        })
    }
    return param
}
```

函数`URLToQueryParam`返回的是一个结构对象。在`api`里可以通过`:params`，或是使用`:query-param`把 url 中查询参数转换成`QueryParam`对象。

```json
{
  "paths": [
    {
      "path": "/search",
      "method": "GET",
      "process": "models.user.Get",
      "in": [":params"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

需要注意的是，在`url`使用的操作符跟`query dsl`中不一样，在`query dsl`中是使用以下操作符。

- "=":
- ">":
- ">=":
- "<":
- "<=":
- "<>":
- "like":
- "match":
- "in":
- "is":

而在`url`中只能使用 eq|gt|lt|ge|le|like|match|in|null|notnull

## 参考

`QueryDSL`的文档请参考官网说明[QueryDSL](https://yaoapps.com/doc/%E6%89%8B%E5%86%8C/QueryDSL/%E4%BB%8B%E7%BB%8D)。
