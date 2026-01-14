# Yao Connector 配置指南

## 概述

在 Yao 框架中，`Connector` 用于连接外部服务（如数据库、Redis、AI 模型等）。底层的 Golang 实现基于 `connector.Connector` 接口，它定义了连接器的注册、查询、Schema 获取等通用行为。

配置文件通常存放于应用目录的 `connectors/` 下，文件后缀为 `.conn.json`、`.conn.yao` 或 `.jsonc`（0.10.3+版本支持 JSONC 格式）。

## 通用 DSL 结构

所有连接器配置都遵循 `DSL` 结构体定义：

```json
{
  "version": "1.0.0",
  "label": "连接器名称",
  "type": "类型标识",
  "options": {
    // 具体类型的配置项
  }
}
```

- **type**: 决定了底层初始化哪个 Go 结构体（如 `mysql` 对应 `database.Xun`，`redis` 对应 `redis.Connector`）。
- **options**: 对应 Go 结构体中的 `Options` 字段，支持使用 `$ENV.变量名` 读取环境变量。

## 连接器类型

- **数据库连接器**：SQLite3、MySQL、PostgreSQL（隐藏支持）、Oracle、HDB（SAP HANA）
- **Redis连接器**：用于保存会话信息
- **MongoDB连接器**：用于 key-value 存储
- **OpenAI连接器**：用于 AI 模型调用
- **MoAPI连接器**

---

## 1. 数据库连接器

数据库连接器在底层映射为 `database.Xun` 结构体。它支持 MySQL, SQLite3, Postgres, Oracle 等驱动。

### 支持的数据库类型 (`type`)

- `sqlite3` - 最常用
- `mysql` - 最常用，支持 JSON 查询表达式
- `postgres` - 隐藏支持
- `oracle`
- `hdb` - SAP HANA 定制数据库

### 默认数据库连接（环境变量配置）

默认数据库连接通过环境变量配置，需写在 `.env` 文件中：

```env
# SQLite
YAO_DB_DRIVER="sqlite3"
YAO_DB_PRIMARY="db/yao.db"

# MySQL
YAO_DB_DRIVER=mysql
YAO_DB_PRIMARY="root:123456@tcp(172.18.3.234:33306)/yao_ai?charset=utf8mb4&parseTime=True&loc=Local"

# PostgreSQL
YAO_DB_DRIVER=postgres
YAO_DB_PRIMARY="postgres://xun:123456@db-server:5096/xun?sslmode=disable&search_path=xun"

# HDB（SAP HANA）
YAO_DB_DRIVER=hdb
YAO_DB_PRIMARY="hdb://HANA_READONLY:Hana@readonly123@172.18.3.30:30015?defaultSchema=HANA_READONLY"
```

### Connector 配置详解 (`options`)

基于 `database/xun.go` 中的 `XunOptions` 结构体分析：

| 字段        | 类型   | 说明                             | 对应 Go 字段  |
| :---------- | :----- | :------------------------------- | :------------ |
| `db`        | String | 数据库名称                       | `DB`          |
| `prefix`    | String | 表前缀                           | `TablePrefix` |
| `charset`   | String | 字符集 (如 `utf8mb4`)            | `Charset`     |
| `collation` | String | 排序规则                         | `Collation`   |
| `parseTime` | Bool   | 是否解析时间 (MySQL推荐 true)    | `ParseTime`   |
| `timeout`   | Int    | 连接超时时间（秒），默认 5       | `Timeout`     |
| `file`      | String | SQLite 文件路径 (仅 SQLite 需要) | `File`        |
| `hosts`     | Array  | 主机列表，支持读写分离           | `Hosts`       |

### Hosts 配置

`hosts` 是一个数组，支持配置主从库。

| 字段      | 类型   | 说明                                            |
| :-------- | :----- | :---------------------------------------------- |
| `host`    | String | 主机地址                                        |
| `port`    | String | 端口 (MySQL默认3306, PG默认5432)                |
| `user`    | String | 用户名                                          |
| `pass`    | String | 密码                                            |
| `primary` | Bool   | 是否为主库 (写库)。如果为 `true` 则用于写操作。 |

