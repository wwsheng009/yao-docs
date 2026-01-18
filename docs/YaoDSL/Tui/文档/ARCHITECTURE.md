# TUI 引擎架构设计

## 1. 总体架构

### 1.1 设计理念

Yao TUI 引擎遵循以下核心原则：

- **声明式优先**: 通过 DSL 配置驱动 UI，减少命令式代码
- **响应式状态**: 单向数据流，State 驱动 View 更新
- **非阻塞执行**: 所有耗时操作异步执行，保持 UI 流畅
- **组件化设计**: 标准组件库 + 可扩展机制
- **AI 原生**: 深度集成 Yao 的 AIGC 能力
- **事件驱动**: 基于事件总线的组件通信机制
- **智能焦点管理**: Windows 风格的三阶段消息分发机制

### 1.2 技术栈

| 组件       | 技术            | 版本    | 作用                   |
| ---------- | --------------- | ------- | ---------------------- |
| TUI 框架   | Bubble Tea      | v0.25.0 | 事件循环和生命周期管理 |
| 样式系统   | Lip Gloss       | v0.9.1  | 终端样式和布局         |
| 组件库     | Bubbles         | v0.17.1 | 标准交互组件           |
| Markdown   | Glamour         | v0.6.0  | AI 内容渲染            |
| 表达式引擎 | expr-lang       | latest  | 模板语法和数据绑定     |
| JS 运行时  | V8Go (Yao 集成) | -       | 脚本执行               |
| 测试       | testify         | v1.8.4  | 单元测试               |

### 1.3 架构分层

```
┌─────────────────────────────────────────────┐
│          CLI Layer (cmd/tui.go)         │
│   命令行入口、参数解析、信号处理          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Process Layer (tui/process.go)      │
│   导出 Yao Process、与其他模块集成          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       Core Engine (tui/model.go)           │
│   Bubble Tea 生命周期、消息循环             │
│   - 状态管理（State + StateMu）          │
│   - 焦点管理（CurrentFocus）            │
│   - 事件总线（EventBus）                │
│   - 组件注册表（Components）             │
└─────────────────────────────────────────────┘
                    ↓
┌──────────┬──────────┬──────────┬──────────┐
│ Message │  Action  │ Renderer │  Registry │
│ Handlers │ Executor │ Engine  │  System   │
└──────────┴──────────┴──────────┴──────────┘
     ↓           ↓           ↓          ↓
┌──────────┬──────────┬──────────┬──────────┐
│  V8      │Component │   Theme   │ Process   │
│ Runtime  │  Library │  System   │  Executor │
└──────────┴──────────┴──────────┴──────────┘
```

---

## 2. 核心模块设计

### 2.1 DSL 加载器 (loader.go)

**职责**:

- 扫描 `tuis/` 目录
- 解析 `.tui.yao` 配置文件
- 支持 JSON、JSONC、YAML 格式
- 建立 ID 映射和缓存（sync.Map）
- 自动分配组件 ID
- 数据扁平化处理（支持嵌套对象和数组）
- 设置默认绑定

**关键函数**:

```go
func Load(cfg config.Config) error
func Get(id string) *Config
func Set(id string, cfg *Config)
func Reload(id string) error
func List() []string
func Count() int
```

**数据流**:

```
tuis/*.tui.yao → JSON Parser → Config Struct → Flatten Data → Assign IDs → Set Defaults → sync.Map Cache
```

**默认绑定**:

- `q`, `ctrl+c`: 退出
- `tab`: 下一个焦点
- `shift+tab`: 上一个焦点
- `enter`: 提交表单
- `ctrl+r`, `ctrl+l`: 刷新
- `ctrl+z`: 暂停

### 2.2 状态管理 (model.go)

**职责**:

- 实现 `tea.Model` 接口
- 管理响应式状态
- 处理消息循环
- 焦点管理
- 组件实例管理

**核心结构**:

```go
type Model struct {
    Config          *Config
    State           map[string]interface{}
    StateMu         sync.RWMutex  // 并发安全
    Components      map[string]*core.ComponentInstance
    CurrentFocus    string
    Width           int
    Height          int
    Ready           bool
    Program         *tea.Program
    MessageHandlers map[string]core.MessageHandler
    EventBus       *core.EventBus
    Bridge          *Bridge
}
```

