# `QueryParam`与`QueryDSL`差异

两者都是用于规范SQL查询条件，有一定的类似性。但是它们也存在很大差异。

## 重要的区别

`QueryParam`与`QueryDSL`是两个不同的对象，两者的 wheres 条件的语法是不一样的，**不要搞混了**。

### 核心语法区别

| 特性             | QueryDSL     | QueryParam            |
| ---------------- | ------------ | --------------------- |
| **Where 字段名** | `field`      | `column`              |
| **操作符字段**   | `op`         | `op`（但取值不同）    |
| **OR 条件**      | `"or": true` | `"method": "orwhere"` |

### 应用场景

- **QueryDSL**：
  - Flow 的 `query` 节点中定义查询条件
  - JSAPI 的 `Query` 对象（`new Query()`）
  - 数据分析、统计等复杂场景
  - 引擎会在启动时解析 QueryDSL 并转换为可执行的查询语句

- **QueryParam**：
  - 转换 `url api` 中的查询参数成查询条件
  - 调用 `Models.xxx.xxx` 方法时的查询参数
  - 表格组件的数据查询
  - 数据模型处理器（`Find`, `Get`, `Paginate` 等）

### 操作符不一样

需要注意的是，在 `QueryParam` 或是 `url` 使用的操作符跟 `QueryDSL` 中不一样。

**QueryDSL 中的操作符**：

| 操作符    | 说明                 |
| --------- | -------------------- |
| `=`       | 等于（默认值）       |
| `>`       | 大于                 |
| `>=`      | 大于等于             |
| `<`       | 小于                 |
| `<=`      | 小于等于             |
| `like`    | 匹配                 |
| `match`   | 模糊匹配（全文检索） |
| `null`    | 为空 IS NULL         |
| `notnull` | 不为空 IS NOT NULL   |
| `in`      | 列表包含             |

**QueryParam 或 URL 中的操作符**：

| 操作符    | 说明                 |
| --------- | -------------------- |
| `eq`      | 等于（默认值）       |
| `gt`      | 大于                 |
| `lt`      | 小于                 |
| `ge`      | 大于等于             |
| `le`      | 小于等于             |
| `like`    | 匹配                 |
| `match`   | 模糊匹配（全文检索） |
| `null`    | 为空 IS NULL         |
| `notnull` | 不为空 IS NOT NULL   |
| `in`      | 列表包含             |
| `ne`      | 不等于               |

**注意**：URL 中不能包含特殊符号（如 `=`、`>`、`<`），所以使用简化的操作符名称。

### QueryDSL 支持简化语法，QueryParam 不支持

QueryDSL 提供了简化语法来快速定义 where 条件，QueryParam 不支持这种简化写法。

**QueryDSL 简化语法示例**：

```js
function GetSelect() {
  const query = new Query();
  const res = query.Get({
    // 简化语法：':deleted_at' 是字段（带注释 '删除'），'=' 是操作符
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: ['id as value', 'name as label'],
    from: 'company'
  });
  return res;
}
```

这个简化写法等同于完整写法：

```js
wheres: [{ field: 'deleted_at', comment: '删除', op: '=', value: null }];
```

### QueryDSL 支持数据库函数，QueryParam 不支持

- **QueryDSL**：在 `select` 中可以使用数据库函数和 `as` 别名，例如 `:MAX(score) as high_score`
- **QueryParam**：在 `select` 中只能使用数据库表的列名，**不能使用函数或 as 别名**

### QueryParam 可以在数据模型处理器中使用，QueryDSL 不可以

- **QueryParam**：数据模型处理器 `Find`, `Get`, `Paginate`, `UpdateWhere`, `DeleteWhere`, `DestroyWhere` 均支持传入 QueryParam 查询参数
- **QueryDSL**：不能直接在数据模型处理器中使用，需要通过 JSAPI 的 Query 对象或 Flow 的 query 节点

## 使用建议

| 场景                  | 推荐使用   | 说明                                                 |
| --------------------- | ---------- | ---------------------------------------------------- |
| Flow 的 `query` 节点  | QueryDSL   | 使用 QueryDSL 语法定义查询条件                       |
| JSAPI 的 `Query` 对象 | QueryDSL   | 使用 `new Query()` 创建对象，传入 QueryDSL           |
| 调用模型处理器        | QueryParam | `Models.xxx.Find/Get/Paginate` 等方法使用 QueryParam |
| URL 查询参数          | QueryParam | 通过 `:query-param` 或 `:params` 转换                |
| 表格/表单组件查询     | QueryParam | 组件内部使用 QueryParam 语法                         |

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
