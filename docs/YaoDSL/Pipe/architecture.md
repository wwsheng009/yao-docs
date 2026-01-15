# 架构设计

Pipe 采用模块化的架构设计，各个组件职责清晰，便于维护和扩展。本节详细介绍 Pipe 的架构设计。

## 整体架构

```mermaid
graph TB
    subgraph "DSL Layer"
        A[Pipe DSL] --> B[YAML Parser]
        B --> C[Configuration Validator]
    end

    subgraph "Execution Engine"
        D[Pipe Engine] --> E[Context Manager]
        E --> F[Node Executor]
        F --> G[Expression Engine]
    end

    subgraph "Node Types"
        H[Process Node]
        I[AI Node]
        J[Switch Node]
        K[User Input Node]
        L[Request Node]
    end

    subgraph "Integration Layer"
        M[Yao Process]
        N[AI Services]
        O[User Interfaces]
        P[HTTP Services]
    end

    subgraph "Support Systems"
        Q[Security Layer]
        R[Storage Layer]
        S[Monitoring Layer]
    end

    A --> D
    F --> H
    F --> I
    F --> J
    F --> K
    F --> L

    H --> M
    I --> N
    K --> O
    L --> P

    D --> Q
    E --> R
    D --> S
```

## 核心组件架构

### 1. Pipe Core Engine

Pipe Core Engine 是整个系统的核心，负责协调各个组件的工作。

```go
// Pipe 结构体
type Pipe struct {
    // 配置信息
    ID        string
    Name      string
    Nodes     []Node
    Label     string
    Hooks     *Hooks
    Output    any
    Input     Input
    Whitelist Whitelist
    Goto      string

    // 运行时信息
    parent    *Pipe
    namespace string
    mapping   map[string]*Node
}
```

**职责：**

- DSL 解析和验证
- 节点关系管理
- 执行流程控制
- 安全策略实施

### 2. Context Manager

Context Manager 管理 Pipe 的执行上下文，是状态管理的核心。

```mermaid
graph LR
    A[Context Manager] --> B[Context Pool]
    A --> C[State Storage]
    A --> D[Session Manager]

    B --> E[Active Contexts]
    C --> F[Context Data]
    C --> G[Execution History]
    D --> H[Session Mapping]
```

**核心功能：**

```go
type Context struct {
    *Pipe                    // 关联的 Pipe
    id      string           // 唯一标识
    parent  *Context         // 父上下文
    context context.Context // Go context

    // 数据存储
    global  map[string]interface{}
    sid     string
    current *Node

    // 执行历史
    in      map[*Node][]any
    out     map[*Node]any
    history map[*Node][]Prompt

    // 输入输出
    input  []any
    output any
}
```

### 3. Node Executor

Node Executor 负责执行各种类型的节点。

```mermaid
graph TD
    A[Node Executor] --> B{Node Type}

    B -->|Process| C[Process Executor]
    B -->|AI| D[AI Executor]
    B -->|Switch| E[Switch Executor]
    B -->|User Input| F[User Input Executor]
    B -->|Request| G[Request Executor]

    C --> H[Yao Process Engine]
    D --> I[AI Service Interface]
    E --> J[Condition Evaluator]
    F --> K[UI Handler]
    G --> L[HTTP Client]
```

## 数据流架构

### 1. 数据流向

```mermaid
graph TD
    A[Input Data] --> B[Expression Engine]
    B --> C[Node Input Processor]
    C --> D[Node Executor]
    D --> E[Node Output Processor]
    E --> F[Context Storage]
    F --> G[Next Node Selector]
    G --> H{More Nodes?}

    H -->|Yes| C
    H -->|No| I[Final Output]

    B --> J[Global Variables]
    F --> K[Execution History]
```

### 2. 表达式处理流程

```mermaid
graph LR
    A[Expression String] --> B[Parser]
    B --> C[Compiler]
    C --> D[Expression VM]
    D --> E[Data Binding]
    E --> F[Execution]
    F --> G[Result]

    H[Data Context] --> E
    I[Variables] --> E
    J[Functions] --> E
```

