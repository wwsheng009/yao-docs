---
name: table
description: Analysis of Yao Table Widget architecture and configuration, focusing on DSL mapping, binding mechanisms, and "Convention over Configuration".
license: Complete terms in LICENSE.txt
---

# Yao Table Widget 技术架构与配置分析报告

## 1\. 核心架构概述

Yao 的 Table Widget 是一个高度封装的数据展示和交互组件。在底层，它通过 Golang 定义了一套严格的 DSL 结构（`types.go`），并在运行时（`table.go`）将 JSON 配置解析为内存中的 Go 结构体。

其核心设计哲学是 **"Convention over Configuration"（约定优于配置）**，这在 `admin.tab.json` 中体现得淋漓尽致。

## 2\. 配置文件分析：`admin.tab.json`

在 `yao-dev-app` 中，`tables/admin.tab.json` 的内容非常精简：

```json
{
  "name": "::User Admin",
  "action": {
    "bind": { "model": "admin.user", "option": { "form": "admin" } }
  }
}
```

### 2.1 绑定机制 (Binding Mechanism)

这是 Yao 引擎最强大的特性之一。

- **配置项**: `action.bind`
- **源码对应**: `widgets/table/types.go` 中的 `BindActionDSL` 结构体。
  ```go
  type BindActionDSL struct {
      Model  string                 `json:"model,omitempty"`  // 绑定数据模型
      Store  string                 `json:"store,omitempty"`  // 绑定存储
      Table  string                 `json:"table,omitempty"`  // 绑定其他表格
      Form   string                 `json:"form,omitempty"`   // 绑定表单
      Option map[string]interface{} `json:"option,omitempty"` // 绑定选项
  }
  ```
- **技术解析**:
  当 Yao 引擎加载此文件时，`table.go` 中的 `parse` 方法会被调用。该方法会检测 `Bind` 字段。如果存在绑定，引擎会自动读取 `admin.user` 模型（Model）的定义来生成表格的字段（Fields）和列表查询逻辑，同时读取 `admin` 表单（Form）的定义来生成编辑和查看页面的布局。
  这意味着开发者无需手动编写冗长的 `fields` 和 `layout` 定义，引擎会在内存中自动补全 `DSL` 结构体。

## 3\. 源码实现深度解析

### 3.1 数据结构定义 (`types.go`)

`types.go` 定义了表格组件的完整 Schema。即使你在 JSON 中只写了 `bind`，最终在内存中生成的对象依然是完整的 `DSL` 结构：

- **`DSL`**: 根结构，包含 `Action` (行为), `Layout` (布局), `Fields` (字段定义) 以及 `Mapping` (数据映射)。
- **`ActionDSL`**: 定义了 CRUD 操作的处理器。例如 `Search`, `Find`, `Save` 等。每个操作都是一个 `action.Process`，这意味着它们可以映射到任何 Yao 处理器（如 `models.admin.user.Find` 或自定义的 Flow/Script）。
- **`LayoutDSL`**: 定义了前端界面的骨架，包括 `Header` (顶栏操作), `Filter` (筛选栏), `Table` (数据表格区域)。

### 3.2 加载与解析流程 (`table.go`)

`table.go` 管理着 Widget 的生命周期。

1.  **加载 (Load)**: `Load` 函数扫描 `tables` 目录，识别 `.tab.yao`, `.tab.json` 等后缀文件。
2.  **解析 (Parse)**: `load` 函数调用 `application.Parse` 将文件内容反序列化为 `DSL` 结构体。
3.  **构建 (Construct)**:
    关键代码在 `parse` 方法中：

    ```go
    // table.go
    func (dsl *DSL) parse(id string) error {
        // ... 初始化默认值 ...

        // Bind model / store / table / ...
        // 这里是"魔法"发生的地方，根据 bind 配置自动生成缺省配置
        err := dsl.Bind()
        if err != nil {
            return fmt.Errorf("[Table] LoadData Bind %s %s", id, err.Error())
        }
        // ... 验证与映射 ...
    }
    ```

4.  **Xgen 生成**: `Xgen` 方法将处理后的 DSL 转换为前端 Xgen 引擎可理解的 JSON 配置，这解释了为什么后端简单的配置能渲染出复杂的前端页面。

### 3.3 运行时逻辑 (`process.go`)

`process.go` 注册了一系列名为 `yao.table.*` 的处理器，这些是前端与后端交互的桥梁。

