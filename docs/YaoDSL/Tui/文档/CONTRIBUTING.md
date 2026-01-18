# TUI 开发规范

## 代码规范

### 命名规范

#### 文件命名

- 使用小写字母和下划线: `model_test.go`
- 测试文件: `*_test.go`
- 组件文件: `components/header.go`

#### 变量命名

- 使用驼峰命名: `userName`
- 常量使用大写: `DefaultTimeout`
- 导出变量首字母大写: `Model`
- 私有变量首字母小写: `stateMu`

#### 函数命名

- 使用驼峰命名: `GetState()`
- 导出函数首字母大写: `Load()`
- 私有函数首字母小写: `applyState()`
- 测试函数: `TestXxx()`
- 基准测试: `BenchmarkXxx()`

### 注释规范

#### 包注释

```go
// Package tui provides Terminal User Interface engine for Yao.
//
// TUI engine allows developers to define terminal UIs through JSON/YAML
// configuration files (.tui.yao), supporting declarative UI layout,
// reactive state management, and JavaScript/TypeScript scripting.
package tui
```

#### 函数注释

```go
// Load scans the tuis/ directory and loads all .tui.yao configuration files.
// It parses JSON configs, converts file paths to TUI IDs, and caches them.
//
// Returns an error if directory scanning or JSON parsing fails.
func Load() error {
    // ...
}
```

#### 结构体注释

```go
// Model implements the Bubble Tea tea.Model interface.
// It manages the reactive state and handles the message loop.
type Model struct {
    // Config is the parsed .tui.yao configuration
    Config *Config

    // State holds the reactive data, protected by StateMu
    State map[string]interface{}

    // StateMu protects State for concurrent access
    StateMu sync.RWMutex
}
```

### 错误处理

#### 错误类型

```go
// 定义自定义错误类型
type ErrorMsg struct {
    Err     error
    Context string
}

func (e ErrorMsg) Error() string {
    return fmt.Sprintf("[TUI Error in %s] %v", e.Context, e.Err)
}
```

#### 错误传递

```go
// 包装错误，添加上下文
if err != nil {
    return fmt.Errorf("failed to load script %s: %w", file, err)
}

// 在 Bubble Tea 消息循环中返回错误消息
return m, func() tea.Msg {
    return ErrorMsg{Err: err, Context: "script execution"}
}
```

### 并发安全

#### 使用读写锁

```go
// 读操作
m.StateMu.RLock()
value := m.State[key]
m.StateMu.RUnlock()

// 写操作
m.StateMu.Lock()
m.State[key] = value
m.StateMu.Unlock()
```

#### 避免死锁

```go
// ❌ 错误：在持有锁时调用可能阻塞的操作
m.StateMu.Lock()
result := longRunningOperation()  // 可能死锁
m.State["result"] = result
m.StateMu.Unlock()

// ✅ 正确：先释放锁
m.StateMu.Lock()
data := m.State["data"]
m.StateMu.Unlock()

result := longRunningOperation()

m.StateMu.Lock()
m.State["result"] = result
m.StateMu.Unlock()
```

---

## 测试规范

### 单元测试

#### 测试结构

```go
func TestLoad(t *testing.T) {
    // Arrange - 准备测试环境
    SetupTest(t)
    defer TeardownTest(t)

    // Act - 执行被测试代码
    err := Load()

    // Assert - 验证结果
    assert.NoError(t, err)
    assert.NotNil(t, Tuos)
}
```

#### Table-Driven Tests

```go
func TestGetState(t *testing.T) {
    tests := []struct {
        name     string
        initial  map[string]interface{}
        key      string
        expected interface{}
    }{
        {"existing key", map[string]interface{}{"foo": "bar"}, "foo", "bar"},
        {"missing key", map[string]interface{}{}, "foo", nil},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            model := &Model{State: tt.initial}
            result := model.GetState(tt.key)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

### 基准测试

```go
func BenchmarkRenderLayout(b *testing.B) {
    model := setupBenchmarkModel()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        model.View()
    }
}
```

### 测试覆盖率

```bash
# 运行测试并生成覆盖率报告
go test ./tui/... -coverprofile=coverage.out

# 查看覆盖率
go tool cover -func=coverage.out

# 生成 HTML 报告
go tool cover -html=coverage.out -o coverage.html
```

---

## Git 规范

### 分支命名

- 功能分支: `feature/tui-table-component`
- 修复分支: `fix/tui-memory-leak`
- 文档分支: `docs/tui-api-reference`

### 提交信息

#### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具

#### 示例

```
feat(tui): add table component

