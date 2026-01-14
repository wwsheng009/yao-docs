---
name: model
description: Guide to Yao Model configuration and usage, mapping DSL to database structures with auto-migration and CRUD support.
license: Complete terms in LICENSE.txt
---

# Yao Model 配置与使用指南

在 Yao 引擎中，**Model (模型)** 是对数据结构的抽象定义。它通过 DSL (Domain Specific Language) 描述数据表结构、字段类型、校验规则以及加密方式。Yao 的底层引擎（Golang）会解析这些 DSL，自动在数据库中创建或更新表结构（Auto Migration），并提供了一套完整的 CRUD 接口。

## 1\. 文件存放与命名

根据 `yao/model/model.go` 的源码逻辑，Yao 引擎在启动时会扫描应用目录下的 `models` 文件夹。

- **目录**: `models/`
- **支持的扩展名**: `*.mod.yao`, `*.mod.json`, `*.mod.jsonc`
- **命名规范**: 建议使用小写字母，如 `user.mod.yao`。文件路径将直接映射为模型的 ID（例如 `models/admin/user.mod.yao` 的 ID 为 `admin.user`）。

## 2\. DSL 结构详解

一个标准的 Model DSL 文件由 JSON 结构组成，主要包含以下核心部分：

### 2.1 基础元数据 (Metadata)

```json
{
  "name": "User",
  "table": { "name": "user", "comment": "用户表" },
  "option": { "timestamps": true, "soft_deletes": true }
}
```

- **name**: 模型的显示名称。
- **table**: 映射到数据库的表配置。
  - `name`: 数据库中的实际表名（引擎会自动加上前缀）。
  - `comment`: 表注释。
- **option**: ORM 行为配置。
  - `timestamps`: 设为 `true` 会自动创建 `created_at` 和 `updated_at` 字段。
  - `soft_deletes`: 设为 `true` 会自动创建 `deleted_at` 字段，支持软删除。

### 2.2 字段定义 (Columns)

`columns` 数组定义了具体的字段属性。根据 `user.mod.yao` 中的示例，支持丰富的类型和属性：

| 属性         | 类型    | 描述                                                                                 | 示例       |
| :----------- | :------ | :----------------------------------------------------------------------------------- | :--------- |
| **label**    | String  | 字段显示标签，用于自动生成 UI。                                                      | "Email"    |
| **name**     | String  | 数据库字段名。                                                                       | "email"    |
| **type**     | String  | 数据类型。常见类型：`ID`, `string`, `integer`, `float`, `json`, `enum`, `datetime`。 | "string"   |
| **length**   | Integer | 字段长度（针对字符串）。                                                             | 256        |
| **comment**  | String  | 字段注释。                                                                           | "用户邮箱" |
| **unique**   | Boolean | 是否建立唯一索引。                                                                   | true       |
| **nullable** | Boolean | 是否允许为 NULL。                                                                    | true       |
| **index**    | Boolean | 是否建立普通索引。                                                                   | true       |
| **default**  | Any     | 默认值。                                                                             | "admin"    |
| **crypt**    | String  | **加密存储**。支持 `AES` (双向) 和 `PASSWORD` (哈希)。                               | "AES"      |

---

### 2.3 数据校验 (Validations)

Yao 允许在 Model 层直接定义数据校验规则，引擎在写入数据前会自动执行检查。

```json
"validations": [
  {
    "method": "typeof",
    "args": ["string"],
    "message": "{{input}} 类型错误"
  },
  {
    "method": "email",
    "args": [],
    "message": "请输入有效的邮箱地址"
  },
  {
    "method": "enum",
    "args": ["admin", "staff"],
    "message": "类型必须是 admin 或 staff"
  }
]
```

- **method**: 校验方法，Yao 内置了一系列校验器（如 `minLength`, `maxLength`, `enum`, `email`, `mobile` 等）。
- **args**: 传递给校验方法的参数数组。
- **message**: 校验失败时的错误提示信息，支持 `{{input}}` 和 `{{label}}` 占位符。

---

## 3\. 完整配置示例

基于你上传的 `user.mod.yao`，这是一个标准的用户模型配置：

```jsonc
{
  "name": "User",
  "table": { "name": "user", "comment": "User" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "Email",
      "name": "email",
      "type": "string",
      "length": 50,
      "unique": true,
      "nullable": true,
      "validations": [
        { "method": "email", "message": "{{input}} should be email" }
      ]
    },
    {
      "label": "Mobile",
      "name": "mobile",
      "type": "string",
      "length": 50,
      "unique": true,
      "nullable": true,
      "crypt": "AES" // 敏感字段加密存储
    },
    {
      "label": "Password",
      "name": "password",
      "type": "string",
      "length": 256,
      "crypt": "PASSWORD", // 密码哈希存储
      "validations": [
        { "method": "minLength", "args": [6], "message": "密码太短" }
      ]
    },
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "default": "admin",
      "option": ["admin", "staff"],
      "index": true
    },
    {
      "label": "Role",
      "name": "roles",
      "type": "json", // JSON 类型支持
      "nullable": true
    }
  ],
  "option": { "timestamps": true, "soft_deletes": true }
}
```

