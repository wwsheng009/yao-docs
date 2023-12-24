# Yao 插件

Yao 插件使用了 grpc 的调用方式。

可以使用 golang 语言或是其它的支持 grpc 的开发语言给 yao 开发插件。

## 插件机制

在 Yao 主程序中通过使用 grpc 的方式调用外部插件。grpc 的调用过程经过封装后，插件开发者不需要完整实现整个 grpc 的处理过程，只需要在外部插件的 main.go 中实现插件的处理逻辑即可。在插件的功能会暴露成 Yao 的处理器接口。

版本要求：0.10.3 及以上

## 插件目录设置

在最新的 0.10.3 版本代码中，可以在环境变量或是配置文件中指定插件的外部目录，可以在多个项目中共用同一个插件。

环境变量配置项：`YAO_EXTENSION_ROOT`

```go
type Config struct {
	ExtensionRoot string   `json:"extension_root,omitempty" env:"YAO_EXTENSION_ROOT" envDefault:""` // Plugin, Wasm root PATH, Default is <YAO_ROOT> (<YAO_ROOT>/plugins <YAO_ROOT>/wasms)
}
```

比如需要创建一个名称为 plugin1 的插件,假设这个插件目录结构如下：

```sh
Home
└─ yao
	└─ projects
		└─ ExtensionRoot		// 插件主目录
			└─ plugins			// 必须的目录
				└─ plugin1		// 插件目录
					├── main.go // 插件入口
					└── go.mod  // 插件配置文件

```

需要在`.env`文件中设置环境变量 YAO_EXTENSION_ROOT，指向插件目录。如果配置值为空，即是使用 yao 应用的目录。

```sh
YAO_EXTENSION_ROOT="/Home/yao/projects/ExtensionRoot"
```

## grpc 协议定义：

主要有两个参数：请求与响应，在请求中有 name 与 payload,name 即是处理器名称的后缀部分，payload 是处理器参数，数据格式为 json 文件字节。

响应时需要把返回值转换成字节数据。同时需要指定返回的数据类型 type,yao 会根据返回类型对数据进行反系列化处理。

```sh
syntax = "proto3";
package proto;
option go_package = "./";


message Request {
    string name = 1;
    bytes payload = 2;
}

message Response {
    bytes response = 1;
    string type = 2;
}

service Model {
    rpc Exec( Request ) returns ( Response );
}
```

## 工作原理

在 yao 应用启动时会，扫描插件目录，如果存在.dll 或是.so 文件，会执行这个文件。这个文件必须是可执行文件，虽然后缀名是 dll 或是 so。

插件程度需要启动一个 grpc 服务,并监听一个不重复的 tcp 端口，不能跟其它的 tcp 端口有冲突。另外插件还可以使用 socket 文件的方式具体查看 grpc 插件的的文档[go-plugin](https://github.com/hashicorp/go-plugin)。

yao 应用框架在这里扮演的角色是简化插件的使用流程，让开发者专注于业务逻辑的开发。如果是使用 golang 语言开发，只需要编写对应的处理逻辑的代码，grpc 的启动，插件管理已经封装处理好。

插件示例项目：

## golang 语言：

- [在插件中调用 yao 框架](https://github.com/wwsheng009/yao-plugin-go)
- [在插件中实现 http 请求](https://github.com/wwsheng009/yao-chatgpt/tree/main/plugins/httpx)
- [获取主机的进程或是 os 信息](https://github.com/wwsheng009/yao-plugin-psutil)
- [执行本地或是远程命令](https://github.com/wwsheng009/yao-plugin-command)
- [邮件客户端](https://github.com/wwsheng009/yao-plugin-email)
- [飞书登录验证](./飞书自定义登录.md)

## Rust 语言

- [yao-plugin-rust](https://github.com/wwsheng009/yao-plugin-rust)

## paython

- [yao-plugin-python](https://github.com/wwsheng009/yao-plugin-python)

## nodejs

- [yao-plugin-nodejs](https://github.com/wwsheng009/yao-plugin-nodejs)

## 脚本语言开发

在使用 python 或是 nodejs 脚本语言作插件开发时，还需要实现另外一个 proto 的接口,用于结束 grpc 服务。

```sh
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

syntax = "proto3";
package plugin;
option go_package = "./plugin";

message Empty {
}

// The GRPCController is responsible for telling the plugin server to shutdown.
service GRPCController {
    rpc Shutdown(Empty) returns (Empty);
}
```

在使用脚本语言作为插件时，不能直接调用脚本文件，而是需要一个中间件作为启动器，这个中间件的功能是通过命令的方式调用脚本文件。
比如说在启动 python 插件时就需要以下的命令作为启动器。可以使用 go 编写或是其它能编译成二进制的语言编写。因为 yao 只会有插件目录下查找后缀是 .dll 或是.so 文件

```go
package main

import (
	"fmt"
	"os"
	"os/exec"
)

func main() {
	cmd := exec.Command("plugins/venv/Scripts/python", "plugins/myplugin.py")

	// cmd.Dir = ""
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Start()
	if err != nil {
		fmt.Printf("Start exited with error: %s\n", err.Error())
		os.Exit(1)
	}

	err = cmd.Wait()
	if err != nil {
		fmt.Printf("Wait with error: %s\n", err.Error())
		os.Exit(1)
	}
}

```

## 测试

```sh
yao run plugins.xx.xx

```

## 注意

yao 使用的是`https://github.com/hashicorp/go-plugin`,它的工作原理是在插件启动时会获取标准输出的第一行数据作为通讯协议。

所以，在插件中输出日志不要使用`console.log`或是`print`等函数，而是把日志输出到日志文件中。