**生命周期**:

```
Init() → Update(msg) → View() → [循环]
```

**焦点管理**:

- 焦点组件类型：input, menu, form, table, crud, chat
- 自动聚焦第一个可聚焦组件
- Tab 键循环切换焦点
- Esc 键清除焦点
- 焦点变更发布 `FOCUS_CHANGED` 事件

### 2.3 消息处理系统 (Windows 风格)

TUI 实现了 Windows 风格的三阶段消息分发机制：

**1. 捕获阶段（Capture Phase）**

- 优先级最高：系统级消息拦截
- 全局导航键：`Ctrl+C`、`Ctrl+Z`、窗口大小变化
- 系统快捷键优先处理

**2. 分发阶段（Dispatch Phase）**

- 优先级中：定向到焦点组件
- 键盘事件首先发送到当前焦点组件
- 目标消息（`TargetedMsg`）直接路由到目标组件

**3. 冒泡阶段（Bubble Phase）**

- 优先级最低：全局处理器
- 处理 Action 消息、Process 结果等
- 组件未处理的消息传递到这里

**消息类型**:

```go
// Bubble Tea 内置消息
tea.KeyMsg          // 键盘输入
tea.MouseMsg        // 鼠标事件
tea.WindowSizeMsg   // 窗口大小

// TUI 自定义消息
core.TargetedMsg              // 定向消息
core.ActionMsg                // 内部操作消息
core.ProcessResultMsg        // Process 执行结果
core.StateUpdateMsg          // 单个状态更新
core.StateBatchUpdateMsg     // 批量状态更新
core.InputUpdateMsg          // 输入组件更新
core.StreamChunkMsg          // AI 流式数据块
core.StreamDoneMsg           // 流式完成
core.ErrorMessage            // 错误消息
core.QuitMsg                 // 退出消息
core.RefreshMsg              // 刷新消息
core.FocusFirstComponentMsg  // 自动聚焦第一个组件
core.LogMsg                  // 日志消息
core.MenuActionTriggered     // 菜单动作触发
```

**消息处理流程**:

```
User Input → KeyMsg
                ↓
    [Capture] Ctrl+C? → Quit
                ↓
          [Dispatch] Has Focus? → Send to Focused Component
                ↓
               Component Handle? Handled → Return
                ↓
              Not Handled → [Bubble] Global Handlers
                ↓
           ActionMsg → EventBus.Publish → Components
```

### 2.4 Action 执行器 (action.go)

**职责**:

- 解析 Action 配置
- 执行 Process 或 Script
- 处理异步回调
- 表达式参数求值
- 默认 Process 处理

**内置 Process**:

```go
tui.quit          // 退出应用
tui.focus.next    // 聚焦下一个输入
tui.focus.prev    // 聚焦上一个输入
tui.form.submit   // 提交表单
tui.refresh       // 刷新 UI
tui.clear         // 清除屏幕
tui.suspend       // 暂停应用
```

**执行流程**:

```
Action Config → Parse Args ({{}} 插值)
               ↓
          Evaluate Expressions
               ↓
          Execute Process/Script (async)
               ↓
          Return tea.Msg
               ↓
          Update State (onSuccess/onError)
```

### 2.5 渲染引擎 (render.go)

**职责**:

- 递归渲染 Layout 树
- 应用 Lip Gloss 样式
- 组件实例化和组合
- 表达式求值和替换
- 复杂数据类型处理

**表达式处理**:

```go
// 支持的表达式类型
{{key}}                    // 简单变量
{{len(array)}}             // 内置函数
{{index($, 'key-name')}}  // 安全访问
{{condition ? 'a' : 'b'}}  // 三元运算
{{True(value)}}             // 布尔转换
{{Empty(value)}}            // 空值检查
```

**渲染流程**:

```
Layout Tree → Traverse Children
           ↓
      Component Factory (type → instance)
           ↓
      Apply State Binding ({{path}})
           ↓
      Evaluate Expressions (expr-lang)
           ↓
      Lip Gloss Style
           ↓
      Join Vertical/Horizontal
           ↓
      Return Rendered String
```

**数据扁平化**:

- 使用 `kun/any` 进行数据扁平化
- 支持嵌套对象：`user.profile.name` → `user.profile.name`
- 支持数组索引：`items.0.name` → `index($, 'items.0')`
- 保留原始结构用于复杂访问

