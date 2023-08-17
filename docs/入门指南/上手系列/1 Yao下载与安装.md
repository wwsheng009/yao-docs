# yao 下载与安装

这里说的 Yao 是指 Yao 引擎的执行程序。安装 Yao 只需要下载一个执行程序就可以了。

参考[安装调试](https://yaoapps.com/doc/%E4%BB%8B%E7%BB%8D/%E5%AE%89%E8%A3%85%E8%B0%83%E8%AF%95)

## yao 版本

需要注意的时，yao 的应用需要使用特定版本的 yao 的执行程序。

在升级 yao 执行程序之前，可以给执行程序加个后缀，比如加上版本编号。可以直接另命名 yao 应用程序，不用担心程序依赖问题。

```sh
# yao程序版本管理
mv /usr/local/bin/yao /usr/local/bin/yao-0.10.2

# 使用特定版本的yao启动你的应用
yao-0.10.2 start
```

## 下载 Yao 程序

### 官方发行版本

官方在重大功能更新后会发布新的版本。

访问地址：https://yaoapps.com/release

在发布页面可以看到各个版本的下载地址与相关的说明。

找到合适的版本后，点击下载按钮后，会自动一个没有后缀的二进制文件。只需要把这个文件放到目录`/usr/local/bin/`即可。

比如下载安装 0.10.3 版本程序：

```sh

wget https://release-bj.yaoapps.com/archives/yao-0.10.3-linux-amd64

# 移动程序到bin目录
mv yao-0.10.3-linux-amd64 /usr/local/bin/yao

# 加上程序执行权限
chmod +x /usr/local/bin/yao

# 版本检查
yao version --all
```

### 开发版本

开发版本的会有最新的特性与功能。从 github 的 actions 中可以找到最新的开发版本。

https://github.com/YaoApp/yao/actions

按照自己的操作系统类别找到对应的制品程序。

- MacOS intel/m1/m2
- Linux amd64/arm64

  0.10.3 版本 Linux

https://github.com/YaoApp/yao/actions/workflows/build-linux-dev.yml

这里无法使用命令下载，需要在浏览器中下载。

下载后是一个 zip 压缩包，里面包含了 arm64 与 amd64 版本的程序。

```sh
# 移动程序到bin目录
mv yao-0.10.3-dev-linux-amd64 /usr/local/bin/yao

# 加上程序执行权限
chmod +x /usr/local/bin/yao

# 版本检查
yao version --all
```

## 总结

Yao 执行程序就一个二进制的文件，可以直接移动或是删除。

Yao 各个版本的差异比较大，需要仔细辨别。
