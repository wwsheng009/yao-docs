# TUI 统一状态管理 - 架构说明

## 概述

为了确保 TUI 状态管理的一致性，我们引入了统一的状态管理系统。所有外部数据（命令行参数、配置文件、默认值）都通过单一的入口点进行合并和展平。

## 问题背景

之前的状态管理存在多个入口点直接修改 state：

1. **配置文件加载** (`loader.go`): 使用 `any.Of().Map().MapStrAny.Dot()` 展平数据
2. **命令行参数** (`cmd/tui/tui.go`): 直接合并到 `cfg.Data`
3. **TUI list 功能** (`cmd/tui/list.go`): 直接设置 `cfg.Data` 中的字段
4. **Model 创建** (`model.go`): 直接将 `cfg.Data` 复制到 `model.State`

这种分散的状态管理方式导致：

- 数据展平不一致
- 数据优先级混乱
- 难以追踪状态变更来源
- 维护困难

## 统一状态管理架构

### 核心组件

**文件**: `tui/state_manager.go`

提供以下核心功能：

1. **`FlattenData`**: 展平嵌套数据结构
2. **`MergeData`**: 合并数据（可配置优先级）
3. **`PrepareInitialState`**: 唯一的状态准备入口点
4. **`ValidateAndFlattenExternal`**: 验证并展平外部数据
5. **`LoadTUIDefaults`**: 加载 TUI 默认值
6. **`ApplyOnLoadResult`**: 应用 OnLoad 结果到状态

### 数据流（优先级从高到低）

```
┌─────────────────────────────────────────────┐
│          数据源（按优先级排序）               │
├─────────────────────────────────────────────┤
│ 1. 命令行外部参数 (::{"key":"value"})     │
│ 2. 静态配置 (config.Data)                   │
│ 3. TUI 默认值 (data/tui/*.json)            │
└─────────────────────────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │ PrepareInitialState │  ← 唯一入口点
        │  - 合并所有数据源    │
        │  - 展平嵌套结构      │
        └──────────────────────┘
                   ↓
        ┌──────────────────────┐
        │   cfg.Data (展平后)   │
        └──────────────────────┘
                   ↓
        ┌──────────────────────┐
        │   NewModel(cfg)      │
        └──────────────────────┘
                   ↓
        ┌──────────────────────┐
        │  model.State         │
        └──────────────────────┘
```

## 函数说明

### 1. `FlattenData`

展平嵌套数据结构，支持点号访问。

```go
func FlattenData(data map[string]interface{}) map[string]interface{}
```

**示例**：

```go
nested := map[string]interface{}{
    "user": map[string]interface{}{
        "name": "John",
        "age": 30,
    },
}

flattened := FlattenData(nested)
// 结果：
// {
//     "user": map[...],  ← 原结构保留
//     "user.name": "John",
//     "user.age": 30
// }
```

### 2. `MergeData`

合并两个数据映射，可配置优先级。

```go
func MergeData(existing, external map[string]interface{}, priorityHigher bool) map[string]interface{}
```

**参数**：

- `existing`: 目标数据（被修改）
- `external`: 源数据
- `priorityHigher`: 为 true 时，`external` 覆盖 `existing` 的相同键

**示例**：

```go
existing := map[string]interface{}{"key1": "old", "key2": "keep"}
external := map[string]interface{}{"key1": "new", "key3": "add"}

// 外部数据优先
result := MergeData(existing, external, true)
// 结果：{key1: "new", key2: "keep", key3: "add"}

// 内部数据优先
result := MergeData(existing, external, false)
// 结果：{key1: "old", key2: "keep", key3: "add"}
```

### 3. `PrepareInitialState`

**唯一的状态准备入口点**。将所有数据源合并并展平。

```go
func PrepareInitialState(cfg *Config, externalData map[string]interface{}) map[string]interface{}
```

**数据优先级**：

1. 外部参数（`externalData`）- **最高优先级**
2. 静态配置（`cfg.Data`）
3. TUI 默认值（从 `data/tui/*.json` 加载）

**示例**：

```go
// 在 cmd/tui/tui.go 中使用
externalData := parseExternalData(args)  // 解析命令行参数
defaults := LoadTUIDefaults(tuiID)      // 加载默认值

// 合并默认值到配置（外部数据会覆盖默认值）
cfg.Data = MergeData(cfg.Data, defaults, false)

// 准备初始状态（唯一入口点）
PrepareInitialState(cfg, externalData)

// 创建模型
model := NewModel(cfg, nil)
```

### 4. `ValidateAndFlattenExternal`

验证并展平外部数据，确保与内部数据格式一致。

```go
func ValidateAndFlattenExternal(externalData map[string]interface{}) (map[string]interface{}, error)
```

**使用场景**：

```go
externalData := map[string]interface{}{
    "user": map[string]interface{}{"name": "John"},
}

validated, err := ValidateAndFlattenExternal(externalData)
// validated 包含：
// {
//     "user": map[...],
//     "user.name": "John"
// }
```

### 5. `LoadTUIDefaults`

从文件加载 TUI 默认值。

```go
func LoadTUIDefaults(tuiID string) map[string]interface{}
```

**默认值文件位置**：`data/tui/<tuiID>.json`

**示例**：

```json
// data/tui/myapp.json
{
  "title": "Default Title",
  "theme": "light",
  "itemPerPage": 10
}
```

```go
defaults := LoadTUIDefaults("myapp")
// defaults = {title: "Default Title", theme: "light", itemPerPage: 10}
```

### 6. `ApplyOnLoadResult`

应用 OnLoad 过程/脚本结果到状态。

