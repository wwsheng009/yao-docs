##

`select控件/mention控件`远程`searchOptions`的 bug。

按后端的返回值来看，远程控件只有两个属性`api`与`params`,不会存在`key`。所以搜索条件的字段名会变成`undefined`。

http://192.168.126.141:5099/api/__yao/table/material.category/component/fields.table.%E4%B8%8A%E7%BA%A7%E7%B1%BB%E7%9B%AE.edit.props.xProps/search?id=1&key=id&undefined=12

源代码：`/yao-app-sources/xgen-v1.0/packages/xgen/models/remote.ts`

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
