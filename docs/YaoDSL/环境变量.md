# 环境变量

## Yao 命令环境变量

| 变量     | 说明                                 | 默认值 | 示例  |
| -------- | ------------------------------------ | ------ | ----- |
| YAO_LANG | 命令行语言 en-US 英语 zh-CN 简体中文 | en-US  | zh-CN |

## 应用环境变量

| 变量           | 说明                                                    | 默认值       | 示例                                                                         |
| -------------- | ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| YAO_ENV        | 运行模式 development 开发环境 <br/> production 生产环境 | production   | production                                                                   |
| YAO_ROOT       | 应用目录                                                | 当前目录 .   | /data/app                                                                    |
| YAO_HOST       | WEB 服务 HOST                                           | 0.0.0.0      | 127.0.0.1                                                                    |
| YAO_PORT       | WEB 服务端口                                            | 5099         | 5099                                                                         |
| YAO_LOG        | 应用日志文件位置                                        | 系统标准输出 | /data/app/logs/application.log                                               |
| YAO_LOG_MODE   | 日志格式 TEXT \| JSON                                   | TEXT         | JSON                                                                         |
| YAO_JWT_SECRET | JWT 密钥                                                | 默认为空     | bLp@bi!oqo-2U+hoTRUG                                                         |
| YAO_DB_DRIVER  | 数据库驱动 mysql \| sqlite3                             | sqlite3      | mysql                                                                        |
| YAO_DB_PRIMARY | 主库连接                                                | ./db/yao.db  | root:123456@tcp(db-server:3306)/yao?charset=utf8mb4&parseTime=True&loc=Local |
| YAO_DB_PRIMARY | 从库连接                                                | 空           | root:123456@tcp(db-server:3306)/yao?charset=utf8mb4&parseTime=True&loc=Local |
| YAO_DB_AESKEY  | 加密字段密钥 (MySQL Only)                               | 空           | ZLX=T&f6refeCh-ro\*r@                                                        |
