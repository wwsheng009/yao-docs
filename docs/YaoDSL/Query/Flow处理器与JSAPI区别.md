# Flow 处理器与 JSAPI 的区别

## Flows 中查询数据

如果是`Flow`节点定义中的节点里使用`query`中的`sql`指定`sql.stmt`。那么`sql`执行后不会返回结果集。

比如以下的 flow 定义并不会返回想要的数据结果集，而是只会返回一个 locker 对象。

示例：`flows/test1.flow.json`

```json
{
  "name": "Test Select By Statement",
  "nodes": [
    {
      "name": "data",
      "engine": "default",
      "query": {
        "sql": {
          "stmt": "SELECT id,name FROM yao_demo_pet WHERE id = ?",
          "args": ["$in.0"]
        }
      },
      "outs": ["{{$out}}"]
    }
  ],
  "output": "{{$res.data}}"
}
```

测试结果：

```sh
--------------------------------------
[
    {
        "Locker": {}
    }
]
--------------------------------------
```

正确的方法是使用`Flow`中的`query`对象。

示例：`flows/test2.flow.json`

```json
{
  "name": "Test Select",
  "nodes": [
    {
      "name": "data",
      "engine": "default",
      "query": {
        "debug": true,
        "select": ["id", "name"],
        "wheres": [{ ":id": "id", "op": "eq", "value": "?:$in.0" }],
        "from": "yao_demo_pet"
      }
    }
  ],
  "output": "{{$res.data}}"
}
```

```sh
yao run flows.test2 1

args[0]: 1
--------------------------------------
scripts.test.Test2 返回结果
--------------------------------------
[
    {
        "id": 1,
        "name": "Cookie"
    }
]
--------------------------------------
```

这两者有什么区别？

当在 flow 中定义了 `query` 类型的节点后，实际上会解析并统一调用`Query.Run`入口方法。在这个处理方法里，会根据节点配置判断:

- 如果存在`sql`配置，执行 SQL 命令。注意：如果在这里写了获取数据的 select sql 并不会返回数据。
- 如果没有存在`sql`配置，执行 Get 方法，返回数据结果集。
- 如果配置 First 选项，会获取 select 结果的第一条。
- 如果配置了 Page 或是 PageSize，返回分页数据。

源代码学习：`/gou/query/gou/query.go`

```go
// Run 执行查询根据查询条件返回结果
func (gou Query) Run(data maps.Map) interface{} {

    if gou.Page != nil || gou.PageSize != nil {
        return gou.Paginate(data)
    } else if gou.QueryDSL.First != nil {
        return gou.First(data)
    } else if gou.SQL == nil {
        return gou.Get(data) //query节点配置，返回查询数据
    }
    // flow中有定义sql.stmt时会执行以下的逻辑

    sql, bindings := gou.prepare(data)
    qb := gou.Query.New()
    qb.SQL(sql, bindings...)

    // Debug模式 打印查询信息
    if gou.Debug {
        fmt.Println(sql)
        utils.Dump(bindings)
    }

    res, err := qb.DB().Exec(sql, bindings...)//sql.stmt在这里执行了,注意select sql不会返回值。
    if err != nil {
        exception.New("数据查询错误 %s", 500, err.Error()).Throw()
    }
    return res
}
```

## 使用 `jsapi` 执行 SQL 语句

但是我们可以在`jsapi`中直接使用`sql.stmt`语句读取数据。下面的代码是两种不同的读取方法，获取的结果是一样的。

示例：`scripts/test.js`

```js
function Test1(id) {
  const query = new Query('default');
  //use statement
  const data = query.Get({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] },
  });
  return data;
}

function Test2(id) {
  const query = new Query();
  //use select object
  const data = query.Get({
    select: ['id', 'name'],
    wheres: [{ ':id': 'id', op: 'eq', value: id }],
    from: 'yao_demo_pet',
    limit: 10,
  });
  return data;
}
```

返回同样的结果：

```sh
--------------------------------------
[
    {
        "id": 1,
        "name": "Cookie"
    }
]
--------------------------------------
```

为什么在`JS API`中可以使用`stmt`读取数据。实际上，Yao 在`jsapi`中调用 jsapi 的 get 方法时的处理逻辑跟调用`flow`节点是不一样的。

JSAPI 中调用`query.Get`方法时，会直接调用 Gou 模块的`Query.Get`方法，而不是调用`Query.Run`方法。所以即使是在 Get 方法中使用原始的 select sql 语句，也是可以读取到数据。

`/gou/runtime/yao/objects/query.go`

```go
func (obj *QueryOBJ) runQueryGet(iso *v8go.Isolate, info *v8go.FunctionCallbackInfo, param *v8go.Value) (data interface{}, err error) {
	defer func() { err = exception.Catch(recover()) }()
	dsl, input, err := obj.getQueryDSL(info, param)
	if err != nil {
		msg := fmt.Sprintf("Query: %s", err.Error())
		log.Error(msg)
		return nil, err
	}
	data = dsl.Get(input)//js script get call gou.Query.Get
	return obj.response(iso, info, data), err
}

```

当执行`query.Get`方法时，调用的`gou.Query.Get`方法。

```go
// call by js query Query
// Get 执行查询并返回数据记录集合
func (gou Query) Get(data maps.Map) []share.Record {

	res := []share.Record{}
	sql, bindings := gou.prepare(data)
	qb := gou.Query.New()
	gou.SetOffset(qb, data)
	gou.SetLimit(qb, data)

	qb.SQL(sql, bindings...)

	// Debug模式 打印查询信息
	if gou.Debug {
		fmt.Println(sql)
		utils.Dump(bindings)
	}

	rows := qb.MustGet()//重要的区别，即例是stmt语言，也会返回数据。

	// 处理数据
	for _, row := range rows {
		res = append(res, gou.format(row))
	}

	return res
}
```

回到开头，为什么在`Flow`中不能使用`stmt`获取到`select`的结果集，而在`jsapi`中却可以。原因是在`flow`中使用`sql.stmt`等于调用`jsapi`中的`query.Run`方法,用程序来验证一下。

**反过来说，jsapi 的 Run 方法的处理逻辑跟调用 Flow 处理器是一样的。**

示例：`scripts/test.js`

```js
function Test3(id) {
  const query = new Query('default');
  //use query.Run
  const data = query.Run({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] },
  });
  return data;
}
```

这里获取的结果等于使用`Flow.query.stmt`

```sh
--------------------------------------
{
    "Locker": {}
}
--------------------------------------
```

## 总结

Yao Flow 处理器的功能在 JSAPI 中可以使用 query.Run 方法进行替换。

JSAPI 中`Query.Get`方法可以使用`sql.stmt`，使用原始的 SQL 语句来读取数据。这一点，flow 处理器是无法作到的。

JSAPI 会比 Flow 更灵活，建议使用 JSAPI。

感谢群友"明"。
