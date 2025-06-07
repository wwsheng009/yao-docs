# Yao 模型定义指南

## 概述

Yao 模型是定义业务数据结构的基础组件，支持数据结构描述、验证规则、数据库表配置、模型关系和业务规则设置。

## 文件结构与命名

**文件位置**：`models/` 目录下
**文件格式**：`.mod.yao`、`.mod.jsonc`、`.mod.json`（推荐 `.mod.yao`）
**命名规则**：

- 使用小写字母，复杂名称用目录分层
- `user.mod.yao` → 模型标识：`user`
- `my/name.mod.yao` → 模型标识：`my.name`
- `auto/car.mod.yao` → 模型标识：`auto.car`

**文件格式**：JSON 格式，`.jsonc` 和 `.yao` 支持注释

## 模型结构示例

```json
{
  "name": "用户",
  "table": { "name": "admin_user", "comment": "用户表", "engine": "InnoDB" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "类型",
      "name": "type",
      "type": "enum",
      "option": ["super", "admin", "staff", "user", "robot"],
      "default": "user",
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误"
        },
        {
          "method": "enum",
          "args": ["super", "admin", "staff", "user", "robot"],
          "message": "{{input}}不在许可范围"
        }
      ]
    }
  ],
  "relations": {},
  "values": [],
  "option": { "timestamps": true, "soft_deletes": true }
}
```

## 模型组成部分

| 部分          | 说明       | 示例                                    |
| ------------- | ---------- | --------------------------------------- |
| **name**      | 模型名称   | `"用户"`                                |
| **table**     | 数据表配置 | `{"name": "users", "engine": "InnoDB"}` |
| **columns**   | 字段定义   | 字段类型、验证规则、索引等              |
| **indexes**   | 索引定义   | 提高查询效率                            |
| **relations** | 关联关系   | `hasOne`、`hasMany` 等                  |
| **values**    | 默认数据   | 初始化数据记录                          |
| **option**    | 配置选项   | 时间戳、软删除等                        |

## 字段定义

### 字段属性配置

| 字段名      | 类型    | 必填 | 说明             | 示例                 |
| ----------- | ------- | ---- | ---------------- | -------------------- |
| name        | string  | ✓    | 数据库列名       | `"username"`         |
| label       | string  | ✓    | 显示名称         | `"用户名"`           |
| type        | string  | ✓    | 字段类型         | `"string"`           |
| comment     | string  | -    | 数据库注释       | `"用户名，唯一标识"` |
| length      | number  | -    | 字段长度         | `255`                |
| precision   | number  | -    | 数字精度         | `10`                 |
| scale       | number  | -    | 小数位数         | `2`                  |
| nullable    | boolean | -    | 允许为空         | `true`               |
| default     | any     | -    | 默认值           | `"guest"`            |
| default_raw | string  | -    | 数据库函数默认值 | `"NOW()"`            |
| generate    | string  | -    | 自动生成类型     | `"UUID"`             |
| crypt       | string  | -    | 加密方式         | `"AES"`              |
| index       | boolean | -    | 创建索引         | `true`               |
| unique      | boolean | -    | 唯一约束         | `true`               |
| primary     | boolean | -    | 主键             | `true`               |
| option      | array   | -    | 枚举选项         | `["A", "B", "C"]`    |

### 字段类型

| 分类         | 类型        | 说明                    | 示例                                               |
| ------------ | ----------- | ----------------------- | -------------------------------------------------- |
| **字符串**   | string      | 可变长度字符串(默认200) | `{"type": "string", "length": 100}`                |
|              | char        | 固定长度字符串          | `{"type": "char", "length": 2}`                    |
|              | text        | 普通文本(65KB)          | `{"type": "text"}`                                 |
|              | mediumText  | 中等文本(16MB)          | `{"type": "mediumText"}`                           |
|              | longText    | 长文本(4GB)             | `{"type": "longText"}`                             |
| **数字**     | tinyInteger | -128到127               | `{"type": "tinyInteger"}`                          |
|              | integer     | -2B到2B                 | `{"type": "integer"}`                              |
|              | bigInteger  | -9E到9E                 | `{"type": "bigInteger"}`                           |
|              | decimal     | 高精度小数              | `{"type": "decimal", "precision": 10, "scale": 2}` |
| **日期时间** | date        | 日期(YYYY-MM-DD)        | `{"type": "date"}`                                 |
|              | datetime    | 日期时间                | `{"type": "datetime"}`                             |
|              | timestamp   | 时间戳                  | `{"type": "timestamp"}`                            |
| **其他**     | boolean     | 布尔值                  | `{"type": "boolean"}`                              |
|              | json        | JSON数据                | `{"type": "json"}`                                 |
|              | uuid        | 唯一标识符              | `{"type": "uuid"}`                                 |
|              | enum        | 枚举类型                | `{"type": "enum", "option": ["A", "B"]}`           |

