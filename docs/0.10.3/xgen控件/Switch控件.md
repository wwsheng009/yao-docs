# Switch 控件

## 问题

比如，在模型中有字段的配置如下,你会发现，如果使用提`mysql`数据库，这个控件是无法使用的。

```json
{
  "name": "online",
  "label": "是否在线",
  "type": "boolean",
  "default": false,
  "index": true
}
```

## WHY

- 在使用`sqlite3`作为数据库时，`Switch`控件的值需要设置成`true/false`。

> sqlite 作为数据库时，`golang`中的`sqlite3`驱动会自动作数据转换。数据库表的字段数据类型是`boolean`,在数据库表里保存的数据是`0`或`1`。更新数据时在 `sql`语句中却需要使用 `true`,与 `false` 来更新数据。而数据从数据库中读取出来后会自动转换成 `true` 与 `false`.

- 在使用 mysql 作为数据库时，`Switch`控件的值需要设置成`1/0`。

> 在使用 `mysql` 作为数据库源时，`model` 中字段为 `boolean` 类型的字段生成的 `mysql` 数据库字段类型是 `tinyint(1)`。数据的保存与读取不会自动的转换，`0/1`。

`Switch`控件默认的值是`false`或`true`。

如果在`tab.json`中定义字段中使用默认的字段绑定显示设置，即是在`fields.table`中不显式的定义控件属性，这时框架会自动生成字段定义，这个生成的定义只适用于 `sqlite3` 数据库。如果切换成 `mysql` 的数据后，显示就会异常。差不多也算是一个 bug。

## 解决方法

解决方法是，如果是使用的`mysql`数据库，在`fields.table`中替换显式的定义控件属性，`checkedValue=1`，`unCheckedValue=0`

使用 MYSQL 数据库时的配置：

```json
{
  "是否在线": {
    "bind": "online",
    "view": {
      "type": "Switch",
      "props": {
        "checkedChildren": "是",
        "checkedValue": 1,
        "unCheckedChildren": "否",
        "unCheckedValue": 0
      }
    }
  }
}
```

使用`SQLITE`数据库时的配置：

```json
{
  "是否在线": {
    "bind": "online",
    "view": {
      "type": "Switch",
      "props": {
        "checkedChildren": "是",
        "checkedValue": true,
        "unCheckedChildren": "否",
        "unCheckedValue": false
      }
    }
  }
}
```
