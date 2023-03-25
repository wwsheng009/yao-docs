# 使用 Hook 转换日期控件的值

界面上的日期控件的格式是"YYYY-MM-DD hh:mm:ss"，即使是只选当前日期，也会把当前的时间带入后台。

如果数据库字段的值是只有日期"YYYY-MM-DD"或是时间为"YYYY-MM-DD 00:00:00"时，关联搜索会失败。

使用`Hook`可以处理这个问题

```js
/**
 * 搜索 Hook, 处理日期条件
 */
function BeforeSearch(query, page, pagesize) {
  //   console.log("old search:", query.wheres);
  query = query || {}
  wheres = query.wheres || []
  for (const i in wheres) {
    const where = wheres[i] || {}
    if (where.column == 'day' && where.value) {
      // url的查询
      where.value = where.value.replaceAll('"', '')
      const value = new Date(where.value).toISOString().split('T')[0]
      query.wheres[i].value = `${value} 00:00:00`
    }
  }
  return [query, page, pagesize]
}
```
