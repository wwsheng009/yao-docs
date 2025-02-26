# redis连接器

## 在environment中配置redis连接信息

redis主要是用于保存会话信息。

```sh
YAO_SESSION_STORE="redis"
YAO_SESSION_HOST="redis"
YAO_SESSION_PORT="6379"
YAO_SESSION_PASSWORD=
YAO_SESSION_USERNAME=
```

## 在connectors中配置redis连接信息

配置项如下：

```json
{
  "name": "redis",
  "label": "redis",
  "version": "1.0.0",
  "type": "redis",
  "options": {
    "host": "redis",
    "port": 6379, //默认
    "user": "",
    "pass": "",
    "timeout": 10000, //默认5
    "db": "" //默认0
  }
}
```

配置项支持引用环境变量配置：

```json
{
  "name": "redis",
  "label": "redis",
  "version": "1.0.0",
  "type": "redis",
  "options": {
    "host": "$ENV.YAO_SESSION_HOST",
    "port": "$ENV.YAO_SESSION_PORT",
    "user": "$ENV.YAO_SESSION_USERNAME",
    "pass": "$ENV.YAO_SESSION_PASSWORD",
    "timeout": "$ENV.YAO_SESSION_TIMEOUT",
    "db": "$ENV.YAO_SESSION_DB"
  }
}
```