## 高级字段配置

### 默认值设置

```json
// 静态默认值
{"name": "status", "type": "string", "default": "active"}

// 数据库函数默认值
{"name": "created_at", "type": "datetime", "default_raw": "NOW()"}

// 自动生成值
{"name": "uuid", "type": "string", "generate": "UUID"}
```

### 字段加密

```json
{
  "name": "password",
  "type": "string",
  "crypt": "AES", // AES(仅MySQL) 或 PASSWORD(哈希)
  "comment": "加密存储的密码"
}
```

### 索引配置

```json
// 普通索引
{"name": "email", "type": "string", "index": true}

// 唯一索引
{"name": "username", "type": "string", "unique": true}

// 复合索引（在模型根级配置）
{
  "indexes": [
    {
      "name": "idx_user_status",
      "columns": ["user_id", "status"],
      "unique": false
    }
  ]
}
```

## 字段验证

### 验证方法

| 方法                | 说明       | 参数       | 示例                                        |
| ------------------- | ---------- | ---------- | ------------------------------------------- |
| typeof              | 类型验证   | 类型名     | `{"method": "typeof", "args": ["string"]}`  |
| min/max             | 数值范围   | 数值       | `{"method": "min", "args": [18]}`           |
| minLength/maxLength | 长度范围   | 长度       | `{"method": "minLength", "args": [6]}`      |
| enum                | 枚举验证   | 选项数组   | `{"method": "enum", "args": ["A", "B"]}`    |
| pattern             | 正则匹配   | 正则表达式 | `{"method": "pattern", "args": ["[A-Z]+"]}` |
| email               | 邮箱格式   | 无         | `{"method": "email"}`                       |
| mobile              | 手机号格式 | 无         | `{"method": "mobile"}`                      |

### 验证示例

```json
{
  "name": "password",
  "type": "string",
  "validations": [
    { "method": "minLength", "args": [8], "message": "密码至少8个字符" },
    { "method": "pattern", "args": ["[A-Z]+"], "message": "必须包含大写字母" }
  ]
}
```

### 常用验证规则示例

```json
// 用户名验证
{
  "name": "name", "type": "string", "length": 80,
  "validations": [
    {"method": "typeof", "args": ["string"], "message": "{{label}}应该为字符串"},
    {"method": "minLength", "args": [2], "message": "{{label}}至少需要2个字"},
    {"method": "maxLength", "args": [40], "message": "{{label}}不能超过20个字"}
  ]
}

// 密码验证
{
  "name": "password", "type": "string", "crypt": "PASSWORD",
  "validations": [
    {"method": "minLength", "args": [6], "message": "密码6-18位"},
    {"method": "maxLength", "args": [18], "message": "密码6-18位"},
    {"method": "pattern", "args": ["[0-9]+"], "message": "至少包含一个数字"},
    {"method": "pattern", "args": ["[A-Z]+"], "message": "至少包含一个大写字母"},
    {"method": "pattern", "args": ["[a-z]+"], "message": "至少包含一个小写字母"}
  ]
}

// 常用正则模式
{"method": "pattern", "args": ["^(\\d{18})|(\\d{14}X)$"], "message": "身份证格式错误"}
{"method": "pattern", "args": ["^[0-9A-Za-z@#$&*]{8}$"], "message": "8位字母数字符号组合"}
```

## 模型关联关系

### 关联关系原理

关联关系通过 `relations` 定义，核心是理解 `key` 和 `foreign` 字段：

- **关联条件**：`关联模型.key = 当前模型.foreign`

