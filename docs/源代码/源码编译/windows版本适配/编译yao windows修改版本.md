# 编译 yao windows 修改版本

**注意**： 此版本并未由官方支持。由群友"明"提供材料整理而来。

## 前提条件

需要安装 mingw64，需要使用 gcc 编译 v8go-0.6,安装教程请在网上搜索。

https://www.mingw-w64.org/downloads/

## 安装 go

下载 1.20 版本的 go

https://golang.google.cn/dl/

安装 go-bindata,打包制品需要用到

```sh
go install -a -v github.com/go-bindata/go-bindata/...@latest

```

# 步骤一 下载代码

最新的开发分支版本是 0.10.3

```sh
git clone https://github.com/yaoapp/yao
git clone https://github.com/yaoapp/gou
git clone https://github.com/yaoapp/xun
git clone https://github.com/yaoapp/kun

# 不能使用新版的v8go
# git clone https://github.com/YaoApp/v8go

# 使用修改版 v8go
git clone https://github.com/wwsheng009/v8go-0.6-yao-windows v8go
```

## 步骤二

修改 yao 文件读取代码，适配 windows 平台的分隔符

```go
// yao-sources\yao\share\utils.go

// SpecName 解析名称 root: "/tests/apis" file: "/tests/apis/foo/bar.http.json"
func SpecName(root string, file string) string {
    // filename := strings.TrimPrefix(file, root+"/")
    filename := strings.TrimPrefix(file, root+string(os.PathSeparator)) // "foo/bar.http.json"
    namer := strings.Split(filename, ".") // ["foo/bar", "http", "json"]
    // nametypes := strings.Split(namer[0], "/")
    nametypes := strings.Split(namer[0], string(os.PathSeparator)) // ["foo", "bar"]
    name := strings.Join(nametypes, ".") // "foo.bar"
    return name
}
```

## 步骤三

修改路由处理代码。

filepath，把斜杠转换成了操作系统的路径分隔符，导致 url 都变成了 xxxx\xxxx\，如果使用 path 下面的 Join，则不会有这个问题，仍然是 xxxx/xxxx/

```go
import (
path1 "path"
)
// yao-sources\gou\api\http.go
// Routes 配置转换为路由
func (http HTTP) Routes(router *gin.Engine, path string, allows ...string) {
	var group gin.IRoutes = router
	if http.Group != "" {
		// path = filepath.Join(path, "/", http.Group)
        path = path1.Join(path, "/", http.Group)
	}
	group = router.Group(path)
	for _, path := range http.Paths {
		path.Method = strings.ToUpper(path.Method)
		http.Route(group, path, allows...)
	}
	registeredOptions = map[string]bool{}
}
```

## 步骤四

编译。

适用于 windows 下的编译 yao 的脚本 build.bat。把脚本文件放在 yao 目录下：yao/build.bat。

xgen 与 yao-init 的安装请参考脚本中的注释部分。这里注释掉是不希望每次构建都下载一次。

```bat

@echo off

rmdir /s /q dist\release
mkdir dist\release
mkdir .tmp

mkdir .tmp\xgen\v0.9\dist
echo XGEN v0.9 > .tmp\xgen\v0.9\dist\index.html

rem Building XGEN v1.0
rem 在集成之前，需要修改xgen的环境变量BASE=__yao_admin_root，如果是前端单独测试，设置BASE=yao，或是清空BASE设置
rem
rem git clone https://github.com/YaoApp/xgen.git ../xgen-v1.0
rem set NODE_ENV=production
rem echo BASE=__yao_admin_root > ../xgen-v1.0/packages/xgen/.env
rem cd ../xgen-v1.0 && pnpm install --no-frozen-lockfile && pnpm run build
rem echo BASE=yao > ../xgen-v1.0/packages/xgen/.env

rem Checkout init
rem git clone https://github.com/wwsheng009/yao-init-0.10.3.git .tmp\yao-init
rem del /s /q .tmp\yao-init\.git
rem del /s /q .tmp\yao-init\.gitignore
rem del /s /q .tmp\yao-init\LICENSE
rem del /s /q .tmp\yao-init\README.md


rem Packing
mkdir .tmp\data\xgen
xcopy /e /y /q /i ui .tmp\data\ui
xcopy /e /y /q /i yao .tmp\data\yao
xcopy /e /y /q /i .tmp\xgen\v0.9\dist .tmp\data\xgen\v0.9
xcopy /e /y /q /i ..\xgen-v1.0\packages\xgen\dist .tmp\data\xgen\v1.0
xcopy /e /y /q /i ..\xgen-v1.0\packages\setup\build .tmp\data\xgen\setup
xcopy /e /y /q /i .tmp\yao-init .tmp\data\init
go-bindata -fs -pkg data -o data/bindata.go -prefix ".tmp/data/" .tmp/data/...
rmdir /s /q .tmp\data
rmdir /s /q .tmp\xgen

rem Replace PRVERSION
rem powershell -Command "(Get-Content share\const.go) | ForEach-Object { $_ -replace 'const PRVERSION = \"DEV\"', 'const PRVERSION = \"${COMMIT}-${NOW}-debug\"' } | Set-Content share\const.go"

rem Making artifacts
mkdir dist
del /q dist\release\yao-debug.exe
set CGO_ENABLED=1
go build -v -o dist\release\yao-debug.exe

del /Q %GOPATH%\bin\yao.exe
move dist\release\yao-debug.exe %GOPATH%\bin\yao.exe

rem Reset const

copy /Y share\const.goe share\const.go
del /Q share\const.goe
```
