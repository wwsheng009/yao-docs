# Yao JS回调函数指南

本文档介绍在 Yao 的 TypeScript/JavaScript 脚本中使用回调函数的方法和限制。

## 限制说明

在 Yao 中，由于 `v8go.Isolate` 的生命周期管理机制，以下场景**无法支持** JS 函数调用：

### 不支持的场景

当使用 `Process('scripts.test.test')` 调用脚本时：

- 如果脚本中调用了 Go 函数
- Go 函数中使用 `goroutine` 实现异步回调原来的 JS 函数

### v8go Context 与 Goroutine 的根本限制

#### 1. V8 Isolate 的线程亲和性

`v8go.Isolate` 是 V8 引擎的核心实例，具有以下关键特性：

```go
// v8go 的基本使用结构
type Isolate struct {
    // 内部包含 V8 引擎实例
    // 与特定的 OS 线程绑定
}

type Context struct {
    isolate *Isolate  // 属于特定的 Isolate
    // 保存了全局对象、执行上下文等
}
```

**关键原理**：

- **单线程执行**：V8 引擎设计为单线程执行，一个 `Isolate` 只能在创建它的 OS 线程中执行 JavaScript 代码
- **线程本地存储**：`v8go` 使用 `cgo` 与 V8 C++ API 交互，依赖于线程本地存储（TLS）来维护执行状态
- **隔离性**：每个 `Isolate` 是完全隔离的，不能跨 Isolate 或跨线程共享对象

#### 2. Goroutine 与 V8 Isolate 的冲突

Go 的 `goroutine` 调度机制与 V8 的线程模型存在根本冲突：

```go
// ❌ 错误示例：在 goroutine 中调用 JS 函数
func (m *MCP) badExample(iso *v8go.Isolate, handlerFn *v8go.Value) {
    go func() {
        // 问题：此 goroutine 可能在不同的 OS 线程上执行
        // 问题：此时主函数已返回，v8go.Isolate 可能已被销毁
        handlerFunction, _ := handlerFn.AsFunction()
        _, err := handlerFunction.Call(m.v8Context.Global(), data)
        // 错误：panic 或无效操作
    }()
}
```

**冲突点**：

| 特性       | Go Goroutine                     | V8 Isolate         |
| ---------- | -------------------------------- | ------------------ |
| 调度模型   | M:N 调度，可能在任意 OS 线程执行 | 绑定到特定 OS 线程 |
| 并发模型   | 抢占式多任务                     | 单线程事件循环     |
| 内存模型   | 共享内存，带同步机制             | 每个隔离区独立     |
| 上下文切换 | 快速、频繁                       | 手动控制、开销大   |

#### 3. Yao 的生命周期管理

Yao 框架的处理器调用模型：

```
┌─────────────────────────────────────────────┐
│  Yao 处理器入口                              │
│       ↓                                    │
│  创建/获取 v8go.Isolate (OS 线程绑定)       │
│       ↓                                    │
│  执行 JS 脚本 Process('scripts.test')      │
│       ↓                                    │
│  JS 调用 Go 函数                            │
│       ↓                                    │
│  【问题点】Go 函数启动 goroutine           │
│       ↓                                    │
│  JS 脚本执行完成                            │
│       ↓                                    │
│  Process 主函数返回                         │
│       ↓                                    │
│  Yao 销毁 v8go.Isolate ◄──【冲突】         │
│       ↓                                    │
│  【已销毁】goroutine 尝试调用 JS 函数      │
│       ↓                                    │
│  ❌ 错误：访问已释放内存                    │
└─────────────────────────────────────────────┘
```

**Yao 的资源管理策略**：

```go
// Yao 伪代码：处理器生命周期
func ProcessHandler(scriptName string) {
    // 1. 创建/获取 v8go.Isolate
    iso := v8go.NewIsolate()
    ctx := v8go.NewContext(iso)

    // 2. 执行 JS 脚本
    // JS 脚本可能调用 Go 函数，Go 函数启动 goroutine
    result := ctx.RunScript(script, scriptName)

    // 3. 返回结果
    // 4. 清理资源（关键点）
    ctx.Close()
    iso.Close()  // ← 此时 Isolate 被销毁

    // 5. 如果 goroutine 在此之后执行，会 panic
}
```