### 关联类型

| 类型          | 说明               | 示例场景                   |
| ------------- | ------------------ | -------------------------- |
| hasOne        | 一对一             | 用户 → 个人资料            |
| hasMany       | 一对多             | 用户 → 多个订单            |
| belongsTo     | 属于               | 订单 → 用户                |
| hasOneThrough | 通过中间表的一对一 | 用户 → 通过订单 → 最新地址 |

### 关联定义示例

```json
// User 模型
{
  "relations": {
    "profile": {
      "key": "user_id", // profile表的user_id字段
      "foreign": "id", // 当前user表的id字段
      "model": "profile",
      "type": "hasOne" // user.id = profile.user_id
    },
    "orders": {
      "key": "user_id", // order表的user_id字段
      "foreign": "id", // 当前user表的id字段
      "model": "order",
      "type": "hasMany" // user.id = order.user_id (多条)
    }
  }
}
```

### 关联查询使用

```bash
# 查询用户及其关联数据
yao run models.user.Find 1 '::{"withs":{"profile":{}, "orders":{}}}'
```

### 关联关系实例

```json
// 一对一：用户 → 个人资料
{
  "profile": {
    "key": "user_id",        // profile.user_id
    "foreign": "id",         // user.id
    "model": "profile",
    "type": "hasOne"         // user.id = profile.user_id
  }
}

// 一对多：用户 → 订单
{
  "orders": {
    "key": "user_id",        // order.user_id
    "foreign": "id",         // user.id
    "model": "order",
    "type": "hasMany"        // user.id = order.user_id (多条)
  }
}

// 非主键关联：通过app_id关联
{
  "apps": {
    "key": "app_id",         // supplier.app_id
    "foreign": "app_id",     // user.app_id
    "model": "supplier",
    "type": "hasMany"        // user.app_id = supplier.app_id
  }
}
```

## 模型迁移与配置

### 迁移命令

| 命令                           | 说明                 |
| ------------------------------ | -------------------- |
| `yao migrate`                  | 执行所有未应用的迁移 |
| `yao migrate --reset`          | 重置所有表后再执行   |
| `yao migrate -n model --reset` | 指定模型进行变更     |

### 配置选项

| 选项         | 说明       | 示例                   |
| ------------ | ---------- | ---------------------- |
| timestamps   | 自动时间戳 | `"timestamps": true`   |
| soft_deletes | 软删除     | `"soft_deletes": true` |
| engine       | 数据库引擎 | `"engine": "InnoDB"`   |
| charset      | 字符集     | `"charset": "utf8mb4"` |

## 最佳实践

### 命名规范

- 使用小写字母和下划线
- 保持命名一致性（如 created_at）
- 避免使用数据库保留字

### 字段设计

- 为字段添加注释（comment）
- 合理设置字段长度
- 使用合适的字段类型（enum 代替字符串）
- 为常用查询字段添加索引

### 安全性

- 敏感字段使用加密（crypt）
- 设置强验证规则
- 限制字段长度防止溢出

### 性能优化

- 避免过度索引
- 合理使用默认值
- 考虑数据分区

## 模型处理器

模型定义后，Yao 自动生成 CRUD 处理器，命名规则：`models.<模型ID>.<方法名>`

### 处理器列表

| 处理器       | 参数                       | 返回值   | 说明             |
| ------------ | -------------------------- | -------- | ---------------- |
| **查询**     |
| Find         | `主键值, 查询条件`         | 单条记录 | 根据主键查询     |
| Get          | `查询条件`                 | 记录数组 | 条件查询，不分页 |
| Paginate     | `查询条件, 页码, 每页数量` | 分页对象 | 条件查询，分页   |
| **创建**     |
| Create       | `记录对象`                 | 主键值   | 创建单条记录     |
| Insert       | `字段数组, 值数组`         | 插入行数 | 批量插入         |
| **更新**     |
| Update       | `主键值, 记录对象`         | null     | 更新单条记录     |
| UpdateWhere  | `查询条件, 记录对象`       | 更新行数 | 条件更新         |
| Save         | `记录对象`                 | 主键值   | 创建或更新       |
| EachSave     | `记录数组, 共有字段`       | 主键数组 | 批量保存         |
| **删除**     |
| Delete       | `主键值`                   | null     | 软删除单条       |
| DeleteWhere  | `查询条件`                 | 删除行数 | 条件软删除       |
| Destroy      | `主键值`                   | null     | 真删除单条       |
| DestroyWhere | `查询条件`                 | 删除行数 | 条件真删除       |

