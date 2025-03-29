# Yao 命令

Yao 命令用于启动服务、运行处理器、查看配置信息等操作。

## 手册

```bash
yao <command> [options] [args...]
```

| 命令      | 说明                |
| --------- | ------------------- |
| version   | 显示当前版本号      |
| inspect   | 显示应用配置信息    |
| get       | 下载应用代码        |
| migrate   | 更新模型数据表结构  |
| run       | 运行处理器          |
| start     | 启动服务            |
| socket    | 建立 Socket 连接    |
| websocket | 建立 WebSocket 连接 |
| dump      | 导出应用数据        |
| restore   | 导入应用数据        |
| studio    | Studio CLI          |

全局选项:

| 参数   | 简写 | 说明             |
| ------ | ---- | ---------------- |
| --app  | -a   | 指定应用路径     |
| --env  | -e   | 指定环境变量文件 |
| --help | -h   | 命令帮助         |

### yao version

显示 Yao 版本号

```bash
yao version
```

### yao inspect

显示应用配置信息

```bash
cd /data/app
yao inspect
```

### yao get

**注意: 当前应用目录必须为空目录**

```bash
cd /data/app
yao get yaoapp/demo-app
```

### yao migrate

更新数据库结构，创建应用引擎和 models 文件夹下定义的数据表。默认更新 models 下所数据模型关联的数据表。

注意：`migrate --reset` 命令会清空当前数据表， 不推荐在 `production`
模式下使用。

选项:

| 参数    | 简写 | 说明                                   |
| ------- | ---- | -------------------------------------- |
| --name  | -n   | 指定模型名称                           |
| --reset |      | 强制删除数据表后重建                   |
| --force |      | 在 production 模式下, 强制使用 migrate |

```bash
cd /data/app
yao migrate
```

```bash
cd /data/app
yao migrate -n pet
```

### yao run

运行处理器, 第一个参数为处理器名称，其余参数为处理器参数表。

如果需要输入复杂数据结构可以使用 `::` 前缀，声明参数为 JSON 格式， 例如: `'::{"foo":"bar"}'`

```bash
cd /data/app
yao run scripts.day.NextDay 2020-01-02
```

```bash
cd /data/app
yao run xiang.flow.Return hello '::{"foo":"bar"}'
```

### yao start

启动服务

选项:

| 参数                | 简写 | 说明             |
| ------------------- | ---- | ---------------- |
| --debug             |      | 使用开发模式启动 |
| -- disable-watching |      | 禁止监听文件修改 |

```bash
cd /data/app
yao start
```

```bash
cd /data/app
yao start --debug
```

管理后台默认用户名: `xiang@iqka.com`， 密码: `A123456p+`

如果网络结构较为复杂，命令行提示的 IP 地址无法访问，可根据实际网络结构，更换为相应 IP 地址。

## 环境变量

| 变量                 | 说明                                                    | 默认值       | 示例                                                                         |
| -------------------- | ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| YAO_LANG             | 命令行语言 en-US 英语 zh-CN 简体中文                    | en-US        | zh-CN                                                                        |
| YAO_ENV              | 运行模式 development 开发环境 <br/> production 生产环境 | production   | production                                                                   |
| YAO_ROOT             | 应用目录                                                | 当前目录 .   | /data/app                                                                    |
| YAO_HOST             | WEB 服务 HOST                                           | 0.0.0.0      | 127.0.0.1                                                                    |
| YAO_PORT             | WEB 服务端口                                            | 5099         | 5099                                                                         |
| YAO_LOG              | 应用日志文件位置                                        | 系统标准输出 | /data/app/logs/application.log                                               |
| YAO_LOG_MODE         | 日志格式 TEXT \| JSON                                   | TEXT         | JSON                                                                         |
| YAO_JWT_SECRET       | JWT 密钥                                                | 默认为空     | bLp@bi!oqo-2U+hoTRUG                                                         |
| YAO_DB_DRIVER        | 数据库驱动 mysql \| sqlite3                             | sqlite3      | mysql                                                                        |
| YAO_DB_PRIMARY       | 主库连接                                                | ./db/yao.db  | root:123456@tcp(db-server:3306)/yao?charset=utf8mb4&parseTime=True&loc=Local |
| YAO_DB_PRIMARY       | 从库连接                                                | 空           | root:123456@tcp(db-server:3306)/yao?charset=utf8mb4&parseTime=True&loc=Local |
| YAO_DB_AESKEY        | 加密字段密钥 (MySQL Only)                               | 空           | ZLX=T&f6refeCh-ro\*r@                                                        |
| YAO_SESSION_STORE    | 会话数据存储方式 memory \| redis                        | memory       | redis                                                                        |
| YAO_SESSION_HOST     | Redis 服务器 HOST (会话存储方式为 redis 有效)           | 127.0.0.1    | 127.0.0.1                                                                    |
| YAO_SESSION_PORT     | Redis 服务器端口 (会话存储方式为 redis 有效)            | 6379         | 6379                                                                         |
| YAO_SESSION_PASSWORD | Redis 密码 (会话存储方式为 redis 有效)                  | 空           | 123456                                                                       |
| YAO_STUDIO_PORT      | YAO STUDIO 服务端口(仅开发模式下有效)                   | 5077         | 5077                                                                         |
| YAO_STUDIO_SECRET    | YAO STUDIO 密钥                                         | 空, 自动生成 | 8A9932B141E16AE1FB58409C493E93471EA24D43BF31130FE3E5A600598D9FED             |

Tips: 可以为应用单独设置环境变量。在应用根目录下添加 `.env`，服务启动时将优先使用 .env 声明的环境变量。
