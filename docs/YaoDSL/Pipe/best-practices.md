# 最佳实践

本节提供了使用 Pipe 时的最佳实践建议，包括设计模式、性能优化、安全考虑和常见陷阱的避免方法。

## 设计原则

### 1. 单一职责原则

每个 Pipe 应该专注于一个特定的业务功能，避免过于复杂的单体设计。

```yaml
# ✅ 好的做法：功能专一
name: "user-authentication"
label: "用户认证"
nodes:
  - name: "validate-credentials"
    process:
      name: "auth.validate"
  - name: "generate-token"
    process:
      name: "auth.create_token"
  - name: "update-last-login"
    process:
      name: "user.update_last_login"

# ❌ 避免：功能混杂
name: "do-everything"
nodes:
  - name: "auth"
  - name: "data-processing"
  - name: "ai-analysis"
  - name: "report-generation"
```

### 2. 可测试性

设计时考虑测试的便利性，使用白名单限制 Process 调用。

```yaml
# ✅ 好的做法：明确的白名单
whitelist:
  - "auth.*"
  - "user.*"
  - "utils.*"

nodes:
  - name: "validate"
    process:
      name: "auth.validate"  # ✅ 在白名单中

# ❌ 避免：过于宽泛的白名单
whitelist:
  - "*"  # 危险：允许所有 Process
```

### 3. 错误处理优先级

优先使用 Switch 节点进行错误处理，而不是依赖异常。

```yaml
# ✅ 好的做法：使用 Switch 处理错误
- name: 'process-data'
  process:
    name: 'data.process'
    args: ['{{ $in[0] }}']

- name: 'handle-result'
  switch:
    '{{ $out.success == true }}':
      name: 'success-path'
      nodes:
        - name: 'save-result'
          process:
            name: 'data.save'
    default:
      name: 'error-path'
      nodes:
        - name: 'log-error'
          process:
            name: 'log.error'
            args: ['{{ $out.error }}']
```

## 性能优化

### 1. 表达式优化

#### 避免重复计算

```yaml
# ✅ 好的做法：使用临时变量
- name: "calculate"
  process:
    name: "math.calculate"
    args:
      - "{{ $in[0] }}"
      - "{{ let result = $in[0] * $in[1]; result }}"  # 计算一次
  output:
    result: "{{ $out }}"
    square: "{{ $out * $out }}"  # 复用结果

# ❌ 避免：重复计算
output:
  result: "{{ $in[0] * $in[1] }}"
  square: "{{ ($in[0] * $in[1]) * ($in[0] * $in[1]) }}"  # 重复计算
```

#### 简化复杂表达式

```yaml
# ✅ 好的做法：分步计算
- name: "step1"
  process:
    name: "utils.step1"
    args: ["{{ $in[0] }}"]

- name: "step2"
  process:
    name: "utils.step2"
    args: ["{{ $out[0] }}"]

# ❌ 避免：过于复杂的单行表达式
output: "{{ complex_function($in[0], $in[1], $in[2], calculate($in[3]), process($in[4])) }}"
```

### 2. 数据流优化

#### 及时清理大对象

```yaml
# ✅ 好的做法：处理完大对象后清理
- name: "process-large-data"
  process:
    name: "data.process_large"
    args: ["{{ $in[0] }}"]
  output:
    summary: "{{ $out.summary }}"
    # 不保存完整的大对象

- name: "cleanup"
  process:
    name: "data.cleanup"
    args: ["{{ $in[0].id }}"]  # 只传递 ID

# ❌ 避免：在上下文中保留大对象
output:
  large_data: "{{ $out }}"  # 大对象会保留在整个执行过程中
```

#### 使用流式处理

```yaml
# ✅ 好的做法：流式 AI 处理
- name: 'ai-stream'
  prompts:
    - role: 'user'
      content: '{{ $in[0] }}'
  options:
    stream: true # 启用流式处理
  output: '{{ $out.choices[0].message.content }}'
```

