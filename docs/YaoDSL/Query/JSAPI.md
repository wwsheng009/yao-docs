# JSAPI

在 JSAPI 中使用 query 的方法是构建一个新的 Query 对象。构建 Query 对象时可以传入 Engine id 使用不同数据库的 connector，默认是 `default`。

**注意：Where 条件的定义不要跟 QueryParam 搞混了。JSAPI 的 Query 对象使用的是 QueryDSL 语法，不是 QueryParam！**

## Query 对象方法

| 方法     | 说明                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------- |
| Get      | 执行查询并返回数据记录集合，不分页。也可以使用 stmt 来读取数据库数据。                          |
| Paginate | 执行查询并返回带分页信息的数据记录数组。                                                        |
| First    | 执行查询并返回一条数据记录。                                                                    |
| Run      | 执行查询根据查询条件返回结果，调用的是 db.exec 不能返回数据记录，与 flow 中使用 stmt 效果一样。 |

## 定义 Query 对象

```js
// var query = new Query("engine")
// query.Get({"select":["id"], "from":"user", "limit":1})
// query.Paginate({"select":["id"], "from":"user"})
// query.First({"select":["id"], "from":"user"})
// query.Run({"stmt":"show version"})
function query() {
  const query = new Query();
  // 使用默认 connector
  const query = new Query('default');
  // 使用另外一个 connector
  const query = new Query('pg-connect');
}
```

## Get 方法

执行 sql 查询，使用 select 参数，返回结果集。

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

### 使用 stmt 读取数据

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

### 使用 debug 调试

使用 `debug:true` 调试 sql。转换后的 sql 会打印在控制台上。

```javascript
function DD() {
  let qb = new Query();
  return qb.Get({
    debug: true,
    select: ['id', 'name', 'name as label', 'id as value', 'parent_id'],
    wheres: [{ ':deleted_at': '删除', '=': null }],
    from: 'category',
    limit: 1000
  });
}
```

### 使用简化语法

在示例项目中经常看到类似的代码：`{ ":deleted_at": "删除", "=": null }`。条件字段使用 `:` 作为前缀是一种简化写法。

等于 `{"field":"deleted_at","comment":"删除","op":"=","value":null}`，字段名 `deleted_at`，备注是 `删除`，操作符是 `=`，值是 `null`，转换成 sql `where deleted_at = null`。

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: ['id as value', 'name as label'],
    from: 'company'
  });
  return res;
}
```

非简化写法：

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    wheres: [{ field: 'deleted_at', comment: '删除', op: '=', value: null }],
    select: ['id as value', 'name as label'],
    from: 'company'
  });
  return res;
}
```

### 使用数据库函数

使用特定数据库的函数后，代码不再适用所有数据库。

```js
function Data(params) {
  var query = new Query();
  var project = query.Get({
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: [':COUNT(id) as num'],
    from: 'project'
  });
}
```

### 使用 $ 引用 model

在 `from` 字段中可以使用前缀 `$` 引用 model，会自动解析成表名。

```javascript
function test(id) {
  var query = new Query();
  var data = query.Get({
    select: ['id', 'name', 'kind', 'created_at'],
    from: '$pet',
    wheres: [{ ':kind': '类型', '=': id }],
    orders: 'created_at desc',
    limit: 10
  });
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

### 复杂的分页查询示例

```js
const qb = new Query();
var res = qb.Paginate({
  debug: true,
  select: [
    'stock.id',
    'stock.uptime',
    'stock.stock',
    ":DATE_FORMAT(stock.uptime, '%Y年%m月%d日 %H:%i:%s') as day",
    'sku.id as sku_id',
    'sku.specs$ as sku_specs',
    'sku.stock as sku_stock',
    'material.id as material_id',
    'material.name as material_name',
    'category.id as category_id',
    'category.name as category_name',
    'warehouse.id as warehouse_id',
    'warehouse.name as warehouse_name'
  ],
  from: 'stock',
  joins: [
    { left: true, from: 'sku', key: 'sku.id', foreign: 'stock.sku_id' },
    {
      left: true,
      from: 'warehouse',
      key: 'warehouse.id',
      foreign: 'stock.warehouse_id'
    },
    {
      left: true,
      from: 'material',
      key: 'material.id',
      foreign: 'sku.material_id'
    },
    {
      left: true,
      from: 'category',
      key: 'category.id',
      foreign: 'material.category_id'
    }
  ],
  wheres: wheres,
  orders: 'stock.uptime desc',
  pagesize: pagesize,
  page: page
});
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

错误的用法，在 Run 方法中不要使用 `sql.stmt`，不会返回数据。

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

## 动态构建查询条件

构建树形结构，jsapi 相对于 flow 定义更加灵活，可以动态的构建查询条件。

```js
function Tree(data) {
  var wheres = data.wheres;

  console.log(wheres);
  var search = [{ ':plan.deleted_at': '删除', '=': null }];
  for (var i in wheres) {
    if (wheres[i].column == 'name') {
      search.push({
        ':plan.name': '名称',
        like: '%' + wheres[i].value + '%'
      });
    }
    if (wheres[i].column == 'project_id') {
      search.push({
        ':plan.project_id': '项目',
        in: [wheres[i].value]
      });
    }
  }

  var query = new Query();
  var cate = query.Get({
    debug: true,
    select: [
      'plan.id',
      'plan.users',
      'plan.project_id',
      'plan.user_id',
      'plan.order',
      'plan.name',
      'plan.plan_sn',
      'plan.type',
      'plan.total_number',
      'plan.status',
      'plan.total_money',
      'plan.start_time',
      'plan.end_time',
      'plan.actual_time',
      'plan.parent_id',
      'plan.progress',
      'plan.department',
      'project.name as project_name' //关联表字段
    ],
    wheres: search,
    from: 'plan',
    joins: [
      {
        left: true,
        from: 'project as project',
        key: 'project.id',
        foreign: 'plan.project_id'
      }
    ],
    limit: 1000
  });
  for (var j in cate) {
    if (cate[j].users) {
      var temp = JSON.parse(cate[j].users);
      cate[j].users = temp.join(',');
    }
    if (cate[j].department) {
      var temp2 = JSON.parse(cate[j].department);
      cate[j].department = temp2.join(',');
    }
  }
  res = Process('xiang.helper.ArrayTree', cate, {
    parent: 'parent_id',
    empty: null
  });
  var data = {
    data: res
  };
  return data;
}
```
