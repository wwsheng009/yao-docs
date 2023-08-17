# 源代码安装与调试

xgen 与 yao 前后端分离，可以单独进行单独的运行与调试

## 编译前端

yao 前端 xgen 是一个独立的 react 项目。

安装前提，需要 nodejs 16+。

```sh
git clone https://github.com/YaoApp/xgen

cd xgen
# 安装依赖
pnpm install --no-frozen-lockfile
# 开发
pnpm run dev
# 编译
pnpm run build
```

另外 xgen 的调试需要配置 host 文件`/etc/hosts`。

```sh
127.0.0.1 _dev.com
```

## 编译后端

参考[源码编译](https://yaoapps.com/doc/%E4%B8%93%E5%AE%B6/%E6%BA%90%E7%A0%81%E7%BC%96%E8%AF%91)

需要把以下的子项目都下载到同一个目录，yao 是主项目，其它的项目是依赖项。

```sh
mkdir /your-project/root
git clone https://github.com/yaoapp/yao
git clone https://github.com/yaoapp/gou
git clone https://github.com/yaoapp/xun
git clone https://github.com/yaoapp/kun
git clone https://github.com/yaoapp/v8go

cd yao

# 下载模块依赖
go mod tidy

# 调试,需要设置环境变量
go run .
go run . run xiang.sys.ping
go run . start

# 不集成 XGen 界面引擎
make debug

# macos制品
make release

# linux 制品 把前端项目也打包到yao执行程序里
make linux-release
```