### 3. 节点设计优化

#### 合理的节点粒度

```yaml
# ✅ 好的做法：适当的节点粒度
nodes:
  - name: "validate-input"
    process:
      name: "validation.check"

  - name: "transform-data"
    process:
      name: "transform.apply"

  - name: "save-result"
    process:
      name: "storage.save"

# ❌ 避免：过于细分的节点
nodes:
  - name: "step1"
  - name: "step2"
  - name: "step3"
  - name: "step4"
  - name: "step5"
  # 过多的小节点增加开销
```

## 安全考虑

### 1. Process 白名单

#### 最小权限原则

```yaml
# ✅ 好的做法：精确的白名单
whitelist:
  - "user.read"
  - "user.update_profile"
  - "auth.validate_token"
  - "utils.format_date"

# ❌ 避免：过于宽泛
whitelist:
  - "user.*"     # 允许所有用户相关操作
  - "system.*"   # 危险：系统级操作
```

#### 定期审查白名单

```yaml
# 定期检查是否所有列出的 Process 都被使用
whitelist:
  'user.read': true # ✅ 被使用
  'user.update': true # ✅ 被使用
  'old.deprecated': false # ❌ 未被使用，应该移除
```

### 2. 输入验证

#### 所有输入都要验证

```yaml
# ✅ 好的做法：专门的验证节点
- name: 'validate-input'
  process:
    name: 'validation.comprehensive'
    args:
      - '{{ $in[0] }}'
      - 'email_pattern' # 验证规则
      - 'required_fields' # 必填字段
  output:
    is_valid: '{{ $out.valid }}'
    errors: '{{ $out.errors }}'
    cleaned_data: '{{ $out.cleaned }}'

- name: 'handle-validation'
  switch:
    '{{ $out.is_valid == true }}':
      name: 'process-data'
    default:
      name: 'return-errors'
```

#### 防止注入攻击

```yaml
# ✅ 好的做法：使用安全的 Process
- name: 'safe-process'
  process:
    name: 'utils.safe_eval' # 安全的表达式求值
    args: ['{{ $in[0] }}']

# ❌ 避免：直接执行用户输入
- name: 'dangerous-process'
  process:
    name: 'system.exec' # 危险：直接执行系统命令
    args: ['{{ $in[0] }}'] # 可能包含恶意命令
```

### 3. 数据脱敏

```yaml
# ✅ 好的做法：敏感数据脱敏
- name: "log-user-action"
  process:
    name: "log.info"
    args:
      - "User action: {{ $in[0].user_id }}"
      - "{{ mask_sensitive_data($in[0]) }}"  # 脱敏函数

# ❌ 避免：记录敏感信息
output:
  user_data: "{{ $in[0] }}"  # 包含密码、token 等敏感信息
```

## 可维护性

### 1. 文档化

#### 使用清晰的命名

```yaml
# ✅ 好的做法：描述性命名
name: "user-registration-with-email-verification"
nodes:
  - name: "validate-user-input"
  - name: "check-email-uniqueness"
  - name: "create-user-record"
  - name: "send-verification-email"

# ❌ 避免：模糊的命名
name: "proc1"
nodes:
  - name: "n1"
  - name: "n2"
  - name: "n3"
```

#### 添加注释和描述

```yaml
name: 'order-processing'
label: '订单处理流程'
description: |
  处理用户订单的完整流程，包括：
  1. 订单验证
  2. 库存检查
  3. 支付处理
  4. 订单确认

nodes:
  # 步骤1：验证订单信息的完整性
  - name: 'validate-order'
    label: '订单验证'
    process:
      name: 'order.validate'
      args:
        - '{{ $in[0] }}' # 订单数据
        - 'strict' # 验证模式
```

### 2. 模块化设计

#### 使用子 Pipe

