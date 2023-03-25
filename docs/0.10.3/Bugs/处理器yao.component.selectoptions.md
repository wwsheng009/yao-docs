# 处理器`yao.component.selectoptions`修正

当在脚本环境中使用处理器`yao.component.selectoptions`时，无法获取正确数据。

**注**：也可以不修正代码，换一个处理方式，直接调用处理器`models.<mode_id>.get`的方式

比如有以下代码，是在 jsapi 中调用处理器`yao.component.selectoptions`。如果不调用`Yao`框架代码，无法筛选条件`wheres`无法正确运行。

```js
function Test() {
  const param = {
    key: "search",
    label: "name",
    model: "material.category",
    search: "电",
    value: "id",
    wheres: '{"column":"id","op":"ne","value":"4"}',
  };

  const data = Search(param);
  console.log(data);
}

function Search(param) {
  if (param.search == "") {
    return [];
  }

  //使用字符串数组
  let wheres_str = [
    param.wheres,
    JSON.stringify({
      column: "name",
      op: "match",
      value: param.search,
    }),
  ];

  //使用对象数组
  let wheres_object = [
    JSON.parse(param.wheres),
    {
      column: "name",
      op: "match",
      value: param.search,
    },
  ];

  param.wheres = wheres_object;
  const values = Process("yao.component.SelectOptions", param);
  return values;
}
```

尝试修正如下,增加对`]interface{}`的判断与处理。

处理传入条件对象数组：

https://github.com/wwsheng009/yao/commit/f6637e9dc29e2e1e418d0c84c37577e10f51ab9d

处理应付传入单个条件对象：

https://github.com/wwsheng009/yao/commit/347f491d6c2da3d3e00d4d235cb2c2c898633c5f

```golang

	case []interface{}:
		for _, line := range input {
			if data, ok := line.(string); ok {
				where := gou.QueryWhere{}
				err := jsoniter.Unmarshal([]byte(data), &where)
				if err != nil {
					exception.New("query.wheres error %s", 400, err.Error()).Throw()
				}
				wheres = append(wheres, where)
			} else {
				data, err := jsoniter.Marshal(line)
				if err != nil {
					exception.New("query.wheres error: %s", 400, err).Throw()
				}
				where := gou.QueryWhere{}
				err = jsoniter.Unmarshal([]byte(data), &where)
				if err != nil {
					exception.New("query.wheres error %s", 400, err.Error()).Throw()
				}
				wheres = append(wheres, where)
			}
		}
    case interface{}:
		data, err := jsoniter.Marshal(input)
		if err != nil {
			exception.New("query.wheres error: %s", 400, err).Throw()
		}
		where := gou.QueryWhere{}
		err = jsoniter.Unmarshal([]byte(data), &where)
		if err != nil {
			exception.New("query.wheres error %s", 400, err.Error()).Throw()
		}
		wheres = append(wheres, where)
```
