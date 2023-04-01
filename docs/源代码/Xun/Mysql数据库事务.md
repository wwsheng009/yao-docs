# Mysql 数据库使用事务

经过测试，使用 `mysql` 数据库时，可以使用事务来控制数据的一致性。

在 `jsapi` 中可以使用 `query.run` 直接执行数据库命令。

在 `flow` 中可以使用 `query.stmt` 使用数据库命令。

- `START TRANSACTION` 或 BEGIN 开始新事务。
- `COMMIT` 提交当前事务，使其更改永久化。
- `ROLLBACK` 回滚当前事务，取消其更改。
- `SET autocommit` 禁用或启用当前会话的默认自动提交模式。

测试 js 脚本，测试模型在最下面。

```js
/**Mysql */
function Transaction(items) {
  const q = new Query();
  q.Run({
    sql: {
      stmt: 'START TRANSACTION;',
    },
  });

  let hasError = false;
  for (const item of items) {
    const re = Process('models.pet.Save', item);
    if (re.code && re.message) {
      hasError = true;
      console.log(`data failed to saved,rollback,${re.code},${re.message}`);
      break;
    } else {
      console.log(`data saved,newId: ${re}`);
    }
  }
  if (hasError) {
    q.Run({
      sql: {
        stmt: 'ROLLBACK;',
      },
    });
  } else {
    q.Run({
      sql: {
        stmt: 'COMMIT;',
      },
    });
    console.log(`data saved,commit`);
  }

  const data = Process('models.pet.Get', {});
  console.log(`pets data length:${data.length}`);
  return hasError;
}

function testCase() {
  const q = new Query();
  q.Run({
    sql: {
      stmt: 'delete from yao_demo_pet;',
    },
  });

  const dataOk = [
    { name: 'item1', stay: 1, cost: 10 },
    { name: 'item2', stay: 12, cost: 120 },
    { name: 'item3', stay: 13, cost: 220 },
  ];
  //should failed
  const dataShouldFail = [
    { name: 'item4', stay: 12, cost: 10 },
    { name: 'item5', stay: 12 },
    { name: 'item6', cost: 20 },
  ];

  Transaction(dataOk);
  Transaction(dataShouldFail);
}
```

测试数据模型

```json
{
  "name": "::Pet",
  "table": { "name": "yao_demo_pet", "comment": "宠物表" },
  "columns": [
    { "name": "id", "label": "ID", "type": "ID" },
    {
      "name": "name",
      "label": "昵称",
      "type": "string",
      "length": 80,
      "index": true,
      "nullable": true
    },
    {
      "name": "type",
      "label": "类型",
      "type": "enum",
      "option": ["cat", "dog", "others"],
      "index": true
    },
    {
      "name": "status",
      "label": "入院状态",
      "type": "enum",
      "option": ["checked", "curing", "cured"],
      "index": true
    },
    {
      "name": "mode",
      "label": "状态",
      "type": "enum",
      "option": ["enabled", "disabled"],
      "index": true
    },
    {
      "name": "online",
      "label": "是否在线",
      "type": "boolean",
      "default": false,
      "index": true
    },
    {
      "name": "curing_status",
      "label": "治疗状态",
      "type": "enum",
      "default": "0",
      "option": ["0", "1", "2"],
      "index": true
    },
    { "name": "stay", "label": "入院时间", "type": "integer" },
    { "name": "cost", "label": "花费", "type": "integer" },
    {
      "name": "images",
      "type": "json",
      "label": "相关图片",
      "nullable": true
    }
  ],
  "relations": {},
  "values": [],
  "indexes": [],
  "option": {}
}
```