## 节点架构详情

### 1. Process Node

```mermaid
graph TD
    A[Process Node] --> B[Input Validation]
    B --> C[Whitelist Check]
    C --> D[Process Lookup]
    D --> E[Parameter Preparation]
    E --> F[Process Execution]
    F --> G[Output Processing]
    G --> H[Result Return]

    I[Whitelist Config] --> C
    J[Process Registry] --> D
    K[Expression Engine] --> E
```

### 2. AI Node

```mermaid
graph TD
    A[AI Node] --> B[Template Processing]
    B --> C[History Merging]
    C --> D[Prompt Construction]
    D --> E[AI Service Call]
    E --> F[Stream Handling]
    F --> G[Response Processing]
    G --> H[Result Return]

    I[Prompt Templates] --> D
    J[History Storage] --> C
    K[AI Provider] --> E
    L[Stream Buffer] --> F
```

### 3. Switch Node

```mermaid
graph TD
    A[Switch Node] --> B[Condition Evaluation]
    B --> C[Branch Selection]
    C --> D[SubPipe Creation]
    D --> E[Context Inheritance]
    E --> F[SubPipe Execution]
    F --> G[Result Integration]
    G --> H[Result Return]

    I[Expression Engine] --> B
    J[Branch Definitions] --> C
    K[Parent Context] --> E
```

## 安全架构

### 1. 多层安全防护

```mermaid
graph TD
    A[Security Layer] --> B[Whitelist Validation]
    A --> C[Input Sanitization]
    A --> D[Output Filtering]
    A --> E[Access Control]

    B --> F[Process Whitelist]
    B --> G[Function Whitelist]

    C --> H[Expression Validation]
    C --> I[Parameter Checking]

    D --> J[Data Masking]
    D --> K[Format Validation]

    E --> L[Context Isolation]
    E --> M[Permission Check]
```

### 2. 沙箱机制

```mermaid
graph LR
    A[Process Execution] --> B[Sandbox Container]
    B --> C[Resource Limits]
    B --> D[Permission Control]
    B --> E[Time Limit]

    C --> F[CPU Quota]
    C --> G[Memory Limit]

    D --> H[File Access]
    D --> I[Network Access]

    E --> J[Execution Timeout]
    E --> K[Response Timeout]
```

## 存储架构

### 1. Context 存储

```mermaid
graph TD
    A[Context Storage] --> B[Memory Store]
    A --> C[Persistent Store]

    B --> D[Active Contexts]
    B --> E[Temporary Data]
    B --> F[Session Cache]

    C --> G[Context Snapshots]
    C --> H[Execution Logs]
    C --> I[State History]

    D --> J[sync.Map]
    E --> K[In-Memory DB]
    F --> L[Redis Cache]

    G --> M[File System]
    H --> N[Log Files]
    I --> O[Database]
```

### 2. 数据生命周期

```mermaid
graph LR
    A[Context Created] --> B[Execution]
    B --> C[Data Collection]
    C --> D[Storage]
    D --> E[Completion]
    E --> F[Cleanup]

    G[Pause Event] --> H[State Save]
    H --> I[Context Persist]

    J[Resume Event] --> K[State Restore]
    K --> L[Context Reactivate]

    F --> M[Memory Release]
    I --> N[Disk Cleanup]
```

## 扩展架构

### 1. 插件系统

```mermaid
graph TD
    A[Plugin Manager] --> B[Node Plugins]
    A --> C[Processor Plugins]
    A --> D[Security Plugins]

    B --> E[Custom Nodes]
    B --> F[Third-party Nodes]

    C --> G[Custom Processors]
    C --> H[Data Transformers]

    D --> I[Validators]
    D --> J[Filters]
```

### 2. 接口设计

```go
// 节点执行器接口
type NodeExecutor interface {
    Execute(ctx *Context, input Input) (any, error)
    Validate() error
    GetType() string
}

// 表达式处理器接口
type ExpressionProcessor interface {
    Compile(expr string) (Program, error)
    Execute(program Program, data Data) (any, error)
}

// 存储接口
type ContextStorage interface {
    Store(id string, ctx *Context) error
    Load(id string) (*Context, error)
    Delete(id string) error
    List() []string
}
```