- **`yao.table.search`**: 处理列表查询。它会调用 DSL 中定义的 `Action.Search` 过程。
- **`yao.table.save`**: 处理保存操作。
- **`yao.table.setting`**: 返回表格的配置信息（即 `Xgen` 方法的输出），前端根据这个响应来渲染界面。

例如，`processDownload` 函数展示了严格的安全控制：

```go
// process.go
func processDownload(process *gouProcess.Process) interface{} {
    // ...
    // 检查文件扩展名白名单
    if _, has := fs.DownloadWhitelist[ext]; !has {
        exception.New("%s.%s .%s file does not allow", 403, tab.ID, field, ext).Throw()
    }
    // JWT 权限验证
    claims := helper.JwtValidate(tokenString)
    // ...
}
```

## 4\. 总结

`yao-dev-app` 中的 `admin.tab.json` 实际上利用了 Yao 引擎的 **智能绑定（Auto-Binding）** 能力。

1.  **静态定义**: 你提供最小化的元数据（Model 和 Form 的名称）。
2.  **动态生成**: Yao 引擎在启动时，通过 `table.go` 中的逻辑，读取引用的 Model 和 Form，动态构建出完整的 `types.go/DSL` 结构体。
3.  **运行时交互**: 前端通过 `process.go` 暴露的 API 获取这个动态生成的配置，并进行数据交互。

这种设计极大地减少了样板代码，体现了 Golang 在构建高性能、高抽象层级低代码平台时的优势。

如果你需要查看 `Bind()` 方法具体的填充逻辑（例如它如何将 Model 字段映射为 Table Column），我们需要查看 `widgets/table` 对应的绑定实现代码（通常在 `widgets/table` 或引用的 `component` 包中），目前的上下文已足够解释其核心机制。

# Yao Table Widget 配置深度分析：Env 与 Session

## 1\. 概述

在 Yao 应用架构中，`tables/` 目录下的 `.tab.json` 文件定义了管理后台的数据交互界面。`env`（环境变量/配置）和 `session`（用户会话）是典型的系统级数据模型。

结合 `widgets/table/types.go` 和 `table.go` 的源码分析，这两个配置文件主要利用了 Yao 的 **动态绑定（Dynamic Binding）** 特性，将底层的存储模型（Model）直接映射为可视化的管理表格。

## 2\. 环境变量管理：`env.tab.json`

此表格通常用于管理系统的动态配置项（如 API Key、系统开关等）。

### 2.1 配置结构推演

根据 `admin.tab.json` 的模式，`env.tab.json` 的核心配置极有可能如下所示：

```json
{
  "name": "系统配置",
  "action": {
    "bind": {
      "model": "env",
      "option": { "form": "env" }
    }
  }
}
```

### 2.2 技术深度解析

- **模型绑定 (`ActionDSL.Bind`)**:
  - 配置中的 `bind.model: "env"` 指令告诉 Yao 引擎去查找 `models/env.mod.json`。
  - **源码行为**: 在 `table.go` 的 `parse` 方法中，引擎会读取 `env` 模型的所有字段（如 `key`, `value`, `type`, `name`）。
  - **字段映射**:
    - 模型的 `key` 字段会自动映射为表格的一列，通常作为主键或索引列。
    - 模型的 `type` 字段（如 `enum`, `string`, `secret`）决定了表格列的展示方式。例如，如果 `type` 是 `secret`，Table Widget 会自动应用掩码（`******`）展示，这是由底层的 `fields` 映射逻辑处理的。

- **表单关联**:
  - `option.form: "env"` 确保了当用户点击“编辑”时，会打开对应的 `forms/env.form.json` 配置。这实现了列表视图（Table）与详情视图（Form）的无缝连接。

- **权限与安全**:
  - 对于 `env` 这种敏感数据，通常不需要 `create`（配置项通常由开发人员预置）或需要严格控制。在 `ActionDSL` 中，如果没有显式禁用 `create`，默认会根据绑定的模型生成创建按钮。开发者可以通过在 JSON 中添加 `"create": {}` 并设置 `guard` 来限制权限。

## 3\. 会话监控：`session.tab.json`

此表格用于监控当前登录用户的状态，进行强制下线等操作。

### 3.1 配置结构推演

```json
{
  "name": "会话管理",
  "action": {
    "bind": {
      "model": "session"
    },
    // 通常会话管理是只读的，或者只允许删除（踢出用户）
    "create": { "disabled": true }
  }
}
```

### 3.2 技术深度解析

