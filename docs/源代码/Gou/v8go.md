# v8go

## 创建一个对象模板，

创建一个对象模板，如果直接返回给v8go,可作为全局对象变量。

```go

func ExportObject(iso *v8go.Isolate) *v8go.ObjectTemplate {
    // log对象声明模板
	tmpl := v8go.NewObjectTemplate(iso)
    // 需要函数模板FunctionTemplate
	tmpl.Set("Trace", v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {}))
	return tmpl
}

//创建函数模板
func (obj *Object) log(iso *v8go.Isolate) *v8go.FunctionTemplate {
	return v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {

	})
}

// 创建对象模板
tmpl := v8go.NewObjectTemplate(ctx.Isolate())
// 设置函数模板
tmpl.Set("log", obj.log(ctx.Isolate()))

// 在对象模板基础上创建实例
instance, err := tmpl.NewInstance(ctx)
```

```go

func nodeAddMethod(iso *v8go.Isolate, node types.Node) *v8go.FunctionTemplate {
    // 第一个参数需要是iso,第二个参数是回调函数，只有在js中被调用才会触发
	return v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {
		ctx := info.Context()
		args := info.Args()

		if len(args) < 2 {
			return bridge.JsException(ctx, "Add requires 2 arguments: (input, option)")
		}
		// Create child node JS object
        // 在函数执行时，创建对象的实例，并返回
		childNodeObj, err := NewNodeObject(ctx, childNode)
		if err != nil {
			return bridge.JsException(ctx, err.Error())
		}

		return childNodeObj
	})
}
// NewNodeObject creates a JavaScript Node object (pure JS object, no Go mapping)
func NewNodeObject(v8ctx *v8go.Context, node types.Node) (*v8go.Value, error) {
	jsObject := v8go.NewObjectTemplate(v8ctx.Isolate())

	// Set primitive fields
	jsObject.Set("id", node.ID())

	// Set methods
	jsObject.Set("Info", nodeInfoMethod(v8ctx.Isolate(), node))

	// Create instance
	instance, err := jsObject.NewInstance(v8ctx)
	if err != nil {
		return nil, err
	}

	return instance.Value, nil
}

// Node method templates

func nodeInfoMethod(iso *v8go.Isolate, node types.Node) *v8go.FunctionTemplate {
	return v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {
		args := info.Args()
		if len(args) > 0 {
			node.Info(args[0].String())
		}
		return info.This().Value
	})
}
```

```go
// 一个独立的环境
iso := v8go.YaoNewIsolate()

// 全局对象
template := v8go.NewObjectTemplate(iso)

// 设置一个子对象，需要ObjectTemplate
template.Set("log", ExportObject(iso))

return &store.Isolate{
    Isolate:  iso,
    Template: template,
    Status:   IsoReady,
}
```
