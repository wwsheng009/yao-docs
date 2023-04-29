# 适用于 windows 的 pack 功能适配

0.10.3-dev 版本提供了一个程序应用打包的功能。操作命令是：

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

官方目前只测试了 linux 版本，不支持 windows 版，需要手工处理。

0.10.3-dev 版本的 pack 功能 windows 平台适配

https://github.com/wwsheng009/gou/commit/773b81ea80b289055ee26a303a625eec101556cd

## zip 打包文件路径只能使用 linux 风格的路径分隔符

```go
relPath = strings.ReplaceAll(relPath, "\\", "/")
```

## 移除临时文件的处理

windows 删除文件会判断当前文件是否在使用。需要把删除文件的操作放在最后面。

```go
 defer os.Remove(encryptFile)//移除文件要在最后操作
 defer encryptWriter.Close()
```
