# jsapi

在 JSAPI 中的参数需要使用 QueryDSL 的语法。

**注意：Where 条件的定义不要跟 QueryParam 搞混了**

## Get 方法

执行 sql 查询,使用 select 参数，返回结果集。

```js
function Get() {
  var query = new Query('query-test');
  var data = query.Get({
    select: ['id', 'name'],
    from: 'queryobj_test'
  });
  return data;
}
```

执行 sql 查询，使用 sql 参数查询原始的 select 语句，返回结果集。

```js
function Test1(id) {
  const query = new Query('default');
  //use statement
  const data = query.Get({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}
```

## First 方法

执行查询，读取每一行数据。

```js
function First() {
  var query = new Query('query-test');
  var data = query.First({
    select: ['id', 'name'],
    from: 'queryobj_test'
  });
  return data;
}
```

## Paginate 方法

分页查询

```js
function Paginate() {
  var query = new Query('query-test');
  var data = query.Paginate({
    select: ['id', 'name'],
    from: 'queryobj_test'
  });
  return data;
}
```

## Run 方法

执行 sql 查询，返回所有的结果，这里跟 GET 方法是一样的。同样这个 Run 方法也等同于定义并调用 Flow 处理器。

```js
function Run() {
  var query = new Query('query-test');
  var data = query.Run({
    select: ['id', 'name'],
    from: 'queryobj_test',
    limit: 1
  });
  return data;
}
```

错误的用法，在 Run 方法中不要使用`sql.stmt`,不会返回数据。

```js
function Test3(id) {
  const query = new Query('default');
  //use query.Run
  const data = query.Run({
    sql: { stmt: 'SELECT id,name FROM yao_demo_pet WHERE id = ?', args: [id] }
  });
  return data;
}
```
