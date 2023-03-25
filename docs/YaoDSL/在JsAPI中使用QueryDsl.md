# 在`JsAPI`中使用`QueryDsl`

在 jsapi 中也是可以使用`QueryDSL`对象的。

代码：`{ ":deleted_at": "删除", "=": null `。`js`对象`Key`使用`:`作为字段名前缀是一种简化写法。字段名`deleted_at`,备注是`删除`。操作符是`=`,值是`null`。等于`where deleted_at = null`。

```js
function GetSelect() {
  const query = new Query()
  const res = query.Get({
    wheres: [{ ':deleted_at': '删除', '=': null }],
    select: ['id as value', 'name as label'],
    from: 'company',
  })
  return res
}

/**
 * 供应商
 * @returns
 */
function GetSupplier() {
  const query = new Query()
  const res = query.Get({
    wheres: [
      { ':deleted_at': '删除', '=': null },
      { ':type': '类型', '=': '外部' },
    ],
    select: ['id as value', 'name as label'],
    from: 'company',
  })
  return res
}
```
