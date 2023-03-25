## Sqlite 数据库表中的字段名不能与表名一样。

处理器：`schemas.default.TableGet`，无法读取表的字段定义，提示`schemas.default.TableGet the column %s does not exists`,

从代码上看，如果字段名与表名一样，会被排除掉。

尝试修复如下：

https://github.com/wwsheng009/xun/commit/7127b0945f1b5c9c279fc2005e17836ffcc65c7d

```go
selectColumns := []string{
		"m.name AS `table_name`",
		"p.name AS `name`",
		"p.cid AS `position`",
		"p.dflt_value AS `default`",
		"UPPER(p.type) as `type`",
		`CASE
			WHEN ` + "p.`notnull`" + ` == 0 THEN 1
			ELSE 0
		END AS ` + "`nullable`",
		`CASE
		   WHEN INSTR(` + "p.`type`" + `, 'UNSIGNED' ) THEN 1
		   WHEN  p.pk = 1 and ` + "p.`type`" + ` = 'INTEGER' THEN 1
		   ELSE 0
		END AS` + "`unsigned`",
		`CASE
			WHEN p.pk = 1 THEN 1
			ELSE 0
		END AS ` + "`primary`",
		`CASE
			WHEN p.pk = 1 and INSTR(m.sql, 'AUTOINCREMENT' ) THEN "AutoIncrement"
			ELSE ""
		END AS ` + "`extra`",
	}
	sql := fmt.Sprintf(`
			SELECT %s
			FROM sqlite_master m
			LEFT OUTER JOIN pragma_table_info((m.name)) p  ON m.name <> p.name
			WHERE m.type = 'table' and table_name=%s
		`,
		strings.Join(selectColumns, ","),
		grammarSQL.VAL(tableName),
	)


```

出错的地方：

```go
	sql := fmt.Sprintf(`
			SELECT %s
			FROM sqlite_master m
			LEFT OUTER JOIN pragma_table_info((m.name)) p  ON m.name <> p.name
			WHERE m.type = 'table' and table_name=%s
		`,
		strings.Join(selectColumns, ","),
```

从上面修改成下面的：

```go
	sql := fmt.Sprintf(`
			SELECT %s
			FROM sqlite_master m,
			pragma_table_info((m.name)) p
			WHERE m.type = 'table' and table_name=%s
		`,
		strings.Join(selectColumns, ","),
```