---

## 4. 模型元数据管理

Yao 提供了完整的模型元数据管理功能，包括模型实例操作、全局模型管理和快照管理。

### 4.1 模型实例管理

每个模型实例提供以下操作方法，通过 `models.MODEL_ID` 访问：

#### models.MODEL_ID.migrate

将模型配置同步到数据库（创建或更新表结构）

```javascript
// 基本用法
Process('models.pet.migrate');
// 强制重置
Process('models.pet.migrate', true);
```

#### models.MODEL_ID.load

从文件或源代码加载模型配置

```javascript
// 从文件加载
Process('models.pet.load', '/models/pet.mod.json');
// 从源代码加载
Process('models.pet.load', '', {
  name: '宠物信息',
  table: { name: 'pet', comment: '宠物信息表' },
  columns: [...]
});
```

#### models.MODEL_ID.reload

重新加载模型配置

```javascript
Process('models.pet.reload');
```

#### models.MODEL_ID.read

读取模型元信息

```javascript
const modelInfo = Process('models.pet.read');
```

#### models.MODEL_ID.exists

检查模型是否存在

```javascript
const exists = Process('models.pet.exists');
```

### 4.2 快照管理

快照功能用于保存和恢复模型的数据状态：

#### 创建快照

```javascript
const snapshot = Process('models.pet.takesnapshot', false);
```

#### 恢复快照

```javascript
Process('models.pet.restoresnapshot', 'pet_snapshot_20230101');
```

#### 删除快照

```javascript
Process('models.pet.dropsnapshot', 'pet_snapshot_20230101');
```

#### 检查快照是否存在

```javascript
const exists = Process('models.pet.snapshotexists', 'pet_snapshot_20230101');
```

### 4.3 全局模型管理

#### model.list

列出所有模型的信息

```javascript
const models = Process('model.list');
// 获取详细信息
const modelsWithDetails = Process('model.list', {
  metadata: true,
  columns: true
});
```

#### model.read

获取指定模型的源代码

```javascript
const modelSource = Process('model.read', 'admin.user');
```

#### model.dsl

获取指定模型的元数据信息

```javascript
const petModel = Process('model.dsl', 'pet', {
  metadata: true,
  columns: true
});
```

#### model.exists

检查指定模型是否存在

```javascript
const exists = Process('model.exists', 'pet');
```

#### model.reload/migrate/load/unload

全局模型管理方法，支持模型的重新加载、迁移、加载和卸载。

---

## 5. 数据操作详解

### 5.1 新增数据

#### Save - 保存单条记录

不存在则创建，存在则更新

```javascript
function Save() {
  return Process('models.category.save', {
    parent_id: 1,
    name: '语文'
  });
}
```

#### Create - 创建单条记录

创建单条记录，返回新创建记录的 ID

```javascript
function Create() {
  return Process('models.category.create', {
    parent_id: 1,
    name: '英语'
  });
}
```

#### Insert - 批量插入

一次性插入多条数据记录

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

#### Upsert - 更新或插入

如果记录不存在则插入，如果记录存在则更新

```javascript
const id = Process(
  'models.user.Upsert',
  { email: 'john@example.com', name: 'John Doe', status: 'active' },
  'email', // 用于检查唯一性的列名
  ['name', 'status'] // 需要更新的列
);
```

### 5.2 更新数据

#### Save - 更新单条记录

传入 id 则为更新

```javascript
function Save() {
  return Process('models.category.save', {
    id: 6,
    parent_id: 1,
    name: '语文'
  });
}
```

#### Update - 更新单条记录

第一个参数为 id，第二个参数为更新对象

```javascript
function Update() {
  return Process('models.category.update', 9, {
    parent_id: 1,
    name: '英语'
  });
}
```

#### UpdateWhere - 批量更新

根据条件更新多条记录

```javascript
function UpdateWhere() {
  return Process(
    'models.category.updatewhere',
    { wheres: [{ column: 'parent_id', value: 1 }] },
    { name: '数学' }
  );
}
```

#### 关联数据更新

```javascript
function SaveWithRelation() {
  return Process('models.category.save', {
    id: 6,
    name: '编程语言',
    book: [
      { name: 'Python入门', status: 1 },
      { name: 'JavaScript高级编程', status: 1 }
    ]
  });
}
```

