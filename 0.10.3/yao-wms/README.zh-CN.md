# YAO WMS

![Image](docs/images/intro.jpg)

[English](README.md)

仓库管理系统

参考文档: [https://yaoapps.com/doc](https://yaoapps.com/doc/%E4%BB%8B%E7%BB%8D/%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97)

## 下载安装

### 使用 Docker 运行

MySQL(可选)

```bash
docker run -d -p 3307:3306 --restart unless-stopped -e MYSQL_PASSWORD=123456 yaoapp/mysql:8.0-amd64
```

```bash
docker run -d -p 5099:5099 --restart unless-stopped \
    -e YAO_INIT=demo \
    -e YAO_PROCESS_RESET=flows.init.menu \
    -e YAO_PROCESS_DEMO=flows.demo.data \
    -e YAO_DB_DRIVER=mysql \
    -e YAO_DB_PRIMARY="yao:123456@tcp(172.17.0.1:3307)/yao?charset=utf8mb4&parseTime=True&loc=Local" \
    yaoapp/yao-wms:1.0.3-amd64
```

### 在本地运行

#### 下载源码

```bash
git clone https://github.com/YaoApp/yao-wms /app/path/wms

```

#### 设置环境变量

```bash

mkdir /app/path/wms/data
mkdir /app/path/wms/logs

cat << EOF
YAO_ENV=development # development | production
YAO_ROOT="/app/path/wms"
YAO_HOST="0.0.0.0"
YAO_PORT="5099"
YAO_SESSION="memory"
YAO_LOG="/app/path/wms/logs/application.log"
YAO_LOG_MODE="TEXT"  #  TEXT | JSON
YAO_JWT_SECRET="bLp@bi!oqo-2U+hoTRUG"
YAO_DB_DRIVER=mysql
YAO_DB_PRIMARY="yao:123456@tcp(172.17.0.1:3307)/yao?charset=utf8mb4&parseTime=True&loc=Local"  # 替换为你的数据库配置
EOF > /app/path/wms/.env
```

#### 项目初始化

```bash
cd /app/path/wms

# 创建数据表 & 设置菜单
yao migrate --reset
yao run flows.init.menu

# 演示数据
yao run flows.demo.data

```

#### 启动服务

```bash
cd /app/path/wms
yao start
```

## 管理后台

打开浏览器输入以下网址进入:

http://127.0.0.1:5099/xiang/login/admin

用户名: `xiang@iqka.com`
密码: `A123456p+`
