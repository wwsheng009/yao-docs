## 时间格式化函数

MYSQL 使用`DATE_FORMAT`函数

```json
{
  "name": "入库",
  "engine": "xiang",
  "query": {
    "debug": true,
    "select": [
      ":DATE_FORMAT(uptime, '%Y年%m月%d日') as day",
      ":COUNT(id) as 数量"
    ],
    "wheres": [
      { ":uptime": "日期", ">=": "?:$res.日期.from" },
      { ":uptime": "日期", "<=": "?:$res.日期.to" },
      { ":type": "类型", "<=": "入库" }
    ],
    "from": "record",
    "groups": ["day"]
  }
}
```

SQLITE 使用`datetime`函数

```json
{
  "name": "入库",
  "engine": "xiang",
  "query": {
    "debug": true,
    "select": [
      ":datetime(uptime, '%Y年%m月%d日') as day",
      ":COUNT(id) as 数量"
    ],
    "wheres": [
      { ":uptime": "日期", ">=": "?:$res.日期.from" },
      { ":uptime": "日期", "<=": "?:$res.日期.to" },
      { ":type": "类型", "<=": "入库" }
    ],
    "from": "record",
    "groups": ["day"]
  }
}
```