### 5.3 删除数据

#### Delete - 软删除单条记录

```javascript
function deleteById(id) {
  return Process('models.category.delete', id);
}
```

#### Destroy - 永久删除单条记录

```javascript
function Destroy() {
  return Process('models.category.destroy', 9);
}
```

#### DeleteWhere - 条件软删除

```javascript
function Deletewhere() {
  return Process('models.category.deletewhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}
```

#### DestroyWhere - 条件永久删除

```javascript
function Destroywhere() {
  return Process('models.category.destroywhere', {
    wheres: [{ column: 'parent_id', value: 4 }]
  });
}
```

#### 软删除恢复

```javascript
function restoreDeleted(id) {
  return Process('models.category.save', {
    id: id,
    deleted_at: null
  });
}
```

---

## 6. AES 字段加密

Yao 支持对敏感字段进行 AES 加密存储。

### 配置方式

在字段定义中添加 `crypt: "AES"` 属性：

```json
{
  "label": "手机号",
  "name": "mobile",
  "type": "string",
  "length": 50,
  "crypt": "AES",
  "index": true,
  "nullable": true
}
```

### 实现原理

- **加密时**：调用 MySQL 的 `AES_ENCRYPT` 函数
- **解密时**：调用 MySQL 的 `AES_DECRYPT` 函数
- **存储**：使用 `HEX` 函数转码存储，数据库中看到的是十六进制值
- **密钥**：通过 `YAO_DB_AESKEY` 环境变量设置，默认为空字符串

### 注意事项

1. AES 加密仅在 MySQL 数据库中生效
2. 加密字段仍然可以建立索引
3. 加密是自动透明的，读写数据时无需手动处理

---

## 7. SQLite 与 MySQL 的差异

### 时间格式化函数

**MySQL 使用 `DATE_FORMAT` 函数：**

```json
{
  "select": [":DATE_FORMAT(uptime, '%Y年%m月%d日') as day"]
}
```

**SQLite 使用 `strftime` 函数：**

```json
{
  "select": [":strftime(uptime, '%Y年%m月%d日') as day"]
}
```

### 建议

开发与生产环境最好使用同一类型的数据库，避免因数据库差异导致的问题。

---

## 8. 数据处理钩子（Hooks）

Yao 提供了强大的钩子机制，允许在数据处理前后执行自定义逻辑。

### 钩子类型

- **before 钩子**：在数据操作前执行
- **after 钩子**：在数据操作后执行

### 表单钩子示例

```javascript
// before:create 钩子
function BeforeCreate(payload) {
  if (!payload.password) {
    payload.password = '默认密码';
  }
  // 必须返回数组
  return [payload];
}

// after:create 钩子
function AfterCreate(id, payload) {
  Process('scripts.notification.send', id, '用户创建成功');
  return id;
}
```

### 支持的钩子事件

- `before:find`, `after:find`
- `before:get`, `after:get`
- `before:save`, `after:save`
- `before:create`, `after:create`
- `before:update`, `after:update`
- `before:delete`, `after:delete`

### 注意事项

在表单处理器中，`before` 钩子函数的返回值必须是数组类型。

---

## 9. 底层加载机制 (Golang 源码解析)

作为高级工程师，理解 Yao 如何加载这些配置有助于你排查问题。根据 `yao/model/model.go` 的源码，加载流程如下：

1.  **初始化加密模块**:
    代码 `model.WithCrypt` 被调用，使用配置中的 `DB.AESKey` 初始化 AES 加密器。这意味着如果在 DSL 中指定了 `"crypt": "AES"`，数据将使用此密钥进行加密入库，读取时自动解密。

2.  **加载系统模型**:
    `loadSystemModels()` 函数会优先加载内置模型（如 `__yao.user`, `__yao.table` 等），确保系统核心表结构就绪。

3.  **扫描应用模型**:
    使用 `application.App.Walk` 遍历 `models` 目录。
    - 读取文件内容。
    - 调用 `model.Load` 将 DSL 解析为 Golang 的结构体对象。
    - **自动迁移**: 加载时，Yao 会对比 DSL 定义和数据库实际结构。如果存在差异（如新增字段），引擎会自动执行 `Migrate` 操作来更新数据库表结构（源码 `dsl/model/model.go` 中的 `Migrate` 调用）。

4.  **数据库动态模型**:
    Yao 支持从数据库中加载模型定义 (`StoreTypeDB`)。这允许在运行时动态创建模型，而不仅仅依赖静态文件。

如果有关于具体字段类型实现或自定义校验器的 Golang 扩展问题，请随时告诉我。