### 2.6 V8 集成 (script.go + jsapi.go)

**职责**:

- 加载和编译 TS/JS 脚本
- 注入 TUI 对象到 JS 上下文
- 提供 State 操作 API
- 事件系统集成
- 脚本缓存机制

**脚本加载**:

```go
// 支持的文件扩展
.tui.yao + .ts  // TypeScript（优先）
.tui.yao + .js  // JavaScript
```

**脚本缓存**:

- 使用 `sync.Map` 缓存编译后的脚本
- 避免重复编译
- 支持热重载

**JavaScript API**:

```typescript
interface TUI {
  id: string;
  width: number;
  height: number;

  // 状态管理
  GetState(key?: string): any;
  SetState(key: string, value: any): void;
  UpdateState(updates: object): void;

  // Action 执行
  ExecuteAction(action: Action): void;

  // UI 控制
  Refresh(): void;
  Quit(): void;
  Interrupt(): void;
  Suspend(): void;
  ClearScreen(): void;
  EnterAltScreen(): void;
  ExitAltScreen(): void;
  ShowCursor(): void;
  HideCursor(): void;

  // 焦点管理
  SetFocus(componentID: string): void;
  FocusNextInput(): void;
  SubmitForm(): void;

  // 事件系统
  PublishEvent(componentID: string, action: string, data: any): void;
  SubscribeToEvent(action: string, callback: Function): void;
}

interface Action {
  process?: string;
  script?: string;
  method?: string;
  args?: any[];
  onSuccess?: string;
  onError?: string;
  payload?: object;
}
```

**集成模式**:

```
Go Model → NewContextObject(ctx, model) → v8go.Value
                                         ↓
                                   JS Function Call
                                         ↓
                                   bridge.GetGoObject → Go Model
```

### 2.7 事件总线系统 (core/types.go)

**职责**:

- 提供跨组件通信机制
- 发布/订阅模式
- 事件类型定义
- 解耦组件交互

**事件类型**:

```go
// Form 事件
EventFormSubmitSuccess
EventFormSubmit
EventFormCancel
EventFormValidationError

// Table 事件
EventRowSelected
EventRowDoubleClicked
EventCellEdited

// CRUD 事件
EventNewItemRequested
EventItemDeleted
EventItemSaved

// 导航事件
EventFocusChanged
EventFocusNext
EventFocusPrev
EventTabPressed
EventEscapePressed

// 菜单事件
EventMenuItemSelected
EventMenuActionTriggered
EventMenuNavigate
EventMenuSubmenuEntered
EventMenuSubmenuExited

// Input 事件
EventInputValueChanged
EventInputFocusChanged
EventInputEnterPressed

// Chat 事件
EventChatMessageSent
EventChatMessageReceived
EventChatTypingStarted
EventChatTypingStopped

// Data 事件
EventDataLoaded
EventDataRefreshed
EventDataFiltered

// UI 事件
EventUIResized
EventUIThemeChanged
```

**使用模式**:

```javascript
// 发布事件
tui.PublishEvent('table1', EventRowSelected, { rowIndex: 0 });

// 订阅事件
tui.SubscribeToEvent(EventRowSelected, (msg) => {
  console.log('Row selected:', msg.data.rowIndex);
});
```

---

## 3. 组件系统

### 3.1 组件接口

```go
type ComponentInterface interface {
    Init() tea.Cmd
    UpdateMsg(msg tea.Msg) (ComponentInterface, tea.Cmd, Response)
    View() string
    GetID() string
    SetFocus(focus bool)
}
```

**响应类型**:

```go
Ignored   // 组件不感兴趣，消息应继续传递
Handled   // 组件已处理并截获，消息停止分发
PassClick // 鼠标点击透传
```

### 3.2 核心组件

#### Input 组件 (input.go)

- **功能**: 单行文本输入
- **交互性**: 焦点切换、输入验证
- **事件**: `INPUT_VALUE_CHANGED`、`INPUT_ENTER_PRESSED`、`INPUT_FOCUS_CHANGED`
- **属性**: placeholder, value, prompt, color, background, width, height, disabled

#### Textarea 组件 (textarea.go)

- **功能**: 多行文本输入
- **交互性**: 基础编辑功能
- **属性**: placeholder, value, width, height