### SQLite3 配置示例

```json
{
  "version": "1.0.0",
  "label": "SQLite TEST",
  "type": "sqlite3",
  "options": {
    "file": "$ENV.SQLITE_DB"
  }
}
```

### MySQL 配置示例（支持读写分离）

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "MySQL 8.0 TEST",
  "type": "mysql",
  "version": "8.0.26",
  "options": {
    "db": "test",
    "charset": "utf8mb4",
    "parseTime": true,
    "hosts": [
      {
        "host": "$ENV.MYSQL_TEST_HOST",
        "port": "$ENV.MYSQL_TEST_PORT",
        "user": "$ENV.MYSQL_TEST_USER",
        "pass": "$ENV.MYSQL_TEST_PASS",
        "primary": true
      },
      {
        "host": "$ENV.MYSQL_TEST_HOST_SLAVE",
        "port": "$ENV.MYSQL_TEST_PORT",
        "user": "$ENV.MYSQL_TEST_USER",
        "pass": "$ENV.MYSQL_TEST_PASS"
      }
    ]
  }
}
```

### 读写分离

**环境变量配置读写分离**：

- `YAO_DB_PRIMARY` - 主库连接（写入操作），支持多个连接用 `|` 分隔
- `YAO_DB_SECONDARY` - 从库连接（查询操作），支持多个连接用 `|` 分隔

读写分离规则：

- 写入、删除、更新操作使用主库连接
- 查询操作优先使用从库连接
- 如果没有主库，会使用从库连接
- 如果存在多个连接，会随机选择一个

**在 Flow 中使用指定 Connector**：

```json
{
  "name": "Session",
  "version": "1.0.0",
  "description": "Session TestFlow",
  "nodes": [
    {
      "name": "User",
      "engine": "query-test",
      "query": {
        "select": ["id", "name", "type"],
        "from": "$user",
        "wheres": [{ ":id": "用户ID", "=": "?:$res.ID" }],
        "first": true
      }
    }
  ],
  "output": {
    "User": "{{$res.User}}"
  }
}
```

**在 JSAPI 中使用指定 Connector**：

```js
var query = new Query('default'); // 指定不同的数据库connector
var money_count = query.Get({
  wheres: [{ ':deleted_at': '删除', '=': null }],
  select: [':SUM(total_money) as num'],
  from: 'account'
});
```

### 在 Model 中使用不同 Connector

```json
{
  "name": "test",
  "connector": "mysql",
  "table": {
    "name": "test"
  },
  "columns": [{
    ...
  }]
}
```

执行 `migrate` 命令时，会在指定的 Connector 数据库中创建表结构。

---

## 2. Redis 连接器

底层映射为 `redis.Connector` 结构体，使用 `go-redis/redis/v8` 客户端。

### 支持类型 (`type`)

- `redis`

### 环境变量配置

Redis 主要用于保存会话信息：

```env
YAO_SESSION_STORE="redis"
YAO_SESSION_HOST="redis"
YAO_SESSION_PORT="6379"
YAO_SESSION_PASSWORD=
YAO_SESSION_USERNAME=
```

### 配置详解 (`options`)

基于 `redis/redis.go` 中的 `Options` 结构体分析：

| 字段      | 类型   | 说明                    | 默认值 |
| :-------- | :----- | :---------------------- | :----- |
| `host`    | String | Redis 主机地址          | 必填   |
| `port`    | String | 端口                    | "6379" |
| `user`    | String | 用户名 (Redis 6.0+ ACL) | -      |
| `pass`    | String | 密码                    | -      |
| `db`      | String | 数据库索引              | "0"    |
| `timeout` | Int    | 连接超时（秒）          | 5      |

### Connector 配置

**基本配置**：

```json
{
  "name": "redis",
  "label": "redis",
  "version": "1.0.0",
  "type": "redis",
  "options": {
    "host": "redis",
    "port": "6379",
    "user": "",
    "pass": "",
    "timeout": 10000,
    "db": ""
  }
}
```

**使用环境变量配置**：

```json
{
  "label": "Redis TEST",
  "type": "redis",
  "options": {
    "host": "$ENV.REDIS_TEST_HOST",
    "port": "$ENV.REDIS_TEST_PORT",
    "user": "$ENV.REDIS_TEST_USER",
    "pass": "$ENV.REDIS_TEST_PASS",
    "db": "1"
  }
}
```

---

## 3. MongoDB 连接器

底层映射为 `mongo.Connector` 结构体，使用官方 `go.mongodb.org/mongo-driver/mongo` 驱动进行连接。

### 支持类型 (`type`)

- `mongo`

### 配置详解 (`options`)

基于 `connector/mongo/mongo.go` 中的 `Options` 结构体分析：

| 字段      | 类型   | 说明                                       | 对应 Go 字段 | 必填 |
| :-------- | :----- | :----------------------------------------- | :----------- | :--- |
| `db`      | String | 数据库名称                                 | `DB`         | 是   |
| `hosts`   | Array  | 主机列表，支持集群配置                     | `Hosts`      | 是   |
| `timeout` | Int    | 连接超时时间（秒），默认 5                 | `Timeout`    | 否   |
| `params`  | Map    | 额外的 URI 参数 (如连接池大小、写入关注等) | `Params`     | 否   |

### Hosts 配置

`hosts` 是一个对象数组，用于构建 `mongodb://user:pass@host:port,.../` 格式的连接串。

