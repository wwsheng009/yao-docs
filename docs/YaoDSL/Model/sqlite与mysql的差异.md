---
author: Vincent Wang
contributors: [AbbetWang]
---

# 在 Yao 中使用 MySQL 与 SQLITE

`MYSQL`与`SQLITE`数据库在某些场景有不一致的风险,开发与生产最好使用同一类型的数据库。

## Switch 控件

`Switch`控件在两个数据库下使用需要差异化的配置。

[`Switch`控件](../../ui/Xgen/Xgen%E6%8E%A7%E4%BB%B6/Switch%E6%8E%A7%E4%BB%B6.md)

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

SQLITE 使用`strftime`函数格式化日期

```json
{
  "name": "入库",
  "engine": "xiang",
  "query": {
    "debug": true,
    "select": [
      ":strftime(uptime, '%Y年%m月%d日') as day",
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