#### 4. v8go 的内部实现限制

从技术角度看，`v8go` 的以下特性导致无法在 goroutine 中使用：

**1. cgo 限制**：

```go
/*
#include <v8.h>
*/
import "C"

// cgo 调用依赖于 Go 的调度器和线程本地存储
// 跨 goroutine 调用会破坏 cgo 的假设
```

**2. V8 Handle 作用域**：

```go
// HandleScope 是 V8 的内存管理机制
// 每个 HandleScope 与特定的执行上下文绑定
// 跨 goroutine 会导致 Handle 失效

func (iso *Isolate) NewValue(data string) (*Value, error) {
    // 创建 Value 需要在正确的上下文中
    // goroutine 中的上下文可能不正确
}
```

**3. 持久化引用**：

```go
// 即使尝试保存引用
type savedCallback struct {
    handlerFn *v8go.Value  // 持久化的 JS 函数引用
}

// 问题：v8go.Value 内部包含指向 V8 堆的指针
// Isolate 销毁后，这些指针变为野指针
```

#### 5. 为什么同步调用可以工作

```go
// ✅ 正确示例：同步调用
func (obj *Object) goodStream(iso *v8go.Isolate) *v8go.FunctionTemplate {
    return v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {
        args := info.Args()
        cb, _ := args[2].AsFunction()

        // 同步调用：整个 Stream 方法在主 goroutine 中执行
        // 回调函数也在主 goroutine 中同步调用
        // 此时 v8go.Isolate 仍然存活且在正确的线程上
        req.Stream(ctx, method, payload, func(data []byte) int {
            v, _ := v8go.NewValue(iso, string(data))
            ret, err := cb.Call(info.This(), v)  // 同步调用
            return int(ret.Integer())
        })

        // Stream 完成后返回，Isolate 仍然有效
        return obj.vReturn(info, &http.Response{
            Status:  200,
            Code:    200,
            Message: "ok",
        })
    })
}
```

**同步调用的工作原理**：

```
┌─────────────────────────────────────────────┐
│  ProcessHandler 调用链                      │
│                                              │
│  OS 线程 A (固定):                           │
│    1. 创建 Isolate                           │
│    2. 执行 JS 脚本                           │
│    3. JS 调用 Go 函数                        │
│    4. Go 函数同步处理                        │
│    5. 回调 JS 函数 (仍在 OS 线程 A)          │
│    6. JS 函数返回                            │
│    7. Go 函数返回                            │
│    8. JS 脚本完成                            │
│    9. Process 返回                           │
│   10. 销毁 Isolate                           │
└─────────────────────────────────────────────┘
```

### 原因总结

基于上述原理，Yao 处理器调用限制的核心原因：

1. **线程模型不匹配**：Go 的 M:N 调度 vs V8 的单线程模型
2. **生命周期管理**：Yao 在 Process 返回后立即销毁 Isolate
3. **cgo 限制**：跨 goroutine 的 cgo 调用不安全
4. **内存管理**：V8 的 Handle 和垃圾回收与 Go 的 GC 不兼容

### 支持的场景

如果在处理器内部**不使用** `goroutine` 异步调用回调函数，而是**同步**调用，则 JS 回调函数可以正常工作。

**核心原则**：需要保证主调用函数没有退出，`v8go.Isolate` 没有被销毁。

## 实现方式

### 示例 1：事件处理器模式