### 查询条件参数

#### QueryParam 主要参数

| 参数     | 类型         | 说明         |
| -------- | ------------ | ------------ |
| select   | string[]     | 选择字段列表 |
| wheres   | QueryWhere[] | 查询条件     |
| orders   | QueryOrder[] | 排序条件     |
| limit    | number       | 限制记录数   |
| page     | number       | 当前页码     |
| pagesize | number       | 每页记录数   |
| withs    | object       | 关联查询     |

#### QueryWhere 查询条件

| 参数   | 说明     | 示例                             |
| ------ | -------- | -------------------------------- |
| column | 字段名   | `"name"`                         |
| value  | 匹配值   | `"张三"`                         |
| method | 查询方法 | `"where"`, `"orwhere"`           |
| op     | 匹配关系 | `"eq"`, `"like"`, `"gt"`, `"in"` |

#### 匹配关系说明

| op           | 说明          | SQL示例                   |
| ------------ | ------------- | ------------------------- |
| eq           | 等于          | `WHERE field = value`     |
| like         | 模糊匹配      | `WHERE field LIKE value`  |
| gt/ge        | 大于/大于等于 | `WHERE field > value`     |
| lt/le        | 小于/小于等于 | `WHERE field < value`     |
| in           | 包含          | `WHERE field IN (values)` |
| null/notnull | 空值判断      | `WHERE field IS NULL`     |

## CRUD 操作示例

### 创建数据

```js
// 创建单条记录
const id = Process('models.user.create', {
  name: '张三',
  email: 'zhang@example.com'
});

// 批量插入
const data = [
  { name: '李四', email: 'li@example.com' },
  { name: '王五', email: 'wang@example.com' }
];
const { columns, values } = Process('utils.arr.split', data);
const count = Process('models.user.insert', columns, values);
```

### 更新数据

```js
// 根据主键更新
Process('models.user.update', 1, { name: '张三三' });

// 条件更新
const count = Process(
  'models.user.updatewhere',
  { wheres: [{ column: 'status', value: 'inactive' }] },
  { status: 'active' }
);

// 保存（创建或更新）
const id = Process('models.user.save', {
  id: 1, // 有id则更新，无id则创建
  name: '张三'
});

// 批量保存
const ids = Process(
  'models.user.EachSave',
  [{ id: 1, name: '张三' }, { name: '李四' }], // 数据数组
  { status: 'active' } // 共有字段
);
```

### 删除数据

```js
// 软删除（如果启用了 soft_deletes）
Process('models.user.delete', 1);

// 条件软删除
const count = Process('models.user.deletewhere', {
  wheres: [{ column: 'status', value: 'inactive' }]
});

// 真删除
Process('models.user.destroy', 1);

// 条件真删除
const count = Process('models.user.destroywhere', {
  wheres: [{ column: 'created_at', op: 'lt', value: '2023-01-01' }]
});
```

### 查询数据

```js
// 根据主键查询单条记录
const user = Process('models.user.find', 1, {
  withs: { profile: {}, orders: {} } // 关联查询
});

// 条件查询（返回数组）
const users = Process('models.user.get', {
  select: ['id', 'name', 'email'],
  wheres: [
    { column: 'status', value: 'active' },
    { column: 'created_at', op: 'ge', value: '2024-01-01' }
  ],
  orders: [{ column: 'created_at', option: 'desc' }],
  limit: 10
});

// 分页查询
const result = Process(
  'models.user.paginate',
  {
    wheres: [{ column: 'status', value: 'active' }],
    orders: [{ column: 'id', option: 'desc' }]
  },
  1, // 页码
  20 // 每页数量
);
// 返回: { data: [], total: 100, page: 1, pagesize: 20, ... }

// 获取单条记录的简便方法
const [user] = Process('models.user.get', {
  wheres: [{ column: 'email', value: 'user@example.com' }],
  limit: 1
});
```