## 监控架构

### 1. 性能监控

```mermaid
graph TD
    A[Performance Monitor] --> B[Execution Metrics]
    A --> C[Resource Usage]
    A --> D[Error Tracking]

    B --> E[Execution Time]
    B --> F[Throughput]
    B --> G[Success Rate]

    C --> H[CPU Usage]
    C --> I[Memory Usage]
    C --> J[IO Operations]

    D --> K[Error Count]
    D --> L[Error Types]
    D --> M[Error Rates]
```

### 2. 日志系统

```mermaid
graph LR
    A[Log Manager] --> B[Execution Logs]
    A --> C[Error Logs]
    A --> D[Performance Logs]
    A --> E[Security Logs]

    B --> F[Structured Logs]
    C --> G[Error Stack Traces]
    D --> H[Metrics Data]
    E --> I[Security Events]
```

## 部署架构

### 1. 单机部署

```mermaid
graph TD
    A[Application] --> B[Pipe Engine]
    B --> C[Context Manager]
    B --> D[Node Executors]

    E[Yao Processes] --> B
    F[AI Services] --> B
    G[Database] --> B

    H[File System] --> I[Pipe Definitions]
    I --> B
```

### 2. 分布式部署

```mermaid
graph TD
    subgraph "Load Balancer"
        A[API Gateway]
    end

    subgraph "Application Servers"
        B[Pipe Engine 1]
        C[Pipe Engine 2]
        D[Pipe Engine N]
    end

    subgraph "Shared Services"
        E[Context Store]
        F[AI Service Cluster]
        G[Process Cluster]
        H[Database Cluster]
    end

    subgraph "External Services"
        I[Yao Processes]
        J[AI Providers]
        K[User Interfaces]
    end

    A --> B
    A --> C
    A --> D

    B --> E
    C --> E
    D --> E

    B --> F
    C --> F
    D --> F

    B --> G
    C --> G
    D --> G

    E --> H
    F --> H
    G --> H

    I --> G
    J --> F
    K --> B
    K --> C
    K --> D
```

## 性能优化架构

### 1. 缓存层

```mermaid
graph LR
    A[Application] --> B[Cache Layer]
    B --> C[Expression Cache]
    B --> D[Process Cache]
    B --> E[Template Cache]
    B --> F[Result Cache]

    G[Memory Cache] --> C
    G --> D
    G --> E

    H[Redis Cache] --> F

    I[Database] --> B
```

### 2. 连接池

```mermaid
graph TD
    A[Connection Pool Manager] --> B[AI Service Pool]
    A --> C[Process Pool]
    A --> D[Database Pool]

    B --> E[AI Connections]
    B --> F[Load Balancing]

    C --> G[Process Instances]
    C --> H[Resource Management]

    D --> I[DB Connections]
    D --> J[Transaction Management]
```

## 错误处理架构

### 1. 错误分类

```mermaid
graph TD
    A[Error Handler] --> B[Syntax Errors]
    A --> C[Runtime Errors]
    A --> D[Business Errors]
    A --> E[System Errors]

    B --> F[DSL Validation]
    B --> G[Expression Syntax]

    C --> H[Execution Failures]
    C --> I[Resource Issues]

    D --> J[Validation Errors]
    D --> K[Logic Errors]

    E --> L[Network Issues]
    E --> M[Service Unavailable]
```

### 2. 恢复机制

```mermaid
graph LR
    A[Error Detection] --> B[Error Classification]
    B --> C[Recovery Strategy]
    C --> D[Retry Mechanism]
    C --> E[Fallback Handler]
    C --> F[Graceful Degradation]

    D --> G[Exponential Backoff]
    E --> H[Alternative Path]
    F --> I[Limited Functionality]
```

这个架构设计为 Pipe 提供了强大的扩展性、高性能和良好的可维护性。各个组件之间职责清晰，接口标准，便于未来的功能扩展和性能优化。
