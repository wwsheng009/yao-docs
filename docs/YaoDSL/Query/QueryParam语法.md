# QueryParam 语法

[复杂数据查询](https://yaoapps.com/doc/%E8%BF%9B%E9%98%B6/%E5%A4%8D%E6%9D%82%E6%95%B0%E6%8D%AE%E6%9F%A5%E8%AF%A2)

## QueryParam 使用场景

QueryParam 的其中一个典型的场景是直接转换 url 中的查询参数。

比如有以下的 url 请求，url 的格式是按 query-param 的格式进行组装。

[URL 转换原理](./%E5%9C%A8url%E4%B8%AD%E4%BD%BF%E7%94%A8QueryParam.md)

```bash
GET /api/user/paginate?withs=manu,mother,addresses&where.status.eq=enabled&&select=id,name,mobile,status,extra&page=1&pagesize=2

```

创建一个 api 定义。在这个 api 定义中，可以使用`:query-param`或是`:params`直接解析 url 参数并转换成处理器的查询参数。

```json
{
  "path": "/search",
  "method": "GET",
  "guard": "-", //公开api
  "process": "models.pet.Paginate",
  "in": [":query-param", "$query.page", "$query.pagesize"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

另外一个场景是在调用模型处理器时，可以使用 QueryParam 构建复杂的查询参数。

数据模型处理器 Find, Get, Paginate, UpdateWhere, DeleteWhere, DestroyWhere 均支持传入查询参数 Object QueryParam，对读取记录范围进行限定。

```js
return Process(
  'models.user.Paginate',
  {
    select: ['id', 'name', 'mobile', 'status', 'extra'],
    withs: { manu: {}, mother: {}, addresses: {} },
    wheres: [{ column: 'status', value: 'enabled' }],
    limit: 2,
  },
  1,
  2,
);
```

更复杂的 QueryParam 定义。

```json
{
  "select": ["id", "name", "mobile", "status"],
  "withs": {
    "manu": { "query": ["name", "short_name", "status"] },
    "addresses": {}
  },
  "wheres": [
    { "column": "status", "value": "enabled" },
    { "rel": "manu", "column": "status", "value": "enabled" },
    {
      "wheres": [
        { "column": "name", "value": "%张三%", "op": "like" },
        {
          "method": "orwhere",
          "column": "name",
          "value": "%李四%",
          "op": "like"
        }
      ]
    }
  ],
  "orders": [
    { "column": "id", "option": "desc" },
    { "rel": "manu", "column": "name" }
  ],
  "limit": 2
}
```

`QueryParam` typescript 语法定义。

```ts
/**QueryParam 数据查询器参数 */
export interface QueryParam {
  /**备注【管理字段】 */
  comment?: string;
  /**模型名称 */
  model?: string;
  /**表格名称 */
  table?: string;
  /**别名 */
  alias?: string;
  /**导出数据时的前缀 */
  export?: string;
  /**选择字段清单*/
  select?: string[];
  /**查询条件*/
  wheres?: QueryWhere[];
  /**排序条件*/
  orders?: QueryOrder[];
  /**限制返回记录条目*/
  limit?: number;
  /**当前页码*/
  page?: number;
  /**每页显示记录数量*/
  pagesize?: number;
  /**读取关联模型*/
  withs?: { [key: string]: QueryWith }; //Map<string, QueryWith>;
}

/**QueryOrder Order 查询排序 */
export interface QueryOrder {
  /**如按关联模型的字段排序，则填写关联模型名称*/
  rel?: string;
  /**字段名称*/
  column: string;
  /**排序方式， `desc`, `asc`, 默认为 `asc`*/
  option?: string;
}
/**
 *  QueryWhere Where 查询条件
 */
export interface QueryWhere {
  /**如按关联模型的字段查询，则填写关联模型名称 */
  rel?: string;
  /**字段名称*/
  column?: string;
  /**匹配数值*/
  value?: any;
  /**查询方法 `where`,`orwhere`, `wherein`, `orwherein`... 默认为 `where`,
   *
   *| 查询方法 | 说明                                  |
   *| -------- | ------------------------------------- |
   *| where    | WHERE 字段 = 数值, WHERE 字段 >= 数值 |
   *| orwhere  | ... OR WHERE 字段 = 数值              |
   */
  method?: string;
  /**默认为 `eq`
   *
   *| 匹配关系 | 说明                             |
   *| -------- | -------------------------------- |
   *| eq       | 默认值 等于 WHERE 字段 = 数值    |
   *| like     | 匹配 WHERE 字段 like 数值        |
   *| match    | 匹配 WHERE 字段 全文检索 数值    |
   *| gt       | 大于 WHERE 字段 > 数值           |
   *| ge       | 大于等于 WHERE 字段 >= 数值      |
   *| lt       | 小于 WHERE 字段 < 数值           |
   *| le       | 小于等于 WHERE 字段 <= 数值      |
   *| null     | 为空 WHERE 字段 IS NULL          |
   *| notnull  | 不为空 WHERE 字段 IS NOT NULL    |
   *| in       | 列表包含 WHERE 字段 IN (数值...) |
   *| ne       | 不等于匹配值                     |
   */
  op?: string;
  /**分组查询 */
  wheres?: QueryWhere[];
}

/**With relations 关联查询 */
export interface QueryWith {
  name?: string;
  query?: QueryParam;
}
```

**注意不是 QueryDSL**，特别是 where 条件的语法的差异。

Query DSL 示例:

```json
{
  "comment": "统计各行业最高分",
  "select": ["industries@", "city", ":MAX(score) as high_score"],
  "from": "service",
  "wheres": [
    { ":created_at": "创建时间", ">=": "2021-01-01" },
    { ":created_at": "创建时间", "<=": "{'2021-12-31'}" },
    { ":updated_at": "更新时间", "is": "null" },
    {
      "wheres": [
        { ":type": "类型", "=": 1 },
        { "or:type": "或类型", "=": 2 }
      ]
    }
  ],
  "orders": "high_score desc",
  "limit": 100,
  "groups": ["industries@", "city"]
}
```

## 复杂的 withs 条件

withs 子查询也是一个 queryParam 类型的结构。

在这里实现一个复杂的子表查询条件。

```json
function getField(entity, field) {
  const [row] = Process("models.sys.entity.get", {
    wheres: [
      {
        column: "name",
        value: entity,
      },
    ],
    withs: {
      fields: {
        query: { //这里注意要增加一个query节点
          wheres: [
            {
              column: "name",
              value: field,
            },
          ],
        },
      },
    },
  });

  if (row.fields.length) {
    return row.fields[0];
  }
  return {};
}
```