#### Table 组件 (table.go)

- **功能**: 数据表格显示和选择
- **交互性**: 焦点、键盘导航、行选择
- **事件**: `ROW_SELECTED`、`ROW_DOUBLE_CLICKED`
- **属性**: columns, data, focused, height, width, showBorder
- **特性**: 列宽配置、自定义样式、分页支持

#### Form 组件 (form.go)

- **功能**: 表单字段集合
- **交互性**: 字段导航、提交/取消
- **事件**: `FORM_SUBMIT`、`FORM_CANCEL`、`FORM_VALIDATION_ERROR`
- **属性**: fields, title, description, submitLabel, cancelLabel
- **字段类型**: input, textarea, checkbox, select, radio

#### Menu 组件 (menu.go)

- **功能**: 交互式菜单（支持子菜单）
- **交互性**: 方向键导航、Enter 选择、子菜单进入/退出
- **事件**: `MENU_ITEM_SELECTED`、`MENU_ACTION_TRIGGERED`、`MENU_SUBMENU_ENTERED`、`MENU_SUBMENU_EXITED`
- **属性**: items, title, width, height, showFilter, showStatusBar
- **特性**: 层级导航、自定义样式、禁用项

#### Chat 组件 (chat.go)

- **功能**: AI 聊天界面
- **交互性**: 消息输入、历史滚动
- **事件**: `CHAT_MESSAGE_SENT`、`CHAT_MESSAGE_RECEIVED`、`CHAT_TYPING_STARTED`、`CHAT_TYPING_STOPPED`
- **属性**: messages, inputPlaceholder, showInput, enableMarkdown, glamourStyle
- **特性**: Glamour Markdown 渲染、用户/助手消息区分、时间戳

### 3.3 工具组件

| 组件       | 描述       | 交互性 |
| ---------- | ---------- | ------ |
| Header     | 标题栏     | 否     |
| Text       | 文本显示   | 否     |
| Footer     | 页脚       | 否     |
| Help       | 帮助信息   | 否     |
| Viewport   | 滚动视图   | 否     |
| List       | 列表显示   | 否     |
| CRUD       | CRUD 操作  | 是     |
| Paginator  | 分页器     | 否     |
| Progress   | 进度条     | 否     |
| Spinner    | 加载动画   | 否     |
| Cursor     | 光标控制   | 否     |
| Key        | 键盘显示   | 否     |
| FilePicker | 文件选择器 | 是     |
| Timer      | 定时器     | 否     |
| Stopwatch  | 秒表       | 否     |

### 3.4 组件注册

```go
var componentRegistry = map[string]ComponentFactory{
    "header": RenderHeader,
    "text":    RenderText,
    "input":   NewInputComponentWrapper,
    "table":   NewTableComponentWrapper,
    "form":    NewFormComponentWrapper,
    "menu":    NewMenuComponentWrapper,
    "chat":    RenderChat,
    // ...
}

func RegisterComponent(name string, factory ComponentFactory) {
    componentRegistry[name] = factory
}
```

---

## 4. 数据流

### 4.1 单向数据流

```
User Input → KeyMsg
                ↓
        Match Bindings
                ↓
        Execute Action
                ↓
        Process/Script Execution
                ↓
        ProcessResultMsg/ActionMsg
                ↓
        Update State (thread-safe)
                ↓
        Trigger Re-render
                ↓
        View() → Terminal Output
```

### 4.2 状态管理

**并发安全**:

```go
// 读操作（多个 goroutine 可并发）
StateMu.RLock()
value := State[key]
StateMu.RUnlock()

// 写操作（独占）
StateMu.Lock()
State[key] = value
StateMu.Unlock()
```

**批量更新**:

```go
// 推荐：一次更新多个状态
model.UpdateState(map[string]interface{}{
    "user": newUser,
    "count": newCount,
    "timestamp": time.Now(),
})
```

---

## 5. 性能优化

### 5.1 脚本预编译

```go
// 应用启动时预编译所有脚本
func PrecompileScripts() error {
    return application.App.Walk("scripts/tui", ...)
}
```

### 5.2 脚本缓存

- 使用 `sync.Map` 缓存编译后的脚本
- 避免重复编译开销
- 支持热重载

### 5.3 渲染优化