```go
type eventHandler struct {
	isFunction bool         // true: JS function, false: Yao process
	process    string        // Yao process name (only for Yao process)
	handlerFn  *v8go.Value  // JavaScript function (only for JS function)
	args       []interface{} // additional arguments for Yao process
}

// onEventMethod 实现 client.OnEvent(eventType, handler, ...args)
// 使用方式:
//   - JavaScript 函数: client.OnEvent("connected", (event) => { console.log(event); })
//   - Yao process: client.OnEvent("connected", "my.process.handler", arg1, arg2)
func (m *MCP) onEventMethod(iso *v8go.Isolate) *v8go.FunctionTemplate {
	return v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {
		v8ctx := info.Context()
		args := info.Args()

		if len(args) < 2 {
			return bridge.JsException(v8ctx, "OnEvent requires eventType and handler as arguments")
		}

		// 获取事件类型
		if !args[0].IsString() {
			return bridge.JsException(v8ctx, "eventType must be a string")
		}
		eventType := args[0].String()

		var handler *eventHandler

		// 检查 handler 是 JavaScript 函数还是 Yao process 名称
		if args[1].IsFunction() {
			// JavaScript 函数回调（存储函数引用）
			handlerFn := args[1]
			handler = &eventHandler{
				isFunction: true,
				handlerFn:  handlerFn,
			}
		} else {
			return bridge.JsException(v8ctx, "handler must be a JavaScript function or Yao process name (string)")
		}
		return v8go.Undefined(iso)
	})
}

func (m *MCP) invokeJSFunctionSafe(handlerFn *v8go.Value, data interface{}) {
	if handlerFn == nil || !handlerFn.IsFunction() {
		return
	}

	// 需要确保 v8Context 存在
	// 使用 V8 context 创建新的 v8go.Value
	jsData, err := bridge.JsValue(m.v8Context, data)
	if err != nil {
		return
	}

	// 调用 JavaScript 函数
	handlerFunction, _ := handlerFn.AsFunction()
	_, _ = handlerFunction.Call(m.v8Context.Global(), jsData)
}
```

### 示例 2：流式处理模式

```go
func (obj *Object) stream(iso *v8go.Isolate) *v8go.FunctionTemplate {

	return v8go.NewFunctionTemplate(iso, func(info *v8go.FunctionCallbackInfo) *v8go.Value {
		err := obj.validateArgNums(info, 2)
		if err != nil {
			return obj.vReturn(info, err)
		}

		args := info.Args()
		method := args[0].String()
		cb, v8err := args[2].AsFunction()

		if v8err != nil {
			return obj.vReturn(info, &http.Response{
				Status:  400,
				Code:    400,
				Message: v8err.Error(),
				Headers: map[string][]string{},
				Data:    nil,
			})
		}

		var payload interface{}
		if len(args) > 3 {
			var err error
			payload, err = bridge.GoValue(args[3], info.Context())
			if err != nil {
				resp := &http.Response{
					Status:  400,
					Code:    400,
					Message: fmt.Sprintf("args[%d] parameter error: %s", 3, err.Error()),
					Headers: map[string][]string{},
					Data:    nil,
				}
				return obj.vReturn(info, resp)
			}
		}

		req, err := obj.new(info, 1, 4)
		if err != nil {
			return obj.vReturn(info, err)
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		// 同步调用 Stream 方法，在回调中同步调用 JS 函数
		v8err = req.Stream(ctx, method, payload, func(data []byte) int {
			v, err := v8go.NewValue(iso, string(data))
			if err != nil {
				log.Error("[http.Stream] %s %s %s", method, args[2].String(), err.Error())
				return http.HandlerReturnError
			}

			ret, err := cb.Call(info.This(), v)
			if err != nil {
				log.Error("[http.Stream] %s %s %s", method, args[2].String(), err.Error())
				return http.HandlerReturnError
			}

			return int(ret.Integer())
		})

		if v8err != nil {
			return obj.vReturn(info, &http.Response{
				Status:  400,
				Code:    400,
				Message: v8err.Error(),
				Headers: map[string][]string{},
				Data:    nil,
			})
		}

		return obj.vReturn(info, &http.Response{
			Status:  200,
			Code:    200,
			Message: "ok",
			Headers: map[string][]string{},
			Data:    nil,
		})
	})
}
```

## 关键要点

1. **同步调用**：在主函数未退出前调用 JS 回调
2. **Isolate 生命周期**：确保 `v8go.Isolate` 存活期间调用 JS 函数
3. **避免 Goroutine**：不要在 `goroutine` 中回调已销毁的 `v8go.Isolate` 中的函数
4. **Context 管理**：保存并使用正确的 V8 Context 来调用 JS 函数
