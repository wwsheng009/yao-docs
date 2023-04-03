# 当出现两个 hasMany 从表关系时，无法正常获取数据。

## 问题

当有一个模型是`ddic.model`定义如下。它有一些字段，并且关联了两个关联表，主表与两个子表都是一对多的关系。

```json
{
  "name": "::Model",
  "table": { "name": "ddic_model", "comment": "业务模型" },
  "columns": [
    {
      "name": "id",
      "type": "ID",
      "label": "ID",
      "comment": "表名"
    },
    {
      "label": "命名空间",
      "name": "namespace",
      "type": "string",
      "length": 80,
      "default": "app",
      "nullable": false
    }
  ],
  "relations": {
    "col": {
      "label": "字段列表",
      "type": "hasMany",
      "model": "ddic.model.column",
      "key": "model_id",
      "foreign": "id"
    },
    "rel": {
      "label": "关联关系",
      "type": "hasMany",
      "model": "ddic.model.relation",
      "key": "model_id",
      "foreign": "id"
    }
  },
  "option": {}
}
```

模型定义了两个`hasMany`关联。

```json
{
  "relations": {
    "col": {
      "label": "字段列表",
      "type": "hasMany",
      "model": "ddic.model.column",
      "key": "model_id",
      "foreign": "id"
    },
    "rel": {
      "label": "关联关系",
      "type": "hasMany",
      "model": "ddic.model.relation",
      "key": "model_id",
      "foreign": "id"
    }
  }
}
```

当调用 `models.ddic.model.Find id，::{"withs":{"rel":{},"col":{}}}`，无法获取到预期的数据。只能读取到`rel`的数据。无法读取到`col`的数据。

查询条件`::{"withs":{"rel":{},"col":{}}}`，按程序的处理逻辑是，把`rel`的结果作为`col`的前堤。相当于下面查询条件。本来是平行的关系，结果变成了嵌套逻辑，`::{"withs":{"rel":{"col":{}}}`

```go
// yao-app-sources/gou/query.stack.go：124
// Run 执行查询栈
func (stack *QueryStack) Run() []maps.MapStrAny {
	res := [][]maps.MapStrAny{}
	for i, qb := range stack.Builders {
		param := stack.Params[i]
		switch param.Relation.Type {
		case "hasMany":
			stack.runHasMany(&res, qb, param)
			break
		default:
			stack.run(&res, qb, param)
		}
	}

	if len(res) < 0 {
		return nil
	}
	return res[0]
}

// yao-app-sources/gou/query.stack.go：235
func (stack *QueryStack) runHasMany(res *[][]maps.MapStrAny, builder QueryStackBuilder, param QueryStackParam) {

	// 获取上次查询结果，拼接结果集ID
	rel := stack.Relation()
	foreignIDs := []interface{}{}
	prevRows := (*res)[len(*res)-1] //以上一次的结果集作为这一次查询的条件。这里逻辑出错。
	for _, row := range prevRows {
		id := row.Get(rel.Foreign)
		foreignIDs = append(foreignIDs, id)
	}
....

```

## 结论

`withs`条件不支持两个同一级别的的`hasMany`从表。从源代码来看，如果是两个`hasmany`,就会出问题。

## 问题重现

```sh

git clone git@github.com:wwsheng009/yao-admin.git

cd yao-admin/ && git checkout hasMany-bug

cp .env.sample .env

yao migrate --reset

yao studio run model.cmd.CreateFromFile

yao studio run ddic.loader.LoadModelFromFile
# 正常
yao run models.ddic.model.Find  9 '::{"withs":{"col":{}}}'
# 正常
yao run models.ddic.model.Find  9 '::{"withs":{"rel":{}}}'
# 不正常
yao run models.ddic.model.Find  9 '::{"withs":{"rel":{},"col":{}}}'
# 不正常
yao run models.ddic.model.Find  9 '::{"withs":{"col":{},"rel":{}}}'

```
