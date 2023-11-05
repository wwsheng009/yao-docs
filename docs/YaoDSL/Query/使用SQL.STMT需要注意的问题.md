# 数据查询使用 SQL.STMT 需要注意的问题

## Flows 中查询数据

如果是`Flow`节点定义中的节点里使用`query`中的`sql`指定`sql.stmt`。那么`sql`执行后不会返回结果集，因为它使用的是`sql.exec`方法

以下的使用方法是错误的。

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

测试命令：

```sh
yao run flows.test1 1

args[0]: 1
--------------------------------------
flows.test1 返回结果
--------------------------------------
[
    {
        "Locker": {}
    }
]
--------------------------------------
```

正确的方法是使用`Flow`中的`query`对象

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

源代码学习：`yao/source/gou/query/gou/query.go`

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

但是我们可以在`jsapi`中直接使用`sql`语句读取数据。下面的代码是两种不同的读取方法。获取的结果是一样的。

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

```sh
yao run scripts.test.Test1 1

args[0]: 1
--------------------------------------
scripts.test.Test1 返回结果
--------------------------------------
[
    {
        "id": 1,
        "name": "Cookie"
    }
]
--------------------------------------
```

```sh
yao run scripts.test.Test2 1

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

为什么在`JS API`中可以使用`stmt`读取数据。从源代码上看，`jsapi`调用的方法跟`flow`的定义不一样。

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

上面的方法调用的`gou.Query.Get`方法

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

	rows := qb.MustGet()

	// 处理数据
	for _, row := range rows {
		res = append(res, gou.format(row))
	}

	return res
}
```

回到开头，为什么在`Flow`中不能使用`stmt`获取到`select`的结果集，而在`jsapi`中却可以。原因是在`flow`中使用`stmt`等于调用`jsapi`中的`query.Run`方法,用程序来验证一下。

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
yao run scripts.test.Test3 1

args[0]: 1
--------------------------------------
scripts.test.Test3 返回结果
--------------------------------------
{
    "Locker": {}
}
--------------------------------------
```

## 总结

`Yao`的使用比较灵活，可以使用不同的方法达到一个目的。

感谢群友"明"。
