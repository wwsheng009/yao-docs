# golang grpc 插件模板

插件使用`grpc`通讯协议。`yao`框架已经把大部分的`grpc`调用逻辑封装好了。插件只需要一个`Exec`方法即可。

在应用的根目录创建目录`plugins`,再在`plugins`下面创建`demo`目录

`plugins/demo/main.go`

```go
package main

//插件模板
import (
	"encoding/json"
	"io"
	"os"
	"path"

	"github.com/hashicorp/go-hclog"
	"github.com/yaoapp/kun/grpc"
)

// 定义插件类型，包含grpc.Plugin
type DemoPlugin struct{ grpc.Plugin }

// 设置插件日志到单独的文件
func (demo *DemoPlugin) setLogFile() {
	var output io.Writer = os.Stdout
	//开启日志
	logroot := os.Getenv("GOU_TEST_PLG_LOG")
	if logroot == "" {
		logroot = "./logs"
	}
	if logroot != "" {
		logfile, err := os.Create(path.Join(logroot, "plugin.log"))
		if err == nil {
			output = logfile
		}
	}
	demo.Plugin.SetLogger(output, grpc.Trace)
}

// 插件执行需要实现的方法
// 参数name是在调用插件时的方法名，比如调用插件demo的Hello方法是的规则是plugins.demo.Hello时。
//
// 注意：name会自动的变成小写
//
// args参数是一个数组，需要在插件中自行解析。判断它的长度与类型，再转入具体的go类型。
//
// Exec 读取
func (demo *DemoPlugin) Exec(name string, args ...interface{}) (*grpc.Response, error) {
	demo.Logger.Log(hclog.Trace, "plugin method called", name)
	demo.Logger.Log(hclog.Trace, "args", args)
	var v = make(map[string]interface{})
	switch name {
	case "hello":
		if len(args) < 1 {
			v = map[string]interface{}{"code": 400, "message": "参数不足，需要一个参数"}
			break
		}
		code, ok := args[0].(string)
		if !ok {
			v = map[string]interface{}{"code": 400, "message": "参数的类型需要是字符串", "args": args}
		} else {
			v = map[string]interface{}{"name": "Hello", "value": code}
			v["x1"] = map[string]interface{}{"name": "Hello", "value": code}
		}

	default:
		v = map[string]interface{}{"name": name, "args": args}
	}
	//输出前需要转换成字节
	bytes, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	//设置输出数据的类型
	//支持的类型：map/interface/string/integer,int/float,double/array,slice
	return &grpc.Response{Bytes: bytes, Type: "map"}, nil
}

// 生成插件时函数名修改成main
func main() {

	plugin := &DemoPlugin{}
	plugin.setLogFile()
	grpc.Serve(plugin)
}

// 调试时开启，需要直接调试时修改成main
func Main() {

	plugin := &DemoPlugin{}
	plugin.setLogFile()
	// grpc.Serve(plugin) 不要使用server
	plugin.Exec("hello", "world")//普通的go程序，用于开发调试
}

// go build -o ../demo.so .
// chmod +x ../demo.so

//yao run plugins.demo.Hello "World"
```