```go
func ApplyOnLoadResult(model *Model, result interface{}, onSuccess string)
```

**参数**：

- `model`: TUI 模型
- `result`: OnLoad 执行结果
- `onSuccess`: 指定存储的 state 键（可选）

**示例**：

```go
// 存储到指定键
ApplyOnLoadResult(model, result, "loadedData")
// model.State["loadedData"] = result

// 合并 map 到状态
ApplyOnLoadResult(model, map[string]interface{}{"key": "value"}, "")
// model.State["key"] = "value"

// 存储到默认键
ApplyOnLoadResult(model, "string result", "")
// model.State["__onLoadResult"] = "string result"
```

## 使用示例

### 命令行参数传递

**修改前**（分散）：

```go
// cmd/tui/tui.go
var externalData map[string]interface{}
// ... 解析参数 ...

// 直接修改 cfg.Data ❌
for k, v := range externalData {
    cfg.Data[k] = v  // 没有展平！
}

model := NewModel(cfg, nil)
```

**修改后**（统一）：

```go
// cmd/tui/tui.go
var externalData map[string]interface{}
// ... 解析参数 ...

// 验证和展平外部数据 ✅
validated, err := tui.ValidateAndFlattenExternal(externalData)
if err != nil {
    return err
}

// 准备初始状态（唯一入口点）✅
tui.PrepareInitialState(cfg, validated)

model := NewModel(cfg, nil)
```

### TUI List 功能

**修改前**（分散）：

```go
// cmd/tui/list.go
// 直接修改 cfg.Data ❌
if cfg.Data == nil {
    cfg.Data = make(map[string]interface{})
}
cfg.Data["items"] = tuiNames(tuiItems)
cfg.Data["tuiItems"] = tuiItems
// ... 没有展平！

model := tui.NewModel(cfg, nil)
```

**修改后**（统一）：

```go
// cmd/tui/list.go
// 准备数据 ✅
externalData := prepareTUIListData(tuiIDs)

// 准备初始状态（唯一入口点）✅
tui.PrepareInitialState(cfg, externalData)

model := tui.NewModel(cfg, nil)
```

### 配置文件加载

**修改前**（分散）：

```go
// tui/loader.go
// 原地展平 ❌
if cfg.Data != nil {
    wrappedRes := any.Of(cfg.Data)
    flattened := wrappedRes.Map().MapStrAny.Dot()
    for k, v := range flattened {
        cfg.Data[k] = v
    }
}
```

**修改后**（统一）：

```go
// tui/loader.go
// 使用统一的展平函数 ✅
if cfg.Data != nil {
    cfg.Data = FlattenData(cfg.Data)
}
```

## 数据访问方式

由于数据被展平，你可以在 TUI 中使用两种方式访问数据：

### 方式 1：点号访问（推荐）

```yaml
# tuis/myapp.tui.yao
{ 'data': { 'user': { 'name': 'John', 'age': 30 } } }
```

访问：

```yaml
props:
  content: '{{user.name}} is {{user.age}} years old'
```

### 方式 2：嵌套访问（仍然可用）

```yaml
props:
  content: 'User: {{user.name}}'
```

## 测试

完整的测试覆盖：`tui/state_manager_test.go`

- `TestFlattenData` - 测试数据展平
- `TestMergeData` - 测试数据合并
- `TestValidateAndFlattenExternal` - 测试外部数据验证
- `TestPrepareInitialState` - 测试状态准备
- `TestApplyOnLoadResult` - 测试 OnLoad 结果应用

```bash
go test ./tui -run TestFlattenData
go test ./tui -run TestMergeData
go test ./tui -run TestPrepareInitialState
```

## 最佳实践

### 1. 始终使用 PrepareInitialState

对于所有 TUI，在创建 Model 之前调用 `PrepareInitialState`：

```go
✅ 正确：
 PrepareInitialState(cfg, externalData)
 model := NewModel(cfg, nil)

❌ 错误：
 PrepareInitialState(cfg, externalData)
 // 后续又修改 cfg.Data
 cfg.Data["extra"] = "value"
 model := NewModel(cfg, nil)
```

### 2. 只通过消息机制更新运行时状态

```go
✅ 正确：
 model.SetState("key", "value")
 model.UpdateState(map[string]interface{}{"key": "value"})

❌ 错误：
 model.State["key"] = "value"  // 直接修改，不线程安全
```

### 3. 使用 ApplyOnLoadResult 处理异步数据

```go
✅ 正确：
 func (m *Model) executeAction(action *core.Action) tea.Cmd {
     result, _ := process.Exec(...)
     ApplyOnLoadResult(m, result, action.OnSuccess)
 }

❌ 错误：
 func (m *Model) executeAction(action *core.Action) tea.Cmd {
     result, _ := process.Exec(...)
     m.State["data"] = result  // 直接修改
 }
```

### 4. 使用 FlattenData 处理嵌套数据

```go
nestedData := map[string]interface{}{
    "config": map[string]interface{}{
        "theme": "dark",
        "font": "12pt",
    },
}

// 处理前可能需要访问：nestedData["config"].(map[string]interface{})["theme"]
flattened := FlattenData(nestedData)
// 处理后可以直接访问：flattened["config.theme"]
```

## 总结

统一状态管理提供了：

1. **单一入口点**：`PrepareInitialState` 是唯一的状态准备入口
2. **数据展平一致性**：所有数据源都使用 `FlattenData` 展平
3. **清晰的优先级**：外部参数 > 配置文件 > 默认值
4. **线程安全**：运行时更新通过消息机制
5. **易于维护**：所有状态变更都有明确的入口点

这确保了 TUI 状态管理的一致性、可预测性和可维护性。
