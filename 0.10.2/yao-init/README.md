# yao-init

The application created by the yao installer

## 适用于 0.10.2 版本的 yao 应用引擎模板

yao 0.10.2 版本程序下载

在以下地址中找到 0.10.2 的安装程序
https://yaoapps.com/release

确定版本

```sh
yao version
0.10.2-e0c2ca7f4bd3-2022-11-21T01:42:30+0000
```

## 启动 yao

执行以下命令，控制台会提示打开地址http://127.0.0.1:5099进行配置数据库连接

```sh
yao start
```

_注意，只有执行目录下没有.env 文件并且数据库为空时才会出现配置界面。_

配置成功后会跳转到后台登录页面，http://127.0.0.1:5099/admin/

默认用户名:
xiang@iqka.com
密码:
A123456p+