- **只读与操作限制**:
  - **禁用创建**: Session 数据是由系统在用户登录时自动生成的（参考 `process.go` 中的 `yao.table.search` 并没有直接创建 session 的逻辑，session 创建通常在 `yao.login` 处理器中）。因此，在 `session.tab.json` 中通常会通过设置 `"create": {"disabled": true}` 来移除“新建”按钮。
  - **源码对应**: `widgets/table/types.go` 中的 `ActionDSL` 结构体包含了 `Create` 字段（类型为 `*action.Process`）。在 `table.go` 初始化时，如果检测到 `disabled: true`，则不会生成对应的 API 端点和前端按钮。

- **核心字段解析**:
  - `session` 模型通常包含 `id` (Session ID), `user_id` (关联用户), `client_ip`, `expire_at` 等字段。
  - **Hook 机制**: 这里的 `Delete` 操作非常关键。当管理员在表格中点击“删除”时，不仅是删除数据库记录，更重要的是要使得对应的 JWT Token 失效。Yao 引擎允许定义 `before:delete` 或 `after:delete` 钩子（Hook），在这里可以调用 Redis 清除缓存或调用 `session.invalidate` 处理器。

## 4\. 源码层面的通用处理流程

无论是 `env` 还是 `session`，它们都遵循 `widgets/table/process.go` 定义的标准处理流程：

1.  **Request**: 前端 Xgen 发起请求 `GET /api/__yao/table/env/search`。
2.  **Process**: `process.go` 中的 `processSearch` 函数被触发。
3.  **Action Execution**:
    - 函数内部调用 `tab.Action.Search.MustExec(process)`。
    - 由于我们使用了 `bind`，这里的 `Search` 动作实际上是代理给了 `models.env.Search` 或 `models.session.Search`。
4.  **Response**: 数据以 JSON 格式返回，包含分页信息 (`next`, `prev`) 和数据列表 (`data`)。

## 5\. 总结

`env.tab.json` 和 `session.tab.json` 展示了 Yao 引擎 **DSL 的极简主义**。

- **Env**: 侧重于数据的**读写与保密**（通过模型类型推断掩码）。
- **Session**: 侧重于数据的**时效性与动作控制**（禁用创建，侧重删除/踢人）。

通过修改这两个 JSON 文件，开发者可以在不编写任何 Go 代码的情况下，快速调整系统管理界面的行为，这正是 Yao 作为低代码 AI 引擎的核心优势所在。

# Yao Table Widget 深度配置分析 (`env.tab.json`)

## 1\. Action 区块：逻辑控制与拦截

`action` 区块不仅仅是简单的 CRUD 定义，它展示了 Yao 强大的 **AOP（面向切面编程）** 和 **处理流（Process Flow）** 集成能力。

```json
"action": {
    "bind": { "model": "pet", "option": { "withs": { "doctor": {} } } },
    "search": {
      "process": "scripts.pet.Search",
      "default": [null, 1, 10]
    },
    "before:search": "scripts.pet.BeforeSearch",
    "get": { "guard": "bearer-jwt,scripts.pet.Guard" },
    "find": { "guard": "-" }
}
```

### 1.1 自定义查询 (`search.process`)

- **默认行为覆盖**: 通常 `search` 操作由引擎自动处理。这里显式指定了 `process`: `"scripts.pet.Search"`。这意味着当用户在界面刷新列表时，引擎**不会**直接查询数据库，而是调用 `scripts/pet.js` 中的 `Search` 函数。
- **应用场景**: 这通常用于需要跨表聚合数据、调用外部 API 或进行复杂过滤逻辑后再返回数据的场景。
- **参数注入**: `default` 数组定义了传递给脚本的参数：
  1.  `null`: 初始的查询条件（QueryParam）。
  2.  `1`: 默认页码。
  3.  `10`: 每页数量。

### 1.2 钩子机制 (`Hooks`)

- **`before:search`**: 在执行 Search 之前触发。常用于强制追加查询条件（例如：强制加上 `user_id = 当前用户` 的多租户逻辑）。
- **`after:search`**: 在获得数据后、返回前端前触发。常用于数据脱敏或格式转换。

### 1.3 权限守卫 (`Guard`)

- **链式守卫**: `"guard": "bearer-jwt,scripts.pet.Guard"`。
  - Yao 支持中间件链。这里先验证标准的 JWT Token (`bearer-jwt`)，通过后，再执行自定义脚本 `scripts.pet.Guard` 进行更细粒度的权限判断（如检查用户是否是管理员）。
- **公开访问**: `"find": { "guard": "-" }`。
  - `"-"` 是一个特殊符号，表示**移除默认守卫**，使该接口变为公开（Public），无需登录即可访问。

