# QueryDSL

Gou Query DSL(Domain Specific Language) 用来描述数据查询条件，适用基于数据库实现的数据分析引擎。

QueryDSL 是 yao 的一个非常重要的功能，一定要掌握。

## QueryDSL 结构定义

Query DSL(Domain Specific Language) 用来描述数据查询条件以及数据结构，适用基于数据库实现的数据分析引擎。

## Object QueryDSL 数据结构

| 字段      | 类型                      | 说明                                                                                                                                         | 必填项 |
| --------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| select    | Array\<Field Expression\> | 选择字段列表                                                                                                                                 | 是     |
| from      | String                    | 查询数据表名称或数据模型                                                                                                                     | 否     |
| wheres    | Array\<Object Where\>     | 数据查询条件                                                                                                                                 | 否     |
| orders    | Array\<Object Order\>     | 排序条件                                                                                                                                     | 否     |
| offset    | Int                       | 记录开始位置                                                                                                                                 | 否     |
| limit     | Int                       | 读取数据的数量                                                                                                                               | 否     |
| page      | Int                       | 分页查询当前页面页码                                                                                                                         | 否     |
| pagesize  | Int                       | 每页读取记录数量                                                                                                                             | 否     |
| data-only | Bool                      | 设定为 `true`, 查询结果为 Array\<Object Record\>; 默认为 `false`, 查询结果为 Array\<Object Paginate\>, 仅在设定 `page` 或 `pagesize`时有效。 | 否     |
| groups    | Array\<Object Group\>     | 聚合字段和统计层级设置。                                                                                                                     | 否     |
| havings   | Array\<Object Having\>    | 聚合查询结果筛选, 仅在设定 `groups` 时有效。                                                                                                 | 否     |
| unions    | Array\<Object QueryDSL\>  | 联合查询。多个查询将结果合并为一张表                                                                                                         | 否     |
| query     | Object QueryDSL           | 子查询。按 QueryDSL 描述查询逻辑，生成一张二维数据表或数值。                                                                                 | 否     |
| joins     | Array\<Object Join\>      | 表连接。连接数据量较大的数据表时 **不推荐使用**。                                                                                            | 否     |
| sql       | Object SQL                | SQL 语句。**非必要，勿使用**。                                                                                                               | 否     |
| comment   | String                    | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                                                                                   | 否     |
| withs     | Object                    | 关联关系现。                                                                                                                                 | 否     |

go 类型声明

```go
// QueryDSL Gou Query Domain Specific Language
type QueryDSL struct {
	Select   []Expression `json:"select"`              // 查询字段列表
	From     *Table       `json:"from,omitempty"`      // 查询数据表名称或数据模型
	Wheres   []Where      `json:"wheres,omitempty"`    // 数据查询条件
	Orders   Orders       `json:"orders,omitempty"`    // 排序条件
	Groups   *Groups      `json:"groups,omitempty"`    // 聚合条件
	Havings  []Having     `json:"havings,omitempty"`   // 聚合查询结果筛选条件
	First    interface{}  `json:"first,omitempty"`     // 限定读取单条数据
	Limit    interface{}  `json:"limit,omitempty"`     // 限定读取记录的数量
	Offset   interface{}  `json:"offset,omitempty"`    // 记录开始位置
	Page     interface{}  `json:"page,omitempty"`      // 分页查询当前页面页码
	PageSize interface{}  `json:"pagesize,omitempty"`  // 每页读取记录的数量
	DataOnly interface{}  `json:"data-only,omitempty"` // 设定为 true, 查询结果为 []Record; 设定为 false, 查询结果为 Paginate
	Unions   []QueryDSL   `json:"unions,omitempty"`    // 联合查询
	SubQuery *QueryDSL    `json:"query,omitempty"`     // 子查询
	Alias    string       `json:"name,omitempty"`      // 子查询别名
	Joins    []Join       `json:"joins,omitempty"`     // 表连接
	SQL      *SQL         `json:"sql,omitempty"`       // SQL语句
	Comment  string       `json:"comment,omitempty"`   // 查询条件注释
	Debug    bool         `json:"debug,omitempty"`     // 是否开启调试(开启后计入查询日志)
}
```

