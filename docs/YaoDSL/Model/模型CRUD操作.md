# 模型 CRUD 操作

本文档介绍了 Yao 模型的增删改查操作，包括单条记录处理、批量处理和高级用法。

## 创建数据 (Create)

### Save - 创建或更新单条记录

Save 方法会自动判断记录是否存在，存在则更新，不存在则创建。

```javascript
function Save() {
  return Process('models.category.save', {
    parent_id: 1,
    name: '语文'
  });
}
```

### Create - 创建单条记录

Create 方法专门用于创建新记录，返回新记录的ID。

```javascript
function Create() {
  return Process('models.category.create', {
    parent_id: 1,
    name: '英语'
  });
}
```

### Insert - 批量插入记录

Insert 方法用于批量插入多条记录，性能更高。

```javascript
function Insert() {
  return Process(
    'models.category.insert',
    ['parent_id', 'name'],
    [
      [1, '语文'],
      [1, '地理']
    ]
  );
}
```

### Upsert - 插入或更新记录

Upsert 操作根据唯一键判断记录是否存在，存在则更新，不存在则插入。

```javascript
const id = Process(
  'models.user.Upsert',
  { email: 'john@example.com', name: 'John Doe', status: 'active' },
  'email', // 用于检查唯一性的列名
  ['name', 'status'] // 需要更新的列（可选）
);
```

## 更新数据 (Update)

### Update - 根据主键更新单条记录

```javascript
function Update() {
  return Process('models.category.update', 9, {
    parent_id: 1,
    name: '英语'
  });
}
```

### UpdateWhere - 根据条件批量更新记录

```javascript
function UpdateWhere() {
  return Process(
    'models.category.updatewhere',
    {
      wheres: [{ column: 'parent_id', value: 1 }]
    },
    {
      name: '数学'
    }
  );
}
```

## 删除数据 (Delete)

### Delete - 软删除单条记录

```javascript
function deleteById(id) {
  return Process('models.category.delete', id);
}
```

### DeleteWhere - 根据条件软删除记录

```javascript
function Deletewhere() {
  return Process('models.category.deletewhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}
```

### Destroy - 硬删除单条记录

```javascript
function Destroy() {
  return Process('models.category.destroy', 9);
}
```

### DestroyWhere - 根据条件硬删除记录

```javascript
function Destroywhere() {
  return Process('models.category.destroywhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}
```

## 查询数据 (Query)

### Find - 根据主键查询单条记录

```javascript
function Find() {
  return Process('models.user.find', 1, {
    withs: {
      profile: {},
      addresses: {}
    }
  });
}
```

### Get - 根据条件查询多条记录

```javascript
function Get() {
  return Process('models.category.get', {
    wheres: [{ column: 'parent_id', value: null }]
  });
}
```

### Paginate - 分页查询

```javascript
function Paginate() {
  return Process(
    'models.user.Paginate',
    {
      select: ['id', 'name', 'mobile', 'status'],
      withs: {
        manu: {},
        mother: {},
        addresses: {}
      },
      wheres: [{ column: 'status', value: 'enabled' }],
      limit: 2
    },
    1, // 页码
    2 // 每页数量
  );
}
```

## 高级用法

### 关联数据操作

```javascript
// 创建时同时处理关联数据
function SaveWithRelation() {
  return Process('models.category.save', {
    id: 6,
    name: '编程语言',
    books: [
      { name: 'Python入门', status: 1 },
      { name: 'JavaScript高级编程', status: 1 }
    ]
  });
}
```

### 事务处理

```javascript
function transactionalDelete(id) {
  const q = new Query();

  q.Run({
    sql: { stmt: 'START TRANSACTION;' }
  });

  try {
    // 执行操作
    const result = Process('models.category.delete', id);
    q.Run({ sql: { stmt: 'COMMIT;' } });
    return result;
  } catch (err) {
    q.Run({ sql: { stmt: 'ROLLBACK;' } });
    throw err;
  }
}
```

### 钩子函数

```javascript
// hooks/category.js
function BeforeUpdate(payload) {
  payload.data.updated_by = Process('session.get', 'user_id');
  return payload;
}

function AfterUpdate(payload) {
  Process('models.log.create', {
    action: 'update',
    model: 'category',
    data: payload
  });
  return payload;
}
```

## 模型示例

以下是一个完整的模型定义示例，可用于上述CRUD操作：

```json
{
  "name": "书籍分类",
  "table": {
    "name": "category",
    "comment": "书籍分类"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID",
      "comment": "ID",
      "primary": true
    },
    {
      "label": "父级id",
      "name": "parent_id",
      "type": "integer",
      "nullable": true
    },
    {
      "label": "分类名称",
      "name": "name",
      "type": "string",
      "length": 128,
      "index": true
    }
  ],
  "relations": {
    "book": {
      "type": "hasMany",
      "model": "book",
      "key": "category_id",
      "foreign": "id"
    }
  },
  "option": {
    "timestamps": true,
    "soft_deletes": true
  }
}
```