| 字段   | 类型   | 说明     | 默认值  | 必填   |
| :----- | :----- | :------- | :------ | :----- |
| `host` | String | 主机地址 | -       | **是** |
| `port` | String | 端口     | "27017" | 否     |
| `user` | String | 用户名   | -       | **是** |
| `pass` | String | 密码     | -       | **是** |

> **注意**: 代码逻辑 `getDSN` 中强制校验了 `User` 和 `Pass` 字段不能为空。如果你的 MongoDB 是无密码访问的（通常不建议），可能需要修改底层源码或填写占位符。

### Params 配置

`params` 字段是一个键值对映射，它会被直接转换为连接字符串的 Query 参数（例如 `?maxPoolSize=20&w=majority`）。这是配置连接池大小、读写偏好（ReadPreference）等高级选项的地方。

### 基本配置

```json
{
  "name": "mongo",
  "label": "mongo",
  "version": "1.0.0",
  "type": "mongo",
  "options": {
    "hosts": [
      {
        "host": "mongo",
        "port": "27017",
        "user": "",
        "pass": ""
      }
    ],
    "params": {},
    "db": "",
    "timeout": 10000
  }
}
```

### Collection 配置示例

`connectors/Products.conn.yao`：

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "Mongo TEST",
  "type": "mongo",
  "options": {
    "db": "test",
    "hosts": [
      {
        "host": "$ENV.MONGO_TEST_HOST",
        "port": "$ENV.MONGO_TEST_PORT",
        "user": "$ENV.MONGO_TEST_USER",
        "pass": "$ENV.MONGO_TEST_PASS"
      }
    ],
    "params": { "maxPoolSize": 20, "w": "majority" }
  }
}
```

### 环境变量示例

```env
MONGO_TEST_HOST=127.0.0.1
MONGO_TEST_PORT=27017
MONGO_TEST_USER="admin"
MONGO_TEST_PASS="admin"
```

### 注意事项

1. **数据库名称**：需在 `options.db` 中配置，与 MongoDB 中实际的数据库名一致
2. **Collection 名称**：配置文件的 ID 即为 Collection 名称（如 `Products.conn.yao` 对应 `Products` collection）
3. **用户名密码**：必须设置，不能使用空用户名或空密码
4. **数据结构**：MongoDB 连接器用于 key-value 存储，Yao 会自动为 Collection 创建 `key` 的唯一索引

数据结构示例：

```json
{
  "key": "",
  "value": ""
}
```

**技术总结**:
MongoDB 连接器的实现非常直接，它将配置选项组装成标准的 Connection String URI，然后传递给驱动。这种设计的好处是你可以在 `params` 中使用任何官方驱动支持的 URI 参数，具有很高的灵活性。

---

---

## 4. OpenAI 连接器

底层映射为 `openai.Connector`。这类连接器会被特殊处理，自动加入到 `AIConnectors` 列表中。

### 支持类型 (`type`)

- `openai`

### 配置详解 (`options`)

基于 `openai/openai.go` 中的 `Options` 结构体分析：

| 字段    | 类型   | 说明                                              |
| :------ | :----- | :------------------------------------------------ |
| `model` | String | 模型名称 (如 `gpt-4o`, `gpt-3.5-turbo`)           |
| `key`   | String | API Key                                           |
| `host`  | String | API 端点 (默认为 `https://api.openai.com`)        |
| `proxy` | String | (已废弃) 代理地址，建议使用 `host` 或环境变量配置 |
| `azure` | String | 是否为 Azure OpenAI ("true" / "false")            |