## 2\. Layout 区块：界面交互与路由

Layout 定义了 Xgen 界面（Yao 的默认管理后台 UI）的骨架。

### 2.1 Header 预设与动作

```json
"header": {
  "preset": {
    "import": {
      "name": "pet",
      "operation": [{ "title": "跳转", "link": "$ENV.PAGE_LINK" }]
    }
  },
  "actions": [
    {
      "title": "页面跳转",
      "props": { "type": "history.push", "payload": "/404" }
    }
  ]
}
```

- **导入预设 (`import`)**: 仅仅配置 `name: "pet"`，Yao 就会自动生成 Excel 导入功能的 API 接口和界面按钮。底层会查找 `imports/pet.imp.json` 定义的映射规则。
- **前端路由动作**: `actions` 数组定义了顶部自定义按钮。
  - `type: "history.push"`: 这是一个前端动作（Client-side Action）。它告诉 Xgen 引擎在浏览器端进行路由跳转，而不是向后端发送请求。

### 2.2 Table Operation：行级操作

这是表格中最复杂也是最灵活的部分，定义了每一行数据的操作按钮。

```json
"operation": {
    "actions": [
      {
        "title": "治愈",
        "action": [
          {
            "name": "Save",
            "type": "Table.save",
            "payload": { "id": ":id", "status": "cured" }
          }
        ]
      }
    ]
}
```

- **原子更新 ("治愈"按钮)**:
  - 这个按钮演示了如何在不打开编辑窗口的情况下，直接更新某行数据的状态。
  - **`:id` 占位符**: Yao 会自动将当前行的主键 ID 填充到 `:id` 位置。
  - **Payload**: 点击按钮后，实际上向后端发送了一个保存请求，仅更新 `status` 字段为 `cured`。这体现了**低代码的高效性**——无需编写专门的 API endpoint。

- **弹窗交互 (`Common.openModal`)**:
  - `"type": "view"` 和 `"type": "edit"` 指定了弹窗加载的表单模式。引擎会自动复用 `forms/pet.form.json` 的配置，分别渲染为只读或可编辑状态。

## 3\. Fields 区块：数据映射与远程组件

`Fields` 将数据模型（Model）字段映射为 UI 组件。

### 3.1 过滤器映射 (`filter`)

```json
"名称": {
    "bind": "where.name.like",
    "edit": { ... }
}
```

- **DSL 驱动查询**: `bind: "where.name.like"` 是 Yao 的查询 DSL。当用户在搜索框输入 "Tom" 时，后端会自动将其转换为 SQL `WHERE name LIKE %Tom%`。开发者无需编写任何 SQL。

### 3.2 远程数据加载 (`xProps` & `$remote`)

这是 Yao 高级组件交互的核心。

```json
"入院状态": {
    "edit": {
      "type": "Select",
      "props": {
        "xProps": {
          "$remote": {
            "process": "models.pet.Get",
            "query": { "select": ["id", "name"] }
          }
        }
      }
    }
}
```

- **技术原理**:
  1.  **`xProps`**: 这是一个扩展属性，用于定义需要异步处理的属性。
  2.  **`$remote`**: 这是一个指令，告诉前端 Xgen 引擎：“在渲染这个组件之前，先调用后端的某个 Process 获取数据”。
  3.  **`process`**: 指定调用的处理器，这里直接调用了 Model 的通用接口 `models.pet.Get`。
  4.  **结果转换**: 前端收到 `id` 和 `name` 的列表后，会自动将其渲染为 `Select` 组件的 `options`（Value 为 id，Label 为 name）。
  <!-- end list -->
  - **优势**: 使得下拉菜单的数据源完全动态化，且复用了后端已有的逻辑，无需专门编写“获取宠物列表”的接口。

## 总结

这份 `env.tab.json` 文件是一个教科书级别的 Yao Table 配置示例，它展示了：

1.  **逻辑解耦**: 将复杂的搜索逻辑剥离到 JS 脚本 (`scripts.pet.Search`)。
2.  **安全控制**: 利用链式 Guard 确保数据安全。
3.  **前后端协同**: 通过 `xProps` 和 `$remote` 实现前端组件与后端数据的无缝连接。
4.  **DSL 表达力**: 通过简单的 JSON 配置实现了批量导入、快捷状态更新、路由跳转等复杂功能。

如果你需要深入了解 `scripts.pet.Search` 是如何在 Go 引擎（v8go）中被执行的，或者 `xProps` 在源码层面的解析逻辑，请随时告诉我。
