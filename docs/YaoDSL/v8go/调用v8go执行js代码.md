# 调用v8go执行js代码

加载js/ts脚本源代码，参考：sui\core\script.go

```go
import (
v8 "github.com/yaoapp/gou/runtime/v8"
	"github.com/yaoapp/gou/runtime/v8/bridge"
)

// LoadScript load the script
func LoadScript(file string, disableCache ...bool) (*Script, error) {

	base := strings.TrimSuffix(strings.TrimSuffix(file, ".sui"), ".jit")
	// LOAD FROM CACHE
	if disableCache == nil || !disableCache[0] {
		if script, has := Scripts[base]; has {
			return script, nil
		}
	}

	file = base + ".backend.ts"
	if exist, _ := application.App.Exists(file); !exist {
		file = base + ".backend.js"
	}

	if exist, _ := application.App.Exists(file); !exist {
		return nil, nil
	}

	source, err := application.App.Read(file)
	if err != nil {
		return nil, err
	}

	v8script, err := v8.MakeScript(source, file, 5*time.Second)
	if err != nil {
		return nil, err
	}

	v8script.SourceRoots = getSourceRootReplaceFunc()
	script := &Script{Script: v8script}
	chScript <- &scriptData{base, script, saveScript}
	return script, nil
}
```

调用脚本中的方法

```go
// Call the script method
// This will be refactored to improve the performance
func (script *Script) Call(r *Request, method string, args ...any) (interface{}, error) {
	ctx, err := script.NewContext(r.Sid, nil)
	if err != nil {
		return nil, err
	}
	defer ctx.Close()
	if args == nil {
		args = []any{}
	}
	args = append(args, r)

	// Set the sid
	ctx.Sid = r.Sid

	// Set authorized information if available
	if r.Authorized != nil {
		ctx.WithAuthorized(r.Authorized)
	}

	res, err := ctx.Call(method, args...)
	if err != nil {
		return nil, err
	}
	return res, nil
}
```

在运行时，会创建一个v8.Script对象，然后调用NewContext方法时会加载yao jsapi对象。

`v8.Script->NewContext->SelectIsoStandard->makeIsolate->MakeTemplate->加载yao特制对象。`

在脚本过程中可以调用yao的其它对象与处理器。
