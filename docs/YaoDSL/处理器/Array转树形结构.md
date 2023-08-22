# Array 转树形结构

处理器`xiang.helper.ArrayTree`或是`utils.arr.Tree`，传入有父子节点关系的对象数组，返回转换后树形结构数据。转换后的子节点的数据保存在`children`属性中，可嵌套。

典型的应用是转换保存在数据库中的菜单数据成 JSON 对象。

- 参数 1： 记录集合
- 参数 2： 数据转换配置项，配置项定义：

```go
// ArrayTreeOption Array转树形结构参数表
type ArrayTreeOption struct {
	Key      string      `json:"id"`       // 主键名称, 默认为 id
	Empty    interface{} `json:"empty"`    // Top节点 parent 数值, 默认为 0
	Parent   string      `json:"parent"`   // 父节点字段名称, 默认为 parent
	Children string      `json:"children"` // 子节点字段名称, 默认为 children
}

```

一般会设置`empty=null`与`parent`，表示如果这个`parent`对应的字段如果是空值说明是树顶点。

示例

```js
res = Process('xiang.helper.ArrayTree', cate, {
  parent: 'parent_id',
  empty: null,
});
```

删除空对象

```js
function removeEmpty(obj) {
  for (var prop in obj) {
    if (obj[prop] === null || obj[prop] === undefined) {
      delete obj[prop];
    } else if (typeof obj[prop] === 'object') {
      removeEmpty(obj[prop]);
      if (Array.isArray(obj[prop]) && obj[prop].length === 0) {
        delete obj[prop];
      } else if (Object.keys(obj[prop]).length === 0) {
        delete obj[prop];
      }
    }
  }
  return obj;
}
```