- **静态内容缓存**: Header/Footer 等静态部分只渲染一次
- **增量更新**: 仅重绘变化的组件
- **虚拟滚动**: 大数据集只渲染可见区域

### 5.4 表达式求值优化

- 预编译常用表达式
- 缓存求值结果
- 避免重复计算

### 5.5 性能目标

| 操作                 | 目标延迟 |
| -------------------- | -------- |
| ModelUpdate          | < 100ns  |
| RenderLayout (3组件) | < 10µs   |
| StateRead            | < 50ns   |
| StateWrite           | < 100ns  |
| ScriptExecution      | < 1ms    |

---

## 6. 安全设计

### 6.1 并发安全

- 所有 State 访问必须加锁
- 使用 `RWMutex` 支持多读单写
- 防止数据竞争

### 6.2 脚本沙箱

- V8 Isolate 隔离
- 内存限制: 50MB/脚本
- 执行超时: 5 秒
- 禁止文件系统直接访问

### 6.3 输入验证

```go
// 所有来自 Input 组件的数据需要 sanitize
func SanitizeInput(input string) string {
    // 防止注入攻击
}
```

---

## 7. 扩展性

### 7.1 自定义组件

开发者可以注册自定义组件：

```go
func init() {
    tui.RegisterComponent("my-component", NewMyComponent)
}
```

### 7.2 插件机制

```go
type Plugin interface {
    Name() string
    Init(tui *TUI) error
    Hooks() map[string]HookFunc
}
```

### 7.3 样式系统

```go
type lipglossStyleWrapper struct {
    Foreground *string `json:"foreground,omitempty"`
    Background *string `json:"background,omitempty"`
    Bold       *bool   `json:"bold,omitempty"`
    Italic     *bool   `json:"italic,omitempty"`
    Underline  *bool   `json:"underline,omitempty"`
    // ...
}
```

---

## 8. 监控和诊断

### 8.1 性能指标

```go
type Metrics struct {
    TotalRenders      int64
    TotalActions      int64
    TotalErrors       int64
    AvgRenderTime     time.Duration
    ActiveInstances   int64
}
```

### 8.2 健康检查

```go
func HealthCheck() HealthStatus {
    // 检查活跃实例数、错误率等
}
```

### 8.3 调试工具

```bash
# 启用调试日志
export YAO_TUI_DEBUG=true

# 状态快照
tui.DumpState()

# 性能分析
go tool pprof cpu.prof
```

---

## 9. 测试策略

### 9.1 单元测试

- 覆盖率目标: 85%+
- 所有核心模块必须有测试
- 使用 Mock Program 和 Mock Process

### 9.2 集成测试

```go
func TestFullLifecycle(t *testing.T) {
    // 测试从加载到渲染的完整流程
}
```

### 9.3 性能测试

```go
func BenchmarkRenderLayout(b *testing.B) {
    // 基准测试
}
```

### 9.4 并发测试

```bash
go test ./tui/... -race
```

---

## 10. 部署架构

### 10.1 构建流程

```
Go Source → go build (CGO_ENABLED=1)
           ↓
      Embed Resources
           ↓
      Strip & Compress
           ↓
      Multi-platform Binaries
```

### 10.2 运行时要求

- Go >= 1.21
- CGO 支持（V8Go 需要）
- 终端支持 256 色或 TrueColor

---

## 11. 版本规划

### v1.0.0 (生产就绪) - 已发布

- ✅ 核心框架
- ✅ 基础组件（Header, Text, Input, Table, Form, Menu）
- ✅ DSL 加载
- ✅ V8 集成
- ✅ JavaScript API
- ✅ 事件总线系统
- ✅ 智能焦点管理
- ✅ 表达式引擎（expr-lang）
- ✅ 完整测试套件
- ✅ Chat 组件（AI 流式 + Markdown）
- ✅ CRUD 组件
- ✅ 工具组件（List, Progress, Spinner, etc.）

### 未来版本

- 📋 更多组件（Tree, Tabs, Accordion, etc.）
- 🎨 高级样式主题
- 📊 数据可视化组件
- 🔄 更强大的动画系统
- 🌐 远程 TUI 支持
- 🧪 插件生态系统

---

## 12. 参考资料

### 内部参考

