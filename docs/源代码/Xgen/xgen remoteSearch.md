# `Select控件/Mention控件`远程`searchOptions`的 bug。

按后端的返回值来看，远程控件只有两个属性`api`与`params`,不会存在`key`。所以搜索条件的字段名会变成`undefined`。

请求示例如下：
http://192.168.126.141:5099/api/__yao/table/material.category/component/fields.table.%E4%B8%8A%E7%BA%A7%E7%B1%BB%E7%9B%AE.edit.props.xProps/search?id=1&key=id&undefined=12

源代码：`/yao-app-sources/xgen-v1.0/packages/xgen/models/remote.ts`

尝试修复如下，使用参数中的一个`key`参数作为搜索字段

https://github.com/wwsheng009/xgen/commit/641745d5b8f544388831f7973619baf53b2c8551

```js
	async searchOptions(v: string) {
		const search = this.raw_props.xProps.search

		if (!search) return

		const params = {
			...search.params,
			// [search.key]: v
			[search.params?.key]: v
		}
    }
```
