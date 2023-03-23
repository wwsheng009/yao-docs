# yao-init

用于`Yao`安装器使用的`Yao`应用模板

## 适用于 0.10.3 的 yao 应用程序

内置了`json-schema`检验，使用`vscode`编辑器，在编辑配置文件时会有自动的提示与字段说明。

**注**：需要`vscode`连接`github`

## 0.10.3 开发版本的 yao 下载

在以下地址下载开发版本 0.10.3 开发版本，根据自己的电脑 OS，打开对应的 URL，找到一个最新的 release

Linux:

https://github.com/YaoApp/yao/actions/workflows/release-linux.yml

示例:

https://github.com/YaoApp/yao/actions/runs/4321507316

MacOS:

https://github.com/YaoApp/yao/actions/workflows/release-macos.yml

示例：

https://github.com/YaoApp/yao/actions/runs/4321507798

## 启动 yao

复制初始化模板到别的目录或是直接使用`yao-init`

```sh
cp -r yao-init/ /tmp
cd /tmp/yao-init/
```

执行以下命令，控制台会提示打开地址http://127.0.0.1:5099进行配置数据库连接

```sh
root@archlinux /t/yao-init# yao start
---------------------------------
Yao Application Setup v0.10.3
---------------------------------

Open URL in the browser to continue:

http://127.0.0.1:5099
```

_不建议直接配置生产系统数据库_

_注意，只有执行目录下没有.env 文件并且数据库为空时才会出现配置界面。_

配置成功后会跳转到后台登录页面，http://127.0.0.1:5099/admin/

默认用户名:
xiang@iqka.com
密码:
A123456p+