```yaml
# ✅ 好的做法：将复杂逻辑分解为子 Pipe
name: 'user-onboarding'
nodes:
  - name: 'user-registration'
    switch:
      "{{ $in[0].type == 'email' }}":
        name: 'email-flow'
        nodes:
          - name: 'execute-email-pipe'
            process:
              name: 'pipes.email-registration' # 调用子 Pipe
      "{{ $in[0].type == 'social' }}":
        name: 'social-flow'
        nodes:
          - name: 'execute-social-pipe'
            process:
              name: 'pipes.social-registration'
```

#### 共享组件

```yaml
# 通用验证组件（common-validation.pip.yao）
name: "common-validation"
nodes:
  - name: "validate-email"
    process:
      name: "validation.email"
  - name: "validate-phone"
    process:
      name: "validation.phone"

# 在多个 Pipe 中复用
name: "user-registration"
nodes:
  - name: "run-common-validation"
    process:
      name: "pipes.common-validation"
      args: ["{{ $in[0] }}"]
```

### 3. 版本控制

#### 使用语义化版本

```yaml
name: 'payment-processor'
version: '1.2.0' # 遵循语义化版本
label: '支付处理器 v1.2.0'

changelog: |
  v1.2.0: 添加新的支付方式
  v1.1.0: 优化错误处理
  v1.0.0: 初始版本
```

## 测试策略

### 1. 单元测试

```go
// 测试单个节点的功能
func TestValidateNode(t *testing.T) {
    dsl := `
name: "test-validate"
whitelist: ["validation.email"]
nodes:
  - name: "validate"
    process:
      name: "validation.email"
      args: ["{{ $in[0] }}"]
`

    pipe, _ := New([]byte(dsl))
    ctx := pipe.Create()

    // 测试有效邮箱
    result, err := ctx.Exec("test@example.com")
    assert.NoError(t, err)
    assert.True(t, result.(map[string]interface{})["valid"].(bool))

    // 测试无效邮箱
    result, err = ctx.Exec("invalid-email")
    assert.NoError(t, err)
    assert.False(t, result.(map[string]interface{})["valid"].(bool))
}
```

### 2. 集成测试

```go
// 测试完整的流程
func TestUserRegistrationFlow(t *testing.T) {
    dsl := `
name: "user-registration-test"
whitelist: ["user.*", "validation.*"]
nodes:
  - name: "validate-input"
    process:
      name: "validation.user_data"
  - name: "create-user"
    process:
      name: "user.create"
`

    pipe, _ := New([]byte(dsl))
    ctx := pipe.Create()

    userData := map[string]interface{}{
        "email": "test@example.com",
        "name": "Test User",
        "password": "secure123",
    }

    result, err := ctx.Exec(userData)
    assert.NoError(t, err)
    assert.NotEmpty(t, result.(map[string]interface{})["user_id"])
}
```

### 3. 错误场景测试

```go
func TestErrorHandling(t *testing.T) {
    dsl := `
name: "error-test"
whitelist: ["test.error_process"]
nodes:
  - name: "error-process"
    process:
      name: "test.error_process"
  - name: "handle-error"
    switch:
      "{{ $out.error != null }}":
        name: "error-branch"
        nodes:
          - name: "log-error"
            process:
              name: "log.error"
              args: ["{{ $out.error }}"]
`

    pipe, _ := New([]byte(dsl))
    ctx := pipe.Create()

    // 测试错误处理
    result, err := ctx.Exec("trigger-error")
    assert.NoError(t, err)
    // 验证错误被正确处理
}
```

## 监控和调试

### 1. 执行日志

```yaml
# ✅ 好的做法：添加日志节点
name: 'monitored-process'
nodes:
  - name: 'log-start'
    process:
      name: 'log.info'
      args: ['Process started: {{ $pipe.Name }}']

  - name: 'main-process'
    process:
      name: 'business.process'
      args: ['{{ $in[0] }}']

  - name: 'log-completion'
    process:
      name: 'log.info'
      args: ['Process completed with result: {{ $json($out) }}']
```

