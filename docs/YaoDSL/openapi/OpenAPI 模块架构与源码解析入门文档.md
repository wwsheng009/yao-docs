# Yao OpenAPI 模块架构与源码解析入门

## 1\. 模块概述

在 Yao 框架中，`openapi` 目录并非指代 "OpenAPI Specification (Swagger)" 的定义文件，而是指 **Yao 平台对外暴露的核心系统级 HTTP API 实现代码**。

与用户在 DSL (`apis/*.http.json`) 中定义的业务接口不同，`openapi` 目录下的代码实现了 Yao 引擎自带的高级功能接口，特别是 **v0.10.4+ 版本引入的 AI Agent（智能体）、Chat（对话）、KB（知识库）以及配套的安全认证（OAuth）体系**。

**核心职责：**

- 提供 AI 助手（Assistant）的管理与交互接口。
- 提供知识库（Knowledge Base/RAG）的切片、索引与检索接口。
- 提供基于 OAuth2 和 OIDC 的系统级身份认证与权限控制（ACL）。
- 提供系统监控与 Trace（链路追踪）接口。

---

## 2\. 代码目录结构分析

该目录结构清晰地按“功能领域”划分。以下是核心子目录的解析：

### 2.1 核心业务域

- **`agent/`**: 智能体管理。包含 Agent 的创建、更新、以及相关的配置。
- **`assistant/`**: 助手逻辑，处理具体的 AI 助理交互流。
- **`chat/`**: 对话核心。处理 `completions`（补全）、消息流式传输（Streaming）以及上下文管理。
- **`kb/` (Knowledge Base)**: 知识库核心实现。
  - 包含文档上传 (`addfile.go`)、URL解析 (`addurl.go`)。
  - 包含向量检索与图谱构建 (`graph.go`, `search.go`)。
- **`mcp/`**: **Model Context Protocol** 的实现。这是 Yao 连接外部工具和数据源的标准协议接口。
- **`job/`**: 异步任务管理。用于处理耗时的 AI 任务（如大文件 RAG 索引构建）。

### 2.2 基础设施域

- **`oauth/`**: **极其重要的安全模块**。
  - **`acl/`**: 访问控制列表（Access Control List），定义了 Scope（作用域）和 Role（角色）。
  - **`providers/`**: 认证提供商的具体实现。
  - **`token.go`**: 处理 JWT 令牌的签发与验证。
- **`trace/`**: 可观测性模块。记录 AI 思考过程、Token 消耗和执行步骤 (`events.go`, `logs.go`)。
- **`dsl/`**: 处理 Yao 特有的 DSL (Domain Specific Language) 转换与解析接口。

### 2.3 入口与配置

- **`openapi.go`**: 整个模块的入口。通常包含路由注册、中间件加载等初始化逻辑。
- **`config.go`**: 配置加载，读取关于 API 路径、端口等系统配置。

---

## 3\. 核心模块深度解析

### 3.1 安全认证主线 (`openapi/oauth`)

Yao 的系统 API 采用了一套完善的 OAuth2 风格认证机制。

- **设计理念**: 基于 Scope 的权限控制。
- **关键文件**:
  - `openapi/oauth/guard.go`: 这是一个中间件（Middleware），用于拦截请求，校验 Token，并根据请求的资源检查 ACL 权限。
  - `openapi/oauth/acl/enforce.go`: 具体的权限执行逻辑，判断 User 是否拥有某个 Resource 的 Operation 权限。
- **学习建议**: 阅读 `acl` 目录下的 `DESIGN.md` (如果存在) 或 `acl.go`，理解 Yao 是如何将 API 路由映射到权限点的。

### 3.2 AI 对话主线 (`openapi/chat` & `openapi/agent`)

这是构建 AI 应用的核心。

- **通信机制**: 大量使用了 Server-Sent Events (SSE) 进行流式输出，因为 AI 响应通常是渐进式的。
- **关键文件**:
  - `openapi/chat/chat.go`: 处理 `/chat` 路由，接收用户输入。
  - `openapi/chat/completions.go`: 对接底层 LLM（大语言模型）接口，封装 Prompt 并调用。
- **MCP 集成**: 观察 `openapi/mcp` 目录，了解 Chat 模块如何在运行时动态调用外部工具（Tools），这是 Agent 能够“联网”或“操作数据库”的关键。

### 3.3 RAG 知识库主线 (`openapi/kb`)

知识库是 Yao 区别于普通 Web 框架的亮点。

- **流程**:
  1.  **Ingest (摄入)**: `addfile.go` 接收文件 -\> 调用 `convert` 模块转文本。
  2.  **Chunking (切片)**: 将文本切分为块 (Chunk)。
  3.  **Embedding (向量化)**: 调用 Embedding 模型生成向量。
  4.  **Indexing (存储)**: 存入向量数据库（如 Qdrant, Milvus 等，位于 `yao/stores` 或 `gou` 库中）。
- **API**: `search.go` 提供了混合检索（Hybrid Search）的接口，结合了关键词搜索和向量搜索。

---

## 4\. 开发入门指南

如果想基于此代码库进行二次开发或 Debug，请遵循以下步骤：

1.  **环境搭建**:
    - 确保安装 Go 1.20+。
    - 查看 `Makefile`，通常包含 `make test` 或 `make run` 指令。
    - 查看 `go.mod` 了解依赖关系，特别是对 `yaoapp/gou` (运行时核心) 和 `yaoapp/xun` (ORM核心) 的依赖。

2.  **阅读入口**:
    从 `openapi/openapi.go` 开始。查找 `func Start()` 或 `func Load()` 之类的函数，弄清楚 HTTP 路由是如何注册到 Gin 或 Fiber 引擎上的。

    ```go
    // 伪代码示例，寻找类似逻辑
    func Load(router *gin.Engine) {
        group := router.Group("/api/v1")
        group.Use(oauth.Guard()) // 鉴权中间件
        group.POST("/chat", chat.Handler)
    }
    ```

3.  **调试重点**:
    - **Trace**: 关注 `openapi/trace`。当你觉得 AI 回答很慢或者逻辑不对时，这个模块负责记录每一步的耗时和输入输出。
    - **Tests**: 目录下的 `openapi/tests/` 非常丰富。例如 `openapi/tests/chat_test.go` 或 `openapi/tests/kb/collection_test.go`。**运行这些单元测试是理解 API 输入输出格式的最快方式。**

## 5\. 总结

`yao/openapi` 是 Yao 作为一个 **AI 原生应用引擎** 的“控制面”。它不像传统的 CRUD API 那样简单，而是融合了复杂的 **长连接管理（SSE）、大文件处理（RAG Pipeline）和 细粒度权限控制（ACL）**。

**建议的学习路径：**

1.  先看 `openapi/tests` 下的测试用例，理解 API 怎么用。
2.  阅读 `openapi/oauth/guard.go` 理解请求是如何被保护的。
3.  深入 `openapi/chat` 和 `openapi/kb` 理解 AI 业务逻辑流。
