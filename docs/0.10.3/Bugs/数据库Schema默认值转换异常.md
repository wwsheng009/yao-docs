# 数据库读取 Schema 转换成 Model 时默认值转换异常。

`gou`与`xun`的处理逻辑存在不一致。

在`gou`开发库中缺少针对数据库类型默认值的转换处理。

源代码：
`/data/projects/yao/yao-app-sources/gou/schema/xun/blueprint.go`

```go
func parseColumnType(col *schema.Column, column *types.Column) {
。。。

case "timestamp", "datetime"://这里的datetime是错误的。
}

```

修正：

`https://github.com/wwsheng009/gou/commits/saphana`