> **注意**: 代理设置建议通过环境变量 `HTTPS_PROXY` 或 `HTTP_PROXY` 在系统层面配置，Go 的 `http.GetTransport` 会自动处理。

### 基本配置

```json
{
  "label": "GPT-4",
  "type": "openai",
  "options": {
    "model": "gpt-4",
    "key": "$ENV.OPENAI_API_KEY",
    "host": "https://api.openai.com"
  }
}
```

### 示例配置

**阿里云 Dashscope 兼容模式**：

```json
{
  "label": "Model v3",
  "type": "openai",
  "options": {
    "model": "deepseek-r1-distill-llama-70b",
    "key": "$ENV.BAILIAN_KEY",
    "host": "https://dashscope.aliyuncs.com/compatible-mode/v1"
  }
}
```

**DeepSeek 连接**：

```json
{
  "label": "Model v3",
  "type": "openai",
  "options": {
    "model": "deepseek-reasoner",
    "key": "$ENV.DEEPSEEK_KEY",
    "host": "https://api.deepseek.com"
  }
}
```

---

---

## 通用配置规范

### 环境变量引用

所有连接器配置文件都支持使用环境变量，语法为 `$ENV.<变量名>`。这种方式特别适用于配置敏感信息（如密码、API 密钥等）。

```json
{
  "options": {
    "host": "$ENV.DB_HOST",
    "user": "$ENV.DB_USER",
    "pass": "$ENV.DB_PASS"
  }
}
```

### 配置文件命名规则

- 格式：`<name>.conn.json` 或 `<name>.conn.yao` 或 `<name>.jsonc`
- 文件名中的 `<name>` 即为连接器 ID，在代码中通过该 ID 引用

### 配置文件通用字段

```json
{
  "version": "1.0.0",      // 连接器版本
  "label": "连接器说明",    // 连接器描述
  "type": "连接器类型",     // 如：sqlite3, mysql, redis, mongo, openai
  "options": {             // 连接器特定配置
    ...
  }
}
```

---

## 重要说明

### 读写分离 vs 多 Connector

- **读写分离**：针对同一类型数据库，通过 `primary` 和 `secondary` 配置主从库，自动根据操作类型选择连接
- **多 Connector**：连接不同类型或不同结构的数据库，需在代码中明确指定使用哪个 Connector

### 默认 Connector

使用环境变量 `YAO_DB_DRIVER` 和 `YAO_DB_PRIMARY` 配置的数据库默认命名为 `default`，是应用程序的默认连接。

### 安全建议

- 所有敏感信息（密码、API 密钥等）都应使用环境变量配置
- 避免在配置文件中直接硬编码敏感信息
- 环境变量文件 `.env` 应添加到 `.gitignore` 中

### Migrate 操作

- 数据库 `migrate` 操作默认只针对主数据库
- 如需同步到从库，需要在 `model` 定义中配置对应的 `connector`
