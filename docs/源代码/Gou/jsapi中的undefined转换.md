# jsapi 中的 undefined 转换问题

在 jsapi 中,在使用 console.log 打印数据时,如果数据中包含 undefined 值,不会直接打印出 undefined，而是转换成了 0x0。

```js
function test() {
  let model = {};
  // 经过go转换的undefined会变成0。
  // 不要使用==null的判断，而且是使用===null and === undefined
  console.log('model is undefined', model.xxxx === undefined);
  console.log('model is null', model.xxxx === null);
  console.log('model is 0', model.xxxx === 0);
  console.log('model.xxxx', model.xxx); //总是输出0
  return;
}
```

也是说，在 js 中的 undefined 在 golang 中被转换成了 0。

如果在 js 使用`==null`或是`!=null`会无法正确判断 undefined 值。

```go
// Undefined jsValue  Undefined
var Undefined UndefinedT = 0x00


func GoValue(value *v8go.Value, ctx *v8go.Context) (interface{}, error) {

	if value.IsNull() {
		return nil, nil
	}

	if value.IsUndefined() {
		return Undefined, nil
	}
}
```

## 总结

此问题已修复！
