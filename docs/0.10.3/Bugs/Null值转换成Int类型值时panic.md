# Null值转换成Int类型值时panic

当数据库表的字段值是null，而类型是float时，会转换出错。

源代码：
`/data/projects/yao/yao-app-sources/kun/any/any.go`

```go
// CFloat64 converts and returns <v> as float64
func (v Any) CFloat64() float64 {

	if v.value == nil {
		return 0
	}

	value, ok := v.value.(float64)
	if ok {
		return value
	}

	if v.IsString() && v.String() == "" {
		return 0
	}

	value, err := strconv.ParseFloat(fmt.Sprintf("%v", v.value), 64)
	if err != nil {
		panic(err.Error()) //panic
	}
	return value
}

```

修正：

-`https://github.com/wwsheng009/kun/commit/631074294b798b2039f207884162c019ddac5daa`
- `https://github.com/wwsheng009/gou/commit/745392660f9689f32044b9974fb34febca452db4`