- Implement table component using bubbles/table
- Support column definition and data binding
- Add pagination and sorting
- Write unit tests

Closes #123
```

### Pull Request

#### PR 标题

```
[TUI] Add table component
```

#### PR 描述模板

```markdown
## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 性能优化
- [ ] 重构

## 变更说明

简要描述本次变更的内容和原因。

## 测试

- [ ] 添加了单元测试
- [ ] 添加了集成测试
- [ ] 手动测试通过

## 检查清单

- [ ] 代码遵循项目规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 测试覆盖率 >= 85%
- [ ] CI 通过
```

---

## 性能规范

### 性能目标

| 操作            | 目标       | 测量方式  |
| --------------- | ---------- | --------- |
| ModelUpdate     | < 100ns/op | Benchmark |
| RenderLayout    | < 10µs/op  | Benchmark |
| StateRead       | < 50ns/op  | Benchmark |
| StateWrite      | < 100ns/op | Benchmark |
| ScriptExecution | < 1ms/op   | Benchmark |

### 性能优化建议

#### 1. 避免频繁的内存分配

```go
// ❌ 错误：每次调用都分配新切片
func getUsers() []User {
    users := []User{}
    // ...
    return users
}

// ✅ 正确：复用切片
var usersPool = sync.Pool{
    New: func() interface{} {
        return make([]User, 0, 100)
    },
}

func getUsers() []User {
    users := usersPool.Get().([]User)
    defer usersPool.Put(users[:0])
    // ...
    return users
}
```

#### 2. 使用缓存

```go
// 缓存渲染结果
var renderCache sync.Map

func (m *Model) RenderComponent(c Component) string {
    key := c.ID()
    if cached, ok := renderCache.Load(key); ok {
        if !c.isDirty() {
            return cached.(string)
        }
    }

    result := c.Render()
    renderCache.Store(key, result)
    return result
}
```

#### 3. 减少锁竞争

```go
// ❌ 错误：长时间持有锁
m.StateMu.Lock()
defer m.StateMu.Unlock()

for _, item := range items {
    processItem(item)  // 耗时操作
    m.State[item.key] = item.value
}

// ✅ 正确：缩小锁范围
updates := make(map[string]interface{})
for _, item := range items {
    processItem(item)
    updates[item.key] = item.value
}

m.StateMu.Lock()
for k, v := range updates {
    m.State[k] = v
}
m.StateMu.Unlock()
```

---

## 安全规范

### 输入验证

```go
// 验证用户输入
func SanitizeInput(input string) string {
    // 移除危险字符
    input = strings.ReplaceAll(input, "\x00", "")
    input = strings.TrimSpace(input)

    // 限制长度
    if len(input) > 1000 {
        input = input[:1000]
    }

    return input
}
```

### 脚本执行安全

```go
// 设置执行超时
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := script.ExecuteWithContext(ctx, method, args...)
```

### 资源限制

```go
// 限制并发实例数
const MaxInstances = 10

var instanceCount int64

func NewModel(cfg *Config, args map[string]interface{}) (*Model, error) {
    if atomic.LoadInt64(&instanceCount) >= MaxInstances {
        return nil, errors.New("too many TUI instances")
    }

    atomic.AddInt64(&instanceCount, 1)
    // ...
}
```

---

## 文档规范

### API 文档

使用 godoc 格式：

```go
// GetState retrieves a value from the reactive state.
//
// If the key exists, it returns the value; otherwise, it returns nil.
// This method is thread-safe and can be called from multiple goroutines.
//
// Example:
//   value := model.GetState("username")
//   if value != nil {
//       username := value.(string)
//   }
func (m *Model) GetState(key string) interface{} {
    m.StateMu.RLock()
    defer m.StateMu.RUnlock()
    return m.State[key]
}
```

### README 文档

每个子模块应有 README：

```markdown
# Components

标准 TUI 组件库。

## 可用组件

- Header: 标题栏
- Table: 数据表格
- Form: 表单输入
- Chat: AI 聊天

## 使用示例

见各组件的源代码注释。
```

---

## 工具配置

### VS Code 配置

`.vscode/settings.json`:

```json
{
  "go.testFlags": ["-v", "-race"],
  "go.testTimeout": "60s",
  "go.coverOnSave": true,
  "go.lintOnSave": "workspace"
}
```

### golangci-lint 配置

`.golangci.yml`:

```yaml
linters:
  enable:
    - gofmt
    - golint
    - govet
    - errcheck
    - staticcheck
    - gosec
```

---

**遵守这些规范，确保代码质量和团队协作效率！**
