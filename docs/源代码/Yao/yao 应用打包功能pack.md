# yao 应用打包功能 pack

0.10.3 版本提供了一个程序应用打包的功能。操作命令是：

打包后的文件默认情况是保存在目录 dist/app.yaz

```sh
# 不加密打包
yao pack

# 加密打包
yao pack -l xxxx

```

指定程序包，使用参数-f 指定 yaz 或是使用环境变量指定应用包的路径 YAO_APP_SOURCE=app.yaz

使用程序包，解密使用-k

```sh
# -f 指定yaz或是使用环境变量YAO_APP_SOURCE=app.yaz
yao start -f app.yaz -k xxxx

```
