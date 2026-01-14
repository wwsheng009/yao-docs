---
name: api
description: Analysis of Yao API engine, configuration mapping from DSL to Golang structs, and request processing lifecycle.
license: Complete terms in LICENSE.txt
---

# Gou API 引擎与配置映射

## 1\. 概述

在 Yao 框架中，`apis/*.http.yao` 配置文件不仅仅是静态的路由定义，它们被 `gou` 引擎的 `api` 模块动态解析并加载到 Gin Web Server 中。本报告分析了从 YAO DSL（领域特定语言）到 Golang 运行时结构体的映射机制，以及请求处理的生命周期。

## 2\. 核心结构体映射 (Struct Mapping)

配置文件的解析完全依赖于 `api/types.go` 中定义的数据结构。

### 2.1 API 根对象 (`API` struct)

配置文件（如 `user.http.yao`）被加载为 `API` 结构体。

- **DSL 字段**: `name`, `version`, `group`, `guard`, `paths`
- **Go 结构体**: `HTTP`

  ```go
  type HTTP struct {
      Name        string `json:"name"`
      Version     string `json:"version"`
      Description string `json:"description,omitempty"`
      Group       string `json:"group,omitempty"`
      Guard       string `json:"guard,omitempty"`
      Paths       []Path `json:"paths,omitempty"`
  }
  ```

  - **Group**: 定义路由组，例如 `/api/v1`。
  - **Guard**: 定义全局中间件（如 `bearer-jwt`）。

### 2.2 路径定义 (`Path` struct)

`paths` 数组中的每一项映射为 `Path` 结构体，定义了具体的路由逻辑。

- **Path**: 路由路径（支持 Gin 风格参数，如 `/user/:id`）。
- **Method**: HTTP 方法 (`GET`, `POST` 等)。
- **Process**: 绑定的处理器名称（如 `models.user.Find`）。
- **In**: 输入参数定义，这是一个 `[]interface{}`，用于将 HTTP 请求数据映射给 Process 的参数。
- **Out**: 输出定义，决定响应的 Status Code、Content-Type 和 Body。

## 3\. 运行时请求处理流程

当一个 HTTP 请求到达时，`api/http.go` 中的 `Route` 方法负责将配置转换为 Gin 的路由 Handler。

### 3.1 路由注册与跨域

`Route` 函数会检查 `allows` 参数来配置 CORS（跨域资源共享）。如果配置了允许的域名，它会动态生成一个 OPTIONS 路由来处理预检请求。

### 3.2 参数解析引擎 (`parseIn`)

这是最关键的部分。`parseIn` 函数通过闭包预先计算了如何从 `*gin.Context` 中提取数据。它根据 DSL 中的字符串定义，返回对应的提取函数列表。

支持的参数映射符号包括：

| DSL 符号       | 对应的 Go 逻辑 (gin.Context)                |
| :------------- | :------------------------------------------ |
| `:body`        | `io.ReadAll(c.Request.Body)`                |
| `:query`       | `c.Request.URL.Query()`                     |
| `:params`      | `c.Request.URL.Query()` (转换为 Map)        |
| `:form`        | `c.Request.PostForm`                        |
| `:headers`     | `c.Request.Header`                          |
| `:fullpath`    | `c.FullPath()`                              |
| `:context`     | `c` (原始 Context)                          |
| `$param.id`    | `c.Param("id")` (路径参数)                  |
| `$query.q`     | `c.Query("q")` (查询参数)                   |
| `$form.name`   | `c.PostForm("name")`                        |
| `$header.X`    | `c.GetHeader("X")`                          |
| `$session.uid` | 从 Session 中读取 `uid`                     |
| `$file.file`   | `c.FormFile("file")` (包含临时文件处理逻辑) |

### 3.3 处理器执行 (`ProcessGuard`)

默认的处理器逻辑封装在 `ProcessGuard` 中：

1.  **参数提取**: 根据 `parseIn` 生成的规则，从 HTTP 请求中提取参数列表 `args`。
2.  **Process 调用**: 使用 `process.Of(name, args...)` 创建一个新的处理器实例。
3.  **上下文注入**: 如果 Gin Context 中包含 `__sid` (Session ID) 或 `__global`，它们会被注入到 Process 中。
4.  **执行**: 调用 `process.Execute()` 执行具体的业务逻辑（Flow, Script, Model 等）。
5.  **响应**: 如果执行出错，返回 500 错误；成功则返回结果。结果中的 `sid` 或 `__global` 变更会写回 Gin Context。

## 4\. 代码质量与优化建议

在分析 `api/http.go` 时，我有以下发现：

1.  **JSON 处理**: 代码使用了 `github.com/json-iterator/go` 替代标准库 `encoding/json`，这是一个很好的性能优化实践。
2.  **Body 复用**: 在 `ProcessGuard` 中，读取了 `c.Request.Body` 后，通过 `io.NopCloser(bytes.NewBuffer(bodyBytes))` 进行了重置。这允许后续的 Handler 再次读取 Body，防止流被耗尽。
3.  **潜在改进**: `parseIn` 函数包含大量的 `if-else` 字符串匹配逻辑。虽然在启动时执行一次，但随着支持的参数类型增加，可以考虑使用 Map 策略模式来注册参数解析器，以提高代码的可维护性和扩展性。

## 5\. 结论

`gou` 的 API 引擎实现了一个高度灵活的动态代理。它将 HTTP 协议的细节（Gin Context）抽象化，通过 DSL 定义的规则自动转换为 Process 所需的参数。这使得开发者在编写 `http.yao` 文件时，只需关注数据流向，而无需编写重复的 Go 绑定代码。