### 2. 性能监控

```yaml
# 添加性能监控节点
- name: 'start-timer'
  process:
    name: 'timer.start'
    args: ['{{ $pipe.Name }}']

- name: 'business-logic'
  process:
    name: 'business.process'

- name: 'end-timer'
  process:
    name: 'timer.end'
    args: ['{{ $pipe.Name }}']
  output:
    execution_time: '{{ $out.duration }}'
    performance_ok: '{{ $out.duration < 5000 }}' # 5秒阈值
```

### 3. 状态检查

```go
// 定期检查活跃的上下文
func monitorContexts() {
    contexts.Range(func(key, value interface{}) bool {
        ctx := value.(*Context)

        // 检查超时的上下文
        if time.Since(ctx.startTime) > 30*time.Minute {
            log.Warn("Context %s is running too long, consider closing", key)
        }

        return true
    })
}
```

## 常见陷阱和避免方法

### 1. 循环引用

```yaml
# ❌ 危险：可能导致无限循环
- name: 'node1'
  goto: 'node2'

- name: 'node2'
  goto: 'node1' # 循环引用

# ✅ 安全：使用条件跳出循环
- name: 'process-item'
  process:
    name: 'data.process'
    args: ['{{ $in[0] }}']
  goto: "{{ $out.has_more ? 'process-item' : 'EOF' }}" # 条件终止
```

### 2. 内存泄漏

```yaml
# ❌ 避免：在上下文中积累大量数据
- name: 'process-large-file'
  process:
    name: 'file.process'
  output:
    large_content: '{{ $out.content }}' # 保留大文件内容

# ✅ 好的做法：及时清理
- name: 'process-large-file'
  process:
    name: 'file.process'
  output:
    summary: '{{ $out.summary }}'
    file_id: '{{ $out.id }}' # 只保留引用
```

### 3. 并发问题

```go
// ✅ 好的做法：每个执行使用独立的上下文
func handleRequest(request Request) {
    ctx := pipe.Create()  // 新的上下文
    defer pipe.Close(ctx.id)

    result := ctx.Run(request.data)
    // 处理结果
}

// ❌ 避免：共享上下文可能导致数据竞争
var sharedContext *Context  // 危险：全局共享
```

## 部署建议

### 1. 环境隔离

```yaml
# ✅ 好的做法：根据环境配置不同的行为
name: 'adaptive-process'
nodes:
  - name: 'get-config'
    process:
      name: 'config.get'
      args: ['{{ $global.environment }}']

  - name: 'process-with-config'
    process:
      name: 'business.process'
      args:
        - '{{ $in[0] }}'
        - '{{ $out }}' # 环境特定配置
```

### 2. 配置外部化

```yaml
# ✅ 好的做法：使用全局配置
name: 'configurable-process'
nodes:
  - name: 'get-threshold'
    input:
      - '{{ $global.processing_threshold ?? 100 }}' # 默认阈值

  - name: 'apply-logic'
    switch:
      '{{ $in[0] > $processing_threshold }}':
        name: 'high-volume'
      default:
        name: 'normal-volume'
```

### 3. 回滚策略

```yaml
# ✅ 好的做法：支持回滚
name: 'safe-update'
nodes:
  - name: 'create-backup'
    process:
      name: 'backup.create'
      args: ['{{ $in[0] }}']

  - name: 'perform-update'
    process:
      name: 'data.update'
      args: ['{{ $in[0] }}']

  - name: 'verify-update'
    switch:
      '{{ $out.success != true }}':
        name: 'rollback'
        nodes:
          - name: 'restore-backup'
            process:
              name: 'backup.restore'
              args: ['{{ $global.backup_id }}']
```

通过遵循这些最佳实践，您可以构建更安全、更高效、更可维护的 Pipe 应用程序。