- `pipe/pipe.go` - DSL 加载模式
- `sui/core/script.go` - 脚本加载
- `agent/context/jsapi.go` - JavaScript API 模式
- `trace/jsapi/trace.go` - Bridge 注册模式

### 外部参考

- [Bubble Tea 文档](https://github.com/charmbracelet/bubbletea)
- [Lip Gloss 指南](https://github.com/charmbracelet/lipgloss)
- [V8Go API](https://pkg.go.dev/rogchap.com/v8go)
- [expr-lang 文档](https://expr-lang.org/docs/)

---

## 13. 风险和挑战

### 13.1 技术风险

| 风险        | 影响 | 缓解措施         |
| ----------- | ---- | ---------------- |
| V8Go 稳定性 | 高   | 添加错误恢复机制 |
| 终端兼容性  | 中   | 自动降级样式     |
| 性能瓶颈    | 中   | 实施缓存和池化   |

### 13.2 开发挑战

- **并发安全**: 严格使用互斥锁
- **内存管理**: V8 隔离的生命周期管理
- **调试困难**: 提供完善的日志和诊断工具

---

## 附录

### A. DSL 配置示例

```json
{
  "name": "完整示例",
  "data": {
    "title": "Dashboard",
    "users": [
      { "id": 1, "name": "Alice", "email": "alice@example.com" },
      { "id": 2, "name": "Bob", "email": "bob@example.com" }
    ],
    "user.profile.name": "Admin"
  },
  "onLoad": {
    "process": "models.user.Get",
    "args": [{ "limit": 10 }],
    "onSuccess": "users"
  },
  "layout": {
    "direction": "vertical",
    "children": [
      {
        "type": "header",
        "props": { "title": "{{title}}" }
      },
      {
        "type": "table",
        "id": "userTable",
        "bind": "users",
        "props": {
          "columns": [
            { "key": "id", "title": "ID", "width": 8 },
            { "key": "name", "title": "Name", "width": 20 }
          ],
          "focused": true
        }
      },
      {
        "type": "menu",
        "id": "mainMenu",
        "props": {
          "title": "Main Menu",
          "items": [
            {
              "title": "View Users",
              "value": "view",
              "action": { "process": "tui.refresh" }
            },
            {
              "title": "Add User",
              "value": "add",
              "action": { "script": "scripts/tui/user", "method": "add" }
            }
          ]
        }
      }
    ]
  },
  "bindings": {
    "r": { "process": "models.user.Get", "onSuccess": "users" },
    "q": { "process": "tui.quit" },
    "ctrl+c": { "process": "tui.quit" }
  }
}
```

### B. TypeScript 类型定义

```typescript
declare namespace Yao {
  interface Context {
    tui: TUI;
  }

  interface TUI {
    id: string;
    width: number;
    height: number;
    GetState(key?: string): any;
    SetState(key: string, value: any): void;
    UpdateState(updates: Record<string, any>): void;
    ExecuteAction(action: Action): void;
    Refresh(): void;
    Quit(): void;
    Interrupt(): void;
    Suspend(): void;
    ClearScreen(): void;
    EnterAltScreen(): void;
    ExitAltScreen(): void;
    ShowCursor(): void;
    HideCursor(): void;
    FocusNextInput(): void;
    SubmitForm(): void;
    PublishEvent(componentID: string, action: string, data: any): void;
    SubscribeToEvent(action: string, callback: Function): void;
    SetFocus(componentID: string): void;
  }

  interface Action {
    process?: string;
    script?: string;
    method?: string;
    args?: any[];
    onSuccess?: string;
    onError?: string;
    payload?: Record<string, any>;
  }

  interface ComponentProps {
    id?: string;
    type: string;
    bind?: string;
    props?: Record<string, any>;
    actions?: Record<string, Action>;
    height?: number | 'flex';
    width?: number | 'flex';
  }

  interface Layout {
    direction: 'vertical' | 'horizontal';
    children?: ComponentProps[];
    style?: string;
    padding?: number[];
  }

  interface TuiConfig {
    name: string;
    id?: string;
    data?: Record<string, any>;
    onLoad?: Action;
    layout?: Layout;
    bindings?: Record<string, Action>;
  }
}
```

---

**文档版本**: v1.0.0  
**最后更新**: 2026-01-18  
**维护者**: Yao TUI Team