## Object Where 数据结构

特别需要注意的是字段表达式是`field`，不是`column`,这里跟 `QueryParam` 是不一样的。

| 字段    | 类型                  | 说明                                                                         | 必填项 |
| ------- | --------------------- | ---------------------------------------------------------------------------- | ------ |
| field   | Field Expression      | 字段表达式，不支持设置别名 `as`                                              | 是     |
| value   | Any                   | 匹配数值。如果数据类型为 `Field Expression`, 用 `{}` 包括，如 `{updated_at}` | 否     |
| op      | String                | 匹配关系运算符。许可值 `=`,`like`,`in`,`>` 等，默认为 `=`                    | 否     |
| or      | Bool                  | `true` 查询条件逻辑关系为 `or`, 默认为 `false` 查询条件逻辑关系为 `and`      | 否     |
| wheres  | Array\<Object Where\> | 分组查询。用于 `condition 1` `and` ( `condition 2` OR `condition 3`) 的场景  | 否     |
| query   | Object QueryDSL       | 子查询；如设定 `query` 则忽略 `value` 数值。                                 | 否     |
| comment | String                | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                   | 否     |

## 在`Flow`中使用`QueryDsl`

使用`debug=true`调试 sql

## 在`JsAPI`中使用`QueryDsl`

在 jsapi 中使用 query 的方法是构建一个新的 Query 对象。构建 Query 对象时可以传入 Engine id 使用不同数据库的 connector,默认是`default`。
query 对象有以下的方法：

- Get，执行查询并返回数据记录集合，不分页，这里也可以使用 stmt 来读取数据库数据。
- Paginate，执行查询并返回带分页信息的数据记录数组。
- First,执行查询并返回一条数据记录。
- Run,执行查询根据查询条件返回结果,调用的是 db.exec 不能返回数据记录,与 flow 中使用 stmt 效果一样。

定义 Query 对象

```js
// var query = new Query("engine")
// query.Get({"select":["id"], "from":"user", "limit":1})
// query.Paginate({"select":["id"], "from":"user"})
// query.First({"select":["id"], "from":"user"})
// query.Run({"stmt":"show version"})
function query() {
  const query = new Query();
  //等于
  const query = new Query('default');
  //另外一个connector
  const query = new Query('pg-connect');
}
```

使用 stmt 读取数据

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

使用`debug:true`调试 sql。转换后的 sql 会打印在控制台上。

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

使用 query 简化语法读取数据

在示例项目中经常看到类似的代码：`{ ":deleted_at": "删除", "=": null }`。条件字段使用`:`作为前缀是一种简化写法。等于`{"field":"deleted_at","comment":"删除","op":"=","value":null}`,字段名`deleted_at`,备注是`删除`。操作符是`=`,值是`null`,转换成 sql`where deleted_at = null`。

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

非简化写法

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

使用数据库函数，使用特定数据库的函数后，代码不再适用所有数据库。

```js
function Data(params) {
  var query = new Query();
  var project = query.Get({
    wheres: [{ ":deleted_at": "删除", "=": null }],
    select: [":COUNT(id) as num"],
    from: "project",
  });
```

在 `from`字段中可以使用前缀`$`引用 model，会自动的解析成表名。

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

使用 Paginate 翻页查询。

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

## Object Where 数据结构

| 字段    | 类型                  | 说明                                                                         | 必填项 |
| ------- | --------------------- | ---------------------------------------------------------------------------- | ------ |
| field   | Field Expression      | 字段表达式，不支持设置别名 `as`                                              | 是     |
| value   | Any                   | 匹配数值。如果数据类型为 `Field Expression`, 用 `{}` 包括，如 `{updated_at}` | 否     |
| op      | String                | 匹配关系运算符。许可值 `=`,`like`,`in`,`>` 等，默认为 `=`                    | 否     |
| or      | Bool                  | `true` 查询条件逻辑关系为 `or`, 默认为 `false` 查询条件逻辑关系为 `and`      | 否     |
| wheres  | Array\<Object Where\> | 分组查询。用于 `condition 1` `and` ( `condition 2` OR `condition 3`) 的场景  | 否     |
| query   | Object QueryDSL       | 子查询；如设定 `query` 则忽略 `value` 数值。                                 | 否     |
| comment | String                | 查询条件注释，用于帮助理解查询条件逻辑和在开发平台中呈现。                   | 否     |

