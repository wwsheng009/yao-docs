---
name: store
description: Guide to Store configuration in Yao, abstracting Key-Value storage (Redis, MongoDB, LRU, etc.) with unified interfaces.
license: Complete terms in LICENSE.txt
---

# Stores 配置与使用指南

## 1\. 概述

`Store` 是 Gou 框架中用于键值对（Key-Value）存储的抽象层。它提供了一套统一的接口（Get, Set, Del 等），允许开发者通过配置切换底层的存储引擎（如 Redis, MongoDB, LRU 内存缓存等），而无需修改业务代码。

配置文件通常存放于项目的 `stores/` 目录下，文件扩展名为 `.yao`。

## 2\. 目录结构

在 `gou-dev-app` 中，存储相关的目录结构如下：

```bash
├── connectors/          # 连接器配置（Redis, Mongo 等连接信息在此配置）
│   ├── redis.conn.yao
│   └── mongo.conn.yao
└── stores/              # 具体 Store 实例定义
    ├── cache.lru.yao    # 内存 LRU 缓存
    ├── share.redis.yao  # 基于 Redis 的存储
    ├── data.mongo.yao   # 基于 MongoDB 的存储
    └── local.badger.yao # 基于 BadgerDB 的本地文件存储
```

## 3\. 配置详情

根据源码 `gou/store/types.go` 及 `gou-dev-app` 的实例，以下是各类型的配置说明。

### 3.1 LRU (Local Memory Cache)

LRU (Least Recently Used) 是一种基于内存的缓存策略。适用于单机高频访问且不需要持久化的数据。

**配置文件:** `stores/cache.lru.yao`

```json
{
  "name": "cache",
  "type": "lru",
  "option": {
    "size": 102400
  }
}
```

- **name**: 存储实例名称，调用时使用（如 `stores.cache`）。
- **type**: 固定为 `lru`。
- **option.size**: 缓存容量大小（字节或条目数，取决于底层实现，通常是条目上限）。

### 3.2 Redis Store

使用 Redis 作为后端存储。需要引用 `connectors` 中定义的连接器。

**配置文件:** `stores/share.redis.yao`

```json
{
  "name": "share",
  "type": "redis",
  "connector": "redis"
}
```

- **type**: 固定为 `redis`。
- **connector**: 指定使用的连接器名称（对应 `connectors/redis.conn.yao`）。

### 3.3 MongoDB Store

使用 MongoDB 存储 KV 数据。通常用于需要持久化但非关系型的数据存储。

**配置文件:** `stores/data.mongo.yao`

```json
{
  "name": "data",
  "type": "mongo",
  "connector": "mongo"
}
```

- **type**: 固定为 `mongo`。
- **connector**: 指定使用的连接器名称（对应 `connectors/mongo.conn.yao`）。

### 3.4 BadgerDB (Local KV)

Badger 是一个高性能的嵌入式 KV 数据库，数据存储在本地磁盘文件系统上。

**配置文件:** `stores/local.badger.yao`

```json
{
  "name": "local",
  "type": "badger",
  "option": {
    "directory": "/tmp/badger"
  }
}
```

- **type**: 固定为 `badger` (注意：需确认 `gou` 源码中是否已完全注册该驱动，部分版本可能作为扩展插件存在)。
- **option**: 可配置数据存储路径等参数。

## 4\. 在代码中使用

Gou 框架会自动加载 `stores/` 下的配置。你可以在 **Process (处理器)**、**Script (脚本)** 或 **API** 中使用。

### 4.1 支持的操作方法

根据 `gou/store/types.go` 中的接口定义，所有 Store 支持以下核心方法：

| 方法         | 说明                       | 参数示例                          |
| :----------- | :------------------------- | :-------------------------------- |
| **Set**      | 设置键值，可选过期时间(秒) | `key`, `value`, `ttl` (可选)      |
| **Get**      | 获取键值                   | `key`                             |
| **Has**      | 判断键是否存在             | `key`                             |
| **Del**      | 删除键                     | `key`                             |
| **GetMulti** | 批量获取                   | `[key1, key2]`                    |
| **SetMulti** | 批量设置                   | `{key1: val1, key2: val2}`, `ttl` |
| **DelMulti** | 批量删除                   | `[key1, key2]`                    |
| **Clear**    | 清空所有数据               | -                                 |

### 4.2 调用示例 (Process / Yao 处理器)

在 DSL 文件（如 Flow, API）中调用：

```yaml
# 语法: stores.<store_name>.<method>

- name: Set Cache
  process: stores.cache.Set
  args: ['user_101', { 'name': 'Gou Dev', 'role': 'admin' }, 3600]

- name: Get Data from Redis
  process: stores.share.Get
  args: ['session_id_xyz']
```

### 4.3 调用示例 (JavaScript 脚本)

在 `scripts/` 目录下的 JS 文件中调用：

```javascript
/**
 * 使用 Store 存储逻辑
 */
function TestStore() {
  // 实例化引用
  var cache = new Store('cache');
  var redis = new Store('share');

  // 设置数据 (Key, Value, TTL)
  cache.Set('token', '123456', 60);

  // 获取数据
  var token = cache.Get('token');

  // 跨存储引擎操作
  if (token) {
    redis.Set('login_log', { token: token, time: new Date() }, 0);
  }

  return token;
}
```

### 4.4 调用示例 (Golang 原生)

如果你在编写 Go 插件或扩展 Gou 源码：

```go
import "github.com/yaoapp/gou/store"

func MyFunction() {
    // 获取 Store 实例
    lru := store.Select("cache")

    // 设置
    lru.Set("key", "value", 0)

    // 获取
    val, ok := lru.Get("key")
}
```

## 5\. 调试与排错

如果遇到 `Store not found` 或连接错误：

1.  **检查文件名**: 确保配置文件位于 `stores/` 目录且后缀为 `.yao`。
2.  **检查 Connector**: 如果是 Redis/Mongo，确保 `connectors/` 下对应的连接器配置正确且服务可达。
3.  **检查日志**: 查看启动日志，确认 Store 加载成功。

---

### 总结

这份文档结合了 `gou` 框架的底层接口定义与 `gou-dev-app` 的实际配置案例，可直接用于项目文档或新人入职指南。

**是否需要我深入分析 `gou/store` 源码中特定驱动（如 Redis 或 LRU）的具体实现逻辑？**
