# 在`Form`里显示子表

可在以`Form`显示子表内容，可惜无法在子表里增加新条目。

- 配置字段的类型为:`type:Table`
- 配置字段属性`edit.props.model`为`Table`的标识
- 配置表的筛选条件`edit.props.query`

```json
{
  "fileds": {
    "form": {
      "消息列表": {
        "edit": {
          "props": {
            "model": "chat.message_simple",
            "query": {
              "select": "id,prompt,completion,request_total_time",
              "where.conversation_id.eq": "{{id}}"
            }
          },
          "type": "Table"
        }
      }
    }
  }
}
```

效果：
![table_in_form](./table_in_form.png)

如果需要在`Form`里增加新内容，可以使用`List`控件。
