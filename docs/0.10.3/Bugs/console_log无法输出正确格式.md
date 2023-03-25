# console.log 无法正确输出

当在脚本中使用`console.log`打印`html`字符时，输出的是`unicode`编码而不是`utf8`编码。这与浏览器的输出差异比较大。

`Yao Js`

```js
function excute() {
  console.log('<')
  console.log('\u003C')
}

// 都是输出
// "\u003c"
```

`ES6 js`

```js
function excute() {
  console.log('<')
  console.log('\u003C')
}

// 都是输出
// <
```

原因，脚本中的`console.log`是`golang`函数的代理，在`golang`中使用`json.Marshal`方法处理对象时，把数据转换成了`unicode`编码

源代码位置：`/yao-app-sources/kun/utils/utils.go`

```go

// Dump The Dump function dumps the given variables:
func Dump(values ...interface{}) {
	f := colorjson.NewFormatter()
	f.Indent = 4
	for _, v := range values {

		jsoniter.Unmarshal(txt, &res)
		s, _ := f.Marshal(res) //uncode编码
		fmt.Printf("%s\n", s)
	}
}
```

尝试修复如下，设置`html`符号不转义：

https://github.com/wwsheng009/kun/commit/8ed8e7237d35e829050dff98ae0e5dd500380a14

```go
// Dump The Dump function dumps the given variables:
func Dump(values ...interface{}) {
	f := colorjson.NewFormatter()
	f.Indent = 4
	for _, v := range values {

		jsoniter.Unmarshal(txt, &res)
		// s, _ := f.Marshal(res)
		// fmt.Printf("%s\n", s)
		s, _ := UnescapeJsonMarshal(res)
		fmt.Printf("%s", s) //返回值已带有\n
	}
}

// https://blog.csdn.net/zhuhanzi/article/details/106156174
// 修正console.log输出html符号异常
func UnescapeJsonMarshal(jsonRaw interface{}) ([]byte, error) {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	//带有缩进的格式化
	encoder.SetIndent("", "    ")
	err := encoder.Encode(jsonRaw)
	return buffer.Bytes(), err
}

```
