# YAO 环境变量配置文档

本文档基于 `config/types.go` 源码，详细说明了 YAO 应用引擎的所有环境变量配置项及其默认值。

## 环境变量总览表

| 分类                          | 变量名                        | 默认值           | 类型     | 说明                     |
| ----------------------------- | ----------------------------- | ---------------- | -------- | ------------------------ |
| [基础配置](#基础配置)         | `YAO_ENV`                     | `production`     | string   | 应用启动模式             |
|                               | `YAO_APP_SOURCE`              | 与 YAO_ROOT 相同 | string   | 应用源码根目录           |
|                               | `YAO_ROOT`                    | `.`              | string   | 应用根目录               |
|                               | `YAO_LANG`                    | `en-us`          | string   | 默认语言设置             |
|                               | `YAO_TIMEZONE`                | 无               | string   | 默认时区                 |
|                               | `YAO_DATA_ROOT`               | 空字符串         | string   | 数据根目录               |
|                               | `YAO_EXTENSION_ROOT`          | 空               | string   | 扩展根目录               |
| [服务器配置](#服务器配置)     | `YAO_HOST`                    | `0.0.0.0`        | string   | 服务器监听地址           |
|                               | `YAO_PORT`                    | `5099`           | int      | 服务器监听端口           |
|                               | `YAO_CERT`                    | 无               | string   | HTTPS 证书路径           |
|                               | `YAO_KEY`                     | 无               | string   | HTTPS 证书私钥路径       |
| [日志配置](#日志配置)         | `YAO_LOG`                     | 无               | string   | 日志文件路径             |
|                               | `YAO_LOG_MODE`                | `TEXT`           | string   | 日志输出模式             |
|                               | `YAO_LOG_LEVEL`               | 无               | string   | 日志级别（支持自动设置） |
|                               | `YAO_LOG_MAX_SIZE`            | `100`            | int      | 日志文件最大大小(MB)     |
|                               | `YAO_LOG_MAX_AGE`             | `7`              | int      | 日志文件保留天数         |
|                               | `YAO_LOG_MAX_BACKUPS`         | `3`              | int      | 日志备份数量             |
|                               | `YAO_LOG_LOCAL_TIME`          | `true`           | bool     | 使用本地时间             |
| [安全配置](#安全配置)         | `YAO_JWT_SECRET`              | 无               | string   | JWT 密钥                 |
|                               | `YAO_ALLOW_FROM`              | 无               | []string | 允许的域名列表           |
| [数据库配置](#数据库配置)     | `YAO_DB_DRIVER`               | `sqlite3`        | string   | 数据库驱动类型           |
|                               | `YAO_DB_PRIMARY`              | `./db/yao.db`    | []string | 主库连接字符串           |
|                               | `YAO_DB_SECONDARY`            | 无               | []string | 从库连接字符串           |
|                               | `YAO_DB_AESKEY`               | 无               | string   | 数据库加密密钥           |
| [会话配置](#会话配置)         | `YAO_SESSION_STORE`           | `file`           | string   | 会话存储方式             |
|                               | `YAO_SESSION_FILE`            | 无               | string   | 会话文件路径             |
|                               | `YAO_SESSION_HOST`            | `127.0.0.1`      | string   | Redis 服务器地址         |
|                               | `YAO_SESSION_PORT`            | `6379`           | string   | Redis 服务器端口         |
|                               | `YAO_SESSION_PASSWORD`        | 无               | string   | Redis 密码               |
|                               | `YAO_SESSION_USERNAME`        | 无               | string   | Redis 用户名             |
|                               | `YAO_SESSION_DB`              | `1`              | string   | Redis 数据库编号         |
|                               | `YAO_SESSION_ISCLI`           | `false`          | bool     | 命令行模式               |
| [Studio配置](#studio-配置)    | `YAO_STUDIO_PORT`             | `5077`           | int      | Studio 服务端口          |
|                               | `YAO_STUDIO_SECRET`           | 无               | string   | Studio 密钥              |
| [运行时配置](#运行时配置)     | `YAO_RUNTIME_MODE`            | `standard`       | string   | 运行时模式               |
|                               | `YAO_RUNTIME_MIN`             | `10`             | uint     | V8 VM 最小数量           |
|                               | `YAO_RUNTIME_MAX`             | `100`            | uint     | V8 VM 最大数量           |
|                               | `YAO_RUNTIME_TIMEOUT`         | `200`            | int      | 脚本默认超时时间(ms)     |
|                               | `YAO_RUNTIME_CONTEXT_TIMEOUT` | `200`            | int      | 上下文默认超时时间(ms)   |
|                               | `YAO_RUNTIME_HEAP_LIMIT`      | `1518338048`     | uint64   | 堆内存大小限制(字节)     |
|                               | `YAO_RUNTIME_HEAP_RELEASE`    | `52428800`       | uint64   | 堆内存释放阈值(字节)     |
|                               | `YAO_RUNTIME_HEAP_AVAILABLE`  | `524288000`      | uint64   | 可用堆内存阈值(字节)     |
|                               | `YAO_RUNTIME_PRECOMPILE`      | `false`          | bool     | 预编译脚本               |
|                               | `YAO_RUNTIME_IMPORT`          | `true`           | bool     | 启用 import 语句         |
| [链路追踪配置](#链路追踪配置) | `YAO_TRACE_DRIVER`            | 无               | string   | 追踪驱动                 |
|                               | `YAO_TRACE_PATH`              | 无               | string   | 本地追踪文件路径         |
|                               | `YAO_TRACE_STORE`             | 无               | string   | 追踪存储 ID              |
|                               | `YAO_TRACE_PREFIX`            | 无               | string   | 追踪存储键前缀           |

## 基础配置

| 变量名               | 默认值           | 类型   | 可选值                        | 说明                                        |
| -------------------- | ---------------- | ------ | ----------------------------- | ------------------------------------------- |
| `YAO_ENV`            | `production`     | string | `production` \| `development` | 应用启动模式，影响日志级别、错误处理等行为  |
| `YAO_ROOT`           | `.`              | string | -                             | 应用根目录，其他相对路径都基于此路径        |
| `YAO_APP_SOURCE`     | 与 YAO_ROOT 相同 | string | -                             | 应用源码根目录，指定应用源代码的根路径      |
| `YAO_LANG`           | `en-us`          | string | -                             | 默认语言设置，用于国际化                    |
| `YAO_TIMEZONE`       | 无               | string | -                             | 默认时区，影响时间处理                      |
| `YAO_DATA_ROOT`      | 空字符串         | string | -                             | 数据根目录，存放应用数据文件的根目录        |
| `YAO_EXTENSION_ROOT` | 空               | string | -                             | 扩展根目录，插件和 WebAssembly 文件的根目录 |

一般情况下`YAO_ROOT` 和 `YAO_APP_SOURCE` 的值是相同的，即应用源码根目录和应用根目录是同一个目录,如果没有明显的设置`YAO_ROOT` 会是yao程序运行的当前目录，如果设置了`YAO_ROOT` 则会以`YAO_ROOT` 为根目录。

另外在开发测试过程中还可以设置`YAO_TEST_APPLICATION`，来指定测试应用的目录，这样就可以在测试的时候使用不同的应用目录了。

## 服务器配置

| 变量名     | 默认值    | 类型   | 可选值 | 说明                                                |
| ---------- | --------- | ------ | ------ | --------------------------------------------------- |
| `YAO_HOST` | `0.0.0.0` | string | -      | 服务器监听地址，HTTP 服务器绑定的 IP 地址           |
| `YAO_PORT` | `5099`    | int    | -      | 服务器监听端口，HTTP 服务器监听的端口号             |
| `YAO_CERT` | 无        | string | -      | HTTPS 证书路径，启用 HTTPS 时所需的证书文件路径     |
| `YAO_KEY`  | 无        | string | -      | HTTPS 证书私钥路径，启用 HTTPS 时所需的私钥文件路径 |

## 日志配置

### 日志配置参数

| 变量名                | 默认值            | 类型   | 可选值           | 说明                                                           |
| --------------------- | ----------------- | ------ | ---------------- | -------------------------------------------------------------- |
| `YAO_LOG`             | `application.log` | string | -                | 日志文件路径，指定日志文件的存储路径                           |
| `YAO_LOG_MODE`        | `TEXT`            | string | `TEXT` \| `JSON` | 日志输出模式，控制日志的输出格式                               |
| `YAO_LOG_LEVEL`       | 无                | string | 见下表           | 日志级别，控制日志输出的最低级别。未设置时根据环境自动设置     |
| `YAO_LOG_MAX_SIZE`    | `100`             | int    | -                | 日志文件最大大小(MB)，单个日志文件的最大大小，超过后会进行轮转 |
| `YAO_LOG_MAX_AGE`     | `7`               | int    | -                | 日志文件保留天数，日志文件保留的最大天数                       |
| `YAO_LOG_MAX_BACKUPS` | `3`               | int    | -                | 日志备份数量，保留的日志备份文件数量                           |
| `YAO_LOG_LOCAL_TIME`  | `true`            | bool   | -                | 使用本地时间，日志时间戳是否使用本地时间                       |

### 日志级别详情

| 级别    | 说明                               | 使用场景           |
| ------- | ---------------------------------- | ------------------ |
| `trace` | 最详细的日志级别，包含所有调试信息 | 开发调试、问题排查 |
| `debug` | 调试信息，比 trace 级别信息稍少    | 一般调试、开发环境 |
| `info`  | 一般信息，记录应用正常运行状态     | 生产环境基础信息   |
| `warn`  | 警告信息，可能存在问题但不影响运行 | 潜在问题提醒       |
| `error` | 错误信息，发生错误但应用仍可运行   | 错误记录、异常监控 |
| `panic` | 严重错误，会导致 panic             | 严重错误处理       |
| `fatal` | 致命错误，会导致程序退出           | 关键错误处理       |

### 日志级别自动设置规则

当 `YAO_LOG_LEVEL` 未设置时，系统会根据应用运行模式自动设置日志级别：

| 环境模式      | 自动设置的日志级别 | 说明                                           |
| ------------- | ------------------ | ---------------------------------------------- |
| `production`  | `error`            | 生产环境只记录错误及以上级别的日志，减少日志量 |
| `development` | `trace`            | 开发环境记录所有级别的日志，便于调试           |
| 其他模式      | `info`             | 其他模式使用默认的 info 级别                   |

## 安全配置

| 变量名           | 默认值 | 类型     | 可选值 | 说明                                                 |
| ---------------- | ------ | -------- | ------ | ---------------------------------------------------- | ------ |
| `YAO_JWT_SECRET` | 无     | string   | -      | JWT 密钥，用于 JWT 令牌签名和验证的密钥              |
| `YAO_ALLOW_FROM` | 无     | []string | -      | 允许的域名列表，允许访问应用的域名列表，多个域名用 ` | ` 分隔 |

## 数据库配置

| 变量名             | 默认值        | 类型     | 可选值                             | 说明                                             |
| ------------------ | ------------- | -------- | ---------------------------------- | ------------------------------------------------ | ------ |
| `YAO_DB_DRIVER`    | `sqlite3`     | string   | `sqlite3` \| `mysql` \| `postgres` | 数据库驱动类型，使用的数据库类型                 |
| `YAO_DB_PRIMARY`   | `./db/yao.db` | []string | -                                  | 主库连接字符串，主数据库的连接信息，多个连接用 ` | ` 分隔 |
| `YAO_DB_SECONDARY` | 无            | []string | -                                  | 从库连接字符串，从数据库的连接信息，用于读写分离 |
| `YAO_DB_AESKEY`    | 无            | string   | -                                  | 数据库加密密钥，用于数据库字段加密的 AES 密钥    |

## 会话配置

| 变量名                 | 默认值      | 类型   | 可选值            | 说明                                                           |
| ---------------------- | ----------- | ------ | ----------------- | -------------------------------------------------------------- |
| `YAO_SESSION_STORE`    | `file`      | string | `file` \| `redis` | 会话存储方式，会话数据的存储方式                               |
| `YAO_SESSION_FILE`     | 无          | string | -                 | 会话文件路径，当使用文件存储时，会话文件的存储路径             |
| `YAO_SESSION_HOST`     | `127.0.0.1` | string | -                 | Redis 服务器地址，当使用 Redis 存储时，Redis 服务器的 IP 地址  |
| `YAO_SESSION_PORT`     | `6379`      | string | -                 | Redis 服务器端口，当使用 Redis 存储时，Redis 服务器的端口号    |
| `YAO_SESSION_PASSWORD` | 无          | string | -                 | Redis 密码，当使用 Redis 存储时，Redis 服务器的密码            |
| `YAO_SESSION_USERNAME` | 无          | string | -                 | Redis 用户名，当使用 Redis 存储时，Redis 服务器的用户名        |
| `YAO_SESSION_DB`       | `1`         | string | -                 | Redis 数据库编号，当使用 Redis 存储时，使用的 Redis 数据库编号 |
| `YAO_SESSION_ISCLI`    | `false`     | bool   | -                 | 命令行模式，是否在命令行模式下启动                             |

## Studio 配置

| 变量名              | 默认值 | 类型   | 可选值 | 说明                                                   |
| ------------------- | ------ | ------ | ------ | ------------------------------------------------------ |
| `YAO_STUDIO_PORT`   | `5077` | int    | -      | Studio 服务端口，YAO Studio 开发工具服务的端口号       |
| `YAO_STUDIO_SECRET` | 无     | string | -      | Studio 密钥，YAO Studio 连接密钥，如果不设置会自动生成 |

## 运行时配置

| 变量名                        | 默认值       | 类型   | 可选值                      | 说明                                                                                            |
| ----------------------------- | ------------ | ------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `YAO_RUNTIME_MODE`            | `standard`   | string | `standard` \| `performance` | 运行时模式，`standard`: 标准模式，内存占用较少；`performance`: 性能模式，需要更多内存但运行更快 |
| `YAO_RUNTIME_MIN`             | `10`         | uint   | 1-100                       | V8 VM 最小数量，运行时启动时的 V8 虚拟机最小数量                                                |
| `YAO_RUNTIME_MAX`             | `100`        | uint   | -                           | V8 VM 最大数量，运行时 V8 虚拟机的最大数量                                                      |
| `YAO_RUNTIME_TIMEOUT`         | `200`        | int    | -                           | 脚本默认超时时间(ms)，脚本执行的默认超时时间                                                    |
| `YAO_RUNTIME_CONTEXT_TIMEOUT` | `200`        | int    | -                           | 上下文默认超时时间(ms)，上下文操作的默认超时时间                                                |
| `YAO_RUNTIME_HEAP_LIMIT`      | `1518338048` | uint64 | -                           | 堆内存大小限制(字节)，V8 隔离堆内存大小限制，应小于 1.5GB                                       |
| `YAO_RUNTIME_HEAP_RELEASE`    | `52428800`   | uint64 | -                           | 堆内存释放阈值(字节)，达到此值时重新创建隔离                                                    |
| `YAO_RUNTIME_HEAP_AVAILABLE`  | `524288000`  | uint64 | -                           | 可用堆内存阈值(字节)，可用空间小于此值时重新创建隔离                                            |
| `YAO_RUNTIME_PRECOMPILE`      | `false`      | bool   | -                           | 预编译脚本，如果为 true，在创建 VM 时预编译脚本，增加加载时间但运行更快                         |
| `YAO_RUNTIME_IMPORT`          | `true`       | bool   | -                           | 启用 import 语句，如果为 false，禁用 import 语句                                                |

## 链路追踪配置

| 变量名             | 默认值 | 类型   | 可选值             | 说明                                                                         |
| ------------------ | ------ | ------ | ------------------ | ---------------------------------------------------------------------------- |
| `YAO_TRACE_DRIVER` | 无     | string | `local` \| `store` | 追踪驱动，`local`: 本地文件存储（开发环境）；`store`: 数据库存储（生产环境） |
| `YAO_TRACE_PATH`   | 无     | string | -                  | 本地追踪文件路径，当驱动为 `local` 时，追踪文件的存储路径                    |
| `YAO_TRACE_STORE`  | 无     | string | -                  | 追踪存储 ID，当驱动为 `store` 时，使用的存储 ID                              |
| `YAO_TRACE_PREFIX` | 无     | string | -                  | 追踪存储键前缀，追踪数据存储键的前缀                                         |

## 配置示例

### 开发环境配置

```bash
export YAO_ENV=development
export YAO_LOG=application.log
export YAO_LOG_LEVEL=DEBUG
export YAO_HOST=127.0.0.1
export YAO_PORT=5099
export YAO_DB_DRIVER=sqlite3
export YAO_DB_PRIMARY=./dev.db
export YAO_SESSION_STORE=file
```

### 生产环境配置

```bash
export YAO_ENV=production
export YAO_LOG_LEVEL=INFO
export YAO_HOST=0.0.0.0
export YAO_PORT=5099
export YAO_DB_DRIVER=mysql
export YAO_DB_PRIMARY=user:password@tcp(localhost:3306)/dbname
export YAO_SESSION_STORE=redis
export YAO_SESSION_HOST=redis.example.com
export YAO_SESSION_PASSWORD=your_redis_password
export YAO_JWT_SECRET=your_jwt_secret_key
export YAO_TRACE_DRIVER=store
```

## 注意事项

1. **安全性**: 生产环境中必须设置 `YAO_JWT_SECRET`，不要使用默认值
2. **性能**: 根据服务器配置合理调整 `YAO_RUNTIME_*` 相关参数
3. **日志**: 生产环境建议设置合适的日志轮转策略，避免日志文件过大
4. **数据库**: 使用 MySQL 或 PostgreSQL 时，确保连接字符串格式正确
5. **会话**: 生产环境推荐使用 Redis 存储会话，提供更好的性能和可靠性

---

_本文档基于源码 `config/types.go` 生成，配置项与代码实现保持同步。_