## 查询方法

| 查询方法 | 说明                                  |
| -------- | ------------------------------------- |
| where    | WHERE 字段 = 数值, WHERE 字段 >= 数值 |
| orwhere  | ... OR WHERE 字段 = 数值              |

## 匹配关系运算符

| 运算符    | 说明                             |
| --------- | -------------------------------- |
| `=`       | 默认值 等于 WHERE 字段 = 数值    |
| `>`       | 大于 WHERE 字段 > 数值           |
| `>=`      | 大于等于 WHERE 字段 >= 数值      |
| `<`       | 小于 WHERE 字段 < 数值           |
| `<=`      | 小于等于 WHERE 字段 <= 数值      |
| `like`    | 匹配 WHERE 字段 like 数值        |
| `match`   | 模糊匹配 WHERE 字段 match 数值   |
| `null`    | 为空 WHERE 字段 IS NULL          |
| `notnull` | 不为空 WHERE 字段 IS NOT NULL    |
| `in`      | 列表包含 WHERE 字段 IN (数值...) |

| 匹配关系 | 说明                             |
| -------- | -------------------------------- |
| eq       | 默认值 等于 WHERE 字段 = 数值    |
| like     | 匹配 WHERE 字段 like 数值        |
| gt       | 大于 WHERE 字段 > 数值           |
| ge       | 大于等于 WHERE 字段 >= 数值      |
| lt       | 小于 WHERE 字段 < 数值           |
| le       | 小于等于 WHERE 字段 <= 数值      |
| null     | 为空 WHERE 字段 IS NULL          |
| notnull  | 不为空 WHERE 字段 IS NOT NULL    |
| in       | 列表包含 WHERE 字段 IN (数值...) |
| ne       | 不等于                           |

## 在 SELECT 语句中使用的聚合函数

| 函数             | 参数表                                  | 说明                   | SELECT 示例                                              | 数值                        |
| ---------------- | --------------------------------------- | ---------------------- | -------------------------------------------------------- | --------------------------- |
| SUM()            | [`Field Expression`]                    | 求和                   | `:SUM(amount)` , `:SUM(DISTINCT amount)`                 | `350`, `250`                |
| COUNT()          | [`Field Expression`]                    | 记录行数               | `:COUNT(id)`,`:COUNT(amount)`, `:COUNT(DISTINCT amount)` | `4`,`4`, `2`                |
| AVG()            | [`Field Expression`]                    | 平均数                 | `:AVG(amount)`, `:AVG(DISTINCT amount)`                  | `87.5000`, `125.0000`       |
| MIN()            | [`Field Expression`]                    | 最小值                 | `:MIN(amount)`                                           | `50`                        |
| MAX()            | [`Field Expression`]                    | 最大值                 | `:MAX(amount)`                                           | `200`                       |
| STDDEV_POP()     | [`Field Expression`]                    | 总体标准差             | `:STDDEV_POP(amount)`                                    | `64.9519052838329`          |
| STDDEV_SAMP()    | [`Field Expression`]                    | 样品标准差             | `:STDDEV_SAMP(amount)`                                   | `75`                        |
| VAR_POP()        | [`Field Expression`]                    | 总体方差               | `:VAR_POP(amount)`                                       | `4218.75`                   |
| VAR_SAMP()       | [`Field Expression`]                    | 样品方差               | `:VAR_SAMP(amount)`                                      | `5625`                      |
| JSON_ARRAYAGG()  | [`Field Expression`]                    | 合并为一个 JSON Array  | `:JSON_ARRAYAGG(amount)`                                 | `[50, 50, 50, 200]`         |
| JSON_OBJECTAGG() | [`Field Expression`,`Field Expression`] | 合并为一个 JSON Object | `:JSON_OBJECTAGG(city,price)`                            | `{"上海": 200, "北京": 50}` |

## 版本变更

在 0.10.3 后，engine 不能再使用`xiang`，应该使用`default`或是空值。
