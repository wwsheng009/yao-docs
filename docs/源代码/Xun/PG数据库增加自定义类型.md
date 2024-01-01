# pg 数据库增加自定义类型

在 pg 数据库里可以增加自定义的类型。如果需要在 yao 是支持使用 pg 数据库的自定义类型，需要针对源代码作一些增强。

需求：给 pg 数据库增加一个自定义的类型 vector,对应 pg 数据库的插件 pgvector。

效果：比如下面的类型定义中的类类型 vector。

```json
{
  "columns": [
    {
      "name": "id",
      "label": "ID",
      "type": "ID",
      "precision": 64,
      "primary": true
    },
    {
      "name": "filename",
      "label": "filename",
      "type": "text",
      "nullable": true
    },
    {
      "name": "content",
      "label": "CONTENT",
      "type": "text",
      "nullable": true
    },
    {
      "name": "embedding",
      "label": "EMBEDDING",
      "type": "vector",
      "length": 1024,
      // "length": 768,
      "nullable": true,
      "index": true
    }
  ],
  "option": {},
  "table": {
    "name": "documents"
  },
  "name": "documents",
  "relations": {}
}
// yao migrate -n documents --reset
```

## GITHUB 提交

- [XUN 增强](https://github.com/wwsheng009/xun/commit/f472c64a79f5292cde73a4c5653a8ba8dca6dcb4)
- [GOU 增强](https://github.com/wwsheng009/gou/commit/13f92b54e6c03b4640795b9342971c8e25ca8e27)

## 代码增强

在 yao 应用中，数据库的交互由组件 xun 完成，xun 的功能有点类似于 orm，适配不同的数据库。

首先需要调整 postgres 的语法器代码，给它增加自定义类型映射。在这里直接使用模型定义中的 vector 对应数据库中的 vector 类型。

```go
// xun/grammar/postgres/postgres.go

// New Create a new mysql grammar inteface
func New() dbal.Grammar {
	pg := Postgres{
		SQL: sql.NewSQL(&Quoter{}),
	}
	pg.Driver = "postgres"
	pg.IndexTypes = map[string]string{
		"unique": "UNIQUE INDEX",
		"index":  "INDEX",
	}

	// overwrite types
	types := pg.SQL.Types
	types["tinyInteger"] = "SMALLINT"
	types["bigInteger"] = "BIGINT"
	types["string"] = "CHARACTER VARYING"
	types["integer"] = "INTEGER"
	types["decimal"] = "NUMERIC"
	types["float"] = "REAL"
	types["double"] = "DOUBLE PRECISION"
	types["char"] = "CHARACTER"
	types["mediumText"] = "TEXT"
	types["longText"] = "TEXT"
	types["dateTime"] = "TIMESTAMP(%d) WITHOUT TIME ZONE"
	types["dateTimeTz"] = "TIMESTAMP(%d) WITH TIME ZONE"
	types["time"] = "TIME(%d) WITHOUT TIME ZONE"
	types["timeTz"] = "TIME(%d) WITH TIME ZONE"
	types["timestamp"] = "TIMESTAMP(%d) WITHOUT TIME ZONE"
	types["timestampTz"] = "TIMESTAMP(%d) WITH TIME ZONE"
	types["binary"] = "BYTEA"
	types["macAddress"] = "MACADDR"
	types["vector"] = "VECTOR" //pgvector
	pg.Types = types

	// set fliptypes
    // 反向映射
	flipTypes, ok := utils.MapFilp(pg.Types)
	if ok {
		pg.FlipTypes = flipTypes.(map[string]string)
		pg.FlipTypes["TEXT"] = "text"
		pg.FlipTypes["TIMESTAMP WITHOUT TIME ZONE"] = "timestamp"
		pg.FlipTypes["TIMESTAMP WITH TIME ZONE"] = "timestampTz"
		pg.FlipTypes["TIME WITHOUT TIME ZONE"] = "time"
		pg.FlipTypes["TIME WITH TIME ZONE"] = "timeTz"
		pg.FlipTypes["SMALLINT"] = "smallInteger"

		pg.FlipTypes["VECTOR"] = "vector" //pgvector
	}

	return pg
}

```

然后给 Blueprint 的接口增加一个方法定义。这里增加的方法定义是为了给 gou 库暴露接口。

```go
// xun/dbal/schema/interfaces.go
// pgvector
Vector(name string, args ...int) *Column

```

新增接口的实现，vector 类型对应数据库中的 vector 类型，并且可以设置 vector 的维度，这里直接使用 yao 模型定义中的长度来设置。

```go
// xun/dbal/schema/blueprint.go

// pgvector
func (table *Table) Vector(name string, args ...int) *Column {
	column := table.newColumn(name).SetType("vector")
	column.MaxLength = 16000 //max dimensions
	column.DefaultLength = 1536
	length := column.DefaultLength
	if len(args) >= 1 {
		length = args[0]
	}
	column.SetLength(length)
	table.putColumn(column)
	return column
}

```

接下来改造 builder.go 文件，它的作用是针对于 pg 数据库，如何把 yao 模型的定义构造成对应 pg 数据库的 sql 语句。

```go
// xun/grammar/postgres/builder.go

// SQLAddComment return the add comment sql for table create
func (grammarSQL Postgres) SQLAddComment(column *dbal.Column) string {

	mappingTypes := []string{"ipAddress", "year", "vector"}//增加新的vector，这里会把自定义类型写入字段的备注里。
	if utils.StringHave(mappingTypes, column.Type) {
		comment = fmt.Sprintf("COMMENT on column %s.%s is %s;",
			grammarSQL.ID(column.TableName),
			grammarSQL.ID(column.Name),
			grammarSQL.VAL(fmt.Sprintf("T:%s|%s", column.Type, utils.StringVal(column.Comment))),
		)
	}
	return comment
}



// SQLAddIndex  return the add index sql for table create
func (grammarSQL Postgres) SQLAddIndex(index *dbal.Index) string {
	quoter := grammarSQL.Quoter
	indexTypes := grammarSQL.IndexTypes
	typ, has := indexTypes[index.Type]
	if !has {
		typ = "KEY"
	}

	// UNIQUE KEY `unionid` (`unionid`) COMMENT 'xxxx'
	// IS JSON
	columns := []string{}
	isJSON := false
	isVector := false //增加一个判断是否vector类型
	for _, column := range index.Columns {
		columns = append(columns, quoter.ID(column.Name))
		if column.Type == "json" || column.Type == "jsonb" {
			isJSON = true
		} else if column.Type == "vector" {
			isVector = true //字段类型是vector
		}
	}
	if isJSON {
		return ""
	}

	comment := ""
	if index.Comment != nil {
		comment = fmt.Sprintf("COMMENT %s", quoter.VAL(index.Comment))
	}
	name := quoter.ID(fmt.Sprintf("%s_%s", index.TableName, index.Name))
	sql := ""
	if typ == "PRIMARY KEY" {
		sql = fmt.Sprintf(
			"%s (%s) %s",
			typ, strings.Join(columns, ","), comment)
	} else if isVector {
        // 自定义vector的索引构造sql,这里是使用了hnsw算法，自动的给新增数据也增加索引
		sql = fmt.Sprintf(
			"CREATE INDEX %s ON %s USING hnsw (%s vector_cosine_ops) WITH (m = 24, ef_construction = 200)",
			name, quoter.ID(index.TableName), strings.Join(columns, ","))
	} else {
		sql = fmt.Sprintf(
			"CREATE %s %s ON %s (%s)",
			typ, name, quoter.ID(index.TableName), strings.Join(columns, ","))
	}
	return sql
}

```

另外一个额外的优化是在根据数据库表结构生成对应 yao 模型定义时的处理。从备注中删除类型定义，避免下次更新表结构时重复赋值。

```go
func (grammarSQL Postgres) GetColumnListing(dbName string, tableName string) ([]*dbal.Column, error) {


	// Cast the database data type to DBAL data type
	for _, column := range columns {
		typ, has := grammarSQL.FlipTypes[column.Type]
		if has {
			column.Type = typ
		}

		if column.Comment != nil {
			typ = grammarSQL.GetTypeFromComment(column.Comment)
			if typ != "" {
				column.Type = typ
                // 从备注中删除类型定义，避免下次更新表结构时重复赋值
				*column.Comment = strings.ReplaceAll(*column.Comment, fmt.Sprintf("T:%s|", typ), "")
			}
		}
    }

}

```

最后还需要对 GOU 库进行增强，在转换类型为 vector 的字段时调用 xun 库的 vector 方法。

```go
// gou/schema/xun/column.go

func setColumnType(table schema.Blueprint, column types.Column) (*schema.Column, error) {

    // 在转换类型为vector的字段时调用xun库的vector方法。
	case "vector":
		return table.Vector(column.Name, column.Length), nil
	}

}
```
